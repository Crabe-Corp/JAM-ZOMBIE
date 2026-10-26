// =============================================================
//  SONS — rôle C (contenu)
//
//  En attendant les vrais sons, chaque bruitage est un petit "bip"
//  synthétisé (aucun fichier nécessaire). Pour un vrai son :
//    1. mettez le fichier dans assets/audio/ (mp3 ou ogg, court)
//    2. remplacez null par son chemin dans FICHIERS ci-dessous
//  Touche M : couper / remettre le son.
//  Sons libres : freesound.org, opengameart.org, pixabay.com/sound-effects
// =============================================================
import { events } from '../events.js';

const FICHIERS = {
  tir: 'assets/audio/tir.mp3',
  morsure: 'assets/audio/morsure.mp3',
  mort: 'assets/audio/mort.mp3',
  pose: 'assets/audio/pose.mp3',
  bonbon: 'assets/audio/bonbon.mp3',
  explosion: 'assets/audio/explosion.mp3',
  vague: 'assets/audio/vague.mp3',
  finale: 'assets/audio/finale.mp3',
  victoire: 'assets/audio/victoire.mp3',
  defaite: 'assets/audio/defaite.mp3',
  musique: 'assets/audio/musique.mp3',    // musique d'ambiance en boucle
};

// Bips de remplacement : fréquence de départ → d'arrivée (Hz), durée (s), forme, volume
const SYNTH = {
  tir:      { f: [620, 320], d: 0.07, t: 'square', v: 0.03 },
  morsure:  { f: [160, 90], d: 0.12, t: 'sawtooth', v: 0.05 },
  mort:     { f: [280, 50], d: 0.45, t: 'sawtooth', v: 0.06 },
  pose:     { f: [220, 440], d: 0.1, t: 'triangle', v: 0.08 },
  bonbon:   { f: [740, 1300], d: 0.12, t: 'sine', v: 0.08 },
  explosion: { f: [200, 40], d: 0.6, t: 'sawtooth', v: 0.1 },
  vague:    { f: [120, 70], d: 0.9, t: 'sawtooth', v: 0.06 },
  finale:   { f: [90, 35], d: 1.6, t: 'sawtooth', v: 0.09 },
  victoire: { f: [420, 950], d: 0.8, t: 'triangle', v: 0.1 },
  defaite:  { f: [300, 45], d: 1.3, t: 'sawtooth', v: 0.09 },
};

const loaded = {};
const lastPlayed = {};
let ac = null;
let muted = false;
let music = null;

function preload() {
  for (const [name, src] of Object.entries(FICHIERS)) {
    if (!src) continue;
    const a = new Audio();
    a.preload = 'auto';
    a.addEventListener('canplaythrough', () => { loaded[name] = a; }, { once: true });
    a.addEventListener('error', () => console.warn(`[audio] fichier introuvable : ${src}`), { once: true });
    a.src = src;
  }
}

export function play(name) {
  if (muted) return;
  // Anti-cacophonie : pas plus d'un même son toutes les 60 ms
  const now = performance.now();
  if (now - (lastPlayed[name] ?? 0) < 60) return;
  lastPlayed[name] = now;

  const a = loaded[name];
  if (a) {
    const clone = a.cloneNode();
    clone.volume = 0.6;
    clone.play().catch(() => {});
    return;
  }
  synth(name);
}

function synth(name) {
  const s = SYNTH[name];
  if (!s || !ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = s.t;
  osc.frequency.setValueAtTime(s.f[0], t);
  osc.frequency.exponentialRampToValueAtTime(s.f[1], t + s.d);
  gain.gain.setValueAtTime(s.v, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + s.d);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + s.d + 0.02);
}

function startMusic() {
  if (!loaded.musique || muted) return;
  if (!music) {
    music = loaded.musique;
    music.loop = true;
    music.volume = 0.35;
  }
  music.currentTime = 0;
  music.play().catch(() => {});
}

function stopMusic() {
  if (music) music.pause();
}

export function initAudio() {
  preload();

  events.on('gameStart', () => {
    // Le navigateur n'autorise le son qu'après un clic : gameStart arrive après "Jouer"
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    ac.resume();
    startMusic();
  });

  events.on('projectileFired', () => play('tir'));
  events.on('zombieBite', () => play('morsure'));
  events.on('zombieDied', () => play('mort'));
  events.on('plantPlaced', () => play('pose'));
  events.on('resourceCollected', () => play('bonbon'));
  events.on('plantUsed', ({ plant }) => {
    if (plant.def.type === 'explosif') play('explosion');
  });
  events.on('waveStart', ({ finale }) => play(finale ? 'finale' : 'vague'));
  events.on('pauseChanged', ({ paused }) => (paused ? stopMusic() : startMusic()));
  events.on('gameOver', ({ win }) => {
    stopMusic();
    play(win ? 'victoire' : 'defaite');
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      muted = !muted;
      if (muted) stopMusic();
      else if (music) music.play().catch(() => {});
    }
  });
}
