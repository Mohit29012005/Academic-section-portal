import React, { useState, useEffect } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import { ClipboardCheck, Users, ChevronDown, Save, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import { facultyAPI } from '../../services/api';

const Grading = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [grades, setGrades] = useState({});
    const [sgpaValues, setSgpaValues] = useState({});
    const [submitting, setSubmitting] = useState({});
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await facultyAPI.gradingStudents();
                setData(res.data);
                // Auto-select first semester with students
                const sems = Object.keys(res.data.semesters || {});
                if (sems.length > 0) setSelectedSemester(sems[0]);
            } catch (err) {
                console.error("Grading fetch failed", err);
                if (err.response?.status === 403) {
                    setError("You are not assigned as a Class Teacher. Only designated class teachers can access the grading module.");
                } else {
                    setError("Failed to load grading data.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const currentStudents = data?.semesters?.[selectedSemester] || [];
    const currentSubjects = data?.subjects_by_semester?.[selectedSemester] || [];

    const handleMarkChange = (studentId, subjectId, field, value) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [subjectId]: {
                    ...(prev[studentId]?.[subjectId] || {}),
                    [field]: value
                }
            }
        }));
    };

    const handleSgpaChange = (studentId, value) => {
        setSgpaValues(prev => ({ ...prev, [studentId]: value }));
    };

    const handleSubmitStudent = async (student) => {
        const studentId = student.student_id;
        const studentGrades = grades[studentId] || {};
        const sgpa = sgpaValues[studentId];

        if (!sgpa || isNaN(parseFloat(sgpa))) {
            alert("Please enter a valid SGPA for " + student.name);
            return;
        }

        const subjects = currentSubjects.map(sub => ({
            subject_id: sub.subject_id,
            internal_marks: parseInt(studentGrades[sub.subject_id]?.internal || 0),
            external_marks: parseInt(studentGrades[sub.subject_id]?.external || 0),
            practical_marks: parseInt(studentGrades[sub.subject_id]?.practical || 0),
            passing_marks: 35,
        }));

        setSubmitting(prev => ({ ...prev, [studentId]: true }));
        try {
            await facultyAPI.gradingSubmit({
                student_id: studentId,
                semester: parseInt(selectedSemester),
                sgpa: parseFloat(sgpa),
                subjects,
            });
            setSuccessMsg(`Grades submitted for ${student.name}`);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert("Failed to submit: " + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(prev => ({ ...prev, [studentId]: false }));
        }
    };

    if (loading) {
        return (
            <FacultyLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader className="w-10 h-10 animate-spin text-[var(--gu-gold)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Loading Grading Module...</span>
                    </div>
                </div>
            </FacultyLayout>
        );
    }

    if (error) {
        return (
            <FacultyLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="glass-panel p-12 rounded-2xl border border-red-500/20 max-w-lg text-center">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-white/60 text-sm">{error}</p>
                    </div>
                </div>
            </FacultyLayout>
        );
    }

    return (
        <FacultyLayout>
            <div className="animate-fade-in max-w-7xl mx-auto space-y-8 px-4">
                {/* Header */}
                <div className="bg-[var(--gu-red-deep)]/40 p-8 rounded-2xl border border-[var(--gu-gold)]/10 backdrop-blur-sm shadow-2xl">
                    <h1 className="font-serif text-4xl text-white mb-2 tracking-tight">Student Grading</h1>
                    <div className="flex flex-wrap items-center gap-3 text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.3em] opacity-80">
                        <span>Class Teacher: {data?.faculty_name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
                        <span>{data?.course_name} ({data?.course_code})</span>
                    </div>
                </div>

                {/* Success Banner */}
                {successMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-bold">{successMsg}</span>
                    </div>
                )}

                {/* Semester Selector */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-[var(--gu-gold)]"></div>
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Select Semester</label>
                        </div>
                        <div className="relative">
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="bg-white/5 border border-white/10 text-white px-6 py-3 pr-10 rounded-xl text-sm focus:border-[var(--gu-gold)]/50 outline-none appearance-none min-w-[200px]"
                            >
                                {Object.keys(data?.semesters || {}).sort((a, b) => a - b).map(sem => (
                                    <option key={sem} value={sem} className="bg-[#1A0505]">
                                        Semester {sem} ({(data?.semesters?.[sem] || []).length} students)
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-auto">
                            {currentSubjects.length} Subjects &bull; {currentStudents.length} Students
                        </div>
                    </div>
                </div>

                {/* Grading Table */}
                {currentStudents.length === 0 ? (
                    <div className="glass-panel p-16 rounded-2xl border border-white/5 text-center">
                        <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/30 text-sm">No students found in this semester</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {currentStudents.map((student) => (
                            <div key={student.student_id} className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                                {/* Student Header */}
                                <div className="p-5 bg-white/5 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--gu-gold)]/10 flex items-center justify-center text-[var(--gu-gold)] font-bold text-sm">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-sm">{student.name}</h3>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{student.enrollment_no}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-1">SGPA</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="10"
                                                value={sgpaValues[student.student_id] || ''}
                                                onChange={(e) => handleSgpaChange(student.student_id, e.target.value)}
                                                placeholder="0.00"
                                                className="w-24 bg-white/5 border border-white/10 text-[var(--gu-gold)] text-center px-3 py-2 rounded-lg text-sm font-bold focus:border-[var(--gu-gold)]/50 outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleSubmitStudent(student)}
                                            disabled={submitting[student.student_id]}
                                            className="bg-[var(--gu-gold)] text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mt-5"
                                        >
                                            {submitting[student.student_id] ? (
                                                <Loader className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Save className="w-3 h-3" />
                                            )}
                                            Save
                                        </button>
                                    </div>
                                </div>

                                {/* Marks Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead>
                                            <tr className="bg-white/[0.02]">
                                                <th className="py-3 px-5 text-[9px] font-black uppercase tracking-widest text-white/30">Subject</th>
                                                <th className="py-3 px-5 text-[9px] font-black uppercase tracking-widest text-white/30">Code</th>
                                                <th className="py-3 px-5 text-[9px] font-black uppercase tracking-widest text-white/30 text-center">Internal</th>
                                                <th className="py-3 px-5 text-[9px] font-black uppercase tracking-widest text-white/30 text-center">External</th>
                                                <th className="py-3 px-5 text-[9px] font-black uppercase tracking-widest text-white/30 text-center">Practical</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {currentSubjects.map(sub => (
                                                <tr key={sub.subject_id} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-3 px-5 text-white text-xs font-semibold">{sub.name}</td>
                                                    <td className="py-3 px-5 text-white/40 text-xs font-mono">{sub.code}</td>
                                                    <td className="py-3 px-5 text-center">
                                                        <input
                                                            type="number" min="0" max="100"
                                                            value={grades[student.student_id]?.[sub.subject_id]?.internal || ''}
                                                            onChange={(e) => handleMarkChange(student.student_id, sub.subject_id, 'internal', e.target.value)}
                                                            className="w-16 bg-white/5 border border-white/10 text-white text-center px-2 py-1.5 rounded-lg text-xs focus:border-[var(--gu-gold)]/50 outline-none"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-5 text-center">
                                                        <input
                                                            type="number" min="0" max="100"
                                                            value={grades[student.student_id]?.[sub.subject_id]?.external || ''}
                                                            onChange={(e) => handleMarkChange(student.student_id, sub.subject_id, 'external', e.target.value)}
                                                            className="w-16 bg-white/5 border border-white/10 text-white text-center px-2 py-1.5 rounded-lg text-xs focus:border-[var(--gu-gold)]/50 outline-none"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-5 text-center">
                                                        <input
                                                            type="number" min="0" max="100"
                                                            value={grades[student.student_id]?.[sub.subject_id]?.practical || ''}
                                                            onChange={(e) => handleMarkChange(student.student_id, sub.subject_id, 'practical', e.target.value)}
                                                            className="w-16 bg-white/5 border border-white/10 text-white text-center px-2 py-1.5 rounded-lg text-xs focus:border-[var(--gu-gold)]/50 outline-none"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </FacultyLayout>
    );
};

export default Grading;
