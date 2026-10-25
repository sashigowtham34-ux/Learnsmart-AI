import React, { useRef, useState } from "react";
import { Camera, Upload, Trash2, Check, Sparkles, User, Image as ImageIcon } from "lucide-react";
import { processImageFileToDataUrl } from "../services/api";

interface ProfilePhotoUploaderProps {
  currentAvatarUrl?: string;
  studentName: string;
  onAvatarChange: (newAvatarUrl: string) => void;
  size?: "md" | "lg" | "xl";
  showPresets?: boolean;
}

// Curated academic avatar styles
const AVATAR_PRESETS = [
  {
    id: "tech-scholar-1",
    label: "CSE Scholar",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "eng-innovator-2",
    label: "Engineer",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "science-researcher-3",
    label: "Researcher",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "coder-student-4",
    label: "Developer",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "math-analyst-5",
    label: "Analyst",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop&q=80",
  },
  {
    id: "academic-lead-6",
    label: "Scholar",
    url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=240&auto=format&fit=crop&q=80",
  },
];

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  currentAvatarUrl,
  studentName,
  onAvatarChange,
  size = "lg",
  showPresets = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  const sizeClasses = {
    md: "w-16 h-16 text-lg",
    lg: "w-24 h-24 text-2xl",
    xl: "w-28 h-28 text-3xl",
  };

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPG, PNG, WebP, GIF).");
      return;
    }

    try {
      setIsProcessing(true);
      const dataUrl = await processImageFileToDataUrl(file, 360);
      onAvatarChange(dataUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // reset input value so re-selecting the same file fires change
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAvatarChange("");
    setErrorMessage(null);
  };

  const initial = (studentName || "S").trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Photo Avatar Preview & Drop Target */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group rounded-2xl overflow-hidden cursor-pointer select-none shrink-0 border-2 transition-all ${
            dragActive
              ? "border-[#22D3EE] ring-4 ring-[#22D3EE]/20 scale-102"
              : "border-[#293449] hover:border-[#8B5CF6]/60"
          } ${sizeClasses[size]} bg-[#111A2E] shadow-sm flex items-center justify-center`}
          title="Click to upload your picture or drag and drop an image"
        >
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt={studentName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#172033] to-[#111A2E] text-white flex flex-col items-center justify-center font-bold">
              <span className="text-[#22D3EE]">{initial}</span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-[#0B1020]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1 p-1 text-center">
            <Camera className="w-4 h-4 text-[#22D3EE]" />
            <span className="leading-tight text-[#F8FAFC]">Change Photo</span>
          </div>

          {/* Processing spinner */}
          {isProcessing && (
            <div className="absolute inset-0 bg-[#0B1020]/90 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[10px] font-medium gap-1">
              <div className="w-5 h-5 border-2 border-white/30 border-t-[#22D3EE] rounded-full animate-spin" />
              <span className="text-[#22D3EE]">Optimizing...</span>
            </div>
          )}
        </div>

        {/* Action Controls & Instructions */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold cursor-pointer transition-all shadow-sm glow-purple-sm flex items-center gap-1.5 active:scale-95"
              >
                <Upload className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Upload Picture</span>
              </button>

              {showPresets && (
                <button
                  type="button"
                  onClick={() => setShowPresetPicker(!showPresetPicker)}
                  className="px-3 py-1.5 rounded-lg bg-[#111A2E] hover:bg-[#172033] text-[#22D3EE] border border-[#22D3EE]/30 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Choose Preset Avatar</span>
                </button>
              )}

              {currentAvatarUrl && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                  title="Remove uploaded picture"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-[#B6C2D2] mt-1.5 leading-tight">
              Upload your photo (JPG, PNG, WebP up to 10MB). Automatically resized and optimized for your student badge.
            </p>
          </div>

          {currentAvatarUrl && (
            <div className="inline-flex items-center gap-1.5 text-[11px] text-[#22D3EE] bg-[#111A2E] px-2 py-0.5 rounded-md font-medium border border-[#22D3EE]/30">
              <Check className="w-3 h-3 text-[#22D3EE]" />
              <span>Profile picture uploaded and ready</span>
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
          )}
        </div>
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Preset Avatars Carousel / Grid */}
      {showPresetPicker && (
        <div className="p-3 bg-[#111A2E] rounded-xl border border-[#293449] space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Select an Academic Avatar Preset</span>
            </span>
            <button
              type="button"
              onClick={() => setShowPresetPicker(false)}
              className="text-[11px] text-[#B6C2D2] hover:text-[#F8FAFC] font-medium cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {AVATAR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onAvatarChange(preset.url);
                  setShowPresetPicker(false);
                }}
                className={`p-1 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer bg-[#172033] ${
                  currentAvatarUrl === preset.url
                    ? "border-[#8B5CF6] ring-2 ring-[#8B5CF6]/40 glow-purple-sm"
                    : "border-[#293449] hover:border-[#22D3EE]/50"
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.label}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <span className="text-[10px] font-medium text-[#B6C2D2] truncate w-full text-center">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
