// Tipos e entidades do domínio do jogo. TypeScript puro — sem Electron/DOM.

export type Elemento = "fogo" | "bio" | "gelo" | "raio" | "nenhum";

export type Raridade =
  | "comum"
  | "incomum"
  | "raro"
  | "epico"
  | "lendario"
  | "imortal"
  | "arcano"
  | "cosmico";

export type IdClasse =
  | "cavaleiro"
  | "patrulheiro"
  | "feiticeira"
  | "sacerdote"
  | "cacador"
  | "carrasco";

export type EspacoEquipamento =
  | "arma"
  | "armadura"
  | "elmo"
  | "botas"
  | "acessorio1"
  | "acessorio2";

export type Dificuldade = "normal" | "dificil" | "pesadelo" | "kernelPanic";

export type PosicaoFormacao = "frente" | "tras";

/** Estado de movimento/ação de um combatente — guia a animação no renderer. */
export type EstadoMovimento =
  | "parado"
  | "avancar"
  | "recuar"
  | "atacar"
  | "conjurar"
  | "morrendo";

/** Tipo visual de projétil para ataques à distância (ausência = corpo a corpo). */
export type TipoProjetil = "flecha" | "fogo" | "gelo" | "raio";

/** Conjunto de atributos de um combatente. */
export interface Atributos {
  vida: number;
  ataque: number;
  defesa: number;
  /** 0..1 */
  chanceCritico: number;
  /** multiplicador; 1.5 = +50% no golpe crítico */
  multiplicadorCritico: number;
  /** ataques por segundo */
  velocidadeAtaque: number;
  /** 0..1 — fração do dano causado que retorna como cura */
  rouboDeVida: number;
  /** bônus de dano por elemento (0..1) */
  afinidades: Partial<Record<Elemento, number>>;
}

export interface DefHabilidade {
  id: string;
  nome: string;
  cooldownTicks: number;
  tipo: "dano" | "cura" | "buff" | "ressuscitar";
  potencia: number;
  alvo: "menorVidaAliado" | "inimigoFrente" | "todosInimigos" | "proprio" | "aliadoMorto";
}

export interface DefHeroi {
  id: IdClasse;
  nome: string;
  papel: string;
  icone: string;
  elemento: Elemento;
  atributosBase: Atributos;
  habilidades: DefHabilidade[];
  desbloqueio: { custoOuro: number; requer?: string };
  projetil?: TipoProjetil;
  /** true = avança até o inimigo (melee); ausência/false = segura a linha. */
  corpoACorpo?: boolean;
}

export interface DefMonstro {
  id: string;
  nome: string;
  icone: string;
  atributos: Atributos;
  elemento: Elemento;
  familia: string;
  idTabelaEspolio: string;
  xpConcedido: number;
  projetil?: TipoProjetil;
  /** Fração de arena por tick (0..1). Default no motor. */
  velocidadeMovimento?: number;
  /** Distância de ataque em fração de arena. Default no motor. */
  alcanceAtaque?: number;
}

export interface DefOnda {
  idsMonstros: string[];
  quantidade: number;
}

export interface DefFase {
  id: string;
  nome: string;
  ato: 1 | 2 | 3;
  dificuldade: Dificuldade;
  ondas: DefOnda[];
  miniChefe?: string;
  chefe: string;
  requer?: string;
  /** Multiplica vida/ataque/xp dos inimigos (escala de dificuldade). */
  escalaInimigos?: number;
}

export interface DefAfixo {
  id: string;
  atributo: keyof Atributos;
  faixa: [number, number];
  raridadesPermitidas: Raridade[];
}

export interface DefItem {
  id: string;
  nome: string;
  espaco: EspacoEquipamento;
  atributosBase: Partial<Atributos>;
  afixosPermitidos: string[];
  classesAfins?: IdClasse[];
}

export interface ItemInstancia {
  uid: string;
  idDef: string;
  raridade: Raridade;
  afixos: { idDef: string; valor: number }[];
  poder: number;
}

export interface TabelaEspolio {
  id: string;
  pesosRaridade: Record<Raridade, number>;
  faixaOuro: [number, number];
  chanceBau: number;
  /** Probabilidade de cair um item (0..1). Boss sempre 1.0. */
  chanceItem: number;
}

export interface EstadoHeroi {
  idClasse: IdClasse;
  nivel: number;
  xp: number;
  vivo: boolean;
  vidaAtual: number;
  equipamento: Partial<Record<EspacoEquipamento, ItemInstancia>>;
}

export interface EstadoParty {
  slots: (EstadoHeroi | null)[];
  slotsDesbloqueados: number;
  formacao: Record<number, PosicaoFormacao>;
}
