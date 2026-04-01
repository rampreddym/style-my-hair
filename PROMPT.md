# PROMPT.md — One-Shot Build Prompt for Claude Code

Copy everything below the line and paste it as your prompt to Claude Code.

---

You are building a native iOS app called **HairHalo** using SwiftUI (iOS 17+, Swift 6). The app connects to an existing Supabase backend that is already fully configured with tables, RLS policies, edge functions, and storage.

## Instructions

1. Read `CLAUDE.md` for project config, design system, and file structure.
2. Read `FEATURES_IOS.md` for complete database schemas, Swift Codable models, edge function request/response specs, RLS policies, storage patterns, feature details, and i18n keys.
3. Build the complete app following the phases below.
4. Use the Supabase Swift SDK v2+ (`https://github.com/supabase/supabase-swift`).
5. Match the dark-theme design system exactly (HSL colors from CLAUDE.md).
6. All database queries go through the Supabase client with the user's auth session — RLS handles access control.
7. Edge functions are called via `supabase.functions.invoke()`.

## Build Phases

### Phase 1: Foundation
- Create Xcode project with SwiftUI lifecycle
- Add Supabase Swift SDK via SPM
- Create `SupabaseService.swift` singleton with URL + anon key from CLAUDE.md
- Create ALL Codable model structs from FEATURES_IOS.md (copy them directly)
- Create `Color+Theme.swift` extension with all design system colors
- Create `AuthService.swift` with: signUp (email+password+role), signIn, signInWithGoogle, signOut, fetchUserRole, onAuthStateChange listener

### Phase 2: Auth & Routing
- Create `AuthView` with sign-in/sign-up toggle, role picker (Customer/Stylist), email+password fields, Google OAuth button
- Create `ContentView` that checks auth state → show AuthView or TabView
- Route to CustomerTabView or StylistTabView based on role from `user_roles` table
- Implement password reset flow (send link + update password)

### Phase 3: Customer — Profile & Photos
- Create `CustomerProfileView` with form: name, email, phone, gender picker, age, style description
- Implement `GuidedPhotoCaptureView`: 5-step camera/gallery flow (front/left/right/back/top)
- Create `StorageService.swift` for uploading to `user-photos` bucket with path convention from FEATURES_IOS.md
- On photo capture: upload to storage → get public URL → delete existing DB row for that type → insert new row into `customer_photos`
- Show photo thumbnails in 5-column grid with delete buttons
- Save profile: upsert `customers` table, ensure `user_id = auth.uid()`
- Include toggle for `share_ai_styles_with_stylist`

### Phase 4: Customer — AI Style Generation
- Create `StyleGeneratorView` with:
  - Style category picker (chips from `hair_styles` table, filtered by customer gender)
  - Text description input
  - "Generate Preview" button
- Call `generate-hairstyle` edge function with front photo URL + combined prompt
- Show animated loading state: spinning indicator, progress bar, stage messages, rotating tips
- On success: parse base64 image data from `variations` array
- Save each to `customer_generated_styles` table
- Display as horizontal scrollable thumbnails with selection ring
- Build `BeforeAfterSlider` component: draggable divider between original photo and selected generated style
- "Approve" → navigate to booking

### Phase 5: Customer — Booking Flow
- Create `StylistDiscoveryView`:
  - Fetch from `stylists_public` view
  - Join `stylist_services` to compute `startingPrice` (min price) per stylist
  - Distance slider (5-200km or "Any")
  - Sort options: rating, distance, price
  - Stylist cards with: photo, name, rating stars, review count, distance badge, starting price, specialties tags
- Create `StylistProfileSheet`:
  - Portfolio photo gallery (from `stylist_portfolio`)
  - Services list with prices
  - Reviews section (from `reviews`)
  - "Book Now" button
- Create `ServiceSelectionView`: multi-select services with running cart total
- Create `TimeSlotPickerView`:
  - Calendar date picker
  - Generate available slots from `stylist_availability` minus booked `appointments`
  - 30-min intervals
- Create `BookingConfirmationView`:
  - Payment timing selector (Pay Now / Pay at Salon)
  - Tip selector (15/20/25/custom %)
  - Price breakdown: subtotal, platform fee, tip, total
  - "Confirm & Pay" → insert appointment → call `send-booking-sms`
  - Show success confirmation

### Phase 6: Customer — Appointments & Feedback
- Create `AppointmentsListView` with Upcoming/Past segmented control
- Appointment cards: stylist name, service, date/time, status badge (color-coded)
- Cancel flow: alert with 24h warning if <24h → update status to "cancelled" → call `check-waitlist`
- Reschedule flow: new date/time picker → update appointment
- Confirm attendance: update `customer_confirmed_at`
- Create `PostFeedbackView`: emoji sentiment picker, issue type chips, optional text
- Create `EnhancedReviewView`: star rating (1-5), aspect ratings (technique/communication/cleanliness/value), comment text, submit to `reviews` table
- Create `MessagingView`: real-time chat using Supabase Realtime channel on `messages` table

### Phase 7: Stylist Side
- Create `StylistHomeView`: onboarding progress checklist (profile → services → bookings)
- Create `StylistOnboardingView` with 5 steps (use `StepProgressView`):
  1. Profile basics (name, business, address, photo upload, geolocation)
  2. Experience (years, bio with AI suggest, specialties, certifications)
  3. Availability (7-day schedule with time pickers + available toggle)
  4. Portfolio (photo upload grid with tags)
  5. Payout (Stripe Connect placeholder)
- Create `StylistServicesView`: CRUD services (name, price, duration, description)
- Create `StylistAppointmentsView`: Today/This Week/Upcoming segments
  - Customer info with shared photos
  - Generate AI instructions button → call `generate-stylist-instructions` → display markdown
  - Mark Complete / No Show actions
- Create `StylistPaymentsView`: earnings overview, Stripe status card
- Create `StylistProfileEditView`: edit bio, specialties, portfolio, address

## Critical Implementation Notes

1. **Base64 Image Handling**: The `generate-hairstyle` function returns `data:image/png;base64,...` strings. Strip the prefix, decode to `Data`, create `UIImage`. Store the full data URL string in `generated_image_url` column.

2. **Realtime Messages**: Subscribe to postgres changes on the `messages` table filtered by `to_user_id = currentUserId OR from_user_id = currentUserId`.

3. **iOS Push Notifications**: The web app uses Web Push (VAPID). For iOS, implement APNs:
   - Request notification permission on launch
   - Register for remote notifications
   - Store device token (create a migration or reuse push_subscriptions with platform field)
   - The `send-push-notification` edge function would need an APNs adapter (out of scope for v1 — use local notifications as fallback)

4. **Geolocation**: Use CoreLocation to get user coordinates. Store in `customers.latitude/longitude` or `stylists.latitude/longitude`.

5. **Haversine Distance**: Calculate stylist distance client-side:
   ```swift
   func haversineDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double) -> Double {
       let R = 6371.0 // Earth radius km
       let dLat = (lat2 - lat1) * .pi / 180
       let dLon = (lon2 - lon1) * .pi / 180
       let a = sin(dLat/2) * sin(dLat/2) + cos(lat1 * .pi / 180) * cos(lat2 * .pi / 180) * sin(dLon/2) * sin(dLon/2)
       return R * 2 * atan2(sqrt(a), sqrt(1-a))
   }
   ```

6. **Date Handling**: All dates from Supabase are ISO 8601 strings. Use `ISO8601DateFormatter` or a custom `JSONDecoder.dateDecodingStrategy`.

7. **Error Handling**: Every Supabase call should handle errors gracefully with user-visible alerts. RLS violations return empty results or 403 — show appropriate "access denied" or "please sign in" messages.

8. **Localization**: Create `Localizable.xcstrings` with all keys from FEATURES_IOS.md i18n section. Support en/es/pt. The app should respect the user's `language_preference` stored in their profile.

Build all phases sequentially. Each phase should compile and run before moving to the next. Prioritize working functionality over pixel-perfect UI — the design system colors and glassmorphism can be refined after core features work.
