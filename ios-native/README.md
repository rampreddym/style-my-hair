# Mirra — native iOS (SwiftUI)

100% Swift / SwiftUI app sharing the same backend as the web app.

## Run it (Mac + Xcode 16)
1. `brew install xcodegen`
2. `cd ios-native && xcodegen` — creates `Mirra.xcodeproj`
3. Open `Mirra.xcodeproj`, pick your Team under Signing, press ⌘R.

## Stack
- iOS 17+, Swift 6, MVVM + repositories
- `supabase-swift` for auth, data, storage, functions
- Sign in with Apple (native, no browser) + email/password
- Stripe PaymentSheet for card payments (uses existing `create-payment-intent` / `confirm-payment` functions)

## Structure
```
Mirra/
  App/          entry point, role router
  Core/         Supabase client, theme, config
  Models/       Codable rows matching the database
  Services/     Auth, data repositories, storage, functions
  ViewModels/   one per screen
  Views/        Auth, Customer, Stylist, Shared
```

## Apple sign-in setup
In the Apple Developer portal enable "Sign in with Apple" for `com.hairhalo.app`
and add the bundle ID as an authorized client in the backend Apple provider settings.
