# 028 — Monstros com sprite-sheets (PENDENTE)

Status: **pendente**. Heróis já usam sprite-sheets (spec 027). Monstros seguem na
arte SVG atual (fallback). Esta spec guarda a pesquisa pronta para retomar rápido.

## Objetivo
Ligar os monstros ao mesmo pipeline de sprite-sheets dos heróis (Calciumtrice,
OpenGameArt, **CC-BY 3.0**), mantendo coesão visual com a party.

## Como ligar (pipeline já suporta)
`src/apresentacao/arte/folhasSprite.ts` já tem o modo **grade** e o renderer já
resolve `monstro:<id>` → personagem `monstros/<id>`. Basta:
1. Baixar as PNGs para `assets/arte/personagens/monstros/<id>/` (download direto via
   curl funciona — URLs abaixo). **Atenção:** o `cd` do bash reseta para `C:\THB`
   entre chamadas; criar a pasta `monstros/` antes e usar caminhos absolutos.
2. Adicionar entradas `"monstros/<id>"` no `assets/arte/personagens/manifesto.json`
   (modo grade, com os layouts medidos abaixo).
3. `npm run build` e validar com `scripts/verif-folha.mjs` (adaptar para monstros).

Ordem de linhas padrão Calciumtrice: 0 idle · 1 gesture · 2 walk · 3 attack · 4 death.
Mapear no jogo: parado←0, conjurar←1, andar←2, atacar←3, morrer←4.

## Mapa bestiário → sheet (CC-BY 3.0, crédito Calciumtrice)

| Monstro (id) | Sheet | URL direta |
|---|---|---|
| grub-binario | Slime | `https://opengameart.org/sites/default/files/slime%20spritesheet%20calciumtrice_0.png` |
| espectro-zumbi | Skeleton | `https://opengameart.org/sites/default/files/skeleton%20spritesheet%20calciumtrice.png` |
| morcego-viral | Bat (rat&bat) | `https://opengameart.org/sites/default/files/rat%20and%20bat%20spritesheet%20calciumtrice.png` |
| raposa-neon | Rat (rat&bat) | (mesmo arquivo do morcego) |
| verme-abismo | Snake | `https://opengameart.org/sites/default/files/snake%20spritesheet%20calciumtrice.png` |
| golem-hardware | Statue | `https://opengameart.org/sites/default/files/statue%20spritesheet.png` |
| leviata-dados | Minotaur (boss) | `https://opengameart.org/sites/default/files/minotaur%20spritesheet%20calciumtrice.png` |
| lobo-corrompido | Orc (boss) | `https://opengameart.org/sites/default/files/orc%20spritesheet%20calciumtrice.png` |

## Layouts medidos (por `scripts/analisar-folha.mjs`)

| Sheet | PNG | grade (col×lin) | frame | observação |
|---|---|---|---|---|
| slime | 320×640 | 10×20 | 32×32 | 4 cores × 5 anims; usar cor 0 (linhas 0–4) |
| skeleton | 320×160 | 10×5 | 32×32 | 5 anims, 10 frames cada |
| snake | 320×160 | 10×5 | 32×32 | 5 anims, 10 frames cada |
| rat&bat | 320×320 | 10×10 | 32×32 | rat linhas 0–4, bat linhas 5–9 |
| orc | 320×320 | 10×10 | 32×32 | orc lança linhas 0–4, orc rogue 5–9 |
| minotaur | 480×240 | 10×5 | **48×48** | boss; 5 anims, 10 frames cada |
| statue | 512×256 | 16×4 | **32×64** | só 4 anims; frames/linha: 0 turning=8, 1 walk=16, 2 attack=10, 3 crumble=12. Mapear: parado/conjurar←0(turning), andar←1, atacar←2, morrer←3 |

Notas:
- **statue** não tem idle/gesture separados: a linha 0 ("turning") serve de parado.
  Sem linha de conjuração (monstros não conjuram, ok).
- **minotaur** usa frame 48×48 (não 32) — o pipeline lida via `colunas`/`linhas`
  (deriva o tamanho do frame da imagem); só configurar `colunas:10, linhas:5`.
- `scripts/analisar-folha.mjs` precisa aceitar frame não-quadrado (largura≠altura)
  para medir statue (32×64) — pequeno ajuste de 2 args (foi revertido no rollback).

## Fora de escopo
- Tela de Créditos dedicada (hoje a atribuição está no tooltip da arena). Recomendado
  adicionar antes de distribuir (CC-BY exige crédito visível no produto).
