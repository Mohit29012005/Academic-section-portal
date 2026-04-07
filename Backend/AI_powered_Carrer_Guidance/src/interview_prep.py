"""
AI-Powered Interview Preparation Assistant
Generates personalized interview questions and provides intelligent feedback
"""
import requests
import json
import streamlit as st
import re
from typing import List, Dict, Tuple
import random
from local_llm import call_local_llama

"""Interview prep utilities using local LLM with graceful fallbacks."""

def generate_interview_questions(resume_text: str, job_description: str, skills: List[str], question_count: int = 5) -> List[Dict]:
    """
    Generate personalized interview questions based on resume, job description, and skills
    """
    skills_joined = ', '.join(skills)
    
    prompt = f"""
System Role: You are a senior technical recruiter and hiring manager with 15+ years of experience conducting interviews for tech roles.

Objective: Generate {question_count} high-quality, personalized interview questions tailored to this specific candidate and job role.

CANDIDATE RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

CANDIDATE'S SKILLS:
{skills_joined}

Requirements:
- Mix of technical, behavioral, and situational questions
- Questions should be specific to the job role and candidate's background
- Include STAR method prompts for behavioral questions
- Vary difficulty levels (entry to senior)
- Focus on skills mentioned in both resume and job description
- Include at least one system design question if applicable
- Include at least one coding/technical problem if applicable

Output Format (JSON):
{{
  "questions": [
    {{
      "id": 1,
      "type": "technical|behavioral|situational|system_design",
      "category": "Programming|Problem Solving|Leadership|Communication|etc",
      "difficulty": "easy|medium|hard",
      "question": "The actual question text",
      "follow_up": "Optional follow-up question or clarification",
      "evaluation_criteria": ["What to look for in the answer"],
      "sample_answer_points": ["Key points a good answer should cover"]
    }}
  ]
}}

Generate exactly {question_count} questions now.
"""

    try:
        try:
            health = requests.get("http://localhost:11434/api/tags", timeout=3)
            available = health.status_code == 200
        except Exception:
            available = False
        if not available:
            return _create_fallback_questions(resume_text, job_description, skills, question_count)
        response = call_local_llama(prompt, temperature=0.4)
        
        # Try to extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            questions_data = json.loads(json_str)
            return questions_data.get('questions', [])
        else:
            # Fallback: create questions from text
            return _create_fallback_questions(resume_text, job_description, skills, question_count)
            
    except Exception as e:
        st.warning(f"Error generating questions: {e}")
        return _create_fallback_questions(resume_text, job_description, skills, question_count)

def _create_fallback_questions(resume_text: str, job_description: str, skills: List[str], question_count: int) -> List[Dict]:
    """Fallback question generation if AI fails"""
    base_questions = [
        {
            "id": 1,
            "type": "technical",
            "category": "Programming",
            "difficulty": "medium",
            "question": f"Can you walk me through your experience with {skills[0] if skills else 'programming'}?",
            "follow_up": "What was the most challenging project you worked on?",
            "evaluation_criteria": ["Technical depth", "Problem-solving approach", "Communication"],
            "sample_answer_points": ["Specific examples", "Technical details", "Challenges overcome"]
        },
        {
            "id": 2,
            "type": "behavioral",
            "category": "Problem Solving",
            "difficulty": "medium",
            "question": "Tell me about a time when you had to learn a new technology quickly for a project.",
            "follow_up": "How did you ensure you were productive while learning?",
            "evaluation_criteria": ["Learning agility", "Resourcefulness", "Impact on project"],
            "sample_answer_points": ["Learning strategy", "Time management", "Results achieved"]
        },
        {
            "id": 3,
            "type": "situational",
            "category": "Communication",
            "difficulty": "easy",
            "question": "How would you explain a complex technical concept to a non-technical stakeholder?",
            "follow_up": "Can you give me a specific example?",
            "evaluation_criteria": ["Clarity", "Adaptability", "Patience"],
            "sample_answer_points": ["Simple analogies", "Visual aids", "Step-by-step approach"]
        }
    ]
    
    return base_questions[:question_count]

def evaluate_answer(question: Dict, user_answer: str, resume_text: str) -> Dict:
    """
    Evaluate user's answer using AI and provide detailed feedback
    """
    prompt = f"""
System Role: You are an expert technical interviewer providing constructive feedback.

QUESTION:
{question['question']}

QUESTION TYPE: {question['type']}
CATEGORY: {question['category']}
DIFFICULTY: {question['difficulty']}

EVALUATION CRITERIA:
{', '.join(question['evaluation_criteria'])}

CANDIDATE'S ANSWER:
{user_answer}

CANDIDATE'S BACKGROUND (for context):
{resume_text}

Provide detailed evaluation in this JSON format:
{{
  "overall_score": 85,
  "scores": {{
    "technical_depth": 80,
    "communication": 90,
    "problem_solving": 85,
    "relevance": 90
  }},
  "strengths": ["List specific strengths"],
  "improvements": ["List specific areas for improvement"],
  "detailed_feedback": "Comprehensive feedback paragraph",
  "follow_up_suggestions": ["Suggestions for better answers"],
  "rating": "excellent|good|satisfactory|needs_improvement"
}}

Be constructive and specific. Focus on actionable feedback.
"""

    try:
        try:
            health = requests.get("http://localhost:11434/api/tags", timeout=3)
            available = health.status_code == 200
        except Exception:
            available = False
        if not available:
            return _create_fallback_evaluation(question, user_answer)
        response = call_local_llama(prompt, temperature=0.3)
        
        # Try to extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            evaluation = json.loads(json_str)
            return evaluation
        else:
            return _create_fallback_evaluation(question, user_answer)
            
    except Exception as e:
        st.warning(f"Error evaluating answer: {e}")
        return _create_fallback_evaluation(question, user_answer)

def _create_fallback_evaluation(question: Dict, user_answer: str) -> Dict:
    """Fallback evaluation if AI fails"""
    word_count = len(user_answer.split())
    
    # Simple scoring based on answer length and content
    if word_count > 100:
        score = 85
        rating = "good"
    elif word_count > 50:
        score = 70
        rating = "satisfactory"
    else:
        score = 55
        rating = "needs_improvement"
    
    return {
        "overall_score": score,
        "scores": {
            "technical_depth": score - 5,
            "communication": score + 5,
            "problem_solving": score,
            "relevance": score + 10
        },
        "strengths": ["Provided a response", "Showed engagement"],
        "improvements": ["Add more specific examples", "Include technical details"],
        "detailed_feedback": f"Your answer shows engagement with the question. Consider adding more specific examples and technical details to strengthen your response.",
        "follow_up_suggestions": ["Use the STAR method for behavioral questions", "Include quantifiable results"],
        "rating": rating
    }

def generate_interview_tips(job_description: str, skills: List[str]) -> str:
    """
    Generate personalized interview tips based on job description and skills
    """
    skills_joined = ', '.join(skills)
    
    prompt = f"""
System Role: You are a career coach and interview preparation expert.

Generate personalized interview preparation tips for this specific role and candidate.

JOB DESCRIPTION:
{job_description}

CANDIDATE'S SKILLS:
{skills_joined}

Provide comprehensive tips covering:
1. Technical preparation specific to the role
2. Behavioral question preparation
3. Company research suggestions
4. Common pitfalls to avoid
5. How to highlight relevant experience

Format as a clear, actionable guide with specific recommendations.
"""

    return call_local_llama(prompt, temperature=0.3)

def calculate_interview_readiness_score(evaluations: List[Dict]) -> Dict:
    """
    Calculate overall interview readiness score based on multiple evaluations
    """
    if not evaluations:
        return {
            "overall_score": 0,
            "readiness_level": "Not Started",
            "recommendations": ["Start practicing interview questions"]
        }
    
    total_score = sum(eval_data.get('overall_score', 0) for eval_data in evaluations)
    avg_score = total_score / len(evaluations)
    
    if avg_score >= 90:
        readiness_level = "Excellent"
        recommendations = ["You're well-prepared! Focus on company-specific research"]
    elif avg_score >= 80:
        readiness_level = "Good"
        recommendations = ["Strong preparation. Practice a few more questions"]
    elif avg_score >= 70:
        readiness_level = "Satisfactory"
        recommendations = ["Good start. Focus on technical depth and examples"]
    elif avg_score >= 60:
        readiness_level = "Needs Improvement"
        recommendations = ["Practice more. Focus on STAR method and technical details"]
    else:
        readiness_level = "Requires Significant Work"
        recommendations = ["Intensive practice needed. Consider mock interviews"]
    
    return {
        "overall_score": round(avg_score, 1),
        "readiness_level": readiness_level,
        "recommendations": recommendations,
        "total_questions": len(evaluations)
    }

def get_question_by_type(questions: List[Dict], question_type: str) -> List[Dict]:
    """Filter questions by type"""
    return [q for q in questions if q.get('type') == question_type]

def get_question_by_difficulty(questions: List[Dict], difficulty: str) -> List[Dict]:
    """Filter questions by difficulty"""
    return [q for q in questions if q.get('difficulty') == difficulty]

