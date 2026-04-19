import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  User,
  LogOut,
  GraduationCap,
  Calendar,
  Brain,
  Shield,
  ShieldCheck
} from "lucide-react";
import Logo from "./Logo";
import { authAPI } from "../services/api";

const StudentLayout = ({ children }) => {
  const [lang, setLang] = useState("EN");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const userProfileStr = localStorage.getItem("profile");
  const userStr = localStorage.getItem("user");
  const profile = userProfileStr ? JSON.parse(userProfileStr) : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = profile?.name || user?.name || user?.email || "Student";
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'S';
  const avatarUrl = profile?.avatar || user?.avatar 
    ? (profile?.avatar || user?.avatar) 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=D4AF37&color=8B0000&size=128&font-size=0.4&bold=true`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await authAPI.getNotifications();
        setNotifications(res.data);
      } catch (e) {
        console.warn("Could not fetch notifications");
      }
    };
    fetchNotifs();
  }, []);

  // Route guard: redirect to login if no valid token
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userCheck = localStorage.getItem('user');
    if (!token || !userCheck) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/student/dashboard" },
    { name: "Attendance", icon: ClipboardList, path: "/student/attendance" },
    { name: "AI Attendance Setup", icon: Shield, path: "/student/attendance-setup" },
    { name: "Timetable", icon: Calendar, path: "/student/timetable" },
    { name: "Results", icon: BookOpen, path: "/student/results" },
    { name: "PYQs", icon: GraduationCap, path: "/student/pyqs" },
    { name: "Career Guidance", icon: Brain, path: "/student/career-guidance" },
    { name: "Profile", icon: User, path: "/student/profile" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans selection:bg-[var(--gu-gold)]/40 selection:text-white">
      {/* Top Navbar */}
      <header className="h-[76px] bg-[#141414] border-b border-white/10 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-3 overflow-hidden group">
          <div className="hover:scale-105 transition-transform duration-500">
            <Logo size="md" />
          </div>
          <div className="w-[1px] h-6 bg-white/10 mx-4 hidden md:block"></div>
          <div className="hidden md:flex flex-col">
            <span className="text-white text-xs font-serif tracking-widest opacity-80">GANPAT STUDENT</span>
            <span className="text-[var(--gu-gold)] text-[8px] font-black tracking-[0.4em] uppercase opacity-40">Academic Portal v4.0</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="px-5 py-2.5 bg-[#1f1f1f] rounded-full border border-white/10 hidden lg:flex items-center text-white/80 tracking-[0.2em] text-[10px] uppercase font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
            Node Active: Gujarat_Main
          </div>

          <div className="flex items-center bg-[#1f1f1f] rounded-full p-1.5 border border-white/10 shadow-lg">
            <div className="relative" ref={notifRef}>
                <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-full transition-all relative ${showNotifications ? 'bg-[var(--gu-gold)] text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                <Bell className="w-5 h-5" />
                <span className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-[#1A1A1A] ${notifications.length > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                </button>

                {showNotifications && (
                <div className="absolute right-0 mt-4 w-96 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-50 overflow-hidden animate-reveal-down origin-top-right">
                    <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-[#222]">
                    <h3 className="font-sans font-bold text-white text-lg tracking-wide">Student Alerts</h3>
                    <span className="text-[9px] font-black text-[var(--gu-gold)] uppercase tracking-widest bg-[var(--gu-gold)]/10 px-2 py-1 rounded-md">Recent Activity</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? notifications.map((notif, i) => (
                        <div
                        key={i}
                        className="px-6 py-4 border-b border-white/5 last:border-0 hover:bg-[#2a2a2a] transition-colors group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-[var(--gu-gold)]"></div>
                                <div>
                                    <p className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">{notif.message || notif.title}</p>
                                    <p className="text-white/20 text-[9px] mt-1 font-black uppercase tracking-widest">
                                        {new Date(notif.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="px-8 py-12 text-center text-white/20 text-[10px] font-black uppercase tracking-widest">
                            No New Activity
                        </div>
                    )}
                    </div>
                </div>
                )}
            </div>

            <button
                onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
                className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white text-[10px] font-black transition-all"
            >
                {lang}
            </button>

            <div className="w-[1px] h-6 bg-white/5 mx-1"></div>

            <div className="relative" ref={profileRef}>
                <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 pl-2 pr-1.5 py-0.5 group"
                >
                    <span className="text-white/40 group-hover:text-white text-[10px] font-black uppercase tracking-widest transition-all hidden sm:block">
                    {userName.split(' ')[0]}
                    </span>
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[var(--gu-gold)]/40 transition-all p-0.5 shadow-lg flex items-center justify-center bg-[var(--gu-gold)] cursor-pointer">
                        <img 
                        src={avatarUrl} 
                        alt={userName} 
                        className="w-full h-full object-cover rounded-full"
                        />
                    </div>
                </button>
                {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-64 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-50 overflow-hidden animate-reveal-down origin-top-right">
                        <div className="p-6 bg-[#222] border-b border-white/10">
                            <p className="text-white font-bold text-base tracking-wide truncate">{userName}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gu-gold)] mt-1.5 flex items-center gap-1.5"><Shield size={10}/> Enrolled Student</p>
                        </div>
                        <div className="p-2 space-y-1">
                            <Link
                                to="/student/profile"
                                className="w-full text-left flex items-center gap-4 px-4 py-3 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all"
                            >
                                <User className="w-4 h-4" />
                                Account Details
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left flex items-center gap-4 px-4 py-3 text-red-400 hover:text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 rounded-xl transition-all group"
                            >
                                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                End Session
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-[76px]">
        {/* Left Sidebar */}
        <aside className="w-72 bg-[#141414] border-r border-white/10 fixed bottom-0 top-[76px] left-0 flex flex-col justify-between z-40 shadow-[4px_0_30px_rgba(0,0,0,0.3)]">
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-8 pl-4">Navigation Resources</h2>
            <nav className="space-y-2">
              {navItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden ${
                        isActive
                          ? "bg-[var(--gu-gold)]/10 text-[var(--gu-gold)] border border-[var(--gu-gold)]/30 shadow-[0_4px_15px_rgba(212,175,55,0.1)]"
                          : "text-gray-400 hover:text-white hover:bg-[#252525] border border-transparent"
                      }`}
                  >
                    {/* Active Indicator Glow */}
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-full bg-[var(--gu-gold)] shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
                    )}
                    
                    <Icon
                      className={`w-4 h-4 mr-4 transition-all duration-500 ${isActive ? "text-[var(--gu-gold)] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" : "group-hover:text-white"}`}
                    />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                      {item.name}
                    </span>
                    
                    {/* Background hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--gu-gold)]/0 to-[var(--gu-gold)]/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700 pointer-events-none"></div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-6 border-t border-white/10 bg-[#121212]">
             <div className="p-4 bg-[#202020] border border-white/10 rounded-xl shadow-inner">
                <div className="flex justify-between items-center bg-[#181818] p-3 rounded-lg border border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[11px] text-white font-bold tracking-wider">GANPAT_CORE</span>
                        <span className="text-[9px] text-emerald-400 tracking-widest mt-0.5">SECURE_LINK</span>
                    </div>
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                </div>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-72 p-10 min-h-[calc(100vh-76px)] relative">
            <div
                className="fixed inset-0 z-0 ml-72 mt-[76px] pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: "url(/maxresdefault.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "grayscale(100%)"
                }}
            ></div>
            {/* Elegant glowing background meshes */}
            <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-[var(--gu-gold)]/5 rounded-full blur-[200px] -mr-96 -mt-96 pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 w-[800px] h-[800px] bg-[var(--gu-red-deep)]/10 rounded-full blur-[200px] ml-80 -mb-96 pointer-events-none"></div>

            <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
