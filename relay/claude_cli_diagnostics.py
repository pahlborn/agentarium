#!/usr/bin/env python3
"""Privacy-safe diagnostics for bounded Claude CLI relay calls."""
from __future__ import annotations

import hashlib
import json
import subprocess
import time
from dataclasses import dataclass


_SIGNALS = (
    ("CREDIT_EXHAUSTED", ("credit balance", "insufficient credits", "billing_error", "add funds", "balance too low")),
    ("KEY_INVALID_OR_EXPIRED", ("authentication_error", "invalid api key", "expired api key")),
    ("BUDGET_EXCEEDED", ("max budget", "budget exceeded", "maximum budget", "max_budget", "budget_usd")),
    ("RATE_LIMITED", ("rate_limit", "rate limit", "too many requests")),
    ("CLI_ARGUMENT_ERROR", ("unknown option", "unrecognized option", "invalid argument")),
)


def _text(value: str | bytes | None) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8", "replace")
    return value


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8", "replace")).hexdigest()


def classify_detail(message: str, *, timeout: bool = False) -> str:
    if timeout:
        return "TIMEOUT"
    value = message.lower()
    for label, needles in _SIGNALS:
        if any(needle in value for needle in needles):
            return label
    return "EXECUTION_FAILED"


def matched_signals(message: str, *, timeout: bool = False) -> list[str]:
    """Return controlled labels only; never return provider output."""
    if timeout:
        return ["TIMEOUT"]
    value = message.lower()
    return [label for label, needles in _SIGNALS if any(needle in value for needle in needles)]


def diagnostic(*, kind: str, stdout: str | bytes | None, stderr: str | bytes | None,
               elapsed_seconds: float, timeout_seconds: int, returncode: int | None) -> dict:
    out, err = _text(stdout), _text(stderr)
    detail = classify_detail(err + "\n" + out, timeout=kind == "TIMEOUT")
    return {
        "kind": kind,
        "detail": detail,
        "returncode": returncode,
        "elapsed_seconds": round(elapsed_seconds, 3),
        "timeout_seconds": timeout_seconds,
        "stdout_bytes": len(out.encode("utf-8", "replace")),
        "stderr_bytes": len(err.encode("utf-8", "replace")),
        "stdout_sha256": _digest(out),
        "stderr_sha256": _digest(err),
        "signals": matched_signals(err + "\n" + out, timeout=kind == "TIMEOUT"),
    }


@dataclass
class ClaudeCliFailure(RuntimeError):
    evidence: dict

    def __post_init__(self) -> None:
        RuntimeError.__init__(self, self.evidence["detail"])


def run_json(cmd: list[str], *, cwd: str, env: dict[str, str], timeout: int) -> tuple[dict, dict]:
    """Run Claude once and return parsed JSON plus non-sensitive execution evidence."""
    started = time.monotonic()
    try:
        completed = subprocess.run(
            cmd, cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout, check=False
        )
    except subprocess.TimeoutExpired as exc:
        raise ClaudeCliFailure(diagnostic(
            kind="TIMEOUT", stdout=exc.stdout, stderr=exc.stderr,
            elapsed_seconds=time.monotonic() - started, timeout_seconds=timeout, returncode=None,
        )) from None

    elapsed = time.monotonic() - started
    if completed.returncode:
        raise ClaudeCliFailure(diagnostic(
            kind="CLI_EXIT", stdout=completed.stdout, stderr=completed.stderr,
            elapsed_seconds=elapsed, timeout_seconds=timeout, returncode=completed.returncode,
        ))
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError:
        raise ClaudeCliFailure(diagnostic(
            kind="INVALID_JSON", stdout=completed.stdout, stderr=completed.stderr,
            elapsed_seconds=elapsed, timeout_seconds=timeout, returncode=completed.returncode,
        )) from None
    evidence = diagnostic(
        kind="SUCCESS", stdout=completed.stdout, stderr=completed.stderr,
        elapsed_seconds=elapsed, timeout_seconds=timeout, returncode=completed.returncode,
    )
    return result, evidence


def validate_handback(result: object, execution: dict, max_chars: int = 60000) -> str:
    """Return a valid non-empty string handback or raise with controlled evidence."""
    if not isinstance(result, dict):
        raise ClaudeCliFailure(dict(execution, kind="INVALID_HANDOFF",
                                    detail="INVALID_HANDOFF",
                                    result_type=type(result).__name__))
    raw_response = result.get("result")
    response = raw_response.strip() if isinstance(raw_response, str) else ""
    if result.get("is_error") is True or not response or len(response) > max_chars:
        detail = classify_detail(json.dumps(result, ensure_ascii=False))
        if detail == "EXECUTION_FAILED":
            detail = "INVALID_HANDOFF"
        raise ClaudeCliFailure(dict(
            execution, kind="INVALID_HANDOFF", detail=detail,
            is_error=result.get("is_error") is True,
            response_type=type(raw_response).__name__,
            response_chars=len(response),
            result_keys=sorted(str(key) for key in result),
        ))
    return response
