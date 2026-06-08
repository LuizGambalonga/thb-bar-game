// Constantes de balanceamento e regras. Sem números mágicos espalhados pelo código.

export const TICKS_POR_SEGUNDO = 10;
export const TICK_MS = 1000 / TICKS_POR_SEGUNDO;

export const MAX_PARTY = 3;

export const CONST_DEFESA = 60;
export const CRESCIMENTO_POR_NIVEL = 0.08;

export const MULT_VANTAGEM_ELEMENTAL = 1.25;
export const MULT_DESVANTAGEM_ELEMENTAL = 0.8;
export const MULT_NEUTRO_ELEMENTAL = 1.0;

export const TICKS_INTERVALO_ENTRE_ONDAS = 8; // ~0.8s
export const TICKS_PAUSA_MORTE_PARTY = 25;   // ~2.5s para mostrar heróis mortos
export const TETO_OFFLINE_HORAS_BASE = 2;
export const DURACAO_BUFF_TICKS = 30; // duração padrão de buffs de habilidade

// ─── Movimento e ação em combate (fração de arena 0..1; determinístico) ───────
/** Velocidade de avanço/recuo do herói corpo a corpo (fração de arena por tick). */
export const VELOCIDADE_MOV_HEROI_MELEE = 0.024;
/** Velocidade de reposicionamento do herói à distância/suporte. */
export const VELOCIDADE_MOV_HEROI_RANGED = 0.018;
/** Alcance de ataque do herói corpo a corpo (encosta no inimigo). */
export const ALCANCE_HEROI_MELEE = 0.10;
/** Alcance de ataque do herói à distância/suporte (ataca de longe). */
export const ALCANCE_HEROI_RANGED = 0.55;
/** Distância mínima que o herói à distância tolera antes de recuar (kite). */
export const DISTANCIA_RECUO_RANGED = 0.28;
/** X máximo que um herói pode avançar (não cruza a arena toda). */
export const LIMITE_AVANCO_HEROI = 0.62;
/** X mínimo para onde um herói à distância recua. */
export const LIMITE_RECUO_HEROI = 0.06;
/** Ticks de telegraph/conjuração antes do efeito da habilidade sair. */
export const TICKS_CONJURACAO = 4;
/** Fração da vida máxima curada nos sobreviventes ao fim de cada onda (tensão idle). */
export const FRACAO_CURA_ENTRE_ONDAS = 0.5;
export const LIMITE_INVENTARIO = 60;

/** Custo em ouro para desbloquear o próximo slot de party (índice = slots já abertos). */
export const CUSTO_SLOT_PARTY: Record<number, number> = { 1: 1500, 2: 6000 };

export const VERSAO_ESQUEMA_ATUAL = 4;

export const RARIDADES_ORDENADAS = [
  "comum",
  "incomum",
  "raro",
  "epico",
  "lendario",
  "imortal",
  "arcano",
  "cosmico",
] as const;
