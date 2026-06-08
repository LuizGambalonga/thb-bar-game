// Serviço de aplicação: orquestra o núcleo a partir do save. Não implementa
// regras (delega ao núcleo); coordena tick, loot, XP, intenções e snapshots.

import { GeradorAleatorio } from "../nucleo/aleatorio/GeradorAleatorio.js";
import { CUSTO_SLOT_PARTY, LIMITE_INVENTARIO, MAX_PARTY, RARIDADES_ORDENADAS } from "../nucleo/dominio/constantes.js";
import type {
  Atributos, EspacoEquipamento, EstadoHeroi, IdClasse, ItemInstancia, Raridade,
} from "../nucleo/dominio/tipos.js";
import { calcularAtributosDoHeroi } from "../nucleo/atributos/CalculadoraDeAtributos.js";
import { MotorDeCombate } from "../nucleo/combate/MotorDeCombate.js";
import type { DadosHeroiParaCombate } from "../nucleo/combate/MotorDeCombate.js";
import { GeradorDeItens } from "../nucleo/espolio/GeradorDeItens.js";
import { ganharXp, xpParaProximoNivel } from "../nucleo/progressao/Experiencia.js";
import { calcularRendimentoOffline } from "../nucleo/progressao/RendimentoOffline.js";
import type { JogoSalvo } from "../nucleo/save/JogoSalvo.js";
import {
  afixosPorId, FASES, HEROIS, itensPorId, obterFase, obterHeroi, obterMonstro, obterTabelaEspolio,
} from "../conteudo/index.js";
import type {
  EventoSnapshot, HeroiMetaSnapshot, Intencao, ItemSnapshot, SnapshotCombate, SnapshotMeta,
} from "../compartilhado/contratos.js";

export class EstadoDoJogo {
  private readonly rngCombate: GeradorAleatorio;
  private readonly rngEspolio: GeradorAleatorio;
  private readonly gerador: GeradorDeItens;
  private motor: MotorDeCombate;
  private pausado = false;

  constructor(private salvo: JogoSalvo) {
    this.rngCombate = GeradorAleatorio.restaurar(salvo.estadoRng.combate);
    this.rngEspolio = GeradorAleatorio.restaurar(salvo.estadoRng.espolio);
    this.gerador = new GeradorDeItens(itensPorId, afixosPorId);
    this.motor = this.construirMotor(salvo.progresso.indiceOndaAtual);
  }

  // ---------- laço ----------

  /** Avança um tick e devolve os eventos para o snapshot de combate. */
  avancarUmTick(): EventoSnapshot[] {
    if (this.pausado) return [];
    const eventos = this.motor.avancarTick(this.rngCombate);
    const eventosSnapshot: EventoSnapshot[] = [];

    for (const evento of eventos) {
      if (evento.tipo === "dano") {
        eventosSnapshot.push({
          tipo: "dano", idAutor: evento.idAutor, idAlvo: evento.idAlvo,
          quantidade: evento.quantidade, critico: evento.critico,
        });
      } else if (evento.tipo === "habilidade") {
        eventosSnapshot.push({
          tipo: "habilidade", idAutor: evento.idAutor, idHabilidade: evento.idHabilidade,
          tipoSkill: evento.tipoSkill, idsAlvos: evento.idsAlvos, elemento: evento.elemento,
        });
      } else if (evento.tipo === "morteInimigo") {
        const dropEvento = this.processarMorteInimigo(evento.idTabelaEspolio, evento.xp);
        if (dropEvento) eventosSnapshot.push(dropEvento);
      } else if (evento.tipo === "morteHeroi") {
        const heroi = this.salvo.party.slots[evento.slot];
        if (heroi) heroi.vivo = false;
      } else if (evento.tipo === "ressurreicao") {
        const heroi = this.salvo.party.slots[evento.slot];
        if (heroi) heroi.vivo = true;
        eventosSnapshot.push({ tipo: "ressurreicao", idHeroi: evento.id });
      } else if (evento.tipo === "partyDerrotada") {
        for (const heroi of this.heroisAtivos()) heroi.vivo = true;
      } else if (evento.tipo === "faseConcluida") {
        this.processarFaseConcluida();
      }
    }
    return eventosSnapshot;
  }

  private processarMorteInimigo(idTabela: string, xp: number): EventoSnapshot | null {
    const tabela = obterTabelaEspolio(idTabela);
    const drop = this.gerador.rolarDrop(tabela, this.rngEspolio);
    this.salvo.ouro += drop.ouro + (drop.bau ? drop.ouro : 0);
    this.distribuirXp(xp);
    if (drop.item) {
      if (this.salvo.inventario.length >= LIMITE_INVENTARIO) {
        this.salvo.ouro += Math.max(1, Math.floor(drop.item.poder / 2));
        return { tipo: "mochilaCheia" };
      }
      this.salvo.inventario.push(drop.item);
      return { tipo: "drop", raridade: drop.item.raridade };
    }
    return null;
  }

  private processarFaseConcluida(): void {
    const idFase = this.salvo.progresso.idFaseAtual;
    if (!this.salvo.progresso.fasesLimpas.includes(idFase)) {
      this.salvo.progresso.fasesLimpas.push(idFase);
    }
    // Refaz a fase para permitir farm contínuo (idle).
    this.salvo.progresso.indiceOndaAtual = 0;
    this.motor = this.construirMotor(0);
  }

  private distribuirXp(xp: number): void {
    for (const heroi of this.heroisAtivos()) {
      const resultado = ganharXp(heroi.nivel, heroi.xp, xp);
      heroi.nivel = resultado.nivel;
      heroi.xp = resultado.xp;
    }
  }

  // ---------- intenções ----------

  aplicarIntencao(intencao: Intencao): void {
    switch (intencao.tipo) {
      case "equiparItem": this.equiparItem(intencao.uid, intencao.slotHeroi); break;
      case "desequipar": this.desequipar(intencao.slotHeroi, intencao.espaco); break;
      case "venderItem": this.venderItem(intencao.uid); break;
      case "venderEmLote": this.venderEmLote(intencao.raridadeMaxima); break;
      case "desbloquearHeroi": this.desbloquearHeroi(intencao.idClasse); break;
      case "desbloquearSlotParty": this.desbloquearSlotParty(); break;
      case "definirHeroiNoSlot": this.definirHeroiNoSlot(intencao.slotHeroi, intencao.idClasse); break;
      case "definirFormacao": this.definirFormacao(intencao.slotHeroi, intencao.posicao); break;
      case "trocarFase": this.trocarFase(intencao.idFase); break;
      case "definirVelocidade": this.salvo.config.velocidade = intencao.velocidade; break;
      case "definirTetoOffline": this.salvo.config.tetoOfflineHoras = Math.min(2, Math.max(0.25, intencao.horas)); break;
      case "pausar": this.pausado = true; break;
      case "retomar": this.pausado = false; break;
      case "minimizar": break; // tratado no processo principal
      case "expandirJanela": break; // tratado no processo principal
      case "encolherJanela": break; // tratado no processo principal
    }
  }

  private equiparItem(uid: string, slotHeroi: number): void {
    const heroi = this.salvo.party.slots[slotHeroi];
    if (!heroi) return;
    const indice = this.salvo.inventario.findIndex((i) => i.uid === uid);
    if (indice < 0) return;
    const item = this.salvo.inventario[indice]!;
    const def = itensPorId.get(item.idDef);
    if (!def) return;

    const espacoAlvo = this.resolverEspaco(def.espaco, heroi);
    this.salvo.inventario.splice(indice, 1);
    const anterior = heroi.equipamento[espacoAlvo];
    if (anterior) this.salvo.inventario.push(anterior);
    heroi.equipamento[espacoAlvo] = item;
    this.reconstruirMotorMantendoOnda();
  }

  private desequipar(slotHeroi: number, espaco: EspacoEquipamento): void {
    const heroi = this.salvo.party.slots[slotHeroi];
    if (!heroi) return;
    const item = heroi.equipamento[espaco];
    if (!item) return;
    delete heroi.equipamento[espaco];
    this.salvo.inventario.push(item);
    this.reconstruirMotorMantendoOnda();
  }

  private venderItem(uid: string): void {
    const indice = this.salvo.inventario.findIndex((i) => i.uid === uid);
    if (indice < 0) return;
    const item = this.salvo.inventario[indice]!;
    this.salvo.ouro += Math.max(1, Math.floor(item.poder / 2));
    this.salvo.inventario.splice(indice, 1);
  }

  private venderEmLote(raridadeMaxima: Raridade): void {
    const indiceMax = RARIDADES_ORDENADAS.indexOf(raridadeMaxima);
    let totalOuro = 0;
    const restante: typeof this.salvo.inventario = [];
    for (const item of this.salvo.inventario) {
      if (RARIDADES_ORDENADAS.indexOf(item.raridade) <= indiceMax) {
        totalOuro += Math.max(1, Math.floor(item.poder / 2));
      } else {
        restante.push(item);
      }
    }
    this.salvo.ouro += totalOuro;
    this.salvo.inventario = restante;
  }

  private desbloquearHeroi(idClasse: IdClasse): void {
    if (this.salvo.heroisDesbloqueados.includes(idClasse)) return;
    const def = obterHeroi(idClasse);
    if (this.salvo.ouro < def.desbloqueio.custoOuro) return;
    this.salvo.ouro -= def.desbloqueio.custoOuro;
    this.salvo.heroisDesbloqueados.push(idClasse);
  }

  private desbloquearSlotParty(): void {
    const atuais = this.salvo.party.slotsDesbloqueados;
    if (atuais >= MAX_PARTY) return;
    const custo = CUSTO_SLOT_PARTY[atuais];
    if (custo === undefined || this.salvo.ouro < custo) return;
    this.salvo.ouro -= custo;
    this.salvo.party.slotsDesbloqueados = atuais + 1;
  }

  private definirHeroiNoSlot(slotHeroi: number, idClasse: IdClasse): void {
    if (slotHeroi < 0 || slotHeroi >= this.salvo.party.slotsDesbloqueados) return;
    if (!this.salvo.heroisDesbloqueados.includes(idClasse)) {
      this.salvo.heroisDesbloqueados.push(idClasse);
    }

    // Salva estado do herói atual e devolve seus itens ao inventário.
    const heroiAtual = this.salvo.party.slots[slotHeroi];
    if (heroiAtual) {
      this.salvo.heroisBancados[heroiAtual.idClasse] = {
        nivel: heroiAtual.nivel,
        xp: heroiAtual.xp,
      };
      for (const item of Object.values(heroiAtual.equipamento)) {
        if (item) this.salvo.inventario.push(item);
      }
    }

    // Restaura estado salvo para a nova classe (se existir), senão começa do zero.
    const def = obterHeroi(idClasse);
    const bancado = this.salvo.heroisBancados[idClasse];
    this.salvo.party.slots[slotHeroi] = {
      idClasse,
      nivel: bancado?.nivel ?? 1,
      xp: bancado?.xp ?? 0,
      vivo: true,
      vidaAtual: def.atributosBase.vida,
      equipamento: {},
    };
    // Cavaleiro sempre vai para a frente; demais classes vão para trás por padrão
    this.salvo.party.formacao[slotHeroi] = idClasse === "cavaleiro" ? "frente" : "tras";
    this.reconstruirMotorMantendoOnda();
  }

  private definirFormacao(slotHeroi: number, posicao: "frente" | "tras"): void {
    this.salvo.party.formacao[slotHeroi] = posicao;
    this.reconstruirMotorMantendoOnda();
  }

  private trocarFase(idFase: string): void {
    obterFase(idFase); // valida (lança se não existe)
    this.salvo.progresso.idFaseAtual = idFase;
    this.salvo.progresso.indiceOndaAtual = 0;
    this.motor = this.construirMotor(0);
  }

  // ---------- snapshots ----------

  snapshotCombate(eventos: EventoSnapshot[]): SnapshotCombate {
    const herois = this.motor.heroisEmCombate;
    const inimigos = this.motor.inimigosEmCombate;
    return {
      tick: this.motor.tick,
      estado: this.motor.estadoAtual,
      indiceOnda: this.motor.indiceOndaAtual,
      totalOndas: this.motor.totalOndas,
      herois: herois.map((c) => {
        const heroi = this.salvo.party.slots[c.slot];
        const idClasse = heroi?.idClasse ?? "cavaleiro";
        return {
          id: c.id, nome: c.nome, icone: c.icone, ehHeroi: true, vivo: c.vivo,
          spriteId: `heroi:${idClasse}`,
          projetil: obterHeroi(idClasse).projetil ?? null,
          raridadeEquip: heroi ? this.melhorRaridadeEquip(heroi) : null,
          temArma: !!heroi?.equipamento.arma,
          vidaPct: c.vidaMax > 0 ? Math.max(0, c.vidaAtual / c.vidaMax) : 0,
          x: c.posicaoX, estadoMov: c.estadoMov, elemento: c.elemento,
        };
      }),
      inimigos: inimigos.map((c) => ({
        id: c.id, nome: c.nome, icone: c.icone, ehHeroi: false, vivo: c.vivo,
        spriteId: `monstro:${c.idMonstro ?? "bit-slime"}`,
        projetil: c.idMonstro ? obterMonstro(c.idMonstro).projetil ?? null : null,
        raridadeEquip: null, temArma: false,
        vidaPct: c.vidaMax > 0 ? Math.max(0, c.vidaAtual / c.vidaMax) : 0,
        x: c.posicaoX, estadoMov: c.estadoMov, elemento: c.elemento,
      })),
      eventos,
    };
  }

  snapshotMeta(): SnapshotMeta {
    const fase = obterFase(this.salvo.progresso.idFaseAtual);
    return {
      ouro: this.salvo.ouro,
      velocidade: this.salvo.config.velocidade,
      pausado: this.pausado,
      tetoOfflineHoras: this.salvo.config.tetoOfflineHoras ?? 2,
      heroisDesbloqueados: [...this.salvo.heroisDesbloqueados],
      slotsDesbloqueados: this.salvo.party.slotsDesbloqueados,
      custoProximoSlot: CUSTO_SLOT_PARTY[this.salvo.party.slotsDesbloqueados] ?? null,
      classes: HEROIS.map((def) => ({
        idClasse: def.id,
        nome: def.nome,
        papel: def.papel,
        custoOuro: def.desbloqueio.custoOuro,
        desbloqueado: this.salvo.heroisDesbloqueados.includes(def.id),
        spriteId: `heroi:${def.id}`,
        vida: def.atributosBase.vida,
        ataque: def.atributosBase.ataque,
        defesa: def.atributosBase.defesa,
        emUso: this.salvo.party.slots.some((h) => h?.idClasse === def.id),
      })),
      mapas: this.montarMapas(),
      herois: this.salvo.party.slots.map((h, slot) => this.heroiMeta(h, slot)),
      inventario: this.inventarioSnapshot(),
      fase: { id: fase.id, nome: fase.nome, dificuldade: fase.dificuldade, ato: fase.ato },
      indiceOnda: this.motor.indiceOndaAtual,
      totalOndas: this.motor.totalOndas,
    };
  }

  private montarMapas() {
    const limpas = this.salvo.progresso.fasesLimpas;
    return FASES.map((f) => ({
      id: f.id,
      nome: f.nome,
      ato: f.ato,
      dificuldade: f.dificuldade,
      limpa: limpas.includes(f.id),
      desbloqueada: !f.requer || limpas.includes(f.requer),
      atual: f.id === this.salvo.progresso.idFaseAtual,
    }));
  }

  private melhorRaridadeEquip(heroi: EstadoHeroi): Raridade | null {
    let melhor: Raridade | null = null;
    let melhorIndice = -1;
    for (const item of Object.values(heroi.equipamento)) {
      if (!item) continue;
      const indice = RARIDADES_ORDENADAS.indexOf(item.raridade);
      if (indice > melhorIndice) { melhorIndice = indice; melhor = item.raridade; }
    }
    return melhor;
  }

  private heroiMeta(heroi: EstadoHeroi | null, slot: number): HeroiMetaSnapshot | null {
    if (!heroi) return null;
    const def = obterHeroi(heroi.idClasse);
    const attrs = this.atributosDoHeroi(heroi);
    const equipamento: Partial<Record<EspacoEquipamento, string>> = {};
    for (const [espaco, item] of Object.entries(heroi.equipamento)) {
      if (item) equipamento[espaco as EspacoEquipamento] = item.uid;
    }
    return {
      slot,
      idClasse: heroi.idClasse,
      nome: def.nome,
      nivel: heroi.nivel,
      xp: heroi.xp,
      xpProximo: xpParaProximoNivel(heroi.nivel),
      vivo: heroi.vivo,
      posicao: this.salvo.party.formacao[slot] ?? "frente",
      danoPorSegundo: this.danoPorSegundo(attrs),
      equipamento,
      vidaAtual: heroi.vidaAtual,
      vidaMaxima: attrs.vida,
      ataque: attrs.ataque,
      defesa: attrs.defesa,
      velocidadeAtaque: attrs.velocidadeAtaque,
      chanceCritico: attrs.chanceCritico,
      multiplicadorCritico: attrs.multiplicadorCritico,
      elemento: def.elemento,
      habilidades: def.habilidades.map((h) => ({
        id: h.id,
        nome: h.nome,
        tipo: h.tipo,
        cooldownSeg: h.cooldownTicks / 10,
      })),
    };
  }

  private inventarioSnapshot(): ItemSnapshot[] {
    const lista: ItemSnapshot[] = [];
    for (const item of this.salvo.inventario) {
      lista.push(this.itemSnapshot(item, null));
    }
    this.salvo.party.slots.forEach((heroi, slot) => {
      if (!heroi) return;
      for (const item of Object.values(heroi.equipamento)) {
        if (item) lista.push(this.itemSnapshot(item, slot));
      }
    });
    return lista.sort((a, b) => b.poder - a.poder);
  }

  private itemSnapshot(item: ItemInstancia, equipadoPorSlot: number | null): ItemSnapshot {
    const def = itensPorId.get(item.idDef);
    const atributosItem = this.gerador.atributosDoItem(item);
    const atributos = (Object.entries(atributosItem) as [string, unknown][])
      .filter(([chave, valor]) => chave !== "afinidades" && typeof valor === "number" && valor !== 0)
      .map(([chave, valor]) => ({ chave, valor: valor as number }));
    return {
      uid: item.uid,
      idDef: item.idDef,
      nome: def?.nome ?? item.idDef,
      espaco: def?.espaco ?? "arma",
      raridade: item.raridade,
      poder: item.poder,
      atributos,
      equipadoPorSlot,
      classesAfins: def?.classesAfins ?? [],
    };
  }

  // ---------- offline ----------

  estimativasOffline(): { ouroPorSegundo: number; xpPorSegundo: number } {
    const fase = obterFase(this.salvo.progresso.idFaseAtual);
    const ids = new Set(fase.ondas.flatMap((o) => o.idsMonstros));
    let vidaMedia = 0, xpMedio = 0, ouroMedio = 0, n = 0;
    for (const id of ids) {
      const m = obterMonstro(id);
      const tabela = obterTabelaEspolio(m.idTabelaEspolio);
      vidaMedia += m.atributos.vida;
      xpMedio += m.xpConcedido;
      ouroMedio += (tabela.faixaOuro[0] + tabela.faixaOuro[1]) / 2;
      n++;
    }
    if (n === 0) return { ouroPorSegundo: 0, xpPorSegundo: 0 };
    vidaMedia /= n; xpMedio /= n; ouroMedio /= n;
    const dpsParty = this.heroisAtivos().reduce(
      (s, h) => s + this.danoPorSegundo(this.atributosDoHeroi(h)), 0,
    );
    const matesPorSegundo = vidaMedia > 0 ? dpsParty / vidaMedia : 0;
    return {
      ouroPorSegundo: matesPorSegundo * ouroMedio,
      xpPorSegundo: matesPorSegundo * xpMedio,
    };
  }

  aplicarRendimentoOffline(segundosAusente: number) {
    const tetoSegundos = (this.salvo.config.tetoOfflineHoras ?? 2) * 3600;
    const { ouroPorSegundo, xpPorSegundo } = this.estimativasOffline();
    const resultado = calcularRendimentoOffline(
      Math.min(segundosAusente, tetoSegundos), ouroPorSegundo, xpPorSegundo,
    );
    this.salvo.ouro += resultado.ouro;
    this.distribuirXp(resultado.xp);
    return resultado;
  }

  previewOffline(horas: number): { ouro: number; xp: number } {
    const { ouroPorSegundo, xpPorSegundo } = this.estimativasOffline();
    const segundos = Math.min(horas, 2) * 3600;
    const r = calcularRendimentoOffline(segundos, ouroPorSegundo, xpPorSegundo);
    return { ouro: r.ouro, xp: r.xp };
  }

  // ---------- serialização ----------

  serializar(agora: number): JogoSalvo {
    this.salvo.estadoRng.combate = this.rngCombate.serializar();
    this.salvo.estadoRng.espolio = this.rngEspolio.serializar();
    this.salvo.progresso.indiceOndaAtual = this.motor.indiceOndaAtual;
    this.salvo.ultimoAcesso = agora;
    return this.salvo;
  }

  get velocidade(): 1 | 2 | 3 {
    return this.salvo.config.velocidade;
  }

  // ---------- helpers ----------

  /** Resolve o espaço de equipamento, distribuindo acessórios entre os dois slots. */
  private resolverEspaco(espaco: EspacoEquipamento, heroi: EstadoHeroi): EspacoEquipamento {
    if (espaco === "acessorio1" || espaco === "acessorio2") {
      if (!heroi.equipamento.acessorio1) return "acessorio1";
      if (!heroi.equipamento.acessorio2) return "acessorio2";
      return "acessorio1";
    }
    return espaco;
  }

  private construirMotor(ondaInicial: number): MotorDeCombate {
    const fase = obterFase(this.salvo.progresso.idFaseAtual);
    return new MotorDeCombate(fase, this.heroisParaCombate(), obterMonstro, ondaInicial);
  }

  private reconstruirMotorMantendoOnda(): void {
    this.motor = this.construirMotor(this.motor.indiceOndaAtual);
  }

  private heroisParaCombate(): DadosHeroiParaCombate[] {
    const dados: DadosHeroiParaCombate[] = [];
    this.salvo.party.slots.forEach((heroi, slot) => {
      if (!heroi) return;
      const def = obterHeroi(heroi.idClasse);
      dados.push({
        slot,
        nome: def.nome,
        icone: def.icone,
        elemento: def.elemento,
        atributos: this.atributosDoHeroi(heroi),
        posicao: this.salvo.party.formacao[slot] ?? "frente",
        habilidades: def.habilidades,
        corpoACorpo: def.corpoACorpo ?? false,
      });
    });
    return dados;
  }

  private heroisAtivos(): EstadoHeroi[] {
    return this.salvo.party.slots.filter((h): h is EstadoHeroi => h !== null);
  }

  private atributosDoHeroi(heroi: EstadoHeroi): Atributos {
    const def = obterHeroi(heroi.idClasse);
    const atributosItens = Object.values(heroi.equipamento)
      .filter((i): i is ItemInstancia => !!i)
      .map((i) => this.gerador.atributosDoItem(i));
    return calcularAtributosDoHeroi(heroi, def.atributosBase, atributosItens);
  }

  private danoPorSegundo(a: Atributos): number {
    const golpeMedio = a.ataque * (1 + a.chanceCritico * (a.multiplicadorCritico - 1));
    return Math.round(golpeMedio * a.velocidadeAtaque * 10) / 10;
  }
}
