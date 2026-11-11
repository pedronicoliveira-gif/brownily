/* Gera o QR Code da Brownily (PNG + SVG) nas cores da marca, com a logo no centro.
   Correção de erro "H" (a mais alta) para continuar legível mesmo com a logo por cima. */
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-generator");
const DADOS = require("../dados.js");
const { abrirNavegador } = require("./navegador.js");

const RAIZ = path.join(__dirname, "..");
const PASTA = path.join(RAIZ, "materiais");

const COR = { fundo: "#f6eee2", modulo: "#2b1711", olho: "#4a2a63", olhoMiolo: "#915daf", lilas: "#c7aecb", choc: "#2b1711" };

// lê largura e altura de um PNG direto do cabeçalho do arquivo
function tamanhoPng(arq) {
  const b = fs.readFileSync(arq);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function montarSvg(url) {
  const qr = qrcode(0, "H");
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  const quiet = 3, cel = 20;
  const lado = (n + quiet * 2) * cel;
  const meio = lado / 2;

  const logoRel = DADOS.marca.logo;
  const logoArq = logoRel && path.join(RAIZ, logoRel);
  const temLogo = !!(logoArq && fs.existsSync(logoArq));

  // Área reservada no centro (retângulo largo para a logo, ou círculo para o selo provisório)
  let bw, bh;
  if (temLogo) {
    const t = tamanhoPng(logoArq);
    bw = lado * 0.32;
    bh = bw * t.h / t.w + cel * 1.8;
  } else {
    bw = bh = lado * 0.21;
  }
  const folga = cel * 0.9;
  const dentro = (cx, cy) => Math.abs(cx - meio) < bw / 2 + folga && Math.abs(cy - meio) < bh / 2 + folga;

  const emOlho = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  let mods = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c) || emOlho(r, c)) continue;
      const x = (c + quiet) * cel, y = (r + quiet) * cel;
      if (dentro(x + cel / 2, y + cel / 2)) continue;
      mods += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cel - 1}" height="${cel - 1}" rx="${cel * 0.22}"/>`;
    }
  }
  const olho = (r, c) => {
    const x = (c + quiet) * cel, y = (r + quiet) * cel;
    return `<rect x="${x + cel / 2}" y="${y + cel / 2}" width="${cel * 6}" height="${cel * 6}" rx="${cel * 1.1}" fill="none" stroke="${COR.olho}" stroke-width="${cel}"/>` +
           `<rect x="${x + cel * 2}" y="${y + cel * 2}" width="${cel * 3}" height="${cel * 3}" rx="${cel * 0.6}" fill="${COR.olho}"/>`;
  };

  let selo;
  if (temLogo) {
    const b64 = fs.readFileSync(logoArq).toString("base64");
    const mime = /\.svg$/i.test(logoArq) ? "image/svg+xml" : "image/png";
    const pad = cel * 0.8;
    selo = `<rect x="${meio - bw / 2}" y="${meio - bh / 2}" width="${bw}" height="${bh}" rx="${cel * 1.4}" fill="${COR.lilas}" stroke="${COR.olhoMiolo}" stroke-width="${cel * 0.4}"/>` +
           `<image href="data:${mime};base64,${b64}" x="${meio - bw / 2 + pad}" y="${meio - bh / 2 + pad}" width="${bw - pad * 2}" height="${bh - pad * 2}" preserveAspectRatio="xMidYMid meet"/>`;
  } else {
    const s = bw / 2;
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
  await p.setContent(`<body style="margin:0;background:${COR.fundo}"><div style="width:1200px;height:1200px">${svg.replace(/width="\d+" height="\d+"/, 'width="1200" height="1200"')}</div></body>`);
  await p.screenshot({ path: path.join(PASTA, "qr-brownily.png"), clip: { x: 0, y: 0, width: 1200, height: 1200 } });

  // Conferência: lê o QR do PNG gerado (em tamanho grande e em tamanho pequeno, como num celular) e compara com o endereço.
  const jsqr = fs.readFileSync(require.resolve("jsqr/dist/jsQR.js"), "utf8");
  const png64 = fs.readFileSync(path.join(PASTA, "qr-brownily.png")).toString("base64");
  const lidos = await p.evaluate(async ({ jsqr, png64 }) => {
    (0, eval)(jsqr);
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = "data:image/png;base64," + png64; });
    const ler = tam => {
      const c = document.createElement("canvas");
      c.width = c.height = tam;
      const x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(img, 0, 0, tam, tam);
      const d = x.getImageData(0, 0, tam, tam);
      const r = window.jsQR(d.data, d.width, d.height);
      return r ? r.data : null;
    };
    return { grande: ler(1200), medio: ler(500), pequeno: ler(300) };
  }, { jsqr, png64 });
  await b.close();

  const ok = Object.values(lidos).every(v => v === url);
  console.log(`QR Code: ${ok ? "OK (leitura confere em 3 tamanhos)" : "ATENÇÃO: falhou em algum tamanho " + JSON.stringify(lidos)} -> ${url}`);
  if (!ok) throw new Error("O QR Code gerado não foi lido corretamente.");
}

module.exports = { gerarQR };
if (require.main === module) gerarQR().catch(e => { console.error(e.message); process.exit(1); });
