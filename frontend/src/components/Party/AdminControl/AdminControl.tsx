import { useState } from "react";
import type { Party } from "../../../lib/types";

export interface AdminControlProps {
  party: Party;
  onUpdateTime: (endsAt: string) => void;
}

export function AdminControl({ onUpdateTime }: AdminControlProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);


  function handleEndNow() {
    onUpdateTime(new Date().toISOString());
    setShowEndConfirm(false);
  }

  function handleSetExact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const minsInput = form.elements.namedItem("mins") as HTMLInputElement;
    const mins = Number(minsInput.value);
    if (mins <= 0) return;
    const newEnd = new Date(Date.now() + mins * 60 * 1000);
    onUpdateTime(newEnd.toISOString());
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 border white space-y-4">
      <h2 className="font-semibold text-white">Host Controls</h2>

      {/* Set exact */}
      <form onSubmit={handleSetExact} className="flex items-center gap-3">
        <label className="text-gray-400 text-sm whitespace-nowrap">Set duration</label>
        <input
          type="number"
          name="mins"
          min={0}
          defaultValue={5}
          className="w-20 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-center focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <span className="text-gray-400 text-sm">min</span>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition border border-gray-600"
        >
          Set
        </button>
      </form>

      {/* End party */}
      {!showEndConfirm ? (
        <button
          onClick={() => setShowEndConfirm(true)}
          className="w-full py-2 rounded-lg bg-red-900 hover:bg-red-800 text-red-300 text-sm font-semibold transition border border-red-700"
        >
          End Party Now
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={handleEndNow}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold transition"
          >
            Confirm End
          </button>
          <button
            onClick={() => setShowEndConfirm(false)}
            className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
