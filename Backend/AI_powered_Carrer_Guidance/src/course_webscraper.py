"""
Course Web Scraper using Llama for Real-time Course Recommendations
Scrapes course data from various platforms and uses AI to suggest relevant courses
"""

import requests
import json
import re
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime
try:
    from .local_llm import call_local_llama, is_ollama_available
except ImportError:
    from local_llm import call_local_llama, is_ollama_available
import streamlit as st

@dataclass
class ScrapedCourse:
    title: str
    platform: str
    url: str
    price: str
    rating: Optional[float] = None
    duration: Optional[str] = None
    description: Optional[str] = None
    skills: List[str] = None

class CourseWebScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def search_courses_ai(self, skills: List[str], max_courses: int = 10) -> List[ScrapedCourse]:
        """Use AI to search for courses based on skills"""
        if not is_ollama_available():
            return self._get_fallback_courses(skills)
        
        try:
            # Create a prompt for AI to search for courses
            prompt = f"""
            I need to find online courses for these skills: {', '.join(skills)}
            
            Please search for relevant courses from these platforms:
            - Coursera
            - Udemy
            - edX
            - freeCodeCamp
            - LinkedIn Learning
            - Pluralsight
            - Codecademy
            
            For each course, provide:
            - Course title
            - Platform name
            - Estimated URL (use format like https://platform.com/course-title)
            - Price range (Free, $0-50, $50-100, $100+)
            - Difficulty level (Beginner, Intermediate, Advanced)
            - Duration estimate
            - Brief description
            - Key skills covered
            
            Format as JSON array with these fields:
            title, platform, url, price, difficulty, duration, description, skills
            
            Return up to {max_courses} courses that best match the skills: {', '.join(skills)}
            """
            
            ai_response = call_local_llama(prompt, temperature=0.7)
            
            # Parse AI response
            courses = self._parse_ai_course_response(ai_response, skills)
            
            return courses[:max_courses]
            
        except Exception as e:
            print(f"AI course search failed: {e}")
            return self._get_fallback_courses(skills)
    
    def _parse_ai_course_response(self, ai_response: str, skills: List[str]) -> List[ScrapedCourse]:
        """Parse AI response to extract course information"""
        courses = []
        
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
            if json_match:
                courses_data = json.loads(json_match.group())
                
                for course_data in courses_data:
                    if isinstance(course_data, dict):
                        course = ScrapedCourse(
                            title=course_data.get('title', 'Unknown Course'),
                            platform=course_data.get('platform', 'Unknown Platform'),
                            url=course_data.get('url', '#'),
                            price=course_data.get('price', 'Unknown'),
                            rating=course_data.get('rating'),
                            duration=course_data.get('duration'),
                            description=course_data.get('description', ''),
                            skills=course_data.get('skills', [])
                        )
                        courses.append(course)
        except Exception as e:
            print(f"Error parsing AI response: {e}")
        
        # If no courses found, create some based on skills
        if not courses:
            courses = self._create_courses_from_skills(skills)
        
        return courses
    
    def _create_courses_from_skills(self, skills: List[str]) -> List[ScrapedCourse]:
        """Create course suggestions based on skills when AI fails"""
        courses = []
        
        skill_course_mapping = {
            'python': [
                ('Python for Everybody', 'Coursera', 'https://www.coursera.org/specializations/python', 'Free'),
                ('Complete Python Bootcamp', 'Udemy', 'https://www.udemy.com/course/complete-python-bootcamp/', '$50-100'),
                ('Python Programming', 'freeCodeCamp', 'https://www.freecodecamp.org/learn/scientific-computing-with-python/', 'Free')
            ],
            'javascript': [
                ('JavaScript Algorithms and Data Structures', 'freeCodeCamp', 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', 'Free'),
                ('The Complete JavaScript Course', 'Udemy', 'https://www.udemy.com/course/the-complete-javascript-course/', '$50-100'),
                ('JavaScript Programming', 'Coursera', 'https://www.coursera.org/learn/javascript', 'Free')
            ],
            'data science': [
                ('Data Science Specialization', 'Coursera', 'https://www.coursera.org/specializations/jhu-data-science', 'Free'),
                ('Data Science with Python', 'Udemy', 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/', '$50-100'),
                ('Data Analysis with Python', 'freeCodeCamp', 'https://www.freecodecamp.org/learn/data-analysis-with-python/', 'Free')
            ],
            'machine learning': [
                ('Machine Learning Course', 'Coursera', 'https://www.coursera.org/learn/machine-learning', 'Free'),
                ('Complete Machine Learning', 'Udemy', 'https://www.udemy.com/course/machinelearning/', '$50-100'),
                ('Machine Learning with Python', 'freeCodeCamp', 'https://www.freecodecamp.org/learn/machine-learning-with-python/', 'Free')
            ],
            'web development': [
                ('Responsive Web Design', 'freeCodeCamp', 'https://www.freecodecamp.org/learn/responsive-web-design/', 'Free'),
                ('The Complete Web Developer', 'Udemy', 'https://www.udemy.com/course/the-complete-web-developer-zero-to-mastery/', '$50-100'),
                ('Web Development Specialization', 'Coursera', 'https://www.coursera.org/specializations/web-design', 'Free')
            ]
        }
        
        for skill in skills[:5]:  # Limit to 5 skills
            skill_lower = skill.lower()
            for platform_skill, course_list in skill_course_mapping.items():
                if platform_skill in skill_lower or skill_lower in platform_skill:
                    for title, platform, url, price in course_list:
                        course = ScrapedCourse(
                            title=title,
                            platform=platform,
                            url=url,
                            price=price,
                            rating=4.5,
                            duration="2-6 months",
                            description=f"Learn {skill} with this comprehensive course",
                            skills=[skill]
                        )
                        courses.append(course)
                    break
        
        return courses[:10]  # Return max 10 courses
    
    def _get_fallback_courses(self, skills: List[str]) -> List[ScrapedCourse]:
        """Fallback courses when AI is not available"""
        return self._create_courses_from_skills(skills)
    
    def get_course_recommendations(self, skills: List[str], difficulty: str = None, 
                                 course_type: str = None, max_courses: int = 10) -> List[ScrapedCourse]:
        """Get course recommendations based on skills and filters"""
        courses = self.search_courses_ai(skills, max_courses)
        
        # Apply filters
        if difficulty and difficulty != 'All':
            courses = [c for c in courses if difficulty.lower() in c.description.lower() or 
                      (difficulty.lower() == 'beginner' and 'beginner' in c.description.lower())]
        
        if course_type and course_type != 'All':
            courses = [c for c in courses if course_type.lower() in c.title.lower() or 
                      course_type.lower() in c.description.lower()]
        
        return courses[:max_courses]

# Initialize web scraper
@st.cache_resource
def get_course_webscraper():
    return CourseWebScraper()
