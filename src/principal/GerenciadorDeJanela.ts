// Gerencia a janela frameless always-on-top e o ícone de bandeja (atende 001).
// Painéis laterais (Mochila/Portal) abrem como janelas Electron separadas e flutuantes.

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
const LARGURA_MOCHILA = 540;
const LARGURA_PORTAL = 380;
const ALTURA_PAINEL = 560;

export class GerenciadorDeJanela {
  private janela: BrowserWindow | null = null;
  private bandeja: Tray | null = null;
  private janelasMochila: BrowserWindow | null = null;
  private janelasPortal: BrowserWindow | null = null;

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
      // Reposiciona painéis flutuantes se a janela principal se mover
      this.reposicionarPaineis();
    });

    this.criarBandeja();
  }

  /** Envia mensagem somente para a janela principal. */
  enviar(canal: string, dados: unknown): void {
    if (this.janela && !this.janela.isDestroyed()) {
      this.janela.webContents.send(canal, dados);
    }
  }

  /** Broadcast para todas as janelas abertas (principal + painéis). */
  emitirParaTodos(canal: string, dados: unknown): void {
    const janelas = [this.janela, this.janelasMochila, this.janelasPortal];
    for (const j of janelas) {
      if (j && !j.isDestroyed()) j.webContents.send(canal, dados);
    }
  }

  /** Alterna o painel flutuante: abre se fechado, fecha se aberto. */
  abrirOuFecharPainel(painel: "mochila" | "portal"): void {
    const janelaPainel = painel === "mochila" ? this.janelasMochila : this.janelasPortal;
    if (janelaPainel && !janelaPainel.isDestroyed()) {
      janelaPainel.destroy();
      if (painel === "mochila") this.janelasMochila = null;
      else this.janelasPortal = null;
    } else {
      this.criarJanelaPainel(painel);
    }
  }

  /** Fecha (destrói) o painel flutuante. */
  fecharPainel(painel: "mochila" | "portal"): void {
    const janelaPainel = painel === "mochila" ? this.janelasMochila : this.janelasPortal;
    if (janelaPainel && !janelaPainel.isDestroyed()) janelaPainel.destroy();
    if (painel === "mochila") this.janelasMochila = null;
    else this.janelasPortal = null;
  }

  minimizar(): void {
    if (!this.janela) return;
    this.janela.setAlwaysOnTop(false);
    this.janela.minimize();
    this.janela.once("restore", () => {
      this.janela?.setAlwaysOnTop(true, "screen-saver");
    });
  }

  get conteudoWeb() {
    return this.janela?.webContents ?? null;
  }

  // ---- criação do painel flutuante ----

  private criarJanelaPainel(painel: "mochila" | "portal"): void {
    if (!this.janela || this.janela.isDestroyed()) return;
    const area = screen.getPrimaryDisplay().workArea;
    const mainBounds = this.janela.getBounds();
    const largura = painel === "mochila" ? LARGURA_MOCHILA : LARGURA_PORTAL;

    let x: number;
    if (painel === "mochila") {
      x = Math.max(area.x, mainBounds.x - largura);
    } else {
      x = Math.min(mainBounds.x + mainBounds.width, area.x + area.width - largura);
    }
    const y = mainBounds.y;

    const janelaPainel = new BrowserWindow({
      width: largura,
      height: ALTURA_PAINEL,
      minWidth: 300,
      minHeight: 320,
      x,
      y,
      frame: false,
      resizable: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      transparent: false,
      backgroundColor: "#0d0f1a",
      webPreferences: {
        preload: join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    janelaPainel.setAlwaysOnTop(true, "screen-saver");
    void janelaPainel.loadFile(join(__dirname, "../apresentacao/index.html"), {
      query: { painel },
    });

    if (painel === "mochila") {
      this.janelasMochila = janelaPainel;
      janelaPainel.on("closed", () => { this.janelasMochila = null; });
    } else {
      this.janelasPortal = janelaPainel;
      janelaPainel.on("closed", () => { this.janelasPortal = null; });
    }
  }

  /** Reposiciona as janelas de painel quando a janela principal se move. */
  private reposicionarPaineis(): void {
    if (!this.janela || this.janela.isDestroyed()) return;
    const area = screen.getPrimaryDisplay().workArea;
    const mainBounds = this.janela.getBounds();

    if (this.janelasMochila && !this.janelasMochila.isDestroyed()) {
      const x = Math.max(area.x, mainBounds.x - LARGURA_MOCHILA);
      this.janelasMochila.setPosition(x, mainBounds.y);
    }
    if (this.janelasPortal && !this.janelasPortal.isDestroyed()) {
      const x = Math.min(mainBounds.x + mainBounds.width, area.x + area.width - LARGURA_PORTAL);
      this.janelasPortal.setPosition(x, mainBounds.y);
    }
  }

  // ---- bandeja ----

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
