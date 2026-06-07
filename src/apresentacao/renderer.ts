// Ponto de entrada da apresentação: conecta os snapshots à visão e aos painéis.

import { VisaoDeCombate } from "./VisaoDeCombate.js";
import { PainelInterface } from "./PainelInterface.js";
import { preCarregarImagensHerois } from "./arte/imagensHerois.js";

function iniciar(): void {
  preCarregarImagensHerois();
  const params = new URLSearchParams(window.location.search);
  const modoPainel = params.get("painel") as "mochila" | "portal" | null;

  if (modoPainel) {
    // Janela flutuante: sem canvas, sem visão de combate.
    document.body.classList.add("modo-painel");
    const idPainel = modoPainel === "mochila" ? "painel-mochila" : "painel-portal";
    document.getElementById(idPainel)?.classList.remove("oculto");

    const painel = new PainelInterface(document);
    window.jogo.aoAtualizarMeta((s) => painel.atualizar(s));
    window.jogo.solicitarMeta();
    return;
  }

  // Modo normal: jogo completo com canvas.
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
