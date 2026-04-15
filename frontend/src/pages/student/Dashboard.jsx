import { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";
import { CheckCircle, Calendar, Award, Clock, Bell, BookOpen, AlertCircle, ArrowRight, Camera } from "lucide-react";
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
      <div className="animate-fade-in max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[var(--gu-red-deep)]/40 p-8 rounded-2xl border border-[var(--gu-gold)]/10 backdrop-blur-sm shadow-2xl">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl text-white mb-2 tracking-tight">
              Student Portal
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.3em] opacity-80">
              <span>{data.student?.name || "Student Core"}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
              <span>{data.student?.course_code || "MCA"}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
              <span>Semester {data.student?.current_semester || 2}</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 py-3 px-6 rounded-full backdrop-blur-md flex items-center gap-3">
             <Calendar className="w-4 h-4 text-[var(--gu-gold)]" />
             <span className="text-white text-[10px] font-black uppercase tracking-widest">{today}</span>
          </div>
        </div>

        {/* AI Attendance Setup Banner */}
        {!regStatus.profile_complete && (
          <Link to="/student/attendance-setup" className="block group animate-reveal-down">
            <div className="bg-gradient-to-r from-[var(--gu-red-dark)] via-[#7B0D0D] to-[#4A0505] border border-[var(--gu-gold)]/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between hover:border-[var(--gu-gold)] transition-all shadow-[0_0_30px_rgba(139,0,0,0.3)] gap-4">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-[var(--gu-gold)]/20 rounded-2xl flex items-center justify-center border border-[var(--gu-gold)]/20 group-hover:scale-110 transition-transform">
                  <AlertCircle className="text-[var(--gu-gold)] w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-white font-serif font-bold text-2xl mb-1 tracking-tight">Biometric Registration Required</h3>
                  <p className="text-white/60 text-sm italic font-serif">
                    {!regStatus.is_details_filled
                      ? "Establish your digital twin for AI attendance tracking."
                      : "Your face biometric signature is missing. Complete setup to begin."}
                  </p>
                </div>
              </div>
              <div className="bg-[var(--gu-gold)] text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] group-hover:px-10 transition-all flex items-center gap-2">
                Initialize Setup <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          {[
            { to: "/student/attendance-camera", icon: Camera, label: "Mark Session", desc: "AI Face Sync", color: "text-emerald-400" },
            { to: "/student/attendance-setup", icon: Camera, label: "Face Setup", desc: "Biometric ID", color: "text-[var(--gu-gold)]" },
            { to: "/student/attendance", icon: CheckCircle, label: "View Records", desc: "Logs & Trends", color: "text-blue-400" },
            { to: "/student/timetable", icon: Calendar, label: "Schedule", desc: "Weekly Cycle", color: "text-purple-400" }
          ].map((action, i) => (
            <Link key={i} to={action.to} className="group glass-panel p-8 rounded-2xl hover:scale-[1.02] transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-all ${action.color}`}>
                <action.icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-white text-sm font-black uppercase tracking-widest block mb-1">{action.label}</span>
                <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">{action.desc}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--gu-gold)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up animate-stagger-1">
          {[
            { label: "Attendance Status", val: `${data.attendance_percentage}%`, icon: CheckCircle, color: "text-[#4ade80]" },
            { label: "Active Subjects", val: data.total_subjects || 6, icon: BookOpen, color: "text-[var(--gu-gold)]" },
            { label: "Semester SGPA", val: data.latest_sgpa || "—", icon: Award, color: "text-white" },
            { label: "Cumulative CGPA", val: data.cgpa || "—", icon: Clock, color: "text-[#4ade80]" }
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-8 rounded-2xl flex flex-col justify-between h-40 group">
              <div className="flex justify-between items-start">
                <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</span>
                <stat.icon className={`w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-500 ${stat.color}`} />
              </div>
              <div>
                <div className={`font-serif text-4xl font-bold tracking-tighter ${stat.color}`}>{stat.val}</div>
                <div className="w-10 h-1 bg-white/10 mt-3 group-hover:w-full transition-all duration-700"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up animate-stagger-2">
          {/* Calendar Block */}
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[var(--gu-gold)]" />
              <h2 className="font-serif text-xl text-white tracking-tight">Academic Milestones</h2>
            </div>
            <div className="p-8 space-y-4 overflow-y-auto max-h-[400px]">
              {(data.academic_calendar || []).map((event) => (
                <div key={event.id} className="bg-white/5 border border-white/5 p-5 rounded-2xl flex justify-between items-center group hover:bg-white/10 hover:border-[var(--gu-gold)]/20 transition-all">
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-bold text-base mb-1 group-hover:text-[var(--gu-gold)] transition-colors">{event.event}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getEventColor(event.type)}`}>
                      <span className="w-1 h-1 rounded-full bg-current"></span>
                      {new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <span className={`text-[9px] px-3 py-1.5 rounded-full uppercase font-black tracking-widest border ${getEventBadge(event.type)}`}>
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements Block */}
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
              <Bell className="w-5 h-5 text-[var(--gu-gold)]" />
              <h2 className="font-serif text-xl text-white tracking-tight">Campus Newsroom</h2>
            </div>
            <div className="p-8 space-y-4 overflow-y-auto max-h-[400px]">
              {(data.announcements || []).map((ann) => (
                <div key={ann.id} className="bg-white/5 border border-white/5 p-6 rounded-2xl group hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {ann.priority === "important" && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>}
                      <span className="text-[var(--gu-gold)] text-[10px] font-black uppercase tracking-widest">Broadcast</span>
                    </div>
                    <span className="text-white/20 text-[10px] font-bold">
                      {new Date(ann.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-base mb-2 group-hover:text-[var(--gu-gold)] transition-colors tracking-tight">{ann.title}</h4>
                  <p className="text-white/50 text-sm leading-relaxed font-serif italic">{ann.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Dashboard;
