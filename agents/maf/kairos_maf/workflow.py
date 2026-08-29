"""Native Microsoft Agent Framework adapter for the KAIROS research workflow."""

from __future__ import annotations

import json
import os
import re
from collections.abc import Iterable
from typing import Any, Optional


ANALYSIS_TYPES = {"fundamental", "technical", "macro", "sentiment", "risk", "portfolio", "scenario"}
SIGNALS = {"bullish", "bearish", "neutral", "no_trade"}
HORIZONS = {"intraday", "short_term", "medium_term", "long_term"}
DATE_TIME_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$")


def _required(value: Any, name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{name} is required")
    return value.strip()


def parse_structured_analysis(text: str) -> dict[str, Any]:
    """Parse the bounded JSON response required from a specialist agent."""
    try:
        value = json.loads(text)
    except json.JSONDecodeError as error:
        raise ValueError("agent response must be valid JSON") from error
    if not isinstance(value, dict):
        raise ValueError("agent response must be a JSON object")
    fields = {"analysisId", "agent", "analysisType", "instrumentId", "signal", "horizon", "thesis", "confidence", "risks", "missingData", "evidenceIds", "generatedAt"}
    unexpected = set(value) - fields
    if unexpected:
        raise ValueError(f"unexpected fields: {', '.join(sorted(unexpected))}")
    for field in ("analysisId", "agent", "analysisType", "instrumentId", "signal", "horizon", "thesis", "generatedAt"):
        _required(value.get(field), field)
    if value["signal"] not in SIGNALS:
        raise ValueError("unsupported signal")
    if value["horizon"] not in HORIZONS:
        raise ValueError("unsupported horizon")
    if value["analysisType"] not in ANALYSIS_TYPES:
        raise ValueError("unsupported analysisType")
    confidence = value.get("confidence")
    if not isinstance(confidence, (int, float)) or isinstance(confidence, bool) or not 0 <= confidence <= 1:
        raise ValueError("confidence must be between 0 and 1")
    arrays = {}
    for field in ("risks", "missingData", "evidenceIds"):
        items = value.get(field)
        if not isinstance(items, list) or any(not isinstance(item, str) or not item.strip() for item in items):
            raise ValueError(f"{field} must be a list of non-empty strings")
        arrays[field] = items
    evidence_ids = arrays["evidenceIds"]
    if value["signal"] != "no_trade" and not evidence_ids:
        raise ValueError("non-no-trade analysis requires evidenceIds")
    generated_at = value["generatedAt"]
    if not DATE_TIME_PATTERN.fullmatch(generated_at):
        raise ValueError("generatedAt must be an RFC 3339 date-time")
    try:
        from datetime import datetime
        datetime.fromisoformat(generated_at.replace("Z", "+00:00"))
    except (AttributeError, TypeError, ValueError) as error:
        raise ValueError("generatedAt must be a valid date-time") from error
    return {
        "analysisId": value["analysisId"],
        "agent": value["agent"],
        "analysisType": value["analysisType"],
        "instrumentId": value["instrumentId"],
        "signal": value["signal"],
        "horizon": value["horizon"],
        "thesis": value["thesis"],
        "confidence": confidence,
        "risks": arrays["risks"],
        "missingData": arrays["missingData"],
        "evidenceIds": evidence_ids,
        "generatedAt": generated_at,
    }


def create_openai_agent(*, name: str, instructions: str, model: Optional[str] = None):
    """Create a MAF agent using the repository-standard OpenAI credential."""
    from agent_framework import Agent
    from agent_framework.openai import OpenAIChatClient

    api_key = _required(os.environ.get("OPENAI_API_KEY"), "OPENAI_API_KEY")
    client = OpenAIChatClient(api_key=api_key, model=model or os.environ.get("OPENAI_MODEL", "gpt-4.1-mini"))
    return Agent(client=client, name=_required(name, "name"), instructions=instructions)


def build_research_workflow(participants: Iterable[Any], *, checkpoint_path: Optional[str] = None):
    """Build a concurrent MAF research workflow with optional local checkpoints."""
    from agent_framework.orchestrations import ConcurrentBuilder

    participants = list(participants)
    if not participants:
        raise ValueError("at least one participant is required")
    kwargs: dict[str, Any] = {"participants": participants}
    if checkpoint_path:
        from agent_framework import FileCheckpointStorage

        kwargs["checkpoint_storage"] = FileCheckpointStorage(_required(checkpoint_path, "checkpoint_path"))
    return ConcurrentBuilder(**kwargs).build()
