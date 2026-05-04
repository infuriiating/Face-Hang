# 🎮 FACEHANG — Hands-Free Hangman (Jogo da Forca)

> A web-based Hangman game controlled entirely by face gestures using AI-powered Computer Vision. No keyboard, mouse, or touch required! This project is fully localized in Portuguese.

[Ler em Português](README_pt.md)

## 🧠 How It Works

This game uses **MediaPipe Face Landmarker** (Google AI) to detect **478 face landmarks** in real-time through your webcam. The system interprets head movements and facial expressions as game inputs:

| Gesture | Action |
|---------|--------|
| 🔄 Tilt head **LEFT** | Move cursor left on virtual keyboard |
| 🔄 Tilt head **RIGHT** | Move cursor right on virtual keyboard |
| 👄 **Open mouth** wide | Select the highlighted letter |
| 😑 **Long blink** (~1 second) | Alternative select |

### What does the "Long Blink" do?
The **Long Blink** is an accessibility feature acting as an alternative to opening your mouth. If you cannot or prefer not to use the mouth gesture, you can simply close both your eyes for about 800 milliseconds. The game uses the `eyeBlinkLeft` and `eyeBlinkRight` blendshapes and requires both to be closed simultaneously for a sustained duration to distinguish an intentional selection from a natural, quick blink.

### AI Detection Details

- **Head Tilt Navigation**: Calculated from the roll angle between eye corner landmarks (#33 and #263). The game features **Accelerating Navigation**: holding your head tilted will gradually speed up the cursor movement, allowing you to quickly cross the keyboard!
- **Mouth Open**: Uses the `jawOpen` blendshape score. Must exceed the threshold for 500ms to prevent false triggers.
- **Debouncing**: All gestures use hold timers, repeat rates, and cooldowns to prevent accidental double-triggers.

## 🚀 Getting Started

### Prerequisites
- A modern web browser (**Chrome 90+** or **Edge 90+** recommended)
- A **webcam**
- A **local HTTP server** (ES Modules require HTTP, not `file://`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/jogo_da_forca_V2.git
   cd jogo_da_forca_V2
   ```

2. **Start a local server** (choose one):

   **Node.js (npx) (Recommended):**
   ```bash
   npx serve .
   ```

   **Python:**
   ```bash
   python -m http.server 8000
   ```

   **VS Code:**
   Install the "Live Server" extension → Right-click `index.html` → "Open with Live Server"

3. **Open in browser:**
   ```
   http://localhost:3000
   ```

4. **Allow camera access** when prompted and follow the calibration steps.

## 🎯 Game Flow & Features

1. **Calibration** — The system guides you through testing face detection, neutral position, tilts, and mouth gesture.
2. **Category Select** — Choose from 5 Portuguese categories: *Programação*, *Animais*, *Frutas*, *Ciências*, and *Geografia*.
3. **Play** — Navigate the virtual keyboard with head tilts and select letters by opening your mouth or long blinking.
4. **Game Over** — See your result, streak, and open your mouth to play again.
5. **Keyboard Fallback** — If you don't have a webcam, you can play using the Left/Right Arrow keys and Enter!

## 📁 Project Structure

```
jogo_da_forca_V2/
├── index.html              # Main HTML entry point
├── css/
│   └── styles.css          # Auto-switching Light/Dark theme with glassmorphism
├── js/
│   ├── app.js              # Main controller — state machine & event wiring
│   ├── faceTracker.js      # MediaPipe FaceLandmarker init & video loop
│   ├── gestureDetector.js  # Interprets landmarks/blendshapes → gestures
│   ├── hangmanGame.js      # Core game logic (guess, win/lose, score)
│   ├── wordBank.js         # Word categories and random selection
│   ├── uiRenderer.js       # DOM updates, canvas hangman drawing, keyboard
│   └── calibration.js      # Calibration overlay flow
├── assets/
│   └── icon.png            # FACEHANG Icon
└── README.md               # This file
```

## 🛠️ Technology Stack

- **HTML5** + **CSS3** + **Vanilla JavaScript** (ES Modules)
- **MediaPipe Face Landmarker** (Google AI) — loaded via CDN
- **No build tools** — runs directly in the browser
- **No npm dependencies** — fully self-contained

## 🎨 Design

- **Modern Theming**: Automatically switches between elegant Light Mode and deep navy Dark Mode based on your system preferences.
- Glassmorphism panels with subtle borders.
- Smooth animations (bounce-in reveals, pulse effects, shake on wrong guess).
- Responsive layout that fits in a single viewport without scrolling.
- Real-time webcam Picture-in-Picture with face mesh overlay.

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.


