// Pré-carrega SVGs de heróis e monstros para uso com ctx.drawImage().
// Caminhos relativos ao HTML em dist/apresentacao/.

const HEROIS = ["cavaleiro", "feiticeira", "patrulheiro", "sacerdote", "cacador", "carrasco"] as const;
const MONSTROS = [
  "grub-binario", "espectro-zumbi", "raposa-neon", "morcego-viral",
  "leviata-dados", "lobo-corrompido", "verme-abismo", "golem-hardware",
] as const;

const cache = new Map<string, HTMLImageElement>();
let iniciado = false;

function carregar(src: string, chave: string): void {
  const img = new Image();
  img.src = src;
  cache.set(chave, img);
}

export function preCarregarImagensSprites(): void {
  if (iniciado) return;
  iniciado = true;
  for (const id of HEROIS) carregar(`../assets/arte/herois/${id}.svg`, `heroi:${id}`);
  for (const id of MONSTROS) carregar(`../assets/arte/monstros/${id}.svg`, `monstro:${id}`);
}

export function obterImagemSprite(spriteId: string): HTMLImageElement | null {
  const img = cache.get(spriteId);
  return img?.complete && img.naturalWidth > 0 ? img : null;
}

/** Aspectos padrão por prefixo de spriteId (largura/altura do SVG de origem). */
const ASPECT: Record<string, number> = {
  "heroi:":                  14 / 24,
  "monstro:grub-binario":    12 / 8,
  "monstro:espectro-zumbi":  12 / 20,
  "monstro:raposa-neon":     14 / 12,
  "monstro:morcego-viral":   16 / 10,
  "monstro:leviata-dados":   14 / 22,
  "monstro:lobo-corrompido": 14 / 16,
  "monstro:verme-abismo":    16 / 14,
  "monstro:golem-hardware":  14 / 22,
};

function aspectRatio(spriteId: string): number {
  if (spriteId.startsWith("heroi:")) return ASPECT["heroi:"]!;
  return ASPECT[spriteId] ?? 1;
}

/**
 * Desenha o sprite SVG com o pé ancorando em (centroX, baseY).
 * Se a imagem ainda não carregou, não desenha nada (será desenhada no próximo frame).
 */
export function desenharImagemSprite(
  ctx: CanvasRenderingContext2D,
  spriteId: string,
  centroX: number,
  baseY: number,
  altura: number,
): boolean {
  const img = cache.get(spriteId);
  if (!img || !img.complete || img.naturalWidth === 0) return false;
  const largura = Math.round(aspectRatio(spriteId) * altura);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(centroX - largura / 2), Math.round(baseY - altura), largura, altura);
  return true;
}
