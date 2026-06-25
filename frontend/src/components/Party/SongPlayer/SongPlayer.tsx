import { useRef, useState, useEffect, useCallback } from "react";
import type { QueueItem, PlaybackState } from "../../../lib/types";
import { BangerBar } from "./BangerBar";
import { connectAudioListener, pauseAudioListener, disconnectAudioListener } from "../../../lib/audioListener";

export interface SongPlayerProps {
  currentSong: QueueItem | null;
  isHost: boolean;
  /** Playback control from host (for non-host users) */
  externalPlayback: PlaybackState | null;
  onPlaybackControl: (action: "play" | "pause" | "seek", position: number) => void;
  onRatingChange: (songId: string, value: number) => void;
  onSongEnded: () => void;
  currentRating: number;
}

export function SongPlayer({
  currentSong,
  isHost,
  externalPlayback,
  onPlaybackControl,
  onRatingChange,
  onSongEnded,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentRating: _currentRating,
}: SongPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [rating, setRating] = useState(1);
  const isSyncing = useRef(false);
  const shouldAutoPlay = useRef(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);

  // Connect Web Audio analyser whenever the song changes (for bass detection)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    connectAudioListener(audio);
    return () => pauseAudioListener(); // between songs: stop RAF, keep AudioContext alive
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  // Full teardown when the player component unmounts
  useEffect(() => {
    return () => disconnectAudioListener();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When song changes, reset and flag auto-play for host
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setRating(1);
    setNeedsUserGesture(false);
    shouldAutoPlay.current = !!(currentSong && isHost);
  }, [currentSong?.id, isHost]);

  // Apply external playback state (for non-host)
  useEffect(() => {
    if (isHost || !externalPlayback || !audioRef.current) return;
    isSyncing.current = true;
    if (Math.abs(audioRef.current.currentTime - externalPlayback.position) > 1) {
      audioRef.current.currentTime = externalPlayback.position;
    }
    if (externalPlayback.action === "play" && audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setNeedsUserGesture(false);
        setIsPlaying(true);
      }).catch(() => {
        // Browser autoplay policy blocked playback — ask user to tap
        setIsPlaying(false);
        setNeedsUserGesture(true);
      });
    } else if (externalPlayback.action === "pause" && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setTimeout(() => { isSyncing.current = false; }, 100);
  }, [externalPlayback, isHost]);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (isHost) onPlaybackControl("pause", audioRef.current.currentTime);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      if (isHost) onPlaybackControl("play", audioRef.current.currentTime);
    }
  }, [isPlaying, isHost, onPlaybackControl, currentSong]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const t = Number(e.target.value);
    audioRef.current.currentTime = t;
    setCurrentTime(t);
    if (isHost) onPlaybackControl("seek", t);
  }, [isHost, onPlaybackControl]);


  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  if (!currentSong) {
    return (
      <div className="bg-gray-800 rounded-xl p-5 flex items-center justify-center h-[220px] border border-gray-600">
        <div className="text-center text-gray-500">
          <p>{isHost ? "Add songs to the queue to start playing" : "Waiting for the host to play a song…"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 rounded-xl p-5 flex flex-col gap-3 border border-gray-600">
      {/* Song info + Controls + Rating */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Left: album art + song info */}
        <div className="flex items-center gap-3 min-w-0">
          {currentSong.albumImage ? (
            <img
              src={currentSong.albumImage}
              alt=""
              className={`w-16 h-16 rounded-lg object-cover flex-shrink-0 ${isPlaying ? "animate-pulse" : ""}`}
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center text-2xl flex-shrink-0">♪</div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-lg truncate">{currentSong.name}</p>
            <p className="text-gray-400 text-sm truncate">{currentSong.artist}</p>
            {!isHost && <p className="text-purple-400 text-xs mt-0.5">Synced to host</p>}
          </div>
        </div>
        {/* Center: controls (host only) or tap-to-play for guests blocked by autoplay */}
        {isHost ? (
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition"
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <rect x="5" y="4" width="4" height="16" rx="1" />
                  <rect x="15" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              )}
            </button>
            <button
              onClick={onSongEnded}
              className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center transition"
              title="Skip song"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <polygon points="5,4 17,12 5,20" />
                <rect x="18" y="4" width="3" height="16" rx="1" />
              </svg>
            </button>
          </div>
        ) : needsUserGesture ? (
          <button
            onClick={() => {
              if (!audioRef.current) return;
              // Seek to approximate current position accounting for time since sync
              audioRef.current.play().then(() => {
                setNeedsUserGesture(false);
                setIsPlaying(true);
              }).catch(() => {});
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition animate-pulse"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <polygon points="6,4 20,12 6,20" />
            </svg>
            Tap to hear
          </button>
        ) : <div />}
        {/* Right: BANGER rating bar */}
        <div className="flex justify-end">
          <BangerBar value={rating} onChange={(val) => { setRating(val); if (currentSong) onRatingChange(currentSong.id, val); }} />
        </div>
      </div>

      {/* Audio element */}
      <audio
        ref={audioRef}
        src={currentSong.audioUrl}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => {
          const audio = e.target as HTMLAudioElement;
          setDuration(audio.duration);
          if (isHost && shouldAutoPlay.current) {
            shouldAutoPlay.current = false;
            audio.play().catch(() => {});
            onPlaybackControl("play", 0);
          } else if (!isHost && externalPlayback) {
            audio.currentTime = externalPlayback.position;
            if (externalPlayback.action === "play") {
              audio.play().then(() => {
                setNeedsUserGesture(false);
              }).catch(() => {
                setNeedsUserGesture(true);
              });
            }
          }
        }}
        onEnded={onSongEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Progress bar */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.5}
          value={currentTime}
          onChange={handleSeek}
          disabled={!isHost}
          className="w-full accent-purple-500 disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-gray-400 font-mono">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

    </div>
  );
}
