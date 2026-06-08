# Arquitetura

Atende à Constituição. Stack ajustada para **build/run fáceis** (decisão do dono): Electron + TypeScript, **Canvas2D** (render nativo), **UI em TS/HTML/CSS puro**, **esbuild** (bundle), **Vitest** (testes). Pacote único (não monorepo) — o isolamento de camadas é garantido por estrutura de pastas + tsconfig, o que é mais fácil de instalar e rodar.

## Camadas (Clean Architecture)
```
┌──────────────────────────── Electron App ────────────────────────────┐
│  PRINCIPAL (main, Node) ── autoridade + composition root             │
│  ├─ GerenciadorDeJanela   frameless, always-on-top, tray, posição    │
│  ├─ LacoDeJogo            tick fixo 10Hz → chama o núcleo            │
│  ├─ ServicoDeSave         escrita atômica + backup + migração        │
│  ├─ ServicoOffline        suplemento ao reabrir                      │
│  └─ PonteIpc              intenções ▲ / snapshots ▼ (tipado)         │
│            │ preload (contextBridge, contextIsolation)               │
│            ▼                                                          │
│  APRESENTACAO (renderer, Chromium) ── só apresenta                   │
│  ├─ VisaoDeCombate (Canvas2D)   arena, sprites, dano flutuante       │
│  └─ Paineis (TS puro)           Inventário · Herói · Fases           │
│                                                                       │
│  NUCLEO (TS puro, sem I/O) ── regras do jogo, determinístico         │
│  └─ dominio · aleatorio · atributos · combate · espolio · progressao │
│  CONTEUDO (dados validados) ── herois, monstros, fases, itens        │
│  COMPARTILHADO ── contratos de IPC                                   │
└───────────────────────────────────────────────────────────────────────┘
```

**Regra de dependência:** as setas só apontam para dentro. `apresentacao` e `principal` dependem de `nucleo`/`compartilhado`; `nucleo` não depende de ninguém de fora.

## Laço de jogo & determinismo
- Tick fixo **10 Hz (100 ms)** no `principal` via acumulador (fixed-timestep), resistente a jitter.
- Render no renderer via `requestAnimationFrame`, **interpolando** entre snapshots — desacoplado do tick.
- Toda aleatoriedade vem do `GeradorAleatorio` semeado; o estado da semente faz parte do save. Streams separadas (`combate`, `espolio`).
- Velocidade 1x/2x/3x = mais ticks por intervalo real, sem mudar o `dt` (mantém determinismo).

## Processos & IPC
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Preload expõe só `window.jogo` tipado.
- **Intenções** (renderer→main): equipar, desequipar, craftar, alocarRuna, definirFormacao, desbloquearHeroi, trocarFase, definirVelocidade, pausar/retomar. Validadas no main.
- **Snapshots** (main→renderer): `SnapshotCombate` (a cada tick) e `SnapshotMeta` (sob mudança/throttle).
- Contratos em `compartilhado/contratos.ts`.

## SOLID na prática
- **SRP:** cada serviço tem um motivo de mudança. `ServicoDeSave` ≠ `MotorDeCombate` ≠ `GerenciadorDeJanela`.
- **DIP:** `principal/main.ts` é a *composition root* que injeta implementações concretas (`RepositorioDeSaveArquivo`) em abstrações (`RepositorioDeSave`).
- **OCP:** adicionar herói/monstro/item = adicionar um registro em `conteudo/`, sem tocar no motor.
- **ISP:** interfaces pequenas (`RepositorioDeSave`, `RelogioDoJogo`).

## Persistência
- `%APPDATA%/tbh-herois-da-barra/save.json` (+ `save.bak.json`).
- Atômico: grava `.tmp` → rename. Backup do último válido. Auto-save a cada 60s + eventos-chave.
- Migração em cadeia por `versaoEsquema` até `VERSAO_ESQUEMA_ATUAL`; em corrupção, cai no backup.

## Offline / Idle
- No boot: `decorrido = limitar(agora - save.ultimoAcesso, 0, TETO)`; `ServicoOffline` calcula suplemento de XP/ouro determinístico, **sem itens/baús**. Modal "enquanto esteve fora".

## Build/run
- `esbuild` empacota `principal/main`, `principal/preload` (node, electron externo) e `apresentacao/renderer` (browser). HTML/CSS copiados.
- `npm run dev` = build + abre Electron. `npm run dist` = electron-builder (NSIS, Windows).

## Geração de assets
- `scripts/gerar-sprites-svg.mjs` — gera os SVGs de pixel art em `assets/arte/herois/` e `assets/arte/monstros/`.
  Cada sprite é definido como grade de caracteres (14×24 heróis, dimensões variadas para monstros).
  Executar após editar designs: `node scripts/gerar-sprites-svg.mjs`.
  Os SVGs gerados são commitados no repositório — não requerem build step obrigatório.

## Testes
- Vitest no `nucleo`/`conteudo`: fórmulas, loot (distribuição com semente fixa), progressão, migração, **golden test** (N ticks com semente fixa ⇒ snapshot estável).

## Riscos & mitigação
- Custo idle do Electron → pausar render oculto, throttle de snapshot.
- Drift de determinismo → preferir inteiros/fixed-point, golden tests.
- Balanceamento idle → números data-driven derivados de `MODELO-DE-DADOS.md`.
