import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/StudentLayout';
import { Award, ChevronDown, BookOpen, TrendingUp, Loader, AlertTriangle, ChevronRight } from 'lucide-react';
import { studentAPI } from '../../services/api';

const Results = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [expandedSem, setExpandedSem] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                const res = await studentAPI.results();
                setData(res.data);
            } catch (err) {
                console.error("Failed to load results", err);
                setError("Failed to load result data from server.");
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const getSemesterData = (sem) => data?.semesters?.find(s => s.semester === sem);
    const currentSemResult = selectedSemester ? getSemesterData(selectedSemester) : null;

    // Get all semesters up to selected for history view
    const getHistorySemesters = () => {
        if (!selectedSemester || !data?.semesters) return [];
        return data.semesters.filter(s => s.semester <= selectedSemester).sort((a, b) => b.semester - a.semester);
    };

    const gradeColor = (grade) => {
        const map = { 'O': 'text-emerald-400', 'A+': 'text-emerald-400', 'A': 'text-blue-400', 'B+': 'text-cyan-400', 'B': 'text-yellow-400', 'C': 'text-orange-400', 'P': 'text-amber-500', 'F': 'text-red-500' };
        return map[grade] || 'text-white/40';
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader className="w-10 h-10 animate-spin text-[var(--gu-gold)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Loading Academic Records...</span>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    if (error) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <AlertTriangle className="w-10 h-10 text-red-400" />
                        <p className="text-white/60 text-sm">{error}</p>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="animate-fade-in max-w-6xl mx-auto space-y-8 px-4">
                {/* Header */}
                <div className="bg-[var(--gu-red-deep)]/40 p-8 rounded-2xl border border-[var(--gu-gold)]/10 backdrop-blur-sm shadow-2xl">
                    <h1 className="font-serif text-4xl text-white mb-2 tracking-tight">Academic Results</h1>
                    <div className="flex flex-wrap items-center gap-3 text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.3em] opacity-80">
                        <span>{data?.student_name || 'Student'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
                        <span>{data?.enrollment_no}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
                        <span>{data?.course_name}</span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--gu-gold)]/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-[var(--gu-gold)]" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Overall CGPA</p>
                                <p className="text-white text-2xl font-bold">{data?.cgpa?.toFixed(2) || '0.00'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Current Semester</p>
                                <p className="text-white text-2xl font-bold">{data?.current_semester || '-'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Award className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Completed Semesters</p>
                                <p className="text-white text-2xl font-bold">{data?.dropdown_semesters?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SGPA Dropdown Selector */}
                <div className="glass-panel p-8 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-5 bg-[var(--gu-gold)]"></div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Semester-wise SGPA History</h2>
                    </div>

                    {data?.current_semester === 1 ? (
                        <div className="text-center py-12 text-white/20">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="text-sm font-semibold">First semester in progress</p>
                            <p className="text-[10px] uppercase tracking-widest mt-1">Results will appear after your first semester is completed</p>
                        </div>
                    ) : (
                        <>
                            {/* Dropdown */}
                            <div className="relative mb-8">
                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-3 ml-1">Select Semester to View</label>
                                <div className="relative">
                                    <select
                                        value={selectedSemester || ''}
                                        onChange={(e) => {
                                            const val = e.target.value ? parseInt(e.target.value) : null;
                                            setSelectedSemester(val);
                                            setExpandedSem(val);
                                        }}
                                        className="w-full md:w-80 bg-white/5 border border-white/10 text-white px-6 py-4 rounded-xl text-sm focus:border-[var(--gu-gold)]/50 focus:bg-white/10 outline-none appearance-none transition-all cursor-pointer"
                                    >
                                        <option value="" className="bg-[#1A0505]">-- Choose Semester --</option>
                                        {data?.dropdown_semesters?.map(sem => {
                                            const semData = getSemesterData(sem);
                                            return (
                                                <option key={sem} value={sem} className="bg-[#1A0505]">
                                                    Semester {sem} {semData ? `— SGPA: ${semData.sgpa?.toFixed(2) || 'N/A'}` : '— No Result'}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 pointer-events-none" />
                                </div>
                            </div>

                            {/* SGPA Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                                {data?.dropdown_semesters?.map(sem => {
                                    const semData = getSemesterData(sem);
                                    const isSelected = selectedSemester === sem;
                                    return (
                                        <button
                                            key={sem}
                                            onClick={() => { setSelectedSemester(sem); setExpandedSem(sem); }}
                                            className={`p-4 rounded-xl border transition-all duration-300 text-left group ${
                                                isSelected
                                                    ? 'bg-[var(--gu-gold)]/10 border-[var(--gu-gold)]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                            }`}
                                        >
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isSelected ? 'text-[var(--gu-gold)]' : 'text-white/30'}`}>
                                                Sem {sem}
                                            </p>
                                            <p className={`text-xl font-bold ${isSelected ? 'text-[var(--gu-gold)]' : 'text-white'}`}>
                                                {semData ? (semData.sgpa?.toFixed(2) || '0.00') : '—'}
                                            </p>
                                            {semData && (
                                                <p className={`text-[9px] font-bold mt-1 ${gradeColor(semData.grade)}`}>
                                                    Grade: {semData.grade || '-'}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Detailed Results View */}
                {selectedSemester && (
                    <div className="space-y-6 animate-fade-in">
                        {getHistorySemesters().map(semResult => (
                            <div key={semResult.semester} className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                                {/* Semester Header */}
                                <button
                                    onClick={() => setExpandedSem(expandedSem === semResult.semester ? null : semResult.semester)}
                                    className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                                            semResult.semester === selectedSemester
                                                ? 'bg-[var(--gu-gold)]/10 text-[var(--gu-gold)]'
                                                : 'bg-white/5 text-white/40'
                                        }`}>
                                            {semResult.semester}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-white font-bold text-sm">Semester {semResult.semester}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                                                    SGPA: <span className="text-[var(--gu-gold)]">{semResult.sgpa?.toFixed(2)}</span>
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${gradeColor(semResult.grade)}`}>
                                                    {semResult.grade}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                                                    {semResult.percentage?.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-white/20 transition-transform duration-300 ${expandedSem === semResult.semester ? 'rotate-90' : ''}`} />
                                </button>

                                {/* Subject Details */}
                                {expandedSem === semResult.semester && (
                                    <div className="border-t border-white/5">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left min-w-[700px]">
                                                <thead>
                                                    <tr className="bg-white/5">
                                                        {['Subject', 'Code', 'Internal', 'External', 'Practical', 'Total', 'Grade', 'Status'].map(h => (
                                                            <th key={h} className="py-4 px-6 text-[9px] font-black uppercase tracking-widest text-white/30">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {semResult.subject_results && semResult.subject_results.length > 0 ? (
                                                        semResult.subject_results.map((sr, i) => (
                                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                <td className="py-4 px-6 text-white text-xs font-semibold">{sr.subject_name}</td>
                                                                <td className="py-4 px-6 text-white/40 text-xs font-mono">{sr.subject_code}</td>
                                                                <td className="py-4 px-6 text-white/60 text-xs">{sr.internal_marks}</td>
                                                                <td className="py-4 px-6 text-white/60 text-xs">{sr.external_marks}</td>
                                                                <td className="py-4 px-6 text-white/60 text-xs">{sr.practical_marks}</td>
                                                                <td className="py-4 px-6 text-white font-bold text-xs">{sr.total_marks}</td>
                                                                <td className={`py-4 px-6 text-xs font-black ${gradeColor(sr.grade)}`}>{sr.grade}</td>
                                                                <td className="py-4 px-6">
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                                                                        sr.is_passed
                                                                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                                            : 'text-red-400 bg-red-500/10 border-red-500/20'
                                                                    }`}>
                                                                        {sr.is_passed ? 'Pass' : 'Fail'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="8" className="py-8 text-center text-white/20 text-sm italic">
                                                                No subject results available for this semester
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Semester Summary Footer */}
                                        <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex flex-wrap items-center gap-6">
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Total: </span>
                                                <span className="text-white font-bold text-xs">{semResult.obtained_marks}/{semResult.total_marks}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Percentage: </span>
                                                <span className="text-white font-bold text-xs">{semResult.percentage?.toFixed(2)}%</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">SGPA: </span>
                                                <span className="text-[var(--gu-gold)] font-bold text-xs">{semResult.sgpa?.toFixed(2)}</span>
                                            </div>
                                            {semResult.exam_type && (
                                                <div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Type: </span>
                                                    <span className="text-white/60 text-xs">{semResult.exam_type}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default Results;
