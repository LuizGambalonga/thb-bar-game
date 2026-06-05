// Ponto de entrada da apresentação: conecta os snapshots à visão e aos painéis.

import { VisaoDeCombate } from "./VisaoDeCombate.js";
import { PainelInterface } from "./PainelInterface.js";

function iniciar(): void {
  const canvas = document.getElementById("arena") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Canvas da arena não encontrado");

  const visao = new VisaoDeCombate(canvas);
  const painel = new PainelInterface(document);

  window.jogo.aoAtualizarCombate((s) => visao.renderizar(s));
  window.jogo.aoAtualizarMeta((s) => painel.atualizar(s));
  window.jogo.aoMostrarResumoOffline((r) => painel.mostrarResumoOffline(r));

  window.jogo.solicitarMeta();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}
