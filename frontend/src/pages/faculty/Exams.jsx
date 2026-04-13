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
            <div className="animate-fade-in max-w-7xl mx-auto space-y-10 relative z-10 px-4">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[var(--gu-red-deep)]/40 p-10 rounded-3xl border border-[var(--gu-gold)]/10 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <h1 className="font-serif text-4xl md:text-5xl text-white mb-3 tracking-tight">
                            Assessment Intelligence
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.4em] opacity-80">
                            <span>GANPAT UNIVERSITY</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
                            <span>Evaluation Architecture</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
                            <span>Cognitive Engine v4.0</span>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--gu-gold)]/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-[var(--gu-gold)]/10 transition-colors duration-1000"></div>
                </div>

                {/* Cinematic Tabs */}
                <div className="flex flex-wrap gap-4 p-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl w-fit">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'list'
                            ? 'bg-[var(--gu-gold)] text-black shadow-lg shadow-[var(--gu-gold)]/20'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Archived Repositories
                    </button>
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'generator'
                            ? 'bg-[var(--gu-gold)] text-black shadow-lg shadow-[var(--gu-gold)]/20'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Cognitive Synthesis
                    </button>
                </div>

                {/* ══════════════════════════════════════════════════════ */}
                {/* TAB 1: EXAM LIST */}
                {/* ══════════════════════════════════════════════════════ */}
                {activeTab === 'list' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center px-4">
                            <div className="space-y-1">
                                <h2 className="text-white font-serif text-2xl tracking-tight">Active Repositories</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">System contains {examsList.length} verified assessment vectors</p>
                            </div>
                            <button
                                onClick={() => setActiveTab('generator')}
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3"
                            >
                                <Plus className="w-4 h-4 text-[var(--gu-gold)]" />
                                Synthesize New
                            </button>
                        </div>

                        {listLoading ? (
                            <div className="py-40 flex flex-col items-center justify-center gap-6">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-[var(--gu-gold)]/10 animate-ping absolute inset-0"></div>
                                    <div className="w-16 h-16 rounded-full border-4 border-t-[var(--gu-gold)] animate-spin"></div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Indexing Archives...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {examsList.length === 0 ? (
                                    <div className="col-span-full py-40 glass-panel flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/20">
                                            <FileText className="w-10 h-10" />
                                        </div>
                                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">Repository Empty</p>
                                    </div>
                                ) : (
                                    examsList.map((exam) => (
                                        <div key={exam.id} className="glass-panel p-8 group hover:border-[var(--gu-gold)]/40 transition-all duration-500 overflow-hidden relative">
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gu-gold)] bg-[var(--gu-gold)]/10 px-3 py-1 rounded-lg border border-[var(--gu-gold)]/20">
                                                                {exam.course}
                                                            </span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                                                                {exam.status}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-white font-serif text-2xl tracking-tight leading-tight group-hover:text-[var(--gu-gold)] transition-colors">{exam.title}</h3>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleViewPaper(exam)}
                                                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[var(--gu-gold)] hover:border-[var(--gu-gold)]/40 transition-all"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteExam(exam)}
                                                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-red-400 hover:border-red-400/40 transition-all"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-4 pt-4 border-t border-white/5">
                                                    <div className="text-white/60 text-xs font-bold tracking-tight">{exam.subject}</div>
                                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5 text-[var(--gu-gold)] opacity-40" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{exam.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 text-[var(--gu-gold)] opacity-40" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{exam.time}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Award className="w-3.5 h-3.5 text-[var(--gu-gold)] opacity-40" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{exam.total_marks} MARKS</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gu-gold)]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════ */}
                {/* TAB 2: AI EXAM PAPER GENERATOR */}
                {/* ══════════════════════════════════════════════════════ */}
                {activeTab === 'generator' && (
                    <div className="space-y-10 animate-fade-in">
                        {/* Info banner */}
                        <div className="bg-gradient-to-r from-purple-900/40 to-[var(--gu-red-deep)]/40 backdrop-blur-md border border-white/5 p-10 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center group relative overflow-hidden shadow-2xl">
                            <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-1000 relative z-10 shadow-2xl">
                                <Sparkles className="w-10 h-10 text-[var(--gu-gold)]" />
                                <div className="absolute inset-0 bg-[var(--gu-gold)]/20 blur-2xl rounded-full scale-50 group-hover:scale-100 transition-transform"></div>
                            </div>
                            <div className="flex-1 text-center md:text-left relative z-10">
                                <h3 className="text-white font-serif text-3xl tracking-tight mb-3">Cognitive Synthesis Engine</h3>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed max-w-2xl">
                                    Utilize neural evaluation architecture to synthesize structured assessment vectors following GUNI-CBCS standards.
                                    The engine analyzes question density, difficulty distribution, and pedagogical alignment.
                                </p>
                            </div>
                            <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-purple-500/10 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Generator Controls */}
                            <div className="lg:col-span-8 space-y-8 h-full">
                                <div className="glass-panel p-10 space-y-12">
                                    {/* Track Selection */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                                               <BookOpen className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Domain Intelligence</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--gu-gold)] ml-1 opacity-60">Program Protocol</label>
                                                <select
                                                    value={genCourse}
                                                    onChange={e => setGenCourse(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all appearance-none cursor-pointer hover:bg-white/10 shadow-lg"
                                                >
                                                    <option value="" className="bg-[#1A0505]">Select Academic Track</option>
                                                    {COURSES.map(c => <option key={c} value={c} className="bg-[#1A0505]">{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--gu-gold)] ml-1 opacity-60">Cycle Segment</label>
                                                <select
                                                    value={genSemester}
                                                    onChange={e => setGenSemester(e.target.value)}
                                                    disabled={!genCourse || semLoading}
                                                    className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all appearance-none cursor-pointer hover:bg-white/10 shadow-lg disabled:opacity-20"
                                                >
                                                    <option value="" className="bg-[#1A0505]">
                                                        {semLoading ? 'Syncing...' : genCourse ? 'Select Segment' : 'Lock Active'}
                                                    </option>
                                                    {availableSemesters.map(s => <option key={s} value={s} className="bg-[#1A0505]">Semester {s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3 pt-4">
                                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--gu-gold)] ml-1 opacity-60">Curriculum Vector</label>
                                            <select
                                                value={genSubjectCode}
                                                onChange={handleSubjectChange}
                                                disabled={!genSemester || subLoading || availableSubjects.length === 0}
                                                className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all appearance-none cursor-pointer hover:bg-white/10 shadow-lg disabled:opacity-20"
                                            >
                                                <option value="" className="bg-[#1A0505]">
                                                    {subLoading ? 'Identifying Vectors...' : !genSemester ? 'Lock Active' : availableSubjects.length === 0 ? 'Null Result' : 'Select Subject Module'}
                                                </option>
                                                {availableSubjects.map(s => (
                                                    <option key={s.code} value={s.code} className="bg-[#1A0505]">{s.code} — {s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Parameters Tuning */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
                                               <Award className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Evaluation Parameters</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--gu-gold)] ml-1 opacity-60">Assessment Mode</label>
                                                <select
                                                    value={genExamType}
                                                    onChange={e => setGenExamType(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all appearance-none cursor-pointer hover:bg-white/10"
                                                >
                                                    {EXAM_TYPES.map(t => (
                                                        <option key={t.value} value={t.value} className="bg-[#1A0505]">{t.label} ({t.marks} Marks)</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--gu-gold)] ml-1 opacity-60">Complexity Index</label>
                                                <select
                                                    value={genDifficulty}
                                                    onChange={e => setGenDifficulty(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all appearance-none cursor-pointer hover:bg-white/10"
                                                >
                                                    {DIFFICULTIES.map(d => <option key={d} value={d} className="bg-[#1A0505]">{d}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--gu-gold)] ml-1 opacity-60">Heuristic Instructions (Optional)</label>
                                            <textarea
                                                value={genCustomInstructions}
                                                onChange={e => setGenCustomInstructions(e.target.value)}
                                                placeholder="Inject specific constraints or thematic focus..."
                                                rows="3"
                                                className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl text-xs focus:border-[var(--gu-gold)]/30 outline-none transition-all resize-none hover:bg-white/10"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Panel */}
                                    <div className="pt-8 flex flex-col sm:flex-row gap-6">
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
