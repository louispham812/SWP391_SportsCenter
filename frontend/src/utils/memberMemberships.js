const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function getActiveMemberships(memberships, now = new Date()) {
  const today = dateKey(now);
  return memberships.filter((membership) => membership.status === 'ACTIVE'
    && membership.startDate && membership.startDate <= today
    && membership.endDate && membership.endDate >= today);
}

export function membershipDaysRemaining(endDate, now = new Date()) {
  if (!endDate) return 0;
  const [year, month, day] = endDate.split('-').map(Number);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((Date.UTC(year, month - 1, day) - today) / 86400000));
}

const PRESET_TIER_BADGES = {
  BRONZE: {
    light: 'bg-amber-100 text-amber-900 border border-amber-300',
    dark: 'bg-amber-700/25 border-amber-500/40 text-amber-200',
  },
  SILVER: {
    light: 'bg-slate-100 text-slate-800 border border-slate-300',
    dark: 'bg-slate-400/20 border-slate-300/40 text-slate-200',
  },
  GOLD: {
    light: 'bg-amber-100 text-amber-900 border border-amber-300',
    dark: 'bg-amber-500/20 border-amber-400/50 text-amber-300',
  },
  DIAMOND: {
    light: 'bg-sky-100 text-sky-900 border border-sky-300',
    dark: 'bg-sky-500/20 border-sky-400/50 text-sky-300',
  },
  VIP: {
    light: 'bg-amber-100 text-amber-900 border border-amber-300',
    dark: 'bg-amber-500/20 border-amber-400/50 text-amber-300',
  },
  STANDARD: {
    light: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    dark: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300',
  },
};

const DEFAULT_TIER_BADGE = {
  light: 'bg-slate-200 text-slate-800 border border-slate-300',
  dark: 'bg-slate-800/90 border-slate-700 text-orange-400',
};

const CUSTOM_TIER_PALETTE = [
  {
    light: 'bg-violet-100 text-violet-900 border border-violet-300',
    dark: 'bg-violet-500/20 border-violet-400/50 text-violet-200',
  },
  {
    light: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
    dark: 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200',
  },
  {
    light: 'bg-teal-100 text-teal-900 border border-teal-300',
    dark: 'bg-teal-500/20 border-teal-400/50 text-teal-200',
  },
  {
    light: 'bg-rose-100 text-rose-900 border border-rose-300',
    dark: 'bg-rose-500/20 border-rose-400/50 text-rose-200',
  },
  {
    light: 'bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300',
    dark: 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-200',
  },
];

const TIER_ALIASES = {
  BRONZE: 'BRONZE',
  'HẠNG ĐỒNG': 'BRONZE',
  SILVER: 'SILVER',
  'HẠNG BẠC': 'SILVER',
  GOLD: 'GOLD',
  'HẠNG VÀNG': 'GOLD',
  DIAMOND: 'DIAMOND',
  'HẠNG KIM CƯƠNG': 'DIAMOND',
  VIP: 'VIP',
  'HỘI VIÊN VIP': 'VIP',
  STANDARD: 'STANDARD',
  'HỘI VIÊN STANDARD': 'STANDARD',
};

const NEUTRAL_TIERS = new Set(['', 'BASIC', 'MEMBER', 'HỘI VIÊN CHÍNH THỨC', 'HỘI VIÊN MỚI']);

export function getTierBadgeStyle(tierValue, variant = 'light') {
  const tone = variant === 'dark' ? 'dark' : 'light';
  const normalized = String(tierValue || '').trim().toUpperCase();
  if (NEUTRAL_TIERS.has(normalized)) return DEFAULT_TIER_BADGE[tone];
  const presetKey = TIER_ALIASES[normalized];
  if (presetKey && PRESET_TIER_BADGES[presetKey]) {
    return PRESET_TIER_BADGES[presetKey][tone];
  }
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return CUSTOM_TIER_PALETTE[hash % CUSTOM_TIER_PALETTE.length][tone];
}
