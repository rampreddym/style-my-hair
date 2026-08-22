# Rebuild the in-app look and feel: "Dusk Editorial"

Scope is everything behind the auth wall — the auth screen, all customer screens, all stylist screens, both bottom navs, and the shared component vocabulary. The public landing/booking marketing page is left alone.

## The problem with the current app

The app currently reads as generic AI output: near-black purple background, hot magenta primary, electric cyan accent, neon glow shadows on almost every surface, gradient text headings, glassmorphism everywhere, and system-font bold headings. Every screen uses the same three effects, so nothing has hierarchy and nothing feels like a brand.

The rebuild replaces that with a single committed identity.

## The new identity

**Palette — Dusk Editorial.** Deep plum-brown ground, warm blush as the primary action colour, sand as a secondary/premium tone, muted teal as the one cool accent. No neon, no magenta, no cyan, no rainbow gradients.

| Role | Colour |
|---|---|
| Background | `#231A1E` plum-brown |
| Surface / card | one step lighter than background, no glass blur |
| Primary | `#E8CFC6` blush (dark text on it) |
| Secondary / premium | `#D9C7A7` sand |
| Accent | `#3E6B67` muted teal (lifted for contrast on dark) |
| Text | warm off-white, with a genuinely muted second tier |

**Typography.** DM Serif Display for headings, Fira Sans for body and UI. Headings get real size jumps and tight leading so a screen has one obvious focal point. No gradient-filled text anywhere.

**Layout.** Card grid. Every list surface — stylists, hairstyles, services, appointments, payments — becomes a consistent, rhythmic card with the same radius, the same border, the same padding scale, and photography allowed to fill the frame. Flat cards with a hairline border and one soft shadow, not glass panels with glowing rims.

**Motion.** Quiet. Short fades and small scale on press. Removing the pulse-glow and shimmer-heavy treatments.

## What changes, screen by screen

**Design system**
- `src/index.css`: replace all colour tokens, gradients and shadow tokens with the new palette; delete the neon glow, glass-primary/accent, mirror-glaze, card-shine and pulse-glow utilities that define the current look; drop the radius from `1rem` to a tighter editorial value.
- `tailwind.config.ts`: add the two font families and the revised shadow/radius scale.
- `index.html`: load DM Serif Display and Fira Sans.

**Auth** (`src/pages/Auth.tsx`) — full-bleed editorial layout, serif wordmark, logo placed as a mark rather than a badge, blush primary button, restrained form fields.

**Customer** — `CustomerProfile`, `CustomerStyle`, `CustomerBooking`, `CustomerBookingDetails`, `CustomerAppointments`, `StylistProfile` re-laid on the card grid: photo-led stylist and hairstyle cards, serif section headings, appointment cards with clear status treatment in the new palette.

**Stylist** — `StylistHome`, `StylistServices`, `StylistAppointments`, `StylistPayments`, `StylistProfile`, `StylistOnboarding` on the same grid, with the stylist side reading slightly denser and more utilitarian (teal accent rather than blush) so the two roles feel distinct without being two design systems.

**Shared components** — bottom navs (both), stylist cards, service cart, price breakdown, time-slot picker, tip selector, dialogs and sheets, review and photo-capture components all re-skinned to the new tokens.

## Technical notes

- All colour work goes through HSL tokens in `index.css`; no hardcoded hex or `text-white`/`bg-black` in components. Approximate token values: background `333 15% 12%`, primary `16 43% 84%`, secondary `38 40% 75%`, accent `175 35% 45%`.
- The role-specific accent split is expressed as tokens (`--primary` for customer surfaces, `--accent` for stylist surfaces), not per-component overrides, so both navs and every card inherit it.
- Purely presentational change: no routing, data-fetching, RLS, edge function or business-logic edits. Booking rules, slot computation, waitlist and payment flows stay exactly as they are.
- The saved project design memory ("high-energy dark theme, hot magenta, electric cyan") is now obsolete and will be rewritten to the Dusk Editorial system.
- Contrast checked in both roles' surfaces; blush and sand carry dark foreground text.

## Sequence

1. Tokens, fonts, utility cleanup.
2. Shared components and both bottom navs.
3. Auth.
4. Customer screens.
5. Stylist screens.
6. Sweep for leftover magenta/cyan/glow classes.
