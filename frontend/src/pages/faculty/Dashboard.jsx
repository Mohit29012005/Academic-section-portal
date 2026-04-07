import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/FacultyLayout';
import {
    Clock, BookOpen, Users, FileText, Calendar,
    ChevronRight, BarChart3, Sparkles, AlertTriangle,
    Loader2, GraduationCap, Bell, Target
} from 'lucide-react';
import { facultyAPI } from '../../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [greeting, setGreeting] = useState('');

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const res = await facultyAPI.dashboard();
                setData(res.data);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const getAttendanceColor = (pct) => {
        if (pct >= 75) return 'text-[#4ade80]';
        if (pct >= 50) return 'text-[var(--gu-gold)]';
        return 'text-[#f87171]';
    };

    const getAttendanceBg = (pct) => {
        if (pct >= 75) return 'bg-[#4ade80]';
        if (pct >= 50) return 'bg-[var(--gu-gold)]';
        return 'bg-[#f87171]';
    };

    if (loading) {
        return (
            <FacultyLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 text-[var(--gu-gold)] animate-spin mx-auto mb-4" />
                        <p className="text-white/60 text-sm">Loading dashboard...</p>
                    </div>
                </div>
            </FacultyLayout>
        );
    }

    if (error) {
        return (
            <FacultyLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <AlertTriangle className="w-10 h-10 text-[#f87171] mx-auto mb-4" />
                        <p className="text-white/60 text-sm">{error}</p>
                        <button onClick={() => window.location.reload()} className="mt-4 text-[var(--gu-gold)] underline text-sm">Retry</button>
                    </div>
                </div>
            </FacultyLayout>
        );
    }

    const faculty = data?.faculty || {};
    const subjects = data?.subjects || [];
    const todayClasses = data?.today_classes || [];
    const lowestAttendance = data?.lowest_attendance_per_course || [];

    return (
        <FacultyLayout>
            <div className="animate-fade-in">

                {/* ═══ Welcome Header ═══ */}
                <div className="border-b border-[var(--gu-gold)] pb-6 mb-8">
                    <p className="text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold mb-1">{greeting}</p>
                    <h1 className="font-serif text-2xl md:text-3xl text-white mb-2">{faculty.name || 'Faculty'}</h1>
                    <p className="text-white/50 text-xs md:text-sm flex flex-wrap gap-2">
                        <span>{faculty.department || 'Department'}</span>
                        <span>·</span>
                        <span>ID: {faculty.employee_id || '—'}</span>
                        <span>·</span>
                        <span>{today}</span>
                    </p>
                </div>

                {/* ═══ Stats Grid — 3 Cards ═══ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-8">
                    {[
                        { label: "Subjects Assigned", value: subjects.length, icon: BookOpen, color: "text-[var(--gu-gold)]", accent: "bg-[var(--gu-gold)]" },
                        { label: "Total Students", value: data?.total_students || 0, icon: Users, color: "text-white", accent: "bg-[var(--gu-gold)]" },
                        { label: "Exam Papers", value: data?.generated_papers_count || 0, icon: FileText, color: "text-[var(--gu-gold)]", accent: "bg-[var(--gu-gold)]" },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-5 rounded-sm relative overflow-hidden group hover:border-[var(--gu-gold)] transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-white opacity-70 text-[10px] md:text-xs uppercase tracking-wider font-semibold">{stat.label}</span>
                                <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color} opacity-80 flex-shrink-0`} />
                            </div>
                            <div className={`font-serif text-2xl md:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                            <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${stat.accent}`}></div>
                        </div>
                    ))}
                </div>

                {/* ═══ Main Content Grid ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* ─── Today's Schedule ─── */}
                    <div className="lg:col-span-2 bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
                        <h2 className="font-serif text-white text-lg pb-4 border-b border-[var(--gu-border)] mb-5 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[var(--gu-gold)]" />
                            Today's Schedule
                        </h2>
                        {todayClasses.length > 0 ? (
                            <div className="space-y-3">
                                {todayClasses.map((cls, idx) => (
                                    <div key={idx} className="bg-[#3D0F0F] border border-[var(--gu-border)] rounded-sm p-4 flex items-center gap-4 hover:border-[var(--gu-gold)] transition-colors">
                                        <div className="text-center flex-shrink-0 w-16">
                                            <div className="text-[var(--gu-gold)] font-bold text-sm">
                                                {cls.time ? new Date(`2000-01-01T${cls.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[0] : '—'}
                                            </div>
                                            <div className="text-white/40 text-[10px] uppercase">
                                                {cls.time ? new Date(`2000-01-01T${cls.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[1] : ''}
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-[var(--gu-gold)]/30 flex-shrink-0"></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white font-semibold text-sm truncate">{cls.subject_name || cls.subject?.name || 'Subject'}</div>
                                            <div className="text-white/50 text-xs mt-0.5">{cls.section || 'Section A'} · Room {cls.room || '—'}</div>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm flex-shrink-0 ${cls.attendance_marked ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                                            }`}>
                                            {cls.attendance_marked ? '✓ Marked' : 'Pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                <p className="text-white/40 text-sm">No classes scheduled for today</p>
                                <button onClick={() => navigate('/faculty/attendance')} className="mt-3 text-[var(--gu-gold)] text-xs underline">View full schedule</button>
                            </div>
                        )}
                    </div>

                    {/* ─── Assigned Subjects ─── */}
                    <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
                        <h2 className="font-serif text-white text-lg pb-4 border-b border-[var(--gu-border)] mb-5 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[var(--gu-gold)]" />
                            Assigned Subjects
                        </h2>
                        {subjects.length > 0 ? (
                            <div className="space-y-3">
                                {subjects.map((sub, idx) => (
                                    <div key={idx} className="bg-[#3D0F0F] border border-[var(--gu-border)] p-4 rounded-sm hover:border-[var(--gu-gold)] transition-colors">
                                        <div className="text-white font-semibold text-sm">{sub.name}</div>
                                        <div className="text-white/40 text-xs mt-1">{sub.code} · Sem {sub.semester} · {sub.credits} Credits</div>
                                        <div className="mt-2">
                                            <span className="bg-[var(--gu-gold)]/10 text-[var(--gu-gold)] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                                                {sub.course_code || '—'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                <p className="text-white/40 text-sm">No subjects assigned yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ Lowest Attendance Per Course ═══ */}
                {lowestAttendance.length > 0 && (
                    <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm mb-8">
                        <h2 className="font-serif text-white text-lg pb-4 border-b border-[var(--gu-border)] mb-5 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-[#f87171]" />
                            Lowest Attendance — Per Course
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-white/50 text-xs uppercase tracking-wider border-b border-[var(--gu-border)]">
                                        <th className="text-left py-3 pr-3 font-semibold">Course</th>
                                        <th className="text-left py-3 pr-3 font-semibold">Student</th>
                                        <th className="text-left py-3 pr-3 font-semibold">Enrollment No</th>
                                        <th className="text-center py-3 pr-3 font-semibold">Present</th>
                                        <th className="text-center py-3 pr-3 font-semibold">Absent</th>
                                        <th className="text-center py-3 font-semibold">Attendance %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowestAttendance.map((row, idx) => (
                                        <tr key={idx} className="border-b border-[var(--gu-border)]/50 hover:bg-white/5 transition-colors">
                                            <td className="py-3 pr-3">
                                                <span className="bg-[var(--gu-gold)]/10 text-[var(--gu-gold)] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">{row.course_code}</span>
                                            </td>
                                            <td className="py-3 pr-3">
                                                <div className="text-white font-medium">{row.student_name}</div>
                                            </td>
                                            <td className="py-3 pr-3 text-white/60 text-xs font-mono">{row.enrollment_no}</td>
                                            <td className="py-3 pr-3 text-center text-[#4ade80] font-semibold">{row.present}</td>
                                            <td className="py-3 pr-3 text-center text-[#f87171] font-semibold">{row.absent}</td>
                                            <td className="py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${getAttendanceBg(row.percentage)}`} style={{ width: `${Math.max(row.percentage, 2)}%` }}></div>
                                                    </div>
                                                    <span className={`text-xs font-bold ${getAttendanceColor(row.percentage)}`}>{row.percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ═══ Quick Actions ═══ */}
                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm">
                    <h2 className="font-serif text-white text-lg pb-4 border-b border-[var(--gu-border)] mb-5 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[var(--gu-gold)]" />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onClick={() => navigate('/faculty/attendance')}
                            className="flex items-center gap-3 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] py-3 px-4 rounded-sm font-semibold text-sm uppercase tracking-wider hover:bg-white transition-all hover:shadow-lg card-hover">
                            <Users className="w-5 h-5 flex-shrink-0" /> AI Attendance
                        </button>
                        <button onClick={() => navigate('/faculty/exam-papers')}
                            className="flex items-center gap-3 bg-[#3D0F0F] text-white border border-[var(--gu-border)] py-3 px-4 rounded-sm font-semibold text-sm uppercase tracking-wider hover:border-[var(--gu-gold)] hover:text-[var(--gu-gold)] transition-all card-hover">
                            <FileText className="w-5 h-5 flex-shrink-0" /> Exam Papers
                        </button>
                        <button onClick={() => navigate('/faculty/timetable')}
                            className="flex items-center gap-3 bg-[#3D0F0F] text-white border border-[var(--gu-border)] py-3 px-4 rounded-sm font-semibold text-sm uppercase tracking-wider hover:border-[var(--gu-gold)] hover:text-[var(--gu-gold)] transition-all card-hover">
                            <Sparkles className="w-5 h-5 flex-shrink-0" /> Timetable
                        </button>
                        <button onClick={() => navigate('/faculty/profile')}
                            className="flex items-center gap-3 bg-[#3D0F0F] text-white border border-[var(--gu-border)] py-3 px-4 rounded-sm font-semibold text-sm uppercase tracking-wider hover:border-[var(--gu-gold)] hover:text-[var(--gu-gold)] transition-all card-hover">
                            <GraduationCap className="w-5 h-5 flex-shrink-0" /> My Profile
                        </button>
                    </div>
                </div>

            </div>
        </FacultyLayout>
    );
};

export default Dashboard;
