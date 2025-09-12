export function resolveAvatarUrl(avatarPath) {
  if (!avatarPath || typeof avatarPath !== 'string') return '';
  const isAbsolute = avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('data:');
  if (isAbsolute) return avatarPath;
  const base = 'http://localhost:8080';
  if (avatarPath.startsWith('/')) return `${base}${avatarPath}`;
  return `${base}/${avatarPath}`;
}



