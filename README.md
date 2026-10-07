# DaoStream 🌊

<p align="center">
  <strong>The Next-Generation Unified Media Streaming & Reader Hub</strong><br>
  <em>Stream Movies, TV Series, Anime, and Read Books in a Single High-Performance Architecture</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tests-70%2F70%20Passing-emerald?style=for-the-badge&logo=pytest" alt="Tests" />
  <img src="https://img.shields.io/badge/Python-3.12%2B-blue?style=for-the-badge&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License" />
</p>

---

## 🌟 Overview

**DaoStream** is a self-hosted, personal unified media streaming hub engineered to provide a seamless, modern streaming experience across all entertainment categories: **Movies**, **TV Series**, **Anime**, **Web Novels / Books**, and **Background Music & Audio Stations**.

Powered by a federated **Provider Adapter Architecture**, DaoStream aggregates live metadata and streaming sources from TMDB, Web Novel Archives, and OpenLibrary alongside ultra-fast local disk streaming (`206 Partial Content`) and continuous streaming audio, wrapped in an **Obsidian Cinema** dark design system.

---

## ✨ Key Features

### 🎬 Cinematic Films & TV Series
- **Live TMDB Catalog:** Weekly trending showcases, curated filters (4K, Top Rated 8.0+, Recent Releases).
- **Deep Episode Explorer:** Dynamic season and episode browser with individual episode streaming.
- **Multi-Server Streaming:** Automatic failover between Official HD Trailers (YouTube) and resilient Cloud Streaming Servers (Server 1 through 4 via VidSrc & AutoEmbed).

### 🌸 Seasonal Japanese Anime Universe
- **Dedicated Anime Catalog:** Curated Japanese animation releases, popular seasonal simulcasts, and legendary classics.
- **Full Arc & Episode Guide:** Browse all seasons and story arcs with episodic descriptions and runtimes.
- **Multi-Server Streaming:** High-definition video streams with dual audio (Sub/Dub) support.

### 📚 Web Novels, Xianxia & Published Literature
- **Web Novel Vault:** Legendary titles including *Shadow Slave*, *Lord of the Mysteries*, *Reverend Insanity*, *Solo Leveling*, *The Primal Hunter*, and *Defiance of the Fall*.
- **Native Chapter Reader:** Immersive reading experience with authentic chapter prose, status screens, and lore.
- **Themes & Typography:** Obsidian Dark, Sepia, and OLED Midnight reading modes with font scaling and table of contents.
- **Open Library Catalog:** Millions of published classic works and open-access fiction books.

### 🎵 Continuous Audio & Music Radio
- **High-Bitrate Continuous Streams:** 24/7 channels for Lo-Fi Chillhop, Synthwave & Cyberpunk, Ambient Space Drones, and Cinematic Spy Lounge.
- **Persistent Docked Player:** Background audio persists uninterrupted while navigating between movies, reading novels, or browsing.
- **Audio Visualizer:** Animated sound wave equalizer and live broadcast telemetry.

### ⚡ Global Federated Search (`Ctrl+K`)
- Instant search across Movies, Series, Anime, and Books simultaneously with sub-100ms response times.

### 🛡️ Enterprise-Grade Security
- **Strict Environment Isolation:** No hardcoded secrets; `.env` is fully excluded from version control.
- **Authentication & RBAC:** Secure bcrypt password hashing, stateless JWT session tokens, and protected admin endpoints.
- **SSRF & Path Traversal Guards:** Blocks access to private IP subnets and locks file reads strictly to designated storage folders.
- **XSS & Input Sanitization:** Automated HTML escape filtering on search terms and library mutations.

---

## 🏛️ Architecture & System Topology

```text
                             ┌──────────────────────────────────────┐
                             │       DaoStream Web Frontend         │
                             │   (React 18 + Vite + Tailwind CSS)   │
                             └──────────────────┬───────────────────┘
                                                │ REST / SSE
                             ┌──────────────────▼───────────────────┐
                             │        FastAPI Core Backend          │
                             │  - JWT Auth & RBAC Security Engine   │
                             │  - Multi-Server Playback Resolver    │
                             │  - RFC 7233 Byte-Range Streaming     │
                             │  - LRU/TTL Cache & Input Sanitizer   │
                             └──────────┬───────────────────┬───────┘
                                        │                   │
         ┌──────────────────────────────▼───┐   ┌───────────▼──────────────────┐
         │        Provider Adapters         │   │     Persistence Layer        │
         ├──────────────────────────────────┤   ├──────────────────────────────┤
         │ • TMDB Adapter (Movies & TV)     │   │ • SQLite (WAL mode, async)   │
         │ • OpenLibrary Adapter (Books)    │   │ • PostgreSQL (Optional)      │
         │ • Local Disk Media Scanner       │   │ • Atomic Backups & Snapshots │
         └──────────────────────────────────┘   └──────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 18+ & **npm**
- **Python** 3.12+
- *(Optional)* **Docker** & **Docker Compose**

### 1. Clone & Configure

```bash
git clone https://github.com/Beebek-Sharma/DaoStream.git
cd DaoStream

# Create your local environment file
cp .env.example .env
```

Open `.env` and fill in your credentials:
```ini
SECRET_KEY=generate_with_openssl_rand_hex_32
TMDB_API_KEY=your_free_tmdb_api_key_here
TMDB_ACCESS_TOKEN=your_tmdb_read_access_token_here
```
> 💡 *You can obtain a free TMDB API Key in 2 minutes at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).*

---

### 2. Run with Bare Metal

#### Backend (FastAPI)
```bash
cd apps/api

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Linux/macOS
# .venv\Scripts\activate        # On Windows

# Install dependencies
pip install -r requirements.txt

# Start backend server (port 8000)
uvicorn src.main:app --reload --port 8000
```

#### Frontend (React + Vite)
```bash
cd apps/web

# Install dependencies
npm install

# Start Vite dev server (port 5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

### 3. Run with Docker Compose (Production)

```bash
# Build and start all services (Backend + Web + Nginx)
docker compose -f docker-compose.prod.yml up -d --build
```
Access the application on **`http://localhost`**.

---

## 🧪 Testing & Validation

DaoStream includes a complete automated test suite covering models, providers, security audit, and playback resolution:

```bash
# Run backend test suite (65 tests)
apps/api/.venv/Scripts/pytest.exe apps/api/tests -v
```

```bash
# Test frontend production build
npm run build --prefix apps/web
```

---

## 📂 Project Structure

```text
DaoStream/
├── .env.example               # Safe environment variable template
├── .gitignore                 # Comprehensive git exclusion rules
├── docker-compose.prod.yml    # Production container orchestration
├── docker-compose.yml         # Development container setup
├── apps/
│   ├── api/                   # FastAPI Backend
│   │   ├── src/
│   │   │   ├── api/v1/        # Endpoints (auth, media, library, playback)
│   │   │   ├── core/          # Security, config, sanitization
│   │   │   ├── db/            # SQLAlchemy async session & migrations
│   │   │   ├── models/        # Database models (User, Media, Library)
│   │   │   ├── providers/     # TMDB, OpenLibrary, and Local disk adapters
│   │   │   └── services/      # Resolver service & metadata caching
│   │   └── tests/             # 65 automated integration & unit tests
│   └── web/                   # React 18 + Vite Frontend
│       ├── src/
│       │   ├── components/    # VideoPlayer, BookReader, Modals, Navbar
│       │   ├── context/       # AuthContext & Session management
│       │   ├── pages/         # Movies, Series, Anime, Books, Library
│       │   └── services/      # Frontend API client
├── docs/                      # Architectural & Deployment manuals
└── scripts/                   # Database maintenance & test runners
```

---

## 🔒 Security & Privacy

- **Safe By Default:** `.env`, databases (`.db`), media caches, and private tokens are strictly ignored by `.gitignore`.
- **Zero Mock Policy:** All demo items have been completely purged; all catalogs dynamically reflect real TMDB data and your personal indexed files.
- **SSRF Defense:** Outbound provider requests are validated against forbidden private IP ranges (`10.0.0.0/8`, `192.168.0.0/16`, `127.0.0.0/8`, AWS metadata IPs).

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
