# Modelo de Dados, Fórmulas e Save

Tipos em português (a verdade canônica é o código em `src/nucleo/dominio`). Números são valores de partida para balanceamento.

## Constantes
```ts
TICKS_POR_SEGUNDO = 10;        // 100 ms por tick
MAX_PARTY = 3;
TETO_OFFLINE_HORAS_BASE = 8;   // ampliável por runa
VERSAO_ESQUEMA_ATUAL = 1;
CONST_DEFESA = 100;            // K na mitigação
CRESCIMENTO_POR_NIVEL = 0.08;
```

## Enums
```ts
type Elemento  = "fogo" | "bio" | "gelo" | "raio" | "nenhum";
type Raridade  = "comum" | "incomum" | "raro" | "epico" | "lendario" | "imortal" | "arcano" | "cosmico";
type IdClasse  = "cavaleiro" | "patrulheiro" | "feiticeira" | "sacerdote" | "cacador" | "carrasco";
type EspacoEquip = "arma" | "armadura" | "elmo" | "botas" | "acessorio1" | "acessorio2";
type Dificuldade = "normal" | "dificil" | "pesadelo" | "kernelPanic";
```

## Atributos
```ts
interface Atributos {
  vida: number; ataque: number; defesa: number;
  chanceCritico: number;       // 0..1
  multiplicadorCritico: number;// 1.5 = +50%
  velocidadeAtaque: number;    // ataques por segundo
  rouboDeVida: number;         // 0..1 do dano vira cura
  afinidades: Partial<Record<Elemento, number>>;
}
```

### Fórmulas de combate (determinísticas)
```
bruto    = ataque * (acertouCritico ? multiplicadorCritico : 1)
multElem = counter(elemAtacante, elemAlvo)        // 1.25 vantagem | 0.8 desvantagem | 1.0 neutro
mitigacao= defesaAlvo / (defesaAlvo + CONST_DEFESA)
dano     = max(1, floor(bruto * multElem * (1 - mitigacao)))

intervaloAtaqueTicks = round(TICKS_POR_SEGUNDO / velocidadeAtaque)
acertouCritico       = rng.proximo() < chanceCritico     // stream "combate"
```

### Escala por nível
```
atributoNoNivel(base, nivel) = floor(base * (1 + CRESCIMENTO_POR_NIVEL * (nivel - 1)))
xpParaProximo(nivel)         = floor(50 * nivel^1.5)
```

## Entidades principais
```ts
interface DefHeroi   { id: IdClasse; nome: string; papel: string; elemento: Elemento;
                       atributosBase: Atributos; habilidades: DefHabilidade[];
                       desbloqueio: { custoOuro: number; requer?: string }; }
interface EstadoHeroi{ idClasse: IdClasse; nivel: number; xp: number; vivo: boolean;
                       vidaAtual: number; equipamento: Partial<Record<EspacoEquip, ItemInstancia>>; }
interface EstadoParty{ slots: (EstadoHeroi|null)[]; slotsDesbloqueados: number;
                       formacao: Record<number, "frente"|"tras">; }

interface DefMonstro { id: string; nome: string; atributos: Atributos; elemento: Elemento;
                       idTabelaEspolio: string; familia: string; }
interface DefFase    { id: string; ato: 1|2|3; dificuldade: Dificuldade; ondas: DefOnda[];
                       miniChefe?: string; chefe: string; requer?: string; }
interface DefOnda    { idsMonstros: string[]; quantidade: number; }

interface ItemInstancia { uid: string; idDef: string; raridade: Raridade;
                          afixos: { idDef: string; valor: number }[]; poder: number; }
interface TabelaEspolio { idFase: string; pesosRaridade: Record<Raridade, number>;
                          faixaOuro: [number, number]; chanceBau: number; }
```

### Pesos de raridade por dificuldade (partida)
| Dificuldade | comum | incomum | raro | épico | lendário | imortal | arcano | cósmico |
|---|---|---|---|---|---|---|---|---|
| normal | 60 | 25 | 10 | 4 | 1 | 0 | 0 | 0 |
| dificil | 40 | 30 | 18 | 8 | 3 | 1 | 0 | 0 |
| pesadelo | 20 | 28 | 25 | 15 | 8 | 3 | 1 | 0 |
| kernelPanic | 8 | 18 | 24 | 22 | 15 | 8 | 4 | 1 |

## Cubo Heródrico
8 funções: `alquimia | sintese | decoracao | gravacao | inscricao | transmutacao | extracao | rerrolagem`. Regra anti-exploit: toda receita consome ≥ valor do resultado (sem geração infinita).

## Árvore de Inicialização
~197 nós; cada nó: `{ id, nome, custo, requer[], efeito }` onde efeito é `stat` (flat/pct) ou `desbloqueio` (slotParty | tetoOffline | velocidade | bauAuto). Respec devolve a soma dos custos.

## Save (raiz)
```ts
interface JogoSalvo {
  versaoEsquema: number; criadoEm: number; ultimoAcesso: number;
  estadoRng: { combate: string; espolio: string };
  ouro: number; party: EstadoParty; heroisDesbloqueados: IdClasse[];
  inventario: ItemInstancia[]; materiais: Record<string, number>;
  cubo: { funcoesDesbloqueadas: string[] };
  runas: { alocados: Record<string, number>; pontosDisponiveis: number };
  progresso: { idFaseAtual: string; fasesLimpas: string[]; indiceOndaAtual: number; logsDesbloqueados: string[] };
  config: { velocidade: 1|2|3; mudo: boolean; reduzirFlashes: boolean; escalaUi: number;
            posicaoJanela?: [number, number]; modo: "compacto"|"expandido" };
}
```
Migração: `migracoes[de→para]` aplicadas em cadeia até `VERSAO_ESQUEMA_ATUAL`, com validação antes/depois.

## Contratos IPC (resumo)
- `Intencao`: união discriminada por `tipo` (`equiparItem`, `craftar`, `alocarRuna`, `definirFormacao`, `desbloquearHeroi`, `trocarFase`, `definirVelocidade`, `pausar`, `retomar`).
- `SnapshotCombate`: `{ tick, herois[], inimigos[], eventos[] }`.
- `SnapshotMeta`: `{ ouro, party, qtdInventario, fase, pontosRuna, danoPorSegundoParty }`.
