# Mirra Redesign: "Luxe Editorial" in Rose Quartz

Goal: every screen in the customer and stylist app looks sleek, and a first-time user knows what to do within 3 seconds. Every feature and flow stays as it is. Only the look, the layout and the wording change.

## Locked visual choices
- **Palette (Rose Quartz, light-first):** background #fbf5f3, surface #ffffff, ink #2b1a24, primary plum #8a3b5f, accent blush #d9a79a. AI output gets its own soft blush tint and always carries an "AI preview" label.
- **Type:** DM Serif Display for headings (italic for the person's name, as in "Welcome, *Ram*"). Fira Sans for everything else. Small uppercase letter-spaced labels mark each section ("MIRRA HOME", "NEAR YOU").
- **Layout:** photo-led feed, with the structure taken from the Luxe editorial direction you picked.

## Structure applied to every screen
```text
[small caps label]            [avatar]
Serif title, italic name
---------------------------------------
Spotlight photo card + frosted caption   <- the one thing to do next
[Primary action tile] [Plum action tile]  <- the two most common tasks
SECTION LABEL
Horizontal photo row / vertical feed
---------------------------------------
      ( floating dark pill dock )
```
- **Floating pill dock** replaces the bottom bar. The active tab shows as a white circle, and each icon gets a short text label so new users can find their way.
- One primary button per screen. Secondary actions sit in tiles or behind a "More" link.
- Plain wording everywhere: "Book a stylist", "Try a look", "Your next visit".

## Screens
**Customer**
1. Home: the spotlight shows your next appointment, or "Find your stylist" if you have none. Tiles for Book and Try a look (AI). Rows for Near you (stylist photos, rating, starting price, next free time) and Book again.
2. Style: step indicator (1 Photo, 2 Pick a look, 3 Preview). Large before/after view, labelled AI.
3. Book: a photo feed of stylists with filter chips at the top. The stylist sheet shows photos first, then services and prices, then times.
4. Booking details and payment: a single scrolling summary with a clear total and a sticky "Confirm & pay" button.
5. Appointments: a spotlight card for the next visit, then a list of past visits with "Book again".
6. Profile: grouped settings list with photo capture shown as a progress row.

**Stylist**
1. Today: the spotlight shows your next client. Tiles for "Add availability" and "Earnings". A timeline of today's appointments. Onboarding shows as a simple checklist until it's done.
2. Appointments, Services, Payments, Profile: same header style, feed cards and pill dock.

**Auth and first run**
- Split welcome: a full photo with a serif headline, a role choice ("I'm booking" / "I'm a stylist"), then sign in.
- A 3-card intro for new users (Discover, Preview with AI, Book in seconds). You can skip it, and it only shows once.

## Usability additions
- Friendly empty states on every list, each with one clear action.
- Skeleton loaders shaped like the real cards.
- Tap targets of at least 44px, visible focus rings, pinch zoom kept on, readable text contrast.

## Technical details
- Replace the Studio Noir tokens in `src/index.css` and `tailwind.config.ts` with Rose Quartz HSL tokens. Make light the default and remove the forced `.dark` from `index.html`. Load DM Serif Display and Fira Sans.
- Update `AGENTS.md` so Rose Quartz Luxe Editorial is the visual system, and update the design-system memory.
- New shared pieces: `PageHeader` (label, serif title, avatar), `SpotlightCard`, `ActionTile`, `SectionLabel`, `PhotoRail`, `PillDock` (this replaces both bottom navigations), `EmptyState`, `OnboardingIntro`.
- Restyle the shadcn button, card, badge, input and sheet variants: 24px card radius, 32px tiles, pill buttons.
- Refactor each customer and stylist page to use the shared pieces. Queries and logic stay unchanged.
- Check signed-in customer and stylist tours in the browser at 393px width.
