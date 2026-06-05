# 018 — Painel de Status do Herói  `[FEATURE]`

## Contexto
Não existe nenhuma tela mostrando os atributos detalhados do herói (nível, EXP, DPS, HP, defesa, habilidades).
O jogador não tem como saber quanto dano seu herói faz, quanta vida tem, ou quando vai subir de nível.
O TBH tem uma aba "STATUS" acessível por botão no cabeçalho ou dentro do painel de herói.

## Referência visual
Ver `exemplos/exemplo-aba-status-boneco.png`:
- Título: nome do herói + classe
- Seção stats: Nível, EXP (X/Y), DPS de ataque básico, Dano, PV atual/máximo, Velocidade de ataque
- Seção habilidades: ícones com cooldown e nível (X/Y)
- Pontos de habilidade disponíveis

## Requisitos (EARS)

- **R18.1** O sistema DEVE exibir um painel "STATUS" acessível pelo botão 📊 na barra de atalhos.
- **R18.2** SE a party tem múltiplos heróis, ENTÃO o painel DEVE permitir navegar entre eles (abas ou setas).
- **R18.3** O painel DEVE exibir para cada herói:
  - Nome e classe
  - Nível atual e barra de EXP (XP atual / XP próximo nível)
  - HP atual / HP máximo
  - Ataque total (base + itens + nível)
  - Defesa total
  - DPS calculado (ataques × dano médio por segundo)
  - Velocidade de ataque (ataques/segundo)
  - Chance de crítico (%)
  - Multiplicador crítico
  - Elemento
- **R18.4** O painel DEVE exibir os itens equipados como slots visuais (paperdoll), com clique para desequipar.
- **R18.5** O painel DEVE mostrar as habilidades do herói com: nome, tipo (dano/cura/buff), cooldown em segundos, ícone.
- **R18.6** O painel DEVE exibir o sprite do herói em destaque (canvas 64×72, escala 4×).

## Critérios de Aceite
- Abrindo o STATUS de qualquer herói, o jogador enxerga todos os stats calculados com itens equipados.
- A barra de EXP mostra a porcentagem de progresso para o próximo nível.
- É possível navegar entre os heróis da party sem fechar o painel.

## Design

### Dados necessários (já existem ou precisam ser adicionados ao snapshot)
- `HeroiMetaSnapshot` já tem: `nivel`, `xp`, `xpProximo`, `danoPorSegundo`, `equipamento`.
- Precisam ser adicionados: `vidaAtual`, `vidaMaxima`, `ataque`, `defesa`, `velocidadeAtaque`, `chanceCritico`, `multiplicadorCritico`, `elemento`, `habilidades[]`.
- Alternativa: criar `HeroiStatusSnapshot` separado, gerado sob demanda.

### UI
- Novo modal `#modal-status` com estrutura similar a `modal-party`.
- Botão `📊` adicionado à `#barra-botoes` no `index.html`.
- Componente `PainelStatus` (ou seção em `PainelInterface`) que consome `SnapshotMeta`.
- Abas por slot de herói: botões com nome do herói ou "Slot N — vazio".

### Contrato
- Ampliar `HeroiMetaSnapshot` em `contratos.ts` com os atributos calculados faltantes.
- Método `heroiStatusCompleto(slot)` em `EstadoDoJogo` que retorna os atributos finais.

## Tarefas
- [ ] T18.1 Ampliar `HeroiMetaSnapshot` com vida, ataque, defesa, vel. ataque, crit, elemento.
- [ ] T18.2 Adicionar habilidades ao snapshot de herói (nome, tipo, cooldown).
- [ ] T18.3 Criar `#modal-status` em `index.html` com estrutura HTML.
- [ ] T18.4 Adicionar botão 📊 na barra de atalhos.
- [ ] T18.5 Implementar `renderStatus(meta)` em `PainelInterface` com abas por herói.
- [ ] T18.6 Barra de EXP visual (div com width em %).
- [ ] T18.7 Paperdoll dos itens equipados dentro do status (com clique para desequipar).
- [ ] T18.8 Lista de habilidades com ícone/nome/tipo/cooldown.

## Status: 🔴 Pendente
