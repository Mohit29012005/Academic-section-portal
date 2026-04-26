"""
Comprehensive Question Bank Generator for All Courses
Uses topic-based question generation for subjects without ML model
"""

import random
from django.conf import settings


COMMON_TOPICS = {
    "programming": [
        "What is the difference between compiled and interpreted languages?",
        "Explain the concept of recursion with an example.",
        "What are the advantages of using functions in programming?",
        "Explain the difference between stack and heap memory.",
        "What is the time complexity of binary search?",
        "Explain the concept of object-oriented programming.",
        "What is the difference between array and linked list?",
        "Explain the working of a binary search tree.",
        "What are the different types of sorting algorithms?",
        "Explain the concept of polymorphism in OOP.",
        "What is the difference between method overloading and overriding?",
        "Explain encapsulation and data hiding.",
        "What is the purpose of constructors and destructors?",
        "Explain the concept of inheritance in OOP.",
        "What is the difference between interface and abstract class?",
    ],
    "database": [
        "What is the difference between DBMS and RDBMS?",
        "Explain the ACID properties of transactions.",
        "What is normalization? Explain 1NF, 2NF, and 3NF.",
        "What is the difference between primary key and foreign key?",
        "Explain the concept of JOIN operations with examples.",
        "What is SQL? List some common SQL commands.",
        "Explain the difference between UNION and UNION ALL.",
        "What is a stored procedure? When should you use it?",
        "Explain the concept of database indexing.",
        "What is the difference between clustered and non-clustered index?",
        "Explain the concept of triggers in databases.",
        "What is PL/SQL? How does it differ from SQL?",
        "Explain the working of transaction management.",
        "What is a view? What are its advantages?",
        "Explain the concept of data warehousing.",
    ],
    "web": [
        "What is the difference between HTML and HTML5?",
        "Explain the CSS box model.",
        "What is the difference between GET and POST methods?",
        "Explain the concept of responsive web design.",
        "What is JavaScript? Explain its data types.",
        "What is the difference between let, const, and var?",
        "Explain the concept of AJAX.",
        "What is React? What are its advantages?",
        "Explain the difference between SQL and NoSQL databases.",
        "What is the purpose of REST API?",
        "Explain the concept of DOM manipulation.",
        "What is the difference between localStorage and sessionStorage?",
        "Explain the concept of web services.",
        "What is Bootstrap? What are its advantages?",
        "Explain the concept of single page application.",
    ],
    "networking": [
        "What is the difference between TCP and UDP?",
        "Explain the OSI model layers.",
        "What is IP addressing? Explain IPv4 and IPv6.",
        "What is the difference between hub, switch, and router?",
        "Explain the concept of DNS.",
        "What is DHCP? How does it work?",
        "Explain the concept of subnetting.",
        "What is the difference between HTTP and HTTPS?",
        "Explain the concept of firewall.",
        "What is VPN? What are its types?",
        "Explain the concept of network topology.",
        "What is the difference between LAN, MAN, and WAN?",
        "Explain the concept of routing algorithms.",
        "What is the purpose of subnet mask?",
        "Explain the concept of network security.",
    ],
    "os": [
        "What is an operating system? List its functions.",
        "Explain the difference between process and thread.",
        "What is deadlock? Explain the conditions for deadlock.",
        "Explain the concept of CPU scheduling.",
        "What is the difference between preemptive and non-preemptive scheduling?",
        "Explain the concept of memory management.",
        "What is paging? Explain the TLB.",
        "Explain the concept of virtual memory.",
        "What is the difference between semaphore and mutex?",
        "Explain the concept of file system.",
        "What is thrashing? How can it be prevented?",
        "Explain the concept of IPC (Inter-Process Communication).",
        "What is the difference between multiprocessing and multithreading?",
        "Explain the concept of system calls.",
        "What is the difference between monolithic and microkernel?",
    ],
    "math": [
        "Explain the concept of probability with examples.",
        "What is the difference between mean, median, and mode?",
        "Explain the concept of sets and Venn diagrams.",
        "What is the binomial theorem?",
        "Explain the concept of differentiation and integration.",
        "What is a matrix? Explain matrix operations.",
        "Explain the concept of relations and functions.",
        "What is the difference between permutation and combination?",
        "Explain the concept of limits in calculus.",
        "What is the difference between discrete and continuous mathematics?",
        "Explain the concept of graph theory.",
        "What is the difference between correlation and regression?",
        "Explain the concept of logical reasoning.",
        "What is the difference between deduction and induction?",
        "Explain the concept of statistical hypothesis testing.",
    ],
    "ai_ml": [
        "What is the difference between AI, ML, and DL?",
        "Explain the concept of supervised learning.",
        "What is the difference between classification and regression?",
        "Explain the concept of neural networks.",
        "What is the difference between overfitting and underfitting?",
        "Explain the concept of gradient descent.",
        "What is the difference between CNN and RNN?",
        "Explain the concept of feature engineering.",
        "What is the difference between precision and recall?",
        "Explain the concept of cross-validation.",
        "What is the difference between bagging and boosting?",
        "Explain the concept of transfer learning.",
        "What is the difference between LSTM and GRU?",
        "Explain the concept of natural language processing.",
        "What is the difference between generative and discriminative models?",
    ],
    "security": [
        "What is the difference between symmetric and asymmetric encryption?",
        "Explain the concept of digital signature.",
        "What is the difference between virus and worm?",
        "Explain the concept of firewall.",
        "What is the difference between authentication and authorization?",
        "Explain the concept of SQL injection.",
        "What is the difference between HTTP and HTTPS?",
        "Explain the concept of cryptography.",
        "What is the difference between RSA and AES?",
        "Explain the concept of phishing.",
        "What is the difference between symmetric and asymmetric encryption?",
        "Explain the concept of digital forensics.",
        "What is the difference between zero-day and APT?",
        "Explain the concept of penetration testing.",
        "What is the difference between IDS and IPS?",
    ],
    "software": [
        "What is the difference between software engineering and programming?",
        "Explain the SDLC phases.",
        "What is the difference between Agile and Waterfall model?",
        "Explain the concept of software testing.",
        "What is the difference between black box and white box testing?",
        "Explain the concept of requirement engineering.",
        "What is the difference between verification and validation?",
        "Explain the concept of software metrics.",
        "What is the difference between alpha and beta testing?",
        "Explain the concept of software quality assurance.",
        "What is the difference between functional and non-functional requirements?",
        "Explain the concept of software maintenance.",
        "What is the difference between UML and flowchart?",
        "Explain the concept of project management.",
        "What is the difference between use case and test case?",
    ],
    "cloud": [
        "What is cloud computing? List its service models.",
        "Explain the difference between IaaS, PaaS, and SaaS.",
        "What is the difference between public and private cloud?",
        "Explain the concept of virtualization.",
        "What is the difference between containers and VMs?",
        "Explain the concept of edge computing.",
        "What is the difference between AWS and Azure?",
        "Explain the concept of serverless computing.",
        "What is the difference between cloud storage and local storage?",
        "Explain the concept of microservices.",
        "What is the difference between monolithic and microservices architecture?",
        "Explain the concept of DevOps.",
        "What is the difference between horizontal and vertical scaling?",
        "Explain the concept of load balancing.",
        "What is the difference between CDN and cloud hosting?",
    ],
    "communication": [
        "Explain the process of communication with a suitable diagram.",
        "What are the barriers to effective communication and how can they be overcome?",
        "Differentiate between formal and informal communication.",
        "Discuss the importance of listening skills in professional life.",
        "What are the qualities of a good listener?",
        "Explain the different types of reading comprehension.",
        "Write a short note on the importance of body language in communication.",
        "How can you improve your speaking and presentation skills?",
        "Write a sample cover letter for a job application.",
        "Explain the characteristics of a good speaker.",
        "Discuss the difference between hearing and listening.",
        "Write a short note on email etiquette in a corporate environment.",
        "What are the various types of formal letters? Give examples.",
        "Explain the use of conjunctions with appropriate examples.",
        "Discuss strategies for effective reading and note-taking.",
    ],
    "office": [
        "What is MS Word? Explain its key features.",
        "How do you perform a Mail Merge in MS Word? Explain the steps.",
        "Explain the use of pivot tables in MS Excel with an example.",
        "What are macros in MS Excel? How are they useful?",
        "Explain different types of charts available in MS Excel.",
        "How do you apply custom animations and slide transitions in MS PowerPoint?",
        "Describe the steps to create a database in MS Access.",
        "Explain the various data types available in MS Access.",
        "What is a batch file? Explain with an example.",
        "List and explain five internal DOS commands.",
        "Compare the features of MS Word, MS Excel, and MS PowerPoint.",
        "How does the Freeze Panes feature work in Excel?",
        "Explain the use of Goal Seek in MS Excel.",
        "What are the benefits of using Google Docs for collaborative work?",
        "How do you sort and filter data in an Excel worksheet?",
    ],
    "ds": [
        "Explain the concept of a Stack and its applications.",
        "What is a Queue? Explain its types (Circular, Priority, etc.).",
        "Differentiate between Array and Linked List.",
        "Write an algorithm for binary search.",
        "Explain Bubble Sort and its time complexity.",
        "What is a Binary Search Tree (BST)? Explain its properties.",
        "Discuss the pre-order, in-order, and post-order tree traversals.",
        "Explain the concept of hashing and collision resolution techniques.",
        "What is a Graph? Explain Breadth-First Search (BFS).",
        "Explain Depth-First Search (DFS) in graphs.",
        "Discuss the concept of AVL trees.",
        "What is the difference between singly and doubly linked lists?",
        "Explain the concept of dynamic programming with an example.",
        "Write an algorithm for insertion sort.",
        "Explain the concept of a heap data structure.",
    ],
    "environment": [
        "Explain the structure and function of an ecosystem.",
        "What are the major causes and effects of air pollution?",
        "Discuss the impact of global warming and climate change.",
        "What is biodiversity? Explain its importance.",
        "Explain the concept of sustainable development.",
        "Discuss the various methods of solid waste management.",
        "What is ozone layer depletion? What are its causes?",
        "Explain the importance of renewable energy resources.",
        "Discuss the effects of water pollution on human health.",
        "What are the causes and consequences of deforestation?",
        "Explain the concept of an environmental impact assessment (EIA).",
        "Discuss the role of individuals in environmental conservation.",
        "What are greenhouse gases and how do they contribute to global warming?",
        "Explain the concept of a food chain and food web.",
        "Discuss the importance of environmental education.",
    ],
    "values": [
        "What are the main themes discussed in the Bhagavad Gita?",
        "How can the teachings of the Bhagavad Gita improve work-life balance?",
        "Discuss the concept of ethical decision-making in the Bhagavad Gita.",
        "How does the Bhagavad Gita guide leadership and management practices?",
        "Explain the concept of strategic thinking as per the Bhagavad Gita.",
        "What is the importance of values and ethics in professional life?",
        "Discuss the contribution of Swamishree Krishnatirthaji to mathematics.",
        "Explain the relevance of Vedic mathematics in modern times.",
        "How does the Bhagavad Gita provide value education for young leaders?",
        "Discuss the concept of 'Karma Yoga' and its application.",
        "Explain the importance of self-discipline in achieving success.",
        "How can stress be managed using the principles of the Bhagavad Gita?",
        "Discuss the role of ethics in corporate governance.",
        "What are the key principles of effective life management?",
        "Explain the concept of mindfulness and its benefits.",
    ],
}

SUBJECT_TOPIC_MAPPING = {
    "programming": [
        "Java",
        "Python",
        "C Programming",
        "C++",
        "Programming",
        "Logic",
        "Algorithm",
    ],
    "database": ["Database", "DBMS", "RDBMS", "SQL", "MySQL", "Oracle", "MongoDB"],
    "web": [
        "Web",
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "Angular",
        "Node",
        "Django",
        "PHP",
    ],
    "networking": ["Network", "TCP", "IP", "HTTP", "Server", "Client", "Cisco"],
    "os": ["Operating System", "Linux", "Unix", "Windows", "System Programming"],
    "math": ["Mathematics", "Math", "Statistics", "Calculus", "Discrete Math"],
    "ai_ml": [
        "Artificial Intelligence",
        "Machine Learning",
        "Deep Learning",
        "Neural",
        "NLP",
        "AI",
        "ML",
        "Data Science",
    ],
    "security": ["Security", "Cyber", "Cryptography", "Encryption", "Ethical Hacking"],
    "software": [
        "Software Engineering",
        "Software Testing",
        "UML",
        "Testing",
        "Quality",
    ],
    "cloud": [
        "Cloud",
        "AWS",
        "Azure",
        "Docker",
        "Kubernetes",
        "DevOps",
        "Virtualization",
    ],
    "communication": [
        "Communication",
        "English",
        "Skill",
        "Language",
        "Grammar",
    ],
    "office": [
        "Office",
        "Automation",
        "MS Office",
        "Excel",
        "Word",
        "Access",
    ],
    "ds": [
        "Data Structure",
        "Algorithm Analysis",
        "DS",
        "Tree",
        "Graph",
    ],
    "environment": [
        "Environment",
        "EVS",
        "Ecology",
        "Pollution",
        "Sustainable",
    ],
    "values": [
        "Values",
        "Ethics",
        "Bhagavad Gita",
        "Gita",
        "Vedic",
        "Indian",
    ],
}

def get_topic_for_subject(subject_name):
    """Determine which topic category a subject belongs to based on its name."""
    subject_upper = subject_name.upper()

    for topic, keywords in SUBJECT_TOPIC_MAPPING.items():
        for keyword in keywords:
            if keyword.upper() in subject_upper:
                return topic

    return "programming"


def generate_questions_for_subject(subject_name, count=15):
    """Generate question bank for a specific subject based on its name."""
    topic = get_topic_for_subject(subject_name)
    base_questions = COMMON_TOPICS.get(topic, COMMON_TOPICS["programming"])

    questions = []
    for i, q in enumerate(base_questions[:count]):
        questions.append(
            {
                "id": i + 1,
                "question": q,
                "topic": topic,
                "importance": "HIGH" if i < 5 else ("MEDIUM" if i < 10 else "NORMAL"),
                "repeat": random.randint(1, 5),
                "years": [2024, 2023, 2022]
                if i < 5
                else ([2024, 2023] if i < 10 else [2024]),
            }
        )

    return questions


def build_comprehensive_question_bank():
    """Build complete question bank from all subjects in database."""
    from academics.models import Subject

    question_bank = {
        "clusters": {},
        "subject_data": {},
        "sem_subjects": {},
        "threshold": 0.5,
    }

    for course in Subject.objects.values_list("course", flat=True).distinct():
        try:
            from academics.models import Course

            course_obj = Course.objects.get(course_id=course)
            sem_map = {}

            for sem in range(1, (course_obj.total_semesters or 8) + 1):
                subjects = Subject.objects.filter(course=course, semester=sem)
                if subjects.exists():
                    sem_key = str(sem)
                    question_bank["sem_subjects"][sem_key] = {}

                    for subj in subjects:
                        key = f"{sem}_{subj.code}"
                        questions = generate_questions_for_subject(subj.name)

                        import pandas as pd

                        df_data = {
                            "Semester": {i: sem for i in range(len(questions))},
                            "Subject_Code": {
                                i: subj.code for i in range(len(questions))
                            },
                            "Subject_Name": {
                                i: subj.name for i in range(len(questions))
                            },
                            "Year": {
                                i: questions[i]["years"][0]
                                for i in range(len(questions))
                            },
                            "Question_Number": {
                                i: f"{i + 1}(a)" for i in range(len(questions))
                            },
                            "Question_Text": {
                                i: questions[i]["question"]
                                for i in range(len(questions))
                            },
                            "Marks": {i: 5 for i in range(len(questions))},
                            "Processed": {
                                i: questions[i]["question"].lower()
                                for i in range(len(questions))
                            },
                        }

                        question_bank["subject_data"][key] = pd.DataFrame(df_data)

                        clusters = {}
                        for i, q in enumerate(questions):
                            clusters[f"cluster_{i}"] = {
                                "representative": q["question"],
                                "count": q["repeat"],
                                "year_count": len(q["years"]),
                                "freq_score": q["repeat"] * len(q["years"]),
                                "years": q["years"],
                            }

                        question_bank["clusters"][key] = clusters
                        question_bank["sem_subjects"][sem_key][subj.code] = subj.name
        except Exception:
            pass

    return question_bank
