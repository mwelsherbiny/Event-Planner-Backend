# Event Planner API

Backend API for an event planning platform built with Express, TypeScript, Prisma, PostgreSQL, Firebase Cloud Messaging, and Cloudinary.

## Overview

This project provides:
- User authentication with access/refresh token flow and OTP-based verification/reset.
- Event management for public/private events.
- Invite workflows (send, accept, reject) with role/permission assignment.
- Notifications (in-app + FCM push token registration).
- Image upload support for user profiles and event images.

## Tech Stack

- Runtime: Node.js + TypeScript
- Framework: Express 5
- Database: PostgreSQL + Prisma ORM
- Auth: JWT + bcrypt
- Validation: Zod
- Notifications: Firebase Admin SDK (FCM)
- Media: Cloudinary
- Logging: Morgan

## Project Structure

```text
src/
  app.ts                      # Express app setup + routes
  server.ts                   # Bootstrap + HTTP server
  config/                     # Environment and app constants
  errors/                     # Error classes/codes
  features/
    auth/                     # Auth, OTP, token lifecycle
    user/                     # User profile and user event lists
    event/                    # Event CRUD, attendees, managers, attendance
    invite/                   # Invite details + accept/reject
    notification/             # Notifications and FCM token registration
  integrations/
    db/                       # Prisma client
    firebase/                 # Firebase initialization + FCM integration
    cloudinary/               # Cloudinary setup + image upload helper
  shared/
    middleware/               # Validation, auth, upload, error handlers
    util/                     # Cache/bootstrap helpers

prisma/
  schema.prisma               # DB schema
  migrations/                 # Prisma migrations
```

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+
- PostgreSQL database
- Cloudinary account
- Firebase service account JSON key

## Environment Configuration

The app reads environment variables from:
- development: config.env
- production: .env

1. Copy the example file:

```bash
cp config.env.example config.env
```

2. Add all required variables.

### Required Environment Variables

```env
# App
PORT=3000
NODE_ENV=development

# Auth
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
ACCESS_TOKEN_EXPIRY=900
OTP_CODE_EXPIRY=900
REFRESH_TOKEN_EXPIRY=2592000
RESET_TOKEN_SECRET=...
RESET_TOKEN_EXPIRY=300

# Email (OTP + password reset)
EMAIL_HOST=...
EMAIL_PORT=...
EMAIL_USERNAME=...
EMAIL_PASSWORD=...
EMAIL_FROM=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Prisma / PostgreSQL
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### Firebase Key

Firebase Admin is initialized from the root file:

- serviceAccountKey.json

Create this file at the project root using your Firebase service account credentials.

## Installation & Local Run

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run generate
```

3. Run migrations:

```bash
npm run migrate
```

4. Seed event roles and role permissions (important before using event/invite permissions):

```bash
npx tsx src/scripts/insert_roles.ts
npx tsx src/scripts/insert_permissions.ts
```

5. Start dev server:

```bash
npm run start:dev
```

Health check:

```text
GET /api/health
```

## Available npm Scripts

- npm run clean: remove dist
- npm run lint: run ESLint
- npm run lint:fix: lint and auto-fix
- npm run format: check formatting
- npm run format:fix: apply formatting
- npm run typecheck: TypeScript type check
- npm run build: compile to dist
- npm run start:dev: run in watch mode with tsx
- npm run start: run compiled app
- npm run migrate: run prisma migrate dev
- npm run generate: generate Prisma client

## Database 

<img width="1961" height="1767" alt="Untitled" src="https://github.com/user-attachments/assets/118952df-6351-4219-b69c-25ba53d64c71" />


## Authentication

- Public routes are under /api/auth.
- All other feature routes require Authorization: Bearer <access_token>.
- Access token payload is injected into req.payload by auth middleware.

## API Routes

Base prefix: /api

### Health

- GET /health

### Auth

- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
- PATCH /auth/verify-user
- POST /auth/resend-verification-otp
- POST /auth/forgot-password
- POST /auth/verify-otp
- POST /auth/reset-password

### Users (Protected)

- GET /users/me
- PATCH /users/me
- GET /users
- GET /users/me/events/attended
- GET /users/me/events/organized

### Events (Protected)

- GET /events
- GET /events/:id
- GET /events/:id/attendees
- GET /events/:id/managers
- GET /events/:id/invites
- POST /events
- PATCH /events/:id
- POST /events/:id/attendees
- POST /events/:id/invites
- POST /events/:id/invites/:inviteId/resend
- POST /events/:id/verify-attendance
- DELETE /events/:id/members/me
- DELETE /events/:id/attendees/:attendeeId
- DELETE /events/:id/managers/:managerId

### Invites (Protected)

- GET /invites/:id
- POST /invites/:id/acceptance
- POST /invites/:id/rejection

### Notifications (Protected)

- POST /notifications/register-token
- PATCH /notifications/read-all
- GET /notifications
- GET /notifications/unread-count
- DELETE /notifications/:id

## Data Model Highlights

Main entities in Prisma schema:
- User, RefreshToken, OtpCode, FcmToken
- Event, Invite, Notification, NotificationReceiver
- Role, RolePermission, UserEventRole, UserEventPermission

Core enums:
- EventRole: ATTENDEE, MANAGER, OWNER
- Permission: fine-grained event permissions (invite, scan, remove, update, etc.)
- EventVisibility, EventState, PaymentMethod, InviteStatus, NotificationType

## Image Uploads

- Upload middleware uses in-memory multer storage.
- Allowed MIME types: image/jpg, image/jpeg, image/png
- Max file size: 5 MB
- Uploaded images are sent to Cloudinary in uploads folder.
