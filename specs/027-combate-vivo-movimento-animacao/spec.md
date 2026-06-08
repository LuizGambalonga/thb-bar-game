# 027 — Combate vivo: movimento, animação profissional e skills

## Problema
O combate passa sensação "chumbada": heróis ficam fixos (`velocidadeMovimento: 0`),
sprites são imagens estáticas de 1 frame, e as skills são formas abstratas na
posição do lançador (a "bolinha de fogo"). Não parece um jogo 2D de verdade.

## Objetivo
Combate com vida: heróis que se movem (avançam/recuam), animação profissional por
sprite-sheet (pack hand-painted LuizMelo, vista lateral), e skills com fases
visíveis (conjuração → projétil/feixe/AoE viajando → impacto). Mais revisão ampla
de balanceamento.

## Decisões (dono, jun/2026)
- **Stack mantida**: Electron + Canvas2D + núcleo determinístico. O gargalo era
  conteúdo de animação + núcleo sem posição de herói, não a tecnologia.
- **Arte**: pacote profissional de artista (LuizMelo, itch.io), vista lateral,
  free para uso comercial **com crédito**. Nada de pixel art gerada por grade/JSON.
- **Balanceamento**: revisão ampla nesta passada.

## Escopo por fase

### Fase 1 — Núcleo (determinístico, agnóstico de arte)
- `Combatente` ganha `estadoMov: EstadoMovimento` e `posicaoAncora` (X de origem).
- Heróis recebem `velocidadeMovimento` e `alcanceAtaque` reais conforme o papel:
  - **corpo a corpo** (sem projétil): avançam até encostar no inimigo da frente,
    atacam em alcance curto e voltam à âncora quando não há inimigos.
  - **à distância** (com projétil) e suporte: seguram a âncora; recuam se um
    inimigo chega perto demais (kite).
- Ataque de herói passa a exigir estar em alcance (igual aos inimigos hoje).
- **Conjuração**: ao disparar habilidade, o herói entra em `conjurar` por
  `TICKS_CONJURACAO` (telegraph) antes do efeito sair.
- Movimento é determinístico (velocidades fixas, sem RNG/tempo real). O renderer
  interpola `posicaoX` entre snapshots.

### Fase 2 — Pipeline de sprite-sheets (pack-agnóstico)
- Manifesto de animação (metadados, **não** pixels): por personagem, caminho das
  sheets, tamanho de frame, e por animação `{ frames, fps, loop, âncora }`.
- Loader + slicer (`drawImage` por sub-retângulo) + animador com FSM ligada ao
  `estadoMov` do snapshot e aos eventos de ataque.
- Aposenta o caminho de imagem estática de 1 frame.
- `assets/arte/personagens/README.md` lista os packs LuizMelo a baixar + créditos.

### Fase 3 — Renderer (skills e sincronia)
- Animação dirigida por `estadoMov` + relógio de frames; ataque sincronizado ao
  evento de dano.
- Skills em 3 fases por classe: aura de conjuração → projétil/feixe/AoE até o(s)
  alvo(s) → impacto. Substitui a forma abstrata genérica.

### Fase 4 — Balanceamento amplo
- Revisão de defesa/HP/velocidades, cooldowns, cura entre ondas (passa a parcial),
  pausa de morte, HP de boss, e novas constantes de movimento.

## Contratos afetados
- `CombatenteSnapshot`: novo campo `estadoMov`.
- `EventoSnapshot.habilidade`: passa a carregar `idHabilidade`, `tipoSkill`,
  `idsAlvos` e `elemento` para o renderer rotear o VFX.

## Fora de escopo
- Novos testes (decisão do dono: testes adiados). Determinismo preservado.
- Multiplayer, novas classes/monstros além do remapeamento de arte.

## Créditos de arte
Personagens e criaturas: **LuizMelo** (https://luizmelo.itch.io) — packs gratuitos
para uso comercial com atribuição. Ver `assets/arte/personagens/README.md`.
