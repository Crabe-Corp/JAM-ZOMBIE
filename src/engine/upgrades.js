// =============================================================
//  AMÉLIORATIONS — rôle A (moteur)
//  Système roguelike : avant chaque vague (sauf la première), le jeu
//  se met en pause et propose quelques améliorations tirées de
//  data/upgrades.json (rempli par D). L'interface (B) affiche le
//  choix et appelle game.chooseUpgrade(id).
// =============================================================
import { state } from '../state.js';
import { events } from '../events.js';

// Valeur d'une stat absente du JSON de la plante (voir docs/donnees.md)
const DEFAULTS = {
  projectilesParTir: 1,
  perforation: 0,
  lignesTir: 1,
  degatsBrulure: 0,
  dureeBrulure: 0,
  regeneration: 0,
  degatsEpines: 0,
  reductionMorsure: 0,
  degatsMort: 0,
  rayonMort: 0,
  chanceBonbonDore: 0,
  facteurVitesse: 1,
  dureeRalentissement: 0,
  facteurVitesseApresGel: 1,
  dureeApresGel: 0,
  usages: 1,
};

// Stats qui modifient le niveau plutôt que les plantes (plante "*"), avec leur défaut
const LEVEL_STATS = { valeurBonbonCiel: 25, intervalleCiel: 9 };

export class UpgradeManager {
  constructor() {
    this.rules = {};
    this.list = [];
    this.reset();
  }

  setData(data) {
    this.rules = data?.regles ?? {};
    this.list = data?.ameliorations ?? [];
  }

  reset() {
    this.taken = {};      // { [upgradeId]: nombre de fois prise }
    this.choices = null;  // améliorations proposées en ce moment
  }

  /** Appelé par les vagues : propose un choix avant chaque vague sauf la première. */
  maybeOffer(waveIndex, game) {
    if (waveIndex < 2 || !this.list.length) return false;
    const choices = this.draw(game, this.rules.choixProposes ?? 3);
    if (!choices.length) return false;
    this.choices = choices;
    state.status = 'choosing';
    events.emit('upgradeOffer', { choices, wave: waveIndex });
    return true;
  }

  choose(id, game) {
    const up = this.choices?.find((u) => u.id === id);
    if (!up) return false;
    this.apply(up, game);
    this.taken[up.id] = (this.taken[up.id] ?? 0) + 1;
    this.choices = null;
    state.status = 'playing';
    events.emit('upgradeChosen', { upgrade: up, level: this.taken[up.id] });
    return true;
  }

  available(game) {
    return this.list.filter((u) => {
      if ((this.taken[u.id] ?? 0) >= (u.niveauMax ?? 1)) return false;
      if (u.requiert && !this.taken[u.requiert]) return false;
      return u.plante === '*' || !!game.plantDefs[u.plante];
    });
  }

  /** Tire n améliorations différentes, pondérées par leur rareté. */
  draw(game, n) {
    const weights = this.rules.poidsRarete ?? { commune: 60, rare: 30, epique: 10 };
    const pool = this.available(game);
    const picked = [];
    while (picked.length < n && pool.length) {
      const total = pool.reduce((s, u) => s + (weights[u.rarete] ?? 1), 0);
      let r = Math.random() * total;
      let i = 0;
      while (i < pool.length - 1 && (r -= weights[pool[i].rarete] ?? 1) > 0) i++;
      picked.push(pool.splice(i, 1)[0]);
    }
    return picked;
  }

  apply(up, game) {
    for (const effet of up.effets ?? []) {
      if (up.plante === '*' && effet.stat in LEVEL_STATS) {
        game.level[effet.stat] = modify(game.level[effet.stat] ?? LEVEL_STATS[effet.stat], effet);
        continue;
      }
      const defs = up.plante === '*' ? Object.values(game.plantDefs) : [game.plantDefs[up.plante]];
      for (const def of defs) if (def) modifyDef(def, effet);
    }
  }
}

function modify(value, effet) {
  if (effet.fixe != null) return effet.fixe;
  if (effet.mult != null) return value * effet.mult;
  if (effet.ajout != null) return value + effet.ajout;
  return value;
}

function modifyDef(def, effet) {
  const before = def[effet.stat] ?? DEFAULTS[effet.stat] ?? 0;
  let after = modify(before, effet);
  if (effet.stat === 'cout') after = Math.max(0, Math.round(after));
  def[effet.stat] = after;

  // Plus de vie : les plantes déjà posées en profitent aussi
  if (effet.stat === 'vie') {
    const gain = after - before;
    for (const p of state.plants) {
      if (p.def !== def) continue;
      p.maxHp += gain;
      p.hp += gain;
    }
  }
}
