import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Party, User } from "../../lib/types";
import { api } from "../../lib/api";

export function LobbyScreen() {
  const navigate = useNavigate();

  const [user] = useState<User | null>(() => {
    const stored = sessionStorage.getItem("currentUser");
    return stored ? (JSON.parse(stored) as User) : null;
  });

  const [parties, setParties] = useState<Party[]>([]);
  const [creating, setCreating] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyDuration, setNewPartyDuration] = useState(30);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    refreshParties();
  }, []);

  async function refreshParties() {
    try {
      const list = await api.listParties();
      setParties(list);
    } catch {
      // ignore network errors
    }
  }

  async function handleJoin(party: Party) {
    if (!user) return;
    setLoading(true);
    try {
      const fullParty = await api.joinParty(party.id, user.id);
      navigate(`/party/${party.id}`, { state: { party: fullParty, user } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join party");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newPartyName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const party = await api.createParty(newPartyName.trim(), newPartyDuration, user.id);
      navigate(`/party/${party.id}`, { state: { party, user } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create party");
    } finally {
      setLoading(false);
    }
  }

  function getTimeRemaining(endsAt: string) {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Nero Party</h1>
            <p className="text-gray-400 mt-1">
              Welcome, <span className="text-purple-400 font-semibold">{user.username}</span>
            </p>
          </div>
          <button
            onClick={refreshParties}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition"
          >
            Refresh
          </button>
        </div>

        {/* Create Party Button */}
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="w-full mb-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold text-lg transition"
          >
            + Create New Party
          </button>
        ) : (
          <form
            onSubmit={handleCreate}
            className="mb-6 p-6 bg-gray-800 rounded-xl space-y-4 border border-purple-500"
          >
            <h2 className="text-xl font-semibold">New Party</h2>
            <input
              className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Party name"
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-4">
              <label className="text-gray-400 text-sm whitespace-nowrap">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                max={240}
                value={newPartyDuration}
                onChange={(e) => setNewPartyDuration(Number(e.target.value))}
                className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !newPartyName.trim()}
                className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold transition disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create & Join"}
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setError(""); }}
                className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Party List */}
        <h2 className="text-xl font-semibold mb-3 text-gray-300">Active Parties</h2>
        {parties.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No parties yet. Create one!</p>
        ) : (
          <div className="space-y-3">
            {parties.map((party) => {
              const ended = new Date(party.endsAt) <= new Date();
              return (
                <div
                  key={party.id}
                  className="flex items-center justify-between p-5 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{party.name}</h3>
                    <p className="text-gray-400 text-sm">
                      Host: {party.host.username} · {party._count?.members ?? 0} members
                    </p>
                    <p className={`text-sm mt-1 font-mono ${ended ? "text-red-400" : "text-green-400"}`}>
                      {ended ? "Ended" : `⏱ ${getTimeRemaining(party.endsAt)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoin(party)}
                    disabled={loading || ended}
                    className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}
