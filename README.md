# TBH — Heróis da Barra (Single-Player)

Idle hack-and-slash ARPG **single-player** que vive numa janelinha *always-on-top* na barra de tarefas do Windows. Um grupo de até 3 heróis pixel-art luta sozinho enquanto você trabalha; você intervém para upgrades, loot e progressão.

> Inspirado em **TBH: Task Bar Hero** (Nugem Studio, 2026), porém 100% offline: sem multiplayer, sem trading, sem dinheiro real. Todo conteúdo é desbloqueável jogando.

## Como rodar (fácil)
```bash
npm install      # instala dependências
npm run dev      # compila e abre o jogo (Electron)
```
Outros comandos:
```bash
npm test         # testes do núcleo (Vitest)
npm run typecheck# checagem de tipos estrita
npm run build    # compila para dist/
npm run dist     # gera instalador Windows (NSIS)
```

## Princípios (ver CLAUDE.md)
- **Spec Driven Development**: cada feature em `specs/NNN-nome/spec.md`.
- **Código em português** (variáveis, classes, arquivos).
- **SOLID + Clean Code**: camadas isoladas, injeção de dependências, núcleo puro.
- **Núcleo determinístico**: toda aleatoriedade via RNG semeado; sem `Math.random()` no núcleo.

## Estrutura
```
CLAUDE.md            instruções obrigatórias do projeto
specs/               fonte da verdade (SDD): CONSTITUICAO, LORE, ARQUITETURA,
                     MODELO-DE-DADOS + 001..011 funcionalidades
src/
├─ nucleo/           regras puras (domínio, RNG, atributos, combate, espólio, progressão)
├─ conteudo/         dados: heróis, monstros, fases, itens, tabelas de espólio
├─ compartilhado/    contratos de IPC
├─ principal/        processo Electron (janela, laço, save) — composition root
└─ apresentacao/     renderer Canvas2D + painéis
testes/              testes do núcleo (Vitest)
```

## Estado atual
🟢 **MVP jogável (Vertical Slice — Ato I).** Implementado e validado (`typecheck` + 26 testes + `build` OK):

- Janela frameless always-on-top + tray (Mostrar/Ocultar, Pausar, Sair) — feat. 001
- Combate idle automático, determinístico por tick, com waves, mini-chefe (A Lixeira) e chefe — feat. 002
- Cavaleiro com nível/XP; demais 5 classes já modeladas (desbloqueio pós-MVP) — feat. 003
- Loot semeado com 8 raridades, equipar/vender, inventário com ordenação — feat. 004
- Save/load atômico com backup e migração — feat. 009
- Suplemento offline com teto + resumo "enquanto você esteve fora" — feat. 007
- Render Canvas2D com barras de vida e dano flutuante — feat. 002

⚪ **Próximas fases** (specs prontas): Cubo Heródrico (005), Árvore de Inicialização (006), Atos II/III (008), acessibilidade/velocidade (010), onboarding/logs (011).

Veja o backlog e a rastreabilidade em [`specs/`](./specs/README.md).
