import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  Server,
  LogOut,
  ShieldCheck
} from "lucide-react";
import Logo from "./Logo";
import { authAPI } from "../services/api";

const AdminLayout = ({ children }) => {
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
  const userName = profile?.name || user?.name || user?.email || "Admin User";
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AU';
  const initials = getInitials(userName);

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

  const navItems = [
    { name: "Dashboard Overview", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Student Lifecycle", icon: Users, path: "/admin/students" },
    { name: "Biometric Status", icon: ShieldCheck, path: "/admin/student-face-status" },
    { name: "Faculty HR", icon: UserCheck, path: "/admin/faculty" },
    { name: "Curriculum Mgt", icon: BookOpen, path: "/admin/courses" },
    { name: "Timetable Mgt", icon: Calendar, path: "/admin/timetable" },
    { name: "Academic Cycle", icon: Server, path: "/admin/academic-cycle" },
    { name: "System Broadcasts", icon: Bell, path: "/admin/notifications" },
  ];

  // Route guard: redirect to login if no valid token
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userCheck = localStorage.getItem('user');
    if (!token || !userCheck) {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-[64px] bg-[var(--gu-red-deep)] border-b-[2px] border-[var(--gu-gold)] fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3 overflow-hidden">
          <Logo size="md" />
        </div>

        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          <div className="px-3 border-r border-[#4A1111] hidden md:flex items-center text-[var(--gu-gold)] tracking-widest text-[10px] uppercase font-bold">
            <ShieldCheck className="w-4 h-4 mr-2" /> System Administrator
          </div>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-[rgba(212,175,55,0.1)] rounded-full transition-colors relative"
            >
              <Bell className="w-5 h-5 text-white" />
              {/* Notification Badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[var(--gu-red-deep)]"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[var(--gu-red-card)] border border-[var(--gu-gold)] shadow-2xl z-50">
                <div className="px-4 py-3 border-b border-[var(--gu-gold)]">
                  <h3 className="font-serif text-white text-lg">System Alerts</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((notif, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0 hover:bg-[rgba(255,255,255,0.05)]"
                    >
                      <p className={`text-sm ${notif.priority === 'High' ? 'text-orange-400' : 'text-white'}`}>{notif.message || notif.title}</p>
                      <p className="text-[var(--gu-gold)] text-xs mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  )) : (
                    <div className="px-4 py-3 text-white text-sm opacity-60">No new notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
            className="border border-[var(--gu-gold)] text-white px-3 py-1 text-sm rounded-sm hover:bg-[rgba(212,175,55,0.1)] transition-colors whitespace-nowrap"
          >
            {lang}
          </button>

          <div className="flex items-center space-x-3 ml-2 border-l border-[rgba(255,255,255,0.1)] pl-4">
            <span className="text-white text-sm font-serif hidden md:block max-w-32 truncate">
              {userName}
            </span>
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 min-w-[36px] flex-shrink-0 rounded-full bg-[var(--gu-gold)] text-[var(--gu-red-deep)] flex items-center justify-center font-bold text-sm"
              >
                {initials}
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--gu-red-card)] border border-[var(--gu-gold)] shadow-2xl z-50 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-red-400 text-sm hover:bg-[rgba(255,0,0,0.1)]"
                  >
                    Secure Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-[64px]">
        {/* Left Sidebar */}
        <aside className="w-64 bg-[#220808] border-r border-[var(--gu-border-red)] fixed bottom-0 top-[64px] left-0 flex flex-col justify-between overflow-y-auto z-40">
          <div>
            <div className="px-4 pt-6 pb-2 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold opacity-80">
              ERP Modules
            </div>
            <nav className="flex flex-col mt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 transition-colors duration-200 border-l-[3px] 
                      ${
                        isActive
                          ? "bg-[var(--gu-red-hover)] text-[var(--gu-gold)] border-[var(--gu-gold)]"
                          : "border-transparent text-white opacity-70 hover:bg-[rgba(255,255,255,0.05)] hover:opacity-100"
                      }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[var(--gu-gold)]" : "opacity-60"}`}
                    />
                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-[var(--gu-border-red)]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-4 text-[#f87171] hover:bg-[rgba(239,68,68,0.1)] transition-colors duration-200"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span className="text-sm font-medium">Secure Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-6 md:p-8 min-h-[calc(100vh-64px)] overflow-x-hidden relative">
            <div
                className="fixed inset-0 z-0 ml-64 mt-[64px]"
                style={{
                backgroundImage: "url(/maxresdefault.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                opacity: 0.15, // darker for admin side
                }}
            ></div>
            <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
