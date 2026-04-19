import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, CheckCircle, AlertCircle, Loader2, User, Phone, Mail,
  ChevronRight, Sun, Eye, Glasses, Smile, Maximize2, RefreshCw, Upload, Shield
} from 'lucide-react';
import { attendanceAI } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';

const TOTAL_CAPTURES = 5;
const CAPTURE_INTERVAL_MS = 1500;

const tips = [
  { icon: Sun, text: 'Sit in a well-lit area', color: '#F59E0B' },
  { icon: Eye, text: 'Look directly at the camera', color: '#3B82F6' },
  { icon: Glasses, text: 'Remove glasses if possible', color: '#8B5CF6' },
  { icon: Smile, text: 'Keep a neutral expression', color: '#10B981' },
  { icon: Maximize2, text: 'Stay still during capture', color: '#F97316' },
];

export default function AttendanceOnboarding() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null); // { is_details_filled, is_face_registered, profile_complete }
  const [step, setStep] = useState(null); // 'details' | 'face' | 'complete'
  const [loading, setLoading] = useState(true);

  // Step 1 state
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [email, setEmail] = useState('');
  const [detailsSubmitting, setDetailsSubmitting] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  // Step 2 state
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
    fetchStatus();
    return () => stopCamera();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await attendanceAI.getRegistrationStatus();
      const data = res.data;
      setStatus(data);
      if (data.profile_complete) {
        setStep('complete');
      } else if (!data.is_details_filled) {
        setStep('details');
      } else {
        setStep('face');
        await startCamera();
      }
    } catch {
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  // Camera helpers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCameraReady(true);
        }
      }, 300);
    } catch {
      setFaceError('Camera access denied. Please allow camera access to continue.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  const startCapture = useCallback(() => {
    if (!cameraReady) return;
    setCaptures([]);
    setCaptureIndex(0);
    setCapturing(true);
    setFaceError('');
    let count = 0;
    intervalRef.current = setInterval(() => {
      const dataUrl = captureFrame();
      if (dataUrl) {
        setCaptures(prev => [...prev, { dataUrl }]);
        count++;
        setCaptureIndex(count);
        if (count >= TOTAL_CAPTURES) {
          clearInterval(intervalRef.current);
          setCapturing(false);
        }
      }
    }, CAPTURE_INTERVAL_MS);
  }, [cameraReady, captureFrame]);

  const retakeCapture = (index) => {
    const dataUrl = captureFrame();
    if (dataUrl) {
      setCaptures(prev => {
        const updated = [...prev];
        updated[index] = { dataUrl };
        return updated;
      });
    }
  };

  // Step 1: Submit details
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !parentPhone || !email) {
      setDetailsError('All fields are required.');
      return;
    }
    setDetailsSubmitting(true);
    setDetailsError('');
    try {
      await attendanceAI.fillDetails({ phone_number: phone, parent_phone_number: parentPhone, email });
      setStep('face');
      await startCamera();
    } catch (err) {
      setDetailsError(err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setDetailsSubmitting(false);
    }
  };

  // Step 2: Submit face
  const handleFaceSubmit = async () => {
    if (captures.length < TOTAL_CAPTURES) {
      setFaceError('Please capture all 5 photos.');
      return;
    }
    setFaceSubmitting(true);
    setFaceError('');
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const student_profile = JSON.parse(localStorage.getItem('profile') || '{}');
      const studentId = student_profile?.student_id || user?.student_id;
      const images = captures.map(c => c.dataUrl);
      const res = await attendanceAI.registerFace(studentId, images);
      if (res.data.success) {
        localStorage.setItem('face_registered', 'true');
        stopCamera();
        setStep('complete');
      } else {
        setFaceError(res.data.message || 'Registration failed.');
      }
    } catch (err) {
      setFaceError(err?.response?.data?.message || 'An error occurred.');
    } finally {
      setFaceSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--gu-gold)]" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
    <div className="relative">
      <div className="fixed inset-0 z-0" style={{ backgroundImage: 'url(/maxresdefault.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.3 }} />
    <div className="animate-fade-in relative z-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-semibold text-[var(--gu-red-dark)]">AI Attendance Setup</h1>
        <p className="text-gray-500 mt-1">Complete this one-time setup to enable AI-powered attendance tracking.</p>
      </div>

      {/* Step Indicator */}
      {step !== 'complete' && (
        <div className="flex items-center gap-0">
          {['Personal Details', 'Face Registration'].map((label, i) => {
            const currentIndex = step === 'details' ? 0 : 1;
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <div key={i} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  done ? 'bg-green-100 text-green-700' :
                  active ? 'bg-[var(--gu-red)] text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    done ? 'bg-green-500 text-white' :
                    active ? 'bg-white text-[var(--gu-red)]' :
                    'bg-gray-300 text-gray-500'
                  }`}>
                    {done ? '✓' : i + 1}
                  </span>
                  {label}
                </div>
                {i < 1 && <ChevronRight className="w-5 h-5 text-gray-300 mx-1" />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Step 1: Personal Details ── */}
      {step === 'details' && (
        <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[rgba(185,28,28,0.08)] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--gu-red)]" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-[var(--gu-red-dark)]">Step 1 of 2 — Personal Details</h2>
              <p className="text-gray-400 text-sm">Needed for attendance alerts and emergency contact.</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full mb-7">
            <div className="h-full w-1/2 bg-[var(--gu-red)] rounded-full" />
          </div>

          <form onSubmit={handleDetailsSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Your Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-[var(--gu-red)] text-sm"
                  required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Parents' Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-[var(--gu-red)] text-sm"
                  required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-[var(--gu-red)] text-sm"
                  required />
              </div>
            </div>

            {detailsError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 text-sm">{detailsError}</p>
              </div>
            )}

            <button id="btn-save-details" type="submit" disabled={detailsSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[var(--gu-red)] text-white font-bold py-3 rounded-sm hover:bg-[var(--gu-red-hover)] transition-colors disabled:opacity-50">
              {detailsSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Save &amp; Continue <ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      )}

      {/* ── Step 2: Face Registration ── */}
      {step === 'face' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Tips */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
              <h3 className="font-serif text-lg font-semibold text-[var(--gu-red-dark)] mb-4">Tips for Best Results</h3>
              <div className="space-y-3">
                {tips.map(({ icon: Icon, text, color }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: color + '18' }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-gray-600 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Live preview mini */}
            <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Live Preview</p>
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--gu-red)]/30 bg-black mx-auto">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <p className={`text-xs mt-2 ${cameraReady ? 'text-green-500' : 'text-yellow-500'}`}>
                {cameraReady ? '● Camera Ready' : '● Starting...'}
              </p>
            </div>
          </div>

          {/* Center: Camera + Capture */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
              <h3 className="font-serif text-lg font-semibold text-[var(--gu-red-dark)] mb-4">
                Step 2 of 2 — Face Registration
              </h3>
              {/* Progress */}
              <div className="h-2 bg-gray-100 rounded-full mb-4">
                <div className="h-full bg-[var(--gu-red)] rounded-full transition-all duration-300"
                  style={{ width: '100%' }} />
              </div>

              <div className="relative aspect-[4/3] bg-black rounded-sm overflow-hidden border border-gray-200">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                {cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-48 border-2 border-[#D4AF37]/80 rounded-full" />
                    <div className="absolute top-2 left-0 right-0 text-center">
                      <span className="text-[#D4AF37] text-xs bg-black/60 px-2 py-0.5 rounded-full">
                        Position in oval
                      </span>
                    </div>
                  </div>
                )}
                {capturing && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-white text-sm font-semibold">{captureIndex}/{TOTAL_CAPTURES}</p>
                    </div>
                  </div>
                )}
              </div>

              {captures.length > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Captured</span><span>{captures.length}/{TOTAL_CAPTURES}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--gu-red)] rounded-full transition-all"
                      style={{ width: `${(captures.length / TOTAL_CAPTURES) * 100}%` }} />
                  </div>
                </div>
              )}

              {faceError && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-red-600 text-sm">{faceError}</p>
                </div>
              )}

              <div className="mt-4">
                {captures.length < TOTAL_CAPTURES ? (
                  <button id="btn-start-capture" onClick={startCapture} disabled={!cameraReady || capturing}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--gu-red)] text-white font-bold py-3 rounded-sm hover:bg-[var(--gu-red-hover)] disabled:opacity-50 transition-colors">
                    {capturing
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Capturing {captureIndex}/{TOTAL_CAPTURES}...</>
                      : <><Camera className="w-4 h-4" /> Start Capture</>}
                  </button>
                ) : (
                  <button id="btn-submit-face" onClick={handleFaceSubmit} disabled={faceSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-sm hover:bg-green-500 disabled:opacity-50 transition-colors">
                    {faceSubmitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                      : <><Upload className="w-4 h-4" /> Register Face</>}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Photo thumbnails */}
          <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
            <h3 className="font-serif text-lg font-semibold text-[var(--gu-red-dark)] mb-4">Capture Quality</h3>
            <div className="space-y-3">
              {Array.from({ length: TOTAL_CAPTURES }).map((_, i) => {
                const cap = captures[i];
                return (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-sm border ${
                    cap ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-200 bg-gray-50'
                  }`}>
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                      {cap ? (
                        <img src={cap.dataUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover scale-x-[-1]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">Photo {i + 1}</p>
                      {cap
                        ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="w-3 h-3" /> Good</span>
                        : <span className="text-gray-400 text-xs">Pending</span>
                      }
                    </div>
                    {cap && !capturing && !faceSubmitting && (
                      <button onClick={() => retakeCapture(i)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="Retake">
                        <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Complete State ── */}
      {step === 'complete' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white border border-gray-200 rounded-sm p-10 shadow-sm text-center">
            <div className="w-24 h-24 bg-green-100 border-4 border-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-serif font-semibold text-gray-800 mb-2">Face Verified ✓</h2>
            <p className="text-gray-500 mb-6">Your face is registered for AI-powered attendance. You are all set!</p>
            <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="text-green-600 font-semibold">Active ✓</span>
              </div>
              {status?.face_registered_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Registered On</span>
                  <span className="text-gray-700 font-medium">
                    {new Date(status.face_registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Face Samples</span>
                <span className="text-gray-700 font-medium">{status?.face_encoding_count || 5} photos</span>
              </div>
            </div>
            <button id="btn-reregister" onClick={async () => { setStep('face'); setCaptures([]); await startCamera(); }}
              className="w-full border border-[var(--gu-red)] text-[var(--gu-red)] font-semibold py-2.5 rounded-sm hover:bg-[rgba(185,28,28,0.05)] transition-colors text-sm">
              Re-register Face
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
    </StudentLayout>
  );
}
