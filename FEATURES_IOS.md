# FEATURES_IOS.md — Complete Implementation Reference

## Table of Contents
1. [Database Schema & Swift Models](#database-schema--swift-models)
2. [RLS Policy Map](#rls-policy-map)
3. [Storage (user-photos bucket)](#storage)
4. [Edge Functions — Full Specs](#edge-functions)
5. [Feature Implementation Details](#feature-implementation-details)
6. [i18n Key Reference](#i18n-key-reference)

---

## Database Schema & Swift Models

All models use `CodingKeys` with `.convertFromSnakeCase`. UUIDs are `String` (not `UUID`) to match Supabase text representation.

```swift
// MARK: - User Roles
struct UserRole: Codable, Identifiable {
    let id: String
    let userId: String
    let role: AppRole
    let createdAt: String

    enum AppRole: String, Codable {
        case customer, stylist
    }
}

// MARK: - Customer
struct Customer: Codable, Identifiable {
    let id: String
    var userId: String?
    var name: String
    var email: String
    var phone: String?
    var gender: String
    var age: Int?
    var preferredStyleDescription: String?
    var preferredStyleCategory: String?
    var shareAiStylesWithStylist: Bool?
    var latitude: Double?
    var longitude: Double?
    var languagePreference: String?
    var stripeCustomerId: String?
    let createdAt: String
    var updatedAt: String
}

// MARK: - Stylist
struct Stylist: Codable, Identifiable {
    let id: String
    var userId: String?
    var name: String
    var email: String
    var phone: String?
    var businessName: String?
    var bio: String?
    var address: String?
    var photoUrl: String?
    var specialties: [String]?
    var certifications: [String]?
    var yearsExperience: Int?
    var rating: Double?
    var totalReviews: Int?
    var availabilityStatus: String?  // "online" | "offline" | "busy"
    var onboardingCompleted: Bool?
    var onboardingStep: Int?
    var stripeAccountId: String?
    var stripeOnboarded: Bool?
    var googlePlaceId: String?
    var latitude: Double?
    var longitude: Double?
    var languagePreference: String?
    let createdAt: String
    var updatedAt: String
}

// MARK: - Stylist Public View (read-only)
struct StylistPublic: Codable, Identifiable {
    let id: String?
    let name: String?
    let businessName: String?
    let bio: String?
    let address: String?
    let photoUrl: String?
    let specialties: [String]?
    let certifications: [String]?
    let yearsExperience: Int?
    let rating: Double?
    let totalReviews: Int?
    let availabilityStatus: String?
    let onboardingCompleted: Bool?
    let latitude: Double?
    let longitude: Double?
}

// MARK: - Stylist Service
struct StylistService: Codable, Identifiable {
    let id: String
    var stylistId: String
    var name: String
    var description: String?
    var price: Double
    var durationMinutes: Int
    let createdAt: String
}

// MARK: - Stylist Availability
struct StylistAvailability: Codable, Identifiable {
    let id: String
    var stylistId: String
    var dayOfWeek: Int           // 0=Sunday..6=Saturday
    var startTime: String        // "09:00"
    var endTime: String          // "17:00"
    var isAvailable: Bool?
    let createdAt: String
}

// MARK: - Stylist Portfolio
struct StylistPortfolio: Codable, Identifiable {
    let id: String
    var stylistId: String
    var imageUrl: String
    var description: String?
    var styleType: String?
    var hairType: String?
    let createdAt: String
}

// MARK: - Customer Photos
struct CustomerPhoto: Codable, Identifiable {
    let id: String
    var customerId: String
    var photoUrl: String
    var photoType: String        // "front" | "left" | "right" | "back" | "top"
    let createdAt: String
}

// MARK: - Customer Generated Styles (AI)
struct CustomerGeneratedStyle: Codable, Identifiable {
    let id: String
    var customerId: String
    var stylePrompt: String
    var generatedImageUrl: String?
    var selected: Bool?
    let createdAt: String
}

// MARK: - Appointment
struct Appointment: Codable, Identifiable {
    let id: String
    var customerId: String
    var stylistId: String
    var serviceId: String
    var generatedStyleId: String?
    var appointmentDate: String   // ISO 8601
    var price: Double
    var status: String            // "pending" | "confirmed" | "completed" | "cancelled"
    var paymentStatus: String?    // "unpaid" | "paid" | "refunded"
    var tipAmount: Double?
    var checkInStatus: String?    // "pending" | "checked_in"
    var checkInTime: String?
    var customerConfirmedAt: String?
    var confirmationSentAt: String?
    var stylistNotes: String?
    var stylistInstructions: String?
    var aiStyleDescription: String?
    var stripePaymentIntentId: String?
    let createdAt: String
    var updatedAt: String
}

// MARK: - Review
struct Review: Codable, Identifiable {
    let id: String
    var customerId: String
    var stylistId: String
    var appointmentId: String?
    var rating: Int
    var comment: String?
    var isGoogleReview: Bool?
    var googleReviewId: String?
    let createdAt: String
}

// MARK: - Appointment Feedback
struct AppointmentFeedback: Codable, Identifiable {
    let id: String
    var appointmentId: String
    var customerId: String
    var sentiment: String        // "love" | "happy" | "okay" | "notGreat" | "upset"
    var feedbackText: String?
    var issueType: String?
    var resolutionStatus: String? // "pending" | "resolved"
    var resolvedAt: String?
    let createdAt: String
}

// MARK: - Message
struct Message: Codable, Identifiable {
    let id: String
    var fromUserId: String
    var toUserId: String
    var appointmentId: String?
    var content: String
    var isImage: Bool?
    var imageUrl: String?
    var readAt: String?
    let createdAt: String
}

// MARK: - Waitlist
struct WaitlistEntry: Codable, Identifiable {
    let id: String
    var customerId: String
    var stylistId: String
    var serviceId: String
    var preferredDate: String     // "YYYY-MM-DD"
    var preferredTimeStart: String?
    var preferredTimeEnd: String?
    var status: String            // "active" | "notified" | "booked" | "expired"
    var notifiedAt: String?
    let createdAt: String
    var updatedAt: String
}

// MARK: - Hair Styles (reference data)
struct HairStyle: Codable, Identifiable {
    let id: String
    var name: String
    var description: String?
    var gender: String           // "male" | "female" | "unisex"
    var imageUrl: String?
    let createdAt: String
}

// MARK: - Push Subscription
struct PushSubscription: Codable, Identifiable {
    let id: String
    var userId: String
    var endpoint: String
    var p256dh: String
    var auth: String
    let createdAt: String
    var updatedAt: String
}

// MARK: - Customer No-Show
struct CustomerNoShow: Codable, Identifiable {
    let id: String
    var customerId: String
    var appointmentId: String
    var feeCharged: Double?
    var noShowDate: String
    let createdAt: String
}
```

---

## RLS Policy Map

All tables have RLS enabled. iOS app must send valid JWT via `supabase.auth.session`.

### Security Definer Functions (bypass RLS recursion)
```
has_role(user_id, role)         → checks user_roles table
is_customer_owner(customer_id)  → checks customers.user_id = auth.uid()
is_stylist_for_customer(cust_id) → checks stylists + appointments join
is_customer_for_stylist(styl_id) → checks customers + appointments join (confirmed/pending/completed)
get_user_role(user_id)          → returns app_role enum
```

### Per-Table Access Rules

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `user_roles` | Own only | Own only | ❌ | ❌ |
| `customers` | Own OR stylist with appointment | Own (user_id = auth.uid()) | Own | ❌ |
| `stylists` | Own full record; Public if onboarding_completed; Customer if has appointment | Own | Own | ❌ |
| `stylists_public` | Public (view, no RLS) | N/A | N/A | N/A |
| `stylist_services` | Public | Own stylist | Own stylist | Own stylist (via ALL) |
| `stylist_availability` | Public | Own stylist | Own stylist | Own stylist (via ALL) |
| `stylist_portfolio` | Public | Own stylist | Own stylist | Own stylist (via ALL) |
| `customer_photos` | Own OR stylist with appointment | Own (is_customer_owner) | Own | Own |
| `customer_generated_styles` | Own (is_customer_owner) OR stylist with linked appointment | Own | Own | Own |
| `appointments` | Customer owner OR stylist owner | Customer owner | Customer owner OR stylist owner | ❌ |
| `reviews` | Public | Customer owner (must have completed appointment for that stylist) | Customer owner | Customer owner |
| `appointment_feedback` | Customer owner OR appointment's stylist | Customer owner | ❌ | ❌ |
| `messages` | Sender or receiver | Sender (from_user_id = auth.uid()) | Receiver only (mark read) | ❌ |
| `waitlist` | Customer owner OR stylist owner | Customer owner | Customer owner | Customer owner |
| `hair_styles` | Public | ❌ | ❌ | ❌ |
| `push_subscriptions` | Own | Own | Own | Own |
| `customer_no_shows` | Stylist with linked appointment | ❌ | ❌ | ❌ |

### iOS Error Handling
- **403 / empty results**: RLS blocked access. Check auth state and user role.
- Always check `session != nil` before database operations.
- If a query returns empty unexpectedly, verify the user has the correct role and ownership.

---

## Storage

**Bucket**: `user-photos` (public)

### Path Convention
```
{user_id}/customer-photos/{timestamp}-{type}.{ext}    — Customer hair photos
{user_id}/stylist-photos/{timestamp}-profile.{ext}     — Stylist profile photo
{user_id}/portfolio-photos/{timestamp}-{index}.{ext}   — Stylist portfolio
```

### Upload Pattern (Swift)
```swift
func uploadPhoto(userId: String, category: String, photoType: String, imageData: Data) async throws -> String {
    let ext = "jpeg"
    let fileName = "\(Int(Date().timeIntervalSince1970))-\(photoType).\(ext)"
    let filePath = "\(userId)/\(category)/\(fileName)"
    
    try await supabase.storage
        .from("user-photos")
        .upload(filePath, data: imageData, options: .init(contentType: "image/jpeg"))
    
    let publicUrl = try supabase.storage
        .from("user-photos")
        .getPublicURL(path: filePath)
    
    return publicUrl.absoluteString
}
```

### Customer Photo Flow
1. User selects/captures photo for a type (front/left/right/back/top)
2. Upload to `user-photos` bucket at `{userId}/customer-photos/{ts}-{type}.jpeg`
3. Get public URL
4. Delete existing `customer_photos` row with same `customer_id` + `photo_type`
5. Insert new row: `{ customer_id, photo_url, photo_type }`
6. Update local state immediately

### Stylist Photo Flow
1. Profile photo: upload to `{userId}/stylist-photos/{ts}-profile.jpeg`
2. Portfolio photos: upload to `{userId}/portfolio-photos/{ts}-{index}.jpeg`
3. Insert into `stylist_portfolio` table with `image_url`, optional `style_type`, `hair_type`, `description`

---

## Edge Functions

All edge functions are at: `https://nkarycrvlmtuuyqzvyvt.supabase.co/functions/v1/{name}`

Call via Swift Supabase SDK: `supabase.functions.invoke("name", options: .init(body: payload))`

### 1. `generate-hairstyle`

**Auth**: Required (JWT verified in code + `verify_jwt = true` in config)

**Request:**
```json
{
  "stylePrompt": "Short fade on sides, textured crop on top",
  "userPhotoUrl": "https://...public-url-of-front-photo..."
}
```

**Validation**: Zod — `stylePrompt` 1-500 chars, `userPhotoUrl` must be HTTPS URL.

**What it does**: Sends 3 different prompts to the AI image generation gateway (Gemini flash-image model) with the user's front photo. Each prompt asks to transform ONLY the hair while keeping the face identical.

**Response (200):**
```json
{
  "variations": [
    "data:image/png;base64,iVBOR...",
    "data:image/png;base64,iVBOR...",
    "data:image/png;base64,iVBOR..."
  ]
}
```

**Error responses:**
- `401`: Missing/invalid auth
- `400`: Validation failed (with `details` array)
- `429`: Rate limited
- `402`: Payment/credits required
- `500`: Internal error

**iOS Implementation Notes:**
- The `variations` array contains base64-encoded image data URLs
- Parse with: `let imageData = Data(base64Encoded: url.replacingOccurrences(of: "data:image/png;base64,", with: ""))`
- Save each variation to `customer_generated_styles` table with `generated_image_url` = the base64 string
- Display in a horizontal scroll picker
- User selects one → set `selected = true`, others `selected = false`

### 2. `generate-stylist-instructions`

**Auth**: Required (verify_jwt = true)

**Request:**
```json
{
  "serviceName": "Classic Fade",
  "styleDescription": "Low taper fade with textured top",
  "styleImageUrl": "https://...",        // optional
  "customerGender": "male",              // optional
  "customerAge": 28,                     // optional
  "preferredStyleDescription": "Modern and clean", // optional
  "previousNotes": "Hair is thick"       // optional
}
```

**Response (200):**
```json
{
  "instructions": "## PRE-SERVICE CONSULTATION\n...\n## PREPARATION\n...",
  "generatedAt": "2025-01-15T10:30:00.000Z"
}
```

**What it does**: Uses AI (Gemini flash) with a master hairstylist system prompt to generate detailed professional instructions covering: consultation, preparation, technique breakdown, blending, styling/product, and aftercare.

**iOS**: Display instructions in a markdown-rendered view. Save to `appointments.stylist_instructions`. Allow copy-to-clipboard.

### 3. `send-booking-sms`

**Auth**: Required (verify_jwt = true)

**Request:**
```json
{
  "appointmentId": "uuid",
  "customerPhone": "+1234567890",
  "customerName": "John",
  "stylistPhone": "+1234567890",
  "stylistName": "Jane",
  "serviceName": "Haircut",
  "appointmentDate": "2025-01-20T14:00:00Z",
  "price": 35.00
}
```

**Response (200):**
```json
{
  "success": true,
  "customerNotified": true,
  "stylistNotified": true,
  "errors": []
}
```

**What it does**: Sends formatted SMS via Twilio to both customer and stylist with appointment details (date, time, service, price).

### 4. `send-push-notification`

**Auth**: None required (verify_jwt = false) — uses service role internally

**Actions:**

**a) `send-reminder`:**
```json
{
  "action": "send-reminder",
  "userId": "auth-user-uuid",
  "title": "Appointment Reminder",
  "body": "Your haircut is in 1 hour",
  "data": { "appointmentId": "uuid" }
}
```

**b) `check-reminders`:**
```json
{
  "action": "check-reminders"
}
```
Finds appointments 1-2 hours from now and sends push notifications to subscribed customers.

**Response:**
```json
{ "success": true, "sent": 1, "total": 1 }
```

**iOS Note**: For iOS, use APNs (Apple Push Notification service) instead of web push. You'll need to implement a separate push notification flow using APNs tokens rather than web push subscriptions. The existing `push_subscriptions` table schema won't directly apply — consider adding a `device_token` column or a separate `ios_push_tokens` table.

### 5. `check-waitlist`

**Auth**: Required (verify_jwt = true + in-code JWT verification + rate limiting)

**Request:**
```json
{
  "stylistId": "uuid",
  "serviceId": "uuid",
  "appointmentDate": "2025-01-20T14:00:00Z"
}
```

**Validation**: All fields must be valid UUIDs / date strings.

**Rate Limit**: 5 requests/minute per user (in-memory store).

**Authorization**: Caller must be either the stylist OR a customer with an appointment for that stylist+service.

**Response (200):**
```json
{
  "message": "Waitlist checked",
  "found": 3,
  "notified": 2
}
```

### 6. `get-vapid-key`

**Auth**: None required (verify_jwt = false)

**Request**: GET (no body)

**Response:**
```json
{ "publicKey": "BLnLz..." }
```

**iOS Note**: Not needed for iOS — this is for web push subscriptions only. Use APNs instead.

### 7. `search-google-places`

**Auth**: None required

**Request:**
```json
{ "query": "Best barbershop downtown" }
```

**Response:**
```json
{
  "results": [
    {
      "place_id": "ChIJ...",
      "name": "Downtown Barbershop",
      "formatted_address": "123 Main St",
      "rating": 4.5,
      "user_ratings_total": 42
    }
  ]
}
```

**Note**: Returns mock data if `GOOGLE_PLACES_API_KEY` not configured.

### 8. `import-google-reviews`

**Auth**: None required

**Request:**
```json
{
  "stylistId": "uuid",
  "placeId": "ChIJ..."
}
```

**Response:**
```json
{ "success": true, "reviewsImported": 3 }
```

**What it does**: Fetches reviews from Google Places API (or creates mock reviews if API key not set), creates a system customer for attribution, inserts into `reviews` table, and recalculates stylist's average rating.

---

## Feature Implementation Details

### 1. Customer Photo Capture (Guided Flow)

The web app has a 5-step guided photo capture:
1. **Front View** — Face camera directly
2. **Left Side** — Turn 90° left
3. **Right Side** — Turn 90° right
4. **Back View** — Face away
5. **Top View** — Tilt head forward

**iOS Implementation:**
- Use `PhotosPicker` from PhotosUI or `UIImagePickerController` with `.camera` source
- Show progress dots (5 steps) at the top
- Each step shows: emoji icon, instruction text, tip text
- After capture, show checkmark overlay
- Auto-advance to next step after 0.5s delay
- Minimum 2 photos required to proceed
- Display 5-column grid of thumbnails with delete buttons
- Support haptic feedback: medium on capture, success on save, warning on delete

### 2. AI Style Generation (Customer Style Page)

**Flow:**
1. Customer selects a style category from `hair_styles` table (filtered by gender)
2. Writes a text description of desired style
3. Taps "Generate Preview"
4. App calls `generate-hairstyle` edge function with front photo URL + prompt
5. Shows animated loading state with:
   - Rotating tips (5-second interval)
   - Stage messages: "Analyzing your photo" → "Understanding hair type" → "Applying style" → "Generating variations" → "Refining" → "Almost ready"
   - Progress bar (simulated, not real)
   - Estimated time remaining
6. On success: save variations to `customer_generated_styles`, display as horizontal thumbnail strip
7. User taps a thumbnail to select → deselect others
8. **Before/After Comparison Slider**: drag handle left/right to reveal before (original photo) vs after (selected generated style)
9. "Approve" button → navigate to booking flow

### 3. Booking Flow

**Step 1: Stylist Discovery**
- Query `stylists_public` view (no RLS needed)
- Join with `stylist_services` to get starting price (`min(price)`) and most popular service
- Filter by distance using Haversine formula on lat/lng
- Distance slider: 5km to "Any distance"
- Sort by: rating, distance, price
- Each card shows: photo, name, business name, rating, reviews count, distance, starting price, specialties

**Step 2: Stylist Profile Sheet**
- Full profile with portfolio gallery
- Services list with prices + durations
- Reviews section
- "Book Now" button

**Step 3: Service Selection + Cart**
- Multi-select services
- Running total with service cart component
- Price breakdown: subtotal, platform fee (2.9% + $0.30), tip, total

**Step 4: Date + Time Selection**
- Calendar date picker
- Time slots generated from `stylist_availability` minus existing `appointments`
- 30-minute intervals

**Step 5: Payment + Confirmation**
- Payment timing: "Pay Now" or "Pay at Salon"
- Tip selector: 15%, 20%, 25%, custom
- Price breakdown
- "Confirm & Pay" → insert into `appointments` table
- Call `send-booking-sms` edge function
- Show confirmation card

### 4. Appointments Management

**Customer View:**
- Two tabs: Upcoming / Past
- Each card: stylist name, service, date/time, status badge
- Actions: Cancel (with 24h warning), Reschedule, Confirm attendance
- Post-appointment: Feedback form (sentiment + issue type + text)
- After feedback: Enhanced review form (star rating + aspect ratings + comment)

**Stylist View:**
- Three segments: Today / This Week / Upcoming
- Customer info card with photos (if shared)
- AI-generated stylist instructions (call `generate-stylist-instructions`)
- Actions: Mark Complete, No Show
- No Show → insert into `customer_no_shows`

### 5. Messaging

- Real-time chat between customer and stylist (linked by appointment)
- Uses `messages` table with Supabase Realtime subscription
- `supabase.channel('messages').on('postgres_changes', ...)` 
- Support text messages and image messages (`is_image`, `image_url`)
- Mark as read: update `read_at` when receiver views

**Realtime setup**: `messages` table is added to `supabase_realtime` publication.

### 6. Stylist Onboarding (5 steps)

1. **Profile Basics**: name, business name, address, photo upload, geolocation
2. **Experience**: years, bio (with AI suggestion), specialties, certifications
3. **Availability**: 7-day weekly schedule with start/end times + toggle
4. **Portfolio**: Upload up to 10 photos with tags (style_type, hair_type)
5. **Payout**: Stripe Connect integration (placeholder in current web app)

Progress saved to `stylists.onboarding_step`. On completion: set `onboarding_completed = true`.

### 7. Waitlist

- When no time slots available, show "Join Waitlist" button
- Form: preferred date, optional time range
- Insert into `waitlist` table
- When a slot opens (appointment cancelled), `check-waitlist` function auto-notifies

### 8. Reviews & Ratings

- Public read access on `reviews`
- Customer can create review only for completed appointments
- Star rating (1-5) + comment
- Google review import via `import-google-reviews` edge function
- Stylist average rating auto-calculated and stored in `stylists.rating`

### 9. Language Switching

- Supported: English (en), Spanish (es), Portuguese (pt)
- Store preference in `customers.language_preference` or `stylists.language_preference`
- iOS: Use `Localizable.xcstrings` with the keys from the i18n section below

### 10. Notifications (iOS-specific)

- Replace web push with APNs
- Register for remote notifications on app launch
- Store device token → consider new migration: `ios_push_tokens(id, user_id, device_token, created_at)`
- Or extend `push_subscriptions` with a `platform` field and `device_token` column
- For appointment reminders: use the existing `send-push-notification` edge function pattern but adapt for APNs delivery

---

## i18n Key Reference

Full English keys are in the web app's `src/i18n/locales/en.json`. Here are the key groups for iOS `Localizable.xcstrings`:

### Common
```
common.loading = "Loading..."
common.save = "Save"
common.cancel = "Cancel"
common.confirm = "Confirm"
common.delete = "Delete"
common.edit = "Edit"
common.back = "Back"
common.next = "Next"
common.done = "Done"
common.email = "Email"
common.password = "Password"
common.phone = "Phone"
common.name = "Name"
common.search = "Search"
common.close = "Close"
common.submit = "Submit"
common.continue = "Continue"
common.tryAgain = "Try Again"
common.noResults = "No results found"
common.error = "Error"
common.success = "Success"
common.saving = "Saving..."
common.selected = "Selected"
common.total = "total"
```

### Auth
```
auth.welcome = "Welcome to StyleMatch"
auth.signIn = "Sign In"
auth.signUp = "Sign Up"
auth.signOut = "Sign Out"
auth.continueWithGoogle = "Continue with Google"
auth.orContinueWithEmail = "Or continue with email"
auth.forgotPassword = "Forgot your password?"
auth.customer = "Customer"
auth.stylist = "Stylist"
```

### Navigation
```
navigation.home = "Home"
navigation.profile = "Profile"
navigation.style = "Style"
navigation.booking = "Booking"
navigation.appointments = "Appointments"
navigation.services = "Services"
navigation.payments = "Payments"
navigation.messages = "Messages"
```

### Customer Profile
```
customer.profile.title = "Your Profile"
customer.profile.createProfile = "Create Your Profile"
customer.profile.editProfile = "Edit Your Profile"
customer.profile.personalInfo = "Personal Information"
customer.profile.gender = "Gender"
customer.profile.age = "Age"
customer.profile.male = "Male"
customer.profile.female = "Female"
customer.profile.other = "Other"
customer.profile.saveChanges = "Save Changes"
customer.profile.shareAiStyles = "Share AI Styles with Stylist"
```

### Customer Style (AI Generation)
```
customerStyle.title = "Preview Your New Look"
customerStyle.styleCategory = "Style Category"
customerStyle.describeStyle = "Describe Your Style"
customerStyle.stylePlaceholder = "E.g., Short fade on sides, textured on top..."
customerStyle.generatePreview = "Generate Preview"
customerStyle.generating = "Generating (%d%%)"
customerStyle.stylesGenerated = "Styles generated!"
customerStyle.approve = "Approve"
customerStyle.back = "Back"
```

### Booking
```
customer.booking.title = "Find a Stylist"
customer.booking.availableStylists = "Available Stylists"
customer.booking.maxDistance = "Max Distance"
customer.booking.anyDistance = "Any distance"
customer.booking.selectStylist = "Select Stylist"
customer.booking.distance = "%@ km away"
booking.selectDate = "Select Date"
booking.selectTime = "Select Time"
booking.confirmBooking = "Confirm Booking"
booking.payNow = "Pay Now"
booking.payLater = "Pay at Salon"
booking.total = "Total"
```

### Appointments
```
customer.appointments.title = "Your Appointments"
customer.appointments.upcoming = "Upcoming"
customer.appointments.past = "Past"
customer.appointments.cancel = "Cancel Appointment"
customer.appointments.reschedule = "Reschedule"
customer.appointments.confirmAttendance = "Yes, I'm Coming!"
```

### Stylist
```
stylist.home.welcome = "Welcome!"
stylist.services.title = "Your Services"
stylist.services.addService = "Add Service"
stylist.appointments.title = "Appointments"
stylist.appointments.markComplete = "Mark as Complete"
stylist.appointments.noShow = "No Show"
stylist.payments.title = "Payments"
stylist.payments.earnings = "Earnings"
stylist.instructions.title = "Professional Instructions"
stylist.instructions.generate = "Generate Instructions"
```

### Photo Capture
```
photoCapture.step = "Step %d of %d"
photoCapture.takePhoto = "Take Photo"
photoCapture.upload = "Upload"
photoCapture.retake = "Retake"
photoCapture.goodLighting = "Good lighting"
photoCapture.faceVisible = "Face visible"
photoCapture.inFocus = "In focus"
photoCapture.guides.front.label = "Front View"
photoCapture.guides.front.instruction = "Face the camera directly"
photoCapture.guides.left.label = "Left Side"
photoCapture.guides.right.label = "Right Side"
photoCapture.guides.back.label = "Back View"
photoCapture.guides.top.label = "Top View"
```

### Feedback & Reviews
```
feedback.title = "How was your appointment?"
feedback.great = "Great"
feedback.good = "Good"
feedback.okay = "Okay"
feedback.poor = "Poor"
review.leaveReview = "Leave a Review"
review.yourRating = "Your Rating"
review.submit = "Submit Review"
```

### Messaging
```
messaging.title = "Messages"
messaging.sendMessage = "Send a message"
messaging.typeMessage = "Type a message..."
messaging.noMessages = "No messages yet"
```

Spanish and Portuguese translations follow the same key structure. Refer to `src/i18n/locales/es.json` and `src/i18n/locales/pt.json` in the web codebase for exact translations.
