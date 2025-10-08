#!/usr/bin/env python3
"""
Manager Agent for Multi-Agent Workforce
Handles task planning, issue triage, and work coordination
"""

import os
import sys
import json
import yaml
from datetime import datetime
from typing import Dict, List, Any
import subprocess

# Add mcp_servers to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp_servers'))

def load_tasks() -> Dict[str, Any]:
    """Load tasks from agents/tasks.yaml"""
    tasks_path = os.path.join(os.path.dirname(__file__), '..', 'agents', 'tasks.yaml')
    with open(tasks_path, 'r') as f:
        return yaml.safe_load(f)

def create_plan(tasks: Dict[str, Any], task_id: str) -> Dict[str, Any]:
    """Create a work plan based on tasks"""
    plan = {
        "timestamp": datetime.now().isoformat(),
        "task_id": task_id,
        "priorities": [],
        "assignments": {},
        "timeline": {},
        "dependencies": []
    }
    
    # Prioritize tasks by impact/effort
    for category, items in tasks.items():
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict) and item.get('id') == task_id:
                    plan["priorities"].append({
                        "id": item['id'],
                        "title": item.get('title', ''),
                        "category": category,
                        "priority": "high" if category in ['bugs', 'security'] else "medium"
                    })
    
    return plan

def spawn_subtasks(plan: Dict[str, Any]) -> List[str]:
    """Spawn subtasks for different agent roles"""
    subtasks = []
    
    # Determine which agents are needed based on task type
    task_id = plan["task_id"]
    
    # Always spawn engineer for implementation
    subtasks.append(f"ai/engineer/{task_id}")
    
    # Spawn tester for testing tasks
    if any(p.get('category') in ['bugs', 'features'] for p in plan["priorities"]):
        subtasks.append(f"ai/tester/{task_id}")
    
    # Spawn docs agent for documentation tasks
    if any(p.get('category') == 'docs' for p in plan["priorities"]):
        subtasks.append(f"ai/docs/{task_id}")
    
    # Spawn security agent for security tasks
    if any(p.get('category') == 'security' for p in plan["priorities"]):
        subtasks.append(f"ai/security/{task_id}")
    
    return subtasks

def create_branches(subtasks: List[str]) -> Dict[str, str]:
    """Create branches for subtasks"""
    results = {}
    
    for subtask in subtasks:
        try:
            # Create branch
            result = subprocess.run(
                ["git", "checkout", "-B", subtask],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                results[subtask] = "created"
            else:
                results[subtask] = f"failed: {result.stderr}"
                
        except Exception as e:
            results[subtask] = f"error: {str(e)}"
    
    return results

def update_plan_file(plan: Dict[str, Any]) -> str:
    """Update the plan file in agents/outbox"""
    timestamp = datetime.now().strftime("%Y-%m-%d-%H%M")
    plan_filename = f"PLAN-{timestamp}.md"
    plan_path = os.path.join(os.path.dirname(__file__), '..', 'agents', 'outbox', plan_filename)
    
    plan_content = f"""# Agent Work Plan - {plan['task_id']}

**Generated:** {plan['timestamp']}
**Task ID:** {plan['task_id']}

## Priorities

"""
    
    for priority in plan["priorities"]:
        plan_content += f"- **{priority['priority'].upper()}**: {priority['title']} ({priority['category']})\n"
    
    plan_content += f"""
## Subtasks Created

"""
    
    for subtask in plan.get("subtasks", []):
        plan_content += f"- `{subtask}`\n"
    
    plan_content += f"""
## Next Steps

1. Review and approve subtasks
2. Assign agents to subtasks
3. Monitor progress
4. Coordinate dependencies

## Status

- [ ] Plan approved
- [ ] Subtasks assigned
- [ ] Work in progress
- [ ] Completed
"""
    
    with open(plan_path, 'w') as f:
        f.write(plan_content)
    
    return plan_path

def main():
    """Main manager agent function"""
    task_id = os.getenv('TASK_ID', 'default-task')
    autonomy_level = os.getenv('AUTONOMY_LEVEL', 'planned')
    
    print(f"Manager Agent starting for task: {task_id}")
    print(f"Autonomy level: {autonomy_level}")
    
    try:
        # Load tasks
        tasks = load_tasks()
        print("✓ Tasks loaded successfully")
        
        # Create plan
        plan = create_plan(tasks, task_id)
        print("✓ Work plan created")
        
        # Spawn subtasks
        subtasks = spawn_subtasks(plan)
        plan["subtasks"] = subtasks
        print(f"✓ Subtasks identified: {subtasks}")
        
        # Create branches if autonomous
        if autonomy_level == 'autonomous':
            branch_results = create_branches(subtasks)
            plan["branch_results"] = branch_results
            print(f"✓ Branches created: {branch_results}")
        
        # Update plan file
        plan_path = update_plan_file(plan)
        print(f"✓ Plan saved to: {plan_path}")
        
        # Output results
        result = {
            "status": "success",
            "task_id": task_id,
            "plan": plan,
            "plan_file": plan_path
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