// =============================================================
//  PROJECTILE — rôle A (moteur)
//  Avance tout droit sur sa ligne et touche le premier zombie croisé.
// =============================================================
import { CANVAS_W } from '../../config.js';
import { events } from '../../events.js';
import { drawProjectile } from '../../content/assets.js';

export class Projectile {
  constructor({ x, y, row, damage, speed, color, slowDuration = 0, slowFactor = 0.5 }) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.slowDuration = slowDuration;
    this.slowFactor = slowFactor;
    this.ignoredZombies = new Set();
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
      if (typeof zombie.tryProjectileHit === 'function' && !zombie.tryProjectileHit()) {
        this.ignoredZombies.add(zombie);
        return;
      }
      zombie.takeDamage(this.damage);
      if (this.slowDuration > 0 && typeof zombie.applySlow === 'function') {
        zombie.applySlow(this.slowDuration, this.slowFactor);
      }
      this.dead = true;
      events.emit('projectileHit', { projectile: this, zombie });
    }
  }

  draw(ctx) {
    drawProjectile(ctx, this);
  }
}
