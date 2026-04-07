"""
API Views for AI powered Career Guidance system - Convert Flask endpoints to Django REST Framework
"""

import json
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import (
    Session, FitAnalysis, CareerSearch, QuizAttempt,
    LearningRequest, InternshipSearch, ResumeBuild
)
from .serializers import (
    SessionSerializer, FitAnalysisSerializer, CareerSearchSerializer,
    QuizAttemptSerializer, LearningRequestSerializer, InternshipSearchSerializer,
    ResumeBuildSerializer, CareerRecommendationSerializer
)
from .fallback_data import CAREER_FALLBACK, QUIZ_FALLBACK, LEARNING_FALLBACK, INTERNSHIP_FALLBACK

# Import LLM and ML utilities
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / 'src'))

# Import new OpenRouter LLM client (primary)
try:
    from llm_openrouter import llm_client, OpenRouterLLM
    LLM_AVAILABLE = True
    print("✅ OpenRouter LLM client loaded successfully")
except ImportError as e:
    print(f"⚠️ OpenRouter LLM import failed: {e}")
    LLM_AVAILABLE = False

# Import ML utilities
try:
    from parsing import extract_text_from_pdf, extract_text_from_docx, extract_text_from_txt
    from skills import extract_skills
    from fit_classifier import predict_fit
except ImportError:
    pass

# Fallback to old LLM if available (for backward compatibility)
try:
    from llm_client import (
        get_ai_career_recommendations,
        generate_ai_quiz,
        get_ai_learning_resources,
        get_ai_internships,
    )
except ImportError:
    pass


# Helper functions
def get_session_id(request):
    """Extract or create session ID from request"""
    session_id = request.META.get('HTTP_X_SESSION_ID', 'anonymous')
    ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
    
    session, created = Session.objects.get_or_create(
        id=session_id,
        defaults={'ip_address': ip_address}
    )
    return session, ip_address


def get_text_from_request(request, field_name):
    """
    Extract text from request data (handles both files and text strings).
    
    Args:
        request: Django request object
        field_name: Name of the field to extract
    
    Returns:
        Extracted text string or empty string if not found
    """
    data = request.data.get(field_name, '')
    
    # Check if it's a file upload
    if hasattr(data, 'read'):
        try:
            content = data.read()
            if isinstance(content, bytes):
                return content.decode('utf-8', errors='ignore')
            return str(content)
        except Exception as e:
            print(f"Error reading file {field_name}: {e}")
            return ''
    
    # Handle string
    if isinstance(data, str):
        return data.strip()
    
    # Default: convert to string and strip
    return str(data).strip() if data else ''


# ══════════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════════

@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    return Response({
        "status": "ok",
        "message": "AI powered Career Guidance system Django backend running",
        "llm_available": LLM_AVAILABLE
    })


# ══════════════════════════════════════════════════════════════
# FIT ANALYZER
# ══════════════════════════════════════════════════════════════

@api_view(['POST'])
def analyze_fit(request):
    """
    Analyze resume fit against job description.
    Expects: resumeText or resume file, jobDescription or jobFile
    Supports both FormData (files) and JSON (text)
    """
    try:
        session, ip = get_session_id(request)
        
        # Handle both file uploads and text input with multiple fallbacks
        resume_text = ""
        job_text = ""
        
        # Try to get resume from multiple sources
        if 'resume' in request.FILES:
            resume_file = request.FILES['resume']
            try:
                resume_text = resume_file.read().decode('utf-8', errors='ignore')
            except:
                pass
        
        if not resume_text and 'resumeText' in request.data:
            resume_text = request.data.get('resumeText', '').strip()
        
        if not resume_text and 'resume' in request.data:
            resume_text = request.data.get('resume', '').strip()
        
        # Try to get job description from multiple sources
        if 'jobDescription' in request.FILES:
            job_file = request.FILES['jobDescription']
            try:
                job_text = job_file.read().decode('utf-8', errors='ignore')
            except:
                pass
        
        if not job_text and 'jobDescription' in request.data:
            job_text = request.data.get('jobDescription', '').strip()
        
        if not job_text and 'jobDescriptionText' in request.data:
            job_text = request.data.get('jobDescriptionText', '').strip()
        
        # Validate inputs
        if not resume_text or not resume_text.strip():
            return Response({"error": "Please provide resume text or upload a resume file"}, status=status.HTTP_400_BAD_REQUEST)
        if not job_text or not job_text.strip():
            return Response({"error": "Please provide job description text or upload a job file"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract skills
        resume_skills = extract_skills(resume_text) if resume_text else []
        job_skills = extract_skills(job_text) if job_text else []
        matched_skills = sorted(set(resume_skills) & set(job_skills))
        missing_skills = sorted(set(job_skills) - set(resume_skills))
        total = len(set(job_skills)) or 1
        match_score = round(100.0 * len(matched_skills) / total, 1)
        
        # Predict fit with intelligent logic
        fit_result = {}
        matched_count = len(matched_skills)
        total_required = len(set(job_skills)) or 1
        
        # Tier 1: Very High Match - Use Intelligence
        if match_score >= 90 and matched_count >= total_required:
            fit_result = {
                "prediction": "🚀 Strong Fit",
                "confidence": 0.95,
                "model_type": "intelligence",
                "probabilities": {"Strong Fit": 0.95, "Good Fit": 0.04, "Moderate Fit": 0.01}
            }
        # Tier 2: Good Match - Use Intelligence  
        elif match_score >= 70 and matched_count >= int(total_required * 0.8):
            fit_result = {
                "prediction": "✓ Good Fit",
                "confidence": 0.88,
                "model_type": "intelligence",
                "probabilities": {"Good Fit": 0.88, "Moderate Fit": 0.10, "Needs Improvement": 0.02}
            }
        # Tier 3: Moderate Match - Try XGBoost with fallback
        elif 45 <= match_score < 70:
            xgboost_result = None
            try:
                xgboost_result = predict_fit(resume_text=resume_text, job_description=job_text,
                                           match_score=match_score, num_matched=matched_count, 
                                           num_missing=len(missing_skills))
                if xgboost_result and isinstance(xgboost_result, dict) and "prediction" in xgboost_result:
                    # Validate XGBoost - if too pessimistic, ignore it
                    if xgboost_result.get("prediction") != "No Fit":
                        fit_result = xgboost_result
                        if "model_type" not in fit_result:
                            fit_result["model_type"] = "xgboost"
            except Exception as e:
                print(f"XGBoost prediction error: {e}")
            
            # Use fallback for moderate scores
            if not fit_result:
                fit_result = {
                    "prediction": "⚡ Moderate Fit",
                    "confidence": 0.75,
                    "model_type": "fallback",
                    "probabilities": {"Moderate Fit": 0.75, "Good Fit": 0.20, "Needs Improvement": 0.05}
                }
        # Tier 4: Low Match - Always use Fallback
        else:
            fit_result = {
                "prediction": "📚 Needs Learning",
                "confidence": 0.65,
                "model_type": "fallback",
                "probabilities": {"Needs Improvement": 0.65, "Moderate Fit": 0.30, "Good Fit": 0.05}
            }
        
        # Save to database
        fit_analysis = FitAnalysis.objects.create(
            session=session,
            ip_address=ip,
            match_score=match_score,
            fit_prediction=fit_result.get('prediction'),
            fit_confidence=fit_result.get('confidence'),
            matched_skills=json.dumps(matched_skills),
            missing_skills=json.dumps(missing_skills),
            resume_preview=resume_text[:2000],
            job_preview=job_text[:2000],
            model_type='xgboost'
        )
        
        return Response({
            "resumeSkills": resume_skills,
            "jobSkills": job_skills,
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills,
            "matchScore": match_score,
            "fit": fit_result,
            "resumePreview": resume_text[:2000],
            "jobPreview": job_text[:2000]
        })
        
    except Exception as e:
        import traceback
        print(f"Error in analyze_fit: {traceback.format_exc()}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ══════════════════════════════════════════════════════════════
# CAREER RECOMMENDATIONS
# ══════════════════════════════════════════════════════════════

@api_view(['POST'])
def career_recommend(request):
    """
    Generate career path recommendations using OpenRouter API.
    Expects: interests (list), skills, experience
    """
    try:
        session, ip = get_session_id(request)
        
        interests = request.data.get('interests', [])
        skills = request.data.get('skills', '')
        experience = request.data.get('experience', 'fresher')
        
        if not interests:
            return Response({"error": "Please select at least one interest"}, status=status.HTTP_400_BAD_REQUEST)
        
        recs = []
        source = 'fallback'
        
        # Primary: Try OpenRouter API
        if LLM_AVAILABLE:
            try:
                print(f"Generating careers for: {interests}")
                ai_recs = llm_client.generate_career_recommendations(interests, skills, experience)
                if ai_recs:
                    recs = ai_recs
                    source = 'openrouter'
                    print(f"✅ Generated {len(recs)} careers from OpenRouter")
                else:
                    print("⚠️ OpenRouter returned empty careers")
                    source = 'fallback'
            except Exception as e:
                print(f"OpenRouter career recommendation error: {e}")
                source = 'fallback'
        
        # Secondary: Use fallback if API fails
        if not recs:
            print("Using fallback career data...")
            for career_key, career_data in CAREER_FALLBACK.items():
                recs.append(career_data)
        
        # Save to database
        CareerSearch.objects.create(
            session=session,
            ip_address=ip,
            interests=json.dumps(interests),
            current_skills=skills,
            experience=experience,
            result_count=len(recs),
            ai_generated=(source != 'fallback')
        )
        
        recs.sort(key=lambda x: x.get('match', 0), reverse=True)
        return Response({"recommendations": recs[:10], "source": source, "total": len(recs)})
        
    except Exception as e:
        import traceback
        print(f"Error in career_recommend: {traceback.format_exc()}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        import traceback
        print(f"Error in career_recommend: {traceback.format_exc()}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ══════════════════════════════════════════════════════════════
# QUIZ GENERATION
# ══════════════════════════════════════════════════════════════

@api_view(['POST'])
def generate_quiz(request):
    """
    Generate skill quiz questions using OpenRouter API.
    Expects: skills (list), count (int, default 10, max 50)
    """
    try:
        session, ip = get_session_id(request)
        
        skills = request.data.get('skills', [])
        count = min(int(request.data.get('count', 10)), 50)  # Allow up to 50 questions
        
        if not skills:
            return Response({"error": "Please provide at least one skill"}, status=status.HTTP_400_BAD_REQUEST)
        
        quiz = []
        source = 'fallback'
        
        # Primary: Try OpenRouter API
        if LLM_AVAILABLE:
            try:
                for skill in skills:
                    print(f"[OpenRouter] Generating {count} quiz questions for {skill}...")
                    ai_questions = llm_client.generate_quiz(skill=skill, count=count)
                    if ai_questions and len(ai_questions) > 0:
                        quiz.extend(ai_questions)
                        source = 'openrouter'
                        print(f"✅ OpenRouter: Generated {len(ai_questions)} questions")
                    else:
                        print(f"⚠️ OpenRouter returned {len(ai_questions) if ai_questions else 0} questions")
            except Exception as e:
                print(f"OpenRouter error: {e}")
                source = 'fallback'
        
        # Secondary: Use fallback data if API fails or returns too few
        if len(quiz) < count:
            print(f"[Fallback] Using fallback data... (have {len(quiz)}, need {count})")
            for skill in skills:
                skill_lower = skill.lower()
                
                # Find matching skill in fallback
                for quiz_key in ['python', 'javascript', 'sql', 'machine learning']:
                    if quiz_key in skill_lower or skill_lower in quiz_key:
                        fallback_qs = QUIZ_FALLBACK.get(quiz_key, [])
                        
                        # Convert fallback format to API format
                        for q in fallback_qs:
                            if isinstance(q, dict):
                                # Convert from old format (q, answer index) to new format (question, options, correct)
                                correct_idx = q.get('answer', 0)
                                correct_letter = chr(65 + correct_idx)  # Convert 0->A, 1->B, etc.
                                
                                converted_q = {
                                    "question": q.get('q', q.get('question', '')),
                                    "options": q.get('options', []),
                                    "correct": correct_letter,
                                    "explanation": q.get('explanation', '')
                                }
                                quiz.append(converted_q)
                        
                        if fallback_qs:
                            print(f"✅ Fallback: Added {len(fallback_qs)} questions for {quiz_key}")
                        break
        
        # Limit to requested count
        quiz = quiz[:count]
        
        # Ensure proper structure for each question
        cleaned_quiz = []
        for q in quiz:
            if isinstance(q, dict) and 'question' in q:
                cleaned_quiz.append({
                    "question": q.get("question", ""),
                    "options": q.get("options", []),
                    "correct": q.get("correct", "A"),
                    "explanation": q.get("explanation", "")
                })
        
        # Save to database
        QuizAttempt.objects.create(
            session=session,
            ip_address=ip,
            skills_tested=json.dumps(skills),
            total_questions=len(cleaned_quiz),
            correct_answers=0,
            score_percent=0.0,
            ai_generated=(source == 'openrouter')
        )
        
        print(f"✅ Quiz Complete: {len(cleaned_quiz)} questions from {source}")
        return Response({
            "quiz": cleaned_quiz,
            "total": len(cleaned_quiz),
            "source": source,
            "skills": skills
        })
        
    except Exception as e:
        import traceback
        print(f"Error in generate_quiz: {traceback.format_exc()}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ══════════════════════════════════════════════════════════════
# LEARNING RESOURCES
# ══════════════════════════════════════════════════════════════

@api_view(['POST'])
def learning_resources(request):
    """
    Get learning resources for given topics.
    Expects: interests (list), freeOnly (bool)
    """
    try:
        session, ip = get_session_id(request)
        
        interests = request.data.get('interests', [])
        free_only = request.data.get('freeOnly', False)
        
        if not interests:
            return Response({"error": "Please select at least one topic"}, status=status.HTTP_400_BAD_REQUEST)
        
        resources = {}
        source = 'fallback'
        
        # Primary: Try OpenRouter API
        if LLM_AVAILABLE:
            try:
                print(f"Generating learning resources for: {interests}")
                for interest in interests:
                    interest_lower = interest.lower().strip()
                    ai_resources = llm_client.extract_learning_resources(topic=interest, skill_level='beginner')
                    
                    if ai_resources:
                        # Filter by free_only if needed
                        filtered = [r for r in ai_resources if not free_only or r.get('free', True)]
                        if filtered:
                            resources[interest_lower] = filtered
                            source = 'openrouter'
                            print(f"✅ Generated {len(filtered)} resources for {interest}")
            except Exception as e:
                print(f"OpenRouter learning resources error: {e}")
                source = 'fallback'
        
        # Secondary: Use fallback if API fails
        if not resources:
            print("Using fallback learning resources...")
            source = 'fallback'
            for interest in interests:
                interest_lower = interest.lower().strip()
                matched_key = None
                
                # Find matching key in fallback data
                for resource_key in LEARNING_FALLBACK.keys():
                    if resource_key in interest_lower or interest_lower in resource_key:
                        matched_key = resource_key
                        break
                
                if matched_key:
                    resource_list = LEARNING_FALLBACK[matched_key]
                    if interest_lower not in resources:
                        resources[interest_lower] = []
                    
                    # Filter by free_only if needed
                    for resource in resource_list:
                        if free_only and not resource.get('free', True):
                            continue
                        # Ensure resource is a dictionary, not a string
                        if isinstance(resource, dict):
                            resources[interest_lower].append(resource)
        
        # Save to database
        resource_count = sum(len(v) for v in resources.values()) if resources else 0
        LearningRequest.objects.create(
            session=session,
            ip_address=ip,
            topics=json.dumps(interests),
            free_only=free_only,
            resource_count=resource_count,
            ai_generated=(source != 'fallback')
        )
        
        return Response({"resources": resources, "source": source, "total": resource_count})
        
    except Exception as e:
        import traceback
        print(f"Error in learning_resources: {traceback.format_exc()}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ══════════════════════════════════════════════════════════════
# INTERNSHIP FINDER
# ══════════════════════════════════════════════════════════════

@api_view(['POST'])
def internships(request):
    """
    Find internship opportunities.
    Expects: location, skills (list), minStipend, maxStipend, domain
    """
    try:
        session, ip = get_session_id(request)
        
        location = request.data.get('location', 'any')
        if isinstance(location, str):
            location = location.strip().lower()
        else:
            location = 'any'
            
        skills = request.data.get('skills', [])
        min_stipend = int(request.data.get('minStipend', 0))
        max_stipend = int(request.data.get('maxStipend', 999999))
        domain = request.data.get('domain', '')
        if isinstance(domain, str):
            domain = domain.strip().lower()
        else:
            domain = ''
        
        results = []
        source = 'ai'
        
        # Try LLM first
        try:
            llm_result = get_ai_internships(location, skills, min_stipend, max_stipend, domain) if LLM_AVAILABLE else {}
            if llm_result and llm_result.get('internships'):
                results = llm_result['internships']
                source = 'ai'
            else:
                source = 'static'
        except Exception as e:
            print(f"LLM internship search error: {e}")
            source = 'static'
        
        # Use comprehensive fallback opportunities if no LLM results
        if not results and source == 'static':
            for intern in INTERNSHIP_FALLBACK:
                if min_stipend <= intern['stipend_range'][0] <= max_stipend:
                    results.append(intern)
        
        # Save to database
        InternshipSearch.objects.create(
            session=session,
            ip_address=ip,
            location=location,
            domain=domain,
            min_stipend=min_stipend,
            max_stipend=max_stipend,
            skills=json.dumps(skills) if isinstance(skills, list) else skills,
            result_count=len(results),
            ai_generated=(source == 'ai')
        )
        
        return Response({"internships": results[:15], "total": len(results), "source": source})
        
    except Exception as e:
        import traceback
        print(f"Error in internships: {traceback.format_exc()}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ══════════════════════════════════════════════════════════════
# RESUME EXPORT
# ══════════════════════════════════════════════════════════════

@api_view(['POST'])
def resume_export(request):
    """
    Export and save resume build.
    Expects: resume (dict with sections)
    """
    try:
        session, ip = get_session_id(request)
        
        resume_data = request.data.get('resume', {})
        
        name = resume_data.get('name', '')
        email = resume_data.get('email', '')
        phone = resume_data.get('phone', '')
        location = resume_data.get('location', '')
        skills = resume_data.get('skills', [])
        exp = resume_data.get('experience', [])
        edu = resume_data.get('education', [])
        projects = resume_data.get('projects', [])
        
        # Build resume text
        lines = []
        lines.append(name.upper() if name else 'RESUME')
        lines.append('=' * 50)
        contact = ' | '.join(filter(None, [email, phone, location]))
        if contact:
            lines.append(contact)
        lines.append('')
        
        if skills:
            lines.append('SKILLS')
            lines.append('─' * 50)
            lines.append(', '.join(skills))
            lines.append('')
        
        if exp:
            lines.append('EXPERIENCE')
            lines.append('─' * 50)
            for e in exp:
                title = e.get('title', '')
                company = e.get('company', '')
                duration = e.get('duration', '')
                desc = e.get('description', '')
                if title or company:
                    lines.append(f"{title} @ {company} ({duration})")
                    if desc:
                        lines.append(desc)
                    lines.append('')
        
        if edu:
            lines.append('EDUCATION')
            lines.append('─' * 50)
            for e in edu:
                degree = e.get('degree', '')
                inst = e.get('institution', '')
                year = e.get('year', '')
                if degree or inst:
                    lines.append(f"{degree} — {inst} ({year})")
                    lines.append('')
        
        if projects:
            lines.append('PROJECTS')
            lines.append('─' * 50)
            for p in projects:
                if p.get('name') or p.get('description'):
                    lines.append(f"• {p.get('name', '')}: {p.get('description', '')}")
                    if p.get('url'):
                        lines.append(f"  Link: {p['url']}")
                    lines.append('')
        
        # Save to database
        ResumeBuild.objects.create(
            session=session,
            ip_address=ip,
            full_name=name,
            email=email,
            location=location,
            skills=skills,
            exp_count=len(exp),
            edu_count=len(edu),
            project_count=len(projects)
        )
        
        return Response({"text": "\n".join(lines)})
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ══════════════════════════════════════════════════════════════
# QUIZ SCORE SUBMISSION
# ══════════════════════════════════════════════════════════════

@api_view(['POST'])
def quiz_score(request):
    """
    Submit quiz results and save score.
    Expects: skills, total, correct
    """
    try:
        session, ip = get_session_id(request)
        
        skills = request.data.get('skills', [])
        total = int(request.data.get('total', 0))
        correct = int(request.data.get('correct', 0))
        
        score = round(100.0 * correct / total, 1) if total else 0
        grade = "Expert" if score >= 80 else "Proficient" if score >= 60 else "Learner" if score >= 40 else "Beginner"
        
        # Create or update quiz attempt
        QuizAttempt.objects.filter(
            session=session,
            correct_answers=0
        ).first().delete()  # Delete pending attempt
        
        QuizAttempt.objects.create(
            session=session,
            ip_address=ip,
            skills_tested=skills,
            total_questions=total,
            correct_answers=correct,
            score_percent=score,
            grade=grade
        )
        
        return Response({"ok": True, "score": score, "grade": grade})
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ══════════════════════════════════════════════════════════════
# SESSION HISTORY & STATS
# ══════════════════════════════════════════════════════════════

@api_view(['GET'])
def session_history(request):
    """Get activity history for current session"""
    try:
        session, _ = get_session_id(request)
        
        history = {
            "fit_analyses": FitAnalysisSerializer(
                session.fit_analyses.all()[:10], many=True
            ).data,
            "career_searches": CareerSearchSerializer(
                session.career_searches.all()[:10], many=True
            ).data,
            "quiz_attempts": QuizAttemptSerializer(
                session.quiz_attempts.all()[:10], many=True
            ).data,
            "learning_requests": LearningRequestSerializer(
                session.learning_requests.all()[:10], many=True
            ).data,
            "internship_searches": InternshipSearchSerializer(
                session.internship_searches.all()[:10], many=True
            ).data,
            "resume_builds": ResumeBuildSerializer(
                session.resume_builds.all()[:10], many=True
            ).data,
        }
        
        return Response(history)
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def platform_stats(request):
    """Get platform-wide statistics"""
    try:
        stats = {
            "total_sessions": Session.objects.count(),
            "total_fit_analyses": FitAnalysis.objects.count(),
            "total_career_searches": CareerSearch.objects.count(),
            "total_quiz_attempts": QuizAttempt.objects.count(),
            "total_learning_requests": LearningRequest.objects.count(),
            "total_internship_searches": InternshipSearch.objects.count(),
            "total_resume_builds": ResumeBuild.objects.count(),
            "avg_fit_score": FitAnalysis.objects.filter(match_score__isnull=False).aggregate(avg=models.Avg('match_score'))['avg'] or 0,
        }
        
        return Response(stats)
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
