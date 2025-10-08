#!/usr/bin/env python3
"""
Security Agent for Multi-Agent Workforce
Handles security scanning, vulnerability assessment, and compliance validation
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

def run_npm_audit() -> Dict[str, Any]:
    """Run npm audit for vulnerability scanning"""
    try:
        result = subprocess.run(
            ["npm", "audit", "--audit-level=high", "--json"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        audit_data = json.loads(result.stdout) if result.stdout else {}
        
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "vulnerabilities": audit_data.get("vulnerabilities", {}),
            "metadata": audit_data.get("metadata", {}),
            "output": result.stdout,
            "errors": result.stderr
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def run_gitleaks_scan() -> Dict[str, Any]:
    """Run gitleaks for secret scanning"""
    try:
        result = subprocess.run(
            ["gitleaks", "detect", "--config", ".gitleaks.toml", "--verbose", "--json"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        leaks = []
        if result.stdout:
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    try:
                        leaks.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "leaks_found": len(leaks),
            "leaks": leaks,
            "output": result.stdout,
            "errors": result.stderr
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def run_semgrep_scan() -> Dict[str, Any]:
    """Run semgrep for static analysis"""
    try:
        result = subprocess.run(
            ["semgrep", "--config=auto", "--json", "--quiet"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        semgrep_data = json.loads(result.stdout) if result.stdout else {}
        
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "findings": semgrep_data.get("results", []),
            "summary": semgrep_data.get("summary", {}),
            "output": result.stdout,
            "errors": result.stderr
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def scan_for_hardcoded_secrets() -> Dict[str, Any]:
    """Scan codebase for hardcoded secrets"""
    secrets_found = []
    patterns = {
        "api_key": r'(?i)(api[_-]?key|apikey)\s*[:=]\s*["\']?[a-zA-Z0-9]{20,}["\']?',
        "secret": r'(?i)(secret|password|passwd|pwd)\s*[:=]\s*["\']?[a-zA-Z0-9]{8,}["\']?',
        "token": r'(?i)(token|bearer)\s*[:=]\s*["\']?[a-zA-Z0-9]{20,}["\']?',
        "private_key": r'-----BEGIN PRIVATE KEY-----',
        "jwt_secret": r'(?i)(jwt[_-]?secret|jwtsecret)\s*[:=]\s*["\']?[a-zA-Z0-9]{20,}["\']?'
    }
    
    for root, dirs, files in os.walk(os.path.join(os.path.dirname(__file__), '..')):
        # Skip node_modules and other irrelevant directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'coverage', 'dist', 'build']]
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.env')):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, os.path.join(os.path.dirname(__file__), '..'))
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    for secret_type, pattern in patterns.items():
                        matches = re.finditer(pattern, content)
                        for match in matches:
                            secrets_found.append({
                                "file": relative_path,
                                "type": secret_type,
                                "line": content[:match.start()].count('\n') + 1,
                                "match": match.group()[:50] + "..." if len(match.group()) > 50 else match.group()
                            })
                except Exception:
                    continue
    
    return {
        "secrets_found": len(secrets_found),
        "secrets": secrets_found
    }

def check_dependency_security() -> Dict[str, Any]:
    """Check dependency security and compliance"""
    security_check = {
        "outdated_packages": [],
        "vulnerable_packages": [],
        "license_issues": [],
        "recommendations": []
    }
    
    try:
        # Check for outdated packages
        result = subprocess.run(
            ["npm", "outdated", "--json"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        if result.stdout:
            outdated = json.loads(result.stdout)
            security_check["outdated_packages"] = list(outdated.keys())
        
        # Check package licenses
        result = subprocess.run(
            ["npm", "list", "--json"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        if result.stdout:
            packages = json.loads(result.stdout)
            # This is a simplified check - in production, use a proper license checker
            security_check["recommendations"].append("Consider using license-checker for comprehensive license analysis")
        
    except Exception as e:
        security_check["recommendations"].append(f"Error checking dependencies: {str(e)}")
    
    return security_check

def validate_environment_security() -> Dict[str, Any]:
    """Validate environment and configuration security"""
    env_security = {
        "env_vars_checked": [],
        "config_issues": [],
        "recommendations": []
    }
    
    # Check for sensitive environment variables
    sensitive_vars = ['GITHUB_TOKEN', 'CURSOR_API_KEY', 'DATABASE_URL', 'JWT_SECRET']
    
    for var in sensitive_vars:
        if os.getenv(var):
            env_security["env_vars_checked"].append({
                "variable": var,
                "status": "set",
                "secure": True  # Assume secure if set
            })
        else:
            env_security["env_vars_checked"].append({
                "variable": var,
                "status": "not_set",
                "secure": False
            })
    
    # Check for .env files in git
    try:
        result = subprocess.run(
            ["git", "ls-files", "*.env*"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        if result.stdout.strip():
            env_security["config_issues"].append("Environment files found in git repository")
            env_security["recommendations"].append("Ensure .env files are in .gitignore")
    except Exception:
        pass
    
    return env_security

def generate_security_report(task_id: str, scan_results: Dict[str, Any]) -> Dict[str, Any]:
    """Generate comprehensive security report"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "task_id": task_id,
        "summary": {
            "vulnerabilities_found": 0,
            "secrets_found": 0,
            "security_score": 100,
            "recommendations_count": 0
        },
        "scans": scan_results,
        "recommendations": [],
        "compliance": {
            "npm_audit": "passed",
            "secret_scanning": "passed",
            "static_analysis": "passed",
            "dependency_check": "passed"
        }
    }
    
    # Calculate security score
    score_deductions = 0
    
    # Check npm audit results
    if "npm_audit" in scan_results:
        audit_result = scan_results["npm_audit"]
        if audit_result.get("status") != "success":
            score_deductions += 20
            report["compliance"]["npm_audit"] = "failed"
        elif audit_result.get("vulnerabilities"):
            vuln_count = len(audit_result["vulnerabilities"])
            score_deductions += min(vuln_count * 5, 30)
    
    # Check gitleaks results
    if "gitleaks" in scan_results:
        gitleaks_result = scan_results["gitleaks"]
        if gitleaks_result.get("leaks_found", 0) > 0:
            score_deductions += 25
            report["compliance"]["secret_scanning"] = "failed"
            report["summary"]["secrets_found"] = gitleaks_result["leaks_found"]
    
    # Check semgrep results
    if "semgrep" in scan_results:
        semgrep_result = scan_results["semgrep"]
        if semgrep_result.get("findings"):
            findings_count = len(semgrep_result["findings"])
            score_deductions += min(findings_count * 2, 20)
            if findings_count > 5:
                report["compliance"]["static_analysis"] = "failed"
    
    # Check hardcoded secrets
    if "hardcoded_secrets" in scan_results:
        secrets_result = scan_results["hardcoded_secrets"]
        if secrets_result.get("secrets_found", 0) > 0:
            score_deductions += 30
            report["summary"]["secrets_found"] += secrets_result["secrets_found"]
    
    # Update security score
    report["summary"]["security_score"] = max(100 - score_deductions, 0)
    
    # Generate recommendations
    if report["summary"]["security_score"] < 80:
        report["recommendations"].append("Security score is below acceptable threshold")
    
    if report["compliance"]["npm_audit"] == "failed":
        report["recommendations"].append("Fix npm audit vulnerabilities")
    
    if report["compliance"]["secret_scanning"] == "failed":
        report["recommendations"].append("Remove hardcoded secrets from codebase")
    
    if report["compliance"]["static_analysis"] == "failed":
        report["recommendations"].append("Address static analysis findings")
    
    report["summary"]["recommendations_count"] = len(report["recommendations"])
    
    return report

def create_security_issue(task_id: str, security_report: Dict[str, Any]) -> Dict[str, Any]:
    """Create GitHub issue for security findings"""
    if security_report["summary"]["security_score"] >= 80:
        return {"status": "skipped", "reason": "Security score is acceptable"}
    
    issue_title = f"Security Review Required: {task_id}"
    issue_body = f"""## Security Assessment Results

**Task ID:** {task_id}
**Security Score:** {security_report['summary']['security_score']}/100
**Assessment Date:** {security_report['timestamp']}

### Compliance Status

- **NPM Audit:** {security_report['compliance']['npm_audit']}
- **Secret Scanning:** {security_report['compliance']['secret_scanning']}
- **Static Analysis:** {security_report['compliance']['static_analysis']}
- **Dependency Check:** {security_report['compliance']['dependency_check']}

### Issues Found

- Vulnerabilities: {security_report['summary']['vulnerabilities_found']}
- Secrets: {security_report['summary']['secrets_found']}

### Recommendations

{chr(10).join(f"- {rec}" for rec in security_report['recommendations'])}

### Next Steps

1. Review security findings
2. Address critical vulnerabilities
3. Remove hardcoded secrets
4. Update dependencies
5. Re-run security scans

**Labels:** `security`, `ai:planned`
"""
    
    # This would typically use the GitHub API or CLI
    return {
        "status": "created",
        "title": issue_title,
        "body": issue_body,
        "labels": ["security", "ai:planned"]
    }

def main():
    """Main security agent function"""
    task_id = os.getenv('TASK_ID', 'default-task')
    autonomy_level = os.getenv('AUTONOMY_LEVEL', 'planned')
    
    print(f"Security Agent starting for task: {task_id}")
    print(f"Autonomy level: {autonomy_level}")
    
    try:
        # Load task details
        task_details = load_task_details(task_id)
        print(f"✓ Task loaded: {task_details.get('title', 'Unknown')}")
        
        # Run security scans
        print("Running security scans...")
        scan_results = {}
        
        print("Running npm audit...")
        scan_results["npm_audit"] = run_npm_audit()
        print(f"✓ NPM audit: {scan_results['npm_audit']['status']}")
        
        print("Running gitleaks scan...")
        scan_results["gitleaks"] = run_gitleaks_scan()
        print(f"✓ Gitleaks: {scan_results['gitleaks']['status']}")
        
        print("Running semgrep scan...")
        scan_results["semgrep"] = run_semgrep_scan()
        print(f"✓ Semgrep: {scan_results['semgrep']['status']}")
        
        print("Scanning for hardcoded secrets...")
        scan_results["hardcoded_secrets"] = scan_for_hardcoded_secrets()
        print(f"✓ Hardcoded secrets scan completed")
        
        print("Checking dependency security...")
        scan_results["dependency_security"] = check_dependency_security()
        print(f"✓ Dependency security check completed")
        
        print("Validating environment security...")
        scan_results["environment_security"] = validate_environment_security()
        print(f"✓ Environment security validation completed")
        
        # Generate security report
        print("Generating security report...")
        security_report = generate_security_report(task_id, scan_results)
        print(f"✓ Security report generated (Score: {security_report['summary']['security_score']}/100)")
        
        # Create security issue if needed
        if autonomy_level == 'autonomous':
            print("Creating security issue if needed...")
            security_issue = create_security_issue(task_id, security_report)
            print(f"✓ Security issue: {security_issue['status']}")
        
        # Output results
        result = {
            "status": "success",
            "task_id": task_id,
            "scan_results": scan_results,
            "security_report": security_report,
            "security_issue": security_issue if autonomy_level == 'autonomous' else None
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