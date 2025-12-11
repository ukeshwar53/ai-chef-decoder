import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RefreshCw, Check, Loader2 } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  isProcessing?: boolean;
}

/**
 * CameraCapture
 * - Manual Start / Stop camera controls
 * - Ensures the video element is mounted before starting the stream (fixes "video not mounted" errors inside tabs)
 * - Capture, Retake, Use Photo flows
 */
const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, isProcessing = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mountReady, setMountReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const startingRef = useRef(false);

  // Give the DOM a short moment to mount the video element (helps when used inside tabbed UIs)
  useEffect(() => {
    const id = setTimeout(() => setMountReady(true), 120);
    return () => clearTimeout(id);
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setError(null);
    setCapturedImage(null);

    // Ensure video element is mounted before trying to attach stream
    if (!mountReady || !videoRef.current) {
      setError("Video element not mounted yet. Try again.");
      startingRef.current = false;
      return;
    }

    try {
      stopStream();

      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const video = videoRef.current!;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;

      try {
        video.srcObject = stream;
        await video.play();
        setIsStreaming(true);
        setError(null);
      } catch (playErr) {
        // Sometimes play() is blocked by autoplay policies — still attach stream so capture can work after a gesture
        console.warn("video.play() blocked:", playErr);
        video.srcObject = stream;
        setIsStreaming(true);
        setError("Playback blocked by browser. Tap the preview or try Start Camera again.");
      }
    } catch (err: any) {
      console.error("getUserMedia error:", err);
      if (err && err.name === "NotAllowedError") {
        setError("Camera permission denied. Allow camera in browser settings.");
      } else if (err && err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Failed to access camera. Try reloading or checking permissions.");
      }
      stopStream();
      setIsStreaming(false);
    } finally {
      startingRef.current = false;
    }
  }, [mountReady, facingMode, stopStream]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);

    const data = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(data);

    // stop stream to save battery/resources
    stopStream();
  }, [stopStream]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    // small delay for safety, then restart
    setTimeout(() => startCamera(), 150);
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) onCapture(capturedImage);
  }, [capturedImage, onCapture]);

  const flipCamera = useCallback(() => {
    setFacingMode((p) => (p === "user" ? "environment" : "user"));
    // restart camera if currently streaming so facingMode applies
    if (isStreaming) {
      // stop first, then restart to apply facing mode
      stopStream();
      setTimeout(() => startCamera(), 150);
    }
  }, [isStreaming, startCamera, stopStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const hasMediaSupport = typeof navigator !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  if (!hasMediaSupport) {
    return (
      <div className="p-6 bg-card rounded-2xl border border-border text-center">
        <CameraOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Camera is not supported on this device or browser.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Initial placeholder with Start Camera */}
      {!isStreaming && !capturedImage && (
        <div className="flex flex-col items-center justify-center p-8 bg-accent/50 rounded-2xl border-2 border-dashed border-border min-h-[260px]">
          <Camera className="w-14 h-14 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center mb-4">Point your camera at your ingredients for detection</p>
          <div className="flex gap-3">
            <Button variant="hero" onClick={() => { setError(null); startCamera(); }}>
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
            <Button variant="outline" onClick={() => setError("If you denied camera earlier, enable it from site settings.")}>
              Help
            </Button>
          </div>
        </div>
      )}

      {/* Live camera preview */}
      {isStreaming && (
        <div className="relative">
          <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-2xl bg-black aspect-video object-cover" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button variant="outline" size="icon" onClick={flipCamera} className="bg-background/80 backdrop-blur-sm">
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Button variant="hero" onClick={captureFrame} className="px-6">
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>

            <Button variant="outline" onClick={stopStream} className="bg-background/80 backdrop-blur-sm">
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Camera
            </Button>
          </div>

          <div className="absolute top-4 left-4 right-4 pointer-events-none">
            <p className="text-center text-sm text-white bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
              Ensure good lighting • Center ingredients in frame
            </p>
          </div>
        </div>
      )}

      {/* Captured preview and actions */}
      {capturedImage && (
        <div className="relative">
          <img src={capturedImage} alt="Captured" className="w-full rounded-2xl aspect-video object-cover" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button variant="outline" onClick={retake} disabled={isProcessing} className="bg-background/80 backdrop-blur-sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retake
            </Button>

            <Button variant="hero" onClick={confirmCapture} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Use This Frame
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
