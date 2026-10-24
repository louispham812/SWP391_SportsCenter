import React from 'react';

/**
 * QR Code SVG Component
 * Generates an SVG QR code pattern deterministically from the given text string.
 * Includes standard QR Finder Patterns (3 corners), Timing Patterns, Alignment, and data modules.
 */
export default function QrCodeSvg({
  text = '',
  size = 180,
  className = '',
  fgColor = '#0f172a',
  bgColor = '#ffffff',
}) {
  const N = 25; // 25x25 matrix (Version 2 standard)
  const matrix = Array.from({ length: N }, () => Array(N).fill(false));

  // 1. Finder patterns at 3 corners (Top-Left, Top-Right, Bottom-Left)
  const drawFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startY + r][startX + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(N - 7, 0);
  drawFinder(0, N - 7);

  // 2. Timing patterns on row 6 and col 6
  for (let i = 7; i < N - 7; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Alignment pattern at (18, 18)
  const alignX = 18;
  const alignY = 18;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
      const isCenter = r === 0 && c === 0;
      matrix[alignY + r][alignX + c] = isBorder || isCenter;
    }
  }

  // 4. Reserve function areas
  const isReserved = (r, c) => {
    // Top-Left Finder + separator
    if (r <= 7 && c <= 7) return true;
    // Top-Right Finder + separator
    if (r <= 7 && c >= N - 8) return true;
    // Bottom-Left Finder + separator
    if (r >= N - 8 && c <= 7) return true;
    // Timing patterns
    if (r === 6 || c === 6) return true;
    // Alignment pattern
    if (r >= alignY - 2 && r <= alignY + 2 && c >= alignX - 2 && c <= alignX + 2) return true;
    return false;
  };

  // 5. Fill remaining data modules with deterministic hash sequence from `text`
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }

  // Simple pseudo-random generator seeded by hash
  let seed = hash || 123456789;
  const nextBit = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed >> 16) % 2 === 1;
  };

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!isReserved(r, c)) {
        matrix[r][c] = nextBit();
      }
    }
  }

  // Build SVG path
  const cellSize = 10;
  const totalDimension = N * cellSize;

  const rects = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix[r][c]) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize}
            height={cellSize}
            fill={fgColor}
          />
        );
      }
    }
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${totalDimension} ${totalDimension}`}
      width={size}
      height={size}
      className={`rounded-xl shadow-xs ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <rect width="100%" height="100%" fill={bgColor} />
      {rects}
    </svg>
  );
}
