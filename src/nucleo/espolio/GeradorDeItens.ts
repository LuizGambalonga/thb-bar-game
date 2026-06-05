// Gera itens e drops de forma determinística (stream "espolio" do RNG).

import type { GeradorAleatorio } from "../aleatorio/GeradorAleatorio.js";
import { RARIDADES_ORDENADAS } from "../dominio/constantes.js";
import type {
  Atributos,
  DefAfixo,
  DefItem,
  ItemInstancia,
  Raridade,
  TabelaEspolio,
} from "../dominio/tipos.js";

/** Quantos afixos cada raridade concede. */
const AFIXOS_POR_RARIDADE: Record<Raridade, number> = {
  comum: 0,
  incomum: 1,
  raro: 2,
  epico: 3,
  lendario: 4,
  imortal: 5,
  arcano: 6,
  cosmico: 7,
};

/** Multiplicador de poder por raridade, usado no score de ordenação. */
const MULT_PODER_RARIDADE: Record<Raridade, number> = {
  comum: 1,
  incomum: 1.3,
  raro: 1.7,
  epico: 2.2,
  lendario: 3,
  imortal: 4,
  arcano: 5.5,
  cosmico: 8,
};

export interface ResultadoDrop {
  ouro: number;
  item?: ItemInstancia;
  bau: boolean;
}

export class GeradorDeItens {
  constructor(
    private readonly itensPorId: ReadonlyMap<string, DefItem>,
    private readonly afixosPorId: ReadonlyMap<string, DefAfixo>,
  ) {}

  /** Sorteia um drop (ouro + possível item + possível baú) a partir da tabela. */
  rolarDrop(tabela: TabelaEspolio, rng: GeradorAleatorio): ResultadoDrop {
    const ouro = rng.inteiro(tabela.faixaOuro[0], tabela.faixaOuro[1]);
    const bau = rng.proximo() < tabela.chanceBau;
    const dropouItem = rng.proximo() < tabela.chanceItem;
    const item = dropouItem
      ? this.criarItem(rng.escolherPorPeso(tabela.pesosRaridade), rng)
      : undefined;
    return { ouro, item, bau };
  }

  /** Cria uma instância de item de uma dada raridade. */
  criarItem(raridade: Raridade, rng: GeradorAleatorio): ItemInstancia | undefined {
    const definicoes = [...this.itensPorId.values()];
    if (definicoes.length === 0) return undefined;
    const def = rng.escolher(definicoes);

    const afixosElegiveis = def.afixosPermitidos
      .map((id) => this.afixosPorId.get(id))
      .filter((a): a is DefAfixo => !!a && a.raridadesPermitidas.includes(raridade));

    const quantidade = Math.min(AFIXOS_POR_RARIDADE[raridade], afixosElegiveis.length);
    const afixos: ItemInstancia["afixos"] = [];
    const usados = new Set<string>();
    for (let i = 0; i < quantidade; i++) {
      const candidatos = afixosElegiveis.filter((a) => !usados.has(a.id));
      if (candidatos.length === 0) break;
      const escolhido = rng.escolher(candidatos);
      usados.add(escolhido.id);
      afixos.push({
        idDef: escolhido.id,
        valor: rng.flutuante(escolhido.faixa[0], escolhido.faixa[1]),
      });
    }

    return {
      uid: this.gerarUid(rng),
      idDef: def.id,
      raridade,
      afixos,
      poder: this.calcularPoder(def, afixos, raridade),
    };
  }

  /** Soma os atributos efetivos de uma instância (base do item + afixos). */
  atributosDoItem(item: ItemInstancia): Partial<Atributos> {
    const def = this.itensPorId.get(item.idDef);
    if (!def) return {};
    const total: Partial<Atributos> = { ...def.atributosBase };
    for (const afixo of item.afixos) {
      const defAfixo = this.afixosPorId.get(afixo.idDef);
      if (!defAfixo) continue;
      const chave = defAfixo.atributo;
      if (chave === "afinidades") continue;
      total[chave] = ((total[chave] as number | undefined) ?? 0) + afixo.valor;
    }
    return total;
  }

  private calcularPoder(
    def: DefItem,
    afixos: ItemInstancia["afixos"],
    raridade: Raridade,
  ): number {
    const baseSoma = Object.values(def.atributosBase).reduce<number>(
      (s, v) => s + (typeof v === "number" ? v : 0),
      0,
    );
    const afixoSoma = afixos.reduce((s, a) => s + a.valor, 0);
    const indice = RARIDADES_ORDENADAS.indexOf(raridade);
    return Math.floor((baseSoma + afixoSoma) * MULT_PODER_RARIDADE[raridade] + indice * 10);
  }

  private gerarUid(rng: GeradorAleatorio): string {
    return `item-${rng.inteiro(0, 0x7fffffff).toString(36)}-${rng.inteiro(0, 0x7fffffff).toString(36)}`;
  }
}
