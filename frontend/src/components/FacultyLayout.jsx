import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  LayoutDashboard,
  FileText,
  Calendar,
  User,
  LogOut,
  Camera,
} from "lucide-react";
import Logo from "./Logo";
import { authAPI } from "../services/api";

const FacultyLayout = ({ children }) => {
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
  const userName = profile?.name || user?.name || user?.email || "Faculty";
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'F';
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
    { name: "Dashboard", icon: LayoutDashboard, path: "/faculty/dashboard" },
    { name: "AI Attendance", icon: Camera, path: "/faculty/attendance" },
    { name: "Timetable", icon: Calendar, path: "/faculty/timetable" },
    { name: "Exam Papers", icon: FileText, path: "/faculty/exam-papers" },
    { name: "Profile", icon: User, path: "/faculty/profile" },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-[64px] bg-[var(--gu-red-deep)] border-b-[2px] border-[var(--gu-gold)] fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-3 overflow-hidden">
          <Logo size="md" />
        </div>

        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-[rgba(212,175,55,0.1)] rounded-full transition-colors relative flex-shrink-0"
            >
              <Bell className="w-5 h-5 text-white" />
              {/* Notification Badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[var(--gu-red-deep)]"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[var(--gu-red-card)] border border-[var(--gu-gold)] shadow-2xl z-50">
                <div className="px-4 py-3 border-b border-[var(--gu-gold)]">
                  <h3 className="font-serif text-white text-lg">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((notif, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0 hover:bg-[rgba(255,255,255,0.05)]"
                    >
                      <p className="text-white text-sm word-wrap break-words">
                        {notif.message || notif.title}
                      </p>
                      <p className="text-[var(--gu-gold)] text-xs mt-1 word-wrap break-words">
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
            className="border border-[var(--gu-gold)] text-white px-3 py-1 text-sm rounded-sm hover:bg-[rgba(212,175,55,0.1)] transition-colors whitespace-nowrap flex-shrink-0"
          >
            {lang}
          </button>

          <div className="flex items-center gap-3 ml-2 border-l border-[rgba(255,255,255,0.1)] pl-4 min-w-0">
            <span className="text-white text-sm font-serif hidden md:block max-w-32 truncate">
              {userName}
            </span>
            <div className="relative flex-shrink-0" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 min-w-9 rounded-full bg-[var(--gu-gold)] text-[var(--gu-red-deep)] flex items-center justify-center font-bold text-sm"
              >
                {initials}
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--gu-red-card)] border border-[var(--gu-gold)] shadow-2xl z-50 py-1">
                  <Link
                    to="/faculty/profile"
                    className="block px-4 py-2 text-white text-sm hover:bg-[rgba(212,175,55,0.1)] whitespace-nowrap text-ellipsis overflow-hidden"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-red-400 text-sm hover:bg-[rgba(255,0,0,0.1)] whitespace-nowrap text-ellipsis overflow-hidden"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-[64px]">
        {/* Left Sidebar */}
        <aside className="w-[220px] bg-[#220808] border-r border-[var(--gu-border-red)] fixed bottom-0 top-[64px] left-0 flex flex-col justify-between">
          <div>
            <div className="px-4 pt-6 pb-2 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold opacity-80">
              Menu
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
                      className={`w-[18px] h-[18px] ${isActive ? "text-[var(--gu-gold)]" : "opacity-60"}`}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
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
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* CHANGED: Added relative wrapper for background */}
        <main className="flex-1 ml-[220px] p-6 md:p-8 min-h-[calc(100vh-64px)] box-border overflow-x-hidden relative">
          {/* CHANGED: Added background image layer with dark opacity */}
          <div
            className="fixed inset-0 z-0 ml-[220px] mt-[64px]"
            style={{
              backgroundImage: "url(/maxresdefault.jpg)", // Change to your image path
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.3, // Adjust darkness (lower = darker)
            }}
          ></div>

          {/* CHANGED: Added relative and z-10 to children wrapper */}
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default FacultyLayout;
