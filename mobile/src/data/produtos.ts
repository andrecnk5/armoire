import type { ImageSourcePropType } from 'react-native';

// Dados locais para demonstração, preservados da versão web estabilizada.
// Fonte: main@4c0a057 / front-end/js/produtos-data.js. Sem consulta a estoque ou backend.
export type Produto = {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  descricao: string;
  composicao: readonly string[];
  tamanhos: readonly string[];
  cores: readonly { nome: string; codigo: string }[];
  imagens: readonly ImageSourcePropType[];
};

export const produtos: readonly Produto[] = [
  {
    id: "black-hat",
    nome: "Black Hat",
    categoria: "Bonés",
    preco: 89.99,
    descricao: "Boné premium desenvolvido para homens que valorizam estilo, conforto e acabamento refinado. Produzido em tecido resistente e modelagem exclusiva Armoire Central.",
    composicao: ["100% Algodão", "Aba Curva", "Modelagem Premium", "Logo Bordado"],
    tamanhos: ["Único"],
    cores: [{"nome": "Preto", "codigo": "#111111"}],
    imagens: [
      require('@/assets/images/armoire/produtos/black-hat/frente.png'),
    ],
  },
  {
    id: "armoire-hat",
    nome: "Armoire Hat",
    categoria: "Bonés",
    preco: 89.99,
    descricao: "Boné exclusivo Armoire Central produzido em algodão premium.",
    composicao: ["100% Algodão", "Logo Bordado"],
    tamanhos: ["Único"],
    cores: [{"nome": "Azul Marinho", "codigo": "#1D3557"}],
    imagens: [
      require('@/assets/images/armoire/produtos/armoire-hat/frente.png'),
    ],
  },
  {
    id: "sueterp-frente",
    nome: "Suéter Essential",
    categoria: "agasalhos",
    preco: 139.99,
    descricao: "Suéter desenvolvido para oferecer conforto térmico sem abrir mão da elegância.",
    composicao: ["85% Algodão", "15% Poliéster"],
    tamanhos: ["P", "M", "G", "GG"],
    cores: [{"nome": "Off-White", "codigo": "#F5F1E8"}],
    imagens: [
      require('@/assets/images/armoire/produtos/sueterp/frente.png'),
    ],
  },
  {
    id: "polarblum-frente",
    nome: "PolarBlum",
    categoria: "Coleção Especial",
    preco: 159.99,
    descricao: "Modelo exclusivo da coleção especial PolarBlum.",
    composicao: ["Moletom Premium", "Interior Flanelado"],
    tamanhos: ["P", "M", "G", "GG"],
    cores: [{"nome": "Branco", "codigo": "#FFFFFF"}],
    imagens: [
      require('@/assets/images/armoire/produtos/polarblum/frente.png'),
      require('@/assets/images/armoire/produtos/polarblum/costas.png'),
    ],
  },
  {
    id: "france-ac",
    nome: "France AC",
    categoria: "Coleção França",
    preco: 139.99,
    descricao: "Peça inspirada no estilo francês, combinando minimalismo e sofisticação.",
    composicao: ["100% Algodão"],
    tamanhos: ["Único"],
    cores: [{"nome": "Cinza", "codigo": "#8A8A8A"}],
    imagens: [
      require('@/assets/images/armoire/produtos/france-ac/frente.png'),
    ],
  },
  {
    id: "fleece-frente",
    nome: "Fleece",
    categoria: "Moletom",
    preco: 139.99,
    descricao: "Moletom desenvolvido para máximo conforto e aquecimento.",
    composicao: ["Algodão Premium", "Interior Flanelado"],
    tamanhos: ["P", "M", "G", "GG"],
    cores: [{"nome": "Preto", "codigo": "#111111"}],
    imagens: [
      require('@/assets/images/armoire/produtos/fleece/frente.png'),
      require('@/assets/images/armoire/produtos/fleece/esquerda.png'),
      require('@/assets/images/armoire/produtos/fleece/costas.png'),
    ],
  },
  {
    id: "riskbaltic",
    nome: "BALTIC AC",
    categoria: "Agasalho",
    preco: 159.99,
    descricao: "Elegância e conforto em uma unica peça.",
    composicao: ["Algodão Premium", "Interior Flanelado"],
    tamanhos: ["P", "M", "G", "GG"],
    cores: [{"nome": "Azul Marinho", "codigo": "#0b1f3a"}, {"nome": "Branco", "codigo": "#FFFFFF"}],
    imagens: [
      require('@/assets/images/armoire/produtos/baltic/frente.png'),
    ],
  },
  {
    id: "lumierecalca",
    nome: "FLEECE LUMIÉRE",
    categoria: "Calça",
    preco: 169.99,
    descricao: "Calça Fleece Lumiére desenvolvida para oferecer elegância, conforto e praticidade.",
    composicao: ["Algodão Premium", "Interior Flanelado"],
    tamanhos: ["P", "M", "G", "GG"],
    cores: [{"nome": "Preto", "codigo": "#111111"}],
    imagens: [
      require('@/assets/images/armoire/produtos/lumierecalca/frente.png'),
    ],
  },
  {
    id: "lumiere",
    nome: "FLEECE LUMIÉRE",
    categoria: "Agasalho",
    preco: 209.99,
    descricao: "Elegância e conforto em uma unica peça.",
    composicao: ["Algodão Premium", "Interior Flanelado"],
    tamanhos: ["P", "M", "G", "GG"],
    cores: [{"nome": "Preto", "codigo": "#111111"}],
    imagens: [
      require('@/assets/images/armoire/produtos/lumiere/frente.png'),
    ],
  },
  {
    id: "lumiereberm",
    nome: "FLEECE LUMIÉRE",
    categoria: "Bermuda",
    preco: 139.99,
    descricao: "Bermuda Fleece Lumiére desenvolvida para oferecer elegância e conforto.",
    composicao: ["Algodão Premium", "Interior Flanelado"],
    tamanhos: ["P", "M", "G", "GG"],
    cores: [{"nome": "Preto", "codigo": "#111111"}],
    imagens: [
      require('@/assets/images/armoire/produtos/lumiereberm/frente.png'),
    ],
  },
  {
    id: "lemontee",
    nome: "LEMONTEE AC",
    categoria: "Camiseta",
    preco: 119.99,
    descricao: "Camiseta Lemontee AC desenvolvida com foco em conforto, qualidade e estilo.",
    composicao: ["Algodão Premium"],
    tamanhos: ["P", "M", "G", "GG"],
    cores: [{"nome": "Preto", "codigo": "#111111"}],
    imagens: [
      require('@/assets/images/armoire/produtos/lemontee/frente.png'),
    ],
  },
];

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarPreco(preco: number) {
  return moeda.format(preco);
}
