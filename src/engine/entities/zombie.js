// =============================================================
//  ZOMBIE — rôle A (moteur)
//  Avance vers la gauche, s'arrête pour manger la première plante
//  qu'il touche, déclenche la défaite s'il atteint la maison.
// =============================================================
import { ZOMBIE_SPAWN_X, HOUSE_X } from '../../config.js';
import { rowCenterY } from '../grid.js';
import { events } from '../../events.js';
import { drawSprite, drawHealthBar } from '../../content/assets.js';

export class Zombie {
  constructor(def, row) {
    this.def = def;
    this.row = row;
    this.x = ZOMBIE_SPAWN_X + Math.random() * 20;
    this.y = rowCenterY(row);
    this.hp = def.vie;
    this.maxHp = def.vie;
    this.speed = def.vitesse;      // pixels par seconde
    this.dead = false;
    this.eating = null;
    this.biteTimer = 0;
    this.hitFlash = 0;
    this.wobble = Math.random() * Math.PI * 2;
  }

  update(dt, game) {
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.wobble += dt * 5;

    this.eating = game.plantBlocking(this.row, this.x);
    if (this.eating) {
      this.eating.takeDamage(this.def.degatsParSeconde * dt);
      this.biteTimer -= dt;
      if (this.biteTimer <= 0) {
        events.emit('zombieBite', { zombie: this, plant: this.eating });
        this.biteTimer = 0.6;
      }
    } else {
      this.x -= this.speed * dt;
    }

    if (this.x < HOUSE_X) game.lose();
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp -= amount;
    this.hitFlash = 0.08;
    if (this.hp <= 0) {
      this.dead = true;
      events.emit('zombieDied', { zombie: this });
      // TODO(A) : petite animation de mort (fondu, chute) avant de retirer le zombie
    }
  }

  draw(ctx) {
    // Balancement de marche (pas pendant qu'il mange)
    const bob = this.eating ? Math.sin(this.wobble * 2) * 2 : Math.sin(this.wobble) * 3;
    const size = this.def.taille ?? 78;
    drawSprite(ctx, this.def, this.x, this.y + bob, size, { flash: this.hitFlash > 0 });
    if (this.hp < this.maxHp) {
      drawHealthBar(ctx, this.x, this.y - size / 2 - 6, 56, this.hp / this.maxHp, '#e0454a');
    }
  }
}
