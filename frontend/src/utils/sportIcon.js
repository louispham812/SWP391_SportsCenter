/**
 * Maps a sport name to a Material Symbols icon name for consistent UI badges.
 */
export const getSportIcon = (sportName = '') => {
  const s = String(sportName || '').toLowerCase();
  if (s.includes('pickleball') || s.includes('tennis')) return 'sports_tennis';
  if (s.includes('bóng đá') || s.includes('football') || s.includes('soccer')) return 'sports_soccer';
  if (s.includes('cầu lông') || s.includes('badminton')) return 'sports_tennis';
  if (s.includes('bóng chuyền') || s.includes('volleyball')) return 'sports_volleyball';
  if (s.includes('bóng bàn') || s.includes('table tennis')) return 'table_restaurant';
  if (s.includes('bơi') || s.includes('swimming') || s.includes('hồ bơi')) return 'pool';
  if (s.includes('điền kinh') || s.includes('chạy') || s.includes('athletics')) return 'directions_run';
  if (s.includes('gym') || s.includes('fitness')) return 'fitness_center';
  if (s.includes('yoga') || s.includes('pilates')) return 'self_improvement';
  return 'sports';
};
