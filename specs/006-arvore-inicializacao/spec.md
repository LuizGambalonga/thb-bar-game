# 006 — Árvore de Inicialização (Runas / Boot Tree)

## Objetivo
~197 nós que dão stats passivos e desbloqueios (slots de party, automação, teto offline).

## Requisitos (EARS)
- **R6.1** O sistema DEVE prover ~197 nós com stats e desbloqueios.
- **R6.2** QUANDO o jogador gasta pontos num nó com pré-requisitos, o sistema DEVE aplicar o efeito.
- **R6.3** O sistema DEVE permitir respec com custo, sem corromper o save.

## Critérios de Aceite
- "Runa de Comando" abre o 2º slot de party; respec devolve pontos e remove efeitos.

## Design
- `conteudo/nosRuna.ts` (grafo sem ciclos) + `nucleo/runas/ArvoreDeRunas.ts`.

## Tarefas
- [ ] T6.1 Conteúdo dos nós + validação de grafo.
- [ ] T6.2 Alocação com pré-requisitos + efeitos.
- [ ] T6.3 Respec.
- [ ] T6.4 UI da árvore.

## Status: ⚪ pós-MVP (Fase 6)
