# 016 — Splash Art & Arte em Assets

## Objetivo
Tela de abertura e arte definida em **arquivos de asset**, não hardcoded no código.

## Requisitos (EARS)
- **R16.1** O jogo DEVE exibir uma **tela de abertura (splash)** com logo/título e botões Jogar/Sair.
- **R16.2** Os **sprites DEVEM viver em arquivos de asset** (`assets/arte/`), carregados como dados — não embutidos como literais no meio da lógica.
- **R16.3** O personagem em combate DEVE **refletir o equipamento**: aura conforme raridade do melhor item equipado.
- **R16.4** Habilidades DEVEM ter efeito visual ao serem lançadas.

## Implementação atual

### Sprites como SVGs gerados
Os sprites **não** vivem mais em `sprites.json`. Vivem em:
- `assets/arte/herois/{classe}.svg`
- `assets/arte/monstros/{id}.svg`

Gerados por `scripts/gerar-sprites-svg.mjs` (pixel art → SVG com `<rect>` 1×1).
Para regen: `node scripts/gerar-sprites-svg.mjs`.

### Carregamento
`src/apresentacao/arte/imagensSprites.ts` pré-carrega todos os SVGs via `HTMLImageElement`.
O renderer usa `ctx.drawImage()` com `imageSmoothingEnabled = false` para escalonamento sem blur.

### Efeitos de habilidade
Sistema `EfeitoSkill` em `VisaoDeCombate.ts` — 4 tipos visuais por classe (sagrado, mágico, guerreiro, físico). Ver spec 012 para detalhes.

### Splash
Tela de abertura HTML/CSS implementada — logo + botões Jogar/Sair.

## Tarefas
- [x] T16.1 Tela splash com logo e botões.
- [x] T16.2 Sprites migrados para arquivos SVG em `assets/arte/` + gerador de script.
- [x] T16.3 Aura de equipamento no combatente.
- [x] T16.4 Efeito visual de habilidade (skill FX).
- [ ] T16.5 (futuro) Arte PNG dedicada de alta resolução; animações por frame.

## Status: 🟢 Implementado (splash + SVGs em asset + aura de equip + skill FX)
