import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users, CheckCircle, XCircle, AlertCircle, Search,
  Bell, BellRing, Loader2, Shield, ChevronDown, Camera, Eye, User,
  X, Upload, Trash2, RotateCcw, BarChart2, BookOpen, ExternalLink, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { attendanceAI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

const STATUS_LABELS = {
  registered: 'Registered',
  pending: 'Face Pending',
  details_missing: 'Details Missing',
};

const ITEMS_PER_PAGE = 24;

export default function StudentFaceStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Actions
  const [remindingId, setRemindingId] = useState(null);
  const [remindedIds, setRemindedIds] = useState(new Set());
  const [bulkReminding, setBulkReminding] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  // View Details modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => { fetchData(); }, [statusFilter, semesterFilter]);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (semesterFilter) params.semester = semesterFilter;
      const res = await attendanceAI.getStudentFaceStatus(params);
      // Deduplicate by user_id on frontend as safety net
      const raw = res.data?.students || [];
      const seen = new Set();
      const unique = raw.filter(s => {
        const key = s.user_id || s.student_id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setData({ ...res.data, students: unique });
    } catch {
      setError('Failed to load student data.');
    } finally { setLoading(false); }
  };

  const handleSendReminder = async (studentId) => {
    setRemindingId(studentId);
    try {
      await attendanceAI.sendReminder(studentId);
      setRemindedIds(prev => new Set([...prev, studentId]));
    } catch { } finally { setRemindingId(null); }
  };

  const handleBulkRemind = async () => {
    setBulkReminding(true);
    try {
      await attendanceAI.bulkRemind();
      setBulkDone(true);
      setTimeout(() => setBulkDone(false), 3000);
    } catch { } finally { setBulkReminding(false); }
  };

  const getStudentStatus = (stu) => {
    if (!stu.is_details_filled) return 'details_missing';
    if (!stu.is_face_registered) return 'pending';
    return 'registered';
  };

  // ── Open Details Modal ──
  const openDetails = async (stu) => {
    setSelectedStudent(stu);
    setAttendanceStats(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setActionMsg(null);
    setDetailLoading(true);
    try {
      const res = await attendanceAI.getStudentAttendanceStats(stu.student_id);
      setAttendanceStats(res.data);
    } catch { setAttendanceStats(null); }
    finally { setDetailLoading(false); }
  };

  const closeDetails = () => {
    setSelectedStudent(null);
    setAttendanceStats(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setActionMsg(null);
  };

  // ── Photo upload ──
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!photoFile || !selectedStudent) return;
    setUploading(true); setActionMsg(null);
    try {
      const fd = new FormData();
      fd.append('photo', photoFile);
      const res = await attendanceAI.uploadStudentPhoto(selectedStudent.student_id, fd);
      // Update in local data
      setSelectedStudent(prev => ({ ...prev, face_photo_url: res.data.photo_url }));
      setData(prev => ({
        ...prev,
        students: prev.students.map(s =>
          s.student_id === selectedStudent.student_id
            ? { ...s, face_photo_url: res.data.photo_url }
            : s
        )
      }));
      setPhotoFile(null);
      setPhotoPreview(null);
      setActionMsg({ type: 'success', text: 'Photo uploaded successfully.' });
    } catch (err) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || 'Upload failed.' });
    } finally { setUploading(false); }
  };

  // ── Delete / Reset face ──
  const handleDeleteFace = async () => {
    if (!selectedStudent) return;
    if (!window.confirm(`Reset face registration for ${selectedStudent.name}? This cannot be undone.`)) return;
    setDeleting(true); setActionMsg(null);
    try {
      await attendanceAI.deleteStudentFace(selectedStudent.student_id);
      setSelectedStudent(prev => ({
        ...prev,
        is_face_registered: false,
        face_registered_at: null,
        face_photo_url: null
      }));
      setData(prev => ({
        ...prev,
        students: prev.students.map(s =>
          s.student_id === selectedStudent.student_id
            ? { ...s, is_face_registered: false, face_registered_at: null, face_photo_url: null }
            : s
        )
      }));
      setActionMsg({ type: 'success', text: 'Face data deleted. Student must re-register.' });
    } catch (err) {
      setActionMsg({ type: 'error', text: err?.response?.data?.error || 'Failed to delete face data.' });
    } finally { setDeleting(false); }
  };

  // Filter + search (memoized for performance)
  const filteredStudents = useMemo(() => {
    return (data?.students || []).filter(stu => {
      const matchSearch = !search || (
        stu.name.toLowerCase().includes(search.toLowerCase()) ||
        stu.enrollment_no.toLowerCase().includes(search.toLowerCase())
      );
      return matchSearch;
    });
  }, [data, search]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  // Reset to page 1 when filters/search change
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, semesterFilter]);

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
              <h1 className="text-2xl font-serif text-white">Face Registration Status</h1>
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
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
            {paginatedStudents.map((stu) => {
              const st = getStudentStatus(stu);
              const reminded = remindedIds.has(stu.student_id);
              const statusBg = { registered: 'border-green-500/30', pending: 'border-red-500/30', details_missing: 'border-orange-500/30' };
              const statusDot = { registered: 'bg-green-400', pending: 'bg-red-400', details_missing: 'bg-orange-400' };
              const statusText = { registered: 'text-green-400', pending: 'text-red-400', details_missing: 'text-orange-400' };

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

                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">Details</span>
                      <span className={`flex items-center gap-1.5 font-bold ${stu.is_details_filled ? 'text-green-400' : 'text-orange-400'}`}>
                        {stu.is_details_filled ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {stu.is_details_filled ? 'Filled' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">Face Status</span>
                      <span className={`flex items-center gap-1.5 font-bold ${statusText[st]}`}>
                         {st === 'registered' ? <CheckCircle size={12} /> : st === 'pending' ? <XCircle size={12} /> : <AlertCircle size={12} />}
                         {STATUS_LABELS[st]}
                      </span>
                    </div>
                    {stu.face_registered_at && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">Registered On</span>
                        <span className="text-white/70 flex items-center gap-1.5 font-mono">
                          <Calendar size={12} className="opacity-40" />
                          {new Date(stu.face_registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className={`mt-4 flex gap-2 ${!stu.is_face_registered ? 'flex-col' : ''}`}>
                    {/* View Details always shown */}
                    <button onClick={() => openDetails(stu)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-[var(--gu-gold)]/10 text-[var(--gu-gold)] border border-[var(--gu-gold)]/20 hover:bg-[var(--gu-gold)]/20 transition-colors">
                      <Eye className="w-3 h-3" /> View Details
                    </button>

                    {!stu.is_face_registered && (
                      <button onClick={() => handleSendReminder(stu.student_id)}
                        disabled={remindingId === stu.student_id || reminded}
                        className={`flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-colors ${
                          reminded ? 'bg-green-900/30 text-green-400 cursor-default' : 'bg-white/5 text-white/60 border border-white/10 hover:border-[var(--gu-gold)]/30 hover:text-[var(--gu-gold)]'
                        } disabled:opacity-60`}>
                        {remindingId === stu.student_id ? <Loader2 className="w-3 h-3 animate-spin" />
                          : reminded ? <><CheckCircle className="w-3 h-3" /> Reminder Sent</>
                          : <><Bell className="w-3 h-3" /> Send Reminder</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="text-white/20 px-1 text-xs">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${
                        currentPage === item
                          ? 'bg-[var(--gu-gold)] text-black'
                          : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )
              }
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── View Details Modal ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeDetails(); }}>
          <div className="bg-[var(--gu-red-deep)] border border-[var(--gu-border)] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--gu-gold)]/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[var(--gu-gold)]" />
                </div>
                <div>
                  <h2 className="font-serif text-lg text-white">{selectedStudent.name}</h2>
                  <p className="text-xs text-white/40 font-mono">{selectedStudent.enrollment_no}</p>
                </div>
              </div>
              <button onClick={closeDetails} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Action feedback */}
              {actionMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  actionMsg.type === 'success'
                    ? 'bg-green-900/30 border border-green-500/30 text-green-300'
                    : 'bg-red-900/30 border border-red-500/30 text-red-300'
                }`}>
                  {actionMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {actionMsg.text}
                </div>
              )}

              {/* Current Photo + Status */}
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-[var(--gu-border)] shrink-0 bg-white/5 flex items-center justify-center">
                  {selectedStudent.face_photo_url ? (
                    <img src={selectedStudent.face_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-white/20" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Course / Semester</span>
                    <span className="font-medium text-white/80">{selectedStudent.program} · Sem {selectedStudent.semester}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Details</span>
                    <span className={selectedStudent.is_details_filled ? 'text-green-400 font-semibold' : 'text-orange-400 font-semibold'}>
                      {selectedStudent.is_details_filled ? '✓ Filled' : '⚠ Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Face Registration</span>
                    <span className={selectedStudent.is_face_registered ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {selectedStudent.is_face_registered ? '✓ Registered' : '✗ Not Registered'}
                    </span>
                  </div>
                  {selectedStudent.face_registered_at && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Registered On</span>
                      <span className="text-white/60">{new Date(selectedStudent.face_registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Photo */}
              <div>
                <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Face Photo
                </h3>
                <div className="space-y-3">
                  {photoPreview && (
                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-[var(--gu-gold)]/30">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <button onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-white/5 text-white/70 border border-white/10 hover:border-[var(--gu-gold)]/30 hover:text-white transition-colors">
                      <Camera className="w-4 h-4" /> {photoFile ? photoFile.name : 'Choose Photo'}
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    {photoFile && (
                      <button onClick={handleUploadPhoto} disabled={uploading}
                        className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--gu-gold)] text-[var(--gu-red-deep)] hover:bg-[#e6c949] disabled:opacity-50 transition-colors">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-white/30">Upload a clear face photo for this student (jpg, png)</p>
                </div>
              </div>

              {/* Reset / Delete Face */}
              {selectedStudent.is_face_registered && (
                <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/20">
                  <h3 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Reset Face Registration
                  </h3>
                  <p className="text-xs text-white/40 mb-3">This will permanently delete the face encoding and photo. The student must re-register their face.</p>
                  <button onClick={handleDeleteFace} disabled={deleting}
                    className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    {deleting ? 'Deleting...' : 'Delete & Reset Face'}
                  </button>
                </div>
              )}

              {/* Attendance Stats */}
              <div>
                <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> Attendance Statistics
                </h3>
                {detailLoading ? (
                  <div className="flex items-center gap-2 py-4 text-white/30">
                    <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading statistics...</span>
                  </div>
                ) : attendanceStats ? (
                  <div className="space-y-4">
                    {/* Overall */}
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white/60">Overall Attendance</span>
                        <span className={`text-2xl font-bold ${attendanceStats.overall.percentage >= 75 ? 'text-green-400' : attendanceStats.overall.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {attendanceStats.overall.percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${attendanceStats.overall.percentage >= 75 ? 'bg-green-500' : attendanceStats.overall.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${attendanceStats.overall.percentage}%` }} />
                      </div>
                      <p className="text-xs text-white/30 mt-1.5">{attendanceStats.overall.present} / {attendanceStats.overall.total} sessions attended</p>
                    </div>

                    {/* Subject breakdown */}
                    {attendanceStats.subjects?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Subject-wise</p>
                        {attendanceStats.subjects.map((sub, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-white truncate">{sub.subject_code} – {sub.subject_name}</span>
                                <span className={`text-xs font-bold ml-2 ${sub.percentage >= 75 ? 'text-green-400' : sub.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {sub.percentage}%
                                </span>
                              </div>
                              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${sub.percentage >= 75 ? 'bg-green-500' : sub.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${sub.percentage}%` }} />
                              </div>
                              <p className="text-[10px] text-white/25 mt-0.5">{sub.present}/{sub.total} classes</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {attendanceStats.subjects?.length === 0 && (
                      <p className="text-sm text-white/30 py-2">No attendance records yet.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white/30 py-2">No attendance data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
