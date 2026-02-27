"""
Structured logging configuration for Centro de Carreiras API.

Provides JSON-formatted logs for Cloud Run with request tracing and context.
"""

import logging
import json
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime
from typing import Optional

# Context variables for request-scoped data
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar("user_id", default=None)
user_email_var: ContextVar[Optional[str]] = ContextVar("user_email", default=None)


def get_request_id() -> Optional[str]:
    """Get the current request ID from context."""
    return request_id_var.get()


def set_request_context(
    request_id: Optional[str] = None,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
) -> str:
    """Set request context for logging. Returns the request ID."""
    rid = request_id or str(uuid.uuid4())[:8]
    request_id_var.set(rid)
    if user_id:
        user_id_var.set(user_id)
    if user_email:
        user_email_var.set(user_email)
    return rid


def clear_request_context():
    """Clear request context after request completes."""
    request_id_var.set(None)
    user_id_var.set(None)
    user_email_var.set(None)


class JSONFormatter(logging.Formatter):
    """
    JSON log formatter for structured logging in Cloud Run.

    Output format is compatible with Google Cloud Logging.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "severity": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add request context if available
        request_id = request_id_var.get()
        if request_id:
            log_data["request_id"] = request_id

        user_id = user_id_var.get()
        if user_id:
            log_data["user_id"] = user_id

        user_email = user_email_var.get()
        if user_email:
            log_data["user_email"] = user_email

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add any extra fields passed to the log call
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)

        return json.dumps(log_data)


class ContextLogger(logging.Logger):
    """Logger that supports extra fields as kwargs."""

    def _log(self, level, msg, args, exc_info=None, extra=None, stack_info=False, **kwargs):
        if kwargs:
            extra = extra or {}
            extra["extra_fields"] = kwargs
        super()._log(level, msg, args, exc_info, extra, stack_info)


def setup_logging(debug: bool = False):
    """
    Configure structured logging for the application.

    Args:
        debug: If True, use DEBUG level; otherwise use INFO.
    """
    # Set custom logger class
    logging.setLoggerClass(ContextLogger)

    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if debug else logging.INFO)

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create console handler with JSON formatter
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG if debug else logging.INFO)
    console_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(console_handler)

    # Suppress noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("google").setLevel(logging.WARNING)

    return root_logger


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name."""
    return logging.getLogger(name)
