# 012 — Arte / Pixel Art & Apresentação Visual

## Objetivo
Heróis e monstros renderizados como pixel art real, com animações de combate, cenário temático, nomes, barras de vida e efeitos de habilidade visuais.

## Requisitos (EARS)

- **R12.1** O sistema DEVE renderizar cada herói e monstro como **sprite de pixel art** com animação de movimento (bob/tremor/flash ao tomar dano).
- **R12.2** O sistema DEVE desenhar um **cenário/mapa** temático do Ato.
- **R12.3** O sistema DEVE exibir o **nome** de cada combatente e sua barra de vida na arena.
- **R12.4** A **Mochila** DEVE abrir como **popup** com grade de slots, ícone por item e painel de atributos.
- **R12.5** No detalhe do item: **Equipar** (por herói da party), **Desequipar** e **Vender**.
- **R12.6** Ao atacar, o combatente DEVE avançar até o alvo, exibir pose de ataque e recuar; quem toma dano treme.
- **R12.7** Habilidades DEVEM ter **efeito visual de skill** — cada classe tem tipo e cor próprios.

## Sistema de sprites SVG (implementação atual)

### Gerador
`scripts/gerar-sprites-svg.mjs` — define sprites como grade de caracteres e gera SVGs com `<rect>` 1×1 (`shape-rendering="crispEdges"`). Para regenerar após editar designs:
```
node scripts/gerar-sprites-svg.mjs
```

### Arquivos gerados
- `assets/arte/herois/{classe}.svg` — heróis (14×24 px)
- `assets/arte/monstros/{id}.svg` — monstros (12×8 a 16×14 px conforme tipo)

### Inspiração visual
Sprites modelados sobre o TBH original (~14-20px): silhueta imediata, paleta mínima (4-6 cores), outline escuro, sem detalhes supérfluos.

### Carregamento
`src/apresentacao/arte/imagensSprites.ts`:
- Pré-carrega todos os SVGs via `new Image()` no início do renderer.
- Cache com chaves `heroi:classeId` e `monstro:monstroId`.
- `desenharImagemSprite(ctx, spriteId, centroX, baseY, altura)` — `imageSmoothingEnabled = false`.
- ASPECT ratios por spriteId mapeados para preservar proporções originais.

### Efeitos de habilidade
`VisaoDeCombate.ts` — sistema `EfeitoSkill` com 4 tipos visuais por classe:
- `sagrado` (sacerdote): anel expansivo + cruz dourada
- `magico` (feiticeira): partículas orbitais
- `guerreiro` (cavaleiro/carrasco): traço diagonal
- `fisico` (patrulheiro/caçador): anel simples

## Classes e seus sprites

| Classe | Dimensão | Características visuais |
|---|---|---|
| cavaleiro   | 14×24 | Azul, capacete fechado com viseira escura |
| feiticeira  | 14×24 | Roxo, chapéu pontudo alto (~6 linhas), rosto visível |
| patrulheiro | 14×24 | Verde, capuz com rosto e olhos visíveis |
| sacerdote   | 14×24 | Branco/azul, halo dourado acima da cabeça |
| cacador     | 14×24 | Teal escuro, olhos teal brilhantes, máscara |
| carrasco    | 14×24 | Vermelho, crânio com olhos ocos, pesado |

## Tarefas
- [x] T12.1 Sistema de sprites SVG gerado por script.
- [x] T12.2 Sprites das 6 classes e dos 8 monstros do Ato I.
- [x] T12.3 Cenário/mapa do Ato I.
- [x] T12.4 Nomes + barras na arena; animação de movimento e dano.
- [x] T12.5 Mochila popup com grade, ícones, atributos e ações.
- [x] T12.6 Combate com movimentação: investida, pose de ataque, recuo, tremor.
- [x] T12.7 Projéteis visíveis com rastro; dano no impacto; pose de tiro.
- [x] T12.8 Animação de morte (dissolução + partículas) e partículas de impacto.
- [x] T12.9 Efeitos de habilidade visuais por classe (EfeitoSkill).
- [ ] T12.10 (futuro) Frames de ataque e morte individuais por herói; projéteis dos monstros.

## Status: 🟢 Implementado (SVGs pixel art, combate em movimento, projéteis, morte, skill FX)
