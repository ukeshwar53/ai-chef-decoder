import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  isProcessing?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState("Camera idle");

  // Mount camera automatically when component renders
  useEffect(() => {
    startCamera();

    // Cleanup camera when leaving camera tab or unmounting
    return () => {
      stopCamera();
    };
  }, []);

  const waitForVideoMount = async () => {
    return new Promise<void>((resolve) => {
      let tries = 0;
      const interval = setInterval(() => {
        if (videoRef.current) {
          clearInterval(interval);
          resolve();
        }
        if (tries++ > 10) {
          clearInterval(interval);
          toast.error("Video element failed to mount.");
        }
      }, 80);
    });
  };

  const startCamera = async () => {
    setStatus("Requesting camera permission...");
    await waitForVideoMount();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Camera not supported on this device.");
        return;
      }

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (!videoRef.current) {
        toast.error("Video element not mounted yet.");
        return;
      }

      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play();

      setStatus("Camera ready");
    } catch (err: any) {
      console.error("Camera error:", err);

      if (err.name === "NotAllowedError") toast.error("Permission denied");
      else if (err.name === "NotReadableError") toast.error("Camera in use by another app");
      else toast.error("Failed to start camera");

      setStatus("Camera error");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStatus("Camera stopped");
  };

  const captureImage = () => {
    if (!videoRef.current) {
      toast.error("Camera not ready");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg");

    onCapture(base64);
    toast.success("Image captured!");
  };

  return (
    <div className="w-full">
      <p className="text-sm text-muted-foreground mb-2">{status}</p>

      <div className="border rounded-xl p-4 flex flex-col items-center min-h-[300px]">
        <video
          ref={videoRef}
          className="w-full rounded-xl bg-black"
          autoPlay
          playsInline
          muted
        />
      </div>

      <button
        className="mt-4 w-full bg-primary text-white py-2 rounded-lg disabled:opacity-50"
        onClick={captureImage}
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Capture Image"}
      </button>
    </div>
  );
};

export default CameraCapture;
