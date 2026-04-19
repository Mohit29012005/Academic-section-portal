import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, CheckCircle, AlertCircle, Loader2,
  Sun, Eye, Glasses, Smile, Maximize2, RefreshCw, Upload
} from 'lucide-react';
import { attendanceAI } from '../../services/api';

const TOTAL_CAPTURES = 5;
const CAPTURE_INTERVAL_MS = 1500;

const instructions = [
  { icon: Sun, text: 'Sit in a well-lit area', color: 'text-yellow-400' },
  { icon: Eye, text: 'Look directly at the camera', color: 'text-blue-400' },
  { icon: Glasses, text: 'Remove glasses if possible', color: 'text-purple-400' },
  { icon: Smile, text: 'Keep a neutral expression', color: 'text-green-400' },
  { icon: Maximize2, text: 'Stay still during capture', color: 'text-orange-400' },
];

export default function FaceOnboarding() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [captures, setCaptures] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [captureIndex, setCaptureIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const profile = JSON.parse(localStorage.getItem('profile') || '{}');
    setStudentId(profile.student_id || user?.student_id || null);
    startCamera();
    return () => stopCamera();
  }, []);

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
    } catch (err) {
      setError('Camera access denied. Please allow camera access to continue.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
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
    setError('');
    let count = 0;
    intervalRef.current = setInterval(() => {
      const dataUrl = captureFrame();
      if (dataUrl) {
        setCaptures(prev => [...prev, { dataUrl, quality: 'Good' }]);
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
        updated[index] = { dataUrl, quality: 'Good' };
        return updated;
      });
    }
  };

  const handleSubmit = async () => {
    if (captures.length < TOTAL_CAPTURES) {
      setError('Please capture all 5 photos before submitting.');
      return;
    }
    if (!studentId) {
      setError('Student ID not found. Please log out and try again.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const images = captures.map(c => c.dataUrl);
      const res = await attendanceAI.registerFace(studentId, images);
      if (res.data.success) {
        // ✅ Set BEFORE navigating — StudentRoute guard checks this
        localStorage.setItem('face_registered', 'true');
        setSuccess(true);
        stopCamera();
        setTimeout(() => navigate('/student/dashboard', { replace: true }), 2000);
      } else {
        setError(res.data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%)' }}>
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-3xl font-serif text-white mb-2">Face Registration Complete!</h2>
          <p className="text-[#D4AF37] text-sm">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%)' }}>
      <div className="border-b border-[#7B0D0D]/50 px-8 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#D4AF37] rounded-sm flex items-center justify-center">
          <Camera className="w-5 h-5 text-[#7B0D0D]" />
        </div>
        <div>
          <h1 className="text-white font-serif text-lg">Face Onboarding</h1>
          <p className="text-[#D4AF37] text-xs uppercase tracking-wider">Required one-time setup</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Instructions */}
        <div className="space-y-6">
          <div>
            <h2 className="text-white font-serif text-xl mb-1">Setup Your Face</h2>
            <p className="text-white/50 text-sm">for AI-powered attendance</p>
          </div>
          <div className="space-y-4">
            {instructions.map(({ icon: Icon, text, color }, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-white/10 ${color}`}>
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <Icon className={`w-4 h-4 ${color} shrink-0`} />
                <span className="text-white/80 text-sm">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Live Preview</p>
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#D4AF37]/30 bg-black mx-auto">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            </div>
            <p className={`text-center text-xs mt-2 ${cameraReady ? 'text-green-400' : 'text-yellow-400'}`}>
              {cameraReady ? '● Camera Ready' : '● Initializing...'}
            </p>
          </div>
        </div>

        {/* CENTER: Camera */}
        <div className="space-y-4">
          <h2 className="text-white font-serif text-xl">Capture Photos</h2>
          <div className="relative aspect-[4/3] bg-black rounded-sm overflow-hidden border border-[#7B0D0D]/60">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            <canvas ref={canvasRef} className="hidden" />
            {cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-56 border-2 border-[#D4AF37]/60 rounded-full" />
                <div className="absolute top-3 left-0 right-0 text-center">
                  <span className="text-[#D4AF37] text-xs bg-black/60 px-3 py-1 rounded-full">
                    Position your face in the oval
                  </span>
                </div>
              </div>
            )}
            {capturing && (
              <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white font-medium">Capturing {captureIndex} of {TOTAL_CAPTURES}...</p>
                </div>
              </div>
            )}
          </div>

          {(capturing || captures.length > 0) && (
            <div>
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Progress</span>
                <span>{captures.length}/{TOTAL_CAPTURES}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
                  style={{ width: `${(captures.length / TOTAL_CAPTURES) * 100}%` }} />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {captures.length < TOTAL_CAPTURES ? (
              <button id="btn-start-capture" onClick={startCapture} disabled={!cameraReady || capturing}
                className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37] text-[#7B0D0D] font-semibold py-3 rounded-lg hover:bg-[#E8C84A] transition-colors disabled:opacity-50">
                {capturing ? <><Loader2 className="w-4 h-4 animate-spin" /> Capturing...</> : <><Camera className="w-4 h-4" /> Start Capture</>}
              </button>
            ) : (
              <button id="btn-submit-faces" onClick={handleSubmit} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</> : <><Upload className="w-4 h-4" /> Submit &amp; Register</>}
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/40 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* RIGHT: Thumbnails */}
        <div className="space-y-4">
          <h2 className="text-white font-serif text-xl">Capture Quality</h2>
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: TOTAL_CAPTURES }).map((_, i) => {
              const cap = captures[i];
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${cap ? 'border-green-500/40 bg-green-900/10' : 'border-white/10 bg-white/5'}`}>
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/50 shrink-0 border border-white/10">
                    {cap ? (
                      <img src={cap.dataUrl} alt={`Capture ${i + 1}`} className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm">Photo {i + 1}</p>
                    {cap ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="w-3 h-3" /> {cap.quality}</span>
                    ) : (
                      <span className="text-white/30 text-xs">Pending</span>
                    )}
                  </div>
                  {cap && !capturing && !submitting && (
                    <button onClick={() => retakeCapture(i)} className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors" title="Retake">
                      <RefreshCw className="w-3 h-3 text-white/60" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg">
            <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-1">Why is this required?</p>
            <p className="text-white/60 text-xs">
              Your face encodings are used exclusively for automated attendance marking. Data is stored securely on the university server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
