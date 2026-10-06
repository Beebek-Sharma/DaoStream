# Media Hub — Local Installation Guide

This guide provides step-by-step instructions for running the **Personal Unified Media Hub** on your local machine or server.

---

## Prerequisites

- **Python:** 3.10 or newer (tested on 3.12 / 3.14)
- **Node.js:** 18 or newer (tested on 20 LTS / 22)
- **Package Managers:** `pip` and `npm`
- **Git**

---

## Method 1: Local Bare-Metal Installation (Development)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/media-hub.git
cd media-hub
```

### 2. Configure Environment Variables
Copy the template configuration:
```bash
# On Linux / macOS:
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example .env
```
Key variables to review in `.env`:
- `JWT_SECRET_KEY`: Set to a secure random string.
- `DATABASE_URL`: Defaults to `sqlite+aiosqlite:///./data/media_hub.db`.
- `MEDIA_STORAGE_PATH`: Directory containing video files (default: `./data/media`).
- `BOOKS_STORAGE_PATH`: Directory containing book files (default: `./data/books`).

### 3. Backend Setup (FastAPI)

1. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell:
   python -m venv apps/api/.venv
   apps/api/.venv/Scripts/activate

   # Linux / macOS:
   python3 -m venv apps/api/.venv
   source apps/api/.venv/bin/activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r apps/api/requirements.txt
   ```

3. Run database migrations:
   ```bash
   alembic upgrade head
   ```

4. Launch the FastAPI server:
   ```bash
   uvicorn src.main:app --app-dir apps/api --reload --port 8000
   ```
   *The interactive Swagger API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).*

### 4. Frontend Setup (React + Vite)

In a separate terminal:
1. Navigate to the web workspace:
   ```bash
   cd apps/web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:5173](http://localhost:5173) in your browser to access the Media Hub interface.*

---

## Method 2: Docker Compose Installation

For a self-contained containerized setup:

```bash
# Build and run containers in background
docker compose -f docker-compose.prod.yml up -d --build
```

Access the application at [http://localhost](http://localhost).

---

## Verifying Your Installation

1. **Check Backend Health:**
   ```bash
   curl http://localhost:8000/api/v1/health
   # Expected output: {"status":"healthy","version":"1.0.0"}
   ```

2. **Run Automated Test Suite:**
   ```bash
   # Windows:
   .\scripts\run_all_tests.bat

   # Linux / macOS:
   pytest -c apps/api/pytest.ini apps/api/tests
   # Expected output: 60 passed
   ```

3. **Log In to the Web Interface:**
   - Navigate to [http://localhost:5173](http://localhost:5173) (or `http://localhost` if using Docker).
   - Register a new account or log in.
   - Explore Movies, TV Series, Anime, Dramas, and Books.
