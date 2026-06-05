# 021 — Fases: Área com Monstro Único + Boss Final  `[REDESIGN + FEATURE]`

## Contexto
As fases atuais misturam vários tipos de monstros na mesma onda (ex: "bit-slime + icone-zumbi + cursor-selvagem" numa única wave).
Isso é visualmente confuso e não dá identidade a cada área.
No TBH, cada área tem **um tipo de inimigo temático** repetido em múltiplas ondas — e a última onda é sempre o **Boss** daquela área.

## Referência visual
Ver `exemplos/exemplo-do-ato-fases7.png`:
- Ato 1 tem áreas claramente distintas (Arredores da Cidade, etc.)
- O mapa mostra nós sequenciais — cada nó = uma área com identidade própria

## Requisitos (EARS)

- **R21.1** Cada fase (`DefFase`) DEVE ter exatamente **um tipo de inimigo** nas ondas normais.
- **R21.2** A **última onda** de cada fase DEVE conter apenas o boss (`chefe`) — sem monstros normais.
- **R21.3** Opcionalmente, pode haver uma **penúltima onda de mini-chefe** antes do boss.
- **R21.4** O número de ondas normais POR FASE deve ser **5** (antes do mini-chefe ou boss).
- **R21.5** O Ato I DEVE ter **4 áreas sequenciais** com monstros distintos:
  - Área 1 — "Arredores de Bits": inimigo = `bit-slime`, ondas 1–5, boss = `a-lixeira`
  - Área 2 — "Corredores de Ícones": inimigo = `icone-zumbi`, ondas 1–5, boss = `cursor-chefe`
  - Área 3 — "Pop-up Swamp": inimigo = `popup`, ondas 1–5, boss = `popup-gigante`
  - Área 4 — "Núcleo do Sistema": inimigo = `cursor-selvagem`, ondas 1–5, boss = `guardiao-do-espaco`
- **R21.6** Cada área DEVE ter monstros escalados conforme a dificuldade (Normal/Difícil/Pesadelo/KernelPanic).
- **R21.7** O mapa (`Portal`) DEVE exibir os 4 nós de área do Ato I, com ícone do monstro principal e status (bloqueado/liberado/concluído/atual).
- **R21.8** Avançar para a próxima área DEVE exigir ter derrotado o boss da área anterior.
- **R21.9** O Portal DEVE exibir ato (1, 2, 3) em abas separadas — Atos II e III bloqueados até completar o anterior.

## Critérios de Aceite
- Em qualquer fase, o jogador combate apenas 1 tipo de inimigo durante as ondas normais.
- A última onda da fase exibe claramente o boss (sprite maior, barra de vida de boss).
- No Portal, o mapa mostra 4 nós para o Ato I, cada um com ícone do inimigo da área.
- Completar a área 4 (boss Guardião) desbloqueia a dificuldade Difícil do Ato I.

## Design

### Novos monstros necessários
Para R21.5 precisamos de novos bosses que ainda não existem:
- `cursor-chefe`: versão grande do cursor, stats de mini-boss
- `popup-gigante`: pop-up com vida muito alta e multi-hit
(definir em `monstros.ts` com stats adequados)

### Reestruturação de `fases.ts`
```ts
// Estrutura de fase com área única
function areaAto1(
  id: string, nome: string, dificuldade: Dificuldade,
  idMonstro: string, boss: string, escala: number, requer?: string
): DefFase {
  return {
    id,
    nome,
    ato: 1,
    dificuldade,
    ondas: [
      { idsMonstros: [idMonstro], quantidade: 4 },
      { idsMonstros: [idMonstro], quantidade: 5 },
      { idsMonstros: [idMonstro], quantidade: 5 },
      { idsMonstros: [idMonstro], quantidade: 6 },
      { idsMonstros: [idMonstro], quantidade: 6 },
      { idsMonstros: [boss], quantidade: 1 },  // última onda = boss
    ],
    chefe: boss,
    escalaInimigos: escala,
    requer,
  };
}
```

### Atualizar Portal UI
- `renderPortal` em `PainelInterface.ts`: exibir as 4 áreas do Ato I em sequência.
- Cada nó deve mostrar: nome da área, ícone do monstro principal, estado.
- Abas "Ato 1 / Ato 2 / Ato 3" no topo do portal.

### Identificação de boss no `VisaoDeCombate`
- `ehChefe()` deve retornar true para qualquer inimigo cuja `familia === "boss"` (já tem no `DefMonstro`).
- Garantir que `barra de boss especial` (spec 017, R17.5) seja acionada corretamente.

## Tarefas
- [ ] T21.1 Criar monstros `cursor-chefe` e `popup-gigante` em `monstros.ts`.
- [ ] T21.2 Criar tabela de espólio dedicada para os novos bosses.
- [ ] T21.3 Reestruturar `fases.ts`: 4 áreas × 4 dificuldades = 16 fases do Ato I.
- [ ] T21.4 Cada área tem 5 ondas normais (monstro único) + 1 onda de boss.
- [ ] T21.5 Gating: cada área requer a anterior concluída; dificuldade seguinte requer normal concluída.
- [ ] T21.6 Atualizar `renderPortal` para mostrar 4 nós com ícone de monstro e abas de ato.
- [ ] T21.7 Garantir que `ehChefe()` em `VisaoDeCombate` funciona com os novos bosses.

## Dependências
- Spec 017 (barras de boss) deve ser implementada junto ou antes.
- Spec 020 (balanceamento) deve definir tabelas de espólio de boss antes desta spec.

## Status: 🔴 Pendente
