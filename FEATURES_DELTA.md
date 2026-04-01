# FEATURES_DELTA.md — Missing Feature Implementations

> This file contains ONLY the features not yet implemented. All database schemas, RLS policies, and model structs from `FEATURES_IOS.md` are already in the project. This file provides the **Swift implementation code** for the gap features.

---

## 1. StorageService (NEW FILE)

Create `Services/StorageService.swift`:

```swift
import Foundation
import Supabase

class StorageService {
    static let shared = StorageService()
    private let supabase = SupabaseService.shared.client
    private let bucketName = "user-photos"
    
    // MARK: - Upload Photo
    /// Uploads image data to Supabase storage and returns the public URL
    func uploadPhoto(
        userId: String,
        category: String,        // "customer-photos" | "stylist-photos" | "portfolio-photos"
        photoType: String,       // "front" | "left" | "right" | "back" | "top" | "profile" | index
        imageData: Data
    ) async throws -> String {
        let fileName = "\(Int(Date().timeIntervalSince1970))-\(photoType).jpeg"
        let filePath = "\(userId)/\(category)/\(fileName)"
        
        try await supabase.storage
            .from(bucketName)
            .upload(
                filePath,
                data: imageData,
                options: FileOptions(contentType: "image/jpeg")
            )
        
        let publicURL = try supabase.storage
            .from(bucketName)
            .getPublicURL(path: filePath)
        
        return publicURL.absoluteString
    }
    
    // MARK: - Delete Photo
    /// Deletes a file from storage by its full path
    func deletePhoto(filePath: String) async throws {
        try await supabase.storage
            .from(bucketName)
            .remove(paths: [filePath])
    }
    
    // MARK: - Extract Path from URL
    /// Extracts the storage path from a full public URL for deletion
    func extractPath(from publicUrl: String) -> String? {
        // URL format: https://{ref}.supabase.co/storage/v1/object/public/user-photos/{path}
        guard let range = publicUrl.range(of: "/user-photos/") else { return nil }
        return String(publicUrl[range.upperBound...])
    }
    
    // MARK: - Compress Image
    /// Compresses a UIImage to JPEG data with target size
    func compressImage(_ image: UIImage, maxSizeKB: Int = 500) -> Data? {
        var compression: CGFloat = 0.8
        var imageData = image.jpegData(compressionQuality: compression)
        
        while let data = imageData, data.count > maxSizeKB * 1024, compression > 0.1 {
            compression -= 0.1
            imageData = image.jpegData(compressionQuality: compression)
        }
        
        return imageData
    }
}
```

---

## 2. EdgeFunctionService (NEW FILE)

Create `Services/EdgeFunctionService.swift`:

```swift
import Foundation
import Supabase

class EdgeFunctionService {
    static let shared = EdgeFunctionService()
    private let supabase = SupabaseService.shared.client
    
    // MARK: - Generate Hairstyle (AI)
    /// Calls generate-hairstyle edge function with user's photo and style prompt
    /// Returns array of base64 image data URL strings
    func generateHairstyle(stylePrompt: String, userPhotoUrl: String) async throws -> [String] {
        struct Request: Encodable {
            let stylePrompt: String
            let userPhotoUrl: String
        }
        
        struct Response: Decodable {
            let variations: [String]?
            let error: String?
        }
        
        let response = try await supabase.functions.invoke(
            "generate-hairstyle",
            options: .init(body: Request(stylePrompt: stylePrompt, userPhotoUrl: userPhotoUrl))
        )
        
        let decoded = try JSONDecoder().decode(Response.self, from: response.data)
        
        if let error = decoded.error {
            throw NSError(domain: "EdgeFunction", code: -1, userInfo: [NSLocalizedDescriptionKey: error])
        }
        
        return decoded.variations ?? []
    }
    
    // MARK: - Generate Stylist Instructions (AI)
    func generateStylistInstructions(
        serviceName: String,
        styleDescription: String? = nil,
        styleImageUrl: String? = nil,
        customerGender: String? = nil,
        customerAge: Int? = nil,
        preferredStyleDescription: String? = nil,
        previousNotes: String? = nil
    ) async throws -> (instructions: String, generatedAt: String) {
        struct Request: Encodable {
            let serviceName: String
            let styleDescription: String?
            let styleImageUrl: String?
            let customerGender: String?
            let customerAge: Int?
            let preferredStyleDescription: String?
            let previousNotes: String?
        }
        
        struct Response: Decodable {
            let instructions: String?
            let generatedAt: String?
            let error: String?
        }
        
        let response = try await supabase.functions.invoke(
            "generate-stylist-instructions",
            options: .init(body: Request(
                serviceName: serviceName,
                styleDescription: styleDescription,
                styleImageUrl: styleImageUrl,
                customerGender: customerGender,
                customerAge: customerAge,
                preferredStyleDescription: preferredStyleDescription,
                previousNotes: previousNotes
            ))
        )
        
        let decoded = try JSONDecoder().decode(Response.self, from: response.data)
        
        if let error = decoded.error {
            throw NSError(domain: "EdgeFunction", code: -1, userInfo: [NSLocalizedDescriptionKey: error])
        }
        
        guard let instructions = decoded.instructions else {
            throw NSError(domain: "EdgeFunction", code: -1, userInfo: [NSLocalizedDescriptionKey: "No instructions generated"])
        }
        
        return (instructions, decoded.generatedAt ?? ISO8601DateFormatter().string(from: Date()))
    }
    
    // MARK: - Send Booking SMS
    func sendBookingSMS(
        appointmentId: String,
        customerPhone: String,
        customerName: String,
        stylistPhone: String,
        stylistName: String,
        serviceName: String,
        appointmentDate: String,
        price: Double
    ) async throws -> Bool {
        struct Request: Encodable {
            let appointmentId: String
            let customerPhone: String
            let customerName: String
            let stylistPhone: String
            let stylistName: String
            let serviceName: String
            let appointmentDate: String
            let price: Double
        }
        
        struct Response: Decodable {
            let success: Bool
            let customerNotified: Bool?
            let stylistNotified: Bool?
            let errors: [String]?
        }
        
        let response = try await supabase.functions.invoke(
            "send-booking-sms",
            options: .init(body: Request(
                appointmentId: appointmentId,
                customerPhone: customerPhone,
                customerName: customerName,
                stylistPhone: stylistPhone,
                stylistName: stylistName,
                serviceName: serviceName,
                appointmentDate: appointmentDate,
                price: price
            ))
        )
        
        let decoded = try JSONDecoder().decode(Response.self, from: response.data)
        return decoded.success
    }
    
    // MARK: - Check Waitlist
    func checkWaitlist(stylistId: String, serviceId: String, appointmentDate: String) async throws -> (found: Int, notified: Int) {
        struct Request: Encodable {
            let stylistId: String
            let serviceId: String
            let appointmentDate: String
        }
        
        struct Response: Decodable {
            let found: Int?
            let notified: Int?
            let error: String?
        }
        
        let response = try await supabase.functions.invoke(
            "check-waitlist",
            options: .init(body: Request(
                stylistId: stylistId,
                serviceId: serviceId,
                appointmentDate: appointmentDate
            ))
        )
        
        let decoded = try JSONDecoder().decode(Response.self, from: response.data)
        return (decoded.found ?? 0, decoded.notified ?? 0)
    }
    
    // MARK: - Search Google Places
    func searchGooglePlaces(query: String) async throws -> [GooglePlaceResult] {
        struct Request: Encodable {
            let query: String
        }
        
        struct PlacesResponse: Decodable {
            let results: [GooglePlaceResult]
        }
        
        let response = try await supabase.functions.invoke(
            "search-google-places",
            options: .init(body: Request(query: query))
        )
        
        let decoded = try JSONDecoder().decode(PlacesResponse.self, from: response.data)
        return decoded.results
    }
    
    // MARK: - Import Google Reviews
    func importGoogleReviews(stylistId: String, placeId: String) async throws -> Int {
        struct Request: Encodable {
            let stylistId: String
            let placeId: String
        }
        
        struct Response: Decodable {
            let success: Bool
            let reviewsImported: Int
        }
        
        let response = try await supabase.functions.invoke(
            "import-google-reviews",
            options: .init(body: Request(stylistId: stylistId, placeId: placeId))
        )
        
        let decoded = try JSONDecoder().decode(Response.self, from: response.data)
        return decoded.reviewsImported
    }
}

// MARK: - Supporting Models
struct GooglePlaceResult: Codable, Identifiable {
    var id: String { placeId }
    let placeId: String
    let name: String
    let formattedAddress: String
    let rating: Double?
    let userRatingsTotal: Int?
    
    enum CodingKeys: String, CodingKey {
        case placeId = "place_id"
        case name
        case formattedAddress = "formatted_address"
        case rating
        case userRatingsTotal = "user_ratings_total"
    }
}
```

---

## 3. Customer Photo Upload Integration

Update your existing `CustomerProfileVM` (or equivalent) to wire up the photo capture → storage → database flow:

```swift
// Add these methods to your CustomerProfileVM or CustomerProfileView

// MARK: - Photo Upload Flow
func uploadCustomerPhoto(photoType: String, image: UIImage) async {
    guard let userId = AuthService.shared.currentUserId,
          let customerId = self.customer?.id else { return }
    
    isUploadingPhoto = true
    uploadingPhotoType = photoType
    
    do {
        // 1. Compress image
        guard let imageData = StorageService.shared.compressImage(image) else {
            throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to compress image"])
        }
        
        // 2. Upload to storage
        let publicUrl = try await StorageService.shared.uploadPhoto(
            userId: userId,
            category: "customer-photos",
            photoType: photoType,
            imageData: imageData
        )
        
        // 3. Delete existing photo of this type from DB
        try await SupabaseService.shared.client
            .from("customer_photos")
            .delete()
            .eq("customer_id", value: customerId)
            .eq("photo_type", value: photoType)
            .execute()
        
        // 4. Insert new photo record
        try await SupabaseService.shared.client
            .from("customer_photos")
            .insert([
                "customer_id": customerId,
                "photo_url": publicUrl,
                "photo_type": photoType
            ])
            .execute()
        
        // 5. Update local state
        await MainActor.run {
            self.photos[photoType] = publicUrl
            self.isUploadingPhoto = false
            self.uploadingPhotoType = nil
        }
    } catch {
        await MainActor.run {
            self.errorMessage = error.localizedDescription
            self.isUploadingPhoto = false
            self.uploadingPhotoType = nil
        }
    }
}

// MARK: - Photo Delete Flow
func deleteCustomerPhoto(photoType: String) async {
    guard let customerId = self.customer?.id else { return }
    
    // Delete from DB
    do {
        try await SupabaseService.shared.client
            .from("customer_photos")
            .delete()
            .eq("customer_id", value: customerId)
            .eq("photo_type", value: photoType)
            .execute()
        
        // Optionally delete from storage too
        if let url = photos[photoType], let path = StorageService.shared.extractPath(from: url) {
            try? await StorageService.shared.deletePhoto(filePath: path)
        }
        
        await MainActor.run {
            self.photos.removeValue(forKey: photoType)
        }
    } catch {
        await MainActor.run {
            self.errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Load Existing Photos from DB
func loadCustomerPhotos() async {
    guard let customerId = self.customer?.id else { return }
    
    do {
        let response: [CustomerPhoto] = try await SupabaseService.shared.client
            .from("customer_photos")
            .select()
            .eq("customer_id", value: customerId)
            .execute()
            .value
        
        await MainActor.run {
            self.photos = Dictionary(uniqueKeysWithValues: response.map { ($0.photoType, $0.photoUrl) })
        }
    } catch {
        print("Failed to load photos: \(error)")
    }
}
```

---

## 4. AI Style Generation Integration

Update `StyleGeneratorVM` to actually call the edge function and handle base64 images:

```swift
import SwiftUI

@MainActor
class StyleGeneratorVM: ObservableObject {
    @Published var hairStyles: [HairStyle] = []
    @Published var selectedCategory: String = ""
    @Published var stylePrompt: String = ""
    @Published var isGenerating = false
    @Published var generationProgress: Double = 0
    @Published var generatedStyles: [CustomerGeneratedStyle] = []
    @Published var selectedStyleId: String?
    @Published var errorMessage: String?
    
    // Progress simulation
    private var progressTimer: Timer?
    
    let stageMessages = [
        (0.0, "Analyzing your photo..."),
        (0.2, "Understanding your hair type..."),
        (0.4, "Applying style preferences..."),
        (0.6, "Generating variations..."),
        (0.8, "Refining details..."),
        (0.95, "Almost ready..."),
    ]
    
    let tips = [
        "Pro tip: Thick curly hair works great with textured styles!",
        "Did you know? Your face shape affects which styles look best on you.",
        "Tip: Describe specific lengths for better results.",
        "Pro tip: Mention your hair texture for more accurate previews.",
    ]
    
    var currentStageMessage: String {
        stageMessages.last(where: { generationProgress >= $0.0 })?.1 ?? stageMessages[0].1
    }
    
    // MARK: - Load hair styles for category picker
    func loadHairStyles(gender: String) async {
        do {
            let styles: [HairStyle] = try await SupabaseService.shared.client
                .from("hair_styles")
                .select()
                .or("gender.eq.\(gender),gender.eq.unisex")
                .execute()
                .value
            self.hairStyles = styles
        } catch {
            print("Failed to load hair styles: \(error)")
        }
    }
    
    // MARK: - Load existing generated styles
    func loadExistingStyles(customerId: String) async {
        do {
            let styles: [CustomerGeneratedStyle] = try await SupabaseService.shared.client
                .from("customer_generated_styles")
                .select()
                .eq("customer_id", value: customerId)
                .order("created_at", ascending: false)
                .execute()
                .value
            
            self.generatedStyles = styles
            self.selectedStyleId = styles.first(where: { $0.selected == true })?.id
        } catch {
            print("Failed to load styles: \(error)")
        }
    }
    
    // MARK: - Generate new styles
    func generateStyles(customerId: String, frontPhotoUrl: String) async {
        guard !stylePrompt.isEmpty || !selectedCategory.isEmpty else {
            errorMessage = "Please describe your desired style"
            return
        }
        
        isGenerating = true
        generationProgress = 0
        startProgressSimulation()
        
        do {
            let fullPrompt = selectedCategory.isEmpty ? stylePrompt : "\(selectedCategory): \(stylePrompt)"
            
            let variations = try await EdgeFunctionService.shared.generateHairstyle(
                stylePrompt: fullPrompt,
                userPhotoUrl: frontPhotoUrl
            )
            
            guard !variations.isEmpty else {
                errorMessage = "No images generated. Try a different description."
                stopProgressSimulation()
                isGenerating = false
                return
            }
            
            // Save each variation to DB
            var savedStyles: [CustomerGeneratedStyle] = []
            for imageUrl in variations {
                let insertData: [String: String] = [
                    "customer_id": customerId,
                    "style_prompt": fullPrompt,
                    "generated_image_url": imageUrl
                ]
                
                let saved: [CustomerGeneratedStyle] = try await SupabaseService.shared.client
                    .from("customer_generated_styles")
                    .insert(insertData)
                    .select()
                    .execute()
                    .value
                
                savedStyles.append(contentsOf: saved)
            }
            
            self.generatedStyles = savedStyles + self.generatedStyles
            
        } catch {
            errorMessage = error.localizedDescription
        }
        
        stopProgressSimulation()
        generationProgress = 1.0
        
        // Brief delay then reset
        try? await Task.sleep(nanoseconds: 500_000_000)
        isGenerating = false
        generationProgress = 0
    }
    
    // MARK: - Select a style
    func selectStyle(styleId: String, customerId: String) async {
        // Deselect all
        try? await SupabaseService.shared.client
            .from("customer_generated_styles")
            .update(["selected": false])
            .eq("customer_id", value: customerId)
            .execute()
        
        // Select this one
        try? await SupabaseService.shared.client
            .from("customer_generated_styles")
            .update(["selected": true])
            .eq("id", value: styleId)
            .execute()
        
        selectedStyleId = styleId
    }
    
    // MARK: - Base64 → UIImage helper
    static func imageFromBase64(_ dataUrl: String) -> UIImage? {
        // Strip "data:image/png;base64," prefix
        let prefixes = ["data:image/png;base64,", "data:image/jpeg;base64,", "data:image/webp;base64,"]
        var base64String = dataUrl
        for prefix in prefixes {
            if base64String.hasPrefix(prefix) {
                base64String = String(base64String.dropFirst(prefix.count))
                break
            }
        }
        
        guard let imageData = Data(base64Encoded: base64String) else { return nil }
        return UIImage(data: imageData)
    }
    
    // MARK: - Progress Simulation
    private func startProgressSimulation() {
        progressTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self = self, self.isGenerating else { return }
                let increment = Double.random(in: 0.05...0.15)
                self.generationProgress = min(self.generationProgress + increment, 0.9)
            }
        }
    }
    
    private func stopProgressSimulation() {
        progressTimer?.invalidate()
        progressTimer = nil
    }
}
```

---

## 5. Before/After Comparison Slider (NEW COMPONENT)

Create `Components/BeforeAfterSlider.swift`:

```swift
import SwiftUI

struct BeforeAfterSlider: View {
    let beforeImage: UIImage
    let afterImage: UIImage
    @State private var sliderPosition: CGFloat = 0.5
    @GestureState private var isDragging = false
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                // After image (full)
                Image(uiImage: afterImage)
                    .resizable()
                    .scaledToFill()
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()
                
                // Before image (clipped)
                Image(uiImage: beforeImage)
                    .resizable()
                    .scaledToFill()
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()
                    .mask(
                        HStack {
                            Rectangle()
                                .frame(width: geo.size.width * sliderPosition)
                            Spacer(minLength: 0)
                        }
                    )
                
                // Slider handle
                HStack {
                    Spacer()
                        .frame(width: max(0, geo.size.width * sliderPosition - 20))
                    
                    Rectangle()
                        .fill(.white)
                        .frame(width: 3)
                        .overlay(
                            Circle()
                                .fill(.white)
                                .frame(width: 40, height: 40)
                                .shadow(color: .black.opacity(0.3), radius: 4)
                                .overlay(
                                    Image(systemName: "arrow.left.and.right")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundColor(Color.theme.primary)
                                )
                        )
                    
                    Spacer(minLength: 0)
                }
                
                // Labels
                VStack {
                    HStack {
                        Text("Before")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.black.opacity(0.5))
                            .foregroundColor(.white)
                            .cornerRadius(4)
                        
                        Spacer()
                        
                        Text("After")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.black.opacity(0.5))
                            .foregroundColor(.white)
                            .cornerRadius(4)
                    }
                    .padding(12)
                    
                    Spacer()
                }
            }
            .gesture(
                DragGesture(minimumDistance: 0)
                    .updating($isDragging) { _, state, _ in state = true }
                    .onChanged { value in
                        sliderPosition = max(0, min(1, value.location.x / geo.size.width))
                    }
            )
        }
        .aspectRatio(1, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
```

---

## 6. Realtime Messaging

Create `ViewModels/MessagingVM.swift`:

```swift
import Foundation
import Supabase
import Realtime

@MainActor
class MessagingVM: ObservableObject {
    @Published var messages: [Message] = []
    @Published var newMessageText: String = ""
    @Published var isSending = false
    
    private var channel: RealtimeChannelV2?
    private let supabase = SupabaseService.shared.client
    
    let currentUserId: String
    let otherUserId: String
    let appointmentId: String?
    
    init(currentUserId: String, otherUserId: String, appointmentId: String? = nil) {
        self.currentUserId = currentUserId
        self.otherUserId = otherUserId
        self.appointmentId = appointmentId
    }
    
    // MARK: - Load existing messages
    func loadMessages() async {
        do {
            let fetched: [Message] = try await supabase
                .from("messages")
                .select()
                .or("and(from_user_id.eq.\(currentUserId),to_user_id.eq.\(otherUserId)),and(from_user_id.eq.\(otherUserId),to_user_id.eq.\(currentUserId))")
                .order("created_at", ascending: true)
                .execute()
                .value
            
            self.messages = fetched
            
            // Mark unread messages as read
            await markMessagesAsRead()
        } catch {
            print("Failed to load messages: \(error)")
        }
    }
    
    // MARK: - Subscribe to new messages
    func subscribeToMessages() {
        channel = supabase.realtimeV2.channel("messages-\(currentUserId)-\(otherUserId)")
        
        let insertions = channel?.onPostgresChange(
            InsertAction.self,
            schema: "public",
            table: "messages"
        )
        
        Task {
            guard let insertions = insertions else { return }
            for await insertion in insertions {
                if let newMessage = try? insertion.decodeRecord(as: Message.self, decoder: JSONDecoder()) {
                    // Only add if it's part of our conversation
                    if (newMessage.fromUserId == currentUserId && newMessage.toUserId == otherUserId) ||
                       (newMessage.fromUserId == otherUserId && newMessage.toUserId == currentUserId) {
                        await MainActor.run {
                            if !self.messages.contains(where: { $0.id == newMessage.id }) {
                                self.messages.append(newMessage)
                            }
                        }
                        // Mark as read if we're the receiver
                        if newMessage.toUserId == currentUserId {
                            await markMessagesAsRead()
                        }
                    }
                }
            }
        }
        
        Task {
            await channel?.subscribe()
        }
    }
    
    // MARK: - Send message
    func sendMessage() async {
        let text = newMessageText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        
        isSending = true
        newMessageText = ""
        
        do {
            try await supabase
                .from("messages")
                .insert([
                    "from_user_id": currentUserId,
                    "to_user_id": otherUserId,
                    "content": text,
                    "appointment_id": appointmentId ?? ""
                ].compactMapValues { $0.isEmpty ? nil : $0 })
                .execute()
        } catch {
            print("Failed to send message: \(error)")
            newMessageText = text // Restore on failure
        }
        
        isSending = false
    }
    
    // MARK: - Mark as read
    private func markMessagesAsRead() async {
        try? await supabase
            .from("messages")
            .update(["read_at": ISO8601DateFormatter().string(from: Date())])
            .eq("to_user_id", value: currentUserId)
            .eq("from_user_id", value: otherUserId)
            .is("read_at", value: nil)
            .execute()
    }
    
    // MARK: - Cleanup
    func unsubscribe() {
        Task {
            await channel?.unsubscribe()
        }
    }
    
    deinit {
        unsubscribe()
    }
}
```

---

## 7. Booking Completion — SMS Integration

Add this to your existing `BookingVM` after successfully inserting the appointment:

```swift
// After successful appointment insert, send SMS notifications
func sendBookingNotifications(appointment: Appointment, customer: Customer, stylist: Stylist, serviceName: String) async {
    // Only send if phone numbers are available
    guard let customerPhone = customer.phone, !customerPhone.isEmpty,
          let stylistPhone = stylist.phone, !stylistPhone.isEmpty else {
        print("Skipping SMS — missing phone numbers")
        return
    }
    
    do {
        let success = try await EdgeFunctionService.shared.sendBookingSMS(
            appointmentId: appointment.id,
            customerPhone: customerPhone,
            customerName: customer.name,
            stylistPhone: stylistPhone,
            stylistName: stylist.name,
            serviceName: serviceName,
            appointmentDate: appointment.appointmentDate,
            price: appointment.price
        )
        print("SMS sent: \(success)")
    } catch {
        // SMS failure is non-critical — don't block the booking flow
        print("SMS notification failed: \(error.localizedDescription)")
    }
}
```

---

## 8. Appointment Cancellation — Waitlist Check

Add this to your existing appointments management when cancelling:

```swift
// After updating appointment status to "cancelled"
func cancelAppointmentAndNotifyWaitlist(appointment: Appointment) async throws {
    // 1. Update appointment status
    try await SupabaseService.shared.client
        .from("appointments")
        .update(["status": "cancelled"])
        .eq("id", value: appointment.id)
        .execute()
    
    // 2. Trigger waitlist check for the freed slot
    do {
        let result = try await EdgeFunctionService.shared.checkWaitlist(
            stylistId: appointment.stylistId,
            serviceId: appointment.serviceId,
            appointmentDate: appointment.appointmentDate
        )
        print("Waitlist: found \(result.found), notified \(result.notified)")
    } catch {
        // Waitlist check failure is non-critical
        print("Waitlist check failed: \(error.localizedDescription)")
    }
}
```

---

## 9. Stylist Instructions Generation

Add this to your `StylistAppointmentsVM` or appointment detail view:

```swift
// MARK: - Generate AI Instructions for an Appointment
func generateInstructions(
    for appointment: Appointment,
    serviceName: String,
    customer: Customer?,
    generatedStyle: CustomerGeneratedStyle?
) async {
    isGeneratingInstructions = true
    
    do {
        let result = try await EdgeFunctionService.shared.generateStylistInstructions(
            serviceName: serviceName,
            styleDescription: generatedStyle?.stylePrompt,
            styleImageUrl: generatedStyle?.generatedImageUrl,
            customerGender: customer?.gender,
            customerAge: customer?.age,
            preferredStyleDescription: customer?.preferredStyleDescription,
            previousNotes: appointment.stylistNotes
        )
        
        // Save instructions to appointment
        try await SupabaseService.shared.client
            .from("appointments")
            .update(["stylist_instructions": result.instructions])
            .eq("id", value: appointment.id)
            .execute()
        
        self.currentInstructions = result.instructions
        
    } catch {
        self.errorMessage = error.localizedDescription
    }
    
    isGeneratingInstructions = false
}
```

---

## 10. Stylist Photo Upload (Profile + Portfolio)

```swift
// MARK: - Upload Stylist Profile Photo
func uploadProfilePhoto(image: UIImage) async {
    guard let userId = AuthService.shared.currentUserId,
          let stylistId = self.stylist?.id else { return }
    
    do {
        guard let imageData = StorageService.shared.compressImage(image) else { return }
        
        let publicUrl = try await StorageService.shared.uploadPhoto(
            userId: userId,
            category: "stylist-photos",
            photoType: "profile",
            imageData: imageData
        )
        
        // Update stylist record
        try await SupabaseService.shared.client
            .from("stylists")
            .update(["photo_url": publicUrl])
            .eq("id", value: stylistId)
            .execute()
        
        await MainActor.run {
            self.stylist?.photoUrl = publicUrl
        }
    } catch {
        await MainActor.run {
            self.errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Upload Portfolio Photo
func uploadPortfolioPhoto(image: UIImage, styleType: String?, hairType: String?, description: String?) async {
    guard let userId = AuthService.shared.currentUserId,
          let stylistId = self.stylist?.id else { return }
    
    do {
        guard let imageData = StorageService.shared.compressImage(image) else { return }
        
        let index = (self.portfolio?.count ?? 0) + 1
        let publicUrl = try await StorageService.shared.uploadPhoto(
            userId: userId,
            category: "portfolio-photos",
            photoType: "\(index)",
            imageData: imageData
        )
        
        // Insert portfolio record
        var insertData: [String: String] = [
            "stylist_id": stylistId,
            "image_url": publicUrl
        ]
        if let styleType = styleType { insertData["style_type"] = styleType }
        if let hairType = hairType { insertData["hair_type"] = hairType }
        if let description = description { insertData["description"] = description }
        
        try await SupabaseService.shared.client
            .from("stylist_portfolio")
            .insert(insertData)
            .execute()
        
        // Reload portfolio
        await loadPortfolio()
    } catch {
        await MainActor.run {
            self.errorMessage = error.localizedDescription
        }
    }
}
```

---

## 11. Waitlist — Join Flow

```swift
// MARK: - Join Waitlist
func joinWaitlist(
    customerId: String,
    stylistId: String,
    serviceId: String,
    preferredDate: Date,
    preferredTimeStart: String? = nil,
    preferredTimeEnd: String? = nil
) async throws {
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd"
    
    var insertData: [String: String] = [
        "customer_id": customerId,
        "stylist_id": stylistId,
        "service_id": serviceId,
        "preferred_date": dateFormatter.string(from: preferredDate),
        "status": "active"
    ]
    
    if let start = preferredTimeStart { insertData["preferred_time_start"] = start }
    if let end = preferredTimeEnd { insertData["preferred_time_end"] = end }
    
    try await SupabaseService.shared.client
        .from("waitlist")
        .insert(insertData)
        .execute()
}
```

---

## 12. Google Places Search + Review Import (Stylist Onboarding)

```swift
// MARK: - Search for salon on Google
func searchGooglePlaces(query: String) async {
    do {
        self.googlePlaceResults = try await EdgeFunctionService.shared.searchGooglePlaces(query: query)
    } catch {
        print("Google Places search failed: \(error)")
    }
}

// MARK: - Import reviews from selected place
func importGoogleReviews(stylistId: String, placeId: String) async {
    isImportingReviews = true
    do {
        let count = try await EdgeFunctionService.shared.importGoogleReviews(
            stylistId: stylistId,
            placeId: placeId
        )
        
        // Update stylist's google_place_id
        try await SupabaseService.shared.client
            .from("stylists")
            .update(["google_place_id": placeId])
            .eq("id", value: stylistId)
            .execute()
        
        importedReviewCount = count
    } catch {
        errorMessage = error.localizedDescription
    }
    isImportingReviews = false
}
```

---

## 13. Markdown Renderer for Stylist Instructions

Create `Components/MarkdownView.swift`:

```swift
import SwiftUI

struct MarkdownView: View {
    let content: String
    
    var body: some View {
        ScrollView {
            // iOS 15+ has native Markdown support in Text
            Text(LocalizedStringKey(content))
                .font(.body)
                .foregroundColor(Color.theme.foreground)
                .textSelection(.enabled)
                .padding()
        }
    }
}
```

If you need richer markdown rendering, add `MarkdownUI` via SPM:
`https://github.com/gonzalezreal/swift-markdown-ui`

Then:
```swift
import MarkdownUI

struct MarkdownView: View {
    let content: String
    
    var body: some View {
        ScrollView {
            Markdown(content)
                .markdownTheme(.gitHub)
                .padding()
        }
    }
}
```
