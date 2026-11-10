/* Monta a página a partir do dados.js e controla o pedido. Não precisa editar. */
(function () {
  "use strict";
  var D = DADOS;
  var FEE = D.entrega.taxa;
  var cart = {};

  /* ---------- utilitários ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function brl(v) {
    var n = Number(v);
    var t = n % 1 === 0 ? String(n) : n.toFixed(2).replace(".", ",");
    return "R$ " + t;
  }
  function brlHtml(v) { return brl(v).replace(" ", "&nbsp;"); }
  function key(id, s) { return id + "|" + s; }
  function sizes() { return Object.keys(D.tamanhos); }
  function isOut(sabor, s) { return (sabor.esgotado || []).indexOf(s) !== -1; }
  function allOut(sabor) { return sizes().every(function (s) { return isOut(sabor, s); }); }
  function allSabores() {
    var r = [];
    D.grupos.forEach(function (g) { g.sabores.forEach(function (x) { r.push(x); }); });
    return r;
  }
  function minPrice() {
    var m = Infinity;
    allSabores().forEach(function (x) { sizes().forEach(function (s) { if (!isOut(x, s) && x.preco[s] < m) m = x.preco[s]; }); });
    if (m === Infinity) allSabores().forEach(function (x) { sizes().forEach(function (s) { if (x.preco[s] < m) m = x.preco[s]; }); });
    return m;
  }

  var ICONS = {
    calendario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    cartao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="13" rx="3"/><path d="M2 11h20M6 15h4"/></svg>',
    entrega: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>'
  };
  var WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.7-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3Z"/></svg>';
  var IG_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>';

  /* ---------- montagem ---------- */
  function wordmark() {
    var n = D.marca.nome.toLowerCase();
    return '<span class="wordmark">' + esc(n.slice(0, 4)) + "<b>" + esc(n.slice(4)) + "</b></span>";
  }

  function hero() {
    var c = D.capa;
    var brand = '<div class="brand">' +
      (D.marca.logo ? '<img class="logo" src="' + esc(D.marca.logo) + '" alt="' + esc(D.marca.nome) + '">' : wordmark()) +
      "<small>" + esc(D.marca.slogan) + " &middot; " + esc(D.marca.cidade) + "</small></div>";
    var selo = c.selo && c.selo.ativo ? '<span class="chip">' + esc(c.selo.texto) + "</span>" : "";
    return '<header class="hero"><div class="wrap"><div>' + brand + selo +
      "<h1>" + esc(c.titulo) + " <span>" + esc(c.destaque) + "</span></h1>" +
      '<p class="lede">' + esc(c.frase) + "</p></div>" +
      '<div class="hero-photo"><img src="' + esc(c.foto) + '" alt="' + esc(c.fotoDescricao) + '" width="720" height="900" fetchpriority="high">' +
      '<div class="stamp">a partir de<strong>' + brlHtml(minPrice()) + "</strong></div></div></div></header>";
  }

  function sizesBar() {
    var h = '<div class="sizes"><div class="wrap"><span class="lbl">Tamanhos</span>';
    sizes().forEach(function (s) {
      h += '<span class="size ' + s.toLowerCase() + '"><i>' + esc(s) + "</i> " + esc(D.tamanhos[s]) + "</span>";
    });
    return h + "</div></div>";
  }

  function row(sabor, s) {
    if (isOut(sabor, s)) {
      return '<div class="row off"><span class="sz">' + s + '</span><span class="pr">' + brlHtml(sabor.preco[s]) +
        '</span><span class="soldout">Esgotado</span></div>';
    }
    return '<div class="row"><span class="sz">' + s + '</span><span class="pr">' + brlHtml(sabor.preco[s]) + "</span>" +
      '<div class="step" data-id="' + esc(sabor.id) + '" data-size="' + s + '">' +
      '<button type="button" class="b minus" aria-label="Tirar um ' + s + '" disabled>&minus;</button>' +
      '<output class="q" aria-live="polite">0</output>' +
      '<button type="button" class="b plus" aria-label="Adicionar um ' + s + '">+</button></div></div>';
  }

  function card(sabor, wide) {
    var out = allOut(sabor);
    var media;
    if (sabor.foto) {
      media = '<img src="' + esc(sabor.foto) + '" alt="' + esc(sabor.fotoDescricao || sabor.nome) + '" width="720" height="900" loading="lazy" decoding="async">';
    } else {
      media = '<div class="tile tile-' + esc(sabor.cartao || "leite") + '" aria-hidden="true"><span>' + esc(sabor.nome) + "</span></div>";
    }
    var tag = sabor.destaque ? '<span class="tag">' + esc(sabor.destaque) + "</span>" : "";
    var badge = out ? '<span class="out-badge">Esgotado</span>' : "";
    var rows = sizes().map(function (s) { return row(sabor, s); }).join("");
    return '<article class="card' + (wide ? " wide" : "") + (out ? " out" : "") + '">' +
      '<div class="media">' + media + tag + badge + "</div>" +
      '<div class="body"><h3>' + esc(sabor.nome) + '</h3><p class="desc">' + esc(sabor.descricao) + "</p>" + rows + "</div></article>";
  }

  function groups() {
    return D.grupos.map(function (g) {
      var single = g.sabores.length === 1;
      return '<section class="block" aria-labelledby="h-' + esc(g.id) + '"><div class="sec-head"><h2 id="h-' + esc(g.id) + '">' + esc(g.titulo) + "</h2>" +
        (g.subtitulo ? "<p>" + g.subtitulo.replace("+", "<b>+</b>") + "</p>" : "") + "</div>" +
        (single ? card(g.sabores[0], true) : '<div class="grid">' + g.sabores.map(function (x) { return card(x, false); }).join("") + "</div>") +
        "</section>";
    }).join("");
  }

  function info() {
    var items = D.regras.map(function (r) {
      return "<div>" + (ICONS[r.icone] || "") + "<strong>" + esc(r.titulo) + "</strong><p>" +
        esc(r.texto.replace("{taxa}", String(D.entrega.taxa))).replace("R$ ", function () { return "R$&nbsp;"; }) + "</p></div>";
    }).join("");
    var wa = "https://wa.me/" + D.contato.whatsapp;
    return '<section class="block" aria-labelledby="h-info"><div class="sec-head"><h2 id="h-info">Como funciona</h2></div>' +
      '<div class="info">' + items + "</div>" +
      '<div class="contact"><div><h2>' + esc(D.contatoTitulo) + " <span>" + esc(D.contatoDestaque) + "</span></h2><p>" + esc(D.contatoTexto) + "</p></div>" +
      '<div class="links"><div class="lnk">' + WA_ICON +
      '<a id="whats-num" href="' + wa + '" target="_blank" rel="noopener">' + esc(D.contato.whatsappTexto) + "</a>" +
      '<button type="button" class="copy" id="copy-num">Copiar</button></div>' +
      '<a class="lnk" href="https://instagram.com/' + esc(D.marca.instagram) + '" target="_blank" rel="noopener">' + IG_ICON + "@" + esc(D.marca.instagram) + "</a></div></div></section>";
  }

  function footer() {
    var n = D.marca.nome.toLowerCase();
    var marca = D.marca.logo
      ? '<img class="logo" src="' + esc(D.marca.logo) + '" alt="' + esc(D.marca.nome) + '" loading="lazy">'
      : "<b>" + esc(n.slice(0, 4)) + "<em>" + esc(n.slice(4)) + "</em></b><br>";
    return "<footer>" + marca + esc(D.marca.slogan) + " &middot; " + esc(D.marca.cidade) + "</footer>";
  }

  function bar() {
    return '<div class="bar"><div class="bar-in"><div class="sum"><div class="t" id="total">Monte seu pedido</div>' +
      '<div class="s" id="sub">Escolha sabor e tamanho no <b>+</b></div>' +
      '<button type="button" class="clear" id="clear" hidden>Limpar pedido</button></div>' +
      '<a class="go" id="go" href="https://wa.me/' + D.contato.whatsapp + '" target="_blank" rel="noopener">' + WA_ICON + "Pedir no WhatsApp</a></div></div>";
  }

  /* ---------- pedido ---------- */
  function render() {
    var lines = [], items = 0, sub = 0;
    allSabores().forEach(function (x) {
      sizes().forEach(function (s) {
        var q = cart[key(x.id, s)] || 0;
        if (!q || isOut(x, s)) return;
        var price = x.preco[s] * q;
        items += q; sub += price;
        lines.push("\u2022 " + q + "x " + (x.nomePedido || x.nome) + " (" + s + ") \u2013 " + brl(price));
      });
    });
    document.querySelectorAll(".step").forEach(function (el) {
      var q = cart[key(el.dataset.id, el.dataset.size)] || 0;
      el.querySelector(".q").textContent = q;
      el.querySelector(".minus").disabled = q === 0;
    });
    var total = document.getElementById("total"), s = document.getElementById("sub"),
        go = document.getElementById("go"), clr = document.getElementById("clear"), msg;
    if (items) {
      total.textContent = brl(sub + FEE);
      s.textContent = items + (items > 1 ? " itens" : " item") + " \u00b7 " + brl(sub) + " + entrega " + brl(FEE);
      clr.hidden = false;
      msg = "Ol\u00e1, " + D.marca.nome + "! Quero fazer um pedido:\n\n" + lines.join("\n") +
        "\n\nSubtotal: " + brl(sub) + "\nEntrega: " + brl(FEE) + "\nTotal: " + brl(sub + FEE) +
        "\n\nNome:\nEndere\u00e7o:\nDia da entrega:";
    } else {
      total.textContent = "Monte seu pedido";
      s.innerHTML = "Escolha sabor e tamanho no <b>+</b>";
      clr.hidden = true;
      msg = "Ol\u00e1, " + D.marca.nome + "! Vi o card\u00e1pio e quero fazer um pedido.";
    }
    go.href = "https://wa.me/" + D.contato.whatsapp + "?text=" + encodeURIComponent(msg);
  }

  function start() {
    document.getElementById("app").innerHTML = hero() + sizesBar() + '<main class="wrap">' + groups() + info() + "</main>" + footer() + bar();

    document.addEventListener("click", function (e) {
      var b = e.target.closest(".b");
      if (!b) return;
      var st = b.closest(".step"), k = key(st.dataset.id, st.dataset.size);
      var q = (cart[k] || 0) + (b.classList.contains("plus") ? 1 : -1);
      cart[k] = Math.max(0, Math.min(20, q));
      render();
    });
    document.getElementById("clear").addEventListener("click", function () { cart = {}; render(); });
    document.getElementById("copy-num").addEventListener("click", function (e) {
      var btn = e.currentTarget, txt = document.getElementById("whats-num").textContent;
      var done = function () { btn.textContent = "Copiado"; setTimeout(function () { btn.textContent = "Copiar"; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () {});
    });
    render();
  }

  start();
})();
