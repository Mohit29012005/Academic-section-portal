"""
Evolvex AI — LLM Client (OpenRouter)
Using openai/gpt-oss-20b:free with advanced prompt engineering
for all 4 AI-powered features.
"""

import json
import re
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

# ── OpenRouter client ─────────────────────────────────────────
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
    timeout=60,
)

MODEL = "openai/gpt-oss-20b:free"


# ══════════════════════════════════════════════════════════════
#   JSON EXTRACTION UTILITY
# ══════════════════════════════════════════════════════════════

def extract_json(text: str) -> dict | list:
    """
    Robustly extract JSON from LLM output.
    Handles markdown code blocks, extra prose, etc.
    """
    if not text:
        return {}

    # Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?\s*", "", text)
    cleaned = re.sub(r"```\s*", "", cleaned)
    cleaned = cleaned.strip()

    # Try again after cleaning
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Find the first JSON object or array in the text
    for pattern in [r"\{.*\}", r"\[.*\]"]:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

    logger.warning("Could not extract JSON from LLM output")
    return {}


def chat(system_prompt: str, user_prompt: str, use_reasoning: bool = False) -> str:
    """
    Core LLM call via OpenRouter.
    Returns raw text content of the assistant's response.
    """
    messages = [
        {"role": "system",  "content": system_prompt},
        {"role": "user",    "content": user_prompt},
    ]

    kwargs = {
        "model":    MODEL,
        "messages": messages,
    }

    if use_reasoning:
        kwargs["extra_body"] = {"reasoning": {"enabled": True}}

    try:
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        raise RuntimeError(f"LLM service error: {str(e)}")


# ══════════════════════════════════════════════════════════════
#   FEATURE 1 — CAREER RECOMMENDATION
# ══════════════════════════════════════════════════════════════

CAREER_SYSTEM = """You are a world-class career counselor specialising in the Indian technology job market (2025–2026).
You know current hiring trends, salary ranges, and career trajectories across all tech domains.

INSTRUCTIONS:
- Be specific, actionable, and data-driven.
- Salary ranges must reflect Indian market (CTC in LPA or ₹/month).
- Roadmap steps must be ordered and practical (5–7 steps).
- Resources must include real, verifiable URLs (Coursera, Udemy, YouTube, official docs, etc.).
- Match score: estimate based on overlap between user interests/skills and the career demands (0–100).
- ALWAYS return ONLY valid JSON — no prose before or after.

OUTPUT FORMAT (strict JSON):
{
  "recommendations": [
    {
      "key": "snake_case_key",
      "title": "Career Title",
      "emoji": "🎯",
      "match": 92,
      "salary": "₹8L – ₹35L / year",
      "description": "2–3 sentence description of the role and industry.",
      "skills": ["Core Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
      "roadmap": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ...", "Step 5: ..."],
      "resources": [
        {"title": "Resource Name", "url": "https://...", "free": true},
        {"title": "Resource Name 2", "url": "https://...", "free": false}
      ],
      "market_insight": "One sentence about current demand and growth outlook in India."
    }
  ]
}"""


def get_ai_career_recommendations(interests: list, skills: str, experience: str) -> dict:
    """Use LLM to generate personalised career path recommendations."""
    user_prompt = f"""Generate detailed career path recommendations for this user profile:

INTERESTS: {', '.join(interests)}
CURRENT SKILLS: {skills or 'Not specified'}
EXPERIENCE LEVEL: {experience}

Provide 3–5 distinct career paths that best match the profile.
Each path should have a full 5–7 step roadmap, real learning resources, 
accurate 2025 Indian market salary data, and a market demand insight.

Return ONLY the JSON object. No extra text."""

    try:
        raw = chat(CAREER_SYSTEM, user_prompt, use_reasoning=True)
        result = extract_json(raw)
        if result and "recommendations" in result:
            return result
    except Exception as e:
        logger.error(f"Career LLM failed: {e}")

    return {}


# ══════════════════════════════════════════════════════════════
#   FEATURE 2 — SKILL QUIZ GENERATOR
# ══════════════════════════════════════════════════════════════

QUIZ_SYSTEM = """You are a senior technical interviewer at a top-tier tech company.
You create precise, practical, unambiguous MCQ questions that test real-world understanding.

INSTRUCTIONS:
- Questions must test applied knowledge, not just theory.
- 4 options per question. Exactly ONE correct answer.
- answer is a zero-indexed integer (0, 1, 2, or 3).
- Vary difficulty: ~40% easy, 40% medium, 20% hard.
- Include a concise explanation for the correct answer.
- ALWAYS return ONLY valid JSON — no prose before or after.

OUTPUT FORMAT (strict JSON):
{
  "quiz": [
    {
      "skill": "python",
      "q": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 2,
      "explanation": "Option C is correct because..."
    }
  ]
}"""


def generate_ai_quiz(skills: list, count: int = 10) -> dict:
    """Use LLM to generate a fresh, contextual skill assessment quiz."""
    user_prompt = f"""Generate exactly {count} MCQ questions to assess these skills: {', '.join(skills)}.

Requirements:
- Distribute questions across all selected skills proportionally.
- Test practical, real-world usage (not just definitions).
- Include code snippets where relevant (use inline code formatting).
- Mix difficulty levels naturally.
- Each question must have exactly 4 options with only ONE correct answer.

Return ONLY the JSON object with a "quiz" array of {count} questions. No extra text."""

    try:
        raw = chat(QUIZ_SYSTEM, user_prompt)
        result = extract_json(raw)
        if result and "quiz" in result and len(result["quiz"]) > 0:
            # Validate and sanitize each question
            valid_qs = []
            for q in result["quiz"]:
                if (isinstance(q.get("q"), str) and
                    isinstance(q.get("options"), list) and
                    len(q["options"]) == 4 and
                    isinstance(q.get("answer"), int) and
                    0 <= q["answer"] <= 3):
                    valid_qs.append(q)
            if valid_qs:
                return {"quiz": valid_qs}
    except Exception as e:
        logger.error(f"Quiz LLM failed: {e}")

    return {}


# ══════════════════════════════════════════════════════════════
#   FEATURE 3 — LEARNING RESOURCES
# ══════════════════════════════════════════════════════════════

LEARNING_SYSTEM = """You are an expert learning path curator with deep knowledge of online education platforms.
You know which resources genuinely teach skills well: Coursera, edX, Udemy, freeCodeCamp, 
YouTube channels, official documentation, GitHub repositories, Kaggle, fast.ai, DeepLearning.AI, etc.

INSTRUCTIONS:
- List ONLY real resources with verifiable URLs that existed as of 2024.
- Include a mix of free and paid options (prefer free when quality is equal).
- Rate each resource honestly (4.0–5.0).
- Duration should be realistic.
- For each skill, provide 3–4 diverse resources (different platforms/formats).
- ALWAYS return ONLY valid JSON — no prose before or after.

OUTPUT FORMAT (strict JSON):
{
  "resources": {
    "skill_name": [
      {
        "title": "Resource Title",
        "platform": "Platform Name",
        "url": "https://actual-url.com/path",
        "rating": 4.8,
        "free": true,
        "duration": "X hours / weeks / self-paced",
        "type": "Course | Video | Documentation | Book | Tutorial"
      }
    ]
  }
}"""


def get_ai_learning_resources(topics: list, free_only: bool = False) -> dict:
    """Use LLM to curate real learning resources for given topics."""
    free_constraint = "ONLY include completely free resources." if free_only else "Mix of free and paid. Mark clearly."

    user_prompt = f"""Curate a high-quality learning resource list for these topics: {', '.join(topics)}.

Constraints:
- {free_constraint}
- Provide 3–4 resources per topic from different platforms.
- Resources must be from well-known, reliable platforms (Coursera, Udemy, freeCodeCamp, official docs, YouTube, fast.ai, Kaggle, DeepLearning.AI, etc.)
- URLs must be real and direct (no redirect links, no search pages).
- Include resources suitable for beginners to intermediate learners.
- Rate resources based on actual community reception.

Return ONLY the JSON object. No extra text."""

    try:
        raw = chat(LEARNING_SYSTEM, user_prompt)
        result = extract_json(raw)
        if result and "resources" in result and len(result["resources"]) > 0:
            return result
    except Exception as e:
        logger.error(f"Learning LLM failed: {e}")

    return {}


# ══════════════════════════════════════════════════════════════
#   FEATURE 4 — INTERNSHIP SUGGESTIONS
# ══════════════════════════════════════════════════════════════

INTERNSHIP_SYSTEM = """You are a career advisor with comprehensive knowledge of Indian tech internship 
and entry-level job market in 2025. You know about startups, MNCs, unicorns, and research labs 
that hire interns across Bengaluru, Hyderabad, Mumbai, Pune, Delhi NCR, Chennai, and remotely.

INSTRUCTIONS:
- Include a realistic mix of top-tier (Google, Microsoft, Flipkart) and accessible (mid-tier startups) companies.
- Stipend figures must reflect actual 2025 Indian market rates.
- Apply links should be to real career pages of the companies.
- Match score: how well the role matches user skills (0–100).
- Include type: "SDE Intern", "Data Intern", "Research Intern", "Product Intern", etc.
- market_insight: one useful tip about this company/role.
- ALWAYS return ONLY valid JSON — no prose before or after.

OUTPUT FORMAT (strict JSON):
{
  "internships": [
    {
      "title": "Role Title",
      "company": "Company Name",
      "location": "City, IN",
      "salary": "₹XX,000/month",
      "duration": "X months",
      "skills": ["Skill1", "Skill2", "Skill3"],
      "apply": "https://company.com/careers",
      "type": "SDE Intern",
      "stipend_range": [45000, 55000],
      "matchScore": 88,
      "market_insight": "Brief tip about this company/role."
    }
  ]
}"""


def get_ai_internships(location: str, skills: list, min_stipend: int, max_stipend: int, domain: str) -> dict:
    """Use LLM to generate contextual internship suggestions."""
    skills_str = ', '.join(skills) if skills else 'General Software Development'
    location_str = location if location not in ('any', 'anywhere') else 'anywhere in India OR remote'

    user_prompt = f"""Suggest 12–15 relevant internship opportunities for this profile:

PREFERRED LOCATION: {location_str}
DOMAIN/ROLE: {domain or 'Any tech domain'}
SKILLS: {skills_str}
STIPEND RANGE: ₹{min_stipend:,} – ₹{max_stipend:,} per month

Requirements:
- Mix of well-known companies (FAANG/MNCs) and accessible Indian startups/unicorns.
- All locations must match the preference (or include remote options).
- All stipends must fall within stated range.
- Skills must be achievable for a student or fresher with the listed profile.
- Provide REAL company career page URLs.
- Calculate match score based on skills overlap.

Return ONLY the JSON object. No extra text."""

    try:
        raw = chat(INTERNSHIP_SYSTEM, user_prompt, use_reasoning=True)
        result = extract_json(raw)
        if result and "internships" in result and len(result["internships"]) > 0:
            return result
    except Exception as e:
        logger.error(f"Internship LLM failed: {e}")

    return {}
