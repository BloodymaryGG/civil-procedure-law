// Generate PWA icons from SVG using sharp
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const sizes = [192, 512];
const svgPath = path.join(__dirname, "..", "public", "favicon.svg");
const outDir = path.join(__dirname, "..", "public");

// Try sharp first
try {
  const sharp = require("sharp");
  const svg = fs.readFileSync(svgPath);
  sizes.forEach((s) => {
    sharp(svg)
      .resize(s, s)
      .png()
      .toFile(path.join(outDir, `pwa-${s}.png`))
      .then(() => console.log(`Generated pwa-${s}.png`));
  });
} catch {
  // Fallback: create minimal valid PNG files
  console.log("Sharp not available, creating placeholder PNGs...");
  sizes.forEach((s) => {
    const buf = createMinimalPng(s, s);
    fs.writeFileSync(path.join(outDir, `pwa-${s}.png`), buf);
    console.log(`Created placeholder pwa-${s}.png`);
  });
}

function createMinimalPng(w, h) {
  // Create a minimal valid PNG with RGB pixel data
  // This creates a solid navy blue PNG
  const zlib = require("zlib");

  const width = w;
  const height = h;

  // Create raw pixel data (RGBA)
  const rawData = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    rawData[off] = 0x0f;     // R
    rawData[off + 1] = 0x1b; // G
    rawData[off + 2] = 0x3d; // B
    rawData[off + 3] = 0xff; // A
  }

  // Add gold circle in center
  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.3;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        const off = (y * width + x) * 4;
        rawData[off] = 0xc9;
        rawData[off + 1] = 0xa8;
        rawData[off + 2] = 0x4c;
        rawData[off + 3] = 0xff;
      }
    }
  }

  // Build PNG with proper chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const compressed = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, "ascii");
    const crcData = Buffer.concat([typeB, data]);
    const crc = crc32(crcData);
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeB, data, crcB]);
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const iend = makeChunk("IEND", Buffer.alloc(0));
  const filterData = Buffer.concat(
    Array.from({ length: height }, (_, y) => Buffer.concat([Buffer.from([0]), rawData.slice(y * width * 4, (y + 1) * width * 4)]))
  );
  const compressedFiltered = zlib.deflateSync(filterData);
  const idat = makeChunk("IDAT", compressedFiltered);
  const ihdrChunk = makeChunk("IHDR", ihdr);

  return Buffer.concat([signature, ihdrChunk, idat, iend]);
}
