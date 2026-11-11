/* Comando único "atualizar": confere os dados, regenera QR + imagens + PDF e publica no GitHub Pages. */
const { execFileSync, spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const RAIZ = path.join(__dirname, "..");
const DADOS = require("../dados.js");
const { gerarMateriais } = require("./materiais.js");

const sempublicar = process.argv.includes("--sem-publicar");

function git(...args) {
  return execFileSync("git", args, { cwd: RAIZ, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function conferirDados() {
  const erros = [];
  if (/SEU-USUARIO/.test(DADOS.site.url)) erros.push("O endereço do site em dados.js (site.url) ainda é o provisório.");
  const ids = new Set();
  DADOS.colecoes.forEach(c => c.grupos.forEach(g => g.sabores.forEach(s => {
    if (ids.has(s.id)) erros.push(`Sabor repetido: ${s.id}`);
    ids.add(s.id);
    if (s.linhas) {
      if (!s.linhas.length && !s.consultar) erros.push(`${s.nome}: sem preço (use "linhas" ou consultar: true)`);
      s.linhas.forEach(l => { if (l.preco !== null && typeof l.preco !== "number") erros.push(`${s.nome} (${l.rotulo || l.id}): preço inválido (use um número ou null)`); });
    } else if (!s.consultar) {
      Object.keys(DADOS.tamanhos).forEach(t => { if (typeof s.preco[t] !== "number") erros.push(`${s.nome}: falta o preço do tamanho ${t}`); });
    }
    if (s.foto && !fs.existsSync(path.join(RAIZ, s.foto))) erros.push(`${s.nome}: a foto ${s.foto} não existe`);
  })));
  if (!DADOS.colecoes.some(c => c.ativa !== false && c.grupos.some(g => g.sabores.length))) erros.push("Nenhuma seção ativa com sabores.");
  if (!fs.existsSync(path.join(RAIZ, DADOS.capa.foto))) erros.push(`Foto da capa não existe: ${DADOS.capa.foto}`);
  if (erros.length) { console.error("\nPROBLEMAS NO dados.js:\n- " + erros.join("\n- ")); process.exit(1); }
}

(async () => {
  conferirDados();
  console.log("Gerando QR Code, imagens e PDF...");
  await gerarMateriais();

  if (sempublicar) { console.log("\nPronto (sem publicar)."); return; }

  console.log("\nPublicando...");
  git("add", "-A");
  if (!git("status", "--porcelain")) { console.log("Nada mudou desde a última publicação."); return; }
  const data = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  git("commit", "-m", `Atualiza cardápio (${data})`);
  const r = spawnSync("git", ["push"], { cwd: RAIZ, stdio: "inherit" });
  if (r.status !== 0) { console.error("\nNão consegui enviar para o GitHub. Veja a mensagem acima."); process.exit(1); }
  console.log("\nPublicado! O site atualiza em 1 a 2 minutos: " + DADOS.site.url);
})().catch(e => { console.error("\nErro:", e.message); process.exit(1); });
