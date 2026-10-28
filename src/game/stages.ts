import {
  FLOOR_Y,
  getWorldBox,
  isFighterInvulnerable,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  STAGE_WIDTH
} from './engine';
import { BARBARA_LULLABY_LINES, CHARACTERS } from './lore';
import {
  drawCharacterPortrait,
  drawProjectileOrSummon,
  drawVerletSecondary
} from './sprites';
import { Fighter, MatchState, SpriteSource } from './types';

// 3x5 Pixel Bitmap Font for crisp CPS-3 numbers & uppercase headers
const PIXEL_DIGITS: Record<string, number[]> = {
  '0': [0b111, 0b101, 0b101, 0b101, 0b111],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b111, 0b100, 0b111],
  '3': [0b111, 0b001, 0b111, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b111, 0b001, 0b111],
  '6': [0b111, 0b100, 0b111, 0b101, 0b111],
  '7': [0b111, 0b001, 0b001, 0b010, 0b010],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111],
  '9': [0b111, 0b101, 0b111, 0b001, 0b111],
  '∞': [0b000, 0b111, 0b101, 0b111, 0b000]
};

export function drawPixelNumber(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale = 2,
  color = '#fde047',
  shadow = '#09080d'
): void {
  let curX = Math.round(x);
  for (const ch of text) {
    const rows = PIXEL_DIGITS[ch] ?? PIXEL_DIGITS['0'];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        if ((rows[r] >> (2 - c)) & 1) {
          ctx.fillStyle = shadow;
          ctx.fillRect(curX + c * scale + 1, Math.round(y) + r * scale + 1, scale, scale);
          ctx.fillStyle = color;
          ctx.fillRect(curX + c * scale, Math.round(y) + r * scale, scale, scale);
        }
      }
    }
    curX += 4 * scale;
  }
}

export function drawStageBackground(
  ctx: CanvasRenderingContext2D,
  match: MatchState,
  optionsRoundsToWin: number
): void {
  const camX = match.cameraX;
  const f = match.frame;
  const isFinalRound =
    match.fighters[0].roundsWon === optionsRoundsToWin - 1 &&
    match.fighters[1].roundsWon === optionsRoundsToWin - 1;
  const crewReact = match.hitstopTimer > 0 || match.screenShake > 1;
  const totalKnockdowns =
    (match.fighters[0].state === 'knockdown' ? 1 : 0) +
    (match.fighters[1].state === 'knockdown' ? 1 : 0) +
    match.roundNumber;

  switch (match.stage) {
    case 'estudio': {
      // Estúdio 13, Meridian Pictures (Hollywood)
      ctx.fillStyle = isFinalRound ? '#1a080c' : '#0d0c16';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      // Layer 1 (Far parallax 0.25x): Soundstage rafters & giant painted moon panel
      const p1 = -Math.round(camX * 0.25);
      ctx.fillStyle = '#141221';
      ctx.fillRect(p1 + 110, 16, 180, 122); // Giant painted backdrop panel
      ctx.strokeStyle = '#2d283e';
      ctx.lineWidth = 1;
      ctx.strokeRect(p1 + 110, 16, 180, 122);

      // Painted Noir Moon (layered pixel circle + crescent shadow)
      const mx = p1 + 200;
      const my = 52;
      ctx.fillStyle = isFinalRound ? '#dc2626' : '#fde047';
      ctx.fillRect(mx - 16, my - 20, 32, 40);
      ctx.fillRect(mx - 20, my - 16, 40, 32);
      ctx.fillStyle = isFinalRound ? '#991b1b' : '#eab308';
      ctx.fillRect(mx - 12, my - 14, 10, 28);
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(mx + 2, my - 12, 10, 20);

      // Soundstage ceiling girders & hanging cables
      ctx.fillStyle = '#09080f';
      for (let gx = 0; gx < 500; gx += 48) {
        ctx.fillRect(p1 + gx, 0, 6, 24);
      }

      // Layer 2 (Mid parallax 0.55x): Plywood noir street facades & crane cameras
      const p2 = -Math.round(camX * 0.55);
      for (let bx = 20; bx < 620; bx += 96) {
        ctx.fillStyle = '#221f30';
        ctx.fillRect(p2 + bx, 64, 72, 132);
        // Plywood struts behind facade
        ctx.fillStyle = '#3b2f26';
        ctx.fillRect(p2 + bx + 72, 84, 14, 112);
        // Noir windows
        ctx.fillStyle = isFinalRound ? '#dc2626' : '#f59e0b';
        ctx.fillRect(p2 + bx + 12, 82, 16, 22);
        ctx.fillRect(p2 + bx + 40, 82, 16, 22);
      }

      // Sweeping studio spotlights (or emergency red lights on final round)
      const sweep1 = Math.round(Math.sin(f * 0.03) * 70);
      const sweep2 = Math.round(Math.cos(f * 0.025) * 70);
      ctx.fillStyle = isFinalRound ? 'rgba(239, 68, 68, 0.16)' : 'rgba(254, 240, 138, 0.13)';
      ctx.fillRect(100 + sweep1, 0, 54, FLOOR_Y);
      if (!isFinalRound) {
        ctx.fillRect(230 + sweep2, 0, 54, FLOOR_Y);
      } else if (f % 30 < 15) {
        // Emergency red beacon flash
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(40, 14, 8, 8);
        ctx.fillRect(336, 14, 8, 8);
      }

      // Layer 3 (Floor 1.0x): Soundstage asphalt with cable tracks & camera crane + crew silhouettes
      const p3 = -Math.round(camX);
      ctx.fillStyle = '#171521';
      ctx.fillRect(0, FLOOR_Y, SCREEN_WIDTH, SCREEN_HEIGHT - FLOOR_Y);
      ctx.fillStyle = '#2a263b';
      ctx.fillRect(0, FLOOR_Y, SCREEN_WIDTH, 3);

      // Crew silhouettes in foreground/midground reacting to hits
      const bounce = crewReact ? -4 : Math.round(Math.sin(f * 0.1) * 1);
      ctx.fillStyle = '#07060b';
      for (const cx of [140, 210, 560, 620]) {
        ctx.fillRect(p3 + cx, FLOOR_Y - 34 + bounce, 14, 34);
        ctx.fillRect(p3 + cx + 3, FLOOR_Y - 42 + bounce, 8, 8);
      }

      // Clapperboard animation between rounds
      if (match.phase === 'announce_round') {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(160, 118, 64, 42);
        ctx.fillStyle = '#f4efe6';
        ctx.fillRect(160, 112, 64, 6);
      }
      break;
    }

    case 'clareira': {
      // Clareira das Mil Lanternas (Cárpatos)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      // Layer 1 (0.2x): Carpathian mountain ridges
      const p1 = -Math.round(camX * 0.2);
      ctx.fillStyle = '#111827';
      for (let mx = 0; mx < 520; mx += 80) {
        ctx.fillRect(p1 + mx, 58 + (mx % 24), 84, 140);
      }

      // Layer 2 (0.5x): Pine forest & swaying copper lanterns
      const p2 = -Math.round(camX * 0.5);
      for (let tx = 10; tx < 640; tx += 46) {
        ctx.fillStyle = '#062c1e';
        ctx.fillRect(p2 + tx, 34, 24, 162);
        // Swaying copper lantern
        const sway = Math.round(Math.sin(f * 0.06 + tx) * 3);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(p2 + tx + 10 + sway, 72 + (tx % 20), 6, 8);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(p2 + tx + 11 + sway, 74 + (tx % 20), 4, 4);
      }

      // Layer 3 (0.85x): Hand-painted Red & Gold Romani Vardos (wagons) + Central Bonfire + Clapping family silhouettes
      const p3 = -Math.round(camX * 0.85);
      for (const vx of [90, 520]) {
        // Vardo wagon body
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(p3 + vx, 108, 92, 68);
        ctx.fillStyle = '#facc15'; // Gold trim
        ctx.fillRect(p3 + vx + 4, 112, 84, 4);
        ctx.fillRect(p3 + vx + 28, 124, 36, 26);
        // Wooden spoked wheels
        ctx.fillStyle = '#78350f';
        ctx.fillRect(p3 + vx + 8, 168, 22, 22);
        ctx.fillRect(p3 + vx + 62, 168, 22, 22);
      }

      // Clapping family silhouettes on the rhythm
      const clap = Math.floor(f / 15) % 2;
      ctx.fillStyle = '#09070b';
      for (const fx of [215, 245, 465, 495]) {
        ctx.fillRect(p3 + fx, 146, 12, 48);
        ctx.fillRect(p3 + fx + 2, 138, 8, 8);
        ctx.fillRect(p3 + fx + (clap ? 10 : 6), 154, 6, 4);
      }

      // Central bonfire + rising sparks
      const fireX = -Math.round(camX) + 384;
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(fireX - 18, FLOOR_Y - 22, 36, 22);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(fireX - 10, FLOOR_Y - 32 + (f % 5), 20, 24);
      for (let s = 0; s < 8; s++) {
        const sy = (FLOOR_Y - 20 - ((f * 2 + s * 19) % 120));
        const sx = fireX + Math.round(Math.sin(f * 0.08 + s) * 24);
        ctx.fillStyle = s % 2 === 0 ? '#fde047' : '#fb923c';
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Forest clearing floor
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, FLOOR_Y, SCREEN_WIDTH, SCREEN_HEIGHT - FLOOR_Y);
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, FLOOR_Y, SCREEN_WIDTH, 3);
      break;
    }

    case 'sanatorio': {
      // Sanatório Hollow Pines, Ala Leste
      const isLightning = f % 180 === 0 || f % 180 === 2;
      ctx.fillStyle = isLightning ? '#cbd5e1' : '#0f172a';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      const p2 = -Math.round(camX * 0.6);
      // Cracked tiled walls & high barred windows
      ctx.fillStyle = isLightning ? '#334155' : '#1e293b';
      ctx.fillRect(0, 24, SCREEN_WIDTH, FLOOR_Y - 24);

      for (let wx = 60; wx < 660; wx += 140) {
        ctx.fillStyle = isLightning ? '#f8fafc' : '#090d16';
        ctx.fillRect(p2 + wx, 34, 52, 64);
        // Lightning reveals Visitor silhouettes in the high windows for a single frame!
        if (isLightning) {
          ctx.fillStyle = '#09080d';
          ctx.fillRect(p2 + wx + 16, 44, 20, 50); // Giant rabbit ears silhouette
          ctx.fillRect(p2 + wx + 18, 34, 6, 14);
          ctx.fillRect(p2 + wx + 28, 34, 6, 14);
        }
      }

      // Chalk drawings on the walls that change pose on each knockdown!
      const poseVariant = totalKnockdowns % 3;
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(p2 + 270, 120, 24, 4);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(p2 + 278, 108, 8, 28 + poseVariant * 6);
      ctx.fillRect(p2 + 270 - poseVariant * 4, 114, 24, 4);

      // Flickering fluorescent ceiling tubes
      if (f % 23 !== 0) {
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(80, 18, 68, 4);
        ctx.fillRect(240, 18, 68, 4);
      }

      // Overturned wheelchair & gurney silhouettes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(p2 + 130, FLOOR_Y - 28, 46, 28);
      ctx.fillRect(p2 + 490, FLOOR_Y - 32, 32, 32);

      // Tiled ward floor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, FLOOR_Y, SCREEN_WIDTH, SCREEN_HEIGHT - FLOOR_Y);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, FLOOR_Y, SCREEN_WIDTH, 3);
      break;
    }

    case 'observatorio': {
      // Observatório do Eclipse (Palco Final)
      const pulse = (Math.sin(f * 0.06) + 1) * 0.5;
      ctx.fillStyle = '#070510';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      // Black sun crowned with light in the sky
      const sunX = 192 - Math.round((camX - 192) * 0.15);
      const sunY = 58;
      ctx.fillStyle = '#fde047';
      ctx.fillRect(sunX - 28 - Math.round(pulse * 4), sunY - 28 - Math.round(pulse * 4), 56 + Math.round(pulse * 8), 56 + Math.round(pulse * 8));
      ctx.fillStyle = '#000000';
      ctx.fillRect(sunX - 22, sunY - 22, 44, 44);

      // Lanterna de Vésper pulsing inside its copper cage at center stage
      const cageX = -Math.round(camX * 0.65) + 312;
      ctx.fillStyle = '#b45309';
      ctx.fillRect(cageX - 18, 96, 36, 56);
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(cageX - 10, 108, 20, 32);

      // Floating debris rising upward
      ctx.fillStyle = '#312e81';
      for (let d = 0; d < 10; d++) {
        const dx = ((d * 79) - Math.round(camX * 0.4) + STAGE_WIDTH) % SCREEN_WIDTH;
        const dy = FLOOR_Y - ((f + d * 23) % 160);
        ctx.fillRect(dx, dy, 6 + (d % 4), 5 + (d % 3));
      }

      // Ruined observatory stone floor
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, FLOOR_Y, SCREEN_WIDTH, SCREEN_HEIGHT - FLOOR_Y);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, FLOOR_Y, SCREEN_WIDTH, 2);
      break;
    }
  }
}

export function renderMatchToCanvas(
  ctx: CanvasRenderingContext2D,
  match: MatchState,
  spriteSource: SpriteSource,
  showHitboxes: boolean,
  roundsToWin: number,
  showHud = true
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.save();

  // Screenshake offset
  if (match.screenShake > 0) {
    const sx = Math.round((Math.random() - 0.5) * match.screenShake * 2);
    const sy = Math.round((Math.random() - 0.5) * match.screenShake * 2);
    ctx.translate(sx, sy);
  }

  // 1. Stage background
  drawStageBackground(ctx, match, roundsToWin);

  // 2. Dynamic Lighting: Gnhoif 60px darkness aura (unless disabled for 3s after Olhar Solar)
  for (const f of match.fighters) {
    if (f.id === 'gnhoif' && f.darknessDisabledTimer === 0 && !f.isShadowBoss) {
      const gx = Math.round(f.x - match.cameraX);
      const gy = Math.round(FLOOR_Y + f.y - 54);
      const grad = ctx.createRadialGradient(gx, gy, 8, gx, gy, 62);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(0.7, 'rgba(5, 4, 12, 0.55)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(gx - 64, gy - 64, 128, 128);
    }
  }

  // Olhar Solar C full-stage flash
  if (match.solarFlashTimer > 0) {
    ctx.fillStyle = `rgba(254, 249, 195, ${Math.min(0.65, match.solarFlashTimer / 35)})`;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  // 3. Fighter Elliptical Ground Shadows & Boris Miasma Aura
  for (const f of match.fighters) {
    const sx = Math.round(f.x - match.cameraX);
    // Gnhoif always has an abnormally large shadow!
    const shadowRx = f.id === 'gnhoif' ? 30 : 18;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(sx - shadowRx, FLOOR_Y - 3, shadowRx * 2, 6);

    // Boris Miasma green spiral aura with translucent serpents
    if (f.id === 'boris' && f.miasmaTimer > 0) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.65)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        sx - f.miasmaRadius * 0.6,
        FLOOR_Y + f.y - 78,
        f.miasmaRadius * 1.2,
        74
      );
      const serpX = sx + Math.round(Math.cos(match.frame * 0.2) * (f.miasmaRadius * 0.5));
      const serpY = FLOOR_Y + f.y - 40 + Math.round(Math.sin(match.frame * 0.25) * 20);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(serpX - 4, serpY - 2, 8, 4);
    }
  }

  // 4. Fighters (Afterimages -> Verlet Secondary -> Main Sprite)
  for (const f of match.fighters) {
    const animName = f.state === 'attack' && f.currentMove ? f.currentMove.poseAnim : f.state;

    // Afterimages on supers/EX
    for (const ai of f.afterimages) {
      const frameCanvas = spriteSource.getCharacterFrame(
        f.id,
        f.paletteIdx,
        ai.anim,
        ai.frame,
        ai.facing,
        false,
        true
      );
      if (frameCanvas) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ai.alpha);
        const drawX = Math.round(ai.x - match.cameraX - (ai.facing === 1 ? 72 : 88));
        const drawY = Math.round(FLOOR_Y + ai.y - 124);
        ctx.drawImage(frameCanvas, drawX, drawY);
        ctx.restore();
      }
    }

    drawVerletSecondary(ctx, f, match.cameraX, FLOOR_Y);

    const sprite = spriteSource.getCharacterFrame(
      f.id,
      f.paletteIdx,
      animName,
      f.stateFrame,
      f.facing,
      f.poisonStacks > 0,
      f.isShadowBoss
    );
    if (sprite) {
      const drawX = Math.round(f.x - match.cameraX - (f.facing === 1 ? 72 : 88));
      const drawY = Math.round(FLOOR_Y + f.y - 124);
      ctx.drawImage(sprite, drawX, drawY);
    }

    // Cassandra Intro spotlight beam
    if (f.id === 'cassandra' && match.phase === 'intro') {
      const sx = Math.round(f.x - match.cameraX);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
      ctx.fillRect(sx - 24, 0, 48, FLOOR_Y);
    }

    // Barbara Mãos de Giz foot-root indicator
    if (f.rootFrames > 0) {
      const sx = Math.round(f.x - match.cameraX);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(sx - 16, FLOOR_Y - 8, 32, 8);
    }

    // Dizzy stars overhead
    if (f.state === 'dizzy') {
      const sx = Math.round(f.x - match.cameraX);
      for (let s = 0; s < 3; s++) {
        const ox = Math.round(Math.cos(match.frame * 0.18 + s * 2.1) * 16);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(sx + ox - 2, FLOOR_Y + f.y - 98, 4, 4);
      }
    }
  }

  // 5. Projectiles & Barbara's Visitors
  for (const p of match.projectiles) {
    drawProjectileOrSummon(ctx, p, match.cameraX, FLOOR_Y, match.frame);
  }

  // 6. Particles / Hit Sparks
  for (const pt of match.particles) {
    if (!pt.active) continue;
    ctx.fillStyle = pt.color;
    ctx.fillRect(
      Math.round(pt.x - match.cameraX),
      Math.round(FLOOR_Y + pt.y),
      pt.size,
      pt.size
    );
  }

  // 7. Hitboxes Debug Overlay (F1 or Training Mode): Hurtbox Green, Hitbox Red, Pushbox Blue, Invuln Yellow
  if (showHitboxes) {
    for (const f of match.fighters) {
      const pushW = getWorldBox(f.x, f.y, f.facing, f.pushbox);
      const hurtW = getWorldBox(f.x, f.y, f.facing, f.hurtbox);
      const invuln = isFighterInvulnerable(f, false, false);

      // Pushbox = Blue
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        Math.round(pushW.x - match.cameraX),
        Math.round(FLOOR_Y + pushW.y),
        pushW.w,
        pushW.h
      );

      // Hurtbox = Green (or Yellow when Invulnerable!)
      if (hurtW.w > 0) {
        ctx.strokeStyle = invuln ? '#facc15' : '#22c55e';
        ctx.strokeRect(
          Math.round(hurtW.x - match.cameraX),
          Math.round(FLOOR_Y + hurtW.y),
          hurtW.w,
          hurtW.h
        );
      }

      // Active Hitbox = Red
      if (f.activeHitbox && f.activeHitbox.w > 0) {
        const hitW = getWorldBox(f.x, f.y, f.facing, f.activeHitbox);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fillRect(
          Math.round(hitW.x - match.cameraX),
          Math.round(FLOOR_Y + hitW.y),
          hitW.w,
          hitW.h
        );
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(
          Math.round(hitW.x - match.cameraX),
          Math.round(FLOOR_Y + hitW.y),
          hitW.w,
          hitW.h
        );
      }
    }
  }

  // 8. Floating Combat Callouts ("CONTRA-ATAQUE!", "PRIMEIRO GOLPE!", "APAROU!")
  if (showHud) {
    ctx.font = 'bold 8px monospace';
    for (const c of match.callouts) {
      const cx = Math.max(24, Math.min(SCREEN_WIDTH - 90, Math.round(c.x - match.cameraX - 30)));
      const cy = Math.max(36, Math.round(FLOOR_Y + c.y));
      ctx.fillStyle = '#09080d';
      ctx.fillText(c.text, cx + 1, cy + 1);
      ctx.fillStyle = c.color;
      ctx.fillText(c.text, cx, cy);
    }
  }

  // 9. Super Flash & Level 3 Cinematics
  if (match.cinematic.active && showHud) {
    renderCinematicOverlay(ctx, match);
  }

  // KO Slow-mo white flash on initial frames
  if (match.phase === 'ko_slowmo' && match.phaseTimer > 52) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  // 10. Native CPS-3 HUD Overlay
  if (showHud) {
    renderHudOnCanvas(ctx, match, roundsToWin);
  }

  ctx.restore();
}

function renderCinematicOverlay(ctx: CanvasRenderingContext2D, match: MatchState): void {
  const cin = match.cinematic;
  const attacker = match.fighters[cin.attackerIndex];
  const f = cin.frame;

  if (cin.type === 'super_flash') {
    ctx.fillStyle = 'rgba(9, 8, 15, 0.78)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // KOF-style diagonal cut-in banner with character portrait and move name
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 68, SCREEN_WIDTH, 54);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 68, SCREEN_WIDTH, 2);
    ctx.fillRect(0, 120, SCREEN_WIDTH, 2);

    drawCharacterPortrait(ctx, attacker.id, 24, 73, 44, attacker.paletteIdx, attacker.isShadowBoss);
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#fde047';
    ctx.fillText(attacker.name, 78, 92);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cin.moveName.toUpperCase(), 78, 110);
    return;
  }

  if (cin.type === 'cassandra_lv3') {
    // Black & white film grain + clapperboard "CENA 13, TOMADA FINAL" + closing cinema curtain "FIM"
    ctx.fillStyle = 'rgba(15, 15, 18, 0.88)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    // Film grain lines
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect((f * 37) % SCREEN_WIDTH, 0, 1, SCREEN_HEIGHT);
    ctx.fillRect((f * 73) % SCREEN_WIDTH, 0, 1, SCREEN_HEIGHT);

    if (f < 50) {
      ctx.fillStyle = '#f4efe6';
      ctx.fillRect(102, 64, 180, 76);
      ctx.fillStyle = '#09080d';
      ctx.fillRect(106, 76, 172, 60);
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#f4efe6';
      ctx.fillText('MERIDIAN PICTURES · 1967', 116, 96);
      ctx.fillStyle = '#fde047';
      ctx.fillText('CENA 13 · TOMADA FINAL', 118, 116);
    } else {
      const curtainW = Math.min(192, (f - 50) * 4);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 0, curtainW, SCREEN_HEIGHT);
      ctx.fillRect(SCREEN_WIDTH - curtainW, 0, curtainW, SCREEN_HEIGHT);
      if (f > 85) {
        ctx.font = 'bold 20px serif';
        ctx.fillStyle = '#fde047';
        ctx.fillText('F I M', 166, 118);
      }
    }
    return;
  }

  if (cin.type === 'boris_lv3') {
    // Spectral green caravan of Dragomir ancestors charging across screen
    ctx.fillStyle = 'rgba(6, 18, 12, 0.9)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    const caravanX = SCREEN_WIDTH - f * 5;
    ctx.fillStyle = '#4ade80';
    for (let w = 0; w < 3; w++) {
      const wx = caravanX + w * 110;
      ctx.fillRect(wx, 96, 68, 44);
      ctx.fillStyle = '#bbf7d0';
      ctx.fillRect(wx - 28, 110, 24, 26); // Spectral horses
      ctx.fillStyle = '#4ade80';
    }
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#bbf7d0';
    ctx.fillText('RÉQUIEM DA CARAVANA DRAGOMIR', 96, 56);
    return;
  }

  if (cin.type === 'gnhoif_lv3') {
    // Pitch black screen + thousands of golden eyes opening simultaneously
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    const eyeCount = Math.min(60, Math.floor(f * 0.8));
    for (let i = 0; i < eyeCount; i++) {
      const ex = (i * 67 + 23) % (SCREEN_WIDTH - 20);
      const ey = (i * 41 + 18) % (SCREEN_HEIGHT - 30);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(ex, ey, 8, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex + 3, ey, 2, 3);
    }
    if (f > 90) {
      ctx.fillStyle = `rgba(254, 240, 138, ${(f - 90) / 30})`;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }
    return;
  }

  if (cin.type === 'barbara_lv3') {
    // Original lullaby letter-by-letter + giant chalk X on floor + "Boa noite."
    ctx.fillStyle = 'rgba(9, 8, 14, 0.92)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Giant chalk X on floor
    ctx.fillStyle = '#f472b6';
    for (let d = -40; d <= 40; d += 4) {
      ctx.fillRect(192 + d, 168 + Math.round(d * 0.25), 5, 3);
      ctx.fillRect(192 + d, 168 - Math.round(d * 0.25), 5, 3);
    }

    ctx.font = 'bold 9px monospace';
    const maxChars = f * 2;
    let charsLeft = maxChars;
    for (let i = 0; i < BARBARA_LULLABY_LINES.length; i++) {
      if (charsLeft <= 0) break;
      const line = BARBARA_LULLABY_LINES[i];
      const slice = line.slice(0, charsLeft);
      charsLeft -= line.length;
      ctx.fillStyle = i % 2 === 0 ? '#93c5fd' : '#f472b6';
      ctx.fillText(slice, 82, 42 + i * 16);
    }

    if (f > 95) {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('"Boa noite."', 148, 152);
    }
  }
}

function renderHudOnCanvas(
  ctx: CanvasRenderingContext2D,
  match: MatchState,
  roundsToWin: number
): void {
  const [f1, f2] = match.fighters;

  // Portraits
  drawCharacterPortrait(ctx, f1.id, 6, 6, 24, f1.paletteIdx, f1.isShadowBoss);
  drawCharacterPortrait(ctx, f2.id, SCREEN_WIDTH - 30, 6, 24, f2.paletteIdx, f2.isShadowBoss);

  // Health Bar Frames (136px wide each)
  const barW = 136;
  const barH = 9;
  const p1BarX = 33;
  const p2BarX = SCREEN_WIDTH - 33 - barW;
  const barY = 8;

  // P1 Health Bar (drains toward center/right)
  ctx.fillStyle = '#09080d';
  ctx.fillRect(p1BarX - 1, barY - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#1e1b2e';
  ctx.fillRect(p1BarX, barY, barW, barH);
  // Red delayed trail
  const p1TrailW = Math.round((f1.trailHp / f1.maxHp) * barW);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(p1BarX + (barW - p1TrailW), barY, p1TrailW, barH);
  // Actual HP
  const p1HpW = Math.round((f1.hp / f1.maxHp) * barW);
  ctx.fillStyle = f1.poisonStacks > 0 ? '#4ade80' : '#eab308';
  ctx.fillRect(p1BarX + (barW - p1HpW), barY, p1HpW, barH);

  // P2 Health Bar
  ctx.fillStyle = '#09080d';
  ctx.fillRect(p2BarX - 1, barY - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#1e1b2e';
  ctx.fillRect(p2BarX, barY, barW, barH);
  const p2TrailW = Math.round((f2.trailHp / f2.maxHp) * barW);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(p2BarX, barY, p2TrailW, barH);
  const p2HpW = Math.round((f2.hp / f2.maxHp) * barW);
  ctx.fillStyle = f2.poisonStacks > 0 ? '#4ade80' : '#eab308';
  ctx.fillRect(p2BarX, barY, p2HpW, barH);

  // Stun Bars below Health Bars
  const stunW = 84;
  ctx.fillStyle = '#09080d';
  ctx.fillRect(p1BarX + (barW - stunW), barY + 11, stunW, 3);
  ctx.fillStyle = '#f97316';
  const p1StunW = Math.round((f1.stun / f1.maxStun) * stunW);
  ctx.fillRect(p1BarX + barW - p1StunW, barY + 11, p1StunW, 3);

  ctx.fillStyle = '#09080d';
  ctx.fillRect(p2BarX, barY + 11, stunW, 3);
  ctx.fillStyle = '#f97316';
  const p2StunW = Math.round((f2.stun / f2.maxStun) * stunW);
  ctx.fillRect(p2BarX, barY + 11, p2StunW, 3);

  // Names & Round Markers + Poison Stack Badges
  ctx.font = 'bold 7px monospace';
  ctx.fillStyle = '#f4efe6';
  ctx.fillText(f1.name, p1BarX, barY + 22);
  ctx.fillText(f2.name, p2BarX + barW - ctx.measureText(f2.name).width, barY + 22);

  // Round Pips
  for (let r = 0; r < roundsToWin; r++) {
    ctx.fillStyle = r < f1.roundsWon ? '#facc15' : '#334155';
    ctx.fillRect(p1BarX + barW - 6 - r * 8, barY + 16, 5, 5);
    ctx.fillStyle = r < f2.roundsWon ? '#facc15' : '#334155';
    ctx.fillRect(p2BarX + 2 + r * 8, barY + 16, 5, 5);
  }

  // Poison Status Icons
  if (f1.poisonStacks > 0) {
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`VENENO x${f1.poisonStacks}`, p1BarX, barY + 30);
  }
  if (f2.poisonStacks > 0) {
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`VENENO x${f2.poisonStacks}`, p2BarX + barW - 44, barY + 30);
  }

  // Central Pixel Timer
  const timeStr =
    match.timerFrames < 0
      ? '∞'
      : String(Math.ceil(match.timerFrames / 60)).padStart(2, '0');
  drawPixelNumber(ctx, timeStr === '∞' ? '∞' : timeStr, timeStr === '∞' ? 188 : 181, 8, 3, '#fde047');

  // Bottom 3-Level Super Meters
  const supW = 110;
  const supY = SCREEN_HEIGHT - 12;
  // P1 Super
  ctx.fillStyle = '#09080d';
  ctx.fillRect(24, supY - 1, supW + 2, 7);
  const p1Lv = Math.floor(f1.superMeter / 1000);
  const p1Fill = Math.round(((f1.superMeter % 1000) / 1000) * supW);
  ctx.fillStyle = p1Lv >= 3 ? '#f43f5e' : p1Lv >= 1 ? '#38bdf8' : '#1e293b';
  ctx.fillRect(25, supY, p1Lv >= 3 ? supW : Math.round((f1.superMeter / 3000) * supW), 5);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(25, supY + 3, p1Fill, 2);
  drawPixelNumber(ctx, String(p1Lv), 10, supY - 3, 2, '#38bdf8');

  // P2 Super
  const p2SupX = SCREEN_WIDTH - 25 - supW;
  ctx.fillStyle = '#09080d';
  ctx.fillRect(p2SupX - 1, supY - 1, supW + 2, 7);
  const p2Lv = Math.floor(f2.superMeter / 1000);
  const p2Fill = Math.round(((f2.superMeter % 1000) / 1000) * supW);
  ctx.fillStyle = p2Lv >= 3 ? '#f43f5e' : p2Lv >= 1 ? '#38bdf8' : '#1e293b';
  ctx.fillRect(p2SupX, supY, p2Lv >= 3 ? supW : Math.round((f2.superMeter / 3000) * supW), 5);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(p2SupX + (supW - p2Fill), supY + 3, p2Fill, 2);
  drawPixelNumber(ctx, String(p2Lv), SCREEN_WIDTH - 16, supY - 3, 2, '#38bdf8');

  // Combo Counter & Total Damage
  if (f1.comboDisplayTimer > 0 && f1.comboCount >= 2) {
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#fde047';
    ctx.fillText(`${f1.comboCount} HITS`, 12, 58);
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#f4efe6';
    ctx.fillText(`${f1.comboDamage} DANO`, 12, 67);
  }
  if (f2.comboDisplayTimer > 0 && f2.comboCount >= 2) {
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#fde047';
    ctx.fillText(`${f2.comboCount} HITS`, SCREEN_WIDTH - 64, 58);
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#f4efe6';
    ctx.fillText(`${f2.comboDamage} DANO`, SCREEN_WIDTH - 64, 67);
  }

  // Center Announce Banner (ROUND 1, LUTEM!, K.O.!, TEMPO!, EMPATE!, PERFEITO!)
  if (match.announceText) {
    ctx.fillStyle = 'rgba(9, 8, 13, 0.78)';
    ctx.fillRect(0, 92, SCREEN_WIDTH, 34);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 92, SCREEN_WIDTH, 1);
    ctx.fillRect(0, 125, SCREEN_WIDTH, 1);
    ctx.font = 'bold 15px monospace';
    const tw = ctx.measureText(match.announceText).width;
    ctx.fillStyle = '#09080d';
    ctx.fillText(match.announceText, Math.round((SCREEN_WIDTH - tw) * 0.5) + 1, 115);
    ctx.fillStyle = '#fde047';
    ctx.fillText(match.announceText, Math.round((SCREEN_WIDTH - tw) * 0.5), 114);
  }
}
