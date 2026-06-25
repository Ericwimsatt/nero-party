/**
 * Returns a dicebear toon-head URL for a user who has no avatar.
 * Even-length names use CamelCase seed ("AliceJohnson"),
 * odd-length names use sentence-case seed ("Alicejohnson").
 */
export function getDefaultAvatar(name: string): string {
  const words = name.trim().split(/\s+/);
  const seed =
    name.length % 2 === 0
      ? words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
      : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replace(/\s+/g, '');
  return `https://api.dicebear.com/10.x/toon-head/svg?seed=${encodeURIComponent(seed)}`;
}
