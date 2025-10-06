#!/usr/bin/env python3
"""
Test script for MCP ingest server
"""
import json
import subprocess
import sys

def test_ingest_server():
    """Test the ingest server with a simple URL"""
    print("Testing MCP ingest server...")
    
    # Test with a simple URL
    test_url = "https://www.bbc.co.uk/news"
    
    # Create the MCP call
    call_data = {
        "type": "tools/call",
        "name": "ingest_from_index",
        "arguments": {
            "index_url": test_url,
            "selector": "a.gs-c-promo-heading",
            "language": "en",
            "max_links": 2
        }
    }
    
    try:
        # Call the server
        result = subprocess.run(
            ["python3", "mcp_servers/ingest_server.py"],
            input=json.dumps(call_data),
            text=True,
            capture_output=True,
            timeout=30
        )
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if "result" in response and "lessons" in response["result"]:
                lessons = response["result"]["lessons"]
                print(f"✅ Successfully ingested {len(lessons)} lessons")
                for i, lesson in enumerate(lessons[:2]):  # Show first 2
                    print(f"  {i+1}. {lesson.get('title', 'No title')[:50]}...")
                return True
            else:
                print(f"❌ Unexpected response: {response}")
                return False
        else:
            print(f"❌ Server error: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Request timed out")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_ingest_server()
    sys.exit(0 if success else 1)