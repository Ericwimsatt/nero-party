/**
 * Singleton Web Audio API analyzer.
 * Connects to an <audio> element, analyzes the time-domain waveform each animation
 * frame, and dispatches a "beatDetected" CustomEvent on `window` when the
 * instantaneous RMS energy significantly exceeds the recent rolling average.
 *
 * IMPORTANT: The browser only allows one MediaElementAudioSourceNode per element.
 * Use pauseAudioListener() between songs and disconnectAudioListener() on unmount.
 */

let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let rafId: number | null = null;
let currentAudio: HTMLAudioElement | null = null;

/** How many frames of energy history to average (~0.7 s at 60 fps) */
const HISTORY_SIZE = 43;
/** Current energy must exceed this multiple of the rolling average to count */
const BEAT_MULTIPLIER = 1.4;
/** Minimum RMS to avoid firing on silence */
const MIN_RMS = 0.008;
/** Minimum ms between beat events */
const BEAT_COOLDOWN_MS = 50;

export function connectAudioListener(audio: HTMLAudioElement): void {
  // Stop any running RAF loop first
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (currentAudio !== audio || !audioCtx) {
    // New element or first-ever call — full setup.
    // NOTE: createMediaElementSource can only ever be called ONCE per element
    // (the browser permanently marks it, even after the AudioContext is closed).
    // So we only reach this branch when the audio element itself changes.
    sourceNode?.disconnect();
    analyser?.disconnect();
    if (audioCtx && audioCtx.state !== "closed") {
      audioCtx.close().catch(() => {});
    }
    currentAudio = audio;

    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.0;

    sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    audio.addEventListener("play", () => audioCtx?.resume());
  } else if (sourceNode && analyser && audioCtx) {
    // Same element — nodes already exist (e.g. React StrictMode remount).
    // Re-wire them and resume the context.
    try { sourceNode.connect(analyser); } catch { /* already connected */ }
    try { analyser.connect(audioCtx.destination); } catch { /* already connected */ }
    audioCtx.resume().catch(() => {});
  }

  // (Re)start the analysis loop
  const bufferLen = analyser!.fftSize; // time-domain buffer = fftSize
  const data = new Uint8Array(bufferLen);
  const energyHistory = new Float32Array(HISTORY_SIZE);
  let historyIdx = 0;
  let lastBeatTime = 0;

  function tick() {
    rafId = requestAnimationFrame(tick);
    if (!analyser) return;

    analyser.getByteTimeDomainData(data);

    // Compute RMS energy (samples are 0–255, centered at 128)
    let sum = 0;
    for (let i = 0; i < bufferLen; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / bufferLen);

    // Update rolling average
    energyHistory[historyIdx] = rms;
    historyIdx = (historyIdx + 1) % HISTORY_SIZE;
    let total = 0;
    for (let i = 0; i < HISTORY_SIZE; i++) total += energyHistory[i];
    const avgEnergy = total / HISTORY_SIZE;

    // Fire on a sudden energy spike, with silence rejection and cooldown
    const now = performance.now();
    if (
      rms > MIN_RMS &&
      rms > BEAT_MULTIPLIER * avgEnergy &&
      now - lastBeatTime > BEAT_COOLDOWN_MS
    ) {
      lastBeatTime = now;
      window.dispatchEvent(
        new CustomEvent("beatDetected", { detail: { intensity: rms } })
      );
    }
  }

  tick();
}

/**
 * Stop the analysis loop but keep the AudioContext alive.
 * Call this between songs so the same audio element can be reconnected.
 */
export function pauseAudioListener(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/**
 * Fully tear down the AudioContext and all nodes.
 * Call this only when the player component unmounts entirely.
 *
 * IMPORTANT: We intentionally do NOT close the AudioContext or null the node
 * references here. The Web Audio API permanently marks an HTMLMediaElement once
 * createMediaElementSource is called on it — attempting to create a second source
 * node (e.g. after a React StrictMode remount) throws an InvalidStateError.
 * Keeping the nodes alive lets connectAudioListener safely re-wire them on remount.
 */
export function disconnectAudioListener(): void {
  pauseAudioListener();
  sourceNode?.disconnect();
  analyser?.disconnect();
  audioCtx?.suspend().catch(() => {});
}
