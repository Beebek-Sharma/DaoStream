# Media Hub — Configuration Reference

This document provides a comprehensive reference for all configuration options, environment variables, and provider settings in **Media Hub**.

---

## 1. Environment Variables Reference

All variables can be defined in a root `.env` file or passed as container environment variables.

| Variable | Type | Default | Description |
|---|---|---|---|
| `APP_ENV` | String | `development` | Environment mode (`development`, `staging`, `production`). |
| `DEBUG` | Boolean | `false` | Enables verbose stack traces and debug endpoints. |
| `API_V1_STR` | String | `/api/v1` | URL prefix for REST API endpoints. |
| `PROJECT_NAME` | String | `Personal Unified Media Hub` | Application display name. |
| `JWT_SECRET_KEY` | String | *Auto-generated in dev* | Cryptographic secret for signing JWT access tokens (min 32 bytes). |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Integer | `10080` (7 days) | JWT session token validity window in minutes. |
| `DATABASE_URL` | String | `sqlite+aiosqlite:///./data/media_hub.db` | SQLAlchemy asynchronous database connection URI. |
| `CORS_ORIGINS` | Comma-separated | `http://localhost:5173,http://localhost:80` | Allowed cross-origin resource sharing origins. |
| `MEDIA_STORAGE_PATH` | Path | `./data/media` | Filesystem directory scanned for local movies & series. |
| `BOOKS_STORAGE_PATH` | Path | `./data/books` | Filesystem directory scanned for local books (.epub, .pdf, .txt). |

---

## 2. Database Configuration

### SQLite (Default)
```env
DATABASE_URL=sqlite+aiosqlite:///./data/media_hub.db
```
- Operates in Write-Ahead Logging (WAL) mode for concurrent read operations.
- Stored as a single self-contained file on persistent storage.

### PostgreSQL (Production Profile)
```env
DATABASE_URL=postgresql+asyncpg://mediahub_user:secure_password@localhost:5432/mediahub
```
- Requires `asyncpg` async driver.
- Run `alembic upgrade head` after modifying the connection string.

---

## 3. Provider Configuration

Providers can be enabled, disabled, and configured via the web UI at `/settings` or directly in provider settings payloads.

### The Movie Database (TMDB)
- **ID:** `tmdb`
- **Capabilities:** Metadata (Movies, Series)
- **Config Keys:**
  - `api_key`: Your v3 TMDB API authentication token.
  - `language`: Preferred ISO 639-1 language code (e.g. `en-US`, `ja-JP`).
  - `include_adult`: Boolean flag to toggle adult content filtering (default: `false`).

### OpenLibrary
- **ID:** `openlibrary`
- **Capabilities:** Metadata (Books & Novels)
- **Requires Authentication:** No (Public REST API).

### Local Media Storage
- **ID:** `local-media`
- **Capabilities:** Metadata, Streaming (RFC 7233 Byte-Range), Books
- **Config Keys:**
  - `media_path`: Override path for video file library.
  - `books_path`: Override path for book library.

---

## 4. Security Configuration

### Sensitive Credential Masking
Any provider configuration containing keys such as `api_key`, `secret`, `password`, or `token` is automatically masked by the API serializer as `••••••••` to prevent accidental credential leakage in API logs and frontend client payloads.

### SSRF Protection
The external URL validator enforces:
- Blocking of private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`).
- Blocking of link-local and cloud metadata addresses (`169.254.169.254`).
- Strict HTTP and HTTPS protocol verification.
