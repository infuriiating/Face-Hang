/**
 * hangmanGame.js — Core Hangman Game Logic
 * 
 * Pure game logic module with no DOM interaction.
 * Manages the game state: word tracking, guesses, win/lose conditions.
 * The HangmanGame class is the single source of truth for game state.
 */

export class HangmanGame {
  /**
   * @param {string} word — The target word (uppercase)
   * @param {string} hint — A hint for the word
   * @param {number} maxWrongGuesses — Maximum wrong guesses before losing (default: 6)
   */
  constructor(word, hint, maxWrongGuesses = 6) {
    this.word = word.toUpperCase();
    this.hint = hint;
    this.maxWrongGuesses = maxWrongGuesses;

    // Sets for tracking guessed letters
    this.correctGuesses = new Set();
    this.wrongGuesses = new Set();

    // Game state flags
    this._gameOver = false;
    this._won = false;
  }

  /**
   * Attempt to guess a letter.
   * 
   * @param {string} letter — A single uppercase letter (A-Z)
   * @returns {{ correct: boolean, alreadyGuessed: boolean, gameOver: boolean, won: boolean }}
   */
  guess(letter) {
    letter = letter.toUpperCase();

    // Check if already guessed
    if (this.correctGuesses.has(letter) || this.wrongGuesses.has(letter)) {
      return {
        correct: false,
        alreadyGuessed: true,
        gameOver: this._gameOver,
        won: this._won
      };
    }

    // Check if letter is in the word
    const correct = this.word.includes(letter);

    if (correct) {
      this.correctGuesses.add(letter);
    } else {
      this.wrongGuesses.add(letter);
    }

    // Check win condition: all unique letters in the word have been guessed
    const uniqueLetters = new Set(this.word.split(''));
    const allGuessed = [...uniqueLetters].every(l => this.correctGuesses.has(l));

    if (allGuessed) {
      this._gameOver = true;
      this._won = true;
    }

    // Check lose condition: too many wrong guesses
    if (this.wrongGuesses.size >= this.maxWrongGuesses) {
      this._gameOver = true;
      this._won = false;
    }

    return {
      correct,
      alreadyGuessed: false,
      gameOver: this._gameOver,
      won: this._won
    };
  }

  /**
   * Get the word display with underscores for unguessed letters.
   * Example: ['_', 'L', '_', 'O', 'R', 'I', 'T', 'H', 'M'] for "ALGORITHM"
   * 
   * @returns {string[]} — Array of characters or underscores
   */
  getDisplayWord() {
    return this.word.split('').map(letter =>
      this.correctGuesses.has(letter) ? letter : '_'
    );
  }

  /**
   * Get the full revealed word (used on game over).
   * @returns {string}
   */
  getWord() {
    return this.word;
  }

  /**
   * Get the hint for the current word.
   * @returns {string}
   */
  getHint() {
    return this.hint;
  }

  /**
   * Get the array of wrong guesses.
   * @returns {string[]}
   */
  getWrongGuesses() {
    return [...this.wrongGuesses];
  }

  /**
   * Get the array of correct guesses.
   * @returns {string[]}
   */
  getCorrectGuesses() {
    return [...this.correctGuesses];
  }

  /**
   * Get the set of all guessed letters (correct + wrong).
   * @returns {Set<string>}
   */
  getAllGuessedLetters() {
    return new Set([...this.correctGuesses, ...this.wrongGuesses]);
  }

  /**
   * Get the number of remaining wrong guesses.
   * @returns {number}
   */
  getRemainingGuesses() {
    return this.maxWrongGuesses - this.wrongGuesses.size;
  }

  /**
   * Get the hangman drawing progress (0 = empty, 6 = fully drawn / game over).
   * This maps directly to the 7 drawing stages:
   * 0: gallows only
   * 1: head
   * 2: body
   * 3: left arm
   * 4: right arm
   * 5: left leg
   * 6: right leg → dead
   * 
   * @returns {number} — 0 to maxWrongGuesses
   */
  getProgress() {
    return this.wrongGuesses.size;
  }

  /**
   * @returns {boolean} — Whether the game has ended
   */
  isGameOver() {
    return this._gameOver;
  }

  /**
   * @returns {boolean} — Whether the player won
   */
  hasWon() {
    return this._won;
  }
}
