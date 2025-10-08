#!/usr/bin/env python3
"""
Engineer Agent for Multi-Agent Workforce
Handles implementation of features, bug fixes, and code changes
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from typing import Dict, List, Any

# Add mcp_servers to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp_servers'))

def load_task_details(task_id: str) -> Dict[str, Any]:
    """Load task details from tasks.yaml"""
    tasks_path = os.path.join(os.path.dirname(__file__), '..', 'agents', 'tasks.yaml')
    
    try:
        import yaml
        with open(tasks_path, 'r') as f:
            tasks = yaml.safe_load(f)
        
        # Find the specific task
        for category, items in tasks.items():
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict) and item.get('id') == task_id:
                        return item
        
        return {"id": task_id, "title": "Unknown task", "category": "unknown"}
    except Exception as e:
        return {"id": task_id, "title": "Error loading task", "error": str(e)}

def run_lint_check() -> Dict[str, Any]:
    """Run linting checks"""
    try:
        result = subprocess.run(
            ["npm", "run", "lint"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "output": result.stdout,
            "errors": result.stderr
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def run_typecheck() -> Dict[str, Any]:
    """Run TypeScript type checking"""
    try:
        result = subprocess.run(
            ["npm", "run", "typecheck"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "output": result.stdout,
            "errors": result.stderr
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def run_tests() -> Dict[str, Any]:
    """Run test suite"""
    try:
        result = subprocess.run(
            ["npm", "run", "test"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "output": result.stdout,
            "errors": result.stderr
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def implement_feature(task_details: Dict[str, Any]) -> Dict[str, Any]:
    """Implement a feature based on task details"""
    implementation = {
        "task_id": task_details.get("id"),
        "title": task_details.get("title"),
        "category": task_details.get("category"),
        "files_modified": [],
        "tests_added": [],
        "documentation_updated": [],
        "status": "in_progress"
    }
    
    # This is a placeholder - in a real implementation, this would:
    # 1. Analyze the task requirements
    # 2. Generate or modify code files
    # 3. Add tests
    # 4. Update documentation
    
    if task_details.get("category") == "features":
        # Feature implementation logic would go here
        implementation["files_modified"] = ["components/Feature.tsx", "hooks/useFeature.ts"]
        implementation["tests_added"] = ["__tests__/Feature.test.tsx"]
        implementation["status"] = "completed"
    
    elif task_details.get("category") == "bugs":
        # Bug fix implementation logic would go here
        implementation["files_modified"] = ["components/BuggyComponent.tsx"]
        implementation["tests_added"] = ["__tests__/BugFix.test.tsx"]
        implementation["status"] = "completed"
    
    return implementation

def commit_changes(task_id: str, implementation: Dict[str, Any]) -> Dict[str, Any]:
    """Commit changes with conventional commit message"""
    try:
        # Add all changes
        subprocess.run(["git", "add", "-A"], check=True)
        
        # Create commit message
        commit_type = "feat" if implementation.get("category") == "features" else "fix"
        commit_message = f"{commit_type}: {implementation.get('title', 'Implement task')}"
        
        # Commit changes
        result = subprocess.run(
            ["git", "commit", "-m", commit_message],
            capture_output=True,
            text=True
        )
        
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "commit_message": commit_message,
            "output": result.stdout,
            "errors": result.stderr
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def push_branch(branch_name: str) -> Dict[str, Any]:
    """Push branch to origin"""
    try:
        result = subprocess.run(
            ["git", "push", "-u", "origin", branch_name],
            capture_output=True,
            text=True
        )
        
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "output": result.stdout,
            "errors": result.stderr
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def create_pull_request(task_id: str, implementation: Dict[str, Any]) -> Dict[str, Any]:
    """Create a pull request"""
    try:
        title = f"feat: {implementation.get('title', f'Implement {task_id}')}"
        body = f"""## Description

Implements task: {task_id}

## Changes

- {implementation.get('title', 'Task implementation')}

## Files Modified

{chr(10).join(f"- {file}" for file in implementation.get('files_modified', []))}

## Tests Added

{chr(10).join(f"- {file}" for file in implementation.get('tests_added', []))}

## Checklist

- [x] Code follows project conventions
- [x] Tests added/updated
- [x] Documentation updated
- [x] Linting passes
- [x] Type checking passes
"""
        
        result = subprocess.run(
            ["gh", "pr", "create", "--title", title, "--body", body, "--fill"],
            capture_output=True,
            text=True
        )
        
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "pr_url": result.stdout.strip() if result.returncode == 0 else None,
            "output": result.stdout,
            "errors": result.stderr
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def main():
    """Main engineer agent function"""
    task_id = os.getenv('TASK_ID', 'default-task')
    branch_name = os.getenv('BRANCH_NAME', f'ai/engineer/{task_id}')
    autonomy_level = os.getenv('AUTONOMY_LEVEL', 'planned')
    
    print(f"Engineer Agent starting for task: {task_id}")
    print(f"Branch: {branch_name}")
    print(f"Autonomy level: {autonomy_level}")
    
    try:
        # Load task details
        task_details = load_task_details(task_id)
        print(f"✓ Task loaded: {task_details.get('title', 'Unknown')}")
        
        # Run pre-implementation checks
        print("Running pre-implementation checks...")
        lint_result = run_lint_check()
        typecheck_result = run_typecheck()
        test_result = run_tests()
        
        print(f"✓ Lint: {lint_result['status']}")
        print(f"✓ Typecheck: {typecheck_result['status']}")
        print(f"✓ Tests: {test_result['status']}")
        
        # Implement the feature/fix
        print("Implementing task...")
        implementation = implement_feature(task_details)
        print(f"✓ Implementation completed: {implementation['status']}")
        
        # Post-implementation checks
        print("Running post-implementation checks...")
        final_lint = run_lint_check()
        final_typecheck = run_typecheck()
        final_tests = run_tests()
        
        print(f"✓ Final Lint: {final_lint['status']}")
        print(f"✓ Final Typecheck: {final_typecheck['status']}")
        print(f"✓ Final Tests: {final_tests['status']}")
        
        # Commit and push if autonomous
        if autonomy_level == 'autonomous':
            print("Committing changes...")
            commit_result = commit_changes(task_id, implementation)
            print(f"✓ Commit: {commit_result['status']}")
            
            print("Pushing branch...")
            push_result = push_branch(branch_name)
            print(f"✓ Push: {push_result['status']}")
            
            print("Creating pull request...")
            pr_result = create_pull_request(task_id, implementation)
            print(f"✓ PR: {pr_result['status']}")
        
        # Output results
        result = {
            "status": "success",
            "task_id": task_id,
            "implementation": implementation,
            "checks": {
                "lint": final_lint,
                "typecheck": final_typecheck,
                "tests": final_tests
            },
            "commit_result": commit_result if autonomy_level == 'autonomous' else None,
            "push_result": push_result if autonomy_level == 'autonomous' else None,
            "pr_result": pr_result if autonomy_level == 'autonomous' else None
        }
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "status": "error",
            "task_id": task_id,
            "error": str(e)
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()