/* Trata as fotos novas: corta em 4:5 (720x900), com leve ajuste de luz, sem mudar a aparência do doce.
   Originais ficam em fotos-originais/; as prontas vão para fotos/.
   foco = de 0 (topo) a 1 (base): onde fica o corte quando a foto é mais alta que 4:5. */
const fs = require("fs");
const path = require("path");
const { abrirNavegador } = require("./navegador.js");
const RAIZ = path.join(__dirname, "..");

const FOTOS = [
  { de: "maracuja-nova.jpg",   para: "maracuja.jpg",            foco: 0.5 },
  { de: "tradicional-nova.jpg", para: "tradicional.jpg",        foco: 0.5 },
  { de: "copo-img3.jpg",       para: "copo-dois-amores.jpg",    foco: 0.42 },
  { de: "copo-img4.jpg",       para: "copo-ninho-nutella.jpg",  foco: 0.39 },
  { de: "copo-img5.jpg",       para: "copo-maracuja.jpg",       foco: 0.8 },
  { de: "bombom.jpg",          para: "bombom.jpg",              foco: 0.5 },
  { de: "bites.jpg",           para: "bites.jpg",               foco: 0.51 },
  { de: "individual.jpg",      para: "individual.jpg",          foco: 0.54 },
  { de: "quarteto.jpg",        para: "quarteto.jpg",            foco: 0.44 },
  { de: "sobremesa.jpg",       para: "sobremesa.jpg",           foco: 0.6 },
];

(async () => {
  const b = await abrirNavegador();
  const p = await b.newPage();
  await p.setContent("<canvas id=c></canvas>");
  for (const f of FOTOS) {
    const b64 = fs.readFileSync(path.join(RAIZ, "fotos-originais", f.de)).toString("base64");
    const out = await p.evaluate(async ({ b64, foco }) => {
      const img = new Image();
      await new Promise(ok => { img.onload = ok; img.src = "data:image/jpeg;base64," + b64; });
      const alvo = 4 / 5;
      let sw = img.width, sh = img.height, sx = 0, sy = 0;
      if (sw / sh > alvo) { const w = sh * alvo; sx = (sw - w) / 2; sw = w; }
      else { const h = sw / alvo; sy = (sh - h) * foco; sh = h; }
      const c = document.getElementById("c"); c.width = 720; c.height = 900;
      const x = c.getContext("2d"); x.imageSmoothingQuality = "high";
      x.filter = "brightness(1.03) contrast(1.04) saturate(1.04)";
      x.drawImage(img, sx, sy, sw, sh, 0, 0, 720, 900);
      return c.toDataURL("image/jpeg", 0.84).split(",")[1];
    }, { b64, foco: f.foco });
    fs.writeFileSync(path.join(RAIZ, "fotos", f.para), Buffer.from(out, "base64"));
    console.log(f.para, Math.round(Buffer.from(out, "base64").length / 1024) + " KB");
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
