"""
Course Progress Tracking System for Evolvex AI
Allows users to track their learning progress and course completion
"""

import json
import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum

class CourseStatus(Enum):
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    PAUSED = "Paused"
    DROPPED = "Dropped"

@dataclass
class CourseProgress:
    course_title: str
    platform: str
    url: str
    status: CourseStatus
    progress_percentage: int  # 0-100
    start_date: Optional[str] = None
    completion_date: Optional[str] = None
    notes: str = ""
    estimated_completion: Optional[str] = None
    actual_hours_spent: int = 0
    rating: Optional[int] = None  # 1-5 stars

class CourseTracker:
    def __init__(self, data_file: str = "course_progress.json"):
        self.data_file = data_file
        self.progress_data = self._load_progress()
    
    def _load_progress(self) -> Dict[str, CourseProgress]:
        """Load course progress from file"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    progress_data = {}
                    for course_id, course_data in data.items():
                        # Convert string back to enum
                        if 'status' in course_data and isinstance(course_data['status'], str):
                            course_data['status'] = CourseStatus(course_data['status'])
                        progress_data[course_id] = CourseProgress(**course_data)
                    return progress_data
            except (json.JSONDecodeError, KeyError, TypeError, ValueError):
                return {}
        return {}
    
    def _save_progress(self):
        """Save course progress to file"""
        data = {}
        for course_id, progress in self.progress_data.items():
            course_dict = asdict(progress)
            # Convert enum to string for JSON serialization
            course_dict['status'] = progress.status.value
            data[course_id] = course_dict
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _get_course_id(self, course_title: str, platform: str) -> str:
        """Generate unique course ID"""
        return f"{platform}_{course_title}".replace(" ", "_").replace("/", "_")
    
    def add_course(self, course_title: str, platform: str, url: str) -> str:
        """Add a new course to track"""
        course_id = self._get_course_id(course_title, platform)
        
        if course_id not in self.progress_data:
            self.progress_data[course_id] = CourseProgress(
                course_title=course_title,
                platform=platform,
                url=url,
                status=CourseStatus.NOT_STARTED,
                progress_percentage=0
            )
            self._save_progress()
        
        return course_id
    
    def update_progress(self, course_id: str, 
                       status: Optional[CourseStatus] = None,
                       progress_percentage: Optional[int] = None,
                       notes: Optional[str] = None,
                       actual_hours_spent: Optional[int] = None,
                       rating: Optional[int] = None) -> bool:
        """Update course progress"""
        if course_id not in self.progress_data:
            return False
        
        course = self.progress_data[course_id]
        
        if status is not None:
            course.status = status
            if status == CourseStatus.IN_PROGRESS and course.start_date is None:
                course.start_date = datetime.now().isoformat()
            elif status == CourseStatus.COMPLETED:
                course.completion_date = datetime.now().isoformat()
                course.progress_percentage = 100
        
        if progress_percentage is not None:
            course.progress_percentage = max(0, min(100, progress_percentage))
            if course.progress_percentage == 100 and course.status != CourseStatus.COMPLETED:
                course.status = CourseStatus.COMPLETED
                course.completion_date = datetime.now().isoformat()
        
        if notes is not None:
            course.notes = notes
        
        if actual_hours_spent is not None:
            course.actual_hours_spent = max(0, actual_hours_spent)
        
        if rating is not None:
            course.rating = max(1, min(5, rating))
        
        self._save_progress()
        return True
    
    def get_course_progress(self, course_id: str) -> Optional[CourseProgress]:
        """Get progress for a specific course"""
        return self.progress_data.get(course_id)
    
    def get_all_progress(self) -> Dict[str, CourseProgress]:
        """Get all course progress"""
        return self.progress_data.copy()
    
    def get_courses_by_status(self, status: CourseStatus) -> List[CourseProgress]:
        """Get courses filtered by status"""
        return [
            course for course in self.progress_data.values()
            if course.status == status
        ]
    
    def get_learning_statistics(self) -> Dict:
        """Get learning statistics and insights"""
        total_courses = len(self.progress_data)
        completed_courses = len(self.get_courses_by_status(CourseStatus.COMPLETED))
        in_progress_courses = len(self.get_courses_by_status(CourseStatus.IN_PROGRESS))
        
        total_hours = sum(course.actual_hours_spent for course in self.progress_data.values())
        avg_rating = 0
        rated_courses = [c for c in self.progress_data.values() if c.rating is not None]
        if rated_courses:
            avg_rating = sum(c.rating for c in rated_courses) / len(rated_courses)
        
        # Calculate completion rate
        completion_rate = (completed_courses / total_courses * 100) if total_courses > 0 else 0
        
        # Calculate average progress
        avg_progress = 0
        if self.progress_data:
            avg_progress = sum(c.progress_percentage for c in self.progress_data.values()) / len(self.progress_data)
        
        return {
            "total_courses": total_courses,
            "completed_courses": completed_courses,
            "in_progress_courses": in_progress_courses,
            "completion_rate": round(completion_rate, 1),
            "average_progress": round(avg_progress, 1),
            "total_hours_spent": total_hours,
            "average_rating": round(avg_rating, 1),
            "courses_by_platform": self._get_platform_breakdown(),
            "recent_activity": self._get_recent_activity()
        }
    
    def _get_platform_breakdown(self) -> Dict[str, int]:
        """Get breakdown of courses by platform"""
        platform_counts = {}
        for course in self.progress_data.values():
            platform_counts[course.platform] = platform_counts.get(course.platform, 0) + 1
        return platform_counts
    
    def _get_recent_activity(self, days: int = 30) -> List[Dict]:
        """Get recent course activity"""
        recent_activities = []
        cutoff_date = datetime.now() - timedelta(days=days)
        
        for course in self.progress_data.values():
            if course.completion_date:
                completion_date = datetime.fromisoformat(course.completion_date)
                if completion_date >= cutoff_date:
                    recent_activities.append({
                        "course_title": course.course_title,
                        "platform": course.platform,
                        "completion_date": course.completion_date,
                        "rating": course.rating
                    })
        
        return sorted(recent_activities, key=lambda x: x["completion_date"], reverse=True)
    
    def delete_course(self, course_id: str) -> bool:
        """Delete a course from tracking"""
        if course_id in self.progress_data:
            del self.progress_data[course_id]
            self._save_progress()
            return True
        return False
    
    def export_progress(self) -> str:
        """Export progress data as formatted text"""
        if not self.progress_data:
            return "No course progress data available."
        
        output = ["# 📚 Course Learning Progress Report\n"]
        output.append(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Statistics
        stats = self.get_learning_statistics()
        output.append("## 📊 Learning Statistics")
        output.append(f"- **Total Courses**: {stats['total_courses']}")
        output.append(f"- **Completed**: {stats['completed_courses']}")
        output.append(f"- **In Progress**: {stats['in_progress_courses']}")
        output.append(f"- **Completion Rate**: {stats['completion_rate']}%")
        output.append(f"- **Average Progress**: {stats['average_progress']}%")
        output.append(f"- **Total Hours Spent**: {stats['total_hours_spent']}")
        output.append(f"- **Average Rating**: {stats['average_rating']}/5.0\n")
        
        # Courses by status
        for status in CourseStatus:
            courses = self.get_courses_by_status(status)
            if courses:
                output.append(f"## {status.value} Courses ({len(courses)})")
                for course in courses:
                    output.append(f"### {course.course_title}")
                    output.append(f"- **Platform**: {course.platform}")
                    output.append(f"- **Progress**: {course.progress_percentage}%")
                    output.append(f"- **URL**: {course.url}")
                    if course.start_date:
                        output.append(f"- **Started**: {course.start_date}")
                    if course.completion_date:
                        output.append(f"- **Completed**: {course.completion_date}")
                    if course.actual_hours_spent > 0:
                        output.append(f"- **Hours Spent**: {course.actual_hours_spent}")
                    if course.rating:
                        output.append(f"- **Rating**: {'⭐' * course.rating}")
                    if course.notes:
                        output.append(f"- **Notes**: {course.notes}")
                    output.append("")
        
        return "\n".join(output)

# Global tracker instance
tracker = CourseTracker()

def get_tracker() -> CourseTracker:
    """Get the global course tracker instance"""
    return tracker
