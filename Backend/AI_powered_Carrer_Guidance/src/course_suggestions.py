"""
Enhanced Course Suggestion System for Evolvex AI
Provides comprehensive course recommendations based on skills and career goals
"""

import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
try:
    from .course_webscraper import get_course_webscraper
except ImportError:
    from course_webscraper import get_course_webscraper

class DifficultyLevel(Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

class CourseType(Enum):
    TUTORIAL = "Tutorial"
    COURSE = "Course"
    SPECIALIZATION = "Specialization"
    CERTIFICATION = "Certification"
    BOOTCAMP = "Bootcamp"
    WORKSHOP = "Workshop"

@dataclass
class Course:
    title: str
    platform: str
    url: str
    difficulty: DifficultyLevel
    course_type: CourseType
    duration: str
    rating: Optional[float] = None
    price: Optional[str] = None
    description: Optional[str] = None
    skills_covered: List[str] = None
    prerequisites: List[str] = None

# Comprehensive course database with multiple platforms
COURSE_DATABASE = {
    # Programming Languages
    'python': [
        Course(
            title="Python for Everybody Specialization",
            platform="Coursera",
            url="https://www.coursera.org/specializations/python",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.SPECIALIZATION,
            duration="7 months",
            rating=4.8,
            price="Free (audit) / $49/month",
            description="Complete Python programming course covering basics to advanced concepts",
            skills_covered=["Python", "Data Structures", "Web Scraping", "Databases"],
            prerequisites=[]
        ),
        Course(
            title="Complete Python Bootcamp",
            platform="Udemy",
            url="https://www.udemy.com/course/complete-python-bootcamp/",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.COURSE,
            duration="22 hours",
            rating=4.6,
            price="$89.99",
            description="Learn Python like a Professional! Start from the basics and go all the way to creating your own applications",
            skills_covered=["Python", "OOP", "Error Handling", "File I/O"],
            prerequisites=[]
        ),
        Course(
            title="Advanced Python Programming",
            platform="edX",
            url="https://www.edx.org/course/advanced-python-programming",
            difficulty=DifficultyLevel.ADVANCED,
            course_type=CourseType.COURSE,
            duration="12 weeks",
            rating=4.5,
            price="Free (audit) / $199 (certificate)",
            description="Advanced Python concepts including decorators, generators, and metaclasses",
            skills_covered=["Advanced Python", "Design Patterns", "Performance Optimization"],
            prerequisites=["Python basics", "OOP concepts"]
        )
    ],
    
    'javascript': [
        Course(
            title="JavaScript Algorithms and Data Structures",
            platform="freeCodeCamp",
            url="https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.COURSE,
            duration="300 hours",
            rating=4.8,
            price="Free",
            description="Learn JavaScript fundamentals and algorithms",
            skills_covered=["JavaScript", "Algorithms", "Data Structures", "ES6"],
            prerequisites=[]
        ),
        Course(
            title="The Complete JavaScript Course 2024",
            platform="Udemy",
            url="https://www.udemy.com/course/the-complete-javascript-course/",
            difficulty=DifficultyLevel.INTERMEDIATE,
            course_type=CourseType.COURSE,
            duration="69 hours",
            rating=4.7,
            price="$89.99",
            description="Modern JavaScript from the beginning - all the way up to JS expert level",
            skills_covered=["JavaScript", "ES6+", "Async Programming", "DOM Manipulation"],
            prerequisites=["Basic programming knowledge"]
        )
    ],
    
    'java': [
        Course(
            title="Java Programming and Software Engineering Fundamentals",
            platform="Coursera",
            url="https://www.coursera.org/specializations/java-programming",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.SPECIALIZATION,
            duration="6 months",
            rating=4.6,
            price="Free (audit) / $49/month",
            description="Learn to code in Java and improve your programming and problem-solving skills",
            skills_covered=["Java", "OOP", "Data Structures", "Algorithms"],
            prerequisites=[]
        ),
        Course(
            title="Java Programming Masterclass",
            platform="Udemy",
            url="https://www.udemy.com/course/java-the-complete-java-developer-course/",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.COURSE,
            duration="80 hours",
            rating=4.6,
            price="$89.99",
            description="Learn Java In This Course And Become a Computer Programmer",
            skills_covered=["Java", "Spring Framework", "Maven", "JUnit"],
            prerequisites=[]
        )
    ],
    
    # Web Development
    'react': [
        Course(
            title="React - The Complete Guide",
            platform="Udemy",
            url="https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
            difficulty=DifficultyLevel.INTERMEDIATE,
            course_type=CourseType.COURSE,
            duration="48 hours",
            rating=4.6,
            price="$89.99",
            description="Dive in and learn React.js from scratch! Learn React, Hooks, Redux, React Router, Next.js",
            skills_covered=["React", "Redux", "React Router", "Hooks"],
            prerequisites=["JavaScript", "HTML", "CSS"]
        ),
        Course(
            title="Front-End Web Development with React",
            platform="Coursera",
            url="https://www.coursera.org/learn/front-end-react",
            difficulty=DifficultyLevel.INTERMEDIATE,
            course_type=CourseType.COURSE,
            duration="5 weeks",
            rating=4.7,
            price="Free (audit) / $49/month",
            description="Learn front-end web development with React",
            skills_covered=["React", "JSX", "Components", "State Management"],
            prerequisites=["JavaScript", "HTML", "CSS"]
        )
    ],
    
    'nodejs': [
        Course(
            title="Node.js, Express, MongoDB & More: The Complete Bootcamp",
            platform="Udemy",
            url="https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/",
            difficulty=DifficultyLevel.INTERMEDIATE,
            course_type=CourseType.BOOTCAMP,
            duration="40 hours",
            rating=4.7,
            price="$89.99",
            description="Master Node by building a real-world RESTful API and web app with authentication",
            skills_covered=["Node.js", "Express", "MongoDB", "REST APIs"],
            prerequisites=["JavaScript", "HTML", "CSS"]
        )
    ],
    
    # Data Science & ML
    'machine learning': [
        Course(
            title="Machine Learning",
            platform="Coursera",
            url="https://www.coursera.org/learn/machine-learning",
            difficulty=DifficultyLevel.INTERMEDIATE,
            course_type=CourseType.COURSE,
            duration="11 weeks",
            rating=4.9,
            price="Free (audit) / $49/month",
            description="Stanford's machine learning course by Andrew Ng",
            skills_covered=["Machine Learning", "Linear Regression", "Neural Networks", "Clustering"],
            prerequisites=["Linear Algebra", "Statistics", "Programming"]
        ),
        Course(
            title="Deep Learning Specialization",
            platform="Coursera",
            url="https://www.coursera.org/specializations/deep-learning",
            difficulty=DifficultyLevel.ADVANCED,
            course_type=CourseType.SPECIALIZATION,
            duration="5 months",
            rating=4.9,
            price="Free (audit) / $49/month",
            description="Master Deep Learning and Break into AI",
            skills_covered=["Deep Learning", "Neural Networks", "CNN", "RNN"],
            prerequisites=["Machine Learning", "Python", "Linear Algebra"]
        )
    ],
    
    'data science': [
        Course(
            title="IBM Data Science Professional Certificate",
            platform="Coursera",
            url="https://www.coursera.org/professional-certificates/ibm-data-science",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.CERTIFICATION,
            duration="10 months",
            rating=4.6,
            price="Free (audit) / $49/month",
            description="Launch your career in data science",
            skills_covered=["Python", "SQL", "Machine Learning", "Data Visualization"],
            prerequisites=[]
        ),
        Course(
            title="Data Science Bootcamp",
            platform="Udemy",
            url="https://www.udemy.com/course/the-data-science-course-complete-data-science-bootcamp/",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.BOOTCAMP,
            duration="25 hours",
            rating=4.4,
            price="$89.99",
            description="Complete Data Science Training: Mathematics, Statistics, Python, Advanced Statistics",
            skills_covered=["Statistics", "Python", "Machine Learning", "Data Analysis"],
            prerequisites=[]
        )
    ],
    
    # Cloud & DevOps
    'aws': [
        Course(
            title="AWS Fundamentals Specialization",
            platform="Coursera",
            url="https://www.coursera.org/specializations/aws-fundamentals",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.SPECIALIZATION,
            duration="4 months",
            rating=4.6,
            price="Free (audit) / $49/month",
            description="Learn AWS fundamentals and best practices",
            skills_covered=["AWS", "EC2", "S3", "Lambda"],
            prerequisites=[]
        ),
        Course(
            title="AWS Certified Solutions Architect",
            platform="A Cloud Guru",
            url="https://acloudguru.com/course/aws-certified-solutions-architect-associate-saa-c02",
            difficulty=DifficultyLevel.INTERMEDIATE,
            course_type=CourseType.CERTIFICATION,
            duration="40 hours",
            rating=4.7,
            price="$29/month",
            description="Prepare for AWS Solutions Architect certification",
            skills_covered=["AWS Architecture", "Security", "Networking", "Storage"],
            prerequisites=["Basic AWS knowledge"]
        )
    ],
    
    'docker': [
        Course(
            title="Docker for the Absolute Beginner",
            platform="Udemy",
            url="https://www.udemy.com/course/docker-for-the-absolute-beginner/",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.COURSE,
            duration="4 hours",
            rating=4.6,
            price="$89.99",
            description="Learn Docker with Hands On Coding Exercises",
            skills_covered=["Docker", "Containers", "Images", "Docker Compose"],
            prerequisites=[]
        )
    ],
    
    'kubernetes': [
        Course(
            title="Kubernetes for the Absolute Beginners",
            platform="Udemy",
            url="https://www.udemy.com/course/kubernetes-for-the-absolute-beginners/",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.COURSE,
            duration="5 hours",
            rating=4.5,
            price="$89.99",
            description="Hands-on Kubernetes with Docker",
            skills_covered=["Kubernetes", "Pods", "Services", "Deployments"],
            prerequisites=["Docker basics"]
        )
    ],
    
    # Databases
    'sql': [
        Course(
            title="SQL for Data Science",
            platform="Coursera",
            url="https://www.coursera.org/learn/sql-for-data-science",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.COURSE,
            duration="4 weeks",
            rating=4.6,
            price="Free (audit) / $49/month",
            description="Learn SQL for data analysis and data science",
            skills_covered=["SQL", "Database Design", "Query Optimization"],
            prerequisites=[]
        )
    ],
    
    'mongodb': [
        Course(
            title="MongoDB University",
            platform="MongoDB",
            url="https://university.mongodb.com/",
            difficulty=DifficultyLevel.BEGINNER,
            course_type=CourseType.COURSE,
            duration="Self-paced",
            rating=4.7,
            price="Free",
            description="Official MongoDB courses and certifications",
            skills_covered=["MongoDB", "NoSQL", "Database Design"],
            prerequisites=[]
        )
    ],
    
    # AI & LLM
    'openai': [
        Course(
            title="ChatGPT Prompt Engineering for Developers",
            platform="DeepLearning.AI",
            url="https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/",
            difficulty=DifficultyLevel.INTERMEDIATE,
            course_type=CourseType.TUTORIAL,
            duration="1.5 hours",
            rating=4.8,
            price="Free",
            description="Learn prompt engineering best practices for developers",
            skills_covered=["Prompt Engineering", "OpenAI API", "LLM Applications"],
            prerequisites=["Basic programming"]
        )
    ],
    
    'langchain': [
        Course(
            title="LangChain for LLM Application Development",
            platform="DeepLearning.AI",
            url="https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/",
            difficulty=DifficultyLevel.INTERMEDIATE,
            course_type=CourseType.COURSE,
            duration="1 hour",
            rating=4.7,
            price="Free",
            description="Build applications with LLMs through composability",
            skills_covered=["LangChain", "LLM Applications", "Vector Databases"],
            prerequisites=["Python", "Basic ML knowledge"]
        )
    ]
}

def get_course_suggestions(skills: List[str], 
                          difficulty_preference: Optional[str] = None,
                          course_type_preference: Optional[str] = None,
                          max_courses_per_skill: int = 3) -> Dict[str, List[Course]]:
    """
    Get course suggestions for a list of skills
    
    Args:
        skills: List of skills to find courses for
        difficulty_preference: Preferred difficulty level (beginner, intermediate, advanced)
        course_type_preference: Preferred course type (tutorial, course, specialization, etc.)
        max_courses_per_skill: Maximum number of courses to return per skill
    
    Returns:
        Dictionary mapping skills to lists of recommended courses
    """
    suggestions = {}
    
    for skill in skills:
        skill_lower = skill.lower().strip()
        skill_courses = []
        
        # Direct match
        if skill_lower in COURSE_DATABASE:
            skill_courses = COURSE_DATABASE[skill_lower].copy()
        else:
            # Handle variations and partial matches
            for db_skill, courses in COURSE_DATABASE.items():
                if (skill_lower in db_skill or 
                    db_skill in skill_lower or 
                    skill_lower.replace(' ', '') in db_skill.replace(' ', '')):
                    skill_courses.extend(courses)
                    break
        
        # Filter by preferences
        if difficulty_preference:
            difficulty_enum = DifficultyLevel(difficulty_preference.title())
            skill_courses = [c for c in skill_courses if c.difficulty == difficulty_enum]
        
        if course_type_preference:
            course_type_enum = CourseType(course_type_preference.title())
            skill_courses = [c for c in skill_courses if c.course_type == course_type_enum]
        
        # Sort by rating (descending) and limit results
        skill_courses.sort(key=lambda x: x.rating or 0, reverse=True)
        suggestions[skill] = skill_courses[:max_courses_per_skill]
    
    return suggestions

def get_learning_path(skills: List[str], 
                     current_level: str = "beginner",
                     career_goal: Optional[str] = None) -> Dict[str, List[Course]]:
    """
    Generate a structured learning path for skills development
    
    Args:
        skills: List of skills to develop
        current_level: Current skill level (beginner, intermediate, advanced)
        career_goal: Optional career goal to tailor the path
    
    Returns:
        Dictionary with structured learning path
    """
    learning_path = {
        "foundation": [],
        "intermediate": [],
        "advanced": [],
        "specialization": []
    }
    
    for skill in skills:
        skill_lower = skill.lower().strip()
        
        if skill_lower in COURSE_DATABASE:
            courses = COURSE_DATABASE[skill_lower]
            
            for course in courses:
                if course.difficulty == DifficultyLevel.BEGINNER:
                    learning_path["foundation"].append(course)
                elif course.difficulty == DifficultyLevel.INTERMEDIATE:
                    learning_path["intermediate"].append(course)
                elif course.difficulty == DifficultyLevel.ADVANCED:
                    learning_path["advanced"].append(course)
                
                if course.course_type in [CourseType.SPECIALIZATION, CourseType.CERTIFICATION]:
                    learning_path["specialization"].append(course)
    
    # Remove duplicates and sort by rating
    for level in learning_path:
        seen = set()
        unique_courses = []
        for course in learning_path[level]:
            if course.title not in seen:
                seen.add(course.title)
                unique_courses.append(course)
        learning_path[level] = sorted(unique_courses, key=lambda x: x.rating or 0, reverse=True)
    
    return learning_path

def get_skill_gap_courses(missing_skills: List[str], 
                         resume_skills: List[str],
                         job_requirements: List[str]) -> Dict[str, List[Course]]:
    """
    Get courses specifically for skills gaps identified in job matching
    
    Args:
        missing_skills: Skills missing from resume
        resume_skills: Skills present in resume
        job_requirements: All job requirements
    
    Returns:
        Dictionary with prioritized course recommendations
    """
    # Prioritize missing skills
    priority_skills = missing_skills[:5]  # Top 5 missing skills
    
    # Get courses for missing skills
    gap_courses = get_course_suggestions(priority_skills, max_courses_per_skill=2)
    
    # Add complementary skills courses
    complementary_skills = []
    for skill in resume_skills[:3]:  # Top 3 existing skills
        if skill.lower() in COURSE_DATABASE:
            # Find related skills
            related_courses = COURSE_DATABASE[skill.lower()]
            for course in related_courses:
                if course.skills_covered:
                    for covered_skill in course.skills_covered:
                        if (covered_skill.lower() not in [s.lower() for s in resume_skills] and
                            covered_skill.lower() not in [s.lower() for s in priority_skills]):
                            complementary_skills.append(covered_skill)
    
    # Remove duplicates and get courses for complementary skills
    complementary_skills = list(set(complementary_skills))[:3]
    if complementary_skills:
        gap_courses.update(get_course_suggestions(complementary_skills, max_courses_per_skill=1))
    
    return gap_courses

def format_course_suggestions(suggestions: Dict[str, List[Course]]) -> str:
    """
    Format course suggestions for display in the UI
    
    Args:
        suggestions: Dictionary of skill to courses mapping
    
    Returns:
        Formatted markdown string
    """
    if not suggestions:
        return "No course suggestions available."
    
    output = ["## 📚 Recommended Courses for Skill Development\n"]
    
    for skill, courses in suggestions.items():
        if not courses:
            continue
            
        output.append(f"### 🎯 {skill.title()}")
        output.append("")
        
        for i, course in enumerate(courses, 1):
            output.append(f"**{i}. {course.title}**")
            output.append(f"   - **Platform**: {course.platform}")
            output.append(f"   - **Type**: {course.course_type.value}")
            output.append(f"   - **Difficulty**: {course.difficulty.value}")
            output.append(f"   - **Duration**: {course.duration}")
            
            if course.rating:
                output.append(f"   - **Rating**: ⭐ {course.rating}/5.0")
            
            if course.price:
                output.append(f"   - **Price**: {course.price}")
            
            if course.description:
                output.append(f"   - **Description**: {course.description}")
            
            if course.skills_covered:
                skills_str = ", ".join(course.skills_covered[:5])
                output.append(f"   - **Skills Covered**: {skills_str}")
            
            output.append(f"   - **Link**: [Enroll Here]({course.url})")
            output.append("")
    
    return "\n".join(output)

def get_platform_summary(suggestions: Dict[str, List[Course]]) -> Dict[str, int]:
    """
    Get summary of courses by platform
    
    Args:
        suggestions: Dictionary of skill to courses mapping
    
    Returns:
        Dictionary with platform counts
    """
    platform_counts = {}
    
    for courses in suggestions.values():
        for course in courses:
            platform = course.platform
            platform_counts[platform] = platform_counts.get(platform, 0) + 1
    
    return platform_counts

def get_ai_course_recommendations(skills: List[str], difficulty_preference: str = None, 
                                course_type_preference: str = None, max_courses_per_skill: int = 3) -> Dict[str, List[Course]]:
    """Get AI-powered course recommendations using web scraping + Llama AI"""
    try:
        # Try web scraping first (with simple timeout)
        suggestions = {}
        
        try:
            webscraper = get_course_webscraper()
            scraped_courses = webscraper.get_course_recommendations(
                skills, difficulty_preference, course_type_preference, 
                max_courses_per_skill * len(skills)
            )
            
            # Convert scraped courses to Course objects
            for skill in skills:
                skill_courses = []
                for scraped_course in scraped_courses:
                    if skill.lower() in scraped_course.title.lower() or skill.lower() in scraped_course.description.lower():
                        # Convert to Course object
                        course = Course(
                            title=scraped_course.title,
                            platform=scraped_course.platform,
                            url=scraped_course.url,
                            difficulty=DifficultyLevel.BEGINNER,
                            course_type=CourseType.COURSE,
                            duration=scraped_course.duration or "2-6 months",
                            rating=scraped_course.rating,
                            price=scraped_course.price,
                            description=scraped_course.description,
                            skills_covered=scraped_course.skills or [skill]
                        )
                        skill_courses.append(course)
                
                suggestions[skill] = skill_courses[:max_courses_per_skill]
            
            # If we got some results, return them
            if any(suggestions.values()):
                return suggestions
                
        except Exception as e:
            print(f"Web scraping failed: {e}")
        
        # Fallback: Use AI-generated course suggestions
        try:
            from local_llm import generate_ai_course_suggestions
            
            user_profile = {
                'difficulty_preference': difficulty_preference,
                'course_type_preference': course_type_preference,
                'max_courses': max_courses_per_skill
            }
            
            ai_courses = generate_ai_course_suggestions(skills[:3], user_profile)
            
            # Convert AI courses to Course objects
            for skill in skills:
                skill_courses = []
                for ai_course in ai_courses:
                    if skill.lower() in ai_course['title'].lower():
                        course = Course(
                            title=ai_course['title'],
                            platform=ai_course['platform'],
                            url=ai_course['url'],
                            difficulty=DifficultyLevel.BEGINNER,
                            course_type=CourseType.COURSE,
                            duration=ai_course.get('duration', '4-8 weeks'),
                            rating=ai_course.get('rating', '4.5'),
                            price=ai_course.get('price', 'Free/Paid'),
                            description=ai_course.get('why_recommended', 'AI-recommended course'),
                            skills_covered=[skill]
                        )
                        skill_courses.append(course)
                
                if not skill_courses:
                    # Add a generic course if no specific matches
                    course = Course(
                        title=f"{skill} Fundamentals Course",
                        platform="Multiple Platforms",
                        url="#",
                        difficulty=DifficultyLevel.BEGINNER,
                        course_type=CourseType.COURSE,
                        duration="4-8 weeks",
                        rating="4.5",
                        price="Free/Paid",
                        description=f"Learn {skill} from beginner to intermediate level",
                        skills_covered=[skill]
                    )
                    skill_courses.append(course)
                
                suggestions[skill] = skill_courses[:max_courses_per_skill]
            
            return suggestions
            
        except Exception as ai_error:
            print(f"AI course suggestions failed: {ai_error}")
        
        # Final fallback: Static recommendations
        return get_course_suggestions(skills, difficulty_preference, course_type_preference, max_courses_per_skill)
        
    except Exception as e:
        print(f"All course recommendation methods failed: {e}")
        # Ultimate fallback: Basic static recommendations
        return get_course_suggestions(skills, difficulty_preference, course_type_preference, max_courses_per_skill)
