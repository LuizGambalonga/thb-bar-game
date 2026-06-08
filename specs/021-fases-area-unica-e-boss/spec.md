# 021 — Fases: Área com Monstro Único + Boss Final  `[REDESIGN + FEATURE]`

## Contexto
As fases do Ato I têm identidade por área: cada área tem **um tipo de inimigo temático** repetido em múltiplas ondas e a última onda é sempre o **Boss** daquela área.

O bestiário usa nomes de fantasia RPG — termos de interface do Windows (cursor, popup, lixeira) foram explicitamente descartados por não pertencerem ao universo do jogo.

## Requisitos (EARS)

- **R21.1** Cada fase (`DefFase`) DEVE ter exatamente **um tipo de inimigo** nas ondas normais.
- **R21.2** A **última onda** de cada fase DEVE conter apenas o boss (`chefe`).
- **R21.4** O número de ondas normais POR FASE deve ser **5** (+ 1 onda de boss = 6 total).
- **R21.5** O Ato I DEVE ter **4 áreas sequenciais** com monstros distintos:
  - Área 1 — "Planícies Digitais": inimigo = `grub-binario`, boss = `leviata-dados`
  - Área 2 — "Floresta dos Espectros": inimigo = `espectro-zumbi`, boss = `lobo-corrompido`
  - Área 3 — "Pântano das Sombras": inimigo = `morcego-viral`, boss = `verme-abismo`
  - Área 4 — "Fortaleza Corrompida": inimigo = `raposa-neon`, boss = `golem-hardware`
- **R21.6** Cada área DEVE ter escalas por dificuldade: Normal (×1), Difícil (×1.8), Pesadelo (×3.2), Kernel Panic (×6).
- **R21.8** Avançar para a próxima área DEVE exigir ter derrotado o boss da área anterior.

## IDs de fase

Formato: `a{ato}{dificuldade}-{area}`

| Dificuldade | Prefixo | Requer |
|---|---|---|
| Normal      | `a1n-`  | — |
| Difícil     | `a1d-`  | `a1n-fortaleza` |
| Pesadelo    | `a1p-`  | `a1d-fortaleza` |
| Kernel Panic| `a1k-`  | `a1p-fortaleza` |

Áreas: `planicies`, `floresta`, `pantano`, `fortaleza`.
Exemplo: `a1n-planicies`, `a1d-floresta`, `a1k-fortaleza`.

**Fase inicial:** `a1n-planicies`.

## Bestiário

### Monstros comuns
| ID | Nome | Família |
|---|---|---|
| `grub-binario`   | Grub Binário   | inseto    |
| `espectro-zumbi` | Espectro Zumbi | morto-vivo|
| `raposa-neon`    | Raposa Neon    | besta     |
| `morcego-viral`  | Morcego Viral  | besta     |

### Bosses
| ID | Nome | Família |
|---|---|---|
| `leviata-dados`    | Leviatã de Dados   | boss |
| `lobo-corrompido`  | Lobo Corrompido    | boss |
| `verme-abismo`     | Verme do Abismo    | boss |
| `golem-hardware`   | Golem de Hardware  | boss |

## Implementação

```ts
// fases.ts — estrutura real implementada
function area(id, nome, ato, dificuldade, idMonstro, boss, escala, requer?): DefFase {
  return { id, nome, ato, dificuldade,
    ondas: [
      { idsMonstros: [idMonstro], quantidade: 3 },
      { idsMonstros: [idMonstro], quantidade: 4 },
      { idsMonstros: [idMonstro], quantidade: 5 },
      { idsMonstros: [idMonstro], quantidade: 5 },
      { idsMonstros: [idMonstro], quantidade: 6 },
      { idsMonstros: [boss],      quantidade: 1 },
    ],
    chefe: boss, escalaInimigos: escala, requer,
  };
}
```

## Tarefas
- [x] T21.1 Definir monstros comuns e bosses em `monstros.ts` (IDs de fantasia RPG).
- [x] T21.3 Reestruturar `fases.ts`: 4 áreas × 4 dificuldades = 16 fases do Ato I.
- [x] T21.4 Cada área tem 5 ondas normais + 1 onda de boss.
- [x] T21.5 Gating: cada área requer a anterior (mesma dificuldade); difícil requer normal completa.
- [ ] T21.6 Atualizar `renderPortal` para mostrar 4 nós com ícone de monstro e abas de ato.
- [x] T21.7 `ehChefe()` em `VisaoDeCombate` funciona via `familia === "boss"`.

## Status: 🟡 parcial — conteúdo e fases implementados; Portal UI (T21.6) pendente
