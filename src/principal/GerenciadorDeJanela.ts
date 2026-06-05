// Gerencia a janela frameless always-on-top e o ícone de bandeja (atende 001).

import { BrowserWindow, Tray, Menu, screen, nativeImage, app } from "electron";
import { join } from "node:path";

const ICONE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export interface OpcoesJanela {
  posicaoInicial?: [number, number];
  aoMover: (x: number, y: number) => void;
  aoAlternarPausa: () => boolean;
  aoSair: () => void;
}

const LARGURA_BASE = 520;
const ALTURA_BASE = 420;

export class GerenciadorDeJanela {
  private janela: BrowserWindow | null = null;
  private bandeja: Tray | null = null;
  private larguraEsquerda = 0;
  private larguraDireita = 0;

  constructor(private readonly opcoes: OpcoesJanela) {}

  criar(): void {
    const [x, y] = this.opcoes.posicaoInicial ?? this.posicaoPadrao();
    this.janela = new BrowserWindow({
      width: LARGURA_BASE,
      height: ALTURA_BASE,
      x,
      y,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: false,
      transparent: false,
      backgroundColor: "#0d0f1a",
      webPreferences: {
        preload: join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    this.janela.setAlwaysOnTop(true, "screen-saver");
    void this.janela.loadFile(join(__dirname, "../apresentacao/index.html"));

    this.janela.on("moved", () => {
      if (!this.janela) return;
      const posicao = this.janela.getPosition();
      this.opcoes.aoMover(posicao[0] ?? 0, posicao[1] ?? 0);
    });

    this.criarBandeja();
  }

  enviar(canal: string, dados: unknown): void {
    if (this.janela && !this.janela.isDestroyed()) {
      this.janela.webContents.send(canal, dados);
    }
  }

  minimizar(): void {
    if (!this.janela) return;
    this.janela.setAlwaysOnTop(false);
    this.janela.minimize();
    this.janela.once("restore", () => {
      this.janela?.setAlwaysOnTop(true, "screen-saver");
    });
  }

  expandir(lado: "esquerda" | "direita", larguraPainel: number): void {
    if (!this.janela || this.janela.isDestroyed()) return;
    const area = screen.getPrimaryDisplay().workArea;
    const pos = this.janela.getPosition();
    const cx = pos[0] ?? 0;
    const cy = pos[1] ?? 0;

    if (lado === "esquerda") {
      this.larguraEsquerda = larguraPainel;
    } else {
      this.larguraDireita = larguraPainel;
    }

    const novaLargura = LARGURA_BASE + this.larguraEsquerda + this.larguraDireita;
    const novoX = Math.max(area.x, cx - (lado === "esquerda" ? larguraPainel : 0));
    const novoXClamped = Math.min(novoX, area.x + area.width - novaLargura);

    this.janela.setResizable(true);
    this.janela.setBounds({ x: novoXClamped, y: cy, width: novaLargura, height: ALTURA_BASE }, true);
    this.janela.setResizable(false);
  }

  encolher(lado: "esquerda" | "direita"): void {
    if (!this.janela || this.janela.isDestroyed()) return;
    const pos = this.janela.getPosition();
    const cx = pos[0] ?? 0;
    const cy = pos[1] ?? 0;

    const larPainel = lado === "esquerda" ? this.larguraEsquerda : this.larguraDireita;
    if (lado === "esquerda") this.larguraEsquerda = 0;
    else this.larguraDireita = 0;

    const novaLargura = LARGURA_BASE + this.larguraEsquerda + this.larguraDireita;
    const novoX = lado === "esquerda" ? cx + larPainel : cx;

    this.janela.setResizable(true);
    this.janela.setBounds({ x: novoX, y: cy, width: novaLargura, height: ALTURA_BASE }, true);
    this.janela.setResizable(false);
  }

  get conteudoWeb() {
    return this.janela?.webContents ?? null;
  }

  private criarBandeja(): void {
    const icone = nativeImage.createFromDataURL(ICONE_DATA_URL);
    this.bandeja = new Tray(icone);
    this.bandeja.setToolTip("Heróis da Barra");
    this.atualizarMenuBandeja(false);
    this.bandeja.on("click", () => this.alternarVisibilidade());
  }

  private atualizarMenuBandeja(pausado: boolean): void {
    if (!this.bandeja) return;
    const menu = Menu.buildFromTemplate([
      { label: "Mostrar / Ocultar", click: () => this.alternarVisibilidade() },
      {
        label: pausado ? "Retomar" : "Pausar",
        click: () => {
          const novo = this.opcoes.aoAlternarPausa();
          this.atualizarMenuBandeja(novo);
        },
      },
      { type: "separator" },
      { label: "Sair", click: () => { this.opcoes.aoSair(); app.quit(); } },
    ]);
    this.bandeja.setContextMenu(menu);
  }

  private alternarVisibilidade(): void {
    if (!this.janela) return;
    if (this.janela.isVisible()) this.janela.hide();
    else this.janela.show();
  }

  private posicaoPadrao(): [number, number] {
    const area = screen.getPrimaryDisplay().workArea;
    return [area.x + area.width - LARGURA_BASE - 12, area.y + area.height - ALTURA_BASE - 12];
  }
}
