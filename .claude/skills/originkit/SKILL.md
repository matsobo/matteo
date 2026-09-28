---
name: originkit
description: >-
  Browse and import animated UI components from Originkit (originkit.dev), a
  free library of animated React components (text effects, image galleries,
  backgrounds, particles, buttons). Use when the user mentions Originkit, wants
  to find or add animated components to a website/app, or wants a specific
  Originkit component's source code. Not for animations unrelated to web UI
  components or built from scratch without a library.
---

# Originkit

Adapted for Claude Code from the Vellum plugin at
https://github.com/vellum-ai/originkit (MIT, see `LICENSE`).

Originkit is a free animated component library. Components are React-based and
can be delivered for `react`, `nextjs`, `vite` or `framer`, styled with `css`,
`tailwind` or `cssmodules`, in TypeScript or JavaScript.

## Browse (no API key, offline)

The catalog is bundled at `references/component-index.json`
(`{ count, components: [{ name, displayName, category, description, tags,
variants, dependencies }] }`). Search it with a quick script instead of reading
the whole file, e.g.:

```bash
python3 - "particle" <<'PY'
import json, sys
q = sys.argv[1].lower()
d = json.load(open(".claude/skills/originkit/references/component-index.json"))
for c in d["components"]:
    hay = " ".join([c["name"], c["displayName"], c["description"], *c["tags"]]).lower()
    if q in hay:
        print(f'{c["name"]:24} {c["category"]:22} deps={",".join(c["dependencies"]) or "-"}  {c["description"]}')
PY
```

Categories: `interactive-elements`, `image-gallery`, `text`, `animation`,
`background-animation`, `button`. Show the user the display name, the
kebab-case `name` (needed to fetch), category, dependencies and description.

If the `originkit` MCP server is connected, its `list_components` tool returns
the live catalog, which may contain newer components than the bundled file.

## Fetch a component (needs API key)

Use the `originkit` MCP server (configured in the repo's `.mcp.json`, key read
from the `ORIGINKIT_API_KEY` environment variable). Call its `get_component`
tool with:

- `name` (required): kebab-case name from the catalog
- `stack`: `react` (default), `nextjs`, `vite`, `framer`
- `styling`: `css` (default), `tailwind`, `cssmodules`
- `typescript`: `true` (default)

Pick `stack`/`styling`/`typescript` to match the user's project (check
`package.json`, Tailwind config, `tsconfig.json`). Write the returned files
into the project and install listed dependencies (often `framer-motion`).

If the MCP server is not available, tell the user they need to:
1. get a free key at https://originkit.dev → Settings → API Integration
   (looks like `cmp_live_...`);
2. set it as `ORIGINKIT_API_KEY` in their environment;
3. allow network access to `mcp.originkit.dev`.
Never ask the user to paste the key into chat or commit it.

## Limits and errors

- 10 component fetches per key per day, reset at midnight UTC (shared with
  website copies). On a "daily limit" message, say they can retry after
  midnight UTC.
- On an auth error, the key is missing or wrong: have the user check
  `ORIGINKIT_API_KEY`.
- Browse first when the user is exploring; fetch directly when they name a
  component they saw on the website.
