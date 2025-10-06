#!/usr/bin/env python
import os, sys, json, subprocess

def println(o): 
    sys.stdout.write(json.dumps(o) + "\n"); sys.stdout.flush()

def sh(cmd, check=True):
    p = subprocess.run(cmd, text=True, capture_output=True)
    if check and p.returncode != 0:
        raise RuntimeError(p.stderr.strip() or p.stdout.strip())
    return {"code": p.returncode, "stdout": p.stdout, "stderr": p.stderr}

def create_branch(params):
    name = params["name"]
    return sh(["git", "checkout", "-B", name])

def commit_all(params):
    message = params.get("message","chore: update content")
    sh(["git", "add", "-A"])
    return sh(["git", "commit", "-m", message], check=False)

def push_branch(params):
    name = params["name"]
    return sh(["git", "push", "-u", "origin", name], check=False)

def open_pr(params):
    title = params["title"]
    body = params.get("body","Automated PR via MCP gitops server.")
    base = params.get("base","main")
    # Requires GitHub CLI preinstalled and authenticated (CI has it by default).
    return sh(["gh", "pr", "create", "--title", title, "--body", body, "--base", base, "--fill"], check=False)

TOOLS = {
    "git_create_branch": {
        "description":"Create or reset a branch.",
        "input_schema":{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]},
        "handler": create_branch
    },
    "git_commit_all": {
        "description":"git add -A && git commit -m <message>.",
        "input_schema":{"type":"object","properties":{"message":{"type":"string"}}},
        "handler": commit_all
    },
    "git_push_branch": {
        "description":"Push branch to origin.",
        "input_schema":{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]},
        "handler": push_branch
    },
    "git_open_pr": {
        "description":"Open a pull request using GitHub CLI.",
        "input_schema":{
            "type":"object",
            "properties":{"title":{"type":"string"},"body":{"type":"string"},"base":{"type":"string"}},
            "required":["title"]
        },
        "handler": open_pr
    }
}

def main():
    for line in sys.stdin:
        try:
            msg = json.loads(line)
            if msg.get("type") == "tools/list":
                println({"type":"result","tools":[
                    {"name":n,"description":t["description"],"input_schema":t["input_schema"]}
                    for n,t in TOOLS.items()
                ]})
            elif msg.get("type") == "tools/call":
                tname = msg["name"]; args = msg.get("arguments",{}) or {}
                res = TOOLS[tname]["handler"](args)
                println({"type":"result","result":res})
            else:
                println({"type":"error","error":"unsupported message type"})
        except Exception as e:
            println({"type":"error","error":str(e)})

if __name__ == "__main__":
    main()