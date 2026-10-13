#!/usr/bin/env python3
"""Two moving mockup code handback; not a model test, no automatic code publication."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
from forge_one_shot import api, API, classify_failure
from team_task_once import reject_replay

BASE = "044848ed2c28a2ed2d6a1b977b68bfa0059bdfc6"
import sys
VARIANT = sys.argv[1] if len(sys.argv)==2 else ""
if VARIANT not in ("gewebe","partitur"): raise RuntimeError("Invalid variant")
MARKER = "AG-MOTION-001-FORGE-V2-"+VARIANT
DEFINITION = "0dcac59d22c27753f111fb1ad79f5a9be524052a"

def post(text):
    api(API + "/issues/2/comments", {"body":text})

def main():
    import team_task_once
    team_task_once.MARKER = MARKER
    if os.environ.get("GITHUB_REPOSITORY") != "pahlborn/agentarium" or os.environ.get("GITHUB_REF_NAME") != "feature/visual-stage-v0":
        raise RuntimeError("Wrong project context")
    if api(API).get("private") is not True:
        raise RuntimeError("Private repository required")
    reject_replay()
    package = json.loads(Path("handoffs/AG-MOTION-001-"+VARIANT+"-v2.json").read_text())
    if package["task_id"] != "AG-MOTION-001" or package["base_commit"] != BASE or package["recipient"] != "Forge/coding-agent" or package["version"]!=2 or package["variant"]!=VARIANT:
        raise RuntimeError("Assignment mismatch")
    data = subprocess.check_output(["git","show",BASE+":.claude/agents/coding-agent.md"])
    sha = hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
    if sha != DEFINITION or b"model: sonnet\n" not in data or b"effort: medium\n" not in data:
        raise RuntimeError("Existing profile/default mismatch")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("No API key")
    run_url="https://github.com/pahlborn/agentarium/actions/runs/"+os.environ["GITHUB_RUN_ID"]
    post("## "+MARKER+" — HOST_RECEIVED\nOne bounded variant mockup implementation returned as code; no automatic product publishing, merge/deploy/modeltests.\nDefinition: `"+sha+"`\nSource: `"+BASE+"`\nRequested model: sonnet; requested effort: medium (existing profile defaults).\nBudget: explicit bounded review, CLI estimated cap USD0.15; actual balance unknown. No retry/fallback.\nRun: "+run_url)
    config={"coding-agent":{"description":"Forge, two bounded moving prototype views","prompt":data.decode(),"model":"sonnet","tools":[]}}
    cmd=["claude","--bare","-p",json.dumps(package,ensure_ascii=False),"--agents",json.dumps(config),"--agent","coding-agent","--tools","","--disallowedTools","mcp__*","--permission-mode","dontAsk","--model","sonnet","--effort","medium","--max-turns","1","--max-budget-usd","0.15","--no-session-persistence","--output-format","json"]
    env=dict(os.environ)
    env.pop("GH_TOKEN",None)
    try:
        with tempfile.TemporaryDirectory(prefix="forge-motion-") as work:
            done=subprocess.run(cmd,cwd=work,env=env,capture_output=True,text=True,timeout=180)
        if done.returncode:
            raise RuntimeError(classify_failure(done.stdout+done.stderr))
        result=json.loads(done.stdout)
        response=str(result.get("result","")).strip()
        if result.get("is_error") or not response or len(response)>60000:
            raise RuntimeError(classify_failure(json.dumps(result)))
        usage=result.get("modelUsage",{})
        models=list(usage) if isinstance(usage,dict) else []
        actual=models[0] if len(models)==1 else "unconfirmed"
        evidence={"requested_model":"sonnet","requested_reasoning":"medium","actual_model":actual,"actual_reasoning":"unconfirmed","model_evidence":{"source":"Claude CLI final JSON modelUsage keys" if models else "No runtime model usage metadata returned","models":models},"cost_usd":result.get("total_cost_usd","unconfirmed"),"session":result.get("session_id","unconfirmed"),"definition_blob":sha,"source_commit":BASE,"run":run_url,"stop_state":"CLI exited","response_sha256":hashlib.sha256(response.encode()).hexdigest()}
        post("## AG-MOTION-001 "+VARIANT+" V2 — FORGE_RESULT / STOPPED\nRuntime evidence:\n```json\n"+json.dumps(evidence,ensure_ascii=False,indent=2)+"\n```\n\nUnchanged final Forge code handback; not acceptance:\n\n"+response)
    except Exception as exc:
        category=str(exc) if str(exc) in ("CREDIT_EXHAUSTED","KEY_INVALID_OR_EXPIRED","EXECUTION_FAILED") else classify_failure(str(exc))
        post("## AG-MOTION-001 "+VARIANT+" V2 — BLOCKED / STOPPED\nCategory: "+category+"\nRun: "+run_url+"\nNo retry/upgrade or rule activation.")
        raise RuntimeError(category) from None

if __name__=="__main__":
    main()
