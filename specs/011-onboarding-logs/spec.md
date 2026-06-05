# 011 — Onboarding & Logs Narrativos

## Objetivo
Tutorial leve não-bloqueante e fragmentos de log narrativos desbloqueáveis.

## Requisitos (EARS)
- **R11.1** O sistema DEVE ter tutorial leve e não-bloqueante nos primeiros minutos.
- **R11.2** QUANDO o jogador limpa fases, o sistema DEVE desbloquear logs narrativos num painel opcional.

## Critérios de Aceite
- Novo jogador entende o loop em < 2 min; logs não interrompem o combate.

## Design
- `conteudo/logs.ts` (texto por fase) + painel de Logs em `apresentacao`.

## Tarefas
- [ ] T11.1 Tutorial leve.
- [ ] T11.2 Logs por fase + painel.

## Status: ⚪ pós-MVP (Fase 8/9)
