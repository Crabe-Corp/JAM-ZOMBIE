// =============================================================
//  BUS D'ÉVÉNEMENTS — fichier PARTAGÉ (point de contact n°3)
//  Ne renommez pas un événement sans prévenir les autres rôles.
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
//    plantUsed         { plant }            (bombe, givre ou piège qui a servi)
//    bombExploded      { x, y, radius, damage }
//    zombieSpawned     { zombie }
//    zombieBite        { zombie, plant }
//    zombieDied        { zombie }
//    projectileFired   { projectile, plant }
//    projectileHit     { projectile, zombie }
//    resourceProduced  { x, y, amount, golden }  (une plante "producteur" a produit)
//    waveStart         { index, total, finale }
//    upgradeOffer      { choices, wave }    (la partie attend un choix d'amélioration)
//    upgradeChosen     { upgrade, level }
//    pauseChanged      { paused }
//    speedChanged      { speed }            (1 ou 2)
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
