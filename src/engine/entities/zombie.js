// =============================================================
//  ZOMBIE — rôle A (moteur)
//  Avance vers la gauche, s'arrête pour manger la première plante
//  qu'il touche, déclenche la défaite s'il atteint la maison.
// =============================================================
import { ZOMBIE_SPAWN_X, HOUSE_X } from '../../config.js';
import { rowCenterY } from '../grid.js';
import { events } from '../../events.js';
import { drawSprite, drawHealthBar } from '../../content/assets.js';

const DEATH_DURATION = 0.45;
const JUMP_DURATION = 0.5;

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
    this.dying = false;
    this.deathTimer = 0;
    this.eating = null;
    this.biteTimer = 0;
    this.hitFlash = 0;
    this.wobble = Math.random() * Math.PI * 2;

    // Ralentissement (plante ralentisseur 🕸️)
    this.slowTimer = 0;
    this.slowFactor = 0.5;

    // Zombie sauteur (saute par-dessus la première plante rencontrée)
    this.canJump = Boolean(
      def.peutSauter || def.saut || def.type === 'sauteur' || def.comportement === 'sauteur' || def.id === 'sauteur',
    );
    this.hasJumped = false;
    this.jumping = false;
    this.jumpTimer = 0;
    this.jumpStartX = 0;
    this.jumpTargetX = 0;

    // Zombie fantôme (ne peut être touché qu'une fois sur deux)
    this.isGhost = Boolean(
      def.fantome || def.intangible || def.type === 'fantome' || def.comportement === 'fantome' || def.id === 'fantome' || def.id === 'spectre',
    );
    this.ghostDodgeNext = false;
  }

  update(dt, game) {
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    if (this.dying) {
      this.deathTimer += dt;
      if (this.deathTimer >= DEATH_DURATION) {
        this.dead = true;
      }
      return;
    }

    if (this.slowTimer > 0) {
      this.slowTimer = Math.max(0, this.slowTimer - dt);
    }
    const speedFactor = this.slowTimer > 0 ? this.slowFactor : 1;
    this.wobble += dt * 5 * speedFactor;

    if (this.jumping) {
      this.jumpTimer += dt * speedFactor;
      const t = Math.min(1, this.jumpTimer / JUMP_DURATION);
      this.x = this.jumpStartX + (this.jumpTargetX - this.jumpStartX) * t;
      if (t >= 1) this.jumping = false;
      if (this.x < HOUSE_X && !game.tryTriggerMower(this.row)) game.lose();
      return;
    }

    const blocking = game.plantBlocking(this.row, this.x);
    if (blocking && this.canJump && !this.hasJumped) {
      this.hasJumped = true;
      this.jumping = true;
      this.jumpTimer = 0;
      this.jumpStartX = this.x;
      this.jumpTargetX = blocking.x - 42;
      this.eating = null;
      return;
    }

    this.eating = blocking;
    if (this.eating) {
      this.eating.takeDamage(this.def.degatsParSeconde * speedFactor * dt);
      this.biteTimer -= dt * speedFactor;
      if (this.biteTimer <= 0) {
        events.emit('zombieBite', { zombie: this, plant: this.eating });
        this.biteTimer = 0.6;
      }
    } else {
      this.x -= this.speed * speedFactor * dt;
    }

    if (this.x < HOUSE_X && !game.tryTriggerMower(this.row)) {
      game.lose();
    }
  }

  applySlow(duration = 3, factor = 0.5) {
    if (this.dead || this.dying) return;
    this.slowTimer = Math.max(this.slowTimer, duration);
    this.slowFactor = factor > 1 ? factor / 100 : factor;
  }

  tryProjectileHit() {
    if (!this.isGhost) return true;
    const hit = !this.ghostDodgeNext;
    this.ghostDodgeNext = !this.ghostDodgeNext;
    return hit;
  }

  takeDamage(amount) {
    if (this.dead || this.dying) return;
    this.hp -= amount;
    this.hitFlash = 0.08;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dying = true;
      this.deathTimer = 0;
      events.emit('zombieDied', { zombie: this });
    }
  }

  draw(ctx) {
    const size = this.def.taille ?? 78;

    if (this.dying) {
      const t = Math.min(1, this.deathTimer / DEATH_DURATION);
      ctx.save();
      ctx.translate(this.x, this.y + t * 18);
      ctx.rotate(-t * 1.35);
      drawSprite(ctx, this.def, 0, 0, size, { alpha: Math.max(0, 1 - t) });
      ctx.restore();
      return;
    }

    // Balancement de marche (ou saut en cloche)
    const bob = this.eating ? Math.sin(this.wobble * 2) * 2 : Math.sin(this.wobble) * 3;
    const jumpY = this.jumping
      ? -Math.sin(Math.min(1, this.jumpTimer / JUMP_DURATION) * Math.PI) * 55
      : 0;
    const drawY = this.y + bob + jumpY;

    const alpha = this.isGhost ? (this.ghostDodgeNext ? 0.42 : 0.88) : 1;

    if (this.slowTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(130, 215, 255, 0.28)';
      ctx.strokeStyle = 'rgba(180, 235, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + size * 0.36, 26, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    drawSprite(ctx, this.def, this.x, drawY, size, { flash: this.hitFlash > 0, alpha });

    if (this.hp < this.maxHp) {
      drawHealthBar(ctx, this.x, drawY - size / 2 - 6, 56, this.hp / this.maxHp, '#e0454a');
    }
  }
}
