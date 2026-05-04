/**
 * wordBank.js — Banco de Palavras e Categorias
 * 
 * Este módulo armazena todas as palavras organizadas por categorias educativas.
 * Cada categoria contém palavras com dicas opcionais para ajudar o jogador.
 * A função getRandomWord() faz a seleção aleatória evitando repetições imediatas.
 */

// ============================================================
// Categorias de palavras — cada uma com ícone, nome e lista
// ============================================================
export const CATEGORIES = {
  programacao: {
    icon: '💻',
    label: 'Programação',
    words: [
      { word: 'ALGORITMO', hint: 'Procedimento passo a passo para resolver um problema' },
      { word: 'VARIAVEL', hint: 'Armazena dados na memória para uso posterior' },
      { word: 'FUNCAO', hint: 'Bloco de código reutilizável que executa uma tarefa' },
      { word: 'COMPILADOR', hint: 'Traduz código-fonte em código de máquina' },
      { word: 'BOOLEANO', hint: 'Tipo de dado com apenas dois valores: verdadeiro ou falso' },
      { word: 'MATRIZ', hint: 'Coleção ordenada de elementos do mesmo tipo' },
      { word: 'OBJETO', hint: 'Estrutura de dados com propriedades e métodos' },
      { word: 'CLASSE', hint: 'Modelo para criar objetos em programação' },
      { word: 'MODULO', hint: 'Unidade de código independente e reutilizável' },
      { word: 'SERVIDOR', hint: 'Computador que fornece serviços a outros computadores' },
      { word: 'PROGRAMA', hint: 'Conjunto de instruções executadas por um computador' },
      { word: 'DEPURAR', hint: 'Processo de encontrar e corrigir erros no código' },
      { word: 'SINTAXE', hint: 'Regras que definem a estrutura correta do código' },
      { word: 'BINARIO', hint: 'Sistema numérico com apenas 0 e 1' },
      { word: 'CICLO', hint: 'Estrutura que repete um bloco de código várias vezes' },
      { word: 'HERANCA', hint: 'Mecanismo onde uma classe herda atributos de outra' },
      { word: 'PILHA', hint: 'Estrutura de dados do tipo último a entrar, primeiro a sair' },
      { word: 'REDE', hint: 'Conjunto de computadores interligados' },
      { word: 'INTERFACE', hint: 'Ponto de interação entre o utilizador e o sistema' },
      { word: 'TERMINAL', hint: 'Aplicação para executar comandos de texto no sistema' },
    ]
  },

  animais: {
    icon: '🐾',
    label: 'Animais',
    words: [
      { word: 'ELEFANTE', hint: 'O maior animal terrestre com uma tromba longa' },
      { word: 'GOLFINHO', hint: 'Mamífero marinho muito inteligente' },
      { word: 'BORBOLETA', hint: 'Inseto com asas coloridas que passa por metamorfose' },
      { word: 'CROCODILO', hint: 'Réptil grande que vive em rios e pântanos' },
      { word: 'PINGUIM', hint: 'Ave que não voa e vive em climas frios' },
      { word: 'CAMALEAO', hint: 'Réptil que muda de cor para se camuflar' },
      { word: 'TARTARUGA', hint: 'Animal com carapaça que se move lentamente' },
      { word: 'PAPAGAIO', hint: 'Ave colorida que pode imitar a fala humana' },
      { word: 'TUBARAO', hint: 'Grande predador dos oceanos' },
      { word: 'CAVALO', hint: 'Animal domesticado usado para montaria' },
      { word: 'CORUJA', hint: 'Ave noturna com grandes olhos e visão aguçada' },
      { word: 'JAGUAR', hint: 'Grande felino da América do Sul com manchas na pele' },
      { word: 'FLAMINGO', hint: 'Ave de pernas longas e plumagem rosa' },
      { word: 'POLVO', hint: 'Molusco marinho com oito tentáculos' },
      { word: 'MORCEGO', hint: 'Único mamífero capaz de voar' },
      { word: 'CANGURU', hint: 'Marsupial australiano que salta com as patas traseiras' },
      { word: 'ARANHA', hint: 'Aracnídeo que tece teias para capturar presas' },
      { word: 'BALEIA', hint: 'O maior animal do planeta, vive nos oceanos' },
      { word: 'LEOPARDO', hint: 'Felino ágil com manchas escuras na pelagem' },
      { word: 'RAPOSA', hint: 'Animal astuto da família dos canídeos' },
    ]
  },

  frutas: {
    icon: '🍎',
    label: 'Frutas',
    words: [
      { word: 'MORANGO', hint: 'Fruta vermelha pequena com sementes na superfície' },
      { word: 'ABACAXI', hint: 'Fruta tropical com coroa de folhas e casca espinhosa' },
      { word: 'MELANCIA', hint: 'Fruta grande e verde por fora, vermelha por dentro' },
      { word: 'LARANJA', hint: 'Fruta cítrica rica em vitamina C' },
      { word: 'BANANA', hint: 'Fruta amarela que cresce em cachos' },
      { word: 'CEREJA', hint: 'Fruta pequena e redonda, vermelha e doce' },
      { word: 'MARACUJA', hint: 'Fruta tropical usada para fazer sumo relaxante' },
      { word: 'FRAMBOESA', hint: 'Fruta vermelha pequena parecida com a amora' },
      { word: 'MANGA', hint: 'Fruta tropical doce e suculenta de polpa amarela' },
      { word: 'PESSEGO', hint: 'Fruta aveludada com caroço no centro' },
      { word: 'KIWI', hint: 'Fruta peluda por fora e verde por dentro' },
      { word: 'AMORA', hint: 'Fruta escura que cresce em arbustos espinhosos' },
      { word: 'ROMÃ', hint: 'Fruta com muitas sementes vermelhas no interior' },
      { word: 'GOIABA', hint: 'Fruta tropical com polpa rosa ou branca' },
      { word: 'LIMAO', hint: 'Fruta cítrica ácida de cor verde ou amarela' },
      { word: 'FIGO', hint: 'Fruta doce e macia, comum no Mediterrâneo' },
      { word: 'COCO', hint: 'Fruta tropical com casca dura e água no interior' },
      { word: 'MIRTILO', hint: 'Fruta pequena azul-escura rica em antioxidantes' },
      { word: 'PAPAIA', hint: 'Fruta tropical com polpa alaranjada e sementes pretas' },
      { word: 'TANGERINA', hint: 'Cítrico fácil de descascar, parecido com a laranja' },
    ]
  },

  ciencias: {
    icon: '🔬',
    label: 'Ciências',
    words: [
      { word: 'MOLECULA', hint: 'Grupo de átomos ligados entre si' },
      { word: 'GRAVIDADE', hint: 'Força que atrai objetos uns para os outros' },
      { word: 'EVOLUCAO', hint: 'Mudança gradual das espécies ao longo do tempo' },
      { word: 'ELETRAO', hint: 'Partícula subatómica com carga negativa' },
      { word: 'NUCLEO', hint: 'Parte central de um átomo ou célula' },
      { word: 'ORGANISMO', hint: 'Ser vivo, como um animal ou uma planta' },
      { word: 'VELOCIDADE', hint: 'Rapidez de algo numa direção específica' },
      { word: 'CROMOSSOMA', hint: 'Estrutura de ADN que transporta informação genética' },
      { word: 'NEUTRÃO', hint: 'Partícula subatómica sem carga elétrica' },
      { word: 'ENTROPIA', hint: 'Medida de desordem num sistema' },
      { word: 'OSMOSE', hint: 'Movimento de água através de uma membrana' },
      { word: 'ESPECTRO', hint: 'Faixa de cores produzida pela separação da luz' },
      { word: 'ISOTOPO', hint: 'Átomos do mesmo elemento com neutrões diferentes' },
      { word: 'POLIMERO', hint: 'Molécula grande feita de unidades repetidas' },
      { word: 'MITOSE', hint: 'Divisão celular que produz duas células idênticas' },
      { word: 'HABITAT', hint: 'Ambiente natural onde vive um organismo' },
      { word: 'ELEMENTO', hint: 'Substância pura feita de um tipo de átomo' },
      { word: 'CELULA', hint: 'Unidade básica de todos os seres vivos' },
      { word: 'ATOMO', hint: 'A menor unidade de um elemento químico' },
      { word: 'PLANETA', hint: 'Corpo celeste que orbita uma estrela' },
    ]
  },

  geografia: {
    icon: '🌍',
    label: 'Geografia',
    words: [
      { word: 'CONTINENTE', hint: 'Grande massa de terra, como Europa ou África' },
      { word: 'OCEANO', hint: 'Vasta extensão de água salgada que cobre a Terra' },
      { word: 'VULCAO', hint: 'Montanha que pode expelir lava e cinzas' },
      { word: 'DESERTO', hint: 'Região árida com pouca precipitação' },
      { word: 'FLORESTA', hint: 'Área densa coberta de árvores e vegetação' },
      { word: 'GLACIAR', hint: 'Grande massa de gelo que se move lentamente' },
      { word: 'PENINSULA', hint: 'Porção de terra rodeada de água em três lados' },
      { word: 'FRONTEIRA', hint: 'Linha que separa dois países ou regiões' },
      { word: 'MONTANHA', hint: 'Elevação natural do terreno de grande altitude' },
      { word: 'EQUADOR', hint: 'Linha imaginária que divide a Terra em dois hemisférios' },
      { word: 'CAPITAL', hint: 'Cidade principal de um país ou região' },
      { word: 'LATITUDE', hint: 'Coordenada que mede a distância ao equador' },
      { word: 'TROPICAL', hint: 'Relativo à zona quente entre os trópicos' },
      { word: 'ARQUIPELAGO', hint: 'Conjunto de ilhas agrupadas no mar' },
      { word: 'LITORAL', hint: 'Faixa de terra junto ao mar' },
      { word: 'PLANALTO', hint: 'Área elevada e relativamente plana' },
      { word: 'HEMISFERIO', hint: 'Metade da esfera terrestre' },
      { word: 'MERIDIANO', hint: 'Linha imaginária que vai de polo a polo' },
      { word: 'ESTREITO', hint: 'Passagem de água entre duas porções de terra' },
      { word: 'CASCATA', hint: 'Queda de água de grande altura num rio' },
    ]
  }
};

// Rastrear a última palavra selecionada por categoria para evitar repetições
const _lastSelected = {};

/**
 * Obter uma palavra aleatória de uma categoria específica.
 * Evita repetir a mesma palavra duas vezes seguidas.
 * 
 * @param {string} categoryKey — Uma das chaves: 'programacao', 'animais', 'frutas', 'ciencias', 'geografia'
 * @returns {{ word: string, hint: string, category: string }} — Os dados da palavra selecionada
 */
export function getRandomWord(categoryKey) {
  const category = CATEGORIES[categoryKey];
  if (!category) {
    throw new Error(`Categoria desconhecida: ${categoryKey}`);
  }

  const words = category.words;
  let selected;

  // Continuar a escolher até obter uma palavra diferente da última
  do {
    selected = words[Math.floor(Math.random() * words.length)];
  } while (selected.word === _lastSelected[categoryKey] && words.length > 1);

  _lastSelected[categoryKey] = selected.word;

  return {
    word: selected.word,
    hint: selected.hint,
    category: categoryKey
  };
}

/**
 * Obter um array com todas as chaves de categorias disponíveis.
 * @returns {string[]}
 */
export function getCategoryKeys() {
  return Object.keys(CATEGORIES);
}
