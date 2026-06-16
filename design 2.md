# Ballu — Contractor Marketplace
## Technical Design Document (MERN Stack)

**Version:** 2.0
**Stack:** MERN (MongoDB + Express + React/Next.js + Node.js), JavaScript
**Hosting:** Vercel (frontend) + Hostinger VPS (backend) + MongoDB Atlas (database)
**Scope:** Design-only — flows, architecture, schemas, scalability, extensibility
**Payment integration:** deferred to a later phase (architecturally provisioned, not implemented)

---

## Table of Contents

1. Executive Summary
2. Why MERN Works Here
3. System Architecture
4. Hosting Plan
5. MongoDB Design Philosophy
6. Collection-by-Collection Schema Design
7. Authentication Flow (Email OTP)
8. Role-Based Access Control
9. API Surface (What Each Role Can Do)
10. Core User Flows
11. The Matching & Lead Distribution Engine
12. Ranking Logic
13. File Handling Strategy
14. Notification System
15. Background Jobs
16. Caching Strategy
17. Security Posture
18. Scalability Roadmap
19. Extensibility: Designing for Future Features
20. 12-Week Build Plan
21. Folder Structure
22. Deployment Flow
23. Monitoring & Health
24. Cost Outlook
25. Decisions to Defer

---

## 1. Executive Summary

Ballu is a two-sided marketplace. **Clients** discover and contact verified **contractors** (electricians, plumbers, painters, etc.) in their city. **Contractors** maintain profiles, receive leads, and (in a later phase) pay for subscription tiers that get them more visibility. **Admins** verify documents, moderate content, and operate the platform.

The system must launch lean (100–500 visits/day) but be designed so it does not need to be re-architected when it crosses 10K, 50K, or 100K users. The design decisions below are made with that growth path in mind, while staying within the MERN + MongoDB Atlas constraint you've chosen.

The three principles guiding every decision in this document:

1. **Stateless backend.** Nothing user-specific in Node memory. JWT for auth, Redis for short-lived state. This is what allows adding a second backend instance later without changing any application code.
2. **Schema discipline through Mongoose, not through rigidity.** MongoDB is flexible by nature. We use Mongoose schemas to enforce structure where it matters (auth, payments, audit) and leave room (via `metadata` and `settings` sub-objects) where flexibility helps you add features without migrations.
3. **One source of identity, many profiles.** A single `users` collection with a `role` field. Role-specific data lives in linked collections, not in role-specific user systems. This is what makes RBAC and admin operations clean.

---

## 2. Why MERN Works Here

You've chosen MERN deliberately and I'll design around it. Worth being honest about the tradeoffs so you can engineer around them rather than be surprised by them.

### What MongoDB does well for this product

- **Flexible profile schemas.** A contractor profile has rich, varied content — bio, portfolio, certifications, service areas. As you add fields ("languages spoken," "willing to travel," "emergency hours"), Mongoose lets you evolve the schema without painful migrations.
- **Embedded subdocuments.** A contractor's portfolio items, service categories, working hours — these are naturally part of the profile. Embedding them keeps reads to a single document fetch instead of joins.
- **JSON-native end-to-end.** Mongoose returns objects that map directly to JSON for your API responses. No translation layer between DB rows and HTTP payloads.
- **Atlas operations.** Backups, replicas, monitoring, point-in-time recovery — all managed. You write zero ops code.

### What needs care with MongoDB

These are real and you should design around them:

- **No native joins.** Queries that span collections use `$lookup` in aggregation pipelines, which are slower than SQL joins and harder to optimize. Mitigation: **denormalize hot read fields** (more on this in section 5).
- **Transactions exist but are limited.** Multi-document transactions work on replica sets (Atlas provides this) but cost performance. Mitigation: design business operations to fit within a single document where possible, use transactions only where data integrity demands it (e.g., subscription activation when you add payments).
- **Ranking and search.** Sorting contractors by a weighted score with multiple filters works fine in MongoDB but requires good index design. For full-text search beyond a few thousand contractors, you'll want Atlas Search (built into Atlas) rather than naive regex.
- **Schema drift over years.** Mongoose enforces validation only on writes from your app. If you write data from scripts or migrations carelessly, you can end up with documents that don't match the schema. Mitigation: every write goes through the Mongoose model, never through the driver directly.

### The full stack at a glance

| Layer | Choice | Role |
|---|---|---|
| Frontend framework | Next.js (App Router) | Pages, SSR for SEO, hosting on Vercel |
| Frontend styling | Tailwind CSS + shadcn/ui | Component library and design tokens |
| Frontend state | TanStack Query (server data) + Zustand (UI state) | Avoids Redux complexity |
| Backend runtime | Node.js (latest LTS) | API server, workers |
| Backend framework | Express | Routes, middleware, REST |
| ODM | Mongoose | Schemas, validation, querying |
| Database | MongoDB Atlas | Managed cluster, backups, monitoring |
| Cache + OTP store | Redis (Upstash) | Short-lived state, queues, rate-limit counters |
| Queue | BullMQ (on Redis) | Email, notifications, background recompute |
| File storage | Cloudinary | Images and documents (CDN included) |
| Email | Resend | Transactional email |
| Process manager | PM2 | Keeps Node alive on the VPS |
| Reverse proxy | Nginx | SSL, rate limiting, static files |

You'll write JavaScript. Mongoose schemas give you structure without TypeScript's compile-time checks. Be disciplined about input validation (Joi or Zod for JS works the same) and you can ship safely.

---

## 3. System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                       USERS (Browsers / Phones)                      │
│                Clients    •    Contractors    •    Admins            │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│              FRONTEND  (Vercel — Next.js, server-rendered)           │
│   Public discovery pages • Dashboards for each role • Admin console  │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │ HTTPS (REST API calls)
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                BACKEND  (Hostinger VPS — Ubuntu)                     │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Nginx (SSL termination, rate limiting, reverse proxy)          │ │
│ └────────────────────────────────┬───────────────────────────────┘ │
│                                  ▼                                  │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Node + Express API  (2 PM2-managed instances)                  │ │
│ │ • Auth (JWT)  • RBAC middleware  • Mongoose models             │ │
│ └─────┬──────────────┬──────────────┬──────────────┬─────────────┘ │
│       │              │              │              │                │
│       ▼              ▼              ▼              ▼                │
│  ┌────────┐    ┌─────────┐    ┌─────────┐    ┌──────────────┐      │
│  │ Worker │    │ Mongoose│    │ Redis   │    │ Cloudinary   │      │
│  │ (BullMQ│    │ client  │    │ client  │    │ SDK          │      │
│  │  procs)│    └────┬────┘    └────┬────┘    └──────┬───────┘      │
│  └────┬───┘         │              │                │              │
└───────┼─────────────┼──────────────┼────────────────┼──────────────┘
        │             │              │                │
        ▼             ▼              ▼                ▼
   ┌────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐
   │ Resend │  │ MongoDB Atlas│  │ Upstash  │  │  Cloudinary  │
   │(emails)│  │  (database)  │  │ (Redis)  │  │   (files)    │
   └────────┘  └──────────────┘  └──────────┘  └──────────────┘
```

### Why this shape

- **Frontend on Vercel** — Next.js renders SSR pages for SEO (a contractor profile page like `/contractors/electrician-in-bhopal/some-name` needs to rank on Google). Vercel handles SSR, ISR, and image optimization without configuration.
- **Backend on Hostinger VPS** — a long-running Node process gives you persistent worker queues, background jobs, and (later) websockets if you add chat.
- **MongoDB on Atlas, not on the VPS** — your VPS will reboot, get migrated, run out of disk. Your database must not. Atlas handles replicas, backups, and recovery.
- **Redis on Upstash** — same reasoning. Serverless, pay-as-you-go, free tier covers launch.
- **Nginx in front of Node** — gives you SSL, rate limiting, gzip, the ability to run 2+ Node instances behind it via PM2, and a place to handle DDoS basics.

### Component responsibilities

| Component | Responsibility |
|---|---|
| Next.js | UI rendering, SEO pages, calling the API, user-facing routing |
| Express API | All business logic, auth, RBAC, validation, talking to MongoDB |
| Mongoose | Schema validation, querying, indexes, middleware (e.g., timestamps) |
| Worker process (BullMQ) | Async jobs: sending emails, recomputing ranking, expiring leads |
| Redis | OTPs (with TTL), session blacklist, rate-limit counters, queue backbone, hot caches |
| MongoDB Atlas | Source of truth for all persistent data |
| Cloudinary | All file uploads and CDN delivery |
| Resend | Transactional email sending |

---

## 4. Hosting Plan

### Frontend — Vercel

- Connect GitHub repo. Push to `main` triggers production deploy. Every PR gets a preview URL.
- Free Hobby tier covers launch (100GB bandwidth/month).
- Custom domain (`ballu.in`) added in Vercel dashboard; SSL is automatic.
- Environment variables stored in Vercel project settings — separate values for production and preview.

### Backend — Hostinger VPS

- **Starting plan:** KVM 2 (2 vCPU, 8GB RAM). Far more than needed for 500 visits/day, gives buffer for growth.
- **OS:** Ubuntu 22.04 LTS.
- **Stack on the box:**
  - Node.js (latest LTS via `nvm`)
  - PM2 (process manager)
  - Nginx (reverse proxy + SSL)
  - Certbot (free Let's Encrypt SSL, auto-renewing)
  - UFW firewall (only ports 22, 80, 443 open)
  - Fail2ban (SSH brute-force protection)

### Initial VPS setup steps

1. Create a non-root user with sudo rights; disable root SSH.
2. SSH key authentication only — no passwords.
3. Configure UFW: allow SSH (22), HTTP (80), HTTPS (443); deny everything else.
4. Install Node, PM2, Nginx.
5. Use Certbot to get an SSL certificate for `api.ballu.in`.
6. Configure Nginx to reverse-proxy to the Node process on port 4000.
7. Set up rate limiting in Nginx (per-IP cap on requests per second).
8. Install Fail2ban with default SSH jail.

### MongoDB Atlas setup

- **Starting tier:** M0 (free, shared cluster, 512MB storage). Adequate for early launch.
- **Region:** the AWS Mumbai region (`ap-south-1`) — lowest latency for Indian users and your Hostinger VPS.
- **Network access:**
  - Add the VPS's static IP to the Atlas IP whitelist. Do **not** use `0.0.0.0/0` (anyone can connect) even with strong credentials — it's a recurring source of breaches.
- **Database user:** create an application user with read/write on the application database only. Do not use the admin user from the application.
- **Connection string:** stored as `MONGODB_URI` in the backend `.env`. Includes username, password, cluster URL, database name, and `retryWrites=true&w=majority`.
- **Backups:** M0 has no automated backups. Either schedule a daily `mongodump` from a cron job to S3-compatible storage, or budget the upgrade to M10 (which includes continuous backups) before you have meaningful data.

### When to upgrade Atlas

- M0 → M10 (~$57/mo) when any of: storage approaches 512MB, you need backups, you need dedicated resources, or you cross ~5K active users.
- M10 → M20/M30 only when monitoring tells you to. Don't pre-upgrade.

### Redis — Upstash

- Free tier (10K commands/day) covers early launch comfortably.
- Single endpoint URL stored as `REDIS_URL` in `.env`.
- Move to pay-as-you-go (~$5–10/month) when daily commands exceed free tier limits.

### Cloudinary

- Free tier: 25GB storage, 25GB monthly bandwidth, image transformations included.
- Stores all profile photos, portfolio images, and verification documents.
- Browser uploads files directly to Cloudinary using a signed URL from your backend; the file URL is then stored in MongoDB. Your VPS never sees the raw file bytes.

### Resend

- Free tier: 3,000 emails/month, 100/day.
- Used for OTP delivery, review requests, system notifications.
- Single API key stored as `RESEND_API_KEY`.

### Environment variables (single source of truth)

These live in the backend `.env`. Vercel has its own panel for frontend variables.

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `production` / `development` |
| `PORT` | API port (e.g., 4000) |
| `MONGODB_URI` | Atlas connection string |
| `REDIS_URL` | Upstash connection string |
| `JWT_ACCESS_SECRET` | 64-char random string |
| `JWT_REFRESH_SECRET` | 64-char random string (different from access) |
| `JWT_ACCESS_EXPIRY` | e.g., `15m` |
| `JWT_REFRESH_EXPIRY` | e.g., `30d` |
| `RESEND_API_KEY` | Email sending |
| `EMAIL_FROM` | "Ballu <noreply@ballu.in>" |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_ORIGIN` | `https://ballu.in` (for CORS) |
| `SENTRY_DSN` | Error tracking |

---

## 5. MongoDB Design Philosophy

This section is the most important in the document. MongoDB rewards thoughtful design and punishes naive design. The collections in section 6 are shaped by these principles.

### Principle 1 — Embed when the data is owned and bounded

A contractor's portfolio items, working hours, and service categories naturally belong to that contractor. They're accessed when you load the profile, they don't grow without bound (a contractor will have 5–30 portfolio items, not 5,000), and they don't need to be searched independently. So they live as **embedded subdocuments** inside the contractor profile.

This means one database fetch loads the full profile. No joins, no `$lookup`, no extra round-trips.

### Principle 2 — Reference when the data is shared or unbounded

Reviews on a contractor are not bounded — a popular contractor could have thousands. They're also independently queryable ("show me the latest 20 reviews"). They live in their own `reviews` collection, with a reference (the contractor's ObjectId) on each review document.

The general rule:
- **< ~50 items, always loaded with parent, owned by parent → embed.**
- **Unbounded, paginated, queried independently → separate collection with reference.**
- **Shared across many parents (categories, cities) → separate collection with reference.**

### Principle 3 — Denormalize hot read-paths

On the contractor search page you display: business name, rating, total reviews, city, badge, primary category. All of that needs to come back fast for 20 contractors per page.

If `rating` requires aggregating from the `reviews` collection on every search, the page will be slow. Instead, the contractor's profile document carries a `stats.avgRating` field that's **recomputed** whenever a new review lands. The reviews collection remains the source of truth; the cached number on the profile is a performance optimization.

The same applies to:
- `stats.totalReviews`
- `stats.jobsCompleted`
- `stats.responseRate`
- `rankingScore`

The cost of denormalization is a small write amplification (when a review is created, you update the contractor profile). The benefit is roughly 10–100x faster reads on the hottest endpoints. For this app, that's a clear win.

### Principle 4 — Money and verification are never denormalized

Anything that affects money (subscriptions, transactions) or trust (verification status, audit logs) lives in its own collection and is read fresh, never cached. Inconsistency in display is a bug, not a feature.

### Principle 5 — Use `metadata` objects for extensibility

Each collection includes a `metadata` field (a free-form object) for fields you'll need later that you haven't designed yet. Marketing tags, experiment flags, internal notes, source-of-signup tracking — all can go into `metadata` without a schema migration.

The discipline: anything that **business logic** depends on must be a proper top-level field with validation. `metadata` is only for things consumed by analytics, marketing, or future features.

### Principle 6 — Use ObjectId everywhere, expose nothing else

MongoDB's `ObjectId` is the primary key. Don't add a separate sequential ID. URLs use ObjectIds (`/contractors/65f3a7...`) or slugs (`/contractors/ravi-kumar-electrician-bhopal`). Slugs are user-facing; ObjectIds are internal IDs. The two stay separate.

### Principle 7 — Indexes are not optional

Every query that runs more than once a minute must have an index supporting it. Without indexes, MongoDB scans every document — fine at 100 documents, devastating at 100,000.

Each collection in section 6 lists its required indexes. These are not suggestions.

### Principle 8 — Soft deletes, not hard deletes

Every collection has a `deletedAt` field. Setting it to a timestamp "deletes" the record from the user's perspective. Queries filter out anything with `deletedAt != null`. This is essential for:
- Audit and compliance
- Recovery from mistakes (admin accidentally bans a contractor)
- Analytics on churn

### Principle 9 — Timestamps everywhere

Every document gets `createdAt` and `updatedAt`. Mongoose handles this automatically when the schema enables `timestamps: true`.

### Principle 10 — Money in paise, never in rupees

When the payment integration arrives, store amounts as integers in paise (₹1499 → `149900`). Never as `Number` for rupees, never as floats. Same goes for any numeric field where rounding matters.

---

## 6. Collection-by-Collection Schema Design

This section defines every collection. Each one lists fields, types, relationships, and required indexes. The schemas are written in plain English, not code — translating to Mongoose is mechanical once the design is clear.

### Overview of collections

1. `users` — identity for everyone (client, contractor, admin)
2. `contractorProfiles` — extended profile data for contractors
3. `clientProfiles` — extended profile data for clients
4. `refreshTokens` — server-side refresh token records
5. `categories` — service categories (electrician, plumber, etc.)
6. `cities` — service cities
7. `jobs` — job postings by clients
8. `leads` — distribution records (which contractor sees which job)
9. `reviews` — ratings and comments
10. `documents` — verification documents submitted by contractors
11. `subscriptions` — plan history (provisioned, payment integration deferred)
12. `plans` — definition of available plans
13. `notifications` — in-app notifications
14. `auditLogs` — record of admin and system actions
15. `featureFlags` — toggleable features for gradual rollout (extensibility)
16. `settings` — singleton document for platform-wide configuration

---

### 6.1 `users`

The identity collection. Every human in the system has exactly one document here.

**Fields:**
- `_id` (ObjectId) — primary key
- `email` (String) — unique, lowercase, indexed; the login identifier
- `emailVerified` (Boolean) — true after first successful OTP verification
- `phone` (String, optional) — collected for contractors when revealed to clients; not used for auth
- `phoneVerified` (Boolean)
- `name` (String) — display name
- `role` (String enum) — one of `CLIENT`, `CONTRACTOR`, `ADMIN`, `SUPER_ADMIN`
- `status` (String enum) — `PENDING`, `ACTIVE`, `SUSPENDED`, `BANNED`
- `lastLoginAt` (Date)
- `loginCount` (Number) — increments on each login, useful for analytics
- `metadata` (Object) — extensibility slot (e.g., `signupSource: 'google_ads'`)
- `deletedAt` (Date, nullable) — soft delete marker
- `createdAt` (Date) — auto
- `updatedAt` (Date) — auto

**Why a single users collection instead of separate ones per role:**
A client can later become a contractor. A contractor might need to act as a client for their own home repairs. Auth is the same flow for all roles. Admin operations span all users. Splitting into separate collections forces duplication of auth code and breaks role transitions. One collection with a `role` field is cleaner.

**Required indexes:**
- `email` (unique)
- `role, status` (compound — admin listing pages filter on both)
- `phone` (sparse, unique — only on documents that have a phone)
- `createdAt` (descending — admin "recent signups")
- `deletedAt` (sparse — for queries that filter out deleted users)

**Notes:**
- The user document is intentionally lean. Role-specific data lives in `contractorProfiles` and `clientProfiles`. The user document is what's checked on every authenticated request, so keep it small.
- When a new user signs up, the application creates the user document **and** the matching role-specific profile document (or shell) in the same operation.

---

### 6.2 `contractorProfiles`

The richest collection in the system. Contains everything that makes a contractor discoverable.

**Fields:**
- `_id` (ObjectId)
- `userId` (ObjectId, ref `users`) — one-to-one with users; indexed unique
- `businessName` (String) — e.g., "Ravi Electrical Works"
- `slug` (String) — URL-friendly, unique (e.g., `ravi-electrical-bhopal`); generated from name + city + small random suffix
- `bio` (String) — short description, max ~500 chars
- `yearsExperience` (Number)
- `languages` (Array of Strings) — e.g., `["Hindi", "English"]`

**Location:**
- `cityId` (ObjectId, ref `cities`) — primary base city
- `pincode` (String, 6 digits)
- `address` (String, optional)
- `geo` (GeoJSON Point: `{ type: 'Point', coordinates: [lng, lat] }`) — enables geographic search
- `serviceRadiusKm` (Number, default 15) — how far they'll travel

**Service offerings (embedded array):**
- `categories` — array of `{ categoryId: ObjectId, primary: Boolean }`. The `primary` flag identifies the contractor's main trade for display purposes; they can offer secondary services.

**Verification:**
- `badge` (String enum) — `NONE`, `BRONZE` (email verified), `SILVER` (+ ID verified), `GOLD` (+ business docs + past work verified)
- `verifiedAt` (Date)
- `verificationStage` (String) — current admin workflow stage, e.g., `DOCS_PENDING`, `UNDER_REVIEW`, `APPROVED`

**Profile assets:**
- `profilePhotoUrl` (String) — Cloudinary URL
- `coverPhotoUrl` (String, optional)
- `portfolioItems` (embedded array) — each item: `{ _id, imageUrl, caption, createdAt }`. Embedded because there are typically < 30 items and they're always loaded with the profile.

**Working hours (embedded):**
- `workingHours` — object like `{ monday: { open: '09:00', close: '18:00', closed: false }, ... }`
- `emergencyService` (Boolean) — willing to take calls outside hours

**Denormalized stats (recomputed by background jobs):**
- `stats` — embedded object:
  - `avgRating` (Number, 0–5)
  - `totalReviews` (Number)
  - `jobsCompleted` (Number)
  - `responseRate` (Number, 0–1)
  - `responseTimeMinutes` (Number) — median minutes to respond to a lead
  - `profileCompleteness` (Number, 0–100)

**Ranking:**
- `rankingScore` (Number, 0–1) — recomputed whenever inputs change; drives default sort order on the contractor list page

**State:**
- `isAvailable` (Boolean) — contractor toggles when they're booked or on holiday
- `isFeatured` (Boolean)
- `featuredUntil` (Date, optional)

**Subscription summary (denormalized for filtering):**
- `currentPlanTier` (String) — `FREE`, `STARTER`, `GROWTH`, `ELITE`. Updated when subscriptions change. Lets you filter contractors by tier without joining subscriptions.
- `subscriptionExpiresAt` (Date, optional)

**Extensibility:**
- `metadata` (Object) — free-form

**Timestamps + soft delete** as standard.

**Required indexes:**
- `userId` (unique)
- `slug` (unique)
- `cityId, badge` (compound — common filter combination)
- `rankingScore` (descending — default sort)
- `categories.categoryId, cityId` (compound — primary search query)
- `geo` (2dsphere — geographic queries)
- `isFeatured, featuredUntil` (for featured listing rotation)
- `currentPlanTier, isAvailable` (admin and tier-based queries)

**Why so much is embedded:**
Loading a contractor profile is the hottest read path in the app. SEO pages, search results, and the contractor's own dashboard all hit this collection. Every field embedded here is one less round-trip per page load.

---

### 6.3 `clientProfiles`

Lean. Clients have far less data than contractors.

**Fields:**
- `_id` (ObjectId)
- `userId` (ObjectId, ref `users`, unique)
- `cityId` (ObjectId, ref `cities`, optional) — for personalizing search
- `pincode` (String, optional)
- `address` (String, optional)
- `preferences` (Object) — preferred categories, budget hints, communication preferences. Free-form for now.
- `stats` — embedded:
  - `jobsPosted` (Number)
  - `reviewsWritten` (Number)
- `metadata` (Object)
- Timestamps + soft delete

**Indexes:**
- `userId` (unique)
- `cityId` (for analytics)

---

### 6.4 `refreshTokens`

Server-side records of refresh tokens issued to users. Enables logout and revocation. **Tokens are stored hashed, never in plaintext.**

**Fields:**
- `_id` (ObjectId)
- `userId` (ObjectId, ref `users`)
- `tokenHash` (String, unique) — SHA-256 of the raw token
- `expiresAt` (Date)
- `revokedAt` (Date, optional) — non-null means this token can no longer be used
- `replacedByTokenId` (ObjectId, optional) — when rotated, points to the new token; helps detect token reuse
- `userAgent` (String)
- `ipAddress` (String)
- `createdAt` (Date)

**Indexes:**
- `tokenHash` (unique)
- `userId, revokedAt`
- `expiresAt` (TTL index — MongoDB will automatically delete expired tokens)

The TTL index is convenient: MongoDB cleans up expired tokens automatically without a cron job. Set it on `expiresAt` with `expireAfterSeconds: 0`.

---

### 6.5 `categories`

Reference data — the list of service types.

**Fields:**
- `_id` (ObjectId)
- `slug` (String, unique) — e.g., `electrician`
- `name` (String) — e.g., "Electrician"
- `description` (String)
- `iconUrl` (String)
- `parentId` (ObjectId, optional) — supports sub-categories later (e.g., "AC Repair" under "Electrician")
- `isActive` (Boolean)
- `sortOrder` (Number) — controls display order
- `metadata` (Object)

**Indexes:**
- `slug` (unique)
- `isActive, sortOrder`
- `parentId`

**Customization note:** the `parentId` field is the seed of a hierarchy. Even if you launch with a flat list of categories, having this field from day one means you can introduce sub-categories later without migration.

---

### 6.6 `cities`

Reference data — the list of cities the platform operates in.

**Fields:**
- `_id` (ObjectId)
- `slug` (String, unique) — e.g., `bhopal`
- `name` (String) — "Bhopal"
- `state` (String) — "Madhya Pradesh"
- `country` (String, default "India")
- `geo` (GeoJSON Point) — city center coordinates
- `isActive` (Boolean) — lets you launch in one city and roll out gradually
- `metadata` (Object)

**Indexes:**
- `slug` (unique)
- `state`
- `isActive`
- `geo` (2dsphere, for distance queries)

---

### 6.7 `jobs`

A job is a request posted by a client.

**Fields:**
- `_id` (ObjectId)
- `clientId` (ObjectId, ref `users`)
- `categoryId` (ObjectId, ref `categories`)
- `cityId` (ObjectId, ref `cities`)
- `pincode` (String)
- `address` (String, optional)
- `geo` (GeoJSON Point, optional) — derived from address if entered
- `title` (String) — "Need plumber for kitchen sink"
- `description` (String)
- `budgetMin` / `budgetMax` (Number, optional) — in paise
- `attachments` (Array of Strings) — Cloudinary URLs of photos uploaded by the client
- `urgency` (String enum) — `NORMAL`, `URGENT`, `EMERGENCY`
- `status` (String enum) — `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `EXPIRED`
- `assignedContractorId` (ObjectId, optional) — set when client picks a contractor
- `expiresAt` (Date) — auto-close after 7 days if no assignment
- `responseCount` (Number) — denormalized count of contractor responses; updated when a lead is marked CONTACTED
- `metadata` (Object)
- Timestamps + soft delete

**Indexes:**
- `clientId, status, createdAt` (compound — "my jobs" page)
- `categoryId, cityId, status` (compound — matching engine)
- `status, expiresAt` (cron expiry job)
- `assignedContractorId` (contractor's "jobs I'm doing" view)

---

### 6.8 `leads`

A lead is the distribution record: this contractor is allowed to see this job.

**Fields:**
- `_id` (ObjectId)
- `jobId` (ObjectId, ref `jobs`)
- `contractorId` (ObjectId, ref `users`) — points to a user, not a profile (consistent with how `clientId` works on jobs)
- `status` (String enum) — `NEW`, `VIEWED`, `CONTACTED`, `WON`, `LOST`, `EXPIRED`
- `visibleFrom` (Date) — when this lead becomes visible to the contractor; staggered by plan tier
- `expiresAt` (Date)
- `viewedAt` (Date, optional)
- `contactedAt` (Date, optional)
- `respondedInMs` (Number, optional) — time between `visibleFrom` and `contactedAt`; feeds response-rate metric
- `wonAt` (Date, optional) — when client assigns this contractor to the job
- `metadata` (Object)
- Timestamps

**Indexes:**
- `contractorId, status, visibleFrom` (compound — "leads I can see right now")
- `jobId` (for "responses to my job" view)
- `expiresAt, status` (cron expiry job)
- `jobId, contractorId` (compound, unique — a contractor can have only one lead per job)

**Note on `visibleFrom`:** higher-tier contractors get leads instantly; lower tiers see them after delays (e.g., 24h or 48h). Querying `visibleFrom: { $lte: now }` filters out leads that aren't visible yet.

---

### 6.9 `reviews`

**Fields:**
- `_id` (ObjectId)
- `jobId` (ObjectId, ref `jobs`, optional) — when tied to a specific job
- `authorId` (ObjectId, ref `users`)
- `subjectId` (ObjectId, ref `users`) — the person being reviewed
- `direction` (String enum) — `CLIENT_TO_CONTRACTOR` or `CONTRACTOR_TO_CLIENT`
- `rating` (Number, 1–5)
- `comment` (String, optional)
- `isPublished` (Boolean) — admin can hide abusive reviews
- `flagged` (Object, optional) — `{ reason, flaggedBy, flaggedAt }`
- `helpfulCount` (Number, default 0) — for future "was this review helpful?" UX

**Denormalized for display:**
- `authorName` (String) — snapshot at review-time; if the author renames themselves later, the review still shows the original name
- `authorAvatarUrl` (String, optional)

**Why denormalize:** review lists need to show author names without joining `users`. Storing a snapshot is cheap and avoids the `$lookup` cost.

**Indexes:**
- `subjectId, isPublished, createdAt` (compound — "reviews of contractor X")
- `authorId, createdAt`
- `jobId`
- `flagged.flaggedAt` (sparse — moderation queue)

---

### 6.10 `documents`

Verification documents submitted by contractors (Aadhaar, GST, PAN, certifications).

**Fields:**
- `_id` (ObjectId)
- `contractorUserId` (ObjectId, ref `users`)
- `type` (String enum) — `AADHAAR`, `PAN`, `GST`, `CERTIFICATION`, `OTHER`
- `fileUrl` (String) — Cloudinary URL (private folder)
- `status` (String enum) — `PENDING`, `APPROVED`, `REJECTED`
- `reviewedBy` (ObjectId, optional) — admin user id
- `reviewedAt` (Date, optional)
- `rejectionReason` (String, optional)
- `metadata` (Object) — e.g., last 4 of Aadhaar for display
- Timestamps + soft delete

**Indexes:**
- `contractorUserId`
- `status, createdAt` (admin moderation queue, oldest first)
- `reviewedBy` (admin activity tracking)

---

### 6.11 `plans` and `subscriptions` (provisioned, payment deferred)

You said payment integration is not currently mandatory. We still design these collections so that the contractor profile and the admin console can have the *shape* of subscriptions from day one. Initially every contractor is on the FREE tier. When payments come, the structure is already in place.

#### `plans`

Defines what's purchasable.

**Fields:**
- `_id` (ObjectId)
- `tier` (String enum, unique) — `FREE`, `STARTER`, `GROWTH`, `ELITE`
- `name` (String) — display name
- `priceInPaise` (Number) — 0 for FREE
- `durationDays` (Number) — typical billing cycle (30)
- `monthlyLeadQuota` (Number) — -1 for unlimited
- `features` (Array of Strings) — `["Featured listing", "Priority leads", "Profile boost"]` — drives the pricing page UI
- `leadVisibilityDelayHours` (Number) — 0 for Elite, 24 for Growth, 48 for Starter
- `isActive` (Boolean)
- Timestamps

#### `subscriptions`

History of plan assignments. Even free-tier records go here so analytics is consistent.

**Fields:**
- `_id` (ObjectId)
- `contractorUserId` (ObjectId, ref `users`)
- `planId` (ObjectId, ref `plans`)
- `tier` (String, denormalized from plan) — convenience for queries
- `status` (String enum) — `ACTIVE`, `EXPIRED`, `CANCELLED`
- `startedAt` (Date)
- `expiresAt` (Date)
- `cancelledAt` (Date, optional)
- `leadsUsed` (Number) — counts toward quota
- `source` (String) — `SIGNUP_DEFAULT`, `PURCHASE`, `ADMIN_GRANT` — useful audit
- `paymentReference` (Object, optional) — placeholder for future Razorpay data, untouched for now
- `metadata` (Object)
- Timestamps

**Indexes:**
- `contractorUserId, status`
- `expiresAt, status` (renewal reminder cron)

**Why this matters now even without payments:**
1. The contractor profile carries `currentPlanTier`. Without a subscription record, that field has no source of truth.
2. When you add payments later, you don't migrate anything — you just start writing new subscription records with real payment data.
3. Admin can grant trial Elite plans manually using `source: ADMIN_GRANT`. This is how you'll seed early contractors before payments are live.

---

### 6.12 `notifications`

In-app notification feed.

**Fields:**
- `_id` (ObjectId)
- `userId` (ObjectId, ref `users`)
- `type` (String) — `NEW_LEAD`, `REVIEW_RECEIVED`, `DOCUMENT_APPROVED`, etc.
- `title` (String)
- `body` (String)
- `data` (Object) — links to related entities (e.g., `{ jobId, leadId }`)
- `channels` (Array of Strings) — which channels this was sent to (`IN_APP`, `EMAIL`, `WHATSAPP`)
- `readAt` (Date, optional)
- `createdAt` (Date)

**Indexes:**
- `userId, readAt, createdAt` (compound — unread notifications first)

A TTL index on `createdAt` with a 90-day expiry can be applied if you don't want to keep notifications forever.

---

### 6.13 `auditLogs`

Append-only log of consequential actions. Critical for trust and ops.

**Fields:**
- `_id` (ObjectId)
- `actorId` (ObjectId, optional) — null when the system acts; populated when a user/admin acts
- `actorRole` (String) — role at the time of the action
- `action` (String) — e.g., `DOCUMENT_APPROVED`, `USER_BANNED`, `LEAD_DISTRIBUTED`, `CONTACT_REVEALED`
- `entityType` (String) — `User`, `Document`, `Job`, `Payment`, etc.
- `entityId` (ObjectId) — what was acted on
- `before` (Object, optional) — snapshot of the relevant fields pre-change
- `after` (Object, optional) — snapshot post-change
- `ipAddress` (String, optional)
- `userAgent` (String, optional)
- `createdAt` (Date)

**Indexes:**
- `entityType, entityId, createdAt` (compound — "show everything that happened to entity X")
- `actorId, createdAt`
- `action, createdAt`

**Never edit or delete from this collection.** Even soft delete is disabled.

---

### 6.14 `featureFlags`

A small but powerful collection for extensibility.

**Fields:**
- `_id` (ObjectId)
- `key` (String, unique) — e.g., `new_search_ui`, `whatsapp_otp_enabled`
- `enabled` (Boolean)
- `enabledForRoles` (Array of Strings, optional) — `["ADMIN"]` (only admins see it)
- `enabledForUserIds` (Array of ObjectIds, optional) — explicit allow-list for testing
- `rolloutPercentage` (Number, 0–100) — gradual rollout
- `description` (String)
- `updatedAt` (Date)

**Why this matters from day one:**
- You can ship a half-built feature behind a flag without affecting users.
- A/B testing later becomes trivial.
- Killing a buggy feature in production is a one-document update, not a rollback.

**Indexes:**
- `key` (unique)

---

### 6.15 `settings` (singleton)

A single document holding platform-wide configuration that admins can edit without code changes.

**Fields:**
- `_id` (fixed string: `"platform"`)
- `lead` — `{ defaultExpiryDays: 7, eliteDelayHours: 0, growthDelayHours: 24, starterDelayHours: 48 }`
- `ranking` — `{ weights: { tier: 0.3, rating: 0.25, jobs: 0.15, response: 0.15, badge: 0.10, completeness: 0.05 } }`
- `contactReveal` — `{ maxPerClientPerDay: 20 }`
- `otp` — `{ ttlMinutes: 5, maxAttempts: 5, requestsPerHour: 3 }`
- `email` — `{ supportAddress: 'support@ballu.in' }`

**Why a singleton:** so admins can tune ranking weights or lead delays without redeploying code. Application caches this document in Redis for 5 minutes — changes propagate automatically.


---

## 7. Authentication Flow (Email OTP)

### Goal

Sign-in by emailing a one-time code. No passwords ever. Same flow for all roles — the role is captured at signup time.

### Step-by-step flow

**Sign-up (new user) and sign-in (existing user) are the same flow.** The system distinguishes between them server-side after OTP verification.

1. **User enters email and selects role** (Client / Contractor). For admins, role is `ADMIN`, and admin invitations are sent by super-admins via email — admins cannot self-register.
2. **Frontend calls `POST /auth/request-otp`** with `{ email, role }`.
3. **Backend validates and rate-limits.** Rules:
   - The email format must be valid.
   - No more than 3 OTP requests from this email in the past 15 minutes (tracked in Redis).
   - No more than 10 OTP requests from this IP in the past 15 minutes (anti-abuse).
4. **Backend generates a 6-digit OTP** using a cryptographically secure random number generator.
5. **Backend hashes the OTP** (bcrypt) before storing. The plaintext OTP is never persisted — it only exists in memory long enough to put it in the email.
6. **Backend stores the hash in Redis** under key `otp:<email>` with a 5-minute TTL. Also stores a counter at `otp_attempts:<email>` initialized to 0.
7. **Backend enqueues an email job** to send the OTP via Resend. (Sending is async — the API returns to the user before the email is delivered.)
8. **Backend responds** with `{ sent: true }`. No information about whether the user exists — to prevent enumeration attacks.
9. **User receives the email**, types the OTP into the frontend.
10. **Frontend calls `POST /auth/verify-otp`** with `{ email, otp, role }`.
11. **Backend reads `otp:<email>` from Redis.** If absent, the OTP has expired → reject.
12. **Backend reads attempts counter.** If ≥ 5, the OTP is locked → reject. Otherwise increment.
13. **Backend compares the submitted OTP** to the stored hash (bcrypt comparison).
14. **On match:**
    - Delete both Redis keys (one-time use).
    - Look up the user by email.
    - If the user doesn't exist, create them (with the role from the request) and create the matching role profile (`clientProfile` or `contractorProfile`).
    - If the user exists but the role on file differs from the role in the request, the request is rejected. (Prevents a contractor from signing into the client panel and vice versa. A user can have only one role per account; if they need both, they create a separate account with a different email.)
    - If the user is `SUSPENDED` or `BANNED`, reject with a friendly message.
    - Set `emailVerified = true`, update `lastLoginAt`, increment `loginCount`.
    - Issue an **access token** (JWT, 15-minute expiry) and a **refresh token** (random string, 30-day expiry, hashed before storing in `refreshTokens`).
15. **Backend responds** with `{ accessToken, user }` and sets the refresh token as an HTTP-only, secure, SameSite=Strict cookie scoped to `/auth/refresh`.
16. **Frontend stores the access token** in memory (or sessionStorage) and uses it on every API call via `Authorization: Bearer <token>`.

### Token rotation

When the access token expires (or proactively, ~1 minute before expiry):

1. Frontend calls `POST /auth/refresh` (cookie carries the refresh token).
2. Backend hashes the cookie value and looks it up in `refreshTokens`.
3. If found, not expired, and `revokedAt` is null:
   - Mark the old token as revoked.
   - Issue a new access token and a new refresh token.
   - Update the cookie with the new refresh token.
4. If `revokedAt` is non-null (i.e., this token has already been rotated), the system assumes theft: revoke **all** of that user's refresh tokens and force re-login. This is the standard refresh-token reuse detection pattern.

### Logout

- `POST /auth/logout` revokes the current refresh token by setting `revokedAt`.
- `POST /auth/logout-all` revokes all refresh tokens for that user — useful for "log out of all devices" after a security event.

### Why this design

- **Stateless access tokens** (JWT) mean any backend instance can validate them without checking the database. Critical for horizontal scaling.
- **Server-side refresh tokens** mean you can invalidate sessions (logout, suspension, password change) by deleting database records.
- **Bcrypt-hashed OTPs in Redis** mean even a Redis breach doesn't expose OTPs in usable form.
- **Rate limiting at both email and IP layers** stops email-bombing attacks and credential-stuffing-style abuse.
- **HTTP-only cookies** for refresh tokens mean JavaScript on the frontend cannot read them, mitigating XSS-based session theft.

### Admin-specific notes

- Admins are created by super-admins through a backend script or a "create admin" admin-panel endpoint (gated by `admin.manage` permission).
- An admin invitation sends them an email with a "set up your account" link. Clicking it triggers the standard email-OTP flow, but the user document is pre-created with `role: ADMIN`.
- Super-admin: there is exactly one or a small number. Promoted manually via DB script for the founder(s).

---

## 8. Role-Based Access Control

### Roles in the system

- `CLIENT` — homeowners and businesses looking for contractors
- `CONTRACTOR` — service providers
- `ADMIN` — staff doing verification, moderation, support
- `SUPER_ADMIN` — founders/leads who can create other admins and issue refunds

### Two-layer model

The role on the user document is a coarse identifier. The fine-grained question — "is this user allowed to do X?" — is answered by a **permission map**: a static object in code that maps each role to a set of permissions.

This means:
- Adding a new permission doesn't require a schema change.
- Promoting an admin to super-admin is a single field update on `users`.
- Permissions are easy to test and audit (they're just strings in a map).

### Permission matrix

| Permission | CLIENT | CONTRACTOR | ADMIN | SUPER_ADMIN |
|---|:---:|:---:|:---:|:---:|
| `job.create` | ✅ | ❌ | ❌ | ❌ |
| `job.view.own` | ✅ | ❌ | ✅ | ✅ |
| `job.view.any` | ❌ | ❌ | ✅ | ✅ |
| `job.cancel.own` | ✅ | ❌ | ✅ | ✅ |
| `contractor.search` | ✅ | ✅ | ✅ | ✅ |
| `contractor.profile.view.public` | ✅ | ✅ | ✅ | ✅ |
| `contractor.profile.edit.own` | ❌ | ✅ | ❌ | ❌ |
| `contractor.profile.edit.any` | ❌ | ❌ | ✅ | ✅ |
| `lead.view.own` | ❌ | ✅ | ✅ | ✅ |
| `lead.respond` | ❌ | ✅ | ❌ | ❌ |
| `review.create` | ✅ | ✅ | ❌ | ❌ |
| `review.moderate` | ❌ | ❌ | ✅ | ✅ |
| `document.upload` | ❌ | ✅ | ❌ | ❌ |
| `document.verify` | ❌ | ❌ | ✅ | ✅ |
| `contact.reveal` | ✅ | ❌ | ✅ | ✅ |
| `user.list` | ❌ | ❌ | ✅ | ✅ |
| `user.ban` | ❌ | ❌ | ✅ | ✅ |
| `user.delete` | ❌ | ❌ | ❌ | ✅ |
| `category.manage` | ❌ | ❌ | ✅ | ✅ |
| `city.manage` | ❌ | ❌ | ✅ | ✅ |
| `featured.assign` | ❌ | ❌ | ✅ | ✅ |
| `analytics.view` | ❌ | ❌ | ✅ | ✅ |
| `settings.edit` | ❌ | ❌ | ✅ | ✅ |
| `admin.create` | ❌ | ❌ | ❌ | ✅ |
| `feature_flag.toggle` | ❌ | ❌ | ✅ | ✅ |
| `audit.view` | ❌ | ❌ | ✅ | ✅ |

### Enforcement layers

**Backend (mandatory):**
- Every protected route passes through two middleware: `authenticate` (verifies JWT, attaches user to request) and `requirePermission(permName)` (checks the permission map).
- For permissions ending in `.own`, an additional ownership check verifies the resource belongs to the requesting user.
- Default-deny: if no permission is declared on a route, the route is unreachable.

**Frontend (cosmetic):**
- The frontend imports the same permission map (or fetches it on login as part of the user payload).
- UI controls hide themselves if the current user lacks the relevant permission. **This is cosmetic only — the backend is the authority.** Hiding a button doesn't enforce security; it just keeps the UI clean.

### Why this approach scales

- Adding a new feature usually means adding one or two permission strings and adding them to the appropriate roles. No schema changes.
- Future feature: paid clients who can post premium jobs. Add a `PRO_CLIENT` role with extended permissions — the rest of the system absorbs the change without modification.
- Future feature: agency contractors who manage multiple sub-contractors. Add an `AGENCY_OWNER` role and a `subContractorIds` field on `contractorProfiles`. The permission system already supports the model.

---

## 9. API Surface

The API is REST, JSON, versioned at `/api/v1`. Cursor-based pagination on public listing endpoints, offset-based on admin views.

### Auth endpoints

| Method | Path | Permission | What it does |
|---|---|---|---|
| POST | `/auth/request-otp` | public | Issue an OTP to an email |
| POST | `/auth/verify-otp` | public | Verify OTP, create/login user, return tokens |
| POST | `/auth/refresh` | refresh cookie | Rotate access + refresh tokens |
| POST | `/auth/logout` | authenticated | Revoke current refresh token |
| POST | `/auth/logout-all` | authenticated | Revoke all refresh tokens |
| GET | `/auth/me` | authenticated | Return current user + role profile |

### Public discovery (no auth required, but enriched if authed)

| Method | Path | What it does |
|---|---|---|
| GET | `/categories` | List active categories |
| GET | `/cities` | List active cities |
| GET | `/contractors` | Search with filters: `categorySlug`, `citySlug`, `badge`, `minRating`, `sort`, `cursor`, `limit` |
| GET | `/contractors/:slug` | Public profile by slug (used for SSR/SEO pages) |
| GET | `/contractors/:slug/reviews` | Paginated reviews |
| GET | `/feature-flags/public` | Frontend reads flags relevant to anonymous users |

### Client endpoints

| Method | Path | Permission | What it does |
|---|---|---|---|
| GET | `/client/profile` | self | Get my client profile |
| PATCH | `/client/profile` | self | Update preferences/address |
| POST | `/jobs` | `job.create` | Post a new job |
| GET | `/jobs/mine` | `job.view.own` | List my jobs |
| GET | `/jobs/:id` | own | Get one of my jobs |
| PATCH | `/jobs/:id` | own | Edit or cancel |
| GET | `/jobs/:id/responses` | own | Contractors who responded |
| POST | `/jobs/:id/assign` | own | Assign a contractor to my job |
| POST | `/jobs/:id/complete` | own | Mark complete (triggers review request) |
| POST | `/contractors/:userId/reveal-contact` | `contact.reveal` | Reveal phone number, log the reveal |
| POST | `/reviews` | `review.create` | Leave a review |

### Contractor endpoints

| Method | Path | Permission | What it does |
|---|---|---|---|
| GET | `/contractor/profile` | self | Get my full profile |
| PATCH | `/contractor/profile` | `contractor.profile.edit.own` | Update profile |
| POST | `/contractor/portfolio` | self | Add a portfolio item |
| PATCH | `/contractor/portfolio/:itemId` | self | Edit caption |
| DELETE | `/contractor/portfolio/:itemId` | self | Remove |
| POST | `/contractor/availability` | self | Toggle availability |
| POST | `/contractor/documents` | `document.upload` | Submit a verification document |
| GET | `/contractor/documents` | self | List my documents and statuses |
| GET | `/contractor/leads` | `lead.view.own` | List my visible leads |
| GET | `/contractor/leads/:id` | self | Lead detail (job content) |
| POST | `/contractor/leads/:id/view` | self | Mark as viewed |
| POST | `/contractor/leads/:id/contact` | `lead.respond` | Record contact attempt |
| GET | `/contractor/subscription` | self | Current plan + history |
| POST | `/contractor/upload-signature` | self | Get a Cloudinary signed URL for a file upload |

### Shared

| Method | Path | What it does |
|---|---|---|
| GET | `/notifications` | List my notifications |
| POST | `/notifications/:id/read` | Mark as read |
| POST | `/notifications/read-all` | Mark all read |

### Admin

| Method | Path | Permission | What it does |
|---|---|---|---|
| GET | `/admin/users` | `user.list` | Paginated user list with filters |
| GET | `/admin/users/:id` | `user.list` | User detail with full activity |
| PATCH | `/admin/users/:id/status` | `user.ban` | Activate / suspend / ban / reactivate |
| DELETE | `/admin/users/:id` | `user.delete` | Soft-delete (super admin) |
| GET | `/admin/contractors/pending-verification` | `document.verify` | Verification queue |
| GET | `/admin/documents/:id` | `document.verify` | View document (returns short-lived signed Cloudinary URL) |
| POST | `/admin/documents/:id/approve` | `document.verify` | Approve, recompute badge |
| POST | `/admin/documents/:id/reject` | `document.verify` | Reject with reason |
| GET | `/admin/jobs` | `job.view.any` | All jobs |
| GET | `/admin/reviews/flagged` | `review.moderate` | Moderation queue |
| POST | `/admin/reviews/:id/unpublish` | `review.moderate` | Hide a review |
| POST | `/admin/reviews/:id/republish` | `review.moderate` | Restore a review |
| GET | `/admin/categories` | `category.manage` | List |
| POST | `/admin/categories` | `category.manage` | Create |
| PATCH | `/admin/categories/:id` | `category.manage` | Update |
| GET | `/admin/cities` | `city.manage` | List |
| POST | `/admin/cities` | `city.manage` | Create |
| PATCH | `/admin/cities/:id` | `city.manage` | Update |
| POST | `/admin/contractors/:id/feature` | `featured.assign` | Set featured + duration |
| POST | `/admin/subscriptions/grant` | `featured.assign` | Manually grant a plan (used before payment integration) |
| GET | `/admin/analytics/overview` | `analytics.view` | KPI dashboard |
| GET | `/admin/feature-flags` | `feature_flag.toggle` | List flags |
| PATCH | `/admin/feature-flags/:key` | `feature_flag.toggle` | Toggle / configure |
| GET | `/admin/settings` | `settings.edit` | Read singleton settings |
| PATCH | `/admin/settings` | `settings.edit` | Update settings |
| GET | `/admin/audit-logs` | `audit.view` | Searchable audit log |

### Response shape conventions

Every response (success or error) uses the same envelope.

Success with single resource:
- `data` — the resource object
- `meta` — optional metadata

Success with list:
- `data` — array of resources
- `meta.hasMore` — boolean
- `meta.nextCursor` — opaque cursor string (or null)
- `meta.total` — only included for admin offset-paginated views

Error:
- `error` — short code (e.g., `VALIDATION_FAILED`, `FORBIDDEN`, `OTP_EXPIRED`)
- `message` — human-readable
- `details` — field-level validation errors if applicable

This consistency makes frontend error handling trivial — one helper function reads the envelope.


---

## 10. Core User Flows

This section walks through the most important user journeys end-to-end. These are the flows the product is built around.

### 10.1 Client journey: from landing to hiring

1. **Landing page.** Anonymous user lands on the home page. Searches "electrician in Bhopal." Or browses by category from a featured-cities grid.
2. **Search results.** Sees a list of contractors filtered by `categorySlug=electrician` and `citySlug=bhopal`. Default sort is `rankingScore` descending. Filters: badge, minimum rating. Each card shows business name, photo, rating, badge, primary categories, response time, and a "View profile" button.
3. **Contractor profile (public).** SSR-rendered page (good for SEO). Shows bio, portfolio, full reviews, working hours, service areas. A prominent "Contact" button.
4. **Contact gate.** Clicking "Contact" requires login. If not logged in, the client is redirected to the OTP flow, then returns. Once authed, the page reveals the phone number via the `reveal-contact` endpoint, which records the reveal in the audit log.
5. **Optional: post a job.** Instead of revealing a specific contractor's contact, the client can post a job with a description. The job sits in `jobs`. The matching engine creates `leads` for eligible contractors.
6. **Contractor responses.** As contractors mark leads as `CONTACTED`, the client sees notifications and a list of interested contractors. They can then call/message and pick one.
7. **Assignment.** Client marks one contractor as assigned. The job transitions to `ASSIGNED`. Other leads transition to `LOST`.
8. **Completion.** When work is done, the client (and contractor) can mark the job as `COMPLETED`.
9. **Review request.** Triggered automatically when the job is marked complete: an email goes to both parties asking for a rating. Reviews flow back into the contractor's `stats`.

### 10.2 Contractor onboarding: from signup to first lead

1. **Sign-up.** Email + role=CONTRACTOR. OTP. New user document and empty contractor profile created.
2. **Profile completion wizard** (multi-step, can save and resume):
   - Step 1: Business name, bio, years of experience, languages.
   - Step 2: City, address, pincode, service radius.
   - Step 3: Service categories (pick from list; one marked primary).
   - Step 4: Working hours, emergency service toggle.
   - Step 5: Upload profile photo and 3–5 portfolio images.
   - Step 6: Upload verification documents (Aadhaar required for Silver badge, GST for Gold).
3. **Badge progression.** After each step completion, `stats.profileCompleteness` increases. Email verification (done by signing up) grants Bronze immediately. Aadhaar approval upgrades to Silver. GST + business proof upgrades to Gold.
4. **First lead.** Once the profile is at least 70% complete and Bronze-or-higher, the contractor becomes eligible for lead distribution. They start receiving leads as clients in their city post matching jobs.
5. **Lead response.** Contractor opens lead → views job details → marks as contacted → (off-platform) reaches out to client → updates lead status if won.
6. **Reviews.** As completed jobs accumulate reviews, the contractor's `stats` and `rankingScore` evolve. Higher scores mean more visibility on search.

### 10.3 Admin journey: daily ops

1. **Login as admin** → redirected to admin console (separate layout, no public-facing UI).
2. **Verification queue.** "There are 12 pending documents." Click → first document → image viewer → approve or reject with a reason. Each approval triggers a badge recalculation for the contractor.
3. **Flagged reviews.** Same pattern — review, decide to publish or hide.
4. **User support.** Search by email or phone, view full activity (jobs, leads, reviews, payments, audit log), suspend if abusive.
5. **Featured listings.** Pick a contractor, set "featured for 7 days" — they get prominent placement on the home page during that window.
6. **Analytics.** Daily KPIs: signups by role, jobs posted, leads created, reveals, reviews, top categories, top cities.
7. **Settings tweaks.** Adjust lead expiry, ranking weights, OTP rate limits from the settings page without touching code.

### 10.4 New-city expansion flow

A specific operational flow worth designing for since it's how the business scales.

1. Super admin adds a new city via `POST /admin/cities`. The city is created with `isActive: false`.
2. Manual contractor onboarding: the team uses the admin console to create contractor user accounts in that city (or invites contractors via email). Initial contractors might be given a free Elite plan via `POST /admin/subscriptions/grant`.
3. Once there are at least N contractors per category (e.g., 5), the city is toggled `isActive: true` and appears in the public city list.
4. Marketing pushes traffic to the city's landing page.

The system supports this without code changes thanks to the `isActive` flag on `cities` and the admin-grant subscription mechanism.

---

## 11. The Matching & Lead Distribution Engine

This is the heart of the marketplace. It runs when a client posts a job and decides which contractors get to see it (and when).

### The trigger

When a new job document is created (`status: OPEN`), an event is enqueued onto the `lead-distribution` queue.

### The algorithm (step by step)

The worker processing this job does the following:

1. **Fetch the job** along with `categoryId` and `cityId`.

2. **Find eligible contractors.** Query `contractorProfiles` where:
   - `cityId` matches the job's city, OR (alternative path) the contractor's `geo` is within `serviceRadiusKm` of the job's location.
   - `categories.categoryId` includes the job's category.
   - `isAvailable: true`.
   - The associated user is `status: ACTIVE`.
   - `badge: { $ne: 'NONE' }` (i.e., at least email-verified — no unverified contractors get leads).

3. **Sort candidates by `rankingScore` descending, take top 50.** This caps work per job: even in a popular category with hundreds of eligible contractors, the system distributes to the 50 best-ranked. Lower-ranked contractors don't get leads on this job — by design, because they're competing on rank.

4. **Bucket candidates by their current plan tier:**
   - ELITE bucket
   - GROWTH bucket
   - STARTER bucket
   - FREE bucket

5. **Apply tier-based delays to `visibleFrom`:**
   - ELITE: `visibleFrom = now`
   - GROWTH: `visibleFrom = now + growthDelayHours` (from settings, default 24h)
   - STARTER: `visibleFrom = now + starterDelayHours` (default 48h)
   - FREE: capped at, say, top 5 candidates only, and `visibleFrom = now + 48h` (free tier still gets some access, but late and limited)

6. **Set `expiresAt = visibleFrom + leadExpiryDays`** (default 7 days from `settings`).

7. **Insert `leads` documents** for each contractor with the computed `visibleFrom` and `expiresAt`.

8. **Schedule notification jobs.** For each lead, enqueue a "new lead notification" job with `delay = visibleFrom - now`. When the delay passes, the notification fires (in-app + email).

### Why this design

- **Faster delivery is a real, valuable feature** for paying contractors — they get the lead while it's fresh.
- **Lower tiers still get leads**, which keeps them on the platform long enough to become customers.
- **The top-N cap (50) protects you** from runaway distribution costs and ensures contractors aren't drowning in irrelevant leads.
- **Ranking-based selection** rewards quality. Better contractors (more reviews, faster response, higher tiers) appear more often.

### Lead state transitions

- `NEW` → contractor hasn't interacted
- `NEW` → `VIEWED` when contractor opens the lead detail page; `viewedAt` set
- `VIEWED` → `CONTACTED` when contractor marks "I reached out"; `contactedAt` set, `respondedInMs` computed
- `CONTACTED` → `WON` when the client assigns this contractor to the job
- `CONTACTED` → `LOST` when the client assigns another contractor or cancels the job
- Any state → `EXPIRED` when `expiresAt` passes without a CONTACTED transition (runs on an hourly cron)

### Response rate calculation

Each contractor's `stats.responseRate` = (leads with status `CONTACTED` or `WON`) ÷ (total leads where `visibleFrom < now - 24h`). This metric only counts leads that were visible long enough to act on. Recomputed by the ranking job.

---

## 12. Ranking Logic

The contractor's `rankingScore` is a number between 0 and 1, computed from a weighted sum.

### Inputs

- **Tier score** — Elite=1.0, Growth=0.75, Starter=0.5, Free=0.25
- **Rating score** — `avgRating / 5`
- **Jobs completed score** — `log10(1 + jobsCompleted) / log10(101)`, capped at 1. Log-scaling means going from 0→10 jobs matters much more than 100→110 jobs.
- **Response rate** — already 0–1
- **Badge score** — Gold=1.0, Silver=0.66, Bronze=0.33, None=0
- **Completeness score** — `profileCompleteness / 100`

### Weights (configurable in `settings`)

- Tier: 30%
- Rating: 25%
- Jobs completed: 15%
- Response rate: 15%
- Badge: 10%
- Completeness: 5%

### When the score is recomputed

- A new review lands on this contractor → recompute one contractor
- A contractor completes a job → recompute one contractor
- A contractor's subscription changes → recompute one contractor
- A contractor's badge changes → recompute one contractor
- Nightly cron → recompute all active contractors (catches drift: response-rate decay, etc.)

### Why a single denormalized score

A naive approach would compute the score at query time. That requires aggregating reviews, subscriptions, and badges on every search request — slow and not cacheable. By storing the score as a single number, sorting becomes index-backed (`{ rankingScore: -1 }`), and the search query stays fast even at 100K contractors.

The cost: scores are slightly stale between recomputations. For ranking, that's acceptable.

### Tunability

Because weights live in the `settings` document, admins can experiment. If you find that response-rate matters more than you initially weighted it at, change the number, and the next ranking-recompute pass will pick it up. No code deploy.

---

## 13. File Handling Strategy

### The principle

Files do not flow through your backend. They go directly from the user's browser to Cloudinary. Your backend only handles signing the upload and recording the resulting URL.

### Upload flow

1. **User wants to upload** a profile photo (or portfolio image, or verification document).
2. **Frontend calls `POST /contractor/upload-signature`** with the upload purpose (e.g., `purpose: 'PROFILE_PHOTO'`).
3. **Backend validates** the purpose against a whitelist and generates a Cloudinary signed URL with:
   - A scoped folder (e.g., `ballu/profile/<userId>/`).
   - Allowed file formats (jpg/png for images, jpg/png/pdf for documents).
   - A size cap (e.g., 5MB).
   - A short expiry on the signature itself.
4. **Backend returns** the signed parameters.
5. **Frontend uploads directly** to Cloudinary using those parameters.
6. **Cloudinary returns** the final URL of the uploaded file.
7. **Frontend posts the URL back to the backend** in the appropriate endpoint (e.g., `PATCH /contractor/profile` with the new `profilePhotoUrl`).
8. **Backend validates** that the URL is from your Cloudinary cloud (defense against client-side tampering), then saves it.

### Privacy zones in Cloudinary

- **Public folder** (`profile/`, `portfolio/`, `cover/`) — accessible via direct URL, served from the CDN. These are profile-facing assets.
- **Private folder** (`documents/`) — verification documents. Access requires a signed URL generated by the backend. Admins viewing documents in the verification queue request signed URLs from the backend that are valid for a few minutes.

### What this gets you

- Your VPS is never the bottleneck for uploads.
- Cloudinary handles image transformations (thumbnails, optimization, format conversion) automatically.
- The CDN means images load fast worldwide.
- Sensitive documents never traverse your backend, reducing your liability.

---

## 14. Notification System

### Channels

Three channels are designed in from the start, with one (in-app) live at launch and two (email, WhatsApp) added as needed.

| Channel | Use cases | Status at launch |
|---|---|---|
| In-app | Lead notifications, system messages, review requests | live |
| Email | OTPs, transactional confirmations, weekly digests | live (Resend) |
| WhatsApp | Urgent lead alerts, review reminders | deferred (Gupshup or Meta Cloud API) |

### Dispatcher pattern

A single `notify(userId, type, data)` function is the entry point for all notifications. Internally it:

1. Looks up the user.
2. Resolves the notification template for `type` (e.g., `NEW_LEAD` template).
3. Writes a row to `notifications` (in-app delivery is automatic).
4. Checks the user's preferences (and the platform `settings`) for which other channels to use.
5. Enqueues channel-specific jobs to the appropriate worker (email worker, WhatsApp worker).

The benefit of the dispatcher: business code calls `notify(...)` and doesn't know or care which channels are involved. Adding WhatsApp later is one new worker + one new channel registration — no changes to the rest of the codebase.

### Notification types you'll need at launch

- `OTP` (email only — never in-app, obviously)
- `WELCOME` (email)
- `PROFILE_INCOMPLETE_REMINDER` (email after 24h if onboarding stalled)
- `NEW_LEAD` (in-app + email, optional WhatsApp later)
- `LEAD_EXPIRING_SOON` (in-app, 12h before expiry)
- `JOB_COMPLETED` (in-app + email to both parties)
- `REVIEW_REQUEST` (email, after job completion)
- `REVIEW_RECEIVED` (in-app)
- `DOCUMENT_APPROVED` / `DOCUMENT_REJECTED` (in-app + email)
- `USER_SUSPENDED` (email, mandatory — they need to know why they can't log in)

### User preferences

Each user has a small `notificationPreferences` object on their user document — which categories they want via which channels. Defaults are conservative (no marketing emails, transactional only). The settings page in the dashboard lets them adjust.

---

## 15. Background Jobs

Run via BullMQ on Redis. A separate Node process (`worker.js`) consumes jobs. Managed by PM2 alongside the API process.

### Job catalog

| Queue | Trigger | What it does |
|---|---|---|
| `email` | Notification dispatcher | Sends one email via Resend |
| `notifications` | Various business events | Fans out to all enabled channels |
| `lead-distribution` | New job posted | Computes eligible contractors, creates leads, schedules visibility |
| `lead-notification` | Scheduled (delay = visibleFrom - now) | Notifies a contractor that a new lead is visible |
| `lead-expiry` | Hourly cron | Marks leads with `expiresAt < now` and no contact as `EXPIRED` |
| `job-expiry` | Hourly cron | Auto-closes OPEN jobs whose `expiresAt` has passed |
| `ranking-recompute` | Many triggers | Recomputes one contractor's `rankingScore` |
| `ranking-recompute-all` | Nightly cron | Iterates all active contractors |
| `review-request` | Job marked COMPLETED | Schedules email to both parties asking for a review |
| `subscription-expiry-check` | Daily cron | Marks expired subscriptions, sends renewal reminders |
| `verification-reminder` | Daily cron | Nudges contractors with stalled verification |

### Why decouple this

- API responses stay fast. Posting a job returns instantly; the lead distribution happens in the background.
- Retries are automatic. If sending an email fails, BullMQ retries with exponential backoff.
- A spike in job postings does not bring down the API — the queue absorbs it.
- You can scale workers independently of the API when load demands.

---

## 16. Caching Strategy

Caching is layered. Use Redis as the cache store. The strategy: cache anything that's expensive to compute or fetch and that changes infrequently.

### What to cache and for how long

| Data | TTL | Notes |
|---|---|---|
| Categories list | 1 hour | Rarely changes; invalidated on admin edit |
| Cities list | 1 hour | Same |
| Plans list | 1 hour | Same |
| Settings document | 5 min | Changes occasionally; short TTL is enough |
| Public contractor profile (by slug) | 5 min | Read-heavy; mild staleness OK |
| Search results (per filter combination) | 1 min | Hottest endpoint; short TTL is enough |
| User permissions (per user, after JWT decode) | 5 min | Skip at first; add only if profile fetches become a bottleneck |

### Cache key conventions

Keys are namespaced with a version prefix: `v1:contractor:profile:<slug>`. Bumping `v1` to `v2` instantly invalidates everything — useful when you change the response shape.

### Invalidation

- **On write:** when a contractor edits their profile, the cache key for that contractor is deleted. Search caches are flushed lazily (their 1-minute TTL is short enough).
- **On admin actions:** category/city/settings changes flush their respective caches.
- **On schema changes:** bump the version prefix.

### What NOT to cache

- Anything in the user's dashboard (their leads, their jobs). These are user-specific and not high-traffic enough to justify caching.
- Anything authenticated where a stale view could leak data.
- Any payment-related state.

---

## 17. Security Posture

A baseline that's appropriate for an Indian marketplace handling PII and (eventually) money.

### Transport and infrastructure

- HTTPS everywhere. HTTP requests redirected at Nginx. HSTS header set.
- Helmet middleware sets baseline security headers (X-Frame-Options, X-Content-Type-Options, etc.).
- CORS strictly limited to `https://ballu.in` (plus preview origins during development).

### Authentication

- No passwords means no password breaches. OTP-only.
- Access tokens short-lived (15 min). Refresh tokens server-tracked and rotatable.
- HTTP-only, secure, SameSite=Strict cookies for refresh tokens.
- Token reuse detection invalidates entire sessions automatically.

### Authorization

- Default deny on all routes. Permissions required explicitly.
- Ownership checks on every `.own` permission.
- Frontend permission gating is cosmetic only — never trust it.

### Input handling

- Every endpoint validates its input with a schema validator (Joi or Zod for JS). Reject before touching the database.
- Mongoose schemas enforce types at write time.
- Never use string concatenation in queries. Mongoose's query builder is safe by default.
- File uploads validated for MIME type and size, signed URLs scoped to specific folders.

### Output handling

- React escapes HTML by default. Avoid `dangerouslySetInnerHTML` for any user content.
- API responses go through a serializer that strips internal fields (e.g., `passwordHash` doesn't exist in our model, but generally we whitelist fields).
- PII is redacted from server logs (emails, phones).

### Rate limiting

- Nginx layer: per-IP request cap.
- Application layer: per-route specifics (OTP endpoints get tighter limits, contact reveal capped per user per day).

### Abuse and ops

- Audit log for admin actions, contact reveals, subscriptions, suspensions.
- Fail2ban on the VPS to block SSH brute force.
- Database user has minimum privileges (no admin rights on Atlas).
- Atlas IP whitelist contains only the VPS IPs — no wide-open access.

### Secrets

- `.env` files never committed. `.env.example` is the template.
- Secrets in Vercel / Hostinger panels for production.
- JWT secrets rotated annually.

### Backups and disaster recovery

- Atlas continuous backup (with paid tier) or daily `mongodump` to S3 (with free tier).
- VPS state is reproducible: deploy script + env file restores the backend in minutes.
- Cloudinary holds files; treat it as durable storage and don't keep duplicates.

### What's deferred

- Penetration testing — schedule once you have meaningful traffic.
- SOC 2 / formal compliance — not relevant at this stage.
- Two-factor auth for admins — add when you have multiple admins.

