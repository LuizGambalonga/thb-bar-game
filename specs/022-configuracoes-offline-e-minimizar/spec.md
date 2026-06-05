# 022 — Configurações Offline & Botão Minimizar  `[FEATURE]`

## Contexto
O jogo já implementa rendimento offline (`RendimentoOffline.ts`), mas o jogador não tem controle nem visibilidade sobre:
- Quanto tempo ele vai ficar offline (limite e tempo configurável).
- Quanto ouro/XP ele vai ganhar no período configurado.

Além disso, o jogo é `always-on-top`, o que atrapalha quando o jogador quer usar outras janelas sem fechar o jogo.
Falta um botão de **minimizar** que retira o jogo da frente sem encerrá-lo.

## Requisitos (EARS)

### Offline Timer
- **R22.1** O sistema DEVE exibir um botão ⚙️ (Configurações) na barra de atalhos do cabeçalho.
- **R22.2** O painel de configurações DEVE ter uma seção "Modo Offline":
  - Slider ou dropdown para definir o **tempo máximo de farm offline**: 15 min, 30 min, 1 h, 2 h (máximo).
  - Preview em tempo real: "Em X horas, você ganhará ≈ Y ouro e Z XP" (calculado com `estimativasOffline()`).
- **R22.3** O limite de 2 horas DEVE ser o teto máximo configurável (hardcoded em `TETO_OFFLINE_HORAS_BASE = 2`).
- **R22.4** O valor configurado DEVE ser salvo no `JogoSalvo.config` (campo `tetoOfflineHoras: number`).
- **R22.5** O `calcularRendimentoOffline` DEVE respeitar o teto configurado pelo jogador (atualmente usa `TETO_OFFLINE_HORAS_BASE = 8` — reduzir para 2 horas como máximo padrão).
- **R22.6** O modal de configurações DEVE também exibir (somente leitura):
  - Velocidade de simulação atual (1×/2×/3×).
  - Estimativa de ouro/hora e XP/hora com a party atual.

### Botão Minimizar
- **R22.7** O cabeçalho DEVE ter um botão **⊟** (minimizar) antes do botão ✖ (sair).
- **R22.8** Clicar em ⊟ DEVE chamar `mainWindow.minimize()` no processo principal via IPC.
- **R22.9** O jogo DEVE continuar rodando normalmente (loop de jogo ativo) enquanto minimizado.
- **R22.10** `always-on-top` DEVE ser desativado temporariamente enquanto minimizado e restaurado ao restaurar a janela.

## Critérios de Aceite
- Abrindo Configurações, o jogador define 1 h de offline e vê a preview "≈ 4500 ouro, ≈ 1200 XP".
- Ao retornar ao jogo, a tela de resumo offline credita exatamente até 1 h de farm.
- Clicar ⊟ minimiza a janela para a barra de tarefas; o jogo continua rodando.
- Restaurar a janela retorna o `always-on-top`.

## Design

### Novos campos em `JogoSalvo.config`
```ts
config: {
  velocidade: 1 | 2 | 3;
  mudo: boolean;
  reduzirFlashes: boolean;
  escalaUi: number;
  posicaoJanela?: [number, number];
  modo: "compacto" | "expandido";
  tetoOfflineHoras: number;  // novo — padrão: 2
}
```

### Migração save
- v2 → v3: adicionar `tetoOfflineHoras: 2` ao `config`.
- Atualizar `VERSAO_ESQUEMA_ATUAL` para 3.

### `RendimentoOffline.ts`
- `calcularRendimentoOffline(segundos, ouroPorSeg, xpPorSeg)` já aceita `segundos` como parâmetro.
- Em `EstadoDoJogo.aplicarRendimentoOffline`, usar `Math.min(segundosAusente, salvo.config.tetoOfflineHoras * 3600)`.

### Novo IPC
```ts
| { tipo: "minimizar" }
```
Em `main.ts`: `mainWindow.minimize()`.

### UI
- Modal `#modal-config` com:
  - `<label>Tempo máximo offline:</label>`
  - `<select>` com opções 15m / 30m / 1h / 2h.
  - `<div>` preview de ganhos estimados.
  - Seção "Velocidade do jogo" com botões 1×/2×/3× (movidos do cabeçalho).
- Botão ⊟ no `#cabecalho` antes do ✖.

### `EstadoDoJogo`
- Novo `calcularPreviewOffline(horas)`: retorna `{ ouro, xp }` estimado para exibição no modal.
- Exposto via snapshot ou chamada direta via IPC `jogo:previewOffline`.

## Tarefas
- [ ] T22.1 Adicionar `tetoOfflineHoras` ao `JogoSalvo.config` + migração v2→v3.
- [ ] T22.2 Ajustar `aplicarRendimentoOffline` para respeitar o teto configurado.
- [ ] T22.3 Criar `calcularPreviewOffline(horas)` em `EstadoDoJogo`.
- [ ] T22.4 Expor preview via IPC (`preload.ts` + `main.ts`).
- [ ] T22.5 Criar modal `#modal-config` em `index.html` com seção offline + velocidade.
- [ ] T22.6 Implementar `renderConfig(meta)` em `PainelInterface`.
- [ ] T22.7 Adicionar botão ⚙️ na barra de atalhos.
- [ ] T22.8 Adicionar intenção `minimizar` + implementar `mainWindow.minimize()` em `main.ts`.
- [ ] T22.9 Adicionar botão ⊟ no cabeçalho + lógica de `always-on-top` ao restaurar.

## Dependências
- Nenhuma dependência de specs anteriores.
- `TETO_OFFLINE_HORAS_BASE` em `constantes.ts` deve ser atualizado de 8 para 2.

## Status: 🔴 Pendente
