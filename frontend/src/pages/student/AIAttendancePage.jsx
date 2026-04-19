import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, CheckCircle, AlertCircle, Loader2, User, Phone, Mail,
  ChevronRight, Sun, Eye, Glasses, Smile, Maximize2, RefreshCw, Upload,
  Shield, BarChart2, BookOpen, Calendar, TrendingDown, TrendingUp, Zap, ScanFace
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
      if (res.data?.profile_complete) setActiveTab('report');
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="relative animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Page Header */}
          <div className="border-b border-[var(--gu-gold)]/30 pb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-[var(--gu-gold)]/10 rounded-sm flex items-center justify-center border border-[var(--gu-gold)]/20">
                <Zap className="w-5 h-5 text-[var(--gu-gold)]" />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl text-white">AI Attendance</h1>
                <p className="text-[var(--gu-gold)]/60 text-[10px] uppercase tracking-[0.3em] font-black">
                  Biometric Setup &amp; Attendance Report
                </p>
              </div>
            </div>
          </div>

          {/* Registration status banner */}
          {!statusLoading && status && !status.profile_complete && activeTab === 'report' && (
            <div className="flex items-center gap-3 p-4 bg-amber-900/20 border border-amber-500/30 rounded-sm ">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-amber-300 text-sm font-semibold">AI Setup Incomplete</p>
                <p className="text-amber-300/60 text-xs">Complete face registration to enable AI attendance marking.</p>
              </div>
              <button onClick={() => setActiveTab('setup')} className="ml-auto text-xs font-bold text-amber-400 hover:text-[var(--gu-gold)] transition-colors whitespace-nowrap">Complete Setup →</button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-bold uppercase tracking-wider transition-all border ${
                    isActive
                      ? 'bg-[var(--gu-gold)] text-[var(--gu-red-deep)] border-[var(--gu-gold)] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                      : 'bg-white/5 text-white/50 border-white/10 hover:border-[var(--gu-gold)]/40 hover:text-white hover:bg-white/10'
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
   STEP INDICATOR COMPONENT
   ═══════════════════════════════════════════════════════════ */
function StepIndicator({ currentStep }) {
  const steps = [
    { label: 'Personal Details', icon: User },
    { label: 'Face Registration', icon: ScanFace },
  ];
  const currentIndex = currentStep === 'details' ? 0 : 1;

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2.5 px-5 py-3 rounded-sm text-sm font-bold transition-all border ${
              done 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : active 
                  ? 'bg-[var(--gu-gold)] text-[var(--gu-red-deep)] border-[var(--gu-gold)] shadow-[0_0_25px_rgba(212,175,55,0.15)]' 
                  : 'bg-white/5 text-white/30 border-white/10'
            }`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                done 
                  ? 'bg-emerald-500 text-white' 
                  : active 
                    ? 'bg-[var(--gu-red-deep)] text-[var(--gu-gold)]' 
                    : 'bg-white/10 text-white/30'
              }`}>
                {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center px-1">
                <div className={`w-8 h-0.5 rounded-full ${done ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
                <ChevronRight className={`w-4 h-4 ${done ? 'text-emerald-500/40' : 'text-white/10'}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
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

  // ── Complete State ──
  if (step === 'complete') {
    return (
      <div className="max-w-3xl mx-auto animate-scale-in">
        <div className=" rounded-sm overflow-hidden">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-emerald-900/40 via-emerald-800/20 to-transparent p-8 border-b border-emerald-500/20">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Ref Photo */}
              <div className="shrink-0">
                <div className="relative group">
                  <div className="w-36 h-36 rounded-sm overflow-hidden border-4 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] bg-black">
                    {status?.registered_face_photo ? (
                      <img src={status.registered_face_photo} alt="Registered Face" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-900/40 to-black"><User className="w-16 h-16 text-white/10" /></div>
                    )}
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-[#1a0000] shadow-xl">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-2xl font-serif text-white">Face Successfully Registered</h2>
                </div>
                <p className="text-white/40 text-sm mb-6">Your biometric identity is securely stored. AI attendance marking is now active for all sessions.</p>
                
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-white/5 border border-emerald-500/10 rounded-sm p-3 text-center">
                    <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Status</p>
                    <p className="text-sm font-bold text-emerald-400">✓ Verified</p>
                  </div>
                  <div className="bg-white/5 border border-[var(--gu-border)] rounded-sm p-3 text-center">
                    <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Samples</p>
                    <p className="text-sm font-bold text-white">{status?.face_encoding_count || 5} Photos</p>
                  </div>
                </div>

                <button onClick={async () => { setStep('face'); setCaptures([]); await startCamera(); }}
                  className="flex items-center justify-center gap-2 w-full md:w-auto border border-[var(--gu-gold)]/30 text-[var(--gu-gold)] font-bold py-2.5 px-6 rounded-sm hover:bg-[var(--gu-gold)]/10 transition-all text-sm">
                  <RefreshCw className="w-4 h-4" /> Re-register Face
                </button>
              </div>
            </div>
          </div>

          {/* Contact Details Footer */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Primary Phone', value: status?.details?.phone || 'Not set', icon: Phone },
              { label: 'Parent Contact', value: status?.details?.parent_phone || 'Not set', icon: Phone },
              { label: 'Official Email', value: status?.details?.email || 'Not set', icon: Mail },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-sm border border-[var(--gu-border)]">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-white/30" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-white/25 uppercase tracking-wider">{item.label}</p>
                  <p className="text-xs font-semibold text-white/70 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Personal Details ──
  if (step === 'details') {
    return (
      <div className="max-w-lg mx-auto animate-slide-up">
        <StepIndicator currentStep="details" />
        <div className=" rounded-sm overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[var(--gu-gold)]/10 rounded-sm flex items-center justify-center border border-[var(--gu-gold)]/20">
                <User className="w-5 h-5 text-[var(--gu-gold)]" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-white">Personal Details</h2>
                <p className="text-white/30 text-xs">Required for attendance alerts & emergency contact.</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-to-r from-[var(--gu-gold)] to-[var(--gu-gold)]/60 rounded-full" />
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-5">
              {[
                { label: 'Your Phone Number', icon: Phone, value: phone, setter: setPhone, type: 'tel', placeholder: '+91 98765 43210' },
                { label: "Parent's Phone Number", icon: Phone, value: parentPhone, setter: setParentPhone, type: 'tel', placeholder: '+91 98765 43210' },
                { label: 'Email Address', icon: Mail, value: email, setter: setEmail, type: 'email', placeholder: 'your.email@example.com' },
              ].map(({ label, icon: Icon, value, setter, type, placeholder }) => (
                <div key={label}>
                  <label className="block text-[10px] font-black text-[var(--gu-gold)]/60 uppercase tracking-[0.2em] mb-2">{label}</label>
                  <div className="relative group">
                    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[var(--gu-gold)] transition-colors" />
                    <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                      className="w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-sm text-sm text-white bg-white/5 focus:outline-none focus:border-[var(--gu-gold)]/50 focus:bg-white/[0.08] placeholder:text-white/15 transition-all" required />
                  </div>
                </div>
              ))}
              {detailsError && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/20 rounded-sm">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-red-300 text-sm">{detailsError}</p>
                </div>
              )}
              <button type="submit" disabled={detailsSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] font-bold py-3.5 rounded-sm hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] disabled:opacity-50 transition-all text-sm">
                {detailsSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Save & Continue <ChevronRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Face Registration ──
  return (
    <div className="animate-slide-up">
      <StepIndicator currentStep="face" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Camera Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className=" rounded-sm overflow-hidden">
            {/* Camera Header */}
            <div className="p-5 border-b border-[var(--gu-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--gu-gold)]/10 rounded-sm flex items-center justify-center border border-[var(--gu-gold)]/20">
                  <ScanFace className="w-5 h-5 text-[var(--gu-gold)]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-white">Face Capture</h3>
                  <p className="text-white/30 text-[10px] uppercase tracking-wider">Position your face in the frame</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                cameraReady 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${cameraReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {cameraReady ? 'Camera Ready' : 'Starting...'}
              </div>
            </div>
            
            {/* Camera Viewport */}
            <div className="relative aspect-[4/3] bg-black">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Face Guide Overlay */}
              {cameraReady && !capturing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div className="w-44 h-52 border-2 border-[var(--gu-gold)]/50 rounded-[50%] shadow-[0_0_30px_rgba(212,175,55,0.1)]" />
                    {/* Corner markers */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[var(--gu-gold)] rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[var(--gu-gold)] rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[var(--gu-gold)] rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[var(--gu-gold)] rounded-br-lg" />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="text-[var(--gu-gold)]/80 text-xs bg-black/60 px-3 py-1 rounded-full  border border-[var(--gu-gold)]/20">
                      Align your face within the oval
                    </span>
                  </div>
                </div>
              )}
              
              {/* Capturing Overlay */}
              {capturing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center ">
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-3">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                        <circle cx="40" cy="40" r="35" fill="none" stroke="#D4AF37" strokeWidth="4" 
                          strokeDasharray={`${(captureIndex / TOTAL_CAPTURES) * 220} 220`} 
                          strokeLinecap="round" className="transition-all duration-500" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[var(--gu-gold)] text-lg font-bold">{captureIndex}/{TOTAL_CAPTURES}</span>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm font-semibold">Capturing...</p>
                    <p className="text-white/30 text-xs mt-1">Hold still & look at the camera</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress & Action */}
            <div className="p-5">
              {captures.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-white/40 mb-1.5">
                    <span>Progress</span><span className="font-bold text-white/60">{captures.length}/{TOTAL_CAPTURES}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[var(--gu-gold)] to-amber-400 rounded-full transition-all duration-500" 
                      style={{ width: `${(captures.length / TOTAL_CAPTURES) * 100}%` }} />
                  </div>
                </div>
              )}
              
              {faceError && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/20 rounded-sm">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-red-300 text-sm">{faceError}</p>
                </div>
              )}
              
              {captures.length < TOTAL_CAPTURES ? (
                <button onClick={startCapture} disabled={!cameraReady || capturing}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--gu-gold)] text-[var(--gu-red-deep)] font-bold py-3.5 rounded-sm disabled:opacity-50 transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] text-sm">
                  {capturing 
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Capturing {captureIndex}/{TOTAL_CAPTURES}...</>
                    : <><Camera className="w-4 h-4" /> Start Capture</>
                  }
                </button>
              ) : (
                <button onClick={handleFaceSubmit} disabled={faceSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3.5 rounded-sm hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] text-sm">
                  {faceSubmitting 
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                    : <><Upload className="w-4 h-4" /> Register Face</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tips + Thumbnails */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Tips Card */}
          <div className=" rounded-sm p-6">
            <h3 className="font-serif text-base text-white mb-4 flex items-center gap-2">
              <Sun className="w-4 h-4 text-[var(--gu-gold)]" />
              Tips for Best Results
            </h3>
            <div className="space-y-3">
              {tips.map(({ icon: Icon, text, color }, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0 transition-all group-hover:scale-110" 
                    style={{ background: color + '15', border: `1px solid ${color}20` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-white/50 text-sm group-hover:text-white/70 transition-colors">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Captured Photos Grid */}
          <div className=" rounded-sm p-6">
            <h3 className="font-serif text-base text-white mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[var(--gu-gold)]" />
                Captured Photos
              </span>
              <span className="text-xs text-white/30">{captures.length}/{TOTAL_CAPTURES}</span>
            </h3>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: TOTAL_CAPTURES }).map((_, i) => {
                const cap = captures[i];
                return (
                  <div key={i} className={`relative aspect-square rounded-sm overflow-hidden border-2 transition-all ${
                    cap 
                      ? 'border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                      : 'border-dashed border-white/10 bg-white/[0.03]'
                  }`}>
                    {cap ? (
                      <>
                        <img src={cap.dataUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover scale-x-[-1]" />
                        <div className="absolute top-0.5 right-0.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 drop-shadow-md" />
                        </div>
                        {!capturing && !faceSubmitting && (
                          <button onClick={() => retakeCapture(i)} 
                            className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <RefreshCw className="w-4 h-4 text-white" />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/15 text-xs font-bold">{i + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Individual photo details */}
            <div className="space-y-2">
              {Array.from({ length: TOTAL_CAPTURES }).map((_, i) => {
                const cap = captures[i];
                return (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-sm transition-all ${
                    cap ? 'bg-emerald-500/5 border border-emerald-500/10' : 'border border-transparent'
                  }`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${cap ? 'bg-emerald-400' : 'bg-white/10'}`} />
                    <span className="text-xs text-white/50 flex-1">Photo {i + 1}</span>
                    {cap ? (
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Captured ✓</span>
                    ) : (
                      <span className="text-[10px] text-white/20 font-bold uppercase tracking-wider">Pending</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
      const profileStr = localStorage.getItem('profile');
      const userStr = localStorage.getItem('user');
      const profile = profileStr ? JSON.parse(profileStr) : {};
      const user = userStr ? JSON.parse(userStr) : {};
      const studentId = profile?.student_id || user?.student_id;

      if (!studentId) { setError('Student ID not found.'); setLoading(false); return; }

      const res = await attendanceAI.getStudentReport(studentId);
      const data = res.data?.report || [];
      setReport(data);

      const totalClasses = data.reduce((sum, s) => sum + s.total_classes, 0);
      const totalPresent = data.reduce((sum, s) => sum + s.present_count, 0);
      setOverallPct(totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0);
    } catch (err) {
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
      <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-500/20 rounded-sm">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" /><p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  const overallColor = overallPct >= 75 ? 'text-emerald-400' : overallPct >= 65 ? 'text-amber-400' : 'text-red-400';
  const overallBg = overallPct >= 75 ? 'from-emerald-900/30 to-emerald-800/10 border-emerald-500/20' : overallPct >= 65 ? 'from-amber-900/30 to-amber-800/10 border-amber-500/20' : 'from-red-900/30 to-red-800/10 border-red-500/20';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overall Summary */}
      <div className={`bg-gradient-to-r ${overallBg} border rounded-sm p-6 md:p-8`}>
        <div className="flex flex-wrap items-center gap-6 md:gap-10">
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Overall Attendance</p>
            <p className={`font-serif text-6xl font-bold ${overallColor}`}>{overallPct}%</p>
            <p className={`text-sm font-semibold mt-2 ${overallPct >= 75 ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
              {overallPct >= 75 ? '✓ Above required 75% threshold' : '✗ Below required 75% threshold'}
            </p>
          </div>
          <div className="flex-1 min-w-48 space-y-2">
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${overallPct >= 75 ? 'bg-emerald-400' : overallPct >= 65 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${overallPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-white/30"><span>0%</span><span className="text-white/50">75% required</span><span>100%</span></div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              ['Total', report.reduce((s, r) => s + r.total_classes, 0), 'text-white'],
              ['Present', report.reduce((s, r) => s + r.present_count, 0), 'text-emerald-400'],
              ['Absent', report.reduce((s, r) => s + (r.absent_count || 0), 0), 'text-red-400'],
            ].map(([label, value, cls]) => (
              <div key={label}>
                <p className={`text-2xl font-bold ${cls}`}>{value}</p>
                <p className="text-white/30 text-[10px] uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Breakdown */}
      <h2 className="font-serif text-xl text-white flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-[var(--gu-gold)]" />
        Subject-wise Report
      </h2>

      {report.length === 0 ? (
        <div className="text-center py-16  rounded-sm">
          <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/30">No attendance records found yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {report.map((subj, i) => {
            const pct = subj.percentage;
            const isGood = pct >= 75;
            const isWarning = pct >= 65 && pct < 75;
            const barColor = isGood ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-red-400';
            const textColor = isGood ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-red-400';
            const cardBorder = isGood ? 'border-emerald-500/10' : isWarning ? 'border-amber-500/10' : 'border-red-500/10';

            return (
              <div key={i} className={` border ${cardBorder} rounded-sm p-5 hover:border-[var(--gu-gold)]/20 transition-all animate-slide-up`}
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-base">{subj.subject_name}</h3>
                    {subj.subject_code && <p className="text-white/30 text-xs font-mono">{subj.subject_code}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${textColor}`}>{pct}%</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isGood ? 'bg-emerald-900/30 text-emerald-300' : isWarning ? 'bg-amber-900/30 text-amber-300' : 'bg-red-900/30 text-red-300'
                      }`}>
                        {isGood ? '✓ Safe' : isWarning ? '⚠ Low' : '✗ Critical'}
                      </span>
                    </div>
                    {isGood ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                  </div>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-4 text-xs text-white/30">
                  <span>Total: <span className="text-white/60 font-semibold">{subj.total_classes}</span></span>
                  <span>Present: <span className="text-emerald-400 font-semibold">{subj.present_count}</span></span>
                  <span>Absent: <span className="text-red-400 font-semibold">{subj.absent_count ?? (subj.total_classes - subj.present_count)}</span></span>
                  {subj.last_absent_date && <span className="ml-auto">Last absent: <span className="text-white/40">{new Date(subj.last_absent_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
