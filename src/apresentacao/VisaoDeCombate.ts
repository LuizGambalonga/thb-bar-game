import type { CombatenteSnapshot, SnapshotCombate } from "../compartilhado/contratos.js";
import { desenharCenario } from "./arte/cenario.js";
import { desenharSprite, obterSprite } from "./arte/sprites.js";
import { desenharImagemSprite, obterImagemSprite } from "./arte/imagensSprites.js";
import { desenharFolha, temFolha } from "./arte/folhasSprite.js";

const COR_RARIDADE_HEX: Record<string, string> = {
  comum: "#b8c0d0", incomum: "#5cd97a", raro: "#5c8bff", epico: "#b15cff",
  lendario: "#ff9f43", imortal: "#ff5c5c", arcano: "#5cf2ff", cosmico: "#ff7ce8",
};

interface NumeroFlutuante { x: number; y: number; texto: string; cor: string; vida: number; }
interface Pulso { x: number; y: number; raio: number; cor: string; vida: number; }
interface Particula { x: number; y: number; vx: number; vy: number; vida: number; cor: string; tam: number; }
interface Projetil {
  tipo: string; x: number; y: number; ox: number; oy: number; tx: number; ty: number;
  prog: number; passo: number; rastro: { x: number; y: number }[];
  idAlvo: string; dano: number; critico: boolean;
}
interface EstadoAnim {
  faseAtaque: number; alvoXNorm: number; flash: number; atira: boolean; faseMorte: number;
  renderX: number | undefined; // X interpolado em tela (suavização entre snapshots)
}
// Efeito de habilidade: conjuração que viaja (dano) ou aura estática (cura/buff/resurg).
interface EfeitoSkill {
  tipo: "viaja" | "cura" | "buff" | "resurg";
  elemento: string; cor: string;
  x: number; y: number; ox: number; oy: number; tx: number; ty: number;
  prog: number; passo: number; vida: number; rastro: { x: number; y: number }[];
}

const ALTURA_TASKBAR = 12;
const FRAMES_INVESTIDA = 44;
const FRAMES_MORTE = 28;
const VELOCIDADE_PROJETIL = 5;
const VELOCIDADE_SKILL = 6;

// Altura real dos SVGs de herói (viewBox 14×24).
const ALTURA_SVG_HEROI = 24;

// Alturas-alvo (px) ao desenhar via sprite-sheet. 64 = 2× nítido sobre frames 32px.
const ALT_ALVO_HEROI = 64;
const ALT_ALVO_MONSTRO = 54;
const ALT_ALVO_BOSS = 96;

// Suavização da posição (0..1): maior = segue o snapshot mais rápido.
const SUAVIZACAO_POS = 0.35;

export class VisaoDeCombate {
  private readonly ctx: CanvasRenderingContext2D;
  private ultimo: SnapshotCombate | null = null;
  private numeros: NumeroFlutuante[] = [];
  private particulas: Particula[] = [];
  private projeteis: Projetil[] = [];
  private pulsos: Pulso[] = [];
  private readonly anim = new Map<string, EstadoAnim>();
  private readonly vivos = new Map<string, boolean>();
  private efeitos: EfeitoSkill[] = [];
  private tempo = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("Canvas 2D indisponível");
    this.ctx = contexto;
    this.ctx.imageSmoothingEnabled = false;
    requestAnimationFrame(() => this.quadro());
  }

  renderizar(snapshot: SnapshotCombate): void {
    this.ultimo = snapshot;
    this.detectarMortes(snapshot);

    // Autores que conjuraram habilidade neste tick (para não duplicar o golpe básico).
    const autoresHabilidade = new Set<string>();
    for (const evento of snapshot.eventos) {
      if (evento.tipo === "habilidade") autoresHabilidade.add(evento.idAutor);
    }

    for (const evento of snapshot.eventos) {
      if (evento.tipo === "habilidade") {
        this.dispararHabilidade(snapshot, evento);
        continue;
      }
      if (evento.tipo === "mochilaCheia") {
        this.numeros.push({
          x: this.canvas.width / 2, y: this.linhaBase() - 60,
          texto: "Mochila cheia! Item vendido.", cor: "#ff9f43", vida: 70,
        });
        continue;
      }
      if (evento.tipo !== "dano") continue;
      const autor = this.localizar(snapshot, evento.idAutor);
      const alvo = this.localizar(snapshot, evento.idAlvo);
      if (!autor || !alvo) continue;

      // Dano vindo de habilidade: o VFX da skill já mostra a viagem; aqui só o número.
      if (autoresHabilidade.has(evento.idAutor)) {
        this.aplicarImpacto(alvo, evento.quantidade, evento.critico);
        continue;
      }

      if (autor.projetil) {
        this.dispararProjetil(autor, alvo, evento.quantidade, evento.critico);
      } else {
        const e = this.estado(evento.idAutor);
        e.faseAtaque = FRAMES_INVESTIDA;
        e.alvoXNorm = alvo.x;
        e.atira = false;
        this.aplicarImpacto(alvo, evento.quantidade, evento.critico);
      }
    }
  }

  // ---------- habilidades (conjuração → viagem → impacto) ----------

  private dispararHabilidade(snapshot: SnapshotCombate, evento: Extract<SnapshotCombate["eventos"][number], { tipo: "habilidade" }>): void {
    const autor = this.localizar(snapshot, evento.idAutor);
    if (!autor) return;
    const ox = (this.estado(autor.id).renderX ?? autor.x * this.canvas.width);
    const oy = this.centroY(autor.ehHeroi);
    const cor = this.corElemento(evento.elemento, autor.spriteId);

    // Estouro de conjuração saindo do lançador.
    this.pulsos.push({ x: ox, y: oy, raio: 5, cor, vida: 22 });
    this.explosao(ox, oy, cor, 12);

    if (evento.tipoSkill === "dano") {
      const alvos = evento.idsAlvos.length ? evento.idsAlvos : [];
      for (const idAlvo of alvos) {
        const alvo = this.localizar(snapshot, idAlvo);
        if (!alvo) continue;
        const tx = alvo.x * this.canvas.width;
        const ty = this.centroY(alvo.ehHeroi);
        const distancia = Math.hypot(tx - ox, ty - oy);
        this.efeitos.push({
          tipo: "viaja", elemento: evento.elemento, cor,
          x: ox, y: oy, ox, oy, tx, ty, prog: 0,
          passo: VELOCIDADE_SKILL / Math.max(1, distancia), vida: 60, rastro: [],
        });
      }
    } else if (evento.tipoSkill === "cura") {
      const alvo = evento.idsAlvos[0] ? this.localizar(snapshot, evento.idsAlvos[0]) : autor;
      const tx = (alvo ?? autor).x * this.canvas.width;
      const ty = this.centroY((alvo ?? autor).ehHeroi);
      this.efeitos.push({ tipo: "cura", elemento: "vida", cor: "#7df0a0", x: tx, y: ty, ox: tx, oy: ty, tx, ty, prog: 0, passo: 0.03, vida: 34, rastro: [] });
    } else if (evento.tipoSkill === "ressuscitar") {
      const alvo = evento.idsAlvos[0] ? this.localizar(snapshot, evento.idsAlvos[0]) : autor;
      const tx = (alvo ?? autor).x * this.canvas.width;
      this.efeitos.push({ tipo: "resurg", elemento: "luz", cor: "#ffe07a", x: tx, y: this.linhaBase(), ox: tx, oy: this.linhaBase(), tx, ty: this.linhaBase(), prog: 0, passo: 0.025, vida: 40, rastro: [] });
    } else {
      // buff próprio
      this.efeitos.push({ tipo: "buff", elemento: "buff", cor, x: ox, y: oy, ox, oy, tx: ox, ty: oy, prog: 0, passo: 0.04, vida: 26, rastro: [] });
    }
  }

  private atualizarEfeitos(): void {
    const restantes: EfeitoSkill[] = [];
    for (const ef of this.efeitos) {
      ef.vida -= 1;
      if (ef.tipo === "viaja") {
        ef.prog += ef.passo;
        ef.x = ef.ox + (ef.tx - ef.ox) * ef.prog;
        ef.y = ef.oy + (ef.ty - ef.oy) * ef.prog;
        ef.rastro.push({ x: ef.x, y: ef.y });
        if (ef.rastro.length > 12) ef.rastro.shift();
        this.desenharSkillViaja(ef);
        if (ef.prog >= 1) { this.explosao(ef.tx, ef.ty, ef.cor, 16); this.pulsos.push({ x: ef.tx, y: ef.ty, raio: 4, cor: ef.cor, vida: 18 }); continue; }
      } else if (ef.tipo === "cura") {
        this.desenharCura(ef);
      } else if (ef.tipo === "resurg") {
        this.desenharResurg(ef);
      } else {
        this.desenharBuff(ef);
      }
      if (ef.vida > 0) restantes.push(ef);
    }
    this.efeitos = restantes;
  }

  private desenharSkillViaja(ef: EfeitoSkill): void {
    const ctx = this.ctx;
    ef.rastro.forEach((r, i) => {
      const a = i / ef.rastro.length;
      ctx.globalAlpha = a * 0.55;
      ctx.fillStyle = ef.cor;
      const t = 2 + Math.round(a * 6);
      ctx.beginPath(); ctx.arc(r.x, r.y, t, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    const r = 7 + Math.sin(this.tempo * 0.5) * 1.5;
    const grad = ctx.createRadialGradient(ef.x, ef.y, 0, ef.x, ef.y, r * 1.6);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.4, ef.cor);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(ef.x, ef.y, r * 1.6, 0, Math.PI * 2); ctx.fill();
  }

  private desenharCura(ef: EfeitoSkill): void {
    const ctx = this.ctx;
    const prog = 1 - ef.vida / 34;
    ctx.save();
    ctx.globalAlpha = (1 - prog) * 0.9;
    ctx.strokeStyle = ef.cor; ctx.lineWidth = 2;
    const r = 6 + prog * 22;
    ctx.beginPath(); ctx.arc(ef.x, ef.y - 18, r, 0, Math.PI * 2); ctx.stroke();
    // cruzinhas subindo
    ctx.fillStyle = "#d8ffe6";
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + prog * 2;
      const px = ef.x + Math.cos(a) * r * 0.7;
      const py = ef.y - 18 - prog * 16 + Math.sin(a) * 3;
      ctx.fillRect(px - 1, py - 3, 2, 6);
      ctx.fillRect(px - 3, py - 1, 6, 2);
    }
    ctx.restore();
  }

  private desenharResurg(ef: EfeitoSkill): void {
    const ctx = this.ctx;
    const prog = 1 - ef.vida / 40;
    ctx.save();
    const alturaColuna = 44;
    const grad = ctx.createLinearGradient(ef.x, ef.y, ef.x, ef.y - alturaColuna);
    grad.addColorStop(0, `rgba(255,224,122,${(1 - prog) * 0.8})`);
    grad.addColorStop(1, "rgba(255,224,122,0)");
    ctx.fillStyle = grad;
    const larg = 14 * (1 - prog * 0.4);
    ctx.fillRect(ef.x - larg / 2, ef.y - alturaColuna, larg, alturaColuna);
    ctx.globalAlpha = (1 - prog) * 0.9;
    ctx.strokeStyle = ef.cor; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(ef.x, ef.y, 16 * (0.4 + prog), 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  private desenharBuff(ef: EfeitoSkill): void {
    const ctx = this.ctx;
    const prog = 1 - ef.vida / 26;
    ctx.save();
    ctx.globalAlpha = (1 - prog) * 0.8;
    ctx.strokeStyle = ef.cor; ctx.lineWidth = 3;
    const r = 8 + prog * 26;
    ctx.beginPath(); ctx.arc(ef.x, ef.y, r, Math.PI * 0.1, Math.PI * 0.9, false); ctx.stroke();
    ctx.beginPath(); ctx.arc(ef.x, ef.y, r, Math.PI * 1.1, Math.PI * 1.9, false); ctx.stroke();
    ctx.restore();
  }

  // ---------- projéteis (ataques básicos à distância) ----------

  private dispararProjetil(autor: CombatenteSnapshot, alvo: CombatenteSnapshot, dano: number, critico: boolean): void {
    const e = this.estado(autor.id);
    e.faseAtaque = 14;
    e.alvoXNorm = alvo.x;
    e.atira = true;

    const ox = (e.renderX ?? autor.x * this.canvas.width);
    const oy = this.centroY(autor.ehHeroi);
    const tx = alvo.x * this.canvas.width;
    const ty = this.centroY(alvo.ehHeroi);
    const distancia = Math.hypot(tx - ox, ty - oy);
    this.projeteis.push({
      tipo: autor.projetil!, x: ox, y: oy, ox, oy, tx, ty,
      prog: 0, passo: VELOCIDADE_PROJETIL / Math.max(1, distancia),
      rastro: [], idAlvo: alvo.id, dano, critico,
    });
  }

  private atualizarProjeteis(): void {
    const restantes: Projetil[] = [];
    for (const p of this.projeteis) {
      p.prog += p.passo;
      p.x = p.ox + (p.tx - p.ox) * p.prog;
      p.y = p.oy + (p.ty - p.oy) * p.prog;
      p.rastro.push({ x: p.x, y: p.y });
      if (p.rastro.length > 9) p.rastro.shift();
      if (p.prog >= 1) this.impactoProjetil(p);
      else restantes.push(p);
    }
    this.projeteis = restantes;
  }

  private impactoProjetil(p: Projetil): void {
    const alvo = this.ultimo ? this.localizar(this.ultimo, p.idAlvo) : undefined;
    const x = alvo ? alvo.x * this.canvas.width : p.tx;
    const y = alvo ? this.centroY(alvo.ehHeroi) : p.ty;
    if (alvo) this.estado(p.idAlvo).flash = 6;
    this.numeros.push({
      x, y: y - 18, texto: String(p.dano), cor: p.critico ? "#ffcf5c" : "#ffffff", vida: 38,
    });
    this.explosao(x, y, this.corProjetil(p.tipo), 10);
  }

  private aplicarImpacto(alvo: CombatenteSnapshot, dano: number, critico: boolean): void {
    this.estado(alvo.id).flash = 6;
    this.numeros.push({
      x: alvo.x * this.canvas.width, y: this.linhaBase() - 48,
      texto: String(dano), cor: critico ? "#ffcf5c" : "#ffffff", vida: 38,
    });
  }

  // ---------- morte ----------

  private detectarMortes(s: SnapshotCombate): void {
    for (const c of [...s.herois, ...s.inimigos]) {
      const eraVivo = this.vivos.get(c.id);
      if (eraVivo && !c.vivo && this.estado(c.id).faseMorte === 0) {
        this.estado(c.id).faseMorte = FRAMES_MORTE;
        const x = (this.estado(c.id).renderX ?? c.x * this.canvas.width);
        this.explosao(x, this.centroY(c.ehHeroi), c.ehHeroi ? "#6cf2c9" : "#ff6c8b", 18);
      } else if (c.vivo) {
        this.estado(c.id).faseMorte = 0;
      }
      this.vivos.set(c.id, c.vivo);
    }
  }

  // ---------- partículas ----------

  private explosao(x: number, y: number, cor: string, quantidade: number): void {
    for (let i = 0; i < quantidade; i++) {
      const ang = (Math.PI * 2 * i) / quantidade + Math.random();
      const vel = 0.8 + Math.random() * 1.8;
      this.particulas.push({
        x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 0.8,
        vida: 20 + Math.random() * 12, cor, tam: 1 + Math.floor(Math.random() * 2),
      });
    }
  }

  private atualizarParticulas(): void {
    const ctx = this.ctx;
    this.particulas = this.particulas.filter((p) => p.vida > 0);
    for (const p of this.particulas) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.vida -= 1;
      ctx.globalAlpha = Math.max(0, p.vida / 30);
      ctx.fillStyle = p.cor;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.tam, p.tam);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- loop ----------

  private quadro(): void {
    requestAnimationFrame(() => this.quadro());
    if (document.hidden) return;
    this.tempo += 1;
    this.desenhar();
  }

  private desenhar(): void {
    const { width: l, height: a } = this.canvas;
    desenharCenario(this.ctx, l, a, this.linhaBase(), this.tempo);
    if (this.ultimo) {
      this.ultimo.inimigos.forEach((c, i) => this.desenharCombatente(c, i, false));
      this.ultimo.herois.forEach((c, i) => this.desenharCombatente(c, i, true));
    }
    this.atualizarEfeitos();
    this.atualizarProjeteis();
    for (const p of this.projeteis) this.desenharProjetil(p);
    this.atualizarPulsos();
    this.atualizarParticulas();
    this.desenharNumeros();
  }

  private atualizarPulsos(): void {
    const ctx = this.ctx;
    this.pulsos = this.pulsos.filter((p) => p.vida > 0);
    for (const p of this.pulsos) {
      p.raio += 1.8; p.vida -= 1;
      ctx.globalAlpha = Math.max(0, p.vida / 18) * 0.7;
      ctx.strokeStyle = p.cor; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- combatente principal ----------

  private desenharCombatente(c: CombatenteSnapshot, indice: number, ehHeroi: boolean): void {
    const e = this.estado(c.id);
    const ctx = this.ctx;
    const chefe = this.ehChefe(c);
    const personagem = this.personagemDe(c.spriteId);
    const usaFolha = temFolha(personagem);

    // Posição interpolada (suaviza os passos de 10 Hz para 60 fps).
    const homeX = c.x * this.canvas.width;
    if (e.renderX === undefined) e.renderX = homeX;
    e.renderX += (homeX - e.renderX) * SUAVIZACAO_POS;

    const alturaAlvo = ehHeroi ? ALT_ALVO_HEROI : chefe ? ALT_ALVO_BOSS : ALT_ALVO_MONSTRO;
    const espelhar = !ehHeroi; // inimigos enfrentam os heróis (olham à esquerda)

    // ----- morto: animação de morte / dissolução -----
    if (!c.vivo) {
      if (e.faseMorte <= 0) return;
      const prog = 1 - e.faseMorte / FRAMES_MORTE;
      const x = Math.round(e.renderX);
      if (usaFolha) {
        desenharFolha(ctx, personagem, "morrer", { relogio: this.tempo, prog, loop: false }, x, this.linhaBase(), alturaAlvo, espelhar);
      } else {
        this.desenharFallback(c, ehHeroi, chefe, x, this.linhaBase() + prog * 12, 0, 1, "parado", 1 - prog);
      }
      e.faseMorte -= 1;
      return;
    }

    // ----- animação efetiva -----
    const bob = Math.sin(this.tempo * 0.16 + indice * 1.3) * 1.5;
    let animKey = "parado";
    let loop = true;
    let prog = 0;
    if (e.faseAtaque > 0) {
      animKey = "atacar"; loop = false;
      const total = e.atira ? 14 : FRAMES_INVESTIDA;
      prog = (total - e.faseAtaque) / total;
    } else if (c.estadoMov === "conjurar") {
      animKey = "conjurar"; loop = true;
    } else if (c.estadoMov === "avancar" || c.estadoMov === "recuar") {
      animKey = "andar"; loop = true;
    }

    let x = e.renderX;
    if (e.flash > 0) { x += e.flash % 2 === 0 ? 2 : -2; e.flash -= 1; }
    const baseY = this.linhaBase() + bob;

    this.desenharSombra(x, alturaAlvo);
    if (c.raridadeEquip) this.desenharAura(c.raridadeEquip, x, baseY, alturaAlvo, indice);

    if (usaFolha) {
      desenharFolha(ctx, personagem, animKey, { relogio: this.tempo, prog, loop }, Math.round(x), Math.round(baseY), alturaAlvo, espelhar);
    } else {
      this.desenharFallback(c, ehHeroi, chefe, x, baseY, indice, 1, animKey, 1, e, prog);
    }

    // HUD
    const topo = baseY - alturaAlvo;
    if (chefe) {
      this.desenharBarraBoss(x, topo - 6, c.vidaPct, c.nome);
    } else {
      this.desenharNome(c.nome, x, topo - 6, ehHeroi);
      this.desenharBarraVida(x, topo + 2, c.vidaPct, false);
    }
  }

  private desenharSombra(x: number, altura: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(x, this.linhaBase() + 4, altura * 0.20, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private desenharAura(raridade: string, x: number, baseY: number, altura: number, indice: number): void {
    const ctx = this.ctx;
    const cor = COR_RARIDADE_HEX[raridade] ?? "#ffffff";
    const pulso = 0.35 + 0.18 * Math.sin(this.tempo * 0.2 + indice);
    ctx.save();
    ctx.globalAlpha = pulso;
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.ellipse(x, baseY - 2, altura * 0.27, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ----- fallback SVG/pixel quando não há sprite-sheet -----

  private desenharFallback(
    c: CombatenteSnapshot, ehHeroi: boolean, chefe: boolean,
    xBase: number, baseY: number, indice: number, _mult: number,
    animKey: string, alpha: number, e?: EstadoAnim, progAtaque = 0,
  ): void {
    const ctx = this.ctx;
    const sprite = obterSprite(c.spriteId);
    const imgSprite = obterImagemSprite(c.spriteId);
    const usarImagem = imgSprite !== null;

    const escalaBase = ehHeroi ? 3 : chefe ? 4 : 3;
    const altSVGHeroi = ALTURA_SVG_HEROI * escalaBase;
    const altBase = usarImagem && ehHeroi ? altSVGHeroi : sprite.altura * escalaBase;

    let escalaExtra = 1.0;
    let angulo = Math.sin(this.tempo * 0.07 + indice * 1.1) * 0.022;
    let yBob = 0;
    let x = xBase;

    // Movimento procedural a partir do estado (anda/conjura/ataca) para dar vida ao SVG.
    if (animKey === "andar") {
      const passada = Math.sin(this.tempo * 0.4 + indice);
      yBob = -Math.abs(passada) * 2.5;
      angulo += (c.estadoMov === "recuar" ? -1 : 1) * 0.06;
    } else if (animKey === "conjurar") {
      escalaExtra += 0.05 + 0.03 * Math.sin(this.tempo * 0.6);
      angulo += Math.sin(this.tempo * 0.5) * 0.05;
    } else if (animKey === "atacar" && e) {
      const dir = ehHeroi ? 1 : -1;
      if (e.atira) {
        const arco = Math.sin(progAtaque * Math.PI);
        x = xBase - dir * 6 * arco;
        angulo += dir * 0.14 * arco;
        escalaExtra += 0.05 * arco;
      } else if (progAtaque < 0.6) {
        const t = progAtaque / 0.6;
        x = xBase + dir * 10 * t;
        angulo += dir * 0.10 * Math.sin(t * Math.PI * 4);
        yBob = -Math.abs(Math.sin(t * Math.PI * 4)) * 3;
        escalaExtra += 0.1 * t;
      } else {
        const t = (progAtaque - 0.6) / 0.4;
        x = xBase + dir * 10 * (1 - t);
        escalaExtra += 0.16 - t * 0.1;
      }
    }

    const alturaFinal = altBase * escalaExtra;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), Math.round(baseY + yBob));
    if (!ehHeroi) ctx.scale(-1, 1);
    ctx.rotate(angulo);
    ctx.imageSmoothingEnabled = false;
    if (usarImagem) {
      desenharImagemSprite(ctx, c.spriteId, 0, 0, alturaFinal);
    } else {
      const indiceQuadro = Math.floor(this.tempo / 9);
      desenharSprite(ctx, sprite, animKey === "atacar" ? "atacar" : "parado", indiceQuadro, 0, 0, Math.round(escalaBase * escalaExtra));
    }
    if (ehHeroi && c.temArma) this.desenharArma(ctx, c.spriteId, alturaFinal);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ---------- arma por classe (context já em x,baseY+rotate) ----------

  private desenharArma(ctx: CanvasRenderingContext2D, spriteId: string, h: number): void {
    const bx = h * 0.26;
    const by = -(h * 0.52);
    ctx.save();
    ctx.translate(bx, by);

    if (spriteId.includes("cavaleiro")) {
      ctx.fillStyle = "#c8d4f0"; ctx.fillRect(-1, -h*0.32, 3, h*0.38);
      ctx.fillStyle = "#e8f0ff"; ctx.fillRect(0, -h*0.32, 1, h*0.38);
      ctx.fillStyle = "#d0a828"; ctx.fillRect(-7, -h*0.01, 15, 3);
      ctx.fillStyle = "#8a5820"; ctx.fillRect(-1, 3, 3, h*0.13);
      ctx.fillStyle = "#c8a030"; ctx.fillRect(-1, h*0.13+2, 4, 4);
    } else if (spriteId.includes("feiticeira")) {
      const rO = h * 0.078;
      ctx.fillStyle = "#7040c0"; ctx.fillRect(-1, -h*0.40, 2, h*0.52);
      ctx.fillStyle = "#d080ff";
      ctx.beginPath(); ctx.arc(0, -h*0.40, rO, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(255,220,255,0.85)";
      ctx.beginPath(); ctx.arc(-rO*0.45, -h*0.42, rO*0.38, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "rgba(200,120,255,0.5)"; ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + this.tempo * 0.04;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*rO, -h*0.40 + Math.sin(a)*rO);
        ctx.lineTo(Math.cos(a)*rO*2.5, -h*0.40 + Math.sin(a)*rO*2.5);
        ctx.stroke();
      }
    } else if (spriteId.includes("sacerdote")) {
      ctx.fillStyle = "#c8a028"; ctx.fillRect(-1, -h*0.32, 3, h*0.42);
      ctx.fillStyle = "#f0e050"; ctx.fillRect(-5, -h*0.32, 13, 5);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, -h*0.39, 1, 12);
      ctx.fillRect(-4, -h*0.32, 10, 1);
    } else if (spriteId.includes("patrulheiro")) {
      ctx.strokeStyle = "#7a5018"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-h*0.025, 0, h*0.18, -Math.PI*0.52, Math.PI*0.52);
      ctx.stroke();
      ctx.strokeStyle = "#d4c070"; ctx.lineWidth = 1;
      const cx2 = h * 0.155;
      ctx.beginPath();
      ctx.moveTo(cx2, -h*0.17); ctx.lineTo(cx2, h*0.17);
      ctx.stroke();
      ctx.fillStyle = "#a07830";
      ctx.fillRect(cx2 - 1, -h*0.10, h*0.25, 1);
      ctx.fillStyle = "#e8e0c0";
      ctx.fillRect(cx2 + h*0.23, -h*0.115, 3, 4);
    } else if (spriteId.includes("cacador")) {
      ctx.fillStyle = "#b0b8c8"; ctx.fillRect(-1, -h*0.22, 2, h*0.24);
      ctx.fillStyle = "#d0d8e8"; ctx.fillRect(0, -h*0.22, 1, h*0.24);
      ctx.fillStyle = "#4a2a0a"; ctx.fillRect(-2, h*0.02, 5, h*0.09);
      ctx.fillStyle = "#9098a8"; ctx.fillRect(5, -h*0.18, 2, h*0.20);
      ctx.fillStyle = "#4a2a0a"; ctx.fillRect(4, h*0.02, 4, h*0.08);
    } else if (spriteId.includes("carrasco")) {
      ctx.fillStyle = "#7a5018"; ctx.fillRect(-1, -h*0.36, 3, h*0.50);
      ctx.fillStyle = "#909ab0";
      ctx.beginPath();
      ctx.moveTo(2, -h*0.36);
      ctx.lineTo(h*0.22, -h*0.28);
      ctx.lineTo(h*0.22, -h*0.06);
      ctx.lineTo(2, h*0.02);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#c8d0e0";
      ctx.beginPath();
      ctx.moveTo(2, -h*0.34);
      ctx.lineTo(h*0.17, -h*0.26);
      ctx.lineTo(h*0.17, -h*0.10);
      ctx.lineTo(2, -h*0.02);
      ctx.closePath(); ctx.fill();
    }

    ctx.restore();
  }

  // ---------- projéteis ----------

  private desenharProjetil(p: Projetil): void {
    const ctx = this.ctx;
    const ang = Math.atan2(p.ty - p.oy, p.tx - p.ox);
    p.rastro.forEach((r, i) => {
      const a = i / p.rastro.length;
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = this.corProjetil(p.tipo);
      const t = 1 + Math.round(a * 3);
      ctx.fillRect(Math.round(r.x) - t / 2, Math.round(r.y) - t / 2, t, t);
    });
    ctx.globalAlpha = 1;

    if (p.tipo === "flecha") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.fillStyle = "#caa472"; ctx.fillRect(-9, -1, 12, 2);
      ctx.fillStyle = "#e8eef7";
      ctx.beginPath(); ctx.moveTo(3, -3); ctx.lineTo(8, 0); ctx.lineTo(3, 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#9aa0c0"; ctx.fillRect(-9, -3, 3, 2); ctx.fillRect(-9, 1, 3, 2);
      ctx.restore();
    } else {
      const [coreA, coreB] = this.coresOrbe(p.tipo);
      const r = 5 + Math.sin(this.tempo * 0.6) * 1;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      grad.addColorStop(0, coreA);
      grad.addColorStop(1, coreB);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
    }
  }

  private coresOrbe(tipo: string): [string, string] {
    if (tipo === "fogo") return ["#fff2a8", "#ff5c1a"];
    if (tipo === "gelo") return ["#e6fbff", "#3aa9ff"];
    if (tipo === "raio") return ["#fff7c0", "#ffcf3a"];
    return ["#d8fff0", "#2ad6a0"];
  }

  private corProjetil(tipo: string): string {
    return this.coresOrbe(tipo)[1];
  }

  private corElemento(elemento: string, spriteId: string): string {
    if (elemento === "fogo") return "#ff7a2a";
    if (elemento === "gelo") return "#46b6ff";
    if (elemento === "raio") return "#ffd23a";
    if (elemento === "bio") return "#5cd97a";
    return this.corClasse(spriteId);
  }

  private corClasse(spriteId: string): string {
    if (spriteId.includes("sacerdote")) return "#ffd96a";
    if (spriteId.includes("feiticeira")) return "#c06cff";
    if (spriteId.includes("cavaleiro")) return "#6aa0ff";
    if (spriteId.includes("carrasco")) return "#ff6c6c";
    if (spriteId.includes("patrulheiro")) return "#6ee089";
    if (spriteId.includes("cacador")) return "#6cf2ff";
    return "#ff8a8a";
  }

  // ---------- HUD ----------

  private desenharNome(nome: string, x: number, y: number, ehHeroi: boolean): void {
    const ctx = this.ctx;
    const texto = this.encurtar(nome);
    ctx.font = "8px Segoe UI";
    ctx.textAlign = "center";
    const largura = ctx.measureText(texto).width + 6;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x - largura / 2, y - 8, largura, 10);
    ctx.fillStyle = ehHeroi ? "#6cf2c9" : "#ff9aa9";
    ctx.fillText(texto, x, y);
  }

  private desenharBarraVida(x: number, y: number, pct: number, _chefe: boolean): void {
    const ctx = this.ctx;
    const largura = 36;
    const corVida = pct > 0.6 ? "#5cd97a" : pct > 0.3 ? "#f0c040" : "#ff5c5c";
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - largura / 2 - 1, y - 1, largura + 2, 6);
    ctx.fillStyle = "#1a0a0a";
    ctx.fillRect(x - largura / 2, y, largura, 4);
    ctx.fillStyle = corVida;
    ctx.fillRect(x - largura / 2, y, Math.round(largura * Math.max(0, pct)), 4);
  }

  private desenharBarraBoss(x: number, y: number, pct: number, nome: string): void {
    const ctx = this.ctx;
    const largura = 110;
    const corVida = pct > 0.6 ? "#5cd97a" : pct > 0.3 ? "#f0c040" : "#ff5c5c";
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(x - largura / 2 - 2, y - 14, largura + 4, 18);
    ctx.strokeStyle = "#8b3030"; ctx.lineWidth = 1;
    ctx.strokeRect(x - largura / 2 - 2, y - 14, largura + 4, 18);
    ctx.font = "bold 7px Segoe UI"; ctx.textAlign = "center";
    ctx.fillStyle = "#ff8080"; ctx.fillText("⚠ BOSS", x, y - 6);
    ctx.fillStyle = "#ffd0a0"; ctx.font = "7px Segoe UI";
    ctx.fillText(this.encurtar(nome), x, y - 0);
    ctx.fillStyle = "#1a0a0a";
    ctx.fillRect(x - largura / 2, y + 2, largura, 5);
    ctx.fillStyle = corVida;
    ctx.fillRect(x - largura / 2, y + 2, Math.round(largura * Math.max(0, pct)), 5);
  }

  private desenharNumeros(): void {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    this.numeros = this.numeros.filter((n) => n.vida > 0);
    for (const n of this.numeros) {
      n.y -= 0.7; n.vida -= 1;
      const alpha = Math.max(0, n.vida / Math.max(38, n.vida > 38 ? 70 : 38));
      ctx.globalAlpha = alpha;
      const grande = n.texto.length > 5;
      ctx.font = grande ? "bold 9px Segoe UI" : "bold 13px Segoe UI";
      ctx.fillStyle = "#000"; ctx.fillText(n.texto, n.x + 1, n.y + 1);
      ctx.fillStyle = n.cor; ctx.fillText(n.texto, n.x, n.y);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- utilidades ----------

  private estado(id: string): EstadoAnim {
    let e = this.anim.get(id);
    if (!e) {
      e = { faseAtaque: 0, alvoXNorm: 0, flash: 0, atira: false, faseMorte: 0, renderX: undefined };
      this.anim.set(id, e);
    }
    return e;
  }

  private localizar(s: SnapshotCombate, id: string): CombatenteSnapshot | undefined {
    return s.herois.find((c) => c.id === id) ?? s.inimigos.find((c) => c.id === id);
  }

  private personagemDe(spriteId: string): string {
    if (spriteId.startsWith("heroi:")) return spriteId.slice("heroi:".length);
    if (spriteId.startsWith("monstro:")) return `monstros/${spriteId.slice("monstro:".length)}`;
    return spriteId;
  }

  private ehChefe(c: CombatenteSnapshot): boolean {
    return /chefe|Guardião/i.test(c.nome);
  }

  private encurtar(nome: string): string {
    const limpo = nome.split("—")[0]!.split("(")[0]!.trim();
    return limpo.length > 16 ? limpo.slice(0, 15) + "…" : limpo;
  }

  private centroY(ehHeroi: boolean): number {
    return this.linhaBase() - (ehHeroi ? 36 : 18);
  }

  private linhaBase(): number {
    return this.canvas.height - 30 - ALTURA_TASKBAR;
  }
}
