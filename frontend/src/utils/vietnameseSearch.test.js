import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchesAnyVietnamese,
  matchesVietnamese,
  normalizeVietnamese,
} from './vietnameseSearch.js';

test('normalizeVietnamese strips diacritics and normalizes d/D', () => {
  assert.equal(normalizeVietnamese('  Nguyễn Anh Khoa  '), 'nguyen anh khoa');
  assert.equal(normalizeVietnamese('Điểm danh ĐẶT SÂN'), 'diem danh dat san');
  assert.equal(normalizeVietnamese(null), '');
  assert.equal(normalizeVietnamese(undefined), '');
});

test('matchesVietnamese matches accented and unaccented queries', () => {
  assert.equal(matchesVietnamese('Nguyễn Anh Khoa', 'nguyen anh'), true);
  assert.equal(matchesVietnamese('Điểm danh lớp học', 'diem danh'), true);
  assert.equal(matchesVietnamese('Đặt sân cầu lông', 'dat san'), true);
  assert.equal(matchesVietnamese('Đặt sân cầu lông', ''), true);
  assert.equal(matchesVietnamese('Đặt sân cầu lông', 'tennis'), false);
});

test('matchesAnyVietnamese checks multiple fields', () => {
  assert.equal(
    matchesAnyVietnamese(['Lớp Yoga Sáng', 'HLV Trần Minh', 'Phòng Studio 1'], 'tran minh'),
    true,
  );
  assert.equal(
    matchesAnyVietnamese(['Lớp Yoga Sáng', null, 102], '102'),
    true,
  );
  assert.equal(
    matchesAnyVietnamese(['Lớp Yoga Sáng', 'HLV Trần Minh'], 'pickleball'),
    false,
  );
});
