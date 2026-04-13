import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Activity, Filter, Download, Search, CheckCircle, AlertCircle, RefreshCw, Loader } from 'lucide-react';
import { superAdminAPI } from '../../services/api';

const ActivityLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterAction, setFilterAction] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async (resetPage = false) => {
    if (resetPage) {
      setPage(1);
      setLogs([]);
    }
    setLoading(true);
    try {
      const params = {
        limit: 50,
        offset: resetPage ? 0 : (page - 1) * 50,
      };
      if (filterAction) params.action = filterAction;
      if (filterModel) params.target_model = filterModel;
      if (searchTerm) params.search = searchTerm;

      const res = await superAdminAPI.activityLogs(params);
      const newLogs = res.data.logs || [];
      setLogs(resetPage ? newLogs : [...logs, ...newLogs]);
      setHasMore(newLogs.length === 50);
    } catch (err) {
      console.error('Error loading activity logs:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs(true);
  }, [filterAction, filterModel, searchTerm]);

  const loadMore = () => {
    setPage(page + 1);
    loadLogs();
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Admin', 'Action', 'Target Model', 'Description', 'IP Address'],
      ...logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.admin_name,
        log.action,
        log.target_model,
        log.description,
        log.ip_address || 'N/A',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'UPDATE': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'DELETE': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'BAN': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'UNBAN': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'RESET': return <RefreshCw className="w-4 h-4 text-orange-400" />;
      case 'GENERATE': return <Activity className="w-4 h-4 text-purple-400" />;
      case 'CLEAR': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'ASSIGN': return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'ADD': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'REMOVE': return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'FIX': return <RefreshCw className="w-4 h-4 text-yellow-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-green-600/20 text-green-400';
      case 'UPDATE': return 'bg-blue-600/20 text-blue-400';
      case 'DELETE': return 'bg-red-600/20 text-red-400';
      case 'BAN': return 'bg-yellow-600/20 text-yellow-400';
      case 'UNBAN': return 'bg-green-600/20 text-green-400';
      case 'RESET': return 'bg-orange-600/20 text-orange-400';
      case 'GENERATE': return 'bg-purple-600/20 text-purple-400';
      case 'CLEAR': return 'bg-red-600/20 text-red-400';
      case 'ASSIGN': return 'bg-cyan-600/20 text-cyan-400';
      case 'ADD': return 'bg-green-600/20 text-green-400';
      case 'REMOVE': return 'bg-orange-600/20 text-orange-400';
      case 'FIX': return 'bg-yellow-600/20 text-yellow-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  const actionOptions = ['CREATE', 'UPDATE', 'DELETE', 'BAN', 'UNBAN', 'RESET', 'GENERATE', 'CLEAR', 'ASSIGN', 'ADD', 'REMOVE', 'FIX'];
  const modelOptions = ['Student', 'Faculty', 'User', 'Course', 'Subject', 'TimetableSlot', 'FacultySubject', 'FacultySubjects', 'FacultySubject', 'AdminActivityLog'];

  return (
    <AdminLayout>
      <div className="animate-fade-in max-w-7xl mx-auto">
        {/* Header */}
        <div className="border-b border-[var(--gu-gold)] pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-3xl text-white mb-2">Activity Logs</h1>
            <p className="text-[var(--gu-gold)] text-xs uppercase tracking-wider">
              Super Admin - Audit Trail ({logs.length} records)
            </p>
          </div>
          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[var(--gu-red-card)] border rounded p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-1 block">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search admin or target..."
                  className="w-full pl-10 pr-4 py-2 bg-[var(--gu-red)] border rounded text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--gu-red)] border rounded text-white text-sm"
              >
                <option value="">All Actions</option>
                {actionOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Target Model</label>
              <select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--gu-red)] border rounded text-white text-sm"
              >
                <option value="">All Models</option>
                {modelOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => loadLogs(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded flex items-center justify-center gap-2 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-[var(--gu-red-card)] border rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr className="text-white/60 text-sm">
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">Admin</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Target Model</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-white/40">
                      {loading ? 'Loading...' : 'No activity logs found'}
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={idx} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-white/40 text-sm whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-white">{log.admin_name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className={`px-2 py-1 rounded text-xs ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">
                          {log.target_model}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/60 text-sm max-w-xs truncate" title={log.description}>
                        {log.description}
                      </td>
                      <td className="px-4 py-3 text-white/40 text-sm">
                        {log.ip_address || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="px-4 py-4 border-t border-white/5 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ActivityLogs;
