// =============================================================
//  MENUS — rôle B (interface)
//  Écran titre (choix du niveau), pause (avec un conseil), victoire /
//  défaite, meilleur score par niveau (localStorage) et option de
//  ramassage auto au survol. Les textes viennent de data/textes.json (D).
// =============================================================
import { state } from '../state.js';
import { events } from '../events.js';

const SCORES_KEY = 'citrouilles_vs_zombies_scores';
const AUTOCOLLECT_KEY = 'zombies_autocollect';
const LEVEL_KEY = 'zombies_level';

// localStorage peut être indisponible (navigation privée, iframe…) : on ne plante jamais
function load(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function getScores() {
  try {
    return JSON.parse(load(SCORES_KEY)) || {};
  } catch {
    return {};
  }
}

/** Remplace {cle} par la valeur correspondante. */
function fill(text, values) {
  return text.replace(/\{(\w+)\}/g, (m, k) => values[k] ?? m);
}

export function initMenu(game, { onStart, levels, textes = {} }) {
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

  // ── Choix du niveau ─────────────────────────────────────────
  let levelIndex = Math.min(Number(load(LEVEL_KEY)) || 0, levels.length - 1);
  const levelBox = document.getElementById('level-select');
  const levelIntro = document.getElementById('level-intro');

  function renderLevels() {
    if (!levelBox) return;
    levelBox.innerHTML = '';
    levels.forEach((lvl, i) => {
      const btn = document.createElement('button');
      btn.className = 'level-btn' + (i === levelIndex ? ' selected' : '');
      btn.textContent = `${i + 1}. ${lvl.nom}`;
      btn.addEventListener('click', () => {
        levelIndex = i;
        save(LEVEL_KEY, String(i));
        renderLevels();
      });
      levelBox.appendChild(btn);
    });
    const intro = textes.niveaux?.[levels[levelIndex].id];
    if (levelIntro && intro) levelIntro.textContent = intro;
  }
  renderLevels();

  const start = () => {
    show(null);
    onStart(levels[levelIndex]);
  };

  // ── Option : Ramassage automatique des bonbons au survol ────
  const savedAutoCollect = load(AUTOCOLLECT_KEY) === 'true';
  state.autoCollect = savedAutoCollect;

  const titleCheck = document.getElementById('opt-autocollect-title');
  const pauseCheck = document.getElementById('opt-autocollect-pause');

  const updateAutoCollect = (val) => {
    state.autoCollect = val;
    save(AUTOCOLLECT_KEY, val ? 'true' : 'false');
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
  document.getElementById('btn-play').addEventListener('click', start);
  document.getElementById('btn-restart').addEventListener('click', start);
  document.getElementById('btn-menu')?.addEventListener('click', () => show('title'));
  document.getElementById('btn-resume').addEventListener('click', () => game.togglePause());
  document.getElementById('btn-quit').addEventListener('click', () => {
    state.status = 'menu';
    show('title');
  });

  // Un conseil au hasard à chaque pause
  const tip = document.getElementById('pause-tip');
  events.on('pauseChanged', ({ paused }) => {
    if (paused && tip && textes.conseils?.length) {
      tip.textContent = `💡 ${textes.conseils[Math.floor(Math.random() * textes.conseils.length)]}`;
    }
    show(paused ? 'pause' : null);
  });

  // ── Écran de fin avec sauvegarde et affichage des records ────
  events.on('gameOver', ({ win }) => {
    const timeSec = Math.round(state.time);
    const level = levels[levelIndex];
    const allScores = getScores();
    const scores = allScores[level.id] ?? {};
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
    allScores[level.id] = scores;
    save(SCORES_KEY, JSON.stringify(allScores));

    const fin = textes.fin ?? {};
    const values = { niveau: level.nom, temps: timeSec, vagues: state.wave };
    document.getElementById('end-title').textContent = win
      ? (fin.victoireTitre ?? 'Victoire ! 🎃')
      : (fin.defaiteTitre ?? 'Ils ont eu ton cerveau… 🧠');
    document.getElementById('end-text').textContent = win
      ? fill(fin.victoireTexte ?? '{niveau} est sauvé en {temps} secondes.', values)
      : fill(fin.defaiteTexte ?? 'Tu as tenu {temps} secondes et {vagues} vague(s).', values);

    const bestEl = document.getElementById('end-best');
    if (bestEl) {
      bestEl.textContent = recordText;
    }

    setTimeout(() => show('end'), 900);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') game.togglePause();
    if (e.key === 'Enter' && screens.title && !screens.title.classList.contains('hidden')) {
      e.preventDefault();   // sinon le bouton qui a le focus relance aussi la partie
      start();
    }
  });
}
