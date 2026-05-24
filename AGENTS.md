# AGENTS.md — BiFoDe website (absent-altitude)

## Project

Static + server-rendered site for **BiFoDe e.V.** (bildungs- und präventionsorientierte NGO). Production: **https://www.bifode.org** (Vercel). Repo name: `absent-altitude`.

## Stack

- **Astro 6** with `@astrojs/vercel` adapter (`output: 'server'`)
- **Node.js 24.x** (see `package.json` `engines`)
- **TypeScript** in content config and API routes; pages mostly `.astro`
- **nodemailer** for contact form (`src/pages/api/contact.ts`)
- Content collections via `src/content.config.ts` + markdown under `src/content/`

## Commands

Run from repository root:

| Command | Purpose |
|--------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Production build (required before merge) |
| `npm run preview` | Preview production build locally |

There is no separate lint or test script; after substantive changes, run `npm run build` and fix errors.

## Codex: verifying the project

This repo uses an npm **`overrides`** entry so Rollup runs as **`@rollup/wasm-node`** instead of native binaries. That avoids macOS `ERR_DLOPEN_FAILED` / “different Team IDs” when Node comes from **Codex.app** (signed) vs **nvm** (different signer). After changing `overrides`, delete `node_modules` and `package-lock.json`, then `npm install`.

`npm run build` and `npm run dev` **do not work reliably inside Codex’s default sandbox** (Node can hang before Astro prints anything). This is an environment limitation, not a broken repo.

When verifying code in Codex:

1. Use **Node 24** (`nvm use 24` or Codex’s bundled Node 24 runtime) — matches `package.json` `engines` and Vercel.
2. Run **`npm run build` outside the sandbox** — approve Codex when it asks to escalate / run without sandbox restrictions.
3. Expect **1–2 minutes** total; the `@astrojs/vercel` “Bundling function…” step can sit silent for ~60s — that is normal, not a freeze.
4. If a previous build/dev is stuck, approve `pkill -f "astro"` (or stop from Codex) before retrying.
5. Prefer **`npm run build`** over `npm run dev` for automated checks unless you explicitly need the dev server.

Optional in Codex UI for this trusted repo: `/approvals` → enable network or broader access so `npm`/`astro` need fewer prompts.

## Repository layout

```text
src/
  pages/           # File-based routes (German default)
  pages/en/        # English mirror routes under /en/*
  layouts/         # MainLayout.astro (nav, fonts, cookie banner)
  components/      # Reusable .astro components
  content/         # Markdown: projekte/, aktuelles/, events/
  lib/             # Shared TS (e.g. ical.ts)
  pages/api/       # Server endpoints (contact)
public/            # Static assets
astro.config.mjs
vercel.json        # Host redirects (bifode.de → www.bifode.org)
.env.example       # Documented env vars (copy to .env locally)
```

## Internationalization

- **German** pages live at root paths (`/`, `/kontakt`, `/aktuelles`, …).
- **English** pages live under `/en/` (`/en`, `/en/contact`, …).
- When adding or changing copy, update **both** locales if the page has a pair; keep tone appropriate for a nonprofit (formal, clear).
- Do not mix languages on a single page. Use `lang` prop on `MainLayout` (`de` | `en`).

## Content collections

Defined in `src/content.config.ts`:

| Collection | Path | Notes |
|------------|------|--------|
| `projekte` | `src/content/projekte/*.md` | `title`, `description` |
| `aktuelles` | `src/content/aktuelles/*.md` | `pubDate`, optional `draft` |
| `events` | `src/content/events/*.md` | ISO datetimes, optional `titleEn` / `summaryEn`, `draft` |

List pages filter drafts where applicable. Event ICS routes: `src/pages/events.ics.ts`, `src/pages/events/[slug].ics.ts`.

## Environment variables

Never commit `.env` or secrets. See `.env.example`:

- **SMTP_***, **CONTACT_FROM_EMAIL**, **CONTACT_TO_EMAIL** — contact API
- **PUBLIC_JOTFORM_ANMELDUNG_URL** — Jotform embed on `/anmeldung` and `/en/registration`

## Coding conventions

- Match existing patterns in neighboring files (Astro frontmatter, scoped styles, minimal abstractions).
- Prefer small, focused diffs; do not refactor unrelated code.
- Comments only for non-obvious behavior.
- Use `import.meta.env` for env access in Astro/Vite code.

## Safety and workflow

- Do **not** create git commits or push unless the user explicitly asks.
- Do **not** add production dependencies without confirmation.
- Do **not** log or paste SMTP passwords or API keys.
- Legal/content pages (`impressum`, `datenschutz`, cookie policies): change carefully; preserve legal accuracy.

## Deployment

- Hosted on **Vercel**; adapter config in `astro.config.mjs`.
- `vercel.json` handles domain redirects only; do not break `www.bifode.org` canonical URLs without explicit request.
