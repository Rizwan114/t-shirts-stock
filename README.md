# T-Shirts Stock

Barcode sticker generator + stock/inventory management app for a T-shirt business. Built with Next.js (App Router), React, Turso (libSQL), and jsbarcode.

## Features

- Barcode generator with live preview and 1x2 / 1x1 / 2x1 / 2x2 / 2x3 inch sticker presets
- One-tap print — the sticker prints at exact inch size
- Product registration and stock tracking (IN / OUT scanning)
- Stock history, POS-style scan page, and role-based auth (admin / stock_manager / sales)

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Turso (libSQL) database — cloud, data persists across deploys
- sql.js fallback for local development without Turso
- jsbarcode for barcode rendering
- Tailwind CSS + Framer Motion

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```
TURSO_DATABASE_URL=libsql://your-db-here.turso.io
TURSO_AUTH_TOKEN=your-turso-token-here
JWT_SECRET=your-random-secret-here
```

- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` — connect to your Turso database (create one free at turso.tech).
- `JWT_SECRET` — any long random string used to sign login tokens.

> If `TURSO_DATABASE_URL` is missing, the app falls back to a local SQLite file
> (`tshirts-stock.db`). That file is gitignored and should NOT be relied on for
> production — always use Turso on Vercel.

### Default Users

Created automatically on first run:

| Username | Password  | Role          |
| -------- | --------- | ------------- |
| admin    | admin123  | admin         |
| stock    | stock123  | stock_manager |
| sales    | sales123  | sales         |

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, click **Add New → Project** and import the repo.
3. Before (or after) deploying, add these **Environment Variables** under
   Project → Settings → Environment Variables:

   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `JWT_SECRET`

   Use exactly the same values as your local `.env`. **This is critical** — your
   stock data lives in Turso, and these variables are what point Vercel at it.

4. Deploy. The app auto-creates tables on first run without touching existing data.

> ⚠️ Do not skip the env vars. Without them the app falls back to the local
> SQLite file, which is ephemeral on Vercel and your data would be lost on every
> redeploy.

## Printing Barcode Stickers

- Set the printer paper size to match the sticker size (e.g., 1 x 2 inch).
- The barcode, font size, and spacing auto-scale to the selected sticker size.
