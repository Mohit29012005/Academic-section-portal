"""
Progress Tracking System for Career Development
Tracks user progress, achievements, and learning milestones
"""

import streamlit as st
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
import os

class ProgressTracker:
    def __init__(self):
        self.progress_file = "user_progress.json"
        self.achievements_file = "user_achievements.json"
        self.load_progress()
    
    def load_progress(self):
        """Load user progress from file"""
        try:
            if os.path.exists(self.progress_file):
                with open(self.progress_file, 'r') as f:
                    self.progress_data = json.load(f)
            else:
                self.progress_data = {
                    "user_id": "default_user",
                    "created_at": datetime.now().isoformat(),
                    "total_sessions": 0,
                    "skills_assessed": 0,
                    "resumes_analyzed": 0,
                    "interviews_practiced": 0,
                    "courses_started": 0,
                    "courses_completed": 0,
                    "career_paths_explored": 0,
                    "learning_hours": 0,
                    "achievements": [],
                    "weekly_goals": [],
                    "monthly_goals": [],
                    "streak_days": 0,
                    "last_activity": None
                }
        except Exception as e:
            st.error(f"Error loading progress: {e}")
            self.progress_data = {}
    
    def save_progress(self):
        """Save user progress to file"""
        try:
            with open(self.progress_file, 'w') as f:
                json.dump(self.progress_data, f, indent=2)
        except Exception as e:
            st.error(f"Error saving progress: {e}")
    
    def update_activity(self, activity_type: str, value: int = 1):
        """Update user activity"""
        if activity_type in self.progress_data:
            self.progress_data[activity_type] += value
        
        self.progress_data["last_activity"] = datetime.now().isoformat()
        self.progress_data["total_sessions"] += 1
        
        # Update streak
        self._update_streak()
        
        # Check for achievements
        self._check_achievements()
        
        self.save_progress()
    
    def _update_streak(self):
        """Update daily streak"""
        if self.progress_data.get("last_activity"):
            last_activity = datetime.fromisoformat(self.progress_data["last_activity"])
            today = datetime.now().date()
            last_activity_date = last_activity.date()
            
            if today == last_activity_date:
                # Same day, maintain streak
                pass
            elif today - last_activity_date == timedelta(days=1):
                # Consecutive day, increment streak
                self.progress_data["streak_days"] += 1
            else:
                # Streak broken, reset
                self.progress_data["streak_days"] = 1
        else:
            self.progress_data["streak_days"] = 1
    
    def _check_achievements(self):
        """Check and award achievements"""
        achievements = self._get_available_achievements()
        
        for achievement in achievements:
            if achievement["id"] not in [a["id"] for a in self.progress_data["achievements"]]:
                if self._check_achievement_condition(achievement):
                    self.progress_data["achievements"].append({
                        "id": achievement["id"],
                        "name": achievement["name"],
                        "description": achievement["description"],
                        "earned_at": datetime.now().isoformat(),
                        "icon": achievement["icon"]
                    })
    
    def _get_available_achievements(self) -> List[Dict[str, Any]]:
        """Get list of available achievements"""
        return [
            {
                "id": "first_session",
                "name": "Getting Started",
                "description": "Completed your first session",
                "condition": lambda: self.progress_data["total_sessions"] >= 1,
                "icon": "🎉"
            },
            {
                "id": "skill_assessor",
                "name": "Skill Assessor",
                "description": "Completed 5 skill assessments",
                "condition": lambda: self.progress_data["skills_assessed"] >= 5,
                "icon": "📊"
            },
            {
                "id": "resume_master",
                "name": "Resume Master",
                "description": "Analyzed 3 resumes",
                "condition": lambda: self.progress_data["resumes_analyzed"] >= 3,
                "icon": "📝"
            },
            {
                "id": "interview_practitioner",
                "name": "Interview Practitioner",
                "description": "Practiced 10 interview questions",
                "condition": lambda: self.progress_data["interviews_practiced"] >= 10,
                "icon": "🎯"
            },
            {
                "id": "course_learner",
                "name": "Course Learner",
                "description": "Started 5 courses",
                "condition": lambda: self.progress_data["courses_started"] >= 5,
                "icon": "📚"
            },
            {
                "id": "course_graduate",
                "name": "Course Graduate",
                "description": "Completed 3 courses",
                "condition": lambda: self.progress_data["courses_completed"] >= 3,
                "icon": "🎓"
            },
            {
                "id": "career_explorer",
                "name": "Career Explorer",
                "description": "Explored 5 different career paths",
                "condition": lambda: self.progress_data["career_paths_explored"] >= 5,
                "icon": "🗺️"
            },
            {
                "id": "learning_enthusiast",
                "name": "Learning Enthusiast",
                "description": "Spent 50 hours learning",
                "condition": lambda: self.progress_data["learning_hours"] >= 50,
                "icon": "⏰"
            },
            {
                "id": "streak_master",
                "name": "Streak Master",
                "description": "Maintained a 7-day streak",
                "condition": lambda: self.progress_data["streak_days"] >= 7,
                "icon": "🔥"
            },
            {
                "id": "dedicated_learner",
                "name": "Dedicated Learner",
                "description": "Maintained a 30-day streak",
                "condition": lambda: self.progress_data["streak_days"] >= 30,
                "icon": "💎"
            }
        ]
    
    def _check_achievement_condition(self, achievement: Dict[str, Any]) -> bool:
        """Check if achievement condition is met"""
        try:
            return achievement["condition"]()
        except:
            return False
    
    def get_progress_summary(self) -> Dict[str, Any]:
        """Get progress summary for display"""
        return {
            "total_sessions": self.progress_data.get("total_sessions", 0),
            "streak_days": self.progress_data.get("streak_days", 0),
            "skills_assessed": self.progress_data.get("skills_assessed", 0),
            "resumes_analyzed": self.progress_data.get("resumes_analyzed", 0),
            "interviews_practiced": self.progress_data.get("interviews_practiced", 0),
            "courses_started": self.progress_data.get("courses_started", 0),
            "courses_completed": self.progress_data.get("courses_completed", 0),
            "career_paths_explored": self.progress_data.get("career_paths_explored", 0),
            "learning_hours": self.progress_data.get("learning_hours", 0),
            "achievements_count": len(self.progress_data.get("achievements", [])),
            "last_activity": self.progress_data.get("last_activity")
        }
    
    def get_recent_achievements(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent achievements"""
        achievements = self.progress_data.get("achievements", [])
        return sorted(achievements, key=lambda x: x["earned_at"], reverse=True)[:limit]
    
    def add_goal(self, goal_type: str, goal_text: str, target_date: str = None):
        """Add a new goal"""
        goal = {
            "id": f"{goal_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "text": goal_text,
            "created_at": datetime.now().isoformat(),
            "target_date": target_date,
            "completed": False,
            "completed_at": None
        }
        
        if goal_type == "weekly":
            self.progress_data["weekly_goals"].append(goal)
        elif goal_type == "monthly":
            self.progress_data["monthly_goals"].append(goal)
        
        self.save_progress()
    
    def complete_goal(self, goal_id: str):
        """Mark a goal as completed"""
        for goal_list in ["weekly_goals", "monthly_goals"]:
            for goal in self.progress_data.get(goal_list, []):
                if goal["id"] == goal_id:
                    goal["completed"] = True
                    goal["completed_at"] = datetime.now().isoformat()
                    self.save_progress()
                    break
    
    def get_goals(self, goal_type: str = None) -> List[Dict[str, Any]]:
        """Get goals"""
        if goal_type == "weekly":
            return self.progress_data.get("weekly_goals", [])
        elif goal_type == "monthly":
            return self.progress_data.get("monthly_goals", [])
        else:
            return (self.progress_data.get("weekly_goals", []) + 
                   self.progress_data.get("monthly_goals", []))
    
    def get_learning_insights(self) -> Dict[str, Any]:
        """Get learning insights and recommendations"""
        summary = self.get_progress_summary()
        
        insights = {
            "total_learning_time": f"{summary['learning_hours']} hours",
            "completion_rate": 0,
            "streak_status": "🔥" if summary['streak_days'] >= 7 else "💪",
            "recommendations": []
        }
        
        # Calculate completion rate
        if summary['courses_started'] > 0:
            insights["completion_rate"] = round(
                (summary['courses_completed'] / summary['courses_started']) * 100, 1
            )
        
        # Generate recommendations
        if summary['skills_assessed'] < 3:
            insights["recommendations"].append("Complete more skill assessments to discover your strengths")
        
        if summary['interviews_practiced'] < 5:
            insights["recommendations"].append("Practice more interview questions to build confidence")
        
        if summary['courses_completed'] < 2:
            insights["recommendations"].append("Complete some courses to develop new skills")
        
        if summary['streak_days'] < 3:
            insights["recommendations"].append("Try to maintain a daily learning streak")
        
        return insights

# Initialize progress tracker
@st.cache_resource
def get_progress_tracker():
    return ProgressTracker()
