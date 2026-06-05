// UI: painéis laterais (Mochila/Portal) + modais centrais (Party, Status, Config).
// DOM puro + previews de sprite em <canvas>.

import type {
  ClasseDisponivel, HeroiMetaSnapshot, ItemSnapshot, MapaInfo, ResumoOffline, SnapshotMeta,
} from "../compartilhado/contratos.js";
import type { EspacoEquipamento, IdClasse, PosicaoFormacao, Raridade } from "../nucleo/dominio/tipos.js";
import { RARIDADES_ORDENADAS } from "../nucleo/dominio/constantes.js";
import { desenharSprite, obterSprite } from "./arte/sprites.js";

const COR_RARIDADE: Record<Raridade, string> = {
  comum: "var(--comum)", incomum: "var(--incomum)", raro: "var(--raro)", epico: "var(--epico)",
  lendario: "var(--lendario)", imortal: "var(--imortal)", arcano: "var(--arcano)", cosmico: "var(--cosmico)",
};
const ICONE_ESPACO: Record<EspacoEquipamento, string> = {
  arma: "⚔️", armadura: "🛡️", elmo: "⛑️", botas: "🥾", acessorio1: "💍", acessorio2: "💍",
};
// Ícone específico por definição de item (vai além do slot genérico)
const ICONE_ITEM: Record<string, string> = {
  "espada-bit": "🗡️",
  "machado-kernel": "🪓",
  "arco-pixel": "🏹",
  "cajado-byte": "🪄",
  "varinha-cache": "⚡",
  "armadura-cache": "🛡️",
  "colete-ping": "🦺",
  "manto-ram": "🧥",
  "elmo-pixel": "⛑️",
  "capuz-thread": "🎓",
  "tiara-cpu": "👑",
  "botas-ping": "🥾",
  "sandalia-lag": "👟",
  "anel-bit": "💍",
  "amuleto-fps": "📿",
};
const ICONE_CLASSE: Record<IdClasse, string> = {
  cavaleiro: "⚔️", carrasco: "💀", feiticeira: "🔮", sacerdote: "✨", cacador: "🏹", patrulheiro: "🛡️",
};
const NOME_CLASSE: Record<IdClasse, string> = {
  cavaleiro: "Cavaleiro", carrasco: "Carrasco", feiticeira: "Feiticeira",
  sacerdote: "Sacerdote", cacador: "Caçador", patrulheiro: "Patrulheiro",
};
const ESPACOS: EspacoEquipamento[] = ["arma", "armadura", "elmo", "botas", "acessorio1", "acessorio2"];
const GRUPO_CLASSE: Record<IdClasse, string> = {
  cavaleiro: "⚔", carrasco: "⚔", feiticeira: "🔮", sacerdote: "🔮", cacador: "🏹", patrulheiro: "🏹",
};
const NOME_GRUPO: Record<string, string> = { "⚔": "Guerreiro", "🔮": "Mago", "🏹": "Arqueiro" };

function gruposAfins(classesAfins: IdClasse[]): string[] {
  return [...new Set(classesAfins.map((c) => GRUPO_CLASSE[c]).filter(Boolean))];
}
function formatarAtributo(chave: string, valor: number): string {
  switch (chave) {
    case "ataque": return `+${Math.round(valor)} Ataque`;
    case "vida": return `+${Math.round(valor)} Vida`;
    case "defesa": return `+${Math.round(valor)} Defesa`;
    case "chanceCritico": return `+${(valor * 100).toFixed(1)}% Crítico`;
    case "multiplicadorCritico": return `+${(valor * 100).toFixed(0)}% Dano Crítico`;
    case "velocidadeAtaque": return `+${valor.toFixed(2)} Vel. Ataque`;
    case "rouboDeVida": return `+${(valor * 100).toFixed(1)}% Roubo de Vida`;
    default: return `+${valor} ${chave}`;
  }
}
function nomeCurto(nome: string): string { return nome.split("—")[0]!.trim(); }

const ESPACOS_FILTRO: { espaco: EspacoEquipamento | null; label: string }[] = [
  { espaco: null, label: "Todos" },
  { espaco: "arma", label: "⚔️" },
  { espaco: "armadura", label: "🛡️" },
  { espaco: "elmo", label: "⛑️" },
  { espaco: "botas", label: "🥾" },
  { espaco: "acessorio1", label: "💍" },
];

type OrdenacaoMochila = "poder-desc" | "raridade-desc" | "nome-az";

export class PainelInterface {
  private itemSelecionado: string | null = null;
  private abaStatusAtiva = 0;
  private atoAtivo = 1;
  private filtroEspaco: EspacoEquipamento | null = null;
  private filtroClasse: IdClasse | null = null;
  private ordenacaoMochila: OrdenacaoMochila = "poder-desc";
  private tooltipEl: HTMLElement | null = null;

  constructor(private readonly doc: Document) {
    this.configurarSplash();
    this.configurarModais();
    this.configurarPaineis();
    this.configurarBotoesCabecalho();
    this.configurarSair();
  }

  atualizar(meta: SnapshotMeta): void {
    this.texto("info-ouro", String(meta.ouro));
    this.texto("info-fase", meta.fase.nome);
    this.texto("info-onda", `Onda ${meta.indiceOnda + 1}/${meta.totalOndas}`);
    this.elemento("info-pausa").classList.toggle("oculto", !meta.pausado);
    this.renderStash(meta);
    this.renderParty(meta);
    this.renderPortal(meta);
    this.renderStatus(meta);
    this.renderConfig(meta);
  }

  mostrarResumoOffline(r: ResumoOffline): void {
    const minutos = Math.round(r.segundosCreditados / 60);
    this.texto("texto-offline",
      `Seus heróis patrulharam a Barra por ~${minutos} min e trouxeram ${r.ouro} de ouro e ${r.xp} de XP.` +
      (r.atingiuTeto ? " (teto offline atingido)" : ""));
    this.elemento("modal-offline").classList.remove("oculto");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STASH (painel lateral esquerdo)
  // ─────────────────────────────────────────────────────────────────────────

  private renderStash(meta: SnapshotMeta): void {
    this.ocultarTooltip();
    this.renderFiltrosMochila(meta);

    const livresTotal = meta.inventario.filter((i) => i.equipadoPorSlot === null);
    const livres = this.aplicarFiltroOrdenacao(livresTotal);

    const grade = this.elemento("grade-itens");
    grade.innerHTML = "";
    this.renderBotoesLote(meta);

    if (livres.length === 0) {
      grade.innerHTML = `<div class="mochila-vazia">${livresTotal.length === 0 ? "Mochila vazia!" : "Nenhum item neste filtro."}</div>`;
      this.elemento("detalhe-item").innerHTML = "";
      return;
    }

    // Mapa de poder equipado por espaço (para indicador de upgrade)
    const poderEquipado = new Map<EspacoEquipamento, number>();
    for (const item of meta.inventario) {
      if (item.equipadoPorSlot !== null) {
        const atual = poderEquipado.get(item.espaco) ?? 0;
        if (item.poder > atual) poderEquipado.set(item.espaco, item.poder);
      }
    }

    const melhorPoder = Math.max(...livres.map((i) => i.poder));
    const raridadeMax = Math.max(...livres.map((i) => RARIDADES_ORDENADAS.indexOf(i.raridade)));
    for (const item of livres) {
      const ehUpgrade = item.poder > (poderEquipado.get(item.espaco) ?? 0);
      grade.appendChild(this.celulaItem(item, meta, melhorPoder, raridadeMax, ehUpgrade));
    }

    const sel = livres.find((i) => i.uid === this.itemSelecionado) ?? livres[0]!;
    this.itemSelecionado = sel.uid;
    this.renderDetalhe(sel, meta);
  }

  private aplicarFiltroOrdenacao(livres: ItemSnapshot[]): ItemSnapshot[] {
    let resultado = livres;

    if (this.filtroClasse) {
      const fc = this.filtroClasse;
      resultado = resultado.filter((i) => i.classesAfins.length === 0 || i.classesAfins.includes(fc));
    }

    if (this.filtroEspaco) {
      resultado = resultado.filter((i) => i.espaco === this.filtroEspaco || (
        this.filtroEspaco === "acessorio1" && (i.espaco === "acessorio1" || i.espaco === "acessorio2")
      ));
    }

    switch (this.ordenacaoMochila) {
      case "poder-desc":
        resultado = [...resultado].sort((a, b) => b.poder - a.poder);
        break;
      case "raridade-desc":
        resultado = [...resultado].sort((a, b) =>
          RARIDADES_ORDENADAS.indexOf(b.raridade) - RARIDADES_ORDENADAS.indexOf(a.raridade));
        break;
      case "nome-az":
        resultado = [...resultado].sort((a, b) => a.nome.localeCompare(b.nome));
        break;
    }
    return resultado;
  }

  private renderFiltrosMochila(meta: SnapshotMeta): void {
    const container = this.doc.getElementById("filtros-mochila");
    if (!container) return;
    container.innerHTML = "";

    const total = meta.inventario.filter((i) => i.equipadoPorSlot === null).length;
    const contador = this.doc.createElement("div");
    contador.className = "mochila-contador";
    contador.textContent = `${total}/60 itens`;
    container.appendChild(contador);

    // ── Nível 1: filtro por CLASSE (heróis da party)
    const classesNoParty = [...new Set(meta.herois.filter(Boolean).map((h) => h!.idClasse))];
    if (classesNoParty.length > 0) {
      const rot1 = this.doc.createElement("span");
      rot1.className = "filtros-rotulo";
      rot1.textContent = "PERSONAGEM";
      container.appendChild(rot1);

      const linhaClasses = this.doc.createElement("div");
      linhaClasses.className = "filtros-linha";

      const btnTodos = this.doc.createElement("button");
      btnTodos.className = "btn-filtro btn-filtro-classe" + (this.filtroClasse === null ? " ativo" : "");
      btnTodos.textContent = "Todos";
      btnTodos.onclick = () => { this.filtroClasse = null; this.filtroEspaco = null; this.itemSelecionado = null; this.renderStash(meta); };
      linhaClasses.appendChild(btnTodos);

      for (const idClasse of classesNoParty) {
        const b = this.doc.createElement("button");
        b.className = "btn-filtro btn-filtro-classe" + (this.filtroClasse === idClasse ? " ativo" : "");
        b.textContent = `${ICONE_CLASSE[idClasse]} ${NOME_CLASSE[idClasse]}`;
        b.title = NOME_CLASSE[idClasse];
        b.onclick = () => { this.filtroClasse = idClasse; this.filtroEspaco = null; this.itemSelecionado = null; this.renderStash(meta); };
        linhaClasses.appendChild(b);
      }
      container.appendChild(linhaClasses);
    }

    // ── Nível 2: sub-filtro por SLOT (indentado quando classe está selecionada)
    const wrapperSlot = this.doc.createElement("div");
    wrapperSlot.className = "filtros-secao" + (this.filtroClasse ? " filtros-subsecao" : "");

    const rot2 = this.doc.createElement("span");
    rot2.className = "filtros-rotulo";
    rot2.textContent = this.filtroClasse ? "↳ TIPO DE ITEM" : "TIPO DE ITEM";
    wrapperSlot.appendChild(rot2);

    const linhaFiltros = this.doc.createElement("div");
    linhaFiltros.className = "filtros-linha";
    for (const { espaco, label } of ESPACOS_FILTRO) {
      const b = this.doc.createElement("button");
      b.className = "btn-filtro" + (this.filtroEspaco === espaco ? " ativo" : "");
      b.textContent = label;
      b.title = espaco ?? "Todos";
      b.onclick = () => { this.filtroEspaco = espaco; this.itemSelecionado = null; this.renderStash(meta); };
      linhaFiltros.appendChild(b);
    }
    wrapperSlot.appendChild(linhaFiltros);
    container.appendChild(wrapperSlot);

    // ── Ordenação
    const rot3 = this.doc.createElement("span");
    rot3.className = "filtros-rotulo";
    rot3.textContent = "ORDENAR";
    container.appendChild(rot3);

    const linhaOrdem = this.doc.createElement("div");
    linhaOrdem.className = "filtros-linha";
    const ordens: { valor: OrdenacaoMochila; label: string }[] = [
      { valor: "poder-desc", label: "Poder↓" },
      { valor: "raridade-desc", label: "Raridade↓" },
      { valor: "nome-az", label: "A-Z" },
    ];
    for (const { valor, label } of ordens) {
      const b = this.doc.createElement("button");
      b.className = "btn-filtro" + (this.ordenacaoMochila === valor ? " ativo" : "");
      b.textContent = label;
      b.onclick = () => { this.ordenacaoMochila = valor; this.renderStash(meta); };
      linhaOrdem.appendChild(b);
    }
    container.appendChild(linhaOrdem);
  }

  private renderBotoesLote(meta: SnapshotMeta): void {
    const container = this.doc.getElementById("acoes-lote");
    if (!container) return;
    container.innerHTML = "";
    const raridades: { label: string; raridade: Raridade }[] = [
      { label: "Vender Comuns", raridade: "comum" },
      { label: "Vender Incomuns−", raridade: "incomum" },
      { label: "Vender Raros−", raridade: "raro" },
    ];
    for (const { label, raridade } of raridades) {
      const qtd = meta.inventario.filter(
        (i) => i.equipadoPorSlot === null && RARIDADES_ORDENADAS.indexOf(i.raridade) <= RARIDADES_ORDENADAS.indexOf(raridade),
      ).length;
      if (qtd === 0) continue;
      const b = this.botao(`${label} (${qtd})`, () =>
        window.jogo.enviarIntencao({ tipo: "venderEmLote", raridadeMaxima: raridade }));
      b.className = "btn-lote";
      container.appendChild(b);
    }
  }

  private celulaItem(item: ItemSnapshot, meta: SnapshotMeta, melhorPoder: number, raridadeMax: number, ehUpgrade = false): HTMLElement {
    const cel = this.doc.createElement("button");
    cel.className = "celula-item";
    if (item.uid === this.itemSelecionado) cel.classList.add("selecionada");
    if (ehUpgrade) cel.classList.add("upgrade");
    cel.style.borderColor = COR_RARIDADE[item.raridade] ?? "var(--comum)";
    const ehMelhor = item.poder === melhorPoder;
    const ehRaro = RARIDADES_ORDENADAS.indexOf(item.raridade) === raridadeMax && raridadeMax > 0;
    const grupos = gruposAfins(item.classesAfins);
    const afimAtivos = item.classesAfins.length === 0 || meta.herois.some((h) => h && item.classesAfins.includes(h.idClasse));
    const icone = ICONE_ITEM[item.idDef] ?? ICONE_ESPACO[item.espaco] ?? "❔";
    cel.innerHTML = `
      ${ehMelhor ? '<span class="estrela" title="Maior poder">👑</span>' : ehRaro ? '<span class="estrela" title="Mais raro">⭐</span>' : ""}
      <span class="icone">${icone}</span>
      <span class="poder">⚡${item.poder}</span>
      ${ehUpgrade ? '<span class="icone-upgrade">▲</span>' : ""}
      ${grupos.length > 0 ? `<span class="afim-badge${afimAtivos ? "" : " afim-inutil"}" title="${grupos.map((g) => NOME_GRUPO[g]).join("/")}">${grupos[0]}</span>` : ""}`;
    cel.addEventListener("mouseenter", () => this.mostrarTooltipComparacao(item, meta, cel));
    cel.addEventListener("mouseleave", () => this.ocultarTooltip());
    cel.onclick = () => { this.itemSelecionado = item.uid; this.renderStash(meta); };
    return cel;
  }

  private renderDetalhe(item: ItemSnapshot, meta: SnapshotMeta): void {
    const d = this.elemento("detalhe-item");
    d.innerHTML = "";

    const titulo = this.doc.createElement("div");
    titulo.className = "detalhe-nome";
    titulo.style.color = COR_RARIDADE[item.raridade] ?? "var(--texto)";
    titulo.textContent = `${ICONE_ESPACO[item.espaco] ?? ""} ${item.nome}`;
    d.appendChild(titulo);

    const sub = this.doc.createElement("div");
    sub.className = "detalhe-sub";
    const grupos = gruposAfins(item.classesAfins);
    sub.textContent = `${item.raridade} • ⚡${item.poder}`;
    if (grupos.length > 0) sub.textContent += ` • ${grupos.map((g) => NOME_GRUPO[g] ?? g).join("/")}`;
    d.appendChild(sub);

    // Ações de equipar PRIMEIRO — ação mais importante
    d.appendChild(this.acoesItem(item, meta));

    if (item.atributos.length > 0) {
      const ul = this.doc.createElement("ul");
      ul.className = "detalhe-atributos";
      for (const a of item.atributos) {
        const li = this.doc.createElement("li");
        li.textContent = formatarAtributo(a.chave, a.valor);
        ul.appendChild(li);
      }
      d.appendChild(ul);
    }
  }

  private acoesItem(item: ItemSnapshot, meta: SnapshotMeta): HTMLElement {
    const raiz = this.doc.createElement("div");
    raiz.className = "detalhe-acoes";

    const cabecalho = this.doc.createElement("div");
    cabecalho.className = "detalhe-equip-titulo";
    cabecalho.textContent = "Equipar em:";
    raiz.appendChild(cabecalho);

    const heroisOrdenados = meta.herois
      .map((h, slot) => ({ h, slot }))
      .filter(({ h }) => !!h)
      .sort((a, b) => {
        const aA = item.classesAfins.includes(a.h!.idClasse) ? 0 : 1;
        const bA = item.classesAfins.includes(b.h!.idClasse) ? 0 : 1;
        return aA - bA;
      })
      // Quando o filtro de classe está ativo, mostrar só heróis compatíveis com o item.
      // Itens universais (sem restrição) aparecem para todos os heróis.
      .filter(({ h }) => {
        if (!h) return false;
        if (item.classesAfins.length === 0) return true;
        return item.classesAfins.includes(h.idClasse);
      });

    for (const { h, slot } of heroisOrdenados) {
      if (!h) continue;
      const afim = item.classesAfins.length === 0 || item.classesAfins.includes(h.idClasse);
      const atualNoSlot = meta.inventario.find(
        (i) => i.equipadoPorSlot === slot && i.espaco === item.espaco,
      );

      const card = this.doc.createElement("div");
      card.className = "equip-card" + (afim ? " equip-afim" : "");

      const info = this.doc.createElement("div");
      info.className = "equip-card-info";

      const nomeEl = this.doc.createElement("span");
      nomeEl.className = "equip-heroi-nome";
      nomeEl.textContent = (afim ? "★ " : "") + nomeCurto(h.nome);
      info.appendChild(nomeEl);

      const atualEl = this.doc.createElement("span");
      atualEl.className = "equip-slot-atual";
      if (atualNoSlot) {
        atualEl.textContent = `${nomeCurto(atualNoSlot.nome)} ⚡${atualNoSlot.poder}`;
        const diff = item.poder - atualNoSlot.poder;
        if (diff !== 0) {
          const s = this.doc.createElement("span");
          s.className = diff > 0 ? "equip-diff-pos" : "equip-diff-neg";
          s.textContent = ` (${diff > 0 ? "+" : ""}${diff})`;
          atualEl.appendChild(s);
        }
      } else {
        atualEl.textContent = "— vazio";
      }
      info.appendChild(atualEl);

      const btn = this.doc.createElement("button");
      btn.className = "btn-equipar" + (afim ? " btn-equipar-afim" : "");
      btn.textContent = "Equipar";
      btn.onclick = () => window.jogo.enviarIntencao({ tipo: "equiparItem", uid: item.uid, slotHeroi: slot });

      card.appendChild(info);
      card.appendChild(btn);
      raiz.appendChild(card);
    }

    const btnVender = this.doc.createElement("button");
    btnVender.className = "btn-vender-item";
    btnVender.textContent = "🗑 Vender";
    btnVender.onclick = () => window.jogo.enviarIntencao({ tipo: "venderItem", uid: item.uid });
    raiz.appendChild(btnVender);

    return raiz;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PARTY (modal central)
  // ─────────────────────────────────────────────────────────────────────────

  private renderParty(meta: SnapshotMeta): void {
    const lista = this.elemento("lista-party");
    lista.innerHTML = "";
    for (let slot = 0; slot < meta.slotsDesbloqueados; slot++) lista.appendChild(this.cartaoParty(slot, meta));
    if (meta.custoProximoSlot !== null) {
      lista.appendChild(this.botaoLinha(`➕ Abrir novo slot (${meta.custoProximoSlot} 🪙)`, () =>
        window.jogo.enviarIntencao({ tipo: "desbloquearSlotParty" })));
    }
    this.renderSeletor(meta);
  }

  private cartaoParty(slot: number, meta: SnapshotMeta): HTMLElement {
    const heroi = meta.herois[slot] ?? null;
    const cartao = this.doc.createElement("div");
    cartao.className = "cartao-party";
    if (heroi && !heroi.vivo) cartao.classList.add("heroi-morto");
    const canvas = this.doc.createElement("canvas");
    canvas.width = 48; canvas.height = 54;
    if (heroi) this.desenharPreview(canvas, `heroi:${heroi.idClasse}`, 3);
    cartao.appendChild(canvas);
    const info = this.doc.createElement("div");
    info.className = "party-info";
    if (!heroi) {
      info.innerHTML = `<div class="nome">Slot ${slot + 1}</div><div class="vazio-slot">— vazio —</div>`;
      info.appendChild(this.seletorClasse(slot, meta));
    } else {
      const badgeMorto = heroi.vivo ? "" : `<span class="badge-morto">☠ Morto</span>`;
      info.innerHTML = `
        <div class="nome">${heroi.nome}${badgeMorto}</div>
        <div class="linha"><span>Nível ${heroi.nivel}</span><span>DPS ${heroi.danoPorSegundo}</span></div>`;
      info.appendChild(this.paperdoll(slot, meta));
      info.appendChild(this.controlesFormacao(slot, heroi));
      info.appendChild(this.seletorClasse(slot, meta));
    }
    cartao.appendChild(info);
    return cartao;
  }

  private paperdoll(slot: number, meta: SnapshotMeta): HTMLElement {
    const equipados = new Map<EspacoEquipamento, ItemSnapshot>();
    for (const item of meta.inventario) {
      if (item.equipadoPorSlot === slot) equipados.set(item.espaco, item);
    }
    const caixa = this.doc.createElement("div");
    caixa.className = "paperdoll";
    for (const espaco of ESPACOS) {
      const item = equipados.get(espaco);
      const cel = this.doc.createElement("div");
      cel.className = "slot-equip" + (item ? " preenchido" : "");
      cel.title = item ? `${item.nome} (clique p/ desequipar)` : espaco;
      const iconeSlot = item
        ? (ICONE_ITEM[item.idDef] ?? ICONE_ESPACO[espaco])
        : ICONE_ESPACO[espaco];
      cel.innerHTML = item
        ? `<span>${iconeSlot}</span>`
        : `<span style="opacity:.3">${iconeSlot}</span>`;
      if (item) {
        cel.style.borderColor = COR_RARIDADE[item.raridade] ?? "var(--borda)";
        cel.onclick = () => window.jogo.enviarIntencao({ tipo: "desequipar", slotHeroi: slot, espaco });
      }
      caixa.appendChild(cel);
    }
    return caixa;
  }

  private controlesFormacao(slot: number, heroi: HeroiMetaSnapshot): HTMLElement {
    const caixa = this.doc.createElement("div");
    caixa.className = "formacao";
    const rotulo = this.doc.createElement("span");
    rotulo.style.color = "var(--texto-fraco)";
    if (heroi.idClasse === "cavaleiro") {
      rotulo.textContent = "Formação: Frente (fixo)";
      caixa.appendChild(rotulo);
      return caixa;
    }
    rotulo.textContent = "Formação:";
    caixa.appendChild(rotulo);
    for (const pos of ["frente", "tras"] as PosicaoFormacao[]) {
      const b = this.doc.createElement("button");
      b.textContent = pos === "frente" ? "Frente" : "Trás";
      b.disabled = pos === heroi.posicao;
      b.onclick = () => window.jogo.enviarIntencao({ tipo: "definirFormacao", slotHeroi: slot, posicao: pos });
      caixa.appendChild(b);
    }
    return caixa;
  }

  private seletorClasse(slot: number, meta: SnapshotMeta): HTMLSelectElement {
    const sel = this.doc.createElement("select");
    sel.className = "trocar-heroi";
    sel.appendChild(this.opcao("", "↻ trocar herói…"));
    for (const c of meta.classes) sel.appendChild(this.opcao(c.idClasse, `${c.nome}`));
    sel.onchange = () => {
      if (!sel.value) return;
      window.jogo.enviarIntencao({ tipo: "definirHeroiNoSlot", slotHeroi: slot, idClasse: sel.value as IdClasse });
    };
    return sel;
  }

  private renderSeletor(meta: SnapshotMeta): void {
    const grade = this.elemento("seletor-herois");
    grade.innerHTML = "";
    for (const c of meta.classes) grade.appendChild(this.cartaHeroi(c, meta));
  }

  private cartaHeroi(c: ClasseDisponivel, meta: SnapshotMeta): HTMLElement {
    const carta = this.doc.createElement("div");
    carta.className = "carta-heroi" + (c.emUso ? " em-uso" : "");
    const canvas = this.doc.createElement("canvas");
    canvas.width = 46; canvas.height = 52;
    this.desenharPreview(canvas, c.spriteId, 3);
    carta.appendChild(canvas);
    const info = this.doc.createElement("div");
    info.innerHTML = `
      <div class="nome">${nomeCurto(c.nome)}</div>
      <div class="papel">${c.papel}</div>
      <div class="stats">❤${c.vida} ⚔${c.ataque} 🛡${c.defesa}</div>`;
    carta.appendChild(info);
    carta.onclick = () => {
      const slot = this.primeiroSlotLivre(meta);
      window.jogo.enviarIntencao({ tipo: "definirHeroiNoSlot", slotHeroi: slot, idClasse: c.idClasse });
    };
    return carta;
  }

  private primeiroSlotLivre(meta: SnapshotMeta): number {
    for (let s = 0; s < meta.slotsDesbloqueados; s++) if (!meta.herois[s]) return s;
    return 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATUS (modal central)
  // ─────────────────────────────────────────────────────────────────────────

  private renderStatus(meta: SnapshotMeta): void {
    const heroisValidos = meta.herois.filter((h): h is HeroiMetaSnapshot => h !== null);
    if (heroisValidos.length === 0) return;

    // Abas
    const abasEl = this.elemento("abas-status");
    abasEl.innerHTML = "";
    heroisValidos.forEach((h, i) => {
      const b = this.doc.createElement("button");
      b.className = "aba-status-btn" + (i === this.abaStatusAtiva ? " ativa" : "");
      b.textContent = nomeCurto(h.nome);
      b.onclick = () => { this.abaStatusAtiva = i; this.renderStatus(meta); };
      abasEl.appendChild(b);
    });

    const heroi = heroisValidos[this.abaStatusAtiva] ?? heroisValidos[0]!;
    const conteudo = this.elemento("conteudo-status");
    conteudo.innerHTML = "";

    // Layout: sprite + dados
    const container = this.doc.createElement("div");
    container.className = "status-heroi";

    // Sprite
    const spriteDiv = this.doc.createElement("div");
    spriteDiv.className = "status-sprite";
    const canvas = this.doc.createElement("canvas");
    canvas.width = 64; canvas.height = 72;
    this.desenharPreview(canvas, `heroi:${heroi.idClasse}`, 4);
    spriteDiv.appendChild(canvas);
    container.appendChild(spriteDiv);

    // Dados
    const dados = this.doc.createElement("div");
    dados.className = "status-dados";
    dados.innerHTML = `<div class="status-nome">${heroi.nome}</div>`;
    const nivel = this.doc.createElement("div");
    nivel.style.fontSize = "11px";
    nivel.style.color = "var(--texto-fraco)";
    nivel.style.marginBottom = "4px";
    const pctExp = heroi.xpProximo > 0 ? heroi.xp / heroi.xpProximo : 1;
    nivel.textContent = `Nível ${heroi.nivel} — EXP ${heroi.xp}/${heroi.xpProximo}`;
    dados.appendChild(nivel);
    const barraExp = this.doc.createElement("div");
    barraExp.className = "status-barra-exp";
    barraExp.innerHTML = `<div class="status-barra-exp-fill" style="width:${Math.round(pctExp * 100)}%"></div>`;
    dados.appendChild(barraExp);

    const stats: [string, string][] = [
      ["HP", `${Math.round(heroi.vidaAtual)} / ${Math.round(heroi.vidaMaxima)}`],
      ["Ataque", String(Math.round(heroi.ataque))],
      ["Defesa", String(Math.round(heroi.defesa))],
      ["DPS", String(heroi.danoPorSegundo)],
      ["Vel. Ataque", `${heroi.velocidadeAtaque.toFixed(2)}/s`],
      ["Crítico", `${(heroi.chanceCritico * 100).toFixed(1)}%`],
      ["Dano Crítico", `×${heroi.multiplicadorCritico.toFixed(2)}`],
      ["Elemento", heroi.elemento],
    ];
    for (const [rot, val] of stats) {
      const linha = this.doc.createElement("div");
      linha.className = "status-linha";
      linha.innerHTML = `<span class="rotulo">${rot}</span><span class="valor">${val}</span>`;
      dados.appendChild(linha);
    }

    // Habilidades
    if (heroi.habilidades.length > 0) {
      const secHab = this.doc.createElement("div");
      secHab.className = "status-habilidades secao-titulo";
      secHab.textContent = "Habilidades";
      dados.appendChild(secHab);
      for (const hab of heroi.habilidades) {
        const card = this.doc.createElement("div");
        card.className = "habilidade-card";
        card.innerHTML = `<div><div class="habil-nome">${hab.nome}</div><div class="habil-tipo">${hab.tipo}</div></div><div class="habil-cd">CD ${hab.cooldownSeg.toFixed(1)}s</div>`;
        dados.appendChild(card);
      }
    }
    container.appendChild(dados);
    conteudo.appendChild(container);

    // Paperdoll de itens equipados
    const secEquip = this.doc.createElement("div");
    secEquip.className = "secao-titulo";
    secEquip.style.marginTop = "10px";
    secEquip.textContent = "Equipamento";
    conteudo.appendChild(secEquip);
    conteudo.appendChild(this.paperdoll(heroi.slot, meta));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PORTAL (painel lateral direito)
  // ─────────────────────────────────────────────────────────────────────────

  private renderPortal(meta: SnapshotMeta): void {
    // Abas de ato
    const abasEl = this.elemento("abas-ato");
    abasEl.innerHTML = "";
    for (const ato of [1, 2, 3] as const) {
      const b = this.doc.createElement("button");
      b.className = "aba-ato" + (this.atoAtivo === ato ? " ativa" : "");
      b.textContent = `Ato ${ato}`;
      b.disabled = ato > 1; // Atos II e III ainda bloqueados
      b.onclick = () => { this.atoAtivo = ato; this.renderPortal(meta); };
      abasEl.appendChild(b);
    }

    const mapa = this.elemento("mapa-nos");
    mapa.innerHTML = "";
    const fazesDoCato = meta.mapas.filter((m) => m.ato === this.atoAtivo);
    fazesDoCato.forEach((m, i) => mapa.appendChild(this.noFase(m, i)));

    if (this.atoAtivo > 1) {
      const aviso = this.doc.createElement("div");
      aviso.className = "act-aviso";
      aviso.textContent = `Ato ${this.atoAtivo} — em breve`;
      mapa.appendChild(aviso);
    }
  }

  private noFase(m: MapaInfo, indice: number): HTMLElement {
    const no = this.doc.createElement("div");
    no.className = "no-fase" + (m.limpa ? " limpa" : "") + (m.atual ? " atual" : "") + (!m.desbloqueada ? " bloqueada" : "");
    const bolha = m.limpa ? "✓" : !m.desbloqueada ? "🔒" : String(indice + 1);
    const estado = m.atual ? "▶ jogando" : m.limpa ? "concluída" : m.desbloqueada ? "liberada" : "bloqueada";
    no.innerHTML = `
      <div class="no-bolha">${bolha}</div>
      <div class="no-info"><div class="nome">${m.nome}</div><div class="estado">${estado}</div></div>`;
    if (m.desbloqueada && !m.atual) {
      no.appendChild(this.botao("Jogar", () => window.jogo.enviarIntencao({ tipo: "trocarFase", idFase: m.id })));
    } else if (m.atual) {
      const span = this.doc.createElement("span");
      span.textContent = "Atual";
      span.style.color = "#6e4f1d";
      no.appendChild(span);
    }
    return no;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIGURAÇÕES (modal central)
  // ─────────────────────────────────────────────────────────────────────────

  private renderConfig(meta: SnapshotMeta): void {
    const conteudo = this.elemento("conteudo-config");
    if (conteudo.children.length > 0) return; // renderiza só na 1a vez; atualiza via eventos
    conteudo.innerHTML = "";

    // Seção: Velocidade
    const secVel = this.doc.createElement("div");
    secVel.className = "config-secao";
    secVel.innerHTML = `<div class="config-secao-titulo">Velocidade do Jogo</div>`;
    const velBotoes = this.doc.createElement("div");
    velBotoes.className = "vel-botoes";
    for (const vel of [1, 2, 3] as const) {
      const b = this.doc.createElement("button");
      b.textContent = `${vel}×`;
      b.className = meta.velocidade === vel ? "ativo" : "";
      b.onclick = () => {
        window.jogo.enviarIntencao({ tipo: "definirVelocidade", velocidade: vel });
        velBotoes.querySelectorAll("button").forEach((btn, i) => btn.className = i + 1 === vel ? "ativo" : "");
      };
      velBotoes.appendChild(b);
    }
    secVel.appendChild(velBotoes);
    conteudo.appendChild(secVel);

    // Seção: Modo offline
    const secOff = this.doc.createElement("div");
    secOff.className = "config-secao";
    secOff.innerHTML = `<div class="config-secao-titulo">Modo Offline</div>`;
    const linhaOff = this.doc.createElement("div");
    linhaOff.className = "config-linha";
    linhaOff.innerHTML = `<span class="rotulo">Tempo máximo offline:</span>`;
    const sel = this.doc.createElement("select");
    const opcoes: [number, string][] = [[0.25, "15 min"], [0.5, "30 min"], [1, "1 hora"], [2, "2 horas (máx)"]];
    for (const [val, label] of opcoes) {
      const o = this.opcao(String(val), label);
      if (Math.abs(val - meta.tetoOfflineHoras) < 0.01) o.selected = true;
      sel.appendChild(o);
    }
    const preview = this.doc.createElement("div");
    preview.className = "config-preview";

    const atualizarPreview = (horas: number) => {
      window.jogo.enviarIntencao({ tipo: "definirTetoOffline", horas });
      // Preview aproximado (estimativa local simples)
      preview.textContent = `Em ${sel.options[sel.selectedIndex]?.text ?? ""}, você ganhará ouro e XP de acordo com sua party atual.`;
    };
    sel.onchange = () => atualizarPreview(Number(sel.value));
    atualizarPreview(meta.tetoOfflineHoras);

    linhaOff.appendChild(sel);
    secOff.appendChild(linhaOff);
    secOff.appendChild(preview);
    conteudo.appendChild(secOff);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Preview de sprite
  // ─────────────────────────────────────────────────────────────────────────

  private desenharPreview(canvas: HTMLCanvasElement, spriteId: string, escala: number): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenharSprite(ctx, obterSprite(spriteId), "parado", 0, canvas.width / 2, canvas.height - 3, escala);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Configuração de painéis laterais e botões
  // ─────────────────────────────────────────────────────────────────────────

  private configurarPaineis(): void {
    this.doc.querySelectorAll<HTMLButtonElement>(".fechar-painel").forEach((botao) => {
      botao.onclick = () => {
        const idPainel = botao.dataset.fecharPainel!;
        const lado = botao.dataset.lado as "esquerda" | "direita";
        this.elemento(idPainel).classList.add("oculto");
        window.jogo.enviarIntencao({ tipo: "encolherJanela", lado });
      };
    });
  }

  private abrirPainel(_idPainel: string, lado: "esquerda" | "direita", largura: number): void {
    // Painéis abrem em janelas Electron separadas; o toggle é gerenciado em main.ts.
    window.jogo.enviarIntencao({ tipo: "expandirJanela", lado, larguraPainel: largura });
  }

  private configurarBotoesCabecalho(): void {
    this.doc.getElementById("btn-mochila")!.onclick = () => this.abrirPainel("painel-mochila", "esquerda", 320);
    this.doc.getElementById("btn-portal")!.onclick = () => this.abrirPainel("painel-portal", "direita", 260);
    this.doc.getElementById("btn-status")!.onclick = () => this.elemento("modal-status").classList.remove("oculto");
    this.doc.getElementById("btn-config")!.onclick = () => this.elemento("modal-config").classList.remove("oculto");
    this.doc.getElementById("btn-minimizar")!.onclick = () => window.jogo.enviarIntencao({ tipo: "minimizar" });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tooltip de comparação (hover sobre item na grade)
  // ─────────────────────────────────────────────────────────────────────────

  private mostrarTooltipComparacao(item: ItemSnapshot, meta: SnapshotMeta, ancora: HTMLElement): void {
    this.ocultarTooltip();

    const tt = this.doc.createElement("div");
    tt.className = "tooltip-comparacao";

    // Cabeçalho do item
    const header = this.doc.createElement("div");
    header.className = "tooltip-header";
    header.style.color = COR_RARIDADE[item.raridade] ?? "var(--texto)";
    const icone = ICONE_ITEM[item.idDef] ?? ICONE_ESPACO[item.espaco] ?? "❔";
    header.innerHTML = `<span>${icone} ${item.nome}</span><span class="tooltip-poder">⚡${item.poder}</span>`;
    tt.appendChild(header);

    const sub = this.doc.createElement("div");
    sub.className = "tooltip-sub";
    const grupos = gruposAfins(item.classesAfins);
    sub.textContent = `${item.raridade} • ${item.espaco}${grupos.length > 0 ? ` • ${grupos.map((g) => NOME_GRUPO[g] ?? g).join("/")}` : ""}`;
    tt.appendChild(sub);

    // Comparação por herói (afins primeiro)
    const heroisOrdenados = meta.herois
      .map((h, slot) => ({ h, slot }))
      .filter(({ h }) => !!h)
      .sort((a, b) => {
        const aA = item.classesAfins.includes(a.h!.idClasse) ? 0 : 1;
        const bA = item.classesAfins.includes(b.h!.idClasse) ? 0 : 1;
        return aA - bA;
      });

    for (const { h, slot } of heroisOrdenados) {
      if (!h) continue;
      const afim = item.classesAfins.length === 0 || item.classesAfins.includes(h.idClasse);
      const atual = meta.inventario.find((i) => i.equipadoPorSlot === slot && i.espaco === item.espaco);

      const secao = this.doc.createElement("div");
      secao.className = "tooltip-secao" + (afim ? " tooltip-afim" : "");

      const titulo = this.doc.createElement("div");
      titulo.className = "tooltip-secao-titulo";
      titulo.textContent = `${afim ? "★ " : ""}${nomeCurto(h.nome)}`;
      secao.appendChild(titulo);

      if (atual) {
        const atualIcone = ICONE_ITEM[atual.idDef] ?? ICONE_ESPACO[atual.espaco] ?? "";
        const atualInfo = this.doc.createElement("div");
        atualInfo.className = "tooltip-atual";
        atualInfo.textContent = `Atual: ${atualIcone} ${nomeCurto(atual.nome)} ⚡${atual.poder}`;
        secao.appendChild(atualInfo);

        // Diferença de poder
        const diffPoder = item.poder - atual.poder;
        const linhaPoder = this.doc.createElement("div");
        linhaPoder.className = "tooltip-stat " + (diffPoder >= 0 ? "stat-pos" : "stat-neg");
        linhaPoder.textContent = `Poder: ${diffPoder >= 0 ? "+" : ""}${diffPoder}`;
        secao.appendChild(linhaPoder);

        // Diferença de atributos individuais
        const mapaNovo = new Map(item.atributos.map((a) => [a.chave, a.valor]));
        const mapaAtual = new Map(atual.atributos.map((a) => [a.chave, a.valor]));
        const todasChaves = new Set([...mapaNovo.keys(), ...mapaAtual.keys()]);
        for (const chave of todasChaves) {
          const vNovo = mapaNovo.get(chave) ?? 0;
          const vAtual = mapaAtual.get(chave) ?? 0;
          const diff = vNovo - vAtual;
          if (Math.abs(diff) < 0.0001) continue;
          const linha = this.doc.createElement("div");
          linha.className = "tooltip-stat " + (diff > 0 ? "stat-pos" : "stat-neg");
          linha.textContent = formatarAtributo(chave, diff).replace(/^\+/, diff > 0 ? "+" : "");
          secao.appendChild(linha);
        }
      } else {
        const vazio = this.doc.createElement("div");
        vazio.className = "tooltip-stat stat-pos";
        vazio.textContent = "Slot vazio — novo equipamento";
        secao.appendChild(vazio);
      }
      tt.appendChild(secao);
    }

    // Posicionamento síncrono: visibility:hidden evita flash, offsetWidth força layout
    tt.style.visibility = "hidden";
    this.doc.body.appendChild(tt);
    this.tooltipEl = tt;

    const rect = ancora.getBoundingClientRect();
    const tw = tt.offsetWidth || 220;
    const th = tt.offsetHeight || 200;
    let left = rect.right + 8;
    let top = rect.top;
    if (left + tw > window.innerWidth) left = rect.left - tw - 8;
    if (top + th > window.innerHeight) top = window.innerHeight - th - 8;
    tt.style.left = `${Math.max(4, left)}px`;
    tt.style.top = `${Math.max(4, top)}px`;
    tt.style.visibility = "visible";
  }

  private ocultarTooltip(): void {
    this.tooltipEl?.remove();
    this.tooltipEl = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Infraestrutura
  // ─────────────────────────────────────────────────────────────────────────

  private configurarSplash(): void {
    this.elemento("btn-jogar").onclick = () => this.elemento("splash").classList.add("oculto");
    this.elemento("btn-sair-splash").onclick = () => window.jogo.enviarIntencao({ tipo: "sair" });
  }

  private configurarSair(): void {
    this.elemento("btn-sair").onclick = () => window.jogo.enviarIntencao({ tipo: "sair" });
  }

  private configurarModais(): void {
    this.doc.querySelectorAll<HTMLButtonElement>("[data-modal]").forEach((botao) => {
      botao.onclick = () => this.elemento(botao.dataset.modal!).classList.remove("oculto");
    });
    this.doc.querySelectorAll<HTMLButtonElement>("[data-fechar]").forEach((botao) => {
      botao.onclick = () => this.elemento(botao.dataset.fechar!).classList.add("oculto");
    });
    this.doc.querySelectorAll<HTMLElement>(".modal").forEach((modal) => {
      modal.onclick = (e) => { if (e.target === modal) modal.classList.add("oculto"); };
    });
    this.elemento("fechar-offline").onclick = () => this.elemento("modal-offline").classList.add("oculto");
    this.doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.doc.querySelectorAll(".modal").forEach((m) => m.classList.add("oculto"));
    });
  }

  private botao(rotulo: string, aoClicar: () => void): HTMLButtonElement {
    const b = this.doc.createElement("button");
    b.textContent = rotulo;
    b.onclick = aoClicar;
    return b;
  }

  private botaoLinha(rotulo: string, aoClicar: () => void): HTMLElement {
    const div = this.doc.createElement("div");
    div.style.margin = "6px 0";
    const b = this.botao(rotulo, aoClicar);
    b.className = "acao";
    div.appendChild(b);
    return div;
  }

  private opcao(valor: string, texto: string): HTMLOptionElement {
    const o = this.doc.createElement("option");
    o.value = valor; o.textContent = texto;
    return o;
  }

  private elemento(id: string): HTMLElement {
    const el = this.doc.getElementById(id);
    if (!el) throw new Error(`Elemento não encontrado: ${id}`);
    return el;
  }

  private texto(id: string, valor: string): void {
    this.elemento(id).textContent = valor;
  }
}
