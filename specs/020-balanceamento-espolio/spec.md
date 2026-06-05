# 020 — Balanceamento do Espólio (Drop Rate & Progressão)  `[BUGFIX + BALANCE]`

## Contexto
O drop rate atual está excessivamente alto: **todo** inimigo morto cria um item (a `chanceBau` de 5% é bonus em cima de um drop garantido por morte).
Em poucas ondas a mochila fica lotada de itens comuns sem valor, criando ruído e obrigando venda constante.
O modelo correto para idle ARPG é: **ouro sempre cai, itens caem raramente** — por isso a mochila tem valor quando algo cai.

## Análise do problema atual

### `GeradorDeItens.rolarDrop()`
```ts
const item = this.criarItem(raridade, rng); // ← sempre cria um item
return { ouro, item, bau };
```
Não existe uma chance de "nenhum item". O item é **garantido** em todo drop.

### Tabela normal (Ato I)
```ts
pesosRaridade: { comum: 60, incomum: 25, raro: 10, epico: 4, lendario: 1, ... }
```
60% dos drops são comuns (sem afixo, baixo valor).

### Resultado
Com party de 3 heróis, 4–6 monstros por onda, 7 ondas: ~20–40 itens por rodada completa de farm.

## Requisitos (EARS)

- **R20.1** `TabelaEspolio` DEVE incluir um campo `chanceItem: number` (0..1) indicando a probabilidade de **algum** item cair. Default ao migrar saves: 0.25.
- **R20.2** `GeradorDeItens.rolarDrop()` DEVE rolar `chanceItem` antes de criar o item — se falhar, nenhum item cai (só ouro).
- **R20.3** A `chanceItem` padrão por dificuldade DEVE ser:
  - Normal: **0.20** (1 em 5 inimigos dropa item)
  - Difícil: **0.28**
  - Pesadelo: **0.35**
  - Kernel Panic: **0.45**
- **R20.4** Bosses e mini-chefes DEVEM ter `chanceItem: 1.0` (sempre dropam).
- **R20.5** O peso de raridade `comum` DEVE ser reduzido para **30%** na tabela normal (redistribuir para incomum/raro).
- **R20.6** O sistema DEVE ter um **limite de inventário de 60 itens**. SE o inventário atinge 60, itens adicionais são convertidos automaticamente em ouro (metade do valor de venda). Uma notificação flutuante deve avisar "Mochila cheia! Item vendido automaticamente".
- **R20.7** Os pesos de raridade por dificuldade devem seguir a tabela:

| Raridade  | Normal | Difícil | Pesadelo | K. Panic |
|-----------|--------|---------|----------|----------|
| Comum     | 30     | 20      | 10       | 0        |
| Incomum   | 40     | 35      | 30       | 20       |
| Raro      | 20     | 28      | 32       | 35       |
| Épico     | 7      | 12      | 18       | 28       |
| Lendário  | 2      | 4       | 8        | 12       |
| Imortal   | 1      | 1       | 2        | 4        |
| Arcano    | 0      | 0       | 0        | 1        |
| Cósmico   | 0      | 0       | 0        | 0        |

## Critérios de Aceite
- Em 10 min de farm no Ato I Normal: entre 8 e 20 itens dropam (antes: 40+).
- Boss sempre dropa ao menos 1 item.
- Inventário nunca ultrapassa 60 itens; excesso vira ouro automaticamente.
- A raridade dos drops sobe visivelmente em Pesadelo vs Normal.

## Design
- `nucleo/dominio/tipos.ts`: adicionar `chanceItem: number` a `TabelaEspolio`.
- `nucleo/espolio/GeradorDeItens.ts`: verificar `chanceItem` antes de `criarItem`.
- `conteudo/tabelasEspolio.ts`: atualizar todas as tabelas com novos pesos e `chanceItem`.
- `principal/EstadoDoJogo.ts`: verificar limite (60) em `processarMorteInimigo`; emitir evento `mochilaCheia` se necessário.
- `compartilhado/contratos.ts`: adicionar evento snapshot `{ tipo: "mochilaCheia" }` para exibir notificação.
- `apresentacao/VisaoDeCombate.ts`: exibir número flutuante "Mochila cheia!" em laranja quando evento chegado.
- `nucleo/save/JogoSalvo.ts`: migração v2→v3 é automática (tabelas são data, não save).

## Tarefas
- [ ] T20.1 Adicionar `chanceItem` a `TabelaEspolio` e `GeradorDeItens`.
- [ ] T20.2 Atualizar `tabelasEspolio.ts` com novos pesos e `chanceItem` por dificuldade.
- [ ] T20.3 Criar tabelas separadas para boss (chanceItem 1.0, pesos premium).
- [ ] T20.4 Limite de 60 itens + overflow para ouro em `EstadoDoJogo`.
- [ ] T20.5 Evento `mochilaCheia` no contrato + notificação flutuante no renderer.

## Status: 🔴 Pendente
