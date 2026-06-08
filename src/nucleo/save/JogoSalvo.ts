// Estrutura do save, criação de jogo novo e migrações. TS puro.

import { MAX_PARTY, VERSAO_ESQUEMA_ATUAL } from "../dominio/constantes.js";
import type { EstadoParty, IdClasse, ItemInstancia } from "../dominio/tipos.js";

/** Progresso persistido de um herói que não está no slot ativo. */
export interface EstadoHeroBancado {
  nivel: number;
  xp: number;
}

export interface JogoSalvo {
  versaoEsquema: number;
  criadoEm: number;
  ultimoAcesso: number;
  estadoRng: { combate: string; espolio: string };
  ouro: number;
  party: EstadoParty;
  heroisDesbloqueados: IdClasse[];
  /** Nível e XP de cada herói que já foi usado mas está fora do slot. */
  heroisBancados: Partial<Record<IdClasse, EstadoHeroBancado>>;
  inventario: ItemInstancia[];
  materiais: Record<string, number>;
  cubo: { funcoesDesbloqueadas: string[] };
  runas: { alocados: Record<string, number>; pontosDisponiveis: number };
  progresso: {
    idFaseAtual: string;
    fasesLimpas: string[];
    indiceOndaAtual: number;
    logsDesbloqueados: string[];
  };
  config: {
    velocidade: 1 | 2 | 3;
    mudo: boolean;
    reduzirFlashes: boolean;
    escalaUi: number;
    posicaoJanela?: [number, number];
    modo: "compacto" | "expandido";
    tetoOfflineHoras: number;
  };
}

export function criarJogoNovo(agora: number, semente: number): JogoSalvo {
  const slots: EstadoParty["slots"] = Array.from({ length: MAX_PARTY }, () => null);
  slots[0] = {
    idClasse: "cavaleiro",
    nivel: 1,
    xp: 0,
    vivo: true,
    vidaAtual: 120,
    equipamento: {},
  };
  return {
    versaoEsquema: VERSAO_ESQUEMA_ATUAL,
    criadoEm: agora,
    ultimoAcesso: agora,
    estadoRng: {
      combate: String(semente >>> 0),
      espolio: String((semente ^ 0x9e3779b9) >>> 0),
    },
    ouro: 0,
    party: {
      slots,
      slotsDesbloqueados: 1,
      formacao: { 0: "frente" },
    },
    // Todas as classes liberadas para escolha desde o início (013).
    heroisDesbloqueados: ["cavaleiro", "patrulheiro", "feiticeira", "sacerdote", "cacador", "carrasco"],
    heroisBancados: {},
    inventario: [],
    materiais: {},
    cubo: { funcoesDesbloqueadas: [] },
    runas: { alocados: {}, pontosDisponiveis: 0 },
    progresso: {
      idFaseAtual: "a1d-planicies",
      fasesLimpas: [],
      indiceOndaAtual: 0,
      logsDesbloqueados: [],
    },
    config: {
      velocidade: 1,
      mudo: false,
      reduzirFlashes: false,
      escalaUi: 1,
      modo: "compacto",
      tetoOfflineHoras: 2,
    },
  };
}

const MAPA_FASE_LEGADA: Record<string, string> = {
  "ato1-normal": "a1d-planicies", "ato1-dificil": "a1d-bits",
  "ato1-pesadelo": "a1p-bits", "ato1-kernelPanic": "a1k-bits",
};
const PREFIXOS_FASE_VALIDOS = ["a1n-", "a1d-", "a1p-", "a1k-"];
function normalizarFase(id: string): string {
  if (PREFIXOS_FASE_VALIDOS.some((p) => id.startsWith(p))) return id;
  return MAPA_FASE_LEGADA[id] ?? "a1d-planicies";
}

/** Migrações encadeadas: índice = versão de origem → produz a versão seguinte. */
export const migracoes: Record<number, (anterior: any) => any> = {
  1: (s: any) => ({ ...s, versaoEsquema: 2, heroisBancados: {} }),
  2: (s: any) => ({ ...s, versaoEsquema: 3, config: { ...s.config, tetoOfflineHoras: 2 } }),
  3: (s: any) => ({
    ...s,
    versaoEsquema: 4,
    progresso: {
      ...s.progresso,
      idFaseAtual: normalizarFase(s.progresso?.idFaseAtual ?? "a1d-planicies"),
      fasesLimpas: (s.progresso?.fasesLimpas ?? []).filter((id: string) =>
        PREFIXOS_FASE_VALIDOS.some((p) => id.startsWith(p)),
      ),
      indiceOndaAtual: 0,
    },
  }),
};

/** Aplica migrações em cadeia até a versão atual. */
export function migrarSave(bruto: any): JogoSalvo {
  let atual = bruto;
  while (typeof atual?.versaoEsquema === "number" && atual.versaoEsquema < VERSAO_ESQUEMA_ATUAL) {
    const migracao = migracoes[atual.versaoEsquema];
    if (!migracao) {
      throw new Error(`Sem migração para a versão ${atual.versaoEsquema}`);
    }
    atual = migracao(atual);
  }
  return atual as JogoSalvo;
}

/** Validação mínima de integridade do save carregado. */
export function saveValido(bruto: any): boolean {
  return (
    !!bruto &&
    typeof bruto.versaoEsquema === "number" &&
    !!bruto.party &&
    Array.isArray(bruto.party.slots) &&
    typeof bruto.ouro === "number" &&
    !!bruto.estadoRng
  );
}
