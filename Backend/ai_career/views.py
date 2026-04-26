"""
AI Career Guidance Views
"""
import json
import uuid
import random
from datetime import datetime

from django.http import JsonResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import (
    CareerSession, FitAnalysis, CareerRecommendation,
    QuizAttempt, LearningResource, InternshipSearch, ResumeBuild
)
from .serializers import (
    CareerSessionSerializer, FitAnalysisSerializer, FitAnalysisRequestSerializer,
    CareerRecommendationSerializer, CareerRecommendationRequestSerializer,
    QuizAttemptSerializer, QuizRequestSerializer, QuizSubmissionSerializer,
    LearningResourceSerializer, LearningResourceRequestSerializer,
    InternshipSearchSerializer, InternshipSearchRequestSerializer,
    ResumeBuildSerializer, ResumeBuildRequestSerializer
)


# ═══════════════════════════════════════════════════════════════
#   UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def get_or_create_session(session_id=None, user=None, request=None):
    """Get or create a career session"""
    if session_id:
        try:
            session = CareerSession.objects.get(id=session_id)
            session.total_actions += 1
            session.save()
            return session
        except CareerSession.DoesNotExist:
            pass

    ip_address = None
    if request:
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))

    return CareerSession.objects.create(
        user=user,
        ip_address=ip_address,
        total_actions=1
    )


def analyze_resume_fit(resume_text, job_description):
    """
    Simple ML algorithm to analyze resume fit
    Returns match score and recommendations
    """
    # Extract skills from both texts
    common_skills = [
        'python', 'javascript', 'java', 'c++', 'react', 'angular', 'vue', 'node.js',
        'django', 'flask', 'sql', 'mongodb', 'aws', 'azure', 'docker', 'kubernetes',
        'git', 'agile', 'scrum', 'leadership', 'communication', 'problem-solving',
        'machine learning', 'data analysis', 'ai', 'deep learning', 'tensorflow',
        'pytorch', 'pandas', 'numpy', 'statistics', 'cloud', 'devops', 'ci/cd',
        'html', 'css', 'typescript', 'redux', 'graphql', 'rest api', 'microservices'
    ]

    resume_lower = resume_text.lower()
    job_lower = job_description.lower()

    resume_skills = [skill for skill in common_skills if skill in resume_lower]
    job_skills = [skill for skill in common_skills if skill in job_lower]

    matched = list(set(resume_skills) & set(job_skills))
    missing = list(set(job_skills) - set(resume_skills))

    # Calculate score
    if job_skills:
        score = len(matched) / len(job_skills) * 100
    else:
        score = 50.0  # Default score if no skills found

    score = min(100, max(0, score))

    # Determine prediction
    if score >= 80:
        prediction = "Excellent Fit"
        confidence = 0.9
    elif score >= 60:
        prediction = "Good Fit"
        confidence = 0.75
    elif score >= 40:
        prediction = "Moderate Fit"
        confidence = 0.6
    else:
        prediction = "Low Fit"
        confidence = 0.5

    return {
        'match_score': round(score, 2),
        'prediction': prediction,
        'confidence': confidence,
        'matched_skills': matched,
        'missing_skills': missing
    }


def generate_career_recommendations(interests, skills, experience):
    """Generate AI career recommendations based on inputs"""

    career_database = {
        'software_development': {
            'title': 'Software Developer',
            'description': 'Build applications and systems using programming languages',
            'required_skills': ['programming', 'problem-solving', 'algorithms'],
            'avg_salary': '$80,000 - $150,000',
            'growth': 'High'
        },
        'data_science': {
            'title': 'Data Scientist',
            'description': 'Analyze complex data to help organizations make better decisions',
            'required_skills': ['statistics', 'machine learning', 'python', 'sql'],
            'avg_salary': '$90,000 - $160,000',
            'growth': 'Very High'
        },
        'web_development': {
            'title': 'Web Developer',
            'description': 'Create websites and web applications',
            'required_skills': ['html', 'css', 'javascript', 'react'],
            'avg_salary': '$70,000 - $130,000',
            'growth': 'High'
        },
        'devops': {
            'title': 'DevOps Engineer',
            'description': 'Bridge development and operations with automation',
            'required_skills': ['cloud', 'docker', 'kubernetes', 'ci/cd'],
            'avg_salary': '$85,000 - $155,000',
            'growth': 'Very High'
        },
        'ai_ml_engineer': {
            'title': 'AI/ML Engineer',
            'description': 'Build machine learning models and AI systems',
            'required_skills': ['machine learning', 'deep learning', 'python', 'tensorflow'],
            'avg_salary': '$100,000 - $180,000',
            'growth': 'Very High'
        },
        'cloud_architect': {
            'title': 'Cloud Architect',
            'description': 'Design and manage cloud infrastructure',
            'required_skills': ['aws', 'azure', 'cloud', 'networking'],
            'avg_salary': '$110,000 - $190,000',
            'growth': 'High'
        },
        'cybersecurity': {
            'title': 'Cybersecurity Analyst',
            'description': 'Protect systems and networks from security breaches',
            'required_skills': ['security', 'networking', 'risk assessment'],
            'avg_salary': '$75,000 - $140,000',
            'growth': 'Very High'
        },
        'mobile_development': {
            'title': 'Mobile App Developer',
            'description': 'Create applications for iOS and Android',
            'required_skills': ['java', 'kotlin', 'swift', 'react native'],
            'avg_salary': '$75,000 - $145,000',
            'growth': 'High'
        }
    }

    # Simple matching algorithm
    recommendations = []
    skills_lower = skills.lower()
    interests_lower = [i.lower() for i in interests]

    for key, career in career_database.items():
        score = 0
        # Match skills
        for req_skill in career['required_skills']:
            if req_skill.lower() in skills_lower:
                score += 1
        # Match interests
        for interest in interests_lower:
            if interest in career['title'].lower() or interest in career['description'].lower():
                score += 1

        if score > 0:
            recommendations.append({
                **career,
                'match_score': min(100, score * 25),
                'key': key
            })

    # Sort by match score
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)

    return recommendations[:5]  # Return top 5


def generate_quiz_questions(skill, difficulty='intermediate', num_questions=5):
    """Generate quiz questions for a skill"""

    question_bank = {
        'python': [
            {
                'id': 1,
                'question': 'What is the output of: print(type([])) ?',
                'options': ['<class list>', '<class dict>', '<class tuple>', '<class set>'],
                'correct': 0
            },
            {
                'id': 2,
                'question': 'Which method is used to add an element to a list?',
                'options': ['append()', 'add()', 'insert()', 'push()'],
                'correct': 0
            },
            {
                'id': 3,
                'question': 'What does the "self" keyword represent in Python?',
                'options': ['The class itself', 'The instance of the class', 'A static method', 'A global variable'],
                'correct': 1
            },
            {
                'id': 4,
                'question': 'What is a decorator in Python?',
                'options': ['A design pattern', 'A function that modifies another function', 'A class attribute', 'A module'],
                'correct': 1
            },
            {
                'id': 5,
                'question': 'Which is the correct way to open a file in Python?',
                'options': ['open("file.txt")', 'file.open("file.txt")', 'File("file.txt")', 'open.file("file.txt")'],
                'correct': 0
            }
        ],
        'javascript': [
            {
                'id': 1,
                'question': 'What is the result of: typeof null?',
                'options': ['"null"', '"undefined"', '"object"', '"number"'],
                'correct': 2
            },
            {
                'id': 2,
                'question': 'What is hoisting in JavaScript?',
                'options': ['Moving functions to top', 'Variable declarations to top', 'Both', 'None'],
                'correct': 2
            },
            {
                'id': 3,
                'question': 'What does === operator do?',
                'options': ['Loose equality', 'Strict equality', 'Assignment', 'Comparison'],
                'correct': 1
            },
            {
                'id': 4,
                'question': 'What is a Promise?',
                'options': ['A callback', 'An async operation object', 'A variable', 'A function'],
                'correct': 1
            },
            {
                'id': 5,
                'question': 'What is the purpose of async/await?',
                'options': ['Synchronous code', 'Handle asynchronous operations', 'Loop control', 'Error handling'],
                'correct': 1
            }
        ],
        'machine learning': [
            {
                'id': 1,
                'question': 'What is overfitting?',
                'options': ['Model performs well on training but poorly on test', 'Model performs poorly on both', 'Perfect model', 'None'],
                'correct': 0
            },
            {
                'id': 2,
                'question': 'Which algorithm is used for classification?',
                'options': ['Linear Regression', 'Logistic Regression', 'K-Means', 'PCA'],
                'correct': 1
            },
            {
                'id': 3,
                'question': 'What is the purpose of cross-validation?',
                'options': ['Increase accuracy', 'Model evaluation', 'Feature selection', 'Data cleaning'],
                'correct': 1
            },
            {
                'id': 4,
                'question': 'What is gradient descent?',
                'options': ['Optimization algorithm', 'Sorting algorithm', 'Search algorithm', 'None'],
                'correct': 0
            },
            {
                'id': 5,
                'question': 'What type of learning is K-Means?',
                'options': ['Supervised', 'Unsupervised', 'Reinforcement', 'Semi-supervised'],
                'correct': 1
            }
        ],
        'data structures': [
            {
                'id': 1,
                'question': 'What is the time complexity of binary search?',
                'options': ['O(n)', 'O(log n)', 'O(n log n)', 'O(n^2)'],
                'correct': 1
            },
            {
                'id': 2,
                'question': 'Which data structure uses FIFO?',
                'options': ['Stack', 'Queue', 'Array', 'Tree'],
                'correct': 1
            },
            {
                'id': 3,
                'question': 'What is the worst-case time complexity of quicksort?',
                'options': ['O(n log n)', 'O(n^2)', 'O(n)', 'O(log n)'],
                'correct': 1
            },
            {
                'id': 4,
                'question': 'Which data structure is best for implementing recursion?',
                'options': ['Queue', 'Stack', 'Array', 'Linked List'],
                'correct': 1
            },
            {
                'id': 5,
                'question': 'What is a hash collision?',
                'options': ['Two keys hash to same index', 'Hash function error', 'Memory overflow', 'None'],
                'correct': 0
            }
        ]
    }

    questions = question_bank.get(skill.lower(), question_bank['python'])

    # Adjust difficulty
    if difficulty == 'beginner':
        questions = questions[:3]
    elif difficulty == 'advanced':
        # Add more complex questions
        pass

    return questions[:num_questions]


def get_learning_resources(skill, level='beginner'):
    """Get learning resources for a skill"""

    resources = {
        'python': {
            'courses': [
                {'name': 'Python for Everybody', 'platform': 'Coursera', 'url': 'https://coursera.org'},
                {'name': 'Automate the Boring Stuff', 'platform': 'Udemy', 'url': 'https://udemy.com'},
            ],
            'tutorials': [
                {'name': 'Python Official Docs', 'url': 'https://docs.python.org'},
                {'name': 'Real Python', 'url': 'https://realpython.com'},
            ],
            'practice': [
                {'name': 'LeetCode', 'url': 'https://leetcode.com'},
                {'name': 'HackerRank', 'url': 'https://hackerrank.com'},
            ]
        },
        'javascript': {
            'courses': [
                {'name': 'JavaScript: The Advanced Concepts', 'platform': 'Udemy', 'url': 'https://udemy.com'},
                {'name': 'JavaScript30', 'platform': 'Wes Bos', 'url': 'https://javascript30.com'},
            ],
            'tutorials': [
                {'name': 'MDN JavaScript', 'url': 'https://developer.mozilla.org'},
                {'name': 'JavaScript.info', 'url': 'https://javascript.info'},
            ],
            'practice': [
                {'name': 'FreeCodeCamp', 'url': 'https://freecodecamp.org'},
                {'name': 'CodeWars', 'url': 'https://codewars.com'},
            ]
        },
        'machine learning': {
            'courses': [
                {'name': 'Machine Learning by Andrew Ng', 'platform': 'Coursera', 'url': 'https://coursera.org'},
                {'name': 'Deep Learning Specialization', 'platform': 'Coursera', 'url': 'https://coursera.org'},
            ],
            'tutorials': [
                {'name': 'Fast.ai', 'url': 'https://fast.ai'},
                {'name': 'TensorFlow Tutorials', 'url': 'https://tensorflow.org/tutorials'},
            ],
            'practice': [
                {'name': 'Kaggle', 'url': 'https://kaggle.com'},
                {'name': 'Google ML Crash Course', 'url': 'https://developers.google.com/machine-learning'},
            ]
        },
        'web development': {
            'courses': [
                {'name': 'The Web Developer Bootcamp', 'platform': 'Udemy', 'url': 'https://udemy.com'},
                {'name': 'Full Stack Open', 'platform': 'University of Helsinki', 'url': 'https://fullstackopen.com'},
            ],
            'tutorials': [
                {'name': 'MDN Web Docs', 'url': 'https://developer.mozilla.org'},
                {'name': 'CSS Tricks', 'url': 'https://css-tricks.com'},
            ],
            'practice': [
                {'name': 'Frontend Mentor', 'url': 'https://frontendmentor.io'},
                {'name': 'CodePen', 'url': 'https://codepen.io'},
            ]
        }
    }

    return resources.get(skill.lower(), resources['python'])


def search_internships(field, location=''):
    """Search for internships"""

    internships = [
        {
            'title': f'{field.title()} Intern',
            'company': 'Tech Corp',
            'location': location or 'Remote',
            'duration': '3 months',
            'stipend': '$1000/month',
            'requirements': ['Python', 'Django', 'SQL'],
            'apply_link': '#'
        },
        {
            'title': f'Junior {field.title()} Developer',
            'company': 'StartupXYZ',
            'location': location or 'Hybrid',
            'duration': '6 months',
            'stipend': '$1500/month',
            'requirements': ['JavaScript', 'React', 'Node.js'],
            'apply_link': '#'
        },
        {
            'title': f'{field.title()} Engineer Intern',
            'company': 'BigTech Inc',
            'location': location or 'On-site',
            'duration': '4 months',
            'stipend': '$2000/month',
            'requirements': ['Java', 'Spring Boot', 'Docker'],
            'apply_link': '#'
        },
        {
            'title': f'ML {field.title()} Intern',
            'company': 'AI Solutions',
            'location': location or 'Remote',
            'duration': '3 months',
            'stipend': '$1200/month',
            'requirements': ['Python', 'TensorFlow', 'Data Analysis'],
            'apply_link': '#'
        },
        {
            'title': f'{field.title()} Analyst Intern',
            'company': 'DataDriven Co',
            'location': location or 'Hybrid',
            'duration': '6 months',
            'stipend': '$1100/month',
            'requirements': ['SQL', 'Excel', 'PowerBI'],
            'apply_link': '#'
        }
    ]

    return internships


# ═══════════════════════════════════════════════════════════════
#   API VIEWS
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return Response({
        "status": "ok",
        "message": "AI Career Guidance API is running",
        "timestamp": datetime.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_fit(request):
    """
    Analyze resume fit against job description
    POST /api/career/analyze/
    """
    serializer = FitAnalysisRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    session_id = data.get('session_id')
    resume_text = data.get('resume_text', '')
    job_description = data.get('job_description', '')

    # Get or create session
    session = get_or_create_session(session_id, request.user, request)

    # Analyze fit
    analysis = analyze_resume_fit(resume_text, job_description)

    # Save to database
    fit_analysis = FitAnalysis.objects.create(
        session=session,
        user=request.user,
        match_score=analysis['match_score'],
        fit_prediction=analysis['prediction'],
        fit_confidence=analysis['confidence'],
        matched_skills=analysis['matched_skills'],
        missing_skills=analysis['missing_skills'],
        resume_preview=resume_text[:500],
        job_preview=job_description[:500],
        model_type='local'
    )

    return Response({
        'success': True,
        'analysis': {
            'match_score': analysis['match_score'],
            'prediction': analysis['prediction'],
            'confidence': analysis['confidence'],
            'matched_skills': analysis['matched_skills'],
            'missing_skills': analysis['missing_skills'],
        },
        'session_id': str(session.id)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def career_recommend(request):
    """
    Get AI career recommendations
    POST /api/career/recommend/
    """
    serializer = CareerRecommendationRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    session_id = data.get('session_id')
    interests = data.get('interests', [])
    current_skills = data.get('current_skills', '')
    experience = data.get('experience', 'beginner')

    # Get or create session
    session = get_or_create_session(session_id, request.user, request)

    # Generate recommendations
    recommendations = generate_career_recommendations(interests, current_skills, experience)

    # Save to database
    CareerRecommendation.objects.create(
        session=session,
        user=request.user,
        interests=interests,
        current_skills=current_skills,
        experience=experience,
        recommendations=recommendations,
        ai_generated=True
    )

    return Response({
        'success': True,
        'recommendations': recommendations,
        'session_id': str(session.id)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request):
    """
    Generate a skill quiz
    POST /api/career/generate-quiz/
    """
    serializer = QuizRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    skill = data.get('skill', 'python')
    difficulty = data.get('difficulty', 'intermediate')
    num_questions = data.get('num_questions', 5)
    session_id = data.get('session_id')

    # Get or create session
    session = get_or_create_session(session_id, request.user, request)

    # Generate questions
    questions = generate_quiz_questions(skill, difficulty, num_questions)

    return Response({
        'success': True,
        'questions': questions,
        'skill': skill,
        'difficulty': difficulty,
        'session_id': str(session.id)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request):
    """
    Submit quiz answers and get score
    POST /api/career/submit-quiz/
    """
    data = request.data
    answers = data.get('answers', {})
    questions = data.get('questions', [])
    skill = data.get('skill', 'python')
    session_id = data.get('session_id')

    if not questions:
        return Response({'error': 'Questions data required'}, status=status.HTTP_400_BAD_REQUEST)

    # Get or create session
    session = get_or_create_session(session_id, request.user, request)

    # Calculate score
    correct = 0
    for q in questions:
        q_id = str(q['id'])
        if answers.get(q_id) == q['options'][q['correct']]:
            correct += 1

    total = len(questions)
    score_percent = (correct / total * 100) if total > 0 else 0

    # Determine grade
    if score_percent >= 90:
        grade = 'A'
    elif score_percent >= 80:
        grade = 'B'
    elif score_percent >= 70:
        grade = 'C'
    elif score_percent >= 60:
        grade = 'D'
    else:
        grade = 'F'

    # Save attempt
    QuizAttempt.objects.create(
        session=session,
        user=request.user,
        skills_tested=[skill],
        total_questions=total,
        correct_answers=correct,
        score_percent=score_percent,
        grade=grade,
        ai_generated=False
    )

    return Response({
        'success': True,
        'score': {
            'correct': correct,
            'total': total,
            'percentage': round(score_percent, 2),
            'grade': grade
        },
        'session_id': str(session.id)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def learning_resources(request):
    """
    Get learning resources for a skill
    POST /api/career/learning-resources/
    """
    serializer = LearningResourceRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    skill = data.get('skill', 'python')
    level = data.get('level', 'beginner')
    session_id = data.get('session_id')

    # Get or create session
    session = get_or_create_session(session_id, request.user, request)

    # Get resources
    resources = get_learning_resources(skill, level)

    # Save to database
    LearningResource.objects.create(
        session=session,
        user=request.user,
        skill_name=skill,
        resources=resources,
        ai_generated=False
    )

    return Response({
        'success': True,
        'skill': skill,
        'level': level,
        'resources': resources,
        'session_id': str(session.id)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def internships(request):
    """
    Search for internships
    POST /api/career/internships/
    """
    serializer = InternshipSearchRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    field = data.get('field', 'software development')
    location = data.get('location', '')
    session_id = data.get('session_id')

    # Get or create session
    session = get_or_create_session(session_id, request.user, request)

    # Search internships
    results = search_internships(field, location)

    # Save to database
    InternshipSearch.objects.create(
        session=session,
        user=request.user,
        field=field,
        location=location,
        results=results,
        ai_generated=False
    )

    return Response({
        'success': True,
        'field': field,
        'location': location,
        'internships': results,
        'count': len(results),
        'session_id': str(session.id)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resume_export(request):
    """
    Export resume in different formats
    POST /api/career/resume-export/
    """
    serializer = ResumeBuildRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    personal_info = data.get('personal_info', {})
    education = data.get('education', [])
    experience = data.get('experience', [])
    skills = data.get('skills', [])
    format_type = data.get('format', 'pdf')
    session_id = data.get('session_id')

    # Get or create session
    session = get_or_create_session(session_id, request.user, request)

    # Save resume build
    ResumeBuild.objects.create(
        session=session,
        user=request.user,
        personal_info=personal_info,
        education=education,
        experience=experience,
        skills=skills,
        resume_format=format_type
    )

    # Generate resume content (simple text format)
    resume_content = f"""
{personal_info.get('name', 'Name')}
{personal_info.get('email', '')} | {personal_info.get('phone', '')}
{personal_info.get('location', '')}

EDUCATION
{'-' * 40}
"""
    for edu in education:
        resume_content += f"\n{edu.get('degree', '')}\n{edu.get('institution', '')} | {edu.get('year', '')}\n"

    resume_content += f"\n\nEXPERIENCE\n{'-' * 40}\n"
    for exp in experience:
        resume_content += f"\n{exp.get('title', '')}\n{exp.get('company', '')} | {exp.get('duration', '')}\n{exp.get('description', '')}\n"

    resume_content += f"\n\nSKILLS\n{'-' * 40}\n"
    resume_content += ', '.join(skills)

    return Response({
        'success': True,
        'resume_content': resume_content,
        'format': format_type,
        'session_id': str(session.id)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_history(request):
    """
    Get user's session history
    GET /api/career/history/
    """
    user = request.user

    # Get all user's activities
    fit_analyses = FitAnalysis.objects.filter(user=user).order_by('-created_at')[:10]
    recommendations = CareerRecommendation.objects.filter(user=user).order_by('-created_at')[:10]
    quizzes = QuizAttempt.objects.filter(user=user).order_by('-created_at')[:10]

    history = {
        'fit_analyses': FitAnalysisSerializer(fit_analyses, many=True).data,
        'recommendations': CareerRecommendationSerializer(recommendations, many=True).data,
        'quiz_attempts': QuizAttemptSerializer(quizzes, many=True).data,
    }

    return Response({
        'success': True,
        'history': history
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def platform_stats(request):
    """
    Get platform statistics
    GET /api/career/stats/
    """
    total_sessions = CareerSession.objects.count()
    total_analyses = FitAnalysis.objects.count()
    total_recommendations = CareerRecommendation.objects.count()
    total_quizzes = QuizAttempt.objects.count()

    # Average scores
    avg_scores = QuizAttempt.objects.values_list('score_percent', flat=True)
    avg_score = sum(avg_scores) / len(avg_scores) if avg_scores else 0

    return Response({
        'success': True,
        'stats': {
            'total_sessions': total_sessions,
            'total_analyses': total_analyses,
            'total_recommendations': total_recommendations,
            'total_quizzes': total_quizzes,
            'average_quiz_score': round(avg_score, 2)
        }
    })
