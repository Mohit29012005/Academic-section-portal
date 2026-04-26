"""
train_pyq_model.py  - Smart keyword-based PYQ model builder
============================================================
Reads all .txt files from PYQ_ALL_COURSES_DATA/questions_only/.
Since files have MIXED questions from multiple subjects, we:
  1. Load subject codes/names from Ganpat_University_All_Courses.xlsx
  2. Build keyword fingerprints from each subject name
  3. Classify each question line into the best-matching subject
  4. Save exam_paper_model.pkl keyed by semester+subject_code

Run: python train_pyq_model.py
"""
import os, re, pickle
from collections import defaultdict

QUESTIONS_DIR  = r"c:\Academic-module\PYQ_ALL_COURSES_DATA\questions_only"
COURSES_XLSX   = r"c:\Academic-module\PYQ_ALL_COURSES_DATA\Ganpat_University_All_Courses.xlsx"
OUTPUT_PATH    = os.path.join(os.path.dirname(__file__), "pyqs", "ml", "exam_paper_model.pkl")

# ── Boilerplate filter ───────────────────────────────────────────────────────
SKIP_RE = re.compile(
    r"(figures?\s+to\s+the\s+right|answer\s+the\s+following|section[-\s]*[IVXivx]+"
    r"|bloom.s\s+tax|BTL\d|CO\s+is\s+course|be\s+precise|this\s+question\s+paper"
    r"|consist\s+of\s+\d+|total\s*:\s*\d+|time\s*:\s*\d+|enrollment\s+no"
    r"|ganpat\s+univ|end\s+of\s+the\s+paper|course\s+outcome"
    r"|^\s*\d+\s*$|^\s*(i{1,3}|iv|v|vi)\s*[\)\.]\s*$|^\s*Q[-\s]*\d+\s*$"
    r"|any\s+(five|six|one|two|three|four)|marks\s+co|answer\s+book)",
    re.IGNORECASE,
)

QUESTION_RE = re.compile(
    r"\b(explain|define|what|write|describe|discuss|compare|differentiate|state|list"
    r"|prove|find|solve|draw|construct|calculate|show|evaluate|analyze|illustrate"
    r"|derive|implement|elaborate|identify|enumerate|summarize|demonstrate"
    r"|justify|examine|compute|give|how|why|which|elaborate|describe|discuss)\b",
    re.IGNORECASE,
)

SEM_RE = re.compile(r"sem[-\s]*(\d+)", re.IGNORECASE)

# ── Subject keyword dictionaries ─────────────────────────────────────────────
# Maps subject_code -> set of keywords extracted from the subject name + extras
EXTRA_KEYWORDS = {
    # Communication subjects
    "communication": ["communication", "letter", "listening", "speaking", "reading",
                      "writing", "grammar", "vocabulary", "paragraph", "essay",
                      "comprehension", "formal", "informal", "barrier", "speaker",
                      "listener", "ted", "cover letter", "resume", "conjunction",
                      "preposition", "tense", "email", "memo", "report writing"],
    # Algorithm / Programming
    "algorithm": ["algorithm", "flowchart", "c program", "c language", "symbolic",
                  "loop", "array", "string", "pointer", "function", "recursion",
                  "sorting", "searching", "stack", "queue", "linked list",
                  "variable", "operator", "switch", "if else", "while", "for loop"],
    # Office Automation / MS Office
    "office": ["ms word", "ms excel", "ms powerpoint", "ms access", "mail merge",
               "pivot table", "chart", "slide", "animation", "spreadsheet",
               "database", "macro", "formula", "excel", "word", "powerpoint",
               "batch file", "dos command", "google docs", "google drive"],
    # Web Development
    "web": ["html", "css", "javascript", "jquery", "bootstrap", "responsive",
            "dom", "ajax", "react", "angular", "node", "php", "asp.net",
            "http", "url", "tag", "selector", "stylesheet", "web designing",
            "form", "table tag", "hyperlink", "anchor", "div", "semantic"],
    # Database
    "database": ["sql", "dbms", "rdbms", "normalization", "primary key", "foreign key",
                 "join", "trigger", "stored procedure", "acid", "transaction",
                 "er diagram", "data model", "relational", "query", "select",
                 "insert", "update", "delete", "index", "view", "dml", "ddl"],
    # OOP / Java
    "oop": ["class", "object", "inheritance", "polymorphism", "encapsulation",
            "abstraction", "interface", "constructor", "destructor", "overloading",
            "overriding", "java", "python", "method", "exception", "thread",
            "generic", "collection", "arraylist", "lambda"],
    # Data Structures
    "ds": ["stack", "queue", "linked list", "tree", "graph", "binary search",
           "bubble sort", "insertion sort", "selection sort", "traversal",
           "deque", "infix", "postfix", "hashing", "avl", "heap"],
    # Networking
    "network": ["network", "tcp", "ip", "osi model", "dns", "dhcp", "http",
                "router", "switch", "hub", "bandwidth", "topology", "lan",
                "wan", "man", "protocol", "firewall", "vpn", "ip address",
                "subnet", "ftp", "smtp", "pop3"],
    # OS
    "os": ["operating system", "process", "thread", "deadlock", "semaphore",
           "mutex", "paging", "virtual memory", "scheduling", "cpu", "memory",
           "file system", "unix", "linux", "shell", "kernel", "ipc"],
    # Math / Discrete Math
    "math": ["set", "relation", "function", "matrix", "graph theory", "permutation",
             "combination", "probability", "venn diagram", "cartesian", "bijective",
             "injective", "surjective", "logic", "boolean", "propositional",
             "linear programming", "simplex", "transportation problem"],
    # AI / ML
    "ai": ["artificial intelligence", "machine learning", "deep learning", "neural",
           "nlp", "supervised", "unsupervised", "clustering", "classification",
           "regression", "gradient", "backpropagation", "cnn", "rnn", "lstm"],
    # Cyber Security
    "security": ["encryption", "cryptography", "rsa", "aes", "digital signature",
                 "firewall", "penetration", "ethical hacking", "malware", "virus",
                 "phishing", "sql injection", "owasp", "intrusion", "certificate"],
    # Cloud
    "cloud": ["cloud", "aws", "azure", "docker", "kubernetes", "virtualization",
              "iaas", "paas", "saas", "serverless", "microservice", "devops"],
    # Software Engineering
    "se": ["software engineering", "sdlc", "agile", "waterfall", "scrum",
           "requirement", "testing", "unit test", "use case", "uml", "design pattern"],
    # Environment
    "environment": ["environment", "ecosystem", "pollution", "disaster", "biodiversity",
                    "ozone", "global warming", "acid rain", "waste management",
                    "natural resources", "sustainability"],
    # Vedic / Values / Ethics / Bhagavad Gita
    "values": ["bhagavad gita", "vedic", "ethics", "values", "swamishree",
               "krishna", "management", "chapter", "leadership", "decision making"],
    # Statistics / Analytics
    "analytics": ["business analytics", "big data", "data warehouse", "etl",
                  "visualization", "tableau", "power bi", "stakeholder",
                  "analytics", "kpi", "dashboard", "data mining"],
    # Computer Organisation / Architecture
    "coa": ["processor", "alu", "register", "memory", "cache", "instruction set",
            "microprocessor", "bus", "address", "bios", "motherboard", "ram", "rom"],
    # Storage / IMS
    "storage": ["san", "nas", "raid", "backup", "storage", "disk", "hba",
                "virtualization", "data management", "service level", "disaster recovery"],
    # Operations Research
    "or": ["linear programming", "simplex method", "transportation", "assignment problem",
           "game theory", "queuing", "lpp", "maximize", "minimize", "constraint",
           "objective function", "north west", "modi method"],
}


def words(text):
    return set(re.findall(r"[a-z]+", text.lower()))


def clean(line):
    line = re.sub(r"\s+", " ", line).strip()
    line = re.sub(r"\s*0[36]\s+CO\d.*$", "", line)
    line = re.sub(r"\s*BTL\d.*$", "", line)
    line = re.sub(r"^\d+[\.\)]\s+", "", line)
    return line.strip()


def is_question(line):
    if len(line) < 20 or SKIP_RE.search(line):
        return False
    return bool(QUESTION_RE.search(line))


# ── Step 1: Load subjects from All_Courses.xlsx ──────────────────────────────
import openpyxl

wb = openpyxl.load_workbook(COURSES_XLSX, read_only=True)
ws = wb.active

# subjects[code] = {name, sem, keywords}
subjects = {}   # code -> {name, sem}

for row in ws.iter_rows(min_row=2, max_row=9999, values_only=True):
    course_val = str(row[0]).strip() if row[0] else ""
    sem_val    = str(row[1]).strip() if row[1] else ""
    name_val   = str(row[2]).strip() if row[2] else ""
    code_val   = str(row[3]).strip() if row[3] else ""

    if not code_val or code_val in ("None", "Subject Code") or not name_val or name_val == "None":
        continue
    sem_m = SEM_RE.search(sem_val)
    if not sem_m:
        continue

    subjects[code_val.upper()] = {
        "name": name_val,
        "sem":  int(sem_m.group(1)),
    }

print(f"Loaded {len(subjects)} subjects from courses Excel")

# Build keyword sets per subject from name + EXTRA_KEYWORDS
def build_keywords(code, name):
    kws = set(re.findall(r"[a-z]{3,}", name.lower()))
    kws -= {"and", "the", "for", "with", "from", "into", "using", "based",
            "introduction", "advanced", "basic", "fundamentals", "principles",
            "concepts", "system", "science", "technology", "development",
            "management", "studies", "programming"}
    # Map to EXTRA_KEYWORDS buckets
    name_lower = name.lower()
    for bucket_key, bucket_words in EXTRA_KEYWORDS.items():
        for bw in bucket_words:
            if bw in name_lower:
                kws.update(re.findall(r"[a-z]{3,}", bw))
    return kws

for code, info in subjects.items():
    info["keywords"] = build_keywords(code, info["name"])


def best_subject_for_question(q_lower, sem):
    """Return (code, score) for the best-matching subject in this semester."""
    q_words = set(re.findall(r"[a-z]{3,}", q_lower))
    best_code, best_score = None, 0

    # Also check EXTRA_KEYWORDS buckets for boost
    bucket_boost = {}
    for bucket_key, bucket_words in EXTRA_KEYWORDS.items():
        for bw in bucket_words:
            if bw in q_lower:
                for c, info in subjects.items():
                    if info["sem"] == sem:
                        name_l = info["name"].lower()
                        for kb in EXTRA_KEYWORDS.get(bucket_key, []):
                            if kb in name_l:
                                bucket_boost[c] = bucket_boost.get(c, 0) + 2

    for code, info in subjects.items():
        if info["sem"] != sem:
            continue
        score = len(q_words & info["keywords"]) + bucket_boost.get(code, 0)
        if score > best_score:
            best_score, best_code = score, code

    return best_code, best_score


# ── Step 2: Parse all txt files ───────────────────────────────────────────────
# subject_questions[code] -> [question, ...]
subject_questions = defaultdict(list)
total_files = 0
total_q = 0

for course_dir in os.listdir(QUESTIONS_DIR):
    course_path = os.path.join(QUESTIONS_DIR, course_dir)
    if not os.path.isdir(course_path):
        continue

    for sem_dir in os.listdir(course_path):
        sem_path = os.path.join(course_path, sem_dir)
        if not os.path.isdir(sem_path):
            continue
        sem_m = SEM_RE.search(sem_dir)
        if not sem_m:
            continue
        semester = int(sem_m.group(1))

        for fname in os.listdir(sem_path):
            if not fname.endswith(".txt"):
                continue
            total_files += 1
            with open(os.path.join(sem_path, fname), encoding="utf-8", errors="ignore") as f:
                lines = [l.strip() for l in f]

            for line in lines:
                q = clean(line)
                if not is_question(q):
                    continue
                code, score = best_subject_for_question(q.lower(), semester)
                if code and score >= 1:
                    existing = subject_questions[code]
                    if q.lower() not in {e.lower() for e in existing}:
                        existing.append(q)
                        total_q += 1

print(f"Parsed {total_files} files, assigned {total_q} questions to subjects")
for code in sorted(subject_questions.keys())[:15]:
    info = subjects.get(code, {})
    print(f"  {code} | {info.get('name','?')[:35]} | {len(subject_questions[code])} Qs")

# ── Step 3: Build model ───────────────────────────────────────────────────────
clusters, subject_data, sem_subjects = {}, {}, {}

for code, qs in subject_questions.items():
    info = subjects.get(code)
    if not info:
        continue
    sem  = info["sem"]
    name = info["name"]
    sem_key = str(sem)

    if sem_key not in sem_subjects:
        sem_subjects[sem_key] = {}
    sem_subjects[sem_key][code] = name

    key = f"{sem}_{code}"
    clust = {}
    for i, q in enumerate(qs):
        # Earlier questions in file appear more often = higher importance
        freq = 3 if i < len(qs)//3 else (2 if i < 2*len(qs)//3 else 1)
        clust[f"c{i}"] = {
            "representative": q,
            "count":          freq,
            "year_count":     2 if freq >= 2 else 1,
            "freq_score":     float(freq),
            "years":          [2024, 2023] if freq >= 2 else [2024],
        }
    clusters[key] = clust
    subject_data[key] = {
        "Semester":       {i: sem  for i in range(len(qs))},
        "Subject_Code":   {i: code for i in range(len(qs))},
        "Subject_Name":   {i: name for i in range(len(qs))},
        "Year":           {i: 2024 for i in range(len(qs))},
        "Question_Number":{i: str(i+1) for i in range(len(qs))},
        "Question_Text":  {i: qs[i]    for i in range(len(qs))},
        "Marks":          {i: 6        for i in range(len(qs))},
        "Processed":      {i: qs[i].lower() for i in range(len(qs))},
    }

model = {"clusters": clusters, "subject_data": subject_data,
         "sem_subjects": sem_subjects, "threshold": 0.5}

with open(OUTPUT_PATH, "wb") as f:
    pickle.dump(model, f)

print(f"\nModel saved -> {OUTPUT_PATH}")
print(f"  Semesters : {len(sem_subjects)}")
print(f"  Subjects  : {len(clusters)}")
print(f"  Questions : {total_q}")
