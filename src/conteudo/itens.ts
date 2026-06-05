// Definições de itens e afixos (data-driven).

import type { DefAfixo, DefItem, Raridade } from "../nucleo/dominio/tipos.js";

const TODAS_RARIDADES_COM_AFIXO: Raridade[] = [
  "incomum", "raro", "epico", "lendario", "imortal", "arcano", "cosmico",
];

export const AFIXOS: DefAfixo[] = [
  { id: "afx-ataque", atributo: "ataque", faixa: [2, 10], raridadesPermitidas: TODAS_RARIDADES_COM_AFIXO },
  { id: "afx-vida", atributo: "vida", faixa: [10, 45], raridadesPermitidas: TODAS_RARIDADES_COM_AFIXO },
  { id: "afx-defesa", atributo: "defesa", faixa: [1, 7], raridadesPermitidas: TODAS_RARIDADES_COM_AFIXO },
  { id: "afx-critico", atributo: "chanceCritico", faixa: [0.02, 0.08], raridadesPermitidas: ["raro", "epico", "lendario", "imortal", "arcano", "cosmico"] },
  { id: "afx-velocidade", atributo: "velocidadeAtaque", faixa: [0.05, 0.2], raridadesPermitidas: ["epico", "lendario", "imortal", "arcano", "cosmico"] },
];

export const ITENS: DefItem[] = [
  // Armas — corpo a corpo (guerreiros)
  { id: "espada-bit", nome: "Espada de Bits", espaco: "arma",
    atributosBase: { ataque: 8 }, afixosPermitidos: ["afx-ataque", "afx-critico", "afx-velocidade"],
    classesAfins: ["cavaleiro", "carrasco"] },
  { id: "machado-kernel", nome: "Machado do Kernel", espaco: "arma",
    atributosBase: { ataque: 12 }, afixosPermitidos: ["afx-ataque", "afx-critico"],
    classesAfins: ["carrasco"] },
  // Armas — distância/arqueiros
  { id: "arco-pixel", nome: "Arco de Pixel", espaco: "arma",
    atributosBase: { ataque: 6, velocidadeAtaque: 0.2 }, afixosPermitidos: ["afx-ataque", "afx-critico", "afx-velocidade"],
    classesAfins: ["cacador", "patrulheiro"] },
  // Armas — magia
  { id: "cajado-byte", nome: "Cajado de Byte", espaco: "arma",
    atributosBase: { ataque: 10, chanceCritico: 0.05 }, afixosPermitidos: ["afx-ataque", "afx-critico"],
    classesAfins: ["feiticeira", "sacerdote"] },
  { id: "varinha-cache", nome: "Varinha de Cache", espaco: "arma",
    atributosBase: { ataque: 7, chanceCritico: 0.07 }, afixosPermitidos: ["afx-ataque", "afx-critico", "afx-velocidade"],
    classesAfins: ["feiticeira"] },
  // Armaduras — pesadas (guerreiros)
  { id: "armadura-cache", nome: "Armadura de Cache", espaco: "armadura",
    atributosBase: { vida: 25, defesa: 5 }, afixosPermitidos: ["afx-vida", "afx-defesa"],
    classesAfins: ["cavaleiro", "carrasco"] },
  // Armaduras — leves (ranger)
  { id: "colete-ping", nome: "Colete de Ping", espaco: "armadura",
    atributosBase: { vida: 15, defesa: 2, velocidadeAtaque: 0.05 }, afixosPermitidos: ["afx-vida", "afx-defesa", "afx-velocidade"],
    classesAfins: ["cacador", "patrulheiro"] },
  // Armaduras — pano (magos)
  { id: "manto-ram", nome: "Manto de RAM", espaco: "armadura",
    atributosBase: { vida: 12, chanceCritico: 0.03 }, afixosPermitidos: ["afx-vida", "afx-critico"],
    classesAfins: ["feiticeira", "sacerdote"] },
  // Elmos
  { id: "elmo-pixel", nome: "Elmo de Pixel", espaco: "elmo",
    atributosBase: { vida: 15, defesa: 2 }, afixosPermitidos: ["afx-vida", "afx-defesa", "afx-critico"],
    classesAfins: ["cavaleiro", "carrasco"] },
  { id: "capuz-thread", nome: "Capuz de Thread", espaco: "elmo",
    atributosBase: { vida: 10, chanceCritico: 0.04 }, afixosPermitidos: ["afx-vida", "afx-critico"],
    classesAfins: ["feiticeira", "cacador", "patrulheiro"] },
  { id: "tiara-cpu", nome: "Tiara de CPU", espaco: "elmo",
    atributosBase: { vida: 8, chanceCritico: 0.05, velocidadeAtaque: 0.05 }, afixosPermitidos: ["afx-vida", "afx-critico", "afx-velocidade"],
    classesAfins: ["sacerdote", "feiticeira"] },
  // Botas
  { id: "botas-ping", nome: "Botas de Ping", espaco: "botas",
    atributosBase: { defesa: 1, velocidadeAtaque: 0.1 }, afixosPermitidos: ["afx-velocidade", "afx-defesa"] },
  { id: "sandalia-lag", nome: "Sandália de Lag", espaco: "botas",
    atributosBase: { velocidadeAtaque: 0.15 }, afixosPermitidos: ["afx-velocidade", "afx-critico"],
    classesAfins: ["cacador", "patrulheiro", "feiticeira"] },
  // Acessórios
  { id: "anel-bit", nome: "Anel de Bit", espaco: "acessorio1",
    atributosBase: { ataque: 3, chanceCritico: 0.03 }, afixosPermitidos: ["afx-ataque", "afx-critico", "afx-vida"] },
  { id: "amuleto-fps", nome: "Amuleto de FPS", espaco: "acessorio1",
    atributosBase: { vida: 20, rouboDeVida: 0.02 }, afixosPermitidos: ["afx-vida", "afx-ataque"] },
];
