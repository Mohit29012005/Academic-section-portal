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
      <div className="animate-fade-in max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-white mb-2 word-wrap break-words">
              ERP Command Center
            </h1>
            <p className="text-[var(--gu-gold)] text-xs md:text-sm uppercase tracking-wider font-semibold">
              System Administrator Overview
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-[#2D0A0A] border border-[var(--gu-gold)] px-4 py-2 rounded-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-white text-xs font-bold uppercase tracking-widest">Live Sync Active</span>
          </div>
        </div>

        {error && (
          <div className="bg-[rgba(239,68,68,0.05)] border-y border border-[rgba(239,68,68,0.2)] p-6 rounded-sm mb-8 flex items-center space-x-4">
             <AlertCircle className="w-8 h-8 text-red-500" />
             <div>
               <h3 className="text-red-400 font-bold mb-1">Telemetry Sync Failure</h3>
               <p className="text-red-300 text-sm opacity-80">{error}</p>
             </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] p-6 rounded-sm relative overflow-hidden group hover:border-[var(--gu-gold)] transition-colors">
              <div className="flex justify-between items-start z-10 relative">
                <div>
                  <p className="text-white opacity-60 text-xs font-semibold uppercase tracking-widest mb-2 word-wrap break-words">
                    {stat.label}
                  </p>
                  <h3 className="font-serif text-3xl text-white font-bold word-wrap break-words">
                    {stat.value}
                  </h3>
                </div>
                <div className={`p-3 rounded-full bg-[rgba(255,255,255,0.05)] ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area - Audit Logs (Takes up 2/3 space) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
                <h2 className="font-serif text-white text-xl flex items-center">
                  <Bell className="w-5 h-5 mr-3 text-[var(--gu-gold)]" />
                  Recent System Broadcasts
                </h2>
                <button 
                  onClick={() => navigate('/admin/notifications')}
                  className="text-[var(--gu-gold)] text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                  View All &rarr;
                </button>
              </div>
              
              <div className="p-0 overflow-y-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                    {auditLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="py-4 px-6 w-32 whitespace-nowrap">
                          <span className="text-white opacity-50 text-xs font-mono">{log.time}</span>
                        </td>
                        <td className="py-4 px-6 w-40 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 bg-[rgba(255,255,255,0.05)] text-white text-xs rounded-sm border border-[rgba(255,255,255,0.1)]">
                            {log.user}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-300 word-wrap break-words">
                          {log.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
              </div>
            </div>
          </div>

          {/* Side Panel - Quick Actions (Takes up 1/3 space) */}
          <div className="flex flex-col space-y-6">
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm p-6 relative overflow-hidden">
              <h2 className="font-serif text-white text-xl mb-6 flex items-center border-l-3 border-[#FF8C00] pl-3">
                ERP Quick Actions
              </h2>

              <div className="space-y-4 relative z-10 w-full">
                
                <button 
                  onClick={() => navigate('/admin/students')}
                  className="w-full flex items-center justify-between p-4 bg-[#3D0F0F] border border-[var(--gu-border)] hover:border-[var(--gu-gold)] transition-all group overflow-hidden box-border"
                >
                  <div className="flex items-center space-x-3 text-left w-full truncate pr-2">
                    <UserPlus className="w-5 h-5 text-[var(--gu-gold)] flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-semibold truncate block">Manage Students</p>
                      <p className="text-white opacity-50 text-xs truncate block">Enrollment & Directory</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>

                <button 
                  onClick={() => navigate('/admin/notifications')}
                  className="w-full flex items-center justify-between p-4 bg-[#3D0F0F] border border-[var(--gu-border)] hover:border-[var(--gu-gold)] transition-all group overflow-hidden box-border"
                >
                  <div className="flex items-center space-x-3 text-left w-full truncate pr-2">
                    <Bell className="w-5 h-5 text-[#c084fc] flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-semibold truncate block">System Broadcasts</p>
                      <p className="text-white opacity-50 text-xs truncate block">Send Targeted Alerts</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>

                <button 
                  onClick={() => navigate('/admin/academic-cycle')}
                  className="w-full flex items-center justify-between p-4 bg-[#3D0F0F] border border-[var(--gu-border)] hover:border-[var(--gu-gold)] transition-all group overflow-hidden box-border"
                >
                  <div className="flex items-center space-x-3 text-left w-full truncate pr-2">
                    <Calendar className="w-5 h-5 text-[#4ade80] flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-semibold truncate block">Academic Cycle</p>
                      <p className="text-white opacity-50 text-xs truncate block">Terms & Holidays</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>

              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-[rgba(239,68,68,0.1)] border border-red-900 rounded-sm p-6 flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-red-400 font-bold text-sm uppercase tracking-widest mb-1">System Notice</h3>
                <p className="text-red-300 text-xs leading-relaxed opacity-80">
                  Semester 6 student registrations deadline approaches in 48 hours. Missing documents detected.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
