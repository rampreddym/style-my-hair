import Foundation
import SwiftUI

@MainActor @Observable
final class CustomerSession {
    var customer: Customer?
    var photos: [CustomerPhoto] = []
    var styles: [GeneratedStyle] = []
    var appointments: [Appointment] = []
    var error: String?

    private let customers = CustomerRepository()
    private let appts = AppointmentRepository()

    func load(userId: UUID?) async {
        guard let userId else { return }
        do {
            let c = try await customers.current(userId: userId)
            customer = c
            async let p = customers.photos(customerId: c.id)
            async let s = customers.styles(customerId: c.id)
            async let a = appts.forCustomer(c.id)
            (photos, styles, appointments) = try await (p, s, a)
        } catch { self.error = error.localizedDescription }
    }

    var nextAppointment: Appointment? { appointments.filter(\.isUpcoming).min { $0.appointmentDate < $1.appointmentDate } }
    func photo(for angle: HeadAngle) -> CustomerPhoto? { photos.first { $0.photoType == angle.rawValue } }
}

@MainActor @Observable
final class StyleStudioVM {
    var prompt = ""
    var selectedAngle: HeadAngle = .front
    var generating = false
    var results: [String] = []
    var error: String?

    static let presets = ["Bob cut, dark brown", "Long layers, honey balayage", "Pixie cut", "Curtain bangs",
                          "Textured crop", "Low taper fade", "Soft curls, caramel", "Shag, copper"]

    func generate(session: CustomerSession) async {
        guard let customer = session.customer else { return }
        guard let selected = session.photo(for: selectedAngle) ?? session.photos.first else {
            error = "Add your photos first so the AI can see you."; return
        }
        generating = true; error = nil; defer { generating = false }
        do {
            let images = try await EdgeFunctionService().generateHairstyle(
                prompt: prompt, photoUrls: session.photos.map(\.photoUrl), selected: selected.photoUrl)
            results = images
            for url in images {
                try await supa.from("customer_generated_styles").insert([
                    "customer_id": customer.id.uuidString, "style_prompt": prompt, "generated_image_url": url
                ]).execute()
            }
            session.styles = try await CustomerRepository().styles(customerId: customer.id)
        } catch { self.error = error.localizedDescription }
    }
}
