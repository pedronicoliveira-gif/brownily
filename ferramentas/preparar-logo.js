/* Prepara a logo: tira o fundo preto de fora do adesivo, recorta nas bordas e salva logo.png (transparente).
   Uso: node ferramentas/preparar-logo.js logo-original/logo-fundo-preto.jpg
   Também mostra as cores principais da logo. */
const fs = require("fs");
const path = require("path");
const { abrirNavegador } = require("./navegador.js");
const RAIZ = path.join(__dirname, "..");

(async () => {
  const entrada = path.resolve(process.argv[2] || path.join(RAIZ, "logo-original", "logo-fundo-preto.jpg"));
  const mime = /\.png$/i.test(entrada) ? "image/png" : "image/jpeg";
  const b64 = fs.readFileSync(entrada).toString("base64");
  const b = await abrirNavegador();
  const p = await b.newPage();
  await p.setContent("<canvas id=c></canvas>");
  const r = await p.evaluate(async ({ b64, mime }) => {
    const img = new Image();
    await new Promise(ok => { img.onload = ok; img.src = `data:${mime};base64,${b64}`; });
    const W = img.width, H = img.height;
    const c = document.getElementById("c"); c.width = W; c.height = H;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, W, H), px = d.data;
    const lum = i => (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114);
    const T = 90;
    const bg = new Uint8Array(W * H);
    // preenche o fundo escuro a partir das bordas (o contorno branco do adesivo barra o preenchimento)
    const pilha = [];
    const poe = (xx, yy) => { if (xx < 0 || yy < 0 || xx >= W || yy >= H) return; const k = yy * W + xx; if (bg[k] || lum(k * 4) >= T) return; bg[k] = 1; pilha.push(k); };
    for (let i = 0; i < W; i++) { poe(i, 0); poe(i, H - 1); }
    for (let j = 0; j < H; j++) { poe(0, j); poe(W - 1, j); }
    while (pilha.length) { const k = pilha.pop(), xx = k % W, yy = (k / W) | 0; poe(xx + 1, yy); poe(xx - 1, yy); poe(xx, yy + 1); poe(xx, yy - 1); }
    // borda suave: pixels claros colados no fundo viram branco com transparência proporcional
    let minX = W, minY = H, maxX = 0, maxY = 0;
    const out = new Uint8ClampedArray(px.length);
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
      const k = yy * W + xx, i = k * 4;
      let a = 255, R = px[i], G = px[i + 1], B = px[i + 2];
      if (bg[k]) a = 0;
      else {
        let perto = false;
        for (let dy = -2; dy <= 2 && !perto; dy++) for (let dx = -2; dx <= 2; dx++) {
          const nx = xx + dx, ny = yy + dy;
          if (nx >= 0 && ny >= 0 && nx < W && ny < H && bg[ny * W + nx]) { perto = true; break; }
        }
        if (perto) { R = G = B = 255; a = Math.max(0, Math.min(255, (lum(i) - T) * 255 / 110)); }
      }
      out[i] = R; out[i + 1] = G; out[i + 2] = B; out[i + 3] = a;
      if (a > 8) { if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (yy < minY) minY = yy; if (yy > maxY) maxY = yy; }
    }
    // cores principais (pixels coloridos do logo, ignorando cinza/branco/preto)
    const cont = {};
    for (let k = 0; k < W * H; k++) {
      const i = k * 4; if (out[i + 3] < 250) continue;
      const mx = Math.max(out[i], out[i + 1], out[i + 2]), mn = Math.min(out[i], out[i + 1], out[i + 2]);
      if (mx - mn < 40 || mx < 90) continue;
      const q = [out[i] >> 4, out[i + 1] >> 4, out[i + 2] >> 4].join(",");
      cont[q] = (cont[q] || 0) + 1;
    }
    const top = Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const pad = 4, cx = Math.max(0, minX - pad), cy = Math.max(0, minY - pad);
    const cw = Math.min(W, maxX + pad + 1) - cx, ch = Math.min(H, maxY + pad + 1) - cy;
    d.data.set(out); x.putImageData(d, 0, 0);
    const alvo = Math.min(1000, cw);
    const c2 = document.createElement("canvas"); c2.width = alvo; c2.height = Math.round(ch * alvo / cw);
    const x2 = c2.getContext("2d"); x2.imageSmoothingQuality = "high";
    x2.drawImage(c, cx, cy, cw, ch, 0, 0, c2.width, c2.height);
    return { png: c2.toDataURL("image/png").split(",")[1], w: c2.width, h: c2.height, top };
  }, { b64, mime });
  await b.close();
  fs.writeFileSync(path.join(RAIZ, "logo.png"), Buffer.from(r.png, "base64"));
  console.log(`logo.png criada: ${r.w}x${r.h}`);
  console.log("cores mais comuns (RGB aproximado):", r.top.map(([k]) => k.split(",").map(v => v * 16 + 8).join(",")).join(" | "));
})().catch(e => { console.error(e); process.exit(1); });
