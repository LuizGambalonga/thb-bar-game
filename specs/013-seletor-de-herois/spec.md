# 013 — Seletor de Heróis (Hero Selector)

## Objetivo
Todos os heróis liberados para **escolher** desde o início; o que progride é a **quantidade de slots** da party. Tela dedicada de seleção com preview do personagem.

## Requisitos (EARS)
- **R13.1** No começo do jogo, o sistema DEVE deixar **todas as 6 classes disponíveis para escolha** (não bloqueadas por ouro).
- **R13.2** O sistema DEVE ter uma janela **"Seletor de Heróis"** mostrando cada classe com **preview do sprite (maior)**, nome, papel e atributos-base.
- **R13.3** QUANDO o jogador escolhe um herói para um slot desbloqueado, o sistema DEVE posicioná-lo na party.
- **R13.4** O que é desbloqueado **ao longo do jogo** são os **slots adicionais** de party (2º e 3º), não as classes.

## Critérios de Aceite
- Logo no início dá pra escolher qualquer um dos 6; abrir 2º slot permite montar dupla.

## Design
- `criarJogoNovo`: `heroisDesbloqueados` = todas as classes.
- Remove gating por ouro das classes; mantém `desbloquearSlotParty`.
- Janela `modal-herois` (ver 014) renderiza preview via mesmo sistema de sprite, em escala maior.

## Status: 🟢 implementado neste ciclo
