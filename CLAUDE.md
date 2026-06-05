# CLAUDE.md — TBH: Heróis da Barra de Tarefas

Instruções de projeto para qualquer IA/dev que trabalhe neste repositório. **Estas regras são obrigatórias.**

## O que é
Idle hack-and-slash ARPG **single-player** que vive numa janelinha *always-on-top* na barra de tarefas do Windows. Inspirado em *TBH: Task Bar Hero*, porém 100% offline, sem multiplayer, sem trading, sem dinheiro real.

## Regras de OURO (não negociáveis)

### 1. Spec Driven Development (SDD com IA)
- A fonte da verdade é a pasta [`specs/`](./specs).
- **Cada funcionalidade vive na própria pasta numerada**: `specs/NNN-nome-da-funcionalidade/spec.md` (ex.: `001-janela-e-taskbar`).
- Ordem inviolável: **Spec → Design → Tasks → Código → Teste**. Nada de código de feature sem spec aprovada.
- Documentos transversais: `specs/CONSTITUICAO.md`, `specs/LORE.md`, `specs/ARQUITETURA.md`, `specs/MODELO-DE-DADOS.md`.

### 2. Idioma do código: PORTUGUÊS
- **Todos** os nomes de variáveis, funções, classes, métodos, tipos, arquivos e pastas de código são em **português**.
  - `class MotorDeCombate`, `function calcularDano()`, `const vidaAtual`, `interface Atributos`.
- Comentários em português. Termos de domínio em português (`heroi`, `inimigo`, `fase`, `loot`→`espolio`, `raridade`).
- Exceção única: APIs de terceiros (Electron, DOM) mantêm seus nomes originais.

### 3. SOLID + Clean Code
- **S** — uma classe, uma responsabilidade (`ServicoDeSave` só persiste; `MotorDeCombate` só simula).
- **O** — conteúdo (heróis, itens, monstros) é data-driven e extensível sem alterar o motor.
- **L** — implementações respeitam o contrato das interfaces.
- **I** — interfaces pequenas e focadas (`RepositorioDeSave`, `RelogioDoJogo`).
- **D** — dependa de abstrações; injeção de dependências na *composition root* (`principal/main.ts`).
- Funções curtas, nomes reveladores, sem números mágicos (use constantes nomeadas), sem comentários que repetem o código. Camadas isoladas (ver ARQUITETURA).

### 4. Núcleo determinístico e puro
- `src/nucleo/**` é **TypeScript puro**: NÃO importa Electron, DOM, `fs`, nem render.
- Toda aleatoriedade usa `GeradorAleatorio` (semeado). Proibido `Math.random()`, `Date.now()`, `performance.now()` dentro do núcleo — tempo entra por parâmetro.
- Mesma semente + mesmos inputs ⇒ mesmo resultado (testável).

### 5. Build e run FÁCEIS
- `npm install` → `npm run dev` abre o jogo. Só isso.
- Dependências mínimas: `electron`, `esbuild`, `typescript`, `vitest`. Render em **Canvas2D** (nativo), UI em TS/HTML/CSS puro — sem React/Pixi para manter leve.

## Estrutura de pastas
```
src/
├─ nucleo/          regras puras do jogo (sem I/O)  ← coração testável
│  ├─ dominio/      tipos e entidades
│  ├─ aleatorio/    GeradorAleatorio (RNG semeado)
│  ├─ atributos/    fórmulas e agregação de stats
│  ├─ combate/      MotorDeCombate (auto-battler por tick)
│  ├─ espolio/      tabelas e geração de loot
│  └─ progressao/   xp, nível, rendimento offline
├─ conteudo/        dados: herois, monstros, fases, itens, afixos
├─ compartilhado/   contratos de IPC (Intencao, Snapshots)
├─ principal/       processo Electron main (janela, laço, save) — composition root
└─ apresentacao/    renderer: Canvas2D + painéis de UI
```

## Comandos
| Comando | Faz |
|---|---|
| `npm install` | instala dependências |
| `npm run dev` | compila e abre o jogo (Electron) |
| `npm run build` | compila para `dist/` |
| `npm run dist` | gera instalador Windows (electron-builder) |
| `npm test` | roda testes do núcleo (Vitest) |
| `npm run typecheck` | checagem de tipos estrita |

## Definição de pronto (Done)
- Typecheck limpo + build OK + nomes em português + SOLID respeitado + sem `Math.random()` no núcleo.
- **Testes adiados (decisão do dono, jun/2026):** não escrever novos testes agora; focar em features e jogabilidade. Os testes existentes continuam no repo e uma bateria completa será feita **após o jogo ser aprovado**. (A regra de "core com teste" volta a valer na fase de estabilização.)

## Modo Conciso (Economia de Tokens)

**Regras de resposta — obrigatórias para toda interação neste projeto:**

- **Zero preâmbulos**: não dizer "Claro!", "Com prazer!", "Vou ajudar você a...". Ir direto ao ponto.
- **Zero resumos finais**: não listar o que foi feito após terminar. O diff fala por si.
- **Zero explicações do óbvio**: não descrever o que o código já mostra pelos nomes.
- **Atualizações curtas**: uma frase por atualização de progresso, sem elaboração.
- **Erros**: reportar só o erro e a causa. Sem preamble de "Parece que ocorreu um problema...".
- **Confirmações**: quando concluir uma tarefa, não há confirmação — o trabalho é a confirmação.
- **Perguntas**: somente quando genuinamente bloqueado. Máximo uma frase.

Formato preferido para respostas técnicas: resultado direto + caminho do arquivo (se aplicável). Nunca parágrafo onde uma linha basta.
