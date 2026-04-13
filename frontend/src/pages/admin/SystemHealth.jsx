import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Server, Database, HardDrive, Cpu, Activity, Clock, Shield, AlertCircle, CheckCircle, Search, Loader2, Edit2, Trash2, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { superAdminAPI, adminAPI } from '../../services/api';

const SystemHealth = () => {
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [stats, setStats] = useState(null);

  // Database Explorer State
  const [dbTables, setDbTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [healthRes, logsRes, statsRes] = await Promise.all([
        superAdminAPI.systemHealth().catch(() => ({ data: null })),
        superAdminAPI.activityLogs({ limit: 50 }).catch(() => ({ data: { logs: [] } })),
        superAdminAPI.dashboardStats().catch(() => ({ data: null })),
      ]);
      setSystemHealth(healthRes.data);
      setActivityLogs(logsRes.data.logs || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error loading system health:', err);
    }
    setLoading(false);
  };

  // Database Explorer Functions
  const loadDbTables = async () => {
    try {
      const res = await adminAPI.dbTables();
      setDbTables(res.data.tables || []);
    } catch (err) {
      console.error('Error loading tables:', err);
    }
  };

  const loadTableData = async (tableName, page = 1) => {
    setDbLoading(true);
    try {
      const res = await adminAPI.dbTableRecords(tableName, {
        page,
        limit: 50,
        search: tableSearch,
      });
      setTableData(res.data);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading table data:', err);
    }
    setDbLoading(false);
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setTableSearch('');
    setCurrentPage(1);
    loadTableData(table.table_name, 1);
  };

  const handleSearch = () => {
    if (selectedTable) {
      loadTableData(selectedTable.table_name, 1);
    }
  };

  const handleAddRecord = () => {
    const emptyData = {};
    tableData?.columns?.forEach(col => {
      if (col !== 'id') emptyData[col] = '';
    });
    setFormData(emptyData);
    setShowAddModal(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setFormData({ ...record });
    setShowEditModal(true);
  };

  const handleDeleteConfirm = (record) => {
    setDeletingRecord(record);
    setShowDeleteModal(true);
  };

  const handleSaveAdd = async () => {
    setModalLoading(true);
    try {
      await adminAPI.dbCreateRecord(selectedTable.table_name, formData);
      alert('Record added successfully!');
      setShowAddModal(false);
      loadTableData(selectedTable.table_name, currentPage);
      loadDbTables();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
    setModalLoading(false);
  };

  const handleSaveEdit = async () => {
    setModalLoading(true);
    try {
      await adminAPI.dbUpdateRecord(selectedTable.table_name, editingRecord.id, formData);
      alert('Record updated successfully!');
      setShowEditModal(false);
      loadTableData(selectedTable.table_name, currentPage);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
    setModalLoading(false);
  };

  const handleDelete = async () => {
    setModalLoading(true);
    try {
      await adminAPI.dbDeleteRecord(selectedTable.table_name, deletingRecord.id);
      alert('Record deleted successfully!');
      setShowDeleteModal(false);
      loadTableData(selectedTable.table_name, currentPage);
      loadDbTables();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
    setModalLoading(false);
  };

  // Filter tables by search
  const filteredTables = dbTables.filter(t => 
    t.table_name.toLowerCase().includes(tableFilter.toLowerCase()) ||
    t.model_name.toLowerCase().includes(tableFilter.toLowerCase())
  );

  // Columns to hide from display
  const HIDDEN_COLUMNS = ['password', 'token', 'secret', 'hash', 'key', 'session_key'];

  // Truncate long values
  const truncateValue = (val, maxLen = 40) => {
    if (!val) return '-';
    const str = String(val);
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  };

  // Load tables when component mounts (Super Admin)
  useEffect(() => {
    loadDbTables();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'UPDATE': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'DELETE': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'BAN': return <Shield className="w-4 h-4 text-yellow-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in max-w-7xl mx-auto">
        {/* Header */}
        <div className="border-b border-[var(--gu-gold)] pb-6 mb-8">
          <h1 className="font-serif text-3xl text-white mb-2">System Health & Activity</h1>
          <p className="text-[var(--gu-gold)] text-xs uppercase tracking-wider">
            Super Admin - System Monitoring & Audit Logs
          </p>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--gu-red-card)] border rounded p-6">
            <div className="flex items-center justify-between mb-4">
              <Server className="w-8 h-8 text-blue-400" />
              <span className={`px-2 py-1 rounded text-xs ${systemHealth ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                {systemHealth ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-white/60 text-sm">Server Status</p>
            <p className="text-white font-semibold">{systemHealth ? 'Operational' : 'Unknown'}</p>
          </div>

          <div className="bg-[var(--gu-red-card)] border rounded p-6">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-8 h-8 text-green-400" />
              <span className="px-2 py-1 rounded text-xs bg-green-600/20 text-green-400">Connected</span>
            </div>
            <p className="text-white/60 text-sm">Database</p>
            <p className="text-white font-semibold">{systemHealth?.tables || 0} Tables</p>
          </div>

          <div className="bg-[var(--gu-red-card)] border rounded p-6">
            <div className="flex items-center justify-between mb-4">
              <HardDrive className="w-8 h-8 text-yellow-400" />
              <span className="px-2 py-1 rounded text-xs bg-blue-600/20 text-blue-400">Active</span>
            </div>
            <p className="text-white/60 text-sm">Storage</p>
            <p className="text-white font-semibold">{systemHealth?.storage || 'N/A'}</p>
          </div>

          <div className="bg-[var(--gu-red-card)] border rounded p-6">
            <div className="flex items-center justify-between mb-4">
              <Cpu className="w-8 h-8 text-purple-400" />
              <Clock className="w-4 h-4 text-white/40" />
            </div>
            <p className="text-white/60 text-sm">Server Time</p>
            <p className="text-white font-semibold text-sm">
              {systemHealth?.server_time ? new Date(systemHealth.server_time).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-[var(--gu-red-card)] border rounded p-4 text-center">
            <p className="text-white/60 text-xs">Students</p>
            <p className="text-2xl font-bold text-yellow-400">{stats?.students?.total || 0}</p>
          </div>
          <div className="bg-[var(--gu-red-card)] border rounded p-4 text-center">
            <p className="text-white/60 text-xs">Faculty</p>
            <p className="text-2xl font-bold text-blue-400">{stats?.faculty?.total || 0}</p>
          </div>
          <div className="bg-[var(--gu-red-card)] border rounded p-4 text-center">
            <p className="text-white/60 text-xs">Courses</p>
            <p className="text-2xl font-bold text-green-400">{stats?.courses?.total || 0}</p>
          </div>
          <div className="bg-[var(--gu-red-card)] border rounded p-4 text-center">
            <p className="text-white/60 text-xs">Subjects</p>
            <p className="text-2xl font-bold text-purple-400">{stats?.subjects?.total || 0}</p>
          </div>
          <div className="bg-[var(--gu-red-card)] border rounded p-4 text-center">
            <p className="text-white/60 text-xs">Time Slots</p>
            <p className="text-2xl font-bold text-orange-400">{stats?.timetable?.total_slots || 0}</p>
          </div>
          <div className="bg-[var(--gu-red-card)] border rounded p-4 text-center">
            <p className="text-white/60 text-xs">Notifications</p>
            <p className="text-2xl font-bold text-cyan-400">{stats?.notifications?.total || 0}</p>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-[var(--gu-red-card)] border rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--gu-gold)]">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--gu-gold)]" />
              Recent Admin Activity ({activityLogs.length})
            </h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {activityLogs.length === 0 ? (
              <div className="p-8 text-center text-white/40">
                No activity logs found.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-black/30 sticky top-0">
                  <tr className="text-white/60 text-sm">
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Admin</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Target</th>
                    <th className="px-4 py-3 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log, idx) => (
                    <tr key={idx} className="border-t border-white/5">
                      <td className="px-4 py-3 text-white/40 text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-white">{log.admin_name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="text-white text-sm">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">
                          {log.target_model}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/60 text-sm truncate max-w-xs">
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Database Explorer Section */}
      <div className="mt-8 border-t border-[var(--gu-gold)] pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-white flex items-center gap-3">
            <Database className="w-6 h-6 text-[var(--gu-gold)]" />
            Database Explorer
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables List - Left Side */}
          <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--gu-border)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter tables..."
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  className="w-full bg-black border border-[var(--gu-border)] text-white pl-10 pr-4 py-2 text-sm focus:border-[var(--gu-gold)] outline-none rounded-sm"
                />
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {filteredTables.map((table) => (
                <button
                  key={table.table_name}
                  onClick={() => handleSelectTable(table)}
                  className={`w-full p-4 text-left border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] transition-colors ${
                    selectedTable?.table_name === table.table_name ? 'bg-[var(--gu-gold)]/10 border-l-4 border-l-[var(--gu-gold)]' : ''
                  }`}
                >
                  <p className="text-white text-sm font-medium truncate">{table.table_name}</p>
                  <p className="text-gray-500 text-xs mt-1">{table.model_name}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-[var(--gu-gold)]/20 text-[var(--gu-gold)] text-xs rounded">
                    {table.row_count} rows
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Data - Right Side */}
          <div className="lg:col-span-2 bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-sm overflow-hidden">
            {selectedTable ? (
              <>
                <div className="p-4 border-b border-[var(--gu-border)] flex items-center justify-between">
                  <h3 className="text-white font-serif text-lg">{selectedTable.table_name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search records..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-48 bg-black border border-[var(--gu-border)] text-white pl-10 pr-4 py-2 text-sm focus:border-[var(--gu-gold)] outline-none rounded-sm"
                      />
                    </div>
                    <button
                      onClick={handleAddRecord}
                      className="flex items-center gap-1 px-3 py-2 bg-[var(--gu-gold)] text-[#1A0505] text-xs font-bold uppercase tracking-widest hover:bg-[#e6c949] transition-colors rounded-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Row
                    </button>
                  </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto max-h-[450px] overflow-y-auto" style={{ maxWidth: '100%' }}>
                  {dbLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-8 h-8 text-[var(--gu-gold)] animate-spin" />
                    </div>
                  ) : tableData?.rows?.length > 0 ? (
                    <table className="w-full text-left" style={{ tableLayout: 'fixed', minWidth: '800px' }}>
                      <thead className="bg-[#3D0F0F] sticky top-0 z-10">
                        <tr>
                          <th className="p-3 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold whitespace-nowrap">ID</th>
                          {tableData.columns.filter(c => !HIDDEN_COLUMNS.includes(c.toLowerCase())).map(col => (
                            <th key={col} className="p-3 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{col.replace(/_/g, ' ')}</th>
                          ))}
                          <th className="p-3 text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                        {tableData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                            <td className="p-3 text-[var(--gu-gold)] font-mono text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={row.id}>{row.id}</td>
                            {tableData.columns.filter(c => !HIDDEN_COLUMNS.includes(c.toLowerCase())).map(col => (
                              <td key={col} className="p-3 text-gray-300 text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={String(row[col] || '')}>
                                {truncateValue(row[col], 30)}
                              </td>
                            ))}
                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditRecord(row)}
                                  className="p-1.5 text-[var(--gu-gold)] hover:bg-[var(--gu-gold)]/10 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteConfirm(row)}
                                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-gray-500">No records found</div>
                  )}
                </div>

                {/* Pagination */}
                {tableData && tableData.pages > 1 && (
                  <div className="p-4 border-t border-[var(--gu-border)] flex items-center justify-between">
                    <span className="text-gray-400 text-sm">
                      Page {tableData.current_page} of {tableData.pages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadTableData(selectedTable.table_name, currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="p-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 rounded transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => loadTableData(selectedTable.table_name, currentPage + 1)}
                        disabled={currentPage >= tableData.pages}
                        className="p-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 rounded transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Database className="w-12 h-12 mb-4 opacity-30" />
                <p>Select a table to view data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A0505] border border-[var(--gu-gold)] rounded-sm w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--gu-gold)] flex justify-between items-center bg-[#2D0A0A]">
              <h2 className="text-[var(--gu-gold)] font-serif text-xl">Add New Record</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tableData?.columns?.filter(c => c !== 'id').map(col => (
                  <div key={col}>
                    <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1">{col}</label>
                    <input
                      type="text"
                      value={formData[col] || ''}
                      onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                      className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none rounded-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-[var(--gu-border)] flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="border border-gray-500 text-gray-400 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-white hover:text-white transition-colors rounded-sm">
                Cancel
              </button>
              <button onClick={handleSaveAdd} disabled={modalLoading} className="bg-[var(--gu-gold)] text-[#1A0505] px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#e6c949] transition-colors rounded-sm disabled:opacity-50 flex items-center">
                {modalLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A0505] border border-[var(--gu-gold)] rounded-sm w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--gu-gold)] flex justify-between items-center bg-[#2D0A0A]">
              <h2 className="text-[var(--gu-gold)] font-serif text-xl">Edit Record #{editingRecord.id}</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tableData?.columns?.filter(c => c !== 'id').map(col => (
                  <div key={col}>
                    <label className="block text-[var(--gu-gold)] text-xs uppercase tracking-widest mb-1">{col}</label>
                    <input
                      type="text"
                      value={formData[col] || ''}
                      onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                      className="w-full bg-[#3D0F0F] border border-[rgba(212,175,55,0.3)] text-white p-2.5 text-sm focus:border-[var(--gu-gold)] outline-none rounded-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-[var(--gu-border)] flex justify-end gap-3">
              <button onClick={() => setShowEditModal(false)} className="border border-gray-500 text-gray-400 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-white hover:text-white transition-colors rounded-sm">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={modalLoading} className="bg-[var(--gu-gold)] text-[#1A0505] px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#e6c949] transition-colors rounded-sm disabled:opacity-50 flex items-center">
                {modalLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A0505] border border-red-500 rounded-sm w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-red-500 bg-[#2D0A0A]">
              <h2 className="text-red-400 font-serif text-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Confirm Delete
              </h2>
            </div>
            <div className="p-6">
              <p className="text-white mb-4">
                Delete record <span className="text-[var(--gu-gold)] font-bold">#{deletingRecord.id}</span> from <span className="text-[var(--gu-gold)]">{selectedTable?.table_name}</span>?
              </p>
              <p className="text-red-400 text-xs uppercase tracking-widest">
                This action cannot be undone.
              </p>
            </div>
            <div className="p-4 border-t border-[var(--gu-border)] flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="border border-gray-500 text-gray-400 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-white hover:text-white transition-colors rounded-sm">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={modalLoading} className="bg-red-500 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-colors rounded-sm disabled:opacity-50 flex items-center">
                {modalLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SystemHealth;
