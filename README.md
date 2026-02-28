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

## PM2 Deployment (Recommended for Ubuntu/Linux VMs)

This guide covers deploying the application using PM2, a production process manager for Node.js applications.

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- PM2 (`npm install -g pm2`)

### Deployment Steps

1. **Clone the repository:**

```bash
git clone <repository-url>
cd library-management
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Create data directories:**

```bash
mkdir -p data uploads
```

4. **Configure environment variables:**

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file
nano .env
```

Set these values in `.env`:

```bash
DATABASE_URL="file:./data/library.db"
NODE_ENV="production"
PORT=3000
HOST="0.0.0.0"
# ORIGIN="http://your-domain-or-ip:3000"  # Optional: Set if using reverse proxy
```

5. **Set up the database:**

```bash
# Generate Prisma client
pnpm exec prisma generate

# Run database migrations
pnpm exec prisma migrate deploy

# Optional: Seed the database with initial data
DATABASE_URL="file:./data/library.db" pnpm exec tsx prisma/seed.ts
```

6. **Build the application:**

```bash
pnpm build
```

7. **Start with PM2:**

```bash
# Start the application
pm2 start build/index.js --name library-management

# Save PM2 process list
pm2 save

# Configure PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the command above
```

### PM2 Management Commands

```bash
# View application logs
pm2 logs library-management

# Monitor all processes
pm2 monit

# View process status
pm2 status

# Restart the application
pm2 restart library-management

# Stop the application
pm2 stop library-management

# Delete the application from PM2
pm2 delete library-management

# View detailed process information
pm2 info library-management
```

### Updating the Application

When you need to deploy updates:

```bash
# Pull latest changes
git pull

# Install any new dependencies
pnpm install

# Run any new migrations
pnpm exec prisma migrate deploy

# Rebuild the application
pnpm build

# Restart with PM2
pm2 restart library-management
```

### Setting up Nginx Reverse Proxy (Optional)

For production deployments, it's recommended to use Nginx as a reverse proxy:

1. **Install Nginx:**

```bash
sudo apt update
sudo apt install -y nginx
```

2. **Create Nginx configuration:**

```bash
sudo nano /etc/nginx/sites-available/library-management
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # or your server IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/library-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Update .env with your domain:**

```bash
nano .env
# Uncomment and set: ORIGIN="http://yourdomain.com"
```

Then restart the application:

```bash
pnpm build
pm2 restart library-management
```

### Setting up SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Update .env with HTTPS
nano .env
# Set: ORIGIN="https://yourdomain.com"

# Rebuild and restart
pnpm build
pm2 restart library-management
```

### Troubleshooting

**403 Forbidden errors on form submission:**

- Ensure ORIGIN is set in .env if using a reverse proxy
- Or disable CSRF checking in svelte.config.js (already configured in this project)

**Database connection errors:**

- Verify DATABASE_URL is set in .env
- Ensure the data directory exists and is writable
- Check that prisma generate has been run

**Application won't start:**

- Check PM2 logs: `pm2 logs library-management`
- Verify the build was successful: `ls -la build/`
- Ensure PORT 3000 is not already in use

### Production Considerations

- **Backups:** Regularly backup the `data/` directory (contains SQLite database)
- **Monitoring:** Use `pm2 monit` or set up external monitoring
- **Updates:** Always test updates in a staging environment first
- **Security:** Keep Node.js, pnpm, and system packages updated
- **Firewall:** Configure UFW or iptables to restrict access to necessary ports only

## Docker Deployment

This project includes Docker support for easy deployment to Ubuntu VMs or any Docker-compatible environment.

### Quick Start with Docker

1. **Build the Docker image:**

```bash
docker build -t library-management .
```

2. **Run with docker-compose (recommended):**

```bash
# Create data directories for persistence
mkdir -p data uploads

# Start the application
docker-compose up -d
```

The application will be available at `http://localhost:3000`

3. **Or run with Docker directly:**

```bash
# Create data directories
mkdir -p data uploads

# Run the container
docker run -d \
  --name library-management \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  -e DATABASE_URL="file:/app/data/library.db" \
  library-management
```

### Docker Configuration

The Docker setup includes:

- **Multi-stage build** for optimized image size
- **Node.js adapter** for standalone deployment
- **Persistent volumes** for database and uploaded files
- **Health checks** for monitoring
- **Non-root user** for security

### Environment Variables

Create a `.env` file for production (see `.env.example`):

```bash
# Copy the example file
cp .env.example .env

# Edit with your production values
DATABASE_URL="file:/app/data/library.db"
NODE_ENV="production"
PORT=3000
HOST="0.0.0.0"
# ORIGIN="https://yourdomain.com"  # Set in production with reverse proxy
```

### Database Initialization

The first time you run the container, you'll need to initialize the database:

```bash
# Using docker-compose
docker-compose exec app sh -c "npx prisma migrate deploy"

# Or with Docker directly
docker exec -it library-management sh -c "npx prisma migrate deploy"

# Optional: Seed the database
docker exec -it library-management sh -c "npx tsx prisma/seed.ts"
```

### Managing the Application

```bash
# View logs
docker-compose logs -f app

# Stop the application
docker-compose down

# Restart after code changes
docker-compose up -d --build

# Access the container shell
docker-compose exec app sh
```

### Deployment to Ubuntu VM

1. **Install Docker on Ubuntu:**

```bash
# Update packages
sudo apt update
sudo apt install -y docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (optional, logout/login required)
sudo usermod -aG docker $USER
```

2. **Clone and deploy:**

```bash
# Clone the repository
git clone <repository-url>
cd library-management

# Copy and configure environment
cp .env.example .env
nano .env  # Edit as needed

# Create data directories
mkdir -p data uploads

# Build and start
docker-compose up -d

# Initialize database
docker-compose exec app sh -c "npx prisma migrate deploy"
```

3. **Optional: Set up reverse proxy with Nginx:**

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/library-management
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/library-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

If needing to restart after config +env change 

```bash
pm2 restart ecosystem.config.cjs --update-env
```
### Production Considerations

- **Backups:** Regularly backup the `data/` directory (contains SQLite database)
- **SSL/TLS:** Use Let's Encrypt with Certbot for HTTPS
- **Monitoring:** Check logs regularly with `docker-compose logs`
- **Updates:** Pull latest code, rebuild, and restart the container
- **Security:** Keep Docker and the host system updated

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

## Manual sqlite

```bash
sqlite3 ./prisma/data/library.db
```

Makes results readable

```sql
.mode column
.headers on
.width 5 20 30 20
```

```sql
SELECT * FROM files;
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


