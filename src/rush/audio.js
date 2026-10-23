// Synthesised feedback sounds: no audio files, created on first keypress so
// browsers allow playback. Every call is a no-op when sound is off.
let context = null;
let master = null;
let enabled = true;

export function setSound(on) {
  enabled = on;
}

function audio() {
  if (!enabled) return null;
  try {
    if (!context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return null;
      context = new Context();
      master = context.createGain();
      master.gain.value = 0.32;
      master.connect(context.destination);
    }
    if (context.state === "suspended") context.resume();
    return context;
  } catch {
    return null;
  }
}

function tone({ freq, to, type = "sine", start = 0, length = 0.12, gain = 0.3, attack = 0.005 }) {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + length);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(amp).connect(master);
  osc.start(t);
  osc.stop(t + length + 0.02);
}

// Major pentatonic from A4: every clear climbs one note as the combo grows.
const SCALE = [0, 2, 4, 7, 9];
const note = (step) =>
  440 * 2 ** ((SCALE[step % 5] + 12 * Math.floor(step / 5)) / 12);

export const sfx = {
  key(length) {
    tone({ freq: 1400 + 40 * Math.min(10, length), type: "triangle", length: 0.03, gain: 0.05 });
  },
  clear(combo, fever) {
    const step = Math.min(14, combo);
    tone({ freq: note(step), type: "triangle", length: 0.16, gain: 0.22 });
    tone({ freq: note(step + 2), type: "sine", start: 0.05, length: 0.2, gain: 0.16 });
    if (fever) tone({ freq: note(step + 4), type: "square", start: 0.09, length: 0.12, gain: 0.05 });
  },
  wrong() {
    tone({ freq: 140, to: 90, type: "square", length: 0.09, gain: 0.08 });
  },
  miss() {
    tone({ freq: 220, to: 70, type: "sawtooth", length: 0.32, gain: 0.14 });
  },
  hint() {
    tone({ freq: 660, to: 520, type: "sine", length: 0.18, gain: 0.12 });
  },
  heart() {
    [0, 4, 7].forEach((semi, i) =>
      tone({ freq: 523 * 2 ** (semi / 12), type: "triangle", start: i * 0.06, length: 0.14, gain: 0.16 }),
    );
  },
  level() {
    [0, 4, 7, 12].forEach((semi, i) =>
      tone({ freq: 392 * 2 ** (semi / 12), type: "square", start: i * 0.07, length: 0.12, gain: 0.07 }),
    );
  },
  over(won) {
    const steps = won ? [0, 4, 7, 12, 16] : [7, 4, 0, -5];
    steps.forEach((semi, i) =>
      tone({ freq: 330 * 2 ** (semi / 12), type: "triangle", start: i * 0.11, length: 0.22, gain: 0.18 }),
    );
  },
};

let voice;
function japaneseVoice() {
  if (voice !== undefined) return voice;
  const voices = window.speechSynthesis?.getVoices() || [];
  if (!voices.length) return null;
  voice = voices.find((v) => /^ja/i.test(v.lang)) || null;
  return voice;
}
export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Reads a kana answer aloud with a Japanese voice when one is installed. */
export function say(text, { rate = 1.05 } = {}) {
  if (!canSpeak() || !text) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    const ja = japaneseVoice();
    if (ja) utterance.voice = ja;
    utterance.rate = rate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    /* Speech is a bonus; the game never depends on it. */
  }
}
