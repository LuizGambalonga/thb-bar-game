# 012 — Arte / Pixel Art & Apresentação Visual

## Objetivo
Mostrar ao jogador imagens reais (não só cores): sprites de pixel art animados dos heróis e monstros, terreno/mapa, nomes e barras — e uma Mochila em popup com grade de slots, ícones e atributos.

## Requisitos (EARS)
- **R12.1** O sistema DEVE renderizar cada herói e monstro como **sprite de pixel art** (não um retângulo), com ≥1 frame e animação de movimento (bob/tremor/flash ao tomar dano).
- **R12.2** O sistema DEVE desenhar um **cenário/mapa** temático do Ato (Espaço do Usuário: grade, janelas de apps, chão em blocos, barra de tarefas).
- **R12.3** O sistema DEVE exibir o **nome** de cada combatente e sua barra de vida na arena.
- **R12.4** A **Mochila** DEVE abrir como **popup**, com grade de **slots** (quadradinhos), **ícone** por item, e ao selecionar um item, mostrar **nome, raridade, espaço, poder e todos os atributos** (quanto de ataque/vida/defesa etc.).
- **R12.5** No detalhe do item, o sistema DEVE permitir **Equipar** (por herói da party), **Desequipar** e **Vender**.
- **R12.6** Ao atacar, o combatente DEVE **avançar até o alvo** (investida), exibir **pose de ataque** e **recuar**; quem toma dano DEVE reagir (tremor). Heróis investem contra monstros e monstros investem contra os heróis.

## Critérios de Aceite
- Heróis/monstros aparecem como figuras reconhecíveis e se mexem; o fundo parece um mapa, não cores soltas.
- A mochila abre em popup; cada item mostra ícone + atributos completos; equipar reflete no DPS.

## Design
- `apresentacao/arte/sprites.ts`: pixel art **procedural** (grade de caracteres + paleta), desenhada no Canvas2D. Sem PNGs → build leve; trocável por arte real depois (basta substituir os sprites).
- `apresentacao/arte/cenario.ts`: desenho procedural do mapa do Ato I.
- `VisaoDeCombate`: cenário + sprites + animação (frame swap, bob, tremor/flash) + nomes + dano flutuante.
- `PainelInterface`: popup `modal-mochila` com `grade-itens` (slots) e `detalhe-item` (atributos + ações).
- Contrato estendido: `CombatenteSnapshot.spriteId/icone`, `ItemSnapshot.atributos`.

## Tarefas
- [x] T12.1 Sistema de sprites procedurais + render no Canvas2D.
- [x] T12.2 Sprites das 6 classes e dos 6 monstros do Ato I.
- [x] T12.3 Cenário/mapa do Ato I.
- [x] T12.4 Nomes + barras na arena; animação de movimento e dano.
- [x] T12.5 Mochila popup com grade, ícones, atributos e ações.
- [x] T12.6 Sprites maiores/detalhados (heróis 14×16 com sombreamento) + frames de ataque.
- [x] T12.7 Combate com movimentação: investida até o alvo, pose de ataque, recuo e tremor ao tomar dano.
- [x] T12.8 Projéteis visíveis com rastro (flecha/fogo/gelo) — dano só aplica no impacto; pose de tiro com recuo.
- [x] T12.9 Animação de morte (dissolução + partículas) e partículas de impacto.
- [ ] T12.10 (futuro) Sprite sheets PNG dedicados de alta resolução + frames de morte por monstro + projéteis dos monstros.

### Quais classes atiram (data-driven, `DefHeroi.projetil`)
Patrulheiro → flecha · Feiticeira → fogo · Caçador → gelo. Demais (Cavaleiro, Sacerdote, Carrasco) são corpo a corpo.

## Status: 🟢 Implementado (arte procedural detalhada, combate em movimento, projéteis e morte)
