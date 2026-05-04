/**
 * gestureDetector.js — Face Gesture Interpretation Engine
 * 
 * This is the CORE AI LOGIC module. It translates raw MediaPipe landmark
 * coordinates and blendshape scores into discrete, actionable game gestures.
 * 
 * ── Gesture Detection Strategy ──
 * 
 * 1. HEAD TILT (Left/Right) — Using landmarks:
 *    We calculate the "roll" angle of the head by measuring the angle between
 *    the outer corners of both eyes (landmarks 33 and 263).
 *    - Roll < -threshold° → head tilted RIGHT → move cursor right
 *    - Roll > +threshold° → head tilted LEFT  → move cursor left
 *    The threshold is calibrated per-user (default: 10°).
 * 
 * 2. MOUTH OPEN — Using blendshapes:
 *    The "jawOpen" blendshape provides a 0.0–1.0 score.
 *    - Score > 0.5 sustained for 500ms → SELECT action
 *    This prevents false triggers from talking or yawning briefly.
 * 
 * 3. LONG BLINK — Using blendshapes:
 *    Both "eyeBlinkLeft" and "eyeBlinkRight" scores > 0.5 for 800ms.
 *    - This is an alternative SELECT for users who prefer not to open mouth.
 *    - 800ms threshold distinguishes intentional blinks from natural ones.
 * 
 * ── Debouncing & Smoothing ──
 * 
 * Raw face tracking data is noisy. We apply several techniques:
 * - HOLD DURATION: A gesture must be sustained for a minimum time before firing
 * - REPEAT RATE: After initial fire, gestures repeat at a controlled rate
 * - COOLDOWN: After any action, a cooldown prevents accidental double-triggers
 * - SMOOTHING: Rolling average of the last N angle readings to reduce jitter
 */

export class GestureDetector {
  constructor() {
    // ── Thresholds (adjusted during calibration) ──
    this.tiltThreshold = 10;        // Degrees of head roll to trigger tilt
    this.mouthThreshold = 0.5;      // jawOpen blendshape score (0.0–1.0)
    this.blinkThreshold = 0.5;      // eyeBlink blendshape score (0.0–1.0)

    // ── Timing Configuration (milliseconds) ──
    this.tiltHoldTime = 300;        // Hold tilt for 300ms before first trigger
    this.tiltInitialRepeatRate = 400; // Starting repeat rate
    this.tiltMinRepeatRate = 100;     // Fastest repeat rate
    this.tiltAcceleration = 50;       // How much to decrease the rate each repeat
    this.mouthHoldTime = 500;       // Hold mouth open for 500ms to select
    this.blinkHoldTime = 600;       // Hold blink for 600ms to select
    this.cooldownTime = 600;        // Cooldown after any action fires

    // ── Internal State ──
    this._listeners = [];           // Registered gesture callbacks
    this._lastActionTime = 0;       // Timestamp of last fired action
    this._cooldownActive = false;

    // Tilt tracking
    this._tiltDirection = null;     // 'LEFT', 'RIGHT', or null
    this._tiltStartTime = 0;       // When current tilt started
    this._lastTiltRepeat = 0;      // Last time tilt repeat fired
    this._tiltFirstFired = false;  // Whether initial tilt has fired
    this._currentTiltRepeatRate = this.tiltInitialRepeatRate; // Current dynamic repeat rate

    // Mouth tracking
    this._mouthOpenStart = 0;      // When mouth open started
    this._mouthFired = false;      // Whether mouth action already fired

    // Blink tracking
    this._blinkStart = 0;          // When long blink started
    this._blinkFired = false;      // Whether blink action already fired

    // Rolling average for angle smoothing (reduces jitter)
    this._angleHistory = [];
    this._angleHistorySize = 5;    // Average over 5 frames

    // Debug info (exposed for UI overlay)
    this._debugInfo = {
      rollAngle: 0,
      smoothedAngle: 0,
      jawOpen: 0,
      eyeBlinkLeft: 0,
      eyeBlinkRight: 0,
      currentGesture: 'NENHUM',
      cooldownRemaining: 0
    };

    // Neutral baseline (set during calibration)
    this._neutralRoll = 0;
  }

  /**
   * Register a callback for gesture events.
   * 
   * @param {Function} callback — Called with { type: 'TILT_LEFT'|'TILT_RIGHT'|'SELECT'|'BLINK_SELECT' }
   */
  onGesture(callback) {
    this._listeners.push(callback);
  }

  /**
   * Emit a gesture event to all registered listeners.
   * @param {string} type — The gesture type
   */
  _emit(type) {
    const now = performance.now();

    // Enforce cooldown
    if (this._cooldownActive && (now - this._lastActionTime) < this.cooldownTime) {
      return;
    }

    this._lastActionTime = now;
    this._cooldownActive = true;

    // Clear cooldown after timeout
    setTimeout(() => {
      this._cooldownActive = false;
    }, this.cooldownTime);

    this._debugInfo.currentGesture = type;

    for (const listener of this._listeners) {
      listener({ type });
    }
  }

  /**
   * Update the detector with new frame data from MediaPipe.
   * This is called every frame from the detection loop.
   * 
   * @param {Array} landmarks — 478 face landmarks [{x, y, z}, ...]
   * @param {Array} blendshapes — 52 blendshape scores [{categoryName, score}, ...]
   */
  update(landmarks, blendshapes) {
    if (!landmarks || landmarks.length === 0) {
      this._debugInfo.currentGesture = 'SEM_ROSTO';
      return;
    }

    const now = performance.now();

    // Update cooldown display
    if (this._cooldownActive) {
      this._debugInfo.cooldownRemaining = Math.max(0,
        this.cooldownTime - (now - this._lastActionTime));
    } else {
      this._debugInfo.cooldownRemaining = 0;
    }

    // ── 1. HEAD TILT DETECTION ──
    this._detectTilt(landmarks, now);

    // ── 2. MOUTH OPEN DETECTION ──
    if (blendshapes && blendshapes.length > 0) {
      this._detectMouthOpen(blendshapes, now);

      // ── 3. LONG BLINK DETECTION ──
      this._detectLongBlink(blendshapes, now);
    }
  }

  /**
   * Detect head tilt (roll angle) from eye corner landmarks.
   * 
   * ── How it works ──
   * We use the outer corners of both eyes as reference points:
   * - Landmark 33:  right eye outer corner
   * - Landmark 263: left eye outer corner
   * 
   * The roll angle = atan2(dy, dx) between these two points.
   * When the head is upright, this angle ≈ 0°.
   * Tilting left increases the angle; tilting right decreases it.
   * 
   * We subtract the calibrated neutral roll to account for the user's
   * natural head position (some people have a slight natural tilt).
   */
  _detectTilt(landmarks, now) {
    // Get eye corner positions
    const rightEye = landmarks[33];   // Right eye outer corner
    const leftEye = landmarks[263];   // Left eye outer corner

    // Calculate raw roll angle in degrees
    const rawRoll = Math.atan2(
      leftEye.y - rightEye.y,
      leftEye.x - rightEye.x
    ) * (180 / Math.PI);

    this._debugInfo.rollAngle = rawRoll;

    // Apply smoothing via rolling average to reduce frame-to-frame jitter
    this._angleHistory.push(rawRoll);
    if (this._angleHistory.length > this._angleHistorySize) {
      this._angleHistory.shift();
    }
    const smoothedRoll = this._angleHistory.reduce((a, b) => a + b, 0)
      / this._angleHistory.length;

    this._debugInfo.smoothedAngle = smoothedRoll;

    // Subtract neutral baseline (from calibration)
    const adjustedRoll = smoothedRoll - this._neutralRoll;

    // Determine tilt direction
    let direction = null;
    if (adjustedRoll > this.tiltThreshold) {
      direction = 'TILT_LEFT';
    } else if (adjustedRoll < -this.tiltThreshold) {
      direction = 'TILT_RIGHT';
    }

    // State machine for tilt timing
    if (direction) {
      if (this._tiltDirection !== direction) {
        // New tilt direction — start timer
        this._tiltDirection = direction;
        this._tiltStartTime = now;
        this._tiltFirstFired = false;
        this._lastTiltRepeat = 0;
        this._currentTiltRepeatRate = this.tiltInitialRepeatRate;
      } else {
        const elapsed = now - this._tiltStartTime;

        if (!this._tiltFirstFired && elapsed >= this.tiltHoldTime) {
          // First trigger after hold time
          this._emit(direction);
          this._tiltFirstFired = true;
          this._lastTiltRepeat = now;
        } else if (this._tiltFirstFired && (now - this._lastTiltRepeat) >= this._currentTiltRepeatRate) {
          // Repeat trigger
          this._emit(direction);
          this._lastTiltRepeat = now;
          // Accelerate next repeat
          this._currentTiltRepeatRate = Math.max(this.tiltMinRepeatRate, this._currentTiltRepeatRate - this.tiltAcceleration);
        }
      }
    } else {
      // Head returned to neutral — reset tilt state
      this._tiltDirection = null;
      this._tiltFirstFired = false;
    }
  }

  /**
   * Detect mouth open gesture from blendshapes.
   * 
   * The "jawOpen" blendshape gives a continuous score from 0.0 (closed)
   * to 1.0 (fully open). We trigger SELECT when the score exceeds the
   * threshold for a sustained duration, preventing false triggers.
   */
  _detectMouthOpen(blendshapes, now) {
    const jawOpen = this._getBlendshapeScore(blendshapes, 'jawOpen');
    this._debugInfo.jawOpen = jawOpen;

    if (jawOpen > this.mouthThreshold) {
      if (this._mouthOpenStart === 0) {
        this._mouthOpenStart = now;
      }

      const elapsed = now - this._mouthOpenStart;
      if (elapsed >= this.mouthHoldTime && !this._mouthFired) {
        this._emit('SELECT');
        this._mouthFired = true;
      }
    } else {
      // Mouth closed — reset
      this._mouthOpenStart = 0;
      this._mouthFired = false;
    }
  }

  /**
   * Detect long blink gesture from blendshapes.
   * 
   * Both "eyeBlinkLeft" and "eyeBlinkRight" must exceed the threshold
   * simultaneously for 800ms. This distinguishes an intentional long blink
   * from natural blinks (which typically last ~100-400ms).
   */
  _detectLongBlink(blendshapes, now) {
    const blinkL = this._getBlendshapeScore(blendshapes, 'eyeBlinkLeft');
    const blinkR = this._getBlendshapeScore(blendshapes, 'eyeBlinkRight');
    this._debugInfo.eyeBlinkLeft = blinkL;
    this._debugInfo.eyeBlinkRight = blinkR;

    if (blinkL > this.blinkThreshold && blinkR > this.blinkThreshold) {
      if (this._blinkStart === 0) {
        this._blinkStart = now;
      }

      const elapsed = now - this._blinkStart;
      if (elapsed >= this.blinkHoldTime && !this._blinkFired) {
        this._emit('BLINK_SELECT');
        this._blinkFired = true;
      }
    } else {
      // Eyes opened — reset
      this._blinkStart = 0;
      this._blinkFired = false;
    }
  }

  /**
   * Extract a blendshape score by name from the blendshapes array.
   * 
   * @param {Array} blendshapes — Array of { categoryName, score }
   * @param {string} name — The blendshape category name
   * @returns {number} — Score between 0.0 and 1.0
   */
  _getBlendshapeScore(blendshapes, name) {
    // MediaPipe returns blendshapes as an array of categories per face
    // We access the first (and only) face's blendshape array
    const categories = blendshapes[0]?.categories;
    if (!categories) return 0;

    const shape = categories.find(s => s.categoryName === name);
    return shape ? shape.score : 0;
  }

  /**
   * Update detection thresholds (called after calibration).
   * 
   * @param {Object} config — { tiltThreshold, mouthThreshold, neutralRoll }
   */
  updateThresholds(config) {
    if (config.tiltThreshold != null) this.tiltThreshold = config.tiltThreshold;
    if (config.mouthThreshold != null) this.mouthThreshold = config.mouthThreshold;
    if (config.blinkThreshold != null) this.blinkThreshold = config.blinkThreshold;
    if (config.neutralRoll != null) this._neutralRoll = config.neutralRoll;
  }

  /**
   * Set the neutral roll baseline (from calibration "look straight" step).
   * @param {number} roll — The neutral roll angle in degrees
   */
  setNeutralRoll(roll) {
    this._neutralRoll = roll;
  }

  /**
   * Get current debug info for UI overlay display.
   * @returns {Object}
   */
  getDebugInfo() {
    return { ...this._debugInfo };
  }

  /**
   * Get the current smoothed roll angle (used by calibration).
   * @returns {number}
   */
  getCurrentRoll() {
    return this._debugInfo.smoothedAngle;
  }
}
