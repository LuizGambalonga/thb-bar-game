// Fases do Ato I: 4 áreas × 4 dificuldades = 16 fases.
// Cada área tem um monstro temático em 5 ondas + 1 onda de boss.

import type { DefFase, DefOnda, Dificuldade } from "../nucleo/dominio/tipos.js";

function ondas(idMonstro: string, boss: string): DefOnda[] {
  return [
    { idsMonstros: [idMonstro], quantidade: 3 },
    { idsMonstros: [idMonstro], quantidade: 4 },
    { idsMonstros: [idMonstro], quantidade: 5 },
    { idsMonstros: [idMonstro], quantidade: 5 },
    { idsMonstros: [idMonstro], quantidade: 6 },
    { idsMonstros: [boss], quantidade: 1 },
  ];
}

function area(
  id: string,
  nome: string,
  ato: 1 | 2 | 3,
  dificuldade: Dificuldade,
  idMonstro: string,
  boss: string,
  escala: number,
  requer?: string,
): DefFase {
  return { id, nome, ato, dificuldade, ondas: ondas(idMonstro, boss), chefe: boss, escalaInimigos: escala, requer };
}

// ─── Ato 1 — Normal ──────────────────────────────────────────────────────
const A1N: DefFase[] = [
  area("a1n-bits",    "Arredores de Bits",     1, "normal", "bit-slime",      "a-lixeira",        1),
  area("a1n-icones",  "Corredores de Ícones",  1, "normal", "icone-zumbi",    "cursor-chefe",     1,    "a1n-bits"),
  area("a1n-popups",  "Pântano de Pop-ups",    1, "normal", "popup",          "popup-gigante",    1,    "a1n-icones"),
  area("a1n-cursores","Núcleo do Sistema",     1, "normal", "cursor-selvagem", "guardiao-do-espaco", 1,  "a1n-popups"),
];

// ─── Ato 1 — Difícil ─────────────────────────────────────────────────────
const A1D: DefFase[] = [
  area("a1d-bits",    "Arredores de Bits (Difícil)",    1, "dificil", "bit-slime",       "a-lixeira",          1.8, "a1n-cursores"),
  area("a1d-icones",  "Corredores de Ícones (Difícil)", 1, "dificil", "icone-zumbi",     "cursor-chefe",       1.8, "a1d-bits"),
  area("a1d-popups",  "Pântano de Pop-ups (Difícil)",   1, "dificil", "popup",           "popup-gigante",      1.8, "a1d-icones"),
  area("a1d-cursores","Núcleo do Sistema (Difícil)",    1, "dificil", "cursor-selvagem", "guardiao-do-espaco", 1.8, "a1d-popups"),
];

// ─── Ato 1 — Pesadelo ────────────────────────────────────────────────────
const A1P: DefFase[] = [
  area("a1p-bits",    "Arredores de Bits (Pesadelo)",    1, "pesadelo", "bit-slime",       "a-lixeira",          3.2, "a1d-cursores"),
  area("a1p-icones",  "Corredores de Ícones (Pesadelo)", 1, "pesadelo", "icone-zumbi",     "cursor-chefe",       3.2, "a1p-bits"),
  area("a1p-popups",  "Pântano de Pop-ups (Pesadelo)",   1, "pesadelo", "popup",           "popup-gigante",      3.2, "a1p-icones"),
  area("a1p-cursores","Núcleo do Sistema (Pesadelo)",    1, "pesadelo", "cursor-selvagem", "guardiao-do-espaco", 3.2, "a1p-popups"),
];

// ─── Ato 1 — Kernel Panic ────────────────────────────────────────────────
const A1K: DefFase[] = [
  area("a1k-bits",    "Arredores de Bits (Kernel Panic)",    1, "kernelPanic", "bit-slime",       "a-lixeira",          6, "a1p-cursores"),
  area("a1k-icones",  "Corredores de Ícones (Kernel Panic)", 1, "kernelPanic", "icone-zumbi",     "cursor-chefe",       6, "a1k-bits"),
  area("a1k-popups",  "Pântano de Pop-ups (Kernel Panic)",   1, "kernelPanic", "popup",           "popup-gigante",      6, "a1k-icones"),
  area("a1k-cursores","Núcleo do Sistema (Kernel Panic)",    1, "kernelPanic", "cursor-selvagem", "guardiao-do-espaco", 6, "a1k-popups"),
];

export const FASES: DefFase[] = [...A1N, ...A1D, ...A1P, ...A1K];

// Primeira fase (ponto de entrada do save novo)
export const FASE_INICIAL = "a1n-bits";
