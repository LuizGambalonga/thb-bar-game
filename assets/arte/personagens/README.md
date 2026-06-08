# Personagens — sprite-sheets

## Heróis (LIGADOS) — Calciumtrice, CC-BY 3.0

Arte pixel-art animada, vista lateral, coesa (um único autor), **gratuita para uso
comercial com atribuição**. Fonte: **Calciumtrice** — https://opengameart.org/users/calciumtrice

Cada folha é uma grade **10×10 de frames 32px**: linha = animação
(0 idle · 1 gesture · 2 walk · 3 attack · 4 death), macho linhas 0–4, fêmea 5–9.
Fatiamento configurado em `manifesto.json` (modo grade). Confirmado por
`scripts/verif-folha.mjs` (recorta os frames e gera um preview).

| Pasta | Folha | Origem | linhaBase |
|---|---|---|---|
| cavaleiro | warrior.png | Animated Warrior | 0 |
| carrasco | warrior.png | Animated Warrior | 5 |
| feiticeira | wizard.png | Animated Wizard | 5 |
| sacerdote | cleric.png | Animated Cleric | 0 |
| patrulheiro | ranger.png | Animated Ranger | 0 |
| cacador | rogue.png | Animated Rogue | 0 |

Páginas (CC-BY 3.0, crédito a Calciumtrice):
- Warrior: https://opengameart.org/content/animated-warrior
- Wizard:  https://opengameart.org/content/animated-wizard
- Cleric:  https://opengameart.org/content/animated-cleric
- Ranger:  https://opengameart.org/content/animated-ranger
- Rogue:   https://opengameart.org/content/animated-rogue

## Monstros (PENDENTE)
Seguem na arte SVG atual (fallback). Calciumtrice tem monstros coesos no mesmo
estilo — Skeleton, Slime, Rat & Bat, Snake, Goblins, Orcs, Minotaur — mas alguns
do bestiário (raposa, lobo, dragão, golem) não têm equivalente direto. Mapear é
o próximo passo (mesmo esquema: pasta `monstros/<id>/` + entrada no manifesto).

## Trocar de arte (drop-in)
O pipeline (`src/apresentacao/arte/folhasSprite.ts`) suporta dois modos:
- **grade** (`folha`+`colunas`+`linhas`+`linhaBase`, `linha` por animação) — usado aqui.
- **strip** (um PNG por animação, `arquivo` + `frames`) — para packs tipo LuizMelo;
  o tamanho do frame é auto-detectado da imagem.
Para trocar por outro pack, ajusta-se só o `manifesto.json` (sem tocar em código).

## CRÉDITO OBRIGATÓRIO (CC-BY 3.0)
Adicionar no jogo (tela Sobre/Créditos):
> Personagens: **Calciumtrice** (opengameart.org/users/calciumtrice) — CC-BY 3.0.
