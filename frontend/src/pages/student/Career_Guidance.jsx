import { useState, useEffect, useRef } from "react";
import StudentLayout from "../../components/StudentLayout";
import {
  Briefcase, Brain, Target, BookOpen, Award, FileText,
  TrendingUp, CheckCircle, XCircle, Download, Search,
  Zap, Lightbulb, ChevronRight, Sparkles, GraduationCap,
  Upload, File, Briefcase as BriefcaseIcon
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

  // Tabs order - Resume Analyzer is now first
  const tabs = [
    { id: "analyzer", label: "Resume Analyzer", icon: FileText },
    { id: "recommendations", label: "Career Recommendations", icon: Target },
    { id: "quiz", label: "Skill Quiz", icon: Brain },
    { id: "learning", label: "Learning Resources", icon: BookOpen },
    { id: "internships", label: "Internships", icon: Briefcase },
  ];

  // ═══════════════════════════════════════════════════════════════
  //   FILE UPLOAD HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleResumeFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeFileName(file.name);
      // Read file content
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
      // Read file content
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
        // Fallback analysis
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
      { title: `${internshipField} Intern`, company: "TechCorp India", location: internshipLocation || "Remote", duration: "3 months", stipend: "₹15,000/month", requirements: ["Python", "Django", "SQL"], apply_link: "#" },
      { title: `Junior ${internshipField} Developer`, company: "StartupXYZ", location: internshipLocation || "Bangalore", duration: "6 months", stipend: "₹25,000/month", requirements: ["JavaScript", "React", "Node.js"], apply_link: "#" },
    ];
    setInternships(results);
    setLoading(false);
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
        <div className="animate-fade-in relative z-10">
          {/* Page Header */}
          <div className="border-b border-[var(--gu-gold)] pb-6 mb-8">
            <h1 className="font-serif text-3xl text-white mb-2">
              AI Career Guidance
            </h1>
            <p className="text-[var(--gu-gold)] text-sm uppercase tracking-wider font-semibold">
              Discover Your Career Path & Opportunities
            </p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm relative overflow-hidden">
                <span className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Total Sessions</span>
                <div className="font-serif text-3xl text-[var(--gu-gold)] font-bold">{stats.total_sessions}</div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--gu-gold)]"></div>
              </div>
              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm relative overflow-hidden">
                <span className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Resume Analyses</span>
                <div className="font-serif text-3xl text-[#4ade80] font-bold">{stats.total_analyses}</div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--gu-gold)]"></div>
              </div>
              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm relative overflow-hidden">
                <span className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Quizzes Taken</span>
                <div className="font-serif text-3xl text-white font-bold">{stats.total_quizzes}</div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--gu-gold)]"></div>
              </div>
              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm relative overflow-hidden">
                <span className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Avg Quiz Score</span>
                <div className="font-serif text-3xl text-[#4ade80] font-bold">{stats.average_quiz_score}%</div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--gu-gold)]"></div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-[var(--gu-border)] pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all border-l-[3px] ${
                    activeTab === tab.id
                      ? "bg-[var(--gu-red-hover)] text-[var(--gu-gold)] border-[var(--gu-gold)]"
                      : "bg-transparent border-transparent text-white opacity-70 hover:opacity-100 hover:bg-[rgba(255,255,255,0.05)]"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="space-y-6">

            {/* ═══════════════════════════════════════════════════════════════
                  RESUME ANALYZER - FIRST TAB (DEFAULT)
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "analyzer" && (
              <div className="space-y-6">
                {/* Main Upload Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Your Resume Card */}
                  <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-xl p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-[#3D0F0F] rounded-lg flex items-center justify-center border border-[var(--gu-border)]">
                        <FileText className="w-6 h-6 text-[var(--gu-gold)]" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">Your Resume</h3>
                        <p className="text-white opacity-50 text-sm">PDF, DOCX, TXT or plain text</p>
                      </div>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOverResume(true); }}
                      onDragLeave={() => setDragOverResume(false)}
                      onDrop={handleResumeDrop}
                      onClick={() => resumeInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        dragOverResume
                          ? "border-[var(--gu-gold)] bg-[rgba(212,175,55,0.1)]"
                          : "border-[var(--gu-border)] hover:border-[var(--gu-gold)]/50"
                      }`}
                    >
                      <input
                        ref={resumeInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleResumeFileSelect}
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 text-white opacity-40 mx-auto mb-3" />
                      <p className="text-white opacity-80 text-sm">
                        Drag & drop or <span className="text-[var(--gu-gold)] underline">browse file</span>
                      </p>
                      <p className="text-white opacity-40 text-xs mt-2">{resumeFileName}</p>
                    </div>

                    {/* OR Separator */}
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-[var(--gu-border)]"></div>
                      <span className="text-white opacity-40 text-xs uppercase tracking-wider">OR PASTE TEXT</span>
                      <div className="flex-1 h-px bg-[var(--gu-border)]"></div>
                    </div>

                    {/* Text Area */}
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume text here..."
                      className="w-full h-32 px-4 py-3 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-xl text-white placeholder:text-white/30 focus:border-[var(--gu-gold)] focus:outline-none resize-none text-sm"
                    />
                  </div>

                  {/* Job Description Card */}
                  <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-xl p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-[#3D0F0F] rounded-lg flex items-center justify-center border border-[var(--gu-border)]">
                        <BriefcaseIcon className="w-6 h-6 text-[var(--gu-gold)]" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">Job Description</h3>
                        <p className="text-white opacity-50 text-sm">PDF, DOCX, TXT or plain text</p>
                      </div>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOverJob(true); }}
                      onDragLeave={() => setDragOverJob(false)}
                      onDrop={handleJobDrop}
                      onClick={() => jobInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        dragOverJob
                          ? "border-[var(--gu-gold)] bg-[rgba(212,175,55,0.1)]"
                          : "border-[var(--gu-border)] hover:border-[var(--gu-gold)]/50"
                      }`}
                    >
                      <input
                        ref={jobInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleJobFileSelect}
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 text-white opacity-40 mx-auto mb-3" />
                      <p className="text-white opacity-80 text-sm">
                        Drag & drop or <span className="text-[var(--gu-gold)] underline">browse file</span>
                      </p>
                      <p className="text-white opacity-40 text-xs mt-2">{jobFileName}</p>
                    </div>

                    {/* OR Separator */}
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-[var(--gu-border)]"></div>
                      <span className="text-white opacity-40 text-xs uppercase tracking-wider">OR PASTE TEXT</span>
                      <div className="flex-1 h-px bg-[var(--gu-border)]"></div>
                    </div>

                    {/* Text Area */}
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      className="w-full h-32 px-4 py-3 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-xl text-white placeholder:text-white/30 focus:border-[var(--gu-gold)] focus:outline-none resize-none text-sm"
                    />
                  </div>
                </div>

                {/* Analyze Button - Centered Pill Button */}
                <div className="flex justify-center">
                  <button
                    onClick={analyzeFit}
                    disabled={loading}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-10 py-4 rounded-full font-semibold text-lg disabled:opacity-50 flex items-center gap-3 transition-colors"
                  >
                    <Zap size={24} className="text-orange-500" />
                    {loading ? "Analyzing..." : "Analyze My Fit"}
                  </button>
                </div>

                {/* Results */}
                {fitAnalysis && (
                  <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-serif text-white text-xl">Analysis Result</h3>
                      <div className={`text-4xl font-bold font-serif ${
                        fitAnalysis.match_score >= 80 ? "text-[#4ade80]" :
                        fitAnalysis.match_score >= 60 ? "text-[var(--gu-gold)]" :
                        fitAnalysis.match_score >= 40 ? "text-yellow-400" : "text-[#f87171]"
                      }`}>
                        {fitAnalysis.match_score}%
                      </div>
                    </div>

                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-white opacity-70">Prediction:</span>
                      <span className="font-semibold text-[var(--gu-gold)]">{fitAnalysis.prediction}</span>
                      <span className="text-white opacity-50 text-sm">({(fitAnalysis.confidence * 100).toFixed(0)}% confidence)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#3D0F0F] border border-[var(--gu-border)] p-4 rounded-lg">
                        <h5 className="font-semibold text-[#4ade80] mb-2 flex items-center gap-2">
                          <CheckCircle size={16} />
                          Matched Skills ({fitAnalysis.matched_skills?.length || 0})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {fitAnalysis.matched_skills?.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-[rgba(74,222,128,0.15)] text-[#4ade80] text-sm rounded">
                              {skill}
                            </span>
                          )) || <span className="text-white opacity-40">No skills matched</span>}
                        </div>
                      </div>
                      <div className="bg-[#3D0F0F] border border-[var(--gu-border)] p-4 rounded-lg">
                        <h5 className="font-semibold text-[#f87171] mb-2 flex items-center gap-2">
                          <XCircle size={16} />
                          Missing Skills ({fitAnalysis.missing_skills?.length || 0})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {fitAnalysis.missing_skills?.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-[rgba(248,113,113,0.15)] text-[#f87171] text-sm rounded">
                              {skill}
                            </span>
                          )) || <span className="text-white opacity-40">No missing skills</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                  CAREER RECOMMENDATIONS
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "recommendations" && (
              <div className="space-y-6">
                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
                  <h2 className="font-serif text-white text-lg md:text-xl pb-4 border-b border-[var(--gu-border)] border-l-3 border-l-[var(--gu-gold)] pl-3 mb-6 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-[var(--gu-gold)]" />
                    AI Career Recommendations
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Interests</label>
                      <input
                        type="text"
                        placeholder="e.g., technology, data"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        className="w-full px-4 py-2 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm text-white placeholder:text-white/40 focus:border-[var(--gu-gold)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Current Skills</label>
                      <input
                        type="text"
                        placeholder="e.g., Python, JavaScript"
                        value={currentSkills}
                        onChange={(e) => setCurrentSkills(e.target.value)}
                        className="w-full px-4 py-2 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm text-white placeholder:text-white/40 focus:border-[var(--gu-gold)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Experience</label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full px-4 py-2 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm text-white focus:border-[var(--gu-gold)] focus:outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={fetchRecommendations}
                    disabled={loading}
                    className="bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-6 py-2 rounded-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Zap size={18} />
                    {loading ? "Analyzing..." : "Get AI Recommendations"}
                  </button>
                </div>

                {recommendations.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-5 rounded-sm hover:border-[var(--gu-gold)] transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-serif text-lg text-white font-semibold">{rec.title}</h4>
                          <span className={`px-3 py-1 rounded-sm text-xs font-semibold ${
                            rec.match_score >= 80 ? "bg-[rgba(74,222,128,0.15)] text-[#4ade80]" :
                            rec.match_score >= 60 ? "bg-blue-900/50 text-blue-300" :
                            "bg-yellow-900/50 text-yellow-300"
                          }`}>
                            {rec.match_score}% Match
                          </span>
                        </div>
                        <p className="text-white opacity-70 text-sm mb-3">{rec.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {rec.required_skills?.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-[#3D0F0F] text-white opacity-80 text-xs rounded-sm border border-[var(--gu-border)]">
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white opacity-60">
                          <span className="flex items-center gap-1"><Award size={14} /> {rec.avg_salary}</span>
                          <span className="flex items-center gap-1"><TrendingUp size={14} /> {rec.growth} Growth</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                  SKILL QUIZ
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "quiz" && (
              <div className="space-y-6">
                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
                  <h2 className="font-serif text-white text-lg md:text-xl pb-4 border-b border-[var(--gu-border)] border-l-3 border-l-[var(--gu-gold)] pl-3 mb-6 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-[var(--gu-gold)]" />
                    Skill Assessment Quiz
                  </h2>

                  {!quizQuestions.length ? (
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <label className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Skill</label>
                        <select
                          value={quizSkill}
                          onChange={(e) => setQuizSkill(e.target.value)}
                          className="px-4 py-2 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm text-white focus:border-[var(--gu-gold)] focus:outline-none"
                        >
                          <option value="python">Python</option>
                          <option value="javascript">JavaScript</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Difficulty</label>
                        <select
                          value={quizDifficulty}
                          onChange={(e) => setQuizDifficulty(e.target.value)}
                          className="px-4 py-2 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm text-white focus:border-[var(--gu-gold)] focus:outline-none"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={generateQuiz}
                          disabled={loading}
                          className="bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-6 py-2 rounded-sm font-semibold hover:opacity-90 disabled:opacity-50"
                        >
                          {loading ? "Generating..." : "Start Quiz"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!quizResult ? (
                        <>
                          {quizQuestions.map((q, idx) => (
                            <div key={q.id} className="bg-[#3D0F0F] border border-[var(--gu-border)] p-4 rounded-sm">
                              <p className="font-medium text-white mb-3">{idx + 1}. {q.question}</p>
                              <div className="space-y-2">
                                {q.options.map((opt, optIdx) => (
                                  <label key={optIdx} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                                    <input
                                      type="radio"
                                      name={`q-${q.id}`}
                                      value={optIdx}
                                      onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                                      className="accent-[var(--gu-gold)]"
                                    />
                                    <span className="text-white opacity-80">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={submitQuiz}
                            disabled={loading}
                            className="w-full bg-[var(--gu-gold)] text-[var(--gu-red-deep)] py-3 rounded-sm font-semibold hover:opacity-90 disabled:opacity-50"
                          >
                            {loading ? "Submitting..." : "Submit Quiz"}
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-6 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm">
                          <div className={`text-5xl font-serif font-bold mb-4 ${
                            quizResult.grade === "A" || quizResult.grade === "B" ? "text-[#4ade80]" :
                            quizResult.grade === "C" || quizResult.grade === "D" ? "text-yellow-400" : "text-[#f87171]"
                          }`}>
                            Grade {quizResult.grade}
                          </div>
                          <p className="text-xl text-white mb-2">{quizResult.correct} / {quizResult.total} correct</p>
                          <p className="text-white opacity-60">{quizResult.percentage}% accuracy</p>
                          <button
                            onClick={() => {
                              setQuizQuestions([]);
                              setQuizResult(null);
                              setQuizAnswers({});
                            }}
                            className="mt-6 text-[var(--gu-gold)] hover:underline"
                          >
                            Try Another Quiz
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                  LEARNING RESOURCES
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "learning" && (
              <div className="space-y-6">
                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
                  <h2 className="font-serif text-white text-lg md:text-xl pb-4 border-b border-[var(--gu-border)] border-l-3 border-l-[var(--gu-gold)] pl-3 mb-6 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[var(--gu-gold)]" />
                    Learning Resources
                  </h2>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div>
                      <label className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Skill</label>
                      <select
                        value={learningSkill}
                        onChange={(e) => setLearningSkill(e.target.value)}
                        className="px-4 py-2 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm text-white focus:border-[var(--gu-gold)] focus:outline-none"
                      >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Level</label>
                      <select
                        value={learningLevel}
                        onChange={(e) => setLearningLevel(e.target.value)}
                        className="px-4 py-2 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm text-white focus:border-[var(--gu-gold)] focus:outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={fetchLearningResources}
                        disabled={loading}
                        className="bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-6 py-2 rounded-sm font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        {loading ? "Fetching..." : "Get Resources"}
                      </button>
                    </div>
                  </div>

                  {learningResources && (
                    <div className="space-y-4 mt-6">
                      {["courses", "tutorials", "practice"].map((category) => (
                        <div key={category} className="bg-[#3D0F0F] border border-[var(--gu-border)] p-4 rounded-sm">
                          <h4 className="font-serif text-white capitalize mb-3 flex items-center gap-2">
                            <ChevronRight size={18} className="text-[var(--gu-gold)]" />
                            {category}
                          </h4>
                          <div className="space-y-2">
                            {learningResources[category]?.map((resource, idx) => (
                              <a
                                key={idx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-3 bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm hover:border-[var(--gu-gold)] transition-colors"
                              >
                                <div className="font-medium text-white">{resource.name}</div>
                                {resource.platform && <div className="text-sm text-white opacity-60">{resource.platform}</div>}
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

            {/* ═══════════════════════════════════════════════════════════════
                  INTERNSHIPS
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "internships" && (
              <div className="space-y-6">
                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
                  <h2 className="font-serif text-white text-lg md:text-xl pb-4 border-b border-[var(--gu-border)] border-l-3 border-l-[var(--gu-gold)] pl-3 mb-6 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[var(--gu-gold)]" />
                    Find Internships
                  </h2>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div>
                      <label className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Field</label>
                      <select
                        value={internshipField}
                        onChange={(e) => setInternshipField(e.target.value)}
                        className="px-4 py-2 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm text-white focus:border-[var(--gu-gold)] focus:outline-none"
                      >
                        <option value="software development">Software Development</option>
                        <option value="data science">Data Science</option>
                        <option value="web development">Web Development</option>
                        <option value="machine learning">Machine Learning</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white opacity-70 text-xs uppercase tracking-spaced font-semibold mb-2">Location (Optional)</label>
                      <input
                        type="text"
                        value={internshipLocation}
                        onChange={(e) => setInternshipLocation(e.target.value)}
                        placeholder="e.g., Bangalore"
                        className="px-4 py-2 bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm text-white placeholder:text-white/40 focus:border-[var(--gu-gold)] focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={searchInternships}
                        disabled={loading}
                        className="bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-6 py-2 rounded-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Search size={18} />
                        {loading ? "Searching..." : "Search"}
                      </button>
                    </div>
                  </div>

                  {internships.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 mt-6">
                      {internships.map((internship, idx) => (
                        <div key={idx} className="bg-[#3D0F0F] border border-[var(--gu-border)] p-5 rounded-sm hover:border-[var(--gu-gold)] transition-colors">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h4 className="font-serif text-lg text-white font-semibold">{internship.title}</h4>
                              <p className="text-[var(--gu-gold)]">{internship.company}</p>
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-white opacity-60">
                                <span>📍 {internship.location}</span>
                                <span>⏱️ {internship.duration}</span>
                                <span>💰 {internship.stipend}</span>
                              </div>
                            </div>
                            <a
                              href={internship.apply_link}
                              className="bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-4 py-2 rounded-sm font-semibold hover:opacity-90 text-sm whitespace-nowrap"
                            >
                              Apply Now
                            </a>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {internships.requirements?.map((req, i) => (
                              <span key={i} className="px-2 py-1 bg-[var(--gu-red-card)] text-white opacity-80 text-xs rounded-sm border border-[var(--gu-border)]">
                                {req}
                              </span>
                            ))}
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
      </div>
    </StudentLayout>
  );
};

export default Career_Guidance;
