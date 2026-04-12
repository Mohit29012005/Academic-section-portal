import { useEffect, useRef, useState } from "react";

export default function CameraTest() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let stream = null;

    const startCam = async () => {
      setStatus("requesting permission...");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        setStatus("stream obtained, attaching to video...");
        const video = videoRef.current;
        if (!video) {
          setError("videoRef is null — component not mounted yet");
          return;
        }
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play()
            .then(() => setStatus("CAMERA WORKING"))
            .catch(e => setError("play() failed: " + e.message));
        };
      } catch (err) {
        setError(`${err.name}: ${err.message}`);
        setStatus("failed");
      }
    };

    startCam();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
        Status: <strong>{status}</strong>
      </p>
      {error && (
        <p style={{ color: "red", fontSize: 13 }}>Error: {error}</p>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: 480, height: 360, background: "#000", borderRadius: 8, display: "block" }}
      />
    </div>
  );
}
