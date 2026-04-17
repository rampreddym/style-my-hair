# Build HairHalo iOS Locally on Your Mac

> This is the single entry-point guide for porting the HairHalo web app to a native SwiftUI iOS app on your Mac. Lovable cannot create `.xcodeproj` files — that step has to happen locally. Everything else (specs, schemas, edge functions, design tokens) is already documented.

---

## 0. Prerequisites (one-time, on your Mac)

| Tool | Version | Install |
|---|---|---|
| macOS | 14 Sonoma+ | — |
| Xcode | 15.3+ | Mac App Store |
| Xcode Command Line Tools | latest | `xcode-select --install` |
| Apple ID | free is fine | needed for simulator |
| Apple Developer account | $99/yr | only for device + App Store |

**Optional but recommended:**
- [Claude Code](https://claude.ai/code) or Cursor — point it at the spec files below and it will scaffold most of the app for you.
- [SF Symbols app](https://developer.apple.com/sf-symbols/) — for icon picking.

---

## 1. Read the specs in this order

All specs live at the project root. Open them in this order before writing any Swift:

1. **`CLAUDE.md`** — project identity, Supabase keys, design tokens, file structure, navigation map
2. **`FEATURES_IOS.md`** — full schema, models, edge functions, RLS rules, i18n keys (~27 KB)
3. **`CLAUDE_DELTA.md`** — list of services/components still to build (storage, edge fn calls, photo capture, before/after slider, realtime, etc.)
4. **`PROMPT.md` + `PROMPT_DELTA.md`** — original product prompts, useful for understanding *why* a feature exists

If you're using Claude Code/Cursor: drop all five files into context as the very first message, then ask it to scaffold step-by-step from section 3 below.

---

## 2. Create the Xcode project

```bash
# On your Mac, in your code folder:
mkdir HairHalo && cd HairHalo
```

In Xcode:
1. **File → New → Project → iOS → App**
2. Product Name: `HairHalo`
3. Team: your Apple ID
4. Organization Identifier: `com.hairhalo`
5. Bundle Identifier (auto): `com.hairhalo.app`
6. Interface: **SwiftUI**
7. Language: **Swift**
8. Storage: **None** (we use Supabase)
9. Include Tests: ✅
10. Save inside `HairHalo/` folder you created.

**Minimum deployment target:** iOS 17.0 (Project → General → Minimum Deployments).

---

## 3. Add Swift Package dependencies

File → Add Package Dependencies. Add each URL, leave version at "Up to Next Major":

| Purpose | URL |
|---|---|
| Supabase client | `https://github.com/supabase/supabase-swift` |
| Stripe iOS SDK | `https://github.com/stripe/stripe-ios` |
| Markdown rendering | `https://github.com/gonzalezreal/swift-markdown-ui` |
| Image caching | `https://github.com/kean/Nuke` |
| Map (Apple Maps native, no package needed) | — |

After adding, in your app target → **Frameworks, Libraries, and Embedded Content**, ensure each shows up.

---

## 4. Configure Info.plist permissions

Add these keys (Info → Custom iOS Target Properties → +):

```
NSCameraUsageDescription          = "HairHalo uses your camera to capture hair photos for AI styling."
NSPhotoLibraryUsageDescription    = "HairHalo accesses your photos so you can upload existing pictures."
NSLocationWhenInUseUsageDescription = "HairHalo uses your location to find nearby stylists."
NSContactsUsageDescription        = "Optional — used for sharing booking details."
```

For Google Sign-In redirect (URL scheme):
```
CFBundleURLTypes:
  - CFBundleURLSchemes: ["com.hairhalo.app"]
```

---

## 5. Build the file structure

Create folders matching `CLAUDE.md` § File Structure. Copy this exactly inside the Xcode group:

```
HairHalo/
├── App/
│   ├── HairHaloApp.swift
│   └── ContentView.swift
├── Models/                    # one file per Codable struct from FEATURES_IOS.md
├── Services/
│   ├── SupabaseService.swift
│   ├── AuthService.swift
│   ├── StorageService.swift       (CLAUDE_DELTA.md §1)
│   └── EdgeFunctionService.swift  (CLAUDE_DELTA.md §2)
├── ViewModels/
├── Views/
│   ├── Auth/
│   ├── Customer/
│   └── Stylist/
├── Components/
│   ├── BeforeAfterSlider.swift
│   ├── GuidedPhotoCaptureView.swift
│   └── MarkdownView.swift
├── Resources/
│   ├── Localizable.xcstrings
│   └── Assets.xcassets
└── Extensions/
    ├── Color+Theme.swift
    └── Date+Formatting.swift
```

---

## 6. Wire up Supabase (paste-ready)

`Services/SupabaseService.swift`:

```swift
import Foundation
import Supabase

final class SupabaseService {
    static let shared = SupabaseService()
    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: URL(string: "https://nkarycrvlmtuuyqzvyvt.supabase.co")!,
            supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYXJ5Y3J2bG10dXV5cXp2eXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTM0NDMsImV4cCI6MjA3OTA4OTQ0M30.Uab386Qr6ulFirqFslJRUjRMu832Pt_ZTwy0NBVIq7M"
        )
    }
}
```

That's it — you're now connected to the same backend the web app uses. Same users, same appointments, same everything.

---

## 7. Run it

1. Top of Xcode: pick simulator **iPhone 15 Pro**
2. ⌘R
3. First launch shows the auth screen → sign in with an existing test account from the web app

---

## 8. Build order (recommended)

Implement features in this order — each unlocks the next:

| Phase | Feature | Spec section |
|---|---|---|
| 1 | Auth (email + Google OAuth) | CLAUDE.md § Auth Flow |
| 2 | Role routing → TabView | CLAUDE.md § Navigation |
| 3 | Customer profile + 5 photo capture | CLAUDE_DELTA.md §3 |
| 4 | Stylist discovery + booking | FEATURES_IOS.md § Booking |
| 5 | Stripe payment | FEATURES_IOS.md § Payments |
| 6 | AI hairstyle generation | CLAUDE_DELTA.md §4 |
| 7 | Before/After slider | CLAUDE_DELTA.md §5 |
| 8 | Realtime messaging | CLAUDE_DELTA.md §6 |
| 9 | Stylist instructions (markdown) | CLAUDE_DELTA.md §8 |
| 10 | Waitlist + Google Places | CLAUDE_DELTA.md §9-10 |

---

## 9. Run on a physical iPhone

1. Plug iPhone into Mac via USB
2. Xcode → Window → Devices and Simulators → trust device
3. Project → Signing & Capabilities → select your Apple ID team
4. Pick your iPhone in the run target → ⌘R
5. On iPhone: Settings → General → VPN & Device Management → trust your dev cert

---

## 10. Ship to TestFlight

1. Apple Developer account ($99/yr)
2. Bundle ID `com.hairhalo.app` registered at developer.apple.com
3. App Store Connect → new app
4. Xcode → Product → Archive → Distribute → App Store Connect
5. Wait ~10 min for processing → invite testers

---

## Common pitfalls

| Symptom | Fix |
|---|---|
| `403` from Supabase queries | Check RLS policies in `FEATURES_IOS.md` — iOS uses the anon key, same rules as web |
| Google OAuth doesn't redirect back | URL scheme in Info.plist must match exactly (`com.hairhalo.app`) |
| Camera permission denied silently | `NSCameraUsageDescription` missing from Info.plist |
| Edge function returns 401 | Pass auth token: `try await SupabaseService.shared.client.functions.invoke(...)` automatically attaches it when user is signed in |
| Stripe sheet doesn't appear | Stripe iOS SDK requires `STPAPIClient.shared.publishableKey = "..."` in `HairHaloApp.init()` |

---

## What Lovable can still do for you

Even though the Xcode build happens on your Mac, this Lovable project is your **source of truth** for:
- Backend (Supabase tables, RLS, edge functions) — shared with iOS
- Spec maintenance — ask Lovable to update `FEATURES_IOS.md` when you add new web features
- Marketing site — `hair-halo-hubs.lovable.app` stays the public landing page

Ask Lovable things like:
- *"Add a `cancellation_reason` column to appointments and update FEATURES_IOS.md"*
- *"Write the Swift Codable struct for the new `customer_preferences` table"*
- *"Generate the SwiftUI code for the BeforeAfterSlider component"*

You can paste generated Swift snippets directly into your Xcode project.
