export type CharacterId = 'cassandra' | 'boris' | 'gnhoif' | 'barbara';

export type StageId = 'estudio' | 'clareira' | 'sanatorio' | 'observatorio';

export type GameMode = 'arcade' | 'versus' | 'training';

export type DifficultyLevel = 'facil' | 'normal' | 'dificil' | 'pesadelo';

export type DummyBehavior =
  | 'stand'
  | 'crouch'
  | 'jump'
  | 'block_all'
  | 'block_after_first'
  | 'cpu';

export type HitHeight = 'high' | 'mid' | 'low' | 'overhead' | 'throw' | 'air_throw';

export type MoveCategory =
  | 'normal'
  | 'command_normal'
  | 'universal'
  | 'throw'
  | 'special'
  | 'ex'
  | 'super1'
  | 'super3';

export type MotionCommand =
  | 'none'
  | '6'
  | '4'
  | '2'
  | '3'
  | '236'
  | '214'
  | '623'
  | '63214'
  | '22'
  | '[4]6'
  | '[2]8'
  | '236236'
  | '214214'
  | '6321463214';

export type ButtonId = 'A' | 'B' | 'C' | 'D' | 'AB' | 'CD' | 'AC' | 'BD';

export interface Box {
  x: number; // relative to fighter x (facing right)
  y: number; // relative to fighter y (ground = 0, negative = up)
  w: number;
  h: number;
}

export interface ProjectileSpec {
  id: string;
  xOffset: number;
  yOffset: number;
  vx: number;
  vy: number;
  gravity?: number;
  w: number;
  h: number;
  damage: number;
  chipDamage?: number;
  hitstun: number;
  blockstun: number;
  hitHeight: HitHeight;
  knockdown?: boolean;
  launchVy?: number;
  pushback: number;
  duration: number;
  hits: number;
  pierceProjectiles?: boolean;
  applyPoison?: number;
  rootFrames?: number; // for Mãos de Giz
  isBeam?: boolean;
  isSummon?: boolean;
  summonType?: 'botao_punch' | 'botao_smash' | 'traca_low' | 'traca_arc' | 'giz_mid' | 'giz_far';
  color: string;
}

export interface MoveData {
  id: string;
  name: string;
  commandLabel: string;
  category: MoveCategory;
  motion: MotionCommand;
  button: ButtonId;
  airOk?: boolean;
  airOnly?: boolean;
  crouchOnly?: boolean;
  closeOnly?: boolean;
  closeRange?: number;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  stun: number;
  hitstun: number;
  blockstun: number;
  hitstop: number;
  pushback: number;
  hitHeight: HitHeight;
  knockdown?: boolean;
  hardKnockdown?: boolean;
  launchVx?: number;
  launchVy?: number;
  juggleCost: number;
  juggleLimit: number;
  cancelIntoSpecial?: boolean;
  cancelIntoSuper?: boolean;
  chainableLight?: boolean;
  invulnStart?: number;
  invulnEnd?: number;
  projectileInvulnStart?: number;
  projectileInvulnEnd?: number;
  throwInvulnStart?: number;
  throwInvulnEnd?: number;
  counterStart?: number;
  counterEnd?: number;
  reflectProjectiles?: boolean;
  absorbProjectiles?: boolean;
  absorbStrikes?: boolean;
  meterCost: number; // 0, 500 (EX), 1000 (Lv1 / GuardCancel), 3000 (Lv3)
  meterGainHit: number;
  meterGainWhiff: number;
  vxMove?: number;
  vyMove?: number;
  moveFrames?: [number, number];
  hits?: number;
  multiHitInterval?: number;
  applyPoison?: number;
  auraDuration?: number; // Miasma frames
  auraRadius?: number;
  teleportMode?: 'front' | 'behind';
  hitbox: Box;
  hurtboxMod?: Box;
  projectile?: ProjectileSpec;
  secondaryProjectile?: ProjectileSpec;
  poseAnim: string;
  cinematicId?: 'cassandra_lv3' | 'boris_lv3' | 'gnhoif_lv3' | 'barbara_lv3';
}

export type FighterStateName =
  | 'intro'
  | 'idle'
  | 'walk_f'
  | 'walk_b'
  | 'crouch'
  | 'prejump'
  | 'jump'
  | 'dash'
  | 'backdash'
  | 'attack'
  | 'roll'
  | 'parry'
  | 'block_stand'
  | 'block_crouch'
  | 'hit_high'
  | 'hit_low'
  | 'air_hit'
  | 'knockdown'
  | 'wakeup'
  | 'thrown'
  | 'dizzy'
  | 'win'
  | 'time_lose'
  | 'taunt';

export interface VerletNode {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
}

export interface Palette {
  name: string;
  colors: string[]; // Max 16 colors
  outline: string;
  skin: [string, string, string]; // 3-tone shading: light, mid, dark
  primary: [string, string, string];
  secondary: [string, string, string];
  accent: [string, string, string];
  weapon: [string, string, string];
  fxColor: string;
  isShadowBoss?: boolean;
}

export interface SpriteSource {
  getCharacterFrame(
    charId: CharacterId,
    paletteIdx: number,
    animName: string,
    frameIdx: number,
    facing: 1 | -1,
    isPoisoned: boolean,
    isShadowBoss: boolean
  ): HTMLCanvasElement | null;
}

export interface InputFrame {
  dir: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // Numpad notation relative to world (raw) or facing
  rawUp: boolean;
  rawDown: boolean;
  rawLeft: boolean;
  rawRight: boolean;
  A: boolean;
  B: boolean;
  C: boolean;
  D: boolean;
  taunt: boolean;
  shortcutAB: boolean;
  shortcutCD: boolean;
  justA: boolean;
  justB: boolean;
  justC: boolean;
  justD: boolean;
  justTaunt: boolean;
  justShortcutAB: boolean;
  justShortcutCD: boolean;
}

export interface BufferedEntry {
  frame: number;
  relDir: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  justDirs: number[];
  justA: boolean;
  justB: boolean;
  justC: boolean;
  justD: boolean;
  justTaunt: boolean;
  justShortcutAB: boolean;
  justShortcutCD: boolean;
  heldA: boolean;
  heldB: boolean;
  heldC: boolean;
  heldD: boolean;
}

export interface Fighter {
  playerIndex: 0 | 1;
  id: CharacterId;
  name: string;
  title: string;
  paletteIdx: number;
  isShadowBoss: boolean;
  isCpu: boolean;
  x: number;
  y: number; // 0 = floor, negative = up in air
  vx: number;
  vy: number;
  facing: 1 | -1; // 1 = facing right, -1 = facing left
  maxHp: number;
  hp: number;
  trailHp: number;
  trailDelay: number;
  superMeter: number; // 0 to 3000 (3 levels of 1000)
  maxStun: number;
  stun: number;
  stunRegenTimer: number;
  state: FighterStateName;
  stateFrame: number;
  animFrame: number;
  currentMove: MoveData | null;
  moveHitRegistered: boolean;
  moveHitCount: number;
  comboCount: number;
  comboDamage: number;
  comboDisplayTimer: number;
  jugglePoints: number;
  hitstunFrames: number;
  blockstunFrames: number;
  knockdownFrames: number;
  dizzyFrames: number;
  rootFrames: number; // Mãos de Giz foot-trap
  invulnFrames: number;
  parryWindow: number;
  parryHighLow: 'high' | 'low' | null;
  parryFreeze: number;
  chargeBackFrames: number;
  chargeDownFrames: number;
  hoverFramesLeft: number; // Gnhoif air hover
  darknessDisabledTimer: number; // Gnhoif Olhar Solar disables darkness for 180f
  miasmaTimer: number; // Boris poison aura active frames
  miasmaRadius: number;
  miasmaCooldown: number;
  poisonStacks: number; // 0 to 3
  poisonTimer: number; // frames remaining (240f = 4s)
  jumpShort: boolean;
  jumpDir: -1 | 0 | 1;
  isRunning: boolean; // Boris 66 hold run
  verletChain: VerletNode[];
  afterimages: Array<{ x: number; y: number; anim: string; frame: number; facing: 1 | -1; alpha: number }>;
  inputBuffer: BufferedEntry[];
  inputHistoryDisplay: string[];
  lastFrameAdvantage: number;
  pushbox: Box;
  hurtbox: Box;
  activeHitbox: Box | null;
  roundsWon: number;
}

export interface ActiveProjectile {
  uid: number;
  ownerIndex: 0 | 1;
  spec: ProjectileSpec;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  frame: number;
  hitsRemaining: number;
  hitCooldown: number;
  reflected: boolean;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'hit_light' | 'hit_heavy' | 'block' | 'parry' | 'poison' | 'light' | 'stage';
}

export interface FloatingCallout {
  text: string;
  x: number;
  y: number;
  color: string;
  timer: number;
}

export interface KeyBindings {
  up: string;
  down: string;
  left: string;
  right: string;
  A: string;
  B: string;
  C: string;
  D: string;
  shortcutAB: string;
  shortcutCD: string;
  taunt: string;
}

export interface GameOptions {
  difficulty: DifficultyLevel;
  roundTime: 60 | 99 | 0; // 0 = infinite
  roundsToWin: 1 | 2 | 3; // 1 (best of 1), 2 (best of 3), 3 (best of 5)
  sfxVolume: number;
  bgmVolume: number;
  announcerEnabled: boolean;
  muted: boolean;
  showHitboxes: boolean;
  p1Keys: KeyBindings;
  p2Keys: KeyBindings;
}

export interface CinematicState {
  active: boolean;
  type: 'super_flash' | 'cassandra_lv3' | 'boris_lv3' | 'gnhoif_lv3' | 'barbara_lv3';
  attackerIndex: 0 | 1;
  frame: number;
  maxFrames: number;
  moveName: string;
}

export interface MatchState {
  mode: GameMode;
  stage: StageId;
  frame: number;
  roundNumber: number;
  timerFrames: number; // 60 frames per second
  phase: 'intro' | 'announce_round' | 'fighting' | 'ko_slowmo' | 'round_over' | 'match_over';
  phaseTimer: number;
  hitstopTimer: number;
  screenShake: number;
  solarFlashTimer: number;
  desaturateTimer: number;
  firstAttackAwarded: boolean;
  announceText: string;
  winnerIndex: 0 | 1 | -1; // -1 = draw
  winReason: 'ko' | 'perfect' | 'time' | 'draw';
  fighters: [Fighter, Fighter];
  projectiles: ActiveProjectile[];
  particles: Particle[];
  callouts: FloatingCallout[];
  cinematic: CinematicState;
  cameraX: number;
  trainingDummy: DummyBehavior;
  arcadeStageIndex: number; // 0, 1, 2, 3 (3 = Sombra boss)
  arcadeOpponents: CharacterId[];
}
