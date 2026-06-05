// Laço de jogo: tick fixo (fixed-timestep) no processo principal.
// Responsabilidade única: avançar a simulação no ritmo certo e emitir snapshots.

import { TICK_MS } from "../nucleo/dominio/constantes.js";
import type { EstadoDoJogo } from "./EstadoDoJogo.js";
import type { EventoSnapshot, SnapshotCombate, SnapshotMeta } from "../compartilhado/contratos.js";

const TICKS_ENTRE_META = 10; // ~1s

export class LacoDeJogo {
  private timer: ReturnType<typeof setInterval> | null = null;
  private ticksDesdeMeta = 0;

  constructor(
    private readonly estado: EstadoDoJogo,
    private readonly aoEmitirCombate: (s: SnapshotCombate) => void,
    private readonly aoEmitirMeta: (s: SnapshotMeta) => void,
  ) {}

  iniciar(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.processarIntervalo(), TICK_MS);
  }

  parar(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Força o envio imediato de um snapshot de meta (ex.: ao abrir um painel). */
  emitirMetaAgora(): void {
    this.aoEmitirMeta(this.estado.snapshotMeta());
  }

  private processarIntervalo(): void {
    // Velocidade = quantos ticks deterministas rodamos por intervalo real.
    const ticks = this.estado.velocidade;
    const eventos: EventoSnapshot[] = [];
    for (let i = 0; i < ticks; i++) {
      eventos.push(...this.estado.avancarUmTick());
    }
    this.aoEmitirCombate(this.estado.snapshotCombate(eventos));

    this.ticksDesdeMeta += ticks;
    if (this.ticksDesdeMeta >= TICKS_ENTRE_META) {
      this.ticksDesdeMeta = 0;
      this.aoEmitirMeta(this.estado.snapshotMeta());
    }
  }
}
