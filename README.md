<!-- prettier-ignore -->
# 🚀 SegmentX — Marketing CRM

![Node.js](https://img.shields.io/badge/Node-18%2B-brightgreen) ![Express](https://img.shields.io/badge/Express-%5E4.0-blue) ![Postgres](https://img.shields.io/badge/Postgres-13-blueviolet) ![License](https://img.shields.io/badge/License-MIT-lightgrey)

Lightweight marketing CRM for importing CSVs, segmenting customers, and generating AI-driven campaign drafts.

Repository: https://github.com/Ayush277/SegmentX

---

## ✨ Quick Links

- **Demo video:** (add video URL here)
- **Docs / assets:** `/docs` (recommended place to store sample CSVs, screenshots, demo video)
- **Live demo:** (add deployed URL here)

---

## 📌 Overview

SegmentX is a compact demo application that showcases:

- CSV ingestion (customers & orders) using streaming parsing and batch inserts
- Server-side segmentation and optional AI-driven copy generation (via Gemini/OpenAI-compatible API)
- Simple dashboard and Chart.js analytics for quick visualization

It’s meant for demos, experimentation, and as a starter for building ML-assisted marketing tools.

---

## 🧭 Table of Contents

1. [Architecture](#-architecture-overview)
2. [How CSV processing works](#-how-csv-processing-works)
3. [APIs](#-key-api-endpoints)
4. [Tech stack & rationale](#-tech-stack-and-why)
5. [Quick start (local)](#-local-development)
6. [Deployment recommendations](#-deployment-recommendations)
7. [Troubleshooting](#-troubleshooting--tips)
8. [Contributing & License](#-contributing--license)

---

## 🏗 Architecture (overview)

```mermaid
flowchart LR
	A[Frontend SPA - `index.html`] -->|POST multipart/form-data| B(Backend Express)
	B --> C[Upload Service (multer → tmp)]
	C --> D[Parser & DB insert (`csv-parser` → Sequelize`)]
	D --> E[Postgres (Cloud SQL / Render DB / Local)]
	B -->|POST| F[LLM Provider (Gemini/OpenAI)]
	B -->|queries| E
	B --> G[Analytics API → Chart.js (frontend)]
```

Key points:
- Backend exposes REST endpoints under `/api` and a root-level `/generate-ai-draft` for AI flows.
- Uploaded files are temporarily stored and parsed, then removed — safe for ephemeral container environments.

---

## 📥 How CSV processing works

1. User uploads a CSV from the frontend (`/api/upload/upload-customers` or `/api/upload/upload-orders`).
2. `multer` writes the file to the system temp directory.
3. `src/services/upload.service.js` streams the file with `csv-parser` and validates headers.
4. Rows are normalized, deduped, and bulk-inserted into Postgres via Sequelize (batched for performance).
5. Temporary file is deleted after processing.

Header expectations:
- Customers: `name`, `email`, `city` (case-insensitive)
- Orders: `customer_id`, `amount` (case-insensitive)

---

## 🔌 Key API Endpoints

- `GET /api/customers` — list all customers
- `GET /api/orders` — `{ count, recent }` — orders count and recent rows
- `POST /api/upload/upload-customers` — multipart `file` field
- `POST /api/upload/upload-orders` — multipart `file` field
- `POST /generate-ai-draft` — body `{ prompt }` → returns `{ audience_size, segment_rules, messages, sample_customers }`
- `GET /api/analytics/campaign-analytics/:campaignId` — analytics counts & rates

Use these for integration tests or to hook up a custom frontend.

---

## 🧰 Tech stack & why

- **Node + Express** — fast to iterate, minimal runtime, well-supported on PaaS.
- **Sequelize + Postgres** — relational data model for customers/orders; supports aggregation and bulk inserts.
- **Multer + csv-parser** — streaming ingestion without loading entire file into memory.
- **Chart.js** — lightweight charting for quick dashboard visuals.
- **LLM Provider (Gemini / OpenAI-compatible)** — demonstrates AI-driven segmentation and message generation.

Design rationale:
- Postgres is reliable for joins/aggregations required for segmentation and analytics.
- Using temp files + streaming keeps the backend stateless and portable to containers.

---

## ⚙️ Local development

Prereqs: Node 18+, Postgres, git, npm

Clone & install:

```bash
git clone https://github.com/Ayush277/SegmentX.git
cd SegmentX
npm install
```

Create `.env` from `.env.example` and set at least:

```
PORT=3002
DB_URI=postgres://user:pass@localhost:5432/segmentx_db
OPENAI_API_KEY=your_key_here
OPENAI_API_URL=https://generativelanguage.googleapis.com/v1beta/openai
OPENAI_MODEL=gemini-2.5-flash
DB_SSL=false
```

Run locally (dev):

```bash
npm run dev
```

Frontend: open `index.html` in a static server (or host it on Vercel). Make sure `API_BASE` in `index.html` matches your backend URL (e.g., `http://localhost:3002/api`).

Test uploads:

```bash
curl -v -F "file=@/path/to/customers.csv" http://localhost:3002/api/upload/upload-customers
curl -v -F "file=@/path/to/orders.csv" http://localhost:3002/api/upload/upload-orders
```

---

## ☁️ Deployment recommendations

Quick options:

- **Render** — easiest full-stack deploy (Node service + managed Postgres + static site)
- **Railway** — fast prototyping (service + DB)
- **Google Cloud Run + Cloud SQL** — recommended when using Gemini (lower latency, integrated billing)

I can add a `Dockerfile`, `render.yaml`, or `cloudbuild.yaml` if you pick a target.

---

## 🛠 Troubleshooting & tips

- If uploads fail, check backend logs and DB connectivity. Look for `uploadCustomers` / `uploadOrders` errors.
- LLM limits: provider may return 429 rate-limit. Check billing/quotas or use the suggested prompts for demo.
- For managed Postgres (Supabase/Cloud SQL), set `DB_SSL=true`.

---

## 📁 Suggested `/docs` contents

- `customers-sample.csv` — sample customers file
- `orders-sample.csv` — sample orders file
- `demo.mp4` — short walkthrough video (or link to YouTube)
- `architecture.png` — static diagram for README fallback

---

## 🤝 Contributing

1. Fork → create branch → open PR
2. Keep PRs focused and add a short description of changes

---

## 📜 License

MIT

---

## 👤 Owner

Ayush — https://github.com/Ayush277

---

If you'd like, I can now:

- (A) Add `/docs` and copy the sample CSVs you uploaded into it.
- (B) Create a `Dockerfile` + `render.yaml` for one-click Render deploy.
- (C) Add GitHub Actions workflow to deploy to Render or GCP.

Which option should I do next?

# SegmentX - Marketing CRM (backend)

Initial Express + Sequelize (Postgres) boilerplate for a Marketing CRM backend.

Getting started

1. Install dependencies

```bash
npm install
```

2. Create `.env` from `.env.example` and set DB values

3. Start in development

```bash
npm run dev
```

Files created

- `src/index.js` - main server entry
- `src/config/database.js` - Sequelize database connection
- `src/models/` - Sequelize models (sample `user.model.js`)
- `src/routes/` - route definitions
- `src/controllers/` - controllers
- `src/services/` - business logic/services
