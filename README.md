# Personal Unified Media Hub

[![Tests](https://img.shields.io/badge/Tests-60%2F60%20Passing-emerald)](scripts/run_all_tests.bat)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue)](apps/api)
[![React](https://img.shields.io/badge/React-18-cyan)](apps/web)
[![Docker](https://img.shields.io/badge/Docker-Production%20Ready-2496ED)](docker-compose.prod.yml)

A self-hosted, personal unified media platform providing a single cinematic interface for **Movies**, **TV Series**, **Anime**, **Asian Dramas**, and **Books/Novels**.

Built on a **Provider Adapter Architecture** that federates authorized external providers (TMDB, OpenLibrary) with high-speed local disk storage and streaming.

---

## Key Features

- 🎬 **Unified Media Catalog:** Seamlessly browse Movies, TV Series, Anime, and Dramas alongside Books and Novels in one coherent interface.
- 📺 **Custom Video Player:** Fluid playback controls, multi-quality resolution selector (4K/1080p/720p/480p), VTT subtitle track switching, automatic position resume, and background progress synchronization.
- 📖 **Interactive Book & Novel Reader:** Full-featured reader supporting Light, Sepia, and Midnight themes, adjustable typography, line spacing, margins, chapter table-of-contents navigation, and reading percentage tracking.
- ⚡ **Federated Instant Search (`Ctrl+K`):** Global unified modal querying all registered providers in parallel with sub-100ms response times and category filters.
- 📂 **Local Media Scanner & Byte-Range Streaming:** Automatic regex filename parser for movies, series/anime episodes, and books. Direct high-throughput RFC 7233 partial content HTTP Byte-Range streaming (`206 Partial Content`) with zero RAM proxy buffering.
- 📚 **Personal Library & Custom Collections:** Watchlist, favorites, continue watching/reading rails, unified watch & read history, and user-defined custom collections.
- 🛡️ **Hardened Enterprise Security:** Built-in SSRF protection engine blocking private IP ranges and cloud metadata services, strict canonical path traversal isolation, zero-knowledge credential masking, and comprehensive HTTP security headers.
- ⚙️ **Comprehensive Administration:** Web-based provider management, credential storage, user preferences, storage path configuration, and real-time system diagnostics.
- 🐳 **Production-Ready Deployment:** Docker Compose orchestration, unbuffered Nginx reverse proxy, optional PostgreSQL profile, and online atomic database backup script with automated rotation.

---

## Architectural Topology

```text
                     ┌─────────────────────────────────────────┐
                     │     Cinematic Web Frontend (React 18)   │
                     │  - Tailwind CSS + Dark Mode Theme       │
                     │  - Route-Level Code Splitting (Vite)    │
                     │  - Accessible Keyboard Navigation       │
                     └────────────────────┬────────────────────┘
                                          │ REST / SSE
                     ┌────────────────────▼────────────────────┐
                     │     FastAPI Core Engine (Python 3.12)   │
                     │  - RFC 7233 Byte-Range Video Streaming  │
                     │  - Multi-Provider Source Resolver       │
                     │  - Thread-Safe TTL Metadata Caches      │
                     │  - SSRF & Path Traversal Guards         │
                     └───────┬─────────────────────────┬───────┘
                             │                         │
             ┌───────────────▼────────┐       ┌────────▼───────────────┐
             │   Provider Framework   │       │   Persistence & Storage│
             ├────────────────────────┤       ├────────────────────────┤
             │ • TMDB (Movies/Series) │       │ • SQLite (WAL mode)    │
             │ • OpenLibrary (Books)  │       │ • PostgreSQL (Optional)│
             │ • Local Disk Scanner   │       │ • Local Disk Storage   │
             │ • Extensible Adapters  │       │ • Automated Backups    │
             └────────────────────────┘       └────────────────────────┘
```

---

## Quickstart

### 1. Docker Compose (Recommended for Production)

```bash
# Clone the repository
git clone https://github.com/your-username/media-hub.git
cd media-hub

# Copy environment configuration
cp .env.example .env

# Start production containers (API + Web + Nginx)
docker compose -f docker-compose.prod.yml up -d --build
```
Open **`http://localhost`** in your browser.

*To activate PostgreSQL instead of default SQLite:*
```bash
docker compose -f docker-compose.prod.yml --profile postgres up -d
```

---

### 2. Local Bare-Metal Development

#### Backend (FastAPI)
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start API dev server (port 8000)
uvicorn src.main:app --reload --port 8000
```

#### Frontend (React + Vite)
```bash
cd apps/web
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## Running Automated Tests

Media Hub includes a comprehensive 60-test integration test suite covering domain models, provider adapters, failure resilience, source resolution, and end-to-end user journeys:

```bash
# Windows
.\scripts\run_all_tests.bat
# or PowerShell:
.\scripts\run_all_tests.ps1

# Direct Pytest command:
apps/api/.venv/Scripts/pytest.exe -c apps/api/pytest.ini apps/api/tests -v
```

---

## Legal & Compliance Boundary

The application strictly integrates with media sources, APIs, metadata services, storage locations, and streaming providers that the user is authorized to access. It does **NOT** perform web scraping, authentication bypasses, DRM circumvention, or unauthorized stream hotlinking.

---

## Documentation

- 📖 [Deployment & Operations Guide](docs/deployment.md) — Docker Compose, Nginx, SSL/TLS, and backups.
- 🏗️ [Architecture Deep-Dive](docs/architecture.md) — System internals, provider lifecycle, and streaming engine.
- 💻 [Local Installation Guide](docs/installation.md) — Detailed bare-metal setup for Windows, Linux, and macOS.
- 🔌 [Provider Development Guide](docs/providers.md) — Creating new metadata, streaming, and book provider adapters.
- 🗺️ [Master 20-Phase Roadmap](MEDIA_HUB_ROADMAP.md) — Complete engineering blueprint and phase status.
