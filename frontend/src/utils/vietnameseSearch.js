/**
 * Vietnamese accent-insensitive text normalization and search helpers.
 */

export function normalizeVietnamese(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

export function matchesVietnamese(target, query) {
  const normalizedQuery = normalizeVietnamese(query);
  if (!normalizedQuery) return true;
  return normalizeVietnamese(target).includes(normalizedQuery);
}

export function matchesAnyVietnamese(values, query) {
  const normalizedQuery = normalizeVietnamese(query);
  if (!normalizedQuery) return true;
  if (!Array.isArray(values)) return false;
  return values.some((value) => normalizeVietnamese(value).includes(normalizedQuery));
}
