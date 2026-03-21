# Library Management — CLAUDE.md

## Project Purpose
A tool lending library management system for tracking patrons, tools, and checkouts. Staff (volunteers and admins) manage patron records, tool inventory, and checkout/checkin operations.

## Tech Stack
- **Framework**: SvelteKit 2.47.1, Svelte 5 (runes-based reactivity — use `$state`, `$derived`, `$props`)
- **Language**: TypeScript throughout
- **Styling**: Tailwind CSS v4
- **Database**: SQLite via Prisma ORM (client generated in `src/generated/prisma`)
- **Package manager**: pnpm
- **Deployment**: PM2 process manager, Node adapter

## Key Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build
npx prisma migrate dev   # Run migrations
npx prisma generate      # Regenerate client after schema changes
```

## Project Structure
```
src/
├── routes/
│   ├── api/
│   │   ├── patrons/search/     # Patron search endpoint
│   │   ├── files/[id]/         # File download endpoint
│   │   ├── checkout/           # Checkout API
│   │   └── checkin/            # Checkin API
│   ├── patrons/
│   │   ├── +page.svelte        # Patron list with search
│   │   ├── new/                # Create patron
│   │   └── [id]/
│   │       ├── +page.svelte    # Patron detail (files, checkouts)
│   │       └── edit/           # Edit patron
│   ├── tools/
│   ├── checkout/
│   ├── login/ logout/
│   ├── admin/
│   │   ├── categories/         # Category management (ADMIN only)
│   │   ├── activity-log/       # Activity log viewer (ADMIN only)
│   │   ├── +layout.server.ts   # Auth guard — redirects non-admins
│   │   └── +layout.svelte      # Tab nav: Categories | Activity Log
├── lib/
│   ├── components/             # PatronForm, ToolForm, PatronSelector, Button, Input, ConfirmModal
│   ├── server/
│   │   ├── auth.ts             # Session management, bcrypt
│   │   ├── activityLog.ts      # logActivity() helper — never throws, logs to DB
│   │   └── fileService.ts      # All file upload logic (use this, don't DIY)
│   ├── prisma.ts               # Prisma singleton
│   └── stores/                 # Toast notifications
└── app.d.ts                    # Locals type (user: { id, userName, name, role })
```

## Authentication & Authorization
- Session-based auth, 24-hour expiry, stored in-memory (lost on restart)
- Cookie: `sessionid` (httpOnly, secure in prod)
- All protected routes check `locals.user` — redirect to `/login` if missing
- Roles: `VOLUNTEER` (standard) | `ADMIN` (full access, sees Admin nav link)
- `locals.user` shape: `{ id: number, userName: string, name: string, role: 'VOLUNTEER' | 'ADMIN' }`
- **Both roles can perform patron/tool/checkout operations** — ADMIN adds category management

## File Upload System
Always use `src/lib/server/fileService.ts` — never implement file handling directly.

```typescript
import { writeMultipleFilesAndPrismaCreate } from '$lib/server/fileService'
import { EntityType } from '$generated/prisma/enums'

// Extract files from multipart form data
const files = (formData.getAll('fieldName') as File[]).filter(f => f.size > 0)

// Upload
const results = await writeMultipleFilesAndPrismaCreate(files, {
  entityType: EntityType.PATRON,  // PATRON | TOOL | VOLUNTEER | DAMAGE_REPORT
  entityId: patron.id,
  uploadedBy: locals.user.id,
  label: 'Liability Waiver'       // optional
})
```

**Critical**: Forms with file uploads MUST use `enctype="multipart/form-data"`.

**Environment variable**: `BODY_SIZE_LIMIT=26214400` (25MB) must be set for uploads.

**Image handling**: Images are auto-optimized (resize to 1200px, JPEG/mozjpeg 85%, EXIF stripped). PDFs are stored as-is.

**File storage**: `UPLOAD_BASE_PATH` env var sets root. Dev default: `C:/Temp`. Prod default: `/var/www/html/files`. Subdirectory per entity type (e.g., `/patron/`).

**File serving**: `GET /api/files/[id]` — rate-limited for unauthenticated (100 req/min), 1-year cache header.

## Database Patterns
```typescript
import prisma from '$lib/prisma'  // Always use the singleton

// Patron with files and checkouts (detail page pattern)
prisma.patron.findUnique({
  where: { id },
  include: {
    files: { orderBy: { uploadedAt: 'desc' } },
    checkouts: { include: { tool: { include: { category: true } }, volunteer: true } }
  }
})
```

## Form Patterns (SvelteKit + Svelte 5)
- Use `use:enhance` from `$app/forms` for progressive enhancement
- Server actions return `fail(400, { errors, values })` on validation failure
- Server actions return `fail(500, { serverError, errors: {}, values })` for unexpected server errors
- Form components receive `errors` and `values` as props to repopulate on failure
- Display `form?.serverError` as a red banner above form components for server errors
- The `PatronForm.svelte` component is shared between create and edit
- **Track submitting state** with `$state(false)` and toggle in `enhance` callback

## Prisma Schema Key Models
```
Patron      → files: File[], checkouts: Checkout[]
Tool        → files: File[], checkouts: Checkout[], category: Category
File        → entityType, filePath, fileName, fileType, label, patronId?, toolId?
User        → role: VOLUNTEER | ADMIN, active: boolean
Checkout    → patron, tool, volunteer (User), status: CHECKED_OUT | RETURNED | OVERDUE
ActivityLog → action, userId (nullable, not FK), payload (JSON string), success, response (JSON string), createdAt
```

## Activity Logging
Use `logActivity` from `$lib/server/activityLog` for all critical operations. It **never throws** — failures only `console.error`.

```typescript
import { logActivity } from '$lib/server/activityLog'

await logActivity({
  action: 'CREATE_PATRON',  // CREATE_PATRON | EDIT_PATRON | CREATE_TOOL | EDIT_TOOL | CHECKOUT | CHECKIN
  userId: locals.user.id,   // nullable — pass undefined if user may not exist
  payload: { ... },         // the request data attempted
  success: true,
  response: { ... }         // result summary or error info
})
```

**Important**: `userId` on `ActivityLog` is intentionally NOT a foreign key — logs survive user deletion.

## Environment Variables
```
DATABASE_URL          # SQLite path (dev: file:./prisma/dev.db, prod: file:./data/library.db)
NODE_ENV              # development | production
PORT                  # Default 3000
HOST                  # Bind address
UPLOAD_BASE_PATH      # File upload root directory
BODY_SIZE_LIMIT       # 26214400 (25MB) — required for file uploads
```

## Feature Inventory

### Done
- Patron CRUD — create/edit/detail/list with validation and search
- Tool CRUD — create/edit with photo upload; detail shows photos and checkout history
- Category management — hierarchical (self-referential), admin UI, up to 3 levels
- Checkout flow — select patron + tool, set due date, record volunteer; blocks checkout if patron is inactive, blocked, or missing form signatures (waiver/agreement); shows status badges in search results and an Edit Patron link in the warning state
- Check-in — modal on patron detail page; tracks overdue flag
- File upload infrastructure — `fileService.ts`: image optimization, filesystem write, Prisma record
- File serving — `GET /api/files/[id]` rate-limited for unauthenticated access
- Authentication — session-based, bcrypt, 24-hour sessions, login history
- Role-based access — VOLUNTEER / ADMIN; Admin nav link conditional
- Patron/Tool search APIs — typeahead used by checkout flow
- `CameraCapture.svelte` — device camera photo capture component
- Exploit path blocking — hooks block `.php`, `.git`, `wp-admin`, etc.
- Activity logging — `ActivityLog` table records CREATE_PATRON, EDIT_PATRON, CREATE_TOOL, EDIT_TOOL, CHECKOUT, CHECKIN with success/failure and JSON payload; admin viewer at `/admin/activity-log`
- Client-side server error banners — patron/tool create/edit pages show red banner on `form?.serverError`
- Admin tab navigation — `/admin` has tab layout for Categories and Activity Log

### In Progress
- Patron file uploads (branch: `patron-files`) — liability waiver + user agreement docs on patron create/edit; patron detail page already renders `files` array
  - Note: `liabilityWaiverSigned` / `userAgreementSigned` boolean flags on Patron are separate from the file uploads — booleans drive checkout enforcement, files store the actual documents

### Planned / Not Started
- Patron list filtering by active/blocked status (TODO in patron list page)
- Redirect to new patron detail page after create (TODO in `patrons/new/+page.server.ts` — currently goes to list)
- Overdue reminders (`reminderSentAt` field exists on Checkout, no logic yet)
- Volunteer file management (schema supports it)
- Damage report file attachments (schema supports it)

---

## Conventions
- State abbreviations auto-uppercased in PatronForm (oninput handler)
- Zip code format: `12345` or `12345-6789`
- Phone validation: 10+ digits, various formats accepted
- At least one of email/phone required for patrons
- `createdBy` on Patron stores the user ID of the creating volunteer/admin — use `creator: { connect: { id } }` in Prisma create (relation syntax), not `createdBy: id` (scalar direct assignment is rejected by newer Prisma clients when a named relation exists)
- Patron detail page already renders `files` array — no changes needed there for new uploads to appear
