/* Gera o QR Code da Brownily (PNG + SVG) nas cores da marca, com a logo no centro.
   Correção de erro "H" (a mais alta) para continuar legível mesmo com a logo por cima. */
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-generator");
const DADOS = require("../dados.js");
const { abrirNavegador } = require("./navegador.js");

const RAIZ = path.join(__dirname, "..");
const PASTA = path.join(RAIZ, "materiais");

const COR = { fundo: "#fbf8f4", modulo: "#2b1711", olho: "#4b2775", olhoMiolo: "#6a3d9a", lilas: "#cfb7e6", choc: "#2b1711" };

function montarSvg(url) {
  const qr = qrcode(0, "H");
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  const quiet = 3, cel = 20;
  const lado = (n + quiet * 2) * cel;
  const meio = lado / 2;
  // O "selo" central ocupa ~21% da largura (cerca de 4% da área): seguro com correção H.
  const raioSelo = lado * 0.105;
  const raioLimpo = raioSelo + cel * 0.9;

  const emOlho = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  let mods = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c) || emOlho(r, c)) continue;
      const x = (c + quiet) * cel, y = (r + quiet) * cel;
      const dx = x + cel / 2 - meio, dy = y + cel / 2 - meio;
      if (Math.hypot(dx, dy) < raioLimpo) continue;
      mods += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cel - 1}" height="${cel - 1}" rx="${cel * 0.22}"/>`;
    }
  }
  const olho = (r, c) => {
    const x = (c + quiet) * cel, y = (r + quiet) * cel;
    return `<rect x="${x + cel / 2}" y="${y + cel / 2}" width="${cel * 6}" height="${cel * 6}" rx="${cel * 1.1}" fill="none" stroke="${COR.olho}" stroke-width="${cel}"/>` +
           `<rect x="${x + cel * 2}" y="${y + cel * 2}" width="${cel * 3}" height="${cel * 3}" rx="${cel * 0.6}" fill="${COR.olho}"/>`;
  };

  // Selo do centro: a logo (se existir) ou um brownie desenhado.
  let selo;
  const logoRel = DADOS.marca.logo;
  const logoArq = logoRel && path.join(RAIZ, logoRel);
  if (logoArq && fs.existsSync(logoArq)) {
    const b64 = fs.readFileSync(logoArq).toString("base64");
    const mime = /\.svg$/i.test(logoArq) ? "image/svg+xml" : "image/png";
    const d = raioSelo * 2 * 0.86;
    selo = `<circle cx="${meio}" cy="${meio}" r="${raioSelo}" fill="${COR.fundo}"/>` +
           `<clipPath id="cl"><circle cx="${meio}" cy="${meio}" r="${raioSelo * 0.9}"/></clipPath>` +
           `<image href="data:${mime};base64,${b64}" x="${meio - d / 2}" y="${meio - d / 2}" width="${d}" height="${d}" preserveAspectRatio="xMidYMid meet" clip-path="url(#cl)"/>` +
           `<circle cx="${meio}" cy="${meio}" r="${raioSelo * 0.9}" fill="none" stroke="${COR.lilas}" stroke-width="${cel * 0.35}"/>`;
  } else {
    const s = raioSelo;
    selo = `<circle cx="${meio}" cy="${meio}" r="${s}" fill="${COR.fundo}"/>` +
           `<circle cx="${meio}" cy="${meio}" r="${s * 0.9}" fill="${COR.lilas}"/>` +
           `<rect x="${meio - s * 0.48}" y="${meio - s * 0.42}" width="${s * 0.96}" height="${s * 0.84}" rx="${s * 0.2}" fill="${COR.choc}"/>` +
           `<circle cx="${meio - s * 0.18}" cy="${meio - s * 0.12}" r="${s * 0.09}" fill="${COR.lilas}"/>` +
           `<circle cx="${meio + s * 0.16}" cy="${meio + s * 0.08}" r="${s * 0.09}" fill="${COR.lilas}"/>` +
           `<circle cx="${meio - s * 0.05}" cy="${meio + s * 0.22}" r="${s * 0.07}" fill="${COR.lilas}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" width="${lado}" height="${lado}">` +
    `<rect width="${lado}" height="${lado}" rx="${cel * 2}" fill="${COR.fundo}"/>` +
    `<g fill="${COR.modulo}">${mods}</g>` +
    olho(0, 0) + olho(0, n - 7) + olho(n - 7, 0) + selo + `</svg>`;
}

async function gerarQR() {
  const url = DADOS.site.url;
  fs.mkdirSync(PASTA, { recursive: true });
  const svg = montarSvg(url);
  fs.writeFileSync(path.join(PASTA, "qr-brownily.svg"), svg);

  const b = await abrirNavegador();
  const p = await b.newPage({ viewport: { width: 1200, height: 1200 } });
  await p.setContent(`<body style="margin:0;background:#fbf8f4"><div style="width:1200px;height:1200px">${svg.replace(/width="\d+" height="\d+"/, 'width="1200" height="1200"')}</div></body>`);
  await p.screenshot({ path: path.join(PASTA, "qr-brownily.png"), clip: { x: 0, y: 0, width: 1200, height: 1200 } });

  // Conferência: lê o QR do PNG gerado e compara com o endereço.
  const jsqr = fs.readFileSync(require.resolve("jsqr/dist/jsQR.js"), "utf8");
  const png64 = fs.readFileSync(path.join(PASTA, "qr-brownily.png")).toString("base64");
  const lido = await p.evaluate(async ({ jsqr, png64 }) => {
    (0, eval)(jsqr);
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = "data:image/png;base64," + png64; });
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height);
    const r = window.jsQR(d.data, d.width, d.height);
    return r ? r.data : null;
  }, { jsqr, png64 });
  await b.close();

  const ok = lido === url;
  console.log(`QR Code: ${ok ? "OK (leitura confere)" : "ATENÇÃO: não conseguiu ler de volta"} -> ${url}`);
  if (!ok) throw new Error("O QR Code gerado não foi lido corretamente.");
}

module.exports = { gerarQR };
if (require.main === module) gerarQR().catch(e => { console.error(e.message); process.exit(1); });
