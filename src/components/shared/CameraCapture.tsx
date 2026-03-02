import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { toast } from "sonner";

export interface CameraCaptureHandle {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  flipCamera: () => Promise<void>;
  capture: () => void;
}

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  isProcessing?: boolean;
}

const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  ({ onCapture, isProcessing }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

    useImperativeHandle(ref, () => ({
      startCamera,
      stopCamera,
      flipCamera,
      capture: captureImage,
    }));

    useEffect(() => {
      return () => {
        stopCamera();
      };
    }, []);

    const startCamera = async () => {
      try {
        stopCamera();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        if (err.name === "NotAllowedError") toast.error("Camera permission denied");
        else if (err.name === "NotFoundError") toast.error("No camera found");
        else if (err.name === "NotReadableError") toast.error("Camera in use by another app");
        else toast.error("Failed to start camera");
        throw err;
      }
    };

    const stopCamera = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const flipCamera = async () => {
      const next = facingMode === "user" ? "environment" : "user";
      setFacingMode(next);
      if (streamRef.current) {
        stopCamera();
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: next },
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
        } catch {
          toast.error("Failed to flip camera");
        }
      }
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
        <div className="border rounded-xl p-4 flex flex-col items-center min-h-[300px]">
          <video
            ref={videoRef}
            className="w-full rounded-xl bg-black"
            autoPlay
            playsInline
            muted
          />
        </div>
      </div>
    );
  }
);

CameraCapture.displayName = "CameraCapture";

export default CameraCapture;
