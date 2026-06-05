// Carregador de pixel art. A DEFINIÇÃO da arte vive em assets/arte/sprites.json
// (asset de dados, não hardcoded). Aqui só montamos os sprites e desenhamos.

import dadosArte from "../../../assets/arte/sprites.json";

export type Animacao = "parado" | "atacar";

export interface Sprite {
  largura: number;
  altura: number;
  paleta: Record<string, string>;
  parado: string[][];
  atacar: string[][];
}

interface DadosArte {
  heroiTemplate: { largura: number; altura: number; paletaBase: Record<string, string>; parado: string[][]; atacar: string[][] };
  classes: Record<string, { claro: string; escuro: string }>;
  monstros: Record<string, { largura: number; altura: number; paleta: Record<string, string>; parado: string[][]; atacar: string[][] }>;
}

const arte = dadosArte as DadosArte;

function montarSprites(): Record<string, Sprite> {
  const mapa: Record<string, Sprite> = {};
  const t = arte.heroiTemplate;
  for (const [id, cores] of Object.entries(arte.classes)) {
    mapa[`heroi:${id}`] = {
      largura: t.largura,
      altura: t.altura,
      paleta: { ...t.paletaBase, a: cores.claro, d: cores.escuro },
      parado: t.parado,
      atacar: t.atacar,
    };
  }
  for (const [id, m] of Object.entries(arte.monstros)) {
    mapa[`monstro:${id}`] = { largura: m.largura, altura: m.altura, paleta: m.paleta, parado: m.parado, atacar: m.atacar };
  }
  return mapa;
}

export const SPRITES: Record<string, Sprite> = montarSprites();

const SPRITE_PADRAO: Sprite = SPRITES["heroi:cavaleiro"]!;

export function obterSprite(spriteId: string): Sprite {
  return SPRITES[spriteId] ?? SPRITE_PADRAO;
}

/** Desenha um sprite com a base (pés) ancorada em (centroX, baseY). Tolerante a linhas de tamanhos diferentes. */
export function desenharSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  animacao: Animacao,
  indiceQuadro: number,
  centroX: number,
  baseY: number,
  escala: number,
): void {
  const frames = animacao === "atacar" ? sprite.atacar : sprite.parado;
  const quadro = frames[indiceQuadro % frames.length]!;
  const offsetX = Math.round(centroX - (sprite.largura * escala) / 2);
  const offsetY = Math.round(baseY - sprite.altura * escala);
  for (let r = 0; r < quadro.length; r++) {
    const linha = quadro[r]!;
    for (let c = 0; c < linha.length; c++) {
      const cor = sprite.paleta[linha[c]!];
      if (!cor) continue;
      ctx.fillStyle = cor;
      ctx.fillRect(offsetX + c * escala, offsetY + r * escala, escala, escala);
    }
  }
}
