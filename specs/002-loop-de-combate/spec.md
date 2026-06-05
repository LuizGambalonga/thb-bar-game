# 002 — Loop de Combate Idle  `[MVP]`

## Objetivo
Combate 100% automático, determinístico, por tick fixo, com waves que avançam sozinhas.

## Requisitos (EARS)
- **R2.1** O sistema DEVE executar combate automático (alvo, ataque, skills sem input).
- **R2.2** O sistema DEVE simular em tick fixo determinístico (10 Hz).
- **R2.3** QUANDO a wave é limpa, o sistema DEVE iniciar a próxima após delay curto.
- **R2.4** SE a party morre, ENTÃO o sistema DEVE reviver e reiniciar a wave atual sem perder progresso permanente.
- **R2.5** O sistema DEVE exibir dano, barras de vida e estado de forma legível em janela pequena.

## Critérios de Aceite
- 10 min sem input avançam waves e acumulam recursos; mesma semente ⇒ mesmo resultado (golden test).

## Design
- `nucleo/combate/MotorDeCombate.ts`: estado de combate (heróis, inimigos, timers), método `avancarTick(dt, rng)`.
- Seleção de alvo, cadência (`intervaloAtaqueTicks`), fórmula de dano (ver MODELO-DE-DADOS), morte, fim de wave/onda.
- Emite eventos (`dano`, `morte`, `drop`) consumidos pelo snapshot.

## Tarefas
- [ ] T2.1 Estado e tick do motor de combate.
- [ ] T2.2 Targeting + cadência + dano + crítico.
- [ ] T2.3 Progressão de onda + spawn de chefe.
- [ ] T2.4 Revive/restart no wipe.
- [ ] T2.5 VisaoDeCombate (Canvas2D) com barras e dano flutuante.
- [ ] T2.6 Golden test determinístico.

## Status: 🟢 MVP implementado (motor + golden test + render Canvas2D)
