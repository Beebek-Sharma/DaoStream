# Production Deployment & Operations Guide

This guide details the production deployment, storage layout, database management, reverse proxy configuration, and maintenance procedures for the **Personal Unified Media Hub**.

---

## 1. Quickstart (Docker Compose)

The fastest and most reliable way to run Media Hub in production is using the production Docker Compose setup.

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.20+
- 1GB RAM minimum (2GB recommended for multiple streams)

### Launching the Stack

1. **Clone and Navigate:**
   ```bash
   git clone https://github.com/your-username/media-hub.git
   cd media-hub
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to define a strong `JWT_SECRET_KEY` (minimum 32 random bytes).*

3. **Start the Production Services:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verify Health:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   curl -f http://localhost/api/v1/health
   ```
   Access the web interface at `http://localhost`.

---

## 2. Architecture & Container Topology

```text
                     ┌───────────────────────────────┐
                     │ Client Browser (Desktop/TV)   │
                     └───────────────┬───────────────┘
                                     │ HTTP / HTTPS (:80, :443)
                     ┌───────────────▼───────────────┐
                     │     Nginx Edge Proxy & Web    │
                     │  - Static Asset Caching       │
                     │  - Unbuffered Stream Proxy    │
                     └───────────────┬───────────────┘
                                     │ Internal Network
                     ┌───────────────▼───────────────┐
                     │    FastAPI Application Core   │
                     │  - Provider Resolvers         │
                     │  - RFC 7233 Byte Streaming    │
                     │  - JWT Auth & User Library    │
                     └───────┬───────────────┬───────┘
                             │               │
             ┌───────────────▼─┐           ┌─▼───────────────┐
             │ SQLite / Postgres│           │ Local Storage   │
             │ Persistent DB   │           │ Media & Books   │
             └─────────────────┘           └─────────────────┘
```

---

## 3. Database Options

### Default: Zero-Config SQLite
By default, Media Hub uses SQLite with WAL (Write-Ahead Logging) and asynchronous I/O (`aiosqlite`). It requires no additional database container and performs exceptionally well for single-user and household media hubs.
- **Location:** `./data/db/media_hub.db`
- **Driver:** `sqlite+aiosqlite:///./data/db/media_hub.db`

### Optional: High-Concurrency PostgreSQL
For multi-user deployments or enterprise NAS setups:
1. Start with the `postgres` Docker Compose profile:
   ```bash
   docker compose -f docker-compose.prod.yml --profile postgres up -d
   ```
2. Set `DATABASE_URL` in your `.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://mediahub_user:secure_postgres_password_replace_in_prod@postgres:5432/mediahub
   ```
3. Run Alembic migrations:
   ```bash
   docker compose -f docker-compose.prod.yml exec api alembic upgrade head
   ```

---

## 4. Persistent Storage & Folder Structure

Ensure the host directory structure is initialized:
```text
./data/
├── db/          # SQLite database storage (or volume mounted)
├── media/       # Local movies and series files (.mp4, .mkv, .webm)
├── books/       # Local books (.epub, .pdf, .txt, .cbz)
├── backups/     # Automated database snapshots
├── logs/        # Production application logs
└── ssl/         # SSL/TLS certificates and private keys
```

### File Scanning
Place local media in `./data/media/` following standard conventions:
- Movies: `Interstellar (2014) [1080p].mp4`
- Series: `Stranger Things - S01E01 - Chapter One.mkv`
- Books: `Dune - Frank Herbert.epub` in `./data/books/`

Trigger scanner via API or Settings UI:
```bash
curl -X POST http://localhost/api/v1/local/scan \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 5. Nginx Reverse Proxy & HTTPS / SSL Setup

The bundled Nginx edge proxy in `infrastructure/docker/nginx.conf` is optimized for:
- **Unbuffered Video Streaming:** `proxy_buffering off` ensures byte-range seeks on 4K/1080p videos stream immediately with zero RAM buffering latency.
- **Static Asset Caching:** JavaScript and CSS bundles are served with `Cache-Control: public, max-age=31536000, immutable`.
- **Security Headers:** Strict `nosniff`, `SAMEORIGIN`, and XSS protection headers.

### Enabling SSL with Let's Encrypt / Certbot

If running on a public VPS with a domain name (e.g. `media.example.com`):

1. Generate certificates using Certbot:
   ```bash
   certbot certonly --standalone -d media.example.com
   ```
2. Copy or mount certificates into `./data/ssl/`:
   ```bash
   cp /etc/letsencrypt/live/media.example.com/fullchain.pem ./data/ssl/media.crt
   cp /etc/letsencrypt/live/media.example.com/privkey.pem ./data/ssl/media.key
   ```
3. Add SSL server block in `infrastructure/docker/nginx.conf`:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name media.example.com;

       ssl_certificate /etc/nginx/ssl/media.crt;
       ssl_certificate_key /etc/nginx/ssl/media.key;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;

       # ... (proxy locations matching port 80)
   }
   ```

---

## 6. Backup and Disaster Recovery

### Automated Database Backup
Media Hub includes an online atomic backup script (`scripts/backup_database.py`):
```bash
python scripts/backup_database.py
```
- Performs a crash-consistent SQLite online backup without locking reads or writes.
- Verifies snapshot integrity using `PRAGMA integrity_check`.
- Automatically retains the last 7 daily snapshots.

### Setting up Daily Cron Backup
Add to system crontab (`crontab -e`):
```cron
0 3 * * * cd /opt/media-hub && python scripts/backup_database.py >> /var/log/media_hub_backup.log 2>&1
```

### Disaster Restoration
To restore from a backup snapshot:
1. Stop the application:
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```
2. Replace the database file:
   ```bash
   cp data/backups/media_hub_backup_YYYYMMDD_HHMMSS.db data/db/media_hub.db
   ```
3. Restart containers:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

---

## 7. Upgrade and Migration Strategy

When upgrading to a new version of Media Hub:

1. **Perform Backup First:**
   ```bash
   python scripts/backup_database.py
   ```

2. **Pull Latest Code:**
   ```bash
   git pull origin master
   ```

3. **Rebuild & Restart Containers:**
   ```bash
   docker compose -f docker-compose.prod.yml build
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Apply Migrations (if any schema updates):**
   ```bash
   docker compose -f docker-compose.prod.yml exec api alembic upgrade head
   ```

5. **Verify System Diagnostics:**
   Navigate to `/settings` in the web interface and verify Provider Health, Database, and Storage metrics under the **System Diagnostics** tab.
