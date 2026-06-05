// Gerador de números pseudoaleatórios semeado e determinístico (mulberry32).
// Único ponto de aleatoriedade do núcleo. Estado serializável para o save.

export class GeradorAleatorio {
  private estadoInterno: number;

  constructor(semente: number) {
    // Garante inteiro de 32 bits.
    this.estadoInterno = semente >>> 0;
  }

  /** Retorna um número em [0, 1). */
  proximo(): number {
    this.estadoInterno = (this.estadoInterno + 0x6d2b79f5) >>> 0;
    let t = this.estadoInterno;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Inteiro em [min, max] (inclusivo). */
  inteiro(min: number, max: number): number {
    return min + Math.floor(this.proximo() * (max - min + 1));
  }

  /** Float em [min, max). */
  flutuante(min: number, max: number): number {
    return min + this.proximo() * (max - min);
  }

  /** Escolhe um item de uma lista (lista não pode ser vazia). */
  escolher<T>(itens: readonly T[]): T {
    if (itens.length === 0) throw new Error("escolher: lista vazia");
    return itens[this.inteiro(0, itens.length - 1)]!;
  }

  /**
   * Escolhe uma chave conforme pesos. Determinístico.
   * Ignora pesos <= 0.
   */
  escolherPorPeso<T extends string>(pesos: Record<T, number>): T {
    const entradas = (Object.entries(pesos) as [T, number][]).filter(([, p]) => p > 0);
    const total = entradas.reduce((soma, [, p]) => soma + p, 0);
    let sorteio = this.proximo() * total;
    for (const [chave, peso] of entradas) {
      sorteio -= peso;
      if (sorteio < 0) return chave;
    }
    return entradas[entradas.length - 1]![0];
  }

  /** Serializa o estado atual (para o save). */
  serializar(): string {
    return String(this.estadoInterno);
  }

  /** Restaura o estado a partir de uma string serializada. */
  static restaurar(estado: string): GeradorAleatorio {
    return new GeradorAleatorio(Number(estado) >>> 0);
  }
}
