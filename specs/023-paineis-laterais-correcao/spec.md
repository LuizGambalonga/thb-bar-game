# 023 — Painéis Laterais Fora da Janela de Jogo  `[BUG + REDESIGN]`

## Contexto
A spec 019 descreveu o layout lateral correto (Mochila ←| Canvas |→ Portal), mas a implementação atual abre os painéis **dentro** da janela pequena (overlays sobrepostos ao canvas), tornando a tela apertada e inutilizável.
O comportamento correto: a janela Electron **cresce** lateralmente ao abrir um painel; o canvas permanece intacto ao centro; os painéis ficam ao lado, não por cima.

## Requisitos (EARS)

- **R23.1** QUANDO Mochila é aberta, a janela Electron DEVE expandir **+320 px à esquerda** (reposicionando para a esquerda), exibindo o painel sem cobrir o canvas.
- **R23.2** QUANDO Portal é aberto, a janela DEVE expandir **+260 px à direita**.
- **R23.3** QUANDO o painel fecha, a janela DEVE encolher de volta ao tamanho compacto original.
- **R23.4** QUANDO ambos (Mochila + Portal) estão abertos ao mesmo tempo, o tamanho total = largura-canvas + 320 + 260.
- **R23.5** A expansão DEVE ser instantânea (sem CSS transition que cause flash visual).
- **R23.6** O canvas de combate DEVE ser sempre visível e não reposicionado.
- **R23.7** O ajuste de posição DEVE garantir que a janela não ultrapasse os limites da tela primária (`screen.getPrimaryDisplay().workAreaSize`).
- **R23.8** O painel Mochila DEVE ficar em `position: absolute; left: 0` e o Portal em `position: absolute; right: 0` no DOM do renderer, sem `z-index` acima do canvas.

## Critérios de Aceite
- Abrir a Mochila: janela cresce 320 px para a esquerda; painel fica ao lado do canvas, não sobre ele.
- Abrir o Portal: janela cresce 260 px para a direita; painel ao lado.
- Fechar qualquer painel: janela retorna ao tamanho compacto.
- Em resolução 1366×768 com janela encostada na borda direita da tela, abrir Mochila expande para a esquerda sem sair da tela.
- Abrir Portal não causa scroll interno no canvas.

## Design

### Electron — `GerenciadorDeJanela.ts`
```ts
// Estado interno
estadoExpansao: { mochila: boolean; portal: boolean }

expandirPainel(lado: "esquerda" | "direita", largura: number): void {
  // 1. Obtém bounds atuais da janela
  // 2. Calcula novo bounds (ajusta x se lado=esquerda para compensar shift)
  // 3. Clipa contra workArea da tela primária
  // 4. janela.setBounds(novoBounds)
}

encolherPainel(lado: "esquerda" | "direita", largura: number): void {
  // Reverte bounds — garante que não vai abaixo da largura mínima (LARGURA_CANVAS)
}
```

### IPC
Reutilizar os canais de `contratos.ts` — se já existem `expandirJanela`/`encolherJanela`, corrigir a lógica de cálculo de bounds. Se não existem, adicionar:
```ts
| { tipo: "abrirPainel"; painel: "mochila" | "portal" }
| { tipo: "fecharPainel"; painel: "mochila" | "portal" }
```

### Renderer — CSS / layout
```
#janela {
  display: flex;
  flex-direction: row;
}
#painel-mochila  { width: 320px; flex-shrink: 0; order: 0; }
#canvas-combate  { flex-shrink: 0; order: 1; }
#painel-portal   { width: 260px; flex-shrink: 0; order: 2; }
```
Os painéis usam `display: none` quando fechados. Não usar `position: absolute` sobreposto ao canvas.

## Tarefas
- [ ] T23.1 Corrigir `GerenciadorDeJanela.ts`: implementar `expandirPainel` / `encolherPainel` com cálculo de bounds correto.
- [ ] T23.2 Verificar/adicionar canais IPC em `contratos.ts`, `main.ts` e `preload.ts`.
- [ ] T23.3 Refatorar CSS dos painéis para layout flexbox lateral (remover overlays/position:absolute sobrepostos).
- [ ] T23.4 Garantir que abrir os dois painéis simultaneamente soma as larguras corretamente.
- [ ] T23.5 Testar em 1366×768 e 1920×1080.

## Status: 🔴 Pendente
