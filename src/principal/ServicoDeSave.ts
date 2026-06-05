// Persistência do save: escrita atômica, backup e migração (atende 009).
// Depende de abstração RepositorioDeSave; implementação concreta usa o sistema de arquivos.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import type { JogoSalvo } from "../nucleo/save/JogoSalvo.js";
import { migrarSave, saveValido } from "../nucleo/save/JogoSalvo.js";

export interface RepositorioDeSave {
  carregar(): JogoSalvo | null;
  salvar(jogo: JogoSalvo): void;
}

export class RepositorioDeSaveArquivo implements RepositorioDeSave {
  private readonly caminho: string;
  private readonly caminhoBackup: string;
  private readonly caminhoTmp: string;

  constructor(diretorioDados: string) {
    mkdirSync(diretorioDados, { recursive: true });
    this.caminho = join(diretorioDados, "save.json");
    this.caminhoBackup = join(diretorioDados, "save.bak.json");
    this.caminhoTmp = join(diretorioDados, "save.tmp.json");
  }

  carregar(): JogoSalvo | null {
    const principal = this.tentarLer(this.caminho);
    if (principal) return principal;
    const backup = this.tentarLer(this.caminhoBackup);
    if (backup) {
      console.warn("Save principal corrompido; carregando backup.");
      return backup;
    }
    return null;
  }

  salvar(jogo: JogoSalvo): void {
    const conteudo = JSON.stringify(jogo);
    // Escrita atômica: grava no temporário e renomeia.
    writeFileSync(this.caminhoTmp, conteudo, "utf-8");
    if (existsSync(this.caminho)) {
      copyFileSync(this.caminho, this.caminhoBackup);
    }
    renameSync(this.caminhoTmp, this.caminho);
  }

  private tentarLer(caminho: string): JogoSalvo | null {
    try {
      if (!existsSync(caminho)) return null;
      const bruto = JSON.parse(readFileSync(caminho, "utf-8"));
      if (!saveValido(bruto)) return null;
      return migrarSave(bruto);
    } catch {
      return null;
    }
  }
}
