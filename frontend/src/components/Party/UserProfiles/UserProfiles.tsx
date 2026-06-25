import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getDefaultAvatar } from '../../../lib/dicebear';

export interface User {
  id: string;
  /** Full display name. If no avatar, first 2 characters are shown as initials. */
  name: string;
  /** Optional URL to a profile picture. */
  avatar?: string;
  /** When true, a green highlight ring is rendered around this avatar. */
  isHighlighted?: boolean;
}

export interface UserProfilesProps {
  users: User[];
  width?: number;
  height?: number;
  /** How many px each avatar overlaps the previous one. Default 14. */
  overlap?: number;
  /** Maximum pixel width of the container. Avatars that don't fit are collapsed into a +n bubble. */
  maxWidth?: number;
}

/** Palette of background colours cycled for initial-only avatars. */
const AVATAR_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

export function UserProfiles({
  users,
  width = 38,
  height = 44,
  overlap = 14,
  maxWidth,
}: UserProfilesProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveId(null);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const { visibleUsers, hiddenUsers } = useMemo(() => {
    if (!maxWidth) return { visibleUsers: users, hiddenUsers: [] as User[] };
    const padding = 8; // 4 + 4 container padding
    const step = width - overlap;
    // Total visual width for n items: width + (n-1)*step + padding
    const totalWidth = (n: number) => width + (n - 1) * step + padding;
    if (totalWidth(users.length) <= maxWidth) {
      return { visibleUsers: users, hiddenUsers: [] as User[] };
    }
    // Need: (visibleCount + 1) slots (visible avatars + overflow bubble) to fit
    // width + visibleCount*step + padding <= maxWidth
    const visibleCount = Math.max(0, Math.floor((maxWidth - padding - width) / step));
    return { visibleUsers: users.slice(0, visibleCount), hiddenUsers: users.slice(visibleCount) };
  }, [users, width, overlap, maxWidth]);

  const hasOverflow = hiddenUsers.length > 0;
  const highlightedHidden = hiddenUsers.some(u => u.isHighlighted);

  const overflowTooltip = useMemo(() => {
    if (!hasOverflow) return '';
    // Active (highlighted) user always listed first
    const highlighted = hiddenUsers.filter(u => u.isHighlighted).map(u => u.name);
    const others = hiddenUsers.filter(u => !u.isHighlighted).map(u => u.name);
    const ordered = [...highlighted, ...others];
    if (ordered.length <= 3) return ordered.join(', ');
    return `${ordered[0]}, ${ordered[1]} and ${ordered.length - 2} others`;
  }, [hiddenUsers, hasOverflow]);

  const overflowIndex = visibleUsers.length;

  return (
    <div
      ref={containerRef}
      className="flex items-center"
      style={{ paddingLeft: 4, paddingRight: 4, maxWidth }}
    >
      {visibleUsers.map((user, index) => {
        const bgColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
        const isActive = activeId === user.id;
        const isHovered = hoveredId === user.id;
        return (
          <motion.div
            key={user.id}
            className={`group flex-shrink-0 relative rounded-full box-border bg-[#cccccc] cursor-pointer ${user.isHighlighted ? 'shadow-[1px_0px_2px_1px_#22c55e]' : 'shadow-[2px_0_2px_0px_rgb(255,255,255)]'}`}
            style={{
              width: width,
              height: height,
              marginLeft: index === 0 ? 0 : -overlap,
              zIndex: isHovered || isActive ? users.length + 10 : users.length - index,
            }}
            variants={{
              initial: { opacity: 0, scale: 0.7 },
              animate: {
                opacity: 1,
                scale: 1,
                transition: { delay: index * 0.06, duration: 0.2, ease: 'easeOut' },
              },
              hover: {
                scale: 1.2,
                transition: { duration: 0.15, ease: 'easeOut' },
              },
            }}
            initial="initial"
            animate="animate"
            whileHover="hover"
            onHoverStart={() => setHoveredId(user.id)}
            onHoverEnd={() => setHoveredId(prev => (prev === user.id ? null : prev))}
            onTap={() => setActiveId(prev => (prev === user.id ? null : user.id))}
          >
            <img
              src={user.avatar ?? getDefaultAvatar(user.name)}
              alt={user.name}
              className="block rounded-full object-cover"
              style={{ width: width, height: height, background: bgColor }}
            />
            <div className={`absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 bg-black/[82%] text-white text-xs font-medium py-1 px-2 rounded-[5px] whitespace-nowrap pointer-events-none opacity-0 transition-[opacity,transform] duration-[150ms] ease-in-out z-10 group-hover:opacity-100${isActive ? ' !opacity-100' : ''}`}>{user.name}</div>
          </motion.div>
        );
      })}
      {hasOverflow && (
        <motion.div
          className={`group flex-shrink-0 relative rounded-full box-border cursor-pointer ${highlightedHidden ? 'shadow-[1px_0px_2px_1px_#22c55e]' : 'shadow-[2px_0_2px_0px_rgb(255,255,255)]'}`}
          style={{
            width,
            height,
            marginLeft: overflowIndex === 0 ? 0 : -overlap,
            zIndex: hoveredId === '__overflow__' || activeId === '__overflow__' ? users.length + 10 : users.length - overflowIndex,
          }}
          variants={{
            initial: { opacity: 0, scale: 0.7 },
            animate: {
              opacity: 1,
              scale: 1,
              transition: { delay: overflowIndex * 0.06, duration: 0.2, ease: 'easeOut' },
            },
            hover: { scale: 1.2, transition: { duration: 0.15, ease: 'easeOut' } },
          }}
          initial="initial"
          animate="animate"
          whileHover="hover"
          onHoverStart={() => setHoveredId('__overflow__')}
          onHoverEnd={() => setHoveredId(prev => (prev === '__overflow__' ? null : prev))}
          onTap={() => setActiveId(prev => (prev === '__overflow__' ? null : '__overflow__'))}
        >
          <div
            className="flex items-center justify-center rounded-full text-white font-bold font-sans leading-none tracking-[0.04em]"
            style={{
              width,
              height,
              fontSize: Math.round(height * 0.3),
              background: '#4b5563',
            }}
          >
            +{hiddenUsers.length}
          </div>
          <div className={`absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 bg-black/[82%] text-white text-xs font-medium py-1 px-2 rounded-[5px] whitespace-nowrap pointer-events-none opacity-0 transition-[opacity,transform] duration-[150ms] ease-in-out z-10 group-hover:opacity-100${activeId === '__overflow__' ? ' !opacity-100' : ''}`}>
            {overflowTooltip}
          </div>
        </motion.div>
      )}
    </div>
  );
}
