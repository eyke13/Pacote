import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkMotion,
  checkTwoButtonChord,
  createEmptyInputFrame,
  DEFAULT_P1_KEYS,
  pushInputToBuffer
} from './input';
import {
  calculateComboScale,
  createMatchState,
  stepMatch
} from './engine';
import { BufferedEntry, GameOptions } from './types';

const TEST_OPTIONS: GameOptions = {
  difficulty: 'normal',
  roundTime: 99,
  roundsToWin: 2,
  sfxVolume: 0.8,
  bgmVolume: 0.5,
  announcerEnabled: false,
  muted: false,
  showHitboxes: false,
  p1Keys: DEFAULT_P1_KEYS,
  p2Keys: DEFAULT_P1_KEYS
};

test('236+A motion parses consistently including skipped diagonal and trailing 5, while [4]6 requires real charge', () => {
  const buf: BufferedEntry[] = [];
  const f1 = createEmptyInputFrame();
  f1.dir = 2;
  pushInputToBuffer(buf, 1, f1, 1);
  f1.dir = 3;
  pushInputToBuffer(buf, 3, f1, 1);
  f1.dir = 6;
  pushInputToBuffer(buf, 5, f1, 1);
  f1.dir = 5; // 2365 tolerance
  pushInputToBuffer(buf, 6, f1, 1);

  assert.equal(checkMotion(buf, '236', 0, 0), true);

  // [4]6 should fail when chargeBackFrames < 38
  assert.equal(checkMotion(buf, '[4]6', 15, 0), false);
  // [4]6 should succeed when charged for >= 40 frames
  assert.equal(checkMotion(buf, '[4]6', 42, 0), true);
});

test('Blocked specials deal 1/8 chip damage and cannot kill, while supers deal 1/4 chip and can KO', () => {
  const match = createMatchState('versus', 'boris', 'cassandra', 0, 0, 'estudio', TEST_OPTIONS, false);
  match.phase = 'fighting';
  const [p1, p2] = match.fighters;
  p1.state = 'idle';
  p2.state = 'idle';
  p1.x = 320;
  p2.x = 365;
  p2.hp = 5; // Very low HP

  // Feed 236+A on P1 (Boris Adaga Serpente, 75 damage -> 1/8 chip = 9) while P2 holds back (dir = 6 since P2 faces left -1)
  const p1In = createEmptyInputFrame();
  const p2In = createEmptyInputFrame();
  p2In.dir = 6; // World right = relative 4 (back) for P2 facing -1

  p1In.dir = 2;
  stepMatch(match, p1In, p2In, TEST_OPTIONS);
  p1In.dir = 3;
  stepMatch(match, p1In, p2In, TEST_OPTIONS);
  p1In.dir = 6;
  p1In.A = true;
  p1In.justA = true;
  stepMatch(match, p1In, p2In, TEST_OPTIONS);

  p1In.justA = false;
  for (let i = 0; i < 20; i++) {
    stepMatch(match, p1In, p2In, TEST_OPTIONS);
  }

  // P2 blocked the special: HP should stop at 1, not 0!
  assert.equal(p2.hp, 1);
});

test('Throw beats standing guard and whiffs against jumping opponent', () => {
  const match = createMatchState('versus', 'cassandra', 'boris', 0, 0, 'estudio', TEST_OPTIONS, false);
  match.phase = 'fighting';
  const [p1, p2] = match.fighters;
  p1.state = 'idle';
  p2.state = 'idle';
  p1.x = 340;
  p2.x = 368; // Close range (28px)

  const p1In = createEmptyInputFrame();
  const p2In = createEmptyInputFrame();
  p2In.dir = 6; // P2 holding back to block

  p1In.dir = 6;
  p1In.C = true;
  p1In.justC = true;
  stepMatch(match, p1In, p2In, TEST_OPTIONS);

  p1In.justC = false;
  for (let i = 0; i < 15; i++) {
    stepMatch(match, p1In, p2In, TEST_OPTIONS);
  }

  assert.equal(p2.hp < p2.maxHp, true, 'Throw should damage blocking opponent');

  // Now test throw against airborne opponent
  const matchAir = createMatchState('versus', 'cassandra', 'boris', 0, 0, 'estudio', TEST_OPTIONS, false);
  matchAir.phase = 'fighting';
  const [a1, a2] = matchAir.fighters;
  a1.state = 'idle';
  a2.state = 'jump';
  a2.y = -35;
  a1.x = 340;
  a2.x = 368;

  p1In.dir = 6;
  p1In.C = true;
  p1In.justC = true;
  stepMatch(matchAir, p1In, createEmptyInputFrame(), TEST_OPTIONS);
  p1In.justC = false;
  for (let i = 0; i < 10; i++) {
    stepMatch(matchAir, p1In, createEmptyInputFrame(), TEST_OPTIONS);
  }
  assert.equal(a2.hp, a2.maxHp, 'Ground throw must whiff against jumping opponent');
});

test('Opposing projectiles clash and cancel each other out', () => {
  const match = createMatchState('versus', 'boris', 'boris', 0, 1, 'clareira', TEST_OPTIONS, false);
  match.phase = 'fighting';
  const [p1, p2] = match.fighters;
  p1.state = 'idle';
  p2.state = 'idle';
  p1.x = 260;
  p2.x = 500;

  const p1In = createEmptyInputFrame();
  const p2In = createEmptyInputFrame();

  // Both input 236+A
  p1In.dir = 2;
  p2In.dir = 2;
  stepMatch(match, p1In, p2In, TEST_OPTIONS);

  p1In.dir = 3;
  p2In.dir = 1; // relative 3 for P2 facing left
  stepMatch(match, p1In, p2In, TEST_OPTIONS);

  p1In.dir = 6;
  p1In.A = true;
  p1In.justA = true;
  p2In.dir = 4; // relative 6 for P2 facing left
  p2In.A = true;
  p2In.justA = true;
  stepMatch(match, p1In, p2In, TEST_OPTIONS);

  p1In.justA = false;
  p2In.justA = false;
  for (let i = 0; i < 35; i++) {
    stepMatch(match, p1In, p2In, TEST_OPTIONS);
  }

  assert.equal(match.projectiles.length, 0, 'Projectiles should annihilate each other upon collision');
  assert.equal(p1.hp, p1.maxHp);
  assert.equal(p2.hp, p2.maxHp);
});

test('Pushboxes prevent walking through opponent and fighters auto-turn when crossing sides', () => {
  const match = createMatchState('versus', 'cassandra', 'boris', 0, 0, 'estudio', TEST_OPTIONS, false);
  match.phase = 'fighting';
  const [p1, p2] = match.fighters;
  p1.state = 'idle';
  p2.state = 'idle';
  p1.x = 370;
  p2.x = 400;

  const p1In = createEmptyInputFrame();
  p1In.dir = 6; // Walk right toward P2
  for (let i = 0; i < 30; i++) {
    stepMatch(match, p1In, createEmptyInputFrame(), TEST_OPTIONS);
  }
  assert.equal(p1.x < p2.x, true, 'P1 cannot walk through P2 pushbox');

  // Place P1 to the right of P2 and step once -> both should auto-flip facing
  p1.x = 450;
  p2.x = 350;
  stepMatch(match, createEmptyInputFrame(), createEmptyInputFrame(), TEST_OPTIONS);
  assert.equal(p1.facing, -1);
  assert.equal(p2.facing, 1);
});

test('Combo scaling and Boris poison rules (drains every 10 frames, never kills below 1 HP)', () => {
  assert.equal(calculateComboScale(1, false), 1.0);
  assert.equal(calculateComboScale(3, false), 0.85);
  assert.equal(calculateComboScale(10, false), 0.3);
  assert.equal(calculateComboScale(10, true), 0.5);

  const match = createMatchState('versus', 'boris', 'cassandra', 0, 0, 'clareira', TEST_OPTIONS, false);
  match.phase = 'fighting';
  const [, p2] = match.fighters;
  p2.state = 'idle';
  p2.hp = 4;
  p2.poisonStacks = 3;
  p2.poisonTimer = 60;

  for (let i = 0; i < 40; i++) {
    stepMatch(match, createEmptyInputFrame(), createEmptyInputFrame(), TEST_OPTIONS);
  }
  assert.equal(p2.hp, 1, 'Poison must stop at 1 HP and never kill');
});

test('Shortcuts A+B (O) and C+D (L) trigger Roll and Blowback without firing EX moves', () => {
  const buf: BufferedEntry[] = [];
  const inp = createEmptyInputFrame();
  inp.justShortcutAB = true;
  pushInputToBuffer(buf, 1, inp, 1);

  assert.equal(checkTwoButtonChord(buf, 'A', 'B', true), true);
  assert.equal(checkTwoButtonChord(buf, 'A', 'C', false), false);
});
