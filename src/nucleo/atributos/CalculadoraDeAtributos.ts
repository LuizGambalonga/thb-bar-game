// Funções puras de atributos: agregação, escala por nível, counter elemental e dano.

import {
  CONST_DEFESA,
  CRESCIMENTO_POR_NIVEL,
  MULT_DESVANTAGEM_ELEMENTAL,
  MULT_NEUTRO_ELEMENTAL,
  MULT_VANTAGEM_ELEMENTAL,
} from "../dominio/constantes.js";
import type { Atributos, Elemento, EstadoHeroi } from "../dominio/tipos.js";
import type { GeradorAleatorio } from "../aleatorio/GeradorAleatorio.js";

const ATRIBUTOS_ZERO: Atributos = {
  vida: 0,
  ataque: 0,
  defesa: 0,
  chanceCritico: 0,
  multiplicadorCritico: 0,
  velocidadeAtaque: 0,
  rouboDeVida: 0,
  afinidades: {},
};

/** Ciclo de vantagem elemental: cada elemento vence o próximo. */
const VENCE: Record<Elemento, Elemento> = {
  fogo: "bio",
  bio: "gelo",
  gelo: "raio",
  raio: "fogo",
  nenhum: "nenhum",
};

export function multiplicadorElemental(atacante: Elemento, alvo: Elemento): number {
  if (atacante === "nenhum" || alvo === "nenhum") return MULT_NEUTRO_ELEMENTAL;
  if (VENCE[atacante] === alvo) return MULT_VANTAGEM_ELEMENTAL;
  if (VENCE[alvo] === atacante) return MULT_DESVANTAGEM_ELEMENTAL;
  return MULT_NEUTRO_ELEMENTAL;
}

/** Aplica a curva de crescimento de um valor de atributo conforme o nível. */
export function atributoNoNivel(base: number, nivel: number): number {
  return Math.floor(base * (1 + CRESCIMENTO_POR_NIVEL * (nivel - 1)));
}

function somarAfinidades(
  a: Partial<Record<Elemento, number>>,
  b: Partial<Record<Elemento, number>>,
): Partial<Record<Elemento, number>> {
  const resultado: Partial<Record<Elemento, number>> = { ...a };
  for (const chave of Object.keys(b) as Elemento[]) {
    resultado[chave] = (resultado[chave] ?? 0) + (b[chave] ?? 0);
  }
  return resultado;
}

function somarAtributos(a: Atributos, b: Partial<Atributos>): Atributos {
  return {
    vida: a.vida + (b.vida ?? 0),
    ataque: a.ataque + (b.ataque ?? 0),
    defesa: a.defesa + (b.defesa ?? 0),
    chanceCritico: a.chanceCritico + (b.chanceCritico ?? 0),
    multiplicadorCritico: a.multiplicadorCritico + (b.multiplicadorCritico ?? 0),
    velocidadeAtaque: a.velocidadeAtaque + (b.velocidadeAtaque ?? 0),
    rouboDeVida: a.rouboDeVida + (b.rouboDeVida ?? 0),
    afinidades: somarAfinidades(a.afinidades, b.afinidades ?? {}),
  };
}

function escalarAtributos(base: Atributos, nivel: number): Atributos {
  return {
    ...base,
    vida: atributoNoNivel(base.vida, nivel),
    ataque: atributoNoNivel(base.ataque, nivel),
    defesa: atributoNoNivel(base.defesa, nivel),
  };
}

/**
 * Agrega os atributos finais de um herói: base escalada por nível + soma dos
 * atributos de cada item equipado (base do item + afixos).
 */
export function calcularAtributosDoHeroi(
  estado: EstadoHeroi,
  atributosBase: Atributos,
  atributosDosItens: Partial<Atributos>[],
): Atributos {
  let total = escalarAtributos(atributosBase, estado.nivel);
  for (const atributosItem of atributosDosItens) {
    total = somarAtributos(total, atributosItem);
  }
  return total;
}

/** Resultado de um golpe. */
export interface ResultadoGolpe {
  dano: number;
  critico: boolean;
}

/** Calcula o dano de um golpe de forma determinística (usa o RNG semeado). */
export function calcularDano(
  atacante: Atributos,
  elementoAtacante: Elemento,
  alvo: Atributos,
  elementoAlvo: Elemento,
  rng: GeradorAleatorio,
): ResultadoGolpe {
  const critico = rng.proximo() < atacante.chanceCritico;
  const bruto = atacante.ataque * (critico ? atacante.multiplicadorCritico : 1);
  const multElem = multiplicadorElemental(elementoAtacante, elementoAlvo);
  const mitigacao = alvo.defesa / (alvo.defesa + CONST_DEFESA);
  const dano = Math.max(1, Math.floor(bruto * multElem * (1 - mitigacao)));
  return { dano, critico };
}

export { ATRIBUTOS_ZERO };
