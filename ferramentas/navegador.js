// Abre o Edge ou o Chrome que já existem no PC (sem baixar nada).
const { chromium } = require("playwright-core");

async function abrirNavegador() {
  for (const channel of ["msedge", "chrome"]) {
    try { return await chromium.launch({ channel }); } catch (e) { /* tenta o próximo */ }
  }
  throw new Error("Não achei Edge nem Chrome instalados neste computador.");
}

module.exports = { abrirNavegador };
