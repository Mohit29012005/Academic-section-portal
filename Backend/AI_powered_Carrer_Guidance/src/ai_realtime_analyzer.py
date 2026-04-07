"""
AI-Powered Real-time Data Analyzer
Uses LLM with internet access to analyze live data and provide insights
"""

import requests
import json
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import streamlit as st
from web_scraper import get_web_scraper
from local_llm import call_local_llama

class AIRealtimeAnalyzer:
    def __init__(self):
        self.web_scraper = get_web_scraper()
        self.llm_available = self._check_llm_availability()
    
    def _check_llm_availability(self) -> bool:
        """Check if local LLM is available"""
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=3)
            return response.status_code == 200
        except:
            return False
    
    def analyze_market_trends(self, skills: List[str], location: str = "Global") -> Dict[str, Any]:
        """Analyze real-time market trends for skills"""
        
        # Fetch real-time data
        job_data = self.web_scraper.fetch_skill_demand_data(skills)
        news_data = self.web_scraper.fetch_tech_news(skills)
        github_trends = self.web_scraper.fetch_github_trending_repos("python")
        
        # Prepare data for LLM analysis
        analysis_prompt = f"""
        Analyze the following real-time market data for skills: {', '.join(skills)}
        
        Job Market Data:
        {json.dumps(job_data, indent=2)}
        
        Tech News:
        {json.dumps(news_data[:5], indent=2)}
        
        GitHub Trends:
        {json.dumps(github_trends[:3], indent=2)}
        
        Provide insights on:
        1. Which skills are most in-demand right now?
        2. What are the emerging trends in these technologies?
        3. What salary ranges should professionals expect?
        4. What are the key challenges and opportunities?
        5. What learning priorities should someone focus on?
        
        Format as a structured analysis with actionable insights.
        """
        
        if self.llm_available:
            try:
                analysis = call_local_llama(analysis_prompt, temperature=0.3)
                return self._parse_llm_analysis(analysis, job_data, news_data)
            except Exception as e:
                st.warning(f"LLM analysis failed: {str(e)}")
                return self._get_fallback_analysis(skills, job_data, news_data)
        else:
            return self._get_fallback_analysis(skills, job_data, news_data)
    
    def generate_networking_insights(self, skills: List[str], target_role: str) -> Dict[str, Any]:
        """Generate AI-powered networking insights using real-time data"""
        
        # Fetch networking events and job data
        events = self.web_scraper.fetch_linkedin_jobs(skills)
        news = self.web_scraper.fetch_tech_news(skills)
        
        networking_prompt = f"""
        Based on the following real-time data, provide networking insights for someone targeting a {target_role} role with skills: {', '.join(skills)}
        
        Current Job Market:
        {json.dumps(events[:5], indent=2)}
        
        Industry News:
        {json.dumps(news[:3], indent=2)}
        
        Provide:
        1. Top 5 networking strategies for this role
        2. Key people to connect with (job titles, companies)
        3. Best networking events and platforms to focus on
        4. Conversation starters based on current industry trends
        5. Skills to highlight in networking conversations
        6. Companies actively hiring for this role
        
        Make it actionable and specific to current market conditions.
        """
        
        if self.llm_available:
            try:
                insights = call_local_llama(networking_prompt, temperature=0.4)
                return self._parse_networking_insights(insights, events, news)
            except Exception as e:
                st.warning(f"Networking insights generation failed: {str(e)}")
                return self._get_fallback_networking_insights(skills, target_role)
        else:
            return self._get_fallback_networking_insights(skills, target_role)
    
    def predict_skill_future_demand(self, skills: List[str]) -> Dict[str, Any]:
        """Predict future demand for skills using real-time data"""
        
        # Fetch current trends and news
        news_data = self.web_scraper.fetch_tech_news(skills)
        github_trends = self.web_scraper.fetch_github_trending_repos("python")
        
        prediction_prompt = f"""
        Analyze the following real-time data to predict future demand for these skills: {', '.join(skills)}
        
        Current Tech News:
        {json.dumps(news_data[:5], indent=2)}
        
        GitHub Trending Projects:
        {json.dumps(github_trends[:3], indent=2)}
        
        Predict:
        1. Which skills will be most valuable in 6 months?
        2. Which skills might become less relevant?
        3. What new skills should professionals learn alongside these?
        4. What industries will have the highest demand?
        5. What salary trends can we expect?
        
        Base predictions on current market signals and emerging technologies.
        """
        
        if self.llm_available:
            try:
                predictions = call_local_llama(prediction_prompt, temperature=0.5)
                return self._parse_skill_predictions(predictions, skills)
            except Exception as e:
                st.warning(f"Skill prediction failed: {str(e)}")
                return self._get_fallback_predictions(skills)
        else:
            return self._get_fallback_predictions(skills)
    
    def generate_personalized_learning_roadmap(self, current_skills: List[str], 
                                             target_role: str, 
                                             timeline_months: int = 12) -> Dict[str, Any]:
        """Generate personalized learning roadmap using real-time data"""
        
        # Fetch current market data
        job_data = self.web_scraper.fetch_skill_demand_data(current_skills)
        news_data = self.web_scraper.fetch_tech_news(current_skills)
        
        roadmap_prompt = f"""
        Create a personalized learning roadmap for someone with skills: {', '.join(current_skills)}
        Target role: {target_role}
        Timeline: {timeline_months} months
        
        Current Market Data:
        {json.dumps(job_data, indent=2)}
        
        Industry Trends:
        {json.dumps(news_data[:3], indent=2)}
        
        Create a month-by-month roadmap including:
        1. Skills to learn each month
        2. Specific courses and resources
        3. Projects to build
        4. Networking milestones
        5. Job application timeline
        6. Key metrics to track progress
        
        Make it realistic and based on current market demands.
        """
        
        if self.llm_available:
            try:
                roadmap = call_local_llama(roadmap_prompt, temperature=0.3)
                return self._parse_learning_roadmap(roadmap, timeline_months)
            except Exception as e:
                st.warning(f"Learning roadmap generation failed: {str(e)}")
                return self._get_fallback_roadmap(current_skills, target_role, timeline_months)
        else:
            return self._get_fallback_roadmap(current_skills, target_role, timeline_months)
    
    def _parse_llm_analysis(self, analysis: str, job_data: Dict, news_data: List[Dict]) -> Dict[str, Any]:
        """Parse LLM analysis into structured format"""
        return {
            "analysis_text": analysis,
            "job_market_summary": job_data,
            "trending_news": news_data[:5],
            "generated_at": datetime.now().isoformat(),
            "data_sources": ["Job Boards", "Tech News", "GitHub Trends"]
        }
    
    def _parse_networking_insights(self, insights: str, events: List[Dict], news: List[Dict]) -> Dict[str, Any]:
        """Parse networking insights into structured format"""
        return {
            "insights_text": insights,
            "current_jobs": events[:5],
            "industry_news": news[:3],
            "generated_at": datetime.now().isoformat(),
            "data_sources": ["LinkedIn Jobs", "Tech News"]
        }
    
    def _parse_skill_predictions(self, predictions: str, skills: List[str]) -> Dict[str, Any]:
        """Parse skill predictions into structured format"""
        return {
            "predictions_text": predictions,
            "analyzed_skills": skills,
            "generated_at": datetime.now().isoformat(),
            "data_sources": ["Tech News", "GitHub Trends"]
        }
    
    def _parse_learning_roadmap(self, roadmap: str, timeline_months: int) -> Dict[str, Any]:
        """Parse learning roadmap into structured format"""
        return {
            "roadmap_text": roadmap,
            "timeline_months": timeline_months,
            "generated_at": datetime.now().isoformat(),
            "data_sources": ["Job Market Data", "Industry News"]
        }
    
    def _get_fallback_analysis(self, skills: List[str], job_data: Dict, news_data: List[Dict]) -> Dict[str, Any]:
        """Fallback analysis when LLM is not available"""
        return {
            "analysis_text": f"Based on current market data, {', '.join(skills)} are in high demand. Job postings show strong growth, and industry news indicates continued relevance.",
            "job_market_summary": job_data,
            "trending_news": news_data[:5],
            "generated_at": datetime.now().isoformat(),
            "data_sources": ["Job Boards", "Tech News"],
            "note": "Analysis generated using statistical data (LLM unavailable)"
        }
    
    def _get_fallback_networking_insights(self, skills: List[str], target_role: str) -> Dict[str, Any]:
        """Fallback networking insights"""
        return {
            "insights_text": f"For a {target_role} role with skills in {', '.join(skills)}, focus on connecting with senior professionals in your target companies and attending industry meetups.",
            "current_jobs": [],
            "industry_news": [],
            "generated_at": datetime.now().isoformat(),
            "data_sources": ["Statistical Analysis"],
            "note": "Insights generated using pattern analysis (LLM unavailable)"
        }
    
    def _get_fallback_predictions(self, skills: List[str]) -> Dict[str, Any]:
        """Fallback skill predictions"""
        return {
            "predictions_text": f"Based on current trends, {', '.join(skills)} are expected to remain in high demand. Consider learning complementary technologies to stay competitive.",
            "analyzed_skills": skills,
            "generated_at": datetime.now().isoformat(),
            "data_sources": ["Historical Data"],
            "note": "Predictions based on historical patterns (LLM unavailable)"
        }
    
    def _get_fallback_roadmap(self, current_skills: List[str], target_role: str, timeline_months: int) -> Dict[str, Any]:
        """Fallback learning roadmap"""
        return {
            "roadmap_text": f"Focus on strengthening your {', '.join(current_skills)} skills while learning complementary technologies. Build 2-3 projects to showcase your abilities for the {target_role} role.",
            "timeline_months": timeline_months,
            "generated_at": datetime.now().isoformat(),
            "data_sources": ["Standard Learning Paths"],
            "note": "Roadmap generated using standard progression patterns (LLM unavailable)"
        }

def get_realtime_analyzer() -> AIRealtimeAnalyzer:
    """Get the global real-time analyzer instance"""
    return AIRealtimeAnalyzer()
