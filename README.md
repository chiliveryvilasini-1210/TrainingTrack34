# KaushalTrack — SIH26135 Prototype

**Team Kaushalya** · Problem Statement SIH26135 (Government of Maharashtra) · Theme: Smart Education

AI-powered outcome and impact tracking for skilling initiatives — tracks trainee employment
outcomes, surfaces skill gaps, and predicts at-risk trainees **while their program is still
running**, not after.

This is a **working, runnable prototype** built for internal evaluation. It implements every
feature discussed for the idea:

| Feature | Where it lives |
|---|---|
| Outcome Tracker (check-ins) | `client` → Trainee Check-In page, `server` → `/api/checkins` |
| Skill Gap Analytics | `client` → Skill Gap Analytics page, `server` → `/api/analytics/skill-gap` |
| Predictive Risk Engine | `ml-service` (Python/scikit-learn) + `client` → Risk Alerts page |
| Employer Verification | `server` → `/api/verify/*` (simulated confirmation link) |
| Curriculum Feedback Loop | `server` → `/api/feedback/*`, `client` → Curriculum Feedback page |
| Consent screen | `client` → Trainee Check-In page (consent banner + checkbox, required to submit) |
| Inclusive check-ins | Data model supports WhatsApp/SMS-style check-ins (see note below) |

> **Honesty note for your pitch:** the WhatsApp/SMS and employer-SMS/email sending are
> **simulated** in this prototype (the backend endpoints exist and behave exactly as they
> would in production, but they log/return the message instead of actually calling a paid
> SMS/WhatsApp API). Say this plainly if asked — real provider integration (e.g. Twilio,
> MSG91, WhatsApp Business API) is a Sept 22 full-build item. The ML model is real and
> actually trained, not mocked — see below.

---

## Architecture

```
client (React + Vite + Recharts)
   │  REST calls
   ▼
server (Node.js + Express + MongoDB)
   │  REST call to /predict
   ▼
ml-service (Python + Flask + scikit-learn)
```

- **client** — trainee check-in form (with consent), admin dashboards, risk alerts, curriculum
  feedback view.
- **server** — REST API, MongoDB models (Trainee, CheckIn, Program), analytics aggregation,
  curriculum recommendation logic, calls out to `ml-service` for risk scores.
- **ml-service** — a small Flask microservice with a real, trained Gradient Boosting model.
  It **trains itself automatically on first run** using a synthetic dataset (see
  `ml-service/train_model.py`) with realistic built-in correlations (low attendance + low
  assessment score + poor program-industry match → higher risk). Swap in real historical
  cohort data later, keeping the same 3 input features.

---

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+ and pip
- MongoDB — either:
  - **Local**: install MongoDB Community Server and run `mongod`, or
  - **Atlas** (recommended, same as your V-Learn setup): create a free cluster at
    [mongodb.com/atlas](https://www.mongodb.com/atlas) and copy the connection string

---

## Setup & Run (local)

Open **3 terminal windows** — one for each service.

### 1. ML service (Predictive Risk Engine)

```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

Runs on `http://localhost:8000`. First run automatically trains and saves `model.pkl`
(takes a few seconds). You should see validation accuracy/ROC-AUC printed — that's your real
model training output, worth showing a judge if asked "is this actually trained?"

### 2. Backend server

```bash
cd server
cp .env.example .env
# edit .env if you're using MongoDB Atlas — paste your connection string into MONGO_URI
npm install
npm run seed      # populates 120 synthetic trainees + check-ins so the dashboard isn't empty
npm start
```

Runs on `http://localhost:5000`.

### 3. Frontend

```bash
cd client
cp .env.example .env   # defaults to http://localhost:5000, fine for local dev
npm install
npm run dev
```

Runs on `http://localhost:5173` — open this in your browser.

### 4. Score the seeded trainees (one-time, after all 3 are running)

The seed script tries to auto-score trainees if `ml-service` was already running when you
seeded. If it wasn't, just open the app → **Risk Alerts** page → click
**"Re-score All Trainees via ML Service"** once. After that, the Risk Alerts page will show
real flagged trainees with explainable reasons.

---

## Demo script (suggested order for internal evaluation)

1. **Trainee Check-In** — show the consent banner, fill the form, submit. Point out this
   simultaneously (a) records the outcome, (b) scores risk via the real ML model, and (c)
   triggers employer verification if an employer contact was given.
2. **Outcome Dashboard** — show the headline stats and the employment-rate charts (this is
   the Outcome Tracker + basic analytics working end-to-end on real seeded data).
3. **Skill Gap Analytics** — show which programs have the biggest gap vs. industry demand.
4. **Risk Alerts** — the centerpiece. Show a flagged trainee and read out the **reasons** —
   this is what makes it different from a plain dashboard: it explains *why*, not just *that*.
5. **Curriculum Feedback** — click "Generate Recommendations" and show a program getting a
   concrete, auto-generated suggestion, not just a bad number.

---

## Deployment (matches your V-Learn deployment pattern)

- **Frontend (`client`)** → [Vercel](https://vercel.com). Set the environment variable
  `VITE_API_URL` to your deployed backend URL.
- **Backend (`server`)** → [Render](https://render.com). Set environment variables from
  `.env.example` (`MONGO_URI`, `ML_SERVICE_URL`, `CLIENT_ORIGIN`). Build command
  `npm install`, start command `npm start`.
- **ML service (`ml-service`)** → also [Render](https://render.com) (as a separate Web
  Service, Python environment). Build command `pip install -r requirements.txt`, start
  command `gunicorn app:app`.
- **Database** → [MongoDB Atlas](https://www.mongodb.com/atlas) free tier.

Deploy `ml-service` and `server` first, note their live URLs, then set `ML_SERVICE_URL` on
the server and `VITE_API_URL` on the client to point at them before deploying the client.

---

## What's real vs. simulated (be upfront about this if asked)

| Piece | Status |
|---|---|
| ML risk model | **Real** — actually trained (Gradient Boosting, scikit-learn) on a synthetic dataset with realistic correlations. Validation accuracy/ROC-AUC printed on training. |
| Check-in data, analytics, dashboards | **Real** — full working CRUD + aggregation on data you seed or enter yourself |
| Curriculum recommendations | **Real logic** — rule-based, transparent, and actually computed from the aggregated data |
| WhatsApp/SMS delivery | **Simulated** — endpoints exist and behave correctly, but don't call a real paid provider yet |
| Employer verification link | **Simulated** — the confirmation flow works end-to-end in the app, but the "SMS/email send" step is logged, not actually sent |
| Training/trainee data | **Synthetic** — generated with realistic patterns via `server/seed.js`, not real government data |

This is the correct, honest scope for an internal-evaluation prototype — say so plainly if a
judge asks. The full build (real SMS/WhatsApp provider, real historical data once available)
is planned for the Sept 22 SIH portal submission.
