# 003 — Heróis, Party & Formação

## Objetivo
Até 3 heróis, 6 classes desbloqueáveis, formação frente/trás, nível e XP por herói.

## Requisitos (EARS)
- **R3.1** O sistema DEVE permitir party de até 3 (começa com 1 slot; 2º/3º via runas).
- **R3.2** O sistema DEVE iniciar com Cavaleiro; as outras 5 classes DEVEM ser desbloqueáveis in-game.
- **R3.3** O sistema DEVE permitir formação (frente/trás) afetando alvo e skills.
- **R3.4** Cada herói DEVE ter nível e ganhar XP escalando stats.

## Critérios de Aceite
- Trocar formação muda quem toma dano; subir nível aumenta stats conforme fórmula.

## Design
- `conteudo/herois.ts`: as 6 `DefHeroi` (Cavaleiro, Patrulheiro, Feiticeira, Sacerdote, Caçador, Carrasco).
- `nucleo/dominio/Heroi.ts` + `Party.ts`. Habilidades data-driven com cooldown e alvo.
- Desbloqueio por ouro/marco (intenção `desbloquearHeroi`).

## Tarefas
- [x] T3.1 Defs das 6 classes + habilidades.
- [x] T3.2 Desbloqueio por ouro (classes via `desbloquearHeroi`; slots via `desbloquearSlotParty`).
- [x] T3.3 Multi-slot + formação no targeting (frente/trás).
- [x] T3.4 XP/level up persistido.
- [x] T3.5 Habilidades no motor: dano single/AoE, cura (menorVidaAliado) e buff de ataque.

## Status: 🟢 Fase 5 concluída — party de até 3, 6 classes desbloqueáveis, formação e habilidades
### Nota de design
Slots de party são desbloqueados por ouro (`CUSTO_SLOT_PARTY`: 1500 e 6000) como mecanismo interino;
a Árvore de Inicialização (feat. 006) também concederá slots quando implementada.
