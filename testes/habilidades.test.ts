import { describe, it, expect } from "vitest";
import { MotorDeCombate } from "../src/nucleo/combate/MotorDeCombate.js";
import type { DadosHeroiParaCombate } from "../src/nucleo/combate/MotorDeCombate.js";
import { GeradorAleatorio } from "../src/nucleo/aleatorio/GeradorAleatorio.js";
import { obterMonstro } from "../src/conteudo/index.js";
import type { Atributos, DefFase, DefHabilidade } from "../src/nucleo/dominio/tipos.js";

function atributos(p: Partial<Atributos>): Atributos {
  return {
    vida: 200, ataque: 20, defesa: 10, chanceCritico: 0,
    multiplicadorCritico: 1.5, velocidadeAtaque: 1, rouboDeVida: 0, afinidades: {}, ...p,
  };
}

const FASE_TRES_INIMIGOS: DefFase = {
  id: "t", nome: "Três Inimigos", ato: 1, dificuldade: "normal", chefe: "guardiao-do-espaco",
  ondas: [{ idsMonstros: ["bit-slime"], quantidade: 3 }],
};

describe("habilidades no combate", () => {
  it("habilidade AoE (todosInimigos) atinge vários inimigos no mesmo tick", () => {
    const aoe: DefHabilidade = {
      id: "aoe", nome: "Estouro", cooldownTicks: 3, tipo: "dano", potencia: 1, alvo: "todosInimigos",
    };
    const heroi: DadosHeroiParaCombate = {
      slot: 0, nome: "Feiticeira", elemento: "fogo",
      atributos: atributos({ velocidadeAtaque: 1 }), posicao: "frente", habilidades: [aoe],
    };
    const motor = new MotorDeCombate(FASE_TRES_INIMIGOS, [heroi], obterMonstro);
    const rng = new GeradorAleatorio(5);

    let alvosAtingidosNaHabilidade = 0;
    for (let i = 0; i < 20; i++) {
      const eventos = motor.avancarTick(rng);
      if (eventos.some((e) => e.tipo === "habilidade")) {
        const alvos = new Set(
          eventos.filter((e) => e.tipo === "dano").map((e) => (e as { idAlvo: string }).idAlvo),
        );
        alvosAtingidosNaHabilidade = Math.max(alvosAtingidosNaHabilidade, alvos.size);
      }
    }
    expect(alvosAtingidosNaHabilidade).toBeGreaterThan(1);
  });

  it("habilidade de cura emite evento de cura", () => {
    const cura: DefHabilidade = {
      id: "cura", nome: "Coletar", cooldownTicks: 4, tipo: "cura", potencia: 1.5, alvo: "menorVidaAliado",
    };
    const tanque: DadosHeroiParaCombate = {
      slot: 0, nome: "Cavaleiro", elemento: "nenhum",
      atributos: atributos({ vida: 120, defesa: 5 }), posicao: "frente",
    };
    const sacerdote: DadosHeroiParaCombate = {
      slot: 1, nome: "Sacerdote", elemento: "nenhum",
      atributos: atributos({ ataque: 10 }), posicao: "tras", habilidades: [cura],
    };
    const motor = new MotorDeCombate(FASE_TRES_INIMIGOS, [tanque, sacerdote], obterMonstro);
    const rng = new GeradorAleatorio(9);

    let curas = 0;
    for (let i = 0; i < 30; i++) {
      for (const e of motor.avancarTick(rng)) if (e.tipo === "cura") curas++;
    }
    expect(curas).toBeGreaterThan(0);
  });
});
