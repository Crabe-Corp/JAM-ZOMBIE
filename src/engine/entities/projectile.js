// =============================================================
//  PROJECTILE — rôle A (moteur)
//  Deux sortes :
//    - graine : avance tout droit sur sa ligne et touche le premier
//      zombie croisé (ou plusieurs avec la perforation)
//    - potion (option `lob`) : vole en cloche jusqu'à un zombie précis,
//      par-dessus les plantes, et éclabousse les zombies proches
// =============================================================
import { CANVAS_W } from '../../config.js';
import { events } from '../../events.js';
import { drawProjectile } from '../../content/assets.js';

const LOB_HEIGHT = 90;   // hauteur de la cloche (px)

export class Projectile {
  constructor({
    x, y, row, damage, speed = 320, color,
    slowDuration = 0, slowFactor = 0.5,
    pierce = 0, burnDps = 0, burnDuration = 0,
    lob = null,
  }) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.slowDuration = slowDuration;
    this.slowFactor = slowFactor;
    this.pierce = pierce;           // zombies supplémentaires traversés
    this.burnDps = burnDps;
    this.burnDuration = burnDuration;
    this.ignoredZombies = new Set();
    this.dead = false;

    this.lob = lob;
    if (lob) {
      this.startX = x;
      this.startY = y;
      this.flyTime = 0;
      this.targetX = lob.target.x;
      this.targetY = lob.target.y;
    }
  }

  update(dt, game) {
    if (this.lob) {
      this.updateLob(dt, game);
      return;
    }

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
      this.hit(zombie, this.damage);
      events.emit('projectileHit', { projectile: this, zombie });
      if (this.pierce > 0) {
        this.pierce--;
        this.ignoredZombies.add(zombie);
      } else {
        this.dead = true;
      }
    }
  }

  updateLob(dt, game) {
    const { target, duration, splashRadius, splashDamage } = this.lob;
    // La potion suit sa cible tant qu'elle est vivante
    if (!target.dead && !target.dying) {
      this.targetX = target.x;
      this.targetY = target.y;
    }
    this.flyTime += dt;
    const t = Math.min(1, this.flyTime / duration);
    this.x = this.startX + (this.targetX - this.startX) * t;
    this.y = this.startY + (this.targetY - this.startY) * t - Math.sin(t * Math.PI) * LOB_HEIGHT;
    if (t < 1) return;

    this.dead = true;
    if (!target.dead && !target.dying) {
      this.hit(target, this.damage);
      events.emit('projectileHit', { projectile: this, zombie: target });
    }
    if (splashRadius > 0 && splashDamage > 0) {
      for (const z of game.zombiesInRadius(this.targetX, this.targetY, splashRadius)) {
        if (z !== target) this.hit(z, splashDamage);
      }
    }
  }

  hit(zombie, damage) {
    zombie.takeDamage(damage);
    if (this.slowDuration > 0) zombie.applySlow(this.slowDuration, this.slowFactor);
    if (this.burnDps > 0 && this.burnDuration > 0) zombie.applyBurn(this.burnDps, this.burnDuration);
  }

  draw(ctx) {
    drawProjectile(ctx, this);
  }
}
