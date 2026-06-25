import type { QueueItem } from "../../../lib/types";
import { UserProfiles } from "../UserProfiles/UserProfiles";
import { ToggleButton } from "../ToggleButton/ToggleButton";

export interface SongDisplayProps {
  item: QueueItem;
  position: number;
  currentUserId: string;
  onVote: (queueItemId: string) => void;
  onSelectSong?: (queueItemId: string) => void;
}

export function SongDisplay({
  item,
  position,
  currentUserId,
  onVote,
  onSelectSong,
}: SongDisplayProps) {
  const userVoted = item.votes.some((v) => v.userId === currentUserId);
  const voterUsers = item.votes.map((v) => ({
    id: v.userId,
    name: v.user.username,
    isHighlighted: v.userId === currentUserId,
  }));

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl transition bg-gray-700 hover:bg-gray-650"
    >
      {/* Position */}
      <div className="flex-shrink-0 w-8 text-center">
        <span className="text-gray-500 text-sm">{position}</span>
      </div>

      {/* Album art */}
      {item.albumImage ? (
        <img
          src={item.albumImage}
          alt=""
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded bg-gray-600 flex items-center justify-center text-gray-400 flex-shrink-0 text-lg">
          ♪
        </div>
      )}

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium truncate text-white ${
            onSelectSong ? "cursor-pointer hover:underline" : ""
          }`}
          onClick={() => onSelectSong?.(item.id)}
        >
          {item.name}
        </p>
        <p className="text-gray-400 text-sm truncate">{item.artist}</p>
      </div>

      {/* Voters — fixed width so the Hype button never shifts */}
      <div className="flex-shrink-0 w-[110px] flex items-center justify-end">
        <UserProfiles users={voterUsers} width={34} height={34} overlap={16} maxWidth={110} />
      </div>

      <div className="flex-shrink-0">
        <ToggleButton
          unpressedLabel="Hype"
          pressedLabel="Hyped"
          defaultPressed={userVoted}
          onChange={() => onVote(item.id)}
          width="120px"
          buttonColor="#7c3aed"
          shadowColor="#5b21b6"
        />
      </div>
    </div>
  );
}
