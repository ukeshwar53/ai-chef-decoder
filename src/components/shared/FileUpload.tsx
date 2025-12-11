import { useState, useRef } from "react";
import { Upload, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  preview?: string | null;
  onClear?: () => void;
}

export const FileUpload = ({
  onFileSelect,
  accept = "image/*",
  preview,
  onClear,
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-card animate-scale-in">
        <img
          src={preview}
          alt="Uploaded food"
          className="w-full h-64 object-cover"
        />
        {onClear && (
          <button
            onClick={onClear}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-soft"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-accent/50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
            isDragging ? "gradient-warm shadow-glow" : "bg-accent"
          )}
        >
          {isDragging ? (
            <Image className="w-8 h-8 text-primary-foreground" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">
            {isDragging ? "Drop your image here" : "Upload food image"}
          </p>
          <p className="text-sm text-muted-foreground">
            Drag & drop or click to browse
          </p>
        </div>
      </div>
    </div>
  );
};
