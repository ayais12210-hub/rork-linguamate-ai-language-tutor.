#!/usr/bin/env python3
"""
Comprehensive Setup Script for Multi-Agent Workforce System
Sets up all components including agents, MCP servers, monitoring, and dashboard
"""

import os
import sys
import json
import subprocess
import time
from datetime import datetime
from typing import Dict, List, Any
import threading

def run_command(cmd: List[str], cwd: str = None, check: bool = True) -> Dict[str, Any]:
    """Run a command and return the result"""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd or os.getcwd(),
            capture_output=True,
            text=True,
            check=check
        )
        return {
            "success": True,
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        }
    except subprocess.CalledProcessError as e:
        return {
            "success": False,
            "returncode": e.returncode,
            "stdout": e.stdout,
            "stderr": e.stderr
        }
    except Exception as e:
        return {
            "success": False,
            "returncode": -1,
            "stdout": "",
            "stderr": str(e)
        }

def check_python_dependencies() -> bool:
    """Check if Python dependencies are installed"""
    print("Checking Python dependencies...")
    
    required_packages = [
        "requests", "psutil", "pyyaml"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✓ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"✗ {package} (missing)")
    
    if missing_packages:
        print(f"Installing missing packages: {', '.join(missing_packages)}")
        result = run_command(["pip", "install"] + missing_packages)
        if not result["success"]:
            print(f"Failed to install packages: {result['stderr']}")
            return False
    
    return True

def check_node_dependencies() -> bool:
    """Check if Node.js dependencies are installed"""
    print("Checking Node.js dependencies...")
    
    result = run_command(["npm", "ci"])
    if not result["success"]:
        print(f"Failed to install Node.js dependencies: {result['stderr']}")
        return False
    
    print("✓ Node.js dependencies installed")
    return True

def validate_environment_variables() -> Dict[str, bool]:
    """Validate required environment variables"""
    print("Validating environment variables...")
    
    required_vars = {
        "GITHUB_TOKEN": "GitHub personal access token",
        "CURSOR_API_KEY": "Cursor API key"
    }
    
    validation_results = {}
    
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            print(f"✓ {var} is set")
            validation_results[var] = True
        else:
            print(f"✗ {var} is not set ({description})")
            validation_results[var] = False
    
    return validation_results

def test_mcp_servers() -> bool:
    """Test MCP servers"""
    print("Testing MCP servers...")
    
    servers = [
        ("gitops_server.py", "GitOps Server"),
        ("cursor_server.py", "Cursor Tools Server"),
        ("ingest_server.py", "Ingest Server")
    ]
    
    for server_file, server_name in servers:
        server_path = os.path.join("mcp_servers", server_file)
        if os.path.exists(server_path):
            print(f"✓ {server_name} exists")
        else:
            print(f"✗ {server_name} not found")
            return False
    
    return True

def test_agent_scripts() -> bool:
    """Test agent scripts"""
    print("Testing agent scripts...")
    
    agents = [
        ("manager_agent.py", "Manager Agent"),
        ("engineer_agent.py", "Engineer Agent"),
        ("tester_agent.py", "Tester Agent"),
        ("docs_agent.py", "Docs Agent"),
        ("security_agent.py", "Security Agent"),
        ("communication_system.py", "Communication System"),
        ("observability_system.py", "Observability System"),
        ("dashboard_system.py", "Dashboard System"),
        ("error_handling_system.py", "Error Handling System")
    ]
    
    for agent_file, agent_name in agents:
        agent_path = os.path.join("agents", agent_file)
        if os.path.exists(agent_path):
            print(f"✓ {agent_name} exists")
        else:
            print(f"✗ {agent_name} not found")
            return False
    
    return True

def validate_mcp_configurations() -> bool:
    """Validate MCP configuration files"""
    print("Validating MCP configurations...")
    
    config_files = [
        (".cursor/mcp.json", "Cursor MCP Configuration"),
        ("mcp.config.json", "MCP Configuration")
    ]
    
    for config_file, config_name in config_files:
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    json.load(f)
                print(f"✓ {config_name} is valid JSON")
            except json.JSONDecodeError as e:
                print(f"✗ {config_name} has invalid JSON: {e}")
                return False
        else:
            print(f"✗ {config_name} not found")
            return False
    
    return True

def test_github_workflows() -> bool:
    """Test GitHub workflows"""
    print("Testing GitHub workflows...")
    
    workflow_file = ".github/workflows/agent-operations.yml"
    if os.path.exists(workflow_file):
        print("✓ Agent operations workflow exists")
    else:
        print("✗ Agent operations workflow not found")
        return False
    
    return True

def create_system_status_file() -> Dict[str, Any]:
    """Create system status file"""
    print("Creating system status file...")
    
    status = {
        "setup_timestamp": datetime.now().isoformat(),
        "system_version": "1.0.0",
        "components": {
            "mcp_servers": {
                "gitops_server": os.path.exists("mcp_servers/gitops_server.py"),
                "cursor_server": os.path.exists("mcp_servers/cursor_server.py"),
                "ingest_server": os.path.exists("mcp_servers/ingest_server.py")
            },
            "agents": {
                "manager": os.path.exists("agents/manager_agent.py"),
                "engineer": os.path.exists("agents/engineer_agent.py"),
                "tester": os.path.exists("agents/tester_agent.py"),
                "docs": os.path.exists("agents/docs_agent.py"),
                "security": os.path.exists("agents/security_agent.py"),
                "communication": os.path.exists("agents/communication_system.py"),
                "observability": os.path.exists("agents/observability_system.py"),
                "dashboard": os.path.exists("agents/dashboard_system.py"),
                "error_handling": os.path.exists("agents/error_handling_system.py")
            },
            "configurations": {
                "cursor_mcp": os.path.exists(".cursor/mcp.json"),
                "mcp_config": os.path.exists("mcp.config.json"),
                "github_workflows": os.path.exists(".github/workflows/agent-operations.yml")
            }
        },
        "environment": {
            "github_token_set": bool(os.getenv("GITHUB_TOKEN")),
            "cursor_api_key_set": bool(os.getenv("CURSOR_API_KEY"))
        }
    }
    
    with open("system_status.json", "w") as f:
        json.dump(status, f, indent=2)
    
    print("✓ System status file created")
    return status

def run_system_tests() -> bool:
    """Run system tests"""
    print("Running system tests...")
    
    # Test MCP configuration validation
    result = run_command(["npm", "run", "mcp:check"])
    if not result["success"]:
        print(f"✗ MCP configuration test failed: {result['stderr']}")
        return False
    print("✓ MCP configuration test passed")
    
    # Test linting
    result = run_command(["npm", "run", "lint"])
    if not result["success"]:
        print(f"✗ Linting test failed: {result['stderr']}")
        return False
    print("✓ Linting test passed")
    
    # Test type checking
    result = run_command(["npm", "run", "typecheck"])
    if not result["success"]:
        print(f"✗ Type checking test failed: {result['stderr']}")
        return False
    print("✓ Type checking test passed")
    
    return True

def start_system_services():
    """Start system services"""
    print("Starting system services...")
    
    services = [
        ("Observability System", "python3 agents/observability_system.py"),
        ("Communication System", "python3 agents/communication_system.py"),
        ("Dashboard System", "python3 agents/dashboard_system.py"),
        ("Error Handling System", "python3 agents/error_handling_system.py")
    ]
    
    service_threads = []
    
    for service_name, command in services:
        def start_service(name, cmd):
            print(f"Starting {name}...")
            result = run_command(cmd.split(), check=False)
            if result["success"]:
                print(f"✓ {name} started successfully")
            else:
                print(f"✗ {name} failed to start: {result['stderr']}")
        
        thread = threading.Thread(target=start_service, args=(service_name, command), daemon=True)
        thread.start()
        service_threads.append(thread)
        time.sleep(2)  # Give each service time to start
    
    print("✓ System services started")
    return service_threads

def create_usage_guide():
    """Create usage guide"""
    print("Creating usage guide...")
    
    usage_guide = """# Multi-Agent Workforce System Usage Guide

## Quick Start

### 1. Environment Setup
```bash
# Set required environment variables
export GITHUB_TOKEN="your_github_token"
export CURSOR_API_KEY="your_cursor_api_key"
```

### 2. Run Individual Agents
```bash
# Manager agent for task planning
TASK_ID=translator-stt npm run agent:manager

# Engineer agent for implementation
TASK_ID=translator-stt BRANCH_NAME=ai/engineer/translator-stt npm run agent:engineer

# Tester agent for quality assurance
TASK_ID=translator-stt npm run agent:tester

# Docs agent for documentation
TASK_ID=translator-stt npm run agent:docs

# Security agent for security scanning
TASK_ID=translator-stt npm run agent:security
```

### 3. Run All Agents
```bash
# Run all agents concurrently
npm run agent:all
```

### 4. System Services
```bash
# Start observability system
npm run agent:observability

# Start communication system
npm run agent:communication

# Start dashboard (accessible at http://localhost:8080)
npm run agent:dashboard

# Start error handling system
npm run agent:error-handling
```

### 5. GitHub Actions
```bash
# Trigger agent workflow manually
gh workflow run agent-operations.yml \\
  -f agent_type=engineer \\
  -f task_id=translator-stt \\
  -f autonomy_level=autonomous
```

## Agent Autonomy Levels

- **`ai:planned`**: Agent asks for approval before major changes
- **`ai:autonomous`**: Agent operates independently within scope

## Monitoring and Observability

- **Dashboard**: http://localhost:8080
- **Metrics**: Real-time performance metrics
- **Logs**: Centralized logging system
- **Alerts**: Automated alerting system

## Error Handling

- **Automatic Recovery**: Built-in retry mechanisms
- **Circuit Breakers**: Prevent cascading failures
- **Escalation**: Automatic escalation for critical errors

## MCP Tools

### GitHub Operations
- Create issues, PRs, releases
- Manage workflows and branches
- Monitor repository status

### Cursor Integration
- Project management
- Code assistance and suggestions
- Advanced features (refactoring, testing)

## Troubleshooting

### Common Issues
1. **Missing API Keys**: Ensure environment variables are set
2. **Permission Errors**: Verify GitHub token permissions
3. **MCP Server Errors**: Check Python dependencies
4. **Agent Failures**: Review agent logs and error messages

### Debug Commands
```bash
# Validate MCP configuration
npm run mcp:check

# Test MCP servers
npm run mcp:test

# Check system status
cat system_status.json
```

## Support

- Check the [documentation](docs/)
- Review agent logs and error messages
- Open an issue with `ai:planned` label for agent assistance
"""
    
    with open("USAGE_GUIDE.md", "w") as f:
        f.write(usage_guide)
    
    print("✓ Usage guide created")

def main():
    """Main setup function"""
    print("🚀 Multi-Agent Workforce System Setup")
    print("=" * 50)
    
    setup_start_time = datetime.now()
    
    # Check dependencies
    print("\n📦 Checking Dependencies")
    print("-" * 30)
    
    if not check_python_dependencies():
        print("❌ Python dependency check failed")
        return False
    
    if not check_node_dependencies():
        print("❌ Node.js dependency check failed")
        return False
    
    # Validate environment
    print("\n🔧 Validating Environment")
    print("-" * 30)
    
    env_validation = validate_environment_variables()
    if not all(env_validation.values()):
        print("⚠️  Some environment variables are missing")
        print("Please set the required environment variables and run setup again")
    
    # Test components
    print("\n🧪 Testing Components")
    print("-" * 30)
    
    if not test_mcp_servers():
        print("❌ MCP servers test failed")
        return False
    
    if not test_agent_scripts():
        print("❌ Agent scripts test failed")
        return False
    
    if not validate_mcp_configurations():
        print("❌ MCP configurations validation failed")
        return False
    
    if not test_github_workflows():
        print("❌ GitHub workflows test failed")
        return False
    
    # Run system tests
    print("\n🔍 Running System Tests")
    print("-" * 30)
    
    if not run_system_tests():
        print("❌ System tests failed")
        return False
    
    # Create status file
    print("\n📊 Creating System Status")
    print("-" * 30)
    
    status = create_system_status_file()
    
    # Create usage guide
    print("\n📚 Creating Usage Guide")
    print("-" * 30)
    
    create_usage_guide()
    
    # Start services
    print("\n🚀 Starting System Services")
    print("-" * 30)
    
    service_threads = start_system_services()
    
    # Setup completion
    setup_end_time = datetime.now()
    setup_duration = (setup_end_time - setup_start_time).total_seconds()
    
    print("\n✅ Setup Complete!")
    print("=" * 50)
    print(f"Setup completed in {setup_duration:.2f} seconds")
    print("\n🎯 Next Steps:")
    print("1. Verify environment variables are set")
    print("2. Access dashboard at http://localhost:8080")
    print("3. Run agents using npm run agent:* commands")
    print("4. Check system status: cat system_status.json")
    print("5. Read usage guide: cat USAGE_GUIDE.md")
    
    print("\n🔧 Available Commands:")
    print("- npm run agent:manager    # Run manager agent")
    print("- npm run agent:engineer   # Run engineer agent")
    print("- npm run agent:tester     # Run tester agent")
    print("- npm run agent:docs       # Run docs agent")
    print("- npm run agent:security   # Run security agent")
    print("- npm run agent:all        # Run all agents")
    print("- npm run agent:dashboard  # Start dashboard")
    print("- npm run mcp:check        # Validate MCP config")
    
    print("\n📈 System Status:")
    for component, status_info in status["components"].items():
        print(f"- {component}: {'✅' if all(status_info.values()) else '⚠️'}")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)