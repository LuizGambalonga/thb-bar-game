// Pipeline de sprite-sheets de personagens. Suporta dois modos:
//  • GRADE: uma folha única (ex.: Calciumtrice 10×10, 32px) — `folha`+`colunas`+
//    `linhas`+`linhaBase`, cada animação aponta uma `linha`.
//  • STRIP: um PNG por animação (ex.: LuizMelo) — `arquivo` por animação; o tamanho
//    do frame é derivado da imagem (largura/contagem).
// Sem manifesto/arquivos → o renderer cai no fallback (SVG).

export interface DefAnimacao {
  arquivo?: string; // modo strip
  linha?: number;   // modo grade
  frames: number;
  loop: boolean;
}

export interface DefPersonagem {
  fps: number;
  /** Fração da altura do frame onde ficam os pés (ancoragem no chão). */
  ancoraY: number;
  // modo grade:
  folha?: string;
  colunas?: number;
  linhas?: number;
  linhaBase?: number;
  animacoes: Record<string, DefAnimacao>;
}

type Manifesto = Record<string, DefPersonagem>;

const CAMINHO_BASE = "../assets/arte/personagens";

let manifesto: Manifesto | null = null;
const imagens = new Map<string, HTMLImageElement>();

function chave(personagem: string, arquivo: string): string {
  return `${personagem}|${arquivo}`;
}

function carregarImagem(personagem: string, arquivo: string): void {
  const k = chave(personagem, arquivo);
  if (imagens.has(k)) return;
  const img = new Image();
  img.src = encodeURI(`${CAMINHO_BASE}/${personagem}/${arquivo}`);
  imagens.set(k, img);
}

/** Carrega o manifesto e pré-carrega as folhas. Silencioso se não houver manifesto. */
export async function carregarFolhasSprite(): Promise<void> {
  try {
    const resp = await fetch(`${CAMINHO_BASE}/manifesto.json`, { cache: "no-cache" });
    if (!resp.ok) return;
    manifesto = (await resp.json()) as Manifesto;
    for (const [personagem, def] of Object.entries(manifesto)) {
      if (def.folha) {
        carregarImagem(personagem, def.folha);
      } else {
        for (const anim of Object.values(def.animacoes)) {
          if (anim.arquivo) carregarImagem(personagem, anim.arquivo);
        }
      }
    }
  } catch {
    manifesto = null;
  }
}

function pronta(img: HTMLImageElement | undefined): img is HTMLImageElement {
  return !!img && img.complete && img.naturalWidth > 0;
}

function arquivoDe(def: DefPersonagem, anim: DefAnimacao): string | undefined {
  return def.folha ?? anim.arquivo;
}

/** Há folha pronta para este personagem? */
export function temFolha(personagem: string): boolean {
  const def = manifesto?.[personagem];
  if (!def) return false;
  const anim = def.animacoes["parado"] ?? Object.values(def.animacoes)[0];
  if (!anim) return false;
  const arq = arquivoDe(def, anim);
  return !!arq && pronta(imagens.get(chave(personagem, arq)));
}

export interface RelogioAnim {
  relogio: number; // contador contínuo (loop)
  prog: number;    // 0..1 (disparo único)
  loop: boolean;
}

/**
 * Desenha o frame correto, ancorado pelos pés em (x, baseY), escalado para
 * `alturaAlvo`. Devolve false se não houver folha disponível.
 */
export function desenharFolha(
  ctx: CanvasRenderingContext2D,
  personagem: string,
  animKey: string,
  t: RelogioAnim,
  x: number,
  baseY: number,
  alturaAlvo: number,
  espelhar: boolean,
): boolean {
  const def = manifesto?.[personagem];
  if (!def) return false;
  let anim = def.animacoes[animKey] ?? def.animacoes["parado"];
  if (!anim) return false;
  let arq = arquivoDe(def, anim);
  let img = arq ? imagens.get(chave(personagem, arq)) : undefined;
  if (!pronta(img)) {
    // tenta 'parado' se a animação pedida não carregou
    const base = def.animacoes["parado"];
    const arqB = base ? arquivoDe(def, base) : undefined;
    const imgB = arqB ? imagens.get(chave(personagem, arqB)) : undefined;
    if (!base || !pronta(imgB)) return false;
    anim = base; img = imgB;
  }

  const emGrade = !!def.folha;
  const colunas = emGrade ? (def.colunas ?? 1) : anim.frames;
  const linhas = emGrade ? (def.linhas ?? 1) : 1;
  const larguraFrame = img.naturalWidth / colunas;
  const alturaFrame = img.naturalHeight / linhas;

  const n = Math.max(1, anim.frames);
  const indice = t.loop
    ? Math.floor((t.relogio * def.fps) / 60) % n
    : Math.min(n - 1, Math.max(0, Math.floor(t.prog * n)));

  const linha = emGrade ? (def.linhaBase ?? 0) + (anim.linha ?? 0) : 0;
  const sx = indice * larguraFrame;
  const sy = linha * alturaFrame;

  const escala = alturaAlvo / alturaFrame;
  const larguraAlvo = larguraFrame * escala;

  ctx.save();
  ctx.imageSmoothingEnabled = false; // pixel art nítido
  ctx.translate(Math.round(x), Math.round(baseY));
  if (espelhar) ctx.scale(-1, 1);
  const topo = -alturaAlvo * def.ancoraY;
  ctx.drawImage(
    img, sx, sy, larguraFrame, alturaFrame,
    -larguraAlvo / 2, topo, larguraAlvo, alturaAlvo,
  );
  ctx.restore();
  return true;
}
