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
        <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="font-serif text-3xl text-white mb-2">
              Student Dashboard
            </h1>
            <p className="text-[var(--gu-gold)] text-sm uppercase tracking-wider font-semibold">
              {data.student?.name || "Student Core"} &middot; {data.student?.course_code || "MCA"} &middot; Semester {data.student?.current_semester || 2}
            </p>
          </div>
          <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] py-2 px-4 rounded-sm flex items-center gap-3 shadow-md">
             <Calendar className="w-4 h-4 text-[var(--gu-gold)]" />
             <span className="text-white text-xs font-semibold uppercase tracking-widest">{today}</span>
          </div>
        </div>

        {/* AI Attendance Setup Banner */}
        {!regStatus.profile_complete && (
          <Link to="/student/attendance-setup" className="block group animate-fade-in mb-8">
            <div className="bg-[rgba(250,204,21,0.1)] border border-yellow-400 p-4 rounded-sm flex flex-col md:flex-row items-center justify-between transition-all gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-400 w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h3 className="text-yellow-400 font-bold text-sm md:text-base mb-1 tracking-tight">Biometric Registration Required</h3>
                  <p className="text-yellow-400/80 text-sm">
                    {!regStatus.is_details_filled
                      ? "Establish your digital twin for AI attendance tracking."
                      : "Your face biometric signature is missing. Complete setup to begin."}
                  </p>
                </div>
              </div>
              <div className="bg-yellow-400 text-black px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-yellow-300 transition-colors flex items-center gap-2 whitespace-nowrap">
                Initialize Setup <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { to: "/student/attendance-camera", icon: Camera, label: "Mark Session", desc: "AI Face Sync", color: "text-[#4ade80]" },
            { to: "/student/attendance-setup", icon: Camera, label: "Face Setup", desc: "Biometric ID", color: "text-[var(--gu-gold)]" },
            { to: "/student/attendance", icon: CheckCircle, label: "View Records", desc: "Logs & Trends", color: "text-[#60a5fa]" },
            { to: "/student/timetable", icon: Calendar, label: "Schedule", desc: "Weekly Cycle", color: "text-[#c084fc]" }
          ].map((action, i) => (
            <Link key={i} to={action.to} className="group bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm hover:-translate-y-1 transition-transform flex flex-col items-center text-center gap-3">
              <div className={`w-12 h-12 bg-[#3D0F0F] rounded-full flex items-center justify-center border border-[var(--gu-gold)]/20 group-hover:bg-[#4d1313] transition-colors ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-white text-sm font-bold uppercase tracking-widest block mb-1">{action.label}</span>
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">{action.desc}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Attendance Status", val: `${data.attendance_percentage}%`, icon: CheckCircle, color: "text-[#4ade80]" },
            { label: "Active Subjects", val: data.total_subjects || 6, icon: BookOpen, color: "text-[var(--gu-gold)]" },
            { label: "Semester SGPA", val: data.latest_sgpa || "—", icon: Award, color: "text-white" },
            { label: "Cumulative CGPA", val: data.cgpa || "—", icon: Clock, color: "text-[#4ade80]" }
          ].map((stat, i) => (
            <div key={i} className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm box-border flex flex-col justify-between h-36">
              <span className="block text-white opacity-70 text-xs uppercase tracking-widest font-semibold mb-2">
                {stat.label}
              </span>
              <div className={`font-serif text-3xl md:text-4xl font-bold ${stat.color}`}>
                {stat.val}
              </div>
            </div>
          ))}
        </div>

        {/* Info Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Calendar Block */}
          <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--gu-gold)] bg-[#3D0F0F] flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[var(--gu-gold)]" />
              <h2 className="font-serif text-lg text-white">Academic Milestones</h2>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto max-h-[350px]">
              {(data.academic_calendar || []).map((event) => (
                <div key={event.id} className="bg-[#3D0F0F] border border-[var(--gu-border)] p-4 rounded-sm flex justify-between items-center hover:bg-[#4d1313] transition-colors">
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-semibold text-sm mb-1">{event.event}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${getEventColor(event.type)}`}>
                      {new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-sm uppercase font-bold tracking-widest border ${getEventBadge(event.type)}`}>
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements Block */}
          <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--gu-gold)] bg-[#3D0F0F] flex items-center gap-3">
              <Bell className="w-5 h-5 text-[var(--gu-gold)]" />
              <h2 className="font-serif text-lg text-white">Campus Newsroom</h2>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto max-h-[350px]">
              {(data.announcements || []).map((ann) => (
                <div key={ann.id} className="bg-[#3D0F0F] border border-[var(--gu-border)] p-4 rounded-sm flex flex-col hover:bg-[#4d1313] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {ann.priority === "important" && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                      <span className="text-[var(--gu-gold)] text-[10px] font-bold uppercase tracking-widest">Broadcast</span>
                    </div>
                    <span className="text-white/60 text-[10px] font-semibold">
                      {new Date(ann.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-1">{ann.title}</h4>
                  <p className="text-white/70 text-xs leading-relaxed">{ann.message}</p>
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
