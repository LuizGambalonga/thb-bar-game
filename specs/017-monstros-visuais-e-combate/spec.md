# 017 — Monstros: Visuais, Escala e Barras de Vida  `[BUGFIX + FEATURE]`

## Contexto
Os monstros estão renderizados em escala 2× (24×24 px), quase invisíveis contra o fundo escuro.
As barras de vida existem no código mas somem ou são imperceptíveis na prática.
Os sprites de boss não se distinguem visualmente dos inimigos comuns.

## Referência visual
Ver `exemplos/exemplo-do-mapa-e-inventaro-personagem.png` e `exemplos/atual-jogo-meu.png`.
No TBH os monstros têm tamanho comparável ao dos heróis e a barra de vida é proeminente acima deles.

## Requisitos (EARS)

- **R17.1** Inimigos comuns DEVEM ser renderizados em escala **3×** (era 2×), mesma altura visual dos heróis.
- **R17.2** Bosses/mini-chefes DEVEM ser renderizados em escala **4×** para se destacar imediatamente.
- **R17.3** A barra de vida de todo combatente DEVE ser visível com contraste adequado:
  - fundo escuro sólido atrás da barra;
  - cor verde (> 60% HP), amarela (30–60%), vermelha (< 30%);
  - largura: 36 px para inimigos comuns, 56 px para bosses, 32 px para heróis.
- **R17.4** O nome do combatente DEVE aparecer acima da barra de vida, não abaixo dela.
- **R17.5** Bosses DEVEM ter uma barra de vida especial de largura total (110 px), posicionada centralizada acima do sprite, com label "BOSS".
- **R17.6** Monstros que tomam dano DEVEM piscar branco (flash) por 4 frames — já implementado, garantir que funciona na nova escala.
- **R17.7** O `linhaBase()` DEVE coincidir com o topo do chão visual do cenário (sem os 6 px de overlap atual).

## Critérios de Aceite
- Qualquer monstro na tela é imediatamente visível e distinguível de um herói.
- A barra de vida de qualquer combatente é legível mesmo em movimento.
- Boss tem barra de vida maior e claramente rotulada.

## Design
- `VisaoDeCombate.ts`:
  - Alterar cálculo de escala: monstros comuns `3`, bosses `4`.
  - Corrigir `linhaBase()` para remover o offset de `+6` ou sincronizar com `cenario.ts`.
  - Redesenhar `desenharBarraVida()` com cores dinâmicas (verde/amarela/vermelha) e melhor contraste.
  - Adicionar barra especial de boss centralizada.
  - Mover label do nome para acima da barra (ordem: nome → barra → sprite).

- Nenhuma mudança de dados — puramente visual.

## Tarefas
- [ ] T17.1 Ajustar escala de monstros comuns para 3×, bosses para 4×.
- [ ] T17.2 Sincronizar `linhaBase()` com `groundY` do cenário (sem +6 de offset).
- [ ] T17.3 Redesenhar barras de vida com cores dinâmicas e contraste alto.
- [ ] T17.4 Barra de boss especial (label "BOSS", 110 px, centralizada).
- [ ] T17.5 Ordem visual: nome → barra → sprite (de cima pra baixo).

## Status: 🔴 Pendente
