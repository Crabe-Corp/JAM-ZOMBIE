// =============================================================
//  PLANTE — rôle A (moteur)
//  Les stats viennent de data/plants.json (rempli par C).
//  Types gérés : 'tireur', 'producteur', 'mur'.
// =============================================================
import { cellCenter } from '../grid.js';
import { events } from '../../events.js';
import { drawSprite, drawHealthBar } from '../../content/assets.js';

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
    this.prodTimer = (def.intervalleProduction ?? 10) * 0.5;   // 1re production plus rapide
  }

  update(dt, game) {
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    switch (this.def.type) {
      case 'tireur':
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && game.hasZombieAhead(this.row, this.x)) {
          game.spawnProjectile(this);
          this.shootTimer = this.def.cadence;
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

      case 'mur':
        // Ne fait rien : encaisse les morsures.
        break;

      // TODO(A) : nouveaux types, ex. 'ralentisseur' (toile d'araignée), 'explosif' (citrouille bombe)
      default:
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
    drawSprite(ctx, this.def, this.x, this.y, 72, { flash: this.hitFlash > 0 });
    if (this.hp < this.maxHp) {
      drawHealthBar(ctx, this.x, this.y - 44, 56, this.hp / this.maxHp, '#7bd66b');
    }
  }
}
