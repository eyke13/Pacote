import React, { useState } from 'react';
import {
  ARCADE_INTRO_SCREENS,
  CHARACTERS,
  getPreFightDialogue,
  STAGES
} from '../game/lore';
import { MOVES } from '../game/moves';
import {
  CharacterId,
  DifficultyLevel,
  DummyBehavior,
  GameMode,
  GameOptions,
  KeyBindings,
  MatchState,
  StageId
} from '../game/types';

const CHAR_ORDER: CharacterId[] = ['cassandra', 'boris', 'gnhoif', 'barbara'];

interface TitleOverlayProps {
  mode: GameMode;
  setMode: (m: GameMode) => void;
  p1Char: CharacterId;
  setP1Char: (c: CharacterId) => void;
  p2Char: CharacterId;
  setP2Char: (c: CharacterId) => void;
  p1Palette: number;
  setP1Palette: (p: number) => void;
  p2Palette: number;
  setP2Palette: (p: number) => void;
  selectedStage: StageId | 'random';
  setSelectedStage: (s: StageId | 'random') => void;
  onStartMatch: () => void;
  onOpenOptions: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  mode,
  setMode,
  p1Char,
  setP1Char,
  p2Char,
  setP2Char,
  p1Palette,
  setP1Palette,
  p2Palette,
  setP2Palette,
  selectedStage,
  setSelectedStage,
  onStartMatch,
  onOpenOptions
}) => {
  const [selectingFor, setSelectingFor] = useState<'p1' | 'p2'>('p1');
  const [showStoryIntro, setShowStoryIntro] = useState(false);

  const p1Meta = CHARACTERS[p1Char];
  const p2Meta = CHARACTERS[p2Char];
  const dialogue = getPreFightDialogue(p1Char, p2Char, false);

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-5 pointer-events-none">
      {/* Top Row: Bespoke Noir-Gothic SVG Emblem + Mode Selector */}
      <div className="flex flex-wrap items-start justify-between gap-4 pointer-events-auto">
        <div className="bg-[#09080d]/92 border border-[#eab308]/50 px-5 py-3 shadow-2xl">
          <svg
            viewBox="0 0 420 74"
            className="w-[310px] sm:w-[390px] h-auto"
            aria-label="LUZ NEGRA: O Último Ato"
          >
            {/* Eclipse Sun & Vésper Lantern Crest */}
            <circle cx="38" cy="37" r="26" fill="#09080d" stroke="#eab308" strokeWidth="2.5" />
            <circle cx="38" cy="37" r="19" fill="#000000" stroke="#fde047" strokeWidth="1" strokeDasharray="3 2" />
            <path d="M38 6 L41 15 L35 15 Z M38 68 L41 59 L35 59 Z M7 37 L16 34 L16 40 Z M69 37 L60 34 L60 40 Z" fill="#eab308" />
            <polygon points="38,22 47,37 38,52 29,37" fill="#fef08a" />
            {/* Main Title Typography */}
            <text
              x="80"
              y="42"
              fill="#f4efe6"
              stroke="#09080d"
              strokeWidth="4"
              paintOrder="stroke fill"
              fontFamily="Georgia, serif"
              fontWeight="bold"
              fontSize="34"
              letterSpacing="3"
            >
              LUZ NEGRA
            </text>
            <text
              x="82"
              y="63"
              fill="#eab308"
              fontFamily="monospace"
              fontWeight="bold"
              fontSize="13"
              letterSpacing="4.5"
            >
              O ÚLTIMO ATO · 1967
            </text>
          </svg>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-[#09080d]/92 border border-[#3f3859] p-1.5">
          {(
            [
              { id: 'arcade', label: 'Modo Arcade' },
              { id: 'versus', label: 'Versus (2P)' },
              { id: 'training', label: 'Modo Treino' }
            ] as Array<{ id: GameMode; label: string }>
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`px-3.5 py-2 text-xs font-bold tracking-wider transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === item.id
                  ? 'bg-[#eab308] text-[#09080d]'
                  : 'text-[#d6cbb9] hover:text-white hover:bg-[#1e1b2e]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowStoryIntro((v) => !v)}
            className="px-3 py-2 text-xs font-bold text-[#fde047] hover:bg-[#1e1b2e] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Premissa 1967
          </button>
          <button
            type="button"
            onClick={onOpenOptions}
            className="px-3 py-2 text-xs font-bold text-[#d6cbb9] hover:text-white hover:bg-[#1e1b2e] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Opções & Teclas
          </button>
        </div>
      </div>

      {/* Optional Premissa 1967 Modal Drawer */}
      {showStoryIntro && (
        <div className="self-center max-w-xl bg-[#09080d]/95 border border-[#eab308] p-4 pointer-events-auto shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-[#fde047]">A NOITE SEM FIM (OUTUBRO DE 1967)</h2>
            <button
              type="button"
              onClick={() => setShowStoryIntro(false)}
              className="text-xs text-[#9ca3af] hover:text-white px-2 py-0.5 cursor-pointer"
            >
              Fechar
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-[#e2dcd3] leading-relaxed">
            {ARCADE_INTRO_SCREENS.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Interactive Deck: 2x2 Character Grid + Fighter Cards + Stage & Start CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end pointer-events-auto">
        {/* P1 Selected Fighter Card */}
        <div className="lg:col-span-3 bg-[#09080d]/92 border border-[#3f3859] p-3">
          <div className="flex items-center justify-between text-xs text-[#eab308] mb-1">
            <span>JOGADOR 1 · {p1Meta.archetype}</span>
            <span>{'★'.repeat(p1Meta.difficultyStars)}</span>
          </div>
          <div className="text-base font-bold text-white truncate">{p1Meta.name}</div>
          <div className="text-[11px] text-[#a8a29e] mb-2 whitespace-nowrap truncate">
            {p1Meta.title} · HP {p1Meta.maxHp} · {p1Meta.heightLabel}
          </div>
          <p className="text-[11px] text-[#d6cbb9] leading-snug line-clamp-2 mb-2">{p1Meta.bio}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setP1Palette(p1Palette === 0 ? 1 : 0)}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#1e1b2e] hover:bg-[#2d2844] text-[#fde047] border border-[#eab308]/40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Paleta P1: {p1Meta.palettes[p1Palette].name}
            </button>
          </div>
        </div>

        {/* Center 2x2 Character Select Grid & Stage Selector */}
        <div className="lg:col-span-6 bg-[#09080d]/94 border border-[#eab308]/60 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectingFor('p1')}
                className={`px-2.5 py-1 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  selectingFor === 'p1' ? 'bg-[#eab308] text-[#09080d]' : 'bg-[#1e1b2e] text-[#d6cbb9]'
                }`}
              >
                Escolher P1 ({p1Meta.shortName})
              </button>
              <button
                type="button"
                onClick={() => setSelectingFor('p2')}
                className={`px-2.5 py-1 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  selectingFor === 'p2' ? 'bg-[#f43f5e] text-white' : 'bg-[#1e1b2e] text-[#d6cbb9]'
                }`}
              >
                Escolher P2 ({p2Meta.shortName})
              </button>
            </div>

            {/* Stage Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="stage-select" className="text-[11px] text-[#a8a29e]">
                Cenário:
              </label>
              <select
                id="stage-select"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value as StageId | 'random')}
                className="bg-[#181624] text-xs text-[#fde047] border border-[#3f3859] px-2 py-1"
              >
                <option value="estudio">1. Estúdio 13 (Hollywood)</option>
                <option value="clareira">2. Clareira das Mil Lanternas</option>
                <option value="sanatorio">3. Sanatório Hollow Pines</option>
                <option value="observatorio">4. Observatório do Eclipse</option>
                <option value="random">Aleatório</option>
              </select>
            </div>
          </div>

          {/* 2x2 Character Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
            {CHAR_ORDER.map((cid) => {
              const c = CHARACTERS[cid];
              const isP1 = p1Char === cid;
              const isP2 = p2Char === cid;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => {
                    if (selectingFor === 'p1') {
                      setP1Char(cid);
                      setSelectingFor('p2');
                    } else {
                      setP2Char(cid);
                      setSelectingFor('p1');
                    }
                  }}
                  className={`p-2 text-left border transition-colors cursor-pointer ${
                    isP1 && isP2
                      ? 'border-[#fde047] bg-[#2a243d]'
                      : isP1
                      ? 'border-[#eab308] bg-[#1f1c2e]'
                      : isP2
                      ? 'border-[#f43f5e] bg-[#241826]'
                      : 'border-[#332e47] bg-[#12101b] hover:border-[#6b6385]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                    <span className="text-[#fde047]">{c.shortName}</span>
                    <span>
                      {isP1 && <span className="text-[#eab308] mr-1">P1</span>}
                      {isP2 && <span className="text-[#fb7185]">P2</span>}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#d6cbb9] truncate">{c.archetype}</div>
                  <div className="text-[10px] text-[#9ca3af]">
                    HP {c.maxHp} · {'★'.repeat(c.difficultyStars)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pre-Fight Specific Dialogue Preview */}
          <div className="bg-[#12101c] border border-[#2d2842] px-2.5 py-1.5 mb-2.5 text-[11px] space-y-0.5">
            <div className="text-[#fde047] truncate">{dialogue.p1Line}</div>
            <div className="text-[#cbd5e1] truncate">{dialogue.p2Line}</div>
          </div>

          {/* Primary Start CTA with data-start="true" */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartMatch();
              }}
              className="w-full py-2.5 px-5 bg-[#eab308] hover:bg-[#facc15] text-[#09080d] font-bold text-sm tracking-widest uppercase transition-colors cursor-pointer whitespace-nowrap"
            >
              APERTE START / LUTAR AGORA (ENTER)
            </button>
          </div>
        </div>

        {/* P2 Selected Fighter Card */}
        <div className="lg:col-span-3 bg-[#09080d]/92 border border-[#3f3859] p-3">
          <div className="flex items-center justify-between text-xs text-[#fb7185] mb-1">
            <span>{mode === 'versus' ? 'JOGADOR 2' : 'OPONENTE'} · {p2Meta.archetype}</span>
            <span>{'★'.repeat(p2Meta.difficultyStars)}</span>
          </div>
          <div className="text-base font-bold text-white truncate">{p2Meta.name}</div>
          <div className="text-[11px] text-[#a8a29e] mb-2 whitespace-nowrap truncate">
            {p2Meta.title} · HP {p2Meta.maxHp} · {p2Meta.heightLabel}
          </div>
          <p className="text-[11px] text-[#d6cbb9] leading-snug line-clamp-2 mb-2">{p2Meta.bio}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setP2Palette(p2Palette === 0 ? 1 : 0)}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#1e1b2e] hover:bg-[#2d2844] text-[#fb7185] border border-[#f43f5e]/40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Paleta P2: {p2Meta.palettes[p2Palette].name}
            </button>
          </div>
        </div>
      </div>

      {/* Single flat borderless inline control hint in bottom safe margin */}
      <div className="text-center text-[11px] text-[#d6cbb9] tracking-wide pt-1 pointer-events-none">
        P1: WASD Mover · U (A) / J (B) / I (C) / K (D) · O Rolamento (A+B) · L Impacto (C+D) · Y Provocação · P2: Setas + Numpad 4/1/5/2/6/3 · F1 Hitboxes · Esc Pausa
      </div>
    </div>
  );
};

interface PauseModalProps {
  match: MatchState;
  options: GameOptions;
  setOptions: React.Dispatch<React.SetStateAction<GameOptions>>;
  initialTab?: 'menu' | 'moves' | 'options';
  onResume: () => void;
  onRestart: () => void;
  onReturnToTitle: () => void;
  onUpdateDummy: (d: DummyBehavior) => void;
  onResetTrainingPositions: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  match,
  options,
  setOptions,
  initialTab = 'menu',
  onResume,
  onRestart,
  onReturnToTitle,
  onUpdateDummy,
  onResetTrainingPositions
}) => {
  const [tab, setTab] = useState<'menu' | 'moves' | 'options'>(initialTab);
  const [movesChar, setMovesChar] = useState<CharacterId>(match.fighters[0].id);
  const [listeningKey, setListeningKey] = useState<{ player: 'p1' | 'p2'; field: keyof KeyBindings } | null>(null);

  React.useEffect(() => {
    if (!listeningKey) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const code = e.code;
      setOptions((prev) => {
        const target = listeningKey.player === 'p1' ? { ...prev.p1Keys } : { ...prev.p2Keys };
        target[listeningKey.field] = code;
        return listeningKey.player === 'p1'
          ? { ...prev, p1Keys: target }
          : { ...prev, p2Keys: target };
      });
      setListeningKey(null);
    };
    window.addEventListener('keydown', handler, { once: true });
    return () => window.removeEventListener('keydown', handler);
  }, [listeningKey, setOptions]);

  const charMoves = MOVES[movesChar].filter(
    (m) => m.category !== 'normal' || m.id === '5C_close' || m.id === '2D' || m.id === 'jD'
  );

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#09080d]/88 p-4 pointer-events-auto">
      <div
        role="dialog"
        aria-label="Menu de Pausa"
        className="w-full max-w-2xl bg-[#110f1a] border-2 border-[#eab308] p-5 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#2e2942] pb-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#fde047] tracking-wider whitespace-nowrap">JOGO PAUSADO</h2>
            <p className="text-xs text-[#a8a29e] whitespace-nowrap truncate">
              {STAGES.find((s) => s.id === match.stage)?.name} · Round {match.roundNumber}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTab('menu')}
              className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'menu' ? 'bg-[#eab308] text-[#09080d]' : 'bg-[#1e1b2e] text-[#d6cbb9]'
              }`}
            >
              Menu
            </button>
            <button
              type="button"
              onClick={() => setTab('moves')}
              className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'moves' ? 'bg-[#eab308] text-[#09080d]' : 'bg-[#1e1b2e] text-[#d6cbb9]'
              }`}
            >
              Lista de Golpes
            </button>
            <button
              type="button"
              onClick={() => setTab('options')}
              className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'options' ? 'bg-[#eab308] text-[#09080d]' : 'bg-[#1e1b2e] text-[#d6cbb9]'
              }`}
            >
              Opções & Controles
            </button>
          </div>
        </div>

        {/* Tab 1: Pause Summary & Training Settings */}
        {tab === 'menu' && (
          <div className="space-y-4 overflow-y-auto">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#181524] border border-[#2e2942] p-2.5">
                <div className="text-[11px] text-[#a8a29e]">{match.fighters[0].name} HP</div>
                <div className="text-base font-bold text-[#fde047] tabular-nums">
                  {match.fighters[0].hp} / {match.fighters[0].maxHp}
                </div>
              </div>
              <div className="bg-[#181524] border border-[#2e2942] p-2.5">
                <div className="text-[11px] text-[#a8a29e]">VANTAGEM P1</div>
                <div className="text-base font-bold text-[#38bdf8] tabular-nums">
                  {match.fighters[0].lastFrameAdvantage >= 0
                    ? `+${match.fighters[0].lastFrameAdvantage}f`
                    : `${match.fighters[0].lastFrameAdvantage}f`}
                </div>
              </div>
              <div className="bg-[#181524] border border-[#2e2942] p-2.5">
                <div className="text-[11px] text-[#a8a29e]">{match.fighters[1].name} HP</div>
                <div className="text-base font-bold text-[#fb7185] tabular-nums">
                  {match.fighters[1].hp} / {match.fighters[1].maxHp}
                </div>
              </div>
            </div>

            {match.mode === 'training' && (
              <div className="bg-[#181524] border border-[#3f3859] p-3 space-y-2">
                <div className="text-xs font-bold text-[#fde047]">CONFIGURAÇÕES DE TREINO</div>
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { id: 'stand', label: 'Boneco: Em Pé' },
                      { id: 'crouch', label: 'Agachado' },
                      { id: 'jump', label: 'Pulando' },
                      { id: 'block_all', label: 'Defende Tudo' },
                      { id: 'block_after_first', label: 'Defende após 1º Hit' },
                      { id: 'cpu', label: 'Controlado pela CPU' }
                    ] as Array<{ id: DummyBehavior; label: string }>
                  ).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onUpdateDummy(b.id)}
                      className={`px-2.5 py-1 text-xs font-bold cursor-pointer ${
                        match.trainingDummy === b.id
                          ? 'bg-[#38bdf8] text-[#09080d]'
                          : 'bg-[#252136] text-[#d6cbb9]'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={onResetTrainingPositions}
                    className="px-2.5 py-1 text-xs font-bold bg-[#eab308] text-[#09080d] cursor-pointer"
                  >
                    Resetar Posição
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                type="button"
                onClick={onResume}
                className="py-2.5 px-4 bg-[#eab308] hover:bg-[#facc15] text-[#09080d] font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Continuar Luta (Esc)
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="py-2.5 px-4 bg-[#252136] hover:bg-[#322c4a] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Reiniciar Round
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="py-2.5 px-4 bg-[#7f1d1d] hover:bg-[#991b1b] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Sair para o Título
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Move List (Lista de Golpes) */}
        {tab === 'moves' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="flex items-center gap-2">
              {CHAR_ORDER.map((cid) => (
                <button
                  key={cid}
                  type="button"
                  onClick={() => setMovesChar(cid)}
                  className={`px-3 py-1 text-xs font-bold cursor-pointer ${
                    movesChar === cid ? 'bg-[#eab308] text-[#09080d]' : 'bg-[#1e1b2e] text-[#d6cbb9]'
                  }`}
                >
                  {CHARACTERS[cid].shortName}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-[#a8a29e]">
              Notação: 2=Baixo · 6=Frente · 4=Trás · 8=Cima · [4]6=Segurar Trás 40f + Frente · EX=Comando + Dois Botões (meia barra)
            </div>
            <div className="divide-y divide-[#282438] border border-[#282438]">
              {charMoves.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-1.5 text-xs bg-[#151320]">
                  <div>
                    <span className="font-bold text-white">{m.name}</span>
                    <span className="ml-2 text-[10px] text-[#9ca3af] uppercase">
                      [{m.category} · Dano {m.damage} · Startup {m.startup}f]
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#fde047]">{m.commandLabel}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Options & Key Remapping */}
        {tab === 'options' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[#a8a29e] mb-1">Dificuldade CPU</label>
                <select
                  value={options.difficulty}
                  onChange={(e) =>
                    setOptions((p) => ({ ...p, difficulty: e.target.value as DifficultyLevel }))
                  }
                  className="w-full bg-[#181524] border border-[#3f3859] px-2 py-1.5 text-white"
                >
                  <option value="facil">Fácil (24f)</option>
                  <option value="normal">Normal (16f)</option>
                  <option value="dificil">Difícil (10f)</option>
                  <option value="pesadelo">Pesadelo (6f)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#a8a29e] mb-1">Tempo de Round</label>
                <select
                  value={options.roundTime}
                  onChange={(e) =>
                    setOptions((p) => ({ ...p, roundTime: Number(e.target.value) as 60 | 99 | 0 }))
                  }
                  className="w-full bg-[#181524] border border-[#3f3859] px-2 py-1.5 text-white"
                >
                  <option value={60}>60 Segundos</option>
                  <option value={99}>99 Segundos</option>
                  <option value={0}>Infinito (∞)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#a8a29e] mb-1">Rounds (Melhor de)</label>
                <select
                  value={options.roundsToWin}
                  onChange={(e) =>
                    setOptions((p) => ({ ...p, roundsToWin: Number(e.target.value) as 1 | 2 | 3 }))
                  }
                  className="w-full bg-[#181524] border border-[#3f3859] px-2 py-1.5 text-white"
                >
                  <option value={1}>1 Round</option>
                  <option value={2}>3 Rounds (Padrão)</option>
                  <option value={3}>5 Rounds</option>
                </select>
              </div>
              <div>
                <label className="block text-[#a8a29e] mb-1">Hitboxes & Locutor</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOptions((p) => ({ ...p, showHitboxes: !p.showHitboxes }))}
                    className={`px-2 py-1.5 font-bold cursor-pointer ${
                      options.showHitboxes ? 'bg-[#22c55e] text-[#09080d]' : 'bg-[#252136] text-white'
                    }`}
                  >
                    Hitboxes (F1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptions((p) => ({ ...p, announcerEnabled: !p.announcerEnabled }))}
                    className={`px-2 py-1.5 font-bold cursor-pointer ${
                      options.announcerEnabled ? 'bg-[#eab308] text-[#09080d]' : 'bg-[#252136] text-white'
                    }`}
                  >
                    Voz
                  </button>
                </div>
              </div>
            </div>

            {/* Volume Sliders */}
            <div className="grid grid-cols-2 gap-4 bg-[#181524] p-3 border border-[#2e2942]">
              <div>
                <label className="block text-[#a8a29e] mb-1">
                  Volume Efeitos (SFX): {Math.round(options.sfxVolume * 100)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={options.sfxVolume}
                  onChange={(e) => setOptions((p) => ({ ...p, sfxVolume: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[#a8a29e] mb-1">
                  Volume Música (BGM): {Math.round(options.bgmVolume * 100)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={options.bgmVolume}
                  onChange={(e) => setOptions((p) => ({ ...p, bgmVolume: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Key Remapping for P1 and P2 */}
            <div className="bg-[#181524] p-3 border border-[#2e2942]">
              <div className="font-bold text-[#fde047] mb-2">
                REMAPEAMENTO DE TECLAS (Clique num botão e pressione a nova tecla)
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(['p1', 'p2'] as const).map((pl) => {
                  const map = pl === 'p1' ? options.p1Keys : options.p2Keys;
                  return (
                    <div key={pl} className="space-y-1">
                      <div className="font-bold text-white uppercase">
                        {pl === 'p1' ? 'Jogador 1' : 'Jogador 2'}
                      </div>
                      {(
                        [
                          ['up', 'Cima (8)'],
                          ['down', 'Baixo (2)'],
                          ['left', 'Esquerda (4)'],
                          ['right', 'Direita (6)'],
                          ['A', 'Soco Fraco (A)'],
                          ['B', 'Chute Fraco (B)'],
                          ['C', 'Soco Forte (C)'],
                          ['D', 'Chute Forte (D)'],
                          ['shortcutAB', 'Rolamento (A+B)'],
                          ['shortcutCD', 'Impacto (C+D)'],
                          ['taunt', 'Provocação']
                        ] as Array<[keyof KeyBindings, string]>
                      ).map(([field, label]) => {
                        const isWaiting =
                          listeningKey?.player === pl && listeningKey?.field === field;
                        return (
                          <div key={field} className="flex items-center justify-between">
                            <span className="text-[#a8a29e]">{label}</span>
                            <button
                              type="button"
                              onClick={() => setListeningKey({ player: pl, field })}
                              className={`px-2 py-0.5 font-mono text-[11px] border cursor-pointer ${
                                isWaiting
                                  ? 'bg-[#eab308] text-[#09080d] border-white'
                                  : 'bg-[#0f0d17] text-[#fde047] border-[#3f3859]'
                              }`}
                            >
                              {isWaiting ? 'Pressione...' : map[field]}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface GameOverModalProps {
  match: MatchState;
  onPlayAgainOrNext: () => void;
  onReturnToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  match,
  onPlayAgainOrNext,
  onReturnToTitle
}) => {
  const [endingStep, setEndingStep] = useState(0);
  const [f1, f2] = match.fighters;
  const p1Won = f1.roundsWon > f2.roundsWon;
  const winner = p1Won ? f1 : f2;
  const winnerMeta = CHARACTERS[winner.id];
  const quote = winnerMeta.winQuotes[match.roundNumber % winnerMeta.winQuotes.length];

  const isArcadeBeatBoss =
    match.mode === 'arcade' && p1Won && match.arcadeStageIndex >= 3;
  const isArcadeHasNextStage =
    match.mode === 'arcade' && p1Won && match.arcadeStageIndex < 3;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#09080d]/90 p-4 pointer-events-auto">
      <div
        role="dialog"
        aria-label="Resultado da Partida"
        className="w-full max-w-xl bg-[#110f1a] border-2 border-[#eab308] p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#2e2942] pb-3">
          <div>
            <div className="text-xs font-bold text-[#eab308] uppercase tracking-widest">
              {isArcadeBeatBoss
                ? 'CRÉDITOS FINAIS · A NOITE SEM FIM TERMINOU'
                : p1Won
                ? 'VITÓRIA NO CONFRONTO'
                : 'FIM DE JOGO · CONTINUE?'}
            </div>
            <h2 className="text-2xl font-bold text-white">{winner.name} VENCEU!</h2>
          </div>
          <div className="text-right font-mono text-xs text-[#a8a29e]">
            PLACAR: {f1.roundsWon} - {f2.roundsWon}
          </div>
        </div>

        {/* Winner Quote */}
        <blockquote className="bg-[#181524] border border-[#3f3859] p-3.5 text-sm italic text-[#fde047]">
          "{quote}"
          {winner.id === 'gnhoif' && (
            <div className="text-[11px] not-italic text-[#9ca3af] mt-1">
              (Sussurro espelhado: "{quote.split('').reverse().join('')}")
            </div>
          )}
        </blockquote>

        {/* Arcade Ending 5-Screen Story Sequence */}
        {isArcadeBeatBoss && (
          <div className="bg-[#0b0912] border border-[#eab308]/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#eab308]">
              <span>EPÍLOGO DE {CHARACTERS[f1.id].shortName}</span>
              <span>
                Tela {endingStep + 1} de {CHARACTERS[f1.id].arcadeEnding.length}
              </span>
            </div>
            <p className="text-xs text-[#f4efe6] leading-relaxed min-h-[56px]">
              {CHARACTERS[f1.id].arcadeEnding[endingStep]}
            </p>
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={endingStep === 0}
                onClick={() => setEndingStep((s) => Math.max(0, s - 1))}
                className="px-3 py-1 text-xs bg-[#1e1b2e] disabled:opacity-40 text-white cursor-pointer"
              >
                ← Anterior
              </button>
              <button
                type="button"
                disabled={endingStep >= CHARACTERS[f1.id].arcadeEnding.length - 1}
                onClick={() =>
                  setEndingStep((s) =>
                    Math.min(CHARACTERS[f1.id].arcadeEnding.length - 1, s + 1)
                  )
                }
                className="px-3 py-1 text-xs bg-[#eab308] disabled:opacity-40 text-[#09080d] font-bold cursor-pointer"
              >
                Próxima Cena →
              </button>
            </div>
          </div>
        )}

        {/* Mastery / Progress Metrics */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-[#181524] border border-[#2e2942] p-2.5">
            <div className="text-[11px] text-[#a8a29e]">HP RESTANTE</div>
            <div className="text-base font-bold text-[#fde047] tabular-nums">
              {winner.hp} / {winner.maxHp}
            </div>
          </div>
          <div className="bg-[#181524] border border-[#2e2942] p-2.5">
            <div className="text-[11px] text-[#a8a29e]">BARRA DE SUPER</div>
            <div className="text-base font-bold text-[#38bdf8] tabular-nums">
              Nv {Math.floor(winner.superMeter / 1000)} ({winner.superMeter})
            </div>
          </div>
          <div className="bg-[#181524] border border-[#2e2942] p-2.5">
            <div className="text-[11px] text-[#a8a29e]">ETAPA ARCADE</div>
            <div className="text-base font-bold text-white tabular-nums">
              {match.mode === 'arcade' ? `${match.arcadeStageIndex + 1} / 4` : match.mode.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onPlayAgainOrNext();
            }}
            className="flex-1 py-3 px-4 bg-[#eab308] hover:bg-[#facc15] text-[#09080d] font-bold text-xs uppercase tracking-widest cursor-pointer"
          >
            {isArcadeHasNextStage
              ? match.arcadeStageIndex === 2
                ? 'ENFRENTAR CHEFE: SOMBRA (ENTER)'
                : 'PRÓXIMO OPONENTE ARCADE (ENTER)'
              : !p1Won && match.mode === 'arcade'
              ? 'CONTINUAR / REVANCHE (ENTER)'
              : 'JOGAR NOVAMENTE (ENTER)'}
          </button>
          <button
            type="button"
            onClick={onReturnToTitle}
            className="py-3 px-4 bg-[#252136] hover:bg-[#322c4a] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Menu Principal
          </button>
        </div>
      </div>
    </div>
  );
};
