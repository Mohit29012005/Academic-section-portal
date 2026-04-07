import { useState, useRef } from "react";
import StudentLayout from "../../components/StudentLayout";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";

// Course and Subject Data
const courseData = {
  BCA: {
    name: "Bachelor of Computer Applications",
    semesters: {
      1: [
        { code: "U31A1LDP", name: "Logic Development with Programming-I" },
        { code: "U31A20AT", name: "Office Automation Tools" },
        { code: "U31A3BWP", name: "Basic Web Programming-I" },
        { code: "U31A4COA", name: "Computer Organization & Architecture" },
        { code: "U31B5LCS", name: "Language & Communication Skills-I" },
      ],
      2: [
        { code: "U32A1LDP", name: "Logic Development with Programming-II" },
        { code: "U32A2BWP", name: "Basic Web Programming-II" },
        { code: "U32A3ITM", name: "Information Technology & System Maintenance" },
        { code: "U32A4DM", name: "Discrete Mathematics" },
        { code: "U32B5LCS", name: "Language & Communication Skills-II" },
      ],
      3: [
        { code: "U33A100P", name: "Object Oriented Concepts and Programming" },
        { code: "U33A2DFS", name: "Data and File Structure" },
        { code: "U33A3DBM", name: "Database Management System" },
        { code: "U33A4SAD", name: "System Analysis & Design" },
        { code: "U33A5NT1", name: "Networking-I" },
        { code: "U33B6EDM", name: "Environment and Disaster Management" },
      ],
      4: [
        { code: "U34A1GUI", name: "GUI Programming" },
        { code: "U34A3ADB", name: "Advance Database Management System" },
        { code: "U34A6SWE", name: "Software Engineering" },
        { code: "U36A1OST", name: "Open Source Technologies" },
      ],
      5: [
        { code: "U35A1AWT", name: "Advance Web Technology" },
        { code: "U35A2OSY", name: "Operating System" },
        { code: "U35A3ESC", name: "E-Security and Cyber Law" },
        { code: "U35A4FAD", name: "Fundamental of Android Development" },
      ],
      6: [
        { code: "U36A1MDA", name: "Mobile Application Development" },
        { code: "U36A2CLD", name: "Cloud Computing" },
        { code: "U36A3PRJ", name: "Project Work" },
      ],
    },
  },
  MCA: {
    name: "Master of Computer Applications",
    semesters: {
      1: [
        { code: "MCA101", name: "Advanced Programming Concepts" },
        { code: "MCA102", name: "Data Structures & Algorithms" },
        { code: "MCA103", name: "Database Management Systems" },
        { code: "MCA104", name: "Computer Networks" },
      ],
      2: [
        { code: "MCA201", name: "Operating Systems" },
        { code: "MCA202", name: "Software Engineering" },
        { code: "MCA203", name: "Web Technologies" },
        { code: "MCA204", name: "Object Oriented Analysis & Design" },
      ],
      3: [
        { code: "MCA301", name: "Machine Learning" },
        { code: "MCA302", name: "Cloud Computing" },
        { code: "MCA303", name: "Mobile Computing" },
        { code: "MCA304", name: "Information Security" },
      ],
      4: [
        { code: "MCA401", name: "Big Data Analytics" },
        { code: "MCA402", name: "Artificial Intelligence" },
        { code: "MCA403", name: "Project & Internship" },
      ],
    },
  },
  "B.Sc IT": {
    name: "Bachelor of Science in IT",
    semesters: {
      1: [
        { code: "BSCIT101", name: "Programming Fundamentals" },
        { code: "BSCIT102", name: "Computer Organization" },
        { code: "BSCIT103", name: "Mathematics for IT" },
      ],
      2: [
        { code: "BSCIT201", name: "Data Structures" },
        { code: "BSCIT202", name: "Web Development" },
        { code: "BSCIT203", name: "Database Systems" },
      ],
      3: [
        { code: "BSCIT301", name: "Operating Systems" },
        { code: "BSCIT302", name: "Computer Networks" },
        { code: "BSCIT303", name: "Software Engineering" },
      ],
      4: [
        { code: "BSCIT401", name: "Python Programming" },
        { code: "BSCIT402", name: "Cyber Security Basics" },
        { code: "BSCIT403", name: "Cloud Computing" },
      ],
      5: [
        { code: "BSCIT501", name: "Machine Learning" },
        { code: "BSCIT502", name: "Mobile App Development" },
      ],
      6: [
        { code: "BSCIT601", name: "Project Work" },
        { code: "BSCIT602", name: "Industrial Training" },
      ],
    },
  },
  "B.Tech CSE": {
    name: "Bachelor of Technology - CSE",
    semesters: {
      1: [
        { code: "CSE101", name: "Engineering Mathematics-I" },
        { code: "CSE102", name: "Programming in C" },
        { code: "CSE103", name: "Basic Electronics" },
      ],
      2: [
        { code: "CSE201", name: "Engineering Mathematics-II" },
        { code: "CSE202", name: "Data Structures" },
        { code: "CSE203", name: "Digital Logic Design" },
      ],
      3: [
        { code: "CSE301", name: "Object Oriented Programming" },
        { code: "CSE302", name: "Computer Architecture" },
        { code: "CSE303", name: "Discrete Mathematics" },
      ],
      4: [
        { code: "CSE401", name: "Database Management" },
        { code: "CSE402", name: "Operating Systems" },
        { code: "CSE403", name: "Theory of Computation" },
      ],
      5: [
        { code: "CSE501", name: "Computer Networks" },
        { code: "CSE502", name: "Software Engineering" },
        { code: "CSE503", name: "Compiler Design" },
      ],
      6: [
        { code: "CSE601", name: "Web Technologies" },
        { code: "CSE602", name: "Artificial Intelligence" },
        { code: "CSE603", name: "Machine Learning" },
      ],
      7: [
        { code: "CSE701", name: "Cloud Computing" },
        { code: "CSE702", name: "Deep Learning" },
      ],
      8: [
        { code: "CSE801", name: "Major Project" },
        { code: "CSE802", name: "Industrial Training" },
      ],
    },
  },
};

// Question Bank by Subject Type
const questionBank = {
  programming: [
    "Explain the concept of recursion with a suitable example.",
    "What is the difference between call by value and call by reference?",
    "Write a program to implement binary search algorithm.",
    "Explain different types of loops with syntax and examples.",
    "What are arrays? Explain single and multi-dimensional arrays.",
    "Differentiate between structure and union with examples.",
    "Explain the concept of pointers and their applications.",
    "What is function overloading? Explain with example.",
    "Write short notes on dynamic memory allocation.",
    "Explain the concept of file handling with examples.",
    "What are the different storage classes in C? Explain each.",
    "Differentiate between compiler and interpreter.",
  ],
  database: [
    "Explain the concept of normalization with examples up to 3NF.",
    "What is SQL? Explain DDL, DML, and DCL commands.",
    "Differentiate between primary key and foreign key.",
    "Explain the concept of ACID properties in DBMS.",
    "What are joins? Explain different types of joins with examples.",
    "Write short notes on indexing and its types.",
    "Explain ER model with suitable diagram.",
    "What is transaction? Explain transaction states.",
    "Differentiate between DBMS and RDBMS.",
    "Explain the concept of views and stored procedures.",
  ],
  networking: [
    "Explain OSI model with functions of each layer.",
    "What is TCP/IP? Compare it with OSI model.",
    "Explain different types of network topologies.",
    "What is IP addressing? Explain classes of IP addresses.",
    "Differentiate between TCP and UDP protocols.",
    "What is routing? Explain different routing algorithms.",
    "Explain the concept of subnetting with example.",
    "What are the functions of transport layer?",
    "Explain DNS and its working mechanism.",
    "Write short notes on firewalls and their types.",
  ],
  webtech: [
    "Explain the structure of HTML document.",
    "What is CSS? Explain different types of CSS.",
    "Differentiate between HTML and XML.",
    "Explain JavaScript data types and variables.",
    "What is DOM? Explain DOM manipulation methods.",
    "Write short notes on responsive web design.",
    "Explain the concept of AJAX and its applications.",
    "What are web services? Explain REST and SOAP.",
    "Explain PHP session management.",
    "What is Bootstrap? Explain its grid system.",
  ],
  os: [
    "Explain process scheduling algorithms with examples.",
    "What is deadlock? Explain deadlock prevention methods.",
    "Differentiate between process and thread.",
    "Explain memory management techniques.",
    "What is virtual memory? Explain page replacement algorithms.",
    "Write short notes on file system structure.",
    "Explain the concept of semaphores.",
    "What is CPU scheduling? Explain FCFS and SJF.",
    "Differentiate between paging and segmentation.",
    "Explain the concept of system calls.",
  ],
  software: [
    "Explain Software Development Life Cycle (SDLC) models.",
    "What is requirement engineering? Explain its phases.",
    "Differentiate between functional and non-functional requirements.",
    "Explain different software testing techniques.",
    "What is software maintenance? Explain its types.",
    "Write short notes on software project management.",
    "Explain the concept of software quality assurance.",
    "What is UML? Explain different UML diagrams.",
    "Differentiate between white box and black box testing.",
    "Explain agile methodology and its principles.",
  ],
  datastructure: [
    "Explain stack data structure with operations.",
    "What is queue? Explain circular queue implementation.",
    "Differentiate between array and linked list.",
    "Explain binary tree traversal methods.",
    "What is hashing? Explain collision resolution techniques.",
    "Write short notes on graph representations.",
    "Explain sorting algorithms with time complexity.",
    "What is AVL tree? Explain its rotations.",
    "Differentiate between BFS and DFS.",
    "Explain the concept of heap data structure.",
  ],
  general: [
    "Explain the fundamental concepts of this subject.",
    "What are the key applications in real-world scenarios?",
    "Differentiate between theoretical and practical approaches.",
    "Write short notes on recent advancements in this field.",
    "Explain the architecture and components involved.",
    "What are the advantages and limitations?",
    "Describe the step-by-step implementation process.",
    "Explain with suitable diagrams and examples.",
    "Compare different methodologies and techniques.",
    "What are the future trends and developments?",
  ],
};

// Get questions based on subject name
const getQuestionsForSubject = (subjectName) => {
  const name = subjectName.toLowerCase();
  if (name.includes("programming") || name.includes("logic") || name.includes("c ") || name.includes("java") || name.includes("python")) {
    return questionBank.programming;
  } else if (name.includes("database") || name.includes("dbms") || name.includes("sql")) {
    return questionBank.database;
  } else if (name.includes("network") || name.includes("tcp") || name.includes("internet")) {
    return questionBank.networking;
  } else if (name.includes("web") || name.includes("html") || name.includes("php")) {
    return questionBank.webtech;
  } else if (name.includes("operating") || name.includes("os ") || name.includes("system")) {
    return questionBank.os;
  } else if (name.includes("software") || name.includes("engineering") || name.includes("testing")) {
    return questionBank.software;
  } else if (name.includes("data") || name.includes("structure") || name.includes("algorithm")) {
    return questionBank.datastructure;
  }
  return questionBank.general;
};

// Shuffle array
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const PYQs = () => {
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [examType, setExamType] = useState("external");
  const [generatedPaper, setGeneratedPaper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const paperRef = useRef(null);

  const availableSemesters = course ? Object.keys(courseData[course]?.semesters || {}) : [];
  const availableSubjects = course && semester ? courseData[course]?.semesters[semester] || [] : [];

  const handleCourseChange = (e) => {
    setCourse(e.target.value);
    setSemester("");
    setSubjectCode("");
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
    setSubjectCode("");
  };

  const handleGenerate = () => {
    if (!course || !semester || !subjectCode) {
      setError("Please select course, semester and subject");
      return;
    }

    setLoading(true);
    setError("");

    setTimeout(() => {
      const subject = availableSubjects.find((s) => s.code === subjectCode);
      const questions = getQuestionsForSubject(subject.name);
      const shuffled = shuffleArray(questions);

      const paper = {
        course: course,
        courseName: courseData[course].name,
        semester: semester,
        subject_code: subjectCode,
        subject_name: subject.name,
        exam_type: examType === "external" ? "External" : "Internal",
        total_marks: examType === "external" ? 60 : 30,
        time: examType === "external" ? "3 Hours" : "1.5 Hours",
        section1: shuffled.slice(0, 9).map((q, i) => ({
          question: q,
          importance: i < 3 ? "HIGH" : i < 6 ? "MEDIUM" : "NORMAL",
        })),
        q2a: shuffled.slice(9, 11).map((q) => ({ question: q })),
        q2b: shuffled.slice(11, 13).map((q) => ({ question: q })),
        q3: shuffled.slice(13, 15).map((q) => ({ question: q })),
        q4: shuffled.slice(15, 18).map((q) => ({ question: q })),
        q5: shuffled.slice(18, 20).map((q) => ({ question: q })),
      };

      setGeneratedPaper(paper);
      setLoading(false);
    }, 800);
  };

  const handleDownloadPDF = () => {
    const printContent = paperRef.current;
    const printWindow = window.open("", "_blank");
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${generatedPaper.subject_code}_${generatedPaper.exam_type}_Paper</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Times New Roman', Times, serif; 
            font-size: 12pt; 
            line-height: 1.4;
            background: white;
            color: black;
          }
          .paper { 
            width: 210mm; 
            min-height: 297mm; 
            padding: 15mm;
            background: white;
          }
          .header { text-align: center; margin-bottom: 15px; }
          .header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 5px; }
          .header h2 { font-size: 14pt; font-weight: bold; margin-bottom: 5px; }
          .header p { font-size: 12pt; margin-bottom: 3px; }
          .enrollment { text-align: right; margin-bottom: 10px; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold; }
          .instructions { margin: 15px 0; padding: 10px; border: 1px solid #333; }
          .instructions h4 { margin-bottom: 5px; }
          .instructions li { margin-left: 20px; }
          hr { border: 1px solid #333; margin: 15px 0; }
          .section { margin: 15px 0; }
          .section-title { font-weight: bold; font-size: 13pt; margin-bottom: 10px; text-align: center; }
          .question-header { font-weight: bold; margin: 10px 0 5px 0; }
          .question { margin: 8px 0; padding-left: 20px; text-indent: -20px; }
          .question-label { font-weight: bold; }
          .marks { float: right; font-weight: bold; }
          .end { text-align: center; margin-top: 20px; font-weight: bold; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="paper">
          <div class="enrollment">Enrollment No._______________</div>
          
          <div class="header">
            <h1>GANPAT UNIVERSITY</h1>
            <h2>${generatedPaper.course} SEM-${generatedPaper.semester} EXAMINATION (CBCS)</h2>
            <p><strong>${generatedPaper.subject_code}: ${generatedPaper.subject_name}</strong></p>
            <p>${generatedPaper.exam_type} Examination - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          
          <div class="info-row">
            <span>Time: ${generatedPaper.time}</span>
            <span>[Total Marks: ${generatedPaper.total_marks}]</span>
          </div>
          
          <div class="instructions">
            <h4>Instructions:</h4>
            <ol>
              <li>Figures to the right indicate full marks.</li>
              <li>Each section should be written in a separate answer book.</li>
              <li>Be precise and to the point in your answer.</li>
            </ol>
          </div>
          
          <hr>
          
          <div class="section">
            <div class="section-title">SECTION-I</div>
            <div class="question-header">
              1. Answer the following: (Any six out of Nine) <span class="marks">(30)</span>
            </div>
            ${generatedPaper.section1.map((q, i) => `
              <div class="question">
                <span class="question-label">${String.fromCharCode(65 + i)})</span> ${q.question} <span class="marks">(05)</span>
              </div>
            `).join('')}
          </div>
          
          ${generatedPaper.exam_type === "External" ? `
            <hr>
            
            <div class="section">
              <div class="section-title">SECTION-II</div>
              
              <div class="question-header">2</div>
              <div class="question-header" style="margin-left: 20px;">
                (A) Answer the following: (Any One) <span class="marks">(06)</span>
              </div>
              ${generatedPaper.q2a.map((q, i) => `
                <div class="question" style="margin-left: 40px;">
                  <span class="question-label">${['I', 'II'][i]})</span> ${q.question}
                </div>
              `).join('')}
              
              <div class="question-header" style="margin-left: 20px;">
                (B) Answer the following: <span class="marks">(02)</span>
              </div>
              ${generatedPaper.q2b.map((q, i) => `
                <div class="question" style="margin-left: 40px;">
                  <span class="question-label">${['I', 'II'][i]})</span> ${q.question} <span class="marks">(01)</span>
                </div>
              `).join('')}
              
              <div class="question-header">
                3. Answer the following: (Any One) <span class="marks">(06)</span>
              </div>
              ${generatedPaper.q3.map((q, i) => `
                <div class="question">
                  <span class="question-label">${['I', 'II'][i]})</span> ${q.question}
                </div>
              `).join('')}
              
              <div class="question-header">
                4. Answer the following: (Any Two) <span class="marks">(10)</span>
              </div>
              ${generatedPaper.q4.map((q, i) => `
                <div class="question">
                  <span class="question-label">${['I', 'II', 'III'][i]})</span> ${q.question} <span class="marks">(05)</span>
                </div>
              `).join('')}
              
              <div class="question-header">
                5. Answer the following: (Any One) <span class="marks">(06)</span>
              </div>
              ${generatedPaper.q5.map((q, i) => `
                <div class="question">
                  <span class="question-label">${['I', 'II'][i]})</span> ${q.question}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <hr>
          <div class="end">--- End of Paper ---</div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const resetForm = () => {
    setGeneratedPaper(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <StudentLayout>
      <div className="relative">
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: "url(/maxresdefault.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.3,
          }}
        ></div>
        <div className="animate-fade-in max-w-4xl mx-auto relative z-10">
          {/* Page Header */}
          <div className="border-b border-[var(--gu-gold)] pb-6 mb-8">
            <h1 className="font-serif text-3xl text-white mb-2">
              Previous Year Question Papers
            </h1>
            <p className="text-[var(--gu-gold)] text-sm uppercase tracking-wider font-semibold">
              Generate PYQ papers in official university format
            </p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-sm mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!generatedPaper ? (
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 md:p-8 rounded-sm mb-8 shadow-lg overflow-hidden box-border">
              <h2 className="font-serif text-white text-xl mb-6 border-b border-[var(--gu-border)] pb-3">
                Generate PYQ Paper
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* Course Selection */}
                  <div>
                    <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">
                      Select Course
                    </label>
                    <select
                      value={course}
                      onChange={handleCourseChange}
                      className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] appearance-none"
                    >
                      <option value="" disabled>Select a course</option>
                      {Object.keys(courseData).map((c) => (
                        <option key={c} value={c}>{c} - {courseData[c].name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Semester Selection */}
                  <div>
                    <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">
                      Select Semester
                    </label>
                    <select
                      value={semester}
                      onChange={handleSemesterChange}
                      disabled={!course}
                      className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                    >
                      <option value="" disabled>Select semester</option>
                      {availableSemesters.map((sem) => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* Subject Selection */}
                  <div>
                    <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">
                      Select Subject
                    </label>
                    <select
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      disabled={!semester}
                      className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                    >
                      <option value="" disabled>Select a subject</option>
                      {availableSubjects.map((s) => (
                        <option key={s.code} value={s.code}>[{s.code}] {s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Exam Type */}
                  <div>
                    <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">
                      Exam Type
                    </label>
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                      className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] appearance-none"
                    >
                      <option value="external">External (60 Marks)</option>
                      <option value="internal">Internal (30 Marks)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!course || !semester || !subjectCode || loading}
                  className="w-full box-border mt-6 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] font-serif py-3 md:py-4 text-base md:text-lg font-bold rounded-sm flex items-center justify-center hover:bg-[#e6c949] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 md:w-6 md:h-6 mr-3 flex-shrink-0 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 md:w-6 md:h-6 mr-3 flex-shrink-0" />
                      Generate PYQ Paper
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h2 className="font-serif text-white text-xl mb-4 pl-3 border-l-4 border-l-[var(--gu-gold)]">
                Generated: {generatedPaper.subject_name} — {generatedPaper.exam_type} Exam
              </h2>

              {/* A4 White Paper Preview */}
              <div 
                ref={paperRef}
                className="bg-white text-black p-8 md:p-12 rounded shadow-2xl mx-auto"
                style={{ 
                  maxWidth: '210mm', 
                  minHeight: '297mm',
                  fontFamily: "'Times New Roman', Times, serif"
                }}
              >
                {/* Enrollment */}
                <div className="text-right text-sm mb-4">Enrollment No._______________</div>

                {/* Header */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-1">GANPAT UNIVERSITY</h1>
                  <h2 className="text-lg font-bold mb-2">
                    {generatedPaper.course} SEM-{generatedPaper.semester} EXAMINATION (CBCS)
                  </h2>
                  <p className="font-bold">{generatedPaper.subject_code}: {generatedPaper.subject_name}</p>
                  <p className="text-sm mt-1">
                    {generatedPaper.exam_type} Examination - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Time and Marks */}
                <div className="flex justify-between font-bold mb-4">
                  <span>Time: {generatedPaper.time}</span>
                  <span>[Total Marks: {generatedPaper.total_marks}]</span>
                </div>

                {/* Instructions */}
                <div className="border border-gray-400 p-3 mb-4 text-sm">
                  <p className="font-bold mb-1">Instructions:</p>
                  <ol className="list-decimal ml-5">
                    <li>Figures to the right indicate full marks.</li>
                    <li>Each section should be written in a separate answer book.</li>
                    <li>Be precise and to the point in your answer.</li>
                  </ol>
                </div>

                <hr className="border-gray-800 mb-4" />

                {/* Section I */}
                <div className="mb-6">
                  <h3 className="text-center font-bold text-base mb-3">SECTION-I</h3>
                  <p className="font-bold mb-2">
                    1. Answer the following: (Any six out of Nine) 
                    <span className="float-right">(30)</span>
                  </p>
                  {generatedPaper.section1.map((q, i) => (
                    <p key={i} className="mb-2 pl-4 text-sm">
                      <span className="font-bold">{String.fromCharCode(65 + i)})</span> {q.question}
                      <span className="float-right font-bold">(05)</span>
                    </p>
                  ))}
                </div>

                {/* Section II (External only) */}
                {generatedPaper.exam_type === "External" && (
                  <>
                    <hr className="border-gray-800 mb-4" />
                    <div className="mb-6">
                      <h3 className="text-center font-bold text-base mb-3">SECTION-II</h3>
                      
                      <p className="font-bold mb-1">2</p>
                      <p className="font-bold mb-2 pl-4">
                        (A) Answer the following: (Any One)
                        <span className="float-right">(06)</span>
                      </p>
                      {generatedPaper.q2a.map((q, i) => (
                        <p key={i} className="mb-2 pl-8 text-sm">
                          <span className="font-bold">{['I', 'II'][i]})</span> {q.question}
                        </p>
                      ))}

                      <p className="font-bold mb-2 pl-4 mt-3">
                        (B) Answer the following:
                        <span className="float-right">(02)</span>
                      </p>
                      {generatedPaper.q2b.map((q, i) => (
                        <p key={i} className="mb-2 pl-8 text-sm">
                          <span className="font-bold">{['I', 'II'][i]})</span> {q.question}
                          <span className="float-right font-bold">(01)</span>
                        </p>
                      ))}

                      <p className="font-bold mb-2 mt-3">
                        3. Answer the following: (Any One)
                        <span className="float-right">(06)</span>
                      </p>
                      {generatedPaper.q3.map((q, i) => (
                        <p key={i} className="mb-2 pl-4 text-sm">
                          <span className="font-bold">{['I', 'II'][i]})</span> {q.question}
                        </p>
                      ))}

                      <p className="font-bold mb-2 mt-3">
                        4. Answer the following: (Any Two)
                        <span className="float-right">(10)</span>
                      </p>
                      {generatedPaper.q4.map((q, i) => (
                        <p key={i} className="mb-2 pl-4 text-sm">
                          <span className="font-bold">{['I', 'II', 'III'][i]})</span> {q.question}
                          <span className="float-right font-bold">(05)</span>
                        </p>
                      ))}

                      <p className="font-bold mb-2 mt-3">
                        5. Answer the following: (Any One)
                        <span className="float-right">(06)</span>
                      </p>
                      {generatedPaper.q5.map((q, i) => (
                        <p key={i} className="mb-2 pl-4 text-sm">
                          <span className="font-bold">{['I', 'II'][i]})</span> {q.question}
                        </p>
                      ))}
                    </div>
                  </>
                )}

                <hr className="border-gray-800 my-4" />
                <p className="text-center font-bold">--- End of Paper ---</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 flex items-center justify-center bg-[var(--gu-red)] text-white px-6 py-3 font-bold uppercase tracking-widest rounded-sm hover:bg-[#5c0000] transition-colors whitespace-nowrap text-sm"
                >
                  <Download className="w-5 h-5 mr-3 flex-shrink-0" />
                  Download / Print PDF
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 flex items-center justify-center border border-[var(--gu-gold)] text-[var(--gu-gold)] px-6 py-3 font-bold uppercase tracking-widest rounded-sm hover:bg-[rgba(212,175,55,0.1)] transition-colors whitespace-nowrap text-sm"
                >
                  Generate Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default PYQs;
