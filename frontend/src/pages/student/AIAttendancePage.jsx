import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, CheckCircle, AlertCircle, Loader2, User, Phone, Mail,
  ChevronRight, Sun, Eye, Glasses, Smile, Maximize2, RefreshCw, Upload,
  Shield, BarChart2, BookOpen, Calendar, TrendingDown, TrendingUp, Zap
} from 'lucide-react';
import { attendanceAI, studentAPI } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';

const TOTAL_CAPTURES = 5;
const CAPTURE_INTERVAL_MS = 1500;

const tips = [
  { icon: Sun, text: 'Sit in a well-lit area', color: '#F59E0B' },
  { icon: Eye, text: 'Look directly at camera', color: '#3B82F6' },
  { icon: Glasses, text: 'Remove glasses if possible', color: '#8B5CF6' },
  { icon: Smile, text: 'Keep a neutral expression', color: '#10B981' },
  { icon: Maximize2, text: 'Stay still during capture', color: '#F97316' },
];

const TABS = [
  { id: 'setup', label: 'AI Setup', icon: Shield },
  { id: 'report', label: 'Attendance Report', icon: BarChart2 },
];

export default function AIAttendancePage() {
  const [activeTab, setActiveTab] = useState('setup');
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await attendanceAI.getRegistrationStatus();
      setStatus(res.data);
      // If already complete, default to report tab
      if (res.data?.profile_complete) setActiveTab('report');
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="relative">
        <div className="fixed inset-0 z-0" style={{ backgroundImage: 'url(/maxresdefault.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.3 }} />
        <div className="animate-fade-in relative z-10 max-w-6xl mx-auto space-y-6">

          {/* Page Header */}
          <div className="border-b border-[var(--gu-gold)] pb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-[var(--gu-gold)]/10 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-[var(--gu-gold)]" />
              </div>
              <h1 className="font-serif text-2xl md:text-3xl text-white">AI Attendance</h1>
            </div>
            <p className="text-[var(--gu-gold)] text-xs uppercase tracking-widest font-semibold">
              Biometric setup &amp; attendance report
            </p>
          </div>

          {/* Registration status banner */}
          {!statusLoading && status && !status.profile_complete && activeTab === 'report' && (
            <div className="flex items-center gap-3 p-4 bg-amber-900/30 border border-amber-500/40 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-amber-300 text-sm font-semibold">AI Setup Incomplete</p>
                <p className="text-amber-300/70 text-xs">Complete face registration to enable AI attendance marking.</p>
              </div>
              <button onClick={() => setActiveTab('setup')} className="ml-auto text-xs font-bold text-amber-400 hover:underline whitespace-nowrap">Complete Setup →</button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all border ${
                    isActive
                      ? 'bg-[var(--gu-gold)] text-[var(--gu-red-deep)] border-[var(--gu-gold)] shadow-lg'
                      : 'bg-[var(--gu-red-card)] text-white/60 border-[var(--gu-border)] hover:border-[var(--gu-gold)]/40 hover:text-white'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'setup' && status && !status.profile_complete && (
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div key={activeTab} className="animate-slide-up">
            {activeTab === 'setup' && (
              <SetupTab status={status} statusLoading={statusLoading} onComplete={fetchStatus} />
            )}
            {activeTab === 'report' && <ReportTab />}
          </div>

        </div>
      </div>
    </StudentLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   SETUP TAB (face registration onboarding)
   ═══════════════════════════════════════════════════════════ */
function SetupTab({ status, statusLoading, onComplete }) {
  const [step, setStep] = useState(null);
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [email, setEmail] = useState('');
  const [detailsSubmitting, setDetailsSubmitting] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [captures, setCaptures] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [captureIndex, setCaptureIndex] = useState(0);
  const [faceSubmitting, setFaceSubmitting] = useState(false);
  const [faceError, setFaceError] = useState('');

  useEffect(() => {
    if (!statusLoading && status) {
      if (status.profile_complete) setStep('complete');
      else if (!status.is_details_filled) setStep('details');
      else { setStep('face'); startCamera(); }
    } else if (!statusLoading && !status) {
      setStep('details');
    }
    return () => stopCamera();
  }, [status, statusLoading]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCameraReady(true);
        }
      }, 300);
    } catch { setFaceError('Camera access denied. Please allow camera access to continue.'); }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 640; canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  const startCapture = useCallback(() => {
    if (!cameraReady) return;
    setCaptures([]); setCaptureIndex(0); setCapturing(true); setFaceError('');
    let count = 0;
    intervalRef.current = setInterval(() => {
      const dataUrl = captureFrame();
      if (dataUrl) {
        setCaptures(prev => [...prev, { dataUrl }]);
        count++;
        setCaptureIndex(count);
        if (count >= TOTAL_CAPTURES) { clearInterval(intervalRef.current); setCapturing(false); }
      }
    }, CAPTURE_INTERVAL_MS);
  }, [cameraReady, captureFrame]);

  const retakeCapture = (index) => {
    const dataUrl = captureFrame();
    if (dataUrl) setCaptures(prev => { const u = [...prev]; u[index] = { dataUrl }; return u; });
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !parentPhone || !email) { setDetailsError('All fields are required.'); return; }
    setDetailsSubmitting(true); setDetailsError('');
    try {
      await attendanceAI.fillDetails({ phone_number: phone, parent_phone_number: parentPhone, email });
      setStep('face');
      await startCamera();
    } catch (err) {
      setDetailsError(err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally { setDetailsSubmitting(false); }
  };

  const handleFaceSubmit = async () => {
    if (captures.length < TOTAL_CAPTURES) { setFaceError('Please capture all 5 photos.'); return; }
    setFaceSubmitting(true); setFaceError('');
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const profile = JSON.parse(localStorage.getItem('profile') || '{}');
      const studentId = profile?.student_id || user?.student_id;
      const images = captures.map(c => c.dataUrl);
      const res = await attendanceAI.registerFace(studentId, images);
      if (res.data.success) {
        localStorage.setItem('face_registered', 'true');
        stopCamera();
        setStep('complete');
        onComplete();
      } else { setFaceError(res.data.message || 'Registration failed.'); }
    } catch (err) { setFaceError(err?.response?.data?.message || 'An error occurred.'); }
    finally { setFaceSubmitting(false); }
  };

  if (statusLoading || !step) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--gu-gold)]" /></div>;
  }

  // ── Complete ──
  if (step === 'complete') {
    return (
      <div className="max-w-2xl mx-auto animate-scale-in">
        <div className="bg-[var(--gu-red-card)] border border-green-500/30 rounded-2xl p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
             {/* Ref Photo */}
             <div className="shrink-0">
               <div className="relative group">
                 <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-green-500/30 shadow-2xl bg-black">
                   {status?.registered_face_photo ? (
                     <img src={status.registered_face_photo} alt="Registered Face" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center"><User className="w-16 h-16 text-white/10" /></div>
                   )}
                 </div>
                 <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-[#1a0000] shadow-xl">
                   <Shield className="w-5 h-5 text-white" />
                 </div>
               </div>
             </div>

             <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-serif text-white mb-2">Face Registered ✓</h2>
                <p className="text-white/50 text-sm mb-6">Your biometric identity is securely stored. AI attendance marking is active for all sessions.</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 border border-[var(--gu-border)] rounded-xl p-3">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Status</p>
                    <p className="text-sm font-bold text-green-400">Verified ✓</p>
                  </div>
                  <div className="bg-white/5 border border-[var(--gu-border)] rounded-xl p-3">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Samples</p>
                    <p className="text-sm font-bold text-white">{status?.face_encoding_count || 5} Photos</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={async () => { setStep('face'); setCaptures([]); await startCamera(); }}
                    className="flex-1 flex items-center justify-center gap-2 border border-[var(--gu-gold)]/40 text-[var(--gu-gold)] font-semibold py-2.5 rounded-xl hover:bg-[var(--gu-gold)]/10 transition-colors text-sm">
                    <RefreshCw className="w-4 h-4" /> Re-register Face
                  </button>
                </div>
             </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Primary Phone', value: status?.details?.phone || 'Not set', icon: Phone },
              { label: 'Parent Contact', value: status?.details?.parent_phone || 'Not set', icon: Phone },
              { label: 'Official Email', value: status?.details?.email || 'Not set', icon: Mail },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-white/40" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/30 uppercase tracking-tight">{item.label}</p>
                  <p className="text-xs font-semibold text-white truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Steps indicator ──
  const StepIndicator = () => (
    <div className="flex items-center gap-0 mb-6">
      {['Personal Details', 'Face Registration'].map((label, i) => {
        const currentIndex = step === 'details' ? 0 : 1;
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={i} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${done ? 'bg-green-900/40 text-green-400' : active ? 'bg-[var(--gu-gold)] text-[var(--gu-red-deep)]' : 'bg-white/5 text-white/30'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500 text-white' : active ? 'bg-white text-[var(--gu-red-deep)]' : 'bg-white/10 text-white/30'}`}>
                {done ? '✓' : i + 1}
              </span>
              {label}
            </div>
            {i < 1 && <ChevronRight className="w-5 h-5 text-white/20 mx-1" />}
          </div>
        );
      })}
    </div>
  );

  // ── Step 1: Details ──
  if (step === 'details') {
    return (
      <div className="max-w-lg mx-auto animate-slide-up">
        <StepIndicator />
        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[var(--gu-gold)]/10 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-[var(--gu-gold)]" /></div>
            <div><h2 className="font-serif text-xl text-white">Step 1 — Personal Details</h2><p className="text-white/40 text-sm">Needed for attendance alerts and emergency contact.</p></div>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full mb-7"><div className="h-full w-1/2 bg-[var(--gu-gold)] rounded-full" /></div>
          <form onSubmit={handleDetailsSubmit} className="space-y-5">
            {[
              { label: 'Your Phone Number', icon: Phone, value: phone, setter: setPhone, type: 'tel', placeholder: '+91 98765 43210' },
              { label: "Parents' Phone Number", icon: Phone, value: parentPhone, setter: setParentPhone, type: 'tel', placeholder: '+91 98765 43210' },
              { label: 'Email Address', icon: Mail, value: email, setter: setEmail, type: 'email', placeholder: 'your.email@example.com' },
            ].map(({ label, icon: Icon, value, setter, type, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-3 border border-[var(--gu-border)] rounded-xl text-sm text-white bg-[#3D0F0F] focus:outline-none focus:border-[var(--gu-gold)] placeholder:text-white/20" required />
                </div>
              </div>
            ))}
            {detailsError && <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg"><AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-red-300 text-sm">{detailsError}</p></div>}
            <button type="submit" disabled={detailsSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] font-bold py-3 rounded-xl hover:bg-[#e6c949] disabled:opacity-50 transition-colors">
              {detailsSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Save &amp; Continue <ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Step 2: Face Registration ──
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
      <StepIndicator />
      {/* Tips */}
      <div className="space-y-4">
        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-2xl p-6">
          <h3 className="font-serif text-lg text-white mb-4">Tips for Best Results</h3>
          <div className="space-y-3">
            {tips.map(({ icon: Icon, text, color }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: color + '20' }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-white/60 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-2xl p-4 text-center">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Live Preview</p>
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--gu-gold)]/30 bg-black mx-auto">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className={`text-xs mt-2 ${cameraReady ? 'text-green-400' : 'text-amber-400'}`}>
            {cameraReady ? '● Camera Ready' : '● Starting...'}
          </p>
        </div>
      </div>

      {/* Camera + capture */}
      <div className="space-y-4">
        <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-2xl p-6">
          <h3 className="font-serif text-lg text-white mb-4">Step 2 — Face Registration</h3>
          <div className="h-1.5 bg-white/10 rounded-full mb-4"><div className="h-full w-full bg-[var(--gu-gold)] rounded-full" /></div>
          <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-[var(--gu-border)]">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            {cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-48 border-2 border-[var(--gu-gold)]/70 rounded-full" />
                <div className="absolute top-2 left-0 right-0 text-center">
                  <span className="text-[var(--gu-gold)] text-xs bg-black/60 px-2 py-0.5 rounded-full">Position face in oval</span>
                </div>
              </div>
            )}
            {capturing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[var(--gu-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-white text-sm font-semibold">{captureIndex}/{TOTAL_CAPTURES}</p>
                </div>
              </div>
            )}
          </div>
          {captures.length > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-white/40 mb-1">
                <span>Captured</span><span>{captures.length}/{TOTAL_CAPTURES}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--gu-gold)] rounded-full transition-all" style={{ width: `${(captures.length / TOTAL_CAPTURES) * 100}%` }} />
              </div>
            </div>
          )}
          {faceError && <div className="mt-3 flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg"><AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-red-300 text-sm">{faceError}</p></div>}
          <div className="mt-4">
            {captures.length < TOTAL_CAPTURES ? (
              <button onClick={startCapture} disabled={!cameraReady || capturing}
                className="w-full flex items-center justify-center gap-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] font-bold py-3 rounded-xl disabled:opacity-50 transition-colors">
                {capturing ? <><Loader2 className="w-4 h-4 animate-spin" /> Capturing {captureIndex}/{TOTAL_CAPTURES}...</> : <><Camera className="w-4 h-4" /> Start Capture</>}
              </button>
            ) : (
              <button onClick={handleFaceSubmit} disabled={faceSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-500 disabled:opacity-50 transition-colors">
                {faceSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</> : <><Upload className="w-4 h-4" /> Register Face</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-2xl p-6">
        <h3 className="font-serif text-lg text-white mb-4">Capture Quality</h3>
        <div className="space-y-3">
          {Array.from({ length: TOTAL_CAPTURES }).map((_, i) => {
            const cap = captures[i];
            return (
              <div key={i} className={`flex items-center gap-3 p-2 rounded-xl border ${cap ? 'border-green-500/30 bg-green-900/10' : 'border-dashed border-white/10 bg-white/5'}`}>
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/5 shrink-0">
                  {cap ? <img src={cap.dataUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover scale-x-[-1]" /> :
                    <div className="w-full h-full flex items-center justify-center"><Camera className="w-5 h-5 text-white/20" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Photo {i + 1}</p>
                  {cap ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="w-3 h-3" /> Good</span>
                    : <span className="text-white/30 text-xs">Pending</span>}
                </div>
                {cap && !capturing && !faceSubmitting && (
                  <button onClick={() => retakeCapture(i)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors" title="Retake">
                    <RefreshCw className="w-3.5 h-3.5 text-white/50" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REPORT TAB (attendance report)
   ═══════════════════════════════════════════════════════════ */
function ReportTab() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overallPct, setOverallPct] = useState(0);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true); setError('');
    try {
      // Get student_id from profile
      const profileStr = localStorage.getItem('profile');
      const userStr = localStorage.getItem('user');
      const profile = profileStr ? JSON.parse(profileStr) : {};
      const user = userStr ? JSON.parse(userStr) : {};
      const studentId = profile?.student_id || user?.student_id;

      if (!studentId) { setError('Student ID not found.'); setLoading(false); return; }

      const res = await attendanceAI.getStudentReport(studentId);
      const data = res.data?.report || [];
      setReport(data);

      // Calculate overall percentage
      const totalClasses = data.reduce((sum, s) => sum + s.total_classes, 0);
      const totalPresent = data.reduce((sum, s) => sum + s.present_count, 0);
      setOverallPct(totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0);
    } catch (err) {
      // Fallback to studentAPI.attendance
      try {
        const res2 = await studentAPI.attendance();
        if (res2.data?.subject_breakdown) {
          const mapped = res2.data.subject_breakdown.map(s => ({
            subject_name: s.subject,
            subject_code: s.code || '',
            total_classes: s.total,
            present_count: s.present,
            absent_count: s.absent,
            percentage: s.percentage,
            is_below_threshold: s.percentage < 75,
          }));
          setReport(mapped);
          setOverallPct(res2.data.percentage || 0);
        }
      } catch {
        setError('Unable to load attendance report.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--gu-gold)]" /></div>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-900/30 border border-red-500/30 rounded-xl">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" /><p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  const overallColor = overallPct >= 75 ? 'text-green-400' : overallPct >= 65 ? 'text-amber-400' : 'text-red-400';
  const overallBg = overallPct >= 75 ? 'from-green-900/40 to-green-800/20 border-green-500/30' : overallPct >= 65 ? 'from-amber-900/40 to-amber-800/20 border-amber-500/30' : 'from-red-900/40 to-red-800/20 border-red-500/30';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overall Summary */}
      <div className={`bg-gradient-to-r ${overallBg} border rounded-2xl p-6 flex flex-wrap items-center gap-6`}>
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Overall Attendance</p>
          <p className={`font-serif text-6xl font-bold ${overallColor}`}>{overallPct}%</p>
          <p className={`text-sm font-semibold mt-1 ${overallPct >= 75 ? 'text-green-400' : 'text-red-400'}`}>
            {overallPct >= 75 ? '✓ Above required 75% threshold' : '✗ Below required 75% threshold'}
          </p>
        </div>
        <div className="flex-1 min-w-48">
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${overallPct >= 75 ? 'bg-green-400' : overallPct >= 65 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${overallPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-white/40 mt-1"><span>0%</span><span className="text-white/60">75% required</span><span>100%</span></div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            ['Total', report.reduce((s, r) => s + r.total_classes, 0), 'text-white'],
            ['Present', report.reduce((s, r) => s + r.present_count, 0), 'text-green-400'],
            ['Absent', report.reduce((s, r) => s + (r.absent_count || 0), 0), 'text-red-400'],
          ].map(([label, value, cls]) => (
            <div key={label}>
              <p className={`text-2xl font-bold ${cls}`}>{value}</p>
              <p className="text-white/40 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Breakdown */}
      <h2 className="font-serif text-xl text-white">Subject-wise Report</h2>

      {report.length === 0 ? (
        <div className="text-center py-16 bg-[var(--gu-red-card)] border border-[var(--gu-border)] rounded-xl">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No attendance records found yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {report.map((subj, i) => {
            const pct = subj.percentage;
            const isGood = pct >= 75;
            const isWarning = pct >= 65 && pct < 75;
            const barColor = isGood ? 'bg-green-400' : isWarning ? 'bg-amber-400' : 'bg-red-400';
            const textColor = isGood ? 'text-green-400' : isWarning ? 'text-amber-400' : 'text-red-400';
            const cardBorder = isGood ? 'border-green-500/20' : isWarning ? 'border-amber-500/20' : 'border-red-500/20';

            return (
              <div key={i} className={`bg-[var(--gu-red-card)] border ${cardBorder} rounded-xl p-5 hover:border-[var(--gu-gold)]/30 transition-all animate-slide-up`}
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-base">{subj.subject_name}</h3>
                    {subj.subject_code && <p className="text-white/40 text-xs font-mono">{subj.subject_code}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${textColor}`}>{pct}%</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isGood ? 'bg-green-900/40 text-green-300' : isWarning ? 'bg-amber-900/40 text-amber-300' : 'bg-red-900/40 text-red-300'}`}>
                        {isGood ? '✓ Safe' : isWarning ? '⚠ Low' : '✗ Critical'}
                      </span>
                    </div>
                    {isGood ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-4 text-xs text-white/40">
                  <span>Total: <span className="text-white/70 font-semibold">{subj.total_classes}</span></span>
                  <span>Present: <span className="text-green-400 font-semibold">{subj.present_count}</span></span>
                  <span>Absent: <span className="text-red-400 font-semibold">{subj.absent_count ?? (subj.total_classes - subj.present_count)}</span></span>
                  {subj.last_absent_date && <span className="ml-auto">Last absent: <span className="text-white/50">{new Date(subj.last_absent_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
