// =============================================================
//  VAGUES — rôle A (moteur)
//  Transforme la liste de vagues de data/levels.json (écrite par C)
//  en un planning d'apparitions, seconde par seconde.
// =============================================================
import { ROWS } from '../config.js';
import { state } from '../state.js';
import { events } from '../events.js';

export class WaveManager {
  constructor() {
    this.reset(null);
  }

  reset(level) {
    this.time = 0;
    this.waves = level ? level.vagues : [];
    this.nextWave = 0;
    this.offeredFor = -1;   // dernière vague pour laquelle un choix a été proposé
    this.queue = [];

    this.waves.forEach((wave, waveIndex) => {
      for (const group of wave.zombies) {
        for (let k = 0; k < group.nombre; k++) {
          this.queue.push({
            time: wave.temps + (group.decalage ?? 0) + k * (group.intervalle ?? 0),
            type: group.type,
            row: group.ligne ?? null,   // null = ligne au hasard
            wave: waveIndex,
          });
        }
      }
    });
    this.queue.sort((a, b) => a.time - b.time);
    this.totalSpawns = this.queue.length;
    state.totalWaves = this.waves.length;
  }

  update(dt, game) {
    this.time += dt;

    // Annonce des vagues
    while (this.nextWave < this.waves.length && this.time >= this.waves[this.nextWave].temps) {
      // Choix d'amélioration avant la vague : la partie attend que le joueur choisisse
      if (this.offeredFor !== this.nextWave) {
        this.offeredFor = this.nextWave;
        if (game.upgrades.maybeOffer(this.nextWave + 1, game)) return;
      }
      const wave = this.waves[this.nextWave];
      state.wave = this.nextWave + 1;
      events.emit('waveStart', { index: state.wave, total: this.waves.length, finale: !!wave.finale });
      this.nextWave++;
    }

    // Apparition des zombies
    while (this.queue.length && this.queue[0].time <= this.time) {
      const spawn = this.queue.shift();
      const row = spawn.row ?? Math.floor(Math.random() * ROWS);
      game.spawnZombie(spawn.type, row);
    }
  }

  /** true quand tous les zombies du niveau sont apparus. */
  get finished() {
    return this.queue.length === 0 && this.nextWave >= this.waves.length;
  }

  /** Progression de 0 à 1 (pour la barre de vagues de B). */
  get progress() {
    if (!this.totalSpawns) return 0;
    return 1 - this.queue.length / this.totalSpawns;
  }
}
