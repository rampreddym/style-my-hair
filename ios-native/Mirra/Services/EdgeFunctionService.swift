import Foundation
import Supabase

/// All server functions are invoked by name — never by URL.
struct EdgeFunctionService {
    struct GenerateRequest: Encodable { let stylePrompt: String; let userPhotoUrls: [String]; let selectedPhotoUrl: String }
    struct GenerateResponse: Decodable { let variations: [String]?; let error: String? }

    func generateHairstyle(prompt: String, photoUrls: [String], selected: String) async throws -> [String] {
        let res: GenerateResponse = try await supa.functions.invoke("generate-hairstyle",
            options: .init(body: GenerateRequest(stylePrompt: prompt, userPhotoUrls: photoUrls, selectedPhotoUrl: selected)))
        if let e = res.error { throw RepoError.server(e) }
        return res.variations ?? []
    }

    struct PaymentRequest: Encodable { let appointmentId: UUID; let amount: Double; let tip: Double; let serviceName: String; let stylistName: String }
    struct IntentResponse: Decodable { let clientSecret: String?; let paymentIntentId: String?; let error: String? }
    struct KeyResponse: Decodable { let publishableKey: String? }

    func stripeKey() async throws -> String {
        let r: KeyResponse = try await supa.functions.invoke("get-stripe-key")
        guard let k = r.publishableKey else { throw RepoError.server("Payments are unavailable right now.") }
        return k
    }

    func createPaymentIntent(_ req: PaymentRequest) async throws -> IntentResponse {
        let r: IntentResponse = try await supa.functions.invoke("create-payment-intent", options: .init(body: req))
        if let e = r.error { throw RepoError.server(e) }
        return r
    }

    func confirmPayment(appointmentId: UUID, paymentIntentId: String) async throws {
        struct Body: Encodable { let appointmentId: UUID; let paymentIntentId: String }
        try await supa.functions.invoke("confirm-payment",
            options: .init(body: Body(appointmentId: appointmentId, paymentIntentId: paymentIntentId)))
    }

    func sendBookingSMS(appointmentId: UUID) async {
        struct Body: Encodable { let appointmentId: UUID }
        try? await supa.functions.invoke("send-booking-sms", options: .init(body: Body(appointmentId: appointmentId)))
    }
}
