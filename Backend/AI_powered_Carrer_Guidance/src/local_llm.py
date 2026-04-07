import os
import time
import requests
import json
import streamlit as st
from typing import Optional, List
from career_webscraper import get_career_scraper

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:1b")
# Improved defaults to avoid long waits while ensuring reliability
MAX_PROMPT_CHARS = int(os.getenv("LLM_MAX_PROMPT_CHARS", "3000"))
REQUEST_TIMEOUT_SECS = int(os.getenv("LLM_REQUEST_TIMEOUT_SECS", "30"))
MAX_RETRIES = int(os.getenv("LLM_MAX_RETRIES", "2"))
AUTO_PULL = os.getenv("OLLAMA_AUTO_PULL", "1").strip() not in {"0", "false", "False"}

__all__ = [
    "is_ollama_available",
    "call_local_llama",
    "enhance_resume_section",
    "generate_project_ideas",
    "generate_cover_letter",
    "generate_ai_career_suggestions",
    "generate_ai_course_suggestions",
]

# Backward-compatible cache decorator
try:
    cache_resource = st.cache_resource  # Streamlit >= 1.18
except AttributeError:
    def cache_resource(func):  # no-op for older versions
        return func

@cache_resource
def is_ollama_available() -> bool:
    try:
        resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        # If the server responds at all, consider it available (models may be 0)
        return resp.status_code == 200
    except Exception:
        return False


def _ensure_model_available(model_name: str) -> bool:
    """Ensure the requested Ollama model exists locally; attempt to pull if missing."""
    try:
        # Check installed models
        tags_resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        if tags_resp.status_code == 200:
            models = [m.get('name') for m in tags_resp.json().get('models', [])]
            if model_name in models:
                return True
        if not AUTO_PULL:
            return False
        # Try to pull the model (non-streaming for simplicity)
        try:
            with st.spinner(f"📥 Pulling model '{model_name}' from Ollama registry..."):
                pull_resp = requests.post(
                    f"{OLLAMA_URL}/api/pull",
                    json={"name": model_name, "stream": False},
                    timeout=max(REQUEST_TIMEOUT_SECS, 60)
                )
        except Exception:
            pull_resp = requests.post(
                f"{OLLAMA_URL}/api/pull",
                json={"name": model_name, "stream": False},
                timeout=max(REQUEST_TIMEOUT_SECS, 60)
            )
        if pull_resp.status_code == 200:
            return True
        return False
    except Exception:
        return False

def _truncate(text: str, limit: int = MAX_PROMPT_CHARS) -> str:
    if not text:
        return ""
    return text if len(text) <= limit else text[:limit] + "\n\n...[truncated]"

def call_local_llama(prompt, model: Optional[str] = None, temperature=0.3):
    """
    Call local Llama model via Ollama API with improved error handling
    
    Args:
        prompt (str): The prompt to send to the model
        model (str): The model name (default: tinyllama:1.1b)
        temperature (float): Temperature for response generation
    
    Returns:
        str: Generated response from the model
    """
    url = f"{OLLAMA_URL}/api/generate"
    
    payload = {
        "model": model or DEFAULT_MODEL,
        "prompt": _truncate(prompt),
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": 512,  # Limit response length to avoid timeouts
            "top_k": 40,
            "top_p": 0.9
        }
    }
    
    try:
        # Verify Ollama is reachable and model is available (pull if needed)
        if not is_ollama_available():
            return "Error: Cannot connect to local Llama model. Please ensure Ollama is running."
        target_model = model or DEFAULT_MODEL
        if not _ensure_model_available(target_model):
            return f"Error: Model '{target_model}' not available and could not be pulled."
        last_exc = None
        for attempt in range(1, MAX_RETRIES + 2):
            try:
                # Only use Streamlit spinner if we're in a Streamlit context
                try:
                    with st.spinner(f'🤖 Generating AI response (attempt {attempt})...'):
                        response = requests.post(url, json=payload, timeout=REQUEST_TIMEOUT_SECS)
                except:
                    # Not in Streamlit context, just make the request
                    print(f'🤖 Generating AI response (attempt {attempt})...')
                    response = requests.post(url, json=payload, timeout=REQUEST_TIMEOUT_SECS)
                
                response.raise_for_status()
                result = response.json()
                
                # Check if response is valid
                if 'response' in result and result['response'].strip():
                    return result['response']
                elif 'error' in result:
                    return f"Error: {result['error']}"
                else:
                    return "Error: Empty response from model"
                    
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                last_exc = e
                if attempt <= MAX_RETRIES:
                    try:
                        st.warning(f"⚠️ Attempt {attempt} failed, retrying...")
                    except:
                        print(f"⚠️ Attempt {attempt} failed, retrying...")
                    time.sleep(1 * attempt)
                    continue
                raise
        # Should not reach here
        raise last_exc if last_exc else RuntimeError("Unknown request error")
        
    except requests.exceptions.ConnectionError:
        error_msg = "❌ Cannot connect to local Llama model. Please ensure Ollama is running on localhost:11434"
        try:
            st.error(error_msg)
        except:
            print(error_msg)
        return "Error: Cannot connect to local Llama model. Please ensure Ollama is running."
    except requests.exceptions.Timeout:
        error_msg = "⏰ Request timed out. The model might be taking too long to respond."
        try:
            st.error(error_msg)
        except:
            print(error_msg)
        return "Error: Request timed out. Please try again."
    except requests.exceptions.RequestException as e:
        error_msg = f"❌ Error calling local Llama model: {str(e)}"
        try:
            st.error(error_msg)
        except:
            print(error_msg)
        return f"Error: {str(e)}"
    except Exception as e:
        error_msg = f"❌ Unexpected error: {str(e)}"
        try:
            st.error(error_msg)
        except:
            print(error_msg)
        return f"Error: {str(e)}"

def _generate_resume_improvements_fallback(resume_text: str, jd_text: str, missing_skills: List[str]) -> str:
    """
    Generate comprehensive resume improvements without LLM using intelligent analysis
    """
    top_missing = list(dict.fromkeys([s.strip() for s in missing_skills]))[:8]
    
    # Simple keyword analysis
    jd_keywords = set()
    if jd_text:
        # Extract common job-related keywords from JD
        import re
        words = re.findall(r'\b[A-Za-z]{3,}\b', jd_text.lower())
        common_buzzwords = {'experience', 'skills', 'required', 'preferred', 'years', 'team', 'work'}
        jd_keywords = set([w for w in words if w not in common_buzzwords][:10])
    
    improvements = [
        "### 🚀 AI-Powered Resume Enhancement Recommendations",
        "\n**Immediate Action Items:**",
        "\n• **Professional Summary**: Add a compelling 2-3 line summary highlighting your value proposition",
        "• **Keywords Optimization**: Integrate job-specific terms naturally throughout your resume", 
        "• **Quantify Achievements**: Add metrics (percentages, dollar amounts, time saved) to your accomplishments",
        "• **Skills Section**: Create a dedicated technical skills section with relevant technologies",
        "• **Action Verbs**: Start each bullet point with strong action verbs (Led, Developed, Optimized, Implemented)"
    ]
    
    if jd_keywords:
        improvements.extend([
            "\n**Job-Specific Keywords to Include:**",
            f"\n• Integrate these terms: {', '.join(list(jd_keywords)[:6])}",
            "• Use them naturally in your experience descriptions and skills section"
        ])
    
    if top_missing:
        improvements.extend([
            "\n**Address Missing Skills:**",
            "• **Highlight Transferable Experience**: Show how your current experience relates to required skills"
        ])
        for skill in top_missing[:5]:
            improvements.append(f"  - For {skill}: Describe any related projects, coursework, or self-study")
    
    improvements.extend([
        "\n**Professional Formatting:**",
        "• **Consistent Structure**: Use the same format for each role (Title, Company, Dates, Bullets)",
        "• **Bullet Point Optimization**: Limit to 3-5 bullets per role, prioritize most relevant accomplishments",
        "• **Length Management**: Keep to 1-2 pages, focus on most recent and relevant experience",
        "\n**ATS Optimization:**",
        "• **Standard Sections**: Use clear headings (Experience, Education, Skills, Projects)",
        "• **Keyword Density**: Ensure important terms appear 2-3 times throughout the document",
        "• **Simple Formatting**: Avoid complex layouts, stick to standard fonts and bullet points",
        "\n✅ **Next Steps**: Review each section against these recommendations and update 2-3 bullets to better showcase your fit for this specific role."
    ])
    
    return "\n".join(improvements)

def enhance_resume_section(resume_text, jd_text, missing_skills):
    """
    Enhance resume section using local Llama model with improved prompts
    """
    # Quick availability check and instant fallback
    if not is_ollama_available():
        return _generate_resume_improvements_fallback(resume_text, jd_text, missing_skills)

    # Improved, more focused prompt for better results
    prompt = f"""You are an expert resume writer and career coach. Analyze the resume and job description below, then provide specific, actionable recommendations to improve the resume.

CURRENT RESUME:
{_truncate(resume_text, 1500)}

JOB DESCRIPTION:
{_truncate(jd_text, 1500)}

MISSING SKILLS TO ADDRESS:
{', '.join(missing_skills[:10])}

Provide 5-8 specific resume improvements in this format:
• [Section]: [Specific improvement with example]

Focus on:
1. Adding relevant keywords from the job description
2. Quantifying achievements with numbers/percentages
3. Highlighting transferable skills
4. Addressing missing skills through existing experience
5. Improving action verbs and impact statements

Resume Improvements:"""

    result = call_local_llama(prompt, temperature=0.3)
    if isinstance(result, str) and result.startswith("Error:"):
        return _generate_resume_improvements_fallback(resume_text, jd_text, missing_skills)
    return result

def generate_project_ideas(resume_text, skills):
    """
    Generate rich, recruiter-ready project ideas using the local Llama model.
    The prompt is designed to be a comprehensive "major prompt" that yields
    deeply structured, high-impact projects tailored to the user's background.
    """
    skills_joined = ', '.join(skills)

    prompt = f"""
System Role: You are a senior career coach and staff-level engineer who crafts
standout portfolio projects that demonstrate real-world impact and hiring signals.

Objective: Propose 3-5 high-impact, realistic project ideas tailored to the candidate.

Candidate Background (summarize and use as context):
RESUME TEXT:
{resume_text}

KNOWN SKILLS:
{skills_joined}

Requirements:
- Ideas must solve real problems (not toy demos). Prefer domains suggested by the resume.
- Balance ambition with feasibility. Aim for 2-6 weeks per project.
- Each idea must be technically specific and implementation-ready.
- Favor measurable outcomes and evaluation metrics.
- Prefer modern, in-demand stacks aligned with the candidate's skills.
- If skills are missing, suggest a minimal learning path and safe substitutions.

Output Format (Markdown):
For each project, provide:
1) Title
2) One-line value proposition (why it matters to users or business)
3) Target users and real-world use cases
4) Tech stack (primary + optional alternatives)
5) Step-by-step implementation plan (5-10 concrete steps)
6) Data sources/APIs or how to create/collect data
7) Evaluation metrics and acceptance criteria
8) Stretch goals (2-3 scoped enhancements)
9) Resume bullets (2-3 STAR-format achievements to claim after completion)
10) Suggested timeline (week-by-week, brief)
11) Suggested repo structure (folders/files)
12) Demo plan (how to present with screenshots/gif)

Constraints:
- Avoid vague or generic suggestions.
- Do not repeat the same idea in different words.
- Ensure each idea is distinct in domain or approach.
- Keep total output concise but information-dense.

Now generate the projects.
"""

    # If unavailable or error, return concise fallback ideas
    if not is_ollama_available():
        return (
            "### Project Ideas (Fast Fallback)\n"
            "1. Metrics Dashboard: Build a small app that ingests CSV/JSON and renders KPI charts.\n"
            "2. Data ETL Mini-Pipeline: Extract from an API, clean with pandas, load to SQLite, expose a simple API.\n"
            "3. Resume Keyword Highlighter: Highlight JD-aligned keywords in a resume with a web UI.\n"
        )
    result = call_local_llama(prompt, temperature=0.5)
    if isinstance(result, str) and result.startswith("Error:"):
        return (
            "### Project Ideas (Fast Fallback)\n"
            "1. Metrics Dashboard: Build a small app that ingests CSV/JSON and renders KPI charts.\n"
            "2. Data ETL Mini-Pipeline: Extract from an API, clean with pandas, load to SQLite, expose a simple API.\n"
            "3. Resume Keyword Highlighter: Highlight JD-aligned keywords in a resume with a web UI.\n"
        )
    return result


def generate_cover_letter(resume_text, jd_text, skills):
    """
    Generate a concise, tailored cover letter using the local Llama model.
    Produces a professional, ATS-friendly cover letter aligned to the job.
    """
    skills_joined = ', '.join(skills)

    prompt = f"""
System Role: Expert technical recruiter and senior hiring manager.

Goal: Draft a short, role-aligned cover letter (200-300 words) tailored to the given job description, grounded in the candidate's resume.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

KNOWN SKILLS:
{skills_joined}

Requirements:
- Use a professional, confident tone.
- Reflect 2-3 specific JD requirements and map them to candidate strengths.
- Include one brief accomplishment with measurable impact if present.
- Avoid buzzwords and cliches. Avoid repeating resume bullet points verbatim.
- End with a polite CTA to continue the conversation.

Output:
- Plain text, no salutations like "To Whom it May Concern" unless JD lacks a company name.
"""

    if not is_ollama_available():
        return (
            "Dear Hiring Team,\n\n"
            "I’m excited to apply for this role. My background aligns with the position’s core requirements, and I’ve delivered measurable results in related projects."
            " I’m particularly drawn to your focus on impact and quality. I’d welcome the chance to discuss how I can contribute.\n\n"
            "Best regards,\nYour Name"
        )
    result = call_local_llama(prompt, temperature=0.4)
    if isinstance(result, str) and result.startswith("Error:"):
        return (
            "Dear Hiring Team,\n\n"
            "I'm excited to apply for this role. My background aligns with the position's core requirements, and I've delivered measurable results in related projects."
            " I'm particularly drawn to your focus on impact and quality. I'd welcome the chance to discuss how I can contribute.\n\n"
            "Best regards,\nYour Name"
        )
    return result

def generate_ai_career_suggestions(interest_data: dict, skill_data: dict) -> List[dict]:
    """
    Generate AI-powered career suggestions using Ollama based on user interests and skills.
    
    Args:
        interest_data: Dictionary containing user's interest analysis
        skill_data: Dictionary containing user's skill analysis
    
    Returns:
        List of career recommendation dictionaries
    """
    # Prepare the prompt for AI career suggestions
    academic_interests = interest_data.get('academic_interests', [])
    hobby_interests = interest_data.get('hobby_interests', [])
    work_environment = interest_data.get('work_environment', '')
    motivation = interest_data.get('motivation', '')
    learning_interests = skill_data.get('learning_interests', [])
    current_skills = skill_data.get('current_skills', {})
    experience_level = skill_data.get('experience_level', '')
    
    # Flatten current skills
    all_current_skills = []
    for category, skills in current_skills.items():
        all_current_skills.extend(skills)
    
    prompt = f"""
You are a career counselor. Generate 4-6 personalized career recommendations.

USER PROFILE:
Academic: {', '.join(academic_interests) if academic_interests else 'None'}
Hobbies: {', '.join(hobby_interests) if hobby_interests else 'None'}
Work Environment: {work_environment}
Motivation: {motivation}
Learning Interests: {', '.join(learning_interests) if learning_interests else 'None'}
Current Skills: {', '.join(all_current_skills) if all_current_skills else 'None'}
Experience: {experience_level}

Requirements:
- Suggest careers matching their profile
- Indian market salary ranges (₹1-20 LPA)
- Include learning paths
- Mix entry-level and growth positions

Output JSON format:
{{
  "careers": [
    {{
      "title": "Career Name",
      "description": "What this career involves",
      "skills_needed": ["Skill1", "Skill2"],
      "learning_path": "How to get started",
      "salary_range": "₹X-Y LPA",
      "growth": "High/Medium/Stable",
      "match_reason": "Why this fits",
      "entry_level": "Entry/Mid/Senior",
      "time_to_start": "X-Y months"
    }}
  ]
}}

Generate exactly 4-6 careers. Keep descriptions short and complete.
"""

    try:
        # Get real-time career data from web scraping
        scraper = get_career_scraper()
        web_career_data = {}
        
        # Scrape career trends for learning interests
        if learning_interests:
            web_career_data = scraper.get_career_trends(learning_interests[:3])
        
        # Enhance prompt with real-time data
        if web_career_data:
            prompt += f"\n\nREAL-TIME MARKET DATA:\n"
            for skill, data in web_career_data.items():
                prompt += f"- {skill}: {data['job_count']} jobs, {data['avg_salary']}, {data['growth_trend']} growth\n"
        
        # Call Ollama for AI-powered career suggestions
        response = call_local_llama(prompt)
        
        if response and response.strip():
            # Try to parse JSON response with improved error handling
            try:
                # Extract JSON from response if it's wrapped in markdown
                if "```json" in response:
                    json_start = response.find("```json") + 7
                    json_end = response.find("```", json_start)
                    json_str = response[json_start:json_end].strip()
                elif "```" in response:
                    json_start = response.find("```") + 3
                    json_end = response.find("```", json_start)
                    json_str = response[json_start:json_end].strip()
                else:
                    json_str = response.strip()
                
                # Try to fix incomplete JSON by finding the last complete career object
                if json_str.count('{') > json_str.count('}'):
                    # Find the last complete career object
                    last_complete_brace = json_str.rfind('}')
                    if last_complete_brace > 0:
                        # Find the start of the careers array
                        careers_start = json_str.find('"careers": [')
                        if careers_start > 0:
                            # Extract up to the last complete career
                            partial_json = json_str[:careers_start + 12] + json_str[careers_start + 12:last_complete_brace + 1] + ']}'
                            json_str = partial_json
                
                # Parse JSON
                career_data = json.loads(json_str)
                careers = career_data.get('careers', [])
                
                # Validate and format the careers
                formatted_careers = []
                for career in careers:
                    if isinstance(career, dict) and 'title' in career:
                        formatted_career = {
                            'title': career.get('title', 'Unknown Career'),
                            'description': career.get('description', 'No description available'),
                            'skills_needed': career.get('skills_needed', []),
                            'learning_path': career.get('learning_path', 'No learning path specified'),
                            'salary_range': career.get('salary_range', '₹2-8 LPA'),
                            'growth': career.get('growth', 'Medium'),
                            'match_reason': career.get('match_reason', 'Good fit based on your profile'),
                            'entry_level': career.get('entry_level', 'Entry'),
                            'time_to_start': career.get('time_to_start', '3-6 months')
                        }
                        formatted_careers.append(formatted_career)
                
                if formatted_careers:
                    return formatted_careers
                else:
                    print("No valid careers found in AI response")
                    return _get_fallback_career_suggestions(interest_data, skill_data)
                
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
                print(f"Raw response: {response[:500]}...")  # Show first 500 chars
                # Try to extract careers manually from the response
                manual_careers = _extract_careers_manually(response)
                if manual_careers:
                    return manual_careers
                # Fall back to hardcoded suggestions
                return _get_fallback_career_suggestions(interest_data, skill_data)
        
        else:
            print("Empty response from Ollama")
            return _get_fallback_career_suggestions(interest_data, skill_data)
            
    except Exception as e:
        print(f"Error generating AI career suggestions: {e}")
        return _get_fallback_career_suggestions(interest_data, skill_data)

def _extract_careers_manually(response: str) -> List[dict]:
    """
    Manually extract career information from incomplete JSON response
    """
    careers = []
    
    # Look for career titles in the response
    import re
    
    # Find all "title": "..." patterns
    title_pattern = r'"title":\s*"([^"]+)"'
    titles = re.findall(title_pattern, response)
    
    # Find all "description": "..." patterns
    desc_pattern = r'"description":\s*"([^"]+)"'
    descriptions = re.findall(desc_pattern, response)
    
    # Find all "salary_range": "..." patterns
    salary_pattern = r'"salary_range":\s*"([^"]+)"'
    salaries = re.findall(salary_pattern, response)
    
    # Find all "match_reason": "..." patterns
    reason_pattern = r'"match_reason":\s*"([^"]+)"'
    reasons = re.findall(reason_pattern, response)
    
    # Create career objects from extracted data
    for i, title in enumerate(titles[:6]):  # Limit to 6 careers
        career = {
            'title': title,
            'description': descriptions[i] if i < len(descriptions) else 'AI-generated career suggestion',
            'skills_needed': ['Skills to be determined'],
            'learning_path': 'Learning path to be determined',
            'salary_range': salaries[i] if i < len(salaries) else '₹2-8 LPA',
            'growth': 'Medium',
            'match_reason': reasons[i] if i < len(reasons) else 'Good fit based on your profile',
            'entry_level': 'Entry',
            'time_to_start': '3-6 months'
        }
        careers.append(career)
    
    return careers

def _get_fallback_career_suggestions(interest_data: dict, skill_data: dict) -> List[dict]:
    """
    Fallback career suggestions when AI is not available.
    This is the improved hardcoded logic we implemented earlier.
    """
    recommendations = []
    learning_interests = skill_data.get('learning_interests', [])
    
    # Tech careers - More inclusive scoring
    tech_keywords = ['Programming', 'Data Science', 'Web Development', 'Mobile App Development', 
                   'Machine Learning', 'Cybersecurity', 'Cloud Computing']
    has_tech_interest = (interest_data['tech_score'] >= 1 or 
                        any(keyword in learning_interests for keyword in tech_keywords) or
                        'Programming' in learning_interests or
                        'Computer Science' in interest_data.get('academic_interests', []))
    
    if has_tech_interest:
        recommendations.extend([
            {
                'title': 'Software Developer',
                'description': 'Build applications and software solutions',
                'skills_needed': ['Programming', 'Problem Solving', 'Logic'],
                'learning_path': 'Start with Python or JavaScript basics',
                'salary_range': '₹3-15 LPA',
                'growth': 'High',
                'match_reason': 'Matches your technical interests and problem-solving skills',
                'entry_level': 'Entry',
                'time_to_start': '3-6 months'
            },
            {
                'title': 'Data Analyst',
                'description': 'Analyze data to help businesses make decisions',
                'skills_needed': ['Statistics', 'Excel', 'SQL', 'Python'],
                'learning_path': 'Learn Excel, SQL, and basic Python',
                'salary_range': '₹2-12 LPA',
                'growth': 'Very High',
                'match_reason': 'Great for analytical minds and data enthusiasts',
                'entry_level': 'Entry',
                'time_to_start': '2-4 months'
            }
        ])
    
    # Creative careers - More inclusive scoring
    creative_keywords = ['Design', 'Graphic Design', 'UI/UX Design']
    has_creative_interest = (interest_data['creative_score'] >= 1 or 
                           any(keyword in learning_interests for keyword in creative_keywords) or
                           'Design/Creativity' in interest_data.get('hobby_interests', []) or
                           'Art' in interest_data.get('academic_interests', []))
    
    if has_creative_interest:
        recommendations.extend([
            {
                'title': 'UI/UX Designer',
                'description': 'Design user interfaces and experiences',
                'skills_needed': ['Design', 'Creativity', 'User Research'],
                'learning_path': 'Learn Figma, Adobe XD, and design principles',
                'salary_range': '₹2-10 LPA',
                'growth': 'High',
                'match_reason': 'Perfect for creative individuals who enjoy design',
                'entry_level': 'Entry',
                'time_to_start': '2-4 months'
            }
        ])
    
    # Business careers - More inclusive scoring
    business_keywords = ['Business', 'Project Management', 'Business Analysis']
    has_business_interest = (interest_data['business_score'] >= 1 or 
                           any(keyword in learning_interests for keyword in business_keywords) or
                           'Business Studies' in interest_data.get('academic_interests', []) or
                           'Helping Others' in interest_data.get('hobby_interests', []))
    
    if has_business_interest:
        recommendations.extend([
            {
                'title': 'Business Analyst',
                'description': 'Analyze business processes and requirements',
                'skills_needed': ['Analysis', 'Communication', 'Problem Solving'],
                'learning_path': 'Learn Excel, SQL, and business analysis tools',
                'salary_range': '₹3-12 LPA',
                'growth': 'High',
                'match_reason': 'Great for analytical and people-oriented individuals',
                'entry_level': 'Entry',
                'time_to_start': '3-6 months'
            }
        ])
    
    # Fallback recommendations - Show general career options if no specific matches
    if not recommendations:
        recommendations.extend([
            {
                'title': 'Customer Service Representative',
                'description': 'Help customers with their needs and inquiries',
                'skills_needed': ['Communication', 'Patience', 'Problem Solving'],
                'learning_path': 'Develop communication skills and learn customer service tools',
                'salary_range': '₹1.5-4 LPA',
                'growth': 'Stable',
                'match_reason': 'Good entry-level position for developing professional skills',
                'entry_level': 'Entry',
                'time_to_start': '1-2 months'
            },
            {
                'title': 'Content Writer',
                'description': 'Create written content for websites, blogs, and marketing',
                'skills_needed': ['Writing', 'Research', 'Creativity'],
                'learning_path': 'Improve writing skills and learn SEO basics',
                'salary_range': '₹1.5-6 LPA',
                'growth': 'High',
                'match_reason': 'Perfect for those who enjoy writing and creativity',
                'entry_level': 'Entry',
                'time_to_start': '1-3 months'
            }
        ])
    
    return recommendations

def generate_ai_course_suggestions(skills: List[str], user_profile: dict = None) -> List[dict]:
    """
    Generate AI-powered course suggestions using web scraping + Llama
    """
    try:
        # Get real-time course data from web scraping
        scraper = get_career_scraper()
        web_course_data = scraper.get_course_recommendations(skills[:3])
        
        # Create prompt for Llama to analyze and recommend courses
        prompt = f"""
You are a learning advisor. Analyze these real-time courses and recommend the best ones.

SKILLS TO LEARN: {', '.join(skills)}

REAL-TIME COURSES FOUND:
"""
        
        for skill, courses in web_course_data.items():
            prompt += f"\n{skill}:\n"
            for course in courses[:3]:
                prompt += f"- {course['title']} ({course['platform']}) - {course['price']} - Rating: {course['rating']}\n"
        
        prompt += f"""
USER PROFILE:
{user_profile if user_profile else 'General learner'}

Requirements:
- Recommend 3-5 best courses from the real-time data
- Consider price, rating, and platform reputation
- Mix free and paid options
- Include learning path suggestions

Output JSON format:
{{
  "recommended_courses": [
    {{
      "title": "Course Title",
      "platform": "Platform Name",
      "price": "Price",
      "rating": "Rating",
      "url": "Course URL",
      "why_recommended": "Why this course is good",
      "learning_order": 1
    }}
  ],
  "learning_path": "Suggested learning sequence"
}}

Generate recommendations now.
"""
        
        # Call Ollama for course recommendations
        response = call_local_llama(prompt)
        
        if response and response.strip():
            try:
                # Extract JSON from response
                if "```json" in response:
                    json_start = response.find("```json") + 7
                    json_end = response.find("```", json_start)
                    json_str = response[json_start:json_end].strip()
                elif "```" in response:
                    json_start = response.find("```") + 3
                    json_end = response.find("```", json_start)
                    json_str = response[json_start:json_end].strip()
                else:
                    json_str = response.strip()
                
                # Parse JSON
                course_data = json.loads(json_str)
                recommended_courses = course_data.get('recommended_courses', [])
                
                # Add web scraped data to recommendations
                enhanced_courses = []
                for course in recommended_courses:
                    enhanced_course = {
                        'title': course.get('title', 'Unknown Course'),
                        'platform': course.get('platform', 'Unknown Platform'),
                        'price': course.get('price', 'Free/Paid'),
                        'rating': course.get('rating', '4.5'),
                        'url': course.get('url', '#'),
                        'why_recommended': course.get('why_recommended', 'Good course for learning'),
                        'learning_order': course.get('learning_order', 1),
                        'duration': '4-8 weeks',
                        'skills_covered': skills[:3]
                    }
                    enhanced_courses.append(enhanced_course)
                
                return enhanced_courses
                
            except json.JSONDecodeError as e:
                print(f"JSON parsing error in course suggestions: {e}")
                # Fall back to web scraped courses
                fallback_courses = []
                for skill, courses in web_course_data.items():
                    for course in courses[:2]:
                        fallback_courses.append({
                            'title': course['title'],
                            'platform': course['platform'],
                            'price': course['price'],
                            'rating': course['rating'],
                            'url': course['url'],
                            'why_recommended': f'Real-time course for {skill}',
                            'learning_order': len(fallback_courses) + 1,
                            'duration': course.get('duration', '4-8 weeks'),
                            'skills_covered': [skill]
                        })
                return fallback_courses
        
        else:
            print("Empty response from Ollama for course suggestions")
            return []
            
    except Exception as e:
        print(f"Error generating AI course suggestions: {e}")
        return []

