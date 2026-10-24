// =============================================================
//  BUS D'ÉVÉNEMENTS — fichier PARTAGÉ (point de contact n°3)
//  Ne renommez pas un événement sans prévenir les deux autres.
//
//  Utilisation :
//    events.on('zombieDied', ({ zombie }) => { ... });
//    events.emit('zombieDied', { zombie });
//
//  ── Émis par le MOTEUR (A) ───────────────────────────────────
//    gameStart         { level }
//    plantPlaced       { plant }
//    plantDied         { plant }            (mangée par un zombie)
//    plantRemoved      { plant }            (retirée à la pelle)
//    zombieSpawned     { zombie }
//    zombieBite        { zombie, plant }
//    zombieDied        { zombie }
//    projectileFired   { projectile, plant }
//    projectileHit     { projectile, zombie }
//    resourceProduced  { x, y, amount }     (une plante "producteur" a produit)
//    waveStart         { index, total, finale }
//    pauseChanged      { paused }
//    gameOver          { win }
//
//  ── Émis par l'INTERFACE (B) ─────────────────────────────────
//    resourcesChanged  { resources }
//    resourceCollected { amount, x, y }
//    cardSelected      { plantId }          (null = aucune carte)
// =============================================================

const listeners = new Map();

export const events = {
  /** S'abonne à un événement. Renvoie une fonction pour se désabonner. */
  on(name, fn) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
    return () => listeners.get(name).delete(fn);
  },

  /** Déclenche un événement. Une erreur dans un écouteur ne casse pas le jeu. */
  emit(name, payload = {}) {
    const set = listeners.get(name);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[events] erreur dans un écouteur de "${name}"`, err);
      }
    }
  },
};
