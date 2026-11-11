/* Cria miniaturas quadradas (260x260) das fotos dos sabores, em fotos/mini/.
   O site usa as miniaturas no celular (carrega bem mais rápido no 4G) e a foto grande ao tocar nela. */
const fs = require("fs");
const path = require("path");
const DADOS = require("../dados.js");
const { abrirNavegador } = require("./navegador.js");
const RAIZ = path.join(__dirname, "..");

function fotosDosSabores() {
  const set = new Set();
  DADOS.colecoes.forEach(c => c.grupos.forEach(g => g.sabores.forEach(s => { if (s.foto) set.add(s.foto); })));
  return [...set];
}

async function gerarMiniaturas() {
  const fotos = fotosDosSabores().filter(f => fs.existsSync(path.join(RAIZ, f)));
  const pasta = path.join(RAIZ, "fotos", "mini");
  fs.mkdirSync(pasta, { recursive: true });
  if (!fotos.length) return;
  const b = await abrirNavegador();
  const p = await b.newPage();
  await p.setContent("<canvas id=c></canvas>");
  for (const f of fotos) {
    const arq = path.join(RAIZ, f);
    const mime = /\.png$/i.test(arq) ? "image/png" : "image/jpeg";
    const b64 = fs.readFileSync(arq).toString("base64");
    const out = await p.evaluate(async ({ b64, mime }) => {
      const img = new Image();
      await new Promise(ok => { img.onload = ok; img.src = `data:${mime};base64,${b64}`; });
      const L = Math.min(img.width, img.height);
      const sx = (img.width - L) / 2, sy = (img.height - L) / 2;
      const c = document.getElementById("c"); c.width = c.height = 260;
      const x = c.getContext("2d"); x.imageSmoothingQuality = "high";
      x.drawImage(img, sx, sy, L, L, 0, 0, 260, 260);
      return c.toDataURL("image/jpeg", 0.8).split(",")[1];
    }, { b64, mime });
    fs.writeFileSync(path.join(pasta, path.basename(f).replace(/\.\w+$/, ".jpg")), Buffer.from(out, "base64"));
  }
  await b.close();
  console.log(`Miniaturas: ${fotos.length} foto(s) em fotos/mini/`);
}

module.exports = { gerarMiniaturas };
if (require.main === module) gerarMiniaturas().catch(e => { console.error(e); process.exit(1); });
