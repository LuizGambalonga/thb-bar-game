// Contratos de comunicação entre processo principal e apresentação (IPC tipado).
// Intenções sobem (renderer → main); snapshots descem (main → renderer).

import type {
  Dificuldade, Elemento, EspacoEquipamento, EstadoMovimento, IdClasse,
  PosicaoFormacao, Raridade,
} from "../nucleo/dominio/tipos.js";

export const CANAL_INTENCAO = "jogo:intencao";
export const CANAL_SNAPSHOT_COMBATE = "jogo:snapshotCombate";
export const CANAL_SNAPSHOT_META = "jogo:snapshotMeta";
export const CANAL_RESUMO_OFFLINE = "jogo:resumoOffline";
export const CANAL_SOLICITAR_META = "jogo:solicitarMeta";

export type Intencao =
  | { tipo: "equiparItem"; uid: string; slotHeroi: number }
  | { tipo: "desequipar"; slotHeroi: number; espaco: EspacoEquipamento }
  | { tipo: "venderItem"; uid: string }
  | { tipo: "venderEmLote"; raridadeMaxima: Raridade }
  | { tipo: "desbloquearHeroi"; idClasse: IdClasse }
  | { tipo: "desbloquearSlotParty" }
  | { tipo: "definirHeroiNoSlot"; slotHeroi: number; idClasse: IdClasse }
  | { tipo: "definirFormacao"; slotHeroi: number; posicao: PosicaoFormacao }
  | { tipo: "trocarFase"; idFase: string }
  | { tipo: "definirVelocidade"; velocidade: 1 | 2 | 3 }
  | { tipo: "definirTetoOffline"; horas: number }
  | { tipo: "pausar" }
  | { tipo: "retomar" }
  | { tipo: "minimizar" }
  | { tipo: "expandirJanela"; lado: "esquerda" | "direita"; larguraPainel: number }
  | { tipo: "encolherJanela"; lado: "esquerda" | "direita" }
  | { tipo: "resetarJogo" }
  | { tipo: "sair" };

export interface CombatenteSnapshot {
  id: string;
  nome: string;
  icone: string;
  spriteId: string;
  projetil: string | null;
  raridadeEquip: Raridade | null; // raridade do melhor item equipado (aura)
  temArma: boolean;
  ehHeroi: boolean;
  vivo: boolean;
  vidaPct: number; // 0..1
  x: number; // 0..1 (posição horizontal na arena)
  estadoMov: EstadoMovimento;
  elemento: Elemento;
}

export type EventoSnapshot =
  | { tipo: "dano"; idAutor: string; idAlvo: string; quantidade: number; critico: boolean }
  | { tipo: "habilidade"; idAutor: string; idHabilidade: string; tipoSkill: string; idsAlvos: string[]; elemento: Elemento }
  | { tipo: "morte"; id: string }
  | { tipo: "drop"; raridade: Raridade }
  | { tipo: "mochilaCheia" }
  | { tipo: "ressurreicao"; idHeroi: string };

export interface SnapshotCombate {
  tick: number;
  estado: "lutando" | "intervalo" | "concluida";
  indiceOnda: number;
  totalOndas: number;
  herois: CombatenteSnapshot[];
  inimigos: CombatenteSnapshot[];
  eventos: EventoSnapshot[];
}

export interface AtributoExibivel {
  chave: string;
  valor: number;
}

export interface ItemSnapshot {
  uid: string;
  idDef: string;
  nome: string;
  espaco: EspacoEquipamento;
  raridade: Raridade;
  poder: number;
  atributos: AtributoExibivel[];
  equipadoPorSlot: number | null;
  classesAfins: IdClasse[];
}

export interface HabilidadeSnapshot {
  id: string;
  nome: string;
  tipo: string;
  cooldownSeg: number;
  cooldownRestanteSeg?: number; // apenas para habilidades com cooldown longo (ressuscitar)
}

export interface HeroiMetaSnapshot {
  slot: number;
  idClasse: IdClasse;
  nome: string;
  nivel: number;
  xp: number;
  xpProximo: number;
  vivo: boolean;
  posicao: PosicaoFormacao;
  danoPorSegundo: number;
  equipamento: Partial<Record<EspacoEquipamento, string>>;
  // status detalhado
  vidaAtual: number;
  vidaMaxima: number;
  ataque: number;
  defesa: number;
  velocidadeAtaque: number;
  chanceCritico: number;
  multiplicadorCritico: number;
  elemento: Elemento;
  habilidades: HabilidadeSnapshot[];
}

export interface ClasseDisponivel {
  idClasse: IdClasse;
  nome: string;
  papel: string;
  custoOuro: number;
  desbloqueado: boolean;
  spriteId: string;
  vida: number;
  ataque: number;
  defesa: number;
  emUso: boolean;
}

export interface MapaInfo {
  id: string;
  nome: string;
  ato: number;
  dificuldade: string;
  limpa: boolean;
  desbloqueada: boolean;
  atual: boolean;
}

export interface SnapshotMeta {
  ouro: number;
  velocidade: 1 | 2 | 3;
  pausado: boolean;
  tetoOfflineHoras: number;
  heroisDesbloqueados: IdClasse[];
  slotsDesbloqueados: number;
  custoProximoSlot: number | null;
  classes: ClasseDisponivel[];
  mapas: MapaInfo[];
  herois: (HeroiMetaSnapshot | null)[];
  inventario: ItemSnapshot[];
  fase: { id: string; nome: string; dificuldade: Dificuldade; ato: number };
  indiceOnda: number;
  totalOndas: number;
}

export interface ResumoOffline {
  segundosCreditados: number;
  ouro: number;
  xp: number;
  atingiuTeto: boolean;
}

/** API exposta no renderer via contextBridge (window.jogo). */
export interface ApiJogo {
  enviarIntencao(intencao: Intencao): void;
  solicitarMeta(): void;
  aoAtualizarCombate(callback: (s: SnapshotCombate) => void): () => void;
  aoAtualizarMeta(callback: (s: SnapshotMeta) => void): () => void;
  aoMostrarResumoOffline(callback: (r: ResumoOffline) => void): () => void;
}

declare global {
  interface Window {
    jogo: ApiJogo;
  }
}
