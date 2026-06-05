# 004 — Espólio (Loot) & Itens  `[MVP]`

## Objetivo
Drops semeados com 8 raridades, equipar por slot, inventário com filtro/ordenação.

## Requisitos (EARS)
- **R4.1** QUANDO um inimigo morre, o sistema DEVE rolar drops via tabela semeada (ouro, XP, itens, baús).
- **R4.2** O sistema DEVE suportar 8 raridades (comum→cósmico) com pesos por dificuldade.
- **R4.3** O sistema DEVE permitir equipar por slot e recalcular stats da party.
- **R4.4** O sistema DEVE ter inventário com filtro/ordenação por raridade, slot e poder.
- **R4.5** ENQUANTO aberto, o sistema DEVE conceder loot/baús completos; offline é só suplemento.

## Critérios de Aceite
- Drops respeitam pesos por dificuldade (teste de distribuição); equipar altera DPS visível.

## Design
- `nucleo/espolio/TabelaDeEspolio.ts` + `GeradorDeItens.ts` (afixos rolados por RNG semeado, stream `espolio`).
- `nucleo/atributos/CalculadoraDeAtributos.ts` agrega base + equipamento + nível.
- Painel de inventário em `apresentacao`.

## Tarefas
- [ ] T4.1 Tabelas de espólio + pesos por dificuldade.
- [ ] T4.2 Gerador de itens com afixos.
- [ ] T4.3 Equipar/desequipar + recalcular stats.
- [ ] T4.4 Painel de inventário (filtro/ordenação).
- [ ] T4.5 FX de drop por raridade.

## Status: 🟢 MVP implementado (tabelas, gerador, equipar/vender, inventário)
