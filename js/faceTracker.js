/**
 * faceTracker.js — MediaPipe Face Landmarker Initialization & Detection Loop
 * 
 * This module handles all interaction with the MediaPipe Face Landmarker API.
 * It initializes the webcam, loads the AI model, and runs a real-time detection
 * loop that provides face landmark coordinates and blendshape scores.
 * 
 * ── How MediaPipe Face Landmarker Works ──
 * MediaPipe's Face Landmarker detects 478 3D face landmarks in real-time.
 * These landmarks are normalized coordinates (0.0 to 1.0) representing
 * points on the face like eyes, nose, mouth, jawline, and forehead.
 * 
 * Additionally, it provides "blendshapes" — 52 facial expression coefficients
 * (e.g., jawOpen, eyeBlinkLeft, mouthSmile) with values from 0.0 to 1.0,
 * representing the intensity of each expression.
 * 
 * We use BOTH landmarks (for head tilt calculation via eye corner positions)
 * and blendshapes (for mouth open and blink detection).
 */

import { FaceLandmarker, FilesetResolver, DrawingUtils } from
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs';

// ── Module State ──
let faceLandmarker = null;
let drawingUtils = null;
let animationFrameId = null;
let isRunning = false;

/**
 * Initialize the webcam and attach it to the given video element.
 * Requests front-facing camera (selfie mode) at 640×480.
 * 
 * @param {HTMLVideoElement} videoElement — The <video> element to attach the camera to
 * @returns {Promise<MediaStream>} — The camera stream
 */
export async function initCamera(videoElement) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',    // Front-facing camera (selfie mode)
      width: { ideal: 640 },
      height: { ideal: 480 }
    },
    audio: false
  });

  videoElement.srcObject = stream;

  // Wait for the video to be ready before resolving
  return new Promise((resolve) => {
    videoElement.onloadedmetadata = () => {
      videoElement.play();
      resolve(stream);
    };
  });
}

/**
 * Initialize the MediaPipe Face Landmarker model.
 * 
 * This loads the WASM runtime and the face landmark detection model from
 * Google's CDN. The model runs in VIDEO mode (continuous detection) with
 * GPU acceleration when available, falling back to CPU.
 * 
 * Key configuration:
 * - outputFaceBlendshapes: true → enables jawOpen, eyeBlink, etc.
 * - outputFacialTransformationMatrixes: true → enables head pose matrix
 * - numFaces: 1 → we only track one player
 * - delegate: "GPU" → uses WebGL for faster inference
 * 
 * @returns {Promise<FaceLandmarker>} — The initialized landmarker instance
 */
export async function initFaceLandmarker() {
  // Load the MediaPipe WASM fileset (required runtime for the model)
  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
  );

  // Create the Face Landmarker with our configuration
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      // The pre-trained model file hosted on Google's CDN
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU'  // Use WebGL acceleration; auto-falls back to CPU
    },
    outputFaceBlendshapes: true,          // Enable blendshape scores (mouth, blink, etc.)
    outputFacialTransformationMatrixes: true, // Enable head pose transformation matrix
    runningMode: 'VIDEO',                 // Continuous video frame detection
    numFaces: 1                           // Track only one face (the player)
  });

  return faceLandmarker;
}

/**
 * Start the real-time face detection loop.
 * 
 * Uses requestAnimationFrame to continuously detect face landmarks
 * in each video frame. Results are passed to the callback function
 * which typically feeds into the GestureDetector.
 * 
 * The detection loop runs at the browser's refresh rate (~60fps),
 * but MediaPipe internally throttles based on GPU/CPU capacity.
 * 
 * @param {HTMLVideoElement} videoElement — The video element with camera feed
 * @param {Function} callback — Called each frame with (results, timestamp)
 *   results = { faceLandmarks, faceBlendshapes, facialTransformationMatrixes }
 */
export function startDetectionLoop(videoElement, callback) {
  if (isRunning) return;
  isRunning = true;

  let lastTimestamp = -1;

  function detect() {
    if (!isRunning || !faceLandmarker) return;

    // Only process new frames (avoid redundant detections)
    const timestamp = performance.now();
    if (timestamp !== lastTimestamp && videoElement.readyState >= 2) {
      lastTimestamp = timestamp;

      // Run inference — this is the core AI call
      // detectForVideo() returns landmarks + blendshapes for the current frame
      const results = faceLandmarker.detectForVideo(videoElement, timestamp);
      callback(results, timestamp);
    }

    animationFrameId = requestAnimationFrame(detect);
  }

  detect();
}

/**
 * Stop the detection loop.
 */
export function stopDetectionLoop() {
  isRunning = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Draw face landmarks on a canvas overlay for visual feedback.
 * 
 * Renders the face mesh as small dots on the canvas so the player
 * can see that face tracking is working. Uses MediaPipe's built-in
 * DrawingUtils for efficient rendering.
 * 
 * @param {CanvasRenderingContext2D} canvasCtx — Canvas 2D context
 * @param {HTMLCanvasElement} canvasElement — The canvas element
 * @param {Array} landmarks — Array of 478 landmark coordinates [{x, y, z}, ...]
 */
export function drawLandmarks(canvasCtx, canvasElement, landmarks) {
  if (!landmarks || landmarks.length === 0) return;

  // Initialize DrawingUtils on first call
  if (!drawingUtils) {
    drawingUtils = new DrawingUtils(canvasCtx);
  }

  // Clear the canvas for the new frame
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw the face mesh connections (thin lines between landmarks)
  drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
    color: '#00f5d433',  // Translucent cyan-mint for the mesh
    lineWidth: 0.5
  });

  // Draw eye contours more prominently (used for tilt detection)
  drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
    color: '#00f5d4',
    lineWidth: 1.5
  });
  drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
    color: '#00f5d4',
    lineWidth: 1.5
  });

  // Draw lip contours (used for mouth open detection)
  drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, {
    color: '#ff6b6b',
    lineWidth: 1.5
  });
}

/**
 * Check if the Face Landmarker is initialized and ready.
 * @returns {boolean}
 */
export function isReady() {
  return faceLandmarker !== null;
}
