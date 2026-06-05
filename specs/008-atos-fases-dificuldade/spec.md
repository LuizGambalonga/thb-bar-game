# 008 — Atos, Fases & Dificuldade

## Objetivo
3 Atos × 4 dificuldades, gating de progressão, counters elementais (Ato II+), farm de fase limpa.

## Requisitos (EARS)
- **R8.1** O sistema DEVE ter 3 Atos × 4 dificuldades (normal, dificil, pesadelo, kernelPanic).
- **R8.2** SE o normal de um Ato foi limpo, ENTÃO o sistema DEVE liberar o próximo tier.
- **R8.3** O Ato I (normal) DEVE ser totalmente jogável (waves, mini-chefe A Lixeira, chefe).
- **R8.4** A partir do Ato II, o sistema DEVE aplicar counters elementais.
- **R8.5** O sistema DEVE permitir farmar fase já limpa.

## Critérios de Aceite
- Gating respeitado; counters alteram dano no Ato II.

## Design
- `conteudo/fases.ts`, `conteudo/monstros.ts`. `nucleo/atributos` já trata `multElem` via tabela de counter.

## Tarefas
- [ ] T8.1 Gating de tiers + farm.
- [ ] T8.2 Counters elementais (Ato II).
- [ ] T8.3 Conteúdo Atos II e III + chefe KERNEL_PANIC.

## Status: 🟡 MVP cobre Ato I normal
