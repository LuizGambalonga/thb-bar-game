# 024 — Mochila Inteligente: Filtro por Slot e Ordenação por Poder  `[FEATURE + UX]`

## Contexto
O inventário atual lista todos os itens misturados sem filtragem. Com dezenas de itens acumulados, é impossível identificar qual arma é melhor para o Cavaleiro ou qual elmo melhora mais o Sacerdote. O fluxo correto de um idle ARPG: clicar num herói → ver só os itens do slot que se quer equipar → escolher o de maior poder — em poucos cliques.

## Requisitos (EARS)

- **R24.1** QUANDO o jogador clica em um herói na Mochila, o painel DEVE filtrar o inventário mostrando apenas itens relevantes para os slots daquele herói (ex.: arma, armadura, elmo, botas, acessório).
- **R24.2** QUANDO o jogador clica em um ícone de slot (arma, armadura, elmo, botas, acessório1, acessório2) no painel do herói, o inventário DEVE exibir **somente** itens daquele tipo de slot.
- **R24.3** Os itens filtrados DEVEM ser ordenados por **poder** (decrescente) como padrão.
- **R24.4** O jogador DEVE poder alternar a ordenação entre: Poder ↓, Poder ↑, Raridade ↓, Nome A-Z.
- **R24.5** Itens que representam upgrade (poder > item atualmente equipado no slot) DEVEM ter indicador visual de destaque (borda colorida ou ícone ▲).
- **R24.6** QUANDO o jogador clica num item filtrado, DEVE aparecer botão "Equipar" com confirmação de 1 clique (sem janela de confirmação adicional).
- **R24.7** O item atualmente equipado no slot selecionado DEVE aparecer destacado no topo da lista (badge "Equipado").
- **R24.8** QUANDO nenhum filtro de slot está ativo, o inventário DEVE exibir todos os itens agrupados por tipo de slot.
- **R24.9** A contagem de itens no inventário DEVE ser visível (ex.: "23/60 itens").

## Critérios de Aceite
- Clicar no Cavaleiro e depois no slot de arma: lista mostra só armas, ordenadas por poder decrescente.
- Item com poder maior que o equipado tem borda verde/dourada.
- Clicar em "Equipar" em 1 clique equipa o item e volta a mostrar o slot do herói atualizado.
- Resetar filtro ("Todos") mostra inventário completo agrupado por tipo.

## Design

### Renderer — `PainelMochila.ts`
```ts
interface EstadoFiltro {
  heroi: IdClasse | null;
  slot: EspacoEquip | null;
  ordenacao: "poder-desc" | "poder-asc" | "raridade-desc" | "nome-az";
}

function filtrarItens(inventario: ItemInstancia[], filtro: EstadoFiltro): ItemInstancia[]
// 1. Se filtro.slot !== null → filtra por slot compatível (via DefItem.slot)
// 2. Ordena conforme filtro.ordenacao
// 3. Move item equipado no slot para o topo (flag "equipado")

function ehUpgrade(item: ItemInstancia, heroi: EstadoHeroi, slot: EspacoEquip): boolean
// item.poder > heroi.equipamento[slot]?.poder ?? 0
```

### HTML/CSS do painel de filtros
```
[ Todos ] [ Arma ] [ Armadura ] [ Elmo ] [ Botas ] [ Acessório ]
Ordenar: [ Poder ↓ ] [ Poder ↑ ] [ Raridade ] [ Nome ]
────────────────────────────────
▲ [épico] Lâmina do Firewall  ··· poder: 420   [Equipar]
  [EQUIPADO] Espada Comum     ··· poder: 180
  [raro]  Machado de Bits     ··· poder: 310   [Equipar]
```

### Integração com IPC
- Equipar dispara intenção `equiparItem` já existente em `contratos.ts`.
- Nenhum campo novo no núcleo — lógica de filtro/ordenação fica 100% no renderer.

### `DefItem` — campo `slot`
Verificar se `DefItem` (em `conteudo/`) já tem campo `slot: EspacoEquip`. Se não tiver, adicionar.
Itens de acessório são compatíveis com `acessorio1` e `acessorio2` — tratar ambos como "acessório".

## Tarefas
- [ ] T24.1 Verificar/adicionar campo `slot: EspacoEquip` em `DefItem` (conteúdo).
- [ ] T24.2 Implementar `filtrarItens` e `ehUpgrade` em `PainelMochila.ts`.
- [ ] T24.3 Adicionar barra de filtros de slot no HTML do painel (botões por slot + ordenação).
- [ ] T24.4 Renderizar indicador de upgrade (borda colorida) e badge "Equipado" na lista.
- [ ] T24.5 Ao clicar num herói no painel, pré-selecionar o herói no filtro.
- [ ] T24.6 Exibir contagem "N/60 itens" no header do painel.

## Status: 🔴 Pendente
