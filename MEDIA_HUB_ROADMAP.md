# Personal Unified Media Hub — Engineering Blueprint

> **Purpose:** This document is the master implementation plan for a self-hosted personal media platform that provides one unified interface for movies, TV series, anime, dramas, documentaries, and books/novels.
>
> **Important boundary:** The application must only integrate with media sources, APIs, metadata services, storage locations, and streaming providers that the user is authorized to access. Do not implement scraping, authentication bypasses, DRM circumvention, hotlinking of unauthorized streams, or extraction of copyrighted streams from third-party sites without permission.

---

## 0. How Gemini Must Use This Document

This is an **execution roadmap**, not a request to generate the entire application in one response.

### Execution rules

1. Work strictly in **phase order**.
2. Each phase contains multiple smaller steps.
3. Complete **one step at a time**.
4. Before starting a step:
   - inspect the current repository;
   - inspect the existing implementation;
   - identify dependencies and constraints;
   - explain what will be changed.
5. Implement the step.
6. Run appropriate tests, type checks, linting, and/or build checks.
7. Fix failures before continuing.
8. Update this document's progress section.
9. Stop at the end of the step and wait for the next instruction unless the user explicitly asks you to continue.
10. Never silently skip unfinished steps.
11. Never rewrite working code unnecessarily.
12. Prefer small, reversible changes over giant code dumps.
13. If an architectural decision becomes necessary, explain the trade-offs before committing to it.
14. If an external API/provider is unavailable or undocumented, create an adapter interface and mock implementation rather than inventing an API.
15. Keep the system provider-agnostic. The frontend must not be tightly coupled to any single media provider.

### Implementation philosophy

- Production-oriented architecture
- Modular and extensible
- Self-hostable
- API-first backend
- Responsive web application
- Clean separation of concerns
- Strong typing where practical
- Automated testing
- Good error handling
- Secure configuration management
- Observable provider failures
- Graceful degradation when providers are unavailable

---

# 1. Product Vision

Build a personal media hub with the feel of a modern streaming/reading platform.

The application should eventually allow the user to:

- Search for movies
- Search for TV series
- Search for anime
- Search for dramas
- Browse seasons and episodes
- Watch authorized streams
- Play local media
- Resume playback
- Track watch history
- Maintain a watchlist
- Track favorites
- Browse recommendations
- Search across multiple providers
- Choose between available authorized providers
- View subtitles when available
- Select audio tracks when available
- Remember playback position
- Read books/novels
- Resume reading
- Track reading progress
- Organize media
- Manage provider connections
- Configure API keys
- Add/remove providers
- Self-host the application
- Access the system from desktop and mobile browsers

The UI should feel like **one coherent application**, even though data may come from many providers.

---

# 2. Core Architectural Principle

Use a **Provider Adapter Architecture**.

The application must NOT assume that one provider supplies everything.

Conceptually:

```text
                    ┌─────────────────────┐
                    │     Web Frontend    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Backend API      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       Metadata Service   Media Resolver    User Library
              │                │                │
              ▼                ▼                ▼
       Provider Adapters  Stream Adapters   Local Storage
              │
      ┌───────┼────────┐
      ▼       ▼        ▼
   Provider A B      Provider C
```

The frontend should consume a **normalized internal data model**.

It should not know provider-specific response formats.

---

# 3. Recommended Initial Technology Stack

Use pragmatic technologies unless a strong reason exists to change them.

## Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- Component system with accessible primitives
- HTML5 video where appropriate
- EPUB/PDF/book reader technology where appropriate

## Backend

Preferred:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

Alternative technologies may be proposed if there is a strong architectural reason.

## Database

Development:

- SQLite

Production/self-hosted:

- PostgreSQL

The application should avoid database-specific assumptions that make migration difficult.

## Infrastructure

- Docker
- Docker Compose
- `.env` configuration
- Optional reverse proxy
- Optional HTTPS
- Persistent volumes

---

# 4. Repository Structure

Start with a clean repository.

Suggested structure:

```text
media-hub/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── shared-types/
│   └── ui/
│
├── providers/
│   ├── metadata/
│   ├── streaming/
│   └── books/
│
├── infrastructure/
│   ├── docker/
│   └── deployment/
│
├── docs/
│
├── tests/
│
├── .env.example
├── docker-compose.yml
├── README.md
└── MEDIA_HUB_ROADMAP.md
```

Gemini may modify this structure if a better architecture is justified.

---

# 5. Domain Model

Design normalized internal entities.

At minimum consider:

## Media

```text
Media
├── id
├── type
├── title
├── original_title
├── description
├── release_date
├── genres
├── poster
├── backdrop
├── rating
├── duration
└── metadata
```

## Movie

A media item with a single playable work.

## Series

A media item containing seasons.

## Season

```text
Season
├── id
├── series_id
├── season_number
└── episodes
```

## Episode

```text
Episode
├── id
├── season_id
├── episode_number
├── title
├── description
├── duration
└── playback_sources
```

## Book

```text
Book
├── id
├── title
├── author
├── description
├── cover
├── format
└── reading_sources
```

## User

Even if initially single-user, keep the architecture compatible with authentication.

## Watch Progress

```text
WatchProgress
├── user_id
├── media_id
├── episode_id
├── position
├── duration
├── completed
└── updated_at
```

## Reading Progress

```text
ReadingProgress
├── user_id
├── book_id
├── location
├── percentage
└── updated_at
```

---

# 6. Provider Architecture

This is one of the most important parts of the project.

Create provider interfaces such as:

```text
MetadataProvider
StreamingProvider
SubtitleProvider
BookProvider
RecommendationProvider
SearchProvider
```

A provider should expose normalized methods such as:

```text
search()
get_details()
get_seasons()
get_episodes()
get_playback_sources()
get_subtitles()
get_books()
```

Actual methods should be adapted to the provider's capabilities.

Each provider should declare:

```text
name
id
version
capabilities
configuration_schema
health_status
```

Example capability model:

```text
SEARCH
METADATA
MOVIE
SERIES
ANIME
EPISODES
STREAMING
SUBTITLES
BOOKS
RECOMMENDATIONS
```

Not every provider needs to support every capability.

---

# 7. Provider Configuration

The user should be able to configure providers through Settings.

Example:

```text
Settings
└── Providers
    ├── Metadata Providers
    ├── Streaming Providers
    ├── Subtitle Providers
    └── Book Providers
```

Provider configuration may include:

- API URL
- API key
- Access token
- Username where legitimately required
- Region
- Language
- Quality preferences
- Enabled/disabled state
- Priority

Secrets must:

- Never be committed to Git
- Never be returned unnecessarily by API responses
- Be stored securely where practical
- Be masked in the UI

---

# 8. Source Resolution Layer

Create a central resolver.

Conceptually:

```text
User requests media
        ↓
Find metadata
        ↓
Identify canonical media ID
        ↓
Ask enabled providers
        ↓
Normalize provider responses
        ↓
Rank available authorized sources
        ↓
Return playable sources
        ↓
Frontend selects/plays source
```

The resolver should handle:

- Provider priority
- Availability
- Quality
- Language
- Subtitle availability
- Audio availability
- Region limitations
- Provider errors
- Time-limited URLs
- Source expiration
- Retry/fallback
- Health checks

Do not expose provider-specific complexity to the frontend.

---

# 9. Media Playback Architecture

The player should support, where the authorized source provides them:

- Play/pause
- Seek
- Volume
- Fullscreen
- Playback speed
- Quality selection
- Audio selection
- Subtitle selection
- Subtitle styling
- Picture-in-picture where supported
- Keyboard shortcuts
- Resume playback
- Auto-next episode
- Skip intro where metadata permits
- Episode navigation

The player should gracefully handle:

- Expired source URLs
- Provider failure
- Network failure
- Unsupported formats
- Subtitle failure
- Source switching

---

# 10. Book / Novel Reader

The system should treat reading as a first-class media experience.

Potential formats:

- EPUB
- PDF
- Plain text
- HTML-based books

Reader features:

- Page/chapter navigation
- Table of contents
- Reading progress
- Resume reading
- Font size
- Line spacing
- Theme
- Fullscreen
- Search within book where supported
- Bookmarks
- Reading history

Do not force the video architecture onto books.

Use a separate reader abstraction.

---

# 11. Search System

Create unified search.

Search across:

```text
Movies
Series
Anime
Dramas
Books
Local Library
Connected Providers
```

Search should support:

- Exact title
- Partial title
- Alternate title
- Original title
- Year
- Genre
- Type
- Provider
- Language

Results should be normalized.

Example:

```text
Search
│
├── Movies
├── Series
├── Anime
├── Dramas
└── Books
```

---

# 12. Home Page

Design the home page around personalized media discovery.

Potential sections:

```text
Continue Watching
Continue Reading
My List
Recently Added
Trending
Recommended
Popular Movies
Popular Series
Popular Anime
Popular Dramas
Books
```

Only show sections for which data is actually available.

Avoid fake recommendation data.

---

# 13. Library

Create a personal library system.

Features:

- Favorites
- Watchlist
- Custom collections
- Watched
- Watching
- Completed
- Reading
- Completed books
- Recently added

Allow future support for local media.

---

# 14. Local Media Support

The architecture should eventually support local files.

Potential sources:

```text
Local filesystem
NAS
Mounted directory
Network storage
```

The local library should be indexed without copying large video files unnecessarily.

Metadata matching may use:

```text
filename
folder structure
external metadata IDs
manual matching
```

---

# 15. Authentication

Initially the application may operate as a private single-user system.

However, structure authentication so that multi-user support can be added later.

Potential implementation:

- JWT or secure session authentication
- Password hashing
- Refresh sessions where needed
- Role support
- User-specific progress
- User-specific watchlists

Never store plaintext passwords.

---

# 16. API Design

Create versioned API routes.

Example:

```text
/api/v1/auth
/api/v1/search
/api/v1/media
/api/v1/movies
/api/v1/series
/api/v1/seasons
/api/v1/episodes
/api/v1/books
/api/v1/providers
/api/v1/playback
/api/v1/progress
/api/v1/library
/api/v1/settings
```

Use consistent:

- HTTP status codes
- Error schemas
- Pagination
- Validation
- Logging
- Request IDs where useful

---

# 17. Caching

External APIs should not be called unnecessarily.

Introduce caching for:

- Search results
- Metadata
- Images where legally/technically appropriate
- Provider capability information
- Short-lived playback resolution results

Be careful with time-sensitive playback URLs.

Do not cache sensitive provider credentials.

---

# 18. Rate Limiting and Resilience

Provider integrations must be resilient.

Implement:

- Timeouts
- Retry with backoff
- Circuit-breaking where appropriate
- Rate-limit awareness
- Provider health state
- Graceful failure
- Structured error handling

One broken provider must not break the entire application.

---

# 19. Security Requirements

Minimum requirements:

- Secrets in environment variables or secure storage
- No secrets in frontend bundles
- Input validation
- Authentication on private endpoints
- CORS configured intentionally
- CSRF protection where applicable
- Secure cookies where applicable
- Rate limiting
- Dependency auditing
- No arbitrary URL fetching from untrusted user input without validation
- SSRF protections for configurable provider URLs
- Avoid command execution from user-controlled values
- Secure file path handling for local media

---

# 20. Observability

Add structured logging.

Provider requests should make it possible to determine:

```text
provider
operation
latency
status
error type
request ID
```

Do not log:

- API keys
- passwords
- access tokens
- sensitive personal data

Create a provider health page in the admin/settings area.

---

# 21. Testing Strategy

Every important subsystem should have tests.

## Backend

- Unit tests
- Provider adapter tests
- Resolver tests
- Database tests
- API integration tests
- Authentication tests
- Error handling tests

## Frontend

- Component tests
- API integration tests
- Player behavior tests
- Search tests
- Reader tests

## End-to-end

At minimum test:

```text
Login
→ Search
→ Open media
→ Resolve source
→ Play
→ Save progress
→ Resume
```

And:

```text
Search book
→ Open book
→ Read
→ Save progress
→ Resume
```

---

# 22. Development Phases

## PHASE 1 — Project Foundation

### 1.1 Repository initialization

- Initialize Git
- Create base directories
- Add README
- Add roadmap
- Add `.gitignore`
- Add `.env.example`

### 1.2 Backend skeleton

- Initialize FastAPI application
- Add configuration system
- Add health endpoint
- Add API versioning
- Add error handling

### 1.3 Frontend skeleton

- Initialize React + TypeScript + Vite
- Add routing
- Add styling system
- Create application shell

### 1.4 Database foundation

- Configure SQLAlchemy
- Configure SQLite
- Configure Alembic
- Create initial migration

### 1.5 Development environment

- Add Docker configuration
- Add Docker Compose
- Document local development
- Verify frontend/backend/database startup

---

# PHASE 2 — Core Domain Model

### 2.1 Media models

Implement:

- Media
- Movie
- Series
- Season
- Episode
- Book

### 2.2 User model

Implement initial user structure.

### 2.3 Progress models

Implement:

- WatchProgress
- ReadingProgress

### 2.4 Library models

Implement:

- Watchlist
- Favorites
- Collections

### 2.5 Database tests

Test relationships, constraints, migrations, and CRUD behavior.

---

# PHASE 3 — Authentication and User State

### 3.1 Authentication

Implement secure login/session system.

### 3.2 User API

Implement current-user endpoints.

### 3.3 User-specific data

Connect progress, favorites, watchlists, and history to users.

### 3.4 Security hardening

Add validation, password hashing, secure configuration, and endpoint authorization.

### 3.5 Authentication tests

Test success, failure, authorization, and session behavior.

---

# PHASE 4 — Provider Framework

### 4.1 Provider interfaces

Define provider contracts.

### 4.2 Provider registry

Implement provider discovery and registration.

### 4.3 Capability system

Implement provider capability declarations.

### 4.4 Provider configuration

Implement secure configuration storage.

### 4.5 Provider health

Implement provider health checks and status reporting.

### 4.6 Mock provider

Build a fake provider for development/testing.

---

# PHASE 5 — Metadata System

### 5.1 Search abstraction

Implement normalized search.

### 5.2 Metadata normalization

Map external provider objects into internal models.

### 5.3 Media details

Implement details endpoints.

### 5.4 Series hierarchy

Implement seasons and episodes.

### 5.5 Metadata caching

Add appropriate caching.

### 5.6 Metadata tests

Test normalization and provider failures.

---

# PHASE 6 — External API Integration

### 6.1 First real provider

Integrate one legitimate API/provider.

### 6.2 Configuration UI

Allow the user to enter/configure the required API credentials.

### 6.3 Provider mapping

Map provider IDs to internal canonical IDs.

### 6.4 Error handling

Handle rate limits, invalid credentials, downtime, and malformed responses.

### 6.5 Provider testing

Create integration tests with mocks.

### 6.6 Provider documentation

Document setup, required credentials, capabilities, and limitations.

---

# PHASE 7 — Source Resolution

### 7.1 Playback source abstraction

Define normalized playback source objects.

### 7.2 Resolver

Implement multi-provider source resolution.

### 7.3 Source ranking

Rank by:

- availability
- quality
- language
- provider priority
- user preferences

### 7.4 Fallback

Implement provider fallback.

### 7.5 Expiring URLs

Handle refresh/re-resolution when a legitimate provider supplies temporary URLs.

### 7.6 Resolver testing

Test multiple providers and failure scenarios.

---

# PHASE 8 — Video Player

### 8.1 Player foundation

Build custom player UI.

### 8.2 Controls

Implement standard controls.

### 8.3 Subtitle support

Implement subtitle selection and rendering where available.

### 8.4 Quality/audio

Implement quality and audio selection where supported.

### 8.5 Progress

Persist playback position.

### 8.6 Episode workflow

Implement auto-next and episode navigation.

---

# PHASE 9 — Series / Anime / Drama Experience

### 9.1 Series pages

Build seasons and episode navigation.

### 9.2 Episode details

Create episode information pages.

### 9.3 Continue watching

Resume incomplete episodes.

### 9.4 Next episode

Implement next-episode behavior.

### 9.5 Anime/drama categorization

Support provider metadata without creating separate hard-coded architectures.

---

# PHASE 10 — Book and Novel Reader

### 10.1 Book provider abstraction

Create book-specific provider interface.

### 10.2 Book library

Implement book listing and details.

### 10.3 Reader

Build EPUB/PDF/text reading experience.

### 10.4 Reading progress

Persist exact reading location where technically possible.

### 10.5 Reader preferences

Implement font, size, spacing, theme, and layout settings.

---

# PHASE 11 — Unified Search

### 11.1 Global search UI

Create search interface.

### 11.2 Federated search

Query enabled providers.

### 11.3 Result normalization

Normalize results.

### 11.4 Filters

Add type, year, genre, provider, and language filters.

### 11.5 Search performance

Add debouncing, caching, pagination, and cancellation.

---

# PHASE 12 — Home and Discovery

### 12.1 Home page

Create streaming-style home.

### 12.2 Continue watching

Add progress-driven recommendations.

### 12.3 Continue reading

Add reading progress section.

### 12.4 Recommendations

Use provider-supported recommendations where available.

### 12.5 Personalization

Use the user's own library/history without requiring an AI recommendation system initially.

---

# PHASE 13 — Personal Library

### 13.1 Watchlist

Add/remove titles.

### 13.2 Favorites

Add/remove favorites.

### 13.3 History

Create watch/read history.

### 13.4 Collections

Allow custom collections.

### 13.5 Library UI

Build filtering and sorting.

---

# PHASE 14 — Local Media

### 14.1 Local filesystem adapter

Implement local media source.

### 14.2 Scanner

Scan configured directories.

### 14.3 Metadata matching

Match local files to metadata.

### 14.4 Local playback

Play local authorized media.

### 14.5 Local books

Index local books.

---

# PHASE 15 — Settings and Administration

### 15.1 Provider management

Enable/disable providers.

### 15.2 API credentials

Secure credential configuration.

### 15.3 User preferences

Playback and UI preferences.

### 15.4 Storage configuration

Configure local media paths.

### 15.5 Diagnostics

Provider health and application status.

---

# PHASE 16 — Performance

### 16.1 Frontend optimization

- Lazy loading
- Code splitting
- Image optimization
- Query caching

### 16.2 Backend optimization

- Database indexes
- Query optimization
- Async I/O
- Connection management

### 16.3 Provider optimization

- Request batching where supported
- Caching
- Timeouts
- Concurrent provider queries where appropriate

### 16.4 Playback optimization

Minimize startup latency and unnecessary source resolution.

---

# PHASE 17 — Security Hardening

### 17.1 API security audit

Review all endpoints.

### 17.2 Provider security

Validate configurable provider endpoints and prevent SSRF.

### 17.3 File security

Prevent path traversal and unauthorized filesystem access.

### 17.4 Credential security

Audit secret handling.

### 17.5 Dependency audit

Check dependencies for known vulnerabilities.

---

# PHASE 18 — Testing and Reliability

### 18.1 Backend coverage

Expand unit and integration coverage.

### 18.2 Frontend coverage

Test major components.

### 18.3 End-to-end flows

Test complete user journeys.

### 18.4 Failure testing

Simulate:

- provider outage
- expired source
- timeout
- malformed response
- database failure
- network failure

### 18.5 Regression suite

Create a repeatable full test command.

---

# PHASE 19 — Deployment

### 19.1 Production Docker setup

Create production images.

### 19.2 PostgreSQL

Add production database configuration.

### 19.3 Persistent storage

Configure volumes.

### 19.4 Reverse proxy

Support optional HTTPS/reverse proxy.

### 19.5 Backup

Document database and configuration backup.

### 19.6 Upgrade strategy

Document safe upgrades and migrations.

---

# PHASE 20 — Final Product Polish

### 20.1 UX audit

Review every major screen.

### 20.2 Responsive design

Desktop, tablet, and mobile.

### 20.3 Accessibility

Keyboard navigation, focus states, labels, contrast, and semantic HTML.

### 20.4 Error states

Design useful loading, empty, offline, and provider-failure states.

### 20.5 Performance audit

Measure real application performance.

### 20.6 Documentation

Finalize:

- README
- Installation guide
- Provider guide
- Configuration guide
- Development guide
- Deployment guide
- Architecture documentation

---

# 23. Provider Development Contract

Whenever adding a new provider, Gemini should follow this workflow:

```text
1. Understand provider documentation
2. Determine legal/authorized usage
3. Identify capabilities
4. Define authentication requirements
5. Implement adapter
6. Normalize responses
7. Add provider tests
8. Add configuration
9. Add health checks
10. Register provider
11. Verify frontend compatibility
12. Document provider
```

Never create provider-specific hacks inside the frontend.

---

# 24. UI Direction

The UI should be inspired by modern streaming applications without copying proprietary branding.

Desired characteristics:

- Dark-first interface
- Large cinematic artwork
- Strong typography
- Smooth transitions
- Responsive cards
- Horizontal media rails
- Detail pages
- Persistent navigation
- Keyboard-friendly controls
- Minimal clutter
- Fast perceived performance

Avoid:

- Excessive animations
- Unnecessary 3D effects
- Giant loading screens
- Fake statistics
- Visual clutter

---

# 25. Suggested Routes

```text
/
 /search
 /movies
 /series
 /anime
 /dramas
 /books
 /library
 /watchlist
 /favorites
 /history
 /continue-watching
 /continue-reading
 /movie/:id
 /series/:id
 /series/:id/season/:season
 /episode/:id
 /book/:id
 /watch/:id
 /read/:id
 /settings
 /settings/providers
 /settings/account
 /settings/playback
 /settings/library
```

Adjust routes if the final architecture benefits from another structure.

---

# 26. API Response Principles

Prefer normalized responses.

Example conceptual playback response:

```json
{
  "media_id": "internal-id",
  "sources": [
    {
      "provider": "provider-a",
      "quality": "1080p",
      "language": "en",
      "url": "authorized-source-url",
      "expires_at": "timestamp"
    }
  ],
  "subtitles": [],
  "audio_tracks": []
}
```

The exact schema should be designed properly during implementation.

---

# 27. AI / Recommendation Layer

Do NOT begin with an AI recommendation engine.

First build deterministic functionality.

Later, optionally add:

- Personalized recommendations
- Semantic search
- Natural-language search
- Similar-title recommendations
- AI-generated collections

Possible future architecture:

```text
User behavior
      ↓
Feature extraction
      ↓
Recommendation engine
      ↓
Ranked candidates
      ↓
Provider availability
      ↓
UI
```

---

# 28. Future Extensions

Keep architecture open for:

- Multiple users
- Profiles
- Parental controls
- Mobile application
- Desktop application
- Android TV
- Chromecast
- DLNA
- NAS integration
- Remote access
- Offline downloads where authorized
- Advanced recommendation engine
- AI search
- Voice search
- Media server integration

Do not implement these prematurely.

---

# 29. Definition of Done

A phase is complete only when:

- Its implementation is working.
- Tests pass.
- Existing functionality still works.
- Errors are handled.
- Documentation is updated where needed.
- No known critical regression remains.
- The roadmap progress is updated.

---

# 30. Progress Tracker

Gemini must maintain this section.

```text
Current Phase: 18
Current Step: 18.5
Status: COMPLETE (Phase 18 Testing & Reliability 100% Complete)

Completed:
- Phase 1 Foundation 100% Complete (1.1 Repo, 1.2 API Skeleton, 1.3 Web Skeleton, 1.4 DB Foundation, 1.5 Dev Environment)
- Phase 2 Core Domain Model 100% Complete (2.1 Media, 2.2 User, 2.3 Progress, 2.4 Library, 2.5 Database Tests)
- Phase 3 Authentication and User State 100% Complete (3.1 Security Core, 3.2 Auth Endpoints, 3.3 User Library, 3.4 Dependencies, 3.5 Auth Tests)
- Phase 4 Provider Framework 100% Complete (4.1 Capabilities & Schemas, 4.2 Interfaces, 4.3 Registry, 4.4 Reference Provider, 4.5 Provider APIs & Tests)
- Phase 5 Metadata System 100% Complete (5.1 Federated Search, 5.2 TTL Cache, 5.3 Metadata Service, 5.4 Media Endpoints, 5.5 Tests)
- Phase 6 External API Integration 100% Complete (6.1 OpenLibrary, 6.2 TMDB Adapter, 6.3 Configuration UI, 6.4 Error Resilience, 6.5 Tests, 6.6 Docs)
- Phase 7 Source Resolution 100% Complete (7.1 Schemas, 7.2 Resolver Service, 7.3 Ranking, 7.4 Fallback, 7.5 Subtitles, 7.6 Playback API)
- Phase 8 Video Player 100% Complete (8.1 Video Player, 8.2 Controls, 8.3 Subtitles, 8.4 Quality, 8.5 Progress Sync, 8.6 Movies Integration)
- Phase 9 Series / Anime / Drama Experience 100% Complete (9.1 Episodes Modal, 9.2 Playback Routing, 9.3 Next Episode, 9.4 Categorization, 9.5 Tests)
- Phase 10 Book and Novel Reader 100% Complete (10.1 Chapter API, 10.2 Reader Component, 10.3 Typography Themes, 10.4 TOC Navigation, 10.5 Progress)
- Phase 11 Unified Search 100% Complete (11.1 Search UI, 11.2 Category Filters, 11.3 Direct Actions, 11.4 Shortcuts, 11.5 Web Build)
- Phase 12 Home and Discovery 100% Complete (12.1 Hero Showcase, 12.2 Continue Watching, 12.3 Continue Reading, 12.4 Discovery Rails, 12.5 Modals Integration)
- Phase 13 Personal Library 100% Complete (13.1 Watchlist & Favorites, 13.2 Reading Progress, 13.3 Watch & Read History, 13.4 Custom Collections, 13.5 UI)
- Phase 14 Local Media Support 100% Complete (14.1 LocalMediaProvider, 14.2 Scanner, 14.3 Regex Matchers, 14.4 Range Streaming, 14.5 Local Books & Status)
- Phase 15 Settings and Administration 100% Complete (15.1 Provider Management, 15.2 Credentials, 15.3 Preferences, 15.4 Storage, 15.5 System Diagnostics)
- Phase 16 Performance and Optimization 100% Complete (16.1 Code Splitting, 16.2 DB Indexing, 16.3 TTL Cache, 16.4 Latency Minimization)
- Phase 17 Security Hardening 100% Complete (17.1 Security Headers, 17.2 SSRF Guard, 17.3 Canonical Path Containment, 17.4 Credential Masking)
- Phase 18 Testing and Reliability:
  - 18.1: Expanded backend integration coverage for edge cases across all core models and endpoints
  - 18.2: Provider failure & timeout resilience testing (test_reliability_and_failures.py) simulating remote server drops, malformed data, and health degradation
  - 18.3: Full end-to-end user journey test (test_e2e_user_journey.py) verifying registration -> federated search -> library bookmarking -> source resolution -> playback tracking -> continue watching -> custom collections
  - 18.4: Automated cross-platform test runner scripts (scripts/run_all_tests.ps1, scripts/run_all_tests.bat)
  - 18.5: Test suite verification with 60/60 passing tests and 0 failures

Next:
- PHASE 19 — Deployment and Operational Readiness
  - Step 19.1: Production Docker Compose (docker-compose.prod.yml) with optional PostgreSQL profile and persistent storage mounts
  - Step 19.2: Production Nginx reverse proxy configuration with TLS/HTTPS readiness, asset caching headers, and API routing
  - Step 19.3: Volume management and persistent directory structure (./data/media, ./data/books, ./data/db)
  - Step 19.4: Operational deployment documentation (docs/deployment.md) detailing setup, backups, updates, and environment management
```

After each completed step, update:

```text
Current Phase: X
Current Step: X.Y
Status: COMPLETE

Completed:
- ...

Next:
- ...
```

---

# 31. First Instruction to Gemini

Do **not** start writing the entire application.

Start with:

## Phase 1.1 — Repository Initialization

First:

1. Confirm the intended architecture.
2. Identify any architectural risks.
3. Propose the initial repository structure.
4. Initialize the repository.
5. Create the foundational files.
6. Create this roadmap inside the repository.
7. Add `.gitignore`.
8. Add `.env.example`.
9. Add a minimal README.
10. Verify the repository is clean and runnable.

Then stop.

Wait for the user to explicitly request the next step.

---

# 32. Critical Rule

The goal is not to produce the largest amount of code.

The goal is to produce a **maintainable, testable, extensible personal media platform** that can evolve from a simple single-user application into a sophisticated self-hosted media hub.

When choosing between:

```text
Quick hack
```

and

```text
Clean extensible architecture
```

prefer the clean architecture when the additional complexity is justified.

When the clean architecture would introduce unnecessary complexity, keep the implementation simple.

Always explain that trade-off.
