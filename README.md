# PHHS Hack Club Website

Official website and member portal for Pascack Hills High School's Hack Club chapter.

This project includes the public-facing club site, a member portal for submitting projects and devlogs, a gallery for approved work, and an admin panel for managing member verification and submissions.

## What The Site Does

- Publishes public pages for the club, including the home page, about page, events page, gallery, donate page, contact page, members page, and Hackatime leaderboard
- Lets verified members sign in with Hack Club OAuth
- Gives members a portal to create projects, write devlogs in Markdown, upload images, and submit work for review
- Shows approved projects in a public gallery with screenshots, rendered Markdown, and coding-hour data from Hackatime
- Gives club admins tools to approve verification requests, review submissions, and manage member roles

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js App Router + React + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| File storage | MinIO (S3-compatible object storage) |
| Authentication | Hack Club OAuth + signed JWT session cookies |
| Email | Nodemailer |
| Content editing | Markdown editor + Markdown preview |
| Deployment | PM2 |

## Core Features

### Public Site

- Home, about, events, gallery, donate, contact, members, and leaderboard pages
- Club information, meeting schedule, and donation messaging
- Public gallery pages for approved student projects
- Members directory with roles, approved-project counts, and optional profile pictures
- Monthly Hackatime leaderboard

### Member Portal

- Hack Club OAuth login flow
- Project creation and editing
- Devlog creation and editing
- Image uploads backed by MinIO
- Markdown-based writing flow
- Draft and submission status tracking
- Debounced autosave for project drafts
- Optional Hackatime project linking so gallery pages can display coding hours

### Admin Tools

- Verification request approval flow
- Submission review queue for projects and devlogs
- Member management with role-based access

## Local Development

### Prerequisites

- Node.js 20+
- Docker and Docker Compose

### 1. Install dependencies

```bash
npm install
```

### 2. Start local services

This repo includes local PostgreSQL and MinIO containers:

```bash
docker compose up -d
```

Default local ports:

- App: `3007`
- PostgreSQL: `5434`
- MinIO API: `9002`
- MinIO Console: `9003`

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then fill in the required values for Hack Club OAuth, Hackatime OAuth, SMTP, admin email, and JWT signing.

### 4. Set up the database

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Start the app

```bash
npm run dev
```

Open `http://localhost:3007`.

## Environment Variables

The full template lives in [`.env.example`](/srv/md0/hackclub/phhs-site/.env.example).

### Database

```env
DATABASE_URL=
```

### MinIO

```env
MINIO_ENDPOINT=
MINIO_PORT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=
MINIO_USE_SSL=
MINIO_PUBLIC_URL=
```

`MINIO_PUBLIC_URL` should point to the public base path for the configured bucket, for example `http://localhost:9002/phhs-uploads`.

### Hack Club Auth

```env
HACKCLUB_CLIENT_ID=
HACKCLUB_CLIENT_SECRET=
HACKCLUB_REDIRECT_URI=
```

### Hackatime Auth

```env
HACKATIME_CLIENT_ID=
HACKATIME_CLIENT_SECRET=
HACKATIME_REDIRECT_URI=
```

### Email

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
CONTACT_EMAIL_TO=
```

### Admin / Session

```env
ADMIN_EMAIL=
JWT_SECRET=
```

## Available Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
```

Useful Prisma commands:

```bash
npx prisma migrate dev
npx prisma migrate deploy
npx prisma studio
```

## Project Structure

```text
src/
  app/
    api/            route handlers
    admin/          admin dashboard pages
    portal/         member portal pages
    about/          public pages
    contact/
    donate/
    events/
    gallery/
    leaderboard/
    members/
  components/       shared UI and client components
  lib/              auth, Prisma, MinIO, and server utilities
prisma/
  schema.prisma     database schema
  migrations/       Prisma migrations
public/             static assets
docs/plans/         planning notes
```

## Database Model

Main Prisma models:

- `Member`
- `Project`
- `Devlog`
- `Image`
- `VerificationRequest`

The schema also defines `Role`, `SubmissionStatus`, and `VerificationStatus` enums.

## Deployment

Production is configured to run through PM2 using [`ecosystem.config.js`](/srv/md0/hackclub/phhs-site/ecosystem.config.js).

```bash
npm run build
pm2 start ecosystem.config.js
```

Or restart an existing process:

```bash
pm2 restart phhs-site
```

## Validation

There is no dedicated automated test suite yet. Before shipping changes, run:

```bash
npm run lint
npm run build
```

Manual verification is especially important for:

- OAuth login flows
- Portal project submission
- Devlog submission
- Image upload behavior
- Contact form email delivery
- Admin approval flows
