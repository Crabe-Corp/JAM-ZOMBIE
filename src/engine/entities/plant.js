// =============================================================
//  PLANTE — rôle A (moteur)
//  Les stats viennent de data/plants.json (rempli par D).
//  Types gérés : 'tireur', 'ralentisseur', 'producteur', 'mur',
//  'explosif', 'gel', 'piege', 'lanceur'.
//  Les améliorations (engine/upgrades.js) modifient this.def en
//  cours de partie : on relit donc toujours les stats dans this.def.
// =============================================================
import { ROWS } from '../../config.js';
import { cellCenter } from '../grid.js';
import { events } from '../../events.js';
import { drawSprite, drawHealthBar } from '../../content/assets.js';

const SHOOT_ANIM_DURATION = 0.18;
const BURST_DELAY = 0.15;   // délai entre deux graines du tir double
const TRAP_RANGE = 35;      // distance (px) à laquelle un zombie déclenche le piège

export class Plant {
  constructor(def, row, col, game) {
    this.def = def;
    this.game = game;
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
    this.burstLeft = 0;                                        // graines restantes du tir en rafale
    this.burstTimer = 0;
    this.prodTimer = (def.intervalleProduction ?? 10) * 0.5;   // 1re production plus rapide
    this.fuseDuration = def.delaiExplosion ?? def.delaiGel ?? 1.0;
    this.fuseTimer = this.fuseDuration;
    this.armTimer = def.delaiArmement ?? 0;                    // piège : temps avant d'être armé
    this.usesLeft = def.usages ?? 1;
  }

  /** Piège armé : caché sous terre, les zombies ne s'arrêtent pas pour le manger. */
  get isHidden() {
    return this.def.type === 'piege' && this.armTimer <= 0;
  }

  update(dt, game) {
    const d = this.def;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.shootAnim = Math.max(0, this.shootAnim - dt);
    if (d.regeneration) this.hp = Math.min(this.maxHp, this.hp + d.regeneration * dt);

    switch (d.type) {
      case 'tireur':
      case 'ralentisseur':
        this.updateShooter(dt, game);
        break;

      case 'lanceur': {
        this.shootTimer -= dt;
        const target = this.shootTimer <= 0 && game.firstZombieAhead(this.row, this.x);
        if (target) {
          game.spawnLob(this, target);
          this.shootTimer = d.cadence ?? 3;
          this.shootAnim = SHOOT_ANIM_DURATION;
        }
        break;
      }

      case 'producteur':
        this.prodTimer -= dt;
        if (this.prodTimer <= 0) {
          this.prodTimer = d.intervalleProduction;
          const golden = Math.random() < (d.chanceBonbonDore ?? 0);
          const bonus = golden ? (game.upgrades.rules.multiplicateurBonbonDore ?? 3) : 1;
          // C'est l'économie (B) qui écoute et fait apparaître le bonbon
          events.emit('resourceProduced', { x: this.x, y: this.y, amount: d.production * bonus, golden });
        }
        break;

      case 'explosif':
        this.fuseTimer -= dt;
        if (this.fuseTimer <= 0) {
          game.triggerExplosion(this.x, this.y, d.rayonExplosion ?? d.rayon ?? 140, d.degatsExplosion ?? d.degats ?? 500);
          this.consume();
        }
        break;

      case 'gel':
        this.fuseTimer -= dt;
        if (this.fuseTimer <= 0) {
          game.triggerFreeze(this.x, this.y, d.rayonGel ?? 230, d.dureeGel ?? 4, d.degatsGel ?? 0, {
            factor: d.facteurVitesseApresGel,
            duration: d.dureeApresGel,
          });
          this.consume();
        }
        break;

      case 'piege':
        this.updateTrap(dt, game);
        break;

      case 'mur':
      default:
        // Ne fait rien : encaisse les morsures.
        break;
    }
  }

  updateShooter(dt, game) {
    const d = this.def;
    const rows = this.targetRows();

    // Graines suivantes d'un tir double
    if (this.burstLeft > 0) {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) {
        for (const r of rows) game.spawnProjectile(this, r);
        this.burstLeft--;
        this.burstTimer = BURST_DELAY;
      }
    }

    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && rows.some((r) => game.hasZombieAhead(r, this.x))) {
      for (const r of rows) game.spawnProjectile(this, r);
      this.shootTimer = d.cadence ?? 1.4;
      this.shootAnim = SHOOT_ANIM_DURATION;
      this.burstLeft = (d.projectilesParTir ?? 1) - 1;
      this.burstTimer = BURST_DELAY;
    }
  }

  /** Lignes visées : la sienne, ou aussi celles du dessus et du dessous (lignesTir: 3). */
  targetRows() {
    if ((this.def.lignesTir ?? 1) < 3) return [this.row];
    return [this.row - 1, this.row, this.row + 1].filter((r) => r >= 0 && r < ROWS);
  }

  updateTrap(dt, game) {
    if (this.armTimer > 0) {
      this.armTimer -= dt;
      return;
    }
    const victim = game.zombiesInRadius(this.x, this.y, TRAP_RANGE)
      .find((z) => z.row === this.row && !z.jumping);
    if (!victim) return;
    victim.takeDamage(this.def.degatsPiege ?? 700);
    this.shootAnim = SHOOT_ANIM_DURATION;
    this.usesLeft--;
    if (this.usesLeft <= 0) this.consume();
    else this.armTimer = this.def.delaiArmement ?? 0;   // se réarme
  }

  /** Plante à usage unique qui a servi (bombe, gel, piège). */
  consume() {
    if (this.dead) return;
    this.dead = true;
    events.emit('plantUsed', { plant: this });
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp -= amount;
    this.hitFlash = 0.08;
    if (this.hp <= 0) {
      this.dead = true;
      events.emit('plantDied', { plant: this });
      if (this.def.degatsMort) {
        this.game.triggerExplosion(this.x, this.y, this.def.rayonMort ?? 140, this.def.degatsMort);
      }
    }
  }

  draw(ctx) {
    const type = this.def.type;
    let scale = 1;
    let flash = this.hitFlash > 0;
    let alpha = 1;

    if (this.shootAnim > 0) {
      const p = this.shootAnim / SHOOT_ANIM_DURATION;
      scale = 1 + 0.24 * Math.sin(p * Math.PI);
    } else if (type === 'explosif' || type === 'gel') {
      const progress = Math.max(0, 1 - this.fuseTimer / Math.max(0.01, this.fuseDuration));
      scale = 1 + 0.28 * progress + 0.06 * Math.sin(progress * 30);
      if (Math.sin(progress * 35) > 0.2) flash = true;
    } else if (type === 'piege') {
      // En train de s'armer : petit et transparent. Armé : posé au sol.
      const total = this.def.delaiArmement || 1;
      scale = this.armTimer > 0 ? 0.6 + 0.2 * (1 - this.armTimer / total) : 0.85;
      alpha = this.armTimer > 0 ? 0.55 : 1;
    }

    drawSprite(ctx, this.def, this.x, this.y, 72 * scale, { flash, alpha });
    const singleUse = type === 'explosif' || type === 'gel';
    if (this.hp < this.maxHp && !singleUse) {
      drawHealthBar(ctx, this.x, this.y - 44, 56, this.hp / this.maxHp, '#7bd66b');
    }
  }
}
