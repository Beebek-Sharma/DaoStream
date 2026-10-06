# Local Development & Deployment Guide

This guide describes how to run and test the **Personal Unified Media Hub** on your machine or inside Docker containers.

---

## 1. Prerequisites

- **Python**: 3.10+ (tested on Python 3.14)
- **Node.js**: 18+ (tested on Node v26) with npm
- **Docker & Docker Compose** (Optional for containerized run)

---

## 2. Local Setup (Native Execution)

### Step 1: Environment Variables
Copy [.env.example](file:///d:/projects/Media/.env.example) to `.env`:
```powershell
Copy-Item .env.example .env
```

### Step 2: Backend Setup
```powershell
# Create virtual environment (if not already done)
python -m venv apps/api/.venv

# Install dependencies
apps/api/.venv/Scripts/pip.exe install -r apps/api/requirements.txt

# Run database migrations
apps/api/.venv/Scripts/alembic.exe upgrade head

# Run backend API tests
apps/api/.venv/Scripts/pytest.exe -c apps/api/pytest.ini apps/api/tests -v
```

### Step 3: Frontend Setup
```powershell
# Install frontend packages
cd apps/web
npm install

# Build verification
npm run build
```

---

## 3. Running Services Locally

You can launch both services in separate terminal windows:

### Terminal 1 — Backend API
```powershell
$env:PYTHONPATH = "apps/api"
apps/api/.venv/Scripts/uvicorn.exe src.main:app --reload --port 8000
```
- API root: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- Interactive OpenAPI Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Terminal 2 — Frontend Application
```powershell
cd apps/web
npm run dev
```
- Web Application: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
- The Vite dev server proxies `/api` directly to `http://127.0.0.1:8000`.

---

## 4. Containerized Execution (Docker Compose)

For production deployment or isolated environments:

```bash
docker compose up -d --build
```

- Web UI & Reverse Proxy: [http://localhost/](http://localhost/)
- Direct API: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- Persistent SQLite & Media Volume: `./data`
