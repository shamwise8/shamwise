# Avalanche Halloween by Team1 & Bitkub — partner page

Single static page, no build step. Lives at `public/halloween/index.html`, served as **shamwise.com/halloween**. Inline CSS and a small script, Kanit self-hosted in `assets/fonts/` (latin woff2 for 300, 400 and 500, about 10 KB each, OFL) so nothing render-blocking leaves the origin. Medium 500 for headings, Light 300 for body, per the team1 brand guide in `avalancheteam1/common`. No tracking, no other external requests.

## Placeholders to replace

None left. The share image is generated, see below.

## Share image

`assets/og-image.jpg` (1200 × 630) is rendered from a small HTML file in the page's own style: kicker, title, date line, host logos. To regenerate after a copy change, write the same HTML to a scratch file and run headless Chrome:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=10000 --screenshot=og.png file:///path/to/og.html
sips -s format jpeg -s formatOptions 88 og.png --out assets/og-image.jpg
```

X and Telegram cache previews per URL; after replacing the image, re-check with a cache-busting query on the page URL or X's card validator.

## Brand

- The accent is Avalanche red `#E6212F`, taken from the colour page of Ava Labs' "Avalanche Messaging and Identity" deck and matching the one-colour logo file. The deck is parked untracked at `team1kickoff-raw/halloween/brand/`. Darker and lighter steps in the deck, if ever needed: `#B20F2A`, `#FF394A`.
- The team1 brand guide (`avalancheteam1/common`) uses the same `#E6212F` as Ava Red.

## Logos

- `assets/avalanche.svg` is Ava Labs' `AvalancheLogo_Horizontal_1C_Red`, the current one-colour wordmark. It sits in its own "Ecosystem" slot in the hero row and on the share image, deliberately outside "Hosted by": Avalanche is not a host of the event and must not be presented as one.
- `assets/bitkub.svg` and `assets/bitkub-academy.svg` are the "02" horizontal variants from Bitkub's packs (green mark, white wordmark), the ones for dark backgrounds. The full packs, including the light-background "01" and all-white "03" variants and the vertical lockups, are parked untracked in `team1kickoff-raw/halloween/logos/`.
- `assets/team1.svg` is `Team1_MAIN_WHITE` from `avalancheteam1/common`, the wordmark the brand guide specifies for dark backgrounds.

## Paths

The page is served at `/halloween` without a trailing slash, so every asset must use an absolute path (`/halloween/assets/…`). A relative `assets/…` resolves to the site root and 404s in production.

## Photos in place

- `assets/merch-box.jpg` — the concept box, labelled "Concept shown" on the page. Swap the file when the final box exists; keep the name.
- `assets/chiang-mai.jpg` — Chiang Mai meetup tile.
- Venue set from Bitkub: `assets/venue-wide.jpg` (floor, 1280 × 960), `assets/venue-crowd.jpg` (full room, 1200 × 900), `assets/venue-tall.jpg` (main screen, 960 × 1280), and `assets/venue-walk.mp4` (8-second vertical walkthrough, re-encoded H.264 without audio, 526 × 960, under 1 MB) with `assets/venue-walk.jpg` as its poster. Laid out 2:1, landscape left, portrait right.
- Originals (phone JPEG, HEIC, MP4) are parked untracked in `team1kickoff-raw/halloween/` and `team1kickoff-raw/halloween/venue/`.

## Already real, no action needed

- Telegram CTA: `https://t.me/shamwise8` on all three "Choose this" buttons and the footer button, as on the media kit.
- Past events tiles: Pudgy Padel Night, Team1 Thailand KickOff, Padel Rave Bangkok, Money 20/20 side event, Chulalongkorn workshop, all served from `/mediakit/assets/`.
- Numbers in "Past events" (15 events, 1,400 turned up, 4.9/5, 200+) and the attendee quote are copied from the media kit at `/mediakit`.
- Team1 mark: `/Team1KickOff/assets/Team1_Symbol_Main.svg`.

## Optional

- A venue or key-visual photo of the Bitkub event space. There is no slot for it yet; the natural place is a full-width image between the hero and "Why this event", 1600 × 900.
- To change the slug, rename the folder. Vercel `cleanUrls` serves `public/<slug>/index.html` at `/<slug>`.
