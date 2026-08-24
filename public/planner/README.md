# team1 planner

A tiny internal tool for planning social content as a team — shared drafts, thread
preview with live character counts, statuses (idea → draft → review → approved → posted),
comments, and copy-to-post. No auto-posting, no tracking, no cost.

Built by Sam (@shamwise8) for team1 Thailand. Any chapter is welcome to run their own copy.

## Run your chapter's copy

The whole app is this folder — three files, no build step. Host it anywhere that serves
static files (Vercel, Netlify, GitHub Pages).

1. Copy this `planner/` folder into your site.
2. Edit `config.js` → set `chapterName` (e.g. `"team1 vietnam"`).
3. That's it for **local mode** — everyone's drafts stay in their own browser.

### Team mode (shared drafts + sign-in)

1. Create a free project at [supabase.com](https://supabase.com/dashboard).
2. In the project: SQL editor → paste and run `schema.sql`.
3. Table editor → `members` → add each teammate's email (this is the access list —
   nobody else can sign in or read anything, even with the link).
4. Project Settings → API → copy the Project URL and anon public key into `config.js`.
5. Authentication → URL Configuration → set the Site URL to your planner's URL
   (e.g. `https://yoursite.com/planner/`) so magic-link emails redirect back correctly.

On first sign-in, the planner offers to import any drafts you made in local mode.

## Notes

- Threads: separate tweets with `---` on its own line.
- Character counts follow X's rules approximately: links = 23, CJK/emoji = 2, Thai = 1.
- Add/remove teammates by editing the `members` table — removing a row revokes access.
- The page is `noindex` and shows nothing without sign-in (team mode).
