// Verificação visual do fatiamento: recorta frames das folhas como o jogo faz e
// compõe um preview PNG. Uso: node scripts/verif-folha.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { inflateSync, deflateSync } from "node:zlib";

function decodePNG(arquivo) {
  const buf = readFileSync(arquivo);
  let pos = 8, width = 0, height = 0, colorType = 0; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const tipo = buf.toString("latin1", pos + 4, pos + 8);
    const dados = buf.subarray(pos + 8, pos + 8 + len);
    if (tipo === "IHDR") { width = dados.readUInt32BE(0); height = dados.readUInt32BE(4); colorType = dados[9]; }
    else if (tipo === "IDAT") idat.push(dados);
    else if (tipo === "IEND") break;
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const bruto = inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(height * stride);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  let s = 0;
  for (let y = 0; y < height; y++) {
    const f = bruto[s++];
    for (let x = 0; x < stride; x++) {
      const cru = bruto[s++];
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = y > 0 && x >= bpp ? px[(y - 1) * stride + x - bpp] : 0;
      let v = cru;
      if (f === 1) v = cru + a; else if (f === 2) v = cru + b; else if (f === 3) v = cru + ((a + b) >> 1); else if (f === 4) v = cru + paeth(a, b, c);
      px[y * stride + x] = v & 0xff;
    }
  }
  return { width, height, bpp, px };
}

// CRC32
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t = Buffer.from(type, "latin1");
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, y * w * 4 + w * 4); }
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// blit de um frame (fr,fc 32px) de src para dst em (dx,dy) escala ESC, fundo cinza
const ESC = 3, F = 32;
function blit(dst, dw, src, fr, fc, dx, dy) {
  for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) {
    const si = ((fr * F + y) * src.width + (fc * F + x)) * src.bpp;
    const a = src.bpp === 4 ? src.px[si + 3] : 255;
    if (a < 16) continue;
    for (let yy = 0; yy < ESC; yy++) for (let xx = 0; xx < ESC; xx++) {
      const px = dx + x * ESC + xx, py = dy + y * ESC + yy;
      const di = (py * dw + px) * 4;
      dst[di] = src.px[si]; dst[di + 1] = src.px[si + 1]; dst[di + 2] = src.px[si + 2]; dst[di + 3] = 255;
    }
  }
}

const base = "assets/arte/personagens";
const herois = [
  ["cavaleiro", "warrior.png", 0], ["carrasco", "warrior.png", 5],
  ["feiticeira", "wizard.png", 5], ["sacerdote", "cleric.png", 0],
  ["patrulheiro", "ranger.png", 0], ["cacador", "rogue.png", 0],
];
const ANIMS = [["idle", 0, 0], ["gesture", 1, 5], ["walk", 2, 5], ["attack", 3, 5], ["death", 4, 8]];

const cellW = F * ESC + 6, cellH = F * ESC + 14;
const W = cellW * ANIMS.length, H = cellH * herois.length;
const dst = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) { dst[i * 4] = 30; dst[i * 4 + 1] = 32; dst[i * 4 + 2] = 40; dst[i * 4 + 3] = 255; }

herois.forEach(([nome, folha, linhaBase], ri) => {
  const src = decodePNG(`${base}/${nome}/${folha}`);
  ANIMS.forEach(([, linha, col], ci) => {
    blit(dst, W, src, linhaBase + linha, col, ci * cellW + 3, ri * cellH + 3);
  });
});

writeFileSync("_verif.png", encodePNG(W, H, dst));
console.log(`_verif.png ${W}x${H} — colunas: ${ANIMS.map(a => a[0]).join(", ")} | linhas: ${herois.map(h => h[0]).join(", ")}`);
