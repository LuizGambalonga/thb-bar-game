// Carrega SVGs dos heróis como imagens pré-cacheadas para uso com ctx.drawImage().
// Caminhos resolvidos relativos ao HTML em dist/apresentacao/.

const CAMINHO_BASE = "../assets/arte/herois/";

const CLASSES_COM_IMAGEM = ["cavaleiro", "feiticeira", "patrulheiro", "sacerdote", "cacador", "carrasco"] as const;

const cache = new Map<string, HTMLImageElement>();
let carregamentoIniciado = false;

export function preCarregarImagensHerois(): void {
  if (carregamentoIniciado) return;
  carregamentoIniciado = true;
  for (const id of CLASSES_COM_IMAGEM) {
    const img = new Image();
    img.src = `${CAMINHO_BASE}${id}.svg`;
    cache.set(id, img);
  }
}

export function obterImagemHeroi(classeId: string): HTMLImageElement | null {
  return cache.get(classeId) ?? null;
}

/** Desenha o herói usando drawImage (SVG escalado), ancorado pela base dos pés. */
export function desenharImagemHeroi(
  ctx: CanvasRenderingContext2D,
  classeId: string,
  centroX: number,
  baseY: number,
  altura: number,
): void {
  const img = cache.get(classeId);
  if (!img || !img.complete || img.naturalWidth === 0) return;
  const largura = Math.round((32 / 48) * altura);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(centroX - largura / 2), Math.round(baseY - altura), largura, altura);
}
