# Tool Library Management System - Project Specification

## Tech Stack

### Frontend
- **SvelteKit 2.0** - Full-stack framework
- **TypeScript** - Type safety
- **Tailwind CSS** (recommended) - Responsive, mobile-first styling

### Backend
- **SvelteKit API Routes** - Server-side endpoints
- **Prisma ORM** - Type-safe database access
- **SQLite** - Embedded database

### Authentication
- **Custom email/password authentication** - Built with SvelteKit sessions
- **Bcrypt** - Password hashing

### File Storage
- **Local filesystem** - For uploaded documents and images

### Deployment Options
- **Self-hosted** - Direct Node.js deployment
- **Vercel** - Free tier compatible (with adapter-vercel)
- **Docker** (optional) - For containerized deployment

---

## User Roles & Permissions

### Public (Unauthenticated)
- View inventory list (name, category, quantity, availability)
- Filter by category and availability

### Volunteer
- Check out tools to patrons
- Check in tools from patrons
- Create/edit/view patron information
- Create/edit/view tool inventory
- Upload tool images
- Mark tools with condition status (needs repair, damaged, lost)
- Add notes about tool damage
- Send manual reminders for overdue tools
- Override checkout periods with notes
- View checkout/checkin history

### Admin
- All volunteer permissions
- Create/edit/delete volunteer accounts
- Set volunteer permissions (volunteer vs admin)
- Delete patron records
- Delete tool records
- Override patron checkout blocks (with required notes)
- Create/edit/delete tool categories
- Track volunteer training (date, trainer)

### Super User (Database Level)
- Direct database access for emergency situations

---

## Core Features

### 1. Authentication System
- Email/password login for volunteers and admins
- Minimum password length: 8 characters
- Session management with timeout
- Login history tracking
- Password reset by volunteer/admin (no email integration initially)
- Setup script to create first admin account

### 2. Patron Management
**Required Information:**
- Full name
- Email and/or phone (at least one required)
- Mailing address
- Signed agreement uploads (PDF, multiple files supported)
- Agreement upload date tracking

**Features:**
- Create/edit patron records (volunteers and admins)
- Delete patron records (admins only)
- View patron checkout history
- Track overdue incidents per patron
- Track damage incidents per patron
- Block patrons with overdue tools from new checkouts
- Admin override for blocked patrons (with required note and logging)
- Search patrons by name
- Edit history tracking (who changed what and when)

### 3. Tool Inventory Management
**Required Information:**
- Tool name
- Category
- Quantity (some tools tracked individually, some as quantities)
- Description (manufacturer, size, etc.)
- Donor information (optional)
- Date added to circulation
- Condition status (good, needs repair, damaged, lost)
- Images (multiple photos per tool)

**Features:**
- Create/edit/view tool records
- Delete tool records (admins only)
- Upload multiple images per tool
- Track tool as individual item or quantity
- Add damage notes with images
- Mark tools with condition status
- Automatically prevent checkout of damaged/repair needed/lost tools
- Associate lost tools with last patron
- Require note when marking tool as lost
- Search/filter tools by name, category, or browse images
- Edit history tracking
- Keep lost/damaged tools in database (soft delete concept)

### 4. Category Management
- Admins create/edit/delete categories
- Categories stored in database
- Used for organizing and filtering tools

### 5. Tool Checkout System
**Features:**
- Search available tools (by name, category, visual browsing)
- Default view: available tools only, sorted by category
- Option to show all tools (still sorted by category)
- Select patron for checkout
- Check out multiple tools in single transaction
- Configurable checkout period:
  - Global default setting
  - Override at checkout with note
- Track checkout date/time
- Track which volunteer performed checkout
- Prevent checkout to patrons with overdue tools (unless admin override)

### 6. Tool Check-in System
**Features:**
- Search checked-out tools
- Record check-in date/time
- Mark tool condition on return
- Add damage notes and photos if needed
- Track which volunteer performed check-in
- Update tool availability status

### 7. Overdue Management
**Features:**
- Track checkout period per tool
- Calculate overdue status automatically
- Volunteers can mark tools as overdue
- Generate reminder message for manual sending
- Track when reminder was last sent
- View overdue tool list

### 8. Public Inventory Page
**Features:**
- View all tools (name, category, quantity, availability)
- Filter by category
- Filter by availability status
- No authentication required
- Mobile-responsive design

### 9. Volunteer Management (Admin Only)
**Required Information:**
- Full name
- Email (for login)
- Phone
- Mailing address
- Signed agreement uploads (PDF, multiple files)
- Training date
- Trainer name
- Role (volunteer or admin)

**Features:**
- Create volunteer accounts
- Edit volunteer information
- Set permissions (volunteer vs admin)
- Track training information
- Upload volunteer agreements

### 10. File Upload System
**Features:**
- Support multiple file uploads per patron/volunteer
- PDF and image support
- No file size limits initially
- Track upload date
- Label/describe each file
- No deletion/replacement for now
- Store files on local filesystem

### 11. Audit & History Tracking
**System tracks:**
- Who checked out each tool and when
- Who checked in each tool and when
- Edit history for tools and patrons (who changed what and when)
- Admin overrides with notes
- Login history
- Reminder send dates

---

## Future Enhancements (Not in Initial Implementation)

1. **Reporting & Analytics**
   - Checkout counts by time period
   - Most frequently borrowed tools
   - Underutilized tools
   - Patron activity reports
   - Overdue rate tracking

2. **Dashboard/Notifications**
   - Overdue tools count on login
   - Tools due today
   - Recently damaged tools alert
   - System notifications

3. **Automated Communications**
   - Email/SMS reminder system
   - Automatic overdue notifications

4. **Advanced Features**
   - Periodic agreement renewals
   - Repair job tracking system (separate from condition status)
   - Tool reservation system
   - QR code/barcode scanning
   - Bulk import tools from spreadsheet
   - Data export functionality
   - Automated backup system

5. **Permission Refinements**
   - Intermediate permission levels
   - Senior volunteers
   - Read-only access

6. **UI Enhancements**
   - Dark mode
   - Advanced accessibility features
   - Tool images on public page

---

## Implementation Plan

This plan breaks the project into standalone steps that can be completed in separate sessions.

### Phase 1: Project Setup & Foundation

#### Step 1: Initial Project Setup
**Goal:** Create the basic SvelteKit project structure with TypeScript and Prisma
- Initialize SvelteKit 2.0 project with TypeScript
- Install and configure Prisma with SQLite
- Set up Tailwind CSS for styling
- Configure project structure (routes, lib, components)
- Set up environment variables
- Create .gitignore and basic documentation
- Test that development server runs

**Deliverables:**
- Working SvelteKit dev environment
- Prisma configured with SQLite
- Basic project structure
- README with setup instructions

---

#### Step 2: Database Schema & Migrations
**Goal:** Define complete Prisma schema for all entities
- Create Prisma schema for:
  - Users (volunteers/admins with permissions)
  - Patrons
  - Tools
  - Categories
  - Checkouts
  - Files (for agreements and images)
  - AuditLog (for edit history)
  - LoginHistory
  - OverrideLog
- Define relationships between entities
- Run initial migration
- Create seed script for first admin account

**Deliverables:**
- Complete schema.prisma file
- Initial migration files
- Setup script for creating first admin
- Documentation of schema relationships

---

### Phase 2: Authentication & User Management

#### Step 3: Authentication System
**Goal:** Implement secure login/logout functionality
- Create authentication utilities (password hashing with bcrypt)
- Build session management system
- Create login page with form validation
- Implement logout functionality
- Add session timeout
- Create authentication middleware/hooks
- Track login history
- Build password reset (admin-initiated) functionality

**Deliverables:**
- Working login/logout system
- Session management
- Protected route middleware
- Login history tracking
- Basic layout with navigation

---

#### Step 4: Volunteer Management (Admin)
**Goal:** Allow admins to create and manage volunteer accounts
- Create volunteer list page (admin only)
- Build create volunteer form with validation
  - Name, email, phone, address
  - Training date and trainer
  - Role selection (volunteer/admin)
- Build edit volunteer page
- File upload for volunteer agreements
- Display uploaded files with dates
- Implement permission checks
- Add audit logging for volunteer changes

**Deliverables:**
- Volunteer CRUD operations (admin only)
- File upload functionality
- Training information tracking
- Permission-based access control

---

### Phase 3: Core Data Management

#### Step 5: Category Management
**Goal:** Allow admins to manage tool categories
- Create category list page (admin only)
- Build create category form
- Build edit category functionality
- Build delete category (with confirmation)
- Validate category is not in use before deletion

**Deliverables:**
- Category CRUD operations (admin only)
- Category list display
- Validation for category deletion

---

#### Step 6: Patron Management
**Goal:** Enable volunteer/admin management of patron records
- Create patron list page with search
- Build create patron form with validation
  - Name, email/phone (at least one), address
- Build edit patron page
- File upload for patron agreements
- Display patron checkout history
- Display overdue incident count
- Display damage incident count
- Show patron blocked status
- Implement delete (admin only)
- Add audit logging for patron changes

**Deliverables:**
- Patron CRUD operations
- Patron search functionality
- Agreement upload
- History displays
- Audit trail

---

#### Step 7: Tool Inventory Management (Part 1)
**Goal:** Create basic tool inventory system
- Create tool list page with search/filter
  - Filter by category
  - Filter by availability
  - Search by name
  - Sort by category
- Build create tool form
  - Name, category, description
  - Quantity tracking
  - Donor information
  - Date added
- Build edit tool page
- Image upload for tools (multiple images)
- Display tool images in gallery view

**Deliverables:**
- Tool CRUD operations
- Tool search and filtering
- Image upload and display
- Category-based organization

---

#### Step 8: Tool Inventory Management (Part 2)
**Goal:** Add condition tracking and damage management
- Add condition status dropdown (good, needs repair, damaged, lost)
- Create damage report form
  - Notes field
  - Image upload
  - Associate with patron if applicable
- Implement automatic checkout prevention for damaged/lost tools
- Display damage history per tool
- Build "mark as lost" functionality with required note
- Implement delete (admin only)
- Add audit logging for tool changes

**Deliverables:**
- Condition status tracking
- Damage reporting with images
- Lost tool tracking
- Checkout prevention logic
- Complete audit trail

---

### Phase 4: Checkout System

#### Step 9: Tool Checkout Flow
**Goal:** Enable volunteers to check out tools to patrons
- Create checkout page
- Tool selection interface
  - Show available tools by default, sorted by category
  - Option to show all tools
  - Visual browsing with images
  - Support multiple tool selection
- Patron selection/search
- Checkout period configuration
  - Display global default
  - Allow override with note field
- Validate patron is not blocked (overdue tools)
- Admin override for blocked patrons (with required note)
- Record checkout transaction
  - Checkout date/time
  - Volunteer who performed checkout
  - Tools checked out
  - Due date
- Update tool availability
- Display confirmation

**Deliverables:**
- Complete checkout workflow
- Multi-tool checkout support
- Patron block validation
- Admin override functionality
- Checkout transaction logging

---

#### Step 10: Tool Check-in Flow
**Goal:** Enable volunteers to check in returned tools
- Create check-in page
- Show list of checked-out tools
- Search/filter checked-out tools
- Select tools to check in (support multiple)
- Record check-in transaction
  - Check-in date/time
  - Volunteer who performed check-in
- Condition assessment on return
  - Mark condition status if changed
  - Add damage notes if needed
  - Upload damage photos if needed
- Update tool availability
- Calculate if return was overdue
- Update patron overdue incident count if applicable
- Display confirmation

**Deliverables:**
- Complete check-in workflow
- Condition assessment on return
- Overdue calculation
- Check-in transaction logging
- Patron incident tracking

---

### Phase 5: Overdue Management

#### Step 11: Overdue Tracking & Reminders
**Goal:** Manage overdue tools and send reminders
- Create overdue tools view
  - List all overdue checkouts
  - Show days overdue
  - Display patron information
  - Show last reminder sent date
- Build manual "mark as overdue" functionality
- Create reminder message generator
  - Generate text message with:
    - Patron name
    - Tool names
    - Due date
    - Days overdue
  - Display message for volunteer to copy
- Track reminder sent date
- Update patron record when reminder sent

**Deliverables:**
- Overdue tools dashboard
- Manual overdue marking
- Reminder message generation
- Reminder tracking

---

### Phase 6: Public Interface

#### Step 12: Public Inventory Page
**Goal:** Create public-facing tool inventory display
- Create public route (no authentication)
- Display all tools with:
  - Tool name
  - Category
  - Quantity
  - Availability status (available/checked out)
- Implement category filter
- Implement availability filter
- Mobile-responsive design
- Performance optimization for public access

**Deliverables:**
- Public inventory page
- Search and filter functionality
- Mobile-responsive layout
- No authentication required

---

### Phase 7: Polish & Deployment

#### Step 13: Admin Dashboard & Settings
**Goal:** Create admin configuration interface
- Build admin dashboard
- Global settings management
  - Default checkout period
  - System configuration
- View system statistics (basic counts)
- Admin-specific navigation

**Deliverables:**
- Admin dashboard
- Settings management
- System overview

---

#### Step 14: UI/UX Polish
**Goal:** Refine user interface and experience
- Consistent styling across all pages
- Form validation and error messages
- Loading states and feedback
- Confirmation dialogs for destructive actions
- Mobile responsiveness refinement
- Accessibility improvements (keyboard navigation, labels)
- Success/error toast notifications
- Help text and tooltips where needed

**Deliverables:**
- Polished, consistent UI
- Better user feedback
- Improved mobile experience
- Basic accessibility features

---

#### Step 15: Testing & Deployment
**Goal:** Test thoroughly and deploy application
- Manual testing of all workflows
  - Authentication
  - CRUD operations
  - Checkout/check-in
  - Permission enforcement
  - File uploads
- Edge case testing
  - Overdue calculations
  - Blocked patrons
  - Admin overrides
  - Concurrent checkouts
- Prepare deployment documentation
  - Self-hosting instructions
  - Vercel deployment guide
  - Environment variable setup
  - First-time setup steps
- Deploy to chosen platform
- Create user guide/manual

**Deliverables:**
- Tested application
- Deployment documentation
- User manual
- Deployed application

---

## Technical Considerations

### Database
- SQLite single-file database (portable, zero-config)
- Prisma migrations for schema changes
- Regular backups via file copy (future enhancement)
- Consider file size limits as data grows

### File Storage
- Store uploaded files in organized directory structure
- File paths stored in database
- Consider disk space on hosting platform
- Future: implement file size limits

### Security
- Password hashing with bcrypt (salt rounds: 10-12)
- Session-based authentication (no JWT initially)
- CSRF protection via SvelteKit
- SQL injection protection via Prisma
- Input validation and sanitization
- Permission checks on all protected routes
- Audit logging for accountability

### Performance
- Lazy load images where appropriate
- Paginate long lists (future enhancement)
- Index database fields used in searches
- Optimize public page for quick loading
- Consider CDN for public assets (future)

### Mobile Responsiveness
- Target devices: 8" tablets, small laptops, phones
- Touch-friendly interface elements
- Readable text sizes
- Simplified navigation on mobile
- Test on actual target devices

### Hosting Considerations (Budget-Friendly)
**Self-Hosted:**
- Minimum requirements: 1GB RAM, 10GB storage
- Node.js 18+ required
- Simple deployment with PM2 or systemd

**Vercel Free Tier:**
- Serverless functions
- 100GB bandwidth/month
- SQLite works but consider migration to hosted DB if scaling
- Adapter configuration required

**Alternative: Railway Free Tier**
- Better for SQLite persistence
- $5 free credit/month
- Easy deployment

---

## Development Guidelines

### Code Organization
```
src/
├── lib/
│   ├── server/
│   │   ├── auth.ts          # Authentication utilities
│   │   ├── db.ts            # Prisma client
│   │   └── permissions.ts   # Permission checking
│   ├── components/          # Reusable Svelte components
│   ├── types/              # TypeScript types
│   └── utils/              # Shared utilities
├── routes/
│   ├── (public)/           # Public routes (no auth)
│   ├── (auth)/             # Protected routes
│   └── api/                # API endpoints
└── prisma/
    └── schema.prisma       # Database schema
```

### Naming Conventions
- Components: PascalCase (ToolCard.svelte)
- Files: kebab-case (tool-checkout.svelte)
- Database tables: PascalCase (Tool, Patron)
- API routes: kebab-case (/api/tools/checkout)

### Git Workflow
- Main branch: production-ready code
- Feature branches for each implementation step
- Meaningful commit messages
- Regular commits during development

---

## Success Metrics

The project will be considered successful when:
1. All core features are implemented and working
2. Public can view inventory without authentication
3. Volunteers can check out/in tools efficiently
4. Admins can manage users and override restrictions
5. System tracks history and audit trails properly
6. Application is mobile-responsive
7. Deployed and accessible to volunteers
8. User documentation is complete

---

## Notes & Assumptions

- Non-profit with zero budget, so free/open-source only
- Volunteer-run operation with varied schedules
- No email/SMS integration initially (manual reminders)
- Keep UI simple and intuitive for non-technical volunteers
- Prioritize core functionality over advanced features
- Plan for future enhancements without over-engineering initial version
- Super user maintains database access for emergency situations
- Security and audit trails are important for accountability
- Mobile access is critical for on-site operations

---

## Appendix: Key Data Models

### User (Volunteer/Admin)
- id, email, password_hash, name, phone, address
- role (volunteer | admin)
- training_date, trained_by
- created_at, updated_at

### Patron
- id, name, email, phone, address
- blocked (boolean), overdue_count, damage_count
- created_at, updated_at

### Tool
- id, name, description, category_id, quantity
- donor, date_added, condition_status
- created_at, updated_at

### Checkout
- id, tool_id, patron_id, volunteer_id
- checkout_date, due_date, checkin_date, checkin_volunteer_id
- override_note, status (checked_out | returned | overdue)

### File
- id, entity_type (patron | volunteer | tool)
- entity_id, file_path, file_type, label
- uploaded_at, uploaded_by

### AuditLog
- id, entity_type, entity_id, user_id
- action (create | update | delete), changes (JSON)
- timestamp

This specification document should guide the complete implementation of the Tool Library Management System.