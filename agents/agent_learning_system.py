#!/usr/bin/env python3
"""
Agent Learning and Adaptation System
Enables agents to learn from experience and adapt their behavior for improved performance
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import threading
import time
import pickle
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib

# Add mcp_servers to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp_servers'))

@dataclass
class AgentExperience:
    """Represents an agent's experience with a specific task type"""
    agent_role: str
    task_category: str
    success_rate: float
    avg_duration: float
    total_tasks: int
    last_updated: str
    performance_trend: float  # Positive = improving, negative = declining
    specialization_score: float  # How specialized the agent is in this category

@dataclass
class LearningPattern:
    """Represents a learned pattern from agent behavior"""
    pattern_id: str
    pattern_type: str  # 'success', 'failure', 'efficiency', 'quality'
    conditions: Dict[str, Any]  # Conditions that trigger this pattern
    outcome: Dict[str, Any]  # Expected outcome when pattern is triggered
    confidence: float
    frequency: int
    last_seen: str

@dataclass
class AdaptationRule:
    """Represents an adaptation rule for agent behavior"""
    rule_id: str
    agent_role: str
    trigger_condition: Dict[str, Any]
    adaptation_action: Dict[str, Any]
    success_rate: float
    usage_count: int
    last_applied: str

class AgentExperienceTracker:
    """Tracks and analyzes agent experience patterns"""
    
    def __init__(self):
        self.experience_data = defaultdict(lambda: defaultdict(dict))
        self.performance_history = defaultdict(lambda: deque(maxlen=100))
        self.specialization_scores = defaultdict(float)
        self.lock = threading.Lock()
    
    def record_task_completion(self, agent_role: str, task_category: str, 
                              success: bool, duration: float, quality_score: float = 0.5):
        """Record a task completion for experience tracking"""
        with self.lock:
            key = f"{agent_role}_{task_category}"
            
            if key not in self.experience_data[agent_role]:
                self.experience_data[agent_role][task_category] = {
                    'total_tasks': 0,
                    'successful_tasks': 0,
                    'total_duration': 0.0,
                    'total_quality': 0.0,
                    'last_updated': datetime.now().isoformat()
                }
            
            exp_data = self.experience_data[agent_role][task_category]
            exp_data['total_tasks'] += 1
            exp_data['total_duration'] += duration
            exp_data['total_quality'] += quality_score
            
            if success:
                exp_data['successful_tasks'] += 1
            
            exp_data['last_updated'] = datetime.now().isoformat()
            
            # Update performance history
            performance_score = self.calculate_performance_score(success, duration, quality_score)
            self.performance_history[key].append({
                'timestamp': datetime.now().isoformat(),
                'performance_score': performance_score,
                'success': success,
                'duration': duration,
                'quality_score': quality_score
            })
            
            # Update specialization score
            self.update_specialization_score(agent_role, task_category)
    
    def calculate_performance_score(self, success: bool, duration: float, quality_score: float) -> float:
        """Calculate a composite performance score"""
        success_score = 1.0 if success else 0.0
        
        # Duration score (lower duration = higher score, normalized)
        duration_score = max(0, 1.0 - (duration / 24.0))  # Assume max 24 hours
        
        # Quality score
        quality_score_normalized = quality_score
        
        # Weighted composite score
        return (success_score * 0.5 + duration_score * 0.3 + quality_score_normalized * 0.2)
    
    def update_specialization_score(self, agent_role: str, task_category: str):
        """Update specialization score for an agent in a category"""
        key = f"{agent_role}_{task_category}"
        
        if key in self.experience_data[agent_role]:
            exp_data = self.experience_data[agent_role][task_category]
            
            # Calculate specialization based on task count and success rate
            task_count = exp_data['total_tasks']
            success_rate = exp_data['successful_tasks'] / task_count if task_count > 0 else 0
            
            # Specialization increases with task count and success rate
            specialization = min(1.0, (task_count / 20.0) * success_rate)
            self.specialization_scores[key] = specialization
    
    def get_agent_experience(self, agent_role: str, task_category: str = None) -> Dict[str, Any]:
        """Get experience data for an agent"""
        with self.lock:
            if task_category:
                key = f"{agent_role}_{task_category}"
                if key in self.experience_data[agent_role]:
                    exp_data = self.experience_data[agent_role][task_category]
                    return {
                        'agent_role': agent_role,
                        'task_category': task_category,
                        'success_rate': exp_data['successful_tasks'] / exp_data['total_tasks'] if exp_data['total_tasks'] > 0 else 0,
                        'avg_duration': exp_data['total_duration'] / exp_data['total_tasks'] if exp_data['total_tasks'] > 0 else 0,
                        'total_tasks': exp_data['total_tasks'],
                        'avg_quality': exp_data['total_quality'] / exp_data['total_tasks'] if exp_data['total_tasks'] > 0 else 0,
                        'specialization_score': self.specialization_scores.get(key, 0),
                        'last_updated': exp_data['last_updated']
                    }
                return None
            else:
                # Return all categories for the agent
                return dict(self.experience_data[agent_role])
    
    def get_performance_trend(self, agent_role: str, task_category: str) -> float:
        """Get performance trend for an agent in a category"""
        key = f"{agent_role}_{task_category}"
        history = self.performance_history[key]
        
        if len(history) < 5:
            return 0.0  # Not enough data
        
        # Calculate trend using linear regression on recent performance
        recent_scores = [entry['performance_score'] for entry in list(history)[-10:]]
        
        if len(recent_scores) < 3:
            return 0.0
        
        # Simple trend calculation
        x = np.arange(len(recent_scores))
        y = np.array(recent_scores)
        
        # Linear regression
        slope = np.polyfit(x, y, 1)[0]
        return slope  # Positive = improving, negative = declining
    
    def get_best_agent_for_task(self, task_category: str) -> str:
        """Get the best agent for a specific task category"""
        best_agent = None
        best_score = 0.0
        
        for agent_role in self.experience_data.keys():
            if task_category in self.experience_data[agent_role]:
                exp_data = self.experience_data[agent_role][task_category]
                
                if exp_data['total_tasks'] > 0:
                    success_rate = exp_data['successful_tasks'] / exp_data['total_tasks']
                    specialization = self.specialization_scores.get(f"{agent_role}_{task_category}", 0)
                    
                    # Composite score: success rate + specialization + recent trend
                    trend = self.get_performance_trend(agent_role, task_category)
                    score = success_rate * 0.5 + specialization * 0.3 + max(0, trend) * 0.2
                    
                    if score > best_score:
                        best_score = score
                        best_agent = agent_role
        
        return best_agent or 'engineer'  # Default fallback

class PatternLearner:
    """Learns patterns from agent behavior and task outcomes"""
    
    def __init__(self):
        self.patterns = []
        self.pattern_frequency = defaultdict(int)
        self.lock = threading.Lock()
    
    def analyze_task_patterns(self, task_data: List[Dict[str, Any]]) -> List[LearningPattern]:
        """Analyze task data to identify patterns"""
        patterns = []
        
        # Group tasks by outcome
        successful_tasks = [t for t in task_data if t.get('success', True)]
        failed_tasks = [t for t in task_data if not t.get('success', True)]
        
        # Learn success patterns
        success_patterns = self.identify_success_patterns(successful_tasks)
        patterns.extend(success_patterns)
        
        # Learn failure patterns
        failure_patterns = self.identify_failure_patterns(failed_tasks)
        patterns.extend(failure_patterns)
        
        # Learn efficiency patterns
        efficiency_patterns = self.identify_efficiency_patterns(task_data)
        patterns.extend(efficiency_patterns)
        
        return patterns
    
    def identify_success_patterns(self, successful_tasks: List[Dict[str, Any]]) -> List[LearningPattern]:
        """Identify patterns that lead to success"""
        patterns = []
        
        if len(successful_tasks) < 3:
            return patterns
        
        # Analyze common characteristics of successful tasks
        categories = [t.get('category', 'unknown') for t in successful_tasks]
        category_counts = defaultdict(int)
        for cat in categories:
            category_counts[cat] += 1
        
        # Find dominant categories
        for category, count in category_counts.items():
            if count >= len(successful_tasks) * 0.3:  # At least 30% of successful tasks
                pattern = LearningPattern(
                    pattern_id=f"success_category_{category}",
                    pattern_type="success",
                    conditions={"category": category},
                    outcome={"success_probability": 0.8},
                    confidence=count / len(successful_tasks),
                    frequency=count,
                    last_seen=datetime.now().isoformat()
                )
                patterns.append(pattern)
        
        # Analyze duration patterns
        durations = [t.get('duration', 0) for t in successful_tasks if t.get('duration')]
        if durations:
            avg_duration = np.mean(durations)
            std_duration = np.std(durations)
            
            # Tasks with duration close to average tend to succeed
            pattern = LearningPattern(
                pattern_id="success_duration_normal",
                pattern_type="success",
                conditions={
                    "duration_range": [avg_duration - std_duration, avg_duration + std_duration]
                },
                outcome={"success_probability": 0.75},
                confidence=0.7,
                frequency=len([d for d in durations if abs(d - avg_duration) <= std_duration]),
                last_seen=datetime.now().isoformat()
            )
            patterns.append(pattern)
        
        return patterns
    
    def identify_failure_patterns(self, failed_tasks: List[Dict[str, Any]]) -> List[LearningPattern]:
        """Identify patterns that lead to failure"""
        patterns = []
        
        if len(failed_tasks) < 2:
            return patterns
        
        # Analyze common characteristics of failed tasks
        error_types = [t.get('error_type', 'unknown') for t in failed_tasks if t.get('error_type')]
        error_counts = defaultdict(int)
        for error in error_types:
            error_counts[error] += 1
        
        # Find common error patterns
        for error_type, count in error_counts.items():
            if count >= len(failed_tasks) * 0.4:  # At least 40% of failed tasks
                pattern = LearningPattern(
                    pattern_id=f"failure_error_{error_type}",
                    pattern_type="failure",
                    conditions={"error_type": error_type},
                    outcome={"success_probability": 0.2},
                    confidence=count / len(failed_tasks),
                    frequency=count,
                    last_seen=datetime.now().isoformat()
                )
                patterns.append(pattern)
        
        return patterns
    
    def identify_efficiency_patterns(self, task_data: List[Dict[str, Any]]) -> List[LearningPattern]:
        """Identify patterns related to efficiency"""
        patterns = []
        
        if len(task_data) < 5:
            return patterns
        
        # Analyze agent-task combinations for efficiency
        agent_efficiency = defaultdict(list)
        
        for task in task_data:
            agent = task.get('agent_role', 'unknown')
            duration = task.get('duration', 0)
            if duration > 0:
                agent_efficiency[agent].append(duration)
        
        # Find efficient agent-task combinations
        for agent, durations in agent_efficiency.items():
            if len(durations) >= 3:
                avg_duration = np.mean(durations)
                std_duration = np.std(durations)
                
                # Agents with low average duration and low variance are efficient
                if avg_duration < np.mean([np.mean(durs) for durs in agent_efficiency.values()]) and std_duration < avg_duration * 0.5:
                    pattern = LearningPattern(
                        pattern_id=f"efficiency_agent_{agent}",
                        pattern_type="efficiency",
                        conditions={"agent_role": agent},
                        outcome={"expected_duration": avg_duration, "efficiency_score": 0.8},
                        confidence=0.7,
                        frequency=len(durations),
                        last_seen=datetime.now().isoformat()
                    )
                    patterns.append(pattern)
        
        return patterns
    
    def apply_pattern(self, pattern: LearningPattern, task_context: Dict[str, Any]) -> Dict[str, Any]:
        """Apply a learned pattern to predict task outcome"""
        # Check if conditions match
        conditions_match = True
        for condition_key, condition_value in pattern.conditions.items():
            if condition_key not in task_context:
                conditions_match = False
                break
            
            task_value = task_context[condition_key]
            
            # Handle different condition types
            if isinstance(condition_value, list) and len(condition_value) == 2:
                # Range condition
                if not (condition_value[0] <= task_value <= condition_value[1]):
                    conditions_match = False
                    break
            elif task_value != condition_value:
                conditions_match = False
                break
        
        if conditions_match:
            return {
                "pattern_applied": pattern.pattern_id,
                "confidence": pattern.confidence,
                "prediction": pattern.outcome
            }
        
        return {"pattern_applied": None}

class AdaptationEngine:
    """Engine for adapting agent behavior based on learning"""
    
    def __init__(self):
        self.adaptation_rules = []
        self.rule_success_rates = defaultdict(list)
        self.lock = threading.Lock()
    
    def create_adaptation_rule(self, agent_role: str, trigger_condition: Dict[str, Any], 
                              adaptation_action: Dict[str, Any]) -> AdaptationRule:
        """Create a new adaptation rule"""
        rule_id = f"rule_{len(self.adaptation_rules)}_{int(time.time())}"
        
        rule = AdaptationRule(
            rule_id=rule_id,
            agent_role=agent_role,
            trigger_condition=trigger_condition,
            adaptation_action=adaptation_action,
            success_rate=0.0,
            usage_count=0,
            last_applied=datetime.now().isoformat()
        )
        
        with self.lock:
            self.adaptation_rules.append(rule)
        
        return rule
    
    def apply_adaptations(self, agent_role: str, task_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply applicable adaptation rules for an agent"""
        applicable_rules = []
        
        with self.lock:
            for rule in self.adaptation_rules:
                if rule.agent_role == agent_role and self.check_trigger_condition(rule.trigger_condition, task_context):
                    applicable_rules.append(rule)
        
        adaptations = []
        for rule in applicable_rules:
            adaptation = {
                "rule_id": rule.rule_id,
                "action": rule.adaptation_action,
                "confidence": rule.success_rate,
                "applied_at": datetime.now().isoformat()
            }
            adaptations.append(adaptation)
            
            # Update rule usage
            rule.usage_count += 1
            rule.last_applied = datetime.now().isoformat()
        
        return adaptations
    
    def check_trigger_condition(self, condition: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """Check if a trigger condition is met"""
        for key, expected_value in condition.items():
            if key not in context:
                return False
            
            context_value = context[key]
            
            # Handle different condition types
            if isinstance(expected_value, dict):
                if 'min' in expected_value and context_value < expected_value['min']:
                    return False
                if 'max' in expected_value and context_value > expected_value['max']:
                    return False
                if 'equals' in expected_value and context_value != expected_value['equals']:
                    return False
            elif context_value != expected_value:
                return False
        
        return True
    
    def update_rule_success(self, rule_id: str, success: bool):
        """Update the success rate of an adaptation rule"""
        with self.lock:
            self.rule_success_rates[rule_id].append(success)
            
            # Keep only recent results
            if len(self.rule_success_rates[rule_id]) > 20:
                self.rule_success_rates[rule_id] = self.rule_success_rates[rule_id][-20:]
            
            # Update rule success rate
            for rule in self.adaptation_rules:
                if rule.rule_id == rule_id:
                    recent_results = self.rule_success_rates[rule_id]
                    rule.success_rate = sum(recent_results) / len(recent_results) if recent_results else 0.0
                    break
    
    def generate_adaptive_suggestions(self, agent_role: str, task_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate adaptive suggestions for an agent"""
        suggestions = []
        
        # Get applicable adaptations
        adaptations = self.apply_adaptations(agent_role, task_context)
        
        for adaptation in adaptations:
            suggestion = {
                "type": "adaptation",
                "description": f"Apply adaptation rule {adaptation['rule_id']}",
                "action": adaptation["action"],
                "confidence": adaptation["confidence"],
                "reason": "Based on learned patterns and historical performance"
            }
            suggestions.append(suggestion)
        
        return suggestions

class AgentLearningSystem:
    """Main system for agent learning and adaptation"""
    
    def __init__(self):
        self.experience_tracker = AgentExperienceTracker()
        self.pattern_learner = PatternLearner()
        self.adaptation_engine = AdaptationEngine()
        self.learning_data = []
        self.lock = threading.Lock()
    
    def record_learning_data(self, task_data: Dict[str, Any]):
        """Record data for learning"""
        with self.lock:
            self.learning_data.append(task_data)
            
            # Process the data
            self.experience_tracker.record_task_completion(
                agent_role=task_data.get('agent_role', 'unknown'),
                task_category=task_data.get('category', 'unknown'),
                success=task_data.get('success', True),
                duration=task_data.get('duration', 0),
                quality_score=task_data.get('quality_score', 0.5)
            )
    
    def learn_from_experience(self):
        """Learn patterns from accumulated experience"""
        if len(self.learning_data) < 10:
            return
        
        # Analyze patterns
        patterns = self.pattern_learner.analyze_task_patterns(self.learning_data)
        
        # Create adaptation rules based on patterns
        for pattern in patterns:
            if pattern.pattern_type == "success" and pattern.confidence > 0.7:
                # Create rule to replicate success conditions
                rule = self.adaptation_engine.create_adaptation_rule(
                    agent_role="all",  # Apply to all agents
                    trigger_condition=pattern.conditions,
                    adaptation_action={"strategy": "replicate_success_pattern", "pattern_id": pattern.pattern_id}
                )
                print(f"Created success adaptation rule: {rule.rule_id}")
            
            elif pattern.pattern_type == "failure" and pattern.confidence > 0.6:
                # Create rule to avoid failure conditions
                rule = self.adaptation_engine.create_adaptation_rule(
                    agent_role="all",
                    trigger_condition=pattern.conditions,
                    adaptation_action={"strategy": "avoid_failure_pattern", "pattern_id": pattern.pattern_id}
                )
                print(f"Created failure avoidance rule: {rule.rule_id}")
    
    def get_agent_recommendations(self, task_context: Dict[str, Any]) -> Dict[str, Any]:
        """Get recommendations for agent assignment and behavior"""
        task_category = task_context.get('category', 'unknown')
        
        # Get best agent for task
        best_agent = self.experience_tracker.get_best_agent_for_task(task_category)
        
        # Get adaptive suggestions
        suggestions = self.adaptation_engine.generate_adaptive_suggestions(best_agent, task_context)
        
        # Get experience data
        experience = self.experience_tracker.get_agent_experience(best_agent, task_category)
        
        return {
            "recommended_agent": best_agent,
            "experience_data": experience,
            "adaptive_suggestions": suggestions,
            "confidence": experience.get('specialization_score', 0.5) if experience else 0.5
        }
    
    def save_learning_state(self, filepath: str):
        """Save learning state to disk"""
        try:
            learning_state = {
                'experience_data': dict(self.experience_tracker.experience_data),
                'specialization_scores': dict(self.experience_tracker.specialization_scores),
                'patterns': [asdict(p) for p in self.pattern_learner.patterns],
                'adaptation_rules': [asdict(r) for r in self.adaptation_engine.adaptation_rules],
                'learning_data': self.learning_data[-100:]  # Keep last 100 entries
            }
            
            with open(filepath, 'wb') as f:
                pickle.dump(learning_state, f)
            
            print(f"Learning state saved to {filepath}")
            return True
        except Exception as e:
            print(f"Error saving learning state: {e}")
            return False
    
    def load_learning_state(self, filepath: str):
        """Load learning state from disk"""
        try:
            if os.path.exists(filepath):
                with open(filepath, 'rb') as f:
                    learning_state = pickle.load(f)
                
                # Restore state
                self.experience_tracker.experience_data = defaultdict(lambda: defaultdict(dict), learning_state.get('experience_data', {}))
                self.experience_tracker.specialization_scores = defaultdict(float, learning_state.get('specialization_scores', {}))
                self.learning_data = learning_state.get('learning_data', [])
                
                print(f"Learning state loaded from {filepath}")
                return True
        except Exception as e:
            print(f"Error loading learning state: {e}")
        
        return False

def main():
    """Main agent learning system function"""
    print("Agent Learning and Adaptation System starting...")
    
    # Initialize learning system
    learning_system = AgentLearningSystem()
    
    # Load existing learning state
    state_path = "learning_state/agent_learning.pkl"
    os.makedirs(os.path.dirname(state_path), exist_ok=True)
    
    if learning_system.load_learning_state(state_path):
        print("✓ Learning state loaded")
    else:
        print("Starting with fresh learning state")
    
    # Add some sample learning data
    sample_data = [
        {
            'agent_role': 'engineer',
            'category': 'bugs',
            'success': True,
            'duration': 2.0,
            'quality_score': 0.8,
            'task_id': 'bug_fix_1'
        },
        {
            'agent_role': 'engineer',
            'category': 'features',
            'success': True,
            'duration': 6.0,
            'quality_score': 0.9,
            'task_id': 'feature_1'
        },
        {
            'agent_role': 'tester',
            'category': 'bugs',
            'success': True,
            'duration': 1.0,
            'quality_score': 0.7,
            'task_id': 'test_1'
        },
        {
            'agent_role': 'security',
            'category': 'security',
            'success': True,
            'duration': 4.0,
            'quality_score': 0.95,
            'task_id': 'security_1'
        }
    ]
    
    for data in sample_data:
        learning_system.record_learning_data(data)
    
    print("✓ Sample learning data added")
    
    # Learn from experience
    learning_system.learn_from_experience()
    print("✓ Learning patterns analyzed")
    
    # Test recommendations
    test_context = {
        'category': 'bugs',
        'complexity': 'medium',
        'urgency': 'high'
    }
    
    recommendations = learning_system.get_agent_recommendations(test_context)
    print(f"\nRecommendations for bug task:")
    print(f"  Recommended Agent: {recommendations['recommended_agent']}")
    print(f"  Confidence: {recommendations['confidence']:.2f}")
    print(f"  Suggestions: {len(recommendations['adaptive_suggestions'])}")
    
    # Save learning state
    learning_system.save_learning_state(state_path)
    print("✓ Learning state saved")
    
    print("\n✓ Agent Learning and Adaptation System is ready")
    
    # Keep the system running
    try:
        while True:
            time.sleep(60)
            print(f"Learning system status: {len(learning_system.learning_data)} learning records")
    except KeyboardInterrupt:
        print("Shutting down agent learning system...")

if __name__ == "__main__":
    main()