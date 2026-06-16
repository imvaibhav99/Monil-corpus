# Ballu — Build Progress

A running summary of what was built in each phase.

---

## Phase 1 — Identity, Auth & RBAC (superseded by Phase 2)

Initial implementation used email-OTP + Google ID-token for clients/contractors and a separate password-based Admin collection. Replaced wholesale in Phase 2; see git history if needed.

---

## Phase 2 — Boilerplate-style Auth & RBAC (current)

**Goal:** Port the hagopj13/node-express-boilerplate auth pattern into our `app/<domain>` structure, replacing Phase 1 entirely.

### Stack & conventions
- Node.js + Express, **ESM** (`type: module`).
- **Joi** validators with a `validate(schema)` middleware that picks `body|query|params`.
- **Passport JWT** strategy for authentication.
- Domain-grouped layout: `app/<domain>/{model,controller,route,validator,service}`.
- Cross-cutting code at top level: `config/`, `middleware/`, `helpers/` (including `helpers/plugins/`), `routes/index.js`, `scripts/`.
- Email via **Resend**.

### Identity model
- **Unified `User`** collection (replaced Phase 1's split User + Admin).
- Fields: `name`, `email` (unique, validated), `password` (bcrypt-hashed pre-save, `private: true` so the toJSON plugin hides it), `role`, `isEmailVerified`.
- Roles: `CLIENT`, `CONTRACTOR`, `ADMIN`, `SUPER_ADMIN`.
- Statics: `isEmailTaken(email, excludeUserId)`. Methods: `isPasswordMatch(password)`.
- Plugins: `toJSON` (id field, hide privates, strip __v/timestamps), `paginate`.

### Token model
- Single **`Token`** collection for refresh / reset-password / verify-email tokens (all JWTs).
- Fields: `token`, `user`, `type`, `expires`, `blacklisted`.
- Refresh tokens are deleted-and-recreated on rotation.

### Authentication endpoints (`/v1/auth`)
- `POST /register` — email + password + name; auto-issues access + refresh tokens.
- `POST /login` — email + password.
- `POST /logout` — deletes the refresh token doc.
- `POST /refresh-tokens` — refresh token in request body; rotates both.
- `POST /forgot-password` — emails a reset link to the user.
- `POST /reset-password?token=...` — sets a new password.
- `POST /send-verification-email` — authenticated; sends verify link.
- `POST /verify-email?token=...` — flips `isEmailVerified` to true.

### RBAC
- Static `roleRights` map in `config/roles.js` mapping each role to an array of permission strings.
- `auth(...requiredRights)` middleware: verifies JWT via Passport, attaches `req.user`, then checks rights.
- Self-access escape hatch: a user hitting `/users/:userId` for their own id bypasses required rights (so users can manage themselves).

### User CRUD (`/v1/users`, all admin-gated)
- `POST /` (createUser, `manageUsers`)
- `GET /` paginated with filters (sortBy/limit/page, `getUsers`)
- `GET /:userId` (`getUsers`, self-bypass)
- `PATCH /:userId` (`manageUsers`, self-bypass)
- `DELETE /:userId` (`deleteUsers`)

### Email service
- Resend client wrapped in `app/auth/service/email.service.js`.
- Reset and verify emails generated with links pointing to `FRONTEND_ORIGIN`.

### Tooling
- `scripts/seedAdmin.js` (`npm run seed:admin`) — creates/upgrades a `SUPER_ADMIN` from `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` and marks the email verified.
- `.env.example` documents required vars. `JWT_SECRET` is the canonical name; falls back to `JWT_ACCESS_SECRET` for compatibility.

### Security hardening
- **Helmet** for security headers (HSTS, CSP, X-Frame-Options, Referrer-Policy, etc.).
- **Body size cap** (`express.json({ limit: '10kb' })`) blocks JSON-bomb payloads.
- **`express-mongo-sanitize`** strips `$` and `.` from req payloads — blocks NoSQL operator injection.
- **`xss-clean`** sanitizes string fields in body/query/params against reflected XSS.
- **`hpp`** drops duplicate query params.
- **`compression`** gzips responses.
- **`morgan`** request logging (success + error streams; error logs include the exception message via `res.locals.errorMessage`).
- **Rate limiting** (production only, keeps dev painless):
  - `authLimiter` on `/v1/auth`: 20 req / 15 min / IP, `skipSuccessfulRequests: true` — only failed attempts count.
  - `globalLimiter` on `/v1/*`: 300 req / 15 min / IP.
- **`trust proxy`** so `req.ip` reflects the real client behind Nginx/Vercel.

### Verified end-to-end
- MongoDB Atlas connection.
- Admin seeding.
- Password login → access token.
- Authenticated request to `/v1/auth/send-verification-email` → Resend delivery to the verified domain.

### Deferred to later phases
- Contractor profile, client profile, portfolio, file uploads, document verification.
- Categories, cities, jobs, leads, matching engine, reviews, ranking, audit logs, feature flags, settings.
- Refresh-token theft detection (boilerplate doesn't have it; intentional per Phase 2 decision).
- Account lockout on failed logins (needs Redis; not added).
- Replacements for `xss-clean` / `express-mongo-sanitize` when/if we upgrade to Express 5 (those packages don't support it).

---

## Phase 3.5 — Contact Information & Auth-Gated Profiles

**Goal:** Implement 99acres-style contact reveal flow where non-logged-in users see contractor profiles but not contact information. Only logged-in clients can see and interact with contact details.

### Contact Channels Schema

**Added to `ContractorProfile`:**
```javascript
contactChannels: {
  phone: String,              // "+91-9876543210"
  whatsapp: String,           // "+91-9876543210" (clickable to WhatsApp Web)
  email: String,              // Separate contact email (different from login email)
  telegram: String,           // "@username" (optional)
  preferredChannel: String    // "email" | "phone" | "whatsapp" | "telegram"
}
```

### Authentication-Gated Profile Viewing

**Non-logged-in users:**
- ✅ Can search contractors (`GET /v1/contractors`)
- ✅ Can view contractor profile cards (search results) — no contact info
- ✅ Can click "View Profile" to see full profile
- ✅ See profile details: bio, categories, languages, working hours, portfolio, ratings
- ❌ **Cannot see contact information** — contactChannels stripped from response
- 📱 See "📞 Contact Information" section with placeholder message
- 🔗 "Login to Contact" button → redirects to `/client/login?redirect=/contractors/:slug`

**Logged-in clients:**
- ✅ Can search contractors
- ✅ Can view contractor profile cards
- ✅ Can click "View Profile"
- ✅ See **full profile including contact information:**
  - Phone number (clickable `tel:` link)
  - WhatsApp (opens `https://wa.me/phonenumber`)
  - Email (clickable `mailto:` link)
  - Telegram (opens Telegram direct message)
  - Preferred channel highlighted with ⭐
- ✅ "✓ Contact Visible" button confirms they can see it

### Backend Changes

**Controllers** (`app/contractor/controller/contractor.controller.js`)
- `getPublicProfile` — checks `req.user`, sanitizes `contactChannels` if unauthenticated
- Added helper `sanitizeProfileForPublic()` to strip contact fields

**Service** (`app/contractor/service/contractor.service.js`)
- Added `sanitizeProfileForPublic(profile)` — removes contactChannels for public API responses
- `getPublicProfileBySlug()` unchanged (service layer returns full data; controller decides visibility)
- `searchContractors()` unchanged (already excludes contact from search results)

**Routes** (`app/contractor/route/contractor.public.route.js`)
- No changes — public routes don't require `auth()` middleware
- Logic is in controller, not route guard

### Frontend Changes

**ContractorPublicProfile** (`src/app/contractor/pages/ContractorPublicProfile.jsx`)
- Detects `req.user` in response; if missing, hides contact section
- Shows conditional contact section only when `user` is logged in and `contractor.contactChannels` exists
- Shows placeholder message for non-logged-in users with "Login to Contact" link
- "Login to Contact" button → `navigate(/client/login?redirect=/contractors/:slug)`
- Contact links are functional:
  - Phone: `tel:+91XXXXXXXXXX`
  - WhatsApp: `https://wa.me/+91XXXXXXXXXX` (opens WhatsApp)
  - Email: `mailto:email@example.com`
  - Telegram: `https://t.me/username`

**ContractorProfileEdit** (`src/app/contractor/pages/ContractorProfileEdit.jsx`)
- Added form fields for contact information as **disabled placeholder inputs**
- Shows: Phone, WhatsApp, Email, Telegram, Preferred Channel selector
- All inputs display `disabled` attribute + "Coming in Phase 4" helper text
- Fields included in form state but not sent in payload (prep for Phase 4)

**ContractorSearch** (`src/app/contractor/pages/ContractorSearch.jsx`)
- No changes — search results already exclude contact fields

**CSS** (`src/styles/global.css`)
- Added `.contact-section` — panel styling for contact info
- Added `.contact-channels` — flex column for contact items
- Added `.contact-item` — individual contact method styling
- Added `.contact-label` — label for each contact method
- Added `.contact-link` — styled link colors (primary blue, hover underline)
- Added `.btn--success` — green button for "✓ Contact Visible"

### API Contract (Unchanged)

**Public profile request (unauthenticated):**
```json
GET /v1/contractors/:slug

Response (no contactChannels):
{
  "data": {
    "id": "...",
    "businessName": "...",
    "bio": "...",
    "categories": [...],
    "stats": {...},
    // ... other fields except contactChannels
  }
}
```

**Public profile request (authenticated):**
```json
GET /v1/contractors/:slug (with Authorization header)

Response (contactChannels included):
{
  "data": {
    "id": "...",
    "businessName": "...",
    "bio": "...",
    "categories": [...],
    "stats": {...},
    "contactChannels": {
      "phone": "+91-9876543210",
      "whatsapp": "+91-9876543210",
      "email": "contact@example.com",
      "telegram": "@username",
      "preferredChannel": "whatsapp"
    }
  }
}
```

### Deferred to Phase 4

- Form submission for contact fields (currently disabled in ProfileEdit)
- Backend endpoint to save/update contact channels
- Email validation for contact email field
- Phone number formatting/validation
- Notification to contractor when client reveals contact

---

## Phase 3 — Reference Data, Profiles & Settings

**Goal:** Build the five domain slices (category, city, contractor profile, client profile, settings) plus a seed script and auto-profile creation on registration.

### New Models

**`Category`** (`app/category/model/category.model.js`)
Fields: `slug` (unique), `name`, `description`, `iconUrl`, `parentId` (self-ref), `isActive`, `sortOrder`, `metadata`. Plugins: toJSON, paginate. Indexes: `{ isActive, sortOrder }`, `parentId`.

**`City`** (`app/city/model/city.model.js`)
Fields: `slug` (unique), `name`, `state`, `country` (default India), `geo` (GeoJSON Point), `isActive`, `metadata`. Plugins: toJSON, paginate. Indexes: `state`, `isActive`, `geo` (2dsphere, sparse).

**`ContractorProfile`** (`app/contractor/model/contractorProfile.model.js`)
Fields: `userId` (unique ref User), `businessName`, `slug` (unique sparse), `bio` (max 500), `yearsExperience`, `languages`, `cityId`, `pincode`, `address`, `geo`, `serviceRadiusKm`, `categories[]` (categoryId + primary), `badge` (NONE/BRONZE/SILVER/GOLD), `verifiedAt`, `verificationStage`, `profilePhotoUrl`, `coverPhotoUrl`, `portfolioItems[]` (imageUrl + caption + createdAt), `workingHours`, `emergencyService`, `stats` (avgRating, totalReviews, jobsCompleted, responseRate, responseTimeMinutes, profileCompleteness), `rankingScore`, `isAvailable`, `isFeatured`, `featuredUntil`, `currentPlanTier` (FREE/STARTER/GROWTH/ELITE), `subscriptionExpiresAt`, `metadata`, `deletedAt`. Plugins: toJSON, paginate. Indexes: `{ cityId, badge }`, `{ rankingScore }`, `{ categories.categoryId, cityId }`, `geo` (2dsphere sparse), `{ isFeatured, featuredUntil }`, `{ currentPlanTier, isAvailable }`.

**`ClientProfile`** (`app/client/model/clientProfile.model.js`)
Fields: `userId` (unique ref User), `cityId`, `pincode`, `address`, `preferences`, `stats` (jobsPosted, reviewsWritten), `metadata`, `deletedAt`. Plugins: toJSON, paginate. Index: `cityId`.

**`Settings`** (`app/settings/model/settings.model.js`)
Singleton: `_id = 'platform'`. Fields: `lead` (defaultExpiryDays, tier delay hours), `ranking` (weights object), `contactReveal` (maxPerClientPerDay), `otp` (ttl, maxAttempts, requestsPerHour), `email` (supportAddress). Plugin: toJSON only.

---

### New Routes

#### Category
| Method | Path | Auth |
|--------|------|------|
| GET | /v1/categories | public |
| GET | /v1/categories/:slug | public |
| POST | /v1/admin/categories | `category.manage` |
| PATCH | /v1/admin/categories/:categoryId | `category.manage` |

#### City
| Method | Path | Auth |
|--------|------|------|
| GET | /v1/cities | public |
| GET | /v1/cities/:slug | public |
| POST | /v1/admin/cities | `city.manage` |
| PATCH | /v1/admin/cities/:cityId | `city.manage` |

#### Contractor — Public
| Method | Path | Auth |
|--------|------|------|
| GET | /v1/contractors | public — cursor-based search |
| GET | /v1/contractors/:slug | public — profile |
| GET | /v1/contractors/:slug/reviews | public — placeholder, returns [] |

#### Contractor — Self (singular `/contractor`)
| Method | Path | Auth |
|--------|------|------|
| GET | /v1/contractor/profile | `contractor.profile.edit.own` |
| PATCH | /v1/contractor/profile | `contractor.profile.edit.own` |
| POST | /v1/contractor/portfolio | `contractor.profile.edit.own` |
| DELETE | /v1/contractor/portfolio/:itemId | `contractor.profile.edit.own` |
| POST | /v1/contractor/availability | `contractor.profile.edit.own` |

#### Contractor — Admin
| Method | Path | Auth |
|--------|------|------|
| GET | /v1/admin/contractors | `getUsers` — offset pagination |
| PATCH | /v1/admin/contractors/:userId | `contractor.profile.edit.any` |

#### Client
| Method | Path | Auth |
|--------|------|------|
| GET | /v1/client/profile | authenticated |
| PATCH | /v1/client/profile | authenticated |

#### Settings
| Method | Path | Auth |
|--------|------|------|
| GET | /v1/admin/settings | `settings.edit` |
| PATCH | /v1/admin/settings | `settings.edit` |

---

### config/roles.js

Replaced `allRoles` with the full Phase 3 rights map:
- **CLIENT**: `contractor.search`, `contractor.profile.view.public`, `contact.reveal`
- **CONTRACTOR**: `contractor.profile.edit.own`, `contractor.search`, `contractor.profile.view.public`, `document.upload`
- **ADMIN**: full set including `category.manage`, `city.manage`, `contractor.profile.edit.any`, `settings.edit`, `analytics.view`, `feature_flag.toggle`, `audit.view`, `user.list`, `user.ban`, etc.
- **SUPER_ADMIN**: everything ADMIN has plus `user.delete`, `admin.create`

---

### Contractor service — key logic

- **`generateSlug(businessName, cityName)`**: lowercase + hyphens + 4-char random hex suffix. E.g. `ravi-electrical-bhopal-a3f1`.
- **`updateProfile`**: regenerates slug when businessName or cityId changes and businessName is set. Recomputes `stats.profileCompleteness` (15 pts businessName, 10 bio, 5 yearsExperience, 5 languages, 10 cityId, 5 pincode, 15 categories, 15 profilePhotoUrl, 10 portfolioItems, 10 workingHours; max 100).
- **`searchContractors`**: cursor-based pagination on `_id` (descending), sorted by `rankingScore` desc. Filters: categorySlug, citySlug, badge, minRating. Limit default 20, max 50. Excludes soft-deleted.
- **`addPortfolioItem`**: enforces 30-item cap.

---

### Auto-create profile shells on registration

`app/auth/service/auth.service.js` — new `register(userBody)` function: calls `userService.createUser`, then creates an empty `ContractorProfile` (badge BRONZE) or `ClientProfile` depending on role. Profile creation is wrapped in try-catch so failures never break registration. `app/auth/controller/auth.controller.js` updated to call `authService.register` instead of `userService.createUser` directly.

---

### Seed script (`scripts/seedData.js` / `npm run seed:data`)

Upserts:
- 10 categories: electrician, plumber, painter, carpenter, ac-repair, pest-control, cleaning, interior-designer, mason, welder (sortOrder 1–10, isActive true).
- 5 cities with GeoJSON coordinates: bhopal, indore, delhi, mumbai, bangalore.
- Settings singleton (creates only if absent, preserving existing config).

---

### Response envelope (all Phase 3 endpoints)

- Single resource: `{ data: <object> }`
- Cursor list (public search): `{ data: [...], meta: { hasMore, nextCursor } }`
- Offset list (admin): `{ data: [...], meta: { page, limit, totalPages, totalResults } }`

---

### Deferred to Phase 4
- Document upload and verification flow (`document.upload`, `document.verify` rights wired, implementation pending).
- Review creation and aggregation (reviews endpoint returns placeholder `[]`).
- Ranking score computation engine (field exists, populated manually for now).
- Jobs / leads / matching engine.
- Featured assignment (`featured.assign` right wired).
- Analytics, audit logs, feature flags (`analytics.view`, `audit.view`, `feature_flag.toggle` rights wired).
- Contact reveal flow (`contact.reveal` right wired).

---

### Phase 3 Frontend

**Stack:** React 18 + Vite, react-router-dom v6, axios, plain CSS (global.css).

#### New Service Files
| File | Purpose |
|------|---------|
| `src/app/category/service/category.service.js` | `getCategories`, `getCategoryBySlug`, `createCategory`, `updateCategory` |
| `src/app/city/service/city.service.js` | `getCities`, `getCityBySlug`, `createCity`, `updateCity` |
| `src/app/contractor/service/contractor.service.js` | `searchContractors`, `getContractorBySlug`, `getMyProfile`, `updateMyProfile`, `addPortfolioItem`, `deletePortfolioItem`, `toggleAvailability`, `getAdminContractors`, `adminUpdateContractor` |
| `src/app/client/service/client.service.js` | `getMyProfile`, `updateMyProfile` |
| `src/app/settings/service/settings.service.js` | `getSettings`, `updateSettings` |

#### New Pages & Routes

| Route | Component | Auth |
|-------|-----------|------|
| `/contractors` | `ContractorSearch` | public |
| `/contractors/:slug` | `ContractorPublicProfile` | public |
| `/contractor/home` | `ContractorHome` (replaced) | CONTRACTOR |
| `/contractor/profile/edit` | `ContractorProfileEdit` | CONTRACTOR |
| `/contractor/portfolio` | `ContractorPortfolio` | CONTRACTOR |
| `/client/home` | `ClientHome` (replaced) | CLIENT |
| `/client/profile/edit` | `ClientProfileEdit` | CLIENT |
| `/admin/home` | `AdminHome` (nav added) | ADMIN/SUPER_ADMIN |
| `/admin/categories` | `AdminCategories` | ADMIN/SUPER_ADMIN |
| `/admin/cities` | `AdminCities` | ADMIN/SUPER_ADMIN |
| `/admin/settings` | `AdminSettings` | ADMIN/SUPER_ADMIN |
| `/admin/contractors` | `AdminContractors` | ADMIN/SUPER_ADMIN |

#### Changes to Existing Files
- **`src/app/auth/pages/Landing.jsx`** — added search section above auth cards: category + city dropdowns, Search button navigating to `/contractors?...`, active-city chip links.
- **`src/app/admin/pages/AdminHome.jsx`** — added admin nav bar (Categories / Cities / Contractors / Settings / Users).
- **`src/routes/AppRoutes.jsx`** — added all 12 new routes above.
- **`src/styles/global.css`** — appended Phase 3 class groups: landing search, chips, section-title, empty-state, search page + contractor card, progress bar, stat cards, public profile, working hours table, portfolio grid, badge icon, dashboard sidebar layout, form components (form-group/label/input/select/textarea/checkbox/row/actions), admin nav, responsive breakpoints.

#### Deferred
- Cloudinary / file upload UI (profile photo, cover photo, portfolio images use URL text inputs for now).
- Contact reveal button (placeholder disabled, labelled "Phase 4").
- Reviews (placeholder "Reviews coming soon" on public profile).
- Job posting, saved contractors, proposal flow (Phase 5).

---

## Phase 4 — Client Profile Complete & Location-Based Contractor Filtering

**Goal:** Enable clients to maintain complete profile information and see contractors only from their selected location.

### Backend Changes

**Client Profile Service** (`app/client/service/client.service.js`)
- Updated `getProfileByUserId()` to:
  - Populate `cityId` with full city details (name, slug, state)
  - Auto-create missing profiles for existing users (graceful backward compatibility)
- Updated `updateProfile()` to:
  - Auto-create profile if missing (instead of throwing 404)
  - Populate `cityId` in response for full city details

### Frontend Changes

**ClientProfileEdit** (`src/app/client/pages/ClientProfileEdit.jsx`)
- Enhanced form to capture **complete client information**:
  - **Location Information:**
    - City (required dropdown)
    - Pincode (optional text input)
    - Street Address (optional text input)
  - **Preferences:**
    - Receive job notifications (checkbox)
    - Weekly email digest (checkbox)
    - Preferred Communication method (phone/email/whatsapp dropdown)
- Form state now includes `preferences` object for future notification/communication settings
- All fields are saved to backend via existing `updateMyProfile` endpoint
- Gracefully handles missing profiles (shows empty form, allows user to create/update)

**ClientHome** (`src/app/client/pages/ClientHome.jsx`)
- Auto-filters contractors by client's location on initial page load
- Reads `profile.city` or `profile.cityId` and extracts the city slug
- Automatically passes `citySlug` to the contractor search API
- Location info banner displays the client's location with option to change it
- When filters are cleared, the location filter is preserved (doesn't clear city)
- Shows message: "📍 Viewing contractors in {cityName}" with link to edit profile
- Gracefully handles missing profiles (shows all contractors until user sets location)

**Client Service** (`src/app/client/service/client.service.js`)
- No changes — already uses existing API routes

### How It Works

1. **Client signs up/logs in** → auto-created `ClientProfile` with empty cityId
2. **Client opens home page** → ClientHome fetches their profile
3. **If profile has a city:**
   - Auto-filters contractor list to show only contractors from that city
   - Shows location banner: "📍 Viewing contractors in [City Name]"
   - Allows filtering by category, badge, rating within their city
4. **Client wants to see contractors from another city:**
   - Clicks "Change Location" in banner
   - Updates their profile city in `/client/profile/edit`
   - Returns to home → contractors automatically re-filter to new city
5. **No city set yet:**
   - Shows all contractors (unfiltered)
   - Prompts user to set their location

### Updated API Contract

**Client Profile Request:**
```json
GET /v1/client/profile (authenticated)

Response:
{
  "data": {
    "id": "...",
    "userId": "...",
    "cityId": {
      "_id": "...",
      "name": "Mumbai",
      "slug": "mumbai",
      "state": "Maharashtra"
    },
    "pincode": "400001",
    "address": "123 Main Street, Apt 4B",
    "preferences": {
      "notifications": true,
      "emailDigest": false,
      "preferredContact": "whatsapp"
    },
    "stats": { ... },
    "metadata": { ... }
  }
}
```

### Frontend Location Filter Flow

1. **Initial Load:**
   - Fetch client profile
   - Extract `profile.cityId.slug` (or `profile.city.slug`)
   - Set filters with `citySlug`
   - Fetch contractors with location filter applied

2. **User searches/filters:**
   - Can override category, badge, minRating
   - City filter always stays as client's selected location
   - Clear button resets category/badge/minRating but preserves city

3. **User changes location:**
   - Navigate to `/client/profile/edit`
   - Select new city and save
   - Return to home
   - useEffect watches `profile` change, re-fetches contractors with new city

### Deferred to Phase 5+

- Advanced location preferences (service radius, nearby cities)
- Saved/favorite contractors
- Location-based job matching
- Distance calculation between client and contractor
- Email digest delivery
- Push notifications for new contractors in user's location

---

## Phase 5 — Job Posting, Lead Distribution & WhatsApp Contact Revelation

**Goal:** Enable clients to post jobs and contractors to view available leads with direct WhatsApp messaging to clients.

### Job Model & Lead Distribution System

**Job Model** (`app/job/model/job.model.js`)
- Fields: `clientId` (ref User), `categoryId` (ref Category), `cityId` (ref City), `title`, `description`, `budgetMin`, `budgetMax`, `pincode`, `address`, `urgency` (NORMAL/URGENT/EMERGENCY), `status` (OPEN/ASSIGNED/IN_PROGRESS/COMPLETED/CANCELLED/EXPIRED), `responseCount`, `assignedContractorId`, `expiresAt` (auto-7-day expiry)
- Indexes: `{ clientId, status, createdAt }`, `{ categoryId, cityId, status }`, `{ expiresAt }` for auto-cleanup
- Response envelope includes populated `clientId`, `categoryId`, `cityId`, `assignedContractorId`

**Lead Model** (`app/job/model/lead.model.js`)
- Fields: `jobId` (ref Job), `contractorId` (ref User), `status` (NEW/VIEWED/CONTACTED/WON/LOST/EXPIRED), `visibleFrom` (tier-based visibility, currently immediate for MVP), `expiresAt` (matches job), `contactedAt` (timestamp when contractor marked as CONTACTED), `respondedInMs` (time to first contact), `wonAt` (timestamp when job was assigned)
- Compound unique index: `{ jobId, contractorId }` — prevents duplicate leads for same contractor
- Indexes: `{ contractorId, status, createdAt }`, `{ expiresAt }` for auto-cleanup

### Lead Distribution Engine

**Job Service** (`app/job/service/job.service.js`)

**`distributeJobLeads(job)`**
- Auto-called after job creation
- Finds contractors matching:
  - Same city as job (`cityId`)
  - Offering the same service category (`categories.categoryId`)
  - Are available (`isAvailable: true`)
  - Have at least Bronze badge (`badge !== 'NONE'`)
  - Not soft-deleted
- Creates Lead documents in batch insert (one lead per eligible contractor)
- Database efficiency: **80-90% reduction** in leads with category filtering
  - Without category filtering: ~50,000 leads/day for full-city contractors
  - With category filtering: ~5,000-10,000 leads/day (only matching service categories)
- Example: plumbers only see plumbing jobs, carpenters see carpentry jobs

**Category Filtering Impact**
- Job posted: "Plumbing repair in Mumbai"
- Without filtering: All 200 Mumbai contractors get a lead
- With filtering: Only ~20 plumbers in Mumbai get a lead (90% reduction)
- Ensures contractors see relevant opportunities only

### Frontend Job Posting & Lead Management

**PostJob** (`src/app/job/pages/PostJob.jsx`)
- Client form with:
  - Category dropdown (populated from API, uses `id` field from toJSON plugin)
  - City dropdown (auto-selected to client's location if available)
  - Job title, description, budget range, urgency level
  - Auto-calculates 7-day expiry from job creation
- Submits to `POST /v1/jobs` endpoint
- Redirects to `/client/jobs/{jobId}` after successful posting
- Fixed ID field handling: `result.data?.id || result.id || result.data?._id || result._id` (accounts for toJSON plugin conversion of `_id` to `id`)

**JobDetail** (`src/app/job/pages/JobDetail.jsx`)
- Client view of their posted job
- Shows: job title, category, budget, urgency, location, countdown to expiry
- Lists interested contractors with response count
- Edit/cancel job actions
- Protected CLIENT-only route: `/client/jobs/:jobId`

**ContractorLeads** (`src/app/job/pages/ContractorLeads.jsx`)
- Displays available leads for logged-in contractor
- LeadCard component shows: job title, category, budget, client name, urgency, location
- Filter buttons: NEW, VIEWED, CONTACTED, WON, LOST, EXPIRED
- "Contact Client" button initiates WhatsApp message flow
- Pagination support: 20 leads per page
- Gets contractor's current city from profile to show only relevant leads

### WhatsApp Direct Messaging Feature

**Contact Revelation Flow**

1. **Contractor clicks "Contact Client"**
   - System marks lead as CONTACTED status in database
   - Records `contactedAt` timestamp and response time
   - Increments job's `responseCount`

2. **Client Phone Number Retrieval**
   - Backend endpoint returns client's phone number from `ClientProfile`
   - API response includes: `clientContact: { name, email, phone }`

3. **WhatsApp Direct Link Generation**
   - Opens `https://wa.me/{clientPhone}?text={prefilledMessage}`
   - Pre-filled message includes: job title + contractor's email
   - Example: "Hi, I'm interested in your 'Bathroom Plumbing' job posted on Ballu Thekedar. I can help with this work. Please reach out to me at priya.patel@example.com"

4. **Direct Messaging**
   - Contractor can directly message client on WhatsApp
   - No intermediary email or phone calls required
   - Contractor's email is included in message for client to save/contact

### Backend API Endpoints

**Job Management**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /v1/jobs | CLIENT | Create job (auto-distributes leads) |
| GET | /v1/jobs/my | CLIENT | List client's jobs with pagination |
| GET | /v1/jobs/:jobId | CLIENT | Get job details (own jobs only) |
| PATCH | /v1/jobs/:jobId | CLIENT | Update job (own jobs only) |
| DELETE | /v1/jobs/:jobId | CLIENT | Cancel job (own jobs only) |

**Contractor Lead Access**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | /v1/jobs/leads | CONTRACTOR | List contractor's leads (filtered by city) |
| POST | /v1/jobs/leads/:leadId/contact | CONTRACTOR | Mark lead as CONTACTED + reveal client phone |

**Admin Job Management**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | /v1/admin/jobs | ADMIN | View all jobs |
| PATCH | /v1/admin/jobs/:jobId | ADMIN | Assign contractor to job |

### Frontend Routes & Components

| Route | Component | Auth |
|-------|-----------|------|
| `/client/jobs/post` | PostJob | CLIENT |
| `/client/jobs/:jobId` | JobDetail | CLIENT |
| `/contractor/leads` | ContractorLeads | CONTRACTOR |

### Client Profile Phone Field

**ClientProfile Model Update** (`app/client/model/clientProfile.model.js`)
- Added `phone` field (String, default: '')
- Placed before `cityId` to group contact information

**ClientProfileEdit** (`src/app/client/pages/ClientProfileEdit.jsx`)
- Added phone input field in Location Information section
- Phone field: type="tel", maxLength="10", placeholder="e.g., 9876543210"
- Field is optional, but recommended for job postings
- Phone is sent to backend in `updateMyProfile()` request

### Role-Based Permissions

**Added to `config/roles.js`**
- `job.create` — CLIENT permission to post jobs
- `job.list.own` — CLIENT permission to list their jobs
- `job.view.own` — CLIENT permission to view their own jobs
- `job.edit.own` — CLIENT permission to edit their own jobs
- `lead.view` — CONTRACTOR permission to view available leads
- `lead.contact` — CONTRACTOR permission to contact clients

### How It Works End-to-End

1. **Client posts a job:**
   - Navigate to `/client/jobs/post`
   - Fill in category, city, title, description, budget, urgency
   - Submit → Job created + leads automatically distributed to matching contractors

2. **Leads are created instantly:**
   - System finds all contractors in same city with matching category
   - Creates Lead documents (one per contractor)
   - Each contractor can now see the job in their `/contractor/leads` page

3. **Contractor views available leads:**
   - Navigate to `/contractor/leads`
   - See jobs from their city matching their categories
   - Filter by lead status (NEW, VIEWED, CONTACTED, WON, LOST, EXPIRED)

4. **Contractor contacts client:**
   - Click "Contact Client" on a lead
   - System marks lead as CONTACTED in database
   - Retrieves client's phone from their profile
   - Opens WhatsApp with pre-filled message
   - Contractor can directly message client about the job

### Database Efficiency Notes

**Without Category Filtering:**
- 10 jobs/day × 200 contractors/city = 2,000 leads/day
- 10 days active × 2,000 = 20,000 leads in system
- Very high query load when contractors fetch leads

**With Category Filtering:**
- 10 jobs/day × 20 contractors matching category/city = 200 leads/day
- 10 days active × 200 = 2,000 leads in system
- 90% reduction in database load and query complexity
- Ensures contractors only see relevant work

### Deferred to Phase 6+

- Tier-based lead visibility (GOLD contractors see jobs 24hrs early)
- Lead expiry and cleanup cron job
- Job completion flow and contractor assignment
- Reviews and ratings post-completion
- Advanced matching (service radius, contractor ratings, budget preference)
- Lead response analytics and dashboard
- Contractor performance scoring based on lead response/conversion
- Job categories beyond initial 10
