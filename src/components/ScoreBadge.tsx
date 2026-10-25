import React from "react";

interface ScoreBadgeProps {
  score: number;
  showRecommendation?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, showRecommendation = false }) => {
  let label = "Mastered";
  let textColor = "text-[#c084fc]";
  let bgTint = "bg-[#111A2E] border-[#8B5CF6]/40";
  let recText = "Score 85%+: Advanced synthesis & periodic review";

  if (score < 40) {
    label = "Critical Gap";
    textColor = "text-rose-400";
    bgTint = "bg-rose-950/50 border-rose-800/60";
    recText = "Score <40%: Review fundamentals & guided examples";
  } else if (score < 70) {
    label = "Needs Practice";
    textColor = "text-amber-400";
    bgTint = "bg-amber-950/50 border-amber-800/60";
    recText = "Score 40%–69%: Targeted exercises & step-by-step review";
  } else if (score < 85) {
    label = "Proficient";
    textColor = "text-[#22D3EE]";
    bgTint = "bg-[#111A2E] border-[#22D3EE]/40";
    recText = "Score 70%–84%: Intermediate practice & spaced revision";
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${bgTint} ${textColor} tracking-tight tabular-nums`}>
        <span>{score}%</span>
        <span className="opacity-40">·</span>
        <span className="font-medium">{label}</span>
      </span>
      {showRecommendation && (
        <span className="text-xs text-[#B6C2D2] hidden sm:inline">{recText}</span>
      )}
    </div>
  );
};

