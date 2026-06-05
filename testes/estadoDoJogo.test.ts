import { describe, it, expect } from "vitest";
import { EstadoDoJogo } from "../src/principal/EstadoDoJogo.js";
import { criarJogoNovo } from "../src/nucleo/save/JogoSalvo.js";

describe("EstadoDoJogo — party (Fase 5)", () => {
  it("desbloqueia um slot de party gastando ouro", () => {
    const salvo = criarJogoNovo(0, 1);
    salvo.ouro = 99999;
    const estado = new EstadoDoJogo(salvo);
    estado.aplicarIntencao({ tipo: "desbloquearSlotParty" });
    expect(estado.serializar(0).party.slotsDesbloqueados).toBe(2);
  });

  it("não desbloqueia slot sem ouro suficiente", () => {
    const salvo = criarJogoNovo(0, 1);
    salvo.ouro = 0;
    const estado = new EstadoDoJogo(salvo);
    estado.aplicarIntencao({ tipo: "desbloquearSlotParty" });
    expect(estado.serializar(0).party.slotsDesbloqueados).toBe(1);
  });

  it("desbloqueia uma classe e a posiciona num slot", () => {
    const salvo = criarJogoNovo(0, 1);
    salvo.ouro = 99999;
    const estado = new EstadoDoJogo(salvo);
    estado.aplicarIntencao({ tipo: "desbloquearSlotParty" });
    estado.aplicarIntencao({ tipo: "desbloquearHeroi", idClasse: "patrulheiro" });
    estado.aplicarIntencao({ tipo: "definirHeroiNoSlot", slotHeroi: 1, idClasse: "patrulheiro" });

    const meta = estado.snapshotMeta();
    expect(meta.heroisDesbloqueados).toContain("patrulheiro");
    expect(meta.herois[1]?.idClasse).toBe("patrulheiro");
    expect(meta.classes.find((c) => c.idClasse === "patrulheiro")?.desbloqueado).toBe(true);
  });

  it("aplica formação frente/trás no herói", () => {
    const salvo = criarJogoNovo(0, 1);
    const estado = new EstadoDoJogo(salvo);
    estado.aplicarIntencao({ tipo: "definirFormacao", slotHeroi: 0, posicao: "tras" });
    expect(estado.snapshotMeta().herois[0]?.posicao).toBe("tras");
  });
});
