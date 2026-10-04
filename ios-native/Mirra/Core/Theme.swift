import SwiftUI

/// Mirra Studio Noir: dark chocolate surfaces, cream actions, warm taupe accents.
enum Theme {
    static let background = Color(hue: 20/360, saturation: 0.30, brightness: 0.09)
    static let card       = Color(hue: 20/360, saturation: 0.25, brightness: 0.14)
    static let cream      = Color(hue: 38/360, saturation: 0.22, brightness: 0.95)
    static let taupe      = Color(hue: 28/360, saturation: 0.22, brightness: 0.62)
    static let muted      = Color(hue: 28/360, saturation: 0.10, brightness: 0.55)
    static let danger     = Color(hue: 4/360, saturation: 0.65, brightness: 0.80)

    static func display(_ size: CGFloat) -> Font { .custom("DMSerifDisplay-Regular", size: size, relativeTo: .title) }
    static func body(_ size: CGFloat = 16, weight: Font.Weight = .regular) -> Font { .system(size: size, weight: weight) }
}

struct PrimaryButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Theme.body(16, weight: .semibold))
            .frame(maxWidth: .infinity, minHeight: 50)
            .background(Theme.cream.opacity(configuration.isPressed ? 0.8 : 1))
            .foregroundStyle(Theme.background)
            .clipShape(Capsule())
    }
}

struct SecondaryButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Theme.body(16, weight: .medium))
            .frame(maxWidth: .infinity, minHeight: 50)
            .overlay(Capsule().stroke(Theme.taupe.opacity(0.5)))
            .foregroundStyle(Theme.cream)
            .opacity(configuration.isPressed ? 0.7 : 1)
    }
}

struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content.padding(16)
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Theme.taupe.opacity(0.15)))
    }
}
extension View { func card() -> some View { modifier(CardModifier()) } }

struct ScreenHeader: View {
    let title: String; var subtitle: String? = nil
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(Theme.display(32)).foregroundStyle(Theme.cream)
            if let subtitle { Text(subtitle).font(Theme.body(15)).foregroundStyle(Theme.muted) }
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct EmptyState: View {
    let icon: String; let title: String; let message: String
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon).font(.system(size: 34)).foregroundStyle(Theme.taupe)
            Text(title).font(Theme.display(22)).foregroundStyle(Theme.cream)
            Text(message).font(Theme.body(14)).foregroundStyle(Theme.muted).multilineTextAlignment(.center)
        }.padding(32).frame(maxWidth: .infinity)
    }
}
