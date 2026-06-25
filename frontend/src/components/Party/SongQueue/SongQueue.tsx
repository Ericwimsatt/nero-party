import { AnimatePresence, motion } from "framer-motion";
import type { QueueItem, User } from "../../../lib/types";
import { SongDisplay } from "../SongDisplay/SongDisplay";

export interface SongQueueProps {
  queue: QueueItem[];
  currentSongId: string | null;
  currentUserId: string;
  members: Pick<User, "id" | "username">[];
  isHost?: boolean;
  onVote: (queueItemId: string) => void;
  onSelectSong?: (queueItemId: string) => void;
}

export function SongQueue({
  queue,
  currentSongId,
  currentUserId,
  onVote,
  onSelectSong,
}: SongQueueProps) {
  const unplayed = queue.filter((q) => !q.playedAt && q.id !== currentSongId);

  return (
    <div>
      <h2 className="font-semibold text-gray-300 mb-3">Queue ({unplayed.length} songs)</h2>
      <div className="space-y-2">
        {unplayed.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">Queue is empty. Add some songs!</p>
        )}
        <AnimatePresence initial={false}>
          {unplayed.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <SongDisplay
                item={item}
                position={idx + 1}
                currentUserId={currentUserId}
                onVote={onVote}
                onSelectSong={onSelectSong}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
