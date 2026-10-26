// =============================================================
//  SCREAMER JUMPSCARE — FOXY (1 chance sur 5 à l'explosion)
//  Détourage dynamique du fond vert (chroma-keying) sur canvas
//  Layer flottant au-dessus de tout le jeu (z-index maximal).
// =============================================================
import { events } from '../events.js';

export function initScreamer() {
  let overlay = document.getElementById('screamer-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'screamer-overlay';
    overlay.className = 'hidden';
    overlay.innerHTML = `
      <canvas id="screamer-canvas" width="946" height="720"></canvas>
      <video id="screamer-video" preload="auto" playsinline>
        <source src="assets/video/screamer.webm" type="video/webm">
        <source src="assets/video/screamer.mp4" type="video/mp4">
        <source src="assets/video/FiveNightsAtFreddy's-FoxyJumpscare(Green.mp4" type="video/mp4">
      </video>
    `;
    document.body.appendChild(overlay);
  }

  const canvas = overlay.querySelector('#screamer-canvas');
  const video = overlay.querySelector('#screamer-video');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let animId = null;
  let isPlaying = false;

  function renderFrame() {
    if (!isPlaying) return;
    if (video.paused || video.ended) {
      stop();
      return;
    }

    ctx.drawImage(video, 0, 0, 946, 720);
    const frame = ctx.getImageData(0, 0, 946, 720);
    const data = frame.data;
    const len = data.length;

    // Détourage en temps réel du greenscreen (vert pur et teintes dérivées)
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Détection fond vert franc
      if (g > 85 && g > r * 1.32 && g > b * 1.32) {
        data[i + 3] = 0;
      } else if (g > 70 && g > r * 1.12 && g > b * 1.12) {
        // Lissage et suppression de la frange verte (spill suppression)
        const diff = g - Math.max(r, b);
        data[i + 3] = Math.max(0, 255 - diff * 3.5);
        data[i + 1] = Math.max(r, b);
      }
    }

    ctx.putImageData(frame, 0, 0);
    animId = requestAnimationFrame(renderFrame);
  }

  function play() {
    if (isPlaying) return;
    isPlaying = true;
    overlay.classList.remove('hidden');

    video.currentTime = 0;
    video.volume = 1.0;

    const promise = video.play();
    if (promise !== undefined) {
      promise.then(() => {
        renderFrame();
      }).catch((err) => {
        console.warn('[screamer] Lecture avec son bloquée par le navigateur :', err);
        // Fallback sans audio si la politique navigateur bloque
        video.muted = true;
        video.play().then(() => {
          renderFrame();
        }).catch(() => stop());
      });
    } else {
      renderFrame();
    }
  }

  function stop() {
    isPlaying = false;
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    overlay.classList.add('hidden');
    ctx.clearRect(0, 0, 946, 720);
    try {
      video.pause();
      video.currentTime = 0;
    } catch {}
  }

  video.addEventListener('ended', stop);

  // 1 chance sur 5 (20%) quand une bombe explose
  events.on('bombExploded', () => {
    if (Math.random() < 0.2) {
      play();
    }
  });

  // Déclencheur manuel accessible pour tester : window.triggerScreamer()
  window.triggerScreamer = play;
}

