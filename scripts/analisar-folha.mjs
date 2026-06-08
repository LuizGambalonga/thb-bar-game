// Analisador de sprite-sheet: mede a grade (linhas×colunas de frames 32px) e conta
// quantos frames de cada linha têm pixels (alpha>0). Uso: node scripts/analisar-folha.mjs <png> [tamFrame]
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const arquivo = process.argv[2];
const TAM = Number(process.argv[3] ?? 32);
if (!arquivo) { console.error("uso: node scripts/analisar-folha.mjs <png> [tamFrame]"); process.exit(1); }

const buf = readFileSync(arquivo);
if (buf.toString("latin1", 1, 4) !== "PNG") { console.error("não é PNG"); process.exit(1); }

let pos = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
const idat = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const tipo = buf.toString("latin1", pos + 4, pos + 8);
  const dados = buf.subarray(pos + 8, pos + 8 + len);
  if (tipo === "IHDR") {
    width = dados.readUInt32BE(0); height = dados.readUInt32BE(4);
    bitDepth = dados[8]; colorType = dados[9];
  } else if (tipo === "IDAT") { idat.push(dados); }
  else if (tipo === "IEND") break;
  pos += 12 + len;
}

const canais = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 4;
if (bitDepth !== 8) { console.error(`bitDepth ${bitDepth} não suportado`); process.exit(1); }

const bruto = inflateSync(Buffer.concat(idat));
const bpp = canais;
const stride = width * bpp;
const pixels = Buffer.alloc(height * stride);
let s = 0;
const paeth = (a, b, c) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};
for (let y = 0; y < height; y++) {
  const filtro = bruto[s++];
  for (let x = 0; x < stride; x++) {
    const cru = bruto[s++];
    const a = x >= bpp ? pixels[y * stride + x - bpp] : 0;
    const b = y > 0 ? pixels[(y - 1) * stride + x] : 0;
    const c = y > 0 && x >= bpp ? pixels[(y - 1) * stride + x - bpp] : 0;
    let val = cru;
    if (filtro === 1) val = cru + a;
    else if (filtro === 2) val = cru + b;
    else if (filtro === 3) val = cru + ((a + b) >> 1);
    else if (filtro === 4) val = cru + paeth(a, b, c);
    pixels[y * stride + x] = val & 0xff;
  }
}

const temAlfa = colorType === 6;
const cols = Math.floor(width / TAM), rows = Math.floor(height / TAM);
function frameOcupado(fc, fr) {
  for (let yy = 0; yy < TAM; yy++) {
    for (let xx = 0; xx < TAM; xx++) {
      const px = fc * TAM + xx, py = fr * TAM + yy;
      const i = py * stride + px * bpp;
      const visivel = temAlfa ? pixels[i + 3] > 8 : !(pixels[i] === 0 && pixels[i + 1] === 0 && pixels[i + 2] === 0);
      if (visivel) return true;
    }
  }
  return false;
}

console.log(`${arquivo}: ${width}x${height}, colorType ${colorType}, grade ${cols}x${rows} (frame ${TAM}px)`);
for (let r = 0; r < rows; r++) {
  let cont = 0;
  for (let c = 0; c < cols; c++) if (frameOcupado(c, r)) cont++; else break;
  let total = 0;
  for (let c = 0; c < cols; c++) if (frameOcupado(c, r)) total++;
  console.log(`  linha ${r}: ${cont} frames contíguos (total ocupados ${total})`);
}
