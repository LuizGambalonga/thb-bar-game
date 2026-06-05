# 019 — Janelas Flutuantes Maiores que o Canvas  `[FEATURE + REDESIGN]`

## Contexto
Atualmente a janela Electron tem ~520×250 px (canvas + header + footer).
Os modais (Mochila, Status, Portal) abrem como overlays DENTRO dessa janela pequena — muito apertados.
No TBH os painéis laterais (Stash, Hero, Portal) se expandem para fora da área de jogo, criando uma UI muito maior.

## Referência visual
Ver `exemplos/exemplo-do-jogo-rodando.png`:
- Stash à esquerda (~200 px larg.), jogo no centro (~300 px larg.), Portal à direita (~180 px larg.).
- Os painéis ficam na mesma altura que o jogo, ao lado dele — não sobrepostos.
Ver `exemplos/exemplo-do-mapa-e-inventaro-personagem.png`:
- Painel HERO flutua sobre o jogo, ocupa ~300×400 px — maior que a janelinha de jogo.

## Requisitos (EARS)

- **R19.1** QUANDO um modal é aberto, a janela Electron DEVE expandir automaticamente para acomodá-lo.
- **R19.2** A expansão DEVE ser lateral (painel ao lado do canvas) para Mochila e Portal, ou central (overlay grande) para Status.
- **R19.3** QUANDO o modal fecha, a janela DEVE encolher de volta ao tamanho compacto.
- **R19.4** O tamanho expandido DEVE ser: Mochila = +280 px de largura à esquerda; Portal = +240 px de largura à direita; Status = +320 px de largura à esquerda (ou +200 px de altura total).
- **R19.5** A expansão DEVE ser animada (transição CSS de 120 ms).
- **R19.6** O canvas de combate DEVE permanecer sempre visível — a janela cresce, não substitui o canvas.
- **R19.7** A posição da janela na tela DEVE ajustar para que a expansão não saia da tela (preferir expandir para o lado com mais espaço disponível).
- **R19.8** O modo expandido DEVE respeitar a posição `always-on-top` e não ocultar a barra de tarefas.

## Critérios de Aceite
- Abrir a Mochila mostra o painel à esquerda do canvas, sem cobrir o jogo.
- Abrir o Portal mostra o mapa à direita do canvas, sem cobrir o jogo.
- Fechar o painel encolhe a janela de volta.
- Em tela de 1366×768, a janela expandida não ultrapassa os limites da tela.

## Design

### Electron (processo principal)
- `GerenciadorDeJanela.ts`: expor canal IPC `jogo:expandirJanela` que recebe `{ lado: "esquerda"|"direita"|"centro"; largura: number; altura?: number }`.
- `GerenciadorDeJanela` calcula nova posição/tamanho garantindo que não sai da tela (usar `screen.getPrimaryDisplay()`).
- Ao fechar (canal `jogo:encolherJanela`), restaura tamanho/posição salvos.

### Renderer
- `PainelInterface` emite `window.jogo.enviarIntencao({ tipo: "expandirJanela", ... })` ao abrir cada modal.
- Remover o centramento CSS dos modais — os painéis laterais passam a usar `position: fixed; left: 0` (Mochila) ou `right: 0` (Portal) com altura 100%.
- Adicionar transição CSS `width 120ms ease` no container principal.

### Novo tipo de Intenção
```ts
| { tipo: "expandirJanela"; lado: "esquerda" | "direita" | "centro"; larguraPainel: number }
| { tipo: "encolherJanela" }
```

### Layout dos painéis abertos
```
[MOCHILA 280px] [CANVAS 520px] [PORTAL 240px]
                 header
                 arena
                 footer
```

## Tarefas
- [ ] T19.1 Adicionar `expandirJanela` / `encolherJanela` ao `contratos.ts`.
- [ ] T19.2 Implementar lógica de resize com guard de tela em `GerenciadorDeJanela.ts`.
- [ ] T19.3 Expor canal IPC em `main.ts` e `preload.ts`.
- [ ] T19.4 Redesenhar CSS dos modais: layout lateral (flexbox horizontal na `#janela`).
- [ ] T19.5 Chamar `expandirJanela` ao abrir e `encolherJanela` ao fechar cada modal.
- [ ] T19.6 Testar em 1366×768 e 1920×1080 para não ultrapassar limites.

## Status: 🔴 Pendente
