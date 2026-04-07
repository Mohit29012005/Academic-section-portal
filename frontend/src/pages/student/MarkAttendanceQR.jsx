import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  QrCode, CheckCircle, XCircle, AlertCircle, Loader2,
  BookOpen, User, Clock, Shield, ChevronRight
} from 'lucide-react';
import { attendanceAI, authAPI } from '../../services/api';
import Logo from '../../components/Logo';

export default function MarkAttendanceQR() {
  const { qr_token } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('verifying'); // 'verifying'|'session_info'|'login'|'success'|'error'
  const [sessionInfo, setSessionInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState(''); // 'expired'|'invalid'|'already_marked'|'no_face'|'generic'

  // Login form
  const [enrollment, setEnrollment] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Success info
  const [successInfo, setSuccessInfo] = useState(null);

  // Face capture
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    verifySession();
    return () => stopCamera();
  }, [qr_token]);

  const verifySession = async () => {
    setPhase('verifying');
    try {
      const res = await attendanceAI.verifySession(qr_token);
      const data = res.data;
      if (data.valid) {
        setSessionInfo(data);
        setPhase('session_info');
      } else {
        setErrorMsg(data.message || 'Invalid QR code.');
        setErrorType('expired');
        setPhase('error');
      }
    } catch {
      setErrorMsg('Unable to verify session. Check your internet connection.');
      setErrorType('generic');
      setPhase('error');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraActive(true);
      }
    } catch {
      setLoginError('Camera access denied. Face verification is required.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 640; canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      // Step 1: Login
      const loginRes = await authAPI.login(enrollment, password);
      const { access, refresh, user, profile } = loginRes.data;

      if (user.role !== 'student') {
        setLoginError('Only students can mark attendance via QR.');
        return;
      }

      // Store tokens temporarily
      const prevToken = localStorage.getItem('access_token');
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('profile', JSON.stringify(profile));

      // Move to Face Check instead of direct marking
      setPhase('face_check');
      await startCamera();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Login failed.';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFaceMark = async () => {
    const frame = captureFrame();
    if (!frame) {
      setLoginError('Could not capture face. Please try again.');
      return;
    }

    setCapturing(true);
    try {
      const markRes = await attendanceAI.markAttendanceQR(qr_token, frame);
      if (markRes.data.success) {
        setSuccessInfo(markRes.data);
        setPhase('success');
        stopCamera();
      } else {
        throw new Error(markRes.data.message);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to verify face.';
      if (msg.toLowerCase().includes('face')) {
        setErrorType('no_face');
      } else if (msg.toLowerCase().includes('already')) {
        setErrorType('already_marked');
      } else {
        setErrorType('generic');
      }
      setErrorMsg(msg);
      setPhase('error');
      stopCamera();
    } finally {
      setCapturing(false);
    }
  };

  const CardWrapper = ({ children }) => (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4"
      style={{ background: 'linear-gradient(135deg, #1a0000 0%, #2d0505 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-red-800 py-5 px-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#D4AF37] rounded flex items-center justify-center">
            <QrCode className="w-5 h-5 text-[#7B0D0D]" />
          </div>
          <div>
            <p className="text-white font-serif font-semibold leading-tight">AMPICS Attendance</p>
            <p className="text-white/60 text-xs">AI-Powered QR Marking</p>
          </div>
        </div>
        <div className="p-7">{children}</div>
      </div>
    </div>
  );

  // Verifying
  if (phase === 'verifying') {
    return (
      <CardWrapper>
        <div className="text-center py-6">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--gu-red)] mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Verifying QR code...</p>
        </div>
      </CardWrapper>
    );
  }

  // Session info (Step 1)
  if (phase === 'session_info') {
    return (
      <CardWrapper>
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-green-100 border-2 border-green-300 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-7 h-7 text-green-500" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-gray-800">Session Verified</h2>
          <p className="text-gray-400 text-sm mt-1">Login to mark your attendance</p>
        </div>

        {/* Session card */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 space-y-2.5">
          {[
            [BookOpen, 'Subject', `${sessionInfo.subject_code} – ${sessionInfo.subject_name}`],
            [User, 'Faculty', sessionInfo.faculty_name],
            [Clock, 'Time', `${sessionInfo.date} · ${sessionInfo.start_time} – ${sessionInfo.end_time}`],
          ].map(([Icon, label, value]) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[rgba(185,28,28,0.08)] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-[var(--gu-red)]" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-gray-700">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <button id="btn-proceed-login" onClick={() => setPhase('login')}
          className="w-full flex items-center justify-center gap-2 bg-[var(--gu-red)] text-white font-bold py-3 rounded-xl hover:bg-[var(--gu-red-hover)] transition-colors">
          Login to Mark Attendance <ChevronRight className="w-4 h-4" />
        </button>
      </CardWrapper>
    );
  }

  // Login form (Step 2)
  if (phase === 'login') {
    return (
      <CardWrapper>
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
            <CheckCircle className="w-4 h-4" /> Verified
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <div className="flex items-center gap-1.5 text-sm text-[var(--gu-red)] font-semibold">
            <Shield className="w-4 h-4" /> Login
          </div>
        </div>

        <div className="text-center mb-5">
          <h2 className="font-serif text-xl font-semibold text-gray-800">Student Login</h2>
          <p className="text-gray-400 text-sm mt-1">Verify your identity to mark attendance</p>
        </div>

        <div className="bg-[rgba(185,28,28,0.05)] border-l-3 border-[var(--gu-red)] px-3 py-2 rounded-r-lg mb-5 text-xs text-gray-600">
          📚 <strong>{sessionInfo?.subject_name}</strong> · {sessionInfo?.date}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Student ID / Email
            </label>
            <input type="text" value={enrollment} onChange={e => setEnrollment(e.target.value)}
              placeholder="e.g. 23032432001@gnu.ac.in"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--gu-red)]"
              required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--gu-red)]"
              required />
          </div>

          {loginError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-600 text-sm">{loginError}</p>
            </div>
          )}

          <button id="btn-mark-attendance" type="submit" disabled={loginLoading}
            className="w-full flex items-center justify-center gap-2 bg-[var(--gu-red)] text-white font-bold py-3 rounded-xl hover:bg-[var(--gu-red-hover)] disabled:opacity-50 transition-colors">
            {loginLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Marking Attendance...</>
              : <>Mark My Attendance <ChevronRight className="w-4 h-4" /></>}
          </button>
        </form>
      </CardWrapper>
    );
  }

  // Face check (Step 3)
  if (phase === 'face_check') {
    return (
      <CardWrapper>
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
            <CheckCircle className="w-4 h-4" /> Verified
          </div>
          <ChevronRight className="w-4 h-4 text-green-600" />
          <div className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
            <CheckCircle className="w-4 h-4" /> Authenticated
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <div className="flex items-center gap-1.5 text-sm text-[var(--gu-red)] font-semibold">
            <Camera className="w-4 h-4" /> Face Check
          </div>
        </div>

        <div className="text-center mb-5">
          <h2 className="font-serif text-xl font-semibold text-gray-800">Final Verification</h2>
          <p className="text-gray-400 text-sm mt-1">Look into the camera to mark attendance</p>
        </div>

        <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden mb-6 border-4 border-gray-100 shadow-inner">
           <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
           <canvas ref={canvasRef} className="hidden" />
           
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-48 h-56 border-2 border-dashed border-white/50 rounded-full" />
           </div>

           {capturing && (
             <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
               <div className="text-center text-white">
                 <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                 <p className="text-sm font-semibold">Verifying Face...</p>
               </div>
             </div>
           )}
        </div>

        <div className="space-y-3">
          <button onClick={handleFaceMark} disabled={!cameraActive || capturing}
            className="w-full flex items-center justify-center gap-2 bg-[var(--gu-red)] text-white font-bold py-3.5 rounded-xl hover:bg-[var(--gu-red-hover)] disabled:opacity-50 transition-all shadow-lg">
            {capturing ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</> : <><Camera className="w-5 h-5" /> Capture & Mark Attendance</>}
          </button>
          <p className="text-[10px] text-gray-400 text-center px-4">
            By marking attendance, you confirm that you are physically present in the class. AI verification will be performed.
          </p>
        </div>
      </CardWrapper>
    );
  }
  if (phase === 'success') {
    return (
      <CardWrapper>
        <div className="text-center py-4">
          <div className="w-20 h-20 bg-green-100 border-4 border-green-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-once">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-gray-800 mb-2">Attendance Marked! ✓</h2>
          <p className="text-gray-500 text-sm mb-6">You are marked Present for this session.</p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2.5 mb-5">
            {[
              ['Student', successInfo?.student_name],
              ['Subject', successInfo?.subject],
              ['Time', successInfo?.marked_at ? new Date(successInfo.marked_at).toLocaleTimeString() : '—'],
            ].map(([k, v]) => v && (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-400">{k}</span>
                <span className="font-semibold text-gray-700">{v}</span>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/student/dashboard')}
            className="w-full bg-[var(--gu-red)] text-white font-bold py-3 rounded-xl hover:bg-[var(--gu-red-hover)] transition-colors">
            Go to Dashboard
          </button>
        </div>
      </CardWrapper>
    );
  }

  // Error
  if (phase === 'error') {
    const isAlreadyMarked = errorType === 'already_marked';
    const isFaceRequired = errorType === 'no_face';

    return (
      <CardWrapper>
        <div className="text-center py-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isAlreadyMarked ? 'bg-yellow-100 border-4 border-yellow-300' : 'bg-red-100 border-4 border-red-300'
          }`}>
            {isAlreadyMarked
              ? <CheckCircle className="w-8 h-8 text-yellow-500" />
              : <XCircle className="w-8 h-8 text-red-500" />}
          </div>

          {isAlreadyMarked ? (
            <>
              <h2 className="font-serif text-xl font-semibold text-gray-800 mb-2">Already Marked</h2>
              <p className="text-yellow-600 text-sm mb-4">{errorMsg}</p>
            </>
          ) : isFaceRequired ? (
            <>
              <h2 className="font-serif text-xl font-semibold text-gray-800 mb-2">Face Registration Required</h2>
              <p className="text-red-600 text-sm mb-4">{errorMsg}</p>
              <button onClick={() => navigate('/student/attendance-setup')}
                className="w-full bg-[var(--gu-red)] text-white font-bold py-3 rounded-xl mb-3 hover:bg-[var(--gu-red-hover)] transition-colors text-sm">
                Complete Face Registration →
              </button>
            </>
          ) : (
            <>
              <h2 className="font-serif text-xl font-semibold text-gray-800 mb-2">Unable to Mark Attendance</h2>
              <p className="text-red-600 text-sm mb-4">{errorMsg}</p>
            </>
          )}

          <button onClick={() => setPhase('session_info')}
            className="w-full border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
            Try Again
          </button>
        </div>
      </CardWrapper>
    );
  }

  return null;
}
