import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';
import { 
  Users, 
  UserCheck, 
  Activity, 
  Server,
  ArrowRight,
  UserPlus,
  Bell,
  Calendar,
  AlertCircle,
  Loader
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const response = await adminAPI.dashboard();
        const data = response.data;
        
        const processedStats = [
          { label: "Total Students", value: data.total_students || 0, icon: Users, color: "text-[#4ade80]" },
          { label: "Assigned", value: data.students_with_course || 0, icon: Users, color: "text-[#60a5fa]" },
          { label: "Unassigned", value: data.students_without_course || 0, icon: Users, color: "text-[#f59e0b]" },
          { label: "Active Faculty", value: data.total_faculty || 0, icon: UserCheck, color: "text-[#c084fc]" },
          { label: "Active Courses", value: data.total_courses || 0, icon: Activity, color: "text-[#60a5fa]" },
          { label: "System Health", value: data.system_health?.database === 'connected' ? '100%' : '50%', icon: Server, color: "text-[var(--gu-gold)]" }
        ];

        const mappedLogs = (data.recent_students || []).map(s => ({
          time: new Date(s.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: s.name,
          action: `New Student Enrollment: ${s.enrollment_no}`
        }));
        
        setStats(processedStats);
        setAuditLogs(mappedLogs);
      } catch (error) {
        console.error("API Connection Failed.", error);
        setError("Failed to stream real-time telemetry from ERP backend core. Dashboard components offline.");
        setStats([]);
        setAuditLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <AdminLayout>
      <div className="animate-fade-in max-w-7xl mx-auto space-y-10 relative z-10 px-4">
        
        {/* Header - Command Plane */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[var(--gu-red-deep)]/40 p-10 rounded-3xl border border-[var(--gu-gold)]/10 backdrop-blur-md shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h1 className="font-serif text-4xl md:text-6xl text-white mb-3 tracking-tighter">
              Admin Command Plane
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[var(--gu-gold)] text-[10px] uppercase font-black tracking-[0.4em] opacity-80">
              <span>System Administrator</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
              <span>Central Governance</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gu-gold)]/30"></span>
              <span>Real-time Telemetry</span>
            </div>
          </div>
          <div className="relative z-10 flex items-center space-x-4 bg-black/40 border border-white/5 py-4 px-8 rounded-2xl backdrop-blur-xl shadow-inner">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Core Network: Active</span>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--gu-gold)]/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-[var(--gu-gold)]/10 transition-colors duration-1000"></div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl animate-shake flex items-center gap-6 shadow-lg shadow-red-500/5">
             <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
             <div>
                <p className="text-red-400 text-sm font-bold uppercase tracking-widest mb-1">Telemetry Interrupted</p>
                <p className="text-red-300/60 text-xs font-medium">{error}</p>
             </div>
          </div>
        )}

        {/* Dynamic Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="glass-panel group p-8 rounded-3xl relative overflow-hidden animate-slide-up shadow-xl hover:shadow-[var(--gu-gold)]/10 transition-all duration-500" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`p-4 rounded-2xl bg-white/5 mb-5 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 ${stat.color}`}>
                   <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1 leading-none">{stat.label}</p>
                <h3 className="font-serif text-3xl text-white font-bold tracking-tighter group-hover:text-[var(--gu-gold)] transition-colors duration-500">
                  {stat.value}
                </h3>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--gu-gold)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Recent Operations Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl flex flex-col h-full animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--gu-gold)]/10 flex items-center justify-center border border-[var(--gu-gold)]/20">
                        <Bell className="w-5 h-5 text-[var(--gu-gold)]" />
                    </div>
                    <h2 className="font-serif text-white text-2xl tracking-tight">Recent Broadcasts</h2>
                </div>
                <button 
                  onClick={() => navigate('/admin/notifications')}
                  className="group flex items-center gap-2 text-[var(--gu-gold)] text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-all"
                >
                  Global Registry <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="py-4 px-8 text-[9px] font-black uppercase tracking-widest text-white/20">Timestamp</th>
                                <th className="py-4 px-8 text-[9px] font-black uppercase tracking-widest text-white/20">Operator</th>
                                <th className="py-4 px-8 text-[9px] font-black uppercase tracking-widest text-white/20">Vector Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {auditLogs.length > 0 ? auditLogs.slice(0, 6).map((log, index) => (
                            <tr key={index} className="group hover:bg-white/5 transition-all duration-300">
                                <td className="py-5 px-8">
                                    <span className="text-white/40 text-[10px] font-mono group-hover:text-white/80 transition-colors uppercase tracking-widest">{log.time}</span>
                                </td>
                                <td className="py-5 px-8">
                                    <span className="inline-flex items-center px-3 py-1 bg-white/5 text-white text-[10px] font-bold rounded-lg border border-white/10 group-hover:border-[var(--gu-gold)]/40 transition-all">
                                        {log.user}
                                    </span>
                                </td>
                                <td className="py-5 px-8">
                                    <p className="text-white/60 text-xs font-bold tracking-tight group-hover:text-white transition-colors">
                                        {log.action}
                                    </p>
                                </td>
                            </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="py-20 text-center">
                                        <p className="text-white/10 font-serif italic text-xl">No active broadcast telemetry detected.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Matrix */}
          <div className="flex flex-col space-y-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="font-serif text-white text-2xl tracking-tight">Rapid Command</h2>
              </div>

              <div className="space-y-4 relative z-10 w-full">
                {[
                  { path: '/admin/students', icon: UserPlus, label: 'Manage Directory', sub: 'Enrollment & Database Control', color: 'text-[var(--gu-gold)]' },
                  { path: '/admin/notifications', icon: Bell, label: 'Broadcast Alerts', sub: 'Mass Communication Protocol', color: 'text-purple-400' },
                  { path: '/admin/academic-cycle', icon: Calendar, label: 'Academic Engine', sub: 'Term Logic & Scheduling', color: 'text-emerald-400' }
                ].map((action, i) => (
                  <button 
                    key={i}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/5 hover:border-[var(--gu-gold)]/40 hover:bg-white/10 transition-all duration-300 group/btn rounded-2xl shadow-lg"
                  >
                    <div className="flex items-center gap-4 text-left w-full truncate">
                      <div className={`p-3 rounded-xl bg-white/5 group-hover/btn:scale-110 transition-transform ${action.color}`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-white text-[11px] font-black uppercase tracking-widest">{action.label}</p>
                        <p className="text-white/30 text-[10px] truncate font-bold mt-0.5">{action.sub}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover/btn:text-[var(--gu-gold)] group-hover/btn:translate-x-1 transition-all shrink-0" />
                  </button>
                ))}
              </div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--gu-gold)]/5 rounded-full blur-3xl pointer-events-none"></div>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
