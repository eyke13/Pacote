import { BufferedEntry, InputFrame, KeyBindings, MotionCommand } from './types';

export const DEFAULT_P1_KEYS: KeyBindings = {
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  A: 'KeyU',
  B: 'KeyJ',
  C: 'KeyI',
  D: 'KeyK',
  shortcutAB: 'KeyO',
  shortcutCD: 'KeyL',
  taunt: 'KeyY'
};

export const DEFAULT_P2_KEYS: KeyBindings = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  A: 'Numpad4',
  B: 'Numpad1',
  C: 'Numpad5',
  D: 'Numpad2',
  shortcutAB: 'Numpad6',
  shortcutCD: 'Numpad3',
  taunt: 'Numpad0'
};

export const P2_ALT_KEYS: KeyBindings = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  A: 'Insert',
  B: 'Delete',
  C: 'Home',
  D: 'End',
  shortcutAB: 'PageUp',
  shortcutCD: 'PageDown',
  taunt: 'ControlRight'
};

export function computeWorldNumpad(
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean
): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 {
  const x = (right ? 1 : 0) - (left ? 1 : 0);
  const y = (up ? 1 : 0) - (down ? 1 : 0);
  if (y === -1) {
    if (x === -1) return 1;
    if (x === 1) return 3;
    return 2;
  }
  if (y === 1) {
    if (x === -1) return 7;
    if (x === 1) return 9;
    return 8;
  }
  if (x === -1) return 4;
  if (x === 1) return 6;
  return 5;
}

export function toRelativeDir(
  worldDir: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
  facing: 1 | -1
): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 {
  if (facing === 1) return worldDir;
  switch (worldDir) {
    case 1:
      return 3;
    case 3:
      return 1;
    case 4:
      return 6;
    case 6:
      return 4;
    case 7:
      return 9;
    case 9:
      return 7;
    default:
      return worldDir;
  }
}

export function createEmptyInputFrame(): InputFrame {
  return {
    dir: 5,
    rawUp: false,
    rawDown: false,
    rawLeft: false,
    rawRight: false,
    A: false,
    B: false,
    C: false,
    D: false,
    taunt: false,
    shortcutAB: false,
    shortcutCD: false,
    justA: false,
    justB: false,
    justC: false,
    justD: false,
    justTaunt: false,
    justShortcutAB: false,
    justShortcutCD: false
  };
}

export function pushInputToBuffer(
  buffer: BufferedEntry[],
  frame: number,
  input: InputFrame,
  facing: 1 | -1
): BufferedEntry {
  const relDir = toRelativeDir(input.dir, facing);
  const entry: BufferedEntry = {
    frame,
    relDir,
    justDirs: [relDir],
    justA: input.justA,
    justB: input.justB,
    justC: input.justC,
    justD: input.justD,
    justTaunt: input.justTaunt,
    justShortcutAB: input.justShortcutAB,
    justShortcutCD: input.justShortcutCD,
    heldA: input.A,
    heldB: input.B,
    heldC: input.C,
    heldD: input.D
  };
  buffer.push(entry);
  while (buffer.length > 20) {
    buffer.shift();
  }
  return entry;
}

// Helper to check if a sequence of relative directions occurred in order within the last `windowFrames`
function matchDirectionSequence(
  buffer: BufferedEntry[],
  sequence: Array<number | number[]>,
  windowFrames = 20
): boolean {
  if (buffer.length === 0) return false;
  const latestFrame = buffer[buffer.length - 1].frame;
  let seqIdx = sequence.length - 1;

  for (let i = buffer.length - 1; i >= 0; i--) {
    const entry = buffer[i];
    if (latestFrame - entry.frame > windowFrames) break;
    const target = sequence[seqIdx];
    const matches = Array.isArray(target)
      ? target.includes(entry.relDir)
      : entry.relDir === target;
    if (matches) {
      seqIdx--;
      if (seqIdx < 0) return true;
    }
  }
  return false;
}

export function checkMotion(
  buffer: BufferedEntry[],
  motion: MotionCommand,
  chargeBackFrames: number,
  chargeDownFrames: number
): boolean {
  if (buffer.length === 0) return false;
  const current = buffer[buffer.length - 1].relDir;

  switch (motion) {
    case 'none':
      return true;
    case '6':
      return current === 6;
    case '4':
      return current === 4;
    case '2':
      return current === 2 || current === 1 || current === 3;
    case '3':
      return current === 3;
    case '236':
      // Tolerant 236: allows 2 -> 3 -> 6, or 2 -> 6 (diagonal skipped), and allows ending on 5 (2365)
      return (
        matchDirectionSequence(buffer, [2, 3, [6, 9]], 16) ||
        matchDirectionSequence(buffer, [[1, 2], [6, 3]], 14)
      );
    case '214':
      return (
        matchDirectionSequence(buffer, [2, 1, [4, 7]], 16) ||
        matchDirectionSequence(buffer, [[2, 3], [4, 1]], 14)
      );
    case '623':
      return (
        matchDirectionSequence(buffer, [6, 2, 3], 16) ||
        matchDirectionSequence(buffer, [6, 3, 2, 3], 18) ||
        matchDirectionSequence(buffer, [6, 2, 6], 16)
      );
    case '63214':
      // Half-circle back or 360 rotation
      return (
        matchDirectionSequence(buffer, [6, 2, 4], 18) ||
        matchDirectionSequence(buffer, [6, 3, 1, 4], 18) ||
        matchDirectionSequence(buffer, [6, 2, 4, [7, 8, 9]], 20) ||
        matchDirectionSequence(buffer, [4, 2, 6, [7, 8, 9]], 20)
      );
    case '22':
      return matchDirectionSequence(buffer, [[1, 2, 3], 5, [1, 2, 3]], 16);
    case '[4]6':
      // Requires real ~40f charge of back (4 or 1) and recent forward (6 or 9)
      return (
        chargeBackFrames >= 38 &&
        matchDirectionSequence(buffer, [[6, 9]], 8)
      );
    case '[2]8':
      // Requires real ~40f charge of down (1, 2, 3) and recent up (7, 8, 9)
      return (
        chargeDownFrames >= 38 &&
        matchDirectionSequence(buffer, [[7, 8, 9]], 8)
      );
    case '236236':
      return (
        matchDirectionSequence(buffer, [2, 6, 2, 6], 20) ||
        matchDirectionSequence(buffer, [2, 3, 6, 2, 3, 6], 20)
      );
    case '214214':
      return (
        matchDirectionSequence(buffer, [2, 4, 2, 4], 20) ||
        matchDirectionSequence(buffer, [2, 1, 4, 2, 1, 4], 20)
      );
    case '6321463214':
      return (
        matchDirectionSequence(buffer, [6, 2, 4, 6, 2, 4], 20) ||
        matchDirectionSequence(buffer, [6, 2, 4, 2, 4], 20)
      );
    default:
      return false;
  }
}

export function checkDashInput(buffer: BufferedEntry[], dir: 6 | 4): boolean {
  return matchDirectionSequence(buffer, [dir, 5, dir], 12);
}

// Check if two buttons were pressed within a 3-frame window (manual chord)
export function checkTwoButtonChord(
  buffer: BufferedEntry[],
  btn1: 'A' | 'B' | 'C' | 'D',
  btn2: 'A' | 'B' | 'C' | 'D',
  allowShortcut = false
): boolean {
  if (buffer.length === 0) return false;
  const latest = buffer[buffer.length - 1];

  if (allowShortcut) {
    if (
      (btn1 === 'A' && btn2 === 'B' && latest.justShortcutAB) ||
      (btn1 === 'C' && btn2 === 'D' && latest.justShortcutCD)
    ) {
      return true;
    }
  }

  // Shortcuts NEVER trigger EX (AC or BD)
  if ((btn1 === 'A' && btn2 === 'C') || (btn1 === 'B' && btn2 === 'D')) {
    if (latest.justShortcutAB || latest.justShortcutCD) {
      return false;
    }
  }

  const keyJust1 = `just${btn1}` as keyof BufferedEntry;
  const keyJust2 = `just${btn2}` as keyof BufferedEntry;

  const latestDidPressOne = Boolean(latest[keyJust1] || latest[keyJust2]);
  if (!latestDidPressOne) return false;

  let saw1 = false;
  let saw2 = false;
  for (let i = buffer.length - 1; i >= Math.max(0, buffer.length - 3); i--) {
    const entry = buffer[i];
    if (latest.frame - entry.frame > 3) break;
    if (entry[keyJust1]) saw1 = true;
    if (entry[keyJust2]) saw2 = true;
  }
  return saw1 && saw2;
}

export function formatInputSymbol(entry: BufferedEntry): string {
  const dirArrows: Record<number, string> = {
    1: '↙',
    2: '↓',
    3: '↘',
    4: '←',
    5: '•',
    6: '→',
    7: '↖',
    8: '↑',
    9: '↗'
  };
  const btns: string[] = [];
  if (entry.justShortcutAB) btns.push('A+B');
  else if (entry.justShortcutCD) btns.push('C+D');
  else {
    if (entry.justA) btns.push('A');
    if (entry.justB) btns.push('B');
    if (entry.justC) btns.push('C');
    if (entry.justD) btns.push('D');
  }
  if (entry.justTaunt) btns.push('PROV');
  return `${dirArrows[entry.relDir] || '•'}${btns.length ? ' ' + btns.join('+') : ''}`;
}
