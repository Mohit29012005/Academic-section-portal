import { useState, useRef, useEffect, useCallback } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import { attendanceAI, academicsAPI } from '../../services/api';
import {
  Camera, Users, CheckCircle, XCircle, Clock, Loader2,
  Play, Square, Zap, AlertTriangle, QrCode, RefreshCw
} from 'lucide-react';

const SCAN_INTERVAL_MS = 3000;

export default function LiveAttendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sessionType, setSessionType] = useState('lecture');
  const [session, setSession] = useState(null); // { session_id, qr_token }
  const [sessionActive, setSessionActive] = useState(false);
  const [studentRecords, setStudentRecords] = useState([]); // list of {name, status, ...}
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [endLoading, setEndLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    loadSubjects();
    return () => {
      stopCamera();
      stopScanning();
    };
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await academicsAPI.subjects();
      setSubjects(res.data.results || res.data || []);
    } catch {
      setSubjects([]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      setError('Camera access failed. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraReady(false);
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    return canvas.toDataURL('image/jpeg', 0.7);
  }, []);

  const handleStartSession = async () => {
    if (!selectedSubject) {
      setError('Please select a subject first.');
      return;
    }
    setError('');
    try {
      const res = await attendanceAI.startSession(selectedSubject, sessionType);
      setSession(res.data);
      setSessionActive(true);
      await startCamera();
      startScanning(res.data.session_id);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to start session.');
    }
  };

  const startScanning = (sessionId) => {
    scanIntervalRef.current = setInterval(async () => {
      const frame = captureFrame();
      if (!frame) return;
      setScanning(true);
      try {
        const res = await attendanceAI.markFace(sessionId, frame);
        const data = res.data;
        if (data.student_name && data.status === 'present') {
          setLastResult({ name: data.student_name, confidence: data.confidence_score, status: 'present' });
          setStudentRecords(prev => {
            const existing = prev.find(r => r.name === data.student_name);
            if (existing) return prev;
            return [...prev, {
              name: data.student_name,
              status: 'present',
              marked_via: 'face',
              confidence: data.confidence_score,
              time: new Date().toLocaleTimeString(),
            }];
          });
        } else {
          setLastResult({ name: null, status: 'searching' });
        }
      } catch {
        // Silently fail per-scan errors
      } finally {
        setScanning(false);
      }
    }, SCAN_INTERVAL_MS);
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
  };

  const handleEndSession = async () => {
    if (!session) return;
    setEndLoading(true);
    stopScanning();
    try {
      const res = await attendanceAI.endSession(session.session_id);
      setSummary(res.data);
      setSessionActive(false);
      stopCamera();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to end session.');
    } finally {
      setEndLoading(false);
    }
  };

  const statusColor = (s) => {
    if (s === 'present') return 'text-green-400 bg-green-900/30 border-green-700/40';
    if (s === 'late') return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40';
    return 'text-red-400 bg-red-900/30 border-red-700/40';
  };

  return (
    <FacultyLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="border-b border-[var(--gu-border)] pb-6 mb-6">
          <h1 className="font-serif text-3xl text-white mb-1">Live AI Attendance</h1>
          <p className="text-[var(--gu-gold)] text-sm uppercase tracking-wider">Real-time face recognition session</p>
        </div>

        {/* Session Setup (before session starts) */}
        {!sessionActive && !summary && (
          <div className="max-w-xl bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Start New Session</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-1">Subject</label>
                <select
                  id="select-subject"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2 bg-black/30 border border-[var(--gu-border)] rounded-lg text-white focus:border-[var(--gu-gold)] focus:outline-none"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => (
                    <option key={s.subject_id} value={s.subject_id}>{s.code} — {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-1">Session Type</label>
                <div className="flex gap-2">
                  {['lecture', 'lab', 'tutorial'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSessionType(t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all border ${
                        sessionType === t
                          ? 'bg-[var(--gu-gold)] text-[#7B0D0D] border-[var(--gu-gold)]'
                          : 'bg-transparent text-white/60 border-[var(--gu-border)] hover:border-[var(--gu-gold)]/50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              <button
                id="btn-start-session"
                onClick={handleStartSession}
                className="w-full flex items-center justify-center gap-2 bg-[var(--gu-gold)] text-[#7B0D0D] font-bold py-3 rounded-lg hover:bg-[#E8C84A] transition-colors"
              >
                <Play className="w-4 h-4" /> Start Session
              </button>
            </div>
          </div>
        )}

        {/* Active Session */}
        {sessionActive && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Camera feed */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-[var(--gu-border)]">
                <video ref={videoRef} autoPlay muted playsInline
                  className="w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning badge */}
                <div className="absolute top-3 right-3">
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    scanning ? 'bg-[var(--gu-gold)] text-[#7B0D0D]' : 'bg-white/20 text-white'
                  }`}>
                    {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                    {scanning ? 'Scanning...' : 'Watching'}
                  </span>
                </div>

                {/* Last result overlay */}
                {lastResult && lastResult.status === 'present' && (
                  <div className="absolute bottom-3 left-3 right-3 bg-green-900/80 border border-green-500/50 rounded-lg p-3 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white font-semibold text-sm">{lastResult.name}</p>
                        <p className="text-green-400 text-xs">{lastResult.confidence}% confidence</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* QR Token display */}
              {session?.qr_token && (
                <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="w-4 h-4 text-[var(--gu-gold)]" />
                    <span className="text-white/70 text-xs uppercase tracking-wider">QR Fallback Token</span>
                  </div>
                  <code className="text-[var(--gu-gold)] text-xs break-all">{session.qr_token}</code>
                </div>
              )}

              {/* End Session */}
              <button
                id="btn-end-session"
                onClick={handleEndSession}
                disabled={endLoading}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {endLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Ending...</>
                  : <><Square className="w-4 h-4" /> End Session</>
                }
              </button>
            </div>

            {/* Right: Student list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-semibold">Recognized Students</h2>
                <span className="bg-green-900/40 text-green-400 border border-green-700/40 px-3 py-0.5 rounded-full text-sm font-semibold">
                  {studentRecords.length} Present
                </span>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {studentRecords.length === 0 ? (
                  <div className="text-center py-12 text-white/30">
                    <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No students recognized yet</p>
                    <p className="text-xs mt-1">Camera scans every 3 seconds</p>
                  </div>
                ) : (
                  studentRecords.map((rec, i) => (
                    <div key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${statusColor(rec.status)}`}>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-sm">
                        {rec.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{rec.name}</p>
                        <p className="text-xs opacity-70">{rec.marked_via === 'face' ? `${rec.confidence}% confidence` : 'QR scanned'} · {rec.time}</p>
                      </div>
                      <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${
                        rec.status === 'present' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary Modal after session ends */}
        {summary && (
          <div className="max-w-xl mx-auto bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-white font-serif text-2xl mb-2">Session Ended</h2>
            <p className="text-white/50 text-sm mb-6">Attendance has been processed for all students</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Present', value: summary.present_count, color: 'text-green-400' },
                { label: 'Absent', value: summary.absent_count, color: 'text-red-400' },
                { label: 'Late', value: summary.late_count, color: 'text-yellow-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-black/30 rounded-lg p-3">
                  <p className={`font-serif text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-white/50 text-xs mt-1">{label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setSummary(null); setStudentRecords([]); setSession(null); }}
              className="bg-[var(--gu-gold)] text-[#7B0D0D] font-bold px-8 py-3 rounded-lg hover:bg-[#E8C84A] transition-colors"
            >
              Start New Session
            </button>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
