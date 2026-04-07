#!/usr/bin/env python
import sys
sys.path.insert(0, 'src')
from llm_client import get_ai_internships
import logging
import time

logging.basicConfig(level=logging.WARNING)

print("Testing internship LLM call...")
start = time.time()
try:
    result = get_ai_internships("any", ["Python", "JavaScript"], 0, 100000, "web development")
    elapsed = time.time() - start
    if result and "internships" in result:
        print(f"✅ SUCCESS in {elapsed:.1f}s: {len(result['internships'])} internships")
    else:
        print(f"❌ FAILED (no internships key): Got {list(result.keys()) if result else 'empty'}")
except Exception as e:
    elapsed = time.time() - start
    print(f"❌ ERROR in {elapsed:.1f}s: {str(e)}")
