import SwiftUI

/// Drag left/right to compare the original photo with the AI preview.
struct BeforeAfterSlider: View {
    let before: URL?
    let after: URL?
    @State private var position: CGFloat = 0.5

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RemoteImage(url: after)
                RemoteImage(url: before)
                    .mask(alignment: .leading) { Rectangle().frame(width: geo.size.width * position) }
                Rectangle().fill(Theme.cream).frame(width: 2)
                    .offset(x: geo.size.width * position - 1)
                Circle().fill(Theme.cream).frame(width: 36, height: 36)
                    .overlay(Image(systemName: "arrow.left.and.right").foregroundStyle(Theme.background))
                    .offset(x: geo.size.width * position - 18)
                VStack { Spacer(); HStack { tag("Before"); Spacer(); tag("After") }.padding(10) }
            }
            .contentShape(Rectangle())
            .gesture(DragGesture(minimumDistance: 0).onChanged { v in
                position = min(max(v.location.x / geo.size.width, 0), 1)
            })
            .accessibilityElement()
            .accessibilityLabel("Before and after comparison")
            .accessibilityAdjustableAction { dir in
                position = min(max(position + (dir == .increment ? 0.1 : -0.1), 0), 1)
            }
        }
        .aspectRatio(3/4, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    private func tag(_ t: String) -> some View {
        Text(t).font(Theme.body(12, weight: .semibold)).padding(.horizontal, 10).padding(.vertical, 5)
            .background(.ultraThinMaterial, in: Capsule())
    }
}

struct RemoteImage: View {
    let url: URL?
    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .success(let img): img.resizable().scaledToFill()
            case .failure: Theme.card.overlay(Image(systemName: "photo").foregroundStyle(Theme.muted))
            default: Theme.card.overlay(ProgressView().tint(Theme.cream))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity).clipped()
    }
}
