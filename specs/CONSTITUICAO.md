# Constituição do Projeto

Regras invioláveis. Mudá-las exige justificativa registrada aqui.

1. **Single-player sempre.** Sem rede, contas, trading ou loja real. Roda 100% offline. Todo conteúdo é desbloqueável jogando.
2. **Spec antes de código.** Toda feature começa por `specs/NNN-nome/spec.md`. Ordem: Spec → Design → Tasks → Código → Teste.
3. **Código em português.** Variáveis, classes, funções, arquivos e pastas em português (ver `CLAUDE.md`).
4. **SOLID + Clean Code.** Responsabilidade única, injeção de dependências, interfaces pequenas, sem números mágicos.
5. **Núcleo puro e determinístico.** `src/nucleo` não importa Electron/DOM/fs. Aleatoriedade só via `GeradorAleatorio` semeado. Sem `Math.random()`/`Date.now()` no núcleo.
6. **Autoridade no processo principal.** O estado de jogo vive no Electron *main* (roda o núcleo). O *renderer* só apresenta e envia intenções. Combate continua simulando com a janela oculta.
7. **Idle de respeito.** Combate 100% automático. Aberto = recompensa cheia (loot/baús). Fechado = só *suplemento* de XP/ouro com teto. Nunca premiar fechar o jogo.
8. **Save sagrado.** Local, versionado (`versaoEsquema`), migrável. Escrita atômica (temp + rename) + backup. Nunca corromper.
9. **Conteúdo data-driven.** Heróis, itens, monstros, fases, runas e receitas são dados validados, não código hardcoded.
10. **Desempenho idle-first.** Em idle docado: < 3% CPU, < 200 MB RAM. Tick fixo desacoplado do framerate. Render reduzido quando oculto.
11. **Build/run fáceis.** `npm install && npm run dev`. Dependências mínimas.
