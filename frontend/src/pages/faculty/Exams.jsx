import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import FacultyLayout from '../../components/FacultyLayout';
import {
    FileUp, FileText, CheckCircle, Calendar, Plus, X,
    Sparkles, Download, Eye, ChevronDown, RefreshCw,
    BookOpen, Clock, Award, Loader2, AlertCircle, Printer
} from 'lucide-react';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const BACKEND_BASE = 'http://localhost:8000/exam-paper';

const COURSES = [
    "BCA", "MCA", "BSC-IT", "BSC-IMS", "BSC-CYBER", "BSC-AIML",
    "MSC-IT", "MSC-IMS", "MSC-CYBER", "MSC-AIML", "BTECH-IT", "BTECH-CSE"
];

const EXAM_TYPES = [
    { value: "external",  label: "External Exam",  marks: 70,  time: "3 Hours" },
    { value: "internal",  label: "Internal Exam",  marks: 30,  time: "1.5 Hours" },
    { value: "mid-term",  label: "Mid-Term Exam",  marks: 50,  time: "2 Hours" },
    { value: "end-term",  label: "End-Term Exam",  marks: 100, time: "3 Hours" },
    { value: "unit-test", label: "Unit Test",       marks: 20,  time: "1 Hour" },
];

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"];

// Removing static initialSampleExams to use backend data

// ─────────────────────────────────────────────
// Sub-component: Exam Paper Preview (white page)
// ─────────────────────────────────────────────
const ExamPaperPreview = ({ paper, onClose, onDownload, isDownloading }) => {
    const previewRef = useRef(null);
    const letters = 'ABCDEFGHI';
    const roman   = ['I', 'II', 'III', 'IV', 'V'];

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handlePrint = () => {
        const content = previewRef.current.innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>${paper.course} Exam Paper - ${paper.subject_name}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; background: #fff; padding: 20mm 20mm; }
                        h1 { font-size: 18pt; text-align: center; }
                        h2 { font-size: 14pt; text-align: center; }
                        h3 { font-size: 12pt; }
                        .divider { border-top: 2px solid #000; margin: 8px 0; }
                        .thin-divider { border-top: 1px solid #aaa; margin: 6px 0; }
                        .meta-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 11pt; }
                        .section-title { text-align: center; font-weight: bold; font-size: 13pt; margin: 12px 0 6px; }
                        .q-row { margin-bottom: 6px; }
                        .q-row p { margin: 2px 0 10px 20px; font-size: 11pt; }
                        .importance-badge { display: none; }
                        .years-badge { display: none; }
                        .end-note { text-align: center; font-weight: bold; margin-top: 16px; }
                    </style>
                </head>
                <body>${content}</body>
            </html>
        `);
        win.document.close();
        win.focus();
        win.print();
    };

    const renderQuestions = (questions, startLabel, useLetters = true, marks = null) => {
        return questions.map((q, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '28px', fontFamily: 'Times New Roman, serif' }}>
                        {useLetters ? `  ${letters[i]})` : `  ${roman[i]})`}
                    </span>
                    <span style={{ flex: 1, fontFamily: 'Times New Roman, serif', fontSize: '11pt', lineHeight: '1.5' }}>
                        {q.question}
                    </span>
                    {marks && (
                        <span style={{ marginLeft: '8px', fontWeight: 'bold', whiteSpace: 'nowrap', fontFamily: 'Times New Roman, serif' }}>
                            ({marks})
                        </span>
                    )}
                </div>
            </div>
        ));
    };

    return (
        <div 
            onClick={handleBackdropClick}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.92)', display: 'flex',
                flexDirection: 'column', alignItems: 'center',
                overflowY: 'auto', padding: '60px 20px 40px'
            }}
        >
            <div style={{
                position: 'fixed', top: '20px', zIndex: 2000,
                width: 'calc(100% - 40px)', maxWidth: '210mm',
                background: '#450A0A', border: '1px solid var(--gu-gold)',
                display: 'flex', gap: '10px',
                padding: '12px 20px', borderRadius: '8px',
                flexWrap: 'wrap', alignItems: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }}>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--gu-gold)', marginRight: '8px' }}>📄</span>
                    {paper.exam_type} Paper — {paper.subject_name}
                </div>
                <button
                    onClick={handlePrint}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                        color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                        fontWeight: '600', fontSize: '13px'
                    }}
                >
                    <Printer size={15} /> Print
                </button>
                <button
                    onClick={onDownload}
                    disabled={isDownloading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: '#CFB53B', border: 'none',
                        color: '#3D0F0F', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer',
                        fontWeight: '700', fontSize: '13px', opacity: isDownloading ? 0.7 : 1
                    }}
                >
                    {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                </button>
                <button
                    onClick={onClose}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                        color: '#fca5a5', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer',
                        fontWeight: '600', fontSize: '13px'
                    }}
                >
                    <X size={15} /> Close
                </button>
            </div>

            {/* White paper (A4 Aspect Ratio) */}
            <div
                ref={previewRef}
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    background: '#ffffff', color: '#000000',
                    padding: '25mm 20mm', boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    fontFamily: 'Times New Roman, serif',
                    marginTop: '80px',
                    marginBottom: '40px'
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'right', marginBottom: '8px', fontSize: '11pt' }}>
                    Enrollment No._______________
                </div>
                <h1 style={{ textAlign: 'center', fontSize: '18pt', fontWeight: 'bold', marginBottom: '4px' }}>
                    GANPAT UNIVERSITY
                </h1>
                <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '4px' }}>
                    {paper.course} SEM-{paper.semester} EXAMINATION (CBCS)
                </h2>
                <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '8px 0' }} />
                <h3 style={{ textAlign: 'center', fontSize: '13pt', fontWeight: 'bold', marginBottom: '2px' }}>
                    {paper.subject_code}: {paper.subject_name}
                </h3>
                <div style={{ textAlign: 'center', fontSize: '11pt', marginBottom: '12px' }}>
                    {paper.exam_type} Examination — {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12pt', fontWeight: 'bold', marginBottom: '8px' }}>
                    <span>Time: {paper.time}</span>
                    <span>[Total Marks: {paper.total_marks}]</span>
                </div>
                <div style={{ fontSize: '11pt', marginBottom: '10px' }}>
                    <strong>Instructions:</strong>
                    <div style={{ paddingLeft: '16px', marginTop: '4px', lineHeight: '1.7' }}>
                        1. Figures to the right indicate full marks.<br/>
                        2. Each section should be written in a separate answer book.<br/>
                        3. Be precise and to the point in your answer.
                    </div>
                </div>
                <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '10px 0' }} />

                {/* Section I */}
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', margin: '12px 0 8px' }}>
                    SECTION-I
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11pt', marginBottom: '6px' }}>
                    <span>1. Answer the following: (Any six out of Nine)</span>
                    <span>(30)</span>
                </div>
                {renderQuestions(paper.section1 || [], 'A', true, '05')}

                {/* Section II — only for external/end-term/mid-term */}
                {paper.q2a && (
                    <>
                        <hr style={{ border: 'none', borderTop: '1px solid #555', margin: '16px 0 8px' }} />
                        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', margin: '8px 0' }}>
                            SECTION-II
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '4px' }}>2.</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11pt', marginLeft: '16px', marginBottom: '4px' }}>
                            <span>(A) Answer the following: (Any One)</span>
                            <span>(06)</span>
                        </div>
                        {renderQuestions(paper.q2a, 'I', false)}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11pt', marginLeft: '16px', marginTop: '8px', marginBottom: '4px' }}>
                            <span>(B) Answer the following:</span>
                            <span>(02)</span>
                        </div>
                        {renderQuestions(paper.q2b || [], 'I', false, '01')}
                    </>
                )}

                {paper.q3 && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11pt', marginTop: '10px', marginBottom: '4px' }}>
                            <span>3. Answer the following: (Any One)</span>
                            <span>(06)</span>
                        </div>
                        {renderQuestions(paper.q3, 'I', false)}
                    </>
                )}

                {paper.q4 && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11pt', marginTop: '10px', marginBottom: '4px' }}>
                            <span>4. Answer the following: (Any Two)</span>
                            <span>(10)</span>
                        </div>
                        {renderQuestions(paper.q4, 'I', false, '05')}
                    </>
                )}

                {paper.q5 && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11pt', marginTop: '10px', marginBottom: '4px' }}>
                            <span>5. Answer the following: (Any One)</span>
                            <span>(06)</span>
                        </div>
                        {renderQuestions(paper.q5, 'I', false)}
                    </>
                )}

                <hr style={{ border: 'none', borderTop: '1px solid #aaa', margin: '20px 0 8px' }} />
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt' }}>
                    --- End of Paper ---
                </div>
                <div style={{ textAlign: 'center', color: '#666', fontSize: '9pt', marginTop: '8px' }}>
                    Generated: {paper.generated_at || new Date().toLocaleDateString()} · {paper.university || 'Ganpat University'}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const Exams = () => {
    // ── Tab state ──
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'generator'

    // ── Exam List tab state ──
    const [examsList, setExamsList] = useState([]);
    const [listLoading, setListLoading] = useState(false);

    // ── Fetch papers from backend ──
    const fetchExams = useCallback(async () => {
        setListLoading(true);
        try {
            const resp = await fetch(`${BACKEND_BASE}/api/faculty/list/`);
            const data = await resp.json();
            if (data.success) {
                const mapped = data.papers.map(p => ({
                    id: p.id,
                    title: `${p.exam_type} Exam - ${p.subject_name}`,
                    subject: p.subject_name,
                    course: p.paper_data.course || "N/A",
                    date: p.created_at.split(' ')[0],
                    time: p.paper_data.time || "3 Hours",
                    duration: p.paper_data.time || "3 Hours",
                    total_marks: p.total_marks,
                    status: "Generated",
                    full_paper_data: p.paper_data
                }));
                setExamsList(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch exams:", err);
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    // ── AI Generator tab state ──
    const [genCourse, setGenCourse] = useState('');
    const [genSemester, setGenSemester] = useState('');
    const [genSubjectCode, setGenSubjectCode] = useState('');
    const [genSubjectName, setGenSubjectName] = useState('');
    const [genExamType, setGenExamType] = useState('external');
    const [genDifficulty, setGenDifficulty] = useState('Mixed');
    const [genNumQuestions, setGenNumQuestions] = useState(10);
    const [genUniversity, setGenUniversity] = useState('Ganpat University');
    const [genCustomInstructions, setGenCustomInstructions] = useState('');

    const [availableSemesters, setAvailableSemesters] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [semLoading, setSemLoading] = useState(false);
    const [subLoading, setSubLoading] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPaper, setGeneratedPaper] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [genError, setGenError] = useState('');

    // ── Fetch semesters when course changes ──
    useEffect(() => {
        if (!genCourse) {
            setAvailableSemesters([]);
            setAvailableSubjects([]);
            setGenSemester('');
            setGenSubjectCode('');
            return;
        }
        setSemLoading(true);
        setGenSemester('');
        setGenSubjectCode('');
        setAvailableSubjects([]);
        fetch(`${BACKEND_BASE}/api/faculty/semesters/?course=${genCourse}`)
            .then(r => r.json())
            .then(data => {
                setAvailableSemesters(data.semesters || []);
                setSemLoading(false);
            })
            .catch(() => {
                // Fallback
                const fallback = genCourse.startsWith('B') ? [1,2,3,4,5,6] : [1,2];
                setAvailableSemesters(fallback);
                setSemLoading(false);
            });
    }, [genCourse]);

    // ── Fetch subjects when semester changes ──
    useEffect(() => {
        if (!genCourse || !genSemester) {
            setAvailableSubjects([]);
            setGenSubjectCode('');
            return;
        }
        setSubLoading(true);
        setGenSubjectCode('');
        fetch(`${BACKEND_BASE}/api/faculty/subjects/?course=${genCourse}&semester=${genSemester}`)
            .then(r => r.json())
            .then(data => {
                setAvailableSubjects(data.subjects || []);
                setSubLoading(false);
            })
            .catch(() => {
                setAvailableSubjects([]);
                setSubLoading(false);
            });
    }, [genCourse, genSemester]);

    // ── Handle subject selection ──
    const handleSubjectChange = (e) => {
        const code = e.target.value;
        setGenSubjectCode(code);
        const subj = availableSubjects.find(s => s.code === code);
        setGenSubjectName(subj ? subj.name : code);
    };

    // ── Generate exam paper ──
    const handleGenerate = async () => {
        if (!genCourse || !genSemester || !genSubjectCode) {
            setGenError('Please select Course, Semester, and Subject before generating.');
            return;
        }
        setGenError('');
        setIsGenerating(true);
        setGeneratedPaper(null);
        try {
            const resp = await fetch(`${BACKEND_BASE}/api/faculty/generate/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: genCourse,
                    semester: parseInt(genSemester),
                    subject_code: genSubjectCode,
                    subject_name: genSubjectName,
                    exam_type: genExamType,
                    difficulty: genDifficulty,
                    num_questions: genNumQuestions,
                    university: genUniversity,
                    custom_instructions: genCustomInstructions,
                }),
            });
            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.error || 'Generation failed');
            }
            
            const paper = data.paper;
            setGeneratedPaper(paper);
            setShowPreview(true);

            // Refetch the list to include the new paper from DB
            fetchExams();

        } catch (err) {
            setGenError(err.message || 'Failed to generate exam paper. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Download PDF ──
    const handleDownloadPDF = async () => {
        if (!generatedPaper) return;
        setIsDownloading(true);
        try {
            const resp = await fetch(`${BACKEND_BASE}/api/faculty/download-pdf/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(generatedPaper),
            });
            if (!resp.ok) throw new Error('PDF download failed');
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const course = generatedPaper.course || 'GUNI';
            const scode  = generatedPaper.subject_code || 'paper';
            const etype  = generatedPaper.exam_type || 'exam';
            const sem    = generatedPaper.semester || '';
            const a = document.createElement('a');
            a.href = url;
            a.download = `${course}_Sem${sem}_${scode}_${etype}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('PDF download failed: ' + err.message);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleViewPaper = (exam) => {
        if (exam.full_paper_data) {
            setGeneratedPaper(exam.full_paper_data);
            setShowPreview(true);
        } else {
            alert("Preview not available for this legacy entry.");
        }
    };

    const handleDeleteExam = async (exam) => {
        if (!window.confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;
        try {
            const resp = await fetch(`${BACKEND_BASE}/api/faculty/delete/${exam.id}/`, {
                method: 'DELETE',
            });
            const data = await resp.json();
            if (data.success) {
                setExamsList(prev => prev.filter(e => e.id !== exam.id));
            } else {
                alert('Failed to delete: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    };

    const selectedExamType = EXAM_TYPES.find(t => t.value === genExamType);

    // ─────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────
    return (
        <FacultyLayout>
            <div className="animate-fade-in max-w-5xl mx-auto">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--gu-gold)] pb-6 mb-8 gap-4">
                    <div className="min-w-0">
                        <h1 className="font-serif text-2xl md:text-3xl text-white mb-2">Exam Papers</h1>
                        <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold">
                            Create and manage examination papers
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 mb-8 border-b border-[var(--gu-border)]">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'list'
                            ? 'border-[var(--gu-gold)] text-[var(--gu-gold)]'
                            : 'border-transparent text-white opacity-60 hover:opacity-100'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <BookOpen size={15} />
                            Exam List
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'generator'
                            ? 'border-[var(--gu-gold)] text-[var(--gu-gold)]'
                            : 'border-transparent text-white opacity-60 hover:opacity-100'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Sparkles size={15} />
                            AI Paper Generator
                        </span>
                    </button>
                </div>

                {/* ══════════════════════════════════════════════════════ */}
                {/* TAB 1: EXAM LIST */}
                {/* ══════════════════════════════════════════════════════ */}
                {activeTab === 'list' && (
                    <div>
                        {/* Exams list */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-serif text-white text-xl border-l-4 border-l-[var(--gu-gold)] pl-3">Your Examination Papers</h2>
                            <button
                                onClick={() => setActiveTab('generator')}
                                className="flex items-center gap-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-[#e6c949] transition-colors"
                            >
                                <Plus size={14} /> Generate New Paper
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {examsList.length === 0 ? (
                                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-12 text-center rounded-sm">
                                    <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                    <p className="text-white opacity-60">No exam papers generated yet.</p>
                                </div>
                            ) : (
                                examsList.map((exam) => (
                                    <div key={exam.id} className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-all hover:border-[var(--gu-gold)]/50 group">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="text-white font-serif text-lg">{exam.title}</h3>
                                                <span className="bg-white/10 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-white/20">{exam.course}</span>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm ${exam.status === 'Upcoming' ? 'bg-[var(--gu-gold)] text-[var(--gu-red-deep)]' : 'bg-[#4ade80] text-[var(--gu-red-deep)]'}`}>
                                                    {exam.status}
                                                </span>
                                            </div>
                                            <div className="text-white opacity-80 text-sm font-medium mb-1">{exam.subject}</div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[var(--gu-gold)] text-xs">
                                                <div className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{exam.date} {exam.time !== "N/A" && `at ${exam.time}`}</div>
                                                <span className="text-white opacity-60">Duration: {exam.duration}</span>
                                                <span className="text-white opacity-60">Marks: {exam.total_marks}</span>
                                            </div>
                                        </div>
                                        <div className="flex w-full lg:w-auto gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleViewPaper(exam)}
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white/5 border border-[var(--gu-gold)] text-[var(--gu-gold)] px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-[var(--gu-gold)] hover:text-[var(--gu-red-deep)] transition-all"
                                            >
                                                <Eye size={14} /> View
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteExam(exam)}
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white/5 border border-red-500/50 text-red-400 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <X size={14} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════ */}
                {/* TAB 2: AI EXAM PAPER GENERATOR */}
                {/* ══════════════════════════════════════════════════════ */}
                {activeTab === 'generator' && (
                    <div>
                        {/* Info banner */}
                        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-gold)]/30 rounded-sm p-4 mb-8 flex gap-3 items-start">
                            <Sparkles className="text-[var(--gu-gold)] mt-0.5 flex-shrink-0" size={18} />
                            <div>
                                <p className="text-white font-semibold text-sm mb-0.5">AI-Powered Exam Paper Generator</p>
                                <p className="text-white/60 text-xs leading-relaxed">
                                    Select your course, semester and subject. The system will generate a structured exam paper following the Ganpat University CBCS format, analyse question frequency, and allow you to download a ready-to-print PDF.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm p-6 md:p-8 space-y-8">

                            {/* ── Row 1: Course + Semester ── */}
                            <div>
                                <h3 className="text-[var(--gu-gold)] text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                                    <BookOpen size={14} /> Step 1 — Select Course &amp; Semester
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">
                                            Course <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            value={genCourse}
                                            onChange={e => setGenCourse(e.target.value)}
                                            className="w-full bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] transition-colors appearance-none"
                                        >
                                            <option value="">Select Course</option>
                                            {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">
                                            Semester <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            value={genSemester}
                                            onChange={e => setGenSemester(e.target.value)}
                                            disabled={!genCourse || semLoading}
                                            className="w-full bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] transition-colors appearance-none disabled:opacity-50"
                                        >
                                            <option value="">
                                                {semLoading ? 'Loading...' : genCourse ? 'Select Semester' : 'Select course first'}
                                            </option>
                                            {availableSemesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* ── Row 2: Subject ── */}
                            <div>
                                <h3 className="text-[var(--gu-gold)] text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                                    <FileText size={14} /> Step 2 — Select Subject
                                </h3>
                                <div>
                                    <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">
                                        Subject <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={genSubjectCode}
                                        onChange={handleSubjectChange}
                                        disabled={!genSemester || subLoading || availableSubjects.length === 0}
                                        className="w-full bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] transition-colors appearance-none disabled:opacity-50"
                                    >
                                        <option value="">
                                            {subLoading ? 'Loading subjects...' : !genSemester ? 'Select semester first' : availableSubjects.length === 0 ? 'No subjects found' : 'Select Subject'}
                                        </option>
                                        {availableSubjects.map(s => (
                                            <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                                        ))}
                                    </select>
                                    {genSubjectCode && genSubjectName && (
                                        <p className="text-[var(--gu-gold)] text-xs mt-1 opacity-80">
                                            Selected: <strong>{genSubjectName}</strong> ({genSubjectCode})
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ── Row 3: Exam Configuration ── */}
                            <div>
                                <h3 className="text-[var(--gu-gold)] text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                                    <Award size={14} /> Step 3 — Configure Exam
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Exam Type</label>
                                        <select
                                            value={genExamType}
                                            onChange={e => setGenExamType(e.target.value)}
                                            className="w-full bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] transition-colors appearance-none"
                                        >
                                            {EXAM_TYPES.map(t => (
                                                <option key={t.value} value={t.value}>{t.label} ({t.marks} Marks)</option>
                                            ))}
                                        </select>
                                        {selectedExamType && (
                                            <p className="text-white/50 text-xs mt-1">
                                                <Clock size={10} className="inline mr-1" />Duration: {selectedExamType.time}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Difficulty</label>
                                        <select
                                            value={genDifficulty}
                                            onChange={e => setGenDifficulty(e.target.value)}
                                            className="w-full bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] transition-colors appearance-none"
                                        >
                                            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">No. of Questions</label>
                                        <input
                                            type="number"
                                            value={genNumQuestions}
                                            onChange={e => setGenNumQuestions(Math.max(5, Math.min(20, Number(e.target.value))))}
                                            min={5} max={20}
                                            className="w-full bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] transition-colors"
                                        />
                                        <p className="text-white/50 text-xs mt-1">Range: 5 – 20 questions</p>
                                    </div>
                                </div>

                                {/* University & Instructions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div>
                                        <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">University Name</label>
                                        <input
                                            type="text"
                                            value={genUniversity}
                                            onChange={e => setGenUniversity(e.target.value)}
                                            className="w-full bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white opacity-80 text-xs uppercase tracking-widest font-semibold mb-2">Custom Instructions (Optional)</label>
                                        <input
                                            type="text"
                                            value={genCustomInstructions}
                                            onChange={e => setGenCustomInstructions(e.target.value)}
                                            placeholder="e.g. Focus on Unit 3 topics"
                                            className="w-full bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Error message */}
                            {genError && (
                                <div className="bg-red-900/30 border border-red-500/40 text-red-400 p-4 rounded-sm flex items-center gap-3">
                                    <AlertCircle size={18} className="flex-shrink-0" />
                                    {genError}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[var(--gu-border)]">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !genCourse || !genSemester || !genSubjectCode}
                                    className={`flex items-center justify-center gap-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-8 py-3 font-serif text-lg font-bold rounded-sm hover:bg-[#e6c949] transition-colors ${(isGenerating || !genCourse || !genSemester || !genSubjectCode) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {isGenerating
                                        ? <><Loader2 size={18} className="animate-spin" /> Generating...</>
                                        : <><Sparkles size={18} /> Generate Exam Paper</>
                                    }
                                </button>

                                {generatedPaper && (
                                    <>
                                        <button
                                            onClick={() => setShowPreview(true)}
                                            className="flex items-center justify-center gap-2 bg-transparent border border-[var(--gu-gold)] text-[var(--gu-gold)] px-8 py-3 font-bold tracking-widest rounded-sm hover:bg-[rgba(207,181,59,0.1)] transition-colors text-sm uppercase"
                                        >
                                            <Eye size={16} /> Preview Paper
                                        </button>
                                        <button
                                            onClick={handleDownloadPDF}
                                            disabled={isDownloading}
                                            className={`flex items-center justify-center gap-2 bg-transparent border border-white/30 text-white px-8 py-3 font-bold tracking-widest rounded-sm hover:bg-white/5 transition-colors text-sm uppercase ${isDownloading ? 'opacity-60' : ''}`}
                                        >
                                            {isDownloading
                                                ? <><Loader2 size={16} className="animate-spin" /> Downloading...</>
                                                : <><Download size={16} /> Download PDF</>
                                            }
                                        </button>
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating}
                                            title="Regenerate"
                                            className="flex items-center justify-center gap-2 bg-transparent border border-white/20 text-white/60 px-4 py-3 rounded-sm hover:text-white hover:border-white/40 transition-colors text-sm"
                                        >
                                            <RefreshCw size={15} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Paper summary card (after generation) */}
                            {generatedPaper && (
                                <div className="bg-[#3D0F0F] border border-[var(--gu-gold)]/40 rounded-sm p-5 mt-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle className="text-green-400" size={18} />
                                        <span className="text-white font-bold text-sm">Paper Generated Successfully!</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                        <div>
                                            <p className="text-white/50 uppercase tracking-wider mb-1">Course</p>
                                            <p className="text-[var(--gu-gold)] font-bold">{generatedPaper.course} — Sem {generatedPaper.semester}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/50 uppercase tracking-wider mb-1">Subject</p>
                                            <p className="text-white font-semibold">{generatedPaper.subject_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/50 uppercase tracking-wider mb-1">Exam Type</p>
                                            <p className="text-white">{generatedPaper.exam_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/50 uppercase tracking-wider mb-1">Total Marks</p>
                                            <p className="text-[var(--gu-gold)] font-bold">{generatedPaper.total_marks}</p>
                                        </div>
                                    </div>
                                    <p className="text-white/40 text-xs mt-3">
                                        Click <strong className="text-white/60">Preview Paper</strong> to view on white page, or <strong className="text-white/60">Download PDF</strong> to save.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Preview Modal */}
            {showPreview && generatedPaper && (
                <ExamPaperPreview
                    paper={generatedPaper}
                    onClose={() => setShowPreview(false)}
                    onDownload={handleDownloadPDF}
                    isDownloading={isDownloading}
                />
            )}
        </FacultyLayout>
    );
};

export default Exams;
