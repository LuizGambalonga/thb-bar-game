# 001 — Janela & Barra de Tarefas  `[MVP]`

## Objetivo
Janela frameless, *always-on-top*, ancorável perto da barra de tarefas, com tray e modos compacto/expandido.

## Requisitos (EARS)
- **R1.1** O sistema DEVE abrir como janela frameless, always-on-top, perto da barra de tarefas.
- **R1.2** QUANDO o usuário arrasta a janela, o sistema DEVE reposicionar e persistir a posição.
- **R1.3** O sistema DEVE oferecer tray com Mostrar/Ocultar, Pausar/Retomar, Sair.
- **R1.4** ENQUANTO oculta/minimizada, o sistema DEVE reduzir render a ≤1 fps mantendo a simulação.
- **R1.5** O sistema DEVE ter modo compacto (só combate) e expandido (combate + painéis).

## Critérios de Aceite
- Janela fica sobre as outras; fechar para tray não encerra a simulação; reabre na última posição.

## Design
- `principal/GerenciadorDeJanela.ts`: cria `BrowserWindow` (`frame:false`, `alwaysOnTop:true`, `skipTaskbar` opcional), `Tray`, persiste posição via config do save.
- Render reduzido: ao `hide`/`minimize`, envia intenção interna que o renderer usa para baixar o fps do `requestAnimationFrame`.

## Tarefas
- [ ] T1.1 Criar janela frameless always-on-top + posição inicial.
- [ ] T1.2 Tray com ações.
- [ ] T1.3 Drag + persistência de posição.
- [ ] T1.4 Modos compacto/expandido (toggle persistido).
- [ ] T1.5 Reduzir render quando oculta.

## Status: 🟢 MVP implementado (T1.1–T1.2; drag/posição e modos: parcial)
