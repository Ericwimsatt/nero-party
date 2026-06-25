import { useEffect, useState } from "react";


interface BangerBarProps {
  value: number;
  onChange: (value: number) => void;
  onBeat?: () => void;
}

export function BangerBar({ value, onChange, onBeat }: BangerBarProps) {
  const [glowing, setGlowing] = useState(false);
  const fillPct = ((value - 1) / 4) * 100;

  useEffect(() => {
    function onBass() {
      if (value > 4) {
        setGlowing(true);
        onBeat?.();
      }
    }
    window.addEventListener("beatDetected", onBass);
    return () => window.removeEventListener("beatDetected", onBass);
  }, [value, onBeat]);

  return (
    <div className="flex-shrink-0 relative" style={{ width: 120 }}>
      {/* Beat glow — pulses outward from the bar on each beat */}
      {glowing && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            width: 150,
            height: 60,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(196,167,253,0.95) 0%, rgba(124,58,237,0.65) 45%, transparent 90%)",
            filter: "blur(6px)",
            animation: "bassGlow 600ms ease-out forwards",
          }}
          onAnimationEnd={() => setGlowing(false)}
        />
      )}

      {/* Track */}
      <div className="relative h-8 rounded-[10px] bg-gray-900 overflow-hidden" style={{ zIndex: 1 }}>
        {/* Fill — clips and reveals the text */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ backgroundColor: "#7c3aed", width: `${fillPct}%` }}
        >
          <div className="flex items-center justify-center h-full" style={{ width: 120 }}>
            <span className="font-semibold tracking-[0.06em] text-base text-white pointer-events-none select-none">
              BANGER
            </span>
          </div>
        </div>
      </div>
      {/* Drag thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-10 rounded-full shadow-md pointer-events-none"
        style={{ backgroundColor: "rgb(93, 41, 184)", left: `${fillPct}%`, boxShadow: "rgb(91, 33, 182 / 1) -5px 5px 5px", zIndex: 2 }}
      />
      {/* Invisible native input for interaction */}
      <input
        type="range"
        min={1}
        max={5}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
        style={{ zIndex: 3 }}
      />
    </div>
  );
}
