# 010 — Desempenho & Acessibilidade

## Objetivo
Idle leve (< 3% CPU, < 200 MB RAM), velocidade ajustável, opções de acessibilidade.

## Requisitos (EARS)
- **R10.1** ENQUANTO idle docado, o sistema DEVE manter < 3% CPU e < 200 MB RAM.
- **R10.2** O sistema DEVE oferecer velocidade 1x (2x/3x desbloqueáveis).
- **R10.3** O sistema DEVE oferecer mute, reduzir flashes e escala de UI.
- **R10.4** O sistema DEVE rodar em Windows 10/11 64-bit.

## Critérios de Aceite
- Profiling idle dentro do orçamento; "reduzir flashes" remove efeitos intensos.

## Design
- Throttle de snapshot, pausar render oculto; velocidade = mais ticks por intervalo (determinístico).

## Tarefas
- [ ] T10.1 Velocidade 1x (2x/3x via runa).
- [ ] T10.2 Opções de acessibilidade.
- [ ] T10.3 Profiling idle.

## Status: 🟡 MVP cobre 1x e janela Win
