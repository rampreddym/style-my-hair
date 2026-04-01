# CLAUDE_DELTA.md — Gap Features Configuration

> **IMPORTANT**: This file supplements the existing `CLAUDE.md`. Do NOT recreate or restructure the existing project. Only ADD the missing service layers and view logic described here.

## What Already Works (DO NOT TOUCH)
- Xcode project structure, SPM dependencies
- SupabaseService singleton + client initialization
- All Codable model structs
- AuthService (sign up/in/out, role fetch, Google OAuth)
- ContentView auth gate + TabView routing
- Color+Theme extension with design system
- Basic view shells for all Customer and Stylist tabs
- Basic CRUD for customer profiles, stylist profiles, services

## What Needs To Be Added (This Delta)
1. **StorageService** — Photo upload/delete to `user-photos` bucket
2. **EdgeFunctionService** — All 6 active edge function integrations
3. **Photo capture flow** — Camera/gallery → compress → upload → save DB row
4. **AI style generation** — Call edge function, parse base64, save, select
5. **Before/After slider** — Draggable comparison component
6. **Realtime messaging** — Supabase Realtime channel subscription
7. **Booking completion** — SMS notification on confirm
8. **Stylist instructions** — AI generation + markdown display
9. **Waitlist** — Join + auto-notification on cancellation
10. **Google Places** — Search + review import for stylists

## New Files To Create

```
Services/
├── StorageService.swift        # NEW — photo upload/delete
└── EdgeFunctionService.swift   # NEW — all edge function calls

Components/
├── BeforeAfterSlider.swift     # NEW — drag comparison UI
├── GuidedPhotoCaptureView.swift # NEW or UPDATE — full camera flow with upload
└── MarkdownView.swift          # NEW — render stylist instructions

ViewModels/
├── StyleGeneratorVM.swift      # UPDATE — add edge function call + base64 parsing
├── BookingVM.swift             # UPDATE — add SMS call on confirm
├── MessagingVM.swift           # NEW — realtime subscription
└── StylistAppointmentsVM.swift # UPDATE — add instructions generation
```

## Supabase Storage Rules Reminder
- Bucket: `user-photos` (public)
- Path: `{auth.uid()}/{category}/{timestamp}-{type}.jpeg`
- Categories: `customer-photos`, `stylist-photos`, `portfolio-photos`
- The bucket is public, so `getPublicURL` works without auth for reading
- Upload requires auth (RLS on storage)
