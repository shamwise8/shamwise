# Avalanche Halloween by Team1 & Bitkub — partner page

Single static page, no build step. Lives at `public/halloween/index.html`, served as **shamwise.com/halloween**. Inline CSS and a 12-line script, one Google Font (Kanit: Medium 500 for headings, Light 300 for body, per the team1 brand guide in `avalancheteam1/common`), no tracking.

## Placeholders to replace

| What | Where | Recommended size | Notes |
|---|---|---|---|
| OG / share image | `assets/og-image.jpg` (referenced in `<head>`, file does not exist yet) | 1200 × 630, JPG under 300 KB | Used by X, Telegram, LINE previews. |
| Venue photo or walkthrough video | "The venue" section, wide `.ph.wide` block | 1920 × 1080 (16:9); a JPG, or an MP4 under ~8 MB with a poster JPG | For video use `<video autoplay muted loop playsinline poster="…">`. |
| Main stage LED photo | "The venue" section, first small `.ph` | 1400 × 1050 (4:3) | |
| The room photo | "The venue" section, second small `.ph` | 1400 × 1050 (4:3) | |

## Logos

- `assets/bitkub.svg` and `assets/bitkub-academy.svg` are the "02" horizontal variants from Bitkub's packs (green mark, white wordmark), the ones for dark backgrounds. The full packs, including the light-background "01" and all-white "03" variants and the vertical lockups, are parked untracked in `team1kickoff-raw/halloween/logos/`.
- `assets/team1.svg` is `Team1_MAIN_WHITE` from `avalancheteam1/common`, the wordmark the brand guide specifies for dark backgrounds.

## Paths

The page is served at `/halloween` without a trailing slash, so every asset must use an absolute path (`/halloween/assets/…`). A relative `assets/…` resolves to the site root and 404s in production.

## Photos in place

- `assets/merch-box.jpg` — the concept box, labelled "Concept shown" on the page. Swap the file when the final box exists; keep the name.
- `assets/chiang-mai.jpg` — Chiang Mai meetup tile.
- Originals (the phone JPEG and HEIC) are parked untracked in `team1kickoff-raw/halloween/`.

## Already real, no action needed

- Telegram CTA: `https://t.me/shamwise8` on all three "Choose this" buttons and the footer button, as on the media kit.
- Past events tiles: Pudgy Padel Night, Team1 Thailand KickOff, Padel Rave Bangkok, Money 20/20 side event, Chulalongkorn workshop, all served from `/mediakit/assets/`.
- Numbers in "Past events" (15 events, 1,400 turned up, 4.9/5, 200+) and the attendee quote are copied from the media kit at `/mediakit`.
- Team1 mark: `/Team1KickOff/assets/Team1_Symbol_Main.svg`.

## Optional

- A venue or key-visual photo of the Bitkub event space. There is no slot for it yet; the natural place is a full-width image between the hero and "Why this event", 1600 × 900.
- To change the slug, rename the folder. Vercel `cleanUrls` serves `public/<slug>/index.html` at `/<slug>`.
