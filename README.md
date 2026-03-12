# PHHS Hack Club

Website for Pascack Hills High School's chapter of the global [Hack Club](https://hackclub.com) network.

Built with Next.js 16, Prisma, PostgreSQL, and MinIO.

## Features

- **Public site** — home, about, events, gallery, donate pages
- **Member portal** — project + devlog creation with markdown editor, image uploads, auto-save drafts
- **Gallery** — approved projects with full detail pages (screenshots, devlogs, rendered markdown)
- **Admin panel** — submission review queue, member management, verification approvals
- **Auth** — Hack Club OAuth + JWT session cookies, role-based access (PRESIDENT / VP / MEMBER)

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | PostgreSQL via Prisma |
| File storage | MinIO (S3-compatible) |
| Auth | Hack Club OAuth + jose JWT |
| Styling | CSS variables, Phantom Sans |
| Process manager | PM2 |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- MinIO instance

### Setup

```bash
npm install
cp .env.example .env
# fill in .env values
npx prisma migrate dev
npm run dev
```

App runs on `http://localhost:3007`.

### Environment Variables

See `.env.example` for all required variables. Key ones:

```env
DATABASE_URL=           # PostgreSQL connection string
MINIO_ENDPOINT=         # MinIO hostname (no protocol)
MINIO_PORT=             # MinIO port
MINIO_USE_SSL=          # true/false
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=           # bucket name
MINIO_PUBLIC_URL=       # public-facing base URL for images (e.g. https://minio.example.com/bucket)
HACKCLUB_CLIENT_ID=     # Hack Club OAuth app ID
HACKCLUB_CLIENT_SECRET=
HACKCLUB_REDIRECT_URI=  # must match OAuth app config
JWT_SECRET=             # random secret for signing session tokens
```

## Deployment

Build and start with PM2:

```bash
npm run build
pm2 start ecosystem.config.js
```

Or restart an existing process:

```bash
npm run build && pm2 restart phhs-site
```

## Database

```bash
npx prisma migrate dev     # run migrations in development
npx prisma migrate deploy  # run migrations in production
npx prisma studio          # open database GUI
```

## Project Structure

```
src/
  app/
    (public pages)  about, events, gallery, donate, contact
    portal/         member dashboard, project/devlog editor
    admin/          submission queue, member management
    api/            REST endpoints
  components/       shared UI components
  lib/              prisma, auth, minio, images utilities
prisma/
  schema.prisma     database schema
public/
  logos/            club logo assets
```
