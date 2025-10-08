#!/usr/bin/env python3
"""
Error Handling and Recovery System for Multi-Agent Workforce
Provides comprehensive error handling, recovery mechanisms, and fault tolerance
"""

import os
import sys
import json
import time
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import logging
from functools import wraps

# Add mcp_servers to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp_servers'))

class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class RecoveryStrategy(Enum):
    RETRY = "retry"
    FALLBACK = "fallback"
    ESCALATE = "escalate"
    SKIP = "skip"
    RESTART = "restart"

@dataclass
class ErrorContext:
    error_type: str
    error_message: str
    stack_trace: str
    agent_role: str
    task_id: str
    timestamp: str
    severity: ErrorSeverity
    context: Dict[str, Any]

@dataclass
class RecoveryAction:
    strategy: RecoveryStrategy
    description: str
    parameters: Dict[str, Any]
    success_probability: float
    estimated_duration: int  # seconds

class ErrorHandler:
    """Central error handling system"""
    
    def __init__(self):
        self.error_history = []
        self.recovery_strategies = {}
        self.circuit_breakers = {}
        self.retry_counts = {}
        self.max_retries = 3
        self.circuit_breaker_threshold = 5
        self.circuit_breaker_timeout = 300  # 5 minutes
        self.lock = threading.Lock()
        
        # Setup logging
        self.setup_logging()
    
    def setup_logging(self):
        """Setup error logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('agent_errors.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('ErrorHandler')
    
    def register_recovery_strategy(self, error_type: str, strategy: RecoveryStrategy, 
                                 handler: Callable, success_probability: float = 0.8):
        """Register a recovery strategy for a specific error type"""
        self.recovery_strategies[error_type] = {
            "strategy": strategy,
            "handler": handler,
            "success_probability": success_probability
        }
    
    def handle_error(self, error: Exception, agent_role: str, task_id: str, 
                    context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Handle an error and attempt recovery"""
        error_context = self.create_error_context(error, agent_role, task_id, context)
        
        with self.lock:
            self.error_history.append(error_context)
            
            # Log the error
            self.logger.error(f"Error in {agent_role} agent for task {task_id}: {str(error)}")
            
            # Check circuit breaker
            if self.is_circuit_breaker_open(agent_role, error_context.error_type):
                return self.handle_circuit_breaker_open(agent_role, error_context)
            
            # Attempt recovery
            recovery_result = self.attempt_recovery(error_context)
            
            # Update circuit breaker
            self.update_circuit_breaker(agent_role, error_context.error_type, recovery_result["success"])
            
            return recovery_result
    
    def create_error_context(self, error: Exception, agent_role: str, task_id: str, 
                           context: Dict[str, Any] = None) -> ErrorContext:
        """Create error context from exception"""
        error_type = type(error).__name__
        error_message = str(error)
        stack_trace = traceback.format_exc()
        
        # Determine severity based on error type
        severity = self.determine_error_severity(error_type, error_message)
        
        return ErrorContext(
            error_type=error_type,
            error_message=error_message,
            stack_trace=stack_trace,
            agent_role=agent_role,
            task_id=task_id,
            timestamp=datetime.now().isoformat(),
            severity=severity,
            context=context or {}
        )
    
    def determine_error_severity(self, error_type: str, error_message: str) -> ErrorSeverity:
        """Determine error severity based on type and message"""
        critical_errors = ["SystemExit", "KeyboardInterrupt", "MemoryError"]
        high_errors = ["ConnectionError", "TimeoutError", "FileNotFoundError"]
        medium_errors = ["ValueError", "TypeError", "KeyError"]
        
        if error_type in critical_errors:
            return ErrorSeverity.CRITICAL
        elif error_type in high_errors:
            return ErrorSeverity.HIGH
        elif error_type in medium_errors:
            return ErrorSeverity.MEDIUM
        else:
            return ErrorSeverity.LOW
    
    def attempt_recovery(self, error_context: ErrorContext) -> Dict[str, Any]:
        """Attempt to recover from an error"""
        error_type = error_context.error_type
        agent_role = error_context.agent_role
        task_id = error_context.task_id
        
        # Get recovery strategy
        strategy_info = self.recovery_strategies.get(error_type)
        
        if not strategy_info:
            # Default recovery strategy
            strategy_info = {
                "strategy": RecoveryStrategy.RETRY,
                "handler": self.default_retry_handler,
                "success_probability": 0.5
            }
        
        strategy = strategy_info["strategy"]
        handler = strategy_info["handler"]
        
        # Check retry count
        retry_key = f"{agent_role}_{task_id}_{error_type}"
        retry_count = self.retry_counts.get(retry_key, 0)
        
        if retry_count >= self.max_retries:
            return {
                "success": False,
                "strategy": "max_retries_exceeded",
                "message": f"Maximum retries ({self.max_retries}) exceeded",
                "recovery_action": None
            }
        
        # Attempt recovery
        try:
            recovery_result = handler(error_context)
            
            if recovery_result["success"]:
                # Reset retry count on success
                self.retry_counts[retry_key] = 0
            else:
                # Increment retry count on failure
                self.retry_counts[retry_key] = retry_count + 1
            
            return recovery_result
            
        except Exception as recovery_error:
            self.logger.error(f"Recovery attempt failed: {str(recovery_error)}")
            return {
                "success": False,
                "strategy": strategy.value,
                "message": f"Recovery failed: {str(recovery_error)}",
                "recovery_action": None
            }
    
    def default_retry_handler(self, error_context: ErrorContext) -> Dict[str, Any]:
        """Default retry handler"""
        return {
            "success": True,
            "strategy": "retry",
            "message": "Retrying operation",
            "recovery_action": RecoveryAction(
                strategy=RecoveryStrategy.RETRY,
                description="Retry the failed operation",
                parameters={"delay": 5},
                success_probability=0.6,
                estimated_duration=5
            )
        }
    
    def is_circuit_breaker_open(self, agent_role: str, error_type: str) -> bool:
        """Check if circuit breaker is open"""
        breaker_key = f"{agent_role}_{error_type}"
        breaker_info = self.circuit_breakers.get(breaker_key)
        
        if not breaker_info:
            return False
        
        # Check if timeout has passed
        if datetime.now() - breaker_info["opened_at"] > timedelta(seconds=self.circuit_breaker_timeout):
            # Reset circuit breaker
            del self.circuit_breakers[breaker_key]
            return False
        
        return breaker_info["is_open"]
    
    def update_circuit_breaker(self, agent_role: str, error_type: str, success: bool):
        """Update circuit breaker state"""
        breaker_key = f"{agent_role}_{error_type}"
        
        if breaker_key not in self.circuit_breakers:
            self.circuit_breakers[breaker_key] = {
                "failure_count": 0,
                "is_open": False,
                "opened_at": None
            }
        
        breaker_info = self.circuit_breakers[breaker_key]
        
        if success:
            # Reset failure count on success
            breaker_info["failure_count"] = 0
            breaker_info["is_open"] = False
        else:
            # Increment failure count
            breaker_info["failure_count"] += 1
            
            # Open circuit breaker if threshold exceeded
            if breaker_info["failure_count"] >= self.circuit_breaker_threshold:
                breaker_info["is_open"] = True
                breaker_info["opened_at"] = datetime.now()
                self.logger.warning(f"Circuit breaker opened for {agent_role} - {error_type}")
    
    def handle_circuit_breaker_open(self, agent_role: str, error_context: ErrorContext) -> Dict[str, Any]:
        """Handle when circuit breaker is open"""
        return {
            "success": False,
            "strategy": "circuit_breaker_open",
            "message": f"Circuit breaker is open for {agent_role} - {error_context.error_type}",
            "recovery_action": RecoveryAction(
                strategy=RecoveryStrategy.ESCALATE,
                description="Escalate to human operator",
                parameters={"escalation_level": "high"},
                success_probability=0.9,
                estimated_duration=300
            )
        }
    
    def get_error_statistics(self) -> Dict[str, Any]:
        """Get error statistics"""
        with self.lock:
            total_errors = len(self.error_history)
            
            if total_errors == 0:
                return {"total_errors": 0}
            
            # Count by severity
            severity_counts = {}
            for error in self.error_history:
                severity = error.severity.value
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            # Count by agent
            agent_counts = {}
            for error in self.error_history:
                agent = error.agent_role
                agent_counts[agent] = agent_counts.get(agent, 0) + 1
            
            # Count by error type
            error_type_counts = {}
            for error in self.error_history:
                error_type = error.error_type
                error_type_counts[error_type] = error_type_counts.get(error_type, 0) + 1
            
            # Recent errors (last hour)
            recent_cutoff = datetime.now() - timedelta(hours=1)
            recent_errors = [
                error for error in self.error_history
                if datetime.fromisoformat(error.timestamp) > recent_cutoff
            ]
            
            return {
                "total_errors": total_errors,
                "recent_errors": len(recent_errors),
                "severity_breakdown": severity_counts,
                "agent_breakdown": agent_counts,
                "error_type_breakdown": error_type_counts,
                "circuit_breakers_open": len([cb for cb in self.circuit_breakers.values() if cb["is_open"]]),
                "active_retry_counts": dict(self.retry_counts)
            }

# Global error handler instance
error_handler = ErrorHandler()

def error_handler_decorator(agent_role: str, task_id: str = None):
    """Decorator for automatic error handling"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # Handle the error
                recovery_result = error_handler.handle_error(e, agent_role, task_id or "unknown")
                
                if recovery_result["success"]:
                    # Retry the function if recovery was successful
                    recovery_action = recovery_result.get("recovery_action")
                    if recovery_action and recovery_action.strategy == RecoveryStrategy.RETRY:
                        time.sleep(recovery_action.parameters.get("delay", 5))
                        return func(*args, **kwargs)
                
                # If recovery failed or strategy doesn't involve retry, re-raise
                raise e
        
        return wrapper
    return decorator

def register_default_recovery_strategies():
    """Register default recovery strategies"""
    
    def connection_error_handler(error_context: ErrorContext) -> Dict[str, Any]:
        """Handle connection errors"""
        return {
            "success": True,
            "strategy": "retry_with_backoff",
            "message": "Retrying connection with exponential backoff",
            "recovery_action": RecoveryAction(
                strategy=RecoveryStrategy.RETRY,
                description="Retry connection with exponential backoff",
                parameters={"delay": 10, "max_delay": 60},
                success_probability=0.7,
                estimated_duration=10
            )
        }
    
    def file_not_found_handler(error_context: ErrorContext) -> Dict[str, Any]:
        """Handle file not found errors"""
        return {
            "success": True,
            "strategy": "fallback",
            "message": "Using fallback file or creating missing file",
            "recovery_action": RecoveryAction(
                strategy=RecoveryStrategy.FALLBACK,
                description="Use fallback file or create missing file",
                parameters={"fallback_file": "default.txt"},
                success_probability=0.8,
                estimated_duration=5
            )
        }
    
    def timeout_handler(error_context: ErrorContext) -> Dict[str, Any]:
        """Handle timeout errors"""
        return {
            "success": True,
            "strategy": "retry_with_increased_timeout",
            "message": "Retrying with increased timeout",
            "recovery_action": RecoveryAction(
                strategy=RecoveryStrategy.RETRY,
                description="Retry with increased timeout",
                parameters={"timeout": 60},
                success_probability=0.6,
                estimated_duration=60
            )
        }
    
    def memory_error_handler(error_context: ErrorContext) -> Dict[str, Any]:
        """Handle memory errors"""
        return {
            "success": False,
            "strategy": "escalate",
            "message": "Memory error requires immediate attention",
            "recovery_action": RecoveryAction(
                strategy=RecoveryStrategy.ESCALATE,
                description="Escalate to system administrator",
                parameters={"escalation_level": "critical"},
                success_probability=0.9,
                estimated_duration=300
            )
        }
    
    # Register strategies
    error_handler.register_recovery_strategy("ConnectionError", RecoveryStrategy.RETRY, connection_error_handler)
    error_handler.register_recovery_strategy("FileNotFoundError", RecoveryStrategy.FALLBACK, file_not_found_handler)
    error_handler.register_recovery_strategy("TimeoutError", RecoveryStrategy.RETRY, timeout_handler)
    error_handler.register_recovery_strategy("MemoryError", RecoveryStrategy.ESCALATE, memory_error_handler)

def create_error_report() -> Dict[str, Any]:
    """Create comprehensive error report"""
    stats = error_handler.get_error_statistics()
    
    return {
        "report_type": "error_analysis",
        "generated_at": datetime.now().isoformat(),
        "summary": stats,
        "recommendations": generate_error_recommendations(stats),
        "circuit_breaker_status": {
            breaker_key: {
                "is_open": breaker_info["is_open"],
                "failure_count": breaker_info["failure_count"],
                "opened_at": breaker_info["opened_at"].isoformat() if breaker_info["opened_at"] else None
            }
            for breaker_key, breaker_info in error_handler.circuit_breakers.items()
        }
    }

def generate_error_recommendations(stats: Dict[str, Any]) -> List[str]:
    """Generate recommendations based on error statistics"""
    recommendations = []
    
    if stats["total_errors"] > 100:
        recommendations.append("High error count detected - consider system stability review")
    
    if stats["recent_errors"] > 10:
        recommendations.append("Recent error spike detected - investigate recent changes")
    
    if stats["circuit_breakers_open"] > 0:
        recommendations.append(f"{stats['circuit_breakers_open']} circuit breakers are open - manual intervention may be required")
    
    # Check for specific error patterns
    error_type_counts = stats.get("error_type_breakdown", {})
    for error_type, count in error_type_counts.items():
        if count > 20:
            recommendations.append(f"High frequency of {error_type} errors - consider preventive measures")
    
    return recommendations

def main():
    """Main error handling system function"""
    print("Error Handling and Recovery System starting...")
    
    # Register default recovery strategies
    register_default_recovery_strategies()
    print("✓ Default recovery strategies registered")
    
    # Test error handling
    print("Testing error handling...")
    
    @error_handler_decorator("test_agent", "test_task")
    def test_function():
        raise ConnectionError("Test connection error")
    
    try:
        test_function()
    except Exception as e:
        print(f"✓ Error handling test completed: {str(e)}")
    
    # Get error statistics
    stats = error_handler.get_error_statistics()
    print(f"✓ Error statistics: {stats['total_errors']} total errors")
    
    # Generate error report
    report = create_error_report()
    print(f"✓ Error report generated: {len(report)} sections")
    
    print("Error handling and recovery system is running...")
    
    # Keep the system running
    try:
        while True:
            time.sleep(60)
            stats = error_handler.get_error_statistics()
            print(f"Error handling status: {stats['total_errors']} errors, {stats['circuit_breakers_open']} circuit breakers open")
    except KeyboardInterrupt:
        print("Shutting down error handling system...")

if __name__ == "__main__":
    main()