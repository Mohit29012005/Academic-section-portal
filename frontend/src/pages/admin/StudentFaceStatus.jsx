import { useState, useEffect } from 'react';
import {
  Users, CheckCircle, XCircle, AlertCircle, Search,
  Bell, BellRing, Loader2, Shield, BookOpen, ChevronDown, Camera, Eye, User
} from 'lucide-react';
import { attendanceAI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

const STATUS_COLORS = {
  registered: 'bg-green-100 text-green-700 border border-green-200',
  pending: 'bg-red-100 text-red-600 border border-red-200',
  details_missing: 'bg-orange-100 text-orange-600 border border-orange-200',
};
const STATUS_LABELS = {
  registered: '✓ Registered',
  pending: '✗ Pending',
  details_missing: '⚠ Details Missing',
};

export default function StudentFaceStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Actions
  const [remindingId, setRemindingId] = useState(null);
  const [remindedIds, setRemindedIds] = useState(new Set());
  const [bulkReminding, setBulkReminding] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter, semesterFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (semesterFilter) params.semester = semesterFilter;
      const res = await attendanceAI.getStudentFaceStatus(params);
      setData(res.data);
    } catch {
      setError('Failed to load student data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (studentId) => {
    setRemindingId(studentId);
    try {
      await attendanceAI.sendReminder(studentId);
      setRemindedIds(prev => new Set([...prev, studentId]));
    } catch { /* ignore */ }
    finally { setRemindingId(null); }
  };

  const handleBulkRemind = async () => {
    setBulkReminding(true);
    try {
      await attendanceAI.bulkRemind();
      setBulkDone(true);
      setTimeout(() => setBulkDone(false), 3000);
    } catch { /* ignore */ }
    finally { setBulkReminding(false); }
  };

  const getStudentStatus = (stu) => {
    if (!stu.is_details_filled) return 'details_missing';
    if (!stu.is_face_registered) return 'pending';
    return 'registered';
  };

  // Filter + search
  const filteredStudents = (data?.students || []).filter(stu => {
    const matchSearch = !search || (
      stu.name.toLowerCase().includes(search.toLowerCase()) ||
      stu.enrollment_no.toLowerCase().includes(search.toLowerCase())
    );
    return matchSearch;
  });

  const stats = data?.stats ?? { total: 0, registered: 0, pending: 0, registration_pct: 0 };

  return (
    <AdminLayout>
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-[var(--gu-gold)] pb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-[var(--gu-gold)]/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-[var(--gu-gold)]" />
            </div>
            <h1 className="text-2xl font-serif text-white">Biometric Registration Status</h1>
          </div>
          <p className="text-white/50 text-sm">Monitor and manage student face registration for AI attendance.</p>
        </div>
        <button id="btn-bulk-remind" onClick={handleBulkRemind} disabled={bulkReminding}
          className="flex items-center gap-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#e6c949] disabled:opacity-50 transition-colors">
          {bulkReminding ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            : bulkDone ? <><CheckCircle className="w-4 h-4" /> Sent!</>
            : <><BellRing className="w-4 h-4" /> Remind All Unregistered</>}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.total, icon: Users, color: 'text-white', bg: 'bg-white/5' },
          { label: 'Registered', value: stats.registered, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20' },
          { label: 'Pending', value: stats.pending, icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20' },
          { label: 'Registration %', value: `${stats.registration_pct}%`, icon: Shield, color: 'text-[var(--gu-gold)]', bg: 'bg-[var(--gu-gold)]/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} border border-[var(--gu-border)] rounded-lg p-5 flex items-center gap-4`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or roll no..."
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--gu-border)] rounded-lg text-sm text-white bg-[#3D0F0F] focus:outline-none focus:border-[var(--gu-gold)] placeholder:text-white/30" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-[var(--gu-border)] rounded-lg text-sm text-white bg-[#3D0F0F] focus:outline-none focus:border-[var(--gu-gold)]">
            <option value="">All Status</option>
            <option value="registered">Registered</option>
            <option value="pending">Pending</option>
            <option value="details_missing">Details Missing</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-[var(--gu-border)] rounded-lg text-sm text-white bg-[#3D0F0F] focus:outline-none focus:border-[var(--gu-gold)]">
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Cards grid view */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--gu-gold)] mx-auto mb-3" />
          <p className="text-white/40 text-sm">Loading students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-lg">
          <p className="text-white/40 text-sm">No students found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((stu) => {
            const st = getStudentStatus(stu);
            const reminded = remindedIds.has(stu.student_id);
            const statusBg = { registered: 'border-green-500/30', pending: 'border-red-500/30', details_missing: 'border-orange-500/30' };
            const statusDot = { registered: 'bg-green-400', pending: 'bg-red-400', details_missing: 'bg-orange-400' };
            const statusText = { registered: 'text-green-400', pending: 'text-red-400', details_missing: 'text-orange-400' };
            const statusLabel = { registered: 'Registered', pending: 'Face Pending', details_missing: 'Details Missing' };

            return (
              <div key={stu.student_id} className={`bg-[var(--gu-red-card)] border rounded-xl p-5 hover:border-[var(--gu-gold)]/40 transition-all ${statusBg[st] || 'border-[var(--gu-border)]'}`}>
                <div className="flex items-start gap-4">
                  {/* Face photo / avatar */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 border border-[var(--gu-border)] shrink-0 flex items-center justify-center relative">
                    {stu.face_photo_url ? (
                      <img src={stu.face_photo_url} alt={stu.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <User className="w-7 h-7 text-white/20 mx-auto" />
                        {st === 'registered' && <Camera className="w-3 h-3 text-green-400 absolute bottom-1 right-1" />}
                      </div>
                    )}
                    {/* Status dot */}
                    <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-[var(--gu-red-card)] ${statusDot[st]}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">{stu.name}</h3>
                    <p className="text-white/40 text-xs font-mono">{stu.enrollment_no}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-white/5 text-white/50 px-2 py-0.5 rounded">{stu.program || '—'}</span>
                      <span className="text-[10px] bg-white/5 text-white/50 px-2 py-0.5 rounded">Sem {stu.semester || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Details</span>
                    <span className={stu.is_details_filled ? 'text-green-400 font-semibold' : 'text-orange-400 font-semibold'}>
                      {stu.is_details_filled ? '✓ Filled' : '⚠ Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Face Status</span>
                    <span className={`font-semibold ${statusText[st]}`}>{statusLabel[st]}</span>
                  </div>
                  {stu.face_registered_at && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Registered On</span>
                      <span className="text-white/70">{new Date(stu.face_registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                {!stu.is_face_registered && (
                  <button onClick={() => handleSendReminder(stu.student_id)}
                    disabled={remindingId === stu.student_id || reminded}
                    className={`mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-colors ${
                      reminded ? 'bg-green-900/30 text-green-400 cursor-default' : 'bg-white/5 text-white/60 border border-white/10 hover:border-[var(--gu-gold)]/30 hover:text-[var(--gu-gold)]'
                    } disabled:opacity-60`}>
                    {remindingId === stu.student_id ? <Loader2 className="w-3 h-3 animate-spin" />
                      : reminded ? <><CheckCircle className="w-3 h-3" /> Reminder Sent</>
                      : <><Bell className="w-3 h-3" /> Send Reminder</>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
