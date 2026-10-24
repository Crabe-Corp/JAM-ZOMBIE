// =============================================================
//  PROJECTILE — rôle A (moteur)
//  Avance tout droit sur sa ligne et touche le premier zombie croisé.
// =============================================================
import { CANVAS_W } from '../../config.js';
import { events } from '../../events.js';
import { drawProjectile } from '../../content/assets.js';

export class Projectile {
  constructor({ x, y, row, damage, speed, color }) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.dead = false;
  }

  update(dt, game) {
    this.x += this.speed * dt;
    if (this.x > CANVAS_W + 40) {
      this.dead = true;
      return;
    }
    const zombie = game.zombieHitBy(this);
    if (zombie) {
      zombie.takeDamage(this.damage);
      this.dead = true;
      events.emit('projectileHit', { projectile: this, zombie });
      // TODO(A) : effets spéciaux (ralentir, dégâts de zone...) selon la plante
    }
  }

  draw(ctx) {
    drawProjectile(ctx, this);
  }
}
