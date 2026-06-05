// Definições das 6 classes. Todas desbloqueáveis in-game (Cavaleiro inicial).

import type { DefHeroi } from "../nucleo/dominio/tipos.js";

export const HEROIS: DefHeroi[] = [
  {
    id: "cavaleiro",
    nome: "Cavaleiro — o Firewall",
    papel: "Tank",
    icone: "🛡️",
    elemento: "nenhum",
    atributosBase: {
      vida: 120, ataque: 12, defesa: 20, chanceCritico: 0.05,
      multiplicadorCritico: 1.5, velocidadeAtaque: 0.9, rouboDeVida: 0, afinidades: {},
    },
    habilidades: [
      { id: "provocar", nome: "Provocar", cooldownTicks: 50, tipo: "buff", potencia: 0.2, alvo: "proprio" },
    ],
    desbloqueio: { custoOuro: 0 },
  },
  {
    id: "patrulheiro",
    nome: "Patrulheiro — o Pinger",
    papel: "DPS à distância",
    icone: "🏹",
    elemento: "nenhum",
    atributosBase: {
      vida: 70, ataque: 20, defesa: 6, chanceCritico: 0.2,
      multiplicadorCritico: 1.6, velocidadeAtaque: 1.3, rouboDeVida: 0, afinidades: {},
    },
    habilidades: [
      { id: "tiroCerteiro", nome: "Tiro Certeiro", cooldownTicks: 40, tipo: "dano", potencia: 1.8, alvo: "inimigoFrente" },
    ],
    desbloqueio: { custoOuro: 2000 },
    projetil: "flecha",
  },
  {
    id: "feiticeira",
    nome: "Feiticeira — a Compiladora",
    papel: "AoE / elemental",
    icone: "🔮",
    elemento: "fogo",
    atributosBase: {
      vida: 65, ataque: 24, defesa: 5, chanceCritico: 0.1,
      multiplicadorCritico: 1.7, velocidadeAtaque: 0.8, rouboDeVida: 0, afinidades: { fogo: 0.2 },
    },
    habilidades: [
      { id: "estouro", nome: "Estouro de Pilha", cooldownTicks: 60, tipo: "dano", potencia: 1.2, alvo: "todosInimigos" },
    ],
    desbloqueio: { custoOuro: 3500 },
    projetil: "fogo",
  },
  {
    id: "sacerdote",
    nome: "Sacerdote — o Coletor de Lixo",
    papel: "Cura / suporte",
    icone: "✨",
    elemento: "nenhum",
    atributosBase: {
      vida: 80, ataque: 10, defesa: 8, chanceCritico: 0.05,
      multiplicadorCritico: 1.5, velocidadeAtaque: 1.0, rouboDeVida: 0.1, afinidades: {},
    },
    habilidades: [
      { id: "ressuscitar", nome: "Ressuscitar", cooldownTicks: 1200, tipo: "ressuscitar", potencia: 0.30, alvo: "aliadoMorto" },
      { id: "coletar", nome: "Coletar", cooldownTicks: 45, tipo: "cura", potencia: 1.5, alvo: "menorVidaAliado" },
    ],
    desbloqueio: { custoOuro: 5000 },
  },
  {
    id: "cacador",
    nome: "Caçador — o Sandbox",
    papel: "Especialista / controle",
    icone: "🪤",
    elemento: "gelo",
    atributosBase: {
      vida: 75, ataque: 18, defesa: 7, chanceCritico: 0.15,
      multiplicadorCritico: 1.6, velocidadeAtaque: 1.1, rouboDeVida: 0, afinidades: { gelo: 0.15 },
    },
    habilidades: [
      { id: "armadilha", nome: "Armadilha", cooldownTicks: 55, tipo: "dano", potencia: 1.4, alvo: "inimigoFrente" },
    ],
    desbloqueio: { custoOuro: 7000 },
    projetil: "gelo",
  },
  {
    id: "carrasco",
    nome: "Carrasco — o kill -9",
    papel: "Burst corpo-a-corpo",
    icone: "⚔️",
    elemento: "raio",
    atributosBase: {
      vida: 85, ataque: 26, defesa: 8, chanceCritico: 0.25,
      multiplicadorCritico: 1.8, velocidadeAtaque: 1.0, rouboDeVida: 0.05, afinidades: { raio: 0.2 },
    },
    habilidades: [
      { id: "encerrar", nome: "Encerrar Processo", cooldownTicks: 70, tipo: "dano", potencia: 2.5, alvo: "inimigoFrente" },
    ],
    desbloqueio: { custoOuro: 10000 },
  },
];
