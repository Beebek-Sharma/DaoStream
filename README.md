# Personal Unified Media Hub

A self-hosted personal media platform providing a unified, cinematic interface for movies, TV series, anime, dramas, documentaries, and books/novels.

## Architecture Overview

Built on a **Provider Adapter Architecture**:
- **Web Frontend (`apps/web`):** React + TypeScript + Vite + Tailwind CSS. Designed with modern streaming ergonomics, cinematic hero banners, horizontal content rails, and dark-mode glassmorphism.
- **Backend API (`apps/api`):** FastAPI + SQLAlchemy (Async) + Pydantic v2. Provides normalized domain models, user library management, and multi-provider source resolution.
- **Provider Adapters (`providers/`):** Modular plugins abstracting external metadata and authorized streaming/reading sources into a single coherent internal representation.
- **Storage:** SQLite for zero-config local development, migration-ready for PostgreSQL in production.

```text
                    ┌─────────────────────┐
                    │     Web Frontend    │
                    └──────────┬──────────┘
                               │ (REST / WS)
                               ▼
                    ┌─────────────────────┐
                    │     Backend API     │
                    └──────────┬──────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
        Metadata Service   Resolver Layer   User Library
               │               │               │
               ▼               ▼               ▼
        Provider Adapters  Stream Adapters  Database / Storage
```

---

## Repository Structure

```text
Media/
├── apps/
│   ├── api/                  # FastAPI backend service
│   └── web/                  # Vite + React web frontend
├── packages/
│   └── shared-types/         # Shared API schemas and domain models
├── providers/
│   ├── metadata/             # External metadata providers
│   ├── streaming/            # Authorized streaming adapters
│   └── books/                # Book & novel providers
├── infrastructure/
│   ├── docker/               # Dockerfiles and compose setups
│   └── deployment/           # Production deployment recipes
├── docs/                     # Architectural and operational docs
├── tests/                    # System and end-to-end test suites
├── .env.example              # Environment variables template
├── .gitignore
├── README.md
└── MEDIA_HUB_ROADMAP.md      # Master 20-phase engineering blueprint
```

---

## Legal & Compliance Boundary

The application strictly integrates with media sources, APIs, metadata services, storage locations, and streaming providers that the user is authorized to access. It does not perform web scraping, authentication bypasses, DRM circumvention, or unauthorized stream hotlinking.

---

## Local Development Prerequisites

- **Python**: 3.10+ (Current runtime: 3.14.x)
- **Node.js**: 18+ (Current runtime: 26.x) with npm
- **Git**

---

## Project Roadmap

Implementation is tracked and executed phase-by-phase in [MEDIA_HUB_ROADMAP.md](MEDIA_HUB_ROADMAP.md).
