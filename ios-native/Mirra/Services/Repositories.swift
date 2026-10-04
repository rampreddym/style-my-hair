import Foundation
import Supabase

enum RepoError: LocalizedError {
    case missingProfile, server(String)
    var errorDescription: String? {
        switch self {
        case .missingProfile: "We couldn't find your profile. Please sign out and back in."
        case .server(let m): m
        }
    }
}

struct CustomerRepository {
    func current(userId: UUID) async throws -> Customer {
        let rows: [Customer] = try await supa.from("customers").select()
            .eq("user_id", value: userId).limit(1).execute().value
        guard let c = rows.first else { throw RepoError.missingProfile }
        return c
    }
    func update(_ c: Customer) async throws {
        try await supa.from("customers").update([
            "name": AnyJSON.string(c.name),
            "phone": c.phone.map(AnyJSON.string) ?? .null,
            "preferred_style_description": c.preferredStyleDescription.map(AnyJSON.string) ?? .null,
            "share_ai_styles_with_stylist": .bool(c.shareAiStylesWithStylist ?? false),
        ]).eq("id", value: c.id).execute()
    }
    func photos(customerId: UUID) async throws -> [CustomerPhoto] {
        try await supa.from("customer_photos").select().eq("customer_id", value: customerId).execute().value
    }
    func styles(customerId: UUID) async throws -> [GeneratedStyle] {
        try await supa.from("customer_generated_styles").select()
            .eq("customer_id", value: customerId).order("created_at", ascending: false).execute().value
    }
}

struct StorageService {
    /// Path convention: {user_id}/{category}/{timestamp}-{type}.jpg
    func uploadPhoto(_ data: Data, userId: UUID, category: String, type: String) async throws -> String {
        let path = "\(userId.uuidString.lowercased())/\(category)/\(Int(Date().timeIntervalSince1970 * 1000))-\(type).jpg"
        try await supa.storage.from(AppConfig.photoBucket)
            .upload(path, data: data, options: FileOptions(contentType: "image/jpeg", upsert: true))
        return try supa.storage.from(AppConfig.photoBucket).getPublicURL(path: path).absoluteString
    }

    func savePhoto(_ data: Data, userId: UUID, customerId: UUID, angle: HeadAngle) async throws {
        let url = try await uploadPhoto(data, userId: userId, category: "profile-photos", type: angle.rawValue)
        try await supa.from("customer_photos").delete()
            .eq("customer_id", value: customerId).eq("photo_type", value: angle.rawValue).execute()
        try await supa.from("customer_photos").insert([
            "customer_id": customerId.uuidString, "photo_type": angle.rawValue, "photo_url": url
        ]).execute()
    }
}

struct StylistRepository {
    func all() async throws -> [Stylist] {
        try await supa.from("stylists_public").select(Stylist.columns)
            .order("rating", ascending: false).execute().value
    }
    func mine(userId: UUID) async throws -> Stylist {
        let rows: [Stylist] = try await supa.from("stylists").select(Stylist.columns)
            .eq("user_id", value: userId).limit(1).execute().value
        guard let s = rows.first else { throw RepoError.missingProfile }
        return s
    }
    func updateProfile(_ s: Stylist) async throws {
        try await supa.from("stylists").update([
            "name": AnyJSON.string(s.name),
            "business_name": s.businessName.map(AnyJSON.string) ?? .null,
            "bio": s.bio.map(AnyJSON.string) ?? .null,
            "address": s.address.map(AnyJSON.string) ?? .null,
        ]).eq("id", value: s.id).execute()
    }
    func services(stylistId: UUID) async throws -> [StylistService] {
        try await supa.from("stylist_services").select().eq("stylist_id", value: stylistId)
            .order("price").execute().value
    }
    func saveService(_ s: StylistService, isNew: Bool) async throws {
        let body: [String: AnyJSON] = [
            "stylist_id": .string(s.stylistId.uuidString), "name": .string(s.name),
            "description": s.description.map(AnyJSON.string) ?? .null,
            "price": .double(s.price), "duration_minutes": .integer(s.durationMinutes)
        ]
        if isNew { try await supa.from("stylist_services").insert(body).execute() }
        else { try await supa.from("stylist_services").update(body).eq("id", value: s.id).execute() }
    }
    func deleteService(_ id: UUID) async throws {
        try await supa.from("stylist_services").delete().eq("id", value: id).execute()
    }
}

struct AppointmentRepository {
    private let select = "*, stylists:stylists_public(name,photo_url), stylist_services(name,duration_minutes), customers(name,phone)"

    func forCustomer(_ id: UUID) async throws -> [Appointment] {
        try await supa.from("appointments").select(select).eq("customer_id", value: id)
            .order("appointment_date", ascending: false).execute().value
    }
    func forStylist(_ id: UUID) async throws -> [Appointment] {
        try await supa.from("appointments").select(select).eq("stylist_id", value: id)
            .order("appointment_date").execute().value
    }
    func bookedTimes(stylistId: UUID, on day: Date) async throws -> [Appointment] {
        let start = Calendar.current.startOfDay(for: day)
        let end = Calendar.current.date(byAdding: .day, value: 1, to: start)!
        return try await supa.from("appointments").select(select).eq("stylist_id", value: stylistId)
            .gte("appointment_date", value: start.ISO8601Format()).lt("appointment_date", value: end.ISO8601Format())
            .neq("status", value: "cancelled").execute().value
    }
    func create(_ a: NewAppointment) async throws -> UUID {
        struct IdRow: Decodable { let id: UUID }
        let row: IdRow = try await supa.from("appointments").insert(a).select("id").single().execute().value
        return row.id
    }
    func setStatus(_ id: UUID, _ status: String) async throws {
        try await supa.from("appointments").update(["status": status]).eq("id", value: id).execute()
    }
}
