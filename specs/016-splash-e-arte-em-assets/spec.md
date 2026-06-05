# 016 — Splash Art & Arte em Assets

## Objetivo
Tela de abertura (splash) e mover a definição da arte para **arquivos de asset** (dados), em vez de hardcoded no meio do código.

## Requisitos (EARS)
- **R16.1** O jogo DEVE exibir uma **tela de abertura (splash)** com logo/título e botões Jogar/Sair.
- **R16.2** A definição dos **sprites DEVE viver em arquivo(s) de asset** (`assets/arte/*.json`), carregados como dados — não embutidos como literais no meio da lógica.
- **R16.3** O personagem em combate DEVE **refletir o equipamento**: arma na mão e cor/aura conforme a raridade do melhor item equipado.
- **R16.4** Habilidades DEVEM ter efeito visual ao serem lançadas (pulso/aura no conjurador).

## Critérios de Aceite
- Splash aparece ao abrir; sprites carregam de JSON; herói com gear melhor muda de aura/arma; skill mostra efeito.

## Design
- `assets/arte/sprites.json`: paleta + frames por sprite. `arte/sprites.ts` vira **carregador** (import do JSON).
- Splash: overlay HTML/CSS com arte composta (sem PNG externo ainda; evolução T16.x = arte PNG dedicada).
- Combate: `CombatenteSnapshot` ganha `corEquip` e `temArma`; renderer desenha aura + arma; eventos `habilidade` viram pulso.

## Status: 🟡 parcial neste ciclo (splash + arte refletindo equipamento + skill FX; PNG dedicado fica como evolução)
