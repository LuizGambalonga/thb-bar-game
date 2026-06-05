# 025 — Formação de Combate e Movimento de Monstros  `[BUG + FEATURE]`

## Contexto
Dois bugs críticos de jogabilidade:
1. **Monstros não se movem** — ficam parados no lado direito do canvas sem caminhar até os heróis, tornando o combate sem sentido visual.
2. **Formação não é respeitada** — o Cavaleiro (o Firewall) deve SEMPRE ser a linha de frente (tankando os golpes); as classes de suporte/ranged (Sacerdote, Patrulheiro, Feiticeira, Caçador) devem ficar atrás. Hoje isso não acontece de forma consistente.

A lore justifica: o Cavaleiro é o Firewall — ele existe para ser batido primeiro. O Sacerdote (Coletor de Lixo) cura atrás. O Patrulheiro (Pinger) atira à distância. A formação não é optional — é a identidade de cada classe.

## Requisitos (EARS)

### Movimento dos monstros
- **R25.1** QUANDO um monstro spawna, DEVE ter posição X inicial = borda direita da arena.
- **R25.2** ENQUANTO há heróis vivos na frente, os monstros DEVEM avançar para a esquerda em cada tick (velocidade em px/tick data-driven em `DefMonstro.velocidadeMovimento`).
- **R25.3** QUANDO um monstro está dentro do alcance de ataque (`DefMonstro.alcanceAtaque` px) de um herói da frente, DEVE parar e atacar.
- **R25.4** SE o herói da frente morre, os monstros DEVEM avançar até o próximo alvo disponível.
- **R25.5** Monstros DEVEM ter posição X persistida no estado de combate (`EstadoCombate`) e interpolada no render.

### Formação — regras automáticas
- **R25.6** O Cavaleiro DEVE ser automaticamente posicionado em `"frente"` ao entrar na party; o jogador NÃO DEVE poder mudar isso pela UI (o slot de frente pertence ao Cavaleiro enquanto ele estiver na party).
- **R25.7** Todas as outras classes (Patrulheiro, Feiticeira, Sacerdote, Caçador, Carrasco) DEVEM ser posicionadas em `"tras"` por padrão ao entrar na party.
- **R25.8** SE não há Cavaleiro na party, o herói com maior `defesa` DEVE ser automaticamente designado para `"frente"`.
- **R25.9** Heróis na `"tras"` DEVEM ser o alvo dos monstros SOMENTE após todos os heróis da `"frente"` estarem mortos.
- **R25.10** A formação DEVE ser exibida visualmente: heróis da frente à esquerda do canvas, heróis de trás levemente recuados à direita.

## Critérios de Aceite
- Monstros aparecem na borda direita e caminham para a esquerda até alcançar o Cavaleiro.
- Cavaleiro toma todos os golpes enquanto está vivo.
- Sacerdote/Patrulheiro/Feiticeira não tomam dano enquanto o Cavaleiro viver.
- Ao matar o Cavaleiro, monstros avançam e atacam o próximo herói de trás.
- Ao adicionar Cavaleiro à party, ele vai automaticamente para a frente sem precisar configurar.

## Design

### Núcleo — `EstadoCombate` (inimigos)
```ts
interface EstadoInimigo {
  // existentes
  id: string; vidaAtual: number; vidaMaxima: number; ...
  // novos
  posicaoX: number;       // px — posição atual na arena (0 = esquerda, LARGURA_ARENA = direita)
  atacando: boolean;      // true quando em alcance de ataque
}
```

### Núcleo — `MotorDeCombate.ts`
```ts
// A cada tick, para cada inimigo vivo:
const alvoFrente = heroisDaFrente().find(h => h.vivo);
const alcance = def.alcanceAtaque ?? ALCANCE_MELEE_PADRAO; // default 60px
if (inimigo.posicaoX - alvo.posicaoX > alcance) {
  inimigo.posicaoX -= def.velocidadeMovimento; // move para a esquerda
  inimigo.atacando = false;
} else {
  inimigo.atacando = true;
  // lógica de ataque já existente
}
```

### Conteúdo — `DefMonstro`
Adicionar campos:
```ts
interface DefMonstro {
  ...
  velocidadeMovimento: number; // px por tick; default = 8
  alcanceAtaque: number;       // px; melee = 60, ranged = 300
}
```
Preencher valores razoáveis nos arquivos de dados de monstros existentes.

### Núcleo — `MotorDeCombate.ts` (formação)
```ts
function posicaoFormacaoInicial(heroi: DefHeroi, party: EstadoParty): "frente" | "tras" {
  if (heroi.idClasse === "cavaleiro") return "frente";
  return "tras";
}

function heroisDaFrente(party: EstadoParty): EstadoHeroi[] {
  return party.slots.filter(h => h && h.vivo && party.formacao[h.idClasse] === "frente");
}
```

### Renderer — `VisaoDeCombate.ts`
- Heróis renderizados à esquerda: frente em X=80, trás em X=160 (ajustar conforme arte).
- Monstros interpolam `posicaoX` entre snapshots usando `lerp`.
- Adicionar animação de "caminhada" (ciclo simples de sprite ou oscilação Y de 2px).

### Snapshot
`SnapshotCombate.inimigos[]` deve incluir `posicaoX` e `atacando` para o renderer.

## Tarefas
- [ ] T25.1 Adicionar `posicaoX` e `atacando` a `EstadoInimigo` (núcleo + compartilhado).
- [ ] T25.2 Adicionar `velocidadeMovimento` e `alcanceAtaque` a `DefMonstro` e preencher dados.
- [ ] T25.3 Implementar lógica de movimento no `MotorDeCombate.avancarTick`.
- [ ] T25.4 Implementar `posicaoFormacaoInicial` — Cavaleiro sempre na frente ao entrar na party.
- [ ] T25.5 Corrigir targeting: monstros atacam só heróis da frente; avançam ao morrer todos da frente.
- [ ] T25.6 Atualizar `SnapshotCombate` para incluir `posicaoX` dos inimigos.
- [ ] T25.7 Renderizar heróis em posições de formação (frente=X menor, trás=X maior).
- [ ] T25.8 Interpolar `posicaoX` dos monstros no renderer.

## Status: 🔴 Pendente
