# CLAUDE.md — HairHalo iOS (SwiftUI)

> Lean config file. See `FEATURES_IOS.md` for schemas, models, edge functions, RLS, and i18n.

## Project Identity

- **App Name**: HairHalo (bundle: `com.hairhalo.app`)
- **Platform**: iOS 17+ · SwiftUI · Swift 6
- **Architecture**: MVVM + Repository pattern
- **Backend**: Supabase (shared with web app — same project, same data)

## Supabase Connection

```
URL:  https://nkarycrvlmtuuyqzvyvt.supabase.co
Anon: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYXJ5Y3J2bG10dXV5cXp2eXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTM0NDMsImV4cCI6MjA3OTA4OTQ0M30.Uab386Qr6ulFirqFslJRUjRMu832Pt_ZTwy0NBVIq7M
```

Add via SPM: `https://github.com/supabase/supabase-swift` (v2+).

## Design System

Dark-first theme. All colors in HSL:

| Token | HSL | Usage |
|---|---|---|
| background | 240 20% 6% | App background |
| card | 245 18% 11% | Card surfaces |
| primary | 328 85% 60% | Hot magenta — buttons, links, accents |
| secondary | 260 20% 15% | Secondary surfaces |
| accent | 185 100% 50% | Electric cyan — highlights, badges |
| destructive | 0 85% 58% | Errors, cancel actions |
| muted | 250 15% 18% | Disabled states, borders |
| muted-fg | 240 10% 55% | Placeholder text |

**Gradients:**
- Primary: `magenta(328°) → purple(280°)` at 135°
- Accent: `cyan(185°) → blue(220°)` at 135°
- Warm: `gold(35°) → magenta(328°)` at 135°

**Typography:** System font. Bold display headings. 1rem (16pt) corner radius default.

**Glassmorphism:** Cards use `.ultraThinMaterial` with subtle border. Shadows use primary color glow: `Color(hue:0.91, saturation:0.85, brightness:0.6).opacity(0.3)`.

## Navigation

Two separate `TabView` flows based on `user_roles.role`:

### Customer Tabs
1. **Profile** — `/customer` → photo capture, preferences
2. **Style** — `/customer/style` → AI hairstyle generation + before/after
3. **Booking** — `/customer/booking` → stylist discovery, service selection, time slots
4. **Appointments** — `/customer/appointments` → upcoming/past, cancel/reschedule

### Stylist Tabs
1. **Home** — `/stylist` → onboarding progress, quick actions
2. **Services** — `/stylist/services` → CRUD services with price/duration
3. **Appointments** — `/stylist/appointments` → today/upcoming, mark complete/no-show
4. **Payments** — `/stylist/payments` → earnings overview, Stripe status
5. **Profile** — `/stylist/profile` → portfolio, bio, specialties

## Auth Flow

1. Email+password sign-up with role selection (customer/stylist)
2. Google OAuth with `pending_role` stored in UserDefaults
3. On sign-up: insert into `user_roles` table
4. On sign-in: fetch role from `user_roles` → route to correct tab flow
5. Password reset via Supabase magic link

## Key Implementation Rules

1. **Never modify `auth.users` directly** — use `user_roles` for roles, `customers`/`stylists` for profiles
2. **Storage bucket**: `user-photos` (public). Path convention: `{user_id}/{category}/{timestamp}-{type}.{ext}`
3. **Edge functions**: Call via `supabase.functions.invoke("function-name", body:)` — NOT by URL path
4. **RLS enforced**: All tables have Row-Level Security. iOS gets 403 or empty results if rules violated. See FEATURES_IOS.md for full policy map.
5. **Localization**: Support en/es/pt. See FEATURES_IOS.md for complete key map.

## File Structure

```
HairHalo/
├── App/
│   ├── HairHaloApp.swift          # Entry point + Supabase init
│   └── ContentView.swift          # Auth gate → TabView router
├── Models/                        # Codable structs (see FEATURES_IOS.md)
├── Services/
│   ├── SupabaseService.swift      # Singleton client
│   ├── AuthService.swift          # Sign up/in/out + role fetch
│   ├── StorageService.swift       # Photo upload/delete to user-photos bucket
│   └── EdgeFunctionService.swift  # All edge function calls
├── ViewModels/
│   ├── AuthViewModel.swift
│   ├── CustomerProfileVM.swift
│   ├── StyleGeneratorVM.swift
│   ├── BookingVM.swift
│   ├── AppointmentsVM.swift
│   ├── StylistOnboardingVM.swift
│   ├── StylistServicesVM.swift
│   └── StylistPaymentsVM.swift
├── Views/
│   ├── Auth/
│   ├── Customer/
│   ├── Stylist/
│   └── Shared/
├── Components/                    # Reusable UI (cards, sliders, photo capture)
├── Resources/
│   ├── Localizable.xcstrings      # en/es/pt
│   └── Assets.xcassets
└── Extensions/
    ├── Color+Theme.swift          # Design system colors
    └── Date+Formatting.swift
```
