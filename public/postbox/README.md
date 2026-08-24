# Postbox

A tiny internal tool for planning social content as a team — shared drafts, thread
preview with live character counts, statuses (idea → draft → review → approved → posted),
comments, and copy-to-post. No auto-posting, no tracking, no cost.

Built by Sam (@shamwise8) for team1 Thailand. Any chapter is welcome to run their own copy.

## Try it as a chapter (no setup at all)

The hosted planner at **shamwise.com/postbox** supports many chapters on one link —
each chapter is a workspace.

- **Chapter leads:** sign in with your **@team1.network** email → you'll be offered a
  "Create your chapter" screen → name it and you're in as admin. Add your team from
  the **Team** panel in the header (any email works for members).
- **No team1.network email?** Send Sam (@shamwise8) your chapter name + lead email and
  he'll set it up.

No deployment, no Supabase, no config. Joining an existing chapter is always
invite-only — leads add members; nobody can browse into another chapter.

## Run your chapter's own copy (optional, for your own domain)

The whole app is this folder — three files, no build step. Host it anywhere that serves
static files (Vercel, Netlify, GitHub Pages).

1. Copy this `planner/` folder into your site.
2. Edit `config.js` → set `chapterName` (e.g. `"team1 vietnam"`).
3. That's it for **local mode** — everyone's drafts stay in their own browser.

### Team mode (shared drafts + sign-in)

One Supabase project ("postbox") can host many brands — each brand/team is a
**workspace** with its own member list and drafts, fully isolated by row-level
security. team1 thailand, your personal brand, another chapter: same project,
different `workspace` slug in `config.js`.

The planner lives in its own `postbox` Postgres schema, so it can share a Supabase
project with an existing app without touching that app's tables or auth.

1. Use any Supabase project — an existing one is fine (the project name is only a
   dashboard label).
2. SQL editor → paste and run `schema.sql` (it only creates/replaces the `postbox`
   schema — nothing outside it is touched).
3. Project Settings → API → **Exposed schemas** → add `postbox` (required).
4. Still in the SQL editor, seed your workspace and members:
   ```sql
   insert into postbox.workspaces (id, name) values ('team1th', 'team1 thailand');
   insert into postbox.members (workspace_id, email, name) values ('team1th', 'you@email.com', 'You');
   ```
   The members list is the access control — nobody else can sign in or read anything.
5. Project Settings → API → copy the Project URL and anon public key into `config.js`,
   and set `workspace` to your slug (e.g. `'team1th'`).
6. Authentication → URL Configuration → **add** your planner URL
   (e.g. `https://yoursite.com/planner/`) to the Redirect URLs allowlist. If the
   project is shared with an app, leave the Site URL as the app has it.

Adding another workspace later = two inserts (see the bottom of `migrate-roles.sql`);
its admin then manages members in-app via the Team panel. The `workspace` value in
`config.js` is only a default — after sign-in, users land in the workspace they belong
to, and get a switcher if they belong to several.

On first sign-in, the planner offers to import any drafts you made in local mode.

## Notes

- Threads: separate tweets with `---` on its own line.
- Character counts follow X's rules approximately: links = 23, CJK/emoji = 2, Thai = 1.
- Add/remove teammates by editing the `members` table — removing a row revokes access.
- The page is `noindex` and shows nothing without sign-in (team mode).
