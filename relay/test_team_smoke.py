#!/usr/bin/env python3
"""Offline Agentarium team-smoke gate: no Claude/OpenAI API calls."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
test = json.loads((root / "handoffs/AG-TEAM-001-team-smoke-test.json").read_text())
registry = json.loads((root / "relay/role-routing.json").read_text())
assert test["task_id"] == "AG-TEAM-001"
assert test["authorization"].startswith("Preparation")
assert test["budget"]["external_agent_calls_allowed"] == 0
assert test["state"] == "BLOCKED_CHATGPT_ROLE_RUNTIME"
assert len(test["routing"]) == 8
for step in test["routing"]:
    role = step["role"]
    assert role in registry["roles"], role
    assert step["platform"] == registry["roles"][role]["platform"], role
    if step["platform"] == "chatgpt":
        assert step["status"] == "UNVERIFIED", role
    else:
        assert step["status"] == "IDENTITY_TESTED_ONLY", role
assert "No simulated answer may be recorded as a live agent response." in test["acceptance"]
print("AG_TEAM_001_OFFLINE_GATE_OK: 8 authentic identities mapped; runtime gate remains closed; API calls=0")
