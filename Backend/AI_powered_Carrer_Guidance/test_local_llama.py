#!/usr/bin/env python3
"""
Test script for local Llama integration
Run this to verify the Ollama API connection works
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from local_llm import call_local_llama, enhance_resume_section, generate_project_ideas

def test_basic_connection():
    """Test basic connection to Ollama API"""
    print("Testing basic connection to Ollama API...")
    
    test_prompt = "Hello, can you respond with 'Connection successful'?"
    response = call_local_llama(test_prompt)
    
    print(f"Response: {response}")
    return "Connection successful" in response.lower()

def test_resume_enhancement():
    """Test resume enhancement functionality"""
    print("\nTesting resume enhancement...")
    
    resume_text = "I have experience with Python programming and data analysis."
    jd_text = "We are looking for a Python developer with machine learning experience."
    missing_skills = ["machine learning", "deep learning"]
    
    response = enhance_resume_section(resume_text, jd_text, missing_skills)
    print(f"Enhanced resume: {response}")
    return len(response) > 50  # Basic check for meaningful response

def test_project_ideas():
    """Test project ideas generation"""
    print("\nTesting project ideas generation...")
    
    resume_text = "I am a Python developer with experience in web development and data analysis."
    skills = ["Python", "Django", "Pandas", "SQL"]
    
    response = generate_project_ideas(resume_text, skills)
    print(f"Project ideas: {response}")
    return len(response) > 50  # Basic check for meaningful response

if __name__ == "__main__":
    print("🚀 Testing Local Llama Integration")
    print("=" * 50)
    
    # Test basic connection
    if test_basic_connection():
        print("✅ Basic connection test passed")
    else:
        print("❌ Basic connection test failed")
        print("Make sure Ollama is running on localhost:11434")
        sys.exit(1)
    
    # Test resume enhancement
    if test_resume_enhancement():
        print("✅ Resume enhancement test passed")
    else:
        print("❌ Resume enhancement test failed")
    
    # Test project ideas
    if test_project_ideas():
        print("✅ Project ideas test passed")
    else:
        print("❌ Project ideas test failed")
    
    print("\n🎉 All tests completed!")
    print("\nTo run the full application:")
    print("streamlit run app/main.py")

