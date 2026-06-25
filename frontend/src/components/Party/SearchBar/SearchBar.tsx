import { useState, useRef, useEffect } from "react";
import type { SearchResult } from "../../../lib/types";
import { api } from "../../../lib/api";

export interface SearchBarProps {
  partyId: string;
  onAddSong: (song: SearchResult) => Promise<void>;
}

export function SearchBar({ partyId: _partyId, onAddSong }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function search(q: string) {
    if (!q.trim()) { setResults([]); setShowResults(false); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.searchSongs(q);
      setResults(res);
      setShowResults(res.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) setShowResults(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  }

  async function handleAdd(song: SearchResult) {
    setAdding(song.jamendoId);
    setError("");
    try {
      await onAddSong(song);
      setAdded((prev) => new Set(prev).add(song.jamendoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add song");
    } finally {
      setAdding(null);
    }
  }

  return (
      <div className="relative" ref={containerRef}>
        <input
          className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Search…"
          value={query}
          onChange={handleInput}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm animate-pulse">
            Searching…
          </div>
        )}
        {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
        {showResults && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 z-20 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl space-y-2 max-h-80 overflow-y-auto p-2">
          {results.map((song) => {
            const isAdded = added.has(song.jamendoId);
            return (
              <li
                key={song.jamendoId}
                className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
              >
                {song.albumImage ? (
                  <img src={song.albumImage} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-600 flex items-center justify-center text-gray-400 flex-shrink-0">♪</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{song.name}</p>
                  <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                </div>
                <button
                  onClick={() => handleAdd(song)}
                  disabled={adding === song.jamendoId || isAdded}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                    isAdded
                      ? "bg-green-700 text-green-200 cursor-default"
                      : "bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  }`}
                >
                  {adding === song.jamendoId ? "Adding…" : isAdded ? "Added ✓" : "Add"}
                </button>
              </li>
            );
          })}
          </ul>
        )}
      </div>
  );
}
