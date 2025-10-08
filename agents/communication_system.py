#!/usr/bin/env python3
"""
Agent Communication System for Multi-Agent Workforce
Handles inter-agent communication, coordination, and message passing
"""

import os
import sys
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import queue

# Add mcp_servers to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp_servers'))

class MessageType(Enum):
    TASK_ASSIGNMENT = "task_assignment"
    TASK_COMPLETION = "task_completion"
    TASK_UPDATE = "task_update"
    COORDINATION_REQUEST = "coordination_request"
    COORDINATION_RESPONSE = "coordination_response"
    ERROR_NOTIFICATION = "error_notification"
    STATUS_UPDATE = "status_update"
    DEPENDENCY_REQUEST = "dependency_request"
    DEPENDENCY_RESPONSE = "dependency_response"

class AgentRole(Enum):
    MANAGER = "manager"
    ENGINEER = "engineer"
    TESTER = "tester"
    DOCS = "docs"
    SECURITY = "security"

@dataclass
class AgentMessage:
    id: str
    sender: AgentRole
    recipient: Optional[AgentRole]
    message_type: MessageType
    content: Dict[str, Any]
    timestamp: str
    task_id: str
    priority: int = 1  # 1=low, 2=medium, 3=high, 4=critical

class AgentCommunicationHub:
    """Central hub for agent communication"""
    
    def __init__(self):
        self.message_queue = queue.PriorityQueue()
        self.active_agents = {}
        self.message_history = []
        self.coordination_channels = {}
        self.lock = threading.Lock()
    
    def register_agent(self, agent_role: AgentRole, agent_info: Dict[str, Any]):
        """Register an agent with the communication hub"""
        with self.lock:
            self.active_agents[agent_role] = {
                "info": agent_info,
                "last_seen": datetime.now().isoformat(),
                "status": "active"
            }
    
    def send_message(self, message: AgentMessage) -> bool:
        """Send a message to another agent"""
        try:
            with self.lock:
                # Add to message queue
                self.message_queue.put((message.priority, message))
                
                # Add to history
                self.message_history.append(asdict(message))
                
                # Limit history size
                if len(self.message_history) > 1000:
                    self.message_history = self.message_history[-500:]
            
            return True
        except Exception as e:
            print(f"Error sending message: {e}")
            return False
    
    def receive_message(self, agent_role: AgentRole, timeout: float = 1.0) -> Optional[AgentMessage]:
        """Receive a message for a specific agent"""
        try:
            # Check for messages directed to this agent or broadcast
            start_time = time.time()
            
            while time.time() - start_time < timeout:
                try:
                    priority, message = self.message_queue.get(timeout=0.1)
                    
                    # Check if message is for this agent or broadcast
                    if (message.recipient is None or 
                        message.recipient == agent_role or 
                        message.recipient == AgentRole.MANAGER):
                        
                        return message
                    else:
                        # Put message back in queue
                        self.message_queue.put((priority, message))
                        
                except queue.Empty:
                    continue
            
            return None
        except Exception as e:
            print(f"Error receiving message: {e}")
            return None
    
    def broadcast_message(self, sender: AgentRole, message_type: MessageType, 
                         content: Dict[str, Any], task_id: str, priority: int = 2):
        """Broadcast a message to all agents"""
        message = AgentMessage(
            id=f"broadcast_{int(time.time())}",
            sender=sender,
            recipient=None,  # None means broadcast
            message_type=message_type,
            content=content,
            timestamp=datetime.now().isoformat(),
            task_id=task_id,
            priority=priority
        )
        
        return self.send_message(message)
    
    def get_agent_status(self) -> Dict[str, Any]:
        """Get status of all registered agents"""
        with self.lock:
            return {
                "active_agents": len(self.active_agents),
                "agents": dict(self.active_agents),
                "message_queue_size": self.message_queue.qsize(),
                "total_messages": len(self.message_history)
            }

# Global communication hub instance
communication_hub = AgentCommunicationHub()

def create_message(sender: AgentRole, recipient: Optional[AgentRole], 
                   message_type: MessageType, content: Dict[str, Any], 
                   task_id: str, priority: int = 2) -> AgentMessage:
    """Create a new agent message"""
    return AgentMessage(
        id=f"msg_{int(time.time())}_{sender.value}",
        sender=sender,
        recipient=recipient,
        message_type=message_type,
        content=content,
        timestamp=datetime.now().isoformat(),
        task_id=task_id,
        priority=priority
    )

def send_task_assignment(assigner: AgentRole, assignee: AgentRole, 
                        task_details: Dict[str, Any], task_id: str):
    """Send a task assignment message"""
    message = create_message(
        sender=assigner,
        recipient=assignee,
        message_type=MessageType.TASK_ASSIGNMENT,
        content={
            "task_details": task_details,
            "deadline": task_details.get("deadline"),
            "requirements": task_details.get("requirements", [])
        },
        task_id=task_id,
        priority=3
    )
    
    return communication_hub.send_message(message)

def send_task_completion(sender: AgentRole, task_id: str, 
                        completion_details: Dict[str, Any]):
    """Send a task completion notification"""
    message = create_message(
        sender=sender,
        recipient=AgentRole.MANAGER,
        message_type=MessageType.TASK_COMPLETION,
        content={
            "completion_details": completion_details,
            "artifacts": completion_details.get("artifacts", []),
            "quality_metrics": completion_details.get("quality_metrics", {})
        },
        task_id=task_id,
        priority=2
    )
    
    return communication_hub.send_message(message)

def send_coordination_request(sender: AgentRole, request_type: str, 
                            request_data: Dict[str, Any], task_id: str):
    """Send a coordination request"""
    message = create_message(
        sender=sender,
        recipient=None,  # Broadcast
        message_type=MessageType.COORDINATION_REQUEST,
        content={
            "request_type": request_type,
            "request_data": request_data,
            "response_deadline": datetime.now().isoformat()
        },
        task_id=task_id,
        priority=2
    )
    
    return communication_hub.send_message(message)

def send_error_notification(sender: AgentRole, error_details: Dict[str, Any], 
                           task_id: str):
    """Send an error notification"""
    message = create_message(
        sender=sender,
        recipient=AgentRole.MANAGER,
        message_type=MessageType.ERROR_NOTIFICATION,
        content={
            "error_details": error_details,
            "severity": error_details.get("severity", "medium"),
            "suggested_action": error_details.get("suggested_action")
        },
        task_id=task_id,
        priority=4  # Critical priority for errors
    )
    
    return communication_hub.send_message(message)

def send_dependency_request(sender: AgentRole, dependency_type: str, 
                           dependency_data: Dict[str, Any], task_id: str):
    """Send a dependency request"""
    message = create_message(
        sender=sender,
        recipient=None,  # Broadcast to find appropriate agent
        message_type=MessageType.DEPENDENCY_REQUEST,
        content={
            "dependency_type": dependency_type,
            "dependency_data": dependency_data,
            "urgency": dependency_data.get("urgency", "normal")
        },
        task_id=task_id,
        priority=3
    )
    
    return communication_hub.send_message(message)

def handle_coordination_request(message: AgentMessage, agent_role: AgentRole) -> bool:
    """Handle a coordination request"""
    request_type = message.content.get("request_type")
    request_data = message.content.get("request_data", {})
    
    if request_type == "resource_sharing":
        # Handle resource sharing requests
        return handle_resource_sharing_request(request_data, agent_role)
    
    elif request_type == "dependency_resolution":
        # Handle dependency resolution requests
        return handle_dependency_resolution_request(request_data, agent_role)
    
    elif request_type == "conflict_resolution":
        # Handle conflict resolution requests
        return handle_conflict_resolution_request(request_data, agent_role)
    
    return False

def handle_resource_sharing_request(request_data: Dict[str, Any], agent_role: AgentRole) -> bool:
    """Handle resource sharing requests"""
    resource_type = request_data.get("resource_type")
    
    if resource_type == "test_data" and agent_role == AgentRole.TESTER:
        # Tester can provide test data
        return True
    
    elif resource_type == "documentation" and agent_role == AgentRole.DOCS:
        # Docs agent can provide documentation
        return True
    
    elif resource_type == "security_scan" and agent_role == AgentRole.SECURITY:
        # Security agent can provide security scans
        return True
    
    return False

def handle_dependency_resolution_request(request_data: Dict[str, Any], agent_role: AgentRole) -> bool:
    """Handle dependency resolution requests"""
    dependency_type = request_data.get("dependency_type")
    
    if dependency_type == "test_coverage" and agent_role == AgentRole.TESTER:
        return True
    
    elif dependency_type == "documentation" and agent_role == AgentRole.DOCS:
        return True
    
    elif dependency_type == "security_validation" and agent_role == AgentRole.SECURITY:
        return True
    
    return False

def handle_conflict_resolution_request(request_data: Dict[str, Any], agent_role: AgentRole) -> bool:
    """Handle conflict resolution requests"""
    conflict_type = request_data.get("conflict_type")
    
    if conflict_type == "code_conflict" and agent_role == AgentRole.ENGINEER:
        return True
    
    elif conflict_type == "test_conflict" and agent_role == AgentRole.TESTER:
        return True
    
    return False

def start_agent_communication_listener(agent_role: AgentRole):
    """Start listening for messages for a specific agent"""
    def listener():
        while True:
            try:
                message = communication_hub.receive_message(agent_role, timeout=1.0)
                
                if message:
                    print(f"[{agent_role.value}] Received message: {message.message_type.value}")
                    
                    # Handle different message types
                    if message.message_type == MessageType.TASK_ASSIGNMENT:
                        handle_task_assignment(message, agent_role)
                    
                    elif message.message_type == MessageType.COORDINATION_REQUEST:
                        handle_coordination_request(message, agent_role)
                    
                    elif message.message_type == MessageType.DEPENDENCY_REQUEST:
                        handle_dependency_request(message, agent_role)
                    
                    elif message.message_type == MessageType.ERROR_NOTIFICATION:
                        handle_error_notification(message, agent_role)
                
                time.sleep(0.1)  # Small delay to prevent busy waiting
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error in communication listener: {e}")
                time.sleep(1)
    
    # Start listener in a separate thread
    listener_thread = threading.Thread(target=listener, daemon=True)
    listener_thread.start()
    return listener_thread

def handle_task_assignment(message: AgentMessage, agent_role: AgentRole):
    """Handle task assignment messages"""
    task_details = message.content.get("task_details", {})
    print(f"[{agent_role.value}] Task assigned: {task_details.get('title', 'Unknown')}")
    
    # Process the task assignment
    # This would typically trigger the agent's main processing logic

def handle_dependency_request(message: AgentMessage, agent_role: AgentRole):
    """Handle dependency request messages"""
    dependency_type = message.content.get("dependency_type")
    
    # Check if this agent can fulfill the dependency
    if can_fulfill_dependency(dependency_type, agent_role):
        # Send dependency response
        response_message = create_message(
            sender=agent_role,
            recipient=message.sender,
            message_type=MessageType.DEPENDENCY_RESPONSE,
            content={
                "dependency_type": dependency_type,
                "fulfillment_data": get_dependency_fulfillment_data(dependency_type, agent_role),
                "estimated_completion": datetime.now().isoformat()
            },
            task_id=message.task_id,
            priority=2
        )
        
        communication_hub.send_message(response_message)

def handle_error_notification(message: AgentMessage, agent_role: AgentRole):
    """Handle error notification messages"""
    error_details = message.content.get("error_details", {})
    severity = error_details.get("severity", "medium")
    
    print(f"[{agent_role.value}] Error notification received (severity: {severity})")
    
    # Take appropriate action based on error severity and agent role
    if severity == "critical" and agent_role == AgentRole.MANAGER:
        # Manager should coordinate response to critical errors
        pass

def can_fulfill_dependency(dependency_type: str, agent_role: AgentRole) -> bool:
    """Check if an agent can fulfill a specific dependency"""
    dependency_capabilities = {
        AgentRole.TESTER: ["test_coverage", "test_data", "quality_metrics"],
        AgentRole.DOCS: ["documentation", "api_docs", "user_guides"],
        AgentRole.SECURITY: ["security_scan", "vulnerability_assessment", "compliance_check"],
        AgentRole.ENGINEER: ["code_implementation", "bug_fix", "feature_development"],
        AgentRole.MANAGER: ["task_coordination", "resource_allocation", "conflict_resolution"]
    }
    
    return dependency_type in dependency_capabilities.get(agent_role, [])

def get_dependency_fulfillment_data(dependency_type: str, agent_role: AgentRole) -> Dict[str, Any]:
    """Get data for fulfilling a dependency"""
    # This would return actual data based on the dependency type and agent role
    return {
        "fulfillment_type": dependency_type,
        "agent_role": agent_role.value,
        "data": f"Sample data for {dependency_type} from {agent_role.value}"
    }

def main():
    """Main communication system function"""
    print("Agent Communication System starting...")
    
    # Register agents
    communication_hub.register_agent(AgentRole.MANAGER, {
        "name": "Manager Agent",
        "capabilities": ["task_coordination", "resource_allocation"],
        "status": "active"
    })
    
    communication_hub.register_agent(AgentRole.ENGINEER, {
        "name": "Engineer Agent", 
        "capabilities": ["code_implementation", "bug_fix"],
        "status": "active"
    })
    
    communication_hub.register_agent(AgentRole.TESTER, {
        "name": "Tester Agent",
        "capabilities": ["test_coverage", "quality_assurance"],
        "status": "active"
    })
    
    communication_hub.register_agent(AgentRole.DOCS, {
        "name": "Docs Agent",
        "capabilities": ["documentation", "api_docs"],
        "status": "active"
    })
    
    communication_hub.register_agent(AgentRole.SECURITY, {
        "name": "Security Agent",
        "capabilities": ["security_scan", "vulnerability_assessment"],
        "status": "active"
    })
    
    print("✓ All agents registered")
    
    # Start communication listeners for each agent
    listeners = []
    for agent_role in AgentRole:
        listener = start_agent_communication_listener(agent_role)
        listeners.append(listener)
    
    print("✓ Communication listeners started")
    
    # Test communication
    print("Testing communication...")
    
    # Send a test coordination request
    send_coordination_request(
        sender=AgentRole.ENGINEER,
        request_type="resource_sharing",
        request_data={"resource_type": "test_data"},
        task_id="test-task"
    )
    
    # Send a test task assignment
    send_task_assignment(
        assigner=AgentRole.MANAGER,
        assignee=AgentRole.ENGINEER,
        task_details={"title": "Test Task", "requirements": ["implement", "test"]},
        task_id="test-task"
    )
    
    print("✓ Test messages sent")
    
    # Keep the system running
    try:
        while True:
            status = communication_hub.get_agent_status()
            print(f"Communication hub status: {status['active_agents']} agents, {status['message_queue_size']} messages in queue")
            time.sleep(10)
    except KeyboardInterrupt:
        print("Shutting down communication system...")

if __name__ == "__main__":
    main()