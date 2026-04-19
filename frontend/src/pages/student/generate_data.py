import json
import random

data = {
  'quizzes': {},
  'resources': {},
  'internships': [],
  'recommendations': []
}

# --- IMPROVED QUIZZES ---
skills = ['python', 'javascript', 'java', 'cpp', 'react', 'node', 'sql', 'machine-learning', 'aws', 'docker', 'css', 'html', 'go', 'rust']
difficulties = ['beginner', 'intermediate', 'advanced']
pools = {
    'python': [{'q': 'Lambda function?', 'options': ['Type', 'Anonymous Func', 'Framework', 'Loop'], 'answer': 1}],
    'javascript': [{'q': 'typeof null?', 'options': ['null', 'object', 'undefined', 'string'], 'answer': 1}]
}
for s in skills:
    if s not in pools: pools[s] = [{'q': f'Base {s}?', 'options': ['A','B','C','D'], 'answer': 0}]
    while len(pools[s]) < 10: pools[s].append(pools[s][0].copy())

for skill in skills:
    for diff in difficulties:
        data['quizzes'][f'{skill}_{diff}'] = pools[skill] * 5

# --- RESOURCES ---
for skill in skills:
    data['resources'][skill] = {
        'beginner': {
            'courses': [{'name': f'Complete {skill} Bootcamp', 'platform': 'Udemy', 'url': f'https://www.udemy.com/topic/{skill}/', 'desc': 'Start here.'}],
            'tutorials': [{'name': f'Official {skill} Docs', 'url': f'https://docs.{skill}.org/', 'desc': 'Read the manual.'}],
            'practice': [{'name': f'{skill} Challenges', 'url': f'https://www.hackerrank.com/domains/{skill}', 'desc': 'Solve problems.'}]
        },
        'intermediate': {
            'courses': [{'name': f'Advanced {skill} Patterns', 'platform': 'Coursera', 'url': f'https://www.coursera.org/search?query={skill}', 'desc': 'Level up.'}],
            'tutorials': [{'name': f'{skill} Best Practices', 'url': f'https://github.com/trending/{skill}', 'desc': 'Learn from pros.'}],
            'practice': [{'name': f'{skill} Projects', 'url': f'https://leetcode.com/tag/{skill}/', 'desc': 'Build things.'}]
        },
        'advanced': {
            'courses': [{'name': f'Expert {skill} Systems', 'platform': 'edX', 'url': f'https://www.edx.org/search?q={skill}', 'desc': 'Mastery.'}],
            'tutorials': [{'name': f'{skill} Architecture', 'url': f'https://medium.com/tag/{skill}', 'desc': 'Deep dive.'}],
            'practice': [{'name': f'{skill} Open Source', 'url': f'https://github.com/search?q={skill}', 'desc': 'Contribute.'}]
        }
    }

# --- INTERNSHIPS ---
fields = ['Software Development', 'Data Science', 'UI/UX Design', 'Cloud/DevOps', 'Cybersecurity', 'Product Management', 'Blockchain', 'Frontend', 'Backend', 'Full Stack', 'AI/ML Research', 'Mobile App Development', 'Game Development']
companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Apple', 'Spotify', 'Tesla', 'TCS', 'Infosys', 'Wipro', 'Adobe', 'Stripe', 'Uber']
# CITIES MUST MATCH DROPDOWN OPTIONS EXACTLY
locations = ['Remote', 'Bangalore', 'Hyderabad', 'Pune', 'Delhi NCR', 'Ahmedabad', 'Mumbai']

for i in range(1, 201): # 200 INTERNSHIPS
    field = random.choice(fields)
    title = f'{random.choice(["Junior", "Associate", "Intern"])} {field}'
    company = random.choice(companies)
    loc = random.choice(locations)
    search_query = f"{title} internship {company} {loc}".replace(" ", "+")
    
    data['internships'].append({
        'id': i,
        'title': title,
        'company': company,
        'logo': '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="4" fill="#D4AF37"/><rect x="10" y="10" width="20" height="20" fill="black" opacity="0.3"/></svg>',
        'location': loc,
        'duration': random.choice(['3 Months', '6 Months']),
        'stipend': random.choice(['15,000 INR/mo', '25,000 INR/mo', '40,000 INR/mo']),
        'skills': [random.choice(['React', 'Python', 'SQL']) for _ in range(2)],
        'field': field.lower(),
        'apply_link': f"https://www.google.com/search?q={search_query}"
    })

# --- RECOMMENDATIONS ---
data['recommendations'] = [
    {'title': 'Full-Stack Web Architect', 'match_score': 92, 'description': 'Master both frontend and backend protocols.', 'required_skills': ['React', 'Node.js', 'PostgreSQL'], 'fields': ['web dev', 'fullstack'], 'avg_salary': '₹12L - ₹25L', 'growth': 'Steady +8%'},
    {'title': 'ML Operations Engineer', 'match_score': 88, 'description': 'Deploy and scale predictive AI models.', 'required_skills': ['Python', 'Docker', 'TensorFlow'], 'fields': ['ai & ml', 'data science'], 'avg_salary': '₹15L - ₹35L', 'growth': 'Exponential'},
    {'title': 'Cyber Defense Analyst', 'match_score': 85, 'description': 'Protect critical infrastructure from vectors.', 'required_skills': ['Kali Linux', 'Wireshark', 'Python'], 'fields': ['cybersecurity'], 'avg_salary': '₹10L - ₹22L', 'growth': 'Rapid +12%'},
    {'title': 'Blockchain Architect', 'match_score': 90, 'description': 'Develop decentralized ledger solutions.', 'required_skills': ['Solidity', 'Rust', 'Web3.js'], 'fields': ['blockchain'], 'avg_salary': '₹18L - ₹40L', 'growth': 'Highly Dynamic'},
    {'title': 'Cloud Infrastructure Lead', 'match_score': 87, 'description': 'Optimize cloud storage and compute pipelines.', 'required_skills': ['AWS', 'Terraform', 'Kubernetes'], 'fields': ['cloud computing', 'devops'], 'avg_salary': '₹14L - ₹30L', 'growth': 'High Yield'},
    {'title': 'Data Visualization Expert', 'match_score': 82, 'description': 'Translate raw data into actionable insights.', 'required_skills': ['Tableau', 'D3.js', 'Python'], 'fields': ['data science', 'ui/ux design'], 'avg_salary': '₹9L - ₹18L', 'growth': 'Stable'},
    {'title': 'AR/VR Developer', 'match_score': 79, 'description': 'Build immersive 3D spatial environments.', 'required_skills': ['Unity', 'C#', 'Blender'], 'fields': ['game dev', 'mobile apps'], 'avg_salary': '₹11L - ₹24L', 'growth': 'Emerging'},
    {'title': 'Mobile Systems Engineer', 'match_score': 84, 'description': 'Optimize performance for mobile hardware.', 'required_skills': ['Kotlin', 'Swift', 'Reactive Native'], 'fields': ['mobile apps'], 'avg_salary': '₹10L - ₹20L', 'growth': 'Consistent'},
    {'title': 'DevOps Automation Specialist', 'match_score': 89, 'description': 'Automate the software delivery lifecycle.', 'required_skills': ['Jenkins', 'Ansible', 'Bash'], 'fields': ['devops', 'cloud computing'], 'avg_salary': '₹13L - ₹28L', 'growth': 'Aggressive'},
    {'title': 'Lead UI/UX Strategist', 'match_score': 91, 'description': 'Design the next generation of digital interfaces.', 'required_skills': ['Figma', 'Adobe XD', 'Prototyping'], 'fields': ['ui/ux design', 'web dev'], 'avg_salary': '₹8L - ₹16L', 'growth': 'Steady'},
    {'title': 'Game Engine Programmer', 'match_score': 86, 'description': 'Write low-level code for physics and rendering.', 'required_skills': ['C++', 'OpenGL', 'Vulkan'], 'fields': ['game dev'], 'avg_salary': '₹14L - ₹32L', 'growth': 'Passionate'},
    {'title': 'FinTech Security Expert', 'match_score': 93, 'description': 'Secure global financial transaction matrices.', 'required_skills': ['C#', 'SQL', 'Cryptography'], 'fields': ['blockchain', 'cybersecurity'], 'avg_salary': '₹20L - ₹45L', 'growth': 'Critical'}
]

with open(r'c:\Academic-module\frontend\src\pages\student\career_data.js', 'w', encoding='utf-8') as f:
    f.write('export const careerData = ' + json.dumps(data, indent=2) + ';\n')
print('Data file created successfully!')
