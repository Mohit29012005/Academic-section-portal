import { useState, useRef, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import { FileText, Download, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { academicsAPI } from "../../services/api";

const fallbackQuestions = {
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
  ]
};

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
  const paperRef = useRef(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await academicsAPI.courses();
        setCourses(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (course && semester) {
      const fetchSubjects = async () => {
        try {
          const response = await academicsAPI.subjects({ course_id: course, semester });
          setSubjects(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
          console.error("Failed to fetch subjects:", err);
        }
      };
      fetchSubjects();
    } else {
      setSubjects([]);
    }
  }, [course, semester]);

  const handleCourseChange = (e) => {
    setCourse(e.target.value);
    setSemester("");
    setSubjectId("");
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
    setSubjectId("");
  };

  const handleGenerate = async () => {
    if (!course || !semester || !subjectId) {
      setError("Please select course, semester and subject");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const subject = subjects.find((s) => s.subject_id === subjectId);
      const courseObj = courses.find(c => c.course_id === course);
      
      const response = await academicsAPI.pyqSearch({ subject_id: subjectId });
      console.log("PYQ Response:", response);
      
      if (response.success === false) {
        throw new Error(response.error || "Failed to fetch questions");
      }
      
      const dbQuestions = response.data || [];
      
      const processRawText = (text) => {
          if (!text) return [];
          let clean = text.replace(/SECTION-[I|V]+|Answer the following|Any [a-zA-Z0-9]+ out of [a-zA-Z0-9]+|GANPAT UNIVERSITY|END OF THE PAPER|\[06\]|MARKS\s*\d+/gi, "");
          const markerRegex = /\s*(\[[a-zA-Z0-9]\]|\([a-zA-Z0-9]\)|\{[a-zA-Z0-9]\}|[a-zA-Z0-9][\)\.\]]|Q-[0-9]+|Q[0-9]+)\s*/g;
          let segments = clean.split(markerRegex);
          let subQuestions = [];
          for (let seg of segments) {
              let s = seg.trim();
              if (!s || s.length < 5) continue;
              if (s.match(/^(\[[a-zA-Z0-9]\]|\([a-zA-Z0-9]\)|\{[a-zA-Z0-9]\}|[a-zA-Z0-9][\)\.\]]|Q-[0-9]+|Q[0-9]+)$/)) continue;
              let subParts = s.split(/\?\s+(?=[A-Z])/);
              for (let part of subParts) {
                  let p = part.trim();
                  if (p.endsWith("?")) p = p.slice(0, -1);
                  let keywords = p.split(/\s+(?=Explain|What is|Write a|Discuss|Describe|Draw|Define|List out|State the)/);
                  for (let kwPart of keywords) {
                      let finalQ = kwPart.trim();
                      if (finalQ.length > 15) {
                          if (finalQ.toLowerCase().startsWith("what") || finalQ.toLowerCase().startsWith("how")) {
                              if (!finalQ.endsWith("?")) finalQ += "?";
                          }
                          subQuestions.push(finalQ);
                      }
                  }
              }
          }
          return subQuestions.filter(q => q.length > 20 && !q.match(/^Any [a-zA-Z]+$/i));
      };
      
      let questions = [];
      if (Array.isArray(dbQuestions) && dbQuestions.length > 0) {
        questions = dbQuestions.flatMap(q => processRawText(q.question_text));
      } else {
        questions = fallbackQuestions.general;
      }
      questions = [...new Set(questions)];
      if (questions.length < 5) questions = [...questions, ...fallbackQuestions.general];

      const shuffled = shuffleArray(questions);

      const paper = {
        course: courseObj?.name || "Academic Track",
        semester: semester,
        subject_code: subject.code,
        subject_name: subject.name,
        exam_type: examType === "external" ? "External" : "Internal",
        total_marks: examType === "external" ? 60 : 30,
        time: examType === "external" ? "3 Hours" : "1.5 Hours",
        section1: shuffled.slice(0, 9).map((q, i) => ({
          question: q,
          importance: i < 3 ? "HIGH" : i < 6 ? "MEDIUM" : "NORMAL",
        })),
        q2a: (shuffled.length > 11 ? shuffled.slice(9, 11) : shuffled.slice(0, 2)).map((q) => ({ question: q })),
        q2b: (shuffled.length > 13 ? shuffled.slice(11, 13) : shuffled.slice(2, 4)).map((q) => ({ question: q })),
        q3: (shuffled.length > 15 ? shuffled.slice(13, 15) : shuffled.slice(4, 6)).map((q) => ({ question: q })),
        q4: (shuffled.length > 18 ? shuffled.slice(15, 18) : shuffled.slice(6, 9)).map((q) => ({ question: q })),
        q5: (shuffled.length > 20 ? shuffled.slice(18, 20) : shuffled.slice(0, 2)).map((q) => ({ question: q })),
      };

      setGeneratedPaper(paper);
    } catch (err) {
      console.error("Generate paper error:", err);
      setError(err.message || "Failed to generate paper. Please check if subject has PYQ data.");
    } finally {
      setLoading(false);
    }
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
                <li>Section-I consist of 07 questions of 6 marks each with options respectively. Section-II consist of 03 questions...</li>
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
                    <td>${q.question}</td>
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
                    <td>${q.question}</td>
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
                    <td>${q.question}</td>
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
                    <td>${q.question}</td>
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

  const resetForm = () => { setGeneratedPaper(null); setError(""); };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto p-8 text-white min-h-screen">
        <div className="border-b border-[var(--gu-gold)] pb-6 mb-8">
            <h1 className="text-3xl font-serif text-white">Previous Year Question Bank</h1>
            <p className="text-[var(--gu-gold)] text-sm tracking-widest mt-2 uppercase">Official GUNI Portal</p>
        </div>

        {!generatedPaper ? (
          <div className="bg-[#2D0A0A] p-8 rounded border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase text-white/50">Select Course</label>
                  <select value={course} onChange={handleCourseChange} className="w-full bg-black/40 border border-white/10 p-4 rounded text-sm outline-none">
                    <option value="">Select...</option>
                    {courses.map((c) => (
                      <option key={`stu-course-${c.course_id}`} value={c.course_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase text-white/50">Semester</label>
                  <select value={semester} onChange={handleSemesterChange} disabled={!course} className="w-full bg-black/40 border border-white/10 p-4 rounded text-sm outline-none disabled:opacity-30">
                    <option value="">Select...</option>
                    {Array.from({ length: Math.max(0, (courses.find(c => c.course_id === course)?.total_semesters || 8) - 1) }, (_, i) => i + 1).map((s) => (
                      <option key={`stu-sem-${s}`} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="mb-8">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase text-white/50">Subject Selection</label>
                  <select 
                    value={subjectId} 
                    onChange={(e) => setSubjectId(e.target.value)} 
                    disabled={!semester} 
                    className="w-full bg-black/40 border border-white/10 p-4 rounded text-sm outline-none disabled:opacity-30"
                  >
                    <option value="">Select Subject...</option>
                    {subjects.map((s) => (
                      <option key={`stu-sub-${s.subject_id}`} value={s.subject_id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-white/50">Exam Mode</label>
                  <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded text-sm outline-none">
                    <option value="external">External (60 Marks)</option>
                    <option value="internal">Internal (30 Marks)</option>
                  </select>
                </div>
            </div>

            <button onClick={handleGenerate} disabled={!subjectId || loading} className="w-full bg-[var(--gu-gold)] text-black py-4 rounded font-bold uppercase tracking-widest flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <FileText size={18} />}
              Generate Paper
            </button>
          </div>
        ) : (
          <div className="bg-[#fdfdfd] text-black p-12 rounded shadow-2xl mx-auto max-w-[210mm] min-h-[297mm] font-serif mb-8 border border-gray-300">
             <div className="text-right text-sm mb-4">
                 Enrollment No. <span className="inline-block w-48 border-b border-black"></span>
             </div>
             
             <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-1">GANPAT UNIVERSITY</h1>
                <h2 className="text-lg mb-1">{generatedPaper.course} Sem-{generatedPaper.semester} Regular April-June 2024</h2>
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
                     <li>Section-I consist of 07 questions of 6 marks each with options respectively. Section-II consist of 03 questions...</li>
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
                          <tr key={`stu-q1-${i}`}>
                              <td className="border border-black p-2 text-center">{i+1}</td>
                              <td className="border border-black p-2 whitespace-pre-line text-justify">{q.question}</td>
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
                               <tr key={`stu-q2a-${i}`}>
                                   <td className="border border-black p-2 text-center">{i+1}</td>
                                   <td className="border border-black p-2 whitespace-pre-line text-justify">{q.question}</td>
                                   <td className="border border-black p-2 text-center">06</td>
                                   <td className="border border-black p-2 text-center">CO{(i % 4) + 1}</td>
                                   <td className="border border-black p-2 text-center">BTL{(i % 5) + 1}</td>
                               </tr>
                             ))}
                             
                             <tr>
                                 <td className="border border-black font-bold p-2">Q.3</td>
                                 <td className="border border-black font-bold p-2">Answer the following: (Any Two)</td>
                                 <td className="border border-black font-bold p-2 text-center">12</td>
                                 <td className="border border-black font-bold p-2"></td>
                                 <td className="border border-black font-bold p-2"></td>
                             </tr>
                             {generatedPaper.q3.map((q, i) => (
                               <tr key={`stu-q3-${i}`}>
                                   <td className="border border-black p-2 text-center">{i+1}</td>
                                   <td className="border border-black p-2 whitespace-pre-line text-justify">{q.question}</td>
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
                               <tr key={`stu-q4-${i}`}>
                                   <td className="border border-black p-2 text-center">{i+1}</td>
                                   <td className="border border-black p-2 whitespace-pre-line text-justify">{q.question}</td>
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
        )}
      </div>
    </StudentLayout>
  );
};

export default PYQs;
