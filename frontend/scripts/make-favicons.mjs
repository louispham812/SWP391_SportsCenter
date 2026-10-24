import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="fptOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff7a00" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="24" fill="url(#fptOrangeGrad)" />
  <path d="M28 18H76L70 34H46L42 46H66L60 62H40L32 82H16L28 18Z" fill="#ffffff" />
</svg>`;

async function generate() {
  console.log('Writing public/favicon.svg...');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');

  // Also replace vite.svg if requested
  const assetsDir = path.resolve(__dirname, '../src/assets');
  if (fs.existsSync(assetsDir)) {
    fs.writeFileSync(path.join(assetsDir, 'vite.svg'), svgContent, 'utf-8');
  }

  console.log('Launching Playwright with installed Edge browser...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-48x48.png', size: 48 },
  ];

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    svg { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

  const buffers = {};
  for (const item of sizes) {
    const page = await browser.newPage({
      viewport: { width: item.size, height: item.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(html);
    const buf = await page.screenshot({ omitBackground: true });
    buffers[item.size] = buf;
    fs.writeFileSync(path.join(publicDir, item.name), buf);
    console.log(`Generated ${item.name} (${item.size}x${item.size}) - ${buf.length} bytes`);
    await page.close();
  }

  await browser.close();

  // Create standard multi-image ICO file from 16x16, 32x32, 48x48 PNGs
  console.log('Creating favicon.ico...');
  const icoSizes = [16, 32, 48];
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(icoSizes.length, 4); // Number of images

  const directoryEntries = [];
  let currentOffset = 6 + (icoSizes.length * 16);
  const imageBuffers = [];

  for (const s of icoSizes) {
    const pngBuf = buffers[s];
    imageBuffers.push(pngBuf);

    const entry = Buffer.alloc(16);
    entry.writeUInt8(s === 256 ? 0 : s, 0); // Width
    entry.writeUInt8(s === 256 ? 0 : s, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(pngBuf.length, 8); // Image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // Offset
    directoryEntries.push(entry);

    currentOffset += pngBuf.length;
  }

  const icoBuffer = Buffer.concat([header, ...directoryEntries, ...imageBuffers]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log(`Created favicon.ico (${icoBuffer.length} bytes)`);
}

generate().then(() => console.log('All favicons generated successfully!')).catch(console.error);
