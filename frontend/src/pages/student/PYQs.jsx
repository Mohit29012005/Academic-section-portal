import React, { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import { Download, Loader2, AlertCircle, Sparkles, ChevronRight, BookOpen } from "lucide-react";
import { academicsAPI } from "../../services/api";

const fallbackQuestions = [
  "Explain the fundamental concepts and architecture of this subject with a neat diagram.",
  "What are the key applications in real-world scenarios? Explain with suitable examples.",
  "Differentiate between theoretical and practical approaches in detail with examples.",
  "Write short notes on recent advancements and emerging trends in this field.",
  "Explain the major components involved with suitable diagrams and their functions.",
  "What are the advantages, disadvantages, and limitations? Discuss in detail.",
  "Describe the step-by-step implementation process with an example.",
  "Explain with suitable diagrams and examples, the working mechanism.",
  "Compare different methodologies and techniques used with a tabular format.",
  "What are the future trends and developments in this domain? Explain briefly.",
  "Define the key terminology and explain each with a real-world example.",
  "What is the significance of this concept in modern computing? Justify your answer.",
  "Discuss the challenges and issues faced in implementation. How are they resolved?",
  "Explain the lifecycle or phases involved with a suitable flowchart.",
  "What are the types or classifications? Explain each with suitable examples.",
  "Discuss any two real-world case studies where this concept has been applied.",
  "Explain the relationship between the main components using a block diagram.",
  "State and explain the fundamental theorems or principles related to this topic.",
  "Write an algorithm or pseudocode for the given problem and trace it with an example.",
  "Explain the input-output model and data flow with a diagram.",
  "Compare and contrast the two major approaches with tabular representation.",
  "What are the performance metrics used to evaluate this system? Explain each.",
  "Describe the evolution or historical development of this concept.",
  "Explain error handling and exception management in the context of this topic.",
  "What is the role of standards and protocols in this domain? Explain with examples.",
];

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};


const PYQs = () => {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [examType, setExamType] = useState("external");
  const [generatedPaper, setGeneratedPaper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    academicsAPI.courses().then(r => setCourses(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (course && semester) {
      academicsAPI.subjects({ course_id: course, semester }).then(r => setSubjects(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    } else { setSubjects([]); }
  }, [course, semester]);

  const selectedCourse = courses.find(c => c.course_id === course);
  const selectedSubject = subjects.find(s => s.subject_id === subjectId);
  const totalSems = selectedCourse?.total_semesters || 8;

  const handleGenerate = async () => {
    if (!course || !semester || !subjectId) { setError("Please complete all selections."); return; }
    setLoading(true); setError("");
    try {
      // Backend now returns subject-specific, pre-shuffled questions based on subject name/topic
      const res = await academicsAPI.pyqSearch({ subject_id: subjectId });
      const apiQs = Array.isArray(res.data) ? res.data : [];

      // Extract question texts directly — no parsing needed, backend handles it
      let pool = apiQs
        .map(q => (q.question_text || "").trim())
        .filter(q => q.length > 10);

      // If backend returned nothing, use fallback (should rarely happen now)
      if (pool.length < 15) {
        const extra = fallbackQuestions.filter(q => !pool.includes(q));
        pool = [...pool, ...extra];
      }

      // Mark questions that appear multiple times (from DB) as important
      const seen = {};
      apiQs.forEach(q => {
        const k = (q.question_text || "").trim().toLowerCase();
        seen[k] = (seen[k] || 0) + 1;
      });

      // Build structured list — DB duplicates = IMP, rest based on position
      const structured = pool.map((q, i) => ({
        text: q,
        isImp: (seen[q.toLowerCase()] || 0) > 1 || i < Math.ceil(pool.length * 0.6),
      }));

      // Real GU paper structure:
      // External: Q-1 = 9 options (any 5), Q-2 = 2 (any 2), Q-3 = 2 (any 2), Q-4 = 3 (any 1)
      // Internal:  Q-1 = 5 options (any 4), Q-2 = 3 (any 2)
      const isExt = examType === "external";
      setGeneratedPaper({
        course: selectedCourse?.name || "Course",
        semester,
        subject_code: selectedSubject?.code || "",
        subject_name: selectedSubject?.name || "",
        exam_type: isExt ? "External" : "Internal",
        total_marks: isExt ? 60 : 30,
        time: isExt ? "3 Hours" : "1.5 Hours",
        section1: structured.slice(0, isExt ? 7 : 5).map(q => ({ question: q.text, isImp: q.isImp })),
        q2a:      structured.slice(isExt ? 7 : 5, isExt ? 10 : 8).map(q => ({ question: q.text, isImp: q.isImp })),
        q3:       structured.slice(isExt ? 10 : 8, isExt ? 13 : 11).map(q => ({ question: q.text, isImp: q.isImp })),
        q4:       structured.slice(isExt ? 13 : 11, isExt ? 15 : 13).map(q => ({ question: q.text, isImp: q.isImp })),
      });
    } catch (err) {
      setError(err.message || "Failed to generate paper.");
    } finally { setLoading(false); }
  };


  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${generatedPaper.subject_code}_Paper</title>
        <style>
          @media print {
            @page { size: A4; margin: 12mm; }
            body { -webkit-print-color-adjust: exact; background: white; }
          }
          body { font-family: 'Times New Roman', serif; font-size: 14px; padding: 10px; color: black; }
          
          .top-right { text-align: right; margin-bottom: 20px; font-size: 15px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 22px; font-weight: bold; margin: 0 0 5px 0; }
          .header h2 { font-size: 16px; font-weight: normal; margin: 0 0 5px 0; }
          .header h3 { font-size: 16px; font-weight: normal; margin: 0; }
          
          .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px; }
          
          .instructions { margin-bottom: 20px; line-height: 1.4; font-size: 14px; }
          .instructions h4 { margin: 0 0 5px 0; text-decoration: underline; font-weight: bold; font-size: 15px; }
          .instructions ol { margin: 0; padding-left: 25px; }
          
          table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px; }
          th, td { border: 1px solid black; padding: 6px 8px; text-align: left; vertical-align: top; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .w-num { width: 5%; }
          .w-marks { width: 8%; }
          .w-co { width: 8%; }
          .w-bloom { width: 15%; }
        </style>
      </head>
      <body>
        <div class="top-right">
            Enrollment No. ________________________
        </div>
        <div class="header">
          <h1>GANPAT UNIVERSITY</h1>
          <h2>${generatedPaper.course} Sem-${generatedPaper.semester} Regular April-June 2024</h2>
          <h3>${generatedPaper.subject_code}: ${generatedPaper.subject_name}</h3>
        </div>
        <div class="info-row">
          <span>Time: ${generatedPaper.time}</span>
          <span>Total: ${generatedPaper.total_marks} Marks</span>
        </div>
        
        <div class="instructions">
            <h4>Instructions:</h4>
            <ol>
                <li>Figures to the right indicate full marks, Course Outcomes and BL Pattern Level.</li>
                <li>This Question paper has two sections. Each section should be written in a separate answer book.</li>
                <li>Section-I consist of 07 questions of 6 marks each with options respectively. Section-II consist of 03 questions, Question 2 of 12 Marks, Question 3 of 12 Marks and Question 4 of 6 Marks with options respectively.</li>
                <li>Be precise and to the point in your answer.</li>
                <li>CO is Course Outcome from the Subject Syllabus.</li>
                <li>Bloom's Taxonomy Based Assessment Pattern: BTL1-Remember; BTL2-Understand; BTL3-Apply; BTL4-Analyze; BTL5-Evaluate; BTL6-Create.</li>
            </ol>
        </div>

        <table>
            <tbody>
                <tr>
                    <td colspan="5" class="center bold">Section - I</td>
                </tr>
                <tr>
                    <td class="bold w-num">Q-1</td>
                    <td class="bold">Answer the following. (Any 5)</td>
                    <td class="center bold w-marks">Marks<br/>30</td>
                    <td class="center bold w-co">CO</td>
                    <td class="center bold w-bloom">Bloom's<br/>Taxonomy</td>
                </tr>
                ${generatedPaper.section1.map((q, i) => `
                <tr>
                    <td class="center">${i+1}</td>
                    <td>${q.question} ${q.isImp ? `<span style="margin-left:8px; font-size:11px; font-weight:bold; border:1px solid #b91c1c; color:#b91c1c; padding:2px 4px; border-radius:3px; background-color:#fee2e2;">IMP</span>` : ''}</td>
                    <td class="center">06</td>
                    <td class="center">CO${(i % 4) + 1}</td>
                    <td class="center">BTL${(i % 5) + 1}</td>
                </tr>
                `).join('')}

                ${generatedPaper.exam_type === "External" ? `
                <tr>
                    <td colspan="5" class="center bold">Section - II</td>
                </tr>
                <tr>
                    <td class="bold">Q-2</td>
                    <td class="bold">Answer the following (Any Two)</td>
                    <td class="center bold">Marks<br/>12</td>
                    <td class="center bold">CO</td>
                    <td class="center bold">Bloom's<br/>Taxonomy</td>
                </tr>
                ${generatedPaper.q2a.map((q, i) => `
                <tr>
                    <td class="center">${i+1}</td>
                    <td>${q.question} ${q.isImp ? `<span style="margin-left:8px; font-size:11px; font-weight:bold; border:1px solid #b91c1c; color:#b91c1c; padding:2px 4px; border-radius:3px; background-color:#fee2e2;">IMP</span>` : ''}</td>
                    <td class="center">06</td>
                    <td class="center">CO${(i % 4) + 1}</td>
                    <td class="center">BTL${(i % 5) + 1}</td>
                </tr>
                `).join('')}

                <tr>
                    <td class="bold">Q.3</td>
                    <td class="bold">Answer the following: (Any Two)</td>
                    <td class="center bold">12</td>
                    <td></td>
                    <td></td>
                </tr>
                ${generatedPaper.q3.map((q, i) => `
                <tr>
                    <td class="center">${i+1}</td>
                    <td>${q.question} ${q.isImp ? `<span style="margin-left:8px; font-size:11px; font-weight:bold; border:1px solid #b91c1c; color:#b91c1c; padding:2px 4px; border-radius:3px; background-color:#fee2e2;">IMP</span>` : ''}</td>
                    <td class="center">06</td>
                    <td class="center">CO${(i % 4) + 1}</td>
                    <td class="center">BTL${(i % 5) + 1}</td>
                </tr>
                `).join('')}

                <tr>
                    <td class="bold">Q.4</td>
                    <td class="bold">Answer the following: (Any One)</td>
                    <td class="center bold">06</td>
                    <td></td>
                    <td></td>
                </tr>
                ${generatedPaper.q4.map((q, i) => `
                <tr>
                    <td class="center">${i+1}</td>
                    <td>${q.question} ${q.isImp ? `<span style="margin-left:8px; font-size:11px; font-weight:bold; border:1px solid #b91c1c; color:#b91c1c; padding:2px 4px; border-radius:3px; background-color:#fee2e2;">IMP</span>` : ''}</td>
                    <td class="center">06</td>
                    <td class="center">CO${(i % 4) + 1}</td>
                    <td class="center">BTL${(i % 5) + 1}</td>
                </tr>
                `).join('')}
                ` : ''}
            </tbody>
        </table>
        
        <p style="text-align:center; margin-top:30px; font-weight: bold; font-size: 16px;">** End of the Paper **</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };



  return (
    <StudentLayout>
      <div className="relative min-h-screen pb-12">
        {/* BG orbs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[450px] h-[450px] bg-purple-900/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 -left-20 w-[350px] h-[350px] bg-[var(--gu-gold)]/5 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-1">

          {/* Header */}
          <div className="mb-8 pt-2">
            <p className="text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.3em] mb-1 flex items-center gap-2">
              <BookOpen className="w-3 h-3" /> AI Question Bank
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-white tracking-tight">Previous Year Papers</h1>
            <p className="text-white/35 text-xs mt-1">Generate AI-powered exam prep papers from historical data</p>
          </div>

          {!generatedPaper ? (
            <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-[#1e0505]/80 to-[#130303]/80 backdrop-blur-xl p-7">

              {/* Step indicators */}
              <div className="flex items-center gap-2 mb-7">
                {["Course", "Semester", "Subject", "Exam Type"].map((step, i) => {
                  const done = (i === 0 && course) || (i === 1 && semester) || (i === 2 && subjectId) || (i === 3 && examType);
                  return (
                    <React.Fragment key={step}>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${done ? 'bg-[var(--gu-gold)]/15 border-[var(--gu-gold)]/40 text-[var(--gu-gold)]' : 'bg-white/3 border-white/8 text-white/30'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${done ? 'bg-[var(--gu-gold)] text-black' : 'bg-white/10 text-white/30'}`}>{i+1}</span>
                        {step}
                      </div>
                      {i < 3 && <ChevronRight className="w-3 h-3 text-white/15 flex-shrink-0" />}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <SelectField label="Course" value={course} onChange={e => { setCourse(e.target.value); setSemester(""); setSubjectId(""); }}>
                  <option value="">Select course...</option>
                  {courses.map(c => <option key={c.course_id} value={c.course_id} className="bg-[#1e0505]">{c.name}</option>)}
                </SelectField>

                <SelectField label="Semester" value={semester} onChange={e => { setSemester(e.target.value); setSubjectId(""); }} disabled={!course}>
                  <option value="">Select semester...</option>
                  {Array.from({ length: totalSems - 1 }, (_, i) => i + 1).map(s => (
                    <option key={s} value={s} className="bg-[#1e0505]">Semester {s}</option>
                  ))}
                </SelectField>

                <SelectField label="Subject" value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!semester}>
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s.subject_id} value={s.subject_id} className="bg-[#1e0505]">{s.code} — {s.name}</option>)}
                </SelectField>

                <SelectField label="Exam Type" value={examType} onChange={e => setExamType(e.target.value)}>
                  <option value="external" className="bg-[#1e0505]">External Exam (60 Marks)</option>
                  <option value="internal" className="bg-[#1e0505]">Internal Exam (30 Marks)</option>
                </SelectField>
              </div>

              {error && (
                <div className="mb-5 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!subjectId || loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--gu-gold)] to-yellow-500 text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? "Generating Paper..." : "Generate AI Paper"}
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 bg-[var(--gu-red-card)] p-4 rounded-sm border border-[var(--gu-border)] mx-auto">
                <button onClick={() => setGeneratedPaper(null)} className="text-white/70 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 uppercase tracking-wide">
                  <AlertCircle size={16} /> Discard Paper
                </button>
                <button onClick={handleDownloadPDF} className="bg-[var(--gu-gold)] text-[var(--gu-red-card)] px-4 py-2 rounded-sm font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-yellow-500 transition-colors">
                  <Download size={16} /> Download PDF
                </button>
              </div>

              <div className="bg-[#fdfdfd] text-black p-12 rounded shadow-2xl mx-auto max-w-[210mm] min-h-[297mm] font-serif border border-gray-300 mb-8">
                <div className="text-right text-sm mb-4">
                  Enrollment No. <span className="inline-block w-48 border-b border-black"></span>
                </div>
                
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-1">GANPAT UNIVERSITY</h1>
                  <h2 className="text-lg mb-1">{generatedPaper.course} Sem-${generatedPaper.semester} Regular April-June 2024</h2>
                  <h3 className="text-lg">{generatedPaper.subject_code}: {generatedPaper.subject_name}</h3>
                </div>
                
                <div className="flex justify-between text-sm mb-4">
                  <span>Time: {generatedPaper.time}</span>
                  <span>Total: {generatedPaper.total_marks} Marks</span>
                </div>
                
                <div className="text-sm mb-6 leading-relaxed">
                  <h4 className="font-bold underline mb-2">Instructions:</h4>
                  <ol className="list-decimal pl-6">
                    <li>Figures to the right indicate full marks, Course Outcomes and BL Pattern Level.</li>
                    <li>This Question paper has two sections. Each section should be written in a separate answer book.</li>
                    <li>Section-I consist of 07 questions of 6 marks each with options respectively. Section-II consist of 03 questions, Question 2 of 12 Marks, Question 3 of 12 Marks and Question 4 of 6 Marks with options respectively.</li>
                    <li>Be precise and to the point in your answer.</li>
                    <li>CO is Course Outcome from the Subject Syllabus.</li>
                    <li>Bloom's Taxonomy Based Assessment Pattern: BTL1-Remember; BTL2-Understand; BTL3-Apply; BTL4-Analyze; BTL5-Evaluate; BTL6-Create.</li>
                  </ol>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-sm text-left">
                    <tbody>
                      <tr>
                        <td colSpan="5" className="border border-black text-center font-bold py-2 bg-gray-50/50">Section - I</td>
                      </tr>
                      <tr>
                        <td className="border border-black font-bold p-2 w-[5%]">Q-1</td>
                        <td className="border border-black font-bold p-2">Answer the following. (Any 5)</td>
                        <td className="border border-black font-bold p-2 text-center w-[10%]">Marks<br/>30</td>
                        <td className="border border-black font-bold p-2 text-center w-[8%]">CO</td>
                        <td className="border border-black font-bold p-2 text-center w-[15%]">Bloom's<br/>Taxonomy</td>
                      </tr>
                      
                      {generatedPaper.section1.map((q, i) => (
                        <tr key={`q1-${i}`}>
                          <td className="border border-black p-2 text-center">{i+1}</td>
                          <td className="border border-black p-2 whitespace-pre-line text-justify">
                            {q.question}
                            {q.isImp && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold border border-red-300 rounded">IMP</span>}
                          </td>
                          <td className="border border-black p-2 text-center">06</td>
                          <td className="border border-black p-2 text-center">CO{(i % 4) + 1}</td>
                          <td className="border border-black p-2 text-center">BTL{(i % 5) + 1}</td>
                        </tr>
                      ))}
                      
                      {generatedPaper.exam_type === "External" && (
                        <>
                          <tr>
                            <td colSpan="5" className="border border-black text-center font-bold py-2 bg-gray-50/50">Section - II</td>
                          </tr>
                          <tr>
                            <td className="border border-black font-bold p-2">Q-2</td>
                            <td className="border border-black font-bold p-2">Answer the following (Any Two)</td>
                            <td className="border border-black font-bold p-2 text-center">Marks<br/>12</td>
                            <td className="border border-black font-bold p-2 text-center">CO</td>
                            <td className="border border-black font-bold p-2 text-center">Bloom's<br/>Taxonomy</td>
                          </tr>
                          {generatedPaper.q2a.map((q, i) => (
                            <tr key={`q2a-${i}`}>
                              <td className="border border-black p-2 text-center">{i+1}</td>
                              <td className="border border-black p-2 whitespace-pre-line text-justify">
                                {q.question}
                                {q.isImp && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold border border-red-300 rounded">IMP</span>}
                              </td>
                              <td className="border border-black p-2 text-center">06</td>
                              <td className="border border-black p-2 text-center">CO{(i % 4) + 1}</td>
                              <td className="border border-black p-2 text-center">BTL{(i % 5) + 1}</td>
                            </tr>
                          ))}
                          
                          <tr>
                            <td className="border border-black font-bold p-2">Q.3</td>
                            <td className="border border-black font-bold p-2">Answer the following: (Any Two)</td>
                            <td className="border border-black font-bold p-2 text-center">12</td>
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                          </tr>
                          {generatedPaper.q3.map((q, i) => (
                            <tr key={`q3-${i}`}>
                              <td className="border border-black p-2 text-center">{i+1}</td>
                              <td className="border border-black p-2 whitespace-pre-line text-justify">
                                {q.question}
                                {q.isImp && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold border border-red-300 rounded">IMP</span>}
                              </td>
                              <td className="border border-black p-2 text-center">06</td>
                              <td className="border border-black p-2 text-center">CO{(i % 4) + 1}</td>
                              <td className="border border-black p-2 text-center">BTL{(i % 5) + 1}</td>
                            </tr>
                          ))}
                          
                          <tr>
                            <td className="border border-black font-bold p-2">Q.4</td>
                            <td className="border border-black font-bold p-2">Answer the following: (Any One)</td>
                            <td className="border border-black font-bold p-2 text-center">06</td>
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                          </tr>
                          {generatedPaper.q4.map((q, i) => (
                            <tr key={`q4-${i}`}>
                              <td className="border border-black p-2 text-center">{i+1}</td>
                              <td className="border border-black p-2 whitespace-pre-line text-justify">
                                {q.question}
                                {q.isImp && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold border border-red-300 rounded">IMP</span>}
                              </td>
                              <td className="border border-black p-2 text-center">06</td>
                              <td className="border border-black p-2 text-center">CO{(i % 4) + 1}</td>
                              <td className="border border-black p-2 text-center">BTL{(i % 5) + 1}</td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-center mt-12 font-bold opacity-80 text-lg">** End of the Paper **</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

const SelectField = ({ label, children, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</label>
    <select
      {...props}
      className="w-full bg-white/4 border border-white/10 text-white px-4 py-3 rounded-xl text-sm outline-none focus:border-[var(--gu-gold)]/50 focus:bg-white/6 disabled:opacity-30 disabled:cursor-not-allowed transition-all appearance-none cursor-pointer"
    >
      {children}
    </select>
  </div>
);

export default PYQs;
