# PROMPT_DELTA.md — Gap Features Build Prompt

Copy everything below the line and paste it as your prompt to Claude Code.

---

## CRITICAL: DO NOT REBUILD THE APP

The HairHalo iOS app is already built and running. Auth, routing, basic views, models, and design system are all working. **Do NOT recreate the project, models, auth, or view structure.**

This prompt adds the **missing functional integrations** that are not yet working.

## Context Files
- `CLAUDE_DELTA.md` — Lists what exists vs what needs to be added
- `FEATURES_DELTA.md` — Contains complete Swift code for every missing feature

## What To Do

Read `FEATURES_DELTA.md` and integrate the following into the EXISTING codebase:

### Step 1: Create New Service Files
Create these two NEW files (they don't exist yet):

1. **`Services/StorageService.swift`** — Copy from FEATURES_DELTA.md §1
   - Photo upload to `user-photos` Supabase storage bucket
   - Photo deletion
   - Image compression
   - Path extraction from public URLs

2. **`Services/EdgeFunctionService.swift`** — Copy from FEATURES_DELTA.md §2
   - `generateHairstyle()` — calls `generate-hairstyle` edge function
   - `generateStylistInstructions()` — calls `generate-stylist-instructions`
   - `sendBookingSMS()` — calls `send-booking-sms`
   - `checkWaitlist()` — calls `check-waitlist`
   - `searchGooglePlaces()` — calls `search-google-places`
   - `importGoogleReviews()` — calls `import-google-reviews`
   - Also adds `GooglePlaceResult` model

### Step 2: Create New Components
Create these NEW component files:

3. **`Components/BeforeAfterSlider.swift`** — Copy from FEATURES_DELTA.md §5
   - Draggable before/after image comparison
   - Uses `Color.theme.primary` for handle accent

4. **`Components/MarkdownView.swift`** — Copy from FEATURES_DELTA.md §13
   - Renders markdown content (for AI-generated stylist instructions)
   - Optionally add MarkdownUI SPM package for richer rendering

### Step 3: Wire Up Photo Upload in Customer Profile
Update the existing `CustomerProfileVM` (or whichever ViewModel manages the profile):

5. Add methods from FEATURES_DELTA.md §3:
   - `uploadCustomerPhoto(photoType:image:)` — full flow: compress → upload to storage → delete old DB row → insert new row → update local state
   - `deleteCustomerPhoto(photoType:)` — delete from DB + storage
   - `loadCustomerPhotos()` — fetch existing photos from `customer_photos` table
6. Wire the `GuidedPhotoCaptureView` (or photo picker UI) to call `uploadCustomerPhoto` when a photo is captured/selected
7. On view appear, call `loadCustomerPhotos()` to restore previously saved photos

### Step 4: Wire Up AI Style Generation
Update the existing `StyleGeneratorVM`:

8. Replace any placeholder/mock logic with the real implementation from FEATURES_DELTA.md §4:
   - `loadHairStyles(gender:)` — fetch from `hair_styles` table
   - `loadExistingStyles(customerId:)` — fetch from `customer_generated_styles`
   - `generateStyles(customerId:frontPhotoUrl:)` — call edge function, parse base64 variations, save to DB
   - `selectStyle(styleId:customerId:)` — deselect all then select one
   - `imageFromBase64(_:)` — static helper to convert data URL → UIImage
9. In the Style view, use `BeforeAfterSlider` when both a before image (front photo) and after image (selected generated style) exist
10. Display generated styles as horizontal scrollable thumbnails with selection ring

### Step 5: Wire Up Booking Completion
Update the existing booking flow:

11. After inserting a new appointment into the `appointments` table, call `sendBookingNotifications()` from FEATURES_DELTA.md §7
12. This calls `send-booking-sms` to notify both customer and stylist via SMS
13. SMS failure should NOT block the booking — catch errors and log them

### Step 6: Wire Up Appointment Cancellation + Waitlist
Update the existing appointment management:

14. When cancelling an appointment, use `cancelAppointmentAndNotifyWaitlist()` from FEATURES_DELTA.md §8
15. This updates the appointment status AND triggers `check-waitlist` to auto-notify waiting customers
16. Add waitlist join flow from FEATURES_DELTA.md §11 — show "Join Waitlist" when no time slots are available

### Step 7: Wire Up Realtime Messaging
Create or update the messaging feature:

17. Create `ViewModels/MessagingVM.swift` from FEATURES_DELTA.md §6
18. It uses Supabase Realtime to subscribe to `postgres_changes` on the `messages` table
19. Supports: load history, subscribe to new messages, send messages, mark as read
20. Create a `MessagingView` that uses this VM with a standard chat bubble UI
21. Call `subscribeToMessages()` on appear, `unsubscribe()` on disappear

### Step 8: Wire Up Stylist Instructions
Update the stylist appointment detail view:

22. Add `generateInstructions()` from FEATURES_DELTA.md §9
23. Show a "Generate Instructions" button on appointment detail
24. On tap: call `generate-stylist-instructions` edge function with service name + customer context
25. Save result to `appointments.stylist_instructions`
26. Display using `MarkdownView` component
27. Add copy-to-clipboard button

### Step 9: Wire Up Stylist Photo Uploads
Update the stylist profile/onboarding:

28. Add profile photo upload from FEATURES_DELTA.md §10 — uploads to `stylist-photos` category, updates `stylists.photo_url`
29. Add portfolio photo upload — uploads to `portfolio-photos`, inserts into `stylist_portfolio` table with optional tags

### Step 10: Wire Up Google Places (Stylist Onboarding)
Update the stylist onboarding flow:

30. Add Google Places search from FEATURES_DELTA.md §12 — search for salon name, display results
31. Add Google Reviews import — import reviews from selected place, update `google_place_id`
32. Show imported review count confirmation

## Integration Notes

- **All edge functions** are called via `supabase.functions.invoke()` — never construct URLs manually
- **StorageService** uses the existing `SupabaseService.shared.client` — don't create a new Supabase client
- **Base64 images** from `generate-hairstyle` are `data:image/png;base64,...` strings — use `StyleGeneratorVM.imageFromBase64()` to convert to UIImage for display
- **Error handling**: Every async call should catch errors and surface them via `@Published var errorMessage` → display as an alert or toast in the view
- **Non-critical calls** (SMS, waitlist check) should NOT block the main flow — catch and log errors silently
- **Realtime**: Remember to unsubscribe from channels when views disappear to prevent memory leaks

## Verification Checklist

After implementing, verify each feature works:

- [ ] Customer can capture/upload photos → they persist after navigating away and returning
- [ ] Customer can generate AI hairstyle previews → base64 images display correctly
- [ ] Before/After slider works with drag gesture
- [ ] Selecting a generated style saves the selection to DB
- [ ] Booking an appointment sends SMS notifications (check console for errors)
- [ ] Cancelling an appointment triggers waitlist notification
- [ ] Messages send and receive in real-time between customer and stylist
- [ ] Stylist can generate AI instructions for an appointment
- [ ] Stylist can upload profile photo and portfolio photos
- [ ] Google Places search returns results in stylist onboarding
