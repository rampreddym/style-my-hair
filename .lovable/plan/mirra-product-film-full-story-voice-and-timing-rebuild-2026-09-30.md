# Mirra Product Film — Full Story, Voice, and Timing Rebuild

## Goal
Rebuild the entire 2–3 minute film so the new narration feels energetic, every visual action lands with the words being spoken, and the music remains consistent until a deliberate lift after the final question.

## Narration and credit control
- Use ElevenLabs voice `bfGb7JTLUnZebZRiFYyq` with an upbeat, confident, human delivery.
- Keep the final narration below 3,500 characters, leaving a safety margin within the remaining 4,000 ElevenLabs credits.
- Preserve the strongest story arc: salon disappointment → previewing the idea → sharing a clear stylist brief → booking and payment → reflective final question.
- Rewrite for shorter, more energetic sentences and intentional pauses, without formulaic or exaggerated language.
- Time the complete film locally using a scratch read first. Make only one final ElevenLabs narration request after the words and timing are locked.

## Narration for approval

How many times have you walked out of a salon, looked in the mirror, and thought… that is not what I asked for?

You brought a photo. You tried to explain the length, the shape, the color. But somewhere between your idea and the first cut, the picture changed.

That is why I built Mirra.

Meet Maya. She has an appointment in mind, but first, she wants to see the idea on herself.

She adds five private reference photos: front, left, right, back, and top. A single selfie can miss the details. These angles give Mirra a clearer starting point.

Now she describes the look in her own words: a polished, chin-length bob in rich dark brown, with soft, face-framing ends and a natural salon finish.

Mirra turns that idea into realistic options using Maya’s selected photo.

And here is where it gets exciting. She can choose her favorite, then drag across the image to compare before and after. No guessing. No trying to imagine how someone else’s haircut might look on her. She can explore it before anyone picks up the scissors.

Once Maya finds the right look, the image and her exact request stay with the booking. Her stylist can review them before the appointment and open a practical brief with the cut, color, and finish Maya is expecting.

Now they are starting from the same picture.

From there, Maya can compare stylists, browse their work, check ratings, distance, services, prices, and real availability. She chooses the stylist, the service, and the time without losing the look she already created.

At checkout, everything is clear before she confirms: the service total, tip, payment timing, and cancellation terms. Stripe handles the card payment securely, and Mirra keeps the payment status connected to the appointment for both Maya and her stylist.

The stylist sees more than a name on a calendar. They see the visual reference, the request, and the context they need to prepare.

Maya arrives knowing what she chose. Her stylist arrives knowing what she means.

So, how different would your next salon visit feel if you and your stylist walked in with the same picture in mind?

## Full visual rebuild
1. **Opening tension:** Fast, polished shots supporting the haircut-disappointment question and the communication problem.
2. **Meet Maya:** Introduce the synthetic customer and show the five reference angles exactly as they are mentioned.
3. **AI preview:** Show entering “polished chin-length bob with rich dark brown hair,” generating options, choosing one, and dragging the real before/after comparison in sync with each line.
4. **Stylist handoff:** Show the selected image, written request, and generated stylist instructions while narration explains the shared brief.
5. **Discovery and booking:** Match each spoken feature to the relevant screen—stylist comparison, services, prices, ratings, availability, and time selection.
6. **Stripe payment:** Show total, tip, payment timing, card confirmation, and the paid appointment status exactly when each is described.
7. **Closing payoff:** Return to the customer-and-stylist outcome, ask the final question, then leave a clean music-led ending with the Mirra name.

## Editing direction
- Build a new edit timeline rather than modifying the current master.
- Keep all app footage perfectly upright inside a correctly fitted iPhone frame.
- Remove the current white text block entirely.
- Place text only in dedicated open space outside the phone, using transparent typography or full-screen interstitial titles; no opaque panel may cover or crowd the app footage.
- Favor quick, purposeful cuts, restrained motion, and occasional full-screen app details so important interactions are easy to read.
- Create a word-level cue sheet and align each tap, screen change, generated result, and title transition to the corresponding narration phrase.
- Use only synthetic demo imagery and remove all Challenge and color-palette commentary.

## Music behavior
- Use the uploaded licensed upbeat track.
- Hold the music at one consistent supporting level during narration and natural narration pauses—no automatic pumping or volume rise when speech stops.
- Do not use sidechain ducking.
- After the final spoken question ends, raise the music smoothly for the final brand moment, then finish with a clean fade.
- Keep narration clearly intelligible without making the music feel weak.

## Quality checks
- Review every scene against the word-level cue sheet for audio/visual synchronization.
- Inspect every titled scene at desktop and mobile viewing sizes for phone fit, straight alignment, readable text, zero overlap, and no white text blocks.
- Confirm music level stays stable before the final question and rises only after it.
- Confirm the final narration request stayed within the 4,000-credit limit.
- Export and verify a new 1920×1080, 30 fps, H.264/AAC MP4 without overwriting earlier versions.
