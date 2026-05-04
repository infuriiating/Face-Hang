/**
 * uiRenderer.js — Canvas Drawing, Keyboard, and DOM Updates
 * 
 * Handles all visual rendering: hangman stick figure on canvas,
 * virtual keyboard with highlight cursor, word display, score, and overlays.
 */

// ── Hangman Drawing Stages ──
// Stage 0: gallows only, Stage 1: head, Stage 2: body,
// Stage 3: left arm, Stage 4: right arm, Stage 5: left leg, Stage 6: right leg

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Draw the hangman figure progressively on a canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {number} stage — 0 to 6
 */
export function renderHangman(canvas, stage) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Scale factor for different canvas sizes
  const s = Math.min(w, h) / 300;

  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ── Gallows (always drawn) ──
  ctx.strokeStyle = '#8b7355'; // Wood color
  ctx.beginPath();
  // Base
  ctx.moveTo(40 * s, 260 * s);
  ctx.lineTo(160 * s, 260 * s);
  // Vertical pole
  ctx.moveTo(80 * s, 260 * s);
  ctx.lineTo(80 * s, 40 * s);
  // Horizontal beam
  ctx.lineTo(200 * s, 40 * s);
  // Rope
  ctx.lineTo(200 * s, 70 * s);
  ctx.stroke();

  // ── Body Parts (drawn based on stage) ──
  ctx.strokeStyle = '#1e293b'; // Dark blue for body
  ctx.fillStyle = '#1e293b';

  // Stage 1: Head
  if (stage >= 1) {
    ctx.beginPath();
    ctx.arc(200 * s, 90 * s, 20 * s, 0, Math.PI * 2);
    ctx.stroke();

    // Face expression changes as more parts are drawn
    if (stage < 5) {
      // Neutral/worried face
      // Eyes
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(193 * s, 86 * s, 2 * s, 0, Math.PI * 2);
      ctx.arc(207 * s, 86 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      // Mouth (neutral line)
      ctx.beginPath();
      ctx.moveTo(194 * s, 97 * s);
      ctx.lineTo(206 * s, 97 * s);
      ctx.stroke();
    } else {
      // Dead face (X eyes, frown)
      ctx.lineWidth = 2 * s;
      // X left eye
      ctx.beginPath();
      ctx.moveTo(190 * s, 83 * s); ctx.lineTo(196 * s, 89 * s);
      ctx.moveTo(196 * s, 83 * s); ctx.lineTo(190 * s, 89 * s);
      ctx.stroke();
      // X right eye
      ctx.beginPath();
      ctx.moveTo(204 * s, 83 * s); ctx.lineTo(210 * s, 89 * s);
      ctx.moveTo(210 * s, 83 * s); ctx.lineTo(204 * s, 89 * s);
      ctx.stroke();
      // Frown
      ctx.beginPath();
      ctx.arc(200 * s, 102 * s, 6 * s, Math.PI, 0);
      ctx.stroke();
      ctx.lineWidth = 3 * s;
    }
  }

  // Stage 2: Body
  if (stage >= 2) {
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(200 * s, 110 * s);
    ctx.lineTo(200 * s, 180 * s);
    ctx.stroke();
  }

  // Stage 3: Left arm
  if (stage >= 3) {
    ctx.beginPath();
    ctx.moveTo(200 * s, 130 * s);
    ctx.lineTo(170 * s, 160 * s);
    ctx.stroke();
  }

  // Stage 4: Right arm
  if (stage >= 4) {
    ctx.beginPath();
    ctx.moveTo(200 * s, 130 * s);
    ctx.lineTo(230 * s, 160 * s);
    ctx.stroke();
  }

  // Stage 5: Left leg
  if (stage >= 5) {
    ctx.beginPath();
    ctx.moveTo(200 * s, 180 * s);
    ctx.lineTo(170 * s, 220 * s);
    ctx.stroke();
  }

  // Stage 6: Right leg
  if (stage >= 6) {
    ctx.beginPath();
    ctx.moveTo(200 * s, 180 * s);
    ctx.lineTo(230 * s, 220 * s);
    ctx.stroke();
  }
}

/**
 * Render the virtual keyboard with highlighted active letter.
 * @param {HTMLElement} container — The keyboard container
 * @param {Set<string>} guessedLetters — Already guessed letters
 * @param {number} activeIndex — Currently highlighted letter index (0-25)
 * @param {Set<string>} correctLetters — Letters that were correct guesses
 */
export function renderKeyboard(container, guessedLetters, activeIndex, correctLetters) {
  // Only rebuild DOM if keyboard doesn't exist yet
  if (container.children.length !== 26) {
    container.innerHTML = '';
    ALPHABET.forEach((letter, i) => {
      const key = document.createElement('button');
      key.className = 'kb-key';
      key.dataset.letter = letter;
      key.dataset.index = i;
      key.textContent = letter;
      key.id = `key-${letter}`;
      container.appendChild(key);
    });
  }

  // Update states
  const keys = container.querySelectorAll('.kb-key');
  keys.forEach((key, i) => {
    const letter = key.dataset.letter;
    const isGuessed = guessedLetters.has(letter);
    const isCorrect = correctLetters.has(letter);
    const isActive = i === activeIndex;

    key.classList.toggle('active', isActive);
    key.classList.toggle('guessed', isGuessed);
    key.classList.toggle('correct', isGuessed && isCorrect);
    key.classList.toggle('wrong', isGuessed && !isCorrect);
    key.disabled = isGuessed;
  });

  // Scroll active key into view
  const activeKey = container.querySelector('.kb-key.active');
  if (activeKey) {
    activeKey.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
}

/**
 * Render the word display with underscores and revealed letters.
 * @param {HTMLElement} container — The word display container
 * @param {string[]} displayWord — Array like ['_', 'L', '_', 'O']
 */
export function renderWord(container, displayWord) {
  container.innerHTML = '';
  displayWord.forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'word-letter';
    span.textContent = char;
    span.dataset.index = i;
    if (char !== '_') {
      span.classList.add('revealed');
    }
    container.appendChild(span);
  });
}

/**
 * Render the score display.
 * @param {HTMLElement} container
 * @param {{ wins: number, losses: number, streak: number }} score
 */
export function renderScore(container, score) {
  container.innerHTML = `
    <div class="score-item">
      <span class="score-label">Vitórias</span>
      <span class="score-value win">${score.wins}</span>
    </div>
    <div class="score-item">
      <span class="score-label">Derrotas</span>
      <span class="score-value loss">${score.losses}</span>
    </div>
    <div class="score-item">
      <span class="score-label">Sequência</span>
      <span class="score-value streak">${score.streak}🔥</span>
    </div>
  `;
}

/**
 * Render the hint display.
 * @param {HTMLElement} container
 * @param {string} hint
 */
export function renderHint(container, hint) {
  container.textContent = `💡 Dica: ${hint}`;
}

/**
 * Show the game over overlay.
 * @param {HTMLElement} overlay
 * @param {boolean} won
 * @param {string} word — The full word
 */
export function showGameOver(overlay, won, word) {
  const title = overlay.querySelector('.go-title');
  const subtitle = overlay.querySelector('.go-subtitle');
  const wordDisplay = overlay.querySelector('.go-word');
  const instruction = overlay.querySelector('.go-instruction');

  title.textContent = won ? '🎉 Ganhaste!' : '💀 Fim do Jogo';
  subtitle.textContent = won ? 'Parabéns!' : 'Mais sorte na próxima!';
  wordDisplay.textContent = `A palavra era: ${word}`;
  instruction.textContent = 'Abra a boca para jogar novamente';

  overlay.classList.toggle('win', won);
  overlay.classList.toggle('lose', !won);
  overlay.classList.add('active');
}

/**
 * Hide the game over overlay.
 * @param {HTMLElement} overlay
 */
export function hideGameOver(overlay) {
  overlay.classList.remove('active', 'win', 'lose');
}

/**
 * Update the gesture debug info display.
 * @param {HTMLElement} container
 * @param {Object} debugInfo
 */
export function updateGestureDebug(container, debugInfo) {
  container.innerHTML = `
    <span>Inclinação: ${debugInfo.smoothedAngle.toFixed(1)}°</span>
    <span>Boca: ${(debugInfo.jawOpen * 100).toFixed(0)}%</span>
    <span>Piscar: E${(debugInfo.eyeBlinkLeft * 100).toFixed(0)}% D${(debugInfo.eyeBlinkRight * 100).toFixed(0)}%</span>
    <span class="gesture-badge">${debugInfo.currentGesture}</span>
  `;
}

/**
 * Render the category selection screen.
 * @param {HTMLElement} container
 * @param {Object} categories — The CATEGORIES object
 * @param {number} activeIndex — Currently highlighted category
 * @param {string[]} categoryKeys — Ordered category keys
 */
export function renderCategorySelect(container, categories, activeIndex, categoryKeys) {
  container.innerHTML = '';
  categoryKeys.forEach((key, i) => {
    const cat = categories[key];
    const card = document.createElement('div');
    card.className = `cat-card ${i === activeIndex ? 'active' : ''}`;
    card.dataset.category = key;
    card.innerHTML = `
      <span class="cat-icon">${cat.icon}</span>
      <span class="cat-label">${cat.label}</span>
      <span class="cat-count">${cat.words.length} palavras</span>
    `;
    container.appendChild(card);
  });
}

/**
 * Update remaining guesses display.
 * @param {HTMLElement} container
 * @param {number} remaining
 * @param {number} max
 */
export function renderRemainingGuesses(container, remaining, max) {
  container.innerHTML = '';
  for (let i = 0; i < max; i++) {
    const heart = document.createElement('span');
    heart.className = `heart ${i < remaining ? 'alive' : 'dead'}`;
    heart.textContent = i < remaining ? '❤️' : '🖤';
    container.appendChild(heart);
  }
}
