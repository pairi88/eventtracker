# Running ProseAttendTrack Locally

## 1. Software to install

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | v20 or newer (v24 used in production) | Download from [nodejs.org](https://nodejs.org) |
| **pnpm** | v10+ | Run `npm install -g pnpm` after installing Node |
| **PostgreSQL** | v14 or newer | Any local Postgres install works |

---

## 2. Environment variables

Set these before starting either server. The easiest approach is to export them in your terminal session or add them to a `.env` file loaded by your shell.

| Variable | Used by | Example value |
|---|---|---|
| `DATABASE_URL` | API server & DB tools | `postgresql://youruser:yourpass@localhost:5432/proseattendtrack` |
| `PORT` | API server | `8080` |
| `PORT` | Frontend (separate terminal) | `3000` |
| `BASE_PATH` | Frontend only | `/` |

---

## 3. Install dependencies

From the project root, run once:

```bash
pnpm install
```

---

## 4. One-time database setup

Create a blank PostgreSQL database, then run this once to create all the tables:

```bash
DATABASE_URL=<your-url> pnpm --filter @workspace/db run push
```

The 46 staff records seed themselves automatically when the API server first boots.

---

## 5. Running the app

Open two terminal windows.

**Terminal 1 — API server:**

```bash
PORT=8080 DATABASE_URL=<your-url> pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend:**

```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/attendance-tracker run dev
```

Then open `http://localhost:3000` in your browser.

---

## 6. API routing — one extra step required locally

In the hosted version a reverse proxy routes `/api` requests to the API server and `/` to the frontend. That proxy does not exist locally, so the frontend will not be able to reach the API without one of the following:

**Option A — Add a Vite proxy (recommended)**

Add a `server.proxy` entry to `artifacts/attendance-tracker/vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:8080',
  },
  // ... rest of existing server config
},
```

**Option B — Use a local reverse proxy**

Set up nginx, Caddy, or a similar tool to forward `/api` to port `8080` and everything else to port `3000`.

---

## 7. Camera access

The barcode scanner requires camera access. Browsers only allow this on pages served over **HTTPS** or **localhost**. Running at `http://localhost:3000` works fine. Accessing the app from another device on your network over plain HTTP will not work — you would need a local HTTPS setup (e.g. using [mkcert](https://github.com/FiloSottile/mkcert)) in that case.
