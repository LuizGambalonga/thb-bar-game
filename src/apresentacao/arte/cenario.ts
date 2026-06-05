// Cenários por ato: paisagens de fantasia com parallax e elementos animados.

export function desenharCenario(
  ctx: CanvasRenderingContext2D,
  largura: number,
  _altura: number,
  groundY: number,
  tempo: number,
): void {
  desenharFundo(ctx, largura, groundY, tempo);
  desenharMontanhasLonginquas(ctx, largura, groundY, tempo);
  desenharArvoresDistantes(ctx, largura, groundY, tempo);
  desenharChao(ctx, largura, groundY);
  desenharElementosAnimados(ctx, largura, groundY, tempo);
}

function desenharFundo(
  ctx: CanvasRenderingContext2D,
  largura: number,
  groundY: number,
  tempo: number,
): void {
  // Céu com gradiente de pôr do sol/crepúsculo.
  const ceu = ctx.createLinearGradient(0, 0, 0, groundY);
  ceu.addColorStop(0, "#0d1b3e");
  ceu.addColorStop(0.4, "#1a2a5e");
  ceu.addColorStop(0.75, "#3d2a5e");
  ceu.addColorStop(1, "#6b3a4a");
  ctx.fillStyle = ceu;
  ctx.fillRect(0, 0, largura, groundY);

  // Estrelas piscando.
  ctx.fillStyle = "rgba(255,255,220,.8)";
  const estrelas = [
    [20, 12], [60, 8], [110, 18], [180, 6], [240, 14], [310, 9], [380, 16],
    [440, 7], [490, 11], [45, 30], [150, 25], [280, 22], [420, 28],
  ] as const;
  for (const [sx, sy] of estrelas) {
    const brilho = 0.4 + 0.6 * Math.abs(Math.sin(tempo * 0.04 + sx * 0.3));
    ctx.globalAlpha = brilho;
    ctx.fillRect(sx, sy, 1, 1);
  }
  ctx.globalAlpha = 1;

  // Lua.
  const lX = largura * 0.82;
  const lY = 22;
  ctx.fillStyle = "#f0e8c8";
  ctx.beginPath();
  ctx.arc(lX, lY, 12, 0, Math.PI * 2);
  ctx.fill();
  // Sombra da lua (meia-lua).
  ctx.fillStyle = "#2a3060";
  ctx.beginPath();
  ctx.arc(lX - 4, lY, 10, 0, Math.PI * 2);
  ctx.fill();
}

function desenharMontanhasLonginquas(
  ctx: CanvasRenderingContext2D,
  largura: number,
  groundY: number,
  tempo: number,
): void {
  const paralax = (tempo * 0.1) % largura;

  // Montanhas do fundo (mais escuras, mais distantes).
  ctx.fillStyle = "#1a1f42";
  const montanhasAtras: readonly (readonly [number, number])[] = [
    [0, 0.55], [0.08, 0.38], [0.18, 0.5], [0.28, 0.35], [0.38, 0.48],
    [0.5, 0.36], [0.6, 0.52], [0.72, 0.40], [0.82, 0.55], [0.92, 0.42], [1, 0.55],
  ];
  desenharSilhueta(ctx, montanhasAtras, largura, groundY, paralax * 0.3, 0.08);

  // Montanhas do meio (roxo escuro, castelo ao fundo).
  ctx.fillStyle = "#28184a";
  const montanhasMeio: readonly (readonly [number, number])[] = [
    [0, 0.62], [0.06, 0.45], [0.15, 0.58], [0.25, 0.42], [0.35, 0.60],
    [0.45, 0.44], [0.55, 0.62], [0.65, 0.46], [0.75, 0.58], [0.87, 0.44], [1, 0.62],
  ];
  desenharSilhueta(ctx, montanhasMeio, largura, groundY, paralax * 0.5, 0.1);

  // Castelo/ruína no horizonte.
  const cX = largura * 0.6 - (paralax * 0.4 % largura);
  const cBase = groundY * 0.62;
  ctx.fillStyle = "#1e1230";
  // Torre central.
  ctx.fillRect(cX - 6, cBase - 30, 12, 30);
  ctx.fillRect(cX - 8, cBase - 35, 16, 8);
  // Ameias.
  for (let i = 0; i < 4; i++) ctx.fillRect(cX - 8 + i * 5, cBase - 42, 3, 8);
  // Torres laterais.
  ctx.fillRect(cX - 22, cBase - 20, 8, 20);
  ctx.fillRect(cX + 14, cBase - 20, 8, 20);
  // Janela com luz fraca.
  ctx.fillStyle = "rgba(255,200,80,.15)";
  ctx.fillRect(cX - 2, cBase - 20, 4, 6);
}

function desenharSilhueta(
  ctx: CanvasRenderingContext2D,
  pontos: readonly (readonly [number, number])[],
  largura: number,
  groundY: number,
  deslocX: number,
  variacaoY: number,
): void {
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (const [xFrac, yFrac] of pontos) {
    const x = (xFrac * largura - deslocX + largura) % largura;
    const y = groundY * (yFrac + variacaoY * 0);
    if (xFrac === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(largura, groundY);
  ctx.closePath();
  ctx.fill();
}

function desenharArvoresDistantes(
  ctx: CanvasRenderingContext2D,
  largura: number,
  groundY: number,
  tempo: number,
): void {
  const paralax = (tempo * 0.8) % largura;

  // Camada de árvores escuras ao fundo.
  const posArvores = [0, 0.07, 0.15, 0.23, 0.32, 0.41, 0.5, 0.59, 0.68, 0.77, 0.86, 0.94];
  const alturas = [0.2, 0.28, 0.22, 0.32, 0.18, 0.26, 0.30, 0.20, 0.28, 0.24, 0.22, 0.30];

  ctx.fillStyle = "#1a1230";
  for (let i = 0; i < posArvores.length; i++) {
    const x = ((posArvores[i]! * largura - paralax * 0.6) % largura + largura) % largura;
    const h = groundY * alturas[i]!;
    const base = groundY - 2;
    desenharArvore(ctx, x, base, h);
  }

  // Camada de árvores da frente (mais detalhada).
  const posFrente = [0.04, 0.12, 0.20, 0.28, 0.37, 0.46, 0.54, 0.63, 0.72, 0.80, 0.90, 0.97];
  const alturasFrente = [0.35, 0.25, 0.38, 0.30, 0.35, 0.28, 0.40, 0.32, 0.36, 0.28, 0.38, 0.32];

  ctx.fillStyle = "#120e1e";
  for (let i = 0; i < posFrente.length; i++) {
    const x = ((posFrente[i]! * largura - paralax) % largura + largura) % largura;
    const h = groundY * alturasFrente[i]!;
    const base = groundY - 1;
    desenharArvore(ctx, x, base, h);
    // Tronco.
    ctx.fillRect(x - 2, base - h * 0.3, 4, h * 0.3);
  }
}

function desenharArvore(ctx: CanvasRenderingContext2D, x: number, base: number, h: number): void {
  // Triângulos empilhados para árvore conífera (pinheiro).
  const camadas = 3;
  for (let c = 0; c < camadas; c++) {
    const fY = c / camadas;
    const topoY = base - h + fY * h * 0.6;
    const baseCamadaY = base - h * (1 - fY) * 0.3 + h * fY * 0.4;
    const largCamada = (h * 0.4) * (1 - fY * 0.3);
    ctx.beginPath();
    ctx.moveTo(x, topoY);
    ctx.lineTo(x + largCamada, baseCamadaY);
    ctx.lineTo(x - largCamada, baseCamadaY);
    ctx.closePath();
    ctx.fill();
  }
}

function desenharChao(
  ctx: CanvasRenderingContext2D,
  largura: number,
  groundY: number,
): void {
  // Camada de grama escura.
  const gradChao = ctx.createLinearGradient(0, groundY, 0, groundY + 200);
  gradChao.addColorStop(0, "#1a2e16");
  gradChao.addColorStop(0.15, "#141e10");
  gradChao.addColorStop(1, "#0a0e08");
  ctx.fillStyle = gradChao;
  ctx.fillRect(0, groundY, largura, 200);

  // Linha de destaque do chão (borda clara).
  ctx.fillStyle = "#3a5c2a";
  ctx.fillRect(0, groundY, largura, 3);

  // Blocos de pedra no chão.
  ctx.fillStyle = "#16201a";
  for (let x = 0; x < largura; x += 20) {
    ctx.fillRect(x + 1, groundY + 4, 18, 8);
  }

  // Linha de mosaico.
  ctx.fillStyle = "#243a1e";
  for (let x = 0; x < largura; x += 10) {
    ctx.fillRect(x, groundY + 12, 9, 1);
  }

  // Névoa no chão.
  const nevoa = ctx.createLinearGradient(0, groundY - 8, 0, groundY + 20);
  nevoa.addColorStop(0, "rgba(80,160,100,0)");
  nevoa.addColorStop(0.5, "rgba(60,120,80,0.12)");
  nevoa.addColorStop(1, "rgba(40,80,60,0)");
  ctx.fillStyle = nevoa;
  ctx.fillRect(0, groundY - 8, largura, 28);
}

function desenharElementosAnimados(
  ctx: CanvasRenderingContext2D,
  largura: number,
  groundY: number,
  tempo: number,
): void {
  // Vagalumes/partículas flutuantes.
  const vagalumes = [
    { x: 0.1, fase: 0 }, { x: 0.25, fase: 1.2 }, { x: 0.45, fase: 2.4 },
    { x: 0.65, fase: 0.8 }, { x: 0.82, fase: 1.8 },
  ];
  for (const v of vagalumes) {
    const px = v.x * largura + Math.sin(tempo * 0.03 + v.fase) * 12;
    const py = groundY - 20 + Math.sin(tempo * 0.05 + v.fase * 1.3) * 8;
    const alpha = 0.4 + 0.6 * Math.abs(Math.sin(tempo * 0.08 + v.fase));
    ctx.fillStyle = `rgba(150,255,120,${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Brilho ao redor.
    const grad = ctx.createRadialGradient(px, py, 0, px, py, 6);
    grad.addColorStop(0, `rgba(150,255,120,${alpha * 0.3})`);
    grad.addColorStop(1, "rgba(150,255,120,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
