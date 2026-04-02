# AI Hair Styling Marketplace - Complete Feature Documentation

A dual-sided marketplace connecting customers with local hair stylists, powered by AI-driven hairstyle visualization.

---

## 👤 Customer Features

### 1. Account & Authentication
- **Google OAuth Integration** - One-tap sign-in with automatic name/email import
- **Email/Password Authentication** - Traditional signup with auto-confirm
- **Role-Based Access** - Automatic routing based on customer/stylist role
- **Secure Password Recovery** - Reset password flow with email verification
- **Session Persistence** - Stay logged in across browser sessions

### 2. Profile Management
- **Personal Information** - Name, gender, age, email, phone
- **Location Services** - Automatic geolocation for stylist matching
- **5-Angle Photo Capture** - Guided camera capture (front, left, right, back, top)
- **Gallery Upload Support** - Alternative to camera for photo uploads
- **Haptic Feedback** - Native-feel vibrations on mobile during photo capture
- **Privacy Toggle** - Control whether AI-generated styles are shared with stylists
- **Language Preference** - Choose between English, Spanish, or Portuguese

### 3. AI Hairstyle Visualization
- **AI Style Generation** - Upload photo + describe desired style for realistic preview
- **Gemini 2.5 Flash Powered** - High-quality image generation via Lovable AI Gateway
- **Before/After Comparison Slider** - Interactive comparison of original vs. generated
- **Multiple Style Variations** - Generate and browse multiple style options
- **Thumbnail Carousel** - Easy selection from generated styles
- **Style Categories** - 20+ curated hairstyles (Fade, Pixie, Bob, Braids, etc.)
- **Gender-Specific Options** - Styles tagged for Men's, Women's, or Unisex
- **Real-Time Progress** - Loading indicators with tips during generation

### 4. Stylist Discovery
- **Location-Based Search** - Find stylists near you
- **Distance Filter Slider** - Adjustable range (1-50 miles)
- **Verified Badges** - Trust indicators for vetted stylists
- **Proficiency Levels** - Experience-based ratings
- **Portfolio Browsing** - View stylist's past work with hair type filters
- **Rating & Reviews Display** - Star ratings and review counts
- **Quick Messaging** - Initiate chat directly from stylist card
- **Enhanced Stylist Cards** - Tactile feedback on selection

### 5. Booking System
- **Calendar-Based Scheduling** - Visual date picker
- **Service Selection** - Browse available services with prices and durations
- **Duration-Aware Time Slots** - Slots generated based on service length
- **Stylist Availability Integration** - Only shows available times
- **Payment Flexibility** - Choose "Pay Now" or "Pay After Service"
- **Itemized Price Breakdown** - Service cost + platform fees + optional tip
- **Booking Confirmation** - Visual confirmation with all details
- **Calendar Integration Ready** - Add to calendar functionality

### 6. Waitlist System
- **Join Waitlist** - Sign up when preferred slots are unavailable
- **Preferred Date Selection** - Specify desired appointment date
- **Optional Time Range** - Narrow down preferred hours
- **Automatic Notifications** - Push alerts when slots open
- **Cancellation Triggers** - Waitlist checked when appointments cancel

### 7. Appointment Management
- **Upcoming/Past Tabs** - Organized appointment views
- **Pull-to-Refresh** - Swipe down to update data
- **Check-In Confirmation** - Confirm arrival for appointments
- **Status Indicators** - Visual badges (upcoming, soon, completed, cancelled)
- **Reschedule Option** - Change appointment date/time
- **Cancellation Flow** - Cancel with 24-hour warning system
- **Direct Stylist Messaging** - Chat with stylist about appointment

### 8. Push Notifications
- **Appointment Reminders** - Automated alerts 1-2 hours before
- **Waitlist Alerts** - Notified when slots become available
- **Web Push API** - Works on mobile and desktop browsers
- **VAPID Key Security** - Encrypted push subscriptions
- **Opt-In Control** - Enable/disable in settings
- **Test Notification** - Verify setup works correctly

### 9. Feedback & Reviews
- **Post-Appointment Feedback** - Prompted after service completion
- **Sentiment Selection** - Quick positive/neutral/negative choice
- **Star Rating System** - Overall 1-5 star rating
- **Aspect-Based Ratings** - Rate technique, communication, cleanliness, value
- **Written Comments** - Detailed text feedback
- **Before/After Photo Upload** - Share results with review
- **Issue Reporting** - Flag problems for resolution
- **Would Recommend/Rebook** - Quick binary feedback options

### 10. In-App Messaging
- **Real-Time Chat** - Instant messaging with stylists
- **Image Sharing** - Send photos in conversation
- **Appointment-Linked** - Messages connected to bookings
- **Message History** - View past conversations
- **Unread Indicators** - Know when new messages arrive

---

## 💇 Stylist Features

### 1. Account & Authentication
- **Google OAuth Integration** - One-tap sign-in with automatic name/email import
- **Email/Password Authentication** - Traditional signup with auto-confirm
- **Role-Based Access** - Automatic routing to stylist dashboard
- **Secure Password Recovery** - Reset password flow with email verification

### 2. 5-Step Onboarding Wizard
**Step 1 - Profile Basics:**
- Name, email, phone input
- Business name (optional)
- Profile photo upload with storage
- Bio/description text

**Step 2 - Experience & Certifications:**
- Years of experience
- Certifications list
- Specialties selection (AI-suggested based on bio)
- Skills and expertise tags

**Step 3 - Portfolio:**
- Multiple photo uploads
- Hair type tagging per image
- Style type categorization
- Description per portfolio item

**Step 4 - Availability:**
- Per-day schedule configuration
- Start/end time selection
- Toggle availability per day
- Weekly recurring schedule

**Step 5 - Payout Setup:**
- Stripe Connect integration
- Bank account linking (placeholder)
- Payout preferences

### 3. Service Management
- **Add Services** - Name, price, duration, description
- **Edit Services** - Modify existing offerings
- **Delete Services** - Remove discontinued services
- **Duration Configuration** - Set service length in minutes
- **Price Setting** - Custom pricing per service
- **Duplicate Prevention** - Prevents same-name services
- **Quick Add Suggestions** - Pre-defined service templates
- **Mobile-Optimized Inputs** - Touch-friendly form fields

### 4. Appointment Dashboard
- **Upcoming Appointments View** - See scheduled bookings
- **Past Appointments View** - Historical records
- **AI Style Preview** - See client's desired look before appointment
- **Quick Actions** - Confirm, cancel, mark complete buttons
- **Customer Information** - View client details
- **Client Hair History** - Access past appointments for same customer
- **Post-Service Notes** - Add notes after completing service
- **Pull-to-Refresh** - Swipe to update data

### 5. Client Communication
- **In-App Messaging** - Chat with customers
- **Image Sharing** - Send/receive photos
- **Appointment Context** - Messages linked to bookings
- **Real-Time Updates** - Instant message delivery
- **Message History** - Full conversation archive

### 6. Payments & Earnings
- **Stripe Connect Status** - View connection status
- **Earnings Overview** - Weekly, monthly, all-time totals
- **Fee Transparency** - Clear platform fee breakdown
- **Payout Management** - View payout schedule
- **Minimum Payout Threshold** - Understand payout rules

### 7. Profile Management
- **Edit Profile** - Update personal/business info
- **Photo Management** - Change profile picture
- **Location Settings** - Update address/coordinates
- **Specialties Management** - Add/remove expertise areas
- **Language Preference** - Choose English, Spanish, or Portuguese

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT Token-Based Auth** - Secure session management
- **Role-Based Access Control (RBAC)** - Customer/stylist role enforcement
- **Google OAuth 2.0** - Secure third-party authentication
- **Auto-Confirm Email** - Streamlined signup (configurable)
- **Password Reset Flow** - Secure recovery process

### Database Security
- **Row-Level Security (RLS)** - All tables protected
- **User-Specific Data Access** - Users only see their own data
- **Stylists Public View** - Sensitive data excluded from public queries
- **Foreign Key Constraints** - Data integrity enforcement

### API Security
- **Edge Function Authentication** - JWT verification required
- **Rate Limiting** - 5 requests/minute per user on sensitive endpoints
- **Input Validation** - Zod schema validation on all inputs
- **CORS Headers** - Proper cross-origin configuration
- **Service Role Separation** - Admin vs. user key separation

### Data Privacy
- **AI Style Sharing Toggle** - Customer controls stylist visibility
- **Sensitive Field Exclusion** - Email, phone, Stripe IDs hidden in public views
- **Secure File Storage** - User photos in protected buckets

---

## 📱 Mobile-First Experience

### Progressive Web App (PWA)
- **Service Worker** - Offline support and caching
- **Web App Manifest** - Installable on home screen
- **Mobile Web Capable** - Full-screen app experience
- **Theme Color Integration** - Native status bar styling
- **Apple Touch Icons** - iOS home screen support

### Touch-Optimized UI
- **44x44px Touch Targets** - Minimum size for all interactive elements
- **Bottom Navigation** - Thumb-friendly nav bars (customer & stylist variants)
- **Safe Area Padding** - Notched device support
- **Pull-to-Refresh** - Native gesture on list pages
- **No Tap Highlight** - Clean touch interactions
- **Active State Animations** - Visual feedback on press

### Capacitor Integration
- **Camera Access** - Native camera capture with web fallback
- **Haptic Feedback** - Vibration patterns for tactile response
  - Light impact for navigation
  - Medium impact for captures
  - Success/error patterns for outcomes
- **Graceful Degradation** - Works on web without Capacitor

### Responsive Design
- **Mobile-First CSS** - Designed for small screens first
- **Flexible Layouts** - Adapts to all screen sizes
- **Hidden Scrollbars** - Clean mobile appearance
- **Viewport Fit Cover** - Edge-to-edge display
- **Backdrop Blur Effects** - Modern glass morphism on navigation

---

## 🌐 Internationalization (i18n)

### Supported Languages
- **English (en)** - Default language
- **Spanish (es)** - Full translation
- **Portuguese (pt)** - Full translation

### Implementation
- **react-i18next** - Translation framework
- **Browser Detection** - Auto-detect user language
- **Language Persistence** - Saved to database per user
- **Cross-Device Sync** - Language follows user account
- **Language Switcher** - Available on auth page and in layouts
- **Full Coverage** - All UI text, labels, messages, and errors translated

---

## 🔔 Notification System

### Push Notifications
- **Web Push API** - Browser-based push notifications
- **VAPID Authentication** - Secure key-pair verification
- **Subscription Management** - Per-device subscription storage

### Notification Types
- **Appointment Reminders** - 1-2 hours before scheduled time
- **Waitlist Availability** - When slots open up
- **Booking Confirmations** - After successful booking
- **Cancellation Alerts** - When appointments are cancelled

### Configuration
- **Opt-In Flow** - User grants permission
- **Test Notification** - Verify setup in settings
- **Enable/Disable Toggle** - User control over notifications

---

## 🗄️ Database Architecture

### Core Tables
| Table | Purpose |
|-------|---------|
| `customers` | Customer profiles with location, preferences |
| `stylists` | Stylist profiles with credentials, ratings |
| `appointments` | Booking records with status, payment info |
| `stylist_services` | Service offerings with pricing, duration |
| `stylist_availability` | Weekly schedule configuration |
| `stylist_portfolio` | Portfolio images with tags |

### Supporting Tables
| Table | Purpose |
|-------|---------|
| `user_roles` | RBAC role assignments |
| `customer_photos` | Multi-angle hair photos |
| `customer_generated_styles` | AI-generated style previews |
| `reviews` | Customer feedback and ratings |
| `messages` | In-app chat messages |
| `waitlist` | Waitlist entries with preferences |
| `push_subscriptions` | Push notification subscriptions |
| `customer_no_shows` | No-show tracking with fees |
| `appointment_feedback` | Post-appointment sentiment |
| `hair_styles` | Available style catalog |

### Database Views
| View | Purpose |
|------|---------|
| `stylists_public` | Safe stylist data for public access (excludes email, phone, Stripe IDs) |

### Database Functions
| Function | Purpose |
|----------|---------|
| `get_user_role(uuid)` | Returns user's role |
| `has_role(uuid, role)` | Checks if user has specific role |
| `update_updated_at_column()` | Trigger for timestamp updates |

---

## 🚀 Edge Functions

| Function | Purpose | Security |
|----------|---------|----------|
| `generate-hairstyle` | AI image generation via Lovable AI Gateway | JWT auth |
| `get-vapid-key` | Retrieve public VAPID key for push setup | Public |
| `send-push-notification` | Deliver push notifications to subscribers | Service role |
| `check-waitlist` | Match waitlist entries when slots open | JWT auth + rate limiting |

---

## 📊 Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 18 with TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS with custom design tokens |
| UI Components | shadcn/ui (Radix primitives) |
| State Management | React Query (TanStack) |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod validation |
| Backend | Supabase (Lovable Cloud) |
| Database | PostgreSQL with RLS |
| Auth | Supabase Auth (Email + Google OAuth) |
| Storage | Supabase Storage |
| Serverless | Deno Edge Functions |
| AI | Lovable AI Gateway (Gemini 2.5 Flash) |
| Push | Web Push API with VAPID |
| i18n | react-i18next |
| Mobile | Capacitor (Camera, Haptics) |
| Animations | Tailwind Animate |
| Charts | Recharts |
| Date Handling | date-fns |
| Carousels | Embla Carousel |

---

## 🎯 Value Propositions

**For Customers:**
> "See your new look before you book"

**For Stylists:**
> "Know exactly what your client wants"

**For the Platform:**
> "Reducing miscommunication, increasing satisfaction"

---

## 📣 Marketing & Growth

### Pre-Launch Landing Page
- **Waitlist Signup** — Email capture at `/launch` with automatic referral code generation
- **Referral Tracking** — Unique referral codes per signup, `?ref=CODE` URL parameter
- **Referral Incentives** — "Refer 3 friends → skip the line + free first booking"
- **Database Table** — `launch_waitlist` with email, name, referral_code, referred_by, referral_count
- **Auto-Increment Trigger** — `increment_referral_count()` fires on signup to update referrer's count

### Social Media Marketing Automation
- **Full System Prompt** — See `MARKETING_SYSTEM.md` for the complete AI-driven content generation engine
- **Content Pillars** — 7-day rotation: Motivation, Transformation, Education, Community, Fun, Lifestyle, Storytelling
- **Platform Templates** — Ready-to-use prompts for Instagram (carousel, reel, story), TikTok, Twitter/X, LinkedIn, Reddit
- **Ad Copy Generator** — 4-angle variations (pain point, social proof, FOMO, empowerment) per campaign
- **Multilingual Strategy** — EN/ES/PT content generation with cultural adaptation
- **Campaign Playbooks** — Product launch, viral challenge (#HairHaloChallenge), stylist recruitment
- **Analytics Framework** — KPI targets, UTM conventions, weekly metrics tracking
- **Brand Voice Rules** — Approved vocabulary, banned words, tone guidelines, hashtag strategy
- **Downloadable Kit** — `HairHalo_Social_Media_Kit.pdf` with 15 post templates, 4 ad campaigns, 30-day calendar

### Automated Content Commands
Feed `MARKETING_SYSTEM.md` to any AI assistant and use these commands:
- "Generate a week of content" → 7 Instagram + 5 TikTok + 3 Twitter + 1 LinkedIn
- "Generate a campaign" → Full timeline, ad copy, influencer brief, KPIs
- "Generate ad variations" → 10 variants across pain-point, social-proof, FOMO angles
- "Generate monthly calendar" → 30-day table with daily posts, timing, ad spend

---

*This documentation provides a complete reference for all platform capabilities across customer, stylist, marketing, and technical domains.*
