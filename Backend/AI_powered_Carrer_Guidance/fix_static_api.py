import os
os.chdir(r'c:\Evolvex-AI\evolvex_django\static')

with open('app.js', 'r') as f:
    content = f.read()

# Add trailing slashes to API endpoints
replacements = [
    ("/api/analyze'", "/api/analyze/'"),
    ('"/api/analyze"', '"/api/analyze/"'),
    ("/api/career-recommend'", "/api/career-recommend/'"),
    ('"/api/career-recommend"', '"/api/career-recommend/"'),
    ("/api/generate-quiz'", "/api/generate-quiz/'"),
    ('"/api/generate-quiz"', '"/api/generate-quiz/"'),
    ("/api/learning-resources'", "/api/learning-resources/'"),
    ('"/api/learning-resources"', '"/api/learning-resources/"'),
    ("/api/resume-export'", "/api/resume-export/'"),
    ('"/api/resume-export"', '"/api/resume-export/"'),
    ("/api/internships'", "/api/internships/'"),
    ('"/api/internships"', '"/api/internships/"'),
    ("/api/quiz-score'", "/api/quiz-score/'"),
    ('"/api/quiz-score"', '"/api/quiz-score/"'),
    ("/api/history'", "/api/history/'"),
    ('"/api/history"', '"/api/history/"'),
    ("/api/stats'", "/api/stats/'"),
    ('"/api/stats"', '"/api/stats/"'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('app.js', 'w') as f:
    f.write(content)

print('✅ Fixed app.js - All API endpoints now have trailing slashes')
