# 009 — Save / Load & Integridade  `[MVP]`

## Objetivo
Save local versionado, escrita atômica, backup, migração e recuperação de corrupção.

## Requisitos (EARS)
- **R9.1** O sistema DEVE auto-salvar em intervalo fixo (60s) e em eventos-chave.
- **R9.2** O save DEVE ter `versaoEsquema` e migração automática.
- **R9.3** A escrita DEVE ser atômica (temp + rename) com ≥1 backup do último válido.
- **R9.4** SE o save principal está corrompido, ENTÃO o sistema DEVE carregar o backup e avisar.

## Critérios de Aceite
- Matar o processo durante o save não corrompe; versão nova migra save antigo sem perda.

## Design
- Interface `RepositorioDeSave` (DIP) + `RepositorioDeSaveArquivo` (fs atômico).
- `nucleo/save/migracoes.ts` (puro) aplicado em cadeia; validação antes/depois.

## Tarefas
- [ ] T9.1 Escrita atômica + backup + auto-save.
- [ ] T9.2 Migração por versão.
- [ ] T9.3 Fallback de corrupção.

## Status: 🟢 MVP implementado (escrita atômica + backup + migração + fallback)
