// Bestiário do Ato I (data-driven).

import type { DefMonstro } from "../nucleo/dominio/tipos.js";

function atributos(
  vida: number, ataque: number, defesa: number, velocidadeAtaque: number,
): DefMonstro["atributos"] {
  return {
    vida, ataque, defesa, velocidadeAtaque,
    chanceCritico: 0.02, multiplicadorCritico: 1.5, rouboDeVida: 0, afinidades: {},
  };
}

export const MONSTROS: DefMonstro[] = [
  // ─── Inimigos comuns ──────────────────────────────────────────────────────
  {
    id: "bit-slime", nome: "Bit (Slime)", icone: "👾", familia: "slime", elemento: "nenhum",
    atributos: atributos(50, 10, 3, 0.8), idTabelaEspolio: "esp-ato1-normal", xpConcedido: 12,
    velocidadeMovimento: 0.015, alcanceAtaque: 0.18,
  },
  {
    id: "icone-zumbi", nome: "Ícone-Zumbi", icone: "🧟", familia: "icone", elemento: "nenhum",
    atributos: atributos(90, 16, 7, 0.7), idTabelaEspolio: "esp-ato1-normal", xpConcedido: 18,
    velocidadeMovimento: 0.012, alcanceAtaque: 0.18,
  },
  {
    id: "cursor-selvagem", nome: "Cursor Selvagem", icone: "🖱️", familia: "cursor", elemento: "nenhum",
    atributos: atributos(50, 20, 2, 1.4), idTabelaEspolio: "esp-ato1-normal", xpConcedido: 15,
    velocidadeMovimento: 0.030, alcanceAtaque: 0.18,
  },
  {
    id: "popup", nome: "Pop-up", icone: "💬", familia: "popup", elemento: "nenhum",
    atributos: atributos(35, 10, 1, 1.6), idTabelaEspolio: "esp-ato1-normal", xpConcedido: 9,
    velocidadeMovimento: 0.025, alcanceAtaque: 0.18,
  },

  // ─── Bosses de área ───────────────────────────────────────────────────────
  {
    id: "a-lixeira", nome: "A Lixeira", icone: "🗑️", familia: "boss", elemento: "nenhum",
    atributos: { ...atributos(550, 28, 15, 0.7), chanceCritico: 0.05 },
    idTabelaEspolio: "esp-ato1-boss-normal", xpConcedido: 120,
    velocidadeMovimento: 0.010, alcanceAtaque: 0.20,
  },
  {
    id: "cursor-chefe", nome: "Cursor Corrompido", icone: "🖱️", familia: "boss", elemento: "raio",
    atributos: { ...atributos(500, 34, 12, 1.0), chanceCritico: 0.08 },
    idTabelaEspolio: "esp-ato1-boss-normal", xpConcedido: 140,
    velocidadeMovimento: 0.018, alcanceAtaque: 0.18,
  },
  {
    id: "popup-gigante", nome: "Pop-up Gigante", icone: "💬", familia: "boss", elemento: "nenhum",
    atributos: { ...atributos(650, 24, 8, 0.6), chanceCritico: 0.04 },
    idTabelaEspolio: "esp-ato1-boss-normal", xpConcedido: 150,
    velocidadeMovimento: 0.008, alcanceAtaque: 0.22,
  },
  {
    id: "guardiao-do-espaco", nome: "Guardião do Espaço", icone: "🤖", familia: "boss", elemento: "nenhum",
    atributos: { ...atributos(1200, 45, 22, 0.8), chanceCritico: 0.1 },
    idTabelaEspolio: "esp-ato1-boss-normal", xpConcedido: 280,
    velocidadeMovimento: 0.010, alcanceAtaque: 0.20,
  },
];
