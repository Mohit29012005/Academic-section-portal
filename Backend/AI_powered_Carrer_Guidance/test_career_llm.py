#!/usr/bin/env python
import sys
sys.path.insert(0, 'src')
from llm_client import get_ai_career_recommendations
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.info("Testing get_ai_career_recommendations...")
result = get_ai_career_recommendations(["web_development", "ai_ml"], "Python, JavaScript", "fresher")
logger.info(f"Result received: {type(result)} with {len(result) if isinstance(result, dict) else 'N/A'} keys")
print("Result:", result)
