// Registries de conteúdo: indexa os dados por id e oferece getters seguros.
// Adicionar conteúdo = adicionar um registro nos arquivos de dados (OCP).

import type {
  DefAfixo, DefFase, DefHeroi, DefItem, DefMonstro, IdClasse, TabelaEspolio,
} from "../nucleo/dominio/tipos.js";
import { HEROIS } from "./herois.js";
import { MONSTROS } from "./monstros.js";
import { FASES, FASE_INICIAL } from "./fases.js";
import { ITENS, AFIXOS } from "./itens.js";
import { TABELAS_ESPOLIO } from "./tabelasEspolio.js";

function indexar<T extends { id: string }>(itens: readonly T[]): ReadonlyMap<string, T> {
  return new Map(itens.map((item) => [item.id, item]));
}

export const heroisPorId = indexar(HEROIS) as ReadonlyMap<IdClasse, DefHeroi>;
export const monstrosPorId = indexar(MONSTROS);
export const fasesPorId = indexar(FASES);
export const itensPorId = indexar(ITENS);
export const afixosPorId = indexar(AFIXOS);
export const tabelasEspolioPorId = indexar(TABELAS_ESPOLIO);

export function obterHeroi(id: IdClasse): DefHeroi {
  const def = heroisPorId.get(id);
  if (!def) throw new Error(`Herói desconhecido: ${id}`);
  return def;
}

export function obterMonstro(id: string): DefMonstro {
  const def = monstrosPorId.get(id);
  if (!def) throw new Error(`Monstro desconhecido: ${id}`);
  return def;
}

export function obterFase(id: string): DefFase {
  const def = fasesPorId.get(id);
  if (!def) throw new Error(`Fase desconhecida: ${id}`);
  return def;
}

export function obterTabelaEspolio(id: string): TabelaEspolio {
  const def = tabelasEspolioPorId.get(id);
  if (!def) throw new Error(`Tabela de espólio desconhecida: ${id}`);
  return def;
}

export { HEROIS, MONSTROS, FASES, FASE_INICIAL, ITENS, AFIXOS, TABELAS_ESPOLIO };
export type { DefAfixo, DefItem };
