import Foundation

enum AppRole: String, Codable, Sendable { case customer, stylist, admin }

struct UserRoleRow: Codable, Sendable { let role: AppRole }

struct Customer: Codable, Identifiable, Sendable {
    let id: UUID
    var name: String
    var email: String
    var gender: String
    var phone: String?
    var age: Int?
    var preferredStyleDescription: String?
    var shareAiStylesWithStylist: Bool?
    enum CodingKeys: String, CodingKey {
        case id, name, email, gender, phone, age
        case preferredStyleDescription = "preferred_style_description"
        case shareAiStylesWithStylist = "share_ai_styles_with_stylist"
    }
}

/// Public-safe stylist fields (column-level grants exclude Stripe/onboarding data).
struct Stylist: Codable, Identifiable, Sendable, Hashable {
    let id: UUID
    var name: String
    var businessName: String?
    var bio: String?
    var photoUrl: String?
    var address: String?
    var rating: Double?
    var totalReviews: Int?
    var specialties: [String]?
    var yearsExperience: Int?
    enum CodingKeys: String, CodingKey {
        case id, name, bio, address, rating, specialties
        case businessName = "business_name"
        case photoUrl = "photo_url"
        case totalReviews = "total_reviews"
        case yearsExperience = "years_experience"
    }
    static let columns = "id,name,business_name,bio,photo_url,address,rating,total_reviews,specialties,years_experience"
}

struct StylistService: Codable, Identifiable, Sendable, Hashable {
    let id: UUID
    var stylistId: UUID
    var name: String
    var description: String?
    var price: Double
    var durationMinutes: Int
    enum CodingKeys: String, CodingKey {
        case id, name, description, price
        case stylistId = "stylist_id"
        case durationMinutes = "duration_minutes"
    }
}

struct CustomerPhoto: Codable, Identifiable, Sendable {
    let id: UUID
    let customerId: UUID
    let photoType: String
    let photoUrl: String
    enum CodingKeys: String, CodingKey {
        case id
        case customerId = "customer_id"
        case photoType = "photo_type"
        case photoUrl = "photo_url"
    }
}

enum HeadAngle: String, CaseIterable, Identifiable, Sendable {
    case front, left, right, back, top
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
    var hint: String {
        switch self {
        case .front: "Look straight at the camera"
        case .left: "Turn your head to show your left side"
        case .right: "Turn your head to show your right side"
        case .back: "Ask a friend to capture the back"
        case .top: "Tilt your head down slightly"
        }
    }
}

struct GeneratedStyle: Codable, Identifiable, Sendable {
    let id: UUID
    let customerId: UUID
    let stylePrompt: String
    let generatedImageUrl: String?
    var selected: Bool?
    let createdAt: Date
    enum CodingKeys: String, CodingKey {
        case id, selected
        case customerId = "customer_id"
        case stylePrompt = "style_prompt"
        case generatedImageUrl = "generated_image_url"
        case createdAt = "created_at"
    }
}

struct Appointment: Codable, Identifiable, Sendable {
    let id: UUID
    let customerId: UUID
    let stylistId: UUID
    let serviceId: UUID
    var appointmentDate: Date
    var status: String
    var paymentStatus: String?
    var price: Double
    var tipAmount: Double?
    var stylistInstructions: String?
    var stylists: StylistMini?
    var stylistServices: ServiceMini?
    var customers: CustomerMini?
    enum CodingKeys: String, CodingKey {
        case id, status, price, stylists, customers
        case customerId = "customer_id"
        case stylistId = "stylist_id"
        case serviceId = "service_id"
        case appointmentDate = "appointment_date"
        case paymentStatus = "payment_status"
        case tipAmount = "tip_amount"
        case stylistInstructions = "stylist_instructions"
        case stylistServices = "stylist_services"
    }
    struct StylistMini: Codable, Sendable { let name: String; let photoUrl: String?
        enum CodingKeys: String, CodingKey { case name; case photoUrl = "photo_url" } }
    struct ServiceMini: Codable, Sendable { let name: String; let durationMinutes: Int
        enum CodingKeys: String, CodingKey { case name; case durationMinutes = "duration_minutes" } }
    struct CustomerMini: Codable, Sendable { let name: String; let phone: String? }

    var isUpcoming: Bool { appointmentDate > .now && !["cancelled", "completed", "no_show"].contains(status) }
}

struct NewAppointment: Encodable, Sendable {
    let customer_id: UUID
    let stylist_id: UUID
    let service_id: UUID
    let appointment_date: Date
    let price: Double
    let tip_amount: Double
    let status: String
    let payment_status: String
    let generated_style_id: UUID?
}
