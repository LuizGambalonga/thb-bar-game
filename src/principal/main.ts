// Composition root: instancia e conecta os serviços (injeção de dependências).

import { app, ipcMain } from "electron";
import {
  CANAL_INTENCAO, CANAL_RESUMO_OFFLINE, CANAL_SOLICITAR_META,
} from "../compartilhado/contratos.js";
import type { Intencao, SnapshotCombate, SnapshotMeta } from "../compartilhado/contratos.js";
import { criarJogoNovo } from "../nucleo/save/JogoSalvo.js";
import { EstadoDoJogo } from "./EstadoDoJogo.js";
import { GerenciadorDeJanela } from "./GerenciadorDeJanela.js";
import { LacoDeJogo } from "./LacoDeJogo.js";
import { RepositorioDeSaveArquivo } from "./ServicoDeSave.js";

const INTERVALO_AUTOSAVE_MS = 60_000;

function iniciar(): void {
  const repositorio = new RepositorioDeSaveArquivo(app.getPath("userData"));

  const carregado = repositorio.carregar();
  const ehJogoNovo = carregado === null;
  const semente = Date.now() & 0xffffffff;
  const salvo = carregado ?? criarJogoNovo(Date.now(), semente);

  const estado = new EstadoDoJogo(salvo);

  // Rendimento offline (somente se havia save anterior).
  let resumoOffline = null as ReturnType<EstadoDoJogo["aplicarRendimentoOffline"]> | null;
  if (!ehJogoNovo) {
    const segundosAusente = Math.max(0, (Date.now() - salvo.ultimoAcesso) / 1000);
    if (segundosAusente > 30) {
      resumoOffline = estado.aplicarRendimentoOffline(segundosAusente);
    }
  }

  let pausado = false;

  const gerenciador = new GerenciadorDeJanela({
    posicaoInicial: salvo.config.posicaoJanela,
    aoMover: (x, y) => { salvo.config.posicaoJanela = [x, y]; },
    aoAlternarPausa: () => {
      pausado = !pausado;
      estado.aplicarIntencao({ tipo: pausado ? "pausar" : "retomar" });
      return pausado;
    },
    aoSair: () => repositorio.salvar(estado.serializar(Date.now())),
  });

  const enviarCombate = (s: SnapshotCombate) => gerenciador.emitirParaTodos("jogo:snapshotCombate", s);
  const enviarMeta = (s: SnapshotMeta) => gerenciador.emitirParaTodos("jogo:snapshotMeta", s);
  const laco = new LacoDeJogo(estado, enviarCombate, enviarMeta);

  ipcMain.on(CANAL_INTENCAO, (_evento, intencao: Intencao) => {
    if (intencao.tipo === "sair") {
      repositorio.salvar(estado.serializar(Date.now()));
      app.quit();
      return;
    }
    if (intencao.tipo === "minimizar") {
      gerenciador.minimizar();
      return;
    }
    if (intencao.tipo === "expandirJanela") {
      const painel = intencao.lado === "esquerda" ? "mochila" : "portal";
      gerenciador.abrirOuFecharPainel(painel);
      return;
    }
    if (intencao.tipo === "encolherJanela") {
      const painel = intencao.lado === "esquerda" ? "mochila" : "portal";
      gerenciador.fecharPainel(painel);
      return;
    }
    estado.aplicarIntencao(intencao);
  });
  ipcMain.on(CANAL_SOLICITAR_META, () => laco.emitirMetaAgora());

  gerenciador.criar();
  laco.iniciar();

  // Envia o resumo offline assim que a UI terminar de carregar.
  gerenciador.conteudoWeb?.once("did-finish-load", () => {
    laco.emitirMetaAgora();
    if (resumoOffline) gerenciador.enviar(CANAL_RESUMO_OFFLINE, resumoOffline);
  });

  setInterval(() => repositorio.salvar(estado.serializar(Date.now())), INTERVALO_AUTOSAVE_MS);

  app.on("before-quit", () => repositorio.salvar(estado.serializar(Date.now())));
}

app.whenReady().then(iniciar);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
