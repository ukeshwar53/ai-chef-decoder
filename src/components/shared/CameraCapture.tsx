// src/components/shared/CameraCapture.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RefreshCw, Check, Loader2 } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  isProcessing?: boolean;
  // maximum allowed captured image size in KB (approx). If exceeded, user will be warned.
  maxImageSizeKB?: number;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  isProcessing = false,
  maxImageSizeKB = 3000, // ~3MB default
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [attempting, setAttempting] = useState(false);

  // Helper: stop & clear stream
  const stopCamera = useCallback(() => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          try { t.stop(); } catch { /* ignore */ }
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.debug("stopCamera error", err);
    } finally {
      setIsStreaming(false);
      setStatus(null);
    }
  }, []);

  // Start camera with retry for NotReadableError
  const startCamera = useCallback(async () => {
    setError(null);
    setCapturedImage(null);
    setAttempting(true);
    setStatus("Requesting camera permission...");

    const requestStream = async () => {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      return navigator.mediaDevices.getUserMedia(constraints);
    };

    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // ensure no leftover stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        const stream = await requestStream();
        streamRef.current = stream;

        if (!videoRef.current) {
          // If video element unmounted unexpectedly
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          setError("Video element not mounted yet. Try again.");
          setAttempting(false);
          return;
        }

        // attach stream & play
        const v = videoRef.current;
        v.srcObject = stream;

        // wait briefly for canplay or timeout
        await new Promise<void>((resolve) => {
          let done = false;
          const onCan = () => {
            if (done) return;
            done = true;
            v.removeEventListener("canplay", onCan);
            resolve();
          };
          v.addEventListener("canplay", onCan);
          setTimeout(() => {
            if (!done) {
              done = true;
              v.removeEventListener("canplay", onCan);
              resolve();
            }
          }, 1200);
        });

        try {
          // attempt play (some mobile browsers require user gesture)
          // errors from play can be ignored here
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          await v.play();
        } catch (e) {
          // ignore
        }

        setIsStreaming(true);
        setStatus("Camera ready");
        setAttempting(false);
        return;
      } catch (err: any) {
        console.error("startCamera error:", err);
        const name = err?.name || "";
        const msg = String(err?.message || err);

        // If device busy -> retry after stopping tracks (OS may free it)
        if (name === "NotReadableError" || /device in use/i.test(msg)) {
          attempt += 1;
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
          if (attempt <= maxRetries) {
            setStatus(`Camera busy — retrying (${attempt}/${maxRetries})...`);
            await new Promise((r) => setTimeout(r, 700));
            continue;
          } else {
            setError(
              "Camera is currently in use by another app/tab or blocked. Close other apps (video calls, camera, screen recorder) and try again."
            );
            setStatus(null);
            setAttempting(false);
            return;
          }
        }

        // Permission denied
        if (name === "NotAllowedError") {
          setError("Camera access denied. Please allow camera permission for this site.");
        } else if (name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError(msg || "Failed to access camera. Try restarting the browser or device.");
        }

        setStatus(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        setAttempting(false);
        return;
      }
    }
  }, [facingMode]);

  // Capture frame to canvas -> base64
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Video or canvas not available for capture.");
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Canvas context not available.");
      return;
    }

    // set canvas size to video natural size
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    canvas.width = vw;
    canvas.height = vh;

    try {
      ctx.drawImage(video, 0, 0, vw, vh);
      // quality 0.8 JPEG (smaller than PNG)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      // compute approximate KB
      const base64 = dataUrl.split(",")[1] || "";
      const kb = Math.round((base64.length * (3 / 4)) / 1024);
      console.debug("Captured image size (approx KB):", kb);

      if (kb > maxImageSizeKB) {
        setError(`Captured image is too large (~${kb}KB). Try moving closer or use lower resolution.`);
        // still set captured so user can retake if desired
        setCapturedImage(dataUrl);
        // do not stop camera automatically; allow retake
        return;
      }

      setCapturedImage(dataUrl);
      // Stop camera after capture to free device
      stopCamera();
    } catch (err) {
      console.error("captureFrame error:", err);
      setError("Failed to capture image. Try again.");
    }
  }, [maxImageSizeKB, stopCamera]);

  // Retake
  const retake = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    // restart camera
    startCamera().catch((e) => {
      console.error("retake startCamera error:", e);
    });
  }, [startCamera]);

  // Confirm/Use the captured frame — call parent callback
  const confirmCapture = useCallback(() => {
    if (!capturedImage) {
      setError("No image captured.");
      return;
    }
    try {
      // Pass full dataURL to parent (wrapper will strip prefix if needed)
      onCapture(capturedImage);
    } catch (err) {
      console.error("confirmCapture error:", err);
      setError("Failed to send image. Try again.");
    }
  }, [capturedImage, onCapture]);

  // Toggle facing mode (flip camera). If streaming, restart camera to apply new facing mode.
  const toggleFacing = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    // restart stream when facing changes
    if (isStreaming) {
      // short stop then start
      stopCamera();
      setTimeout(() => {
        startCamera().catch((e) => console.error("toggleFacing startCamera error:", e));
      }, 200);
    }
  }, [isStreaming, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          try { t.stop(); } catch {}
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // If facingMode changes while not streaming, we just update state — no auto-start.
  // But if streaming we already restart in toggleFacing above.

  // Simple UI
  return (
    <div className="space-y-4">
      {/* hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* status / error */}
      {status && (
        <div className="p-2 text-sm text-muted-foreground bg-muted/10 rounded">
          {status}
        </div>
      )}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Video or placeholder */}
      {!isStreaming && !capturedImage && (
        <div className="flex flex-col items-center justify-center p-8 bg-accent/50 rounded-2xl border-2 border-dashed border-border min-h-[300px]">
          <Camera className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            Point your camera at your ingredients for detection
          </p>
          <div className="flex gap-3">
            <Button variant="hero" onClick={() => startCamera()}>
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
            <Button variant="outline" onClick={() => toggleFacing()}>
              Flip
            </Button>
          </div>
        </div>
      )}

      {/* Live streaming view */}
      {isStreaming && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-2xl bg-black aspect-video object-cover"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFacing}
              className="bg-background/80 backdrop-blur-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Button
              variant="hero"
              onClick={captureFrame}
              className="px-6"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>

            <Button
              variant="outline"
              onClick={stopCamera}
              className="bg-background/80 backdrop-blur-sm"
            >
              <CameraOff className="w-4 h-4" />
            </Button>
          </div>

          <div className="absolute top-4 left-4 right-4 pointer-events-none">
            <p className="text-center text-sm text-white bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1">
              Ensure good lighting • Center ingredients in frame
            </p>
          </div>
        </div>
      )}

      {/* Captured preview + actions */}
      {capturedImage && (
        <div className="relative">
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full rounded-2xl aspect-video object-cover"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button
              variant="outline"
              onClick={retake}
              disabled={isProcessing}
              className="bg-background/80 backdrop-blur-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button
              variant="hero"
              onClick={confirmCapture}
              disabled={isProcessing}
            >
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

      {/* If not streaming and no capture, show small control row */}
      {!isStreaming && !capturedImage && (
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => startCamera()} disabled={attempting}>
            {attempting ? "Starting..." : "Start Camera"}
          </Button>
          <Button variant="ghost" onClick={() => stopCamera()}>
            Stop Camera
          </Button>
          <div className="ml-auto text-sm text-muted-foreground">
            {isStreaming ? "Streaming" : "Camera idle"}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
