#!/usr/bin/env python
import os, sys, json, subprocess, requests
from typing import Dict, Any, Optional
import tempfile
import shutil

def println(o): 
    sys.stdout.write(json.dumps(o) + "\n"); sys.stdout.flush()

def sh(cmd, check=True):
    p = subprocess.run(cmd, text=True, capture_output=True)
    if check and p.returncode != 0:
        raise RuntimeError(p.stderr.strip() or p.stdout.strip())
    return {"code": p.returncode, "stdout": p.stdout, "stderr": p.stderr}

def get_cursor_api_key():
    """Get Cursor API key from environment"""
    api_key = os.getenv("CURSOR_API_KEY")
    if not api_key:
        raise RuntimeError("CURSOR_API_KEY environment variable not set")
    return api_key

def cursor_api_request(endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Dict[str, Any]:
    """Make authenticated Cursor API request"""
    api_key = get_cursor_api_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Linguamate-MCP-Server"
    }
    
    url = f"https://api.cursor.com{endpoint}"
    
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
        raise RuntimeError(f"Cursor API error {response.status_code}: {response.text}")
    
    return response.json() if response.content else {}

def create_cursor_project(params):
    """Create a new Cursor project"""
    name = params["name"]
    description = params.get("description", "")
    template = params.get("template", "blank")
    
    data = {
        "name": name,
        "description": description,
        "template": template
    }
    
    return cursor_api_request("/projects", "POST", data)

def list_cursor_projects(params):
    """List Cursor projects"""
    return cursor_api_request("/projects")

def get_cursor_project(params):
    """Get Cursor project details"""
    project_id = params["project_id"]
    return cursor_api_request(f"/projects/{project_id}")

def update_cursor_project(params):
    """Update Cursor project"""
    project_id = params["project_id"]
    name = params.get("name")
    description = params.get("description")
    
    data = {}
    if name:
        data["name"] = name
    if description:
        data["description"] = description
    
    return cursor_api_request(f"/projects/{project_id}", "PATCH", data)

def delete_cursor_project(params):
    """Delete Cursor project"""
    project_id = params["project_id"]
    return cursor_api_request(f"/projects/{project_id}", "DELETE")

def create_cursor_session(params):
    """Create a new Cursor coding session"""
    project_id = params["project_id"]
    prompt = params.get("prompt", "")
    model = params.get("model", "gpt-4")
    
    data = {
        "project_id": project_id,
        "prompt": prompt,
        "model": model
    }
    
    return cursor_api_request("/sessions", "POST", data)

def list_cursor_sessions(params):
    """List Cursor sessions"""
    project_id = params.get("project_id")
    endpoint = "/sessions"
    if project_id:
        endpoint += f"?project_id={project_id}"
    
    return cursor_api_request(endpoint)

def get_cursor_session(params):
    """Get Cursor session details"""
    session_id = params["session_id"]
    return cursor_api_request(f"/sessions/{session_id}")

def send_cursor_message(params):
    """Send message to Cursor session"""
    session_id = params["session_id"]
    message = params["message"]
    role = params.get("role", "user")
    
    data = {
        "message": message,
        "role": role
    }
    
    return cursor_api_request(f"/sessions/{session_id}/messages", "POST", data)

def get_cursor_suggestions(params):
    """Get code suggestions from Cursor"""
    project_id = params["project_id"]
    file_path = params.get("file_path", "")
    line_number = params.get("line_number", 1)
    context = params.get("context", "")
    
    data = {
        "file_path": file_path,
        "line_number": line_number,
        "context": context
    }
    
    return cursor_api_request(f"/projects/{project_id}/suggestions", "POST", data)

def apply_cursor_suggestion(params):
    """Apply a code suggestion from Cursor"""
    suggestion_id = params["suggestion_id"]
    action = params.get("action", "apply")
    
    data = {"action": action}
    return cursor_api_request(f"/suggestions/{suggestion_id}", "POST", data)

def get_cursor_analytics(params):
    """Get Cursor usage analytics"""
    project_id = params.get("project_id")
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    
    endpoint = "/analytics"
    params_list = []
    if project_id:
        params_list.append(f"project_id={project_id}")
    if start_date:
        params_list.append(f"start_date={start_date}")
    if end_date:
        params_list.append(f"end_date={end_date}")
    
    if params_list:
        endpoint += "?" + "&".join(params_list)
    
    return cursor_api_request(endpoint)

def cursor_code_review(params):
    """Perform code review using Cursor"""
    project_id = params["project_id"]
    file_paths = params.get("file_paths", [])
    focus_areas = params.get("focus_areas", ["security", "performance", "best_practices"])
    
    data = {
        "file_paths": file_paths,
        "focus_areas": focus_areas
    }
    
    return cursor_api_request(f"/projects/{project_id}/code-review", "POST", data)

def cursor_refactor(params):
    """Refactor code using Cursor"""
    project_id = params["project_id"]
    file_path = params["file_path"]
    refactor_type = params["refactor_type"]
    description = params.get("description", "")
    
    data = {
        "file_path": file_path,
        "refactor_type": refactor_type,
        "description": description
    }
    
    return cursor_api_request(f"/projects/{project_id}/refactor", "POST", data)

def cursor_generate_tests(params):
    """Generate tests using Cursor"""
    project_id = params["project_id"]
    file_path = params["file_path"]
    test_framework = params.get("test_framework", "jest")
    coverage_target = params.get("coverage_target", 80)
    
    data = {
        "file_path": file_path,
        "test_framework": test_framework,
        "coverage_target": coverage_target
    }
    
    return cursor_api_request(f"/projects/{project_id}/generate-tests", "POST", data)

def cursor_documentation(params):
    """Generate documentation using Cursor"""
    project_id = params["project_id"]
    file_paths = params.get("file_paths", [])
    doc_format = params.get("doc_format", "markdown")
    include_examples = params.get("include_examples", True)
    
    data = {
        "file_paths": file_paths,
        "doc_format": doc_format,
        "include_examples": include_examples
    }
    
    return cursor_api_request(f"/projects/{project_id}/documentation", "POST", data)

TOOLS = {
    # Project Management
    "cursor_create_project": {
        "description": "Create a new Cursor project",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "description": {"type": "string"},
                "template": {"type": "string", "enum": ["blank", "react", "node", "python", "typescript"]}
            },
            "required": ["name"]
        },
        "handler": create_cursor_project
    },
    "cursor_list_projects": {
        "description": "List Cursor projects",
        "input_schema": {"type": "object", "properties": {}},
        "handler": list_cursor_projects
    },
    "cursor_get_project": {
        "description": "Get Cursor project details",
        "input_schema": {
            "type": "object",
            "properties": {"project_id": {"type": "string"}},
            "required": ["project_id"]
        },
        "handler": get_cursor_project
    },
    "cursor_update_project": {
        "description": "Update Cursor project",
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string"},
                "name": {"type": "string"},
                "description": {"type": "string"}
            },
            "required": ["project_id"]
        },
        "handler": update_cursor_project
    },
    "cursor_delete_project": {
        "description": "Delete Cursor project",
        "input_schema": {
            "type": "object",
            "properties": {"project_id": {"type": "string"}},
            "required": ["project_id"]
        },
        "handler": delete_cursor_project
    },
    
    # Session Management
    "cursor_create_session": {
        "description": "Create a new Cursor coding session",
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string"},
                "prompt": {"type": "string"},
                "model": {"type": "string", "enum": ["gpt-4", "gpt-3.5-turbo", "claude-3"]}
            },
            "required": ["project_id"]
        },
        "handler": create_cursor_session
    },
    "cursor_list_sessions": {
        "description": "List Cursor sessions",
        "input_schema": {
            "type": "object",
            "properties": {"project_id": {"type": "string"}}
        },
        "handler": list_cursor_sessions
    },
    "cursor_get_session": {
        "description": "Get Cursor session details",
        "input_schema": {
            "type": "object",
            "properties": {"session_id": {"type": "string"}},
            "required": ["session_id"]
        },
        "handler": get_cursor_session
    },
    "cursor_send_message": {
        "description": "Send message to Cursor session",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "message": {"type": "string"},
                "role": {"type": "string", "enum": ["user", "assistant", "system"]}
            },
            "required": ["session_id", "message"]
        },
        "handler": send_cursor_message
    },
    
    # Code Assistance
    "cursor_get_suggestions": {
        "description": "Get code suggestions from Cursor",
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string"},
                "file_path": {"type": "string"},
                "line_number": {"type": "integer"},
                "context": {"type": "string"}
            },
            "required": ["project_id"]
        },
        "handler": get_cursor_suggestions
    },
    "cursor_apply_suggestion": {
        "description": "Apply a code suggestion from Cursor",
        "input_schema": {
            "type": "object",
            "properties": {
                "suggestion_id": {"type": "string"},
                "action": {"type": "string", "enum": ["apply", "reject", "modify"]}
            },
            "required": ["suggestion_id"]
        },
        "handler": apply_cursor_suggestion
    },
    
    # Advanced Features
    "cursor_code_review": {
        "description": "Perform code review using Cursor",
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string"},
                "file_paths": {"type": "array", "items": {"type": "string"}},
                "focus_areas": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["project_id"]
        },
        "handler": cursor_code_review
    },
    "cursor_refactor": {
        "description": "Refactor code using Cursor",
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string"},
                "file_path": {"type": "string"},
                "refactor_type": {"type": "string"},
                "description": {"type": "string"}
            },
            "required": ["project_id", "file_path", "refactor_type"]
        },
        "handler": cursor_refactor
    },
    "cursor_generate_tests": {
        "description": "Generate tests using Cursor",
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string"},
                "file_path": {"type": "string"},
                "test_framework": {"type": "string", "enum": ["jest", "mocha", "pytest", "vitest"]},
                "coverage_target": {"type": "integer"}
            },
            "required": ["project_id", "file_path"]
        },
        "handler": cursor_generate_tests
    },
    "cursor_documentation": {
        "description": "Generate documentation using Cursor",
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string"},
                "file_paths": {"type": "array", "items": {"type": "string"}},
                "doc_format": {"type": "string", "enum": ["markdown", "html", "pdf"]},
                "include_examples": {"type": "boolean"}
            },
            "required": ["project_id"]
        },
        "handler": cursor_documentation
    },
    
    # Analytics
    "cursor_get_analytics": {
        "description": "Get Cursor usage analytics",
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string"},
                "start_date": {"type": "string"},
                "end_date": {"type": "string"}
            }
        },
        "handler": get_cursor_analytics
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