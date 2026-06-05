// Ponte segura entre o renderer e o processo principal (contextIsolation).

import { contextBridge, ipcRenderer } from "electron";
import {
  CANAL_INTENCAO,
  CANAL_RESUMO_OFFLINE,
  CANAL_SNAPSHOT_COMBATE,
  CANAL_SNAPSHOT_META,
  CANAL_SOLICITAR_META,
} from "../compartilhado/contratos.js";
import type {
  ApiJogo, Intencao, ResumoOffline, SnapshotCombate, SnapshotMeta,
} from "../compartilhado/contratos.js";

function inscrever<T>(canal: string, callback: (dados: T) => void): () => void {
  const ouvinte = (_evento: unknown, dados: T) => callback(dados);
  ipcRenderer.on(canal, ouvinte);
  return () => ipcRenderer.off(canal, ouvinte);
}

const api: ApiJogo = {
  enviarIntencao: (intencao: Intencao) => ipcRenderer.send(CANAL_INTENCAO, intencao),
  solicitarMeta: () => ipcRenderer.send(CANAL_SOLICITAR_META),
  aoAtualizarCombate: (cb) => inscrever<SnapshotCombate>(CANAL_SNAPSHOT_COMBATE, cb),
  aoAtualizarMeta: (cb) => inscrever<SnapshotMeta>(CANAL_SNAPSHOT_META, cb),
  aoMostrarResumoOffline: (cb) => inscrever<ResumoOffline>(CANAL_RESUMO_OFFLINE, cb),
};

contextBridge.exposeInMainWorld("jogo", api);
