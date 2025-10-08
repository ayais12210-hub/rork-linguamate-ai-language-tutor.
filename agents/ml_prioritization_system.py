#!/usr/bin/env python3
"""
Machine Learning-Based Task Prioritization System
Uses ML algorithms to intelligently prioritize and schedule tasks for optimal agent performance
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import threading
import time

# Add mcp_servers to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp_servers'))

@dataclass
class TaskFeatures:
    """Features extracted from tasks for ML prioritization"""
    task_id: str
    category: str
    complexity_score: float
    estimated_duration: float
    dependencies_count: int
    agent_experience: float
    priority_score: float
    deadline_urgency: float
    resource_requirements: float
    risk_score: float
    business_value: float
    technical_debt: float
    test_coverage: float
    documentation_needs: float
    security_impact: float

@dataclass
class TaskPrediction:
    """ML prediction results for task prioritization"""
    task_id: str
    predicted_duration: float
    predicted_success_probability: float
    predicted_effort_score: float
    recommended_agent: str
    optimal_schedule_time: str
    confidence_score: float
    risk_factors: List[str]

class TaskFeatureExtractor:
    """Extracts features from tasks for ML processing"""
    
    def __init__(self):
        self.complexity_keywords = {
            'high': ['refactor', 'architecture', 'migration', 'performance', 'scalability'],
            'medium': ['feature', 'enhancement', 'integration', 'api', 'component'],
            'low': ['fix', 'update', 'style', 'documentation', 'test']
        }
        
        self.category_weights = {
            'bugs': 0.9,
            'security': 0.95,
            'features': 0.7,
            'maintenance': 0.5,
            'docs': 0.3
        }
    
    def extract_features(self, task: Dict[str, Any], historical_data: List[Dict[str, Any]] = None) -> TaskFeatures:
        """Extract features from a task"""
        task_id = task.get('id', 'unknown')
        category = task.get('category', 'unknown')
        title = task.get('title', '')
        description = task.get('description', '')
        
        # Calculate complexity score based on keywords
        complexity_score = self.calculate_complexity_score(title, description)
        
        # Estimate duration based on historical data
        estimated_duration = self.estimate_duration(task, historical_data)
        
        # Count dependencies
        dependencies_count = len(task.get('dependencies', []))
        
        # Calculate agent experience (placeholder - would be based on historical performance)
        agent_experience = 0.7  # Default experience level
        
        # Calculate priority score
        priority_score = self.calculate_priority_score(task)
        
        # Calculate deadline urgency
        deadline_urgency = self.calculate_deadline_urgency(task)
        
        # Calculate resource requirements
        resource_requirements = self.calculate_resource_requirements(task)
        
        # Calculate risk score
        risk_score = self.calculate_risk_score(task)
        
        # Calculate business value
        business_value = self.calculate_business_value(task)
        
        # Calculate technical debt
        technical_debt = self.calculate_technical_debt(task)
        
        # Calculate test coverage needs
        test_coverage = self.calculate_test_coverage_needs(task)
        
        # Calculate documentation needs
        documentation_needs = self.calculate_documentation_needs(task)
        
        # Calculate security impact
        security_impact = self.calculate_security_impact(task)
        
        return TaskFeatures(
            task_id=task_id,
            category=category,
            complexity_score=complexity_score,
            estimated_duration=estimated_duration,
            dependencies_count=dependencies_count,
            agent_experience=agent_experience,
            priority_score=priority_score,
            deadline_urgency=deadline_urgency,
            resource_requirements=resource_requirements,
            risk_score=risk_score,
            business_value=business_value,
            technical_debt=technical_debt,
            test_coverage=test_coverage,
            documentation_needs=documentation_needs,
            security_impact=security_impact
        )
    
    def calculate_complexity_score(self, title: str, description: str) -> float:
        """Calculate complexity score based on keywords"""
        text = (title + ' ' + description).lower()
        
        high_count = sum(1 for keyword in self.complexity_keywords['high'] if keyword in text)
        medium_count = sum(1 for keyword in self.complexity_keywords['medium'] if keyword in text)
        low_count = sum(1 for keyword in self.complexity_keywords['low'] if keyword in text)
        
        # Weighted complexity score
        complexity = (high_count * 3 + medium_count * 2 + low_count * 1) / 10
        return min(complexity, 1.0)
    
    def estimate_duration(self, task: Dict[str, Any], historical_data: List[Dict[str, Any]] = None) -> float:
        """Estimate task duration based on historical data"""
        if not historical_data:
            # Default duration estimates
            category = task.get('category', 'unknown')
            default_durations = {
                'bugs': 2.0,  # hours
                'features': 8.0,
                'security': 4.0,
                'maintenance': 3.0,
                'docs': 1.0
            }
            return default_durations.get(category, 4.0)
        
        # Use historical data to estimate duration
        similar_tasks = [
            t for t in historical_data 
            if t.get('category') == task.get('category')
        ]
        
        if similar_tasks:
            durations = [t.get('actual_duration', 4.0) for t in similar_tasks]
            return np.mean(durations)
        
        return 4.0  # Default fallback
    
    def calculate_priority_score(self, task: Dict[str, Any]) -> float:
        """Calculate priority score based on task attributes"""
        category = task.get('category', 'unknown')
        base_priority = self.category_weights.get(category, 0.5)
        
        # Adjust based on labels
        labels = task.get('labels', [])
        if 'urgent' in labels:
            base_priority += 0.2
        if 'critical' in labels:
            base_priority += 0.3
        if 'low-priority' in labels:
            base_priority -= 0.2
        
        return min(max(base_priority, 0.0), 1.0)
    
    def calculate_deadline_urgency(self, task: Dict[str, Any]) -> float:
        """Calculate deadline urgency"""
        deadline = task.get('deadline')
        if not deadline:
            return 0.0
        
        try:
            deadline_date = datetime.fromisoformat(deadline)
            days_until_deadline = (deadline_date - datetime.now()).days
            
            if days_until_deadline <= 0:
                return 1.0
            elif days_until_deadline <= 1:
                return 0.9
            elif days_until_deadline <= 3:
                return 0.7
            elif days_until_deadline <= 7:
                return 0.5
            else:
                return 0.2
        except:
            return 0.0
    
    def calculate_resource_requirements(self, task: Dict[str, Any]) -> float:
        """Calculate resource requirements"""
        requirements = task.get('requirements', [])
        
        # Count resource-intensive requirements
        resource_keywords = ['database', 'api', 'integration', 'performance', 'scalability']
        resource_count = sum(1 for req in requirements if any(keyword in req.lower() for keyword in resource_keywords))
        
        return min(resource_count / 5.0, 1.0)
    
    def calculate_risk_score(self, task: Dict[str, Any]) -> float:
        """Calculate risk score"""
        risk_factors = []
        
        # High complexity increases risk
        if task.get('complexity', 'medium') == 'high':
            risk_factors.append(0.3)
        
        # Dependencies increase risk
        dependencies = task.get('dependencies', [])
        if len(dependencies) > 3:
            risk_factors.append(0.2)
        
        # Security tasks have inherent risk
        if task.get('category') == 'security':
            risk_factors.append(0.2)
        
        return min(sum(risk_factors), 1.0)
    
    def calculate_business_value(self, task: Dict[str, Any]) -> float:
        """Calculate business value"""
        # This would typically be based on business metrics
        # For now, use category-based scoring
        category_values = {
            'security': 0.9,
            'features': 0.8,
            'bugs': 0.7,
            'maintenance': 0.5,
            'docs': 0.3
        }
        
        return category_values.get(task.get('category', 'unknown'), 0.5)
    
    def calculate_technical_debt(self, task: Dict[str, Any]) -> float:
        """Calculate technical debt impact"""
        if 'technical-debt' in task.get('labels', []):
            return 0.8
        
        if 'refactor' in task.get('title', '').lower():
            return 0.6
        
        return 0.2  # Default low technical debt
    
    def calculate_test_coverage_needs(self, task: Dict[str, Any]) -> float:
        """Calculate test coverage needs"""
        if task.get('category') == 'bugs':
            return 0.9  # Bugs need high test coverage
        
        if 'test' in task.get('title', '').lower():
            return 0.8
        
        return 0.5  # Default moderate test coverage needs
    
    def calculate_documentation_needs(self, task: Dict[str, Any]) -> float:
        """Calculate documentation needs"""
        if task.get('category') == 'docs':
            return 1.0
        
        if 'api' in task.get('title', '').lower():
            return 0.8
        
        return 0.3  # Default low documentation needs
    
    def calculate_security_impact(self, task: Dict[str, Any]) -> float:
        """Calculate security impact"""
        if task.get('category') == 'security':
            return 1.0
        
        if 'security' in task.get('title', '').lower():
            return 0.8
        
        if 'authentication' in task.get('title', '').lower() or 'authorization' in task.get('title', '').lower():
            return 0.6
        
        return 0.1  # Default low security impact

class MLTaskPrioritizer:
    """Machine Learning-based task prioritization system"""
    
    def __init__(self):
        self.feature_extractor = TaskFeatureExtractor()
        self.models = {
            'duration': RandomForestRegressor(n_estimators=100, random_state=42),
            'success_probability': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'effort_score': LinearRegression()
        }
        self.scalers = {
            'duration': StandardScaler(),
            'success_probability': StandardScaler(),
            'effort_score': StandardScaler()
        }
        self.label_encoders = {
            'category': LabelEncoder(),
            'agent': LabelEncoder()
        }
        self.historical_data = []
        self.model_trained = False
        self.lock = threading.Lock()
    
    def add_historical_data(self, task_data: Dict[str, Any]):
        """Add historical task data for training"""
        with self.lock:
            self.historical_data.append(task_data)
    
    def prepare_training_data(self) -> Tuple[np.ndarray, Dict[str, np.ndarray]]:
        """Prepare training data from historical data"""
        if len(self.historical_data) < 10:
            return None, None
        
        features_list = []
        targets = {
            'duration': [],
            'success_probability': [],
            'effort_score': []
        }
        
        for data in self.historical_data:
            try:
                features = self.feature_extractor.extract_features(data, self.historical_data)
                features_list.append(asdict(features))
                
                # Extract targets
                targets['duration'].append(data.get('actual_duration', 4.0))
                targets['success_probability'].append(1.0 if data.get('success', True) else 0.0)
                targets['effort_score'].append(data.get('effort_score', 0.5))
                
            except Exception as e:
                print(f"Error processing historical data: {e}")
                continue
        
        if not features_list:
            return None, None
        
        # Convert to DataFrame
        df = pd.DataFrame(features_list)
        
        # Encode categorical variables
        df['category_encoded'] = self.label_encoders['category'].fit_transform(df['category'])
        
        # Select features for training
        feature_columns = [
            'complexity_score', 'estimated_duration', 'dependencies_count',
            'agent_experience', 'priority_score', 'deadline_urgency',
            'resource_requirements', 'risk_score', 'business_value',
            'technical_debt', 'test_coverage', 'documentation_needs',
            'security_impact', 'category_encoded'
        ]
        
        X = df[feature_columns].values
        
        # Prepare targets
        y = {}
        for target_name, target_values in targets.items():
            y[target_name] = np.array(target_values)
        
        return X, y
    
    def train_models(self):
        """Train ML models on historical data"""
        X, y = self.prepare_training_data()
        
        if X is None or len(X) < 10:
            print("Insufficient data for training")
            return False
        
        try:
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y['duration'], test_size=0.2, random_state=42
            )
            
            # Scale features
            X_train_scaled = self.scalers['duration'].fit_transform(X_train)
            X_test_scaled = self.scalers['duration'].transform(X_test)
            
            # Train duration model
            self.models['duration'].fit(X_train_scaled, y_train)
            
            # Evaluate
            y_pred = self.models['duration'].predict(X_test_scaled)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            print(f"Duration model trained - MSE: {mse:.3f}, R²: {r2:.3f}")
            
            # Train other models similarly
            for model_name in ['success_probability', 'effort_score']:
                if model_name in y and len(y[model_name]) > 0:
                    X_train, X_test, y_train, y_test = train_test_split(
                        X, y[model_name], test_size=0.2, random_state=42
                    )
                    
                    X_train_scaled = self.scalers[model_name].fit_transform(X_train)
                    X_test_scaled = self.scalers[model_name].transform(X_test)
                    
                    self.models[model_name].fit(X_train_scaled, y_train)
                    
                    y_pred = self.models[model_name].predict(X_test_scaled)
                    mse = mean_squared_error(y_test, y_pred)
                    r2 = r2_score(y_test, y_pred)
                    
                    print(f"{model_name} model trained - MSE: {mse:.3f}, R²: {r2:.3f}")
            
            self.model_trained = True
            return True
            
        except Exception as e:
            print(f"Error training models: {e}")
            return False
    
    def predict_task_priorities(self, tasks: List[Dict[str, Any]]) -> List[TaskPrediction]:
        """Predict priorities for a list of tasks"""
        if not self.model_trained:
            print("Models not trained, using heuristic prioritization")
            return self.heuristic_prioritization(tasks)
        
        predictions = []
        
        for task in tasks:
            try:
                # Extract features
                features = self.feature_extractor.extract_features(task, self.historical_data)
                feature_dict = asdict(features)
                
                # Prepare feature vector
                feature_columns = [
                    'complexity_score', 'estimated_duration', 'dependencies_count',
                    'agent_experience', 'priority_score', 'deadline_urgency',
                    'resource_requirements', 'risk_score', 'business_value',
                    'technical_debt', 'test_coverage', 'documentation_needs',
                    'security_impact'
                ]
                
                feature_vector = [feature_dict[col] for col in feature_columns]
                
                # Add category encoding
                try:
                    category_encoded = self.label_encoders['category'].transform([features.category])[0]
                    feature_vector.append(category_encoded)
                except:
                    feature_vector.append(0)  # Default encoding
                
                feature_vector = np.array(feature_vector).reshape(1, -1)
                
                # Make predictions
                predicted_duration = self.models['duration'].predict(
                    self.scalers['duration'].transform(feature_vector)
                )[0]
                
                predicted_success_prob = self.models['success_probability'].predict(
                    self.scalers['success_probability'].transform(feature_vector)
                )[0] if 'success_probability' in self.models else 0.8
                
                predicted_effort = self.models['effort_score'].predict(
                    self.scalers['effort_score'].transform(feature_vector)
                )[0] if 'effort_score' in self.models else 0.5
                
                # Determine recommended agent
                recommended_agent = self.recommend_agent(task, features)
                
                # Calculate optimal schedule time
                optimal_schedule_time = self.calculate_optimal_schedule_time(task, features)
                
                # Calculate confidence score
                confidence_score = self.calculate_confidence_score(features)
                
                # Identify risk factors
                risk_factors = self.identify_risk_factors(features)
                
                prediction = TaskPrediction(
                    task_id=task['id'],
                    predicted_duration=predicted_duration,
                    predicted_success_probability=predicted_success_prob,
                    predicted_effort_score=predicted_effort,
                    recommended_agent=recommended_agent,
                    optimal_schedule_time=optimal_schedule_time,
                    confidence_score=confidence_score,
                    risk_factors=risk_factors
                )
                
                predictions.append(prediction)
                
            except Exception as e:
                print(f"Error predicting for task {task.get('id', 'unknown')}: {e}")
                # Fallback to heuristic
                prediction = self.create_heuristic_prediction(task)
                predictions.append(prediction)
        
        return predictions
    
    def heuristic_prioritization(self, tasks: List[Dict[str, Any]]) -> List[TaskPrediction]:
        """Fallback heuristic prioritization when ML models are not available"""
        predictions = []
        
        for task in tasks:
            prediction = self.create_heuristic_prediction(task)
            predictions.append(prediction)
        
        return predictions
    
    def create_heuristic_prediction(self, task: Dict[str, Any]) -> TaskPrediction:
        """Create heuristic prediction for a task"""
        features = self.feature_extractor.extract_features(task, self.historical_data)
        
        # Simple heuristic calculations
        predicted_duration = features.estimated_duration
        predicted_success_prob = 0.8 - (features.risk_score * 0.3)
        predicted_effort = features.complexity_score * features.resource_requirements
        
        recommended_agent = self.recommend_agent(task, features)
        optimal_schedule_time = self.calculate_optimal_schedule_time(task, features)
        confidence_score = 0.6  # Lower confidence for heuristic
        risk_factors = self.identify_risk_factors(features)
        
        return TaskPrediction(
            task_id=task['id'],
            predicted_duration=predicted_duration,
            predicted_success_probability=predicted_success_prob,
            predicted_effort_score=predicted_effort,
            recommended_agent=recommended_agent,
            optimal_schedule_time=optimal_schedule_time,
            confidence_score=confidence_score,
            risk_factors=risk_factors
        )
    
    def recommend_agent(self, task: Dict[str, Any], features: TaskFeatures) -> str:
        """Recommend the best agent for a task"""
        category = task.get('category', 'unknown')
        
        # Agent recommendations based on task category and features
        if category == 'security' or features.security_impact > 0.7:
            return 'security'
        elif category == 'docs' or features.documentation_needs > 0.7:
            return 'docs'
        elif features.test_coverage > 0.7 or 'test' in task.get('title', '').lower():
            return 'tester'
        elif category == 'bugs' or features.complexity_score < 0.3:
            return 'engineer'
        elif features.complexity_score > 0.7 or features.resource_requirements > 0.7:
            return 'engineer'
        else:
            return 'engineer'  # Default to engineer
    
    def calculate_optimal_schedule_time(self, task: Dict[str, Any], features: TaskFeatures) -> str:
        """Calculate optimal schedule time for a task"""
        # Simple scheduling logic
        urgency = features.deadline_urgency
        complexity = features.complexity_score
        
        if urgency > 0.8:
            return "immediate"
        elif urgency > 0.5:
            return "today"
        elif complexity > 0.7:
            return "this_week"
        else:
            return "next_week"
    
    def calculate_confidence_score(self, features: TaskFeatures) -> float:
        """Calculate confidence score for predictions"""
        # Higher confidence for tasks with clear characteristics
        confidence = 0.5
        
        if features.complexity_score > 0.7 or features.complexity_score < 0.3:
            confidence += 0.2  # Clear complexity level
        
        if features.deadline_urgency > 0.8:
            confidence += 0.2  # Clear urgency
        
        if features.category in ['security', 'bugs']:
            confidence += 0.1  # Well-defined categories
        
        return min(confidence, 1.0)
    
    def identify_risk_factors(self, features: TaskFeatures) -> List[str]:
        """Identify risk factors for a task"""
        risk_factors = []
        
        if features.risk_score > 0.7:
            risk_factors.append("high_risk")
        
        if features.complexity_score > 0.8:
            risk_factors.append("high_complexity")
        
        if features.dependencies_count > 3:
            risk_factors.append("many_dependencies")
        
        if features.deadline_urgency > 0.9:
            risk_factors.append("urgent_deadline")
        
        if features.resource_requirements > 0.8:
            risk_factors.append("high_resource_requirements")
        
        return risk_factors
    
    def save_models(self, filepath: str):
        """Save trained models to disk"""
        if not self.model_trained:
            return False
        
        try:
            model_data = {
                'models': self.models,
                'scalers': self.scalers,
                'label_encoders': self.label_encoders,
                'model_trained': self.model_trained
            }
            
            joblib.dump(model_data, filepath)
            print(f"Models saved to {filepath}")
            return True
        except Exception as e:
            print(f"Error saving models: {e}")
            return False
    
    def load_models(self, filepath: str):
        """Load trained models from disk"""
        try:
            if os.path.exists(filepath):
                model_data = joblib.load(filepath)
                
                self.models = model_data['models']
                self.scalers = model_data['scalers']
                self.label_encoders = model_data['label_encoders']
                self.model_trained = model_data['model_trained']
                
                print(f"Models loaded from {filepath}")
                return True
        except Exception as e:
            print(f"Error loading models: {e}")
        
        return False

def main():
    """Main ML prioritization system function"""
    print("Machine Learning Task Prioritization System starting...")
    
    # Initialize prioritizer
    prioritizer = MLTaskPrioritizer()
    
    # Load existing models if available
    model_path = "ml_models/task_prioritizer.pkl"
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    if prioritizer.load_models(model_path):
        print("✓ Pre-trained models loaded")
    else:
        print("No pre-trained models found, will use heuristic prioritization")
    
    # Add some sample historical data for demonstration
    sample_historical_data = [
        {
            'id': 'task_1',
            'category': 'bugs',
            'title': 'Fix login bug',
            'actual_duration': 2.0,
            'success': True,
            'effort_score': 0.3
        },
        {
            'id': 'task_2',
            'category': 'features',
            'title': 'Add user dashboard',
            'actual_duration': 8.0,
            'success': True,
            'effort_score': 0.7
        },
        {
            'id': 'task_3',
            'category': 'security',
            'title': 'Implement OAuth',
            'actual_duration': 6.0,
            'success': True,
            'effort_score': 0.8
        }
    ]
    
    for data in sample_historical_data:
        prioritizer.add_historical_data(data)
    
    # Train models if we have enough data
    if len(prioritizer.historical_data) >= 10:
        print("Training ML models...")
        if prioritizer.train_models():
            prioritizer.save_models(model_path)
            print("✓ Models trained and saved")
        else:
            print("✗ Model training failed")
    
    # Test prioritization with sample tasks
    sample_tasks = [
        {
            'id': 'test_task_1',
            'category': 'bugs',
            'title': 'Fix memory leak in component',
            'description': 'Critical memory leak causing performance issues',
            'labels': ['urgent', 'critical']
        },
        {
            'id': 'test_task_2',
            'category': 'features',
            'title': 'Add dark mode support',
            'description': 'Implement dark mode theme for better user experience',
            'labels': ['enhancement']
        },
        {
            'id': 'test_task_3',
            'category': 'security',
            'title': 'Update authentication system',
            'description': 'Migrate to new authentication framework',
            'labels': ['security', 'migration']
        }
    ]
    
    print("Testing task prioritization...")
    predictions = prioritizer.predict_task_priorities(sample_tasks)
    
    for prediction in predictions:
        print(f"\nTask: {prediction.task_id}")
        print(f"  Predicted Duration: {prediction.predicted_duration:.1f} hours")
        print(f"  Success Probability: {prediction.predicted_success_probability:.2f}")
        print(f"  Effort Score: {prediction.predicted_effort_score:.2f}")
        print(f"  Recommended Agent: {prediction.recommended_agent}")
        print(f"  Optimal Schedule: {prediction.optimal_schedule_time}")
        print(f"  Confidence: {prediction.confidence_score:.2f}")
        print(f"  Risk Factors: {', '.join(prediction.risk_factors)}")
    
    print("\n✓ ML Task Prioritization System is ready")
    
    # Keep the system running
    try:
        while True:
            time.sleep(60)
            print(f"ML Prioritization System status: {len(prioritizer.historical_data)} historical tasks")
    except KeyboardInterrupt:
        print("Shutting down ML prioritization system...")

if __name__ == "__main__":
    main()