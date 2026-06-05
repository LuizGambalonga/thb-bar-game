// Tabelas de espólio por fase/dificuldade.

import type { TabelaEspolio } from "../nucleo/dominio/tipos.js";

export const TABELAS_ESPOLIO: TabelaEspolio[] = [
  // ─── Ato 1 por dificuldade ───────────────────────────────────────────────
  {
    id: "esp-ato1-normal",
    pesosRaridade: {
      comum: 30, incomum: 40, raro: 20, epico: 7, lendario: 2,
      imortal: 1, arcano: 0, cosmico: 0,
    },
    faixaOuro: [4, 14],
    chanceBau: 0.05,
    chanceItem: 0.20,
  },
  {
    id: "esp-ato1-dificil",
    pesosRaridade: {
      comum: 20, incomum: 35, raro: 28, epico: 12, lendario: 4,
      imortal: 1, arcano: 0, cosmico: 0,
    },
    faixaOuro: [8, 24],
    chanceBau: 0.07,
    chanceItem: 0.28,
  },
  {
    id: "esp-ato1-pesadelo",
    pesosRaridade: {
      comum: 10, incomum: 30, raro: 32, epico: 18, lendario: 8,
      imortal: 2, arcano: 0, cosmico: 0,
    },
    faixaOuro: [16, 48],
    chanceBau: 0.10,
    chanceItem: 0.35,
  },
  {
    id: "esp-ato1-kernelPanic",
    pesosRaridade: {
      comum: 0, incomum: 20, raro: 35, epico: 28, lendario: 12,
      imortal: 4, arcano: 1, cosmico: 0,
    },
    faixaOuro: [32, 96],
    chanceBau: 0.15,
    chanceItem: 0.45,
  },
  // ─── Bosses (sempre dropam item) ─────────────────────────────────────────
  {
    id: "esp-ato1-boss-normal",
    pesosRaridade: {
      comum: 0, incomum: 20, raro: 38, epico: 28, lendario: 12,
      imortal: 2, arcano: 0, cosmico: 0,
    },
    faixaOuro: [40, 100],
    chanceBau: 0.5,
    chanceItem: 1.0,
  },
  {
    id: "esp-ato1-boss-dificil",
    pesosRaridade: {
      comum: 0, incomum: 10, raro: 30, epico: 34, lendario: 18,
      imortal: 6, arcano: 2, cosmico: 0,
    },
    faixaOuro: [80, 180],
    chanceBau: 0.6,
    chanceItem: 1.0,
  },
  {
    id: "esp-ato1-boss-pesadelo",
    pesosRaridade: {
      comum: 0, incomum: 0, raro: 20, epico: 35, lendario: 28,
      imortal: 12, arcano: 4, cosmico: 1,
    },
    faixaOuro: [160, 360],
    chanceBau: 0.75,
    chanceItem: 1.0,
  },
  {
    id: "esp-ato1-boss-kernelPanic",
    pesosRaridade: {
      comum: 0, incomum: 0, raro: 10, epico: 28, lendario: 35,
      imortal: 18, arcano: 7, cosmico: 2,
    },
    faixaOuro: [320, 720],
    chanceBau: 1.0,
    chanceItem: 1.0,
  },
];
