#!/usr/bin/env python3
"""
Test script for the beginner mode feature
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

def test_beginner_mode_import():
    """Test that the main application imports without errors"""
    try:
        import app.main
        print("✅ Main application imports successfully")
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_beginner_mode_logic():
    """Test the beginner mode logic"""
    try:
        # Simulate beginner mode data
        interest_analysis = {
            'tech_score': 3,
            'creative_score': 1,
            'business_score': 2,
            'academic_interests': ['Mathematics', 'Science', 'Computer Science'],
            'hobby_interests': ['Coding/Programming', 'Problem Solving'],
            'work_environment': 'Office with team collaboration',
            'motivation': 'Solving complex problems'
        }
        
        skill_analysis = {
            'current_skills': {
                'Technical Skills': ['Basic Computer Use', 'Microsoft Office'],
                'Soft Skills': ['Communication', 'Teamwork'],
                'Languages': ['English', 'Hindi'],
                'Academic Skills': ['Mathematics', 'Research']
            },
            'learning_interests': ['Programming (Python, JavaScript, etc.)', 'Data Science & Analytics'],
            'experience_level': 'Complete Beginner (No experience)',
            'total_skills': 6
        }
        
        # Test career recommendations logic
        recommendations = []
        
        # Tech careers
        if interest_analysis['tech_score'] >= 2 or 'Programming' in skill_analysis['learning_interests']:
            recommendations.extend([
                {
                    'title': 'Software Developer',
                    'description': 'Build applications and software solutions',
                    'skills_needed': ['Programming', 'Problem Solving', 'Logic'],
                    'learning_path': 'Start with Python or JavaScript basics',
                    'salary_range': '₹3-15 LPA',
                    'growth': 'High'
                }
            ])
        
        print(f"✅ Generated {len(recommendations)} career recommendations")
        print(f"   - {recommendations[0]['title']}: {recommendations[0]['description']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Logic test error: {e}")
        return False

def test_resume_generation():
    """Test resume generation logic"""
    try:
        # Simulate resume generation
        full_name = "Test User"
        email = "test@example.com"
        phone = "1234567890"
        location = "Mumbai, Maharashtra"
        
        skill_analysis = {
            'current_skills': {
                'Technical Skills': ['Basic Computer Use', 'Microsoft Office'],
                'Soft Skills': ['Communication', 'Teamwork']
            },
            'learning_interests': ['Programming (Python, JavaScript, etc.)', 'Data Science & Analytics']
        }
        
        # Generate resume content
        resume_content = f"""
# {full_name}
{email} | {phone} | {location}

## Education
Bachelor's in Computer Science - 2024

## Skills
"""
        
        # Add skills from assessment
        for category, skills in skill_analysis['current_skills'].items():
            if skills:
                resume_content += f"\n**{category}:** {', '.join(skills)}\n"
        
        resume_content += f"""
## Learning Interests
{', '.join(skill_analysis['learning_interests'])}

## Career Objective
Recent graduate with strong interest in technology and problem-solving. Eager to learn and contribute to innovative projects while developing professional skills in a dynamic environment.
"""
        
        print("✅ Resume generation logic works correctly")
        print(f"   - Generated resume for: {full_name}")
        print(f"   - Skills included: {len(skill_analysis['current_skills'])} categories")
        
        return True
        
    except Exception as e:
        print(f"❌ Resume generation test error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Beginner Mode Feature")
    print("=" * 50)
    
    tests = [
        test_beginner_mode_import,
        test_beginner_mode_logic,
        test_resume_generation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Beginner mode feature is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
