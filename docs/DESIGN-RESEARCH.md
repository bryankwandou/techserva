# Design research (Part B) - captured 2026-11-05, Chromium 1440x900

Screenshots: docs/proof/references/*.jpg (all under 300 KB, largest 153 KB). Only what I saw in them is stated.

## Capture limits (read first)
- lusion.co: only the loader frame was captured (black screen, a white bar, a large counter bottom-left). No scrolled shot: screenshots timed out twice (headless, WebGL). I saw no real hero.
- activetheory.net: all-black frame in both shots. First run title was "Not Supported" (WebGL unavailable); with software GL the title became "Active Theory - Creative Digital Experiences" but pixels stayed black. Nothing about its design can be claimed.
- The other six rendered fine (first screen and a 1100 px scroll). Motion could not be observed from still frames, so motion is noted only where a still shows it (marquee, slider).

## What each does
**exhibita.design/canon** - Hero: giant black heavy-grotesque wordmark with the last letter in rust orange, small mono tagline. Type: grotesque headlines, italic serif intro, tracked uppercase monospace labels. Color: warm cream background, near-black, one rust accent, pastel tinted cards with colored left borders. Proof: scored thumbnails ("INTO THE STORM 8.15"), tech tags (WEBGL, GSAP, THREE.JS). Nav: two-level uppercase mono bar.

**a1.gallery animated-agency** - Hero: breadcrumb, large sans H1 with a gradient on one word, short intro with "Read more". Color: dark page, thin gradient announcement strip on top. Proof: grid of live-site thumbnails. Nav: top nav with search, Submit, "Go Pro" button; filter chips (Agency, Blog, Landing, Portfolio...).

**21st.dev** - Hero: centered heavy sans headline "Just copy-paste real designs.", dark blue fluid shape behind, blue primary button plus grey secondary, then the real product UI in a frame below. Scroll: sentence stat "Used by 4,563,354 builders" with a logo wall (Google, Meta, NVIDIA, Shopify, Vercel...). Nav: minimal, search with keyboard hint.

**landingfolio.com** - Hero: left sidebar plus top nav, H1 with half in grey, email capture, filter chips, sponsor cards, a survey popup in the corner. Dense and utility-first. Mono counter "961 SITES - 4 ADDED THIS WEEK".

**getdesign.md** - Hero: dark three-pane layout (sidebar, main, numbered list 01-05 on the right), headline with one pink word, orange primary CTA, tool logos. Scroll: table of brands, each with a one-line style description and counts. Sans plus mono labels. A cookie banner covers the lower screen.

**splicecraft.vercel.app** - Hero: warm cream bg, huge tight-tracked black headline with one word struck through in orange, tilted phone mockup with a captioned video, mono kicker, EN/ID toggle in nav. Scroll: marquee strip of mono feature labels, a slider that changes numbers live ("60", "0 edits").

**Handbook** (E:\Download\Telegram Desktop\DESIGN-HANDBOOK-blockbite - Copy.md, 426 KB; I read the intro and chapter 3 only): decide direction before CSS; every color needs a role; one accent for action; 3+ strong slop signals (all centered, uniform radius, 3-column icon grid, default purple/blue gradient, vague hero lines) means redo the direction.

## 10 to adopt
1. Warm off-white background with one accent color (Exhibita, splicecraft).
2. Mono uppercase kicker labels above sections (Exhibita, splicecraft, landingfolio).
3. One headline word treated differently (struck-through orange in splicecraft, pink word in getdesign.md).
4. Show the real catalog right under the hero, not an illustration (21st.dev shows its real UI).
5. A concrete count as proof ("961 sites", "550+") - use real numbers such as 500 services.
6. Interactive widget that changes numbers (splicecraft slider) - a scope/price picker per service.
7. Rows with a one-line description per item (getdesign.md) - fits 500 fixed-price services.
8. Filter chips for categories with counts (a1, landingfolio).
9. Sentence-style stats with the number underlined (21st.dev).
10. Plain-label nav with a search box and shortcut hint.

## 10 to avoid
1. Dark blue blurred blob hero (21st.dev) - generic for a service shop.
2. Popups or surveys on the first screen (landingfolio).
3. A cookie banner that covers a third of the screen (getdesign.md); keep consent small.
4. Sponsor/ad cards in the first view (landingfolio).
5. Loader-only or black first screens (my lusion/activetheory captures) - hides the offer, and WebGL-heavy pages failed in headless Chromium.
6. WebGL/3D-first heroes for a catalog (Exhibita notes top prizes go to 3D, but it is an awards site).
7. Logo walls of big brands without a real relationship (21st.dev) - Techserva has no clients to show yet.
8. Gradient text on dark as the only identity (a1, getdesign.md).
9. Centered stacked hero + two buttons + app frame as the only layout (21st.dev).
10. Status-dot pill badges (owner rule). Exhibita's small dot next to "THE CANON" is plain text, not a pill; do not turn it into a badge.
