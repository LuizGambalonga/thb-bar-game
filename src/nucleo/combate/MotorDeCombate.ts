// Motor de combate idle: simulação determinística por tick. TS puro.
// Responsabilidade única: simular o combate (ataques + habilidades).
// Loot/XP são tratados fora, via eventos.

import {
  DURACAO_BUFF_TICKS, TICKS_INTERVALO_ENTRE_ONDAS, TICKS_POR_SEGUNDO,
} from "../dominio/constantes.js";
import type {
  Atributos, DefFase, DefHabilidade, DefMonstro, Elemento, PosicaoFormacao,
} from "../dominio/tipos.js";
import { calcularDano } from "../atributos/CalculadoraDeAtributos.js";
import type { GeradorAleatorio } from "../aleatorio/GeradorAleatorio.js";

export interface Combatente {
  id: string;
  nome: string;
  icone: string;
  ehHeroi: boolean;
  slot: number;
  idMonstro?: string;
  idTabelaEspolio?: string;
  xpConcedido: number;
  atributos: Atributos;
  elemento: Elemento;
  vidaMax: number;
  vidaAtual: number;
  vivo: boolean;
  posicao: PosicaoFormacao;
  proximoAtaqueEmTick: number;
  habilidades: DefHabilidade[];
  cooldowns: Map<string, number>; // id da habilidade → tick em que fica pronta
  buffAtaque: number; // fração adicional de ataque
  buffAteTick: number;
}

export type EventoCombate =
  | { tipo: "dano"; idAutor: string; idAlvo: string; quantidade: number; critico: boolean; alvoEhHeroi: boolean }
  | { tipo: "cura"; idAlvo: string; quantidade: number }
  | { tipo: "habilidade"; idAutor: string; idHabilidade: string }
  | { tipo: "morteInimigo"; idMonstro: string; idTabelaEspolio: string; xp: number }
  | { tipo: "morteHeroi"; slot: number }
  | { tipo: "ondaIniciada"; indice: number }
  | { tipo: "faseConcluida" }
  | { tipo: "partyDerrotada" };

export type EstadoCombate = "lutando" | "intervalo" | "concluida";

export interface DadosHeroiParaCombate {
  slot: number;
  nome: string;
  icone?: string;
  elemento: Elemento;
  atributos: Atributos;
  posicao: PosicaoFormacao;
  habilidades?: DefHabilidade[];
}

export class MotorDeCombate {
  private readonly herois: Combatente[];
  private inimigos: Combatente[] = [];
  private indiceOnda = 0;
  private tickAtual = 0;
  private intervaloRestante = 0;
  private estado: EstadoCombate = "lutando";

  constructor(
    private readonly fase: DefFase,
    heroisParaCombate: DadosHeroiParaCombate[],
    private readonly obterMonstro: (id: string) => DefMonstro,
    ondaInicial = 0,
  ) {
    this.herois = heroisParaCombate.map((h) => this.criarCombatenteHeroi(h));
    const indiceSeguro = Math.max(0, Math.min(ondaInicial, this.fase.ondas.length - 1));
    this.spawnarOnda(indiceSeguro);
  }

  avancarTick(rng: GeradorAleatorio): EventoCombate[] {
    this.tickAtual += 1;
    const eventos: EventoCombate[] = [];
    if (this.estado === "concluida") return eventos;

    if (this.estado === "intervalo") {
      this.intervaloRestante -= 1;
      if (this.intervaloRestante <= 0) {
        this.spawnarOnda(this.indiceOnda + 1);
        eventos.push({ tipo: "ondaIniciada", indice: this.indiceOnda });
        this.estado = "lutando";
      }
      return eventos;
    }

    this.processarHabilidades(rng, eventos);
    this.processarAtaques(rng, eventos);
    this.avaliarFimDeOnda(eventos);
    return eventos;
  }

  // ---- leitura para snapshot ----
  get tick(): number { return this.tickAtual; }
  get estadoAtual(): EstadoCombate { return this.estado; }
  get indiceOndaAtual(): number { return this.indiceOnda; }
  get totalOndas(): number { return this.fase.ondas.length; }
  get heroisEmCombate(): readonly Combatente[] { return this.herois; }
  get inimigosEmCombate(): readonly Combatente[] { return this.inimigos; }

  // ---- ataques básicos ----

  private processarAtaques(rng: GeradorAleatorio, eventos: EventoCombate[]): void {
    for (const atacante of [...this.herois, ...this.inimigos]) {
      if (!atacante.vivo) continue;
      if (this.tickAtual < atacante.proximoAtaqueEmTick) continue;

      const alvo = atacante.ehHeroi ? this.primeiroVivo(this.inimigos) : this.escolherAlvoHeroi();
      atacante.proximoAtaqueEmTick = this.tickAtual + this.intervaloAtaque(atacante);
      if (!alvo) continue;
      this.aplicarDano(atacante, alvo, 1, rng, eventos);
    }
  }

  // ---- habilidades ----

  private processarHabilidades(rng: GeradorAleatorio, eventos: EventoCombate[]): void {
    for (const heroi of this.herois) {
      if (!heroi.vivo) continue;
      for (const habilidade of heroi.habilidades) {
        const prontaEm = heroi.cooldowns.get(habilidade.id) ?? 0;
        if (this.tickAtual < prontaEm) continue;
        heroi.cooldowns.set(habilidade.id, this.tickAtual + habilidade.cooldownTicks);
        this.aplicarHabilidade(heroi, habilidade, rng, eventos);
      }
    }
  }

  private aplicarHabilidade(
    autor: Combatente, habilidade: DefHabilidade, rng: GeradorAleatorio, eventos: EventoCombate[],
  ): void {
    if (habilidade.tipo === "dano") {
      const alvos = this.alvosDeDano(habilidade.alvo);
      if (alvos.length === 0) return;
      eventos.push({ tipo: "habilidade", idAutor: autor.id, idHabilidade: habilidade.id });
      for (const alvo of alvos) this.aplicarDano(autor, alvo, habilidade.potencia, rng, eventos);
    } else if (habilidade.tipo === "cura") {
      const alvo = this.aliadoComMenorVida();
      if (!alvo) return;
      const cura = Math.max(1, Math.floor(autor.atributos.ataque * habilidade.potencia));
      alvo.vidaAtual = Math.min(alvo.vidaMax, alvo.vidaAtual + cura);
      eventos.push({ tipo: "habilidade", idAutor: autor.id, idHabilidade: habilidade.id });
      eventos.push({ tipo: "cura", idAlvo: alvo.id, quantidade: cura });
    } else {
      // buff próprio: aumenta o ataque por uma duração.
      autor.buffAtaque = habilidade.potencia;
      autor.buffAteTick = this.tickAtual + DURACAO_BUFF_TICKS;
      eventos.push({ tipo: "habilidade", idAutor: autor.id, idHabilidade: habilidade.id });
    }
  }

  private alvosDeDano(alvo: DefHabilidade["alvo"]): Combatente[] {
    if (alvo === "todosInimigos") return this.inimigos.filter((c) => c.vivo);
    const frente = this.primeiroVivo(this.inimigos);
    return frente ? [frente] : [];
  }

  private aliadoComMenorVida(): Combatente | undefined {
    return this.herois
      .filter((h) => h.vivo)
      .sort((a, b) => a.vidaAtual / a.vidaMax - b.vidaAtual / b.vidaMax)[0];
  }

  // ---- aplicação de dano (compartilhada por ataque e habilidade) ----

  private aplicarDano(
    atacante: Combatente, alvo: Combatente, potencia: number,
    rng: GeradorAleatorio, eventos: EventoCombate[],
  ): void {
    const golpe = calcularDano(
      this.atributosEfetivos(atacante), atacante.elemento, alvo.atributos, alvo.elemento, rng,
    );
    const dano = Math.max(1, Math.floor(golpe.dano * potencia));
    alvo.vidaAtual -= dano;
    eventos.push({
      tipo: "dano", idAutor: atacante.id, idAlvo: alvo.id, quantidade: dano,
      critico: golpe.critico, alvoEhHeroi: alvo.ehHeroi,
    });

    if (atacante.atributos.rouboDeVida > 0) {
      const cura = Math.floor(dano * atacante.atributos.rouboDeVida);
      atacante.vidaAtual = Math.min(atacante.vidaMax, atacante.vidaAtual + cura);
    }

    if (alvo.vidaAtual <= 0) this.matar(alvo, eventos);
  }

  private matar(alvo: Combatente, eventos: EventoCombate[]): void {
    alvo.vivo = false;
    alvo.vidaAtual = 0;
    if (alvo.ehHeroi) {
      eventos.push({ tipo: "morteHeroi", slot: alvo.slot });
    } else {
      eventos.push({
        tipo: "morteInimigo", idMonstro: alvo.idMonstro!, idTabelaEspolio: alvo.idTabelaEspolio!, xp: alvo.xpConcedido,
      });
    }
  }

  private atributosEfetivos(c: Combatente): Atributos {
    if (this.tickAtual > c.buffAteTick || c.buffAtaque === 0) return c.atributos;
    return { ...c.atributos, ataque: Math.floor(c.atributos.ataque * (1 + c.buffAtaque)) };
  }

  // ---- ciclo de ondas ----

  private avaliarFimDeOnda(eventos: EventoCombate[]): void {
    if (!this.algumVivo(this.herois)) {
      this.reviverParty();
      this.spawnarOnda(this.indiceOnda);
      eventos.push({ tipo: "partyDerrotada" });
      return;
    }
    if (!this.algumVivo(this.inimigos)) {
      if (this.indiceOnda + 1 < this.fase.ondas.length) {
        this.estado = "intervalo";
        this.intervaloRestante = TICKS_INTERVALO_ENTRE_ONDAS;
      } else {
        this.estado = "concluida";
        eventos.push({ tipo: "faseConcluida" });
      }
    }
  }

  private spawnarOnda(indice: number): void {
    this.indiceOnda = indice;
    const onda = this.fase.ondas[indice];
    if (!onda) { this.inimigos = []; return; }
    const novos: Combatente[] = [];
    for (let i = 0; i < onda.quantidade; i++) {
      const idMonstro = onda.idsMonstros[i % onda.idsMonstros.length]!;
      novos.push(this.criarCombatenteInimigo(this.obterMonstro(idMonstro), i));
    }
    this.inimigos = novos;
  }

  private reviverParty(): void {
    for (const heroi of this.herois) {
      heroi.vivo = true;
      heroi.vidaAtual = heroi.vidaMax;
      heroi.proximoAtaqueEmTick = this.tickAtual + this.intervaloAtaque(heroi);
    }
  }

  // ---- criação de combatentes ----

  private criarCombatenteHeroi(h: DadosHeroiParaCombate): Combatente {
    const habilidades = h.habilidades ?? [];
    const cooldowns = new Map<string, number>();
    for (const hab of habilidades) cooldowns.set(hab.id, this.tickAtual + hab.cooldownTicks);
    return {
      id: `heroi-${h.slot}`, nome: h.nome, icone: h.icone ?? "🦸", ehHeroi: true, slot: h.slot, xpConcedido: 0,
      atributos: h.atributos, elemento: h.elemento, vidaMax: h.atributos.vida, vidaAtual: h.atributos.vida,
      vivo: true, posicao: h.posicao, proximoAtaqueEmTick: this.tickAtual + this.intervaloAtaqueAtributos(h.atributos),
      habilidades, cooldowns, buffAtaque: 0, buffAteTick: 0,
    };
  }

  private criarCombatenteInimigo(def: DefMonstro, indice: number): Combatente {
    const escala = this.fase.escalaInimigos ?? 1;
    const atributos: Atributos = {
      ...def.atributos,
      vida: Math.round(def.atributos.vida * escala),
      ataque: Math.round(def.atributos.ataque * escala),
    };
    return {
      id: `inimigo-${this.indiceOnda}-${indice}`, nome: def.nome, icone: def.icone, ehHeroi: false, slot: indice,
      idMonstro: def.id, idTabelaEspolio: def.idTabelaEspolio, xpConcedido: Math.round(def.xpConcedido * escala),
      atributos, elemento: def.elemento, vidaMax: atributos.vida, vidaAtual: atributos.vida,
      // ataques iniciais escalonados (indice) para não baterem todos no mesmo tick
      vivo: true, posicao: "frente",
      proximoAtaqueEmTick: this.tickAtual + this.intervaloAtaqueAtributos(atributos) + (indice % 5) * 2,
      habilidades: [], cooldowns: new Map(), buffAtaque: 0, buffAteTick: 0,
    };
  }

  // ---- utilidades ----

  private intervaloAtaque(c: Combatente): number {
    return this.intervaloAtaqueAtributos(c.atributos);
  }

  private intervaloAtaqueAtributos(atributos: Atributos): number {
    const vel = atributos.velocidadeAtaque > 0 ? atributos.velocidadeAtaque : 1;
    return Math.max(1, Math.round(TICKS_POR_SEGUNDO / vel));
  }

  private primeiroVivo(lista: Combatente[]): Combatente | undefined {
    return lista.find((c) => c.vivo);
  }

  private escolherAlvoHeroi(): Combatente | undefined {
    const frente = this.herois.find((h) => h.vivo && h.posicao === "frente");
    return frente ?? this.primeiroVivo(this.herois);
  }

  private algumVivo(lista: Combatente[]): boolean {
    return lista.some((c) => c.vivo);
  }
}
