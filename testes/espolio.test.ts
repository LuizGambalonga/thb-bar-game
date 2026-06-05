import { describe, it, expect } from "vitest";
import { GeradorAleatorio } from "../src/nucleo/aleatorio/GeradorAleatorio.js";
import { GeradorDeItens } from "../src/nucleo/espolio/GeradorDeItens.js";
import { afixosPorId, itensPorId, obterTabelaEspolio } from "../src/conteudo/index.js";
import type { Raridade } from "../src/nucleo/dominio/tipos.js";

describe("geração de espólio", () => {
  it("nunca dropa raridade com peso zero (cósmico no normal)", () => {
    const gerador = new GeradorDeItens(itensPorId, afixosPorId);
    const tabela = obterTabelaEspolio("esp-ato1-normal");
    const rng = new GeradorAleatorio(42);
    const contagem: Partial<Record<Raridade, number>> = {};
    for (let i = 0; i < 3000; i++) {
      const drop = gerador.rolarDrop(tabela, rng);
      if (drop.item) contagem[drop.item.raridade] = (contagem[drop.item.raridade] ?? 0) + 1;
    }
    expect(contagem.cosmico ?? 0).toBe(0);
    expect(contagem.imortal ?? 0).toBe(0);
    expect((contagem.comum ?? 0)).toBeGreaterThan(contagem.epico ?? 0);
  });

  it("ouro fica dentro da faixa da tabela", () => {
    const gerador = new GeradorDeItens(itensPorId, afixosPorId);
    const tabela = obterTabelaEspolio("esp-ato1-normal");
    const rng = new GeradorAleatorio(7);
    for (let i = 0; i < 200; i++) {
      const drop = gerador.rolarDrop(tabela, rng);
      expect(drop.ouro).toBeGreaterThanOrEqual(tabela.faixaOuro[0]);
      expect(drop.ouro).toBeLessThanOrEqual(tabela.faixaOuro[1]);
    }
  });

  it("itens mais raros têm mais afixos", () => {
    const gerador = new GeradorDeItens(itensPorId, afixosPorId);
    const rng = new GeradorAleatorio(3);
    const comum = gerador.criarItem("comum", rng);
    const epico = gerador.criarItem("epico", rng);
    expect(comum!.afixos.length).toBe(0);
    expect(epico!.afixos.length).toBeGreaterThan(0);
  });

  it("é determinístico com a mesma semente", () => {
    const g1 = new GeradorDeItens(itensPorId, afixosPorId);
    const g2 = new GeradorDeItens(itensPorId, afixosPorId);
    const tabela = obterTabelaEspolio("esp-ato1-chefe");
    const d1 = g1.rolarDrop(tabela, new GeradorAleatorio(123));
    const d2 = g2.rolarDrop(tabela, new GeradorAleatorio(123));
    expect(d1.item?.raridade).toBe(d2.item?.raridade);
    expect(d1.ouro).toBe(d2.ouro);
  });
});
