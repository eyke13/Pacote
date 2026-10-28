import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameOverModal, PauseModal, TitleOverlay } from './components/Modals';
import { CpuController } from './game/ai';
import { ProceduralAudioEngine } from './game/audio';
import {
  createMatchState,
  resetRound,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  stepMatch
} from './game/engine';
import {
  computeWorldNumpad,
  DEFAULT_P1_KEYS,
  DEFAULT_P2_KEYS,
  P2_ALT_KEYS
} from './game/input';
import { STAGES } from './game/lore';
import { ProceduralSpriteSource } from './game/sprites';
import { renderMatchToCanvas } from './game/stages';
import {
  CharacterId,
  DummyBehavior,
  GameMode,
  GameOptions,
  InputFrame,
  KeyBindings,
  MatchState,
  StageId
} from './game/types';

type AppShellState = 'title' | 'playing' | 'paused' | 'gameover';

const ALL_CHARS: CharacterId[] = ['cassandra', 'boris', 'gnhoif', 'barbara'];

export default function App() {
  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [shellState, setShellState] = useState<AppShellState>(
    isAutostart ? 'playing' : 'title'
  );
  const [pauseInitialTab, setPauseInitialTab] = useState<'menu' | 'moves' | 'options'>('menu');
  const [mode, setMode] = useState<GameMode>('arcade');
  const [p1Char, setP1Char] = useState<CharacterId>('cassandra');
  const [p2Char, setP2Char] = useState<CharacterId>('boris');
  const [p1Palette, setP1Palette] = useState<number>(0);
  const [p2Palette, setP2Palette] = useState<number>(0);
  const [selectedStage, setSelectedStage] = useState<StageId | 'random'>('estudio');

  const [options, setOptions] = useState<GameOptions>({
    difficulty: 'normal',
    roundTime: 99,
    roundsToWin: 2,
    sfxVolume: 0.75,
    bgmVolume: 0.4,
    announcerEnabled: true,
    muted: false,
    showHitboxes: false,
    p1Keys: DEFAULT_P1_KEYS,
    p2Keys: DEFAULT_P2_KEYS
  });

  // Integer scale calculation for 384x224 CPS-3 canvas
  const [canvasScale, setCanvasScale] = useState<number>(3);
  const [, setHudTick] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spriteSourceRef = useRef<ProceduralSpriteSource>(new ProceduralSpriteSource());
  const audioRef = useRef<ProceduralAudioEngine>(new ProceduralAudioEngine());
  const cpuRef = useRef<CpuController>(new CpuController());
  const keysHeldRef = useRef<Set<string>>(new Set());
  const prevP1BtnsRef = useRef({ A: false, B: false, C: false, D: false, AB: false, CD: false, taunt: false });
  const prevP2BtnsRef = useRef({ A: false, B: false, C: false, D: false, AB: false, CD: false, taunt: false });

  const matchRef = useRef<MatchState>(
    createMatchState(
      'arcade',
      'cassandra',
      'boris',
      0,
      0,
      'estudio',
      options,
      true,
      false,
      0,
      ['boris', 'gnhoif', 'barbara', 'cassandra']
    )
  );

  const shellStateRef = useRef<AppShellState>(shellState);
  shellStateRef.current = shellState;

  const optionsRef = useRef<GameOptions>(options);
  optionsRef.current = options;

  // Sync document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  // Sync audio settings
  useEffect(() => {
    const audio = audioRef.current;
    audio.sfxVolume = options.sfxVolume;
    audio.bgmVolume = options.bgmVolume;
    audio.muted = options.muted;
    audio.announcerEnabled = options.announcerEnabled;
  }, [options]);

  // Integer scaling listener for 384x224 letterbox
  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const intScale = Math.max(1, Math.floor(Math.min(vw / SCREEN_WIDTH, vh / SCREEN_HEIGHT)));
      setCanvasScale(intScale);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const buildArcadeLadder = (chosenP1: CharacterId): CharacterId[] => {
    const others = ALL_CHARS.filter((c) => c !== chosenP1);
    return [...others, chosenP1]; // 3 regular opponents + 4th is Sombra copy of chosenP1
  };

  const resolveStageId = useCallback(
    (choice: StageId | 'random', arcadeIdx = 0): StageId => {
      if (mode === 'arcade' && arcadeIdx === 3) return 'observatorio';
      if (choice === 'random') {
        const list = STAGES.map((s) => s.id);
        return list[Math.floor(Math.random() * list.length)];
      }
      return choice;
    },
    [mode]
  );

  const startNewMatch = useCallback(
    (overrideArcadeIdx = 0, existingLadder?: CharacterId[]) => {
      audioRef.current.unlock();
      cpuRef.current.reset();
      keysHeldRef.current.clear();

      const ladder = existingLadder ?? buildArcadeLadder(p1Char);
      const isShadow = mode === 'arcade' && overrideArcadeIdx === 3;
      const opponentChar =
        mode === 'arcade' ? ladder[overrideArcadeIdx] ?? p2Char : p2Char;
      const stageId = resolveStageId(selectedStage, overrideArcadeIdx);

      const newMatch = createMatchState(
        mode,
        p1Char,
        opponentChar,
        p1Palette,
        p2Palette,
        stageId,
        optionsRef.current,
        mode !== 'versus',
        isShadow,
        overrideArcadeIdx,
        ladder
      );

      // If autostart or immediate start, skip intro wait so player can act right away
      newMatch.phase = 'fighting';
      newMatch.fighters[0].state = 'idle';
      newMatch.fighters[1].state = 'idle';
      newMatch.announceText = '';

      matchRef.current = newMatch;
      document.body.dataset.state = 'playing';
      setShellState('playing');
      audioRef.current.startStageMusic(stageId);
      canvasRef.current?.focus();
    },
    [mode, p1Char, p2Char, p1Palette, p2Palette, selectedStage, resolveStageId]
  );

  // Read player InputFrame from held keys + optional Gamepad
  const readPlayerInput = (
    playerIdx: 0 | 1,
    bindings: KeyBindings,
    altBindings?: KeyBindings
  ): InputFrame => {
    const held = keysHeldRef.current;
    const prev = playerIdx === 0 ? prevP1BtnsRef.current : prevP2BtnsRef.current;

    const checkKey = (field: keyof KeyBindings): boolean => {
      if (held.has(bindings[field])) return true;
      if (altBindings && held.has(altBindings[field])) return true;
      return false;
    };

    let up = checkKey('up');
    let down = checkKey('down');
    let left = checkKey('left');
    let right = checkKey('right');
    let A = checkKey('A');
    let B = checkKey('B');
    let C = checkKey('C');
    let D = checkKey('D');
    let shortcutAB = checkKey('shortcutAB');
    let shortcutCD = checkKey('shortcutCD');
    let taunt = checkKey('taunt');

    // Poll Gamepad API if connected
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const pads = navigator.getGamepads();
      const pad = pads[playerIdx];
      if (pad) {
        if (pad.axes[1] < -0.45 || pad.buttons[12]?.pressed) up = true;
        if (pad.axes[1] > 0.45 || pad.buttons[13]?.pressed) down = true;
        if (pad.axes[0] < -0.45 || pad.buttons[14]?.pressed) left = true;
        if (pad.axes[0] > 0.45 || pad.buttons[15]?.pressed) right = true;
        if (pad.buttons[2]?.pressed) A = true;
        if (pad.buttons[0]?.pressed) B = true;
        if (pad.buttons[3]?.pressed) C = true;
        if (pad.buttons[1]?.pressed) D = true;
        if (pad.buttons[4]?.pressed) shortcutAB = true;
        if (pad.buttons[5]?.pressed) shortcutCD = true;
        if (pad.buttons[8]?.pressed) taunt = true;
      }
    }

    // Shortcuts send A+B or C+D on the same frame
    if (shortcutAB) {
      A = true;
      B = true;
    }
    if (shortcutCD) {
      C = true;
      D = true;
    }

    const dir = computeWorldNumpad(up, down, left, right);
    const frame: InputFrame = {
      dir,
      rawUp: up,
      rawDown: down,
      rawLeft: left,
      rawRight: right,
      A,
      B,
      C,
      D,
      taunt,
      shortcutAB,
      shortcutCD,
      justA: A && !prev.A,
      justB: B && !prev.B,
      justC: C && !prev.C,
      justD: D && !prev.D,
      justTaunt: taunt && !prev.taunt,
      justShortcutAB: shortcutAB && !prev.AB,
      justShortcutCD: shortcutCD && !prev.CD
    };

    prev.A = A;
    prev.B = B;
    prev.C = C;
    prev.D = D;
    prev.AB = shortcutAB;
    prev.CD = shortcutCD;
    prev.taunt = taunt;

    return frame;
  };

  // Global keyboard listeners & focus-loss key release
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      audioRef.current.unlock();

      // F1 toggles Hitboxes debug overlay
      if (e.code === 'F1') {
        e.preventDefault();
        setOptions((prev) => ({ ...prev, showHitboxes: !prev.showHitboxes }));
        return;
      }

      // M toggles Mute
      if (e.code === 'KeyM' && shellStateRef.current !== 'paused') {
        setOptions((prev) => ({ ...prev, muted: !prev.muted }));
        return;
      }

      // Escape toggles Pause when in playing/paused
      if (e.code === 'Escape') {
        e.preventDefault();
        if (shellStateRef.current === 'playing') {
          setPauseInitialTab('menu');
          setShellState('paused');
        } else if (shellStateRef.current === 'paused') {
          setShellState('playing');
        }
        return;
      }

      // Enter or Space on Title or GameOver triggers Start
      if (
        (e.code === 'Enter' || e.code === 'Space') &&
        (shellStateRef.current === 'title' || shellStateRef.current === 'gameover')
      ) {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'SELECT' && activeTag !== 'INPUT') {
          e.preventDefault();
          const startBtn = document.querySelector<HTMLButtonElement>('[data-start="true"]');
          if (startBtn) {
            startBtn.click();
            return;
          }
        }
      }

      keysHeldRef.current.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
    };

    const clearHeld = () => {
      keysHeldRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
    };
  }, []);

  // Fixed 60 FPS deterministic timestep loop with accumulator
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const FIXED_STEP = 1 / 60;
    const cpuTitleP1 = new CpuController();
    const cpuTitleP2 = new CpuController();

    const tick = (now: number) => {
      const rawDt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      accumulator += rawDt;

      const match = matchRef.current;
      const curShell = shellStateRef.current;
      const opts = optionsRef.current;

      // Update Barbara's HP ratio for Sanatório detuning music box
      const barbaraFighter = match.fighters.find((f) => f.id === 'barbara');
      audioRef.current.barbaraHpRatio = barbaraFighter
        ? barbaraFighter.hp / barbaraFighter.maxHp
        : 1.0;

      const audioCallbacks = {
        onHit: (heavy: boolean, isSpec: boolean) => audioRef.current.playHit(heavy, isSpec),
        onBlock: () => audioRef.current.playBlock(),
        onParry: () => audioRef.current.playParry(),
        onThrow: () => audioRef.current.playHit(true, false),
        onSpecial: (cid: CharacterId, mid: string) => audioRef.current.playSpecial(cid, mid),
        onSuperFlash: () => audioRef.current.playSuperFlash(),
        onKo: () => audioRef.current.playKo(),
        onAnnounce: (txt: string) => audioRef.current.announce(txt)
      };

      while (accumulator >= FIXED_STEP) {
        accumulator -= FIXED_STEP;

        if (curShell === 'title') {
          // Live World Attract Mode in background on Title Screen (keeps players invulnerable)
          match.phase = 'fighting';
          match.fighters[0].hp = match.fighters[0].maxHp;
          match.fighters[1].hp = match.fighters[1].maxHp;
          const ai1 = cpuTitleP1.getInput(match, match.fighters[0], match.fighters[1], 'normal');
          const ai2 = cpuTitleP2.getInput(match, match.fighters[1], match.fighters[0], 'normal');
          stepMatch(match, ai1, ai2, opts);
        } else if (curShell === 'playing') {
          const p1Input = readPlayerInput(0, opts.p1Keys);
          const useCpuP2 =
            match.fighters[1].isCpu ||
            (match.mode === 'training' && match.trainingDummy === 'cpu');
          const p2Input = useCpuP2
            ? cpuRef.current.getInput(match, match.fighters[1], match.fighters[0], opts.difficulty)
            : readPlayerInput(1, opts.p2Keys, P2_ALT_KEYS);

          stepMatch(match, p1Input, p2Input, opts, audioCallbacks);

          if (match.phase === 'match_over') {
            document.body.dataset.state = 'gameover';
            setShellState('gameover');
          }
          if (match.mode === 'training' && match.frame % 6 === 0) {
            setHudTick((t) => (t + 1) % 1000);
          }
        }
      }

      // Render 384x224 native pixel-art canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (match.desaturateTimer > 0) {
            ctx.filter = 'grayscale(90%) contrast(120%)';
          } else {
            ctx.filter = 'none';
          }
          renderMatchToCanvas(
            ctx,
            match,
            spriteSourceRef.current,
            opts.showHitboxes,
            opts.roundsToWin,
            curShell !== 'title'
          );
          ctx.filter = 'none';
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      audioRef.current.stopMusic();
    };
  }, []);

  // Update background attract match when user clicks different characters/stage on Title screen
  useEffect(() => {
    if (shellState === 'title') {
      const stg = selectedStage === 'random' ? 'estudio' : selectedStage;
      const attract = createMatchState(
        mode,
        p1Char,
        p2Char,
        p1Palette,
        p2Palette,
        stg,
        optionsRef.current,
        true
      );
      attract.phase = 'fighting';
      attract.fighters[0].state = 'idle';
      attract.fighters[1].state = 'idle';
      attract.announceText = '';
      matchRef.current = attract;
    }
  }, [shellState, p1Char, p2Char, p1Palette, p2Palette, selectedStage, mode]);

  const handlePlayAgainOrNext = () => {
    const m = matchRef.current;
    const p1Won = m.fighters[0].roundsWon > m.fighters[1].roundsWon;
    if (m.mode === 'arcade' && p1Won && m.arcadeStageIndex < 3) {
      startNewMatch(m.arcadeStageIndex + 1, m.arcadeOpponents);
    } else if (m.mode === 'arcade' && !p1Won) {
      // Continue on current arcade stage
      startNewMatch(m.arcadeStageIndex, m.arcadeOpponents);
    } else {
      startNewMatch(0);
    }
  };

  const handleResetTraining = () => {
    const m = matchRef.current;
    resetRound(m, optionsRef.current);
    m.fighters[0].superMeter = 3000;
    m.fighters[1].superMeter = 3000;
    setHudTick((t) => t + 1);
  };

  const curMatch = matchRef.current;

  return (
    <main className="relative w-screen h-screen bg-[#09080d] flex items-center justify-center overflow-hidden">
      {/* Native 384x224 CPS-3 Pixel Art Canvas with Integer Scaling & Letterbox */}
      <div
        className="relative flex items-center justify-center shadow-2xl border border-[#242033]"
        style={{
          width: `${SCREEN_WIDTH * canvasScale}px`,
          height: `${SCREEN_HEIGHT * canvasScale}px`
        }}
      >
        <canvas
          ref={canvasRef}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          tabIndex={0}
          data-testid="game-canvas"
          aria-label="Tela de Luta LUZ NEGRA 384x224"
          className="w-full h-full pixel-canvas outline-none"
        />
      </div>

      {/* Top-Right Compact Utility Controls during Playing state */}
      {shellState === 'playing' && (
        <div className="fixed top-3 right-3 z-20 flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Alternar Hitboxes (F1)"
            title="Hitboxes Debug [F1]"
            onClick={(e) => {
              e.currentTarget.blur();
              setOptions((p) => ({ ...p, showHitboxes: !p.showHitboxes }));
            }}
            className={`w-9 h-9 flex items-center justify-center border text-xs font-bold cursor-pointer ${
              options.showHitboxes
                ? 'bg-[#22c55e] text-[#09080d] border-white'
                : 'bg-[#12101c]/90 text-[#fde047] border-[#3f3859] hover:border-[#eab308]'
            }`}
          >
            F1
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Alternar Áudio Mudo (M)"
            title="Mudo [M]"
            onClick={(e) => {
              e.currentTarget.blur();
              setOptions((p) => ({ ...p, muted: !p.muted }));
            }}
            className="w-9 h-9 flex items-center justify-center bg-[#12101c]/90 border border-[#3f3859] hover:border-[#eab308] text-[#fde047] cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              {options.muted ? (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              ) : (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              )}
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pausar Jogo (Esc)"
            title="Pausa & Lista de Golpes [Esc]"
            onClick={(e) => {
              e.currentTarget.blur();
              setPauseInitialTab('menu');
              setShellState('paused');
            }}
            className="w-9 h-9 flex items-center justify-center bg-[#12101c]/90 border border-[#3f3859] hover:border-[#eab308] text-[#fde047] cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>
        </div>
      )}

      {/* Training Mode Perimeter Telemetry Bar (Frame Advantage, Input History, Dummy Controls) */}
      {shellState === 'playing' && curMatch.mode === 'training' && (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-3 bg-[#09080d]/92 border border-[#3f3859] px-3.5 py-1.5 text-[11px] pointer-events-auto">
          <div className="font-mono text-[#38bdf8] tabular-nums">
            Vantagem:{' '}
            <strong>
              {curMatch.fighters[0].lastFrameAdvantage >= 0
                ? `+${curMatch.fighters[0].lastFrameAdvantage}f`
                : `${curMatch.fighters[0].lastFrameAdvantage}f`}
            </strong>
          </div>
          <span aria-hidden="true" className="text-[#475569]">·</span>
          <div className="font-mono text-[#fde047] max-w-[240px] truncate">
            Inputs: {curMatch.fighters[0].inputHistoryDisplay.slice(0, 6).join(' ') || '•'}
          </div>
          <span aria-hidden="true" className="text-[#475569]">·</span>
          <select
            aria-label="Comportamento do Boneco de Treino"
            value={curMatch.trainingDummy}
            onChange={(e) => {
              curMatch.trainingDummy = e.target.value as DummyBehavior;
              e.currentTarget.blur();
              setHudTick((t) => t + 1);
            }}
            className="bg-[#181524] text-white border border-[#3f3859] px-2 py-0.5 text-[11px]"
          >
            <option value="stand">Boneco: Em Pé</option>
            <option value="crouch">Boneco: Agachado</option>
            <option value="jump">Boneco: Pulando</option>
            <option value="block_all">Boneco: Defende Tudo</option>
            <option value="block_after_first">Boneco: Defende após 1º Hit</option>
            <option value="cpu">Boneco: CPU</option>
          </select>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              handleResetTraining();
            }}
            className="px-2 py-0.5 bg-[#eab308] text-[#09080d] font-bold cursor-pointer"
          >
            Resetar Posição
          </button>
        </div>
      )}

      {/* Title Screen Overlay */}
      {shellState === 'title' && (
        <TitleOverlay
          mode={mode}
          setMode={setMode}
          p1Char={p1Char}
          setP1Char={setP1Char}
          p2Char={p2Char}
          setP2Char={setP2Char}
          p1Palette={p1Palette}
          setP1Palette={setP1Palette}
          p2Palette={p2Palette}
          setP2Palette={setP2Palette}
          selectedStage={selectedStage}
          setSelectedStage={setSelectedStage}
          onStartMatch={() => startNewMatch(0)}
          onOpenOptions={() => {
            setPauseInitialTab('options');
            setShellState('paused');
          }}
        />
      )}

      {/* Pause Modal */}
      {shellState === 'paused' && (
        <PauseModal
          match={curMatch}
          options={options}
          setOptions={setOptions}
          initialTab={pauseInitialTab}
          onResume={() => setShellState('playing')}
          onRestart={() => {
            resetRound(curMatch, options);
            curMatch.phase = 'fighting';
            curMatch.fighters[0].state = 'idle';
            curMatch.fighters[1].state = 'idle';
            curMatch.announceText = '';
            setShellState('playing');
          }}
          onReturnToTitle={() => {
            audioRef.current.stopMusic();
            setShellState('title');
          }}
          onUpdateDummy={(d) => {
            curMatch.trainingDummy = d;
            setHudTick((t) => t + 1);
          }}
          onResetTrainingPositions={handleResetTraining}
        />
      )}

      {/* Victory / Continue / Arcade Ending Modal */}
      {shellState === 'gameover' && (
        <GameOverModal
          match={curMatch}
          onPlayAgainOrNext={handlePlayAgainOrNext}
          onReturnToTitle={() => {
            audioRef.current.stopMusic();
            setShellState('title');
          }}
        />
      )}
    </main>
  );
}
