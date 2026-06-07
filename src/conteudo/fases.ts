// Fases do Ato I: 4 áreas × 4 dificuldades = 16 fases.

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
  area("a1n-planicies", "Planícies Digitais",    1, "normal", "grub-binario",    "leviata-dados",    1),
  area("a1n-floresta",  "Floresta dos Espectros", 1, "normal", "espectro-zumbi",  "lobo-corrompido",  1,    "a1n-planicies"),
  area("a1n-pantano",   "Pântano das Sombras",    1, "normal", "morcego-viral",   "verme-abismo",     1,    "a1n-floresta"),
  area("a1n-fortaleza", "Fortaleza Corrompida",   1, "normal", "raposa-neon",     "golem-hardware",   1,    "a1n-pantano"),
];

// ─── Ato 1 — Difícil ─────────────────────────────────────────────────────
const A1D: DefFase[] = [
  area("a1d-planicies", "Planícies Digitais (Difícil)",    1, "dificil", "grub-binario",   "leviata-dados",   1.8, "a1n-fortaleza"),
  area("a1d-floresta",  "Floresta dos Espectros (Difícil)", 1, "dificil", "espectro-zumbi", "lobo-corrompido", 1.8, "a1d-planicies"),
  area("a1d-pantano",   "Pântano das Sombras (Difícil)",   1, "dificil", "morcego-viral",  "verme-abismo",    1.8, "a1d-floresta"),
  area("a1d-fortaleza", "Fortaleza Corrompida (Difícil)",  1, "dificil", "raposa-neon",    "golem-hardware",  1.8, "a1d-pantano"),
];

// ─── Ato 1 — Pesadelo ────────────────────────────────────────────────────
const A1P: DefFase[] = [
  area("a1p-planicies", "Planícies Digitais (Pesadelo)",    1, "pesadelo", "grub-binario",   "leviata-dados",   3.2, "a1d-fortaleza"),
  area("a1p-floresta",  "Floresta dos Espectros (Pesadelo)", 1, "pesadelo", "espectro-zumbi", "lobo-corrompido", 3.2, "a1p-planicies"),
  area("a1p-pantano",   "Pântano das Sombras (Pesadelo)",   1, "pesadelo", "morcego-viral",  "verme-abismo",    3.2, "a1p-floresta"),
  area("a1p-fortaleza", "Fortaleza Corrompida (Pesadelo)",  1, "pesadelo", "raposa-neon",    "golem-hardware",  3.2, "a1p-pantano"),
];

// ─── Ato 1 — Kernel Panic ────────────────────────────────────────────────
const A1K: DefFase[] = [
  area("a1k-planicies", "Planícies Digitais (Kernel Panic)",    1, "kernelPanic", "grub-binario",   "leviata-dados",   6, "a1p-fortaleza"),
  area("a1k-floresta",  "Floresta dos Espectros (Kernel Panic)", 1, "kernelPanic", "espectro-zumbi", "lobo-corrompido", 6, "a1k-planicies"),
  area("a1k-pantano",   "Pântano das Sombras (Kernel Panic)",   1, "kernelPanic", "morcego-viral",  "verme-abismo",    6, "a1k-floresta"),
  area("a1k-fortaleza", "Fortaleza Corrompida (Kernel Panic)",  1, "kernelPanic", "raposa-neon",    "golem-hardware",  6, "a1k-pantano"),
];

export const FASES: DefFase[] = [...A1N, ...A1D, ...A1P, ...A1K];

export const FASE_INICIAL = "a1n-planicies";
