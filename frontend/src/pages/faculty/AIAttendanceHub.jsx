import { useState, useEffect, useRef, useCallback } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import {
  QrCode, Clock, Users, ChevronDown, Loader2, AlertCircle,
  Copy, Download, CheckCircle, XCircle, RefreshCw, Calendar,
  Camera, Square, Wifi, AlertTriangle, Filter, ChevronUp,
  BookOpen, Zap, Eye, Shield
} from 'lucide-react';
import { attendanceAI } from '../../services/api';

// ── Tab constants ──
const TABS = [
  { id: 'create', label: 'Create Lecture', icon: QrCode, color: 'from-amber-500 to-orange-600' },
  { id: 'live', label: 'Live Face Scan', icon: Camera, color: 'from-emerald-500 to-teal-600' },
];

const SESSION_TYPES = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'lab', label: 'Lab' },
  { value: 'tutorial', label: 'Tutorial' },
];

const SEVERITY_STYLES = {
  low:      { badge: 'bg-green-900/40 text-green-300 border border-green-500/30', dot: 'bg-green-400' },
  medium:   { badge: 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/30', dot: 'bg-yellow-400' },
  high:     { badge: 'bg-orange-900/40 text-orange-300 border border-orange-500/30', dot: 'bg-orange-400' },
  critical: { badge: 'bg-red-900/40 text-red-300 border border-red-500/30', dot: 'bg-red-400' },
};

export default function AIAttendanceHub() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <FacultyLayout>
      <div className="animate-fade-in max-w-6xl mx-auto">
        {/* ── Page Header ── */}
        <div className="border-b border-[var(--gu-gold)] pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--gu-gold)] to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/20">
              <Zap className="w-5 h-5 text-[var(--gu-red-deep)]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl text-white">AI Attendance Hub</h1>
              <p className="text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">
                Smart attendance management powered by AI
              </p>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2.5 px-5 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border ${
                  isActive
                    ? 'bg-gradient-to-r ' + tab.color + ' text-white border-transparent shadow-lg scale-[1.02]'
                    : 'bg-[var(--gu-red-card)] text-white/60 border-[var(--gu-border)] hover:border-[var(--gu-gold)]/50 hover:text-white/90'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                {tab.label}
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <div className="animate-slide-up" key={activeTab}>
          {activeTab === 'create' && <CreateLectureTab />}
          {activeTab === 'live' && <LiveFaceTab />}
        </div>
      </div>
    </FacultyLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 1: CREATE LECTURE
   ═══════════════════════════════════════════════════════════════════ */
function CreateLectureTab() {
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [form, setForm] = useState({
    subject_id: '', date: new Date().toISOString().slice(0, 10),
    start_time: '', end_time: '', session_type: 'lecture', total_students: '',
  });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [session, setSession] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [copied, setCopied] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endResult, setEndResult] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => { fetchSubjects(); return () => stopPolling(); }, []);

  const fetchSubjects = async () => {
    try {
      const res = await attendanceAI.getFacultySubjects();
      setSubjects(res.data || []);
      if (res.data?.length > 0) setForm(f => ({ ...f, subject_id: String(res.data[0].subject_id) }));
    } catch { setSubjects([]); } finally { setSubjectsLoading(false); }
  };

  const startPolling = (sid) => { stopPolling(); fetchLiveStatus(sid); pollRef.current = setInterval(() => fetchLiveStatus(sid), 5000); };
  const stopPolling = () => { if (pollRef.current) clearInterval(pollRef.current); };
  const fetchLiveStatus = async (sid) => { try { const res = await attendanceAI.getLectureStatus(sid); setLiveStatus(res.data); } catch {} };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.subject_id || !form.date || !form.start_time || !form.end_time || !form.total_students) { setFormError('All fields are required.'); return; }
    setCreating(true); setFormError('');
    try { const res = await attendanceAI.createLecture(form); setSession(res.data); startPolling(res.data.session_id); }
    catch (err) { setFormError(err?.response?.data?.error || 'Failed to create session.'); }
    finally { setCreating(false); }
  };

  const handleCopyLink = () => { navigator.clipboard.writeText(session?.attendance_link || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleDownloadQR = () => { if (!session?.qr_image_url) return; const a = document.createElement('a'); a.href = session.qr_image_url; a.download = `qr_session_${session.session_id}.png`; a.click(); };

  const handleEndSession = async () => {
    if (!session?.session_id) return;
    setEnding(true); stopPolling();
    try { const res = await attendanceAI.endLecture(session.session_id); setEndResult(res.data); }
    catch (err) { setEndResult({ error: err?.response?.data?.error || 'Failed to end session.' }); }
    finally { setEnding(false); }
  };

  // ── Session ACTIVE view ──
  if (session && !endResult) {
    const present = liveStatus?.present_count ?? 0;
    const total = session.total_students;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-xl text-white">Live Session</h2>
            <p className="text-white/50 text-sm">{session.subject} · {session.date}</p>
          </div>
          <span className="flex items-center gap-1.5 bg-green-900/50 text-green-300 text-sm font-semibold px-3 py-1.5 rounded-full border border-green-500/30">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Session Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code */}
          <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-lg p-6 text-center">
            <h3 className="font-serif text-lg text-white mb-4">Attendance QR Code</h3>
            {session.qr_image_url ? (
              <div className="bg-white/10 border border-[var(--gu-border)] rounded-lg p-4 inline-block mb-4">
                <img src={session.qr_image_url} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>
            ) : (
              <div className="w-48 h-48 bg-white/5 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-white/20" />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handleCopyLink} className="flex-1 flex items-center justify-center gap-1.5 border border-[var(--gu-gold)] text-[var(--gu-gold)] text-sm font-semibold py-2 rounded-lg hover:bg-[var(--gu-gold)]/10 transition-colors">
                {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
              </button>
              <button onClick={handleDownloadQR} className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] text-sm font-semibold py-2 rounded-lg hover:bg-[#e6c949] transition-colors">
                <Download className="w-4 h-4" /> Download QR
              </button>
            </div>
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-white/40 mb-1">Attendance Link</p>
              <p className="text-xs text-[var(--gu-gold)] font-mono break-all">{session.attendance_link}</p>
            </div>
          </div>

          {/* Live Counter & info */}
          <div className="space-y-4">
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg text-white">Live Count</h3>
                <div className="flex items-center gap-1 text-xs text-white/40"><RefreshCw className="w-3 h-3" /> Every 5s</div>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-5xl font-bold text-[var(--gu-gold)]">{present}</span>
                <span className="text-xl text-white/40 mb-1">/ {total}</span>
                <span className="ml-auto text-2xl font-bold text-white/70">{pct}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--gu-gold)] to-amber-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/40">
                <span>{present} present</span><span>{total - present} absent</span>
              </div>
            </div>

            {liveStatus?.students?.length > 0 && (
              <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-lg p-5">
                <h3 className="font-semibold text-sm text-white/70 mb-3">Present Students</h3>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {liveStatus.students.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-green-900/20 border border-green-500/20 rounded-lg px-3 py-2">
                      <div><p className="text-sm font-medium text-white">{s.name}</p><p className="text-xs text-white/40">{s.roll_no}</p></div>
                      <span className="text-xs bg-green-900/40 text-green-300 px-2 py-1 rounded-full font-semibold">
                        {s.marked_via === 'qr_link' ? 'QR' : s.marked_via === 'face_recognition' ? 'Face' : 'Manual'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleEndSession} disabled={ending}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors">
              {ending ? <><Loader2 className="w-4 h-4 animate-spin" /> Ending...</> : <><XCircle className="w-4 h-4" /> End Session</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Session ENDED summary ──
  if (endResult) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center animate-fade-in">
        <div className="w-20 h-20 bg-[var(--gu-gold)]/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-[var(--gu-gold)]" />
        </div>
        <h2 className="text-2xl font-serif text-white mb-2">Session Ended</h2>
        <p className="text-white/50 mb-6">Attendance has been processed.</p>
        {!endResult.error ? (
          <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-lg p-6 text-left space-y-3 mb-6">
            {[['Present', endResult.present_count, 'text-green-400'], ['Absent', endResult.absent_count, 'text-red-400'], ['Total', endResult.total_students, 'text-white'], ['Percentage', `${endResult.percentage}%`, 'text-[var(--gu-gold)]']].map(([k, v, cls]) => (
              <div key={k} className="flex justify-between text-sm"><span className="text-white/50">{k}</span><span className={`font-bold ${cls}`}>{v}</span></div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg mb-6 text-red-300 text-sm">{endResult.error}</div>
        )}
        <button onClick={() => { setSession(null); setEndResult(null); }}
          className="w-full bg-[var(--gu-gold)] text-[var(--gu-red-deep)] font-bold py-3 rounded-lg hover:bg-[#e6c949] transition-colors">
          Create Another Session
        </button>
      </div>
    );
  }

  // ── Create FORM ──
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <form onSubmit={handleCreate} className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-lg p-7 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Subject</label>
          {subjectsLoading ? (
            <div className="flex items-center gap-2 h-11 px-3 border border-[var(--gu-border)] rounded-lg bg-[#3D0F0F]">
              <Loader2 className="w-4 h-4 animate-spin text-white/40" /><span className="text-white/40 text-sm">Loading subjects...</span>
            </div>
          ) : (
            <div className="relative">
              <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                className="w-full appearance-none px-4 py-3 border border-[var(--gu-border)] rounded-lg text-sm text-white bg-[#3D0F0F] focus:outline-none focus:border-[var(--gu-gold)]">
                {subjects.length === 0 && <option value="">No subjects assigned</option>}
                {subjects.map(s => <option key={s.subject_id} value={String(s.subject_id)}>{s.code} – {s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-[var(--gu-border)] rounded-lg text-sm text-white bg-[#3D0F0F] focus:outline-none focus:border-[var(--gu-gold)] color-scheme-dark" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Start Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-[var(--gu-border)] rounded-lg text-sm text-white bg-[#3D0F0F] focus:outline-none focus:border-[var(--gu-gold)] color-scheme-dark" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">End Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-[var(--gu-border)] rounded-lg text-sm text-white bg-[#3D0F0F] focus:outline-none focus:border-[var(--gu-gold)] color-scheme-dark" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Session Type</label>
          <div className="flex gap-3">
            {SESSION_TYPES.map(st => (
              <button key={st.value} type="button" onClick={() => setForm(f => ({ ...f, session_type: st.value }))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                  form.session_type === st.value
                    ? 'bg-[var(--gu-gold)] text-[var(--gu-red-deep)] border-[var(--gu-gold)]'
                    : 'bg-[#3D0F0F] text-white/60 border-[var(--gu-border)] hover:border-[var(--gu-gold)]/50'
                }`}>{st.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Total Students</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="number" min="1" value={form.total_students} onChange={e => setForm(f => ({ ...f, total_students: e.target.value }))}
              placeholder="Enter number of students" className="w-full pl-10 pr-4 py-3 border border-[var(--gu-border)] rounded-lg text-sm text-white bg-[#3D0F0F] focus:outline-none focus:border-[var(--gu-gold)] placeholder:text-white/30" />
          </div>
        </div>
        {formError && (
          <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-red-300 text-sm">{formError}</p>
          </div>
        )}
        <button type="submit" disabled={creating}
          className="w-full flex items-center justify-center gap-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] font-bold py-3.5 rounded-lg hover:bg-[#e6c949] disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-amber-900/20">
          {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating QR...</> : <><QrCode className="w-4 h-4" /> Create Session &amp; Generate QR</>}
        </button>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 2: LIVE FACE ATTENDANCE
   ═══════════════════════════════════════════════════════════════════ */
function LiveFaceTab() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [liveStatus, setLiveStatus] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [scanLog, setScanLog] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { fetchSessions(); return () => { stopCamera(); stopPolling(); }; }, []);
  useEffect(() => { if (selectedSession) { fetchStatus(); startPolling(); } else { stopPolling(); } }, [selectedSession]);

  const fetchSessions = async () => { try { const res = await attendanceAI.getFacultySessions(); setSessions(res.data || []); if (res.data?.length > 0) setSelectedSession(String(res.data[0].id)); } catch { setSessions([]); } };
  const fetchStatus = async () => { if (!selectedSession) return; try { const res = await attendanceAI.getLectureStatus(selectedSession); setLiveStatus(res.data); } catch {} };
  const startPolling = () => { stopPolling(); pollIntervalRef.current = setInterval(fetchStatus, 4000); };
  const stopPolling = () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => setCameraActive(true); }
    } catch { setError('Camera access denied.'); }
  };
  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); setCameraActive(false); stopScanning(); };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    canvas.width = 640; canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const startScanning = useCallback(() => {
    if (!selectedSession) { setError('Select an active session first.'); return; }
    setScanning(true); setError('');
    const scan = async () => {
      const frame = captureFrame(); if (!frame) return;
      try {
        const res = await attendanceAI.markAttendanceFace(selectedSession, frame);
        setLastResult(res.data);
        if (res.data.recognized) {
          setError('');
        } else {
          setError(res.data?.message || 'Face not recognized. Adjust camera and try again.');
        }

        if (res.data.recognized && !res.data.already_marked) {
          setScanLog(prev => [{ student_name: res.data.student_name, roll_no: res.data.roll_no, confidence: res.data.confidence_score, time: new Date().toLocaleTimeString(), recognized: true }, ...prev.slice(0, 19)]);
          fetchStatus();
        }
      } catch (err) {
        setError(err?.response?.data?.error || err?.response?.data?.message || 'Face scan failed. Please check camera and session.');
      }
    };
    scan(); scanIntervalRef.current = setInterval(scan, 3000);
  }, [selectedSession, captureFrame]);

  const stopScanning = () => { setScanning(false); if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); };

  const total = liveStatus?.total_students ?? 0;
  const present = liveStatus?.present_count ?? 0;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-[var(--gu-border)] rounded-lg text-sm text-white bg-[#3D0F0F] focus:outline-none focus:border-[var(--gu-gold)] min-w-56">
              <option value="">— Select Session —</option>
              {sessions.map(s => <option key={s.id} value={String(s.id)}>{s.subject_name} ({s.session_type})</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
          {!cameraActive ? (
            <button onClick={startCamera} className="flex items-center gap-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#e6c949] transition-colors">
              <Camera className="w-4 h-4" /> Start Camera
            </button>
          ) : (
            <button onClick={stopCamera} className="flex items-center gap-2 bg-white/10 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-white/20 transition-colors">
              <Square className="w-4 h-4" /> Stop Camera
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-lg p-5">
            <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} className="hidden" />
              {scanning && (
                <div className="absolute inset-0 border-2 border-[var(--gu-gold)]/70 rounded-lg pointer-events-none">
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full">
                    <Wifi className="w-3 h-3 text-[var(--gu-gold)] animate-pulse" />
                    <span className="text-[var(--gu-gold)] text-xs font-semibold">Scanning...</span>
                  </div>
                </div>
              )}
              {lastResult?.recognized && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-green-900/90 text-green-300 text-xs font-semibold px-3 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {lastResult.already_marked ? `${lastResult.student_name} — Already Marked` : `✓ ${lastResult.student_name} (${lastResult.confidence_score}%)`}
                </div>
              )}
              {lastResult && !lastResult.recognized && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-red-900/90 text-red-300 text-xs font-semibold px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {lastResult.message || 'Face not recognized. Try better lighting and camera angle.'}
                </div>
              )}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                  <Camera className="w-12 h-12 mb-3" /><p className="text-sm">Camera not started</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              {!scanning ? (
                <button onClick={startScanning} disabled={!cameraActive || !selectedSession}
                  className="flex-1 flex items-center justify-center gap-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] font-bold py-2.5 rounded-lg hover:bg-[#e6c949] disabled:opacity-50 transition-colors text-sm">
                  <Wifi className="w-4 h-4" /> Start Auto-Scan
                </button>
              ) : (
                <button onClick={stopScanning}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-2.5 rounded-lg hover:bg-orange-500 transition-colors text-sm">
                  <Square className="w-4 h-4" /> Stop Scanning
                </button>
              )}
            </div>
            <p className="text-xs text-white/30 text-center mt-2">{scanning ? 'Auto-scanning every 3s...' : 'Scan for faces automatically every 3s.'}</p>
          </div>

          {scanLog.length > 0 && (
            <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-lg p-5">
              <h3 className="font-semibold text-sm text-white/70 mb-3">Recognition Log</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {scanLog.map((log, i) => (
                  <div key={i} className="flex items-center justify-between bg-green-900/20 border border-green-500/20 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <div><p className="text-xs font-semibold text-white">{log.student_name}</p><p className="text-[10px] text-white/40">{log.roll_no}</p></div>
                    </div>
                    <div className="text-right"><p className="text-xs font-semibold text-green-400">{log.confidence}%</p><p className="text-[10px] text-white/40">{log.time}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-white">Attendance Status</h2>
            <div className="flex items-center gap-1.5 bg-[var(--gu-gold)]/10 text-[var(--gu-gold)] text-sm font-bold px-3 py-1.5 rounded-full"><Users className="w-4 h-4" /> {present} / {total}</div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1"><span>Attendance</span><span>{pct}%</span></div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--gu-gold)] to-amber-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {!liveStatus?.students?.length ? (
              <div className="text-center py-16 bg-white/5 border border-dashed border-white/10 rounded-xl">
                <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No students recorded yet.</p>
              </div>
            ) : liveStatus.students.map((s, i) => {
              const sc = { present: 'bg-green-900/10 border-green-500/20', late: 'bg-yellow-900/10 border-yellow-500/20', absent: 'bg-red-900/10 border-red-500/20' };
              const tc = { present: 'text-green-400', late: 'text-yellow-400', absent: 'text-red-400' };
              const isMarked = s.status === 'present' || s.status === 'late';
              
              return (
                <div key={i} className={`group relative flex items-center gap-4 transition-all border rounded-xl p-3 hover:translate-x-1 ${sc[s.status] || 'bg-white/5 border-white/10 hover:border-[var(--gu-gold)]/40 hover:bg-white/[0.07]'}`}>
                  {/* Student Photo */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 bg-[#1a0000] shadow-xl group-hover:border-[var(--gu-gold)]/50 transition-all">
                      {s.registered_photo ? (
                        <img src={s.registered_photo} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                    </div>
                    {isMarked && (
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-[#1a0000] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-bold text-white truncate">{s.name}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isMarked ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <p className="text-[11px] font-mono text-white/40">{s.roll_no}</p>
                       {s.marked_via && (
                         <div className="flex items-center gap-1 text-[10px] bg-white/10 text-[var(--gu-gold)] px-1.5 py-0.5 rounded border border-[var(--gu-gold)]/20">
                           {s.marked_via === 'face_recognition' ? <Zap className="w-2.5 h-2.5" /> : <QrCode className="w-2.5 h-2.5" />}
                           {s.marked_via === 'face_recognition' ? 'AI Auto' : s.marked_via === 'qr_link' ? 'QR Code' : 'Manual'}
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Detail Snapshot On Hover/Click */}
                  {s.snapshot_path && (
                    <div className="shrink-0 ml-1">
                       <div className="w-10 h-10 rounded border border-white/10 overflow-hidden bg-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                         <img src={s.snapshot_path} alt="Capture" className="w-full h-full object-cover" />
                       </div>
                    </div>
                  )}

                  {/* Recognition score */}
                  {s.confidence_score && (
                    <div className="text-right ml-2 bg-white/5 px-2 py-1 rounded">
                      <p className="text-[10px] text-white/30 uppercase tracking-tighter">Match</p>
                      <p className="text-xs font-bold text-[var(--gu-gold)]">{s.confidence_score}%</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

