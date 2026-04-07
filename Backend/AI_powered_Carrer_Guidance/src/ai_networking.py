"""
AI-Powered Networking & Mentorship Matching System
Provides real-time networking opportunities, mentorship matching, and professional connections
"""

import requests
import json
import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import streamlit as st

class ConnectionType(Enum):
    MENTOR = "Mentor"
    PEER = "Peer"
    INDUSTRY_EXPERT = "Industry Expert"
    RECRUITER = "Recruiter"
    POTENTIAL_COLLEAGUE = "Potential Colleague"

class EventType(Enum):
    CONFERENCE = "Conference"
    WORKSHOP = "Workshop"
    MEETUP = "Meetup"
    WEBINAR = "Webinar"
    HACKATHON = "Hackathon"
    NETWORKING = "Networking Event"
    JOB_FAIR = "Job Fair"

@dataclass
class ProfessionalConnection:
    name: str
    title: str
    company: str
    industry: str
    skills: List[str]
    experience_years: int
    connection_type: ConnectionType
    linkedin_url: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    availability: str = "Available"
    match_score: float = 0.0
    mutual_connections: int = 0
    location: Optional[str] = None

@dataclass
class NetworkingEvent:
    title: str
    event_type: EventType
    date: str
    location: str
    description: str
    url: str
    attendees_count: int
    relevance_score: float
    skills_focus: List[str]
    cost: str = "Free"
    organizer: str = ""

@dataclass
class MentorshipOpportunity:
    mentor_name: str
    title: str
    company: str
    expertise_areas: List[str]
    mentorship_type: str  # "Career", "Technical", "Leadership", "Industry"
    availability: str
    experience_level: str
    match_score: float
    bio: str
    contact_info: str

class AINetworkingEngine:
    def __init__(self):
        try:
            self.api_keys = {
                'linkedin': st.secrets.get('LINKEDIN_API_KEY', ''),
                'meetup': st.secrets.get('MEETUP_API_KEY', ''),
                'eventbrite': st.secrets.get('EVENTBRITE_API_KEY', ''),
                'openai': st.secrets.get('OPENAI_API_KEY', '')
            }
        except:
            # Fallback when secrets are not available
            self.api_keys = {
                'linkedin': '',
                'meetup': '',
                'eventbrite': '',
                'openai': ''
            }
        
    def fetch_live_networking_events(self, skills: List[str], location: str = "Global") -> List[NetworkingEvent]:
        """Fetch real-time networking events from multiple sources"""
        events = []
        
        try:
            # Fetch from Eventbrite API
            eventbrite_events = self._fetch_eventbrite_events(skills, location)
            events.extend(eventbrite_events)
            
            # Fetch from Meetup API
            meetup_events = self._fetch_meetup_events(skills, location)
            events.extend(meetup_events)
            
            # Fetch from LinkedIn Events
            linkedin_events = self._fetch_linkedin_events(skills, location)
            events.extend(linkedin_events)
            
            # Sort by relevance score
            events.sort(key=lambda x: x.relevance_score, reverse=True)
            
        except Exception as e:
            st.warning(f"Some event sources unavailable: {str(e)}")
            # Fallback to mock data
            events = self._get_fallback_events(skills)
        
        return events[:20]  # Return top 20 events
    
    def _fetch_eventbrite_events(self, skills: List[str], location: str) -> List[NetworkingEvent]:
        """Fetch events from Eventbrite API"""
        events = []
        
        if not self.api_keys['eventbrite']:
            return events
            
        try:
            headers = {'Authorization': f'Bearer {self.api_keys["eventbrite"]}'}
            
            for skill in skills[:3]:  # Limit to top 3 skills
                url = f"https://www.eventbriteapi.com/v3/events/search/"
                params = {
                    'q': f"{skill} networking",
                    'location.address': location,
                    'start_date.range_start': datetime.now().isoformat(),
                    'start_date.range_end': (datetime.now() + timedelta(days=90)).isoformat(),
                    'sort_by': 'relevance'
                }
                
                response = requests.get(url, headers=headers, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    for event_data in data.get('events', [])[:5]:
                        event = self._parse_eventbrite_event(event_data, skill)
                        if event:
                            events.append(event)
                            
        except Exception as e:
            print(f"Eventbrite API error: {e}")
            
        return events
    
    def _fetch_meetup_events(self, skills: List[str], location: str) -> List[NetworkingEvent]:
        """Fetch events from Meetup API"""
        events = []
        
        if not self.api_keys['meetup']:
            return events
            
        try:
            for skill in skills[:3]:
                url = f"https://api.meetup.com/find/upcoming_events"
                params = {
                    'key': self.api_keys['meetup'],
                    'text': f"{skill} networking",
                    'location': location,
                    'radius': 25,
                    'order': 'time'
                }
                
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    for event_data in data.get('events', [])[:5]:
                        event = self._parse_meetup_event(event_data, skill)
                        if event:
                            events.append(event)
                            
        except Exception as e:
            print(f"Meetup API error: {e}")
            
        return events
    
    def _fetch_linkedin_events(self, skills: List[str], location: str) -> List[NetworkingEvent]:
        """Fetch events from LinkedIn (using web scraping as fallback)"""
        events = []
        
        try:
            # This would use LinkedIn's API if available
            # For now, we'll use a web scraping approach or return mock data
            events = self._get_linkedin_mock_events(skills)
            
        except Exception as e:
            print(f"LinkedIn events error: {e}")
            
        return events
    
    def _parse_eventbrite_event(self, event_data: dict, skill: str) -> Optional[NetworkingEvent]:
        """Parse Eventbrite event data"""
        try:
            return NetworkingEvent(
                title=event_data.get('name', {}).get('text', ''),
                event_type=EventType.NETWORKING,
                date=event_data.get('start', {}).get('local', ''),
                location=event_data.get('venue', {}).get('address', {}).get('city', 'Unknown'),
                description=event_data.get('description', {}).get('text', '')[:200],
                url=event_data.get('url', ''),
                attendees_count=event_data.get('capacity', 0),
                relevance_score=self._calculate_event_relevance(event_data, skill),
                skills_focus=[skill],
                cost=event_data.get('is_free', True) and "Free" or "Paid",
                organizer=event_data.get('organizer', {}).get('name', '')
            )
        except Exception:
            return None
    
    def _parse_meetup_event(self, event_data: dict, skill: str) -> Optional[NetworkingEvent]:
        """Parse Meetup event data"""
        try:
            return NetworkingEvent(
                title=event_data.get('name', ''),
                event_type=EventType.MEETUP,
                date=datetime.fromtimestamp(event_data.get('time', 0) / 1000).isoformat(),
                location=event_data.get('venue', {}).get('city', 'Unknown'),
                description=event_data.get('description', '')[:200],
                url=event_data.get('link', ''),
                attendees_count=event_data.get('yes_rsvp_count', 0),
                relevance_score=self._calculate_event_relevance(event_data, skill),
                skills_focus=[skill],
                cost="Free",
                organizer=event_data.get('group', {}).get('name', '')
            )
        except Exception:
            return None
    
    def _calculate_event_relevance(self, event_data: dict, skill: str) -> float:
        """Calculate relevance score for an event"""
        score = 0.5  # Base score
        
        # Check if skill appears in title or description
        title = event_data.get('name', '').lower()
        description = event_data.get('description', '').lower()
        
        if skill.lower() in title:
            score += 0.3
        if skill.lower() in description:
            score += 0.2
            
        # Bonus for networking keywords
        networking_keywords = ['networking', 'meetup', 'connect', 'career', 'professional']
        for keyword in networking_keywords:
            if keyword in title.lower() or keyword in description.lower():
                score += 0.1
                
        return min(score, 1.0)
    
    def _get_fallback_events(self, skills: List[str]) -> List[NetworkingEvent]:
        """Fallback events when APIs are unavailable"""
        return [
            NetworkingEvent(
                title=f"{skill.title()} Professionals Meetup",
                event_type=EventType.MEETUP,
                date=(datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
                location="Online",
                description=f"Connect with {skill} professionals and expand your network",
                url="https://meetup.com",
                attendees_count=50,
                relevance_score=0.8,
                skills_focus=[skill],
                cost="Free",
                organizer="Professional Network"
            )
            for skill in skills[:5]
        ]
    
    def _get_linkedin_mock_events(self, skills: List[str]) -> List[NetworkingEvent]:
        """Mock LinkedIn events for demo purposes"""
        return [
            NetworkingEvent(
                title="Tech Career Networking Event",
                event_type=EventType.NETWORKING,
                date=(datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
                location="San Francisco, CA",
                description="Connect with tech professionals and industry leaders",
                url="https://linkedin.com/events",
                attendees_count=200,
                relevance_score=0.9,
                skills_focus=skills[:3],
                cost="Free",
                organizer="LinkedIn"
            )
        ]
    
    def find_mentorship_opportunities(self, skills: List[str], experience_level: str, 
                                    mentorship_type: str = "Career") -> List[MentorshipOpportunity]:
        """Find mentorship opportunities based on skills and goals"""
        
        # This would integrate with LinkedIn API, mentorship platforms, etc.
        # For now, we'll create intelligent mock data based on real patterns
        
        mentors = []
        
        # Generate mentorship opportunities based on skills
        for skill in skills[:5]:
            mentor = MentorshipOpportunity(
                mentor_name=f"Senior {skill.title()} Expert",
                title=f"Senior {skill.title()} Engineer",
                company="Tech Company",
                expertise_areas=[skill, "Leadership", "Career Growth"],
                mentorship_type=mentorship_type,
                availability="2-3 hours/week",
                experience_level="Senior (5+ years)",
                match_score=0.85,
                bio=f"Experienced {skill} professional with 8+ years in the industry, passionate about mentoring newcomers",
                contact_info="Available through LinkedIn"
            )
            mentors.append(mentor)
        
        # Add some cross-functional mentors
        cross_functional_mentors = [
            MentorshipOpportunity(
                mentor_name="Sarah Johnson",
                title="VP of Engineering",
                company="Startup Inc.",
                expertise_areas=["Leadership", "Career Growth", "Technical Strategy"],
                mentorship_type="Leadership",
                availability="1-2 hours/week",
                experience_level="Executive (10+ years)",
                match_score=0.9,
                bio="Engineering leader with 12+ years experience, specializes in career development and technical leadership",
                contact_info="sarah.johnson@startup.com"
            ),
            MentorshipOpportunity(
                mentor_name="Mike Chen",
                title="Principal Data Scientist",
                company="Big Tech Corp",
                expertise_areas=["Data Science", "Machine Learning", "Research"],
                mentorship_type="Technical",
                availability="3-4 hours/week",
                experience_level="Principal (8+ years)",
                match_score=0.88,
                bio="Principal data scientist with PhD in ML, published researcher and industry expert",
                contact_info="mike.chen@bigtech.com"
            )
        ]
        
        mentors.extend(cross_functional_mentors)
        
        # Sort by match score
        mentors.sort(key=lambda x: x.match_score, reverse=True)
        
        return mentors[:10]
    
    def generate_networking_icebreakers(self, target_person, 
                                      common_skills: List[str]) -> List[str]:
        """Generate personalized icebreaker messages using AI"""
        
        # Handle both ProfessionalConnection and MentorshipOpportunity objects
        name = getattr(target_person, 'name', getattr(target_person, 'mentor_name', 'there'))
        title = getattr(target_person, 'title', 'professional')
        company = getattr(target_person, 'company', 'your company')
        industry = getattr(target_person, 'industry', 'tech')
        
        icebreakers = [
            f"Hi {name}! I noticed we both work with {', '.join(common_skills[:2])}. I'd love to connect and learn about your experience in {title}.",
            
            f"Hello! I see you're a {title} at {company}. I'm also passionate about {common_skills[0]} and would enjoy connecting with someone in the field.",
            
            f"Hi {name}! Your background in {industry} and expertise in {common_skills[0]} caught my attention. Would love to connect and share insights!",
            
            f"Hello! I'm building my skills in {', '.join(common_skills[:2])} and would appreciate connecting with an experienced professional like yourself for guidance.",
            
            f"Hi! I noticed we have {len(common_skills)} mutual skills including {common_skills[0]}. I'd love to connect and learn from your experience at {company}."
        ]
        
        return icebreakers
    
    def suggest_networking_strategy(self, skills: List[str], career_goal: str, 
                                  experience_level: str) -> Dict[str, List[str]]:
        """Suggest personalized networking strategy"""
        
        strategy = {
            "immediate_actions": [
                "Update your LinkedIn profile with current skills and projects",
                "Join 3-5 relevant professional groups on LinkedIn",
                "Attend 2 networking events this month",
                "Reach out to 5 professionals in your target field"
            ],
            "weekly_goals": [
                "Connect with 10 new professionals in your industry",
                "Engage with 5 posts from industry leaders",
                "Share 1 piece of valuable content",
                "Comment meaningfully on 3 industry discussions"
            ],
            "monthly_milestones": [
                "Attend 1 major industry conference or webinar",
                "Schedule 2 informational interviews",
                "Join 1 professional association",
                "Complete 1 skill-based project to showcase"
            ],
            "platform_recommendations": [
                "LinkedIn: Primary professional networking",
                "GitHub: Technical portfolio and connections",
                "Twitter: Industry insights and thought leaders",
                "Discord/Slack: Real-time community engagement"
            ]
        }
        
        return strategy
    
    def analyze_network_strength(self, connections: List[ProfessionalConnection]) -> Dict[str, float]:
        """Analyze the strength and diversity of professional network"""
        
        if not connections:
            return {"overall_score": 0.0, "diversity_score": 0.0, "industry_coverage": 0.0}
        
        # Calculate diversity metrics
        industries = set(conn.industry for conn in connections)
        companies = set(conn.company for conn in connections)
        experience_levels = [conn.experience_years for conn in connections]
        
        diversity_score = len(industries) / 10.0  # Normalize to 0-1
        industry_coverage = min(len(industries) / 5.0, 1.0)
        experience_diversity = len(set(exp // 5 for exp in experience_levels)) / 5.0
        
        overall_score = (diversity_score + industry_coverage + experience_diversity) / 3.0
        
        return {
            "overall_score": round(overall_score, 2),
            "diversity_score": round(diversity_score, 2),
            "industry_coverage": round(industry_coverage, 2),
            "total_connections": len(connections),
            "unique_industries": len(industries),
            "unique_companies": len(companies)
        }

def get_networking_engine() -> AINetworkingEngine:
    """Get the global networking engine instance"""
    return AINetworkingEngine()
