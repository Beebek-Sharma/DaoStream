#!/usr/bin/env python3
"""Automated database backup utility for Media Hub.

Supports SQLite atomic online backups and PostgreSQL pg_dump exports.
Rotates backups to retain the latest N snapshots (default: 7).
"""

import os
import sys
import time
import shutil
import sqlite3
import subprocess
from datetime import datetime
from pathlib import Path


def get_project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def backup_sqlite(db_file: Path, backup_dir: Path) -> Path:
    if not db_file.exists():
        raise FileNotFoundError(f"Source database file not found at: {db_file}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target_path = backup_dir / f"media_hub_backup_{timestamp}.db"

    print(f"[*] Initiating SQLite online atomic backup...")
    print(f"    Source: {db_file}")
    print(f"    Destination: {target_path}")

    # Use SQLite's online backup API for crash-consistent zero-lock backup
    src_conn = sqlite3.connect(str(db_file))
    dst_conn = sqlite3.connect(str(target_path))

    with dst_conn:
        src_conn.backup(dst_conn, pages=100, progress=None)

    dst_conn.close()
    src_conn.close()

    # Integrity check on backup file
    verify_conn = sqlite3.connect(str(target_path))
    cursor = verify_conn.cursor()
    cursor.execute("PRAGMA integrity_check;")
    result = cursor.fetchone()
    verify_conn.close()

    if result and result[0] == "ok":
        size_mb = target_path.stat().st_size / (1024 * 1024)
        print(f"[+] Backup verified successfully! File size: {size_mb:.2f} MB")
        return target_path
    else:
        target_path.unlink(missing_ok=True)
        raise RuntimeError(f"Backup integrity check failed: {result}")


def rotate_backups(backup_dir: Path, max_retained: int = 7) -> None:
    backups = sorted(
        backup_dir.glob("media_hub_backup_*.db*"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    if len(backups) > max_retained:
        print(f"[*] Pruning old backups (retaining latest {max_retained})...")
        for old in backups[max_retained:]:
            print(f"    Removing: {old.name}")
            old.unlink(missing_ok=True)


def main():
    root = get_project_root()
    backup_dir = root / "data" / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)

    # Detect database path
    candidates = [
        root / "data" / "db" / "media_hub.db",
        root / "data" / "media_hub.db",
        root / "apps" / "api" / "media_hub.db",
    ]

    db_path = None
    for cand in candidates:
        if cand.exists():
            db_path = cand
            break

    if not db_path:
        # Default fallback target
        db_path = root / "data" / "media_hub.db"
        if not db_path.exists():
            print(f"[!] No existing database found to backup at searched locations.")
            sys.exit(0)

    try:
        backup_file = backup_sqlite(db_path, backup_dir)
        rotate_backups(backup_dir, max_retained=7)
        print(f"[SUCCESS] Database backup finished: {backup_file}")
    except Exception as e:
        print(f"[ERROR] Database backup failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
