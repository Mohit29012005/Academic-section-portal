"""
Generate comprehensive question bank for all courses and save as ML model
"""

import pickle
import os
from django.core.management.base import BaseCommand
from academics.models import Course, Subject
import pandas as pd


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
        "OOP",
        "Data Structure",
    ],
    "database": [
        "Database",
        "DBMS",
        "RDBMS",
        "SQL",
        "MySQL",
        "Oracle",
        "MongoDB",
        "Data",
    ],
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
        "Design",
    ],
    "networking": [
        "Network",
        "TCP",
        "IP",
        "HTTP",
        "Server",
        "Client",
        "Cisco",
        "Communication",
    ],
    "os": ["Operating System", "Linux", "Unix", "Windows", "System"],
    "math": ["Mathematics", "Math", "Statistics", "Calculus", "Discrete"],
    "ai_ml": [
        "Artificial Intelligence",
        "Machine Learning",
        "Deep Learning",
        "Neural",
        "NLP",
        "AI",
        "ML",
        "Data Science",
        "Analytics",
    ],
    "security": ["Security", "Cyber", "Cryptography", "Encryption", "Ethical"],
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
        "Container",
    ],
}


class Command(BaseCommand):
    help = "Generate comprehensive question bank for all courses"

    def get_topic_for_subject(self, subject_name):
        subject_upper = subject_name.upper()
        for topic, keywords in SUBJECT_TOPIC_MAPPING.items():
            for keyword in keywords:
                if keyword.upper() in subject_upper:
                    return topic
        return "programming"

    def handle(self, *args, **options):
        self.stdout.write("Generating comprehensive question bank...")

        question_bank = {
            "clusters": {},
            "subject_data": {},
            "sem_subjects": {},
            "threshold": 0.5,
        }

        total_subjects = 0

        for course in Course.objects.all():
            for sem in range(1, (course.total_semesters or 8) + 1):
                subjects = Subject.objects.filter(course=course, semester=sem)
                if not subjects.exists():
                    continue

                sem_key = str(sem)
                if sem_key not in question_bank["sem_subjects"]:
                    question_bank["sem_subjects"][sem_key] = {}

                for subj in subjects:
                    topic = self.get_topic_for_subject(subj.name)
                    base_questions = COMMON_TOPICS.get(
                        topic, COMMON_TOPICS["programming"]
                    )

                    key = f"{sem}_{subj.code}"
                    question_bank["sem_subjects"][sem_key][subj.code] = subj.name

                    df_data = {
                        "Semester": {},
                        "Subject_Code": {},
                        "Subject_Name": {},
                        "Year": {},
                        "Question_Number": {},
                        "Question_Text": {},
                        "Marks": {},
                        "Processed": {},
                    }

                    clusters = {}
                    for i, q_text in enumerate(base_questions):
                        df_data["Semester"][i] = sem
                        df_data["Subject_Code"][i] = subj.code
                        df_data["Subject_Name"][i] = subj.name
                        df_data["Year"][i] = 2024 - (i % 3)
                        df_data["Question_Number"][i] = f"{i + 1}(a)"
                        df_data["Question_Text"][i] = q_text
                        df_data["Marks"][i] = 5
                        df_data["Processed"][i] = q_text.lower()

                        repeat = 5 if i < 3 else (3 if i < 8 else (2 if i < 12 else 1))
                        year_count = 3 if i < 3 else (2 if i < 8 else 1)

                        clusters[f"cluster_{i}"] = {
                            "representative": q_text,
                            "count": repeat,
                            "year_count": year_count,
                            "freq_score": repeat * year_count,
                            "years": [2024, 2023, 2022][:year_count],
                        }

                    question_bank["subject_data"][key] = pd.DataFrame(df_data)
                    question_bank["clusters"][key] = clusters
                    total_subjects += 1

        model_path = "C:/Academic-module/Backend/pyqs/ml/comprehensive_model.pkl"

        with open(model_path, "wb") as f:
            pickle.dump(question_bank, f)

        self.stdout.write(self.style.SUCCESS(f"\nModel generated successfully!"))
        self.stdout.write(f"  Total semesters: {len(question_bank['sem_subjects'])}")
        self.stdout.write(f"  Total subjects: {total_subjects}")
        self.stdout.write(f"  Model saved to: {model_path}")
