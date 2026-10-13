#!/usr/bin/env python3
"""Offline role-routing guard. No Anthropic API calls."""
import json
from pathlib import Path

data = json.loads(Path(__file__).with_name("role-routing.json").read_text())
roles = data["roles"]
assert roles["nova"]["platform"] == "chatgpt"
assert roles["nova"]["technical_id"] == "create-vision-with-nova"
assert roles["nova"]["state"] == "not_available_in_this_session"
assert roles["cadence"]["platform"] == "claude-code"
assert roles["cadence"]["technical_id"] == "process-agent"
for role_name, role in roles.items():
    if role["platform"] == "chatgpt":
        assert role.get("technical_id") != "process-agent", role_name
    if role.get("state") == "not_available_in_this_session":
        assert role["platform"] == "chatgpt", role_name
print("ROLE_ROUTING_OK: Nova remains a ChatGPT skill; not spoofed as Claude")
