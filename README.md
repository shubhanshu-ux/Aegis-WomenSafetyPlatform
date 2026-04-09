# Women’s Safety Platform — Backend API

Node.js + Express + MongoDB (Mongoose) backend with JWT auth, volunteer onboarding (mock KYC + face upload), SOS alerts with geo search, travel safety logs, and emergency media uploads.

## Prerequisites

- **Node.js** 18+
- **MongoDB** running locally or a connection string (MongoDB Atlas)

## Setup

```bash
cd womens-safety-backend
cp .env.example .env
```

Edit `.env`:

- `MONGODB_URI` — default `mongodb://127.0.0.1:27017/womens_safety`
- `JWT_SECRET` — long random string (required)
- `PORT` — default `4000`
- `BASE_URL` — public base for file URLs, e.g. `http://localhost:4000`

Install and run:

```bash
npm install
npm run dev
```

Or without watch:

```bash
npm start
```

Health check: `GET http://localhost:4000/health`

## Demo data (seed)

Clears existing collections and inserts realistic Indian demo users, volunteers, SOS alerts (Bengaluru area), trips, and emergency recording metadata.

```bash
npm run seed
```

All seeded accounts use password: **`DemoPass123!`**

| Email | Role |
|--------|------|
| priya.sharma@demo.in | user |
| anjali.verma@demo.in | user |
| meera.krishnan@demo.in | volunteer (verified profile) |
| sana.patel@demo.in | volunteer (pending profile) |

Test nearby alerts as a volunteer (after login):

`GET /api/alerts/nearby?latitude=12.975&longitude=77.599`

## API overview

Send JSON unless noted. Authenticated routes need header:

`Authorization: Bearer <JWT>`

### Auth — `/api/auth`

| Method | Path | Body | Notes |
|--------|------|------|--------|
| POST | `/register` | `email`, `password`, `name`, `phone`, optional `role` (`user` \| `volunteer`) | Returns JWT + user |
| POST | `/login` | `email`, `password` | Returns JWT + user |
| GET | `/me` | — | Requires auth |

### Volunteers — `/api/volunteers`

| Method | Path | Body | Notes |
|--------|------|------|--------|
| POST | `/register` | multipart: `faceImage` (file), `aadhaarMock`, optional `addressLine1`, `city`, `state`, `pincode` | **Volunteer role only**; one profile per user |
| GET | `/me` | — | Volunteer profile + populated user |
| PATCH | `/me/verification` | `{ "status": "pending" \| "verified" \| "rejected" }` | Demo helper to flip verification |

Aadhaar is **mock data only** — never use real identifiers in demos.

### SOS alerts — `/api/alerts`

| Method | Path | Body / query | Notes |
|--------|------|--------------|--------|
| POST | `/` | `latitude`, `longitude`, optional `occurredAt` (ISO), `notes` | Any authenticated user |
| GET | `/mine` | — | Current user’s alerts |
| GET | `/nearby` | `latitude`, `longitude` | **Volunteer only**; open alerts within **3 km** (2dsphere + Haversine fallback) |
| POST | `/:id/accept` | — | **Volunteer only**; accepts an open alert |

### Travel safety — `/api/travel`

| Method | Path | Body | Notes |
|--------|------|------|--------|
| POST | `/trips` | multipart: `vehiclePlate`, optional `driverImage`, `recordedAt`, `destinationNote` | Logs a trip |
| GET | `/trips` | — | Current user’s trips |

### Media — `/api/media`

| Method | Path | Body | Notes |
|--------|------|------|--------|
| POST | `/emergency` | multipart: `file` (audio/video), optional `durationSec`, `label` | Stores URL + metadata |
| GET | `/recordings` | — | Current user’s recordings |

Uploaded files are served under `/uploads/...` (see `uploads/` in project root).

## Project layout

```
src/
  app.js              # Express app + routes + error handler
  server.js           # DB connect + listen
  config/             # DB, constants
  models/             # Mongoose schemas
  controllers/        # Route handlers
  routes/             # Route modules
  middleware/         # JWT auth, uploads, errors
  utils/              # Helpers (async handler, URLs, geo)
  seed/seed.js        # Demo data
```

## Security notes (production)

- Use strong `JWT_SECRET`, HTTPS, and rate limiting.
- Do not collect real Aadhaar numbers; this API models **mock** KYC only.
- Add virus scanning and object storage (S3, etc.) for user uploads before any production use.
