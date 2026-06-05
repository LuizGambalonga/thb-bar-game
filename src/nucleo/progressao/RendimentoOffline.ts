// Cálculo puro do suplemento offline. Sem itens/baús (Constituição, art. 7).

import { TETO_OFFLINE_HORAS_BASE } from "../dominio/constantes.js";

export interface ResultadoOffline {
  segundosCreditados: number;
  ouro: number;
  xp: number;
  atingiuTeto: boolean;
}

/**
 * Calcula o suplemento offline.
 * @param segundosAusente tempo real ausente (s)
 * @param ouroPorSegundo estimativa de ouro/seg do farm atual
 * @param xpPorSegundo estimativa de xp/seg do farm atual
 * @param eficiencia fração do rendimento ativo concedida offline (0..1)
 * @param tetoHoras teto de horas creditadas (ampliável por runa)
 */
export function calcularRendimentoOffline(
  segundosAusente: number,
  ouroPorSegundo: number,
  xpPorSegundo: number,
  eficiencia = 0.4,
  tetoHoras = TETO_OFFLINE_HORAS_BASE,
): ResultadoOffline {
  const tetoSegundos = tetoHoras * 3600;
  const segundosCreditados = Math.max(0, Math.min(segundosAusente, tetoSegundos));
  return {
    segundosCreditados,
    ouro: Math.floor(segundosCreditados * ouroPorSegundo * eficiencia),
    xp: Math.floor(segundosCreditados * xpPorSegundo * eficiencia),
    atingiuTeto: segundosAusente > tetoSegundos,
  };
}
