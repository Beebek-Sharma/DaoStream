# Media Hub — Architecture & System Design

This document details the architectural principles, domain abstractions, data flow pipelines, and security mechanisms underpinning the **Personal Unified Media Hub**.

---

## 1. Architectural Philosophy

Media Hub is architected around the following foundational principles:

1. **Provider-Agnostic Core:** The domain model and user interfaces do not have knowledge of any single third-party provider or storage layout. All interactions are abstracted via unified interfaces.
2. **Graceful Fallback & Resilience:** External network failures, downstream rate limits, or degraded provider health never crash user operations; requests fallback gracefully to healthy alternative providers or local caches.
3. **High-Throughput Streaming:** Media files are served via native HTTP Byte Range streaming (`RFC 7233`) with unbuffered edge proxies to enable instant seeking on high-bitrate 4K/1080p video files.
4. **Security by Default:** Defense-in-depth security mitigations (SSRF prevention, canonical filesystem sandboxing, and zero-knowledge credential masking) are baked into core services.

---

## 2. Core Domain Model

Media Hub utilizes an extensible Single-Table Inheritance (STI) relational hierarchy with type-specific child tables and JSON metadata payloads:

```text
                           ┌───────────────────────────┐
                           │           Media           │
                           ├───────────────────────────┤
                           │ id: UUID (PK)             │
                           │ title: String             │
                           │ type: MediaType (Enum)    │
                           │ year: Integer (Nullable)  │
                           │ rating: Float             │
                           │ poster_url / backdrop_url │
                           │ metadata_payload: JSON    │
                           └─────────────┬─────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
┌───────▼──────────────┐       ┌─────────▼────────────┐       ┌───────────▼──────────┐
│        Movie         │       │        Series        │       │         Book         │
├──────────────────────┤       ├──────────────────────┤       ├──────────────────────┤
│ id: UUID (FK)        │       │ id: UUID (FK)        │       │ id: UUID (FK)        │
│ resolution: String   │       │ total_seasons: Int   │       │ author: String       │
│ video_codec: String  │       │ status: String       │       │ page_count: Int      │
└──────────────────────┘       └──────────┬───────────┘       │ isbn: String         │
                                          │                   │ format: String       │
                               ┌──────────▼───────────┐       └──────────────────────┘
                               │        Season        │
                               ├──────────────────────┤
                               │ id: UUID (PK)        │
                               │ series_id: UUID (FK) │
                               │ season_number: Int   │
                               └──────────┬───────────┘
                                          │
                               ┌──────────▼───────────┐
                               │       Episode        │
                               ├──────────────────────┤
                               │ id: UUID (PK)        │
                               │ season_id: UUID (FK) │
                               │ episode_number: Int  │
                               │ duration: Int        │
                               └──────────────────────┘
```

### User State & Personal Library Entities
- **User:** Manages authentication, hashed passwords (`bcrypt`), and personal UI preferences.
- **UserLibraryItem:** Stores watchlist and favorites with status (`to_watch`, `watching`, `completed`, `dropped`) and rating.
- **WatchProgress:** Tracks playback position (`position_seconds`), total duration, and completion status.
- **ReadingProgress:** Tracks reading progress (`current_chapter_index`, `chapter_progress_percent`, `total_chapters`).
- **CustomCollection & CollectionItem:** Enables user-curated themed playlists and collections.

---

## 3. Provider Adapter Framework

The provider framework exposes standardized interfaces implemented by external API clients and storage engines:

```text
                  ┌─────────────────────────────────┐
                  │          BaseProvider           │
                  │  (lifecycle, config, info)      │
                  └────────────────┬────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
┌────────▼──────────────┐ ┌────────▼──────────────┐ ┌────────▼──────────────┐
│MetadataProviderInterface│ │StreamingProviderInterface│ │ BookProviderInterface  │
├───────────────────────┤ ├───────────────────────┤ ├───────────────────────┤
│ + search()            │ │ + get_playback_sources()│ │ + get_book_content()   │
│ + get_details()       │ └───────────────────────┘ │ + get_chapter_text()  │
└───────────────────────┘                           └───────────────────────┘
```

### Active Production Adapters:
1. **MockMediaHubProvider:** Reference mock provider with rich catalog across Movies, Series, Anime, Dramas, and Books.
2. **TMDBProvider:** The Movie Database adapter for commercial movies and TV shows metadata.
3. **OpenLibraryProvider:** OpenLibrary book discovery, editions, authors, and cover art.
4. **LocalMediaProvider:** Local disk scanner and direct streaming provider for personal library files.

---

## 4. Metadata Federation & Source Resolution

When a client searches or requests playback:

```text
Client Request
      │
      ▼
SourceResolverService
      │
      ├─► Check In-Memory TTLCache (5-min expiry) ──► Hit: Return immediately
      │
      └─► Miss: Query ProviderRegistry for active Streaming Providers
            │
            ├─► MockMediaHubProvider.get_playback_sources()
            └─► LocalMediaProvider.get_playback_sources()
                  │
                  ▼
            Collect all candidate sources
                  │
                  ▼
            Rank sources by QualityScore (4K: 40, 1080p: 30, 720p: 20)
            Apply user preferred quality bonus (+50 points)
            Apply direct stream bonus (+5 points)
                  │
                  ▼
            Assemble primary source + fallback sources + subtitle tracks
                  │
                  ▼
            Store in TTLCache and deliver to client
```

---

## 5. High-Throughput Byte-Range Video Streaming

Local video streaming (`/api/v1/local/stream/{id}`) implements `RFC 7233` HTTP Byte Range semantics:

1. **Client Request:** Sends `Range: bytes=1048576-2097151` header.
2. **FastAPI Generator:** Seeks file descriptor directly to offset `1048576` and streams 1MB chunks without reading the whole file into memory.
3. **Response Headers:**
   - Status: `206 Partial Content`
   - `Content-Range: bytes 1048576-2097151/524288000`
   - `Accept-Ranges: bytes`
4. **Nginx Edge Proxy:** Configured with `proxy_buffering off` and `proxy_request_buffering off`, ensuring instantaneous seek response times with zero intermediate buffering memory overhead.

---

## 6. Security Architecture

```text
Incoming Request
      │
      ▼
SecurityHeadersMiddleware
  ├── X-Content-Type-Options: nosniff
  ├── X-Frame-Options: SAMEORIGIN
  ├── X-XSS-Protection: 1; mode=block
  ├── Referrer-Policy: strict-origin-when-cross-origin
  └── Permissions-Policy: camera=(), microphone=()
      │
      ▼
External Request Validation (SSRF Guard)
  ├── is_safe_external_url()
  │     ├── Reject non-HTTP(S) protocols
  │     ├── Resolve DNS hostname to IP
  │     ├── Block private subnets (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  │     └── Block cloud metadata (169.254.169.254)
      │
      ▼
Filesystem Access (Path Traversal Guard)
  └── is_safe_filesystem_path()
        ├── Canonicalize target path (resolve symlinks)
        └── Verify target path is strictly contained within allowed root directories
```
