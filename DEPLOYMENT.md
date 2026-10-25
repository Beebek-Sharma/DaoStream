# DaoStream — Production Deployment & Operations Guide

This guide details the production deployment, storage layout, database management, reverse proxy configuration, and operational verification for **DaoStream** (Unified Media Streaming Hub).

---

## 1. Public Access Model & Security Philosophy

DaoStream is engineered for frictionless public access:
- **No Mandatory Authentication**: Visitors can immediately search, browse, discover, read books, listen to audio, and stream movies, series, and anime without registering or logging in.
- **Protected Administrative Endpoints**: Sensitive endpoints (triggering filesystem scans at `/api/v1/local/scan`, modifying provider configuration at `/api/v1/providers/{id}/configure`, and toggling providers) strictly require Admin credentials (`Bearer <JWT_TOKEN>`).
- **Default Accounts (Auto-seeded on initial start)**:
  - **Admin**: `admin@mediahub.com` / `AdminPass123!` (Role: `admin`)
  - **Demo**: `demo@mediahub.com` / `DemoPass123!` (Role: `user`)
  *Note: Change the default admin password immediately in production via `/settings` or direct database update.*
- **Zero Secrets in Client Bundles**: API keys (TMDB, etc.) and server secrets are strictly contained within backend environment variables and are never baked into client bundles or source maps.

---

## 2. Architecture & Container Topology

```text
                     ┌──────────────────────────────────┐
                     │   Client Browser (Web / Mobile)  │
                     └────────────────┬─────────────────┘
                                      │ HTTP / HTTPS (:80, :443)
                     ┌────────────────▼─────────────────┐
                     │      Nginx Edge Reverse Proxy    │
                     │  - SPA Routing & HTML Fallback   │
                     │  - Static Asset Immutable Caching│
                     │  - Unbuffered Media Stream Proxy │
                     └────────────────┬─────────────────┘
                                      │ Internal Docker Network
                     ┌────────────────▼─────────────────┐
                     │     FastAPI Application Core     │
                     │  - Media & Provider Aggregators  │
                     │  - RFC 7233 Byte-Range Streaming │
                     │  - SSRF & Rate Limiting Shields  │
                     └────────┬────────────────┬────────┘
                              │                │
              ┌───────────────▼──┐          ┌──▼────────────────┐
              │ SQLite (WAL) /   │          │ Persistent Storage│
              │ PostgreSQL (Opt) │          │ Media, Books, Logs│
              └──────────────────┘          └───────────────────┘
```

---

## 3. Production Deployment with Docker Compose (Recommended)

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.20+
- 1GB RAM minimum (2GB recommended for concurrent video streams)
- Outbound internet access for external providers (TMDB, AniList, Consumet)

### Quick Start Step-by-Step

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Beebek-Sharma/DaoStream.git
   cd DaoStream
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Generate a cryptographic secret key and update `.env`:
   ```bash
   openssl rand -hex 32
   ```
   Add your TMDB API credentials in `.env`:
   ```env
   SECRET_KEY=paste_your_generated_64_char_hex_key_here
   TMDB_API_KEY=your_tmdb_api_v3_key
   TMDB_ACCESS_TOKEN=your_tmdb_v4_read_access_token
   CORS_ORIGINS=https://yourdomain.com,http://localhost
   ```

3. **Start the Production Services:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verify Health:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   curl -f http://localhost/api/v1/health
   ```
   Open your browser to `http://localhost` (or your server's IP address / domain).

---

## 4. Standalone / Local Development Deployment

If running directly without Docker:

### Backend Setup (FastAPI)
```bash
cd apps/api
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start API server
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup (Vite + React)
```bash
cd apps/web
# Install dependencies
npm ci

# Start development dev server with LAN support
npm run dev -- --host 0.0.0.0

# Build production bundle
npm run build
```

---

## 5. Domain, HTTPS & Reverse Proxy Configuration

The included Nginx configuration (`infrastructure/docker/nginx.conf`) handles reverse proxying, client caching, and low-latency streaming:

- **Unbuffered Video Streams**: `proxy_buffering off` is applied to `/api/v1/local/stream/` to permit instant seek and low memory overhead for byte-range streaming.
- **SPA Fallback**: Unmatched paths fall back to `index.html` with cache-busting headers.
- **Static Assets**: Fingerprinted JS/CSS chunks are cached with `Cache-Control: public, max-age=31536000, immutable`.

### Enabling HTTPS with Let's Encrypt / Certbot

1. Obtain a certificate using Certbot:
   ```bash
   certbot certonly --standalone -d stream.yourdomain.com
   ```

2. Mount or copy certificates into `./data/ssl/`:
   ```bash
   mkdir -p ./data/ssl
   cp /etc/letsencrypt/live/stream.yourdomain.com/fullchain.pem ./data/ssl/daostream.crt
   cp /etc/letsencrypt/live/stream.yourdomain.com/privkey.pem ./data/ssl/daostream.key
   ```

3. Uncomment or add the SSL server block in `infrastructure/docker/nginx.conf` listening on port 443 with HTTP/2 enabled:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name stream.yourdomain.com;

       ssl_certificate /etc/nginx/ssl/daostream.crt;
       ssl_certificate_key /etc/nginx/ssl/daostream.key;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;

       # Include existing location blocks for /api/, /api/v1/local/stream/, and /
   }
   ```

---

## 6. Observability, Health Checks & Logging

### Health Endpoints
- **Application Health**: `GET /api/v1/health`
  Returns status, app name, version, and server timestamp.
- **Provider Health**: `GET /api/v1/providers/health`
  Returns real-time connectivity status across all active upstream providers (TMDB, AniList, Consumet, Local Storage, OpenLibrary).

### Production Logs
- **Docker Output**:
  ```bash
  docker compose -f docker-compose.prod.yml logs -f api
  docker compose -f docker-compose.prod.yml logs -f web
  ```
- **Persistent Log Files**:
  When mounted, rotating log files are automatically written to `./data/logs/daostream.log` (10MB max per file with 5 backups retained). Stack traces are logged server-side while client error responses receive clean, sanitized JSON error payloads.

---

## 7. Feature Status & External Provider Strategy

| Category | Primary Provider | Playback / Source Mechanism | Public Status |
| :--- | :--- | :--- | :--- |
| **Movies** | TMDB API | Cloud streaming mirrors (vidsrc, 2embed, embed.su) | Operational |
| **TV Series** | TMDB API | Cloud streaming mirrors with episode selection | Operational |
| **Anime** | AniList GraphQL + Consumet | Direct HLS `.m3u8` via hls.js + multi-server fallback | Operational |
| **Music / Audio** | Local Storage & Royalty-free Audio | Direct audio stream with interactive mini-player | Operational |
| **Books / Literature**| OpenLibrary + Curated EPUB/TXT | Built-in web book reader with Obsidian theme | Operational |
| **Web Novels** | Curated Local Chapters | Built-in chapter reader + **Coming Soon** live crawlers | Preserved (See Note Below) |

### Note on Web Novels & Custom Crawlers
DaoStream includes a clean web novel reader with curated preview chapters (*Martial Peak*, *Lord of Mysteries*). Live novel crawling across third-party web novel aggregators is actively under development. Rather than showing broken interfaces or fabricated data, DaoStream displays a transparent "Coming Soon: Live Novel Crawlers" tile in the literature grid. Custom crawler scrapers can be registered by implementing the `BaseMediaProvider` interface in `apps/api/src/providers/`.

---

## 8. Launch Smoke-Test Checklist

### Pre-Launch Checks
- [ ] Run backend test suite: `pytest apps/api/tests` (Ensure all 76 tests pass).
- [ ] Run frontend production build: `npm run build` in `apps/web` (Ensure zero TypeScript and bundling errors).
- [ ] Confirm no secrets or `.env` files are tracked in git (`git status`).
- [ ] Ensure `SECRET_KEY` in `.env` is set to a secure, randomly generated 32-byte hex string.
- [ ] Verify directory permissions for `./data/db`, `./data/media`, `./data/books`, and `./data/logs`.

### Post-Launch Checks
- [ ] Query `http://<domain>/api/v1/health` and verify `"status": "healthy"`.
- [ ] Open home page in an incognito/unauthenticated browser tab: verify hero carousel, trending movies, and media categories render.
- [ ] Test Movie playback: Select a movie and verify multi-server player loads.
- [ ] Test TV Series playback: Verify season and episode modal selector opens and resolves streaming links.
- [ ] Test Anime playback: Verify episode grid, search, and video stream loads.
- [ ] Test Audio playback: Verify audio player controls, scrub bar, and volume slider.
- [ ] Test Book reader: Verify reading modal renders chapters with Obsidian / light themes.
- [ ] Test Admin settings: Verify `/settings` diagnostics are accessible with Admin credentials.
