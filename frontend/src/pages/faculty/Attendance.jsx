import { useState, useEffect } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import { CheckCircle, AlertCircle, Loader2, Lock } from 'lucide-react';
import { facultyAPI, academicsAPI } from '../../services/api';

const Attendance = () => {
    const [courses, setCourses] = useState([]);
    const [facultySubjects, setFacultySubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [studentsLoaded, setStudentsLoaded] = useState(false);
    const [attendance, setAttendance] = useState({});
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [checkingSubmission, setCheckingSubmission] = useState(false);

    // Track locally submitted combos within this session
    const [submittedCombos, setSubmittedCombos] = useState(new Set());

    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [date, setDate] = useState('');

    // Fetch faculty profile (assigned subjects) + all courses on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [dashRes, courseRes] = await Promise.all([
                    facultyAPI.dashboard(),
                    academicsAPI.courses(),
                ]);
                const subjects = dashRes.data.subjects || [];
                setFacultySubjects(subjects);
                
                // Filter courses to only those associated with the faculty's assigned subjects
                const assignedCourseIds = new Set(subjects.map(s => s.course_id));
                const allCourses = courseRes.data;
                const assignedCourses = allCourses.filter(c => assignedCourseIds.has(c.course_id));
                
                // Default to all courses if for some reason nothing is assigned (admin override) or no course_id was passed
                setCourses(assignedCourses.length > 0 ? assignedCourses : allCourses);

                // If faculty has only one subject, auto-select it
                if (subjects.length === 1) {
                    setSelectedSubject(subjects[0].subject_id);
                }
                
                // If faculty has only one course, auto-select it
                if (assignedCourses.length === 1) {
                    setSelectedCourse(assignedCourses[0].course_id);
                }
            } catch (err) {
                console.error('Failed to fetch initial data:', err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Check if attendance already submitted when subject + date change
    useEffect(() => {
        if (!selectedSubject || !date) {
            setAlreadySubmitted(false);
            return;
        }

        // Check local cache first
        const comboKey = `${selectedSubject}__${date}`;
        if (submittedCombos.has(comboKey)) {
            setAlreadySubmitted(true);
            return;
        }

        // Check backend
        const checkSubmission = async () => {
            setCheckingSubmission(true);
            try {
                const res = await facultyAPI.checkAttendance({ subject_id: selectedSubject, date });
                setAlreadySubmitted(res.data.submitted);
            } catch (err) {
                console.error('Failed to check attendance status:', err);
                setAlreadySubmitted(false);
            } finally {
                setCheckingSubmission(false);
            }
        };
        checkSubmission();
    }, [selectedSubject, date, submittedCombos]);

    // Reset student list when filters change
    useEffect(() => {
        setStudentsLoaded(false);
        setStudents([]);
        setAttendance({});
        setSuccessMsg('');
        setErrorMsg('');
    }, [selectedCourse, selectedSubject, date]);

    const handleLoad = async () => {
        if (!selectedSubject || !date) {
            setErrorMsg('Please select a subject and date before loading students.');
            return;
        }
        if (!selectedCourse) {
            setErrorMsg('Please select a course to load students.');
            return;
        }
        setErrorMsg('');
        setLoading(true);
        try {
            const res = await facultyAPI.students({ course_id: selectedCourse });
            setStudents(res.data);
            setStudentsLoaded(true);
            setAttendance({});
            setSuccessMsg('');
        } catch (err) {
            console.error('Failed to fetch students:', err);
            setErrorMsg('Failed to load students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAll = (status) => {
        const newAtt = {};
        students.forEach(s => newAtt[s.student_id] = status);
        setAttendance(newAtt);
    };

    const toggleStudent = (id, status) => {
        setAttendance(prev => ({
            ...prev,
            [id]: status
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setErrorMsg('');
        try {
            const records = students.map(s => ({
                student_id: s.student_id,
                status: attendance[s.student_id] || 'absent',
            }));
            await facultyAPI.markAttendance({
                subject_id: selectedSubject,
                date,
                records,
                method: 'manual',
            });

            // Mark this combo as submitted
            const comboKey = `${selectedSubject}__${date}`;
            setSubmittedCombos(prev => new Set([...prev, comboKey]));
            setAlreadySubmitted(true);

            const subjectName = facultySubjects.find(s => s.subject_id === selectedSubject)?.name || '';
            const courseLabel = courses.find(c => String(c.course_id) === selectedCourse)?.name || '';
            setSuccessMsg(`Attendance submitted successfully for ${subjectName} — ${courseLabel} on ${date}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Failed to submit attendance:', err);
            setErrorMsg('Failed to submit attendance. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const markedCount = Object.keys(attendance).length;
    const courseName = courses.find(c => String(c.course_id) === selectedCourse)?.name || '';
    const subjectName = facultySubjects.find(s => s.subject_id === selectedSubject)?.name || '';

    if (initialLoading) {
        return (
            <FacultyLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--gu-gold)]" />
                </div>
            </FacultyLayout>
        );
    }

    return (
        <FacultyLayout>
            <div className="animate-fade-in max-w-5xl mx-auto">

                <div className="border-b border-[var(--gu-gold)] pb-6 mb-8">
                    <h1 className="font-serif text-3xl text-white mb-2">Mark Attendance</h1>
                    <p className="text-[var(--gu-gold)] text-sm uppercase tracking-wider font-semibold">
                        {facultySubjects.length === 0
                            ? 'No subjects assigned — contact admin'
                            : 'Select your subject, course & date to record attendance'}
                    </p>
                </div>

                {successMsg && (
                    <div className="bg-[rgba(74,222,128,0.1)] border border-[#4ade80] p-4 rounded-sm flex items-center mb-6 animate-fade-in">
                        <CheckCircle className="text-[#4ade80] w-6 h-6 mr-4 shrink-0" />
                        <p className="text-[#4ade80] font-medium">{successMsg}</p>
                    </div>
                )}

                {errorMsg && (
                    <div className="bg-[rgba(248,113,113,0.1)] border border-[#f87171] p-4 rounded-sm flex items-center mb-6 animate-fade-in">
                        <AlertCircle className="text-[#f87171] w-6 h-6 mr-4 shrink-0" />
                        <p className="text-[#f87171] font-medium">{errorMsg}</p>
                    </div>
                )}

                {/* Already submitted banner */}
                {alreadySubmitted && selectedSubject && date && (
                    <div className="bg-[rgba(250,204,21,0.1)] border border-yellow-500 p-4 rounded-sm flex items-center mb-6 animate-fade-in">
                        <Lock className="text-yellow-400 w-6 h-6 mr-4 shrink-0" />
                        <div>
                            <p className="text-yellow-400 font-semibold">Attendance already submitted</p>
                            <p className="text-yellow-400/70 text-sm">Attendance for {subjectName} on {date} has already been recorded. Select a different date or subject.</p>
                        </div>
                    </div>
                )}

                {facultySubjects.length === 0 ? (
                    <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm p-8 text-center">
                        <p className="text-white/60 text-lg">No subjects have been assigned to you yet.</p>
                        <p className="text-white/40 text-sm mt-2">Please contact the administrator to get subjects assigned.</p>
                    </div>
                ) : (
                    <>
                        {/* Step 1: Filters */}
                        <div className="bg-[var(--gu-red-card)] p-4 md:p-6 border border-[var(--gu-border)] rounded-sm mb-6 overflow-hidden box-border">
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                {/* Subject Dropdown (or auto-locked if only one) */}
                                <div className="flex-1 w-full min-w-0">
                                    <label className="block text-xs uppercase tracking-widest text-white opacity-70 font-semibold mb-2">
                                        {facultySubjects.length === 1 ? 'Your Subject' : 'Select Subject'}
                                    </label>
                                    {facultySubjects.length === 1 ? (
                                        <div className="w-full bg-[#3D0F0F] border border-[var(--gu-gold)] text-[var(--gu-gold)] p-3 rounded-sm font-semibold">
                                            {facultySubjects[0].code ? `${facultySubjects[0].code} — ` : ''}{facultySubjects[0].name}
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="w-full box-border appearance-none bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)]"
                                        >
                                            <option value="">— Choose a Subject —</option>
                                            {facultySubjects.map(s => (
                                                <option key={s.subject_id} value={s.subject_id}>
                                                    {s.code ? `${s.code} — ` : ''}{s.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Course Dropdown */}
                                <div className="flex-1 w-full min-w-0">
                                    <label className="block text-xs uppercase tracking-widest text-white opacity-70 font-semibold mb-2">Select Course</label>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="w-full box-border appearance-none bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)]"
                                    >
                                        <option value="">— Choose a Course —</option>
                                        {courses.map(c => (
                                            <option key={c.course_id} value={c.course_id}>
                                                {c.code ? `${c.code} — ` : ''}{c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date */}
                                <div className="flex-1 w-full min-w-0">
                                    <label className="block text-xs uppercase tracking-widest text-white opacity-70 font-semibold mb-2">Select Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full box-border bg-[#3D0F0F] border border-[var(--gu-border)] text-white p-3 rounded-sm focus:outline-none focus:border-[var(--gu-gold)] color-scheme-dark"
                                    />
                                </div>

                                {/* Load Button */}
                                <button
                                    onClick={handleLoad}
                                    disabled={loading || !selectedSubject || !selectedCourse || !date || alreadySubmitted || checkingSubmission}
                                    className="bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-6 py-3 font-semibold uppercase tracking-wider rounded-sm hover:bg-[#e6c949] transition-colors flex-shrink-0 whitespace-nowrap w-full md:w-auto h-[46px] disabled:opacity-40 flex items-center justify-center gap-2"
                                >
                                    {(loading || checkingSubmission) && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {checkingSubmission ? 'Checking...' : 'Load Students'}
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Student List */}
                        {studentsLoaded && !alreadySubmitted && (
                            <div className="animate-fade-in bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm p-4 md:p-6 mt-8 overflow-hidden box-border">
                                <h2 className="font-serif text-white text-xl mb-1 word-wrap break-words">
                                    Students — {subjectName}
                                </h2>
                                <p className="text-white/50 text-sm mb-4">Course: {courseName}</p>

                                {students.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-white/60 text-lg">No students found for this course.</p>
                                        <p className="text-white/40 text-sm mt-2">Try selecting a different course.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[var(--gu-border)] flex-wrap">
                                            <div className="text-[var(--gu-gold)] text-sm font-semibold tracking-wider uppercase">
                                                {students.length} Students &middot; {markedCount} Marked
                                            </div>
                                            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                                                <button
                                                    onClick={() => handleMarkAll('present')}
                                                    className="flex-1 sm:flex-none text-center bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-4 py-1.5 text-xs md:text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#e6c949] transition-colors whitespace-nowrap"
                                                >
                                                    Mark All Present
                                                </button>
                                                <button
                                                    onClick={() => handleMarkAll('absent')}
                                                    className="flex-1 sm:flex-none text-center bg-[var(--gu-red)] text-white px-4 py-1.5 text-xs md:text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#5c0000] transition-colors whitespace-nowrap"
                                                >
                                                    Mark All Absent
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {students.map((s) => {
                                                const isPresent = attendance[s.student_id] === 'present';
                                                const isAbsent = attendance[s.student_id] === 'absent';

                                                return (
                                                    <div key={s.student_id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 md:p-4 border-b border-[var(--gu-border)] hover:bg-[rgba(255,255,255,0.02)] transition-colors gap-3 md:gap-4 overflow-hidden box-border">
                                                        <div className="flex items-center space-x-3 md:space-x-4 w-full sm:w-auto min-w-0 overflow-hidden">
                                                            <span className="text-[var(--gu-gold)] text-xs md:text-sm font-mono tracking-wider w-24 md:w-28 flex-shrink-0 truncate">{s.enrollment_no}</span>
                                                            <span className="text-white font-medium text-sm md:text-base truncate flex-1 min-w-0">{s.name}</span>
                                                        </div>

                                                        <div className="flex space-x-2 w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0">
                                                            <button
                                                                onClick={() => toggleStudent(s.student_id, 'present')}
                                                                className={`flex-1 sm:flex-none px-4 md:px-6 py-1.5 text-xs md:text-sm font-bold uppercase tracking-widest rounded-sm transition-colors border ${isPresent
                                                                    ? 'bg-[#4ade80] text-[var(--gu-red-deep)] border-[#4ade80]'
                                                                    : 'bg-[#3D0F0F] text-white border-[var(--gu-border)] hover:border-[#4ade80]'
                                                                    }`}
                                                            >
                                                                Present
                                                            </button>
                                                            <button
                                                                onClick={() => toggleStudent(s.student_id, 'absent')}
                                                                className={`flex-1 sm:flex-none px-4 md:px-6 py-1.5 text-xs md:text-sm font-bold uppercase tracking-widest rounded-sm transition-colors border ${isAbsent
                                                                    ? 'bg-[#f87171] text-[var(--gu-red-deep)] border-[#f87171]'
                                                                    : 'bg-[#3D0F0F] text-white border-[var(--gu-border)] hover:border-[#f87171]'
                                                                    }`}
                                                            >
                                                                Absent
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-8 flex flex-col sm:flex-row gap-4 border-t border-[var(--gu-border)] pt-6">
                                            <button
                                                onClick={handleSubmit}
                                                className="bg-[var(--gu-gold)] text-[var(--gu-red-deep)] px-6 md:px-8 py-3 font-serif text-base md:text-lg font-bold tracking-wide rounded-sm hover:bg-[#e6c949] transition-colors whitespace-nowrap text-center disabled:opacity-40 flex items-center justify-center gap-2"
                                                disabled={markedCount !== students.length || submitting || alreadySubmitted}
                                            >
                                                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                                                {alreadySubmitted ? 'Already Submitted' : 'Submit Attendance'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}

            </div>
        </FacultyLayout>
    );
};

export default Attendance;
