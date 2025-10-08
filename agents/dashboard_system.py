#!/usr/bin/env python3
"""
Agent Dashboard and Reporting System
Provides web-based dashboard and comprehensive reporting for the multi-agent workforce
"""

import os
import sys
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

# Add mcp_servers to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp_servers'))

# Import observability system
from observability_system import observability_dashboard, get_dashboard_data, check_and_report_alerts

@dataclass
class DashboardConfig:
    port: int = 8080
    refresh_interval: int = 30  # seconds
    max_history_days: int = 7
    enable_alerts: bool = True
    enable_export: bool = True

class AgentDashboardHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the agent dashboard"""
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        if path == '/':
            self.serve_dashboard()
        elif path == '/api/dashboard':
            self.serve_dashboard_data()
        elif path == '/api/metrics':
            self.serve_metrics()
        elif path == '/api/logs':
            self.serve_logs()
        elif path == '/api/alerts':
            self.serve_alerts()
        elif path == '/api/agents':
            self.serve_agent_status()
        elif path == '/api/export':
            self.serve_export()
        elif path.startswith('/static/'):
            self.serve_static_file(path)
        else:
            self.send_error(404, "Not Found")
    
    def serve_dashboard(self):
        """Serve the main dashboard HTML"""
        html_content = self.generate_dashboard_html()
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html_content.encode())
    
    def serve_dashboard_data(self):
        """Serve dashboard data as JSON"""
        try:
            dashboard_data = get_dashboard_data()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(dashboard_data, indent=2).encode())
        except Exception as e:
            self.send_error(500, f"Error getting dashboard data: {str(e)}")
    
    def serve_metrics(self):
        """Serve metrics data"""
        try:
            metrics_data = {
                "metrics": [asdict(metric) for metric in observability_dashboard.metrics_collector.metrics],
                "summaries": {
                    name: observability_dashboard.metrics_collector.get_metric_summary(name)
                    for name in ["task_duration", "success_rate", "error_count"]
                }
            }
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(metrics_data, indent=2).encode())
        except Exception as e:
            self.send_error(500, f"Error getting metrics: {str(e)}")
    
    def serve_logs(self):
        """Serve logs data"""
        try:
            logs_data = {
                "logs": [asdict(log) for log in observability_dashboard.log_collector.logs],
                "recent_logs": [asdict(log) for log in observability_dashboard.log_collector.get_recent_logs(50)]
            }
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(logs_data, indent=2).encode())
        except Exception as e:
            self.send_error(500, f"Error getting logs: {str(e)}")
    
    def serve_alerts(self):
        """Serve alerts data"""
        try:
            alerts_data = {
                "alerts": list(observability_dashboard.alerts),
                "recent_alerts": list(observability_dashboard.alerts)[-20:]
            }
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(alerts_data, indent=2).encode())
        except Exception as e:
            self.send_error(500, f"Error getting alerts: {str(e)}")
    
    def serve_agent_status(self):
        """Serve agent status data"""
        try:
            agent_status = observability_dashboard.performance_monitor.get_all_performance()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(agent_status, indent=2).encode())
        except Exception as e:
            self.send_error(500, f"Error getting agent status: {str(e)}")
    
    def serve_export(self):
        """Serve exported data"""
        try:
            query_params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            export_format = query_params.get('format', ['json'])[0]
            
            exported_data = observability_dashboard.export_metrics(export_format)
            
            self.send_response(200)
            if export_format == 'json':
                self.send_header('Content-type', 'application/json')
            elif export_format == 'csv':
                self.send_header('Content-type', 'text/csv')
            else:
                self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(exported_data.encode())
        except Exception as e:
            self.send_error(500, f"Error exporting data: {str(e)}")
    
    def serve_static_file(self, path):
        """Serve static files"""
        # This would serve CSS, JS, and other static files
        self.send_error(404, "Static files not implemented")
    
    def generate_dashboard_html(self) -> str:
        """Generate the main dashboard HTML"""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent Dashboard - Linguamate AI Tutor</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        .header {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }}
        .card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .card h3 {{
            margin-top: 0;
            color: #333;
        }}
        .metric {{
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
        }}
        .metric-value {{
            font-weight: bold;
            color: #007bff;
        }}
        .alert {{
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid;
        }}
        .alert-warning {{
            background: #fff3cd;
            border-color: #ffc107;
            color: #856404;
        }}
        .alert-error {{
            background: #f8d7da;
            border-color: #dc3545;
            color: #721c24;
        }}
        .status-indicator {{
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }}
        .status-active {{
            background: #28a745;
        }}
        .status-inactive {{
            background: #dc3545;
        }}
        .refresh-btn {{
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 20px;
        }}
        .refresh-btn:hover {{
            background: #0056b3;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Agent Dashboard</h1>
            <p>Multi-Agent Workforce Monitoring - Linguamate AI Tutor</p>
            <button class="refresh-btn" onclick="refreshDashboard()">Refresh</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>System Metrics</h3>
                <div id="system-metrics">
                    <div class="metric">
                        <span>CPU Usage</span>
                        <span class="metric-value" id="cpu-usage">Loading...</span>
                    </div>
                    <div class="metric">
                        <span>Memory Usage</span>
                        <span class="metric-value" id="memory-usage">Loading...</span>
                    </div>
                    <div class="metric">
                        <span>Disk Usage</span>
                        <span class="metric-value" id="disk-usage">Loading...</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>Agent Performance</h3>
                <div id="agent-performance">
                    <p>Loading agent performance data...</p>
                </div>
            </div>
            
            <div class="card">
                <h3>Recent Alerts</h3>
                <div id="recent-alerts">
                    <p>Loading alerts...</p>
                </div>
            </div>
            
            <div class="card">
                <h3>Task Statistics</h3>
                <div id="task-stats">
                    <div class="metric">
                        <span>Total Tasks</span>
                        <span class="metric-value" id="total-tasks">Loading...</span>
                    </div>
                    <div class="metric">
                        <span>Success Rate</span>
                        <span class="metric-value" id="success-rate">Loading...</span>
                    </div>
                    <div class="metric">
                        <span>Avg Duration</span>
                        <span class="metric-value" id="avg-duration">Loading...</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>Recent Logs</h3>
                <div id="recent-logs" style="max-height: 300px; overflow-y: auto;">
                    <p>Loading recent logs...</p>
                </div>
            </div>
            
            <div class="card">
                <h3>Quick Actions</h3>
                <div>
                    <button class="refresh-btn" onclick="exportData('json')">Export JSON</button>
                    <button class="refresh-btn" onclick="exportData('csv')">Export CSV</button>
                    <button class="refresh-btn" onclick="checkAlerts()">Check Alerts</button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function refreshDashboard() {{
            fetch('/api/dashboard')
                .then(response => response.json())
                .then(data => {{
                    updateSystemMetrics(data.system_metrics);
                    updateAgentPerformance(data.agent_performance);
                    updateTaskStats(data.agent_performance);
                    updateRecentLogs(data.recent_logs);
                }})
                .catch(error => console.error('Error:', error));
        }}
        
        function updateSystemMetrics(metrics) {{
            document.getElementById('cpu-usage').textContent = metrics.cpu_percent?.toFixed(1) + '%' || 'N/A';
            document.getElementById('memory-usage').textContent = metrics.memory_percent?.toFixed(1) + '%' || 'N/A';
            document.getElementById('disk-usage').textContent = metrics.disk_percent?.toFixed(1) + '%' || 'N/A';
        }}
        
        function updateAgentPerformance(performance) {{
            const container = document.getElementById('agent-performance');
            container.innerHTML = '';
            
            for (const [agent, data] of Object.entries(performance)) {{
                const div = document.createElement('div');
                div.className = 'metric';
                div.innerHTML = `
                    <span><span class="status-indicator status-active"></span>${{agent}}</span>
                    <span class="metric-value">${{data.total_tasks || 0}} tasks</span>
                `;
                container.appendChild(div);
            }}
        }}
        
        function updateTaskStats(performance) {{
            let totalTasks = 0;
            let totalSuccessful = 0;
            let totalDuration = 0;
            
            for (const data of Object.values(performance)) {{
                totalTasks += data.total_tasks || 0;
                totalSuccessful += data.successful_tasks || 0;
                totalDuration += data.total_duration || 0;
            }}
            
            document.getElementById('total-tasks').textContent = totalTasks;
            document.getElementById('success-rate').textContent = 
                totalTasks > 0 ? ((totalSuccessful / totalTasks) * 100).toFixed(1) + '%' : 'N/A';
            document.getElementById('avg-duration').textContent = 
                totalTasks > 0 ? (totalDuration / totalTasks).toFixed(1) + 's' : 'N/A';
        }}
        
        function updateRecentLogs(logs) {{
            const container = document.getElementById('recent-logs');
            container.innerHTML = '';
            
            logs.slice(0, 10).forEach(log => {{
                const div = document.createElement('div');
                div.style.padding = '5px';
                div.style.borderBottom = '1px solid #eee';
                div.innerHTML = `
                    <strong>${{log.agent_role}}</strong> [${{log.level}}] ${{log.message}}
                    <br><small>${{new Date(log.timestamp).toLocaleString()}}</small>
                `;
                container.appendChild(div);
            }});
        }}
        
        function exportData(format) {{
            window.open(`/api/export?format=${{format}}`, '_blank');
        }}
        
        function checkAlerts() {{
            fetch('/api/alerts')
                .then(response => response.json())
                .then(data => {{
                    updateRecentAlerts(data.recent_alerts);
                }})
                .catch(error => console.error('Error:', error));
        }}
        
        function updateRecentAlerts(alerts) {{
            const container = document.getElementById('recent-alerts');
            container.innerHTML = '';
            
            if (alerts.length === 0) {{
                container.innerHTML = '<p>No recent alerts</p>';
                return;
            }}
            
            alerts.forEach(alert => {{
                const div = document.createElement('div');
                div.className = `alert alert-${{alert.severity === 'error' ? 'error' : 'warning'}}`;
                div.innerHTML = `
                    <strong>${{alert.type}}</strong><br>
                    ${{alert.message}}<br>
                    <small>${{new Date(alert.timestamp).toLocaleString()}}</small>
                `;
                container.appendChild(div);
            }});
        }}
        
        // Auto-refresh every 30 seconds
        setInterval(refreshDashboard, 30000);
        
        // Initial load
        refreshDashboard();
    </script>
</body>
</html>"""

class ReportGenerator:
    """Generates comprehensive reports for the multi-agent system"""
    
    def __init__(self):
        self.report_templates = {
            "daily": self.generate_daily_report,
            "weekly": self.generate_weekly_report,
            "task_summary": self.generate_task_summary_report,
            "performance": self.generate_performance_report,
            "security": self.generate_security_report
        }
    
    def generate_daily_report(self) -> Dict[str, Any]:
        """Generate daily report"""
        dashboard_data = get_dashboard_data()
        
        return {
            "report_type": "daily",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "summary": {
                "total_tasks": sum(data.get("total_tasks", 0) for data in dashboard_data["agent_performance"].values()),
                "successful_tasks": sum(data.get("successful_tasks", 0) for data in dashboard_data["agent_performance"].values()),
                "failed_tasks": sum(data.get("failed_tasks", 0) for data in dashboard_data["agent_performance"].values()),
                "avg_duration": self.calculate_average_duration(dashboard_data["agent_performance"])
            },
            "agent_performance": dashboard_data["agent_performance"],
            "system_metrics": dashboard_data["system_metrics"],
            "alerts": dashboard_data["alerts"],
            "recommendations": self.generate_recommendations(dashboard_data)
        }
    
    def generate_weekly_report(self) -> Dict[str, Any]:
        """Generate weekly report"""
        # This would aggregate data over the past week
        daily_reports = []
        for i in range(7):
            # In a real implementation, this would load historical data
            daily_reports.append(self.generate_daily_report())
        
        return {
            "report_type": "weekly",
            "week_start": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
            "week_end": datetime.now().strftime("%Y-%m-%d"),
            "summary": self.aggregate_weekly_summary(daily_reports),
            "daily_breakdown": daily_reports,
            "trends": self.analyze_trends(daily_reports),
            "recommendations": self.generate_weekly_recommendations(daily_reports)
        }
    
    def generate_task_summary_report(self, task_id: str) -> Dict[str, Any]:
        """Generate task-specific summary report"""
        # Get metrics for specific task
        task_metrics = observability_dashboard.metrics_collector.get_metrics_by_task(task_id)
        task_logs = [log for log in observability_dashboard.log_collector.logs if log.task_id == task_id]
        
        return {
            "report_type": "task_summary",
            "task_id": task_id,
            "generated_at": datetime.now().isoformat(),
            "metrics": [asdict(metric) for metric in task_metrics],
            "logs": [asdict(log) for log in task_logs],
            "summary": {
                "total_metrics": len(task_metrics),
                "total_logs": len(task_logs),
                "duration": self.calculate_task_duration(task_metrics),
                "status": self.determine_task_status(task_logs)
            }
        }
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate performance analysis report"""
        dashboard_data = get_dashboard_data()
        performance = dashboard_data["agent_performance"]
        
        return {
            "report_type": "performance",
            "generated_at": datetime.now().isoformat(),
            "agent_analysis": {
                agent: {
                    "efficiency_score": self.calculate_efficiency_score(data),
                    "reliability_score": self.calculate_reliability_score(data),
                    "productivity_score": self.calculate_productivity_score(data),
                    "recommendations": self.generate_agent_recommendations(agent, data)
                }
                for agent, data in performance.items()
            },
            "system_performance": {
                "cpu_efficiency": dashboard_data["system_metrics"].get("cpu_percent", 0),
                "memory_efficiency": dashboard_data["system_metrics"].get("memory_percent", 0),
                "overall_score": self.calculate_system_score(dashboard_data["system_metrics"])
            },
            "recommendations": self.generate_performance_recommendations(performance)
        }
    
    def generate_security_report(self) -> Dict[str, Any]:
        """Generate security assessment report"""
        # This would integrate with the security agent's findings
        return {
            "report_type": "security",
            "generated_at": datetime.now().isoformat(),
            "security_score": 85,  # Placeholder
            "vulnerabilities": [],  # Would be populated by security agent
            "recommendations": [
                "Regular security scans recommended",
                "Update dependencies regularly",
                "Monitor for hardcoded secrets"
            ]
        }
    
    def calculate_average_duration(self, performance: Dict[str, Any]) -> float:
        """Calculate average task duration across all agents"""
        total_duration = sum(data.get("total_duration", 0) for data in performance.values())
        total_tasks = sum(data.get("total_tasks", 0) for data in performance.values())
        return total_duration / total_tasks if total_tasks > 0 else 0
    
    def calculate_efficiency_score(self, agent_data: Dict[str, Any]) -> float:
        """Calculate efficiency score for an agent"""
        if agent_data.get("total_tasks", 0) == 0:
            return 0
        
        success_rate = agent_data.get("successful_tasks", 0) / agent_data.get("total_tasks", 0)
        avg_duration = agent_data.get("avg_duration", 0)
        
        # Efficiency based on success rate and duration (lower duration = higher efficiency)
        efficiency = success_rate * 100
        if avg_duration > 0:
            efficiency *= (1 / (1 + avg_duration / 60))  # Normalize duration
        
        return min(efficiency, 100)
    
    def calculate_reliability_score(self, agent_data: Dict[str, Any]) -> float:
        """Calculate reliability score for an agent"""
        if agent_data.get("total_tasks", 0) == 0:
            return 0
        
        return (agent_data.get("successful_tasks", 0) / agent_data.get("total_tasks", 0)) * 100
    
    def calculate_productivity_score(self, agent_data: Dict[str, Any]) -> float:
        """Calculate productivity score for an agent"""
        return agent_data.get("total_tasks", 0) * 10  # Simple scoring based on task count
    
    def generate_recommendations(self, dashboard_data: Dict[str, Any]) -> List[str]:
        """Generate general recommendations based on dashboard data"""
        recommendations = []
        
        performance = dashboard_data["agent_performance"]
        
        # Check for low success rates
        for agent, data in performance.items():
            if data.get("total_tasks", 0) > 0:
                success_rate = data.get("successful_tasks", 0) / data.get("total_tasks", 0)
                if success_rate < 0.8:
                    recommendations.append(f"Improve success rate for {agent} agent")
        
        # Check system metrics
        system_metrics = dashboard_data["system_metrics"]
        if system_metrics.get("cpu_percent", 0) > 80:
            recommendations.append("Consider optimizing CPU usage")
        
        if system_metrics.get("memory_percent", 0) > 80:
            recommendations.append("Consider optimizing memory usage")
        
        return recommendations

def start_dashboard_server(config: DashboardConfig):
    """Start the dashboard HTTP server"""
    server = HTTPServer(('localhost', config.port), AgentDashboardHandler)
    print(f"Agent Dashboard starting on http://localhost:{config.port}")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Shutting down dashboard server...")
        server.shutdown()

def main():
    """Main dashboard and reporting system function"""
    print("Agent Dashboard and Reporting System starting...")
    
    # Configuration
    config = DashboardConfig()
    
    # Start dashboard server in a separate thread
    dashboard_thread = threading.Thread(
        target=start_dashboard_server, 
        args=(config,),
        daemon=True
    )
    dashboard_thread.start()
    
    print("✓ Dashboard server started")
    
    # Test report generation
    print("Testing report generation...")
    report_generator = ReportGenerator()
    
    # Generate sample reports
    daily_report = report_generator.generate_daily_report()
    print(f"✓ Daily report generated: {len(daily_report)} sections")
    
    performance_report = report_generator.generate_performance_report()
    print(f"✓ Performance report generated: {len(performance_report)} sections")
    
    print("Dashboard and reporting system is running...")
    print(f"Access the dashboard at: http://localhost:{config.port}")
    
    # Keep the system running
    try:
        while True:
            time.sleep(60)
            print(f"Dashboard status: Server running on port {config.port}")
    except KeyboardInterrupt:
        print("Shutting down dashboard and reporting system...")

if __name__ == "__main__":
    main()