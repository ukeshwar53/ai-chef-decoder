import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RefreshCw, Check, Loader2 } from "lucide-react";

interface Props {
  onCapture: (img: string) => void;
  isProcessing?: boolean;
}

export default function CameraCapture({ onCapture, isProcessing = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [ready, setReady] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState("");

  // 1️⃣ Wait for DOM mount  
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  // 2️⃣ Start camera  
  const startCamera = async () => {
    setError("");

    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      setStream(s);

      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch (err) {
      console.log(err);
      setError("Camera access denied or not available.");
    }
  };

  // 3️⃣ Stop camera  
  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  // 4️⃣ Capture frame  
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const img = canvas.toDataURL("image/jpeg", 0.9);
    setCaptured(img);
    stopCamera();
  };

  // 5️⃣ Confirm  
  const confirm = () => {
    if (captured) onCapture(captured);
  };

  if (!ready)
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Initializing camera…
      </div>
    );

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="p-3 bg-red-200 text-red-800 rounded-lg text-sm">{error}</div>
      )}

      {!stream && !captured && (
        <div className="p-6 border rounded-xl text-center space-y-4">
          <Camera className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Start your camera to scan ingredients</p>

          <Button onClick={startCamera} className="px-6">
            <Camera className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        </div>
      )}

      {stream && (
        <div className="relative">
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full rounded-xl bg-black"
          />

          <div className="absolute bottom-4 w-full flex justify-center gap-3">
            <Button onClick={takePhoto} className="px-6">
              <Camera className="w-4 h-4 mr-2" /> Capture
            </Button>

            <Button variant="outline" onClick={stopCamera}>
              <CameraOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {captured && (
        <div className="relative">
          <img src={captured} className="rounded-xl w-full" />

          <div className="absolute bottom-4 w-full flex justify-center gap-3">
            <Button variant="outline" onClick={() => setCaptured(null)}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retake
            </Button>

            <Button disabled={isProcessing} onClick={confirm}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" /> Use Photo
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
