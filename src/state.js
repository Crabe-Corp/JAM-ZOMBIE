// =============================================================
//  ÉTAT PARTAGÉ DE LA PARTIE — fichier PARTAGÉ (point de contact n°2)
//
//  Tout le monde peut LIRE n'importe quel champ.
//  Pour ÉCRIRE, chacun ne touche qu'à ses champs :
//    A (moteur)    → status, plants, zombies, projectiles, wave, totalWaves, time, speed
//    B (interface) → resources, selectedCard, cooldowns, autoCollect
//
//  Astuce debug : tapez `state` dans la console du navigateur.
// =============================================================

function freshState() {
  return {
    status: 'menu',      // 'menu' | 'playing' | 'paused' | 'choosing' | 'won' | 'lost'
    resources: 0,        // nombre de bonbons 🍬
    plants: [],          // instances de Plant
    zombies: [],         // instances de Zombie
    projectiles: [],     // instances de Projectile
    wave: 0,             // vague en cours (1, 2, 3...)
    totalWaves: 0,
    time: 0,             // secondes écoulées depuis le début de la partie
    speed: 1,            // vitesse du jeu (1 ou 2)
    selectedCard: null,  // id de la plante sélectionnée, 'pelle', ou null
    cooldowns: {},       // { [plantId]: secondes restantes avant de pouvoir reposer }
    autoCollect: false,  // ramassage automatique des bonbons au survol
  };
}

export const state = freshState();

/** Remet l'état à zéro (nouvelle partie). */
export function resetState(overrides = {}) {
  const currentAutoCollect = state.autoCollect;
  Object.assign(state, freshState(), { autoCollect: currentAutoCollect }, overrides);
}
