# PHE PHIM AI — Admin Control Room

**Separate Vercel project for `admin.phephim.ai`.** Manage all existing dynamic Neon and static-catalog movies; change the display title, replace cover art, hide/unhide entries without deleting Telegram videos, sources, subtitles, or pipeline checkpoints.

## Architecture

- Next.js 16, React 19, TypeScript, server-only PostgreSQL access.
- Clerk sign-in. **Closed admin allowlist by immutable Clerk user ID**. No public signup is granted admin permissions.
- Current dynamic films read from the existing `toolnet_auto.publish_records` and catalog join.
- Static films read from the existing public GitHub `movies.json` every five minutes. No static film is overwritten by this app.
- All edits are stored in isolated `phe_admin.movie_overrides`. Audit log and optimistic version checking.
- Covers uploaded to Vercel Blob, converted to WebP by Sharp. Also accepts HTTPS image URLs.
- "Delete from list" is deliberately **soft hide**; restoring a film is immediate.

## Setup

1. Create a NEW GitHub repo (`phephim-admin`) and NEW Vercel project. Do not connect this code to the existing movie website or Toolnet-Phim-Auto Vercel projects.
2. Connect the existing Neon PostgreSQL database. Use a dedicated user with SELECT on catalog tables and read/write on `phe_admin` where possible. Save `DATABASE_URL` as a private Vercel environment variable; do not expose it as `NEXT_PUBLIC_...`.
3. Review and run `db/001_admin_overrides.sql` against Neon **once**, with a database backup. It does not edit any existing data.
4. Provision Clerk for this admin project; set `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Sign in once to get your immutable Clerk user ID; configure it in `ADMIN_CLERK_USER_IDS`. Empty allowlist blocks access.
5. Optional: attach a Vercel Blob store and let Vercel provision `BLOB_READ_WRITE_TOKEN` for image uploads. Without Blob, editing using HTTPS image URLs still works.
6. Deploy to Vercel preview and test. Then attach `admin.phephim.ai` to this new project. The DNS zone is on Cloudflare; set the CNAME `admin` to the hostname Vercel instructs (typically `cname.vercel-dns.com`). Confirm ownership, HTTPS and authentication before inviting other admins.
7. **Essential**: apply the minimal read-side integration `site-integration/README.md` to the existing PHEPHIM.AI FastAPI app. Without this, changes are saved in Neon but **will not be visible on the public website**. Apply in a separate staging branch; test before promoting. No Toolnet Step 1–9 needs alteration.

Run locally:

```sh
cp .env.example .env.local
npm install
npm run typecheck
npm run dev
```

## Safety

- This app never deletes sources, Telegram messages, video files, SRT/VTT, or processing_jobs.
- All mutation endpoints enforce the same server-side allowlist as the UI.
- Never place admin database credentials in browser JavaScript.
- Editing and hiding are auditable; updates use optimistic concurrency to avoid silent overwrites.
- A movie marked `DRAFT` in Toolnet remains a draft regardless of the admin hidden toggle.
- Existing `Toolnet-Phim-Auto` publishes remain authoritative for video distribution and episode/source metadata.

## Environment

See `.env.example`. In production, set the Vercel project environment variables directly; never commit secrets or `.env.local`.

## Known scope

- Does **not** permanently delete a film; the delete button means hide from public catalog.
- Does not edit video files, player sources, SRT, episode lists or publish state.
- Catalog reads at most 20,000 dynamic records per request; for substantially larger libraries add SQL-level paging.
