import { describe, it, expect } from "vitest";
import { GeradorAleatorio } from "../src/nucleo/aleatorio/GeradorAleatorio.js";

describe("GeradorAleatorio", () => {
  it("é determinístico: mesma semente produz a mesma sequência", () => {
    const a = new GeradorAleatorio(12345);
    const b = new GeradorAleatorio(12345);
    const seqA = Array.from({ length: 10 }, () => a.proximo());
    const seqB = Array.from({ length: 10 }, () => b.proximo());
    expect(seqA).toEqual(seqB);
  });

  it("produz valores em [0,1)", () => {
    const rng = new GeradorAleatorio(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.proximo();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("serializa e restaura o estado mantendo a sequência", () => {
    const rng = new GeradorAleatorio(99);
    rng.proximo();
    rng.proximo();
    const estado = rng.serializar();
    const continuacaoOriginal = [rng.proximo(), rng.proximo()];
    const restaurado = GeradorAleatorio.restaurar(estado);
    const continuacaoRestaurada = [restaurado.proximo(), restaurado.proximo()];
    expect(continuacaoRestaurada).toEqual(continuacaoOriginal);
  });

  it("escolherPorPeso ignora pesos zero", () => {
    const rng = new GeradorAleatorio(1);
    const contagem = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 500; i++) {
      contagem[rng.escolherPorPeso({ a: 1, b: 1, c: 0 })]++;
    }
    expect(contagem.c).toBe(0);
    expect(contagem.a).toBeGreaterThan(0);
    expect(contagem.b).toBeGreaterThan(0);
  });
});
