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
export const TETO_OFFLINE_HORAS_BASE = 2;
export const DURACAO_BUFF_TICKS = 30; // duração padrão de buffs de habilidade
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
