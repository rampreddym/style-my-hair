import SwiftUI
import StripePaymentSheet

@main
struct MirraApp: App {
    @State private var auth = AuthService()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(auth)
                .preferredColorScheme(.dark)
                .tint(Theme.cream)
                .onOpenURL { url in
                    _ = StripeAPI.handleURLCallback(with: url)
                }
        }
    }
}

struct RootView: View {
    @Environment(AuthService.self) private var auth
    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            switch auth.state {
            case .loading: ProgressView().tint(Theme.cream)
            case .signedOut: AuthView()
            case .needsRole: RolePickerView()
            case .signedIn(.stylist): StylistTabs()
            case .signedIn: CustomerTabs()
            }
        }
        .animation(.easeInOut, value: auth.state)
    }
}

struct CustomerTabs: View {
    var body: some View {
        TabView {
            CustomerHomeView().tabItem { Label("Home", systemImage: "house") }
            StyleStudioView().tabItem { Label("Try on", systemImage: "sparkles") }
            DiscoverView().tabItem { Label("Book", systemImage: "scissors") }
            CustomerAppointmentsView().tabItem { Label("Visits", systemImage: "calendar") }
            CustomerProfileView().tabItem { Label("Me", systemImage: "person.crop.circle") }
        }
    }
}

struct StylistTabs: View {
    var body: some View {
        TabView {
            StylistAppointmentsView().tabItem { Label("Today", systemImage: "calendar") }
            StylistServicesView().tabItem { Label("Services", systemImage: "list.bullet.rectangle") }
            StylistProfileView().tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
    }
}
