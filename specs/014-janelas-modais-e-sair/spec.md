# 014 — Janelas Modais & Sair

## Objetivo
As interações (Party, Heróis, Mapas, Mochila) abrem como **janelas na tela** (overlays), que podem ser **maiores que a janela da barra de tarefas**. Adicionar botão de **Sair**.

## Requisitos (EARS)
- **R14.1** Os painéis de interação DEVEM abrir como **modais/overlays** sobre a tela, podendo ocupar mais área que a janelinha docada.
- **R14.2** O sistema DEVE ter um botão **Sair** visível na UI que encerra o jogo (salvando antes).
- **R14.3** Cada modal DEVE ter botão de fechar e fechar ao clicar fora/ESC.
- **R14.4** A barra superior DEVE ter atalhos para: Mochila 🎒, Party 👥, Heróis ⚔️, Mapas 🗺️, Sair ✖.

## Critérios de Aceite
- Clicar nos atalhos abre janelas; Sair fecha o app com save; ESC fecha o modal aberto.

## Design
- Modais em HTML/CSS (overlay full-screen translúcido, conteúdo central maior).
- Botão Sair → intenção `sair` → `main` salva e `app.quit()`.

## Status: 🟢 implementado neste ciclo
