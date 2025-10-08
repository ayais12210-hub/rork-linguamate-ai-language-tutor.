#!/usr/bin/env python3
"""
Advanced Analytics and Insights Dashboard
Provides comprehensive analytics, insights, and predictive capabilities for the multi-agent workforce
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import threading
import time
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.offline as pyo
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib

# Add mcp_servers to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp_servers'))

@dataclass
class AnalyticsMetric:
    """Represents an analytics metric"""
    metric_name: str
    value: float
    timestamp: str
    category: str
    agent_role: str
    task_id: str
    metadata: Dict[str, Any]

@dataclass
class Insight:
    """Represents an analytical insight"""
    insight_id: str
    insight_type: str  # 'trend', 'anomaly', 'prediction', 'recommendation'
    title: str
    description: str
    confidence: float
    impact: str  # 'low', 'medium', 'high', 'critical'
    actionable: bool
    recommendations: List[str]
    generated_at: str

@dataclass
class PerformancePrediction:
    """Represents a performance prediction"""
    prediction_type: str
    target_metric: str
    predicted_value: float
    confidence_interval: Tuple[float, float]
    prediction_horizon: str
    factors: List[str]
    generated_at: str

class DataCollector:
    """Collects and aggregates data for analytics"""
    
    def __init__(self):
        self.metrics_data = []
        self.task_data = []
        self.agent_data = []
        self.system_data = []
        self.lock = threading.Lock()
    
    def collect_metric(self, metric: AnalyticsMetric):
        """Collect a metric"""
        with self.lock:
            self.metrics_data.append(metric)
    
    def collect_task_data(self, task_data: Dict[str, Any]):
        """Collect task completion data"""
        with self.lock:
            self.task_data.append(task_data)
    
    def collect_agent_data(self, agent_data: Dict[str, Any]):
        """Collect agent performance data"""
        with self.lock:
            self.agent_data.append(agent_data)
    
    def collect_system_data(self, system_data: Dict[str, Any]):
        """Collect system performance data"""
        with self.lock:
            self.system_data.append(system_data)
    
    def get_dataframe(self, data_type: str) -> pd.DataFrame:
        """Get data as pandas DataFrame"""
        with self.lock:
            if data_type == 'metrics':
                return pd.DataFrame([asdict(m) for m in self.metrics_data])
            elif data_type == 'tasks':
                return pd.DataFrame(self.task_data)
            elif data_type == 'agents':
                return pd.DataFrame(self.agent_data)
            elif data_type == 'system':
                return pd.DataFrame(self.system_data)
            else:
                return pd.DataFrame()

class TrendAnalyzer:
    """Analyzes trends in the data"""
    
    def __init__(self):
        self.trend_models = {}
        self.trend_cache = {}
    
    def analyze_trends(self, df: pd.DataFrame, metric_column: str, time_column: str = 'timestamp') -> Dict[str, Any]:
        """Analyze trends in a metric"""
        if df.empty or metric_column not in df.columns:
            return {"trend": "no_data", "slope": 0, "confidence": 0}
        
        # Convert timestamp to datetime if needed
        if time_column in df.columns:
            df[time_column] = pd.to_datetime(df[time_column])
            df = df.sort_values(time_column)
        
        # Calculate trend using linear regression
        x = np.arange(len(df))
        y = df[metric_column].values
        
        if len(y) < 2:
            return {"trend": "insufficient_data", "slope": 0, "confidence": 0}
        
        # Fit linear regression
        model = LinearRegression()
        model.fit(x.reshape(-1, 1), y)
        
        slope = model.coef_[0]
        r2 = model.score(x.reshape(-1, 1), y)
        
        # Determine trend direction
        if slope > 0.1:
            trend = "increasing"
        elif slope < -0.1:
            trend = "decreasing"
        else:
            trend = "stable"
        
        return {
            "trend": trend,
            "slope": slope,
            "confidence": r2,
            "r_squared": r2,
            "data_points": len(df)
        }
    
    def detect_anomalies(self, df: pd.DataFrame, metric_column: str) -> List[Dict[str, Any]]:
        """Detect anomalies in metric data"""
        if df.empty or metric_column not in df.columns:
            return []
        
        values = df[metric_column].values
        
        if len(values) < 3:
            return []
        
        # Simple anomaly detection using IQR method
        q1 = np.percentile(values, 25)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1
        
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        anomalies = []
        for i, value in enumerate(values):
            if value < lower_bound or value > upper_bound:
                anomalies.append({
                    "index": i,
                    "value": value,
                    "timestamp": df.iloc[i].get('timestamp', 'unknown'),
                    "severity": "high" if abs(value - np.mean(values)) > 2 * np.std(values) else "medium"
                })
        
        return anomalies
    
    def calculate_seasonality(self, df: pd.DataFrame, metric_column: str, time_column: str = 'timestamp') -> Dict[str, Any]:
        """Calculate seasonality patterns"""
        if df.empty or metric_column not in df.columns or time_column not in df.columns:
            return {"seasonality": "no_data"}
        
        df[time_column] = pd.to_datetime(df[time_column])
        df['hour'] = df[time_column].dt.hour
        df['day_of_week'] = df[time_column].dt.dayofweek
        
        # Calculate hourly patterns
        hourly_avg = df.groupby('hour')[metric_column].mean()
        hourly_std = df.groupby('hour')[metric_column].std()
        
        # Calculate daily patterns
        daily_avg = df.groupby('day_of_week')[metric_column].mean()
        daily_std = df.groupby('day_of_week')[metric_column].std()
        
        return {
            "hourly_pattern": hourly_avg.to_dict(),
            "daily_pattern": daily_avg.to_dict(),
            "hourly_variability": hourly_std.to_dict(),
            "daily_variability": daily_std.to_dict()
        }

class PredictiveAnalytics:
    """Provides predictive analytics capabilities"""
    
    def __init__(self):
        self.prediction_models = {}
        self.prediction_cache = {}
    
    def predict_performance(self, df: pd.DataFrame, target_metric: str, 
                           features: List[str], horizon: str = 'next_week') -> PerformancePrediction:
        """Predict future performance"""
        if df.empty or target_metric not in df.columns:
            return PerformancePrediction(
                prediction_type="insufficient_data",
                target_metric=target_metric,
                predicted_value=0,
                confidence_interval=(0, 0),
                prediction_horizon=horizon,
                factors=[],
                generated_at=datetime.now().isoformat()
            )
        
        # Prepare data
        available_features = [f for f in features if f in df.columns]
        if not available_features:
            available_features = [target_metric]  # Use target metric as feature
        
        X = df[available_features].values
        y = df[target_metric].values
        
        if len(X) < 5:
            return PerformancePrediction(
                prediction_type="insufficient_data",
                target_metric=target_metric,
                predicted_value=np.mean(y) if len(y) > 0 else 0,
                confidence_interval=(0, 0),
                prediction_horizon=horizon,
                factors=available_features,
                generated_at=datetime.now().isoformat()
            )
        
        # Train model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        # Make prediction
        latest_features = X[-1].reshape(1, -1)
        prediction = model.predict(latest_features)[0]
        
        # Calculate confidence interval (simplified)
        predictions = model.predict(X)
        mse = mean_squared_error(y, predictions)
        std_error = np.sqrt(mse)
        
        confidence_interval = (
            prediction - 1.96 * std_error,
            prediction + 1.96 * std_error
        )
        
        return PerformancePrediction(
            prediction_type="performance_prediction",
            target_metric=target_metric,
            predicted_value=prediction,
            confidence_interval=confidence_interval,
            prediction_horizon=horizon,
            factors=available_features,
            generated_at=datetime.now().isoformat()
        )
    
    def predict_task_success(self, task_features: Dict[str, Any]) -> Dict[str, Any]:
        """Predict task success probability"""
        # Simple heuristic-based prediction
        success_factors = []
        
        # Category-based success rates
        category_success_rates = {
            'bugs': 0.85,
            'features': 0.75,
            'security': 0.80,
            'maintenance': 0.90,
            'docs': 0.95
        }
        
        base_success_rate = category_success_rates.get(task_features.get('category', 'unknown'), 0.70)
        
        # Adjust based on complexity
        complexity = task_features.get('complexity', 'medium')
        if complexity == 'low':
            base_success_rate += 0.1
        elif complexity == 'high':
            base_success_rate -= 0.15
        
        # Adjust based on agent experience
        agent_experience = task_features.get('agent_experience', 0.5)
        base_success_rate += (agent_experience - 0.5) * 0.2
        
        # Adjust based on dependencies
        dependencies = task_features.get('dependencies', 0)
        if dependencies > 3:
            base_success_rate -= 0.1
        
        success_rate = max(0.1, min(0.95, base_success_rate))
        
        return {
            "success_probability": success_rate,
            "confidence": 0.7,
            "factors": success_factors,
            "recommendations": self.generate_success_recommendations(task_features)
        }
    
    def generate_success_recommendations(self, task_features: Dict[str, Any]) -> List[str]:
        """Generate recommendations to improve success probability"""
        recommendations = []
        
        complexity = task_features.get('complexity', 'medium')
        if complexity == 'high':
            recommendations.append("Break down complex task into smaller subtasks")
        
        dependencies = task_features.get('dependencies', 0)
        if dependencies > 3:
            recommendations.append("Reduce dependencies or plan dependency resolution")
        
        agent_experience = task_features.get('agent_experience', 0.5)
        if agent_experience < 0.6:
            recommendations.append("Assign to more experienced agent or provide additional support")
        
        return recommendations

class InsightGenerator:
    """Generates insights from analytics data"""
    
    def __init__(self):
        self.insights_cache = {}
        self.insight_history = []
    
    def generate_insights(self, data_collector: DataCollector) -> List[Insight]:
        """Generate insights from collected data"""
        insights = []
        
        # Get dataframes
        metrics_df = data_collector.get_dataframe('metrics')
        tasks_df = data_collector.get_dataframe('tasks')
        agents_df = data_collector.get_dataframe('agents')
        
        # Generate different types of insights
        insights.extend(self.generate_performance_insights(metrics_df))
        insights.extend(self.generate_efficiency_insights(tasks_df))
        insights.extend(self.generate_agent_insights(agents_df))
        insights.extend(self.generate_system_insights(metrics_df))
        
        return insights
    
    def generate_performance_insights(self, df: pd.DataFrame) -> List[Insight]:
        """Generate performance-related insights"""
        insights = []
        
        if df.empty:
            return insights
        
        # Analyze success rate trends
        if 'success_rate' in df.columns:
            success_data = df[df['metric_name'] == 'success_rate']
            if not success_data.empty:
                trend_analyzer = TrendAnalyzer()
                trend = trend_analyzer.analyze_trends(success_data, 'value')
                
                if trend['confidence'] > 0.7:
                    if trend['trend'] == 'increasing':
                        insights.append(Insight(
                            insight_id=f"success_trend_{int(time.time())}",
                            insight_type="trend",
                            title="Improving Success Rate",
                            description=f"Success rate is trending upward with {trend['confidence']:.1%} confidence",
                            confidence=trend['confidence'],
                            impact="high",
                            actionable=True,
                            recommendations=["Continue current practices", "Document successful strategies"],
                            generated_at=datetime.now().isoformat()
                        ))
                    elif trend['trend'] == 'decreasing':
                        insights.append(Insight(
                            insight_id=f"success_decline_{int(time.time())}",
                            insight_type="trend",
                            title="Declining Success Rate",
                            description=f"Success rate is trending downward with {trend['confidence']:.1%} confidence",
                            confidence=trend['confidence'],
                            impact="critical",
                            actionable=True,
                            recommendations=["Investigate root causes", "Implement corrective measures"],
                            generated_at=datetime.now().isoformat()
                        ))
        
        return insights
    
    def generate_efficiency_insights(self, df: pd.DataFrame) -> List[Insight]:
        """Generate efficiency-related insights"""
        insights = []
        
        if df.empty:
            return insights
        
        # Analyze task duration patterns
        if 'duration' in df.columns:
            avg_duration = df['duration'].mean()
            std_duration = df['duration'].std()
            
            # Identify unusually long tasks
            long_tasks = df[df['duration'] > avg_duration + 2 * std_duration]
            if not long_tasks.empty:
                insights.append(Insight(
                    insight_id=f"long_tasks_{int(time.time())}",
                    insight_type="anomaly",
                    title="Unusually Long Tasks Detected",
                    description=f"Found {len(long_tasks)} tasks taking significantly longer than average",
                    confidence=0.8,
                    impact="medium",
                    actionable=True,
                    recommendations=["Review task complexity", "Consider task breakdown", "Check for blockers"],
                    generated_at=datetime.now().isoformat()
                ))
        
        return insights
    
    def generate_agent_insights(self, df: pd.DataFrame) -> List[Insight]:
        """Generate agent-related insights"""
        insights = []
        
        if df.empty:
            return insights
        
        # Analyze agent performance differences
        if 'agent_role' in df.columns and 'success_rate' in df.columns:
            agent_performance = df.groupby('agent_role')['success_rate'].mean()
            
            best_agent = agent_performance.idxmax()
            worst_agent = agent_performance.idxmin()
            
            performance_gap = agent_performance[best_agent] - agent_performance[worst_agent]
            
            if performance_gap > 0.2:  # Significant gap
                insights.append(Insight(
                    insight_id=f"agent_performance_gap_{int(time.time())}",
                    insight_type="anomaly",
                    title="Significant Agent Performance Gap",
                    description=f"Performance gap of {performance_gap:.1%} between {best_agent} and {worst_agent}",
                    confidence=0.9,
                    impact="high",
                    actionable=True,
                    recommendations=[
                        f"Investigate {worst_agent} performance issues",
                        f"Share best practices from {best_agent}",
                        "Consider additional training or support"
                    ],
                    generated_at=datetime.now().isoformat()
                ))
        
        return insights
    
    def generate_system_insights(self, df: pd.DataFrame) -> List[Insight]:
        """Generate system-related insights"""
        insights = []
        
        if df.empty:
            return insights
        
        # Analyze system load patterns
        if 'system_load' in df.columns:
            load_data = df[df['metric_name'] == 'system_load']
            if not load_data.empty:
                avg_load = load_data['value'].mean()
                
                if avg_load > 0.8:
                    insights.append(Insight(
                        insight_id=f"high_system_load_{int(time.time())}",
                        insight_type="anomaly",
                        title="High System Load",
                        description=f"Average system load is {avg_load:.1%}, approaching capacity limits",
                        confidence=0.95,
                        impact="high",
                        actionable=True,
                        recommendations=["Monitor system resources", "Consider scaling", "Optimize resource usage"],
                        generated_at=datetime.now().isoformat()
                    ))
        
        return insights

class VisualizationEngine:
    """Creates visualizations for analytics data"""
    
    def __init__(self):
        self.chart_cache = {}
    
    def create_performance_dashboard(self, data_collector: DataCollector) -> str:
        """Create a comprehensive performance dashboard"""
        metrics_df = data_collector.get_dataframe('metrics')
        tasks_df = data_collector.get_dataframe('tasks')
        
        if metrics_df.empty and tasks_df.empty:
            return self.create_empty_dashboard()
        
        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Success Rate Trend', 'Task Duration Distribution', 
                          'Agent Performance', 'System Metrics'),
            specs=[[{"secondary_y": False}, {"secondary_y": False}],
                   [{"secondary_y": False}, {"secondary_y": False}]]
        )
        
        # Success rate trend
        if not metrics_df.empty and 'success_rate' in metrics_df['metric_name'].values:
            success_data = metrics_df[metrics_df['metric_name'] == 'success_rate']
            fig.add_trace(
                go.Scatter(x=success_data['timestamp'], y=success_data['value'],
                          mode='lines+markers', name='Success Rate'),
                row=1, col=1
            )
        
        # Task duration distribution
        if not tasks_df.empty and 'duration' in tasks_df.columns:
            fig.add_trace(
                go.Histogram(x=tasks_df['duration'], name='Task Duration'),
                row=1, col=2
            )
        
        # Agent performance
        if not tasks_df.empty and 'agent_role' in tasks_df.columns and 'success' in tasks_df.columns:
            agent_performance = tasks_df.groupby('agent_role')['success'].mean()
            fig.add_trace(
                go.Bar(x=agent_performance.index, y=agent_performance.values,
                       name='Agent Success Rate'),
                row=2, col=1
            )
        
        # System metrics
        if not metrics_df.empty:
            system_metrics = metrics_df[metrics_df['category'] == 'system']
            if not system_metrics.empty:
                fig.add_trace(
                    go.Scatter(x=system_metrics['timestamp'], y=system_metrics['value'],
                              mode='lines+markers', name='System Load'),
                    row=2, col=2
                )
        
        # Update layout
        fig.update_layout(
            title="Multi-Agent Workforce Performance Dashboard",
            showlegend=True,
            height=800
        )
        
        # Save as HTML
        html_content = pyo.plot(fig, output_type='div', include_plotlyjs=True)
        return html_content
    
    def create_empty_dashboard(self) -> str:
        """Create an empty dashboard when no data is available"""
        fig = go.Figure()
        fig.add_annotation(
            text="No data available for visualization",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=20)
        )
        fig.update_layout(title="Analytics Dashboard - No Data")
        
        html_content = pyo.plot(fig, output_type='div', include_plotlyjs=True)
        return html_content
    
    def create_insight_report(self, insights: List[Insight]) -> str:
        """Create an insight report visualization"""
        if not insights:
            return self.create_empty_dashboard()
        
        # Categorize insights by type
        insight_types = {}
        for insight in insights:
            if insight.insight_type not in insight_types:
                insight_types[insight.insight_type] = []
            insight_types[insight.insight_type].append(insight)
        
        # Create visualization
        fig = go.Figure()
        
        colors = {'trend': 'blue', 'anomaly': 'red', 'prediction': 'green', 'recommendation': 'orange'}
        
        for insight_type, type_insights in insight_types.items():
            fig.add_trace(go.Bar(
                x=[insight.title for insight in type_insights],
                y=[insight.confidence for insight in type_insights],
                name=insight_type.title(),
                marker_color=colors.get(insight_type, 'gray')
            ))
        
        fig.update_layout(
            title="Analytics Insights Report",
            xaxis_title="Insight",
            yaxis_title="Confidence",
            barmode='group'
        )
        
        html_content = pyo.plot(fig, output_type='div', include_plotlyjs=True)
        return html_content

class AdvancedAnalyticsSystem:
    """Main advanced analytics system"""
    
    def __init__(self):
        self.data_collector = DataCollector()
        self.trend_analyzer = TrendAnalyzer()
        self.predictive_analytics = PredictiveAnalytics()
        self.insight_generator = InsightGenerator()
        self.visualization_engine = VisualizationEngine()
        self.lock = threading.Lock()
    
    def collect_data(self, data_type: str, data: Dict[str, Any]):
        """Collect data for analytics"""
        if data_type == 'metric':
            metric = AnalyticsMetric(
                metric_name=data.get('name', 'unknown'),
                value=data.get('value', 0),
                timestamp=data.get('timestamp', datetime.now().isoformat()),
                category=data.get('category', 'general'),
                agent_role=data.get('agent_role', 'unknown'),
                task_id=data.get('task_id', 'unknown'),
                metadata=data.get('metadata', {})
            )
            self.data_collector.collect_metric(metric)
        
        elif data_type == 'task':
            self.data_collector.collect_task_data(data)
        
        elif data_type == 'agent':
            self.data_collector.collect_agent_data(data)
        
        elif data_type == 'system':
            self.data_collector.collect_system_data(data)
    
    def generate_comprehensive_report(self) -> Dict[str, Any]:
        """Generate a comprehensive analytics report"""
        with self.lock:
            # Get insights
            insights = self.insight_generator.generate_insights(self.data_collector)
            
            # Get predictions
            metrics_df = self.data_collector.get_dataframe('metrics')
            predictions = []
            
            if not metrics_df.empty and 'success_rate' in metrics_df['metric_name'].values:
                success_data = metrics_df[metrics_df['metric_name'] == 'success_rate']
                prediction = self.predictive_analytics.predict_performance(
                    success_data, 'value', ['value']
                )
                predictions.append(prediction)
            
            # Create visualizations
            dashboard_html = self.visualization_engine.create_performance_dashboard(self.data_collector)
            insights_html = self.visualization_engine.create_insight_report(insights)
            
            # Generate summary statistics
            summary_stats = self.generate_summary_statistics()
            
            return {
                "report_generated_at": datetime.now().isoformat(),
                "insights": [asdict(insight) for insight in insights],
                "predictions": [asdict(prediction) for prediction in predictions],
                "summary_statistics": summary_stats,
                "dashboard_html": dashboard_html,
                "insights_html": insights_html,
                "data_summary": {
                    "total_metrics": len(self.data_collector.metrics_data),
                    "total_tasks": len(self.data_collector.task_data),
                    "total_agents": len(self.data_collector.agent_data),
                    "total_system_data": len(self.data_collector.system_data)
                }
            }
    
    def generate_summary_statistics(self) -> Dict[str, Any]:
        """Generate summary statistics"""
        metrics_df = self.data_collector.get_dataframe('metrics')
        tasks_df = self.data_collector.get_dataframe('tasks')
        
        stats = {
            "metrics_summary": {},
            "tasks_summary": {},
            "performance_summary": {}
        }
        
        if not metrics_df.empty:
            stats["metrics_summary"] = {
                "total_metrics": len(metrics_df),
                "unique_metric_types": metrics_df['metric_name'].nunique(),
                "date_range": {
                    "earliest": metrics_df['timestamp'].min(),
                    "latest": metrics_df['timestamp'].max()
                }
            }
        
        if not tasks_df.empty:
            stats["tasks_summary"] = {
                "total_tasks": len(tasks_df),
                "success_rate": tasks_df['success'].mean() if 'success' in tasks_df.columns else 0,
                "avg_duration": tasks_df['duration'].mean() if 'duration' in tasks_df.columns else 0,
                "category_breakdown": tasks_df['category'].value_counts().to_dict() if 'category' in tasks_df.columns else {}
            }
        
        return stats
    
    def save_analytics_report(self, report: Dict[str, Any], filepath: str):
        """Save analytics report to file"""
        try:
            with open(filepath, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"Analytics report saved to {filepath}")
            return True
        except Exception as e:
            print(f"Error saving analytics report: {e}")
            return False

def main():
    """Main advanced analytics system function"""
    print("Advanced Analytics and Insights Dashboard starting...")
    
    # Initialize analytics system
    analytics_system = AdvancedAnalyticsSystem()
    
    # Add some sample data
    sample_metrics = [
        {
            'name': 'success_rate',
            'value': 0.85,
            'timestamp': datetime.now().isoformat(),
            'category': 'performance',
            'agent_role': 'engineer',
            'task_id': 'task_1'
        },
        {
            'name': 'success_rate',
            'value': 0.90,
            'timestamp': (datetime.now() - timedelta(hours=1)).isoformat(),
            'category': 'performance',
            'agent_role': 'tester',
            'task_id': 'task_2'
        },
        {
            'name': 'system_load',
            'value': 0.75,
            'timestamp': datetime.now().isoformat(),
            'category': 'system',
            'agent_role': 'system',
            'task_id': 'system_1'
        }
    ]
    
    for metric in sample_metrics:
        analytics_system.collect_data('metric', metric)
    
    sample_tasks = [
        {
            'task_id': 'task_1',
            'category': 'bugs',
            'success': True,
            'duration': 2.0,
            'agent_role': 'engineer'
        },
        {
            'task_id': 'task_2',
            'category': 'features',
            'success': True,
            'duration': 6.0,
            'agent_role': 'engineer'
        },
        {
            'task_id': 'task_3',
            'category': 'security',
            'success': False,
            'duration': 8.0,
            'agent_role': 'security'
        }
    ]
    
    for task in sample_tasks:
        analytics_system.collect_data('task', task)
    
    print("✓ Sample data collected")
    
    # Generate comprehensive report
    print("Generating comprehensive analytics report...")
    report = analytics_system.generate_comprehensive_report()
    
    print(f"✓ Report generated with {len(report['insights'])} insights")
    print(f"✓ Report includes {len(report['predictions'])} predictions")
    
    # Save report
    report_path = "analytics_reports/comprehensive_report.json"
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    
    if analytics_system.save_analytics_report(report, report_path):
        print("✓ Analytics report saved")
    
    # Save dashboard HTML
    dashboard_path = "analytics_reports/dashboard.html"
    with open(dashboard_path, 'w') as f:
        f.write(report['dashboard_html'])
    print(f"✓ Dashboard saved to {dashboard_path}")
    
    print("\n✓ Advanced Analytics and Insights Dashboard is ready")
    
    # Keep the system running
    try:
        while True:
            time.sleep(60)
            print(f"Analytics system status: {len(analytics_system.data_collector.metrics_data)} metrics collected")
    except KeyboardInterrupt:
        print("Shutting down advanced analytics system...")

if __name__ == "__main__":
    main()