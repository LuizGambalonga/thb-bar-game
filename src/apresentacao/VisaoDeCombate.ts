// Renderiza o combate em Canvas2D: cenário, sprites animados que avançam para
// atacar, PROJÉTEIS visíveis com rastro (flecha/fogo/gelo), impacto no alvo e
// ANIMAÇÃO DE MORTE (dissolver + partículas). Loop em requestAnimationFrame.

import type { CombatenteSnapshot, SnapshotCombate } from "../compartilhado/contratos.js";
import { desenharCenario } from "./arte/cenario.js";
import { desenharSprite, obterSprite } from "./arte/sprites.js";

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
interface EstadoAnim { faseAtaque: number; alvoXNorm: number; flash: number; atira: boolean; faseMorte: number; }

const ALTURA_TASKBAR = 12;
const FRAMES_INVESTIDA = 16;
const FRACAO_AVANCO = 0.6;
const FRAMES_MORTE = 24;
const VELOCIDADE_PROJETIL = 6; // pixels por frame

export class VisaoDeCombate {
  private readonly ctx: CanvasRenderingContext2D;
  private ultimo: SnapshotCombate | null = null;
  private numeros: NumeroFlutuante[] = [];
  private particulas: Particula[] = [];
  private projeteis: Projetil[] = [];
  private pulsos: Pulso[] = [];
  private readonly anim = new Map<string, EstadoAnim>();
  private readonly vivos = new Map<string, boolean>();
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

    for (const evento of snapshot.eventos) {
      if (evento.tipo === "habilidade") {
        const autor = this.localizar(snapshot, evento.idAutor);
        if (autor) {
          this.pulsos.push({
            x: autor.x * this.canvas.width, y: this.centroY(autor.ehHeroi),
            raio: 4, cor: autor.ehHeroi ? "#ffe08a" : "#ff8a8a", vida: 16,
          });
        }
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

  // ---------- projéteis ----------

  private dispararProjetil(autor: CombatenteSnapshot, alvo: CombatenteSnapshot, dano: number, critico: boolean): void {
    const e = this.estado(autor.id);
    e.faseAtaque = 10;
    e.alvoXNorm = alvo.x;
    e.atira = true; // pose de tiro com recuo, sem investida

    const ox = autor.x * this.canvas.width;
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

      if (p.prog >= 1) {
        this.impactoProjetil(p);
      } else {
        restantes.push(p);
      }
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
        const x = c.x * this.canvas.width;
        this.explosao(x, this.centroY(c.ehHeroi), c.ehHeroi ? "#6cf2c9" : "#ff6c8b", 16);
      } else if (c.vivo) {
        this.estado(c.id).faseMorte = 0; // reviveu
      }
      this.vivos.set(c.id, c.vivo);
    }
  }

  // ---------- partículas ----------

  private explosao(x: number, y: number, cor: string, quantidade: number): void {
    for (let i = 0; i < quantidade; i++) {
      const ang = (Math.PI * 2 * i) / quantidade + Math.random();
      const vel = 0.8 + Math.random() * 1.6;
      this.particulas.push({
        x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 0.6,
        vida: 18 + Math.random() * 10, cor, tam: 1 + Math.floor(Math.random() * 2),
      });
    }
  }

  private atualizarParticulas(): void {
    const ctx = this.ctx;
    this.particulas = this.particulas.filter((p) => p.vida > 0);
    for (const p of this.particulas) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.vida -= 1;
      ctx.globalAlpha = Math.max(0, p.vida / 28);
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
      p.raio += 1.6; p.vida -= 1;
      ctx.globalAlpha = Math.max(0, p.vida / 16) * 0.7;
      ctx.strokeStyle = p.cor; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private desenharCombatente(c: CombatenteSnapshot, indice: number, ehHeroi: boolean): void {
    const e = this.anim.get(c.id);
    const ctx = this.ctx;
    const sprite = obterSprite(c.spriteId);
    const chefe = this.ehChefe(c);
    const homeX = c.x * this.canvas.width;

    // Morto: anima dissolução por alguns frames, depois some.
    if (!c.vivo) {
      if (!e || e.faseMorte <= 0) return;
      const alpha = e.faseMorte / FRAMES_MORTE;
      const baseY = this.linhaBase() + (1 - alpha) * 10;
      ctx.globalAlpha = alpha;
      desenharSprite(ctx, sprite, "parado", 0, homeX, baseY, ehHeroi ? 3 : chefe ? 4 : 3);
      ctx.globalAlpha = 1;
      e.faseMorte -= 1;
      return;
    }

    let escala = ehHeroi ? 3 : chefe ? 4 : 3;
    const bob = Math.sin(this.tempo * 0.16 + indice * 1.3) * 2;
    let x = homeX;
    let animacao: "parado" | "atacar" = "parado";

    if (e && e.faseAtaque > 0) {
      const progresso = (e.atira ? 10 - e.faseAtaque : FRAMES_INVESTIDA - e.faseAtaque) / (e.atira ? 10 : FRAMES_INVESTIDA);
      const arco = Math.sin(progresso * Math.PI);
      const alvoX = e.alvoXNorm * this.canvas.width;
      const dir = Math.sign(alvoX - homeX) || 1;
      x = e.atira ? homeX - dir * 4 * arco : homeX + (alvoX - homeX) * FRACAO_AVANCO * arco;
      escala *= 1 + (e.atira ? 0.05 : 0.12) * arco;
      if (progresso > 0.2 && progresso < 0.85) animacao = "atacar";
      e.faseAtaque -= 1;
    }
    if (e && e.flash > 0) { x += e.flash % 2 === 0 ? 2 : -2; e.flash -= 1; }

    const baseY = this.linhaBase() + bob;
    const indiceQuadro = Math.floor(this.tempo / 9);

    // Aura do melhor equipamento (cor da raridade).
    if (c.raridadeEquip) {
      const cor = COR_RARIDADE_HEX[c.raridadeEquip] ?? "#ffffff";
      const pulso = 0.4 + 0.2 * Math.sin(this.tempo * 0.2 + indice);
      ctx.save();
      ctx.globalAlpha = pulso;
      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.ellipse(x, baseY - 2, sprite.largura * escala * 0.55, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    desenharSprite(ctx, sprite, animacao, indiceQuadro, x, baseY, escala);

    // Brilho da arma equipada (mais visível ao atacar).
    if (c.temArma) {
      ctx.globalAlpha = animacao === "atacar" ? 0.9 : 0.4;
      ctx.fillStyle = "#fff7d0";
      ctx.fillRect(Math.round(x + sprite.largura * escala * 0.4), Math.round(baseY - sprite.altura * escala * 0.55), 2, 6);
      ctx.globalAlpha = 1;
    }

    const topo = baseY - sprite.altura * escala;
    if (chefe) {
      this.desenharBarraBoss(x, topo - 14, c.vidaPct, c.nome);
    } else {
      this.desenharNome(c.nome, x, topo - 14, ehHeroi);
      this.desenharBarraVida(x, topo - 6, c.vidaPct, false);
    }
  }

  // ---------- desenho de projétil por tipo ----------

  private desenharProjetil(p: Projetil): void {
    const ctx = this.ctx;
    const ang = Math.atan2(p.ty - p.oy, p.tx - p.ox);
    // rastro
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
      ctx.fillStyle = "#caa472"; ctx.fillRect(-9, -1, 12, 2); // haste
      ctx.fillStyle = "#e8eef7"; // ponta
      ctx.beginPath(); ctx.moveTo(3, -3); ctx.lineTo(8, 0); ctx.lineTo(3, 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#9aa0c0"; ctx.fillRect(-9, -3, 3, 2); ctx.fillRect(-9, 1, 3, 2); // penas
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
      ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2); // núcleo brilhante
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

  // ---------- HUD sobre os combatentes ----------

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
    // Fundo com borda
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(x - largura / 2 - 2, y - 14, largura + 4, 18);
    ctx.strokeStyle = "#8b3030";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - largura / 2 - 2, y - 14, largura + 4, 18);
    // Label BOSS
    ctx.font = "bold 7px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff8080";
    ctx.fillText("⚠ BOSS", x, y - 6);
    // Nome curto
    ctx.fillStyle = "#ffd0a0";
    ctx.font = "7px Segoe UI";
    ctx.fillText(this.encurtar(nome), x, y - 0);
    // Barra de vida
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
    if (!e) { e = { faseAtaque: 0, alvoXNorm: 0, flash: 0, atira: false, faseMorte: 0 }; this.anim.set(id, e); }
    return e;
  }

  private localizar(s: SnapshotCombate, id: string): CombatenteSnapshot | undefined {
    return s.herois.find((c) => c.id === id) ?? s.inimigos.find((c) => c.id === id);
  }

  private ehChefe(c: CombatenteSnapshot): boolean {
    return /chefe|Guardião/i.test(c.nome);
  }

  private encurtar(nome: string): string {
    const limpo = nome.split("—")[0]!.split("(")[0]!.trim();
    return limpo.length > 16 ? limpo.slice(0, 15) + "…" : limpo;
  }

  private centroY(ehHeroi: boolean): number {
    return this.linhaBase() - (ehHeroi ? 28 : 16);
  }

  private linhaBase(): number {
    return this.canvas.height - 30 - ALTURA_TASKBAR;
  }
}
