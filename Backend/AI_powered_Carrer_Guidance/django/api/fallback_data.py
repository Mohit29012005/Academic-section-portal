"""
Comprehensive fallback data for all API endpoints
Data sourced from reference Evolvex-AI project
"""

# ═══════════════════════════════════════════════════════════════════
# CAREER PATHS FALLBACK DATA
# ═══════════════════════════════════════════════════════════════════
CAREER_FALLBACK = {
    "web_development": {
        "key": "web_development",
        "title": "Full-Stack Web Developer",
        "emoji": "🌐",
        "match": 95,
        "salary": "₹6L – ₹25L / year",
        "description": "Build end-to-end web applications using modern frameworks and cloud platforms.",
        "skills": ["HTML/CSS", "JavaScript", "React", "Node.js", "PostgreSQL", "Docker", "AWS"],
        "roadmap": [
            "Learn HTML/CSS & JS fundamentals",
            "Master React & state management",
            "Build REST APIs with Node/Express",
            "Learn a database (PostgreSQL/MongoDB)",
            "Deploy on AWS / Vercel",
            "Contribute to open source"
        ],
        "resources": [
            {"title": "The Odin Project", "url": "https://www.theodinproject.com/", "free": True},
            {"title": "Full Stack Open", "url": "https://fullstackopen.com/en/", "free": True}
        ],
        "market_insight": "High demand across India; React + Node.js is the dominant stack in 2025."
    },
    "ai_ml": {
        "key": "ai_ml",
        "title": "AI / ML Engineer",
        "emoji": "🤖",
        "match": 91,
        "salary": "₹8L – ₹35L / year",
        "description": "Design and deploy machine learning models and LLM-powered applications at scale.",
        "skills": ["Python", "PyTorch", "scikit-learn", "LangChain", "MLOps", "SQL", "FastAPI"],
        "roadmap": [
            "Master Python & NumPy/Pandas",
            "Study linear algebra & statistics",
            "Build classical ML models",
            "Deep learning with PyTorch",
            "NLP & LLM fine-tuning",
            "Deploy with FastAPI + Docker"
        ],
        "resources": [
            {"title": "fast.ai Deep Learning", "url": "https://course.fast.ai/", "free": True},
            {"title": "Hugging Face Course", "url": "https://huggingface.co/learn", "free": True}
        ],
        "market_insight": "Fastest growing domain; LLM/GenAI skills command 40% salary premium in 2025."
    },
    "data_science": {
        "key": "data_science",
        "title": "Data Scientist",
        "emoji": "📊",
        "match": 88,
        "salary": "₹7L – ₹28L / year",
        "description": "Turn raw data into business insights using statistics, visualisation and predictive modelling.",
        "skills": ["Python", "SQL", "Pandas", "Matplotlib", "Machine Learning", "Statistics", "Power BI"],
        "roadmap": [
            "Learn Python + SQL basics",
            "Master Pandas & data wrangling",
            "Statistical inference",
            "Visualisation (Matplotlib, Plotly)",
            "Build predictive models",
            "BI tools (Power BI / Tableau)"
        ],
        "resources": [
            {"title": "Kaggle Learn (Free)", "url": "https://www.kaggle.com/learn", "free": True},
            {"title": "StatQuest", "url": "https://www.youtube.com/c/joshstarmer", "free": True}
        ],
        "market_insight": "Strong demand in fintech, e-commerce, and healthcare sectors across India."
    },
    "devops_cloud": {
        "key": "devops_cloud",
        "title": "DevOps / Cloud Engineer",
        "emoji": "☁️",
        "match": 85,
        "salary": "₹7L – ₹30L / year",
        "description": "Automate deployments, manage cloud infrastructure, and build CI/CD pipelines that scale.",
        "skills": ["Docker", "Kubernetes", "Terraform", "AWS", "CI/CD", "Linux", "Monitoring"],
        "roadmap": [
            "Master Linux & Bash",
            "Learn Docker & containers",
            "Kubernetes orchestration",
            "IaC with Terraform",
            "Set up CI/CD (GitHub Actions)",
            "AWS certification"
        ],
        "resources": [
            {"title": "KodeKloud", "url": "https://kodekloud.com/", "free": True},
            {"title": "AWS Free Tier", "url": "https://aws.amazon.com/free/", "free": True}
        ],
        "market_insight": "AWS + Kubernetes engineers earn 30% more than average; strong job security."
    },
    "mobile_dev": {
        "key": "mobile_dev",
        "title": "Mobile App Developer",
        "emoji": "📱",
        "match": 86,
        "salary": "₹5L – ₹22L / year",
        "description": "Build high-performance native and cross-platform mobile apps for iOS and Android.",
        "skills": ["React Native / Flutter", "Dart / JavaScript", "REST APIs", "Firebase", "App Store Deployment"],
        "roadmap": [
            "Learn JavaScript or Dart",
            "Master React Native or Flutter",
            "Build UI & navigation",
            "Integrate REST APIs & Firebase",
            "Publish to stores",
            "Learn state management"
        ],
        "resources": [
            {"title": "Flutter Official Docs", "url": "https://flutter.dev/docs", "free": True},
            {"title": "React Native Docs", "url": "https://reactnative.dev/docs/getting-started", "free": True}
        ],
        "market_insight": "Flutter developers are in high demand; cross-platform skills add significant value."
    },
}

# ═══════════════════════════════════════════════════════════════════
# QUIZ FALLBACK DATA
# ═══════════════════════════════════════════════════════════════════
QUIZ_FALLBACK = {
    "python": [
        {
            "skill": "python",
            "q": "What is the output of `print(type([]))`?",
            "options": ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"],
            "answer": 0,
            "explanation": "[] creates a list object."
        },
        {
            "skill": "python",
            "q": "Which keyword defines a function in Python?",
            "options": ["function", "def", "lambda", "func"],
            "answer": 1,
            "explanation": "'def' is the keyword used to define functions."
        },
        {
            "skill": "python",
            "q": "What does `len('')` return?",
            "options": ["None", "1", "0", "-1"],
            "answer": 2,
            "explanation": "Empty string has zero characters."
        },
        {
            "skill": "python",
            "q": "Which is a mutable data type?",
            "options": ["tuple", "string", "int", "list"],
            "answer": 3,
            "explanation": "Lists are mutable; tuples, strings, ints are immutable."
        },
        {
            "skill": "python",
            "q": "How do you create a dictionary?",
            "options": ["d = []", "d = ()", "d = {}", "d = <>"],
            "answer": 2,
            "explanation": "Curly braces {} create a dictionary in Python."
        }
    ],
    "javascript": [
        {
            "skill": "javascript",
            "q": "Which declares a block-scoped variable?",
            "options": ["var", "let", "function", "const"],
            "answer": 1,
            "explanation": "'let' is block-scoped; 'var' is function-scoped."
        },
        {
            "skill": "javascript",
            "q": "What does `===` check?",
            "options": ["Type only", "Value only", "Value and type", "Reference"],
            "answer": 2,
            "explanation": "=== is strict equality checking both value and type."
        },
        {
            "skill": "javascript",
            "q": "What is `typeof null`?",
            "options": ["null", "undefined", "object", "boolean"],
            "answer": 2,
            "explanation": "A legacy JS bug — typeof null returns 'object'."
        },
        {
            "skill": "javascript",
            "q": "Which returns a NEW array?",
            "options": ["push()", "sort()", "splice()", "map()"],
            "answer": 3,
            "explanation": "map() returns a new array without mutating the original."
        },
        {
            "skill": "javascript",
            "q": "What is a Promise?",
            "options": ["A synchronous function", "A callback", "An object representing async completion", "A loop construct"],
            "answer": 2,
            "explanation": "Promises represent eventual completion (or failure) of async ops."
        }
    ],
    "sql": [
        {
            "skill": "sql",
            "q": "Which filters AFTER grouping?",
            "options": ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
            "answer": 1,
            "explanation": "HAVING filters grouped rows; WHERE filters row-by-row before grouping."
        },
        {
            "skill": "sql",
            "q": "INNER JOIN returns:",
            "options": ["All left rows", "All rows", "Matching rows from both", "Unmatched only"],
            "answer": 2,
            "explanation": "INNER JOIN returns only rows that match on both sides."
        },
        {
            "skill": "sql",
            "q": "COUNT(column) counts:",
            "options": ["All rows", "Including NULLs", "Non-NULL values", "Distinct values"],
            "answer": 2,
            "explanation": "COUNT(col) skips NULLs; COUNT(*) counts all rows."
        },
        {
            "skill": "sql",
            "q": "PRIMARY KEY must be:",
            "options": ["Auto-increment", "Unique and non-null", "Indexed only", "Foreign reference"],
            "answer": 1,
            "explanation": "PKs uniquely identify each row — must be unique & NOT NULL."
        },
        {
            "skill": "sql",
            "q": "DISTINCT removes:",
            "options": ["NULL rows", "Duplicate rows", "Grouped rows", "Ordered rows"],
            "answer": 1,
            "explanation": "DISTINCT eliminates duplicate result rows from SELECT."
        }
    ],
    "machine_learning": [
        {
            "skill": "machine learning",
            "q": "What does overfitting mean?",
            "options": ["Model too simple", "Model memorises training data, fails on new data", "Model has no parameters", "Model always predicts zero"],
            "answer": 1,
            "explanation": "Overfitting: too much fit to training data, poor generalisation."
        },
        {
            "skill": "machine learning",
            "q": "Random Forest works by:",
            "options": ["Building one deep tree", "Averaging many independent decision trees", "Using gradient boosting", "Linear combination of features"],
            "answer": 1,
            "explanation": "Random Forest is an ensemble of many decision trees with averaging."
        },
        {
            "skill": "machine learning",
            "q": "ROC-AUC measures:",
            "options": ["Model size", "Classifier discriminability", "Feature importance", "Training time"],
            "answer": 1,
            "explanation": "AUC measures ability to distinguish between classes."
        },
        {
            "skill": "machine learning",
            "q": "p-value < 0.05 typically means:",
            "options": ["High variance", "Statistically significant result", "Overfitting", "Low accuracy"],
            "answer": 1,
            "explanation": "Standard threshold for rejecting null hypothesis."
        },
        {
            "skill": "machine learning",
            "q": "Sigmoid activation outputs:",
            "options": ["Any real number", "Values 0 to 1", "Values -1 to 1", "Integer only"],
            "answer": 1,
            "explanation": "Sigmoid squashes values to (0,1) range."
        }
    ]
}

# ═══════════════════════════════════════════════════════════════════
# LEARNING RESOURCES FALLBACK DATA
# ═══════════════════════════════════════════════════════════════════
LEARNING_FALLBACK = {
    "python": [
        {
            "title": "Python for Everybody",
            "platform": "Coursera",
            "url": "https://www.coursera.org/specializations/python",
            "rating": 4.8,
            "free": False,
            "duration": "7 months",
            "type": "Specialization"
        },
        {
            "title": "Automate the Boring Stuff",
            "platform": "automatetheboringstuff.com",
            "url": "https://automatetheboringstuff.com/",
            "rating": 4.8,
            "free": True,
            "duration": "15 hours",
            "type": "Book"
        },
        {
            "title": "Real Python Tutorials",
            "platform": "realpython.com",
            "url": "https://realpython.com/",
            "rating": 4.7,
            "free": True,
            "duration": "Self-paced",
            "type": "Tutorial"
        }
    ],
    "javascript": [
        {
            "title": "The Modern JavaScript Tutorial",
            "platform": "javascript.info",
            "url": "https://javascript.info/",
            "rating": 4.9,
            "free": True,
            "duration": "Self-paced",
            "type": "Tutorial"
        },
        {
            "title": "freeCodeCamp JS",
            "platform": "freeCodeCamp",
            "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
            "rating": 4.8,
            "free": True,
            "duration": "300 hours",
            "type": "Course"
        }
    ],
    "machine learning": [
        {
            "title": "ML Specialization – Andrew Ng",
            "platform": "Coursera",
            "url": "https://www.coursera.org/specializations/machine-learning-introduction",
            "rating": 4.9,
            "free": False,
            "duration": "3 months",
            "type": "Specialization"
        },
        {
            "title": "fast.ai Practical DL",
            "platform": "fast.ai",
            "url": "https://course.fast.ai/",
            "rating": 4.9,
            "free": True,
            "duration": "7 weeks",
            "type": "Course"
        },
        {
            "title": "Kaggle Learn – ML",
            "platform": "Kaggle",
            "url": "https://www.kaggle.com/learn/intro-to-machine-learning",
            "rating": 4.7,
            "free": True,
            "duration": "3 hours",
            "type": "Course"
        }
    ],
    "data science": [
        {
            "title": "Kaggle Learn (All Tracks)",
            "platform": "Kaggle",
            "url": "https://www.kaggle.com/learn",
            "rating": 4.8,
            "free": True,
            "duration": "Self-paced",
            "type": "Course"
        },
        {
            "title": "IBM Data Science Certificate",
            "platform": "Coursera",
            "url": "https://www.coursera.org/professional-certificates/ibm-data-science",
            "rating": 4.6,
            "free": False,
            "duration": "10 months",
            "type": "Certification"
        }
    ],
}

# ═══════════════════════════════════════════════════════════════════
# INTERNSHIP FALLBACK DATA
# ═══════════════════════════════════════════════════════════════════
INTERNSHIP_FALLBACK = [
    {
        "title": "Software Engineering Intern",
        "company": "Google",
        "location": "Hyderabad, IN",
        "salary": "₹80,000/month",
        "duration": "3 months",
        "skills": ["Python", "Algorithms", "Data Structures"],
        "apply": "https://careers.google.com/",
        "type": "SDE Intern",
        "stipend_range": [70000, 90000],
        "matchScore": 88,
        "market_insight": "Highly competitive. Strong DSA skills essential. Apply early."
    },
    {
        "title": "ML Research Intern",
        "company": "Microsoft",
        "location": "Bengaluru, IN",
        "salary": "₹75,000/month",
        "duration": "6 months",
        "skills": ["PyTorch", "Python", "Research"],
        "apply": "https://careers.microsoft.com/",
        "type": "Research Intern",
        "stipend_range": [65000, 85000],
        "matchScore": 85,
        "market_insight": "Research publication experience is a big plus for securing this role."
    },
    {
        "title": "Full Stack Intern",
        "company": "Flipkart",
        "location": "Bengaluru, IN",
        "salary": "₹45,000/month",
        "duration": "6 months",
        "skills": ["React", "Java", "Microservices"],
        "apply": "https://www.flipkartcareers.com/",
        "type": "Product Intern",
        "stipend_range": [40000, 55000],
        "matchScore": 80,
        "market_insight": "Excellent pre-placement offer conversion rate (~70% of interns get PPOs)."
    },
    {
        "title": "Data Science Intern",
        "company": "Razorpay",
        "location": "Bengaluru, IN",
        "salary": "₹60,000/month",
        "duration": "3 months",
        "skills": ["Python", "SQL", "Machine Learning"],
        "apply": "https://razorpay.com/jobs/",
        "type": "Analytics Intern",
        "stipend_range": [50000, 70000],
        "matchScore": 82,
        "market_insight": "Work on real payment data affecting millions of transactions daily."
    },
    {
        "title": "AI/LLM Intern",
        "company": "Sarvam AI",
        "location": "Bengaluru, IN",
        "salary": "₹70,000/month",
        "duration": "6 months",
        "skills": ["Python", "LangChain", "LLMs"],
        "apply": "https://www.sarvam.ai/careers",
        "type": "Research Intern",
        "stipend_range": [60000, 80000],
        "matchScore": 79,
        "market_insight": "Cutting-edge Indic language AI research — great for ML PhD aspirants."
    },
    {
        "title": "DevOps Intern",
        "company": "Juspay",
        "location": "Bengaluru, IN",
        "salary": "₹35,000/month",
        "duration": "3 months",
        "skills": ["Docker", "Kubernetes", "Linux"],
        "apply": "https://juspay.in/careers",
        "type": "Infrastructure Intern",
        "stipend_range": [30000, 45000],
        "matchScore": 72,
        "market_insight": "Great exposure to fintech infrastructure handling large transaction volumes."
    },
    {
        "title": "Frontend Intern",
        "company": "Zepto",
        "location": "Mumbai, IN",
        "salary": "₹40,000/month",
        "duration": "4 months",
        "skills": ["React", "TypeScript", "CSS"],
        "apply": "https://www.zeptonow.com/careers",
        "type": "Product Intern",
        "stipend_range": [35000, 50000],
        "matchScore": 74,
        "market_insight": "One of India's fastest-growing q-commerce startups; rapid career growth."
    },
]
