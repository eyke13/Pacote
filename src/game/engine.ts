import {
  ActiveProjectile,
  Box,
  CharacterId,
  DummyBehavior,
  Fighter,
  GameMode,
  GameOptions,
  InputFrame,
  MatchState,
  MoveData,
  Particle,
  StageId,
  VerletNode
} from './types';
import { CHARACTERS } from './lore';
import { MOVES } from './moves';
import {
  checkDashInput,
  checkMotion,
  checkTwoButtonChord,
  formatInputSymbol,
  pushInputToBuffer,
  toRelativeDir
} from './input';

export const STAGE_WIDTH = 768;
export const SCREEN_WIDTH = 384;
export const SCREEN_HEIGHT = 224;
export const FLOOR_Y = 196;
export const STAGE_LEFT_BOUND = 26;
export const STAGE_RIGHT_BOUND = 742;
export const MAX_FIGHTER_SEPARATION = 336;

let nextProjectileUid = 1;

export interface EngineAudioCallbacks {
  onHit?: (heavy: boolean, isSpecial: boolean) => void;
  onBlock?: () => void;
  onParry?: () => void;
  onThrow?: () => void;
  onSpecial?: (charId: CharacterId, moveId: string) => void;
  onSuperFlash?: (charId: CharacterId, moveName: string) => void;
  onKo?: () => void;
  onAnnounce?: (text: string) => void;
}

export function createVerletChain(x: number, y: number, count = 5): VerletNode[] {
  const nodes: VerletNode[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push({ x, y: y + i * 7, oldX: x, oldY: y + i * 7 });
  }
  return nodes;
}

export function createFighter(
  playerIndex: 0 | 1,
  id: CharacterId,
  paletteIdx: number,
  isCpu: boolean,
  isShadowBoss = false
): Fighter {
  const meta = CHARACTERS[id];
  const startX = playerIndex === 0 ? 290 : 478;
  const facing = playerIndex === 0 ? 1 : -1;

  return {
    playerIndex,
    id,
    name: isShadowBoss
      ? id === 'gnhoif'
        ? 'LUZ PRIMORDIAL'
        : `SOMBRA ${meta.shortName}`
      : meta.shortName,
    title: meta.title,
    paletteIdx,
    isShadowBoss,
    isCpu,
    x: startX,
    y: 0,
    vx: 0,
    vy: 0,
    facing,
    maxHp: meta.maxHp,
    hp: meta.maxHp,
    trailHp: meta.maxHp,
    trailDelay: 0,
    superMeter: 0,
    maxStun: 600,
    stun: 0,
    stunRegenTimer: 0,
    state: 'intro',
    stateFrame: 0,
    animFrame: 0,
    currentMove: null,
    moveHitRegistered: false,
    moveHitCount: 0,
    comboCount: 0,
    comboDamage: 0,
    comboDisplayTimer: 0,
    jugglePoints: 0,
    hitstunFrames: 0,
    blockstunFrames: 0,
    knockdownFrames: 0,
    dizzyFrames: 0,
    rootFrames: 0,
    invulnFrames: 0,
    parryWindow: 0,
    parryHighLow: null,
    parryFreeze: 0,
    chargeBackFrames: 0,
    chargeDownFrames: 0,
    hoverFramesLeft: 30,
    darknessDisabledTimer: 0,
    miasmaTimer: 0,
    miasmaRadius: 0,
    miasmaCooldown: 0,
    poisonStacks: 0,
    poisonTimer: 0,
    jumpShort: false,
    jumpDir: 0,
    isRunning: false,
    verletChain: createVerletChain(startX, -50, 5),
    afterimages: [],
    inputBuffer: [],
    inputHistoryDisplay: [],
    lastFrameAdvantage: 0,
    pushbox: { x: -16, y: -76, w: 32, h: 76 },
    hurtbox: { x: -20, y: -92, w: 40, h: 92 },
    activeHitbox: null,
    roundsWon: 0
  };
}

export function createParticlePool(size = 80): Particle[] {
  const pool: Particle[] = [];
  for (let i = 0; i < size; i++) {
    pool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      color: '#ffffff',
      size: 2,
      life: 0,
      maxLife: 10,
      type: 'hit_light'
    });
  }
  return pool;
}

export function spawnParticles(
  match: MatchState,
  x: number,
  y: number,
  count: number,
  color: string,
  type: Particle['type']
): void {
  let spawned = 0;
  for (let i = 0; i < match.particles.length && spawned < count; i++) {
    const p = match.particles[i];
    if (!p.active) {
      const angle = ((spawned / count) * Math.PI * 2) + ((match.frame % 7) * 0.2);
      const speed = 1.5 + ((spawned * 13) % 5);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 1.0;
      p.color = color;
      p.size = type === 'hit_heavy' || type === 'parry' ? 3 : 2;
      p.life = 0;
      p.maxLife = 12 + ((spawned * 5) % 10);
      p.type = type;
      spawned++;
    }
  }
}

export function addCallout(
  match: MatchState,
  text: string,
  x: number,
  y: number,
  color = '#fde047'
): void {
  match.callouts.push({ text, x, y, color, timer: 45 });
  if (match.callouts.length > 6) {
    match.callouts.shift();
  }
}

export function createMatchState(
  mode: GameMode,
  p1Id: CharacterId,
  p2Id: CharacterId,
  p1Palette: number,
  p2Palette: number,
  stage: StageId,
  options: GameOptions,
  isP2Cpu = true,
  isShadowBoss = false,
  arcadeStageIndex = 0,
  arcadeOpponents: CharacterId[] = []
): MatchState {
  // Mirror match automatically picks alternate palette for P2 if same
  const finalP2Pal = p1Id === p2Id && p1Palette === p2Palette && !isShadowBoss ? (p1Palette === 0 ? 1 : 0) : p2Palette;

  const f1 = createFighter(0, p1Id, p1Palette, false, false);
  const f2 = createFighter(1, p2Id, finalP2Pal, isP2Cpu, isShadowBoss);

  if (mode === 'training') {
    f1.superMeter = 3000;
    f2.superMeter = 3000;
  }

  return {
    mode,
    stage,
    frame: 0,
    roundNumber: 1,
    timerFrames: options.roundTime === 0 ? -1 : options.roundTime * 60,
    phase: mode === 'training' ? 'fighting' : 'intro',
    phaseTimer: mode === 'training' ? 0 : 70,
    hitstopTimer: 0,
    screenShake: 0,
    solarFlashTimer: 0,
    desaturateTimer: 0,
    firstAttackAwarded: false,
    announceText: mode === 'training' ? '' : 'ROUND 1',
    winnerIndex: -1,
    winReason: 'ko',
    fighters: [f1, f2],
    projectiles: [],
    particles: createParticlePool(90),
    callouts: [],
    cinematic: {
      active: false,
      type: 'super_flash',
      attackerIndex: 0,
      frame: 0,
      maxFrames: 30,
      moveName: ''
    },
    cameraX: 192,
    trainingDummy: 'stand',
    arcadeStageIndex,
    arcadeOpponents
  };
}

export function resetRound(match: MatchState, options: GameOptions): void {
  const [f1, f2] = match.fighters;
  for (const f of [f1, f2]) {
    f.x = f.playerIndex === 0 ? 290 : 478;
    f.y = 0;
    f.vx = 0;
    f.vy = 0;
    f.facing = f.playerIndex === 0 ? 1 : -1;
    f.hp = f.maxHp;
    f.trailHp = f.maxHp;
    f.trailDelay = 0;
    f.stun = 0;
    f.stunRegenTimer = 0;
    f.state = match.mode === 'training' ? 'idle' : 'intro';
    f.stateFrame = 0;
    f.currentMove = null;
    f.moveHitRegistered = false;
    f.moveHitCount = 0;
    f.comboCount = 0;
    f.comboDamage = 0;
    f.comboDisplayTimer = 0;
    f.jugglePoints = 0;
    f.hitstunFrames = 0;
    f.blockstunFrames = 0;
    f.knockdownFrames = 0;
    f.dizzyFrames = 0;
    f.rootFrames = 0;
    f.invulnFrames = 0;
    f.parryWindow = 0;
    f.miasmaTimer = 0;
    f.poisonStacks = 0;
    f.poisonTimer = 0;
    f.isRunning = false;
    f.activeHitbox = null;
  }
  match.projectiles = [];
  match.callouts = [];
  match.timerFrames = options.roundTime === 0 ? -1 : options.roundTime * 60;
  match.firstAttackAwarded = false;
  match.phase = match.mode === 'training' ? 'fighting' : 'announce_round';
  match.phaseTimer = match.mode === 'training' ? 0 : 60;
  match.announceText = `ROUND ${match.roundNumber}`;
  match.cameraX = 192;
}

export function getWorldBox(x: number, y: number, facing: 1 | -1, box: Box): Box {
  if (facing === 1) {
    return { x: x + box.x, y: y + box.y, w: box.w, h: box.h };
  }
  return {
    x: x - box.x - box.w,
    y: y + box.y,
    w: box.w,
    h: box.h
  };
}

export function boxesOverlap(a: Box, b: Box): boolean {
  if (a.w <= 0 || a.h <= 0 || b.w <= 0 || b.h <= 0) return false;
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function calculateComboScale(hitNumber: number, isSuper: boolean): number {
  const table = [1.0, 1.0, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.3];
  const raw = table[Math.min(hitNumber - 1, table.length - 1)] ?? 0.3;
  return isSuper ? Math.max(0.5, raw) : Math.max(0.3, raw);
}

function updateVerlet(f: Fighter): void {
  const anchorX = f.x - f.facing * 8;
  const anchorY = f.y - (f.id === 'cassandra' ? 32 : f.id === 'boris' ? 44 : 74);
  const chain = f.verletChain;
  if (!chain || chain.length === 0) return;

  chain[0].x = anchorX;
  chain[0].y = anchorY;

  for (let i = 1; i < chain.length; i++) {
    const n = chain[i];
    const vx = (n.x - n.oldX) * 0.82 - f.vx * 0.25;
    const vy = (n.y - n.oldY) * 0.82 + (f.id === 'gnhoif' ? -0.15 : 0.45); // Gnhoif cloak pulls inward/upward!
    n.oldX = n.x;
    n.oldY = n.y;
    n.x += vx;
    n.y += vy;
  }

  const segLen = 6;
  for (let iter = 0; iter < 2; iter++) {
    for (let i = 1; i < chain.length; i++) {
      const prev = chain[i - 1];
      const curr = chain[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.hypot(dx, dy) || 1;
      const diff = (dist - segLen) / dist;
      curr.x -= dx * diff;
      curr.y -= dy * diff;
    }
  }
}

function updateHurtAndPushBoxes(f: Fighter): void {
  const height = f.id === 'gnhoif' ? 108 : f.id === 'boris' ? 98 : f.id === 'cassandra' ? 94 : 86;
  if (f.state === 'crouch' || f.state === 'block_crouch' || (f.state === 'attack' && f.currentMove?.crouchOnly)) {
    f.pushbox = { x: -16, y: -Math.round(height * 0.55), w: 32, h: Math.round(height * 0.55) };
    f.hurtbox = { x: -20, y: -Math.round(height * 0.65), w: 40, h: Math.round(height * 0.65) };
  } else if (f.state === 'knockdown') {
    f.pushbox = { x: -16, y: -24, w: 32, h: 24 };
    f.hurtbox = { x: 0, y: 0, w: 0, h: 0 };
  } else {
    f.pushbox = { x: -16, y: -Math.round(height * 0.78), w: 32, h: Math.round(height * 0.78) };
    f.hurtbox = { x: -20, y: -height, w: 40, h: height };
  }

  // Active hitbox calculation
  if (f.state === 'attack' && f.currentMove) {
    const m = f.currentMove;
    if (f.stateFrame >= m.startup && f.stateFrame < m.startup + m.active) {
      f.activeHitbox = m.hitbox;
    } else {
      f.activeHitbox = null;
    }
  } else {
    f.activeHitbox = null;
  }
}

export function isFighterInvulnerable(f: Fighter, isProjectile = false, isThrow = false): boolean {
  if (f.invulnFrames > 0) return true;
  if (f.state === 'knockdown' || f.state === 'wakeup' || f.state === 'thrown') return true;
  if (f.state === 'backdash' && f.stateFrame <= 8) return true; // Backdash invincible frames 1..8
  if (f.state === 'roll' && f.stateFrame >= 3 && f.stateFrame <= 18 && !isThrow) {
    // Roll is invincible to strikes & projectiles on frames 3..18, but vulnerable to throws!
    return true;
  }
  if (f.state === 'attack' && f.currentMove) {
    const m = f.currentMove;
    if (m.invulnStart && m.invulnEnd && f.stateFrame >= m.invulnStart && f.stateFrame <= m.invulnEnd) {
      return true;
    }
    if (
      isProjectile &&
      m.projectileInvulnStart &&
      m.projectileInvulnEnd &&
      f.stateFrame >= m.projectileInvulnStart &&
      f.stateFrame <= m.projectileInvulnEnd
    ) {
      return true;
    }
    if (
      isThrow &&
      m.throwInvulnStart &&
      m.throwInvulnEnd &&
      f.stateFrame >= m.throwInvulnStart &&
      f.stateFrame <= m.throwInvulnEnd
    ) {
      return true;
    }
  }
  return false;
}

function canCancelCurrentMove(f: Fighter, targetCategory: MoveData['category']): boolean {
  if (f.state !== 'attack' || !f.currentMove || !f.moveHitRegistered) return false;
  const cur = f.currentMove;

  if (targetCategory === 'normal') {
    return Boolean(cur.chainableLight && cur.category === 'normal');
  }
  if (targetCategory === 'special' || targetCategory === 'ex') {
    return Boolean(cur.cancelIntoSpecial);
  }
  if (targetCategory === 'super1' || targetCategory === 'super3') {
    return Boolean(cur.cancelIntoSuper);
  }
  return false;
}

function trySelectMove(
  f: Fighter,
  opp: Fighter,
  input: InputFrame,
  match: MatchState,
  audio?: EngineAudioCallbacks
): MoveData | null {
  const charMoves = MOVES[f.id];
  const isAir = f.y < 0;
  const relDir = toRelativeDir(input.dir, f.facing);
  const isCrouching = !isAir && (relDir === 1 || relDir === 2 || relDir === 3);
  const dist = Math.abs(f.x - opp.x);
  const buffer = f.inputBuffer;

  const isNeutral =
    f.state === 'idle' ||
    f.state === 'walk_f' ||
    f.state === 'walk_b' ||
    f.state === 'crouch' ||
    f.state === 'dash' ||
    (f.state === 'jump' && isAir);

  // Guard Cancel Blowback (Contra-Guarda: C+D while blocking, costs 1000 super meter)
  if ((f.state === 'block_stand' || f.state === 'block_crouch') && f.superMeter >= 1000) {
    if (checkTwoButtonChord(buffer, 'C', 'D', true)) {
      const cdMove = charMoves.find((m) => m.id === 'CD');
      if (cdMove) {
        f.superMeter -= 1000;
        f.invulnFrames = 14;
        addCallout(match, 'CONTRA-GUARDA!', f.x, f.y - 88, '#38bdf8');
        return cdMove;
      }
    }
  }

  if (!isNeutral && f.state !== 'attack') return null;

  // Roll (A+B or O shortcut) on ground
  if (!isAir && isNeutral && checkTwoButtonChord(buffer, 'A', 'B', true)) {
    f.state = 'roll';
    f.stateFrame = 0;
    f.currentMove = null;
    f.vx = (relDir === 4 ? -1 : 1) * f.facing * 4.8;
    return null;
  }

  // Filter candidate moves in priority order: super3 -> super1 -> ex -> special -> throw -> command_normal -> universal -> normal
  const priorityOrder: Record<MoveData['category'], number> = {
    super3: 1,
    super1: 2,
    ex: 3,
    special: 4,
    throw: 5,
    universal: 6,
    command_normal: 7,
    normal: 8
  };

  const sorted = [...charMoves].sort((a, b) => priorityOrder[a.category] - priorityOrder[b.category]);

  for (const m of sorted) {
    if (isAir) {
      if (!m.airOnly && !m.airOk) continue;
    } else {
      if (m.airOnly) continue;
    }

    if (f.state === 'attack' && !canCancelCurrentMove(f, m.category)) {
      continue;
    }

    if (f.superMeter < m.meterCost) continue;

    // Boris Miasma C cooldown check
    if (m.id === 'miasma_C' && f.miasmaCooldown > 0) continue;

    // Close range check
    if (m.closeOnly && dist > (m.closeRange ?? 44)) continue;

    // Button check
    let buttonMatched = false;
    if (m.button === 'CD') {
      buttonMatched = checkTwoButtonChord(buffer, 'C', 'D', true);
    } else if (m.button === 'AC') {
      buttonMatched = checkTwoButtonChord(buffer, 'A', 'C', false);
    } else if (m.button === 'BD') {
      buttonMatched = checkTwoButtonChord(buffer, 'B', 'D', false);
    } else if (m.category === 'super1' || m.category === 'super3') {
      if (m.button === 'A') buttonMatched = input.justA || input.justC;
      else if (m.button === 'B') buttonMatched = input.justB || input.justD;
    } else if (m.category === 'throw') {
      buttonMatched =
        (relDir === 6 || relDir === 4) &&
        (input.justC || input.justD) &&
        !input.justShortcutCD;
    } else {
      if (m.button === 'A') buttonMatched = input.justA;
      else if (m.button === 'B') buttonMatched = input.justB;
      else if (m.button === 'C') buttonMatched = input.justC;
      else if (m.button === 'D') buttonMatched = input.justD;
    }

    if (!buttonMatched) continue;

    // Crouching normal check
    if (m.category === 'normal' && !isAir) {
      if (m.crouchOnly && !isCrouching) continue;
      if (!m.crouchOnly && isCrouching) continue;
      // Close vs Far C/D
      if (m.id === '5C_far' && dist <= 44) continue;
      if (m.id === '5D_far' && dist <= 46) continue;
    }

    // Motion check
    if (m.category === 'throw') {
      // Already checked 4/6 + C/D and range
      return m;
    }

    if (!checkMotion(buffer, m.motion, f.chargeBackFrames, f.chargeDownFrames)) {
      continue;
    }

    // Consume charge if charge move
    if (m.motion === '[4]6') f.chargeBackFrames = 0;
    if (m.motion === '[2]8') f.chargeDownFrames = 0;

    if (m.meterCost > 0) {
      f.superMeter = Math.max(0, f.superMeter - m.meterCost);
    }

    if (m.category === 'super1' || m.category === 'super3') {
      match.cinematic = {
        active: true,
        type: 'super_flash',
        attackerIndex: f.playerIndex,
        frame: 0,
        maxFrames: 30,
        moveName: m.name
      };
      audio?.onSuperFlash?.(f.id, m.name);
    } else if (m.category === 'special' || m.category === 'ex') {
      audio?.onSpecial?.(f.id, m.id);
    }

    return m;
  }

  return null;
}

function startMove(f: Fighter, move: MoveData, opp: Fighter, match: MatchState): void {
  const wasWakeupOrBlock = f.state === 'wakeup' || f.state === 'block_stand' || f.state === 'block_crouch';
  if (wasWakeupOrBlock && f.stateFrame <= 1 && (move.category === 'special' || move.category === 'ex' || move.category === 'super1' || move.category === 'super3')) {
    addCallout(match, 'REVERSAL!', f.x, f.y - 92, '#38bdf8');
  }

  f.state = 'attack';
  f.stateFrame = 0;
  f.currentMove = move;
  f.moveHitRegistered = false;
  f.moveHitCount = 0;
  f.isRunning = false;
  f.superMeter = Math.min(3000, f.superMeter + move.meterGainWhiff);

  // If grounded, stop horizontal slide unless move has vxMove
  if (f.y === 0) {
    f.vx = 0;
  }

  // Throw direction flip if holding 4
  if (move.category === 'throw' && f.inputBuffer.length > 0) {
    const latestDir = f.inputBuffer[f.inputBuffer.length - 1].relDir;
    if (latestDir === 4) {
      f.facing = (f.facing * -1) as 1 | -1;
    }
  }

  // Gnhoif Olhar Solar disables darkness aura for 3 seconds (180 frames)
  if (f.id === 'gnhoif' && move.id.startsWith('olhar_')) {
    f.darknessDisabledTimer = 180;
    if (move.id === 'olhar_C' || move.id === 'olhar_EX') {
      match.solarFlashTimer = 28;
    }
  }

  // Boris Miasma activation
  if (f.id === 'boris' && move.auraDuration) {
    f.miasmaTimer = move.auraDuration;
    f.miasmaRadius = move.auraRadius ?? 52;
    if (move.id === 'miasma_C') {
      f.miasmaCooldown = 480; // 8s cooldown
    }
  }
}

function spawnProjectileFromMove(f: Fighter, m: MoveData, match: MatchState): void {
  if (!m.projectile) return;
  const specs = [m.projectile];
  if (m.secondaryProjectile) specs.push(m.secondaryProjectile);

  for (const spec of specs) {
    const isAirDagger = f.id === 'boris' && f.y < 0 && spec.id.startsWith('dagger');
    match.projectiles.push({
      uid: nextProjectileUid++,
      ownerIndex: f.playerIndex,
      spec,
      x: f.x + f.facing * spec.xOffset,
      y: f.y + spec.yOffset,
      vx: f.facing * spec.vx,
      vy: isAirDagger ? 5.2 : spec.vy,
      facing: f.facing,
      frame: 0,
      hitsRemaining: spec.hits,
      hitCooldown: 0,
      reflected: false
    });
  }
}

function applyHitOrBlock(
  attacker: Fighter,
  defender: Fighter,
  move: MoveData,
  isProjectile: boolean,
  match: MatchState,
  audio?: EngineAudioCallbacks
): void {
  const hitX = (attacker.x + defender.x) * 0.5;
  const hitY = defender.y - 56;

  // Check if defender is in Counter stance (Cassandra Espelho Compacto or Gnhoif Manto Faminto C)
  if (
    !isProjectile &&
    move.hitHeight !== 'throw' &&
    move.hitHeight !== 'air_throw' &&
    defender.state === 'attack' &&
    defender.currentMove?.counterStart &&
    defender.currentMove?.counterEnd &&
    defender.stateFrame >= defender.currentMove.counterStart &&
    defender.stateFrame <= defender.currentMove.counterEnd
  ) {
    addCallout(match, 'CONTRA-GOLPE!', defender.x, defender.y - 96, '#facc15');
    spawnParticles(match, hitX, hitY, 18, '#fef08a', 'parry');
    match.hitstopTimer = 14;
    attacker.state = 'hit_high';
    attacker.stateFrame = 0;
    attacker.hitstunFrames = 34;
    attacker.hp = Math.max(0, attacker.hp - defender.currentMove.damage);
    audio?.onParry?.();
    return;
  }

  // Check SF3 Parry!
  if (
    move.hitHeight !== 'throw' &&
    move.hitHeight !== 'air_throw' &&
    defender.parryWindow > 0
  ) {
    const canParryLow = move.hitHeight === 'low' && defender.parryHighLow === 'low';
    const canParryHigh =
      (move.hitHeight === 'high' || move.hitHeight === 'mid' || move.hitHeight === 'overhead') &&
      defender.parryHighLow === 'high';
    if (canParryLow || canParryHigh || defender.y < 0) {
      defender.state = 'parry';
      defender.stateFrame = 0;
      defender.parryWindow = 0;
      defender.superMeter = Math.min(3000, defender.superMeter + 160);
      match.hitstopTimer = 16; // 16 frame SF3 freeze
      spawnParticles(match, hitX, hitY, 20, '#38bdf8', 'parry');
      addCallout(match, 'APAROU!', defender.x, defender.y - 92, '#38bdf8');
      audio?.onParry?.();
      return;
    }
  }

  // Throws cannot be blocked, and ground throws miss airborne opponents
  if (move.hitHeight === 'throw') {
    if (defender.y < 0 || defender.state === 'prejump') {
      return; // Throw loses to jump!
    }
    const isCommandGrab = move.category === 'special' || move.category === 'ex' || move.category === 'super3';
    defender.state = isCommandGrab ? 'knockdown' : 'thrown';
    defender.stateFrame = 0;
    defender.knockdownFrames = 32;
    const bossMult = attacker.isShadowBoss ? 1.2 : 1.0;
    const dmg = Math.round(move.damage * bossMult);

    if (isCommandGrab) {
      defender.hp = Math.max(0, defender.hp - dmg);
      defender.vx = -attacker.facing * (move.launchVx ?? 4.0);
      defender.vy = move.launchVy ?? -5.0;
      defender.y = -2;
      match.hitstopTimer = move.hitstop;
      match.screenShake = 6;
      spawnParticles(match, hitX, hitY, 16, '#f43f5e', 'hit_heavy');
      audio?.onThrow?.();
      if (move.cinematicId) {
        match.cinematic = {
          active: true,
          type: move.cinematicId,
          attackerIndex: attacker.playerIndex,
          frame: 0,
          maxFrames: 120,
          moveName: move.name
        };
        if (move.cinematicId === 'gnhoif_lv3') {
          match.desaturateTimer = 240;
        }
      }
    } else {
      // Normal throw: waits 7 frames for tech window before dealing full damage
      defender.currentMove = move;
      audio?.onThrow?.();
    }
    return;
  }

  if (move.hitHeight === 'air_throw') {
    if (defender.y === 0) return;
    const bossMult = attacker.isShadowBoss ? 1.2 : 1.0;
    defender.hp = Math.max(0, defender.hp - Math.round(move.damage * bossMult));
    defender.state = 'knockdown';
    defender.stateFrame = 0;
    defender.knockdownFrames = 30;
    defender.vx = -attacker.facing * (move.launchVx ?? 4.5);
    defender.vy = move.launchVy ?? 6.0;
    if (move.applyPoison) {
      defender.poisonStacks = Math.min(3, defender.poisonStacks + move.applyPoison);
      defender.poisonTimer = 240;
    }
    match.hitstopTimer = move.hitstop;
    match.screenShake = 5;
    spawnParticles(match, hitX, hitY, 16, '#f43f5e', 'hit_heavy');
    audio?.onThrow?.();
    return;
  }

  // Juggle limit check if defender is airborne
  if (defender.y < 0 && defender.state !== 'jump') {
    if (defender.jugglePoints + move.juggleCost > move.juggleLimit) {
      return; // Juggle limit reached, prevents infinite combos!
    }
    defender.jugglePoints += move.juggleCost;
  }

  // Check Guard (Holding back 4 or down-back 1 when grounded and in neutral/block state)
  const defInput = defender.inputBuffer[defender.inputBuffer.length - 1];
  const defRelDir = defInput ? defInput.relDir : 5;
  const canBlockState =
    defender.y === 0 &&
    (defender.state === 'idle' ||
      defender.state === 'walk_b' ||
      defender.state === 'crouch' ||
      defender.state === 'block_stand' ||
      defender.state === 'block_crouch');

  let blocked = false;
  if (canBlockState && (defRelDir === 4 || defRelDir === 1)) {
    if (move.hitHeight === 'overhead' && defRelDir === 4) {
      blocked = true; // Overheads must be blocked standing (4)
    } else if (move.hitHeight === 'low' && defRelDir === 1) {
      blocked = true; // Lows must be blocked crouching (1)
    } else if (move.hitHeight === 'high' || move.hitHeight === 'mid') {
      blocked = true; // High/Mid can be blocked either way
    }
  }

  // Training dummy auto-block logic
  if (match.mode === 'training' && defender.playerIndex === 1) {
    if (match.trainingDummy === 'block_all' && canBlockState) {
      blocked = true;
    } else if (match.trainingDummy === 'block_after_first' && defender.comboCount >= 1 && canBlockState) {
      blocked = true;
    }
  }

  if (blocked) {
    defender.state = defRelDir === 1 ? 'block_crouch' : 'block_stand';
    defender.stateFrame = 0;
    defender.blockstunFrames = move.blockstun;
    match.hitstopTimer = Math.max(6, move.hitstop - 2);

    // Chip damage: 1/8 on specials/EX, 1/4 on supers; only supers can KO with chip!
    let chip = 0;
    if (move.category === 'special' || move.category === 'ex') {
      chip = Math.max(1, Math.floor(move.damage / 8));
      defender.hp = Math.max(1, defender.hp - chip);
    } else if (move.category === 'super1' || move.category === 'super3') {
      chip = Math.max(1, Math.floor(move.damage / 4));
      defender.hp = Math.max(0, defender.hp - chip);
    }

    attacker.superMeter = Math.min(3000, attacker.superMeter + Math.round(move.meterGainHit * 0.5));
    defender.superMeter = Math.min(3000, defender.superMeter + 25);

    applyPushback(attacker, defender, move.pushback * 0.85, isProjectile);
    attacker.lastFrameAdvantage = move.blockstun - (move.startup + move.active + move.recovery - attacker.stateFrame);
    spawnParticles(match, hitX, hitY, 10, '#60a5fa', 'block');
    audio?.onBlock?.();
    return;
  }

  // HIT CONFIRMED!
  const isCounterHit =
    defender.state === 'attack' &&
    defender.currentMove &&
    defender.stateFrame < defender.currentMove.startup + defender.currentMove.active;

  if (!match.firstAttackAwarded && match.mode !== 'training') {
    match.firstAttackAwarded = true;
    attacker.superMeter = Math.min(3000, attacker.superMeter + 250);
    addCallout(match, 'PRIMEIRO GOLPE!', attacker.x, attacker.y - 96, '#fde047');
  }

  if (isCounterHit) {
    addCallout(match, 'CONTRA-ATAQUE!', defender.x, defender.y - 96, '#fb7185');
  }

  defender.comboCount += 1;
  attacker.comboCount = defender.comboCount;
  attacker.comboDisplayTimer = 90;

  const isSuper = move.category === 'super1' || move.category === 'super3';
  const scale = calculateComboScale(defender.comboCount, isSuper);
  const counterMult = isCounterHit ? 1.2 : 1.0;
  const bossMult = attacker.isShadowBoss ? 1.2 : 1.0;
  const totalHits = move.hits ?? 1;
  const perHitBase = move.damage / totalHits;
  const finalDamage = Math.max(1, Math.round(perHitBase * scale * counterMult * bossMult));

  defender.hp = Math.max(0, defender.hp - finalDamage);
  defender.trailDelay = 24;
  defender.comboDamage += finalDamage;
  attacker.comboDamage = defender.comboDamage;

  attacker.superMeter = Math.min(3000, attacker.superMeter + Math.round(move.meterGainHit / totalHits));
  defender.superMeter = Math.min(3000, defender.superMeter + Math.round(move.meterGainHit * 0.35 / totalHits));

  // Stun accumulation
  if (defender.dizzyFrames === 0 && !isSuper) {
    defender.stun = Math.min(defender.maxStun, defender.stun + Math.round((move.stun / totalHits) * scale));
    defender.stunRegenTimer = 90;
  }

  // Poison application (Boris daggers or Miasma-empowered normals)
  const poisonToAdd =
    (move.applyPoison ?? 0) + (attacker.id === 'boris' && attacker.miasmaTimer > 0 ? 1 : 0);
  if (poisonToAdd > 0) {
    defender.poisonStacks = Math.min(3, defender.poisonStacks + poisonToAdd);
    defender.poisonTimer = 240; // 4 seconds = 240 frames
    spawnParticles(match, hitX, hitY, 10, '#22c55e', 'poison');
  }

  // Mãos de Giz root
  if (move.projectile?.rootFrames && isProjectile) {
    defender.rootFrames = move.projectile.rootFrames;
    addCallout(match, 'PRESO!', defender.x, defender.y - 76, '#60a5fa');
  }

  // Hitstun / Launch / Knockdown
  const extraHitstun = isCounterHit ? 4 : 0;
  match.hitstopTimer = move.hitstop;
  if (move.damage >= 85 || isSuper) {
    match.screenShake = isSuper ? 7 : 4;
  }

  if (move.cinematicId && attacker.moveHitCount === 1) {
    match.cinematic = {
      active: true,
      type: move.cinematicId,
      attackerIndex: attacker.playerIndex,
      frame: 0,
      maxFrames: 120,
      moveName: move.name
    };
    if (move.cinematicId === 'gnhoif_lv3') {
      match.desaturateTimer = 240; // 2s+ stage desaturation after super
    }
  }

  if (move.knockdown || defender.y < 0) {
    if (move.launchVy || defender.y < 0) {
      defender.state = 'air_hit';
      defender.stateFrame = 0;
      defender.vx = -attacker.facing * (move.launchVx ?? 2.8);
      defender.vy = move.launchVy ?? -5.2;
      if (defender.y === 0) defender.y = -2;
    } else {
      defender.state = 'knockdown';
      defender.stateFrame = 0;
      defender.knockdownFrames = move.hardKnockdown ? 46 : 30;
    }
  } else {
    defender.state = move.hitHeight === 'low' ? 'hit_low' : 'hit_high';
    defender.stateFrame = 0;
    defender.hitstunFrames = move.hitstun + extraHitstun;
  }

  // Check if Stun filled -> trigger Dizzy
  if (defender.stun >= defender.maxStun && defender.hp > 0 && defender.dizzyFrames === 0) {
    defender.stun = 0;
    defender.state = 'dizzy';
    defender.stateFrame = 0;
    defender.dizzyFrames = 120;
    addCallout(match, 'TONTO!', defender.x, defender.y - 96, '#facc15');
  }

  applyPushback(attacker, defender, move.pushback, isProjectile);
  attacker.lastFrameAdvantage =
    (move.hitstun + extraHitstun) - (move.startup + move.active + move.recovery - attacker.stateFrame);

  const isHeavy = move.damage >= 80 || move.category !== 'normal';
  const sparkColor =
    attacker.id === 'gnhoif'
      ? '#fde047'
      : attacker.id === 'boris' && poisonToAdd > 0
      ? '#4ade80'
      : isHeavy
      ? '#fb7185'
      : '#fef08a';
  spawnParticles(
    match,
    hitX,
    hitY,
    isHeavy ? 16 : 8,
    sparkColor,
    attacker.id === 'gnhoif' ? 'light' : isHeavy ? 'hit_heavy' : 'hit_light'
  );
  audio?.onHit?.(isHeavy, move.category !== 'normal');
}

function applyPushback(
  attacker: Fighter,
  defender: Fighter,
  amount: number,
  isProjectile: boolean
): void {
  const dir = attacker.x <= defender.x ? 1 : -1;
  const targetX = defender.x + dir * amount;
  if (targetX <= STAGE_LEFT_BOUND + 8 || targetX >= STAGE_RIGHT_BOUND - 8) {
    defender.x = Math.max(STAGE_LEFT_BOUND, Math.min(STAGE_RIGHT_BOUND, targetX));
    // Corner pushback: when defender is cornered, push the attacker back instead!
    if (!isProjectile) {
      attacker.x = Math.max(
        STAGE_LEFT_BOUND,
        Math.min(STAGE_RIGHT_BOUND, attacker.x - dir * amount)
      );
    }
  } else {
    defender.x = targetX;
  }
}

function stepFighter(
  f: Fighter,
  opp: Fighter,
  input: InputFrame,
  match: MatchState,
  audio?: EngineAudioCallbacks
): void {
  const meta = CHARACTERS[f.id];
  const entry = pushInputToBuffer(f.inputBuffer, match.frame, input, f.facing);
  if (
    entry.justA ||
    entry.justB ||
    entry.justC ||
    entry.justD ||
    entry.justShortcutAB ||
    entry.justShortcutCD ||
    entry.justTaunt ||
    (f.inputBuffer.length >= 2 && f.inputBuffer[f.inputBuffer.length - 2].relDir !== entry.relDir)
  ) {
    const sym = formatInputSymbol(entry);
    if (sym !== '•') {
      f.inputHistoryDisplay.unshift(sym);
      if (f.inputHistoryDisplay.length > 10) f.inputHistoryDisplay.pop();
    }
  }

  f.stateFrame++;
  f.animFrame++;
  if (f.invulnFrames > 0) f.invulnFrames--;
  if (f.parryWindow > 0) f.parryWindow--;
  if (f.rootFrames > 0) f.rootFrames--;
  if (f.darknessDisabledTimer > 0) f.darknessDisabledTimer--;
  if (f.miasmaCooldown > 0) f.miasmaCooldown--;

  // Trail HP delayed drain
  if (f.trailDelay > 0) {
    f.trailDelay--;
  } else if (f.trailHp > f.hp) {
    f.trailHp = Math.max(f.hp, f.trailHp - 4);
  }

  // Combo display timer
  if (f.comboDisplayTimer > 0) f.comboDisplayTimer--;

  // Stun regeneration outside pressure
  if (f.stunRegenTimer > 0) {
    f.stunRegenTimer--;
  } else if (f.stun > 0 && f.state !== 'dizzy') {
    f.stun = Math.max(0, f.stun - 2);
  }

  // Boris Poison tick: 1 HP per 10 frames per stack for 4s (240f), stops at 1 HP!
  if (f.poisonTimer > 0 && f.poisonStacks > 0) {
    f.poisonTimer--;
    if (match.frame % 10 === 0 && f.hp > 1) {
      f.hp = Math.max(1, f.hp - f.poisonStacks);
    }
    if (f.poisonTimer === 0) {
      f.poisonStacks = 0;
    }
  }

  // Boris Miasma Aura proximity check
  if (f.id === 'boris' && f.miasmaTimer > 0) {
    f.miasmaTimer--;
    const dist = Math.hypot(f.x - opp.x, f.y - opp.y);
    if (dist <= f.miasmaRadius && match.frame % 30 === 0) {
      opp.poisonStacks = Math.min(3, opp.poisonStacks + 1);
      opp.poisonTimer = 240;
    }
  }

  // Training mode infinite HP & Super regeneration
  if (match.mode === 'training') {
    f.superMeter = 3000;
    if (f.state === 'idle' || f.state === 'crouch' || f.state === 'walk_f' || f.state === 'walk_b') {
      f.hp = f.maxHp;
      f.trailHp = f.maxHp;
    }
  }

  // Charge tracking ([4]6 and [2]8)
  const relDir = entry.relDir;
  if (relDir === 4 || relDir === 1 || relDir === 7) {
    f.chargeBackFrames = Math.min(120, f.chargeBackFrames + 1);
  } else if (f.chargeBackFrames > 0) {
    // Give 10-frame grace window so [4]6 connects reliably
    f.chargeBackFrames = Math.max(0, f.chargeBackFrames - 4);
  }

  if (relDir === 1 || relDir === 2 || relDir === 3) {
    f.chargeDownFrames = Math.min(120, f.chargeDownFrames + 1);
  } else if (f.chargeDownFrames > 0) {
    f.chargeDownFrames = Math.max(0, f.chargeDownFrames - 4);
  }

  // SF3 Parry input detection (tap 6 or tap 2 from neutral)
  if (
    f.inputBuffer.length >= 2 &&
    (f.state === 'idle' || f.state === 'walk_f' || f.state === 'walk_b' || f.state === 'crouch' || f.state === 'jump')
  ) {
    const prevDir = f.inputBuffer[f.inputBuffer.length - 2].relDir;
    if (prevDir === 5 && relDir === 6) {
      f.parryWindow = 6;
      f.parryHighLow = 'high';
    } else if (prevDir === 5 && relDir === 2 && f.y === 0) {
      f.parryWindow = 6;
      f.parryHighLow = 'low';
    }
  }

  // Auto-turn when grounded and in neutral state
  if (
    f.y === 0 &&
    (f.state === 'idle' ||
      f.state === 'walk_f' ||
      f.state === 'walk_b' ||
      f.state === 'crouch' ||
      f.state === 'block_stand' ||
      f.state === 'block_crouch' ||
      f.state === 'wakeup')
  ) {
    if (f.x < opp.x && f.facing !== 1) f.facing = 1;
    else if (f.x > opp.x && f.facing !== -1) f.facing = -1;
  }

  // State machine transitions
  switch (f.state) {
    case 'intro':
      if (match.phase === 'fighting') {
        f.state = 'idle';
        f.stateFrame = 0;
      }
      break;

    case 'parry':
      if (f.stateFrame >= 10) {
        f.state = f.y < 0 ? 'jump' : 'idle';
        f.stateFrame = 0;
      }
      break;

    case 'roll':
      if (f.stateFrame > 18) {
        f.vx *= 0.6;
      }
      if (f.stateFrame >= 26) {
        f.vx = 0;
        f.state = 'idle';
        f.stateFrame = 0;
      }
      break;

    case 'block_stand':
    case 'block_crouch': {
      // Allow Guard Cancel Blowback
      const gcMove = trySelectMove(f, opp, input, match, audio);
      if (gcMove) {
        startMove(f, gcMove, opp, match);
        break;
      }
      f.blockstunFrames--;
      if (f.blockstunFrames <= 0) {
        f.state = relDir === 1 || relDir === 2 || relDir === 3 ? 'crouch' : 'idle';
        f.stateFrame = 0;
      }
      break;
    }

    case 'hit_high':
    case 'hit_low':
      f.hitstunFrames--;
      if (f.hitstunFrames <= 0) {
        f.comboCount = 0;
        f.comboDamage = 0;
        f.state = 'idle';
        f.stateFrame = 0;
      }
      break;

    case 'air_hit':
      f.vy += meta.gravity;
      f.x += f.vx;
      f.y += f.vy;
      if (f.y >= 0) {
        f.y = 0;
        f.vx = 0;
        f.vy = 0;
        f.state = 'knockdown';
        f.stateFrame = 0;
        f.knockdownFrames = 26;
      }
      break;

    case 'thrown':
      // 7-frame Throw Tech window!
      if (f.stateFrame <= 7 && (input.justC || input.justD)) {
        f.state = 'idle';
        f.stateFrame = 0;
        f.vx = -f.facing * 4.5;
        opp.state = 'idle';
        opp.stateFrame = 0;
        opp.vx = -opp.facing * 4.5;
        addCallout(match, 'ESCAPOU!', f.x, f.y - 84, '#38bdf8');
        spawnParticles(match, (f.x + opp.x) * 0.5, f.y - 56, 12, '#38bdf8', 'parry');
        break;
      }
      if (f.stateFrame > 7 && f.currentMove) {
        const tm = f.currentMove;
        const bossMult = opp.isShadowBoss ? 1.2 : 1.0;
        f.hp = Math.max(0, f.hp - Math.round(tm.damage * bossMult));
        f.trailDelay = 24;
        f.state = 'knockdown';
        f.stateFrame = 0;
        f.knockdownFrames = 30;
        // Gnhoif Envolver spits opponent on the other side
        if (opp.id === 'gnhoif') {
          f.x = Math.max(STAGE_LEFT_BOUND, Math.min(STAGE_RIGHT_BOUND, opp.x - opp.facing * 56));
        } else {
          f.vx = opp.facing * (tm.launchVx ?? 5.0);
        }
        f.currentMove = null;
        match.screenShake = 5;
        spawnParticles(match, f.x, f.y - 40, 14, '#fb7185', 'hit_heavy');
      }
      break;

    case 'knockdown':
      f.vx *= 0.8;
      f.x += f.vx;
      f.knockdownFrames--;
      if (f.knockdownFrames <= 0 && f.hp > 0) {
        f.state = 'wakeup';
        f.stateFrame = 0;
        f.jugglePoints = 0;
        f.comboCount = 0;
        f.comboDamage = 0;
        // Tech roll backward on wakeup if holding 4 (back)
        if (relDir === 4 || relDir === 1) {
          f.vx = -f.facing * 4.2;
          f.invulnFrames = 12;
          addCallout(match, 'ROLAMENTO!', f.x, f.y - 68, '#a855f7');
        }
      }
      break;

    case 'wakeup':
      f.vx *= 0.82;
      f.x += f.vx;
      if (f.stateFrame >= 10) {
        f.vx = 0;
        f.state = 'idle';
        f.stateFrame = 0;
      } else {
        const revMove = trySelectMove(f, opp, input, match, audio);
        if (revMove) startMove(f, revMove, opp, match);
      }
      break;

    case 'dizzy':
      f.dizzyFrames--;
      // Mashing directions and buttons reduces dizzy timer!
      if (input.justA || input.justB || input.justC || input.justD || (f.inputBuffer.length >= 2 && f.inputBuffer[f.inputBuffer.length - 2].relDir !== relDir)) {
        f.dizzyFrames -= 4;
      }
      if (f.dizzyFrames <= 0) {
        f.dizzyFrames = 0;
        f.state = 'idle';
        f.stateFrame = 0;
      }
      break;

    case 'taunt':
      if (f.stateFrame >= 36) {
        f.state = 'idle';
        f.stateFrame = 0;
      }
      break;

    case 'prejump':
      if (f.indexOfJumpReleaseCheck === undefined) {
        // Check if player released Up during the 4 prejump frames -> short hop!
      }
      if (relDir !== 7 && relDir !== 8 && relDir !== 9) {
        f.jumpShort = true;
      }
      if (f.stateFrame >= 4) {
        f.state = 'jump';
        f.stateFrame = 0;
        f.vy = f.jumpShort ? meta.shortJumpVy : meta.jumpVy;
        f.vx = f.jumpDir * f.facing * (meta.walkForwardSpeed * 1.35);
        f.y = -2;
        f.hoverFramesLeft = 30;
      }
      break;

    case 'jump': {
      const airMove = trySelectMove(f, opp, input, match, audio);
      if (airMove) {
        startMove(f, airMove, opp, match);
        break;
      }
      // Gnhoif air hover when holding 8
      if (f.id === 'gnhoif' && (relDir === 7 || relDir === 8 || relDir === 9) && f.vy > -1 && f.hoverFramesLeft > 0) {
        f.hoverFramesLeft--;
        f.vy = 0;
      } else {
        f.vy += meta.gravity;
      }
      f.x += f.vx;
      f.y += f.vy;
      if (f.y >= 0) {
        f.y = 0;
        f.vx = 0;
        f.vy = 0;
        f.state = 'idle';
        f.stateFrame = 0;
      }
      break;
    }

    case 'dash': {
      const dashAttack = trySelectMove(f, opp, input, match, audio);
      if (dashAttack) {
        startMove(f, dashAttack, opp, match);
        break;
      }
      // Boris hold 66 continues running
      if (f.id === 'boris' && relDir === 6 && f.stateFrame >= meta.dashFrames - 2) {
        f.isRunning = true;
        f.vx = f.facing * meta.dashSpeed;
        f.x += f.vx;
        break;
      }
      f.x += f.vx;
      if (f.stateFrame >= meta.dashFrames) {
        f.vx = 0;
        f.isRunning = false;
        f.state = 'idle';
        f.stateFrame = 0;
      }
      break;
    }

    case 'backdash':
      f.x += f.vx;
      if (f.stateFrame >= meta.backdashFrames) {
        f.vx = 0;
        f.state = 'idle';
        f.stateFrame = 0;
      }
      break;

    case 'attack': {
      const m = f.currentMove;
      if (!m) {
        f.state = 'idle';
        break;
      }

      // Check cancel into higher priority move
      const cancelMove = trySelectMove(f, opp, input, match, audio);
      if (cancelMove) {
        startMove(f, cancelMove, opp, match);
        break;
      }

      // Afterimages on supers and EX
      if ((m.category === 'super1' || m.category === 'super3' || m.category === 'ex') && f.stateFrame % 3 === 0) {
        f.afterimages.push({
          x: f.x,
          y: f.y,
          anim: m.poseAnim,
          frame: f.stateFrame,
          facing: f.facing,
          alpha: 0.55
        });
        if (f.afterimages.length > 4) f.afterimages.shift();
      }

      // Gnhoif Passo Umbral teleport on active frame
      if (m.teleportMode && f.stateFrame === m.startup) {
        if (m.teleportMode === 'front') {
          f.x = Math.max(STAGE_LEFT_BOUND, Math.min(STAGE_RIGHT_BOUND, opp.x - opp.facing * 48));
        } else {
          f.x = Math.max(STAGE_LEFT_BOUND, Math.min(STAGE_RIGHT_BOUND, opp.x + opp.facing * 48));
          f.facing = (f.facing * -1) as 1 | -1;
        }
        spawnParticles(match, f.x, f.y - 48, 14, '#a855f7', 'light');
      }

      // Movement during attack
      if (m.moveFrames && f.stateFrame >= m.moveFrames[0] && f.stateFrame <= m.moveFrames[1]) {
        if (m.vxMove !== undefined && f.rootFrames === 0) {
          f.vx = f.facing * m.vxMove;
        }
        if (m.vyMove !== undefined && f.stateFrame === m.moveFrames[0]) {
          f.vy = m.vyMove;
          if (f.y === 0 && m.vyMove < 0) f.y = -2;
        }
      } else if (f.y === 0) {
        f.vx *= 0.7;
      }

      if (f.y < 0) {
        f.vy += meta.gravity;
        f.x += f.vx;
        f.y += f.vy;
        if (f.y >= 0) {
          f.y = 0;
          f.vx = 0;
          f.vy = 0;
          if (m.airOnly) {
            f.currentMove = null;
            f.state = 'idle';
            f.stateFrame = 0;
            break;
          }
        }
      } else {
        f.x += f.vx;
      }

      // Spawn projectile on startup frame
      if (m.projectile && f.stateFrame === m.startup) {
        spawnProjectileFromMove(f, m, match);
      }

      // Multi-hit re-arming
      if (m.hits && m.hits > 1 && m.multiHitInterval && f.stateFrame > m.startup) {
        if ((f.stateFrame - m.startup) % m.multiHitInterval === 0 && f.moveHitCount < m.hits) {
          f.moveHitRegistered = false;
        }
      }

      const totalDuration = m.startup + m.active + m.recovery;
      if (f.stateFrame >= totalDuration) {
        f.currentMove = null;
        f.vx = 0;
        f.state = f.y < 0 ? 'jump' : 'idle';
        f.stateFrame = 0;
      }
      break;
    }

    case 'idle':
    case 'walk_f':
    case 'walk_b':
    case 'crouch': {
      // 1. Check attacks first
      const selectedMove = trySelectMove(f, opp, input, match, audio);
      if (selectedMove) {
        startMove(f, selectedMove, opp, match);
        break;
      }

      // 2. Taunt
      if (input.justTaunt) {
        f.state = 'taunt';
        f.stateFrame = 0;
        f.vx = 0;
        break;
      }

      // 3. Dash / Backdash (66 / 44) if not rooted
      if (f.rootFrames === 0 && f.stateFrame > 1) {
        if (checkDashInput(f.inputBuffer, 6)) {
          f.state = 'dash';
          f.stateFrame = 0;
          f.vx = f.facing * meta.dashSpeed;
          f.inputBuffer = [];
          break;
        }
        if (checkDashInput(f.inputBuffer, 4)) {
          f.state = 'backdash';
          f.stateFrame = 0;
          f.vx = f.facing * meta.backdashSpeed;
          f.inputBuffer = [];
          break;
        }
      }

      // 4. Jump (7, 8, 9) if not rooted
      if (f.rootFrames === 0 && (relDir === 7 || relDir === 8 || relDir === 9)) {
        f.state = 'prejump';
        f.stateFrame = 0;
        f.jumpShort = false;
        f.jumpDir = relDir === 9 ? 1 : relDir === 7 ? -1 : 0;
        f.vx = 0;
        break;
      }

      // 5. Crouch (1, 2, 3)
      if (relDir === 1 || relDir === 2 || relDir === 3) {
        f.state = 'crouch';
        f.vx = 0;
        break;
      }

      // 6. Walk Forward / Backward
      if (f.rootFrames === 0 && relDir === 6) {
        f.state = 'walk_f';
        f.vx = f.facing * meta.walkForwardSpeed;
        f.x += f.vx;
      } else if (f.rootFrames === 0 && relDir === 4) {
        f.state = 'walk_b';
        f.vx = -f.facing * meta.walkBackwardSpeed;
        f.x += f.vx;
      } else {
        f.state = 'idle';
        f.vx = 0;
      }
      break;
    }

    default:
      break;
  }

  // Clamp stage & camera bounds
  f.x = Math.max(STAGE_LEFT_BOUND, Math.min(STAGE_RIGHT_BOUND, f.x));
  updateHurtAndPushBoxes(f);
  updateVerlet(f);

  // Fade afterimages
  for (let i = f.afterimages.length - 1; i >= 0; i--) {
    f.afterimages[i].alpha -= 0.08;
    if (f.afterimages[i].alpha <= 0) f.afterimages.splice(i, 1);
  }
}

function resolvePushboxes(f1: Fighter, f2: Fighter): void {
  // Roll and teleport can pass through pushboxes
  if (f1.state === 'roll' || f2.state === 'roll') return;
  if (
    (f1.state === 'attack' && f1.currentMove?.teleportMode) ||
    (f2.state === 'attack' && f2.currentMove?.teleportMode)
  ) {
    return;
  }

  const b1 = getWorldBox(f1.x, f1.y, f1.facing, f1.pushbox);
  const b2 = getWorldBox(f2.x, f2.y, f2.facing, f2.pushbox);

  if (boxesOverlap(b1, b2)) {
    const overlapX = Math.min(b1.x + b1.w - b2.x, b2.x + b2.w - b1.x);
    if (overlapX > 0) {
      const push = (overlapX + 1) * 0.5;
      if (f1.x < f2.x || (f1.x === f2.x && f1.playerIndex === 0)) {
        f1.x = Math.max(STAGE_LEFT_BOUND, f1.x - push);
        f2.x = Math.min(STAGE_RIGHT_BOUND, f2.x + push);
      } else {
        f1.x = Math.min(STAGE_RIGHT_BOUND, f1.x + push);
        f2.x = Math.max(STAGE_LEFT_BOUND, f2.x - push);
      }
    }
  }

  // Keep fighters within MAX_FIGHTER_SEPARATION so neither goes off-screen
  const dist = Math.abs(f1.x - f2.x);
  if (dist > MAX_FIGHTER_SEPARATION) {
    const excess = (dist - MAX_FIGHTER_SEPARATION) * 0.5;
    if (f1.x < f2.x) {
      f1.x += excess;
      f2.x -= excess;
    } else {
      f1.x -= excess;
      f2.x += excess;
    }
  }
}

function resolveCombatCollisions(match: MatchState, audio?: EngineAudioCallbacks): void {
  const [f1, f2] = match.fighters;

  // 1. Melee Hitbox vs Hurtbox
  for (const [attacker, defender] of [
    [f1, f2],
    [f2, f1]
  ] as Array<[Fighter, Fighter]>) {
    if (
      attacker.state === 'attack' &&
      attacker.currentMove &&
      attacker.activeHitbox &&
      !attacker.moveHitRegistered &&
      !attacker.currentMove.projectile // projectile moves deal damage via their spawned projectile
    ) {
      const isThrow =
        attacker.currentMove.hitHeight === 'throw' ||
        attacker.currentMove.hitHeight === 'air_throw';
      if (isFighterInvulnerable(defender, false, isThrow)) continue;

      const worldHit = getWorldBox(attacker.x, attacker.y, attacker.facing, attacker.activeHitbox);
      const worldHurt = getWorldBox(defender.x, defender.y, defender.facing, defender.hurtbox);

      if (boxesOverlap(worldHit, worldHurt)) {
        attacker.moveHitRegistered = true;
        attacker.moveHitCount++;
        applyHitOrBlock(attacker, defender, attacker.currentMove, false, match, audio);
      }
    }
  }

  // 2. Projectile vs Projectile clash
  for (let i = 0; i < match.projectiles.length; i++) {
    for (let j = i + 1; j < match.projectiles.length; j++) {
      const p1 = match.projectiles[i];
      const p2 = match.projectiles[j];
      if (p1.ownerIndex === p2.ownerIndex) continue;
      if (p1.hitsRemaining <= 0 || p2.hitsRemaining <= 0) continue;

      const b1: Box = { x: p1.x - p1.spec.w * 0.5, y: p1.y - p1.spec.h * 0.5, w: p1.spec.w, h: p1.spec.h };
      const b2: Box = { x: p2.x - p2.spec.w * 0.5, y: p2.y - p2.spec.h * 0.5, w: p2.spec.w, h: p2.spec.h };

      if (boxesOverlap(b1, b2)) {
        spawnParticles(match, (p1.x + p2.x) * 0.5, (p1.y + p2.y) * 0.5, 10, '#fde047', 'hit_light');
        if (!p1.spec.pierceProjectiles) p1.hitsRemaining = 0;
        if (!p2.spec.pierceProjectiles) p2.hitsRemaining = 0;
      }
    }
  }

  // 3. Projectile movement & vs Fighter
  for (let i = match.projectiles.length - 1; i >= 0; i--) {
    const p = match.projectiles[i];
    p.frame++;
    if (p.hitCooldown > 0) p.hitCooldown--;

    p.x += p.vx;
    p.y += p.vy;
    if (p.spec.gravity) {
      p.vy += p.spec.gravity;
    }

    if (p.frame >= p.spec.duration || p.hitsRemaining <= 0 || p.x < -40 || p.x > STAGE_WIDTH + 40) {
      match.projectiles.splice(i, 1);
      continue;
    }

    const attacker = match.fighters[p.ownerIndex];
    const defender = match.fighters[p.ownerIndex === 0 ? 1 : 0];

    if (p.hitCooldown > 0) continue;
    if (isFighterInvulnerable(defender, true, false)) continue;

    const pBox: Box = { x: p.x - p.spec.w * 0.5, y: p.y - p.spec.h * 0.5, w: p.spec.w, h: p.spec.h };
    const defHurt = getWorldBox(defender.x, defender.y, defender.facing, defender.hurtbox);

    if (boxesOverlap(pBox, defHurt)) {
      // Cassandra 214C Reflect Projectiles!
      if (
        defender.state === 'attack' &&
        defender.currentMove?.reflectProjectiles &&
        defender.stateFrame >= (defender.currentMove.counterStart ?? 4) &&
        defender.stateFrame <= (defender.currentMove.counterEnd ?? 25) &&
        !p.reflected
      ) {
        p.ownerIndex = defender.playerIndex;
        p.vx = -p.vx * 1.2;
        p.facing = (p.facing * -1) as 1 | -1;
        p.reflected = true;
        p.frame = 0;
        addCallout(match, 'REFLETIDO!', defender.x, defender.y - 88, '#fde047');
        spawnParticles(match, p.x, p.y, 12, '#fde047', 'parry');
        audio?.onParry?.();
        continue;
      }

      // Gnhoif 22A/C Manto Faminto Absorb Projectiles!
      if (
        defender.state === 'attack' &&
        defender.currentMove?.absorbProjectiles &&
        defender.stateFrame <= defender.currentMove.startup + defender.currentMove.active
      ) {
        p.hitsRemaining = 0;
        defender.superMeter = Math.min(3000, defender.superMeter + 250);
        addCallout(match, 'ABSORVIDO!', defender.x, defender.y - 96, '#a855f7');
        spawnParticles(match, p.x, p.y, 14, '#a855f7', 'light');
        audio?.onParry?.();
        continue;
      }

      // Construct synthetic MoveData for projectile hit
      const projMove: MoveData = {
        id: p.spec.id,
        name: p.spec.id,
        commandLabel: '',
        category: 'special',
        motion: '236',
        button: 'A',
        startup: 1,
        active: 1,
        recovery: 1,
        damage: p.spec.damage,
        stun: 60,
        hitstun: p.spec.hitstun,
        blockstun: p.spec.blockstun,
        hitstop: 8,
        pushback: p.spec.pushback,
        hitHeight: p.spec.hitHeight,
        knockdown: p.spec.knockdown,
        launchVy: p.spec.launchVy,
        juggleCost: 2,
        juggleLimit: 6,
        applyPoison: p.spec.applyPoison,
        meterCost: 0,
        meterGainHit: 60,
        meterGainWhiff: 0,
        hitbox: pBox,
        projectile: p.spec,
        poseAnim: 'idle'
      };

      applyHitOrBlock(attacker, defender, projMove, true, match, audio);
      p.hitsRemaining--;
      p.hitCooldown = 5;
    }
  }
}

function applyTrainingDummyInput(match: MatchState, p2Input: InputFrame): InputFrame {
  if (match.mode !== 'training') return p2Input;
  const dummy = match.trainingDummy;
  if (dummy === 'cpu') return p2Input;

  const out: InputFrame = {
    ...p2Input,
    dir: 5,
    rawUp: false,
    rawDown: false,
    rawLeft: false,
    rawRight: false,
    A: false,
    B: false,
    C: false,
    D: false,
    justA: false,
    justB: false,
    justC: false,
    justD: false,
    justShortcutAB: false,
    justShortcutCD: false,
    justTaunt: false
  };

  if (dummy === 'crouch') {
    out.dir = 2;
    out.rawDown = true;
  } else if (dummy === 'jump') {
    out.dir = 8;
    out.rawUp = true;
  }
  return out;
}

export function stepMatch(
  match: MatchState,
  p1Input: InputFrame,
  p2Input: InputFrame,
  options: GameOptions,
  audio?: EngineAudioCallbacks
): void {
  match.frame++;

  // Update visual timers even during hitstop/cinematic
  if (match.screenShake > 0) match.screenShake = Math.max(0, match.screenShake - 0.6);
  if (match.solarFlashTimer > 0) match.solarFlashTimer--;
  if (match.desaturateTimer > 0) match.desaturateTimer--;

  // Update floating callouts
  for (let i = match.callouts.length - 1; i >= 0; i--) {
    match.callouts[i].y -= 0.4;
    match.callouts[i].timer--;
    if (match.callouts[i].timer <= 0) match.callouts.splice(i, 1);
  }

  // Update particles
  for (const p of match.particles) {
    if (!p.active) continue;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18;
    p.life++;
    if (p.life >= p.maxLife) p.active = false;
  }

  // Super Flash or Level 3 Cinematic freeze
  if (match.cinematic.active) {
    match.cinematic.frame++;
    if (match.cinematic.frame >= match.cinematic.maxFrames) {
      match.cinematic.active = false;
    }
    return;
  }

  // Hitstop freeze
  if (match.hitstopTimer > 0) {
    match.hitstopTimer--;
    return;
  }

  // Phase handling
  if (match.phase === 'intro') {
    match.phaseTimer--;
    match.fighters[0].stateFrame++;
    match.fighters[1].stateFrame++;
    if (match.phaseTimer <= 0) {
      match.phase = 'announce_round';
      match.phaseTimer = 55;
      match.announceText = `ROUND ${match.roundNumber}`;
      audio?.onAnnounce?.(`Round ${match.roundNumber}`);
    }
    return;
  }

  if (match.phase === 'announce_round') {
    match.phaseTimer--;
    if (match.phaseTimer === 22) {
      match.announceText = 'LUTEM!';
      audio?.onAnnounce?.('Lutem!');
    }
    if (match.phaseTimer <= 0) {
      match.phase = 'fighting';
      match.announceText = '';
      match.fighters[0].state = 'idle';
      match.fighters[1].state = 'idle';
    }
    return;
  }

  if (match.phase === 'ko_slowmo') {
    match.phaseTimer--;
    // 60 frames slow-mo on KO: advance simulation every 3rd frame
    if (match.phaseTimer % 3 !== 0) return;
    if (match.phaseTimer <= 0) {
      match.phase = 'round_over';
      match.phaseTimer = 90;
      const [f1, f2] = match.fighters;
      if (match.winnerIndex === 0) {
        f1.state = 'win';
        f1.stateFrame = 0;
        if (f1.hp === f1.maxHp) {
          match.announceText = 'PERFEITO!';
          audio?.onAnnounce?.('Perfeito!');
        } else {
          match.announceText = `${f1.name} VENCEU`;
        }
      } else if (match.winnerIndex === 1) {
        f2.state = 'win';
        f2.stateFrame = 0;
        if (f2.hp === f2.maxHp) {
          match.announceText = 'PERFEITO!';
          audio?.onAnnounce?.('Perfeito!');
        } else {
          match.announceText = `${f2.name} VENCEU`;
        }
      } else {
        match.announceText = 'EMPATE';
        audio?.onAnnounce?.('Empate');
      }
      return;
    }
  }

  if (match.phase === 'round_over') {
    match.phaseTimer--;
    match.fighters[0].stateFrame++;
    match.fighters[1].stateFrame++;
    if (match.phaseTimer <= 0) {
      const [f1, f2] = match.fighters;
      if (f1.roundsWon >= options.roundsToWin || f2.roundsWon >= options.roundsToWin) {
        match.phase = 'match_over';
      } else {
        match.roundNumber++;
        resetRound(match, options);
      }
    }
    return;
  }

  if (match.phase === 'match_over') {
    return;
  }

  // Active Fighting phase
  const [f1, f2] = match.fighters;
  const effectiveP2Input = applyTrainingDummyInput(match, p2Input);

  stepFighter(f1, f2, p1Input, match, audio);
  stepFighter(f2, f1, effectiveP2Input, match, audio);

  resolvePushboxes(f1, f2);
  resolveCombatCollisions(match, audio);

  // Camera tracks midpoint between fighters smoothly
  const midX = (f1.x + f2.x) * 0.5;
  const targetCamX = Math.max(0, Math.min(STAGE_WIDTH - SCREEN_WIDTH, midX - SCREEN_WIDTH * 0.5));
  match.cameraX += (targetCamX - match.cameraX) * 0.25;

  // Timer & KO checks (except in Training mode)
  if (match.mode !== 'training' && match.phase === 'fighting') {
    if (match.timerFrames > 0) {
      match.timerFrames--;
    }

    const f1Dead = f1.hp <= 0;
    const f2Dead = f2.hp <= 0;
    const timeOut = match.timerFrames === 0;

    if (f1Dead || f2Dead || timeOut) {
      match.phase = 'ko_slowmo';
      match.phaseTimer = 60; // 60-frame KO slow motion with flash!
      audio?.onKo?.();

      if (f1Dead && f2Dead) {
        match.winnerIndex = -1;
        match.winReason = 'draw';
        match.announceText = 'EMPATE!';
        f1.state = 'knockdown';
        f2.state = 'knockdown';
      } else if (f2Dead || (timeOut && f1.hp > f2.hp)) {
        match.winnerIndex = 0;
        match.winReason = timeOut ? 'time' : f1.hp === f1.maxHp ? 'perfect' : 'ko';
        match.announceText = timeOut ? 'TEMPO!' : 'K.O.!';
        f1.roundsWon++;
        f2.state = timeOut ? 'time_lose' : 'knockdown';
        f2.knockdownFrames = 999;
      } else if (f1Dead || (timeOut && f2.hp > f1.hp)) {
        match.winnerIndex = 1;
        match.winReason = timeOut ? 'time' : f2.hp === f2.maxHp ? 'perfect' : 'ko';
        match.announceText = timeOut ? 'TEMPO!' : 'K.O.!';
        f2.roundsWon++;
        f1.state = timeOut ? 'time_lose' : 'knockdown';
        f1.knockdownFrames = 999;
      } else {
        match.winnerIndex = -1;
        match.winReason = 'draw';
        match.announceText = 'EMPATE!';
      }
      audio?.onAnnounce?.(match.announceText);
    }
  }
}

declare module './types' {
  interface Fighter {
    indexOfJumpReleaseCheck?: number;
  }
}
