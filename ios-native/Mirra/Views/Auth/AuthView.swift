import SwiftUI
import AuthenticationServices

struct AuthView: View {
    @Environment(AuthService.self) private var auth
    @State private var isSignUp = false
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var role: AppRole = .customer
    @State private var busy = false
    @State private var message: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 22) {
                VStack(spacing: 8) {
                    Text("M").font(Theme.display(64)).foregroundStyle(Theme.cream)
                    Text("Mirra").font(Theme.display(36)).foregroundStyle(Theme.cream)
                    Text("See your next look before you sit in the chair.")
                        .font(Theme.body(15)).foregroundStyle(Theme.muted).multilineTextAlignment(.center)
                }.padding(.top, 40)

                SignInWithAppleButton(.continue) { auth.prepareApple($0) } onCompletion: { result in
                    Task { do { try await auth.completeApple(result) } catch { message = error.localizedDescription } }
                }
                .signInWithAppleButtonStyle(.white).frame(height: 50).clipShape(Capsule())

                HStack { line; Text("or").font(Theme.body(13)).foregroundStyle(Theme.muted); line }

                VStack(spacing: 12) {
                    if isSignUp {
                        Picker("I am a", selection: $role) {
                            Text("Customer").tag(AppRole.customer)
                            Text("Stylist").tag(AppRole.stylist)
                        }.pickerStyle(.segmented)
                        field("Your name", text: $name)
                    }
                    field("Email", text: $email).textContentType(.emailAddress).keyboardType(.emailAddress)
                    SecureField("Password", text: $password)
                        .textContentType(isSignUp ? .newPassword : .password).modifier(FieldStyle())
                }

                if let message { Text(message).font(Theme.body(14)).foregroundStyle(Theme.taupe).multilineTextAlignment(.center) }

                Button { Task { await submit() } } label: {
                    if busy { ProgressView().tint(Theme.background) } else { Text(isSignUp ? "Create account" : "Sign in") }
                }.buttonStyle(PrimaryButton()).disabled(busy || email.isEmpty || password.count < 6)

                HStack {
                    Button(isSignUp ? "I have an account" : "Create an account") { isSignUp.toggle(); message = nil }
                    Spacer()
                    if !isSignUp { Button("Forgot password?") { Task { await reset() } } }
                }.font(Theme.body(14)).foregroundStyle(Theme.cream)
            }.padding(24)
        }
    }

    private var line: some View { Rectangle().fill(Theme.taupe.opacity(0.3)).frame(height: 1) }
    private func field(_ p: String, text: Binding<String>) -> some View {
        TextField(p, text: text).textInputAutocapitalization(.never).autocorrectionDisabled().modifier(FieldStyle())
    }

    private func submit() async {
        busy = true; defer { busy = false }; message = nil
        do {
            if isSignUp {
                try await auth.signUp(email: email, password: password, name: name, role: role)
                if case .signedOut = auth.state { message = "Check your email to confirm your account, then sign in." }
            } else { try await auth.signIn(email: email, password: password) }
        } catch { message = friendly(error) }
    }

    private func reset() async {
        guard !email.isEmpty else { message = "Enter your email first."; return }
        do { try await auth.resetPassword(email: email); message = "We sent a reset link to \(email)." }
        catch { message = friendly(error) }
    }

    private func friendly(_ e: Error) -> String {
        let t = e.localizedDescription.lowercased()
        if t.contains("invalid login") { return "That email and password don't match." }
        if t.contains("rate") { return "Too many attempts. Wait a minute and try again." }
        if t.contains("already registered") { return "That email already has an account. Try signing in." }
        return e.localizedDescription
    }
}

struct FieldStyle: ViewModifier {
    func body(content: Content) -> some View {
        content.padding(.horizontal, 16).frame(minHeight: 50)
            .background(Theme.card).clipShape(RoundedRectangle(cornerRadius: 14))
            .foregroundStyle(Theme.cream)
    }
}

struct RolePickerView: View {
    @Environment(AuthService.self) private var auth
    @State private var error: String?
    var body: some View {
        VStack(spacing: 18) {
            ScreenHeader(title: "Welcome to Mirra", subtitle: "How will you use the app?")
            Button("I'm looking for a stylist") { pick(.customer) }.buttonStyle(PrimaryButton())
            Button("I'm a stylist") { pick(.stylist) }.buttonStyle(SecondaryButton())
            if let error { Text(error).foregroundStyle(Theme.danger) }
            Button("Sign out") { Task { await auth.signOut() } }.foregroundStyle(Theme.muted)
        }.padding(24)
    }
    private func pick(_ r: AppRole) {
        Task { do { try await auth.chooseRole(r) } catch { self.error = error.localizedDescription } }
    }
}
