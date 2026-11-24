export function coachTeachesSport(coach, sportId, sportName = '') {
  if (!sportId) return true;
  if (Array.isArray(coach?.sportIds) && coach.sportIds.length > 0) {
    return coach.sportIds.some((id) => String(id) === String(sportId));
  }
  const specialty = String(coach?.specialty || '').trim().toLowerCase();
  const targetName = String(sportName || '').trim().toLowerCase();
  if (!specialty || !targetName) return false;
  const segments = specialty.split(/[,;·/|]+/).map((s) => s.trim()).filter(Boolean);
  if (segments.includes(targetName)) return true;
  const escaped = targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'u').test(specialty);
}

export function resolveCoachSportIds(coach, sports = []) {
  if (Array.isArray(coach?.sportIds) && coach.sportIds.length > 0) {
    return coach.sportIds.map((id) => String(id));
  }
  return sports
    .filter((s) => coachTeachesSport(coach, s.sportId, s.sportName || s.name))
    .map((s) => String(s.sportId));
}
