import { useEffect, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import type { Award } from "../../lib/types";

interface LocationState {
  awards: Award[];
  partyName?: string;
}

const AWARD_META: Record<string, { icon: string; color: string; border: string; label: string }> = {
  "Biggest Banger": {
    icon: "🔥",
    color: "bg-orange-900/40",
    border: "border-orange-500",
    label: "Biggest Banger",
  },
  "Most Hyped": {
    icon: "🙌",
    color: "bg-purple-900/40",
    border: "border-purple-500",
    label: "Most Hyped",
  },
  "Sleeper Hit": {
    icon: "💤",
    color: "bg-blue-900/40",
    border: "border-blue-500",
    label: "Sleeper Hit",
  },
};

// Reveal order: sleeper (index 2) → most hyped (index 1) → biggest banger (index 0)
// Delays: sleeper at 1000ms, most hyped at 2000ms, biggest banger at 4000ms
const REVEAL_DELAYS: Record<string, number> = {
  "Sleeper Hit": 1000,
  "Most Hyped": 2000,
  "Biggest Banger": 4000,
};

interface AwardCardProps {
  award: Award;
  visible: boolean;
  fromTop?: boolean;
}

function AwardCard({ award, visible, fromTop }: AwardCardProps) {
  const meta = AWARD_META[award.title] ?? { icon: "🎵", color: "bg-gray-800", border: "border-gray-700", label: award.title };

  return (
    <div
      className={`
        p-6 rounded-2xl border ${meta.color} ${meta.border}
        transition-all duration-700 ease-out
        ${visible
          ? "opacity-100 translate-y-0"
          : fromTop
            ? "opacity-0 -translate-y-32"
            : "opacity-0 translate-y-32"
        }
      `}
    >
      <div className="flex items-center gap-4">
        <div className="text-4xl flex-shrink-0">{meta.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">{meta.label}</p>
          <p className="text-xl font-bold truncate">{award.song.name}</p>
          <p className="text-gray-400 truncate">{award.song.artist}</p>
          <p className="text-sm font-semibold text-yellow-400 mt-1">{award.detail}</p>
        </div>
        {award.song.albumImage && (
          <img
            src={award.song.albumImage}
            alt=""
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        )}
      </div>
    </div>
  );
}

export function AwardsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  if (!state?.awards) {
    return <Navigate to="/lobby" replace />;
  }

  const { awards, partyName } = state;

  // Map awards by title for easy lookup
  const awardsByTitle = Object.fromEntries(awards.map((a) => [a.title, a]));

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const title of ["Sleeper Hit", "Most Hyped", "Biggest Banger"]) {
      const delay = REVEAL_DELAYS[title];
      timers.push(
        setTimeout(() => {
          setRevealed((prev) => new Set([...prev, title]));
        }, delay)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const displayOrder = ["Biggest Banger", "Most Hyped", "Sleeper Hit"] as const;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold">Party Over!</h1>
          {partyName && <p className="text-gray-400 mt-2 text-lg">{partyName}</p>}
          <p className="text-gray-500 mt-1">Here are the awards</p>
        </div>

        {/* Awards */}
        {awards.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No songs were played this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayOrder.map((title) => {
              const award = awardsByTitle[title];
              if (!award) return null;
              return (
                <AwardCard
                  key={title}
                  award={award}
                  visible={revealed.has(title)}
                  fromTop={title === "Biggest Banger"}
                />
              );
            })}
          </div>
        )}

        <div
          className={`transition-all duration-700 ease-out ${revealed.has("Biggest Banger") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <button
            onClick={() => navigate("/lobby")}
            className="w-full mt-10 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold text-lg transition"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
