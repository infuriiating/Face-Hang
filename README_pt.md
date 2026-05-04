# 🎮 FACEHANG — Jogo da Forca sem Mãos

> Um jogo da forca baseado na web, controlado inteiramente por gestos faciais utilizando Visão Computacional com Inteligência Artificial. Não é necessário teclado, rato ou toque! Totalmente em português.

[Read in English](README.md)

## 🧠 Como Funciona

Este jogo utiliza o **MediaPipe Face Landmarker** (IA da Google) para detetar **478 pontos faciais** em tempo real através da sua webcam. O sistema interpreta movimentos da cabeça e expressões faciais como controlos do jogo:

| Gesto | Ação |
|---------|--------|
| 🔄 Inclinar cabeça à **ESQUERDA** | Move o cursor para a esquerda no teclado virtual |
| 🔄 Inclinar cabeça à **DIREITA** | Move o cursor para a direita no teclado virtual |
| 👄 **Abrir a boca** | Seleciona a letra destacada |
| 😑 **Piscar longo** (~1 segundo) | Seleção alternativa |

### O que faz o "Piscar Longo"?
O **Piscar Longo** é uma funcionalidade de acessibilidade que serve como alternativa a abrir a boca. Se não puder ou preferir não usar o gesto da boca, pode simplesmente fechar ambos os olhos durante cerca de 800 milissegundos. O jogo utiliza as métricas `eyeBlinkLeft` e `eyeBlinkRight` e requer que ambas estejam fechadas em simultâneo durante um período sustentado para distinguir uma seleção intencional de um piscar de olhos natural ou rápido.

### Detalhes da Deteção de IA

- **Navegação por Inclinação**: Calculada a partir do ângulo de rotação entre os cantos dos olhos. O jogo possui **Navegação Acelerada**: se mantiver a cabeça inclinada, o cursor irá mover-se cada vez mais depressa, permitindo percorrer o teclado rapidamente!
- **Boca Aberta**: Utiliza a métrica `jawOpen`. Tem de exceder o limite durante 500ms para evitar seleções acidentais (ex: enquanto fala ou boceja).
- **Anti-spam (Debouncing)**: Todos os gestos usam temporizadores e tempos de recarga para evitar duplos cliques acidentais.

## 🚀 Como Começar

### Pré-requisitos
- Um navegador web moderno (**Chrome 90+** ou **Edge 90+** recomendado)
- Uma **webcam**
- Um **servidor HTTP local** (Os ES Modules requerem HTTP, e não o protocolo `file://`)

### Instalação

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/SEU_UTILIZADOR/jogo_da_forca_V2.git
   cd jogo_da_forca_V2
   ```

2. **Iniciar um servidor local** (escolha um):

   **Node.js (npx) (Recomendado):**
   ```bash
   npx serve .
   ```

   **Python:**
   ```bash
   python -m http.server 8000
   ```

   **VS Code:**
   Instale a extensão "Live Server" → Clique com o botão direito em `index.html` → "Open with Live Server"

3. **Abrir no navegador:**
   ```
   http://localhost:3000
   ```

4. **Permitir acesso à câmara** quando solicitado e seguir os passos de calibração.

## 🎯 Fluxo e Funcionalidades do Jogo

1. **Calibração** — O sistema guia-o através de um teste de deteção de rosto, posição neutra, inclinações e gesto da boca.
2. **Seleção de Categoria** — Escolha entre 5 categorias: *Programação*, *Animais*, *Frutas*, *Ciências* e *Geografia*.
3. **Jogar** — Navegue no teclado virtual inclinando a cabeça e selecione as letras abrindo a boca ou piscando demoradamente.
4. **Fim do Jogo** — Veja o seu resultado, pontuação contínua e abra a boca para jogar novamente.
5. **Modo Teclado (Fallback)** — Se não tiver webcam, pode jogar usando as setas Esquerda/Direita e a tecla Enter!

## 📁 Estrutura do Projeto

```
jogo_da_forca_V2/
├── index.html              # Ponto de entrada principal
├── css/
│   └── styles.css          # Tema auto-ajustável Claro/Escuro
├── js/
│   ├── app.js              # Controlador principal (máquina de estados)
│   ├── faceTracker.js      # Iniciação do MediaPipe e loop de vídeo
│   ├── gestureDetector.js  # Interpretação dos pontos faciais em gestos
│   ├── hangmanGame.js      # Lógica base do jogo (palpites, pontuação)
│   ├── wordBank.js         # Categorias e seleção aleatória de palavras
│   ├── uiRenderer.js       # Atualizações DOM, desenho na canvas
│   └── calibration.js      # Sobreposição de calibração
├── assets/
│   └── icon.png            # Ícone do FACEHANG
└── README.md               # Documentação (Inglês)
```

## 🛠️ Tecnologias Utilizadas

- **HTML5** + **CSS3** + **Vanilla JavaScript** (ES Modules)
- **MediaPipe Face Landmarker** (IA da Google)
- **Sem ferramentas de build (build tools)** — corre diretamente no navegador
- **Sem dependências npm pesadas** — totalmente independente

## 🎨 Design

- **Temas Modernos**: Alterna automaticamente entre um elegante Modo Claro (Light Theme) e Modo Escuro (Dark Theme) com base nas preferências do seu sistema.
- Painéis em *Glassmorphism* (efeito de vidro) com bordos subtis.
- Animações suaves (efeitos de pulsação, saltos ao revelar letras, tremores em palpites errados).
- Layout responsivo que cabe num único ecrã sem necessidade de fazer *scroll*.
- Sobreposição em tempo real da malha facial (Picture-in-Picture) sobre o vídeo da webcam.

## 📝 Licença

Licença MIT — veja [LICENSE](LICENSE) para mais detalhes.


