/**
 * calibration.js — Calibration Overlay Flow
 * Guides the user through calibration before the game starts.
 */

export class Calibration {
  constructor(elements, gestureDetector) {
    this.elements = elements;
    this.gestureDetector = gestureDetector;
    this.currentStep = 0;
    this.totalSteps = 7;
    this._onComplete = null;
    this._neutralReadings = [];
    this._stepPassed = false;

    this.steps = [
      { icon: '📸', text: 'A iniciar câmara...', autoAdvance: true },
      { icon: '👤', text: "Olhe para a câmara. A detetar o seu rosto...", autoAdvance: false },
      { icon: '🎯', text: 'Olhe em frente e fique quieto...', autoAdvance: false },
      { icon: '⬅️', text: 'Incline a cabeça para a ESQUERDA', autoAdvance: false },
      { icon: '➡️', text: 'Incline a cabeça para a DIREITA', autoAdvance: false },
      { icon: '👄', text: 'Abra BEM a boca', autoAdvance: false },
      { icon: '🎮', text: "Tudo pronto! A iniciar o jogo...", autoAdvance: true }
    ];

    this.elements.skipBtn.addEventListener('click', () => this.complete());
  }

  start(onComplete) {
    this._onComplete = onComplete;
    this.currentStep = 0;
    this.elements.overlay.classList.add('active');
    this._renderProgressDots();
    this._showStep(0);
  }

  updateFrame(hasFace, rollAngle, jawOpen) {
    if (hasFace) {
      this.elements.statusRing.classList.add('detected');
      this.elements.statusRing.classList.remove('not-detected');
    } else {
      this.elements.statusRing.classList.add('not-detected');
      this.elements.statusRing.classList.remove('detected');
    }

    switch (this.currentStep) {
      case 1:
        if (hasFace && !this._stepPassed) {
          this._stepPassed = true;
          this.elements.stepText.textContent = '✅ Rosto detetado!';
          setTimeout(() => this._advanceStep(), 1000);
        }
        break;
      case 2:
        if (hasFace) {
          this._neutralReadings.push(rollAngle);
          if (this._neutralReadings.length >= 30 && !this._stepPassed) {
            const avg = this._neutralReadings.reduce((a, b) => a + b, 0) / this._neutralReadings.length;
            this.gestureDetector.setNeutralRoll(avg);
            this._stepPassed = true;
            this.elements.stepText.textContent = '✅ Posição neutra capturada!';
            setTimeout(() => this._advanceStep(), 1000);
          }
        }
        break;
      case 3:
        if (hasFace && !this._stepPassed) {
          const adj = rollAngle - this.gestureDetector._neutralRoll;
          if (adj > this.gestureDetector.tiltThreshold) {
            this._stepPassed = true;
            this.elements.stepText.textContent = '✅ Inclinação para a esquerda detetada!';
            setTimeout(() => this._advanceStep(), 800);
          }
        }
        break;
      case 4:
        if (hasFace && !this._stepPassed) {
          const adj = rollAngle - this.gestureDetector._neutralRoll;
          if (adj < -this.gestureDetector.tiltThreshold) {
            this._stepPassed = true;
            this.elements.stepText.textContent = '✅ Inclinação para a direita detetada!';
            setTimeout(() => this._advanceStep(), 800);
          }
        }
        break;
      case 5:
        if (hasFace && !this._stepPassed && jawOpen > this.gestureDetector.mouthThreshold) {
          this._stepPassed = true;
          this.elements.stepText.textContent = '✅ Gesto da boca detetado!';
          setTimeout(() => this._advanceStep(), 800);
        }
        break;
    }
  }

  _advanceStep() {
    this.currentStep++;
    if (this.currentStep >= this.totalSteps) {
      this._showStep(this.currentStep - 1);
      setTimeout(() => this.complete(), 1500);
    } else {
      this._showStep(this.currentStep);
    }
  }

  _showStep(index) {
    const step = this.steps[index];
    if (!step) return;
    this._stepPassed = false;
    this.elements.stepIcon.textContent = step.icon;
    this.elements.stepText.textContent = step.text;

    const dots = this.elements.progressDots.querySelectorAll('.cal-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.classList.toggle('done', i < index);
    });

    if (step.autoAdvance && index === 0) {
      setTimeout(() => this._advanceStep(), 1500);
    }
  }

  _renderProgressDots() {
    this.elements.progressDots.innerHTML = '';
    for (let i = 0; i < this.totalSteps; i++) {
      const dot = document.createElement('span');
      dot.className = 'cal-dot';
      this.elements.progressDots.appendChild(dot);
    }
  }

  complete() {
    this.elements.overlay.classList.remove('active');
    this.elements.overlay.classList.add('fade-out');
    setTimeout(() => {
      this.elements.overlay.style.display = 'none';
      if (this._onComplete) this._onComplete();
    }, 500);
  }
}
