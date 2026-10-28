import { DifficultyLevel, Fighter, InputFrame, MatchState } from './types';
import { computeWorldNumpad, createEmptyInputFrame } from './input';

interface ObservedState {
  frame: number;
  oppX: number;
  oppY: number;
  oppState: Fighter['state'];
  oppAttacking: boolean;
  oppHitHeight: string;
  hasIncomingProjectile: boolean;
}

export class CpuController {
  private observationQueue: ObservedState[] = [];
  private macroQueue: Array<{ relDir: number; btn?: 'A' | 'B' | 'C' | 'D' | 'AB' | 'CD' }> = [];
  private prevA = false;
  private prevB = false;
  private prevC = false;
  private prevD = false;

  public reset(): void {
    this.observationQueue = [];
    this.macroQueue = [];
  }

  private getReactionDelay(diff: DifficultyLevel, isShadowBoss: boolean): number {
    const order: DifficultyLevel[] = ['facil', 'normal', 'dificil', 'pesadelo'];
    const idx = Math.min(order.length - 1, order.indexOf(diff) + (isShadowBoss ? 1 : 0));
    const effective = order[idx];
    switch (effective) {
      case 'facil':
        return 24;
      case 'normal':
        return 16;
      case 'dificil':
        return 10;
      case 'pesadelo':
        return 6;
    }
  }

  private enqueueMotion(dirs: number[], finalBtn: 'A' | 'B' | 'C' | 'D'): void {
    this.macroQueue = [];
    for (let i = 0; i < dirs.length; i++) {
      this.macroQueue.push({
        relDir: dirs[i],
        btn: i === dirs.length - 1 ? finalBtn : undefined
      });
    }
  }

  public getInput(match: MatchState, self: Fighter, opp: Fighter, difficulty: DifficultyLevel): InputFrame {
    const out = createEmptyInputFrame();
    if (match.phase !== 'fighting') return out;

    const delay = this.getReactionDelay(difficulty, self.isShadowBoss);
    const hasProj = match.projectiles.some((p) => p.ownerIndex !== self.playerIndex);

    this.observationQueue.push({
      frame: match.frame,
      oppX: opp.x,
      oppY: opp.y,
      oppState: opp.state,
      oppAttacking: opp.state === 'attack',
      oppHitHeight: opp.currentMove?.hitHeight ?? 'mid',
      hasIncomingProjectile: hasProj
    });

    while (this.observationQueue.length > delay + 2) {
      this.observationQueue.shift();
    }

    const obs = this.observationQueue[0] ?? {
      frame: match.frame,
      oppX: opp.x,
      oppY: opp.y,
      oppState: opp.state,
      oppAttacking: false,
      oppHitHeight: 'mid',
      hasIncomingProjectile: false
    };

    // Execute queued motion macro if active
    if (this.macroQueue.length > 0) {
      const step = this.macroQueue.shift()!;
      return this.buildFrameFromRel(step.relDir, self.facing, step.btn);
    }

    const dist = Math.abs(self.x - obs.oppX);
    const roll = ((match.frame * 37 + self.playerIndex * 19) % 100) / 100;
    const mistakeRate =
      difficulty === 'facil' ? 0.55 : difficulty === 'normal' ? 0.30 : difficulty === 'dificil' ? 0.12 : 0.02;

    // 1. Defensive reaction to opponent attack or projectile
    if ((obs.oppAttacking && dist < 130) || obs.hasIncomingProjectile) {
      if (roll > mistakeRate) {
        if (self.id === 'gnhoif' && obs.hasIncomingProjectile && dist > 110) {
          this.enqueueMotion([2, 5, 2], 'A'); // Manto Faminto absorb
          return out;
        }
        const blockLow = obs.oppHitHeight === 'low';
        return this.buildFrameFromRel(blockLow ? 1 : 4, self.facing);
      }
    }

    // 2. Anti-air when opponent jumps in
    if (obs.oppY < -28 && dist < 110 && roll > mistakeRate) {
      if (self.id === 'cassandra' && self.chargeDownFrames >= 38) {
        return this.buildFrameFromRel(8, self.facing, 'D');
      } else if (self.id === 'boris') {
        this.enqueueMotion([6, 2, 3], 'C');
        return out;
      } else if (self.id === 'gnhoif') {
        this.enqueueMotion([6, 2, 3], 'A');
        return out;
      } else {
        return this.buildFrameFromRel(2, self.facing, 'C');
      }
    }

    // 3. Super finisher when meter is full and in range
    if (self.superMeter >= 3000 && dist < 105 && roll > mistakeRate + 0.15) {
      if (self.id === 'cassandra') {
        this.enqueueMotion([2, 3, 6, 2, 3, 6], 'B');
        return out;
      } else if (self.id === 'boris') {
        this.enqueueMotion([2, 1, 4, 2, 1, 4], 'B');
        return out;
      } else if (self.id === 'gnhoif') {
        this.enqueueMotion([2, 1, 4, 2, 1, 4], 'A');
        return out;
      } else if (dist < 68) {
        this.enqueueMotion([6, 2, 4, 6, 2, 4], 'A');
        return out;
      }
    } else if (self.superMeter >= 1000 && dist < 140 && self.state === 'attack' && self.moveHitRegistered && roll > mistakeRate + 0.25) {
      this.enqueueMotion([2, 3, 6, 2, 3, 6], self.id === 'barbara' ? 'B' : 'A');
      return out;
    }

    // 4. Archetype-specific neutral and pressure
    switch (self.id) {
      case 'cassandra': {
        // Zoner: hold down-back (1) to charge [4]6 and [2]8, keep distance
        if (dist > 135) {
          if (self.chargeBackFrames >= 40 && match.frame % 18 === 0 && roll > mistakeRate) {
            return this.buildFrameFromRel(6, self.facing, dist > 200 ? 'C' : 'A');
          }
          return this.buildFrameFromRel(1, self.facing); // Charge down-back
        } else if (dist < 65) {
          if (match.frame % 15 === 0 && roll > mistakeRate) {
            return this.buildFrameFromRel(2, self.facing, 'B');
          }
          if (match.frame % 28 === 0) {
            this.enqueueMotion([4, 5, 4], 'A'); // Cartwheel backdash
          }
          return this.buildFrameFromRel(4, self.facing);
        } else {
          if (match.frame % 24 === 0 && roll > mistakeRate) {
            this.enqueueMotion([2, 3, 6], 'B'); // Tapete Vermelho
            return out;
          }
          return this.buildFrameFromRel(1, self.facing);
        }
      }

      case 'boris': {
        // Rushdown + Poison: activate Miasma if not active, dash in and pressure
        if (self.miasmaTimer === 0 && dist > 130 && match.frame % 45 === 0 && roll > mistakeRate) {
          this.enqueueMotion([2, 5, 2], 'A');
          return out;
        }
        if (dist > 110) {
          if (match.frame % 35 === 0 && roll > mistakeRate) {
            this.enqueueMotion([2, 3, 6], 'A'); // Adaga Serpente
            return out;
          }
          if (match.frame % 25 === 0) {
            this.enqueueMotion([6, 5, 6], 'A'); // Run / Dash
            return out;
          }
          return this.buildFrameFromRel(6, self.facing);
        } else {
          if (match.frame % 12 === 0 && roll > mistakeRate) {
            const pick = match.frame % 4;
            if (pick === 0) return this.buildFrameFromRel(5, self.facing, 'A');
            if (pick === 1) return this.buildFrameFromRel(2, self.facing, 'B');
            if (pick === 2) return this.buildFrameFromRel(6, self.facing, 'B');
            this.enqueueMotion([2, 1, 4], 'D'); // Bote da Víbora
            return out;
          }
          return this.buildFrameFromRel(6, self.facing);
        }
      }

      case 'gnhoif': {
        // Space control + teleport + long scythe pokes
        if (dist > 175) {
          if (match.frame % 40 === 0 && roll > mistakeRate) {
            this.enqueueMotion([2, 3, 6], 'A'); // Olhar Solar
            return out;
          }
          if (match.frame % 55 === 0 && roll > mistakeRate) {
            this.enqueueMotion([2, 1, 4], 'D'); // Passo Umbral cross-up teleport
            return out;
          }
          return this.buildFrameFromRel(4, self.facing);
        } else if (dist > 85) {
          if (match.frame % 18 === 0 && roll > mistakeRate) {
            return this.buildFrameFromRel(5, self.facing, match.frame % 2 === 0 ? 'C' : 'D');
          }
          return this.buildFrameFromRel(5, self.facing);
        } else {
          if (match.frame % 16 === 0 && roll > mistakeRate) {
            if (dist < 38) return this.buildFrameFromRel(6, self.facing, 'C'); // Throw or 6C
            return this.buildFrameFromRel(2, self.facing, 'D');
          }
          return this.buildFrameFromRel(4, self.facing);
        }
      }

      case 'barbara': {
        // Grappler with Visitor summons
        if (dist > 125) {
          if (match.frame % 42 === 0 && roll > mistakeRate) {
            if (match.frame % 2 === 0) {
              this.enqueueMotion([2, 3, 6], 'B'); // Dona Traça cover
            } else {
              this.enqueueMotion([2, 5, 2], 'B'); // Mãos de Giz
            }
            return out;
          }
          return this.buildFrameFromRel(6, self.facing);
        } else if (dist > 62) {
          if (match.frame % 26 === 0 && roll > mistakeRate) {
            this.enqueueMotion([2, 1, 4], 'A'); // Senhor Botão punch
            return out;
          }
          return this.buildFrameFromRel(6, self.facing);
        } else {
          if (match.frame % 14 === 0 && roll > mistakeRate) {
            if (match.frame % 3 !== 0) {
              this.enqueueMotion([6, 3, 2, 1, 4], 'C'); // Abraço Apertado Piledriver!
              return out;
            }
            return this.buildFrameFromRel(5, self.facing, 'C');
          }
          return this.buildFrameFromRel(6, self.facing);
        }
      }
    }
  }

  private buildFrameFromRel(
    relDir: number,
    facing: 1 | -1,
    btn?: 'A' | 'B' | 'C' | 'D' | 'AB' | 'CD'
  ): InputFrame {
    const up = relDir === 7 || relDir === 8 || relDir === 9;
    const down = relDir === 1 || relDir === 2 || relDir === 3;
    const forward = relDir === 3 || relDir === 6 || relDir === 9;
    const back = relDir === 1 || relDir === 4 || relDir === 7;

    const rawRight = facing === 1 ? forward : back;
    const rawLeft = facing === 1 ? back : forward;
    const worldDir = computeWorldNumpad(up, down, rawLeft, rawRight);

    const A = btn === 'A' || btn === 'AB';
    const B = btn === 'B' || btn === 'AB';
    const C = btn === 'C' || btn === 'CD';
    const D = btn === 'D' || btn === 'CD';

    const frame: InputFrame = {
      dir: worldDir,
      rawUp: up,
      rawDown: down,
      rawLeft,
      rawRight,
      A,
      B,
      C,
      D,
      taunt: false,
      shortcutAB: btn === 'AB',
      shortcutCD: btn === 'CD',
      justA: A && !this.prevA,
      justB: B && !this.prevB,
      justC: C && !this.prevC,
      justD: D && !this.prevD,
      justTaunt: false,
      justShortcutAB: btn === 'AB',
      justShortcutCD: btn === 'CD'
    };

    this.prevA = A;
    this.prevB = B;
    this.prevC = C;
    this.prevD = D;
    return frame;
  }
}
