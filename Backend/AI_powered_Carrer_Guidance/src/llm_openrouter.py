"""
Enhanced LLM client using OpenRouter API with GPT-4 level reasoning
Uses: openai/gpt-4-turbo:free with extended reasoning capabilities
"""

import requests
import json
import os
from typing import Dict, List, Any, Optional

# OpenRouter API configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Model selection - Using free tier models from OpenRouter
MODELS = {
    "reasoning": "openai/gpt-4-turbo-preview",  # Best for reasoning
    "general": "openai/gpt-3.5-turbo",           # Fast general purpose
    "analysis": "anthropic/claude-2"              # Best for text analysis
}


class OpenRouterLLM:
    """Enhanced LLM client using OpenRouter with reasoning capabilities"""
    
    def __init__(self, api_key: str = OPENROUTER_API_KEY):
        self.api_key = api_key
        self.api_url = OPENROUTER_API_URL
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        })
    
    def _make_request(self, messages: List[Dict], model: str = "general", 
                     temperature: float = 0.7, max_tokens: int = 1000,
                     reasoning: bool = False) -> Optional[Dict]:
        """Make API request to OpenRouter"""
        try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            
            # Enable extended reasoning if requested
            if reasoning and "gpt-4" in model:
                payload["reasoning"] = {"enabled": True}
            
            response = self.session.post(self.api_url, json=payload, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]
            else:
                print(f"OpenRouter error: {data.get('error', 'Unknown error')}")
                return None
                
        except requests.exceptions.Timeout:
            print("OpenRouter API timeout")
            return None
        except requests.exceptions.RequestException as e:
            print(f"OpenRouter API error: {e}")
            return None
    
    def analyze_fit(self, resume: str, job_desc: str) -> Dict[str, Any]:
        """Analyze resume-job fit using extended reasoning"""
        prompt = f"""Analyze the fit between this resume and job description.

RESUME:
{resume[:1500]}

JOB DESCRIPTION:
{job_desc[:1500]}

Provide analysis in JSON format:
{{
  "fit_score": 0-100,
  "verdict": "Strong Fit|Good Fit|Moderate Fit|Needs Learning",
  "matched_skills": [],
  "missing_skills": [],
  "key_insights": []
}}

Be precise and analytical."""

        message = self._make_request(
            messages=[{"role": "user", "content": prompt}],
            model=MODELS["reasoning"],
            temperature=0.3,
            max_tokens=1500,
            reasoning=True
        )
        
        if not message:
            return {}
        
        try:
            content = message.get("content", "")
            # Extract JSON from response
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                json_str = content[start:end]
                return json.loads(json_str)
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Failed to parse LLM response: {e}")
        
        return {}
    
    def generate_quiz(self, skill: str, difficulty: str = "intermediate", 
                     count: int = 5) -> List[Dict[str, Any]]:
        """Generate quiz questions for a skill"""
        prompt = f"""Generate {count} multiple choice quiz questions for {skill} at {difficulty} level.

Format as JSON array:
[
  {{
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct": "A",
    "explanation": "..."
  }}
]

Make questions practical and realistic."""

        message = self._make_request(
            messages=[{"role": "user", "content": prompt}],
            model=MODELS["general"],
            temperature=0.7,
            max_tokens=2000
        )
        
        if not message:
            return []
        
        try:
            content = message.get("content", "")
            start = content.find("[")
            end = content.rfind("]") + 1
            if start >= 0 and end > start:
                json_str = content[start:end]
                return json.loads(json_str)
        except (json.JSONDecodeError, ValueError):
            print("Failed to parse quiz response")
        
        return []
    
    def extract_learning_resources(self, topic: str, skill_level: str = "beginner") -> List[Dict]:
        """Extract curated learning resources for a topic"""
        prompt = f"""Find best free online learning resources for {topic} ({skill_level} level).

Return as JSON:
[
  {{
    "title": "...",
    "platform": "Coursera|Udemy|GitHub|YouTube|...",
    "url": "https://...",
    "rating": 4.5,
    "free": true,
    "duration": "5 hours",
    "type": "Course|Tutorial|Book|Project"
  }}
]

Provide 5-7 high-quality resources."""

        message = self._make_request(
            messages=[{"role": "user", "content": prompt}],
            model=MODELS["analysis"],
            temperature=0.5,
            max_tokens=2000
        )
        
        if not message:
            return []
        
        try:
            content = message.get("content", "")
            start = content.find("[")
            end = content.rfind("]") + 1
            if start >= 0 and end > start:
                json_str = content[start:end]
                return json.loads(json_str)
        except (json.JSONDecodeError, ValueError):
            print("Failed to parse resources response")
        
        return []
    
    def generate_career_recommendations(self, interests: List[str], 
                                       skills: str = "", 
                                       experience: str = "fresher") -> List[Dict]:
        """Generate career recommendations based on interests"""
        interests_text = ", ".join(interests)
        prompt = f"""Recommend top 3 career paths for someone interested in: {interests_text}

Skills: {skills if skills else 'Beginner'}
Experience: {experience}

Return as JSON:
[
  {{
    "title": "...",
    "emoji": "🚀",
    "match": 85,
    "salary": "₹5L - ₹15L / year",
    "description": "...",
    "skills": [],
    "roadmap": [],
    "market_insight": "..."
  }}
]"""

        message = self._make_request(
            messages=[{"role": "user", "content": prompt}],
            model=MODELS["reasoning"],
            temperature=0.6,
            max_tokens=2000,
            reasoning=True
        )
        
        if not message:
            return []
        
        try:
            content = message.get("content", "")
            start = content.find("[")
            end = content.rfind("]") + 1
            if start >= 0 and end > start:
                json_str = content[start:end]
                return json.loads(json_str)
        except (json.JSONDecodeError, ValueError):
            print("Failed to parse career recommendations")
        
        return []


# Global instance
llm_client = OpenRouterLLM()


# Convenience functions for backward compatibility
def analyze_fit_with_llm(resume: str, job_desc: str) -> Dict[str, Any]:
    """Analyze resume-job fit"""
    return llm_client.analyze_fit(resume, job_desc)


def generate_quiz_with_llm(skill: str, count: int = 5) -> List[Dict]:
    """Generate quiz questions"""
    return llm_client.generate_quiz(skill, count=count)


def get_learning_resources_with_llm(topic: str) -> List[Dict]:
    """Get learning resources"""
    return llm_client.extract_learning_resources(topic)


def get_career_recommendations_with_llm(interests: List[str], skills: str = "") -> List[Dict]:
    """Get career recommendations"""
    return llm_client.generate_career_recommendations(interests, skills)
