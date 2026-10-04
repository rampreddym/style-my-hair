import Foundation
import Supabase
import AuthenticationServices
import CryptoKit

@MainActor @Observable
final class AuthService {
    enum State: Equatable { case loading, signedOut, needsRole, signedIn(AppRole) }

    var state: State = .loading
    var userId: UUID?
    var email: String?
    private var currentNonce: String?

    init() { Task { await listen() } }

    private func listen() async {
        for await (event, session) in supa.auth.authStateChanges {
            guard [.initialSession, .signedIn, .signedOut, .tokenRefreshed].contains(event) else { continue }
            if let session {
                userId = session.user.id
                email = session.user.email
                await resolveRole()
            } else {
                userId = nil; state = .signedOut
            }
        }
    }

    func resolveRole() async {
        guard let userId else { state = .signedOut; return }
        let rows: [UserRoleRow] = (try? await supa.from("user_roles")
            .select("role").eq("user_id", value: userId).execute().value) ?? []
        if rows.contains(where: { $0.role == .stylist }) { state = .signedIn(.stylist) }
        else if rows.contains(where: { $0.role == .customer }) { state = .signedIn(.customer) }
        else { state = .needsRole }
    }

    func signIn(email: String, password: String) async throws {
        try await supa.auth.signIn(email: email, password: password)
    }

    func signUp(email: String, password: String, name: String, role: AppRole) async throws {
        let res = try await supa.auth.signUp(email: email, password: password, data: ["name": .string(name)])
        if res.session != nil { try await chooseRole(role, name: name) }
    }

    func chooseRole(_ role: AppRole, name: String? = nil) async throws {
        guard let userId else { return }
        try await supa.from("user_roles").insert(["user_id": userId.uuidString, "role": role.rawValue]).execute()
        let displayName = name ?? email?.components(separatedBy: "@").first ?? "Guest"
        if role == .customer {
            try? await supa.from("customers").insert([
                "user_id": userId.uuidString, "name": displayName, "email": email ?? "", "gender": "unspecified"
            ]).execute()
        } else {
            try? await supa.from("stylists").insert([
                "user_id": userId.uuidString, "name": displayName, "email": email ?? ""
            ]).select("id").execute()
        }
        state = .signedIn(role)
    }

    func resetPassword(email: String) async throws {
        try await supa.auth.resetPasswordForEmail(email, redirectTo: URL(string: "https://mirra-hair.lovable.app/reset-password"))
    }

    func signOut() async { try? await supa.auth.signOut() }

    // MARK: Sign in with Apple (native sheet, no browser)
    func prepareApple(_ request: ASAuthorizationAppleIDRequest) {
        let nonce = Self.randomNonce()
        currentNonce = nonce
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(nonce)
    }

    func completeApple(_ result: Result<ASAuthorization, Error>) async throws {
        let auth = try result.get()
        guard let cred = auth.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = cred.identityToken, let idToken = String(data: tokenData, encoding: .utf8),
              let nonce = currentNonce else { throw URLError(.userAuthenticationRequired) }
        try await supa.auth.signInWithIdToken(credentials: .init(provider: .apple, idToken: idToken, nonce: nonce))
    }

    private static func randomNonce(length: Int = 32) -> String {
        let chars = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        return String((0..<length).map { _ in chars.randomElement()! })
    }
    private static func sha256(_ s: String) -> String {
        SHA256.hash(data: Data(s.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}
