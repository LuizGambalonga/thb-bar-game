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
    atributos: atributos(28, 6, 2, 0.8), idTabelaEspolio: "esp-ato1-normal", xpConcedido: 8,
  },
  {
    id: "icone-zumbi", nome: "Ícone-Zumbi", icone: "🧟", familia: "icone", elemento: "nenhum",
    atributos: atributos(42, 8, 4, 0.7), idTabelaEspolio: "esp-ato1-normal", xpConcedido: 12,
  },
  {
    id: "cursor-selvagem", nome: "Cursor Selvagem", icone: "🖱️", familia: "cursor", elemento: "nenhum",
    atributos: atributos(22, 10, 1, 1.4), idTabelaEspolio: "esp-ato1-normal", xpConcedido: 10,
  },
  {
    id: "popup", nome: "Pop-up", icone: "💬", familia: "popup", elemento: "nenhum",
    atributos: atributos(16, 5, 0, 1.6), idTabelaEspolio: "esp-ato1-normal", xpConcedido: 6,
  },

  // ─── Bosses de área ───────────────────────────────────────────────────────
  {
    id: "a-lixeira", nome: "A Lixeira", icone: "🗑️", familia: "boss", elemento: "nenhum",
    atributos: { ...atributos(260, 16, 10, 0.7), chanceCritico: 0.05 },
    idTabelaEspolio: "esp-ato1-boss-normal", xpConcedido: 80,
  },
  {
    id: "cursor-chefe", nome: "Cursor Corrompido", icone: "🖱️", familia: "boss", elemento: "raio",
    atributos: { ...atributos(220, 18, 6, 1.0), chanceCritico: 0.08 },
    idTabelaEspolio: "esp-ato1-boss-normal", xpConcedido: 90,
  },
  {
    id: "popup-gigante", nome: "Pop-up Gigante", icone: "💬", familia: "boss", elemento: "nenhum",
    atributos: { ...atributos(300, 12, 4, 0.6), chanceCritico: 0.04 },
    idTabelaEspolio: "esp-ato1-boss-normal", xpConcedido: 100,
  },
  {
    id: "guardiao-do-espaco", nome: "Guardião do Espaço", icone: "🤖", familia: "boss", elemento: "nenhum",
    atributos: { ...atributos(480, 22, 15, 0.8), chanceCritico: 0.1 },
    idTabelaEspolio: "esp-ato1-boss-normal", xpConcedido: 180,
  },
];
