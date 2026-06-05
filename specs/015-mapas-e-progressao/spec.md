# 015 — Mapas & Progressão de Fases

## Objetivo
Janela de **Mapas** para o jogador subir de fase, vendo quais já passou, quais estão liberadas e qual está jogando.

## Requisitos (EARS)
- **R15.1** O sistema DEVE listar as fases (Atos × dificuldades) numa janela de **Mapas**.
- **R15.2** Cada fase DEVE indicar **estado**: limpa ✓, atual ▶, liberada ou bloqueada 🔒.
- **R15.3** QUANDO o jogador seleciona uma fase liberada, o sistema DEVE trocar para ela (farm/progressão).
- **R15.4** SE a fase Normal de um Ato foi limpa, ENTÃO o tier seguinte DEVE liberar (gating por `requer`).
- **R15.5** O Ato I DEVE ter as 4 dificuldades jogáveis (normal → kernelPanic) para dar progressão.

## Critérios de Aceite
- Limpar uma fase marca ✓ e libera a próxima; selecionar fase muda o combate; bloqueadas não selecionáveis.

## Design
- `conteudo/fases.ts`: adicionar tiers do Ato I com `requer` encadeado e escala de monstros por dificuldade.
- `SnapshotMeta.mapas`: `{ id, ato, dificuldade, nome, limpa, desbloqueada, atual }[]`.
- Janela `modal-mapas` com cartões clicáveis.

## Status: 🟢 implementado neste ciclo (Ato I completo; Atos II/III na Fase 8)
