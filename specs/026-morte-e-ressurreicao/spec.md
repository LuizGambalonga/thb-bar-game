# 026 — Morte e Ressurreição do Sacerdote  `[FEATURE]`

## Contexto
Quando um herói cai em combate, ele deve entrar em estado `morto` (não apenas "HP zerado e revive imediato"). O **Sacerdote** (o Coletor de Lixo) é o único capaz de ressuscitar aliados via sua habilidade exclusiva **Ressuscitar**, que tem cooldown. Itens com afixo `reducaoCooldownRessurreicao` reduzem esse cooldown — criando um incentivo para equipa-lo bem. Isso transforma a morte num momento de tensão genuína em vez de trivialidade.

## Requisitos (EARS)

### Estado de morte
- **R26.1** QUANDO `vidaAtual` de um herói chega a 0, ele DEVE entrar no estado `morto: true` e permanecer inativo (não ataca, não é alvo, não recebe cura normal).
- **R26.2** Um herói morto DEVE ser exibido visualmente de forma distinta (sprite escurecido / ícone de caveira / posição derrubada).
- **R26.3** SE toda a party está morta (nenhum herói vivo), o jogo DEVE reiniciar a wave atual após um delay de 3s (comportamento de wipe já previsto em R2.4), ressuscitando todos com 1 HP.

### Habilidade Ressuscitar (Sacerdote)
- **R26.4** O Sacerdote DEVE ter a habilidade `ressuscitar` com cooldown base de **120 segundos** (1200 ticks a 10 Hz).
- **R26.5** QUANDO o Sacerdote está vivo e há pelo menos 1 herói morto, o sistema DEVE usar `ressuscitar` automaticamente assim que o cooldown terminar (idle — sem input do jogador).
- **R26.6** Ao ressuscitar, o herói alvo DEVE voltar com **30% da vida máxima**.
- **R26.7** `ressuscitar` tem **prioridade máxima** — é usada antes de qualquer outra habilidade do Sacerdote quando há morto na party.
- **R26.8** Se há múltiplos mortos, o Sacerdote ressuscita um por vez (o primeiro morto, por ordem de slot).
- **R26.9** O cooldown DEVE ser exibido visualmente no painel da party (timer contagem regressiva em segundos sobre o ícone do Sacerdote).

### Redução de cooldown por item
- **R26.10** Itens podem ter o afixo `reducaoCooldownRessurreicao: number` (valor em %, ex.: 0.20 = −20%).
- **R26.11** A `CalculadoraDeAtributos` DEVE agregar a soma de todos os afixos desse tipo e aplicar sobre o cooldown base: `cooldownFinal = floor(cooldownBase * (1 - totalReducao))`.
- **R26.12** O cooldown mínimo DEVE ser de **30 segundos** (300 ticks) — impossível zerar por item.
- **R26.13** O afixo `reducaoCooldownRessurreicao` DEVE aparecer apenas em **acessórios** (acessorio1 / acessorio2).

### UX / Feedback visual
- **R26.14** QUANDO um herói morre, DEVE aparecer uma notificação flutuante na arena: "⚠ [Nome] caiu!".
- **R26.15** QUANDO um herói é ressuscitado, DEVE aparecer: "✦ [Nome] ressurgiu!" com efeito de luz branca.
- **R26.16** O ícone do Sacerdote no header/footer DEVE mostrar um anel de cooldown animado enquanto a habilidade está em recarga.

## Critérios de Aceite
- Cavaleiro morre → fica escurecido, monstros avançam para trás da party.
- Sacerdote vivo → após X segundos (cooldown), ressuscita o Cavaleiro com 30% HP automaticamente.
- Acessório com "−20% cooldown ressurreição" reduz o cooldown de 120s → 96s.
- Com cooldown zerado por cap: nunca abaixo de 30s.
- Se todos morrem → wipe → wave reinicia em 3s.

## Design

### Núcleo — `EstadoHeroi`
```ts
interface EstadoHeroi {
  ...
  morto: boolean;         // true = não ataca, não é alvo inimigo, não recebe cura
  tickMorreu: number;     // tick em que morreu (para ordenar ressurreição)
}
```

### Núcleo — `DefHabilidade` (Sacerdote)
```ts
{
  id: "ressuscitar",
  nome: "Ressuscitar",
  cooldownBase: 1200,     // ticks = 120s
  alvo: "aliadoMorto",
  efeito: { tipo: "ressuscitar", percentualVida: 0.30 }
}
```

### Núcleo — `MotorDeCombate.ts`
```ts
// No processamento de habilidades do Sacerdote:
if (habilidade.id === "ressuscitar") {
  const alvo = party.slots
    .filter(h => h && h.morto)
    .sort((a, b) => a.tickMorreu - b.tickMorreu)[0];
  if (alvo) {
    alvo.morto = false;
    alvo.vidaAtual = Math.floor(alvo.vidaMaxima * 0.30);
    emitirEvento({ tipo: "ressurreicao", idHeroi: alvo.idClasse });
  }
}
```

### Núcleo — `CalculadoraDeAtributos.ts`
```ts
function cooldownRessurreicao(sacerdote: EstadoHeroi, cooldownBase: number): number {
  const reducao = somarAfixos(sacerdote.equipamento, "reducaoCooldownRessurreicao");
  const cooldown = Math.floor(cooldownBase * (1 - Math.min(reducao, 0.75))); // cap 75%
  return Math.max(cooldown, 300); // mínimo 30s
}
```

### Conteúdo — afixos
Adicionar em `conteudo/afixos.ts` (ou equivalente):
```ts
{
  id: "reducaoCooldownRessurreicao",
  nome: "Redução de Cooldown de Ressurreição",
  slots: ["acessorio1", "acessorio2"],
  faixaValor: [0.05, 0.25],       // 5% a 25% por afixo
  raridades: ["raro", "epico", "lendario", "imortal", "arcano", "cosmico"]
}
```

### Renderer — feedback visual
- `VisaoDeCombate`: desenhar sprite "morto" (cinza 50% opacity + ícone ☠) para heróis com `morto: true`.
- Notificação flutuante: reutilizar sistema de dano flutuante para exibir "⚠ Caiu!" e "✦ Ressurgiu!".
- Anel de cooldown do Sacerdote: arco SVG ou Canvas arc sobre o ícone no footer.

### Snapshot
`SnapshotCombate.herois[]` deve incluir `morto: boolean` e, para o Sacerdote, `cooldownRessurreicaoRestante: number` (em ticks).

## Tarefas
- [ ] T26.1 Adicionar `morto` e `tickMorreu` a `EstadoHeroi` (núcleo + save + migração para v4).
- [ ] T26.2 Corrigir `MotorDeCombate`: ao HP=0 → `morto=true` em vez de ressurreição imediata.
- [ ] T26.3 Adicionar habilidade `ressuscitar` ao Sacerdote em `conteudo/herois.ts`.
- [ ] T26.4 Implementar processamento de `ressuscitar` no motor (prioridade, alvo, % vida).
- [ ] T26.5 Implementar `cooldownRessurreicao` em `CalculadoraDeAtributos`.
- [ ] T26.6 Adicionar afixo `reducaoCooldownRessurreicao` em `conteudo/afixos.ts`.
- [ ] T26.7 Atualizar `SnapshotCombate` com `morto` e `cooldownRessurreicaoRestante`.
- [ ] T26.8 Renderizar herói morto (sprite escurecido) em `VisaoDeCombate`.
- [ ] T26.9 Renderizar anel de cooldown do Sacerdote no footer/painel.
- [ ] T26.10 Emitir e exibir notificações flutuantes "Caiu!" / "Ressurgiu!".
- [ ] T26.11 Migração de save: v3 → v4 (inicializa `morto: false`, `tickMorreu: 0`).

## Status: 🔴 Pendente
