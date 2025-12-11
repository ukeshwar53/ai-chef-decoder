// src/components/shared/CameraCapture.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RefreshCw, Check, Loader2 } from "lucide-react";

interface Props {
  onCapture: (imageBase64: string) => void;
  isProcessing?: boolean;
  scanEndpoint?: string; // optional: for debugging direct call
}

export default function CameraCapture({ onCapture, isProcessing = false, scanEndpoint }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Utility to stop stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Start camera and wait for video metadata/canplay
  const startCamera = useCallback(async () => {
    setError(null);
    setCaptured(null);
    setStatusMsg("Requesting camera permission...");
    try {
      if (streamRef.current) stopStream();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (!videoRef.current) {
        setError("Video element not mounted yet. Try again.");
        return;
      }

      videoRef.current.srcObject = stream;

      // Wait for metadata and enough data
      await new Promise<void>((resolve, reject) => {
        const v = videoRef.current!;
        let settled = false;

        const onLoadedMeta = () => {
          // sometimes videoWidth/Height still 0 until canplay
        };
        const onCanPlay = () => {
          if (settled) return;
          settled = true;
          v.removeEventListener("loadedmetadata", onLoadedMeta);
          v.removeEventListener("canplay", onCanPlay);
          resolve();
        };
        const onError = (ev: any) => {
          if (settled) return;
          settled = true;
          v.removeEventListener("loadedmetadata", onLoadedMeta);
          v.removeEventListener("canplay", onCanPlay);
          reject(new Error("Video playback error"));
        };

        v.addEventListener("loadedmetadata", onLoadedMeta);
        v.addEventListener("canplay", onCanPlay);
        v.addEventListener("error", onError);

        // Safety timeout: if still not ready after 2s, resolve but we'll check readiness
        setTimeout(() => {
          if (!settled) {
            settled = true;
            v.removeEventListener("loadedmetadata", onLoadedMeta);
            v.removeEventListener("canplay", onCanPlay);
            resolve();
          }
        }, 2000);
      });

      // try to play
      await videoRef.current.play().catch(() => { /* ignore autoplay exceptions */ });

      // Verify dimensions
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;
      if (!vw || !vh) {
        // sometimes mobile returns 0; we still try but warn
        setStatusMsg("Camera started — but video size is 0. Try switching camera or allow camera access again.");
      } else {
        setStatusMsg(`Camera ready (${vw}×${vh})`);
      }

      setIsStreaming(true);
    } catch (err: any) {
      console.error("startCamera error:", err);
      setError(err?.message || String(err) || "Failed to access camera");
      setStatusMsg(null);
      stopStream();
    }
  }, [facing, stopStream]);

  // Toggle facing mode
  const toggleFacing = () => setFacing((f) => (f === "user" ? "environment" : "user"));

  // Capture frame, resize, and return base64 JPEG
  const captureFrame = useCallback(async (): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // If video not ready (dimensions 0), wait briefly
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      // wait small time for frames
      await new Promise((r) => setTimeout(r, 300));
    }
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    // Resize to max width (keep aspect ratio)
    const maxWidth = 1000; // pick smaller for lower payloads
    let targetW = vw;
    let targetH = vh;
    if (vw > maxWidth) {
      targetW = maxWidth;
      targetH = Math.round((vh / vw) * targetW);
    }

    canvas.width = targetW;
    canvas.height = targetH;

    // draw scaled
    ctx.drawImage(video, 0, 0, targetW, targetH);

    // compress quality 0.75
    const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
    return dataUrl;
  }, []);

  // Called when user confirms the capture
  const confirmCapture = useCallback(async () => {
    setStatusMsg("Preparing image...");
    try {
      const dataUrl = await captureFrame();
      if (!dataUrl) {
        setError("Failed to capture image");
        return;
      }
      // Optionally strip the prefix if backend expects raw base64
      // const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      setCaptured(dataUrl);
      setStatusMsg("Image captured");

      // Hand off to parent
      onCapture(dataUrl);
    } catch (err: any) {
      console.error("confirmCapture error:", err);
      setError(err?.message || String(err));
    } finally {
      // keep stream or stop depending on UX; we will stop for now to save resources
      stopStream();
    }
  }, [captureFrame, onCapture, stopStream]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      {statusMsg && (
        <div className="text-sm text-muted-foreground">{statusMsg}</div>
      )}

      {!isStreaming && !captured && (
        <div className="p-6 border rounded-xl text-center space-y-4">
          <Camera className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Start your camera to scan ingredients</p>

          <div className="flex items-center justify-center gap-3">
            <Button onClick={startCamera}>
              <Camera className="w-4 h-4 mr-2" /> Start Camera
            </Button>
            <Button variant="outline" onClick={toggleFacing}>
              Flip
            </Button>
          </div>
        </div>
      )}

      {isStreaming && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-xl bg-black aspect-video object-cover"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button onClick={confirmCapture} className="px-6">
              <Camera className="w-4 h-4 mr-2" /> Capture
            </Button>
            <Button variant="outline" onClick={() => { stopStream(); setCaptured(null); }}>
              <CameraOff className="w-4 h-4" /> Stop
            </Button>
          </div>
        </div>
      )}

      {captured && (
        <div className="relative">
          <img src={captured} alt="Captured" className="w-full rounded-xl" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button variant="outline" onClick={() => { setCaptured(null); startCamera(); }}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retake
            </Button>
            <Button onClick={() => onCapture(captured)} disabled={isProcessing}>
              <Check className="w-4 h-4 mr-2" /> Use Photo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
