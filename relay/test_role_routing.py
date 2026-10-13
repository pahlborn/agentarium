#!/usr/bin/env python3
"""Offline role-routing guard. No provider/API calls; skills are not workers."""
import json
from pathlib import Path

data = json.loads(Path(__file__).with_name("role-routing.json").read_text())
roles = data["roles"]
expected = {
    "atlas": ("chatgpt", "operate-as-atlas"),
    "nova": ("chatgpt", "create-vision-with-nova"),
    "scout": ("chatgpt", "build-research-knowledge"),
    "argus": ("chatgpt", "review-agent-argus"),
    "sentinel": ("chatgpt", "qa-agent-sentinel"),
    "archibald": ("claude-code", "spec-agent"),
    "forge": ("claude-code", "coding-agent"),
    "cadence": ("claude-code", "process-agent"),
}
assert set(roles) == set(expected)
for name, (platform, technical_id) in expected.items():
    role = roles[name]
    assert (role["platform"], role["technical_id"]) == (platform, technical_id), name
    if name in ("nova", "scout", "argus", "sentinel"):
        assert role["state"] == "task_contribution_completed_2026-10-13", name
        proof = role["runtime_evidence"]
        assert proof["agent"].startswith("/root/" + name + "_"), name
        assert proof["task"] == "AG-TEAM-001" and proof["assignment_version"] == 1, name
        assert proof["skill_resource"].startswith("skill://flora-user-skills/"), name
        assert len(proof["baseline"]) == 40 and proof["stop_state"] == "completed", name
        assert proof["result"].startswith("https://github.com/pahlborn/agentarium/"), name
    elif platform == "claude-code":
        proof = role["task_evidence"]
        assert proof["task"] == "AG-TEAM-001" and proof["source_version"] == 2, name
        assert proof["effective_tools"] == [] and proof["stop_state"] == "completed", name
        assert len(proof["session"]) == 36 and len(proof["definition_blob"]) == 40, name
        assert proof["result"].startswith("https://github.com/pahlborn/agentarium/issues/2#"), name
assert data["task_result"]["future_auto_execution"] is False
print("ROLE_ROUTING_OK: exact platform/role IDs and bounded runtime evidence; no automatic dispatch")
