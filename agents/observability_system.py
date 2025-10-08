#!/usr/bin/env python3
"""
Monitoring and Observability System for Multi-Agent Workforce
Handles metrics collection, logging, and system monitoring
"""

import os
import sys
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import threading
import psutil
import requests

# Add mcp_servers to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp_servers'))

@dataclass
class Metric:
    name: str
    value: float
    timestamp: str
    tags: Dict[str, str]
    agent_role: str
    task_id: str

@dataclass
class LogEntry:
    timestamp: str
    level: str
    agent_role: str
    task_id: str
    message: str
    context: Dict[str, Any]

class MetricsCollector:
    """Collects and stores metrics from agents"""
    
    def __init__(self, max_metrics: int = 10000):
        self.metrics = deque(maxlen=max_metrics)
        self.metric_counters = defaultdict(int)
        self.metric_aggregates = defaultdict(list)
        self.lock = threading.Lock()
    
    def record_metric(self, metric: Metric):
        """Record a new metric"""
        with self.lock:
            self.metrics.append(metric)
            self.metric_counters[metric.name] += 1
            
            # Update aggregates
            self.metric_aggregates[metric.name].append(metric.value)
            
            # Keep only last 100 values for aggregates
            if len(self.metric_aggregates[metric.name]) > 100:
                self.metric_aggregates[metric.name] = self.metric_aggregates[metric.name][-100:]
    
    def get_metric_summary(self, metric_name: str) -> Dict[str, Any]:
        """Get summary statistics for a metric"""
        with self.lock:
            values = self.metric_aggregates.get(metric_name, [])
            
            if not values:
                return {"count": 0, "avg": 0, "min": 0, "max": 0}
            
            return {
                "count": len(values),
                "avg": sum(values) / len(values),
                "min": min(values),
                "max": max(values),
                "latest": values[-1] if values else 0
            }
    
    def get_metrics_by_agent(self, agent_role: str) -> List[Metric]:
        """Get all metrics for a specific agent"""
        with self.lock:
            return [m for m in self.metrics if m.agent_role == agent_role]
    
    def get_metrics_by_task(self, task_id: str) -> List[Metric]:
        """Get all metrics for a specific task"""
        with self.lock:
            return [m for m in self.metrics if m.task_id == task_id]

class LogCollector:
    """Collects and stores logs from agents"""
    
    def __init__(self, max_logs: int = 5000):
        self.logs = deque(maxlen=max_logs)
        self.log_levels = defaultdict(int)
        self.lock = threading.Lock()
    
    def record_log(self, log_entry: LogEntry):
        """Record a new log entry"""
        with self.lock:
            self.logs.append(log_entry)
            self.log_levels[log_entry.level] += 1
    
    def get_logs_by_level(self, level: str) -> List[LogEntry]:
        """Get logs by level"""
        with self.lock:
            return [log for log in self.logs if log.level == level]
    
    def get_logs_by_agent(self, agent_role: str) -> List[LogEntry]:
        """Get logs by agent"""
        with self.lock:
            return [log for log in self.logs if log.agent_role == agent_role]
    
    def get_recent_logs(self, minutes: int = 10) -> List[LogEntry]:
        """Get recent logs within specified minutes"""
        cutoff_time = datetime.now() - timedelta(minutes=minutes)
        
        with self.lock:
            return [log for log in self.logs 
                   if datetime.fromisoformat(log.timestamp) > cutoff_time]

class SystemMonitor:
    """Monitors system resources and performance"""
    
    def __init__(self):
        self.cpu_history = deque(maxlen=60)  # 1 minute of data
        self.memory_history = deque(maxlen=60)
        self.disk_history = deque(maxlen=60)
        self.network_history = deque(maxlen=60)
    
    def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect current system metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            self.cpu_history.append(cpu_percent)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            self.memory_history.append(memory_percent)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            self.disk_history.append(disk_percent)
            
            # Network I/O
            network = psutil.net_io_counters()
            network_bytes = network.bytes_sent + network.bytes_recv
            self.network_history.append(network_bytes)
            
            return {
                "cpu_percent": cpu_percent,
                "memory_percent": memory_percent,
                "disk_percent": disk_percent,
                "network_bytes": network_bytes,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {"error": str(e), "timestamp": datetime.now().isoformat()}
    
    def get_system_trends(self) -> Dict[str, Any]:
        """Get system performance trends"""
        return {
            "cpu_trend": list(self.cpu_history),
            "memory_trend": list(self.memory_history),
            "disk_trend": list(self.disk_history),
            "network_trend": list(self.network_history)
        }

class AgentPerformanceMonitor:
    """Monitors agent performance and efficiency"""
    
    def __init__(self):
        self.agent_tasks = defaultdict(list)
        self.agent_performance = defaultdict(dict)
        self.task_durations = defaultdict(list)
    
    def record_task_start(self, agent_role: str, task_id: str):
        """Record when an agent starts a task"""
        self.agent_tasks[agent_role].append({
            "task_id": task_id,
            "start_time": datetime.now().isoformat(),
            "status": "started"
        })
    
    def record_task_completion(self, agent_role: str, task_id: str, 
                             success: bool, metrics: Dict[str, Any]):
        """Record when an agent completes a task"""
        # Find the task
        for task in self.agent_tasks[agent_role]:
            if task["task_id"] == task_id and task["status"] == "started":
                start_time = datetime.fromisoformat(task["start_time"])
                duration = (datetime.now() - start_time).total_seconds()
                
                task["end_time"] = datetime.now().isoformat()
                task["duration"] = duration
                task["status"] = "completed" if success else "failed"
                task["metrics"] = metrics
                
                # Record duration
                self.task_durations[agent_role].append(duration)
                
                # Update performance metrics
                self.update_performance_metrics(agent_role, duration, success, metrics)
                break
    
    def update_performance_metrics(self, agent_role: str, duration: float, 
                                  success: bool, metrics: Dict[str, Any]):
        """Update agent performance metrics"""
        if agent_role not in self.agent_performance:
            self.agent_performance[agent_role] = {
                "total_tasks": 0,
                "successful_tasks": 0,
                "failed_tasks": 0,
                "avg_duration": 0,
                "total_duration": 0
            }
        
        perf = self.agent_performance[agent_role]
        perf["total_tasks"] += 1
        perf["total_duration"] += duration
        perf["avg_duration"] = perf["total_duration"] / perf["total_tasks"]
        
        if success:
            perf["successful_tasks"] += 1
        else:
            perf["failed_tasks"] += 1
    
    def get_agent_performance(self, agent_role: str) -> Dict[str, Any]:
        """Get performance metrics for an agent"""
        return self.agent_performance.get(agent_role, {})
    
    def get_all_performance(self) -> Dict[str, Any]:
        """Get performance metrics for all agents"""
        return dict(self.agent_performance)

class ObservabilityDashboard:
    """Main observability dashboard"""
    
    def __init__(self):
        self.metrics_collector = MetricsCollector()
        self.log_collector = LogCollector()
        self.system_monitor = SystemMonitor()
        self.performance_monitor = AgentPerformanceMonitor()
        self.alerts = deque(maxlen=100)
        self.lock = threading.Lock()
    
    def record_metric(self, name: str, value: float, agent_role: str, 
                     task_id: str, tags: Dict[str, str] = None):
        """Record a metric"""
        metric = Metric(
            name=name,
            value=value,
            timestamp=datetime.now().isoformat(),
            tags=tags or {},
            agent_role=agent_role,
            task_id=task_id
        )
        self.metrics_collector.record_metric(metric)
    
    def record_log(self, level: str, message: str, agent_role: str, 
                  task_id: str, context: Dict[str, Any] = None):
        """Record a log entry"""
        log_entry = LogEntry(
            timestamp=datetime.now().isoformat(),
            level=level,
            agent_role=agent_role,
            task_id=task_id,
            message=message,
            context=context or {}
        )
        self.log_collector.record_log(log_entry)
    
    def record_task_start(self, agent_role: str, task_id: str):
        """Record task start"""
        self.performance_monitor.record_task_start(agent_role, task_id)
        self.record_log("INFO", f"Task {task_id} started", agent_role, task_id)
    
    def record_task_completion(self, agent_role: str, task_id: str, 
                              success: bool, metrics: Dict[str, Any]):
        """Record task completion"""
        self.performance_monitor.record_task_completion(agent_role, task_id, success, metrics)
        
        level = "INFO" if success else "ERROR"
        message = f"Task {task_id} {'completed' if success else 'failed'}"
        self.record_log(level, message, agent_role, task_id, metrics)
    
    def check_alerts(self) -> List[Dict[str, Any]]:
        """Check for alert conditions"""
        alerts = []
        
        # Check system metrics
        system_metrics = self.system_monitor.collect_system_metrics()
        
        if system_metrics.get("cpu_percent", 0) > 90:
            alerts.append({
                "type": "high_cpu",
                "severity": "warning",
                "message": f"High CPU usage: {system_metrics['cpu_percent']}%",
                "timestamp": datetime.now().isoformat()
            })
        
        if system_metrics.get("memory_percent", 0) > 90:
            alerts.append({
                "type": "high_memory",
                "severity": "warning", 
                "message": f"High memory usage: {system_metrics['memory_percent']}%",
                "timestamp": datetime.now().isoformat()
            })
        
        # Check agent performance
        performance = self.performance_monitor.get_all_performance()
        for agent_role, perf in performance.items():
            if perf.get("total_tasks", 0) > 0:
                success_rate = perf["successful_tasks"] / perf["total_tasks"]
                if success_rate < 0.8:  # Less than 80% success rate
                    alerts.append({
                        "type": "low_success_rate",
                        "severity": "error",
                        "message": f"Low success rate for {agent_role}: {success_rate:.2%}",
                        "timestamp": datetime.now().isoformat()
                    })
        
        # Store alerts
        with self.lock:
            for alert in alerts:
                self.alerts.append(alert)
        
        return alerts
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive dashboard data"""
        return {
            "timestamp": datetime.now().isoformat(),
            "system_metrics": self.system_monitor.collect_system_metrics(),
            "system_trends": self.system_monitor.get_system_trends(),
            "agent_performance": self.performance_monitor.get_all_performance(),
            "recent_logs": [asdict(log) for log in self.log_collector.get_recent_logs(10)],
            "alerts": list(self.alerts)[-10:],  # Last 10 alerts
            "metric_summaries": {
                name: self.metrics_collector.get_metric_summary(name)
                for name in ["task_duration", "success_rate", "error_count"]
            }
        }
    
    def export_metrics(self, format: str = "json") -> str:
        """Export metrics in specified format"""
        dashboard_data = self.get_dashboard_data()
        
        if format == "json":
            return json.dumps(dashboard_data, indent=2)
        elif format == "csv":
            # Convert to CSV format
            csv_lines = ["timestamp,agent_role,task_id,metric_name,metric_value"]
            
            for metric in self.metrics_collector.metrics:
                csv_lines.append(f"{metric.timestamp},{metric.agent_role},{metric.task_id},{metric.name},{metric.value}")
            
            return "\n".join(csv_lines)
        else:
            return str(dashboard_data)

# Global observability dashboard instance
observability_dashboard = ObservabilityDashboard()

def record_agent_metric(name: str, value: float, agent_role: str, task_id: str, tags: Dict[str, str] = None):
    """Record a metric for an agent"""
    observability_dashboard.record_metric(name, value, agent_role, task_id, tags)

def record_agent_log(level: str, message: str, agent_role: str, task_id: str, context: Dict[str, Any] = None):
    """Record a log entry for an agent"""
    observability_dashboard.record_log(level, message, agent_role, task_id, context)

def record_task_start(agent_role: str, task_id: str):
    """Record when an agent starts a task"""
    observability_dashboard.record_task_start(agent_role, task_id)

def record_task_completion(agent_role: str, task_id: str, success: bool, metrics: Dict[str, Any]):
    """Record when an agent completes a task"""
    observability_dashboard.record_task_completion(agent_role, task_id, success, metrics)

def get_dashboard_data() -> Dict[str, Any]:
    """Get current dashboard data"""
    return observability_dashboard.get_dashboard_data()

def check_and_report_alerts() -> List[Dict[str, Any]]:
    """Check for alerts and return them"""
    return observability_dashboard.check_alerts()

def start_monitoring_thread():
    """Start background monitoring thread"""
    def monitor():
        while True:
            try:
                # Collect system metrics
                observability_dashboard.system_monitor.collect_system_metrics()
                
                # Check for alerts
                alerts = observability_dashboard.check_alerts()
                if alerts:
                    print(f"Alerts detected: {len(alerts)}")
                    for alert in alerts:
                        print(f"  - {alert['severity'].upper()}: {alert['message']}")
                
                time.sleep(30)  # Check every 30 seconds
            except Exception as e:
                print(f"Error in monitoring thread: {e}")
                time.sleep(60)
    
    monitor_thread = threading.Thread(target=monitor, daemon=True)
    monitor_thread.start()
    return monitor_thread

def main():
    """Main observability system function"""
    print("Observability System starting...")
    
    # Start monitoring thread
    monitor_thread = start_monitoring_thread()
    print("✓ Monitoring thread started")
    
    # Test the system
    print("Testing observability system...")
    
    # Record some test metrics
    record_agent_metric("test_metric", 42.0, "engineer", "test-task", {"test": "true"})
    record_agent_log("INFO", "Test log message", "engineer", "test-task")
    
    # Record task start and completion
    record_task_start("engineer", "test-task")
    time.sleep(1)  # Simulate work
    record_task_completion("engineer", "test-task", True, {"duration": 1.0, "success": True})
    
    print("✓ Test metrics recorded")
    
    # Get dashboard data
    dashboard_data = get_dashboard_data()
    print(f"✓ Dashboard data collected: {len(dashboard_data)} sections")
    
    # Check for alerts
    alerts = check_and_report_alerts()
    print(f"✓ Alert check completed: {len(alerts)} alerts")
    
    # Export metrics
    metrics_json = observability_dashboard.export_metrics("json")
    print(f"✓ Metrics exported: {len(metrics_json)} characters")
    
    print("Observability system is running...")
    
    # Keep the system running
    try:
        while True:
            time.sleep(60)
            print(f"Observability system status: {len(observability_dashboard.metrics_collector.metrics)} metrics, {len(observability_dashboard.log_collector.logs)} logs")
    except KeyboardInterrupt:
        print("Shutting down observability system...")

if __name__ == "__main__":
    main()