// =============================================================
//  PLANTE — rôle A (moteur)
//  Les stats viennent de data/plants.json (rempli par C/D).
//  Types gérés : 'tireur', 'producteur', 'mur', 'ralentisseur', 'explosif'.
// =============================================================
import { cellCenter } from '../grid.js';
import { events } from '../../events.js';
import { drawSprite, drawHealthBar } from '../../content/assets.js';

const SHOOT_ANIM_DURATION = 0.18;

export class Plant {
  constructor(def, row, col) {
    this.def = def;
    this.row = row;
    this.col = col;
    const c = cellCenter(row, col);
    this.x = c.x;
    this.y = c.y;
    this.hp = def.vie;
    this.maxHp = def.vie;
    this.dead = false;
    this.hitFlash = 0;
    this.shootTimer = 0;                                       // tire dès qu'un zombie arrive
    this.shootAnim = 0;                                        // animation de tir (grossissement)
    this.prodTimer = (def.intervalleProduction ?? 10) * 0.5;   // 1re production plus rapide
    this.fuseDuration = def.delaiExplosion ?? def.delai ?? 1.0;
    this.fuseTimer = this.fuseDuration;
  }

  update(dt, game) {
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.shootAnim = Math.max(0, this.shootAnim - dt);

    switch (this.def.type) {
      case 'tireur':
      case 'ralentisseur':
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && game.hasZombieAhead(this.row, this.x)) {
          game.spawnProjectile(this);
          this.shootTimer = this.def.cadence ?? 1.4;
          this.shootAnim = SHOOT_ANIM_DURATION;
        }
        break;

      case 'producteur':
        this.prodTimer -= dt;
        if (this.prodTimer <= 0) {
          this.prodTimer = this.def.intervalleProduction;
          // C'est l'économie (B) qui écoute et fait apparaître le bonbon
          events.emit('resourceProduced', { x: this.x, y: this.y, amount: this.def.production });
        }
        break;

      case 'explosif':
        this.fuseTimer -= dt;
        if (this.fuseTimer <= 0 && !this.dead) {
          const rawRadius = this.def.rayon ?? this.def.rayonExplosion ?? 140;
          const radius = rawRadius <= 5 ? rawRadius * 90 : rawRadius;
          const damage = this.def.degats ?? this.def.degatsExplosion ?? 500;
          game.triggerExplosion(this.x, this.y, radius, damage);
          this.dead = true;
          events.emit('plantDied', { plant: this });
        }
        break;

      case 'mur':
      default:
        // Ne fait rien : encaisse les morsures.
        break;
    }
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp -= amount;
    this.hitFlash = 0.08;
    if (this.hp <= 0) {
      this.dead = true;
      events.emit('plantDied', { plant: this });
    }
  }

  draw(ctx) {
    let scale = 1;
    let flash = this.hitFlash > 0;

    if (this.shootAnim > 0) {
      const p = this.shootAnim / SHOOT_ANIM_DURATION;
      scale = 1 + 0.24 * Math.sin(p * Math.PI);
    } else if (this.def.type === 'explosif') {
      const progress = Math.max(0, 1 - this.fuseTimer / Math.max(0.01, this.fuseDuration));
      scale = 1 + 0.28 * progress + 0.06 * Math.sin(progress * 30);
      if (Math.sin(progress * 35) > 0.2) flash = true;
    }

    drawSprite(ctx, this.def, this.x, this.y, 72 * scale, { flash });
    if (this.hp < this.maxHp && this.def.type !== 'explosif') {
      drawHealthBar(ctx, this.x, this.y - 44, 56, this.hp / this.maxHp, '#7bd66b');
    }
  }
}
