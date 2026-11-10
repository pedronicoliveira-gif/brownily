/* ============================================================
   BROWNILY — TUDO O QUE MUDA NO CARDÁPIO FICA NESTE ARQUIVO
   O site, as imagens, o PDF e o QR Code leem daqui.

   Para mudar algo, peça ao Claude. Exemplos:
     "esgota o maracujá M hoje"
     "muda o preço do Ninho P para 45"
     "desliga o selo de fim de ano"

   Linhas marcadas com CONFIRMAR são textos provisórios
   que o Pedro ainda precisa revisar.
   ============================================================ */

const DADOS = {

  /* ---------- Marca ---------- */
  marca: {
    nome: "Brownily",
    slogan: "Brownies & Co.",
    cidade: "Tupã-SP",
    instagram: "_brownily",
    // Quando a logo PNG estiver na pasta, troque null por "logo.png".
    logo: null,                                                      // CONFIRMAR (aguardando a logo)
  },

  /* ---------- Endereço do site (usado no QR Code) ---------- */
  site: {
    url: "https://pedronicoliveira-gif.github.io/brownily/",
  },

  /* ---------- Contato e entrega ---------- */
  contato: {
    whatsapp: "5514997148835",           // só números, com 55 + DDD
    whatsappTexto: "(14) 99714-8835",    // como aparece escrito
  },
  entrega: {
    taxa: 5,                             // taxa de entrega em Tupã (R$)
  },

  /* ---------- Capa ---------- */
  capa: {
    // Selo da capa. Para desligar depois de janeiro: ativo: false
    selo: { ativo: true, texto: "Especial de fim de ano" },
    titulo: "BrownieTone",
    destaque: "trufado",
    frase: "Brownie alto e recheado, feito à mão. Escolha o sabor, o tamanho e peça direto pelo WhatsApp.", // CONFIRMAR
    foto: "fotos/brigadeiro.jpg",
    fotoDescricao: "BrownieTone de brigadeiro em caixa de presente com laço vermelho",
  },

  /* ---------- Tamanhos ---------- */
  tamanhos: {
    P: "aprox. 250g",
    M: "aprox. 600g",
  },

  /* ---------- Cardápio ----------
     esgotado: []          → disponível
     esgotado: ["M"]       → só o tamanho M esgotado
     esgotado: ["P", "M"]  → sabor inteiro esgotado
     foto: null            → mostra um cartão com o nome (sem foto)
  ---------------------------------- */
  grupos: [
    {
      id: "trufados",
      titulo: "Trufados",
      subtitulo: "Toque no + pra montar seu pedido.",
      sabores: [
        {
          id: "brigadeiro",
          nome: "Brigadeiro",
          descricao: "Recheado e coberto com brigadeiro de chocolate.",          // CONFIRMAR
          foto: "fotos/brigadeiro.jpg",
          fotoDescricao: "BrownieTone de brigadeiro na caixa com laço vermelho",
          destaque: null,
          preco: { P: 30, M: 60 },
          esgotado: [],
        },
        {
          id: "ninho-nutella",
          nome: "Ninho com Nutella",
          descricao: "Brigadeiro de leite Ninho com Nutella.",                    // CONFIRMAR
          foto: "fotos/ninho.jpg",
          fotoDescricao: "BrownieTone de Ninho com Nutella na caixa com laço vermelho",
          destaque: "Especial",
          preco: { P: 40, M: 70 },
          esgotado: [],
        },
        {
          id: "maracuja",
          nome: "Maracujá",
          descricao: "Recheio cremoso de brigadeiro de maracujá.",                // CONFIRMAR
          foto: "fotos/maracuja.jpg",
          fotoDescricao: "BrownieTone de maracujá cortado ao meio mostrando o recheio",
          destaque: null,
          preco: { P: 30, M: 60 },
          esgotado: [],
        },
        {
          id: "leite-em-po",
          nome: "Leite em pó",
          descricao: "Recheio de brigadeiro de leite em pó.",                     // CONFIRMAR
          foto: null,
          cartao: "leite",
          destaque: null,
          preco: { P: 30, M: 60 },
          esgotado: [],
        },
        {
          id: "doce-de-leite",
          nome: "Doce de leite",
          descricao: "Recheio de doce de leite.",                                 // CONFIRMAR
          foto: null,
          cartao: "doce",
          destaque: null,
          preco: { P: 30, M: 60 },
          esgotado: [],
        },
      ],
    },
    {
      id: "sem-recheio",
      titulo: "Sem recheio",
      subtitulo: "",
      sabores: [
        {
          id: "tradicional",
          nome: "Tradicional",
          nomePedido: "Tradicional (sem recheio)",
          descricao: "A massa do BrownieTone, sem recheio. Casquinha por fora, úmido por dentro.", // CONFIRMAR
          foto: "fotos/tradicional.jpg",
          fotoDescricao: "BrownieTone tradicional aberto mostrando a massa",
          destaque: null,
          preco: { P: 25, M: 50 },
          esgotado: [],
        },
      ],
    },
  ],

  /* ---------- Como funciona ----------
     icone: calendario | cartao | entrega  */
  regras: [
    { icone: "calendario", titulo: "Encomende antes",        texto: "Pedidos com 1 a 2 dias de antecedência." },
    { icone: "cartao",     titulo: "Pix, dinheiro ou cartão", texto: "Sem sinal: o valor é pago de uma vez." },
    { icone: "entrega",    titulo: "Entregamos em Tupã",      texto: "Taxa de entrega de R$ {taxa}." },   // {taxa} vira o valor de entrega acima
  ],

  /* ---------- Textos do final da página ---------- */
  contatoTitulo: "Bateu vontade?",
  contatoDestaque: "Chama a gente.",
  contatoTexto: "Produção artesanal, com ingredientes selecionados.",              // CONFIRMAR
};

// Permite que os scripts de geração (Node) leiam este mesmo arquivo.
if (typeof module !== "undefined") module.exports = DADOS;
