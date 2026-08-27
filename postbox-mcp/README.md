# Postbox MCP

Lets Claude read, write and **rewrite** Postbox drafts directly.

Typical use, once connected:

- *"List the team1th drafts that are over 280 characters."*
- *"Tighten the D+7 grants post to under 280 without losing the numbers, then save it."*
- *"Draft a recap thread for the Chula workshop — 60 people, bilingual — schedule it for Friday."*

Everything it writes lands as a **review** draft. It never posts anything to X.

## Setup

1. Get the Supabase **service_role** key: Supabase dashboard → Project Settings → API →
   `service_role` (click reveal). This key bypasses row-level security, so keep it local —
   never commit it, never put it in a web page.

2. Register the server with Claude Code:

```bash
claude mcp add postbox \
  --env POSTBOX_URL=https://YOURPROJECT.supabase.co \
  --env POSTBOX_SERVICE_KEY=eyJ... \
  --env POSTBOX_EMAIL=you@email.com \
  --env POSTBOX_WORKSPACES=team1th,shamwise \
  -- node /absolute/path/to/postbox-mcp/index.js
```

`POSTBOX_WORKSPACES` is an allowlist — the server refuses to touch any workspace not in it.
Leave it unset to allow all (not recommended).

3. Restart Claude Code. `/mcp` should list **postbox**.

## Tools

| Tool | What it does |
|---|---|
| `list_workspaces` | Chapters this server may write to |
| `list_drafts` | Drafts in a workspace, each with per-tweet character counts |
| `get_draft` | One draft in full — read before rewriting |
| `create_draft` | New draft (defaults to **review** status) |
| `update_draft` | Save an edit or rewrite |
| `check_length` | Measure text against X's rules without saving |
| `list_categories` | Category labels in a workspace |

Threads: separate tweets with a line containing only `---`.

Character counting matches the app: links count as 23, CJK and emoji as 2, Thai as 1.

## Safety notes

- The service key is admin-level. Local use only.
- Drafts are created as `review` so a human approves before anything is published.
- The workspace allowlist stops accidental writes into another chapter.
