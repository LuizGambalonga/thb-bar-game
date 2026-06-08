// Gerador de sprites SVG pixel-art para TBH.
// Inspirado nos sprites originais do TBH: Task Bar Hero.
// Grade de caracteres → SVG com rects 1×1 (pixel art real).

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ─── Utilitários ──────────────────────────────────────────────────────────────

const d  = (n) => '.'.repeat(n);
const r  = (n, c) => c.repeat(n);

// Construtores de linha com verificação de comprimento
function mkLinha(W) {
  return function(...partes) {
    const s = partes.join('');
    if (s.length !== W) throw new Error(`linha${W} com ${s.length} chars: "${s}"`);
    return s;
  };
}

const L14 = mkLinha(14);
const L12 = mkLinha(12);
const L16 = mkLinha(16);

// Templates para largura 14 (padrão dos heróis):
// body4:  4+1+4+1+4 = 14
// body6:  3+1+6+1+3 = 14
// body8:  2+1+8+1+2 = 14
// body10: 1+1+10+1+1 = 14
// body12: 1+12+1 = 14
const body4  = (i4)  => L14(d(4), 'o', i4,  'o', d(4));
const body6  = (i6)  => L14(d(3), 'o', i6,  'o', d(3));
const body8  = (i8)  => L14(d(2), 'o', i8,  'o', d(2));
const body10 = (i10) => L14(d(1), 'o', i10, 'o', d(1));
const body12 = (i12) => L14('o', i12, 'o');

// Templates para largura 12 (monstros comuns):
const b6_12 = (i6)  => L12(d(2), 'o', i6, 'o', d(2));
const b8_12 = (i8)  => L12(d(1), 'o', i8, 'o', d(1));

// Templates para largura 16 (monstros largos):
const b12_16 = (i12) => L16(d(1), 'o', i12, 'o', d(1));
const b14_16 = (i14) => L16('o', i14, 'o');

// ─── Gerador SVG ──────────────────────────────────────────────────────────────

function gerarSVG(largura, altura, paleta, grid) {
  if (grid.length !== altura)
    throw new Error(`altura: ${grid.length} != ${altura}`);
  let rects = '';
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (row.length !== largura)
      throw new Error(`row ${y}: ${row.length} != ${largura}: "${row}"`);
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') { x++; continue; }
      const cor = paleta[ch];
      if (!cor) { x++; continue; }
      let len = 1;
      while (x + len < row.length && row[x + len] === ch) len++;
      rects += `<rect x="${x}" y="${y}" width="${len}" height="1" fill="${cor}"/>`;
      x += len;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" shape-rendering="crispEdges">${rects}</svg>`;
}

// ─── Linhas de pernas partilhadas (14-wide) ───────────────────────────────────
// ...oааo.oааo.. = 3+4+1+4+2 = 14
const perna  = (c) => L14(d(3), 'o', c, c, 'o', d(1), 'o', c, c, 'o', d(2));
const joelho = (c) => L14(d(3), 'o', c, c, 'o', d(1), 'o', c, c, 'o', d(2));
const pe     =  () => L14(d(3), 'o', 'o', 'o', 'o', d(1), 'o', 'o', 'o', 'o', d(2));
const sola   = (c) => L14(d(3), c, c, c, c, d(1), c, c, c, c, d(2));

// ─── HERÓIS (14×24) ───────────────────────────────────────────────────────────

// CAVALEIRO — Armadura vermelha pesada, capacete fechado
// Ref: knight — vermelho dominante, cinza metálico no capacete, silhueta compacta
const cavaleiro = {
  largura: 14, altura: 24,
  paleta: {
    o: '#0d0f1a', a: '#922020', b: '#5a0a0a',
    m: '#c83030', v: '#1a0808', g: '#707070',
  },
  grid: [
    body4(r(4,'g')),                                   // R0:  topo capacete (cinza metálico)
    body4('g'+'m'+'g'+'g'),                            // R1:  realce metálico
    body4(r(4,'v')),                                   // R2:  viseira escura
    body4(r(4,'g')),                                   // R3:  queixo metálico
    body6(r(6,'a')),                                   // R4:  gorgeira vermelha
    body8('b'+r(6,'a')+'b'),                           // R5:  ombros (lados escuros)
    body8(r(8,'a')),                                   // R6:  ombros
    body8('a'+'b'+'m'+'a'+'a'+'m'+'b'+'a'),            // R7:  placas peito (realce)
    body8(r(8,'a')),                                   // R8:  corpo
    body8('a'+'a'+'b'+'a'+'a'+'b'+'a'+'a'),            // R9:  detalhe
    body8(r(8,'a')),                                   // R10: cintura
    body8(r(8,'b')),                                   // R11: cinto escuro
    body6(r(6,'a')),                                   // R12: quadril
    body6(r(6,'a')),                                   // R13: pernas início
    perna('a'),                                        // R14
    perna('a'),                                        // R15
    perna('a'),                                        // R16
    joelho('b'),                                       // R17: joelhos
    perna('a'),                                        // R18
    perna('a'),                                        // R19
    pe(),                                              // R20: pés
    sola('b'),                                         // R21: solas
    d(14),                                             // R22
    d(14),                                             // R23
  ],
};

// FEITICEIRA — Chapéu roxo pontudo, rosto visível, mantos largos
// Ref: TBH Sorcerer — chapéu ENORME (40% da altura), roxo dominante
const feiticeira = {
  largura: 14, altura: 24,
  paleta: {
    o: '#0d0f1a', a: '#7b3fa0', b: '#4a1870',
    m: '#c07fe0', s: '#f1c27d', e: '#2a1540',
  },
  grid: [
    L14(d(6), 'o', 'o', d(6)),                        // R0:  ponta chapéu (2w)
    L14(d(5), 'o', 'a', 'a', 'o', d(5)),              // R1:  chapéu (4w) 5+4+5=14
    body4(r(4,'a')),                                   // R2:  chapéu (6w)
    body6(r(6,'a')),                                   // R3:  chapéu (8w)
    body8(r(8,'a')),                                   // R4:  chapéu (10w)
    L14(d(2), r(10,'o'), d(2)),                        // R5:  aba escura (10w)
    body4('s'+'s'+'s'+'s'),                            // R6:  rosto
    body4('s'+'e'+'e'+'s'),                            // R7:  olhos
    body4('s'+'s'+'s'+'s'),                            // R8:  queixo
    body6(r(6,'a')),                                   // R9:  gola (8w)
    body8(r(8,'a')),                                   // R10: manto (10w)
    body10('a'+'a'+'b'+'a'+'a'+'a'+'a'+'b'+'a'+'a'),  // R11: detalhe (12w)
    body12('a'+'a'+'b'+'a'+'a'+'b'+'a'+'a'+'b'+'a'+'a'+'a'), // R12: largo (14w)
    body10('a'+'a'+'a'+'b'+'a'+'a'+'b'+'a'+'a'+'a'),  // R13: (12w)
    body10(r(10,'a')),                                 // R14: (12w)
    body8('a'+'a'+'b'+'a'+'a'+'b'+'a'+'a'),            // R15: (10w)
    body8(r(8,'a')),                                   // R16: (10w)
    body6('a'+'a'+'b'+'a'+'a'+'a'),                    // R17: (8w)
    body6(r(6,'a')),                                   // R18: (8w)
    body4(r(4,'a')),                                   // R19: (6w)
    body4(r(4,'a')),                                   // R20: (6w)
    body4(r(4,'b')),                                   // R21: base escura
    L14(d(4), r(6,'o'), d(4)),                         // R22: contorno
    d(14),                                             // R23
  ],
};

// PATRULHEIRO — Armadura leve, tons creme/dourados, rosto visível
// Ref: ranger — creme/tan dominante, cabelo claro, build leve
const patrulheiro = {
  largura: 14, altura: 24,
  paleta: {
    o: '#0d0f1a', a: '#c8a060', b: '#806030',
    m: '#e0c080', s: '#f1c27d', e: '#3a2010',
  },
  grid: [
    body4(r(4,'a')),                                   // R0:  topo capuz
    body6(r(6,'a')),                                   // R1:  capuz (8w)
    body6('a'+'s'+'s'+'s'+'s'+'a'),                    // R2:  rosto pele
    body6('a'+'s'+'e'+'e'+'s'+'a'),                    // R3:  olhos
    body6('a'+'s'+'s'+'s'+'s'+'a'),                    // R4:  queixo
    body8('a'+'a'+'s'+'s'+'s'+'s'+'a'+'a'),            // R5:  pescoço
    body8(r(8,'a')),                                   // R6:  ombros
    body8('a'+'b'+'a'+'a'+'a'+'a'+'b'+'a'),            // R7:  peito
    body8(r(8,'a')),                                   // R8:  corpo
    body8('a'+'a'+'b'+'a'+'a'+'b'+'a'+'a'),            // R9:  detalhe
    body8(r(8,'a')),                                   // R10: cintura
    body6(r(6,'b')),                                   // R11: cinto
    body6(r(6,'a')),                                   // R12: quadril
    body6(r(6,'a')),                                   // R13: pernas início
    perna('a'),                                        // R14
    perna('a'),                                        // R15
    perna('a'),                                        // R16
    joelho('b'),                                       // R17: joelhos
    perna('a'),                                        // R18
    perna('a'),                                        // R19
    pe(),                                              // R20: pés
    sola('b'),                                         // R21: solas
    d(14),                                             // R22
    d(14),                                             // R23
  ],
};

// SACERDOTE — Robes azuis, halo dourado, rosto visível
// Ref: priest — azul forte, branco/azul claro, halo, rosto exposto
const sacerdote = {
  largura: 14, altura: 24,
  paleta: {
    o: '#0d0f1a', a: '#2860c8', b: '#1840a0',
    m: '#6090e0', v: '#0a2060', g: '#f0c030',
    s: '#f1c27d', e: '#2a1a0a',
  },
  grid: [
    body8(r(8,'g')),                                   // R0:  halo dourado (sólido)
    L14(d(2), 'g', d(8), 'g', d(2)),                  // R1:  halo lados (2+1+8+1+2=14)
    body4(r(4,'s')),                                   // R2:  cabeça (pele)
    body6('a'+'s'+'s'+'s'+'s'+'a'),                    // R3:  rosto (capuz)
    body6('a'+'s'+'e'+'e'+'s'+'a'),                    // R4:  olhos
    body6('a'+'s'+'s'+'s'+'s'+'a'),                    // R5:  queixo
    body8('b'+'a'+'a'+'g'+'g'+'a'+'a'+'b'),            // R6:  colar dourado
    body8(r(8,'a')),                                   // R7:  robe (10w)
    body8('a'+'a'+'v'+'a'+'a'+'v'+'a'+'a'),            // R8:  detalhe
    body8(r(8,'a')),                                   // R9:  robe
    body10('a'+'a'+'b'+'g'+'a'+'a'+'g'+'b'+'a'+'a'),  // R10: detalhe largo (12w)
    body10(r(10,'a')),                                 // R11: largo
    body10('a'+'a'+'v'+'a'+'a'+'a'+'a'+'v'+'a'+'a'), // R12: detalhe
    body10(r(10,'a')),                                 // R13: robe
    body8('a'+'a'+'b'+'a'+'a'+'b'+'a'+'a'),            // R14: (10w)
    body8(r(8,'a')),                                   // R15: (10w)
    body6(r(6,'a')),                                   // R16: (8w)
    body6('a'+'a'+'v'+'v'+'a'+'a'),                    // R17: detalhe
    body6(r(6,'a')),                                   // R18: (8w)
    body4(r(4,'a')),                                   // R19: base
    body4(r(4,'b')),                                   // R20: escuro
    L14(d(4), r(6,'o'), d(4)),                         // R21: contorno
    d(14),                                             // R22
    d(14),                                             // R23
  ],
};

// CAÇADOR — Quase silhueta preta, capuz, olhos teal únicos
// Ref: hunter — near-black dominante, mínimo contraste, olhos teal destacam
const cacador = {
  largura: 14, altura: 24,
  paleta: {
    o: '#0d0f1a', a: '#1a1a28', b: '#0d0d18',
    m: '#2a2a40', v: '#080808', t: '#2ab8b8',
  },
  grid: [
    body4(r(4,'a')),                                   // R0:  capuz topo
    body6(r(6,'a')),                                   // R1:  capuz
    body6('a'+'v'+'v'+'v'+'v'+'a'),                    // R2:  máscara escura
    body6('a'+'v'+'t'+'t'+'v'+'a'),                    // R3:  olhos teal
    body6('a'+'v'+'v'+'v'+'v'+'a'),                    // R4:  máscara
    body8(r(8,'a')),                                   // R5:  pescoço/capuz
    body8(r(8,'a')),                                   // R6:  ombros
    body8('a'+'b'+'b'+'m'+'m'+'b'+'b'+'a'),            // R7:  peito realce
    body8(r(8,'a')),                                   // R8:  corpo
    body8('a'+'a'+'b'+'a'+'a'+'b'+'a'+'a'),            // R9:  detalhe
    body8(r(8,'a')),                                   // R10: cintura
    body6(r(6,'b')),                                   // R11: cinto
    body6(r(6,'a')),                                   // R12: quadril
    body6(r(6,'a')),                                   // R13: pernas início
    perna('a'),                                        // R14
    perna('a'),                                        // R15
    perna('a'),                                        // R16
    joelho('b'),                                       // R17: joelhos
    perna('a'),                                        // R18
    perna('a'),                                        // R19
    pe(),                                              // R20: pés
    sola('b'),                                         // R21: solas
    d(14),                                             // R22
    d(14),                                             // R23
  ],
};

// CARRASCO — Aventureiro, cabelo castanho, rosto visível, roupa simples
// Ref: slayer — castanho dominante, rosto exposto com cabelo, sem armadura pesada
const carrasco = {
  largura: 14, altura: 24,
  paleta: {
    o: '#0d0f1a', a: '#6b3820', b: '#3a1e0e',
    m: '#9a5830', s: '#f1c27d', e: '#2a1a0a', h: '#8b5e3c',
  },
  grid: [
    body6('a'+'a'+'m'+'m'+'a'+'a'),                    // R0:  cabelo castanho (topo)
    body6('a'+'m'+'m'+'m'+'m'+'a'),                    // R1:  cabelo largo
    body6('a'+'s'+'s'+'s'+'s'+'a'),                    // R2:  rosto pele
    body6('a'+'s'+'e'+'e'+'s'+'a'),                    // R3:  olhos
    body6('a'+'s'+'s'+'s'+'s'+'a'),                    // R4:  queixo
    body8('h'+'a'+'s'+'s'+'s'+'s'+'a'+'h'),            // R5:  pescoço/gola
    body8(r(8,'a')),                                   // R6:  ombros
    body8('a'+'b'+'a'+'m'+'m'+'a'+'b'+'a'),            // R7:  peito detalhe
    body8(r(8,'a')),                                   // R8:  corpo
    body8('a'+'a'+'b'+'a'+'a'+'b'+'a'+'a'),            // R9:  detalhe
    body8(r(8,'a')),                                   // R10: cintura
    body6(r(6,'b')),                                   // R11: cinto
    body6(r(6,'a')),                                   // R12: quadril
    body6(r(6,'a')),                                   // R13: pernas início
    perna('a'),                                        // R14
    perna('a'),                                        // R15
    perna('a'),                                        // R16
    joelho('b'),                                       // R17: joelhos
    perna('a'),                                        // R18
    perna('a'),                                        // R19
    pe(),                                              // R20: pés
    sola('b'),                                         // R21: solas
    d(14),                                             // R22
    d(14),                                             // R23
  ],
};

// ─── MONSTROS COMUNS (12-wide) ────────────────────────────────────────────────

// GRUB BINÁRIO — Larva verde pequena e rechonchuda (12×8)
const grubBinario = {
  largura: 12, altura: 8,
  paleta: { o:'#0d0f1a', a:'#3a9a1a', b:'#1a5a0a', m:'#7ada3a', e:'#080f04' },
  grid: [
    L12(d(2), r(8,'o'), d(2)),                         // R0: topo
    b8_12('m'+r(4,'a')+'m'+'a'+'a'),                  // R1: segmento (1+1+4+1+2=9? inner=8: m+aaaa+m+aa)
    // inner = 'm'+r(4,'a')+'m'+'a'+'a' = 1+4+1+2=8 ✓
    b8_12('a'+'e'+r(2,'a')+'e'+'a'+'a'+'a'),           // R2: olhos (inner=8: a+e+aa+e+aaa=1+1+2+1+3=8 ✓)
    b8_12(r(8,'a')),                                   // R3: corpo
    b8_12('a'+'a'+'b'+r(2,'a')+'b'+'a'+'a'),           // R4: segmento (1+1+1+2+1+1+1=8 ✓)
    b8_12(r(8,'a')),                                   // R5: corpo
    L12(d(2), r(8,'o'), d(2)),                         // R6: fundo
    d(12),                                             // R7
  ],
};

// ESPECTRO ZUMBI — Fantasma alongado esverdeado/cinza (12×20)
const espectroZumbi = {
  largura: 12, altura: 20,
  paleta: { o:'#1a2a3a', a:'#8ab8c8', b:'#4a7a8a', m:'#d0e8f0', e:'#102030' },
  grid: [
    L12(d(3), r(6,'o'), d(3)),                         // R0:  topo (6w)
    b6_12('a'+'m'+r(2,'a')+'a'+'a'),                   // R1:  cabeça (inner=6: a+m+aa+aa=6 ✓)
    b6_12(r(6,'a')),                                   // R2:  cabeça
    b6_12('a'+'e'+r(2,'a')+'e'+'a'),                   // R3:  olhos
    b6_12(r(6,'a')),                                   // R4:  corpo superior
    b8_12(r(8,'a')),                                   // R5:  corpo (10w)
    b8_12('a'+'a'+'b'+r(2,'a')+'b'+'a'+'a'),           // R6:  detalhe
    b8_12(r(8,'a')),                                   // R7:
    b8_12('a'+'b'+'a'+r(2,'a')+'a'+'b'+'a'),           // R8:
    b8_12(r(8,'a')),                                   // R9:
    b8_12('a'+'a'+'b'+'b'+'b'+'b'+'a'+'a'),            // R10: detalhe
    b6_12(r(6,'a')),                                   // R11: estreitando
    b6_12('a'+'b'+'a'+'a'+'b'+'a'),                    // R12:
    b6_12(r(6,'a')),                                   // R13:
    L12(d(4), r(2,'a'), d(2), r(2,'a'), d(2)),         // R14: bifurcação (4+2+2+2+2=12 ✓)
    L12(d(4), r(2,'a'), d(2), r(2,'a'), d(2)),         // R15:
    L12(d(4), r(2,'b'), d(2), r(2,'b'), d(2)),         // R16: borda
    d(12),                                             // R17
    d(12),                                             // R18
    d(12),                                             // R19
  ],
};

// RAPOSA NEON — Quadrúpede laranja, dois olhos teal (14×12)
const rapozaNeon = {
  largura: 14, altura: 12,
  paleta: { o:'#0d0f1a', a:'#d05a10', b:'#8a2a00', m:'#ffa040', t:'#40f0e0', e:'#080404' },
  grid: [
    L14(d(4), 'o','o', d(4), 'o','o', d(2)),           // R0: orelhas (4+2+4+2+2=14 ✓)
    body6(r(6,'a')),                                   // R1: cabeça (8w)
    body6('a'+'a'+'t'+'t'+'a'+'a'),                    // R2: olhos teal
    body6('a'+'m'+r(2,'a')+'m'+'a'),                   // R3: focinho realce
    body8(r(8,'a')),                                   // R4: corpo/pescoço (10w)
    body8('a'+'b'+'a'+r(2,'a')+'a'+'b'+'a'),           // R5: listras (8 inner ✓)
    body8(r(8,'a')),                                   // R6: corpo
    body8('a'+'b'+r(4,'a')+'b'+'a'),                   // R7: barriga
    body6(r(6,'a')),                                   // R8: base corpo (8w)
    L14(d(3), 'o','a','o', d(2), 'o','a','o', d(3)),   // R9: patas (3+3+2+3+3=14 ✓)
    L14(d(3), 'o','a','o', d(2), 'o','a','o', d(3)),   // R10:
    L14(d(4), r(2,'o'), d(4), r(2,'o'), d(2)),         // R11: pés (4+2+4+2+2=14 ✓)
  ],
};

// MORCEGO VIRAL — Morcego com asas abertas (16×10)
const morcego = {
  largura: 16, altura: 10,
  paleta: { o:'#0d0f1a', a:'#5a1a7a', b:'#3a0a50', m:'#9a3ab0', t:'#20d080', e:'#050810' },
  grid: [
    L16('o', r(5,'a'), 'o', d(2), 'o', r(5,'a'), 'o'),           // R0: asas abertas (1+5+1+2+1+5+1=16 ✓)
    L16(d(2), 'o', r(3,'a'), 'o', d(2), 'o', r(3,'a'), 'o', d(2)), // R1: asas (2+4+2+4+4=16 ✓)
    L16(d(3), 'o', r(2,'a'), 'o', d(2), 'o', r(2,'a'), 'o', d(3)), // R2: asas (3+3+2+3+5=16 ✓)
    L16(d(4), r(8,'o'), d(4)),                                    // R3: corpo (4+8+4=16 ✓)
    L16(d(4), 'o', r(2,'a'), 't', 't', r(2,'a'), 'o', d(4)),     // R4: olhos teal (4+1+2+2+2+1+4=16 ✓)
    L16(d(4), 'o', r(2,'a'), 'e', 'e', r(2,'a'), 'o', d(4)),     // R5: boca (16 ✓)
    L16(d(4), r(8,'o'), d(4)),                                    // R6: fundo (4+8+4=16 ✓)
    d(16),                                                        // R7
    d(16),                                                        // R8
    d(16),                                                        // R9
  ],
};


// ─── BOSSES (14-wide) ─────────────────────────────────────────────────────────

// LEVIATÃ DE DADOS — Dragão boss, imponente (14×22)
const leviata = {
  largura: 14, altura: 22,
  paleta: { o:'#0d0f1a', a:'#1a5a2a', b:'#0a2a10', m:'#4ab86a', f:'#e04020', e:'#060c08' },
  grid: [
    L14(d(3), 'o','o', d(4), 'o','o', d(3)),           // R0:  chifres (3+2+4+2+3=14 ✓)
    L14(d(3), 'o','a', 'o', d(2), 'o', 'a','o', d(3)), // R1:  chifres corpo (3+3+2+3+3=14 ✓)
    body6(r(6,'a')),                                   // R2:  cabeça
    body6('a'+'f'+'a'+'a'+'f'+'a'),                    // R3:  olhos fogo
    body6(r(6,'a')),                                   // R4:  focinho
    body6('a'+'a'+'f'+'f'+'a'+'a'),                    // R5:  bocal
    body8(r(8,'a')),                                   // R6:  pescoço
    body8('a'+'b'+'a'+'m'+'m'+'a'+'b'+'a'),            // R7:  peito
    body8(r(8,'a')),                                   // R8:
    body8('a'+'a'+'b'+'a'+'a'+'b'+'a'+'a'),            // R9:  escamas
    body8(r(8,'a')),                                   // R10:
    body10('a'+'a'+'b'+'a'+'m'+'m'+'a'+'b'+'a'+'a'),  // R11: largo (12w)
    body10(r(10,'a')),                                 // R12:
    body10('a'+'a'+'b'+'a'+'a'+'a'+'a'+'b'+'a'+'a'), // R13:
    body8(r(8,'a')),                                   // R14:
    body8('a'+'b'+'a'+'a'+'a'+'a'+'b'+'a'),            // R15:
    body6(r(6,'a')),                                   // R16:
    body6('a'+'b'+'a'+'a'+'b'+'a'),                    // R17:
    body4(r(4,'a')),                                   // R18:
    body4(r(4,'b')),                                   // R19: cauda
    L14(d(4), r(6,'o'), d(4)),                         // R20:
    d(14),                                             // R21
  ],
};

// LOBO CORROMPIDO — Lobo boss (14×16)
const lobo = {
  largura: 14, altura: 16,
  paleta: { o:'#0d0f1a', a:'#6a6a6a', b:'#3a3a3a', m:'#c0c0c0', f:'#40a0f0', e:'#0a0a0a' },
  grid: [
    L14(d(1), 'o','o', d(4), 'o','o','o', d(4)),       // R0:  orelhas (1+2+4+3+4=14 ✓)
    L14(d(2), 'o','a', 'o', d(2), 'o','a','a','o', d(3)), // R1: (2+3+2+4+3=14 ✓)
    body8(r(8,'a')),                                   // R2:  cabeça (10w)
    body8('a'+'e'+'a'+'a'+'a'+'a'+'e'+'a'),            // R3:  olhos
    body8('a'+'a'+'a'+'f'+'f'+'a'+'a'+'a'),            // R4:  olhos brilhando
    body8(r(8,'a')),                                   // R5:  focinho
    body8('a'+'a'+'b'+'m'+'m'+'b'+'a'+'a'),            // R6:  pele
    body8(r(8,'a')),                                   // R7:  corpo
    body8('a'+'b'+'a'+'a'+'a'+'a'+'b'+'a'),            // R8:
    body8(r(8,'a')),                                   // R9:
    body6(r(6,'a')),                                   // R10: cintura
    body6('a'+'b'+'a'+'a'+'b'+'a'),                    // R11: patas
    body6(r(6,'a')),                                   // R12:
    L14(d(3), r(3,'o'), d(2), r(3,'o'), d(3)),         // R13: patas split (3+3+2+3+3=14 ✓)
    d(14),                                             // R14
    d(14),                                             // R15
  ],
};

// VERME DO ABISMO — Verme boss segmentado (16×14)
const verme = {
  largura: 16, altura: 14,
  paleta: { o:'#0d0f1a', a:'#6a1a1a', b:'#3a0808', m:'#d04040', f:'#ff8000', e:'#0a0404' },
  grid: [
    L16(d(2), r(12,'o'), d(2)),                                 // R0:  contorno topo
    b14_16(r(14,'a')),                                          // R1:  corpo
    b14_16('a'+'a'+'m'+r(8,'a')+'m'+'a'+'a'),                  // R2:  segmento (2+1+8+1+2=14 ✓)
    b14_16(r(14,'a')),                                          // R3:
    L16(d(1), 'o', 'f','f', r(8,'a'), 'f','f', 'o', d(1)),    // R4:  bocal fogo (1+1+2+8+2+1+1=16 ✓)
    L16(d(2), 'o', r(10,'a'), 'o', d(2)),                      // R5:  (2+1+10+1+2=16 ✓)
    L16(d(2), 'o', r(10,'a'), 'o', d(2)),                      // R6:
    L16(d(2), 'o','a','b', r(6,'a'), 'b','a','o', d(2)),       // R7:  (2+1+1+1+6+1+1+1+2=16 ✓)
    L16(d(2), 'o', r(10,'a'), 'o', d(2)),                      // R8:
    L16(d(3), 'o', r(8,'a'), 'o', d(3)),                       // R9:  (3+1+8+1+3=16 ✓)
    L16(d(3), 'o', r(8,'b'), 'o', d(3)),                       // R10:
    L16(d(4), r(8,'o'), d(4)),                                  // R11: (4+8+4=16 ✓)
    d(16),                                                      // R12
    d(16),                                                      // R13
  ],
};

// GOLEM DE HARDWARE — Golem metálico boss (14×22)
const golemHardware = {
  largura: 14, altura: 22,
  paleta: { o:'#0d0f1a', a:'#787878', b:'#404040', m:'#c8c8c8', f:'#f08020', e:'#f03020' },
  grid: [
    L14(d(3), r(8,'o'), d(3)),                         // R0:  topo (3+8+3=14 ✓)
    body8('b'+'a'+'a'+'m'+'m'+'a'+'a'+'b'),            // R1:  cabeça metal
    body8('a'+'a'+'e'+'a'+'a'+'e'+'a'+'a'),            // R2:  olhos vermelhos
    body8(r(8,'a')),                                   // R3:
    body8('a'+'b'+'f'+'f'+'f'+'f'+'b'+'a'),            // R4:  núcleo laranja
    body8(r(8,'a')),                                   // R5:  pescoço
    body10(r(10,'a')),                                 // R6:  ombros (12w)
    body10('a'+'b'+'a'+'m'+'a'+'a'+'m'+'a'+'b'+'a'), // R7:  peito
    body10(r(10,'a')),                                 // R8:
    body10('a'+'a'+'b'+'a'+'f'+'f'+'a'+'b'+'a'+'a'), // R9:  núcleo fogo
    body10(r(10,'a')),                                 // R10:
    body12('a'+'a'+'b'+'a'+'a'+'m'+'m'+'a'+'a'+'b'+'a'+'a'), // R11: largo (14w)
    body10(r(10,'a')),                                 // R12:
    body10('a'+'b'+'a'+'a'+'b'+'b'+'a'+'a'+'b'+'a'), // R13:
    body8(r(8,'a')),                                   // R14:
    body8('a'+'a'+'b'+'a'+'a'+'b'+'a'+'a'),            // R15:
    body6(r(6,'a')),                                   // R16:
    body6(r(6,'b')),                                   // R17: cinto
    body6(r(6,'a')),                                   // R18:
    L14(d(3), r(3,'o'), d(2), r(3,'o'), d(3)),         // R19: pernas (3+3+2+3+3=14 ✓)
    d(14),                                             // R20
    d(14),                                             // R21
  ],
};

// ─── Tabela de sprites ────────────────────────────────────────────────────────

const SPRITES = {
  'herois/cavaleiro':         cavaleiro,
  'herois/feiticeira':        feiticeira,
  'herois/patrulheiro':       patrulheiro,
  'herois/sacerdote':         sacerdote,
  'herois/cacador':           cacador,
  'herois/carrasco':          carrasco,
  'monstros/grub-binario':    grubBinario,
  'monstros/espectro-zumbi':  espectroZumbi,
  'monstros/raposa-neon':     rapozaNeon,
  'monstros/morcego-viral':   morcego,
  'monstros/leviata-dados':   leviata,
  'monstros/lobo-corrompido': lobo,
  'monstros/verme-abismo':    verme,
  'monstros/golem-hardware':  golemHardware,
};

// ─── Salva SVGs ───────────────────────────────────────────────────────────────

let ok = 0, erros = 0;
for (const [caminho, def] of Object.entries(SPRITES)) {
  if (!def) { console.warn(`⚠ Sem definição: ${caminho}`); continue; }
  try {
    const svg = gerarSVG(def.largura, def.altura, def.paleta, def.grid);
    const saida = resolve(raiz, 'assets', 'arte', caminho + '.svg');
    mkdirSync(resolve(saida, '..'), { recursive: true });
    writeFileSync(saida, svg, 'utf8');
    console.log(`✓ ${caminho}.svg (${def.largura}×${def.altura})`);
    ok++;
  } catch (e) {
    console.error(`✗ ${caminho}: ${e.message}`);
    erros++;
  }
}
console.log(`\n${ok} gerados, ${erros} erros.`);
