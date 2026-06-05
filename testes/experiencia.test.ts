import { describe, it, expect } from "vitest";
import { ganharXp, xpParaProximoNivel } from "../src/nucleo/progressao/Experiencia.js";

describe("experiência", () => {
  it("xp para o próximo nível cresce com o nível", () => {
    expect(xpParaProximoNivel(2)).toBeGreaterThan(xpParaProximoNivel(1));
  });

  it("sobe um nível ao atingir o necessário", () => {
    const necessario = xpParaProximoNivel(1);
    const r = ganharXp(1, 0, necessario);
    expect(r.nivel).toBe(2);
    expect(r.niveisGanhos).toBe(1);
    expect(r.xp).toBe(0);
  });

  it("sobe múltiplos níveis com muito xp de uma vez", () => {
    const r = ganharXp(1, 0, 100000);
    expect(r.niveisGanhos).toBeGreaterThan(1);
  });

  it("acumula xp sem subir quando insuficiente", () => {
    const r = ganharXp(1, 0, 10);
    expect(r.nivel).toBe(1);
    expect(r.xp).toBe(10);
  });
});
