// =============================================================
//  MENUS — rôle B (interface)
//  Écran titre, pause, victoire / défaite, meilleur score
//  (localStorage) et option de ramassage auto au survol.
// =============================================================
import { state } from '../state.js';
import { events } from '../events.js';

const SCORES_KEY = 'citrouilles_vs_zombies_scores';
const AUTOCOLLECT_KEY = 'zombies_autocollect';

function getScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY)) || {};
  } catch {
    return {};
  }
}

function saveScores(scores) {
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  } catch {}
}

export function initMenu(game, { onStart }) {
  const screens = {
    title: document.getElementById('screen-title'),
    pause: document.getElementById('screen-pause'),
    end: document.getElementById('screen-end'),
  };
  const show = (name) => {
    for (const [key, el] of Object.entries(screens)) {
      if (el) el.classList.toggle('hidden', key !== name);
    }
  };

  // ── Option : Ramassage automatique des bonbons au survol ────
  const savedAutoCollect = localStorage.getItem(AUTOCOLLECT_KEY) === 'true';
  state.autoCollect = savedAutoCollect;

  const titleCheck = document.getElementById('opt-autocollect-title');
  const pauseCheck = document.getElementById('opt-autocollect-pause');

  const updateAutoCollect = (val) => {
    state.autoCollect = val;
    localStorage.setItem(AUTOCOLLECT_KEY, val ? 'true' : 'false');
    if (titleCheck) titleCheck.checked = val;
    if (pauseCheck) pauseCheck.checked = val;
  };

  if (titleCheck) {
    titleCheck.checked = savedAutoCollect;
    titleCheck.addEventListener('change', (e) => updateAutoCollect(e.target.checked));
  }
  if (pauseCheck) {
    pauseCheck.checked = savedAutoCollect;
    pauseCheck.addEventListener('change', (e) => updateAutoCollect(e.target.checked));
  }

  // ── Boutons de navigation ──────────────────────────────────
  document.getElementById('btn-play').addEventListener('click', () => { show(null); onStart(); });
  document.getElementById('btn-restart').addEventListener('click', () => { show(null); onStart(); });
  document.getElementById('btn-resume').addEventListener('click', () => game.togglePause());
  document.getElementById('btn-quit').addEventListener('click', () => {
    state.status = 'menu';
    show('title');
  });

  events.on('pauseChanged', ({ paused }) => show(paused ? 'pause' : null));

  // ── Écran de fin avec sauvegarde et affichage des records ────
  events.on('gameOver', ({ win }) => {
    const timeSec = Math.round(state.time);
    const scores = getScores();
    let isNewRecord = false;
    let recordText = '';

    if (win) {
      if (!scores.bestWinTime || timeSec < scores.bestWinTime) {
        scores.bestWinTime = timeSec;
        isNewRecord = true;
      }
      recordText = `🏆 Meilleur temps : ${scores.bestWinTime}s${isNewRecord ? ' (Nouveau record !)' : ''}`;
    } else {
      if (!scores.bestSurvivalTime || timeSec > scores.bestSurvivalTime) {
        scores.bestSurvivalTime = timeSec;
        isNewRecord = true;
      }
      if (!scores.bestWave || state.wave > scores.bestWave) {
        scores.bestWave = state.wave;
      }
      recordText = `⭐ Record survie : ${scores.bestSurvivalTime}s · Vague max : ${scores.bestWave ?? state.wave}${isNewRecord ? ' (Nouveau record !)' : ''}`;
    }
    saveScores(scores);

    document.getElementById('end-title').textContent = win ? 'Victoire ! 🎃' : 'Ils ont eu ton cerveau… 🧠';
    document.getElementById('end-text').textContent = win
      ? `Le cimetière est sauvé en ${timeSec} secondes.`
      : `Tu as tenu ${timeSec} secondes et ${state.wave} vague(s).`;

    const bestEl = document.getElementById('end-best');
    if (bestEl) {
      bestEl.textContent = recordText;
    }

    setTimeout(() => show('end'), 900);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') game.togglePause();
    if (e.key === 'Enter' && screens.title && !screens.title.classList.contains('hidden')) {
      show(null);
      onStart();
    }
  });
}
