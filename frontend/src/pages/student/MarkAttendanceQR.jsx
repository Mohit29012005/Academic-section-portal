import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  QrCode, CheckCircle, XCircle, AlertCircle, Loader2, Camera,
  BookOpen, User, Clock, Shield, ChevronRight
} from 'lucide-react';
import { attendanceAI, authAPI } from '../../services/api';

export default function MarkAttendanceQR() {
  const { qr_token } = useParams();
  const navigate = useNavigate();

  const PREV_AUTH_KEY = 'qr_prev_auth_state';

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
  const [restoredAuthRole, setRestoredAuthRole] = useState('');

  // Face capture
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const manualStopRef = useRef(false);
  const autoRetryRef = useRef(false);

  const backupCurrentAuth = () => {
    const existingAccess = localStorage.getItem('access_token');
    const existingRefresh = localStorage.getItem('refresh_token');
    const existingUser = localStorage.getItem('user');
    const existingProfile = localStorage.getItem('profile');

    if (!existingAccess && !existingRefresh && !existingUser && !existingProfile) {
      return;
    }

    const payload = JSON.stringify({
      access_token: existingAccess,
      refresh_token: existingRefresh,
      user: existingUser,
      profile: existingProfile,
    });
    sessionStorage.setItem(PREV_AUTH_KEY, payload);
  };

  const restorePreviousAuth = () => {
    const raw = sessionStorage.getItem(PREV_AUTH_KEY);
    if (!raw) return '';

    try {
      const prev = JSON.parse(raw);
      const previousRole = prev?.user ? (JSON.parse(prev.user)?.role || '') : '';

      if (prev.access_token) localStorage.setItem('access_token', prev.access_token);
      else localStorage.removeItem('access_token');

      if (prev.refresh_token) localStorage.setItem('refresh_token', prev.refresh_token);
      else localStorage.removeItem('refresh_token');

      if (prev.user) localStorage.setItem('user', prev.user);
      else localStorage.removeItem('user');

      if (prev.profile) localStorage.setItem('profile', prev.profile);
      else localStorage.removeItem('profile');

      sessionStorage.removeItem(PREV_AUTH_KEY);
      setRestoredAuthRole(previousRole);
      return previousRole;
    } catch {
      sessionStorage.removeItem(PREV_AUTH_KEY);
      return '';
    }
  };

  useEffect(() => {
    verifySession();
    return () => {
      stopCamera();
      restorePreviousAuth();
    };
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

  const startCamera = async (isAutoRetry = false) => {
    if (cameraLoading) return;
    setCameraLoading(true);
    setLoginError('');
    stopCamera();
    if (!isAutoRetry) {
      autoRetryRef.current = false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setLoginError('Camera API not supported in this browser. Use latest Chrome/Edge.');
      return;
    }

    try {
      let stream = null;
      try {
        const preferredVideo = selectedCameraId
          ? { deviceId: { exact: selectedCameraId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { width: { ideal: 640 }, height: { ideal: 480 } };

        stream = await navigator.mediaDevices.getUserMedia({ video: preferredVideo, audio: false });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      const activeTrack = stream.getVideoTracks?.()[0];
      if (activeTrack) {
        const startedAt = Date.now();
        activeTrack.onended = () => {
          if (manualStopRef.current) return;
          setCameraActive(false);
          if (Date.now() - startedAt < 3000 && !autoRetryRef.current) {
            autoRetryRef.current = true;
            setLoginError('Camera disconnected quickly. Retrying with default camera...');
            setSelectedCameraId('');
            setTimeout(() => {
              startCamera(true);
            }, 250);
            return;
          }
          if (Date.now() - startedAt < 3000 && selectedCameraId) {
            setLoginError('Selected camera was unstable. Switched to default camera, tap Start Camera again.');
          } else {
            setLoginError('Camera stream ended unexpectedly. Tap Start Camera again.');
          }
        };
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraActive(Boolean(activeTrack));
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vids = devices.filter((d) => d.kind === 'videoinput');
        setCameraDevices(vids);
      } catch {
        // ignore device listing failure
      }
    } catch (err) {
      stopCamera();
      setCameraActive(false);
      const isSecureContextError = window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const errName = err?.name || '';
      if (isSecureContextError) {
        setLoginError('Camera blocked: open this page on HTTPS or localhost only.');
      } else if (errName === 'NotAllowedError' || errName === 'SecurityError') {
        setLoginError('Camera permission blocked. Allow camera in browser Site Settings and Windows Privacy settings.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setLoginError('Camera is busy in another app (Zoom/Meet/Camera). Close it and retry.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setLoginError('No camera device found. Connect webcam and retry.');
      } else if (errName === 'OverconstrainedError' || errName === 'ConstraintNotSatisfiedError') {
        setLoginError('Selected camera is unavailable. Pick another camera and retry.');
      } else {
        setLoginError(`Camera unavailable. Close other apps using camera, then tap Start Camera again. (${errName || 'UnknownError'})`);
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const loadCameraDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vids = devices.filter((d) => d.kind === 'videoinput');
      setCameraDevices(vids);
    } catch {
      // ignore
    }
  };

  const stopCamera = () => {
    manualStopRef.current = true;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setTimeout(() => {
      manualStopRef.current = false;
    }, 0);
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

      // Store previous session and switch to student auth only for QR marking flow.
      backupCurrentAuth();
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('profile', JSON.stringify(profile));

      // Move to Face Check; user starts camera manually for a stable flow.
      setPhase('face_check');
      await loadCameraDevices();
      setLoginError('Tap Start Camera to continue face verification.');
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
        restorePreviousAuth();
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

        {loginError && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{loginError}</p>
          </div>
        )}

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

           {!cameraActive && (
             <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
               <p className="text-white/90 text-sm font-semibold">Camera not started</p>
             </div>
           )}
        </div>

        <div className="space-y-3">
          {cameraDevices.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Camera Device</label>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--gu-red)] bg-white"
              >
                <option value="">Auto (Recommended)</option>
                {cameraDevices.map((d, idx) => (
                  <option key={d.deviceId || idx} value={d.deviceId}>
                    {d.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!cameraActive && (
            <button onClick={startCamera} disabled={cameraLoading}
              className="w-full flex items-center justify-center gap-2 border border-[var(--gu-red)] text-[var(--gu-red)] font-semibold py-3 rounded-xl hover:bg-[rgba(185,28,28,0.06)] transition-colors">
              {cameraLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting Camera...</> : <><Camera className="w-4 h-4" /> Start Camera</>}
            </button>
          )}
          {cameraActive && (
            <button onClick={startCamera} disabled={cameraLoading}
              className="w-full flex items-center justify-center gap-2 border border-[var(--gu-red)] text-[var(--gu-red)] font-semibold py-3 rounded-xl hover:bg-[rgba(185,28,28,0.06)] transition-colors">
              <Camera className="w-4 h-4" /> Restart Camera
            </button>
          )}
          <button onClick={loadCameraDevices}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
            Refresh Camera List
          </button>
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
    const goToPath = restoredAuthRole === 'faculty'
      ? '/faculty/ai-attendance'
      : restoredAuthRole === 'admin'
      ? '/admin/dashboard'
      : '/student/dashboard';
    const goToLabel = restoredAuthRole === 'faculty'
      ? 'Back to Faculty Dashboard'
      : restoredAuthRole === 'admin'
      ? 'Back to Admin Dashboard'
      : 'Go to Dashboard';

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

          <button onClick={() => navigate(goToPath)}
            className="w-full bg-[var(--gu-red)] text-white font-bold py-3 rounded-xl hover:bg-[var(--gu-red-hover)] transition-colors">
            {goToLabel}
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
