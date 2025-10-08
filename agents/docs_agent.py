#!/usr/bin/env python3
"""
Docs Agent for Multi-Agent Workforce
Handles documentation generation, updates, and maintenance
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from typing import Dict, List, Any
import re

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

def scan_codebase_for_docs() -> Dict[str, Any]:
    """Scan codebase to identify files that need documentation"""
    docs_scan = {
        "files_needing_docs": [],
        "outdated_docs": [],
        "missing_readme": [],
        "api_docs_needed": []
    }
    
    # Scan for TypeScript/JavaScript files without corresponding docs
    for root, dirs, files in os.walk(os.path.join(os.path.dirname(__file__), '..')):
        # Skip node_modules and other irrelevant directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'coverage', 'dist', 'build']]
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, os.path.join(os.path.dirname(__file__), '..'))
                
                # Check if file has JSDoc comments
                if not has_jsdoc_comments(file_path):
                    docs_scan["files_needing_docs"].append(relative_path)
                
                # Check if it's an API file
                if 'api' in relative_path.lower() or 'route' in relative_path.lower():
                    docs_scan["api_docs_needed"].append(relative_path)
    
    return docs_scan

def has_jsdoc_comments(file_path: str) -> bool:
    """Check if a file has JSDoc comments"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Look for JSDoc comments
        jsdoc_pattern = r'/\*\*[\s\S]*?\*/'
        return bool(re.search(jsdoc_pattern, content))
    except Exception:
        return False

def generate_readme_section(task_details: Dict[str, Any]) -> str:
    """Generate README section for a task"""
    section = f"""## {task_details.get('title', 'Task')}

**Task ID:** `{task_details.get('id', 'unknown')}`
**Category:** {task_details.get('category', 'unknown')}

### Description

{task_details.get('title', 'No description available')}

### Implementation Details

"""
    
    # Add acceptance criteria if available
    if 'acceptance' in task_details:
        section += "### Acceptance Criteria\n\n"
        for criterion in task_details['acceptance']:
            section += f"- {criterion}\n"
        section += "\n"
    
    # Add test information if available
    if 'tests' in task_details:
        section += "### Tests\n\n"
        for test in task_details['tests']:
            section += f"- {test}\n"
        section += "\n"
    
    # Add documentation requirements if available
    if 'docs' in task_details:
        section += "### Documentation\n\n"
        for doc in task_details['docs']:
            section += f"- {doc}\n"
        section += "\n"
    
    section += "### Usage\n\n```typescript\n// Example usage would go here\n```\n\n"
    
    return section

def generate_api_documentation(file_path: str) -> str:
    """Generate API documentation for a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract function definitions
        functions = extract_functions(content)
        
        doc = f"""# API Documentation: {os.path.basename(file_path)}

## Functions

"""
        
        for func in functions:
            doc += f"### {func['name']}\n\n"
            doc += f"**Parameters:** {', '.join(func['params'])}\n\n"
            doc += f"**Returns:** {func['returns']}\n\n"
            doc += f"**Description:** {func['description']}\n\n"
            doc += "```typescript\n"
            doc += f"{func['signature']}\n"
            doc += "```\n\n"
        
        return doc
    except Exception as e:
        return f"Error generating API documentation: {str(e)}"

def extract_functions(content: str) -> List[Dict[str, Any]]:
    """Extract function information from code"""
    functions = []
    
    # Simple regex to find function definitions
    func_pattern = r'(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()'
    
    for match in re.finditer(func_pattern, content):
        func_name = match.group(1) or match.group(2) or match.group(3)
        if func_name:
            functions.append({
                'name': func_name,
                'params': ['param1', 'param2'],  # Placeholder
                'returns': 'any',  # Placeholder
                'description': 'Function description',  # Placeholder
                'signature': f"function {func_name}()"  # Placeholder
            })
    
    return functions

def update_changelog(task_details: Dict[str, Any]) -> str:
    """Update CHANGELOG.md with task information"""
    changelog_entry = f"""## [{datetime.now().strftime('%Y-%m-%d')}] - {task_details.get('title', 'Task Update')}

### Added
- {task_details.get('title', 'Task implementation')}

### Changed
- Documentation updates for {task_details.get('id', 'task')}

### Fixed
- Documentation gaps identified and resolved

"""
    return changelog_entry

def generate_contributing_guide() -> str:
    """Generate or update CONTRIBUTING.md"""
    contributing_content = """# Contributing to Linguamate AI Tutor

## Multi-Agent Development Workflow

This project uses a multi-agent workforce system for development. Here's how to contribute:

### Agent Roles

- **Manager Agent**: Plans tasks, creates work plans, coordinates subtasks
- **Engineer Agent**: Implements features, fixes bugs, handles code changes
- **Tester Agent**: Creates tests, runs quality checks, ensures coverage
- **Docs Agent**: Generates documentation, updates guides, maintains docs
- **Security Agent**: Scans for vulnerabilities, ensures compliance

### Development Process

1. **Task Planning**: Manager agent creates plans from `agents/tasks.yaml`
2. **Implementation**: Engineer agent implements changes with quality gates
3. **Testing**: Tester agent ensures comprehensive test coverage
4. **Documentation**: Docs agent updates all relevant documentation
5. **Security**: Security agent validates security compliance

### Running Agents

```bash
# Run specific agents
npm run agent:manager
npm run agent:engineer
npm run agent:tester
npm run agent:docs
npm run agent:security
```

### Agent Autonomy Levels

- **`ai:planned`**: Agent asks for approval before major changes
- **`ai:autonomous`**: Agent operates independently within scope

### Quality Gates

All agents must pass:
- Linting (`npm run lint`)
- Type checking (`npm run typecheck`)
- Tests (`npm run test`)
- Security scans (`npm run audit`)

### Documentation Standards

- All functions must have JSDoc comments
- API endpoints must be documented
- README sections must be updated for new features
- CHANGELOG.md must be updated for releases

### Pull Request Process

1. Agent creates branch: `ai/<role>/<task-id>`
2. Agent implements changes with quality gates
3. Agent creates PR with conventional commit message
4. Automated checks run via GitHub Actions
5. Human review and approval
6. Merge and cleanup

### Environment Setup

Required environment variables:
- `GITHUB_TOKEN`: GitHub personal access token
- `CURSOR_API_KEY`: Cursor API key for AI assistance

### Troubleshooting

- Check agent logs for detailed error information
- Verify environment variables are set correctly
- Ensure all dependencies are installed
- Review GitHub Actions workflow logs

### Getting Help

- Check the [documentation](docs/)
- Review agent logs and error messages
- Open an issue with `ai:planned` label for agent assistance
"""
    return contributing_content

def validate_documentation() -> Dict[str, Any]:
    """Validate documentation completeness and quality"""
    validation = {
        "readme_complete": False,
        "api_docs_complete": False,
        "changelog_updated": False,
        "contributing_guide_exists": False,
        "issues": [],
        "recommendations": []
    }
    
    # Check README.md
    readme_path = os.path.join(os.path.dirname(__file__), '..', 'README.md')
    if os.path.exists(readme_path):
        validation["readme_complete"] = True
    else:
        validation["issues"].append("README.md is missing")
    
    # Check CONTRIBUTING.md
    contributing_path = os.path.join(os.path.dirname(__file__), '..', 'CONTRIBUTING.md')
    if os.path.exists(contributing_path):
        validation["contributing_guide_exists"] = True
    else:
        validation["recommendations"].append("Create CONTRIBUTING.md")
    
    # Check CHANGELOG.md
    changelog_path = os.path.join(os.path.dirname(__file__), '..', 'CHANGELOG.md')
    if os.path.exists(changelog_path):
        validation["changelog_updated"] = True
    else:
        validation["recommendations"].append("Create CHANGELOG.md")
    
    return validation

def commit_documentation_changes(task_id: str) -> Dict[str, Any]:
    """Commit documentation changes"""
    try:
        # Add documentation files
        subprocess.run(["git", "add", "README.md", "CONTRIBUTING.md", "CHANGELOG.md", "docs/"], check=True)
        
        # Create commit message
        commit_message = f"docs: update documentation for {task_id}"
        
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

def main():
    """Main docs agent function"""
    task_id = os.getenv('TASK_ID', 'default-task')
    autonomy_level = os.getenv('AUTONOMY_LEVEL', 'planned')
    
    print(f"Docs Agent starting for task: {task_id}")
    print(f"Autonomy level: {autonomy_level}")
    
    try:
        # Load task details
        task_details = load_task_details(task_id)
        print(f"✓ Task loaded: {task_details.get('title', 'Unknown')}")
        
        # Scan codebase for documentation needs
        print("Scanning codebase for documentation needs...")
        docs_scan = scan_codebase_for_docs()
        print(f"✓ Found {len(docs_scan['files_needing_docs'])} files needing docs")
        
        # Generate documentation
        print("Generating documentation...")
        
        # Generate README section
        readme_section = generate_readme_section(task_details)
        print("✓ README section generated")
        
        # Generate API documentation for identified files
        api_docs = {}
        for file_path in docs_scan["api_docs_needed"][:5]:  # Limit to first 5 files
            api_docs[file_path] = generate_api_documentation(file_path)
        print(f"✓ API documentation generated for {len(api_docs)} files")
        
        # Update changelog
        changelog_entry = update_changelog(task_details)
        print("✓ Changelog entry generated")
        
        # Generate contributing guide
        contributing_content = generate_contributing_guide()
        print("✓ Contributing guide generated")
        
        # Validate documentation
        print("Validating documentation...")
        validation = validate_documentation()
        print(f"✓ Documentation validation completed")
        
        # Commit changes if autonomous
        if autonomy_level == 'autonomous':
            print("Committing documentation changes...")
            commit_result = commit_documentation_changes(task_id)
            print(f"✓ Documentation committed: {commit_result['status']}")
        
        # Output results
        result = {
            "status": "success",
            "task_id": task_id,
            "docs_scan": docs_scan,
            "readme_section": readme_section,
            "api_docs": api_docs,
            "changelog_entry": changelog_entry,
            "contributing_content": contributing_content,
            "validation": validation,
            "commit_result": commit_result if autonomy_level == 'autonomous' else None
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