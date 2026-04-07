import { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import { CheckCircle, Calendar, Award, Clock, Bell, BookOpen, AlertCircle, ArrowRight } from "lucide-react";
import { studentAPI, attendanceAI } from "../../services/api";
import { Link } from "react-router-dom";

const DUMMY_DASHBOARD = {
  student: { name: "Arjun Kumar", course_code: "MCA", current_semester: 2, enrollment_no: "23032432001" },
  attendance_percentage: 85,
  total_subjects: 6,
  latest_sgpa: 8.8,
  cgpa: 8.5,
  academic_calendar: [
    { id: "1", event: "Mid-Semester Examination", date: "2026-04-15", type: "exam" },
    { id: "2", event: "Sports Week", date: "2026-04-20", type: "event" },
    { id: "3", event: "End-Semester Examination", date: "2026-05-10", type: "exam" },
    { id: "4", event: "Summer Vacation Begins", date: "2026-05-25", type: "holiday" },
  ],
  announcements: [
    { id: "1", title: "Library Timing Extended", message: "Library will remain open till 10 PM during exam period.", date: "2026-04-01", priority: "normal" },
    { id: "2", title: "Scholarship Application Open", message: "Apply for merit scholarship before April 15th.", date: "2026-03-28", priority: "important" },
    { id: "3", title: "Workshop on AI/ML", message: "Free workshop on Machine Learning basics - April 5th at Seminar Hall.", date: "2026-03-25", priority: "normal" },
  ],
};

const Dashboard = () => {
  const [data, setData] = useState(DUMMY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [regStatus, setRegStatus] = useState({ profile_complete: true });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, regRes] = await Promise.all([
          studentAPI.dashboard(),
          attendanceAI.getRegistrationStatus().catch(() => ({ data: { profile_complete: true } }))
        ]);
        setData({ ...DUMMY_DASHBOARD, ...dashRes.data });
        setRegStatus(regRes.data);
      } catch {
        console.warn("Using dummy data - backend not available");
        setData(DUMMY_DASHBOARD);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <StudentLayout><div className="flex items-center justify-center h-64"><p className="text-white text-lg animate-pulse">Loading dashboard...</p></div></StudentLayout>;
  }

  const gradeLabel = data.latest_sgpa ? (data.latest_sgpa >= 9 ? "A+" : data.latest_sgpa >= 8 ? "A" : data.latest_sgpa >= 7 ? "B" : "C") : "—";

  const getEventColor = (type) => {
    switch (type) {
      case "exam": return "text-[#f87171]";
      case "holiday": return "text-[#4ade80]";
      case "event": return "text-[#60a5fa]";
      default: return "text-[var(--gu-gold)]";
    }
  };

  const getEventBadge = (type) => {
    switch (type) {
      case "exam": return "bg-red-900/50 text-red-300";
      case "holiday": return "bg-green-900/50 text-green-300";
      case "event": return "bg-blue-900/50 text-blue-300";
      default: return "bg-yellow-900/50 text-yellow-300";
    }
  };

  return (
    <StudentLayout>
      <div className="relative">
        <div className="fixed inset-0 z-0" style={{ backgroundImage: "url(/maxresdefault.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", opacity: 0.3 }}></div>
        <div className="animate-fade-in relative z-10">
          <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 break-words word-wrap">
            <h1 className="font-serif text-2xl md:text-3xl text-white mb-2">
              Welcome back, {data.student?.name || "Student"}!
            </h1>
            <p className="text-[var(--gu-gold)] text-xs md:text-sm mb-1 uppercase tracking-wider font-semibold flex flex-wrap gap-2">
              <span>{data.student?.course_code || data.student?.course_name}</span>
              <span>&middot; Semester {data.student?.current_semester || data.student?.semester}</span>
              <span>&middot; Enrollment: {data.student?.enrollment_no}</span>
            </p>
            <p className="text-white opacity-60 text-sm">{today}</p>
          </div>

          {/* AI Attendance Setup Banner */}
          {!regStatus.profile_complete && (
            <Link to="/student/attendance-setup" className="block mb-8 group">
              <div className="bg-gradient-to-r from-[var(--gu-red-dark)] to-[#7B0D0D] border border-[var(--gu-gold)]/30 rounded-xl p-5 flex items-center justify-between hover:border-[var(--gu-gold)] transition-all shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--gu-gold)]/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="text-[var(--gu-gold)] w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-serif font-semibold text-lg md:text-xl">Complete AI Attendance Setup</h3>
                    <p className="text-white/60 text-sm md:text-base">
                      {!regStatus.is_details_filled
                        ? "Your personal details are missing. Setup is required for attendance tracking."
                        : "Your face is not registered yet. Complete biometric setup to mark attendance."}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[var(--gu-gold)] font-bold group-hover:translate-x-1 transition-transform">
                  Setup Now <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm relative overflow-hidden flex flex-col justify-between box-border">
              <div className="flex justify-between items-start mb-4">
                <span className="text-white opacity-70 text-xs uppercase tracking-spaced font-semibold">Attendance</span>
                <CheckCircle className="text-[var(--gu-gold)] w-7 h-7 flex-shrink-0" />
              </div>
              <div className="font-serif text-3xl md:text-4xl text-[#4ade80] font-bold">{data.attendance_percentage}%</div>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--gu-gold)]"></div>
            </div>
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm relative overflow-hidden flex flex-col justify-between box-border">
              <div className="flex justify-between items-start mb-4">
                <span className="text-white opacity-70 text-xs uppercase tracking-spaced font-semibold">Subjects</span>
                <BookOpen className="text-[var(--gu-gold)] w-7 h-7 flex-shrink-0" />
              </div>
              <div className="font-serif text-3xl md:text-4xl text-[var(--gu-gold)] font-bold">{data.total_subjects || 6}</div>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--gu-gold)]"></div>
            </div>
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm relative overflow-hidden flex flex-col justify-between box-border">
              <div className="flex justify-between items-start mb-4">
                <span className="text-white opacity-70 text-xs uppercase tracking-spaced font-semibold">Latest SGPA</span>
                <Award className="text-[var(--gu-gold)] w-7 h-7 flex-shrink-0" />
              </div>
              <div className="font-serif text-3xl md:text-4xl text-white font-bold">{data.latest_sgpa || "—"}</div>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--gu-gold)]"></div>
            </div>
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-4 md:p-6 rounded-sm relative overflow-hidden flex flex-col justify-between box-border">
              <div className="flex justify-between items-start mb-4">
                <span className="text-white opacity-70 text-xs uppercase tracking-spaced font-semibold">CGPA</span>
                <Clock className="text-[var(--gu-gold)] w-7 h-7 flex-shrink-0" />
              </div>
              <div className="font-serif text-3xl md:text-4xl text-[#4ade80] font-bold">{data.cgpa || "—"}</div>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--gu-gold)]"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Academic Calendar */}
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm overflow-hidden box-border">
              <h2 className="font-serif text-white text-lg md:text-xl pb-4 border-b border-[var(--gu-border)] border-l-3 border-l-[var(--gu-gold)] pl-3 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--gu-gold)]" />
                Academic Calendar
              </h2>
              <div className="space-y-3">
                {(data.academic_calendar || []).map((event) => (
                  <div key={event.id} className="bg-[#3D0F0F] border border-[var(--gu-border)] p-4 rounded-sm flex justify-between items-center hover:border-[var(--gu-gold)] transition-colors overflow-hidden">
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-semibold text-sm md:text-base mb-1 word-wrap break-words">{event.event}</span>
                      <span className={`text-xs font-semibold ${getEventColor(event.type)}`}>
                        {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${getEventBadge(event.type)}`}>
                      {event.type}
                    </span>
                  </div>
                ))}
                {(!data.academic_calendar || data.academic_calendar.length === 0) && (
                  <p className="text-white opacity-50 text-sm">No upcoming events</p>
                )}
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm overflow-hidden box-border">
              <h2 className="font-serif text-white text-lg md:text-xl pb-4 border-b border-[var(--gu-border)] border-l-3 border-l-[var(--gu-gold)] pl-3 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[var(--gu-gold)]" />
                Announcements
              </h2>
              <div className="space-y-3">
                {(data.announcements || []).map((announcement) => (
                  <div key={announcement.id} className="bg-[#3D0F0F] border border-[var(--gu-border)] p-4 rounded-sm hover:border-[var(--gu-gold)] transition-colors overflow-hidden">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-white font-semibold text-sm md:text-base word-wrap break-words flex-1">
                        {announcement.priority === "important" && (
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                        )}
                        {announcement.title}
                      </span>
                      <span className="text-white opacity-40 text-xs ml-2 flex-shrink-0">
                        {new Date(announcement.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-white opacity-70 text-xs md:text-sm">{announcement.message}</p>
                  </div>
                ))}
                {(!data.announcements || data.announcements.length === 0) && (
                  <p className="text-white opacity-50 text-sm">No announcements</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Dashboard;
