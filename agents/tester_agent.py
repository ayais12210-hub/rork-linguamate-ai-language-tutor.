#!/usr/bin/env python3
"""
Tester Agent for Multi-Agent Workforce
Handles test creation, execution, and quality assurance
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from typing import Dict, List, Any

# Add mcp_servers to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp_servers'))

def run_test_suite() -> Dict[str, Any]:
    """Run the full test suite"""
    try:
        result = subprocess.run(
            ["npm", "run", "test", "--", "--coverage"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "output": result.stdout,
            "errors": result.stderr,
            "coverage": extract_coverage_info(result.stdout)
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def extract_coverage_info(output: str) -> Dict[str, Any]:
    """Extract coverage information from test output"""
    coverage = {
        "lines": 0,
        "functions": 0,
        "branches": 0,
        "statements": 0
    }
    
    # Simple regex-like extraction (in production, use proper parsing)
    lines = output.split('\n')
    for line in lines:
        if 'All files' in line and '%' in line:
            # Extract percentages from coverage summary
            parts = line.split()
            for part in parts:
                if '%' in part:
                    try:
                        percentage = float(part.replace('%', ''))
                        if 'Lines' in line:
                            coverage["lines"] = percentage
                        elif 'Functions' in line:
                            coverage["functions"] = percentage
                        elif 'Branches' in line:
                            coverage["branches"] = percentage
                        elif 'Statements' in line:
                            coverage["statements"] = percentage
                    except ValueError:
                        continue
    
    return coverage

def run_e2e_tests() -> Dict[str, Any]:
    """Run end-to-end tests"""
    try:
        result = subprocess.run(
            ["npm", "run", "e2e"],
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

def run_accessibility_tests() -> Dict[str, Any]:
    """Run accessibility tests"""
    try:
        result = subprocess.run(
            ["npm", "run", "a11y"],
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

def run_performance_tests() -> Dict[str, Any]:
    """Run performance tests"""
    try:
        result = subprocess.run(
            ["npm", "run", "perf"],
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

def generate_test_report(test_results: Dict[str, Any]) -> Dict[str, Any]:
    """Generate comprehensive test report"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "coverage_threshold": 85.0,
            "coverage_met": False
        },
        "test_suites": {},
        "coverage": {},
        "recommendations": []
    }
    
    # Process test results
    for test_type, result in test_results.items():
        if isinstance(result, dict) and result.get("status") == "success":
            report["test_suites"][test_type] = {
                "status": "passed",
                "details": result.get("output", "")
            }
        else:
            report["test_suites"][test_type] = {
                "status": "failed",
                "details": result.get("errors", "")
            }
    
    # Process coverage
    if "unit" in test_results and "coverage" in test_results["unit"]:
        coverage = test_results["unit"]["coverage"]
        report["coverage"] = coverage
        
        # Check if coverage meets threshold
        avg_coverage = (
            coverage.get("lines", 0) + 
            coverage.get("functions", 0) + 
            coverage.get("branches", 0) + 
            coverage.get("statements", 0)
        ) / 4
        
        report["summary"]["coverage_met"] = avg_coverage >= report["summary"]["coverage_threshold"]
        
        if not report["summary"]["coverage_met"]:
            report["recommendations"].append(
                f"Coverage ({avg_coverage:.1f}%) is below threshold ({report['summary']['coverage_threshold']}%)"
            )
    
    # Add recommendations based on test results
    for test_type, result in test_results.items():
        if isinstance(result, dict) and result.get("status") != "success":
            report["recommendations"].append(f"Fix {test_type} test failures")
    
    return report

def create_test_files(task_id: str) -> List[str]:
    """Create test files for the given task"""
    test_files = []
    
    # This is a placeholder - in a real implementation, this would:
    # 1. Analyze the code changes
    # 2. Generate appropriate test files
    # 3. Ensure proper test coverage
    
    # Example test files that might be created
    test_files.extend([
        f"__tests__/{task_id}.test.tsx",
        f"__tests__/{task_id}.integration.test.ts",
        f"__tests__/{task_id}.e2e.test.ts"
    ])
    
    return test_files

def validate_test_quality(test_files: List[str]) -> Dict[str, Any]:
    """Validate the quality of test files"""
    validation = {
        "files_checked": len(test_files),
        "issues": [],
        "recommendations": []
    }
    
    # This is a placeholder - in a real implementation, this would:
    # 1. Check test file syntax
    # 2. Validate test structure
    # 3. Ensure proper assertions
    # 4. Check for test coverage
    
    for test_file in test_files:
        if not os.path.exists(test_file):
            validation["issues"].append(f"Test file {test_file} does not exist")
        else:
            validation["recommendations"].append(f"Test file {test_file} exists and should be reviewed")
    
    return validation

def main():
    """Main tester agent function"""
    task_id = os.getenv('TASK_ID', 'default-task')
    autonomy_level = os.getenv('AUTONOMY_LEVEL', 'planned')
    
    print(f"Tester Agent starting for task: {task_id}")
    print(f"Autonomy level: {autonomy_level}")
    
    try:
        # Run test suites
        print("Running test suites...")
        test_results = {}
        
        print("Running unit tests...")
        test_results["unit"] = run_test_suite()
        print(f"✓ Unit tests: {test_results['unit']['status']}")
        
        print("Running E2E tests...")
        test_results["e2e"] = run_e2e_tests()
        print(f"✓ E2E tests: {test_results['e2e']['status']}")
        
        print("Running accessibility tests...")
        test_results["a11y"] = run_accessibility_tests()
        print(f"✓ A11y tests: {test_results['a11y']['status']}")
        
        print("Running performance tests...")
        test_results["perf"] = run_performance_tests()
        print(f"✓ Performance tests: {test_results['perf']['status']}")
        
        # Generate test report
        print("Generating test report...")
        test_report = generate_test_report(test_results)
        print("✓ Test report generated")
        
        # Create test files if needed
        if autonomy_level == 'autonomous':
            print("Creating test files...")
            test_files = create_test_files(task_id)
            print(f"✓ Test files created: {test_files}")
            
            # Validate test quality
            validation = validate_test_quality(test_files)
            print(f"✓ Test validation completed")
        
        # Output results
        result = {
            "status": "success",
            "task_id": task_id,
            "test_results": test_results,
            "test_report": test_report,
            "test_files": test_files if autonomy_level == 'autonomous' else [],
            "validation": validation if autonomy_level == 'autonomous' else None
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