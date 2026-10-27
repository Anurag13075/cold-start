import React from "react";

interface WaveformProps {
  isRecording?: boolean;
  className?: string;
  bars?: number;
}

export function Waveform({ isRecording = false, className = "", bars = 10 }: WaveformProps) {
  const heights = [40, 75, 55, 90, 65, 80, 45, 95, 60, 50, 70, 40];

  return (
    <div className={`flex items-center gap-1 h-6 px-1 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = heights[i % heights.length];
        return (
          <span
            key={i}
            className={`w-1 rounded-full transition-all duration-200 ${
              isRecording ? "bg-blue-600 wave-bar" : "bg-blue-500/70"
            }`}
            style={{
              height: isRecording ? `${h}%` : `${Math.max(25, h * 0.65)}%`,
            }}
          />
        );
      })}
    </div>
  );
}
