import { describe, it, expect } from "vitest";
import {
  atributoNoNivel, calcularDano, multiplicadorElemental,
} from "../src/nucleo/atributos/CalculadoraDeAtributos.js";
import { GeradorAleatorio } from "../src/nucleo/aleatorio/GeradorAleatorio.js";
import type { Atributos } from "../src/nucleo/dominio/tipos.js";

function atributos(parcial: Partial<Atributos>): Atributos {
  return {
    vida: 100, ataque: 10, defesa: 0, chanceCritico: 0,
    multiplicadorCritico: 1.5, velocidadeAtaque: 1, rouboDeVida: 0, afinidades: {},
    ...parcial,
  };
}

describe("counter elemental", () => {
  it("fogo vence bio (vantagem)", () => {
    expect(multiplicadorElemental("fogo", "bio")).toBe(1.25);
  });
  it("bio contra fogo (desvantagem)", () => {
    expect(multiplicadorElemental("bio", "fogo")).toBe(0.8);
  });
  it("nenhum é neutro", () => {
    expect(multiplicadorElemental("nenhum", "fogo")).toBe(1.0);
  });
});

describe("escala por nível", () => {
  it("nível 1 mantém o valor base", () => {
    expect(atributoNoNivel(100, 1)).toBe(100);
  });
  it("cresce com o nível", () => {
    expect(atributoNoNivel(100, 5)).toBeGreaterThan(100);
  });
});

describe("calcularDano", () => {
  it("aplica mitigação por defesa", () => {
    const rng = new GeradorAleatorio(1);
    const semDefesa = calcularDano(atributos({ ataque: 100 }), "nenhum", atributos({ defesa: 0 }), "nenhum", rng);
    const rng2 = new GeradorAleatorio(1);
    const comDefesa = calcularDano(atributos({ ataque: 100 }), "nenhum", atributos({ defesa: 100 }), "nenhum", rng2);
    expect(comDefesa.dano).toBeLessThan(semDefesa.dano);
  });

  it("dano mínimo é 1", () => {
    const rng = new GeradorAleatorio(1);
    const r = calcularDano(atributos({ ataque: 1 }), "nenhum", atributos({ defesa: 9999 }), "nenhum", rng);
    expect(r.dano).toBeGreaterThanOrEqual(1);
  });

  it("crítico garantido quando chance = 1", () => {
    const rng = new GeradorAleatorio(1);
    const r = calcularDano(atributos({ ataque: 10, chanceCritico: 1 }), "nenhum", atributos({ defesa: 0 }), "nenhum", rng);
    expect(r.critico).toBe(true);
  });
});
