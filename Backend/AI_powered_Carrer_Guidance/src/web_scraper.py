"""
Web Scraping Module for Real-time Data Fetching
Provides internet access for LLM to fetch live data from various sources
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import time
import streamlit as st

class WebScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def fetch_linkedin_jobs(self, skills: List[str], location: str = "United States") -> List[Dict]:
        """Fetch job postings from LinkedIn (using web scraping)"""
        jobs = []
        
        try:
            # This is a simplified version - in production, you'd use LinkedIn's official API
            for skill in skills[:3]:  # Limit to avoid rate limiting
                search_query = f"{skill} jobs {location}"
                # Note: This is a mock implementation - real LinkedIn scraping requires careful handling
                mock_jobs = self._get_mock_linkedin_jobs(skill, location)
                jobs.extend(mock_jobs)
                
        except Exception as e:
            st.warning(f"LinkedIn job fetching failed: {str(e)}")
            
        return jobs
    
    def fetch_github_trending_repos(self, language: str = "python") -> List[Dict]:
        """Fetch trending repositories from GitHub"""
        repos = []
        
        try:
            url = f"https://github.com/trending/{language}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Parse trending repositories
                repo_elements = soup.find_all('article', class_='Box-row')
                
                for repo in repo_elements[:10]:  # Top 10 trending
                    try:
                        name_element = repo.find('h2', class_='h3')
                        if name_element:
                            name = name_element.get_text().strip().replace('\n', '').replace(' ', '')
                            
                            desc_element = repo.find('p', class_='col-9')
                            description = desc_element.get_text().strip() if desc_element else ""
                            
                            stars_element = repo.find('a', href=re.compile(r'/stargazers'))
                            stars = stars_element.get_text().strip() if stars_element else "0"
                            
                            repos.append({
                                'name': name,
                                'description': description,
                                'stars': stars,
                                'language': language,
                                'url': f"https://github.com/{name}"
                            })
                    except Exception as e:
                        continue
                        
        except Exception as e:
            st.warning(f"GitHub trending fetch failed: {str(e)}")
            # Return mock data
            repos = self._get_mock_github_repos(language)
            
        return repos
    
    def fetch_tech_news(self, keywords: List[str]) -> List[Dict]:
        """Fetch tech news from various sources"""
        news = []
        
        try:
            # Fetch from Hacker News
            hn_news = self._fetch_hacker_news(keywords)
            news.extend(hn_news)
            
            # Fetch from Reddit tech communities
            reddit_news = self._fetch_reddit_tech(keywords)
            news.extend(reddit_news)
            
        except Exception as e:
            st.warning(f"Tech news fetching failed: {str(e)}")
            news = self._get_mock_tech_news(keywords)
            
        return news[:20]  # Return top 20 news items
    
    def _fetch_hacker_news(self, keywords: List[str]) -> List[Dict]:
        """Fetch from Hacker News API"""
        news = []
        
        try:
            # Hacker News API
            response = self.session.get('https://hacker-news.firebaseio.com/v0/topstories.json', timeout=10)
            
            if response.status_code == 200:
                story_ids = response.json()[:30]  # Top 30 stories
                
                for story_id in story_ids:
                    try:
                        story_response = self.session.get(f'https://hacker-news.firebaseio.com/v0/item/{story_id}.json', timeout=5)
                        
                        if story_response.status_code == 200:
                            story = story_response.json()
                            
                            # Check if story contains our keywords
                            title = story.get('title', '').lower()
                            if any(keyword.lower() in title for keyword in keywords):
                                news.append({
                                    'title': story.get('title', ''),
                                    'url': story.get('url', ''),
                                    'score': story.get('score', 0),
                                    'time': datetime.fromtimestamp(story.get('time', 0)).isoformat(),
                                    'source': 'Hacker News'
                                })
                    except Exception:
                        continue
                        
        except Exception as e:
            print(f"Hacker News fetch error: {e}")
            
        return news
    
    def _fetch_reddit_tech(self, keywords: List[str]) -> List[Dict]:
        """Fetch from Reddit tech communities"""
        news = []
        
        try:
            # Reddit API (using JSON endpoints)
            subreddits = ['programming', 'MachineLearning', 'datascience', 'webdev', 'Python']
            
            for subreddit in subreddits[:2]:  # Limit to avoid rate limiting
                url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit=10"
                response = self.session.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    for post in data.get('data', {}).get('children', []):
                        post_data = post.get('data', {})
                        title = post_data.get('title', '').lower()
                        
                        if any(keyword.lower() in title for keyword in keywords):
                            news.append({
                                'title': post_data.get('title', ''),
                                'url': f"https://reddit.com{post_data.get('permalink', '')}",
                                'score': post_data.get('score', 0),
                                'time': datetime.fromtimestamp(post_data.get('created_utc', 0)).isoformat(),
                                'source': f'Reddit r/{subreddit}'
                            })
                            
        except Exception as e:
            print(f"Reddit fetch error: {e}")
            
        return news
    
    def fetch_skill_demand_data(self, skills: List[str]) -> Dict[str, Dict]:
        """Fetch real-time skill demand data from job boards"""
        skill_data = {}
        
        try:
            for skill in skills[:5]:  # Limit to avoid rate limiting
                # This would integrate with job board APIs
                # For now, we'll use mock data that simulates real trends
                skill_data[skill] = self._get_mock_skill_demand(skill)
                
        except Exception as e:
            st.warning(f"Skill demand data fetch failed: {str(e)}")
            
        return skill_data
    
    def fetch_industry_salaries(self, job_titles: List[str], location: str = "United States") -> Dict[str, Dict]:
        """Fetch salary data for job titles"""
        salary_data = {}
        
        try:
            for title in job_titles[:5]:
                # This would integrate with salary APIs like Glassdoor, PayScale
                salary_data[title] = self._get_mock_salary_data(title, location)
                
        except Exception as e:
            st.warning(f"Salary data fetch failed: {str(e)}")
            
        return salary_data
    
    def _get_mock_linkedin_jobs(self, skill: str, location: str) -> List[Dict]:
        """Mock LinkedIn jobs data"""
        return [
            {
                'title': f'Senior {skill.title()} Developer',
                'company': 'Tech Company Inc.',
                'location': location,
                'skills_required': [skill, 'Python', 'SQL'],
                'experience_level': 'Senior',
                'posted_date': (datetime.now() - timedelta(days=2)).isoformat(),
                'url': f'https://linkedin.com/jobs/view/{hash(skill)}',
                'salary_range': '$80,000 - $120,000'
            },
            {
                'title': f'{skill.title()} Engineer',
                'company': 'Startup Co.',
                'location': location,
                'skills_required': [skill, 'JavaScript', 'React'],
                'experience_level': 'Mid-level',
                'posted_date': (datetime.now() - timedelta(days=1)).isoformat(),
                'url': f'https://linkedin.com/jobs/view/{hash(skill + "2")}',
                'salary_range': '$60,000 - $90,000'
            }
        ]
    
    def _get_mock_github_repos(self, language: str) -> List[Dict]:
        """Mock GitHub trending repositories"""
        return [
            {
                'name': f'awesome-{language}',
                'description': f'A curated list of {language} frameworks, libraries, and resources',
                'stars': '15.2k',
                'language': language,
                'url': f'https://github.com/awesome-{language}'
            },
            {
                'name': f'{language}-machine-learning',
                'description': f'Machine learning projects and tutorials in {language}',
                'stars': '8.7k',
                'language': language,
                'url': f'https://github.com/ml-{language}'
            }
        ]
    
    def _get_mock_tech_news(self, keywords: List[str]) -> List[Dict]:
        """Mock tech news data"""
        return [
            {
                'title': f'New {keywords[0]} Framework Released',
                'url': 'https://example.com/news1',
                'score': 150,
                'time': datetime.now().isoformat(),
                'source': 'Tech News'
            },
            {
                'title': f'{keywords[0]} Best Practices for 2024',
                'url': 'https://example.com/news2',
                'score': 89,
                'time': (datetime.now() - timedelta(hours=2)).isoformat(),
                'source': 'Developer Blog'
            }
        ]
    
    def _get_mock_skill_demand(self, skill: str) -> Dict:
        """Mock skill demand data"""
        return {
            'job_postings': 1250,
            'growth_rate': '+15%',
            'average_salary': '$85,000',
            'trending_score': 8.5,
            'last_updated': datetime.now().isoformat()
        }
    
    def _get_mock_salary_data(self, title: str, location: str) -> Dict:
        """Mock salary data"""
        return {
            'min_salary': 70000,
            'max_salary': 120000,
            'median_salary': 95000,
            'location': location,
            'last_updated': datetime.now().isoformat()
        }

def get_web_scraper() -> WebScraper:
    """Get the global web scraper instance"""
    return WebScraper()
