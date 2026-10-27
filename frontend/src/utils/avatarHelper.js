/**
 * Utility functions for handling user/coach avatars cleanly and securely.
 */

/**
 * Normalizes an avatar string to a valid image src URL.
 * Returns null if the avatar is null, empty, or short initials (e.g. "US", "HC", "NK").
 */
export function getAvatarImageUrl(avatar) {
  if (!avatar || typeof avatar !== 'string') return null;
  const trimmed = avatar.trim();
  if (!trimmed) return null;

  // Standard web URLs or already-formed data URIs
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // If it's a raw base64 string (longer than standard initials/tags)
  if (trimmed.length > 30) {
    return `data:image/jpeg;base64,${trimmed}`;
  }

  return null;
}

/**
 * Returns clean 2-letter uppercase initials from a full name.
 * e.g., "Nguyễn Văn A" -> "NA", "John Doe" -> "JD"
 */
export function getAvatarInitials(name, fallback = 'US') {
  if (!name || typeof name !== 'string') return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
