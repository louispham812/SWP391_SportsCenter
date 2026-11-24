import test from 'node:test';
import assert from 'node:assert/strict';
import { getActiveMemberships, getTierBadgeStyle, membershipDaysRemaining } from './memberMemberships.js';

const now = new Date(2026, 10, 19, 23, 30);
const membership = (id, changes = {}) => ({
  membershipId: id, status: 'ACTIVE', startDate: '2026-11-01', endDate: '2026-12-01', ...changes,
});

test('keeps every effective package and excludes expired, future and unapproved packages', () => {
  const rows = [membership(1), membership(2),
    membership(3, { endDate: '2026-11-18' }),
    membership(4, { startDate: '2026-11-20' }),
    membership(5, { status: 'PENDING_APPROVAL' }),
    membership(6, { startDate: null }), membership(7, { endDate: null })];
  assert.deepEqual(getActiveMemberships(rows, now).map((row) => row.membershipId), [1, 2]);
});

test('includes packages that start or expire today', () => {
  const rows = [membership(1, { startDate: '2026-11-19' }), membership(2, { endDate: '2026-11-19' })];
  assert.equal(getActiveMemberships(rows, now).length, 2);
  assert.equal(membershipDaysRemaining('2026-11-19', now), 0);
});

test('counts calendar days consistently without parsing date-only strings as UTC instants', () => {
  assert.equal(membershipDaysRemaining('2026-11-20', now), 1);
  assert.equal(membershipDaysRemaining('2026-12-01', now), 12);
  assert.equal(membershipDaysRemaining('2026-11-18', now), 0);
});

test('resolves preset and deterministic fallback badge styles for custom tier names', () => {
  assert.match(getTierBadgeStyle('GOLD', 'light'), /amber/);
  assert.match(getTierBadgeStyle('DIAMOND', 'dark'), /sky/);
  assert.match(getTierBadgeStyle('BASIC', 'light'), /slate-200/);
  const customStyle = getTierBadgeStyle('Hạng Bạch Kim', 'light');
  assert.ok(customStyle.length > 0);
  assert.equal(customStyle, getTierBadgeStyle('Hạng Bạch Kim', 'light'));
  assert.notEqual(customStyle, getTierBadgeStyle('BASIC', 'light'));
});
