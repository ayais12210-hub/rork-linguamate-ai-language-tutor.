#!/usr/bin/env python
import os, sys, json, subprocess, requests
from typing import Dict, Any, Optional

def println(o): 
    sys.stdout.write(json.dumps(o) + "\n"); sys.stdout.flush()

def sh(cmd, check=True):
    p = subprocess.run(cmd, text=True, capture_output=True)
    if check and p.returncode != 0:
        raise RuntimeError(p.stderr.strip() or p.stdout.strip())
    return {"code": p.returncode, "stdout": p.stdout, "stderr": p.stderr}

def get_github_token():
    """Get GitHub token from environment or GitHub CLI"""
    token = os.getenv("GITHUB_TOKEN")
    if token:
        return token
    
    # Try to get token from GitHub CLI
    try:
        result = sh(["gh", "auth", "token"], check=False)
        if result["code"] == 0:
            return result["stdout"].strip()
    except:
        pass
    
    raise RuntimeError("No GitHub token found. Set GITHUB_TOKEN env var or authenticate with 'gh auth login'")

def github_api_request(endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Dict[str, Any]:
    """Make authenticated GitHub API request"""
    token = get_github_token()
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Linguamate-MCP-Server"
    }
    
    url = f"https://api.github.com{endpoint}"
    
    if method == "GET":
        response = requests.get(url, headers=headers)
    elif method == "POST":
        response = requests.post(url, headers=headers, json=data)
    elif method == "PATCH":
        response = requests.patch(url, headers=headers, json=data)
    elif method == "DELETE":
        response = requests.delete(url, headers=headers)
    else:
        raise ValueError(f"Unsupported HTTP method: {method}")
    
    if response.status_code >= 400:
        raise RuntimeError(f"GitHub API error {response.status_code}: {response.text}")
    
    return response.json() if response.content else {}

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

def create_issue(params):
    """Create a GitHub issue"""
    title = params["title"]
    body = params.get("body", "")
    labels = params.get("labels", [])
    assignees = params.get("assignees", [])
    
    data = {
        "title": title,
        "body": body,
        "labels": labels,
        "assignees": assignees
    }
    
    return github_api_request("/repos/ayais12210-hub/Linguamate-ai-tutor/issues", "POST", data)

def list_issues(params):
    """List GitHub issues"""
    state = params.get("state", "open")
    labels = params.get("labels", "")
    per_page = params.get("per_page", 30)
    
    endpoint = f"/repos/ayais12210-hub/Linguamate-ai-tutor/issues?state={state}&per_page={per_page}"
    if labels:
        endpoint += f"&labels={labels}"
    
    return github_api_request(endpoint)

def get_pr_details(params):
    """Get pull request details"""
    pr_number = params["pr_number"]
    return github_api_request(f"/repos/ayais12210-hub/Linguamate-ai-tutor/pulls/{pr_number}")

def list_prs(params):
    """List pull requests"""
    state = params.get("state", "open")
    per_page = params.get("per_page", 30)
    
    endpoint = f"/repos/ayais12210-hub/Linguamate-ai-tutor/pulls?state={state}&per_page={per_page}"
    return github_api_request(endpoint)

def add_pr_comment(params):
    """Add comment to a pull request"""
    pr_number = params["pr_number"]
    body = params["body"]
    
    data = {"body": body}
    return github_api_request(f"/repos/ayais12210-hub/Linguamate-ai-tutor/issues/{pr_number}/comments", "POST", data)

def merge_pr(params):
    """Merge a pull request"""
    pr_number = params["pr_number"]
    merge_method = params.get("merge_method", "merge")
    commit_title = params.get("commit_title", "")
    commit_message = params.get("commit_message", "")
    
    data = {
        "merge_method": merge_method,
        "commit_title": commit_title,
        "commit_message": commit_message
    }
    
    return github_api_request(f"/repos/ayais12210-hub/Linguamate-ai-tutor/pulls/{pr_number}/merge", "PUT", data)

def create_release(params):
    """Create a GitHub release"""
    tag_name = params["tag_name"]
    name = params.get("name", tag_name)
    body = params.get("body", "")
    draft = params.get("draft", False)
    prerelease = params.get("prerelease", False)
    
    data = {
        "tag_name": tag_name,
        "name": name,
        "body": body,
        "draft": draft,
        "prerelease": prerelease
    }
    
    return github_api_request("/repos/ayais12210-hub/Linguamate-ai-tutor/releases", "POST", data)

def get_workflow_runs(params):
    """Get GitHub Actions workflow runs"""
    workflow_id = params.get("workflow_id", "")
    status = params.get("status", "")
    per_page = params.get("per_page", 30)
    
    endpoint = f"/repos/ayais12210-hub/Linguamate-ai-tutor/actions/runs?per_page={per_page}"
    if workflow_id:
        endpoint += f"&workflow_id={workflow_id}"
    if status:
        endpoint += f"&status={status}"
    
    return github_api_request(endpoint)

def trigger_workflow(params):
    """Trigger a GitHub Actions workflow"""
    workflow_id = params["workflow_id"]
    ref = params.get("ref", "main")
    inputs = params.get("inputs", {})
    
    data = {
        "ref": ref,
        "inputs": inputs
    }
    
    return github_api_request(f"/repos/ayais12210-hub/Linguamate-ai-tutor/actions/workflows/{workflow_id}/dispatches", "POST", data)

TOOLS = {
    # Git operations
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
    },
    
    # GitHub Issues
    "github_create_issue": {
        "description":"Create a GitHub issue.",
        "input_schema":{
            "type":"object",
            "properties":{
                "title":{"type":"string"},
                "body":{"type":"string"},
                "labels":{"type":"array","items":{"type":"string"}},
                "assignees":{"type":"array","items":{"type":"string"}}
            },
            "required":["title"]
        },
        "handler": create_issue
    },
    "github_list_issues": {
        "description":"List GitHub issues.",
        "input_schema":{
            "type":"object",
            "properties":{
                "state":{"type":"string","enum":["open","closed","all"]},
                "labels":{"type":"string"},
                "per_page":{"type":"integer"}
            }
        },
        "handler": list_issues
    },
    
    # Pull Requests
    "github_get_pr_details": {
        "description":"Get pull request details.",
        "input_schema":{
            "type":"object",
            "properties":{"pr_number":{"type":"integer"}},
            "required":["pr_number"]
        },
        "handler": get_pr_details
    },
    "github_list_prs": {
        "description":"List pull requests.",
        "input_schema":{
            "type":"object",
            "properties":{
                "state":{"type":"string","enum":["open","closed","all"]},
                "per_page":{"type":"integer"}
            }
        },
        "handler": list_prs
    },
    "github_add_pr_comment": {
        "description":"Add comment to a pull request.",
        "input_schema":{
            "type":"object",
            "properties":{
                "pr_number":{"type":"integer"},
                "body":{"type":"string"}
            },
            "required":["pr_number","body"]
        },
        "handler": add_pr_comment
    },
    "github_merge_pr": {
        "description":"Merge a pull request.",
        "input_schema":{
            "type":"object",
            "properties":{
                "pr_number":{"type":"integer"},
                "merge_method":{"type":"string","enum":["merge","squash","rebase"]},
                "commit_title":{"type":"string"},
                "commit_message":{"type":"string"}
            },
            "required":["pr_number"]
        },
        "handler": merge_pr
    },
    
    # Releases
    "github_create_release": {
        "description":"Create a GitHub release.",
        "input_schema":{
            "type":"object",
            "properties":{
                "tag_name":{"type":"string"},
                "name":{"type":"string"},
                "body":{"type":"string"},
                "draft":{"type":"boolean"},
                "prerelease":{"type":"boolean"}
            },
            "required":["tag_name"]
        },
        "handler": create_release
    },
    
    # GitHub Actions
    "github_get_workflow_runs": {
        "description":"Get GitHub Actions workflow runs.",
        "input_schema":{
            "type":"object",
            "properties":{
                "workflow_id":{"type":"string"},
                "status":{"type":"string"},
                "per_page":{"type":"integer"}
            }
        },
        "handler": get_workflow_runs
    },
    "github_trigger_workflow": {
        "description":"Trigger a GitHub Actions workflow.",
        "input_schema":{
            "type":"object",
            "properties":{
                "workflow_id":{"type":"string"},
                "ref":{"type":"string"},
                "inputs":{"type":"object"}
            },
            "required":["workflow_id"]
        },
        "handler": trigger_workflow
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