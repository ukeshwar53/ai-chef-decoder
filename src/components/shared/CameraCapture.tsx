import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
} from "react";
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
    const [status, setStatus] = useState("Camera idle");
    const facingMode = useRef<"user" | "environment">("environment");

    const startCamera = async () => {
      try {
        setStatus("Requesting permission…");

        if (!navigator.mediaDevices?.getUserMedia) {
          toast.error("Camera not supported");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode.current },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus("Camera active");
      } catch (err: any) {
        console.error("Camera error:", err);

        if (err.name === "NotReadableError") {
          toast.error("Camera already used by another application");
        } else {
          toast.error("Failed to start camera");
        }
        setStatus("Camera error");
      }
    };

    const stopCamera = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      if (videoRef.current) videoRef.current.srcObject = null;

      setStatus("Camera stopped");
    };

    const flipCamera = async () => {
      facingMode.current =
        facingMode.current === "user" ? "environment" : "user";

      await startCamera();
    };

    const capture = () => {
      if (!videoRef.current) return;

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(videoRef.current, 0, 0);

      const base64 = canvas.toDataURL("image/jpeg", 0.9);
      onCapture(base64);
      toast.success("Captured!");
    };

    useImperativeHandle(ref, () => ({
      startCamera,
      stopCamera,
      flipCamera,
      capture,
    }));

    useEffect(() => {
      return () => stopCamera();
    }, []);

    return (
      <div className="w-full">
        <p className="text-sm text-muted-foreground mb-2">{status}</p>

        <div className="border rounded-xl p-3 bg-black min-h-[280px] flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-xl bg-black"
          />
        </div>
      </div>
    );
  }
);

export default CameraCapture;
