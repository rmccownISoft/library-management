# Library Management System

> A tool lending library platform for staff volunteers and admins. Patrons sign liability waivers and user agreements, then borrow physical tools. Volunteers process checkouts, check-ins, and patron registration. Admins additionally manage tool categories. The system tracks borrowed items, overdue counts, damage reports, and scanned agreement documents per patron.

**Current focus:** Patron file uploads — adding liability waiver and user agreement document attachment to patron create and edit flows (branch: `patron-files`)
**Last updated:** 2026-03-18

---

## Architecture & Decisions

The application is built on SvelteKit 2 with Svelte 5's runes system (`$state`, `$derived`, `$props`). Every page follows the paired-file convention: a `+page.svelte` handles UI and a `+page.server.ts` handles data loading and form actions. The Node adapter is used so the app runs as a standard Node process managed by PM2 in production — this was chosen over serverless because the in-memory session store requires a persistent process.

SQLite was chosen over a hosted database to keep the deployment self-contained on a single VM with no external dependencies. Prisma provides the ORM layer. The generated client is output to `src/generated/prisma` (not the default location) to keep it inside the `src/` tree for cleaner imports. All schema changes follow the same flow: edit `prisma/schema.prisma` → `pnpm db:migrate` → `pnpm db:generate`.

Authentication is session-based with an in-memory store. Sessions expire after 24 hours and are lost on server restart — an accepted tradeoff for simplicity. Passwords are hashed with bcrypt. The session cookie (`sessionid`) is httpOnly and secure in production. Every protected server route checks `locals.user` (populated by the auth middleware in `src/hooks.server.ts`) and redirects to `/login` if absent. There are two roles: `VOLUNTEER` (can do everything patron/tool/checkout-related) and `ADMIN` (additionally manages categories). Role checks are done inline in server routes, not via middleware.

All file handling goes through `src/lib/server/fileService.ts`. This was centralized deliberately — the first attempt at ad-hoc file handling caused issues with orphaned files and inconsistent DB records. The service handles image optimization (resize to 1200px, JPEG/mozjpeg, EXIF stripping), filesystem writes with UUID filenames, and Prisma record creation atomically. PDFs pass through unmodified. Files are served back via `GET /api/files/[id]`, which was moved from an authenticated endpoint to a rate-limited public endpoint after it caused issues on pages that render images without a login context.

---

## Directory Map

```
src/
├── hooks.server.ts         — Auth middleware; also blocks exploit paths (.php, wp-admin, etc.)
├── app.d.ts                — Defines locals.user shape used across all server files
├── lib/
│   ├── server/
│   │   ├── fileService.ts  — Central file upload abstraction; always use this, never raw fs
│   │   └── auth.ts         — In-memory session store, login/logout, bcrypt helpers
│   ├── prisma.ts           — Prisma singleton; import this everywhere, never instantiate directly
│   ├── components/
│   │   ├── PatronForm.svelte    — Shared between patron create and edit routes
│   │   ├── ToolForm.svelte      — Shared between tool create and edit routes
│   │   ├── PatronSelector.svelte — Typeahead search used in checkout flow
│   │   ├── ToolSelector.svelte   — Typeahead search used in checkout flow
│   │   ├── CameraCapture.svelte  — Device camera capture for document/photo scanning
│   │   ├── ConfirmModal.svelte   — Generic yes/no confirmation dialog
│   │   ├── Button.svelte         — Primary / secondary / danger variants
│   │   ├── Input.svelte          — Text input with label and inline error
│   │   ├── Select.svelte         — Dropdown with label and inline error
│   │   ├── Textarea.svelte       — Multiline input
│   │   └── Toast.svelte          — Notification toast (driven by toast store)
│   └── stores/
│       └── toast.svelte.ts — Svelte 5 rune-based toast notification store
├── routes/
│   ├── patrons/            — Patron list, create, detail, edit
│   ├── tools/              — Tool list, create, detail, edit (includes photo upload)
│   ├── checkout/           — Checkout flow: select patron + tool, set due date
│   ├── admin/categories/   — Category hierarchy management (ADMIN role)
│   ├── login/ logout/      — Auth pages
│   └── api/
│       ├── checkin/        — POST: process a tool check-in
│       ├── checkout/       — POST: process a tool checkout
│       ├── files/[id]/     — GET: serve a file by DB id (rate-limited, public)
│       ├── patrons/search/ — GET: name search for PatronSelector typeahead
│       └── tools/search/   — GET: name search for ToolSelector typeahead

prisma/
├── schema.prisma           — Source of truth for all models, enums, and relations
├── migrations/             — Auto-generated SQL history; do not edit manually
├── seed.ts                 — Dev seed: sample patrons, tools, categories, users
└── seed.production.ts      — Prod seed: minimal admin user only

scripts/
└── create-user.ts          — CLI utility to add a staff user (run with: pnpm create-user)
```

---

## Dependencies with Rationale

| Package | Why it's here |
|---|---|
| `sharp` | Image optimization at upload time — resizes, compresses to JPEG via mozjpeg, and strips EXIF metadata. Chosen over alternatives because it's the fastest Node image processing library with mozjpeg support built in, and it handles the full pipeline (resize + compress + strip) in a single pass. |
| `bcrypt` | Password hashing for staff accounts. Chosen over Node's built-in `crypto` because bcrypt's cost factor makes brute-force attacks impractical; `crypto.pbkdf2` would work but requires more manual configuration to achieve equivalent security. See `BCRYPT_FIX.md` for a platform-specific build issue that was encountered. |
| `dotenv` | Loads `.env` into `process.env` at startup. Required because the production start command (`node -r dotenv/config build`) needs env vars before SvelteKit initializes. |
| `@prisma/extension-accelerate` | Prisma connection pooling extension — present in deps but not actively used yet; added in anticipation of connection limit issues under load. |

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite file path. Dev: `file:./prisma/dev.db`. Prod: `file:./data/library.db` |
| `NODE_ENV` | Yes | `development` or `production`; affects cookie security and file path defaults |
| `PORT` | No | Server port, defaults to 3000 |
| `HOST` | No | Bind address, defaults to `0.0.0.0` |
| `UPLOAD_BASE_PATH` | No | Root directory for uploaded files. Dev default: `C:/Temp`. Prod default: `/var/www/html/files`. Subdirectory per entity type is created automatically. |
| `BODY_SIZE_LIMIT` | Yes (uploads) | Must be set to `26214400` (25MB) or file uploads will fail silently with a body parse error. Set in `ecosystem.config.cjs` for production. |
| `ORIGIN` | Prod only | Required by SvelteKit CSRF protection in production when behind a reverse proxy |

---

## Extension Points

| What | Where | How to extend |
|---|---|---|
| Entity types for file uploads | `prisma/schema.prisma` — `EntityType` enum + `File` model | Add enum value, add nullable FK column on `File`, add a case to `getEntityIdField()` in `fileService.ts`, then migrate and regenerate |
| Tool condition statuses | `prisma/schema.prisma` — `ConditionStatus` enum | Add value, migrate, regenerate, then update the ToolForm dropdown |

---

## Docs Index

| File | What's in it |
|---|---|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Answers: how do I deploy this to a VM or production server, including fresh installs and database resets? |
| [ToolLibraryPage.md](ToolLibraryPage.md) | Original project specification — useful for understanding scope and intent behind the initial design |
| [database-development-guide.md](database-development-guide.md) | Answers: how do I make schema changes, run migrations, and work with Prisma day-to-day? |
| [file-service-usage.md](file-service-usage.md) | Answers: how do I use `fileService.ts` to upload files and attach them to entities? |
| [patron-management-implementation-plan.md](patron-management-implementation-plan.md) | Step-by-step implementation plan for the patron management system, broken into session-sized tasks |
| [tool-inventory-development-guide.md](tool-inventory-development-guide.md) | Step-by-step guide for building the tool inventory management features |
| [tutorial-session-1-patron-list.md](tutorial-session-1-patron-list.md) | Tutorial walkthrough of creating the patron list page — good reference for SvelteKit + Prisma patterns used throughout the project |

---

## Known Bugs & Debug Entry Points

No known bugs at time of last update.

**Recent fix history worth knowing:**
- File serving was previously behind authentication, which broke image rendering on pages loaded without a login redirect. Fixed by switching `GET /api/files/[id]` to rate-limited public access (`src/routes/api/files/[id]/+server.ts`).
- Large file uploads caused a silent body parse failure until `BODY_SIZE_LIMIT=26214400` was added to `ecosystem.config.cjs`. If uploads stop working in production, check this env var first.
- bcrypt had a platform-specific native build issue — see `BCRYPT_FIX.md` at the project root if bcrypt fails to load.

---

## Feature Inventory

### Done
- Patron CRUD — list with name search, create, edit, detail page with contact/stats/files/checkout history
- Tool CRUD — list, create with photo upload, edit, detail with photos and checkout history
- Category management — hierarchical (self-referential tree), admin-only UI; see [tool-inventory-development-guide.md](tool-inventory-development-guide.md)
- Checkout flow — typeahead patron + tool selection, due date, volunteer attribution; blocks checkout and shows warning if patron is inactive, blocked, or missing form signatures; status badges (Inactive, Blocked, No Waiver, No Agreement) shown in search results; Edit Patron link surfaced inline when issues are present
- Check-in — confirmation modal on patron detail page; records checkin volunteer, flags overdue
- File upload infrastructure — `fileService.ts` handles image optimization, filesystem write, Prisma record; see [file-service-usage.md](file-service-usage.md)
- File serving — `GET /api/files/[id]`, rate-limited public endpoint, 1-year cache header
- Authentication — session-based, bcrypt, 24-hour expiry, login history table
- Role-based access — VOLUNTEER / ADMIN; Admin nav item visible only to ADMIN role
- Patron/Tool search APIs — used by typeahead selectors in checkout flow
- Camera capture component — `CameraCapture.svelte` for scanning documents via device camera
- Exploit path blocking — `src/hooks.server.ts` returns 404 for `.php`, `.git`, `wp-admin`, etc.

### In Progress
- **Patron file uploads** (branch: `patron-files`) — liability waiver and user agreement docs attachable to patron records at create time and via edit; `PatronForm.svelte` and both server actions need `enctype="multipart/form-data"` and `writeMultipleFilesAndPrismaCreate` calls; the patron detail page already renders the `files` array so uploaded docs will appear automatically. Note: `liabilityWaiverSigned` / `userAgreementSigned` boolean flags on Patron are separate from the file uploads — booleans drive checkout blocking (already done), file uploads store the actual documents (in progress)

### Planned / Not Started
- Patron list filtering by active/blocked status — TODO comment in `src/routes/patrons/+page.svelte`
- Redirect to new patron detail page after create — TODO in `src/routes/patrons/new/+page.server.ts`; currently redirects to list
- Overdue reminders — `reminderSentAt` field exists on `Checkout` model; no send logic yet
- Volunteer file management — `File` model has `volunteerId` FK; no UI yet
- Damage report file attachments — `File` model has `damageReportId` FK; no UI yet
