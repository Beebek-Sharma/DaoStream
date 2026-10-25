import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import sys


def setup_logging(debug: bool = False) -> None:
    """Configures application-wide structured logging for stdout and optional rotating file output."""
    log_level = logging.DEBUG if debug else logging.INFO
    log_format = "%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]

    # Attempt to attach rotating log file if logs directory is present or writable
    for candidate_dir in [Path("/app/data/logs"), Path("./data/logs")]:
        try:
            if candidate_dir.exists() or candidate_dir.parent.exists():
                candidate_dir.mkdir(parents=True, exist_ok=True)
                file_handler = RotatingFileHandler(
                    candidate_dir / "daostream.log",
                    maxBytes=10 * 1024 * 1024,  # 10 MB
                    backupCount=5,
                    encoding="utf-8",
                )
                file_handler.setFormatter(logging.Formatter(log_format, datefmt=date_format))
                handlers.append(file_handler)
                break
        except Exception:
            # Fall back cleanly to stdout if disk permissions prevent file creation
            pass

    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=handlers,
        force=True,
    )

    # Silence overly verbose external loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING if not debug else logging.INFO)

