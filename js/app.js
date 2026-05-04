/**
 * app.js — Main Controller / State Machine
 * 
 * Wires all modules together and manages the game flow:
 * LOADING → CALIBRATING → CATEGORY_SELECT → PLAYING → GAME_OVER → CATEGORY_SELECT
 */

import { CATEGORIES, getRandomWord, getCategoryKeys } from './wordBank.js';
import { HangmanGame } from './hangmanGame.js';
import { initCamera, initFaceLandmarker, startDetectionLoop, drawLandmarks } from './faceTracker.js';
import { GestureDetector } from './gestureDetector.js';
import { Calibration } from './calibration.js';
import * as UI from './uiRenderer.js';

// ── Application State ──
const State = {
  LOADING: 'LOADING',
  CALIBRATING: 'CALIBRATING',
  CATEGORY_SELECT: 'CATEGORY_SELECT',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

let currentState = State.LOADING;
let game = null;
let gestureDetector = null;
let calibration = null;
let activeKeyIndex = 0;           // Virtual keyboard cursor position (0-25)
let activeCategoryIndex = 0;      // Category selection cursor position
let categoryKeys = [];

// Score persistence
let score = loadScore();

// ── DOM Element References ──
const els = {};

/**
 * Initialize the application.
 */
async function init() {
  // Cache all DOM element references
  cacheElements();

  // Render initial score
  UI.renderScore(els.scoreContainer, score);

  // Show loading state
  updateStatusText('A carregar modelo IA...');

  // Always enable keyboard fallback (arrow keys + Enter)
  enableKeyboardFallback();

  let cameraReady = false;

  try {
    // 1. Initialize MediaPipe Face Landmarker
    await initFaceLandmarker();
    updateStatusText('Modelo carregado. A iniciar câmara...');

    // 2. Initialize webcam
    const video = els.video;
    await initCamera(video);
    updateStatusText('Câmara pronta.');
    cameraReady = true;

    // 3. Create gesture detector
    gestureDetector = new GestureDetector();
    gestureDetector.onGesture(handleGesture);

    // 4. Create calibration
    calibration = new Calibration({
      overlay: els.calibrationOverlay,
      stepText: els.calStepText,
      stepIcon: els.calStepIcon,
      progressDots: els.calProgressDots,
      skipBtn: els.calSkipBtn,
      statusRing: els.calStatusRing
    }, gestureDetector);

    // 5. Start face detection loop
    startDetectionLoop(video, onFaceResults);

    // 6. Start calibration
    currentState = State.CALIBRATING;
    calibration.start(() => {
      onCalibrationComplete();
    });

  } catch (err) {
    console.warn('Camera/AI init failed, falling back to keyboard mode:', err.message);

    // Hide calibration overlay and webcam PiP
    els.calibrationOverlay.style.display = 'none';
    document.querySelector('.webcam-pip').style.display = 'none';

    updateStatusText('⌨️ Modo teclado — Use as setas ← → para mover, Enter para selecionar');

    // Go straight to category select
    onCalibrationComplete();
  }
}

/**
 * Enable keyboard controls as a fallback (or for testing without webcam).
 * Arrow Left/Right = navigate, Enter/Space = select.
 */
function enableKeyboardFallback() {
  document.addEventListener('keydown', (e) => {
    if (currentState === State.CALIBRATING) return;

    let gestureType = null;

    switch (e.key) {
      case 'ArrowLeft':
        gestureType = 'TILT_LEFT';
        e.preventDefault();
        break;
      case 'ArrowRight':
        gestureType = 'TILT_RIGHT';
        e.preventDefault();
        break;
      case 'Enter':
      case ' ':
        gestureType = 'SELECT';
        e.preventDefault();
        break;
    }

    if (gestureType) {
      handleGesture({ type: gestureType });
    }
  });
}

/**
 * Cache all frequently-used DOM elements.
 */
function cacheElements() {
  els.video = document.getElementById('webcam-video');
  els.overlayCanvas = document.getElementById('webcam-overlay');
  els.hangmanCanvas = document.getElementById('hangman-canvas');
  els.wordContainer = document.getElementById('word-display');
  els.keyboardContainer = document.getElementById('keyboard');
  els.hintContainer = document.getElementById('hint-display');
  els.scoreContainer = document.getElementById('score-display');
  els.statusText = document.getElementById('status-text');
  els.debugContainer = document.getElementById('gesture-debug');
  els.remainingContainer = document.getElementById('remaining-guesses');
  els.categoryContainer = document.getElementById('category-select');
  els.categorySection = document.getElementById('category-section');
  els.gameSection = document.getElementById('game-section');
  els.gameOverOverlay = document.getElementById('game-over-overlay');

  // Calibration elements
  els.calibrationOverlay = document.getElementById('calibration-overlay');
  els.calStepText = document.getElementById('cal-step-text');
  els.calStepIcon = document.getElementById('cal-step-icon');
  els.calProgressDots = document.getElementById('cal-progress-dots');
  els.calSkipBtn = document.getElementById('cal-skip-btn');
  els.calStatusRing = document.getElementById('cal-status-ring');

  // Set canvas sizes
  els.overlayCanvas.width = 640;
  els.overlayCanvas.height = 480;
  els.hangmanCanvas.width = 300;
  els.hangmanCanvas.height = 300;
}

/**
 * Called every frame with MediaPipe face detection results.
 * Routes data to calibration or gesture detector based on state.
 */
function onFaceResults(results, timestamp) {
  const hasLandmarks = results.faceLandmarks && results.faceLandmarks.length > 0;

  // Draw landmarks on the webcam overlay canvas
  if (hasLandmarks) {
    const ctx = els.overlayCanvas.getContext('2d');
    drawLandmarks(ctx, els.overlayCanvas, results.faceLandmarks[0]);
  }

  // Get current values for calibration and gesture detection
  let rollAngle = 0;
  let jawOpen = 0;

  if (hasLandmarks) {
    // Calculate roll angle from landmarks (same logic as gestureDetector)
    const landmarks = results.faceLandmarks[0];
    const rightEye = landmarks[33];
    const leftEye = landmarks[263];
    rollAngle = Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x) * (180 / Math.PI);
  }

  if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
    const cats = results.faceBlendshapes[0].categories;
    const jaw = cats.find(s => s.categoryName === 'jawOpen');
    jawOpen = jaw ? jaw.score : 0;
  }

  // Route based on state
  if (currentState === State.CALIBRATING) {
    calibration.updateFrame(hasLandmarks, rollAngle, jawOpen);
  }

  if (hasLandmarks && results.faceBlendshapes) {
    gestureDetector.update(results.faceLandmarks[0], results.faceBlendshapes);
  }

  // Update debug display
  if (gestureDetector) {
    UI.updateGestureDebug(els.debugContainer, gestureDetector.getDebugInfo());
  }
}

/**
 * Called when calibration completes. Transition to category select.
 */
function onCalibrationComplete() {
  currentState = State.CATEGORY_SELECT;
  categoryKeys = getCategoryKeys();
  activeCategoryIndex = 0;
  showCategorySelect();
}

/**
 * Handle a gesture event from the GestureDetector.
 */
function handleGesture(event) {
  if (currentState === State.CALIBRATING) return;

  switch (currentState) {
    case State.CATEGORY_SELECT:
      handleCategoryGesture(event.type);
      break;
    case State.PLAYING:
      handlePlayingGesture(event.type);
      break;
    case State.GAME_OVER:
      handleGameOverGesture(event.type);
      break;
  }
}

// ── Category Select ──
function showCategorySelect() {
  els.categorySection.style.display = 'flex';
  els.gameSection.style.display = 'none';
  UI.hideGameOver(els.gameOverOverlay);
  UI.renderCategorySelect(els.categoryContainer, CATEGORIES, activeCategoryIndex, categoryKeys);
  updateStatusText('Incline a cabeça para a ESQUERDA/DIREITA para navegar. Abra a boca para selecionar.');
}

function handleCategoryGesture(type) {
  if (type === 'TILT_LEFT') {
    activeCategoryIndex = (activeCategoryIndex - 1 + categoryKeys.length) % categoryKeys.length;
    UI.renderCategorySelect(els.categoryContainer, CATEGORIES, activeCategoryIndex, categoryKeys);
  } else if (type === 'TILT_RIGHT') {
    activeCategoryIndex = (activeCategoryIndex + 1) % categoryKeys.length;
    UI.renderCategorySelect(els.categoryContainer, CATEGORIES, activeCategoryIndex, categoryKeys);
  } else if (type === 'SELECT' || type === 'BLINK_SELECT') {
    startGame(categoryKeys[activeCategoryIndex]);
  }
}

// ── Playing ──
function startGame(categoryKey) {
  const wordData = getRandomWord(categoryKey);
  game = new HangmanGame(wordData.word, wordData.hint);
  activeKeyIndex = 0;
  currentState = State.PLAYING;

  els.categorySection.style.display = 'none';
  els.gameSection.style.display = 'flex';

  renderGameState();
  updateStatusText('Incline a cabeça para a ESQUERDA/DIREITA para escolher uma letra. Abra a boca para tentar.');
}

function handlePlayingGesture(type) {
  if (type === 'TILT_LEFT') {
    activeKeyIndex = (activeKeyIndex - 1 + 26) % 26;
    renderGameState();
  } else if (type === 'TILT_RIGHT') {
    activeKeyIndex = (activeKeyIndex + 1) % 26;
    renderGameState();
  } else if (type === 'SELECT' || type === 'BLINK_SELECT') {
    const letter = String.fromCharCode(65 + activeKeyIndex); // A=65
    const result = game.guess(letter);

    if (!result.alreadyGuessed) {
      renderGameState();

      // Add visual feedback
      const keyEl = document.getElementById(`key-${letter}`);
      if (keyEl) {
        keyEl.classList.add(result.correct ? 'flash-correct' : 'flash-wrong');
        setTimeout(() => keyEl.classList.remove('flash-correct', 'flash-wrong'), 600);
      }

      if (result.gameOver) {
        currentState = State.GAME_OVER;
        // Update score
        if (result.won) {
          score.wins++;
          score.streak++;
        } else {
          score.losses++;
          score.streak = 0;
        }
        saveScore(score);
        UI.renderScore(els.scoreContainer, score);

        setTimeout(() => {
          UI.showGameOver(els.gameOverOverlay, result.won, game.getWord());
          updateStatusText('Abra a boca para jogar novamente.');
        }, 800);
      }
    }
  }
}

function renderGameState() {
  UI.renderHangman(els.hangmanCanvas, game.getProgress());
  UI.renderWord(els.wordContainer, game.getDisplayWord());
  UI.renderKeyboard(els.keyboardContainer, game.getAllGuessedLetters(), activeKeyIndex, game.correctGuesses);
  UI.renderHint(els.hintContainer, game.getHint());
  UI.renderRemainingGuesses(els.remainingContainer, game.getRemainingGuesses(), 6);
}

// ── Game Over ──
function handleGameOverGesture(type) {
  if (type === 'SELECT' || type === 'BLINK_SELECT') {
    UI.hideGameOver(els.gameOverOverlay);
    currentState = State.CATEGORY_SELECT;
    showCategorySelect();
  }
}

// ── Utilities ──
function updateStatusText(text) {
  if (els.statusText) els.statusText.textContent = text;
}

function loadScore() {
  try {
    const saved = localStorage.getItem('hangman_score');
    return saved ? JSON.parse(saved) : { wins: 0, losses: 0, streak: 0 };
  } catch {
    return { wins: 0, losses: 0, streak: 0 };
  }
}

function saveScore(s) {
  try {
    localStorage.setItem('hangman_score', JSON.stringify(s));
  } catch { /* ignore */ }
}

// ── Start ──
document.addEventListener('DOMContentLoaded', init);
