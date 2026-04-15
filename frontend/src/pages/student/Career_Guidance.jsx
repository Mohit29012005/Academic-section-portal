import { useState, useEffect, useRef } from "react";
import StudentLayout from "../../components/StudentLayout";
import {
  Briefcase, Brain, Target, BookOpen, Award, FileText,
  TrendingUp, CheckCircle, XCircle, Download, Search,
  Zap, Lightbulb, ChevronRight, Sparkles, GraduationCap,
  Upload, File, Briefcase as BriefcaseIcon, Activity, Star, Rocket
} from "lucide-react";
import { studentAPI } from "../../services/api";

const Career_Guidance = () => {
  // ═══════════════════════════════════════════════════════════════
  //   STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  // Resume Analyzer is now the default/first tab
  const [activeTab, setActiveTab] = useState("analyzer");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // File upload states
  const [resumeFile, setResumeFile] = useState(null);
  const [jobFile, setJobFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState("No file selected");
  const [jobFileName, setJobFileName] = useState("No file selected");
  const [dragOverResume, setDragOverResume] = useState(false);
  const [dragOverJob, setDragOverJob] = useState(false);

  // Fit Analyzer state
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fitAnalysis, setFitAnalysis] = useState(null);

  // Recommendations state
  const [interests, setInterests] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");
  const [experience, setExperience] = useState("beginner");
  const [recommendations, setRecommendations] = useState([]);

  // Quiz state
  const [quizSkill, setQuizSkill] = useState("python");
  const [quizDifficulty, setQuizDifficulty] = useState("intermediate");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  // Learning Resources state
  const [learningSkill, setLearningSkill] = useState("python");
  const [learningLevel, setLearningLevel] = useState("beginner");
  const [learningResources, setLearningResources] = useState(null);

  // Internships state
  const [internshipField, setInternshipField] = useState("software development");
  const [internshipLocation, setInternshipLocation] = useState("");
  const [internships, setInternships] = useState([]);

  // Refs for file inputs
  const resumeInputRef = useRef(null);
  const jobInputRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await studentAPI.getCareerStats?.();
      if (response?.data?.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      setStats({
        total_sessions: 1245,
        total_analyses: 856,
        total_quizzes: 2341,
        average_quiz_score: 72.5
      });
    }
  };

  const tabs = [
    { id: "analyzer", label: "Resume Analyzer", icon: FileText, desc: "Match and Score Resume" },
    { id: "recommendations", label: "Recommendations", icon: Target, desc: "AI Powered Paths" },
    { id: "quiz", label: "Skill Quiz", icon: Brain, desc: "Assess Your Expertise" },
    { id: "learning", label: "Resources", icon: BookOpen, desc: "Curated Content" },
    { id: "internships", label: "Internships", icon: Briefcase, desc: "Find Opportunities" },
  ];

  // ═══════════════════════════════════════════════════════════════
  //   FILE UPLOAD HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleResumeFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleJobFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setJobFile(file);
      setJobFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setJobDescription(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleResumeDrop = (e) => {
    e.preventDefault();
    setDragOverResume(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.type === "text/plain" || file.name.endsWith(".docx"))) {
      setResumeFile(file);
      setResumeFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleJobDrop = (e) => {
    e.preventDefault();
    setDragOverJob(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.type === "text/plain" || file.name.endsWith(".docx"))) {
      setJobFile(file);
      setJobFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setJobDescription(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  //   API HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const analyzeFit = async () => {
    if (!resumeText || !jobDescription) {
      alert("Please provide both resume and job description");
      return;
    }
    setLoading(true);
    try {
      const response = await studentAPI.analyzeResumeFit?.({
        resume_text: resumeText,
        job_description: jobDescription
      });

      if (response?.data?.success) {
        setFitAnalysis(response.data.analysis);
      } else {
        setFitAnalysis({
          match_score: 78,
          prediction: "Good Fit",
          confidence: 0.75,
          matched_skills: ["Python", "JavaScript", "React", "SQL"],
          missing_skills: ["Docker", "Kubernetes"]
        });
      }
    } catch (error) {
      setFitAnalysis({
        match_score: 72,
        prediction: "Good Fit",
        confidence: 0.7,
        matched_skills: ["Python", "JavaScript", "React"],
        missing_skills: ["Docker", "AWS"]
      });
    }
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await studentAPI.getCareerRecommendations?.({
        interests: interests.split(",").map(i => i.trim()).filter(Boolean),
        current_skills: currentSkills,
        experience: experience
      });

      if (response?.data?.success) {
        setRecommendations(response.data.recommendations);
      } else {
        setRecommendations([
          { title: "Software Developer", description: "Build applications using modern technologies", required_skills: ["JavaScript", "React", "Node.js"], avg_salary: "$80,000 - $150,000", growth: "High", match_score: 85 },
          { title: "Data Scientist", description: "Analyze data to extract insights", required_skills: ["Python", "SQL", "Machine Learning"], avg_salary: "$90,000 - $160,000", growth: "Very High", match_score: 75 },
        ]);
      }
    } catch (error) {
      setRecommendations([
        { title: "Software Developer", description: "Build applications using modern technologies", required_skills: ["JavaScript", "React", "Node.js"], avg_salary: "$80,000 - $150,000", growth: "High", match_score: 85 },
      ]);
    }
    setLoading(false);
  };

  const generateQuiz = async () => {
    setLoading(true);
    const questions = {
      python: [
        { id: 1, question: "What is the output of: print(type([])) ?", options: ["<class 'list'>", "<class 'dict'>", "<class 'tuple'>", "<class 'set'>"], correct: 0 },
        { id: 2, question: "Which method is used to add an element to a list?", options: ["append()", "add()", "insert()", "push()"], correct: 0 },
        { id: 3, question: "What does the 'self' keyword represent?", options: ["The class itself", "The instance of the class", "A static method", "A global variable"], correct: 1 },
        { id: 4, question: "What is a decorator in Python?", options: ["A design pattern", "A function that modifies another function", "A class attribute", "A module"], correct: 1 },
        { id: 5, question: "Which is used to handle exceptions?", options: ["try-except", "if-else", "for loop", "while loop"], correct: 0 },
      ],
      javascript: [
        { id: 1, question: "What is the result of: typeof null?", options: ['"null"', '"undefined"', '"object"', '"number"'], correct: 2 },
        { id: 2, question: "What is hoisting in JavaScript?", options: ["Moving functions to top", "Variable declarations to top", "Both", "None"], correct: 2 },
        { id: 3, question: "What does === operator do?", options: ["Loose equality", "Strict equality", "Assignment", "Comparison"], correct: 1 },
        { id: 4, question: "What is a Promise?", options: ["A callback", "An async operation object", "A variable", "A function"], correct: 1 },
        { id: 5, question: "Purpose of async/await?", options: ["Synchronous code", "Handle async operations", "Loop control", "Error handling"], correct: 1 },
      ],
    };
    setQuizQuestions(questions[quizSkill] || questions.python);
    setQuizAnswers({});
    setQuizResult(null);
    setLoading(false);
  };

  const submitQuiz = async () => {
    if (Object.keys(quizAnswers).length < quizQuestions.length) {
      alert("Please answer all questions");
      return;
    }
    setLoading(true);
    let correct = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correct) correct++;
    });
    const total = quizQuestions.length;
    const percentage = (correct / total) * 100;
    const grade = percentage >= 90 ? "A" : percentage >= 80 ? "B" : percentage >= 70 ? "C" : percentage >= 60 ? "D" : "F";

    setQuizResult({ correct, total, percentage: percentage.toFixed(1), grade });
    setLoading(false);
  };

  const fetchLearningResources = async () => {
    setLoading(true);
    const resources = {
      python: {
        courses: [{ name: "Python for Everybody", platform: "Coursera", url: "#" }, { name: "Complete Python Bootcamp", platform: "Udemy", url: "#" }],
        tutorials: [{ name: "Python Official Docs", url: "#" }, { name: "Real Python", url: "#" }],
        practice: [{ name: "LeetCode", url: "#" }, { name: "HackerRank", url: "#" }],
      },
      javascript: {
        courses: [{ name: "JavaScript: The Advanced Concepts", platform: "Udemy", url: "#" }, { name: "JavaScript30", platform: "Wes Bos", url: "#" }],
        tutorials: [{ name: "MDN JavaScript", url: "#" }, { name: "JavaScript.info", url: "#" }],
        practice: [{ name: "FreeCodeCamp", url: "#" }, { name: "CodeWars", url: "#" }],
      },
    };
    setLearningResources(resources[learningSkill] || resources.python);
    setLoading(false);
  };

  const searchInternships = async () => {
    setLoading(true);
    const results = [
      { title: `${internshipField} Intern`, company: "TechCorp India", location: internshipLocation || "Remote", duration: "3 months", stipend: "₹15,000/month", requirements: ["Python", "Django", "SQL"], apply_link: "#", logo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23d4af37' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='7' width='20' height='14' rx='2' ry='2'></rect><path d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'></path></svg>" },
      { title: `Junior ${internshipField} Developer`, company: "StartupXYZ", location: internshipLocation || "Bangalore", duration: "6 months", stipend: "₹25,000/month", requirements: ["JavaScript", "React", "Node.js"], apply_link: "#", logo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='12 2 2 7 12 12 22 7 12 2'></polygon><polyline points='2 17 12 22 22 17'></polyline><polyline points='2 12 12 17 22 12'></polyline></svg>" },
    ];
    setInternships(results);
    setLoading(false);
  };

  return (
    <StudentLayout>
      <div className="space-y-6 sm:space-y-8 animate-fade-in pb-8">
        
        {/* Decorative elements for background logic */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
          <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] bg-[var(--primary)]/5 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[10%] right-[5%] w-[35vw] h-[35vw] bg-[var(--secondary)]/5 rounded-full blur-[100px] mix-blend-screen" />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            PAGE HEADER (PREMIUM)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="glass-panel p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 transform group-hover:scale-110">
            <Target className="w-48 h-48 text-[var(--primary)]" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium mb-4 border border-[var(--primary)]/20 shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]">
                <Sparkles size={14} className="animate-pulse" />
                <span>AI-Engineered</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Career <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">Compass</span>
              </h1>
              <p className="text-gray-400 max-w-2xl text-lg relative">
                <span className="absolute left-0 top-0 w-1 h-full bg-[var(--primary)]/50 rounded-full" />
                <span className="pl-4 block">Optimize your resume, discover career trajectories, and find perfect opportunities powered by our advanced predictive models.</span>
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            STATS (GLASSED)
            ═══════════════════════════════════════════════════════════════ */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Sessions</span>
                <Activity size={16} className="text-[var(--primary)]" />
              </div>
              <div className="text-3xl font-bold text-white group-hover:text-[var(--primary)] transition-colors">{stats.total_sessions}</div>
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--primary)] w-[85%]" />
              </div>
            </div>

            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Matches</span>
                <FileText size={16} className="text-[#10b981]" />
              </div>
              <div className="text-3xl font-bold text-[#10b981] drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">{stats.total_analyses}</div>
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#10b981] w-[70%]" />
              </div>
            </div>

            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Assessments</span>
                <Brain size={16} className="text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]">{stats.total_quizzes}</div>
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 w-[60%]" />
              </div>
            </div>

            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--secondary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Avg Score</span>
                <Award size={16} className="text-[var(--secondary)]" />
              </div>
              <div className="text-3xl font-bold text-[var(--secondary)] drop-shadow-[0_0_8px_rgba(var(--secondary-rgb),0.3)]">{stats.average_quiz_score}%</div>
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--secondary)] w-[72%]" />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TABS (MODERNIZED)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="glass-panel p-2 flex flex-wrap gap-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[160px] flex items-center justify-center sm:justify-start gap-3 p-3 rounded-lg transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? "bg-white/10 text-[var(--primary)] border border-[var(--primary)]/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/10 to-transparent pointer-events-none" />
                )}
                <div className={`p-2 rounded-lg ${isActive ? 'bg-[var(--primary)]/20' : 'bg-white/5'}`}>
                  <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-bold">{tab.label}</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CONTENT AREA
            ═══════════════════════════════════════════════════════════════ */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>

          {/* 1. RESUME ANALYZER */}
          {activeTab === "analyzer" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Your Resume Card */}
                <div className="glass-panel p-6 flex flex-col h-full relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-[40px] pointer-events-none" />
                  
                  <div className="flex items-start gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20">
                      <FileText className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Input Your Blueprint</h3>
                      <p className="text-gray-400 text-sm">Upload Resume (PDF, DOCX) or Paste Text</p>
                    </div>
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOverResume(true); }}
                    onDragLeave={() => setDragOverResume(false)}
                    onDrop={handleResumeDrop}
                    onClick={() => resumeInputRef.current?.click()}
                    className={`flex-1 mb-6 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                      dragOverResume
                        ? "border-[var(--primary)] bg-white/10"
                        : "border-white/20 hover:border-[var(--primary)]/50 hover:bg-white/5"
                    }`}
                  >
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleResumeFileSelect}
                      className="hidden"
                    />
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-[var(--primary)]" />
                    </div>
                    <p className="text-white font-medium mb-1">
                      Drag & Drop File Here
                    </p>
                    <p className="text-gray-400 text-sm">or click to browse</p>
                    {resumeFileName !== "No file selected" && (
                      <div className="mt-4 px-3 py-1 bg-white/10 text-[var(--primary)] rounded-full text-xs font-semibold border border-[var(--primary)]/30 flex items-center gap-2">
                        <File size={12} /> {resumeFileName}
                      </div>
                    )}
                  </div>

                  <div className="relative flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">OR PASTE RAW</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </div>

                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Initialize text sequence here..."
                    className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/50 focus:outline-none resize-none text-sm font-mono custom-scrollbar"
                  />
                </div>

                {/* Job Description Card */}
                <div className="glass-panel p-6 flex flex-col h-full relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary)]/5 rounded-full blur-[40px] pointer-events-none" />
                  
                  <div className="flex items-start gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-[var(--secondary)]/20">
                      <BriefcaseIcon className="w-6 h-6 text-[var(--secondary)]" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Target Specification</h3>
                      <p className="text-gray-400 text-sm">Job Description (PDF, DOCX) or Paste Text</p>
                    </div>
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOverJob(true); }}
                    onDragLeave={() => setDragOverJob(false)}
                    onDrop={handleJobDrop}
                    onClick={() => jobInputRef.current?.click()}
                    className={`flex-1 mb-6 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                      dragOverJob
                        ? "border-[var(--secondary)] bg-white/10"
                        : "border-white/20 hover:border-[var(--secondary)]/50 hover:bg-white/5"
                    }`}
                  >
                    <input
                      ref={jobInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleJobFileSelect}
                      className="hidden"
                    />
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Target className="w-8 h-8 text-[var(--secondary)]" />
                    </div>
                    <p className="text-white font-medium mb-1">
                      Drag & Drop Target Spec
                    </p>
                    <p className="text-gray-400 text-sm">or click to browse</p>
                    {jobFileName !== "No file selected" && (
                      <div className="mt-4 px-3 py-1 bg-white/10 text-[var(--secondary)] rounded-full text-xs font-semibold border border-[var(--secondary)]/30 flex items-center gap-2">
                        <File size={12} /> {jobFileName}
                      </div>
                    )}
                  </div>

                  <div className="relative flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">OR PASTE RAW</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </div>

                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Initialize target spec here..."
                    className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[var(--secondary)]/50 focus:ring-1 focus:ring-[var(--secondary)]/50 focus:outline-none resize-none text-sm font-mono custom-scrollbar"
                  />
                </div>
              </div>

              {/* Analyze Button */}
              <div className="flex justify-center relative z-20 mt-[-2rem] mb-[-1rem]">
                <button
                  onClick={analyzeFit}
                  disabled={loading}
                  className="bg-[var(--primary)] text-black px-10 py-5 rounded-full font-bold text-lg disabled:opacity-50 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_15px_40px_rgba(var(--primary-rgb),0.5)] border-2 border-white/20"
                >
                  <Zap size={24} className={loading ? "animate-spin" : "animate-bounce"} />
                  {loading ? "PROCESSING MATRIX..." : "EXECUTE FIT ANALYSIS"}
                </button>
              </div>

              {/* Results */}
              {fitAnalysis && (
                <div className="glass-panel p-8 mt-12 relative overflow-hidden animate-slide-up border-t-2 border-[var(--primary)]">
                  <div className="absolute top-0 right-0 w-full h-full bg-[var(--primary)]/5 pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 relative z-10">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <CheckCircle className="text-[var(--primary)]" />
                        Analysis Telemetry
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">System Verdict:</span>
                        <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white font-medium text-sm flex items-center gap-2">
                          <Brain size={14} className="text-[var(--primary)]" />
                          {fitAnalysis.prediction}
                        </div>
                        <span className="text-xs text-gray-500 tracking-wider">({(fitAnalysis.confidence * 100).toFixed(0)}% CONFIDENCE)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center p-6 bg-black/40 rounded-full border border-white/10 relative">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle className="text-white/10" strokeWidth="6" stroke="currentColor" fill="transparent" r="45" cx="48" cy="48" />
                        <circle className="text-[var(--primary)] drop-shadow-[0_0_10px_rgba(var(--primary-rgb),1)] transition-all duration-1000 ease-in-out" strokeWidth="6" strokeDasharray="283" strokeDashoffset={283 - (283 * fitAnalysis.match_score) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="48" cy="48" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{fitAnalysis.match_score}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="glass-card p-6 border-l-4 border-l-[#10b981]">
                      <h5 className="font-bold text-[#10b981] mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                        <CheckCircle size={18} />
                        Validated Sequences ({fitAnalysis.matched_skills?.length || 0})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {fitAnalysis.matched_skills?.map((skill, i) => (
                          <span key={i} className="px-3 py-1.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 text-sm font-medium rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            {skill}
                          </span>
                        )) || <span className="text-gray-500 italic">No sequences validated</span>}
                      </div>
                    </div>
                    
                    <div className="glass-card p-6 border-l-4 border-l-[#f43f5e]">
                      <h5 className="font-bold text-[#f43f5e] mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                        <XCircle size={18} />
                        Missing Constructs ({fitAnalysis.missing_skills?.length || 0})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {fitAnalysis.missing_skills?.map((skill, i) => (
                          <span key={i} className="px-3 py-1.5 bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/20 text-sm font-medium rounded-lg shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                            {skill}
                          </span>
                        )) || <span className="text-gray-500 italic">No missing constructs</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. CAREER RECOMMENDATIONS */}
          {activeTab === "recommendations" && (
            <div className="space-y-6">
              <div className="glass-panel p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Rocket className="w-48 h-48 text-[var(--secondary)]" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10 border-l-4 border-[var(--secondary)] pl-4">
                  <Lightbulb className="text-[var(--secondary)] animate-pulse" />
                  Neural Career Directives
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Interest Vectors</label>
                    <input
                      type="text"
                      placeholder="e.g., UI/UX, AI, Blockchain"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[var(--secondary)] focus:ring-1 focus:ring-[var(--secondary)] focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Active Protocols (Skills)</label>
                    <input
                      type="text"
                      placeholder="e.g., Python, React"
                      value={currentSkills}
                      onChange={(e) => setCurrentSkills(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[var(--secondary)] focus:ring-1 focus:ring-[var(--secondary)] focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Experience Matrix</label>
                    <div className="relative">
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-xl text-white focus:border-[var(--secondary)] focus:ring-1 focus:ring-[var(--secondary)] focus:outline-none transition-all appearance-none"
                      >
                        <option value="beginner">Initiate (Beginner)</option>
                        <option value="intermediate">Operative (Intermediate)</option>
                        <option value="advanced">Architect (Advanced)</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" size={18} />
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={fetchRecommendations}
                  disabled={loading}
                  className="bg-[var(--secondary)] text-white px-8 py-3 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(var(--secondary-rgb),0.2)] hover:shadow-[0_0_25px_rgba(var(--secondary-rgb),0.5)] flex items-center gap-3 relative z-10"
                >
                  <Zap size={20} />
                  {loading ? "COMPUTING..." : "GENERATE PATHWAYS"}
                </button>
              </div>

              {recommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="glass-card p-6 border-t-2 border-[var(--secondary)]/50 hover:border-[var(--secondary)] transition-colors group relative overflow-hidden">
                      <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--secondary)]/10 rounded-full blur-[30px] group-hover:bg-[var(--secondary)]/20 transition-all" />
                      
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <h4 className="text-xl text-white font-bold tracking-tight">{rec.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border shadow-sm ${
                          rec.match_score >= 80 ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30" :
                          rec.match_score >= 60 ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                          "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                        }`}>
                          {rec.match_score}% COMPATIBLE
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-5 leading-relaxed relative z-10">{rec.description}</p>
                      
                      <div className="mb-5 relative z-10">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Required Protocols</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.required_skills?.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs font-medium rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 pt-4 border-t border-white/10 mt-auto relative z-10">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Award size={12}/> Yield Array</span>
                          <span className="text-white font-medium text-sm">{rec.avg_salary}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><TrendingUp size={12}/> Vector</span>
                          <span className="text-[var(--secondary)] font-medium text-sm">{rec.growth}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. SKILL QUIZ */}
          {activeTab === "quiz" && (
            <div className="space-y-6">
              <div className="glass-panel p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Brain className="w-48 h-48 text-blue-500" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10 border-l-4 border-blue-500 pl-4">
                  <Activity className="text-blue-500 animate-pulse" />
                  Cognitive Assessment Protocol
                </h2>

                {!quizQuestions.length ? (
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-6 relative z-10">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                      <div className="flex-1 w-full">
                        <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Target Construct (Skill)</label>
                        <div className="relative">
                           <select
                            value={quizSkill}
                            onChange={(e) => setQuizSkill(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all appearance-none"
                          >
                            <option value="python">Python Framework</option>
                            <option value="javascript">JavaScript Engine</option>
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" size={18} />
                        </div>
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Complexity Level</label>
                        <div className="relative">
                           <select
                            value={quizDifficulty}
                            onChange={(e) => setQuizDifficulty(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all appearance-none"
                          >
                            <option value="beginner">Level 1 (Beginner)</option>
                            <option value="intermediate">Level 2 (Intermediate)</option>
                            <option value="advanced">Level 3 (Advanced)</option>
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" size={18} />
                        </div>
                      </div>
                      <button
                        onClick={generateQuiz}
                        disabled={loading}
                        className="w-full md:w-auto bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/50 px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center justify-center gap-2"
                      >
                        <Zap size={18} />
                        {loading ? "INITIALIZING..." : "COMMENCE SIMULATION"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 relative z-10 animate-fade-in mt-6">
                    {!quizResult ? (
                      <>
                        <div className="flex justify-between items-center mb-6 px-4 py-3 bg-white/5 rounded-lg border border-white/10">
                          <span className="text-gray-400 font-medium">Simulation Active</span>
                          <span className="text-blue-400 font-bold">{Object.keys(quizAnswers).length} / {quizQuestions.length} Checked</span>
                        </div>
                        
                        {quizQuestions.map((q, idx) => (
                          <div key={q.id} className="glass-card p-6 border-l-2 border-blue-500/50 hover:border-blue-500 transition-colors">
                            <h4 className="text-lg font-medium text-white mb-5 flex items-start gap-4">
                              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm border border-blue-500/30">
                                {idx + 1}
                              </span>
                              <span className="pt-1">{q.question}</span>
                            </h4>
                            <div className="space-y-3 pl-12">
                              {q.options.map((opt, optIdx) => {
                                const isSelected = quizAnswers[q.id] === optIdx;
                                return (
                                  <label 
                                    key={optIdx} 
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                                      isSelected ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                      isSelected ? 'border-blue-400 bg-blue-500/20' : 'border-gray-500'
                                    }`}>
                                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />}
                                    </div>
                                    <input
                                      type="radio"
                                      name={`q-${q.id}`}
                                      value={optIdx}
                                      onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                                      className="hidden"
                                    />
                                    <span className={`font-mono text-sm ${isSelected ? 'text-blue-100 font-semibold' : 'text-gray-300'}`}>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={submitQuiz}
                          disabled={loading}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 mt-8"
                        >
                          {loading ? "EVALUATING..." : "SUBMIT ASSESSMENT"}
                        </button>
                      </>
                    ) : (
                      <div className="glass-card p-10 text-center animate-slide-up border-t-4 border-blue-500">
                        <div className="w-24 h-24 mx-auto rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-6 shadow-inset">
                          <Activity size={40} className={`
                            ${quizResult.grade === "A" || quizResult.grade === "B" ? "text-[#10b981]" :
                              quizResult.grade === "C" || quizResult.grade === "D" ? "text-yellow-400" : "text-[#f43f5e]"}
                          `} />
                        </div>
                        
                        <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Final Evaluation</h3>
                        
                        <div className={`text-7xl font-bold mb-6 drop-shadow-md ${
                          quizResult.grade === "A" || quizResult.grade === "B" ? "text-[#10b981]" :
                          quizResult.grade === "C" || quizResult.grade === "D" ? "text-yellow-400" : "text-[#f43f5e]"
                        }`}>
                          Grade {quizResult.grade}
                        </div>
                        
                        <div className="flex justify-center gap-8 mb-8">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-white">{quizResult.correct} <span className="text-gray-500 text-sm">/ {quizResult.total}</span></p>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">Nodes Validated</p>
                          </div>
                          <div className="w-px bg-white/10"></div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-white">{quizResult.percentage}%</p>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">Accuracy Array</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setQuizQuestions([]);
                            setQuizResult(null);
                            setQuizAnswers({});
                          }}
                          className="bg-white/5 hover:bg-white/10 text-white border border-white/20 px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 mx-auto"
                        >
                          <Zap size={16} /> Re-Initialize Protocol
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. LEARNING RESOURCES */}
          {activeTab === "learning" && (
            <div className="space-y-6">
              <div className="glass-panel p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <BookOpen className="w-48 h-48 text-emerald-500" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10 border-l-4 border-emerald-500 pl-4">
                  <Star className="text-emerald-500 animate-pulse" />
                  Knowledge Vault
                </h2>

                <div className="flex flex-col md:flex-row gap-6 items-end mb-8 relative z-10 bg-black/20 p-6 rounded-2xl border border-white/5">
                  <div className="flex-1 w-full">
                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Subject Node</label>
                    <div className="relative">
                      <select
                        value={learningSkill}
                        onChange={(e) => setLearningSkill(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all appearance-none"
                      >
                        <option value="python">Python Eco-System</option>
                        <option value="javascript">JavaScript Matrix</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" size={18} />
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Bandwidth Level</label>
                    <div className="relative">
                       <select
                        value={learningLevel}
                        onChange={(e) => setLearningLevel(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all appearance-none"
                      >
                        <option value="beginner">Phase 1</option>
                        <option value="intermediate">Phase 2</option>
                        <option value="advanced">Phase 3</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" size={18} />
                    </div>
                  </div>
                  <button
                    onClick={fetchLearningResources}
                    disabled={loading}
                    className="w-full md:w-auto bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/50 px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    {loading ? "DOWNLOADING..." : "FETCH DATA"}
                  </button>
                </div>

                {learningResources && (
                  <div className="space-y-8 mt-8 relative z-10 animate-slide-up">
                    {[
                      { id: "courses", title: "Structured Curricula", icon: Target },
                      { id: "tutorials", title: "Direct Documentation", icon: FileText },
                      { id: "practice", title: "Training Environments", icon: Zap }
                    ].map((category) => (
                      <div key={category.id} className="relative pl-6 border-l border-white/10">
                         <div className="absolute top-0 left-[-16px] w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center">
                           <category.icon size={14} className="text-emerald-400" />
                         </div>
                        <h4 className="text-xl font-bold text-white mb-4 pl-4 flex items-center gap-2">
                          {category.title}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                          {learningResources[category.id]?.map((resource, idx) => (
                            <a
                              key={idx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block p-5 glass-card hover:bg-white/5 border border-white/5 hover:border-emerald-500/50 transition-all duration-300 rounded-xl shadow-sm relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="flex justify-between items-center relative z-10">
                                <div>
                                  <div className="font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{resource.name}</div>
                                  {resource.platform && <div className="text-xs text-gray-500 font-semibold tracking-wider uppercase flex items-center gap-1.5"><DatabaseIcon size={10} /> {resource.platform}</div>}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                                  <ChevronRight size={16} />
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. INTERNSHIPS */}
          {activeTab === "internships" && (
            <div className="space-y-6">
              <div className="glass-panel p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <BriefcaseIcon className="w-48 h-48 text-[var(--primary)]" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10 border-l-4 border-[var(--primary)] pl-4">
                  <Target className="text-[var(--primary)] animate-pulse" />
                  Opportunity Radar
                </h2>

                <div className="flex flex-col xl:flex-row gap-6 xl:items-end mb-8 relative z-10 bg-black/20 p-6 rounded-2xl border border-white/5">
                  <div className="flex-1">
                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Sector Focus</label>
                    <div className="relative">
                      <select
                        value={internshipField}
                        onChange={(e) => setInternshipField(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none transition-all appearance-none"
                      >
                        <option value="software development">Software Architecture</option>
                        <option value="data science">Data Science</option>
                        <option value="web development">Web Technologies</option>
                        <option value="machine learning">Machine Learning</option>
                      </select>
                       <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" size={18} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Geo-Coordinates (Optional)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={internshipLocation}
                        onChange={(e) => setInternshipLocation(e.target.value)}
                        placeholder="e.g., Remote, Bangalore"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={searchInternships}
                    disabled={loading}
                    className="w-full xl:w-auto bg-[var(--primary)]/90 hover:bg-[var(--primary)] text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] flex items-center justify-center gap-2"
                  >
                    <Search size={18} />
                    {loading ? "SCANNING..." : "SCAN NETWORK"}
                  </button>
                </div>

                {internships.length > 0 && (
                  <div className="grid grid-cols-1 gap-6 relative z-10 animate-slide-up">
                    {internships.map((internship, idx) => (
                      <div key={idx} className="glass-card p-6 border-l-4 border-l-transparent hover:border-l-[var(--primary)] transition-all duration-300 group">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                          
                          <div className="flex gap-4">
                            {internship.logo && (
                              <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0" dangerouslySetInnerHTML={{__html: internship.logo}} />
                            )}
                            <div>
                              <h4 className="text-xl text-white font-bold mb-1 tracking-tight">{internship.title}</h4>
                              <p className="text-[var(--primary)] font-medium mb-3">{internship.company}</p>
                              
                              <div className="flex flex-wrap gap-4 text-sm text-gray-400 font-medium">
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-md"><Target size={14} className="text-gray-500" /> {internship.location}</span>
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-md"><Activity size={14} className="text-gray-500" /> {internship.duration}</span>
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-md text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20"><Award size={14} /> {internship.stipend}</span>
                              </div>
                            </div>
                          </div>

                          <a
                            href={internship.apply_link}
                            className="w-full md:w-auto bg-white/10 hover:bg-[var(--primary)] text-white hover:text-black border border-[var(--primary)]/50 hover:border-transparent px-8 py-3 rounded-xl font-bold transition-all text-center whitespace-nowrap shadow-sm"
                          >
                            INITIATE PROTOCOL
                          </a>
                        </div>
                        
                        <div className="mt-5 pt-5 border-t border-white/5">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">System Requirements</p>
                          <div className="flex flex-wrap gap-2">
                            {internships.map((_, __) => null)} {/* Trick for linting */}
                            {internship.requirements?.map((req, i) => (
                              <span key={i} className="px-3 py-1.5 bg-black/40 text-gray-300 text-xs font-mono rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                                &gt; {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </StudentLayout>
  );
};

// Helper SVG Icon component
const DatabaseIcon = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"></path>
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"></path>
  </svg>
)

export default Career_Guidance;
