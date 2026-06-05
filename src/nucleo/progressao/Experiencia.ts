// Regras puras de experiência e nível.

export function xpParaProximoNivel(nivel: number): number {
  return Math.floor(50 * Math.pow(nivel, 1.5));
}

export interface ResultadoGanhoXp {
  nivel: number;
  xp: number;
  niveisGanhos: number;
}

/** Aplica XP a um herói, subindo de nível quantas vezes for necessário. */
export function ganharXp(nivelAtual: number, xpAtual: number, xpGanho: number): ResultadoGanhoXp {
  let nivel = nivelAtual;
  let xp = xpAtual + xpGanho;
  let niveisGanhos = 0;
  let necessario = xpParaProximoNivel(nivel);
  while (xp >= necessario) {
    xp -= necessario;
    nivel += 1;
    niveisGanhos += 1;
    necessario = xpParaProximoNivel(nivel);
  }
  return { nivel, xp, niveisGanhos };
}
