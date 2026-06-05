# 007 — Progressão Idle & Offline  `[MVP parcial]`

## Objetivo
Suplemento offline limitado e justo; resumo ao reabrir.

## Requisitos (EARS)
- **R7.1** O sistema DEVE persistir o timestamp do último acesso.
- **R7.2** QUANDO o jogo abre após fechado, o sistema DEVE conceder suplemento de XP/ouro proporcional, com teto, **sem** itens/baús.
- **R7.3** O suplemento offline DEVE ser ampliável via Árvore de Inicialização.
- **R7.4** O sistema DEVE mostrar resumo "enquanto você esteve fora".

## Critérios de Aceite
- 1h fechado < 1h aberto; nunca dropa item offline.

## Design
- `nucleo/progressao/RendimentoOffline.ts` (puro) + `principal/ServicoOffline.ts` (lê `ultimoAcesso`, aplica teto).

## Tarefas
- [ ] T7.1 Persistir `ultimoAcesso`.
- [ ] T7.2 Cálculo de suplemento com teto.
- [ ] T7.3 Ampliação por runa.
- [ ] T7.4 Modal de resumo.

## Status: 🟢 MVP implementado (cálculo com teto + modal de resumo)
