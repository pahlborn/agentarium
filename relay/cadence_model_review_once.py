#!/usr/bin/env python3
"""One substantive Cadence consistency review; not a model test or policy activation."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
from forge_one_shot import api, API, classify_failure
from team_task_once import reject_replay

BASE = "a71e2ebfedb7ad241efd8d78cebfd72655d6521e"
MARKER = "AG-PROC-MODEL-001-CADENCE-REVIEW-V1"
DEFINITION = "d0ad187637d5201024f9fe2a31d47221178fcf6b"

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
    package = json.loads(Path("handoffs/AG-PROC-MODEL-001-cadence-review-v1.json").read_text())
    if package["task_id"] != "AG-PROC-MODEL-001" or package["base_commit"] != BASE or package["recipient"] != "Cadence/process-agent":
        raise RuntimeError("Assignment mismatch")
    data = subprocess.check_output(["git","show",BASE+":.claude/agents/process-agent.md"])
    sha = hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
    if sha != DEFINITION or b"model: opus\n" not in data or b"effort: medium\n" not in data:
        raise RuntimeError("Existing profile/default mismatch")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("No API key")
    run_url="https://github.com/pahlborn/agentarium/actions/runs/"+os.environ["GITHUB_RUN_ID"]
    post("## "+MARKER+" — HOST_RECEIVED\nSubstantive review only, no policy activation or model tests.\nDefinition: `"+sha+"`\nSource: `"+BASE+"`\nRequested model: opus; requested effort: medium (existing profile defaults).\nBudget: explicit bounded review, CLI estimated cap USD0.20; actual balance unknown. No retry/fallback.\nRun: "+run_url)
    config={"process-agent":{"description":"Cadence, bounded model-policy consistency review","prompt":data.decode(),"model":"opus","tools":[]}}
    cmd=["claude","--bare","-p",json.dumps(package,ensure_ascii=False),"--agents",json.dumps(config),"--agent","process-agent","--tools","","--disallowedTools","mcp__*","--permission-mode","dontAsk","--model","opus","--effort","medium","--max-turns","1","--max-budget-usd","0.20","--no-session-persistence","--output-format","json"]
    env=dict(os.environ)
    env.pop("GH_TOKEN",None)
    try:
        with tempfile.TemporaryDirectory(prefix="cadence-model-") as work:
            done=subprocess.run(cmd,cwd=work,env=env,capture_output=True,text=True,timeout=120)
        if done.returncode:
            raise RuntimeError(classify_failure(done.stdout+done.stderr))
        result=json.loads(done.stdout)
        response=str(result.get("result","")).strip()
        if result.get("is_error") or not response or len(response)>8000:
            raise RuntimeError(classify_failure(json.dumps(result)))
        usage=result.get("modelUsage",{})
        models=list(usage) if isinstance(usage,dict) else []
        actual=models[0] if len(models)==1 else "unconfirmed"
        evidence={"requested_model":"opus","requested_reasoning":"medium","actual_model":actual,"actual_reasoning":"unconfirmed","model_evidence":{"source":"Claude CLI final JSON modelUsage keys" if models else "No runtime model usage metadata returned","models":models},"cost_usd":result.get("total_cost_usd","unconfirmed"),"session":result.get("session_id","unconfirmed"),"definition_blob":sha,"source_commit":BASE,"run":run_url,"stop_state":"CLI exited","response_sha256":hashlib.sha256(response.encode()).hexdigest()}
        post("## AG-PROC-MODEL-001 — CADENCE_REPORT / STOPPED\nRuntime evidence:\n```json\n"+json.dumps(evidence,ensure_ascii=False,indent=2)+"\n```\n\nUnchanged final Cadence contribution; not approval:\n\n"+response)
    except Exception as exc:
        category=str(exc) if str(exc) in ("CREDIT_EXHAUSTED","KEY_INVALID_OR_EXPIRED","EXECUTION_FAILED") else classify_failure(str(exc))
        post("## AG-PROC-MODEL-001 — BLOCKED / STOPPED\nCategory: "+category+"\nRun: "+run_url+"\nNo retry/upgrade or rule activation.")
        raise RuntimeError(category) from None

if __name__=="__main__":
    main()
