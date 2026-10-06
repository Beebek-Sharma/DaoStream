# Media Hub Provider System Guide

## Overview

Media Hub implements a decoupled **Provider Adapter Architecture**. Rather than scraping or binding tightly to any single external service, the core system defines standard abstract interfaces for:
- **Metadata Providers** (Search, details, seasons, episodes, cast, overview)
- **Streaming Providers** (Authorized streaming playback resolution)
- **Book Providers** (Table of contents, chapters, and reading text)

All provider implementations translate external API payloads into unified, normalized schemas.

---

## Active & Available Providers

### 1. Mock Media Hub Provider (`mock_media_provider`)
- **Status:** Built-in & Enabled
- **Capabilities:** Search, Metadata, Movies, Series, Anime, Books, Streaming, Subtitles
- **Purpose:** Reliable local testing, automated integration tests, and sandbox development with sample movies, series, and books.

### 2. Open Library Provider (`openlibrary_provider`)
- **Status:** Built-in & Enabled (Zero configuration required)
- **Service:** [Open Library](https://openlibrary.org) by the Internet Archive
- **Capabilities:** Search, Metadata, Books
- **Authentication:** None (Completely open public API)
- **Supported Formats:** Open Access books, summaries, work IDs (`ol:<work_id>`)

### 3. The Movie Database Provider (`tmdb_provider`)
- **Status:** Configurable via Web Settings or Environment
- **Service:** [TMDB](https://themoviedb.org)
- **Capabilities:** Search, Metadata, Movies, Series, Anime, Dramas, Recommendations
- **Authentication:** TMDB v3 API Key (Free registration at themoviedb.org)
- **Configuration Keys:**
  - `api_key`: TMDB API Key string
  - `language`: Target language code (e.g. `en-US`, `ja-JP`, `ko-KR`)

---

## Configuration & Credentials

Provider configuration is managed in **Settings -> Media Providers** in the Web UI, or via the REST API:
```bash
POST /api/v1/providers/{provider_id}/configure
{
  "config": {
    "api_key": "YOUR_KEY_HERE"
  }
}
```

Credentials are masked and stored safely in application state.

---

## Strict Compliance Policy

In accordance with Media Hub architectural guidelines:
1. Providers only connect to authorized APIs and services.
2. No unauthorized stream scrapers or DRM circumvention algorithms.
3. Network calls use strict timeouts and graceful degradation.
