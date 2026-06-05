import { describe, it, expect } from "vitest";
import { calcularRendimentoOffline } from "../src/nucleo/progressao/RendimentoOffline.js";

describe("rendimento offline", () => {
  it("offline rende menos que o equivalente ativo (eficiência < 1)", () => {
    const segundos = 3600;
    const ouroPorSeg = 10;
    const r = calcularRendimentoOffline(segundos, ouroPorSeg, 0, 0.4);
    expect(r.ouro).toBeLessThan(segundos * ouroPorSeg);
    expect(r.ouro).toBe(Math.floor(segundos * ouroPorSeg * 0.4));
  });

  it("respeita o teto de horas", () => {
    const cemHoras = 100 * 3600;
    const r = calcularRendimentoOffline(cemHoras, 1, 1, 0.4, 8);
    expect(r.segundosCreditados).toBe(8 * 3600);
    expect(r.atingiuTeto).toBe(true);
  });

  it("nunca credita tempo negativo", () => {
    const r = calcularRendimentoOffline(-50, 10, 10);
    expect(r.segundosCreditados).toBe(0);
    expect(r.ouro).toBe(0);
  });
});
