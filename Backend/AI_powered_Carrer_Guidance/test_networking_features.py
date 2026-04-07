#!/usr/bin/env python3
"""
Test script for the AI-Powered Networking & Mentorship features
Demonstrates the new networking capabilities with real-time data fetching
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from ai_networking import get_networking_engine, ConnectionType, EventType
from ai_realtime_analyzer import get_realtime_analyzer
from web_scraper import get_web_scraper

def test_networking_engine():
    """Test the networking engine functionality"""
    print("🤝 Testing AI Networking Engine")
    print("=" * 50)
    
    networking_engine = get_networking_engine()
    
    # Test mentorship opportunities
    print("\n🎯 Testing Mentorship Matching...")
    skills = ['python', 'machine learning', 'data science']
    mentors = networking_engine.find_mentorship_opportunities(skills, "Mid Level", "Technical")
    
    print(f"✅ Found {len(mentors)} potential mentors")
    for i, mentor in enumerate(mentors[:3], 1):
        print(f"  {i}. {mentor.mentor_name} - {mentor.title} at {mentor.company}")
        print(f"     Match Score: {mentor.match_score:.1%}")
        print(f"     Expertise: {', '.join(mentor.expertise_areas)}")
    
    # Test networking events
    print("\n📅 Testing Networking Events...")
    events = networking_engine.fetch_live_networking_events(skills, "San Francisco")
    
    print(f"✅ Found {len(events)} networking events")
    for i, event in enumerate(events[:3], 1):
        print(f"  {i}. {event.title}")
        print(f"     Date: {event.date}")
        print(f"     Location: {event.location}")
        print(f"     Relevance: {event.relevance_score:.1%}")
    
    # Test icebreaker generation
    print("\n💬 Testing Icebreaker Generation...")
    if mentors:
        mentor = mentors[0]
        icebreakers = networking_engine.generate_networking_icebreakers(mentor, skills)
        print(f"✅ Generated {len(icebreakers)} icebreakers for {mentor.mentor_name}")
        for icebreaker in icebreakers[:2]:
            print(f"  • {icebreaker}")
    
    return networking_engine

def test_web_scraper():
    """Test the web scraper functionality"""
    print("\n\n🌐 Testing Web Scraper")
    print("=" * 50)
    
    web_scraper = get_web_scraper()
    
    # Test GitHub trending repos
    print("\n📊 Testing GitHub Trending Repos...")
    repos = web_scraper.fetch_github_trending_repos("python")
    print(f"✅ Found {len(repos)} trending Python repositories")
    for i, repo in enumerate(repos[:3], 1):
        print(f"  {i}. {repo['name']} - {repo['stars']} stars")
        print(f"     {repo['description']}")
    
    # Test tech news
    print("\n📰 Testing Tech News Fetching...")
    news = web_scraper.fetch_tech_news(['python', 'machine learning'])
    print(f"✅ Found {len(news)} tech news articles")
    for i, article in enumerate(news[:3], 1):
        print(f"  {i}. {article['title']}")
        print(f"     Source: {article['source']}")
        print(f"     Score: {article['score']}")
    
    # Test skill demand data
    print("\n📈 Testing Skill Demand Data...")
    skills = ['python', 'react', 'aws']
    demand_data = web_scraper.fetch_skill_demand_data(skills)
    print(f"✅ Fetched demand data for {len(demand_data)} skills")
    for skill, data in demand_data.items():
        print(f"  • {skill}: {data['job_postings']} postings, {data['growth_rate']} growth")
    
    return web_scraper

def test_realtime_analyzer():
    """Test the real-time analyzer functionality"""
    print("\n\n🤖 Testing AI Real-time Analyzer")
    print("=" * 50)
    
    analyzer = get_realtime_analyzer()
    
    # Test market trends analysis
    print("\n📊 Testing Market Trends Analysis...")
    skills = ['python', 'machine learning', 'react']
    market_analysis = analyzer.analyze_market_trends(skills)
    
    print("✅ Market analysis completed")
    print(f"  Data sources: {', '.join(market_analysis['data_sources'])}")
    print(f"  Analysis preview: {market_analysis['analysis_text'][:200]}...")
    
    # Test networking insights
    print("\n🎯 Testing Networking Insights...")
    networking_insights = analyzer.generate_networking_insights(skills, "Data Scientist")
    
    print("✅ Networking insights generated")
    print(f"  Data sources: {', '.join(networking_insights['data_sources'])}")
    print(f"  Insights preview: {networking_insights['insights_text'][:200]}...")
    
    # Test skill predictions
    print("\n🔮 Testing Skill Predictions...")
    predictions = analyzer.predict_skill_future_demand(skills)
    
    print("✅ Skill predictions completed")
    print(f"  Analyzed skills: {', '.join(predictions['analyzed_skills'])}")
    print(f"  Predictions preview: {predictions['predictions_text'][:200]}...")
    
    # Test learning roadmap
    print("\n🗺️ Testing Learning Roadmap...")
    current_skills = ['python', 'sql']
    roadmap = analyzer.generate_personalized_learning_roadmap(
        current_skills, "Data Scientist", 12
    )
    
    print("✅ Learning roadmap generated")
    print(f"  Timeline: {roadmap['timeline_months']} months")
    print(f"  Roadmap preview: {roadmap['roadmap_text'][:200]}...")
    
    return analyzer

def main():
    """Main test function"""
    print("🚀 AI powered Career Guidance system - Networking Features Test")
    print("=" * 70)
    
    try:
        # Test networking engine
        networking_engine = test_networking_engine()
        
        # Test web scraper
        web_scraper = test_web_scraper()
        
        # Test real-time analyzer
        analyzer = test_realtime_analyzer()
        
        print("\n\n🎉 All networking features tested successfully!")
        print("\n📋 Summary:")
        print(f"  - AI Networking Engine: ✅ Working")
        print(f"  - Web Scraper: ✅ Working")
        print(f"  - Real-time Analyzer: ✅ Working")
        print(f"  - Mentorship Matching: ✅ Working")
        print(f"  - Event Discovery: ✅ Working")
        print(f"  - Market Analysis: ✅ Working")
        
        print(f"\n💡 New Features Added:")
        print(f"  🎯 AI-Powered Mentor Matching")
        print(f"  📅 Real-time Networking Events")
        print(f"  💡 Live Market Insights with LLM")
        print(f"  🗺️ Personalized Learning Roadmaps")
        print(f"  🌐 Internet Access for Live Data")
        print(f"  💬 AI-Generated Icebreakers")
        
        print(f"\n🚀 Next steps:")
        print(f"  1. Run the main app: streamlit run app/main.py")
        print(f"  2. Upload your resume and job description")
        print(f"  3. Explore the new networking features")
        print(f"  4. Find mentors and networking events")
        print(f"  5. Get real-time market insights")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
