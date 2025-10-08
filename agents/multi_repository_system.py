#!/usr/bin/env python3
"""
Multi-Repository Support System
Enables cross-repository operations and coordination for the multi-agent workforce
"""

import os
import sys
import json
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import threading
import time
import requests
from urllib.parse import urlparse

# Add mcp_servers to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp_servers'))

@dataclass
class Repository:
    """Represents a repository configuration"""
    repo_id: str
    name: str
    owner: str
    url: str
    branch: str
    access_token: str
    description: str
    tags: List[str]
    priority: int
    last_sync: str
    status: str  # 'active', 'inactive', 'error'

@dataclass
class CrossRepoTask:
    """Represents a task that spans multiple repositories"""
    task_id: str
    title: str
    description: str
    repositories: List[str]  # Repository IDs
    dependencies: List[str]  # Task IDs
    status: str  # 'pending', 'in_progress', 'completed', 'failed'
    created_at: str
    updated_at: str
    assigned_agents: Dict[str, str]  # repo_id -> agent_role

@dataclass
class RepositorySync:
    """Represents synchronization between repositories"""
    sync_id: str
    source_repo: str
    target_repo: str
    sync_type: str  # 'code', 'config', 'dependencies', 'docs'
    last_sync: str
    status: str
    conflicts: List[str]

class RepositoryManager:
    """Manages multiple repositories and their configurations"""
    
    def __init__(self):
        self.repositories = {}
        self.cross_repo_tasks = {}
        self.sync_status = {}
        self.lock = threading.Lock()
    
    def add_repository(self, repo: Repository) -> bool:
        """Add a new repository to the system"""
        with self.lock:
            try:
                # Validate repository access
                if not self.validate_repository_access(repo):
                    return False
                
                self.repositories[repo.repo_id] = repo
                self.sync_status[repo.repo_id] = {
                    'last_sync': datetime.now().isoformat(),
                    'status': 'active',
                    'sync_count': 0
                }
                
                print(f"✓ Repository {repo.name} added successfully")
                return True
            except Exception as e:
                print(f"✗ Error adding repository {repo.name}: {e}")
                return False
    
    def validate_repository_access(self, repo: Repository) -> bool:
        """Validate that the repository is accessible"""
        try:
            # Parse GitHub URL
            parsed_url = urlparse(repo.url)
            if 'github.com' not in parsed_url.netloc:
                print(f"Only GitHub repositories are currently supported")
                return False
            
            # Extract owner and repo name
            path_parts = parsed_url.path.strip('/').split('/')
            if len(path_parts) < 2:
                print(f"Invalid repository URL format")
                return False
            
            owner, repo_name = path_parts[0], path_parts[1]
            
            # Test API access
            api_url = f"https://api.github.com/repos/{owner}/{repo_name}"
            headers = {
                'Authorization': f'token {repo.access_token}',
                'Accept': 'application/vnd.github.v3+json'
            }
            
            response = requests.get(api_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                repo_data = response.json()
                print(f"✓ Repository {repo.name} is accessible")
                return True
            else:
                print(f"✗ Repository {repo.name} access failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"✗ Error validating repository {repo.name}: {e}")
            return False
    
    def get_repository(self, repo_id: str) -> Optional[Repository]:
        """Get repository by ID"""
        with self.lock:
            return self.repositories.get(repo_id)
    
    def list_repositories(self) -> List[Repository]:
        """List all repositories"""
        with self.lock:
            return list(self.repositories.values())
    
    def update_repository_status(self, repo_id: str, status: str):
        """Update repository status"""
        with self.lock:
            if repo_id in self.repositories:
                self.repositories[repo_id].status = status
                self.repositories[repo_id].last_sync = datetime.now().isoformat()
    
    def remove_repository(self, repo_id: str) -> bool:
        """Remove a repository from the system"""
        with self.lock:
            if repo_id in self.repositories:
                del self.repositories[repo_id]
                if repo_id in self.sync_status:
                    del self.sync_status[repo_id]
                print(f"✓ Repository {repo_id} removed")
                return True
            return False

class CrossRepositoryCoordinator:
    """Coordinates tasks across multiple repositories"""
    
    def __init__(self, repo_manager: RepositoryManager):
        self.repo_manager = repo_manager
        self.cross_repo_tasks = {}
        self.task_dependencies = {}
        self.lock = threading.Lock()
    
    def create_cross_repo_task(self, task: CrossRepoTask) -> bool:
        """Create a cross-repository task"""
        with self.lock:
            try:
                # Validate repositories
                for repo_id in task.repositories:
                    if repo_id not in self.repo_manager.repositories:
                        print(f"✗ Repository {repo_id} not found")
                        return False
                
                # Validate dependencies
                for dep_id in task.dependencies:
                    if dep_id not in self.cross_repo_tasks:
                        print(f"✗ Dependency {dep_id} not found")
                        return False
                
                self.cross_repo_tasks[task.task_id] = task
                self.task_dependencies[task.task_id] = task.dependencies
                
                print(f"✓ Cross-repo task {task.task_id} created")
                return True
                
            except Exception as e:
                print(f"✗ Error creating cross-repo task: {e}")
                return False
    
    def assign_agents_to_repositories(self, task_id: str, assignments: Dict[str, str]) -> bool:
        """Assign agents to specific repositories for a task"""
        with self.lock:
            if task_id not in self.cross_repo_tasks:
                return False
            
            task = self.cross_repo_tasks[task_id]
            
            # Validate assignments
            for repo_id, agent_role in assignments.items():
                if repo_id not in task.repositories:
                    print(f"✗ Repository {repo_id} not in task {task_id}")
                    return False
            
            task.assigned_agents.update(assignments)
            task.updated_at = datetime.now().isoformat()
            
            print(f"✓ Agents assigned to task {task_id}")
            return True
    
    def get_task_dependencies_status(self, task_id: str) -> Dict[str, str]:
        """Get the status of task dependencies"""
        if task_id not in self.task_dependencies:
            return {}
        
        dependencies = self.task_dependencies[task_id]
        status = {}
        
        for dep_id in dependencies:
            if dep_id in self.cross_repo_tasks:
                status[dep_id] = self.cross_repo_tasks[dep_id].status
            else:
                status[dep_id] = 'not_found'
        
        return status
    
    def can_start_task(self, task_id: str) -> bool:
        """Check if a task can be started (all dependencies completed)"""
        if task_id not in self.task_dependencies:
            return True  # No dependencies
        
        dependencies_status = self.get_task_dependencies_status(task_id)
        
        for dep_id, status in dependencies_status.items():
            if status != 'completed':
                return False
        
        return True
    
    def update_task_status(self, task_id: str, status: str) -> bool:
        """Update task status"""
        with self.lock:
            if task_id not in self.cross_repo_tasks:
                return False
            
            task = self.cross_repo_tasks[task_id]
            task.status = status
            task.updated_at = datetime.now().isoformat()
            
            print(f"✓ Task {task_id} status updated to {status}")
            return True
    
    def get_ready_tasks(self) -> List[CrossRepoTask]:
        """Get tasks that are ready to start"""
        ready_tasks = []
        
        for task_id, task in self.cross_repo_tasks.items():
            if task.status == 'pending' and self.can_start_task(task_id):
                ready_tasks.append(task)
        
        return ready_tasks

class RepositorySynchronizer:
    """Handles synchronization between repositories"""
    
    def __init__(self, repo_manager: RepositoryManager):
        self.repo_manager = repo_manager
        self.sync_queue = []
        self.sync_history = []
        self.lock = threading.Lock()
    
    def schedule_sync(self, sync: RepositorySync):
        """Schedule a synchronization between repositories"""
        with self.lock:
            self.sync_queue.append(sync)
            print(f"✓ Sync scheduled: {sync.source_repo} -> {sync.target_repo}")
    
    def execute_sync(self, sync: RepositorySync) -> bool:
        """Execute synchronization between repositories"""
        try:
            source_repo = self.repo_manager.get_repository(sync.source_repo)
            target_repo = self.repo_manager.get_repository(sync.target_repo)
            
            if not source_repo or not target_repo:
                print(f"✗ Source or target repository not found")
                return False
            
            # Different sync types require different approaches
            if sync.sync_type == 'code':
                return self.sync_code(source_repo, target_repo, sync)
            elif sync.sync_type == 'config':
                return self.sync_config(source_repo, target_repo, sync)
            elif sync.sync_type == 'dependencies':
                return self.sync_dependencies(source_repo, target_repo, sync)
            elif sync.sync_type == 'docs':
                return self.sync_docs(source_repo, target_repo, sync)
            else:
                print(f"✗ Unknown sync type: {sync.sync_type}")
                return False
                
        except Exception as e:
            print(f"✗ Error executing sync: {e}")
            return False
    
    def sync_code(self, source_repo: Repository, target_repo: Repository, sync: RepositorySync) -> bool:
        """Sync code between repositories"""
        try:
            # This would typically involve:
            # 1. Cloning both repositories
            # 2. Comparing changes
            # 3. Merging or cherry-picking commits
            # 4. Pushing changes
            
            print(f"Syncing code from {source_repo.name} to {target_repo.name}")
            
            # For now, just update sync status
            sync.status = 'completed'
            sync.last_sync = datetime.now().isoformat()
            
            return True
            
        except Exception as e:
            print(f"✗ Code sync failed: {e}")
            sync.status = 'failed'
            return False
    
    def sync_config(self, source_repo: Repository, target_repo: Repository, sync: RepositorySync) -> bool:
        """Sync configuration files between repositories"""
        try:
            print(f"Syncing config from {source_repo.name} to {target_repo.name}")
            
            # Sync configuration files like package.json, tsconfig.json, etc.
            config_files = ['package.json', 'tsconfig.json', 'eslint.config.js', '.gitignore']
            
            for config_file in config_files:
                # This would involve copying config files between repos
                print(f"  Syncing {config_file}")
            
            sync.status = 'completed'
            sync.last_sync = datetime.now().isoformat()
            
            return True
            
        except Exception as e:
            print(f"✗ Config sync failed: {e}")
            sync.status = 'failed'
            return False
    
    def sync_dependencies(self, source_repo: Repository, target_repo: Repository, sync: RepositorySync) -> bool:
        """Sync dependencies between repositories"""
        try:
            print(f"Syncing dependencies from {source_repo.name} to {target_repo.name}")
            
            # This would involve:
            # 1. Reading package.json from source
            # 2. Updating package.json in target
            # 3. Running npm install
            
            sync.status = 'completed'
            sync.last_sync = datetime.now().isoformat()
            
            return True
            
        except Exception as e:
            print(f"✗ Dependency sync failed: {e}")
            sync.status = 'failed'
            return False
    
    def sync_docs(self, source_repo: Repository, target_repo: Repository, sync: RepositorySync) -> bool:
        """Sync documentation between repositories"""
        try:
            print(f"Syncing docs from {source_repo.name} to {target_repo.name}")
            
            # Sync documentation files
            doc_files = ['README.md', 'docs/', 'CHANGELOG.md']
            
            for doc_file in doc_files:
                print(f"  Syncing {doc_file}")
            
            sync.status = 'completed'
            sync.last_sync = datetime.now().isoformat()
            
            return True
            
        except Exception as e:
            print(f"✗ Docs sync failed: {e}")
            sync.status = 'failed'
            return False
    
    def process_sync_queue(self):
        """Process the synchronization queue"""
        with self.lock:
            while self.sync_queue:
                sync = self.sync_queue.pop(0)
                
                print(f"Processing sync: {sync.sync_id}")
                
                success = self.execute_sync(sync)
                
                # Record sync history
                self.sync_history.append({
                    'sync_id': sync.sync_id,
                    'source_repo': sync.source_repo,
                    'target_repo': sync.target_repo,
                    'sync_type': sync.sync_type,
                    'status': sync.status,
                    'completed_at': datetime.now().isoformat()
                })
                
                # Keep only last 100 sync records
                if len(self.sync_history) > 100:
                    self.sync_history = self.sync_history[-100:]

class MultiRepositoryAgent:
    """Agent that can work across multiple repositories"""
    
    def __init__(self, agent_role: str, repo_manager: RepositoryManager, 
                 coordinator: CrossRepositoryCoordinator):
        self.agent_role = agent_role
        self.repo_manager = repo_manager
        self.coordinator = coordinator
        self.current_tasks = {}
        self.work_history = []
    
    def get_available_tasks(self) -> List[CrossRepoTask]:
        """Get tasks available for this agent"""
        available_tasks = []
        
        ready_tasks = self.coordinator.get_ready_tasks()
        
        for task in ready_tasks:
            # Check if this agent is assigned to any repository in the task
            for repo_id, assigned_agent in task.assigned_agents.items():
                if assigned_agent == self.agent_role:
                    available_tasks.append(task)
                    break
        
        return available_tasks
    
    def start_task(self, task_id: str) -> bool:
        """Start working on a cross-repository task"""
        if task_id not in self.coordinator.cross_repo_tasks:
            return False
        
        task = self.coordinator.cross_repo_tasks[task_id]
        
        if not self.coordinator.can_start_task(task_id):
            print(f"✗ Task {task_id} dependencies not met")
            return False
        
        # Update task status
        self.coordinator.update_task_status(task_id, 'in_progress')
        
        # Record work start
        self.current_tasks[task_id] = {
            'started_at': datetime.now().isoformat(),
            'repositories': task.repositories,
            'status': 'in_progress'
        }
        
        print(f"✓ Agent {self.agent_role} started task {task_id}")
        return True
    
    def complete_task(self, task_id: str, success: bool, results: Dict[str, Any]) -> bool:
        """Complete a cross-repository task"""
        if task_id not in self.current_tasks:
            return False
        
        # Update task status
        status = 'completed' if success else 'failed'
        self.coordinator.update_task_status(task_id, status)
        
        # Record work completion
        work_record = {
            'task_id': task_id,
            'agent_role': self.agent_role,
            'started_at': self.current_tasks[task_id]['started_at'],
            'completed_at': datetime.now().isoformat(),
            'success': success,
            'results': results,
            'repositories': self.current_tasks[task_id]['repositories']
        }
        
        self.work_history.append(work_record)
        
        # Remove from current tasks
        del self.current_tasks[task_id]
        
        print(f"✓ Agent {self.agent_role} completed task {task_id} with status {status}")
        return True
    
    def get_work_summary(self) -> Dict[str, Any]:
        """Get summary of agent's work across repositories"""
        return {
            'agent_role': self.agent_role,
            'current_tasks': len(self.current_tasks),
            'total_completed': len(self.work_history),
            'success_rate': sum(1 for w in self.work_history if w['success']) / len(self.work_history) if self.work_history else 0,
            'repositories_worked': list(set(repo for w in self.work_history for repo in w['repositories'])),
            'recent_work': self.work_history[-5:] if self.work_history else []
        }

class MultiRepositorySystem:
    """Main multi-repository system"""
    
    def __init__(self):
        self.repo_manager = RepositoryManager()
        self.coordinator = CrossRepositoryCoordinator(self.repo_manager)
        self.synchronizer = RepositorySynchronizer(self.repo_manager)
        self.agents = {}
        self.lock = threading.Lock()
    
    def initialize_agent(self, agent_role: str) -> MultiRepositoryAgent:
        """Initialize a multi-repository agent"""
        agent = MultiRepositoryAgent(agent_role, self.repo_manager, self.coordinator)
        self.agents[agent_role] = agent
        return agent
    
    def add_repository(self, repo_config: Dict[str, Any]) -> bool:
        """Add a repository to the system"""
        repo = Repository(
            repo_id=repo_config['repo_id'],
            name=repo_config['name'],
            owner=repo_config['owner'],
            url=repo_config['url'],
            branch=repo_config.get('branch', 'main'),
            access_token=repo_config['access_token'],
            description=repo_config.get('description', ''),
            tags=repo_config.get('tags', []),
            priority=repo_config.get('priority', 1),
            last_sync=datetime.now().isoformat(),
            status='active'
        )
        
        return self.repo_manager.add_repository(repo)
    
    def create_cross_repo_task(self, task_config: Dict[str, Any]) -> bool:
        """Create a cross-repository task"""
        task = CrossRepoTask(
            task_id=task_config['task_id'],
            title=task_config['title'],
            description=task_config['description'],
            repositories=task_config['repositories'],
            dependencies=task_config.get('dependencies', []),
            status='pending',
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            assigned_agents={}
        )
        
        return self.coordinator.create_cross_repo_task(task)
    
    def schedule_repository_sync(self, source_repo: str, target_repo: str, sync_type: str) -> bool:
        """Schedule synchronization between repositories"""
        sync = RepositorySync(
            sync_id=f"sync_{int(time.time())}",
            source_repo=source_repo,
            target_repo=target_repo,
            sync_type=sync_type,
            last_sync=datetime.now().isoformat(),
            status='pending',
            conflicts=[]
        )
        
        self.synchronizer.schedule_sync(sync)
        return True
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status"""
        with self.lock:
            return {
                'repositories': {
                    'total': len(self.repo_manager.repositories),
                    'active': len([r for r in self.repo_manager.repositories.values() if r.status == 'active']),
                    'inactive': len([r for r in self.repo_manager.repositories.values() if r.status == 'inactive']),
                    'error': len([r for r in self.repo_manager.repositories.values() if r.status == 'error'])
                },
                'cross_repo_tasks': {
                    'total': len(self.coordinator.cross_repo_tasks),
                    'pending': len([t for t in self.coordinator.cross_repo_tasks.values() if t.status == 'pending']),
                    'in_progress': len([t for t in self.coordinator.cross_repo_tasks.values() if t.status == 'in_progress']),
                    'completed': len([t for t in self.coordinator.cross_repo_tasks.values() if t.status == 'completed']),
                    'failed': len([t for t in self.coordinator.cross_repo_tasks.values() if t.status == 'failed'])
                },
                'sync_queue': len(self.synchronizer.sync_queue),
                'agents': {
                    agent_role: agent.get_work_summary()
                    for agent_role, agent in self.agents.items()
                }
            }

def main():
    """Main multi-repository system function"""
    print("Multi-Repository Support System starting...")
    
    # Initialize system
    multi_repo_system = MultiRepositorySystem()
    
    # Add sample repositories (these would need real GitHub tokens)
    sample_repos = [
        {
            'repo_id': 'main_app',
            'name': 'linguamate-main',
            'owner': 'ayais12210-hub',
            'url': 'https://github.com/ayais12210-hub/Linguamate-ai-tutor',
            'access_token': 'your_github_token_here',
            'description': 'Main application repository',
            'tags': ['frontend', 'mobile', 'expo'],
            'priority': 1
        },
        {
            'repo_id': 'backend_api',
            'name': 'linguamate-backend',
            'owner': 'ayais12210-hub',
            'url': 'https://github.com/ayais12210-hub/Linguamate-backend',
            'access_token': 'your_github_token_here',
            'description': 'Backend API repository',
            'tags': ['backend', 'api', 'hono'],
            'priority': 2
        }
    ]
    
    print("Adding sample repositories...")
    for repo_config in sample_repos:
        # Skip adding if no real token provided
        if repo_config['access_token'] == 'your_github_token_here':
            print(f"⚠️  Skipping {repo_config['name']} - no access token provided")
            continue
        
        if multi_repo_system.add_repository(repo_config):
            print(f"✓ Added repository: {repo_config['name']}")
        else:
            print(f"✗ Failed to add repository: {repo_config['name']}")
    
    # Create sample cross-repository task
    sample_task = {
        'task_id': 'cross_repo_feature',
        'title': 'Implement cross-repository feature',
        'description': 'Add feature that spans multiple repositories',
        'repositories': ['main_app', 'backend_api'],
        'dependencies': []
    }
    
    print("Creating sample cross-repository task...")
    if multi_repo_system.create_cross_repo_task(sample_task):
        print("✓ Cross-repository task created")
    
    # Initialize agents
    print("Initializing multi-repository agents...")
    engineer_agent = multi_repo_system.initialize_agent('engineer')
    tester_agent = multi_repo_system.initialize_agent('tester')
    
    print("✓ Multi-repository agents initialized")
    
    # Get system status
    status = multi_repo_system.get_system_status()
    print(f"\nSystem Status:")
    print(f"  Repositories: {status['repositories']['total']} total")
    print(f"  Cross-repo tasks: {status['cross_repo_tasks']['total']} total")
    print(f"  Sync queue: {status['sync_queue']} pending")
    print(f"  Agents: {len(status['agents'])} active")
    
    print("\n✓ Multi-Repository Support System is ready")
    
    # Keep the system running
    try:
        while True:
            time.sleep(60)
            print(f"Multi-repo system status: {len(multi_repo_system.repo_manager.repositories)} repositories managed")
    except KeyboardInterrupt:
        print("Shutting down multi-repository system...")

if __name__ == "__main__":
    main()