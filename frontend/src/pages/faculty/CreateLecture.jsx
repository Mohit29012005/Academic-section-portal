import { useState, useEffect, useRef } from 'react';
import {
  QrCode, Clock, Users, ChevronDown, Loader2, AlertCircle,
  Copy, Download, CheckCircle, XCircle, RefreshCw, Calendar
} from 'lucide-react';
import { attendanceAI } from '../../services/api';

const SESSION_TYPES = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'lab', label: 'Lab' },
  { value: 'tutorial', label: 'Tutorial' },
];

export default function CreateLecture() {
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    subject_id: '',
    date: new Date().toISOString().slice(0, 10),
    start_time: '',
    end_time: '',
    session_type: 'lecture',
    total_students: '',
  });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // Created session state
  const [session, setSession] = useState(null); // { session_id, qr_image_url, attendance_link, ... }
  const [liveStatus, setLiveStatus] = useState(null);
  const [copied, setCopied] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endResult, setEndResult] = useState(null);

  const pollRef = useRef(null);

  useEffect(() => {
    fetchSubjects();
    return () => stopPolling();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await attendanceAI.getFacultySubjects();
      setSubjects(res.data || []);
      if (res.data?.length > 0) setForm(f => ({ ...f, subject_id: String(res.data[0].subject_id) }));
    } catch {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const startPolling = (sessionId) => {
    stopPolling();
    fetchLiveStatus(sessionId);
    pollRef.current = setInterval(() => fetchLiveStatus(sessionId), 5000);
  };

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const fetchLiveStatus = async (sid) => {
    try {
      const res = await attendanceAI.getLectureStatus(sid);
      setLiveStatus(res.data);
    } catch { /* ignore */ }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.subject_id || !form.date || !form.start_time || !form.end_time || !form.total_students) {
      setFormError('All fields are required.');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      const res = await attendanceAI.createLecture(form);
      setSession(res.data);
      startPolling(res.data.session_id);
    } catch (err) {
      setFormError(err?.response?.data?.error || 'Failed to create session.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(session?.attendance_link || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!session?.qr_image_url) return;
    const a = document.createElement('a');
    a.href = session.qr_image_url;
    a.download = `qr_session_${session.session_id}.png`;
    a.click();
  };

  const handleEndSession = async () => {
    if (!session?.session_id) return;
    setEnding(true);
    stopPolling();
    try {
      const res = await attendanceAI.endLecture(session.session_id);
      setEndResult(res.data);
    } catch (err) {
      setEndResult({ error: err?.response?.data?.error || 'Failed to end session.' });
    } finally {
      setEnding(false);
    }
  };

  // ── Session created view ──
  if (session && !endResult) {
    const present = liveStatus?.present_count ?? 0;
    const total = session.total_students;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-semibold text-[var(--gu-red-dark)]">Live Session</h1>
            <p className="text-gray-500 text-sm">{session.subject} · {session.date}</p>
          </div>
          <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Session Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4">Attendance QR Code</h2>
            {session.qr_image_url ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 inline-block mb-4">
                <img src={session.qr_image_url} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>
            ) : (
              <div className="w-48 h-48 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-300" />
              </div>
            )}
            <p className="text-xs text-gray-400 mb-4">{session.subject} · {form.session_type}</p>
            <div className="flex gap-2">
              <button onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-1.5 border border-[var(--gu-red)] text-[var(--gu-red)] text-sm font-semibold py-2 rounded-lg hover:bg-[rgba(185,28,28,0.05)] transition-colors">
                {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
              </button>
              <button onClick={handleDownloadQR}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--gu-red)] text-white text-sm font-semibold py-2 rounded-lg hover:bg-[var(--gu-red-hover)] transition-colors">
                <Download className="w-4 h-4" /> Download QR
              </button>
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Attendance Link</p>
              <p className="text-xs text-[var(--gu-red)] font-mono break-all">{session.attendance_link}</p>
            </div>
          </div>

          {/* Live Counter */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-serif text-lg font-semibold text-gray-800">Live Count</h2>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <RefreshCw className="w-3 h-3" /> Updates every 5s
                </div>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-5xl font-bold text-[var(--gu-red)]">{present}</span>
                <span className="text-xl text-gray-400 mb-1">/ {total}</span>
                <span className="ml-auto text-2xl font-bold text-gray-600">{pct}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--gu-red)] rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{present} present</span>
                <span>{total - present} absent</span>
              </div>
            </div>

            {/* Session info */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
              {[
                ['Subject', session.subject],
                ['Date', session.date],
                ['Time', `${form.start_time} – ${form.end_time}`],
                ['Total Students', total],
                ['QR Expires', session.expires_at ? new Date(session.expires_at).toLocaleTimeString() : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-medium text-gray-700">{v}</span>
                </div>
              ))}
            </div>

            {/* Student table */}
            {liveStatus?.students?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-sm text-gray-700 mb-3">Present Students</h3>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {liveStatus.students.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.roll_no}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                        {s.marked_via === 'qr_link' ? 'QR' : s.marked_via === 'face_recognition' ? 'Face' : 'Manual'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button id="btn-end-session" onClick={handleEndSession} disabled={ending}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-500 disabled:opacity-50 transition-colors">
              {ending ? <><Loader2 className="w-4 h-4 animate-spin" /> Ending session...</> : <><XCircle className="w-4 h-4" /> End Session</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Session ended summary ──
  if (endResult) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-[rgba(185,28,28,0.08)] rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-[var(--gu-red)]" />
        </div>
        <h2 className="text-2xl font-serif font-semibold text-[var(--gu-red-dark)] mb-2">Session Ended</h2>
        <p className="text-gray-500 mb-6">Anomaly detection has been triggered for all students.</p>
        {!endResult.error ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-left space-y-3 mb-6">
            {[
              ['Present', endResult.present_count, 'text-green-600'],
              ['Absent', endResult.absent_count, 'text-red-500'],
              ['Total', endResult.total_students, 'text-gray-700'],
              ['Percentage', `${endResult.percentage}%`, 'text-[var(--gu-red)]'],
            ].map(([k, v, cls]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className={`font-bold ${cls}`}>{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-red-600 text-sm">{endResult.error}</div>
        )}
        <button onClick={() => { setSession(null); setEndResult(null); }}
          className="w-full bg-[var(--gu-red)] text-white font-bold py-3 rounded-xl hover:bg-[var(--gu-red-hover)] transition-colors">
          Create Another Session
        </button>
      </div>
    );
  }

  // ── Create form ──
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-[var(--gu-red-dark)]">Create Lecture Session</h1>
        <p className="text-gray-500 text-sm mt-1">Generate a QR code for student attendance marking.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm space-y-5">
        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
          {subjectsLoading ? (
            <div className="flex items-center gap-2 h-11 px-3 border border-gray-200 rounded-xl">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span className="text-gray-400 text-sm">Loading subjects...</span>
            </div>
          ) : (
            <div className="relative">
              <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--gu-red)] bg-white">
                {subjects.length === 0 && <option value="">No subjects assigned</option>}
                {subjects.map(s => (
                  <option key={s.subject_id} value={String(s.subject_id)}>{s.code} – {s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--gu-red)]" />
          </div>
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Start Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--gu-red)]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">End Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--gu-red)]" />
            </div>
          </div>
        </div>

        {/* Session Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Session Type</label>
          <div className="flex gap-3">
            {SESSION_TYPES.map(st => (
              <button key={st.value} type="button"
                onClick={() => setForm(f => ({ ...f, session_type: st.value }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  form.session_type === st.value
                    ? 'bg-[var(--gu-red)] text-white border-[var(--gu-red)]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[var(--gu-red)]/50'
                }`}>
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Total Students */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Students</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="number" min="1" value={form.total_students}
              onChange={e => setForm(f => ({ ...f, total_students: e.target.value }))}
              placeholder="Enter number of students in this class"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--gu-red)]" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Enter the total number of students enrolled in this class.</p>
        </div>

        {formError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{formError}</p>
          </div>
        )}

        <button id="btn-create-session" type="submit" disabled={creating}
          className="w-full flex items-center justify-center gap-2 bg-[var(--gu-red)] text-white font-bold py-3.5 rounded-xl hover:bg-[var(--gu-red-hover)] disabled:opacity-50 transition-colors">
          {creating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating QR Code...</>
            : <><QrCode className="w-4 h-4" /> Create Session &amp; Generate QR</>}
        </button>
      </form>
    </div>
  );
}
