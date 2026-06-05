import { describe, it, expect } from "vitest";
import { MotorDeCombate } from "../src/nucleo/combate/MotorDeCombate.js";
import type { DadosHeroiParaCombate, EventoCombate } from "../src/nucleo/combate/MotorDeCombate.js";
import { GeradorAleatorio } from "../src/nucleo/aleatorio/GeradorAleatorio.js";
import { obterMonstro } from "../src/conteudo/index.js";
import type { Atributos, DefFase } from "../src/nucleo/dominio/tipos.js";

const FASE_TESTE: DefFase = {
  id: "teste", nome: "Teste", ato: 1, dificuldade: "normal", chefe: "guardiao-do-espaco",
  ondas: [
    { idsMonstros: ["bit-slime"], quantidade: 2 },
    { idsMonstros: ["popup"], quantidade: 2 },
  ],
};

function heroiForte(): DadosHeroiParaCombate {
  const atributos: Atributos = {
    vida: 500, ataque: 60, defesa: 30, chanceCritico: 0.1,
    multiplicadorCritico: 1.5, velocidadeAtaque: 2, rouboDeVida: 0, afinidades: {},
  };
  return { slot: 0, nome: "Cavaleiro", elemento: "nenhum", atributos, posicao: "frente" };
}

function rodar(seed: number, ticks: number): EventoCombate[] {
  const motor = new MotorDeCombate(FASE_TESTE, [heroiForte()], obterMonstro);
  const rng = new GeradorAleatorio(seed);
  const eventos: EventoCombate[] = [];
  for (let i = 0; i < ticks; i++) eventos.push(...motor.avancarTick(rng));
  return eventos;
}

describe("MotorDeCombate (golden)", () => {
  it("é determinístico: mesma semente produz os mesmos eventos", () => {
    const a = rodar(2024, 600);
    const b = rodar(2024, 600);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it("herói forte limpa a fase (gera faseConcluida)", () => {
    const eventos = rodar(2024, 600);
    expect(eventos.some((e) => e.tipo === "morteInimigo")).toBe(true);
    expect(eventos.some((e) => e.tipo === "faseConcluida")).toBe(true);
  });

  it("party derrotada revive e reinicia (sem travar)", () => {
    const fraco: DadosHeroiParaCombate = {
      slot: 0, nome: "Frágil", elemento: "nenhum",
      atributos: {
        vida: 5, ataque: 1, defesa: 0, chanceCritico: 0,
        multiplicadorCritico: 1, velocidadeAtaque: 0.5, rouboDeVida: 0, afinidades: {},
      },
      posicao: "frente",
    };
    const motor = new MotorDeCombate(FASE_TESTE, [fraco], obterMonstro);
    const rng = new GeradorAleatorio(1);
    let derrotas = 0;
    for (let i = 0; i < 400; i++) {
      for (const e of motor.avancarTick(rng)) if (e.tipo === "partyDerrotada") derrotas++;
    }
    expect(derrotas).toBeGreaterThan(0);
    // Continua simulando: o herói segue vivo (revivido) ao final.
    expect(motor.heroisEmCombate[0]!.vivo).toBe(true);
  });
});
