/* Deterministic original ambient cue. Run manually with Node to render the
 * bundled 48-second PCM audio; no external recordings or network calls. */
const fs = require('node:fs');
const path = require('node:path');
const rate = 22050;
const duration = 48;
const count = rate * duration;
const left = new Float32Array(count);
const right = new Float32Array(count);
const frequency = midi => 440 * Math.pow(2, (midi - 69) / 12);
function note(midi, start, length, level, pan, soft) {
  const hz = frequency(midi);
  const samples = Math.floor(length * rate);
  for (let j = 0; j < samples; j++) {
    const t = j / rate;
    const attack = 1 - Math.exp(-t / (soft ? .8 : .045));
    const release = Math.min(1, (length - t) / 1.8);
    const decay = Math.exp(-t / (soft ? 5 : 2.2));
    const wave = Math.sin(2 * Math.PI * hz * t) + .16 * Math.sin(2 * Math.PI * hz * 2 * t) + .035 * Math.sin(2 * Math.PI * hz * 3 * t);
    const value = wave * attack * release * decay * level;
    const index = (Math.floor(start * rate) + j) % count;
    left[index] += value * Math.sqrt((1 - pan) / 2);
    right[index] += value * Math.sqrt((1 + pan) / 2);
    // A pair of soft stereo reflections gives space without sharp echoes.
    left[(index + Math.floor(.31 * rate)) % count] += value * .16;
    right[(index + Math.floor(.47 * rate)) % count] += value * .13;
  }
}
const chords = [[48,55,59,64], [45,52,55,60], [41,48,52,57], [43,50,55,59], [45,52,55,60], [43,50,55,62]];
chords.forEach((chord, i) => {
  chord.forEach((midi, j) => note(midi, i * 8 + j * .08, 11, .07, (j - 1.5) * .3, true));
  const melody = [chord[2] + 12, chord[3] + 12, chord[1] + 12, chord[2] + 12];
  melody.forEach((midi, j) => note(midi, i * 8 + .7 + j * 1.8, 6, .08, j % 2 ? .25 : -.25, false));
});
let peak = 0;
for (let i = 0; i < count; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const bytes = count * 4;
const wav = Buffer.alloc(44 + bytes);
wav.write('RIFF'); wav.writeUInt32LE(36 + bytes, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22); wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28);
wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(bytes, 40);
for (let i = 0; i < count; i++) {
  const edge = Math.min(1, i / (rate * .04), (count - 1 - i) / (rate * .04));
  wav.writeInt16LE(Math.round(left[i] / peak * .65 * edge * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(right[i] / peak * .65 * edge * 32767), 46 + i * 4);
}
const output = path.join(__dirname, '../source/music/evening.wav');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, wav);
console.log('Rendered evening.wav: 48 seconds, stereo PCM, 22050 Hz.');
