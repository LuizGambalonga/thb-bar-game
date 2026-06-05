// Empacotador único do projeto (esbuild). Mantém o build simples: `npm run build`.
import { build } from "esbuild";
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ehWatch = process.argv.includes("--watch");

const comum = {
  bundle: true,
  sourcemap: true,
  logLevel: "info",
  define: { "process.env.NODE_ENV": '"production"' },
};

async function empacotar() {
  // Processo principal (Electron main) — CommonJS, Node.
  await build({
    ...comum,
    entryPoints: [resolve(raiz, "src/principal/main.ts")],
    outfile: resolve(raiz, "dist/principal/main.js"),
    platform: "node",
    format: "cjs",
    target: "node20",
    external: ["electron"],
  });

  // Preload — CommonJS, Node, electron externo.
  await build({
    ...comum,
    entryPoints: [resolve(raiz, "src/principal/preload.ts")],
    outfile: resolve(raiz, "dist/principal/preload.js"),
    platform: "node",
    format: "cjs",
    target: "node20",
    external: ["electron"],
  });

  // Renderer (apresentação) — navegador.
  await build({
    ...comum,
    entryPoints: [resolve(raiz, "src/apresentacao/renderer.ts")],
    outfile: resolve(raiz, "dist/apresentacao/renderer.js"),
    platform: "browser",
    format: "esm",
    target: "chrome120",
  });

  // Copia HTML/CSS estáticos.
  mkdirSync(resolve(raiz, "dist/apresentacao"), { recursive: true });
  cpSync(resolve(raiz, "src/apresentacao/index.html"), resolve(raiz, "dist/apresentacao/index.html"));
  cpSync(resolve(raiz, "src/apresentacao/estilo.css"), resolve(raiz, "dist/apresentacao/estilo.css"));
  if (existsSync(resolve(raiz, "assets"))) {
    cpSync(resolve(raiz, "assets"), resolve(raiz, "dist/assets"), { recursive: true });
  }
  console.log("build concluido.");
}

empacotar().catch((erro) => {
  console.error(erro);
  process.exit(1);
});

if (ehWatch) console.log("(modo watch nao implementado: rode `npm run dev` novamente apos editar)");
