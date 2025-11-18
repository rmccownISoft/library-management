# Library Management System

A tool library management system built with SvelteKit 2.0, Svelte 5, and Prisma.

## Tech Stack

- **Framework:** SvelteKit 2.0 with Svelte 5 (runes)
- **Language:** TypeScript
- **Database:** SQLite with Prisma ORM
- **Styling:** Tailwind CSS v4
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd library-management
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up the database:
```bash
# Generate Prisma client
pnpm exec prisma generate

# Run migrations
pnpm exec prisma migrate dev

# (Optional) Seed the database
pnpm exec tsx prisma/seed.ts
```

4. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## Database Schema

The system manages:

- **Users** - Volunteers and administrators with authentication
- **Patrons** - Library members who check out tools
- **Tools** - Inventory items organized by categories
- **Categories** - Hierarchical categorization system
- **Checkouts** - Tracking tool borrowing and returns
- **Files** - Document and image attachments for entities
- **Damage Reports** - Tool condition tracking
- **Audit Logs** - System activity tracking

## Current Features

### Tool Inventory Management ✅
- Browse tools by hierarchical categories
- Search tools by name
- View tool details including:
  - Description, quantity, condition status
  - Associated files/images
  - Damage history
- Create new tools with form validation
- Edit existing tool information
- Category-based filtering with nested categories
- Condition status tracking (Good, Needs Repair, Damaged, Lost)

### File Management ✅
- Upload and attach files to tools, patrons, volunteers, and damage reports
- File service with proper error handling
- Support for multiple file types
- File deletion and retrieval APIs

## Project Structure

```
library-management/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts               # Database seeding script
├── src/
│   ├── lib/
│   │   ├── components/       # Reusable Svelte components
│   │   │   └── ToolForm.svelte
│   │   ├── server/           # Server-side utilities
│   │   │   └── fileService.ts
│   │   └── prisma.ts         # Prisma client instance
│   └── routes/
│       ├── +layout.svelte    # Root layout
│       ├── +page.svelte      # Home page
│       ├── api/              # API endpoints
│       │   └── files/        # File management API
│       └── tools/            # Tool inventory pages
│           ├── +page.svelte          # Tool list
│           ├── +page.server.ts       # Server load/actions
│           ├── [id]/                 # Tool detail
│           └── new/                  # Create tool
├── docs/                     # Documentation
└── static/                   # Static assets
```

## Development Scripts

```bash
# Development server with hot reload
pnpm dev

# Type checking
pnpm check

# Linting
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build

# Preview production build
pnpm preview

# Prisma commands
pnpm exec prisma studio        # Database GUI
pnpm exec prisma migrate dev   # Create migration
pnpm exec prisma generate      # Generate client
```

## Development Status

### Completed ✅
- Database schema and migrations
- Prisma setup with SQLite
- Tool inventory CRUD operations
- Hierarchical category system
- Search and filtering
- File attachment system
- Basic UI with Tailwind CSS

### In Progress 🚧
- User authentication and authorization
- Checkout/checkin system
- Patron management
- Damage reporting interface
- Advanced permissions and roles

### Planned 📋
- Email reminders for overdue items
- Advanced reporting and analytics
- Patron self-service portal
- Mobile-responsive optimizations
- Export/import functionality

## Key Technologies & Patterns

- **Svelte 5 Runes:** Modern reactivity with `$state`, `$derived`, `$props`, `$effect`
- **SvelteKit 2.0:** File-based routing, server/client separation, form actions
- **Progressive Enhancement:** Forms work without JavaScript
- **Type Safety:** Full TypeScript coverage with Prisma types
- **Server-Side Rendering:** Fast initial page loads

## Documentation

Additional documentation is available in the `docs/` directory:

- `file-service-usage.md` - File management API documentation
- `tool-inventory-development-guide.md` - Detailed development guide for tool inventory features

## Contributing

This is an active development project. Please refer to the development guide in the `docs/` folder for coding standards and patterns.

## License

[Add your license here]
