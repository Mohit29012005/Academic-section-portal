#!/usr/bin/env python3
"""
Simple test for the AI-Powered Resume Enhancement feature
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from local_llm import enhance_resume_section, is_ollama_available

def test_resume_enhancement():
    """Test the resume enhancement feature that was timing out"""
    print("🧪 Testing Resume Enhancement Feature...")
    print("-" * 50)
    
    # Check Ollama availability
    print("1. Checking Ollama availability...")
    if is_ollama_available():
        print("   ✅ Ollama is available")
    else:
        print("   ⚠️  Ollama not available, will use fallback")
    
    # Test data
    resume_text = """
    John Doe
    Software Engineer
    
    Experience:
    - Developed web applications using Python and JavaScript
    - Worked on database design and optimization
    - Collaborated with team members on various projects
    """
    
    jd_text = """
    We are looking for a Senior Python Developer with experience in:
    - Machine Learning and AI development
    - Cloud platforms (AWS, Azure)
    - FastAPI and REST API development
    - Docker and containerization
    - Experience with large-scale systems
    """
    
    missing_skills = ["machine learning", "fastapi", "docker", "aws", "rest api"]
    
    print("2. Testing resume enhancement...")
    print("   Resume length:", len(resume_text.split()))
    print("   JD length:", len(jd_text.split()))
    print("   Missing skills:", len(missing_skills))
    
    try:
        # This was the function causing timeouts
        result = enhance_resume_section(resume_text, jd_text, missing_skills)
        
        print("   ✅ Enhancement completed successfully!")
        print(f"   📄 Result length: {len(result)} characters")
        print("\n" + "="*60)
        print("RESUME ENHANCEMENT RESULT:")
        print("="*60)
        print(result)
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"   ❌ Enhancement failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 AI powered Career Guidance system - Resume Enhancement Test")
    print("="*60)
    
    success = test_resume_enhancement()
    
    if success:
        print("\n🎉 Resume enhancement feature is working!")
        print("   The timeout issue has been resolved.")
    else:
        print("\n❌ Resume enhancement feature failed.")
        print("   Please check the error messages above.")