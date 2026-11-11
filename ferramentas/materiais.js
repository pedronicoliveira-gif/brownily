/* Gera, a partir do dados.js: miniaturas, QR Code, imagens 1080x1920 (stories/WhatsApp), PDF e a imagem de pré-visualização do link. */
const fs = require("fs");
const path = require("path");
const DADOS = require("../dados.js");
const { abrirNavegador } = require("./navegador.js");
const { gerarQR } = require("./qr.js");
const { gerarMiniaturas } = require("./fotos.js");

const RAIZ = path.join(__dirname, "..");
const PASTA = path.join(RAIZ, "materiais");
const D = DADOS;
const TAM = Object.keys(D.tamanhos);
const POR_PAGINA = 3;

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = v => { const n = Number(v); return "R$&nbsp;" + (n % 1 === 0 ? n : n.toFixed(2).replace(".", ",")); };
const fora = (x, k) => (x.esgotado || []).includes(k);
// linhas de um item: P/M (tamanhos) ou "linhas" próprias (sabores / unidade única)
const linhasDe = x => x.linhas
  ? x.linhas.map(l => ({ key: l.id, rotulo: l.rotulo || "", preco: l.preco, badge: "" }))
  : TAM.map(s => ({ key: s, rotulo: "", preco: x.preco[s], badge: s }));
const tudoFora = x => { const l = linhasDe(x); return l.length > 0 && l.every(r => fora(x, r.key)); };
const secoes = () => D.colecoes.filter(c => c.ativa !== false && c.grupos.some(g => g.sabores.length));
const menorPreco = () => {
  const alvo = secoes().filter(c => !D.capa.colecao || c.id === D.capa.colecao);
  const rows = alvo.flatMap(c => c.grupos.flatMap(g => g.sabores.flatMap(x => linhasDe(x).filter(r => typeof r.preco === "number").map(r => ({ r, out: fora(x, r.key) })))));
  const disp = rows.filter(o => !o.out).map(o => o.r.preco);
  return Math.min(...(disp.length ? disp : rows.map(o => o.r.preco)));
};
const usaTamanhos = c => c.grupos.some(g => g.sabores.some(x => !x.linhas && !x.consultar));
const temLogo = () => D.marca.logo && fs.existsSync(path.join(RAIZ, D.marca.logo));

const marca = (cls = "") => temLogo()
  ? `<img class="logo ${cls}" src="../${esc(D.marca.logo)}" alt="${esc(D.marca.nome)}">`
  : (() => { const n = D.marca.nome.toLowerCase(); return `<span class="wordmark ${cls}">${esc(n.slice(0, 4))}<b>${esc(n.slice(4))}</b></span>`; })();

const CSS = `
@font-face{font-family:"Titan One";src:url("../fonts/titan-one.woff2") format("woff2");font-weight:400}
@font-face{font-family:"Nunito";src:url("../fonts/nunito.woff2") format("woff2");font-weight:200 1000}
:root{--choc:#2b1711;--choc2:#3d2219;--lilac:#c7aecb;--soft:#f3ebf5;--purple:#915daf;--ink2:#4a2a63;--paper:#f6eee2;--line:#e6d9c6;--muted:#6e5a54;--ondark:#fff7ec;--ondark2:#dccbbd;--fd:"Titan One","Arial Rounded MT Bold",sans-serif;--fb:"Nunito","Segoe UI",sans-serif;
--marrom:linear-gradient(165deg,#4a2d24 0%,#3a2019 55%,#2b1711 100%)}
@page{size:1080px 1920px;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#777}
body{font-family:var(--fb);font-weight:600;color:var(--choc)}
.pg{width:1080px;height:1920px;position:relative;overflow:hidden;break-after:page;page-break-after:always;display:flex;flex-direction:column}
.pg:last-child{break-after:auto;page-break-after:auto}
.dots::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;background-image:radial-gradient(rgba(199,174,203,.2) 2px,transparent 3px);background-size:40px 40px}
.wordmark{font-family:var(--fd);font-size:64px;line-height:1;color:var(--ondark)}.wordmark b{font-weight:400;color:var(--lilac)}
.logo{width:auto;display:block;filter:drop-shadow(0 10px 22px rgba(20,8,32,.35))}
.marrom{background:var(--marrom);color:var(--ondark)}
.light{background:var(--paper)}
h1,h2,h3{font-family:var(--fd);font-weight:400;margin:0;line-height:1}
.rel{position:relative;z-index:1}

/* capa */
.capa{padding:84px 80px 0}
.capa .logo{height:240px}
.chip{display:inline-block;background:var(--lilac);color:var(--ink2);font-weight:900;font-size:26px;letter-spacing:.14em;text-transform:uppercase;padding:12px 26px;border-radius:999px}
.capa h1{font-size:112px;line-height:1.08;margin-top:22px;letter-spacing:.005em;color:var(--ondark)}
.capa h1 span{display:block;color:var(--lilac)}
.capa .lede{font-size:36px;line-height:1.35;color:var(--ondark2);margin:22px 0 0;max-width:30ch;font-weight:600}
.capa .foto{position:absolute;left:50%;bottom:215px;width:560px;margin-left:-260px}
.capa .foto img{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:44px;transform:rotate(3deg);box-shadow:0 40px 80px rgba(0,0,0,.45)}
.stamp{position:absolute;left:-70px;bottom:50px;background:var(--paper);color:var(--choc);border-radius:26px;padding:20px 30px;transform:rotate(-5deg);box-shadow:0 18px 40px rgba(0,0,0,.35);font-weight:800;font-size:30px;line-height:1.2}
.stamp strong{font-family:var(--fd);font-weight:400;font-size:54px;color:var(--purple);display:block}
.capa .rodape{position:absolute;left:0;right:0;bottom:0;height:170px;background:var(--lilac);color:var(--ink2);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:42px;text-align:center}
.capa .rodape small{display:block;font-size:26px;letter-spacing:.14em;text-transform:uppercase;font-weight:900;opacity:.85}

/* cardapio */
.cab{background:var(--marrom);padding:44px 70px 40px;display:flex;align-items:center;justify-content:space-between;position:relative}
.cab .logo{height:116px}
.cab .tams{display:flex;gap:12px}
.cab .tams span{display:flex;align-items:center;gap:10px;background:var(--lilac);border-radius:999px;padding:7px 20px 7px 7px;font-weight:800;font-size:23px;color:var(--ink2)}
.cab .tams i{display:inline-grid;place-items:center;width:42px;height:42px;border-radius:50%;background:var(--ink2);color:#fff;font-style:normal;font-family:var(--fb);font-weight:900;font-size:22px}
.lista{flex:1;padding:30px 70px 0;display:flex;flex-direction:column;gap:22px}
.pill{align-self:flex-start;background:linear-gradient(120deg,var(--purple),var(--ink2));color:#fff;font-family:var(--fd);font-size:36px;padding:10px 34px 12px;border-radius:999px}
.grupo{font-size:54px;color:var(--choc);margin:2px 0 -6px}
.item{display:flex;min-height:380px;max-height:540px;flex:1 1 380px;background:#fff;border:3px solid var(--line);border-radius:36px;overflow:hidden;position:relative}
.item .m{position:relative;width:304px;align-self:stretch;flex:none;background:var(--choc2)}
.item .m img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.item .tag{position:absolute;top:18px;left:18px;background:var(--purple);color:#fff;font-weight:900;font-size:22px;letter-spacing:.12em;text-transform:uppercase;padding:8px 18px;border-radius:999px;z-index:2}
.tile{position:absolute;inset:0;display:grid;place-items:center;padding:24px;overflow:hidden;background:var(--choc2)}
.tile::before{content:"";position:absolute;width:150%;height:62%;left:-25%;bottom:-16%;border-radius:50% 50% 0 0}
.tile span{position:relative;z-index:1;font-family:var(--fd);font-size:44px;line-height:1.05;text-align:center}
.tile.leite span{color:#f6eedf}.tile.leite::before{background:#efe3c8;opacity:.18}
.tile.doce span{color:#e7b36b}.tile.doce::before{background:#c4843d;opacity:.25}
.item .t{flex:1;padding:26px 36px;display:flex;flex-direction:column;justify-content:center;gap:12px;min-width:0}
.item h3{font-size:44px;line-height:1.05;color:var(--choc)}
.item p{margin:0 0 4px;font-size:27px;line-height:1.3;color:var(--muted);font-weight:600}
.pre{display:flex;align-items:center;gap:18px;border-top:3px dashed var(--line);padding-top:12px}
.pre .z{width:50px;height:50px;border-radius:50%;background:var(--soft);color:var(--ink2);display:grid;place-items:center;font-weight:900;font-size:26px;flex:none}
.pre .v{font-family:var(--fd);font-size:40px;color:var(--choc)}
.pre .e{margin-left:auto;font-weight:900;font-size:22px;letter-spacing:.1em;text-transform:uppercase;color:#8a7d83;background:#ece7ea;border-radius:999px;padding:8px 18px}
.pre.off .v{color:#9b8f94;text-decoration:line-through}.pre.off .z{background:#ece7ea;color:#9b8f94}
.pre .lb{font-weight:800;font-size:28px;color:var(--choc);flex:1;min-width:0}
.pre .lb + .v{margin-left:auto}
.pre.off .lb{color:#9b8f94}
.item.out{background:#f1ebe3;border-color:#e3d9cb}
.item.out .m img,.item.out .tile{filter:grayscale(1) opacity(.55)}
.item.out h3,.item.out p{color:#9b8f94}
.item.out .tag{background:#9b8f94}
.item .selo-out{position:absolute;left:152px;top:50%;transform:translate(-50%,-50%) rotate(-6deg);background:var(--choc);color:var(--ondark);font-family:var(--fd);font-size:36px;padding:10px 30px;border-radius:20px;border:4px solid var(--ondark);z-index:3;white-space:nowrap}
.pe{height:130px;display:flex;align-items:center;justify-content:center;gap:16px;font-weight:900;font-size:34px;color:var(--ink2);background:var(--lilac);margin-top:26px;flex:none}
.pe b{font-family:var(--fd);font-weight:400;font-size:36px;color:var(--ink2)}

/* informacoes */
.info{padding:90px 80px 90px;justify-content:space-between}
.info h2{font-size:94px;line-height:1.05;color:var(--ondark)}
.regras{display:flex;flex-direction:column;gap:22px}
.regra{display:flex;align-items:center;gap:28px;background:rgba(199,174,203,.13);border:2px solid rgba(199,174,203,.3);border-radius:34px;padding:30px 36px}
.regra svg{width:70px;height:70px;color:var(--lilac);flex:none}
.regra strong{display:block;font-size:40px;font-weight:900;color:var(--ondark)}
.regra span{font-size:32px;color:var(--ondark2);font-weight:600}
.qrbox{display:flex;align-items:center;gap:40px;background:var(--paper);border-radius:44px;padding:34px 44px 34px 34px;color:var(--choc);width:100%}
.qrbox img{width:460px;height:460px;display:block;flex:none}
.qrbox h3{font-size:50px;line-height:1.1;color:var(--choc)}
.qrbox h3 span{color:var(--purple)}
.qrbox p{margin:14px 0 0;font-size:30px;line-height:1.3;color:var(--muted);font-weight:700}
.contatos{display:flex;flex-direction:column;gap:18px}
.contatos div{display:flex;align-items:center;gap:22px;font-size:46px;font-weight:900;color:var(--ondark)}
.contatos svg{width:54px;height:54px;color:var(--lilac);flex:none}
.contatos .u{font-size:30px;color:var(--ondark2);font-weight:700}
.info .logo{height:180px}
`;

const ICONES = {
  calendario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  cartao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="3"/><path d="M2 11h20M6 15h4"/></svg>',
  entrega: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.7-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  globo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
};

function paginaCapa() {
  const c = D.capa;
  return `<section class="pg marrom dots capa" data-nome="capa">
    <div class="rel">${marca()}</div>
    ${c.selo && c.selo.ativo ? `<div class="rel" style="margin-top:44px"><span class="chip">${esc(c.selo.texto)}</span></div>` : ""}
    <h1 class="rel">${esc(c.titulo)} <span>${esc(c.destaque)}</span></h1>
    <p class="lede rel">${esc(c.frase)}</p>
    <div class="foto rel"><img src="../${esc(c.foto)}" alt=""><div class="stamp">a partir de<strong>${brl(menorPreco())}</strong></div></div>
    <div class="rodape"><div><small>Peça pelo WhatsApp</small>${esc(D.contato.whatsappTexto)}</div></div>
  </section>`;
}

function linhaPreco(x, r) {
  const esq = r.badge ? `<span class="z">${esc(r.badge)}</span>` : (r.rotulo ? `<span class="lb">${esc(r.rotulo)}</span>` : "");
  const off = fora(x, r.key);
  return `<div class="pre${off ? " off" : ""}${r.badge ? "" : " var"}">${esq}<span class="v">${brl(r.preco)}</span>${off ? '<span class="e">Esgotado</span>' : ""}</div>`;
}

function item(x) {
  const midia = x.foto
    ? `<img src="../${esc(x.foto)}" alt="">`
    : `<div class="tile ${esc(x.cartao || "leite")}"><span>${esc(x.nome)}</span></div>`;
  const out = tudoFora(x);
  return `<div class="item${out ? " out" : ""}"><div class="m">${midia}${x.destaque ? `<span class="tag">${esc(x.destaque)}</span>` : ""}${out ? '<span class="selo-out">Esgotado</span>' : ""}</div>
    <div class="t"><h3>${esc(x.nome)}</h3>${x.descricao ? `<p>${esc(x.descricao)}</p>` : ""}${
      x.consultar || !linhasDe(x).length ? '<div class="pre"><span class="lb">Valor sob consulta</span></div>' : linhasDe(x).map(r => linhaPreco(x, r)).join("")}</div></div>`;
}

function paginasCardapio() {
  // cada seção começa em página nova (Especial de fim de ano separado do Cardápio)
  const paginas = [];
  secoes().forEach(c => {
    const itens = [];
    c.grupos.forEach(g => g.sabores.forEach(x => itens.push({ c, g, x })));
    // reparte por igual entre as páginas (ex.: 5 itens = 3 + 2; 7 itens = 3 + 2 + 2)
    const q = Math.ceil(itens.length / POR_PAGINA), base = Math.floor(itens.length / q), extra = itens.length % q;
    let i = 0;
    for (let p = 0; p < q; p++) { const n = base + (p < extra ? 1 : 0); paginas.push({ c, lista: itens.slice(i, i + n) }); i += n; }
  });
  const tams = `<div class="tams">${TAM.map(s => `<span><i>${s}</i>${esc(D.tamanhos[s])}</span>`).join("")}</div>`;
  return paginas.map(({ c: sec, lista }, n) => {
    let corpo = "", col = null, grp = null;
    lista.forEach(({ c, g, x }) => {
      if (c.id !== col) { corpo += `<div class="pill">${esc(c.titulo)}</div>`; col = c.id; grp = null; }
      if (g.id !== grp) { if (g.titulo) corpo += `<h2 class="grupo">${esc(g.titulo)}</h2>`; grp = g.id; }
      corpo += item(x);
    });
    return `<section class="pg light" data-nome="cardapio-${n + 1}">
      <div class="cab">${marca()}${usaTamanhos(sec) ? tams : ""}</div>
      <div class="lista">${corpo}</div>
      <div class="pe">Peça pelo WhatsApp <b>${esc(D.contato.whatsappTexto)}</b></div>
    </section>`;
  }).join("");
}

function paginaInfo(urlCurta) {
  const regras = D.regras.map(r => `<div class="regra">${ICONES[r.icone] || ""}<div><strong>${esc(r.titulo)}</strong><span>${esc(r.texto.replace("{taxa}", String(D.entrega.taxa))).replace("R$ ", () => "R$&nbsp;")}</span></div></div>`).join("");
  return `<section class="pg marrom dots info" data-nome="informacoes">
    <h2 class="rel">Como funciona</h2>
    <div class="regras rel">${regras}</div>
    <div class="qrbox rel"><img src="../materiais/qr-brownily.png" alt="QR Code"><div><h3>Escaneie e <span>peça</span></h3><p>Aponte a câmera do celular para abrir o cardápio completo.</p></div></div>
    <div class="contatos rel">
      <div>${ICONES.whatsapp}${esc(D.contato.whatsappTexto)}</div>
      <div>${ICONES.instagram}@${esc(D.marca.instagram)}</div>
      <div class="u">${ICONES.globo}${esc(urlCurta)}</div>
    </div>
    <div class="rel">${marca()}</div>
  </section>`;
}

function paginaCompartilhar() {
  const c = D.capa;
  return `<section class="pg marrom dots" style="width:1200px;height:630px;flex-direction:row;align-items:center;padding:0 70px;gap:50px" data-nome="compartilhar">
    <div class="rel" style="flex:1">${marca().replace('class="logo ', 'style="height:180px" class="logo ')}${c.selo && c.selo.ativo ? `<div style="margin-top:26px"><span class="chip" style="font-size:20px;padding:8px 20px">${esc(c.selo.texto)}</span></div>` : ""}
      <h1 style="font-size:78px;line-height:1.1;margin-top:18px;color:var(--ondark)">${esc(c.titulo)}<br><span style="color:var(--lilac)">${esc(c.destaque)}</span></h1>
      <div style="margin-top:20px;font-size:30px;color:var(--ondark2);font-weight:800">Peça pelo WhatsApp &middot; ${esc(D.marca.cidade)}</div></div>
    <div class="rel" style="width:400px;flex:none"><img src="../${esc(c.foto)}" style="display:block;width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:36px;transform:rotate(3deg);box-shadow:0 30px 60px rgba(0,0,0,.5)" alt=""></div>
  </section>`;
}

// Escreve as informações de compartilhamento (prévia do link no WhatsApp) no index.html.
function atualizarIndex() {
  const arq = path.join(RAIZ, "index.html");
  const base = D.site.url.replace(/\/?$/, "/");
  const titulo = `${D.marca.nome} · ${D.marca.slogan} — Cardápio`;
  const desc = `Cardápio ${D.marca.nome}: ${D.capa.titulo} ${D.capa.destaque}, feito à mão em ${D.marca.cidade}. Monte seu pedido e peça pelo WhatsApp.`;
  const bloco = `<!--COMPARTILHAR-->
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(base)}">
<meta property="og:image" content="${esc(base)}materiais/compartilhar.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<!--/COMPARTILHAR-->`;
  const versao = versaoDosArquivos();
  const html = fs.readFileSync(arq, "utf8")
    .replace(/<!--COMPARTILHAR-->[\s\S]*?<!--\/COMPARTILHAR-->/, bloco)
    // ?v=... faz o navegador baixar de novo sempre que algo muda (evita ver a versão antiga)
    .replace(/(href="estilo\.css|src="dados\.js|src="app\.js)(\?v=\w+)?"/g, `$1?v=${versao}"`);
  fs.writeFileSync(arq, html);
}

// resumo (hash) dos arquivos que o site usa: muda quando qualquer um deles muda
function versaoDosArquivos() {
  const h = require("crypto").createHash("md5");
  const arqs = ["dados.js", "app.js", "estilo.css", D.marca.logo || "logo.png"];
  const andar = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? andar(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
  [...arqs.map(a => path.join(RAIZ, a)), ...andar(path.join(RAIZ, "fotos")).sort()].forEach(f => { if (fs.existsSync(f)) h.update(fs.readFileSync(f)); });
  return h.digest("hex").slice(0, 10);
}

async function gerarMateriais() {
  fs.mkdirSync(PASTA, { recursive: true });
  await gerarMiniaturas();
  await gerarQR();
  atualizarIndex();

  const urlCurta = D.site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Materiais Brownily</title><style>${CSS}</style></head><body>
    ${paginaCapa()}${paginasCardapio()}${paginaInfo(urlCurta)}${paginaCompartilhar()}</body></html>`;
  const tmp = path.join(__dirname, "_paginas.html");
  fs.writeFileSync(tmp, html);

  // limpa imagens antigas para não sobrar página de um cardápio anterior
  fs.readdirSync(PASTA).filter(f => /^story-.*\.png$/.test(f)).forEach(f => fs.unlinkSync(path.join(PASTA, f)));

  const b = await abrirNavegador();
  const p = await b.newPage({ viewport: { width: 1200, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto("file:///" + tmp.replace(/\\/g, "/"));
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))));

  const secs = await p.$$("section.pg");
  let n = 0;
  const arquivos = [];
  for (const s of secs) {
    const nome = await s.getAttribute("data-nome");
    if (nome === "compartilhar") { await s.screenshot({ path: path.join(PASTA, "compartilhar.jpg"), type: "jpeg", quality: 86 }); continue; }
    n++;
    const f = `story-${String(n).padStart(2, "0")}-${nome}.png`;
    await s.screenshot({ path: path.join(PASTA, f) });
    arquivos.push(f);
  }

  // PDF: as mesmas páginas, uma por folha 1080x1920 (a imagem de compartilhamento fica de fora)
  await p.addStyleTag({ content: `section[data-nome="compartilhar"]{display:none!important}` });
  await p.pdf({ path: path.join(PASTA, "cardapio-brownily.pdf"), width: "1080px", height: "1920px", printBackground: true, preferCSSPageSize: true });
  await b.close();
  fs.unlinkSync(tmp);

  console.log("Imagens:", arquivos.join(", "));
  console.log("PDF: cardapio-brownily.pdf | Prévia do link: compartilhar.jpg");
}

module.exports = { gerarMateriais };
if (require.main === module) gerarMateriais().catch(e => { console.error(e); process.exit(1); });
