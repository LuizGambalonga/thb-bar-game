# 005 — Cubo Heródrico (Crafting)

## Objetivo
Relíquia de craft com 8 funções desbloqueáveis e receitas data-driven, sem exploits.

## Requisitos (EARS)
- **R5.1** O sistema DEVE expor funções desbloqueáveis (alquimia, síntese, decoração, gravação, inscrição, transmutação, extração, rerrolagem).
- **R5.2** QUANDO o jogador executa uma receita válida, o sistema DEVE consumir insumos e produzir o resultado.
- **R5.3** SE faltam insumos, ENTÃO o sistema DEVE bloquear e indicar o que falta.
- **R5.4** Síntese DEVE subir raridade/poder; gravação/inscrição DEVE alterar afixos.

## Critérios de Aceite
- Cada função tem ≥1 receita testada; nenhuma receita gera recurso infinito (teste de conservação).

## Design
- `conteudo/receitasCubo.ts` + `nucleo/cubo/Cubo.ts` (valida insumos, aplica resultado via RNG semeado).

## Tarefas
- [ ] T5.1 Schema + funções + receitas.
- [ ] T5.2 Executar receita (consome/valida/produz).
- [ ] T5.3 Síntese/gravação/inscrição.
- [ ] T5.4 Teste anti-exploit (conservação).
- [ ] T5.5 UI do Cubo.

## Status: ⚪ pós-MVP (Fase 7)
