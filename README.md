# PHHS Hack Club Site

Official website, member portal, and admin tools for Pascack Hills High School Hack Club.

## Overview

This repo powers:

- The public club site
- A member portal for projects and devlogs
- A gallery for approved work
- Admin tools for meetings, attendance, announcements, verification, and email
- A PM2-managed reminder worker that emails admins when a meeting summary still needs to be filled out

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js App Router |
| UI | React + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| File storage | MinIO |
| Auth | Hack Club OAuth + JWT session cookies |
| Email | Nodemailer |
| Markdown | `react-markdown`, `remark-gfm`, `rehype-raw` |
| Process manager | PM2 |

## Features

### Public site

- Home, about, events, meetings, gallery, members, donate, contact, mailing list, and leaderboard pages
- Public meeting schedule with past-meeting summaries and materials
- Public gallery for approved projects
- Member profile pages and directory

### Member portal

- Hack Club sign-in
- Project drafts and submissions
- Devlog drafts and submissions
- Markdown editing and preview
- Image uploads through MinIO
- Optional Hackatime project linking

### Admin tools

- Verification approval
- Submission review
- Member management
- Meeting scheduling
- Meeting summaries and materials
- Attendance tracking and reporting
- Announcement publishing and email sending
- General admin email tools
- Site modal management

### Background worker

- `phhs-site-meeting-summary-worker` runs under PM2
- Polls the internal reminder endpoint once per minute
- Sends summary reminder emails after 5:00 PM America/New_York on meeting days
- Uses `summaryReminderSentAt` to avoid duplicate sends

## Project structure

```text
src/
  app/
    admin/          admin pages
    api/            route handlers
    portal/         member portal pages
    ...             public routes
  components/       shared UI and client components
  lib/              auth, Prisma, email, storage, and utilities
prisma/
  schema.prisma
  migrations/
public/
scripts/
  meeting-summary-reminder-worker.mjs
docs/
  plans/
```

## Requirements

- Node.js 22+
- Docker and Docker Compose
- PostgreSQL and MinIO containers from `docker compose`

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start local services

```bash
docker compose up -d
```

Default local ports:

- App: `3007`
- Postgres: `5434`
- MinIO API: `9002`
- MinIO Console: `9003`

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in the OAuth, SMTP, admin, and JWT values before using the full app.

### 4. Set up Prisma

```bash
npx prisma migrate deploy
npx prisma generate
```

If you are creating a new local migration during development:

```bash
npx prisma migrate dev --name your_change_name
```

### 5. Run the app

```bash
npm run dev
```

Open `http://localhost:3007`.

## Environment variables

See [`.env.example`](/srv/md0/hackclub/phhs-site/.env.example) for the full template.

### Database

```env
DATABASE_URL=postgresql://phhs:password@localhost:5434/phhs_hack_club
```

### MinIO

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9002
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=phhs-uploads
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9002/phhs-uploads
```

### Hack Club auth

```env
HACKCLUB_CLIENT_ID=
HACKCLUB_CLIENT_SECRET=
HACKCLUB_REDIRECT_URI=http://localhost:3007/api/auth/callback
```

### Hackatime auth

```env
HACKATIME_CLIENT_ID=
HACKATIME_CLIENT_SECRET=
HACKATIME_REDIRECT_URI=http://localhost:3007/api/auth/hackatime/callback
```

### Email

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
CONTACT_EMAIL_TO=
ADMIN_EMAIL=
```

### App and jobs

```env
JWT_SECRET=change-me
NEXT_PUBLIC_URL=https://your-site.com
OPENROUTER_API_KEY=
CRON_SECRET=
```

`CRON_SECRET` protects the internal meeting-summary reminder endpoint and is required for the PM2 worker.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
```

Useful Prisma commands:

```bash
npx prisma migrate dev --name your_change_name
npx prisma migrate deploy
npx prisma generate
npx prisma studio
```

## Deployment

Production uses PM2 with [ecosystem.config.js](/srv/md0/hackclub/phhs-site/ecosystem.config.js).

Build and restart the web app:

```bash
npm run build
```

Start both the site and the worker:

```bash
pm2 start ecosystem.config.js
```

Reload both with updated env:

```bash
pm2 startOrReload ecosystem.config.js --update-env
```

Save the current PM2 process list:

```bash
pm2 save
```

Inspect worker logs:

```bash
pm2 logs phhs-site-meeting-summary-worker
```

## Data model

Main Prisma models:

- `Member`
- `Project`
- `Devlog`
- `Image`
- `VerificationRequest`
- `SiteModal`
- `AttendanceRecord`
- `Meeting`
- `Event`
- `MailingListEntry`
- `Announcement`

Relevant enums:

- `Role`
- `SubmissionStatus`
- `VerificationStatus`

## Validation

There is no automated test suite yet. Before shipping changes, run:

```bash
npm run lint
npm run build
```

Manual verification matters most for:

- Auth flows
- Project and devlog submission
- Image uploads
- Admin approval flows
- Attendance tracking
- Meeting summary editing
- Reminder email delivery

## Notes

- `npm run build` runs `next build` and then restarts `phhs-site` through PM2
- The reminder scheduler is implemented as a separate PM2 worker, not a system cron job
- Prisma migration history in `prisma/migrations/` must stay intact
