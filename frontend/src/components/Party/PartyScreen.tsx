import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import type { Party, QueueItem, User, Award, PlaybackState, SearchResult } from "../../lib/types";
import { api } from "../../lib/api";
import { socket, joinParty, leaveParty, emitVote, emitPlaybackControl, emitSongPlayed, emitSubmitRatings, emitUpdateTime, emitSongAdded, emitSetCurrentSong } from "../../lib/socket";
import { SearchBar } from "./SearchBar/SearchBar";
import { SongQueue } from "./SongQueue/SongQueue";
import { SongPlayer } from "./SongPlayer/SongPlayer";
import { AdminControl } from "./AdminControl/AdminControl";

interface LocationState {
  party: Party;
  user: User;
}

export function PartyScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { partyId } = useParams<{ partyId: string }>();
  const state = location.state as LocationState | null;

  const user: User | null = state?.user ?? (() => {
    const stored = sessionStorage.getItem("currentUser");
    return stored ? (JSON.parse(stored) as User) : null;
  })();

  if (!user) {
    return <Navigate to={`/login?redirect=/party/${partyId}`} replace />;
  }

  if (state?.party) {
    return <PartyScreenInner initialParty={state.party} user={user} navigate={navigate} />;
  }

  // Direct URL access — fetch and join the party
  return <PartyScreenFetcher partyId={partyId!} user={user} navigate={navigate} />;
}

function PartyScreenFetcher({
  partyId,
  user,
  navigate,
}: {
  partyId: string;
  user: User;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [party, setParty] = useState<Party | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.joinParty(partyId, user.id)
      .then(setParty)
      .catch((e: Error) => setError(e.message));
  }, [partyId, user.id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/lobby")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-gray-400">Joining party…</p>
      </div>
    );
  }

  return <PartyScreenInner initialParty={party} user={user} navigate={navigate} />;
}

function PartyScreenInner({
  initialParty,
  user,
  navigate,
}: {
  initialParty: Party;
  user: User;
  navigate: ReturnType<typeof useNavigate>;
}) {
  function onPartyEnded(awards: Award[]) {
    navigate("/results", { state: { awards, partyName: initialParty.name } });
  }

  function onLeave() {
    navigate("/lobby");
  }
  const [party, setParty] = useState<Party>(initialParty);
  const [queue, setQueue] = useState<QueueItem[]>(initialParty.queue ?? []);
  const [members, setMembers] = useState<Pick<User, "id" | "username">[]>(
    initialParty.members?.map((m) => m.user) ?? []
  );
  const [currentSongId, setCurrentSongId] = useState<string | null>(initialParty.currentSongId ?? null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [showHostControls, setShowHostControls] = useState(false);
  const [copied, setCopied] = useState(false);
  // Local rating tracker: {[songId]: [{timestamp, rating}]}
  const ratingLog = useRef<Record<string, { value: number; timestamps: Array<{ timestamp: number; rating: number }> }>>({});
  const ratingDebounce = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastPlayedRef = useRef<string | null>(null);

  const isHost = user.id === party.hostId;

  useEffect(() => {
    joinParty(party.id, user.id);

    socket.on("queue-updated", ({ queue: q }: { queue: QueueItem[] }) => {
      setQueue(q);
    });
    socket.on("members-updated", ({ members: m }: { members: Pick<User, "id" | "username">[] }) => {
      setMembers(m);
    });
    socket.on("party-updated", ({ party: p }: { party: Party }) => {
      setParty(p);
    });
    socket.on("playback-state", (state: PlaybackState & { currentSongId: string | null }) => {
      setPlaybackState(state);
      if (state.currentSongId) setCurrentSongId(state.currentSongId);
    });
    socket.on("current-song-changed", ({ currentSongId: id }: { currentSongId: string | null }) => {
      setCurrentSongId(id);
    });
    socket.on("party-ended", ({ awards }: { awards: Award[] }) => {
      onPartyEnded(awards);
    });

    return () => {
      leaveParty(party.id);
      socket.off("queue-updated");
      socket.off("members-updated");
      socket.off("party-updated");
      socket.off("playback-state");
      socket.off("current-song-changed");
      socket.off("party-ended");
    };
  }, [party.id, user.id]);

  const handleAddSong = useCallback(async (song: SearchResult) => {
    await api.addToQueue(party.id, song, user.id);
    emitSongAdded(party.id);
  }, [party.id, user.id]);

  const handleVote = useCallback((queueItemId: string) => {
    emitVote(party.id, queueItemId, user.id);
  }, [party.id, user.id]);

  const handlePlaybackControl = useCallback((action: "play" | "pause" | "seek", position: number) => {
    emitPlaybackControl(party.id, action, position, currentSongId);
  }, [party.id, currentSongId]);

  const handleSongChange = useCallback((newSongId: string | null) => {
    // Submit ratings for the previous song before switching
    if (Object.keys(ratingLog.current).length > 0) {
      emitSubmitRatings(party.id, user.id, ratingLog.current);
    }
    if (currentSongId) {
      lastPlayedRef.current = currentSongId;
      emitSongPlayed(party.id, currentSongId);
    }
    setCurrentSongId(newSongId);
    // Persist the new current song to the DB so late joiners can load it on page load
    emitSetCurrentSong(party.id, newSongId);
  }, [party.id, user.id, currentSongId]);

  const handleRatingChange = useCallback((songId: string, value: number) => {
    const now = Date.now();
    if (!ratingLog.current[songId]) {
      ratingLog.current[songId] = { value, timestamps: [] };
    }
    ratingLog.current[songId].value = value;
    ratingLog.current[songId].timestamps.push({ timestamp: now, rating: value });

    // Debounce: submit 2s after last change
    if (ratingDebounce.current[songId]) clearTimeout(ratingDebounce.current[songId]);
    ratingDebounce.current[songId] = setTimeout(() => {
      emitSubmitRatings(party.id, user.id, ratingLog.current);
    }, 2000);
  }, [party.id, user.id]);

  const handleUpdateTime = useCallback((endsAt: string) => {
    emitUpdateTime(party.id, endsAt);
  }, [party.id]);

  const currentSong = queue.find((q) => q.id === currentSongId) ?? null;
  const upNext = queue.filter((q) => !q.playedAt && q.id !== currentSongId);

  // Auto-play the first queued song when nothing is currently playing (host only)
  useEffect(() => {
    if (!isHost || currentSongId !== null) return;
    const unplayed = queue.filter((q) => !q.playedAt && q.id !== lastPlayedRef.current);
    if (unplayed.length > 0) {
      handleSongChange(unplayed[0].id);
    }
  }, [isHost, currentSongId, queue, handleSongChange]);

  function handleShare() {
    const url = `${window.location.origin}/party/${party.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden relative">
      {/* URL copied toast */}
      {copied && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg text-sm pointer-events-none">
          URL copied!
        </div>
      )}
      {/* Background album art */}
      {currentSong?.albumImage && (
        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <img
            src={currentSong.albumImage}
            alt=""
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-gray-900/60" />
        </div>
      )}

      {/* Fixed Header */}
      <div className="relative z-10 flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{party.name}</h1>
          <p className="text-gray-400 text-sm">
            {members.length} members · hosted by {party.host.username}
            {isHost && <span className="ml-2 text-purple-400 font-semibold">(you)</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PartyTimer endsAt={party.endsAt} />
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition"
          >
            Share
          </button>
          {isHost && (
            <button
              onClick={() => setShowHostControls(true)}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition"
            >
              Host Controls
            </button>
          )}
          <button
            onClick={onLeave}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Scrollable middle: search + queue */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 pb-64">
          <div className="bg-gray-800/70 rounded-xl p-4 space-y-4">
          <SearchBar partyId={party.id} onAddSong={handleAddSong} />
          <SongQueue
            queue={queue}
            currentSongId={currentSongId}
            currentUserId={user.id}
            members={members}
            isHost={isHost}
            onVote={handleVote}
            onSelectSong={isHost ? (id) => handleSongChange(id) : undefined}
          />
          </div>
        </div>
      </div>

      {/* Floating player */}
      <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto">
          <SongPlayer
            currentSong={currentSong}
            isHost={isHost}
            externalPlayback={isHost ? null : playbackState}
            onPlaybackControl={handlePlaybackControl}
            onRatingChange={handleRatingChange}
            onSongEnded={() => {
              if (upNext.length > 0) {
                handleSongChange(upNext[0].id);
              } else {
                handleSongChange(null);
              }
            }}
            currentRating={currentSong ? (ratingLog.current[currentSong.id]?.value ?? 3) : 3}
          />
        </div>
      </div>

      {/* Host Controls Modal */}
      {showHostControls && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowHostControls(false)}
        >
          <div
            className="w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminControl party={party} onUpdateTime={handleUpdateTime} />
            <button
              onClick={() => setShowHostControls(false)}
              className="mt-3 w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PartyTimer({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function update() {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Ended"); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <span className={`font-mono text-lg px-3 py-1 rounded-lg ${remaining === "Ended" ? "bg-red-900 text-red-300" : "bg-gray-700 text-green-400"}`}>
      {remaining}
    </span>
  );
}
