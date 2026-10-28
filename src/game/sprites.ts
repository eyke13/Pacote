import {
  ActiveProjectile,
  CharacterId,
  Fighter,
  Palette,
  SpriteSource
} from './types';
import { CHARACTERS } from './lore';

interface LimbPose {
  hipX: number;
  hipY: number;
  torsoAngle: number;
  headAngle: number;
  lShoulder: number;
  lElbow: number;
  rShoulder: number;
  rElbow: number;
  lHip: number;
  lKnee: number;
  rHip: number;
  rKnee: number;
  squashX: number;
  squashY: number;
  weaponOut?: 'smg' | 'mirror' | 'dagger' | 'scythe_high' | 'scythe_sweep' | 'sleeves_whip' | 'lipstick';
}

function getPoseForState(
  charId: CharacterId,
  anim: string,
  frame: number
): LimbPose {
  const base: LimbPose = {
    hipX: 0,
    hipY: 0,
    torsoAngle: 0,
    headAngle: 0,
    lShoulder: 0.35,
    lElbow: -0.6,
    rShoulder: -0.25,
    rElbow: -0.7,
    lHip: -0.18,
    lKnee: 0.2,
    rHip: 0.22,
    rKnee: 0.15,
    squashX: 1,
    squashY: 1
  };

  // Character-specific stance silhouettes
  if (charId === 'cassandra') {
    base.torsoAngle = -0.06;
    base.lShoulder = 0.5;
    base.lElbow = -1.1; // Hand near hip/pearls
    base.rShoulder = -0.35;
    base.rElbow = -0.9;
  } else if (charId === 'boris') {
    base.torsoAngle = 0.14; // Predatory forward lean
    base.lShoulder = 0.2;
    base.lElbow = -0.8;
    base.rShoulder = -0.5;
    base.rElbow = -1.1;
  } else if (charId === 'gnhoif') {
    base.hipY = -6; // Floats 6px above floor
    base.torsoAngle = 0.08;
    base.rShoulder = -0.7;
    base.rElbow = -0.4;
  } else if (charId === 'barbara') {
    base.torsoAngle = 0.05;
    base.lShoulder = 0.25;
    base.lElbow = 0.35; // Long dangling straitjacket sleeves
    base.rShoulder = -0.2;
    base.rElbow = 0.4;
  }

  const cycle = Math.sin(frame * 0.22);

  switch (anim) {
    case 'intro':
      base.hipY += Math.sin(frame * 0.15) * 2;
      base.rShoulder = -1.1;
      base.rElbow = -0.5;
      break;
    case 'idle':
      base.hipY += Math.round(cycle * 1.5);
      base.lShoulder += cycle * 0.08;
      base.rShoulder -= cycle * 0.08;
      break;
    case 'walk_f':
    case 'walk_b': {
      const dir = anim === 'walk_f' ? 1 : -1;
      const w = Math.sin(frame * 0.35 * dir);
      base.hipY += Math.abs(Math.round(w * 2));
      base.lHip = w * 0.55;
      base.lKnee = Math.max(0, -w * 0.5);
      base.rHip = -w * 0.55;
      base.rKnee = Math.max(0, w * 0.5);
      base.lShoulder = -w * 0.4;
      base.rShoulder = w * 0.4;
      break;
    }
    case 'crouch':
    case 'block_crouch':
      base.hipY += 20;
      base.torsoAngle = 0.28;
      base.lHip = -0.9;
      base.lKnee = 1.45;
      base.rHip = -0.75;
      base.rKnee = 1.35;
      if (anim === 'block_crouch') {
        base.lShoulder = -0.8;
        base.lElbow = -1.2;
        base.rShoulder = -0.9;
        base.rElbow = -1.2;
      }
      break;
    case 'block_stand':
      base.torsoAngle = -0.12;
      base.lShoulder = -0.75;
      base.lElbow = -1.3;
      base.rShoulder = -0.85;
      base.rElbow = -1.2;
      break;
    case 'prejump':
      base.hipY += 12;
      base.squashX = 1.16;
      base.squashY = 0.84;
      break;
    case 'jump':
      base.hipY -= 8;
      base.squashX = 0.9;
      base.squashY = 1.1;
      base.lHip = -0.65;
      base.lKnee = 1.1;
      base.rHip = 0.35;
      base.rKnee = 0.8;
      break;
    case 'dash':
      base.torsoAngle = 0.42;
      base.hipY += 6;
      base.lHip = 0.7;
      base.rHip = -0.7;
      base.squashX = 1.14;
      base.squashY = 0.9;
      break;
    case 'backdash':
      if (charId === 'cassandra') {
        // Elegant cartwheel backdash!
        base.torsoAngle = frame * 0.45;
        base.lHip = -0.9;
        base.rHip = 0.9;
      } else {
        base.torsoAngle = -0.32;
        base.hipY -= 4;
        base.lHip = -0.5;
        base.rHip = 0.6;
      }
      break;
    case 'roll':
      base.hipY += 22;
      base.torsoAngle = frame * 0.5;
      base.lHip = -1.2;
      base.lKnee = 1.6;
      base.rHip = -1.2;
      base.rKnee = 1.6;
      break;
    case 'parry':
      base.torsoAngle = -0.18;
      base.rShoulder = -1.3;
      base.rElbow = -0.3;
      base.squashX = 1.1;
      break;
    case 'hit_high':
      base.torsoAngle = -0.42;
      base.headAngle = -0.35;
      base.lShoulder = 0.6;
      base.rShoulder = 0.4;
      break;
    case 'hit_low':
    case 'air_hit':
      base.hipY += 10;
      base.torsoAngle = 0.48;
      base.headAngle = 0.3;
      break;
    case 'knockdown':
      base.hipY += 38;
      base.torsoAngle = 1.48;
      base.lHip = 0.2;
      base.rHip = -0.1;
      break;
    case 'wakeup':
      base.hipY += 16;
      base.torsoAngle = 0.4;
      break;
    case 'dizzy':
      base.torsoAngle = Math.sin(frame * 0.3) * 0.3;
      base.headAngle = Math.cos(frame * 0.3) * 0.35;
      break;
    case 'taunt':
      if (charId === 'cassandra') {
        base.weaponOut = 'lipstick';
        base.rShoulder = -1.1;
        base.rElbow = -1.2;
      } else {
        base.torsoAngle = -0.15;
        base.rShoulder = -1.4;
      }
      break;
    case 'win':
      base.torsoAngle = -0.12;
      base.rShoulder = -1.5;
      base.rElbow = -0.2;
      break;
    case '5A':
    case '2A':
    case 'jA':
      if ( anim === '2A') base.hipY += 18;
      base.rShoulder = -1.45;
      base.rElbow = -0.05;
      base.squashX = 1.08;
      break;
    case '5C_close':
    case '5C_far':
    case '2C':
    case 'jC':
    case '6C':
    case 'CD':
      if (anim === '2C') base.hipY += 14;
      base.torsoAngle = 0.22;
      base.rShoulder = -1.55;
      base.rElbow = 0.0;
      base.lShoulder = 0.65;
      base.squashX = 1.15;
      base.squashY = 0.92;
      if (charId === 'boris') base.weaponOut = 'dagger';
      if (charId === 'gnhoif') base.weaponOut = 'scythe_sweep';
      if (charId === 'barbara') base.weaponOut = 'sleeves_whip';
      break;
    case '5B':
    case '2B':
    case 'jB':
      if (anim === '2B') base.hipY += 20;
      base.rHip = -1.25;
      base.rKnee = 0.05;
      break;
    case '5D_close':
    case '5D_far':
    case '2D':
    case '3D':
    case 'jD':
    case '6B':
    case '6D':
      if (anim === '2D' || anim === '3D') base.hipY += 22;
      base.torsoAngle = -0.22;
      base.rHip = -1.55;
      base.rKnee = 0.0;
      base.squashX = 1.16;
      if (charId === 'gnhoif') base.weaponOut = 'scythe_sweep';
      break;
    case 'special_gun':
    case 'super1':
    case 'super3':
      base.torsoAngle = 0.12;
      base.rShoulder = -1.5;
      base.rElbow = 0;
      base.lShoulder = -1.2;
      base.lElbow = -0.3;
      if (charId === 'cassandra') base.weaponOut = 'smg';
      if (charId === 'boris') base.weaponOut = 'dagger';
      if (charId === 'gnhoif') base.weaponOut = 'scythe_high';
      if (charId === 'barbara') base.weaponOut = 'sleeves_whip';
      break;
    case 'special_mirror':
      base.weaponOut = 'mirror';
      base.rShoulder = -1.3;
      base.rElbow = -0.5;
      break;
    case 'special_flip':
    case 'special_dp':
    case 'special_scythe_up':
      base.hipY -= 12;
      base.torsoAngle = -0.45;
      base.rHip = -1.65;
      base.rKnee = 0;
      base.rShoulder = -1.8;
      if (charId === 'boris') base.weaponOut = 'dagger';
      if (charId === 'gnhoif') base.weaponOut = 'scythe_high';
      break;
    default:
      base.rShoulder = -1.35;
      base.rElbow = -0.15;
      break;
  }

  return base;
}

function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  outline?: string
): void {
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.max(1, Math.round(w));
  const rh = Math.max(1, Math.round(h));
  if (outline) {
    ctx.fillStyle = outline;
    ctx.fillRect(rx - 1, ry - 1, rw + 2, rh + 2);
  }
  ctx.fillStyle = fill;
  ctx.fillRect(rx, ry, rw, rh);
}

function drawLimbSegment(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  angle: number,
  len: number,
  thickness: number,
  tones: [string, string, string],
  outline: string
): { endX: number; endY: number } {
  const endX = x1 + Math.sin(angle) * len;
  const endY = y1 + Math.cos(angle) * len;
  const steps = Math.max(4, Math.ceil(len / 2));

  // Pass 1: 1px dark outline
  ctx.fillStyle = outline;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = Math.round(x1 + (endX - x1) * t - thickness * 0.5);
    const py = Math.round(y1 + (endY - y1) * t - thickness * 0.5);
    ctx.fillRect(px - 1, py - 1, Math.round(thickness) + 2, Math.round(thickness) + 2);
  }

  // Pass 2: 3-tone shaded body (dark base, mid core, light top highlight)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = Math.round(x1 + (endX - x1) * t - thickness * 0.5);
    const py = Math.round(y1 + (endY - y1) * t - thickness * 0.5);
    const th = Math.max(2, Math.round(thickness));
    ctx.fillStyle = tones[2];
    ctx.fillRect(px, py, th, th);
    ctx.fillStyle = tones[1];
    ctx.fillRect(px, py, Math.max(1, th - 1), Math.max(1, th - 1));
    ctx.fillStyle = tones[0];
    ctx.fillRect(px, py, Math.max(1, Math.floor(th * 0.5)), Math.max(1, Math.floor(th * 0.5)));
  }

  return { endX, endY };
}

export class ProceduralSpriteSource implements SpriteSource {
  private cache = new Map<string, HTMLCanvasElement>();

  public getCharacterFrame(
    charId: CharacterId,
    paletteIdx: number,
    animName: string,
    frameIdx: number,
    facing: 1 | -1,
    isPoisoned: boolean,
    isShadowBoss: boolean
  ): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;

    const quantFrame = Math.floor(frameIdx / 2) % 12;
    const key = `${charId}_${paletteIdx}_${animName}_${quantFrame}_${facing}_${isPoisoned ? 1 : 0}_${isShadowBoss ? 1 : 0}`;
    const existing = this.cache.get(key);
    if (existing) return existing;

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;

    const meta = CHARACTERS[charId];
    const pal: Palette = isShadowBoss
      ? meta.shadowPalette
      : meta.palettes[paletteIdx % meta.palettes.length];

    ctx.save();
    if (facing === -1) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    const originX = 72;
    const originY = 124;

    this.drawCharacterOnCanvas(ctx, charId, pal, animName, quantFrame * 2, originX, originY, isPoisoned);
    ctx.restore();

    if (this.cache.size > 400) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, canvas);
    return canvas;
  }

  private drawCharacterOnCanvas(
    ctx: CanvasRenderingContext2D,
    charId: CharacterId,
    pal: Palette,
    anim: string,
    frame: number,
    ox: number,
    oy: number,
    isPoisoned: boolean
  ): void {
    const pose = getPoseForState(charId, anim, frame);
    const scaleH =
      charId === 'gnhoif' ? 1.14 : charId === 'boris' ? 1.03 : charId === 'cassandra' ? 0.98 : 0.9;

    const hipX = ox + pose.hipX;
    const hipY = oy - Math.round(44 * scaleH * pose.squashY) + pose.hipY;

    const skinTones: [string, string, string] = isPoisoned
      ? ['#86efac', '#4ade80', '#166534']
      : pal.skin;

    const thighLen = Math.round(20 * scaleH * pose.squashY);
    const calfLen = Math.round(21 * scaleH * pose.squashY);
    const torsoLen = Math.round(28 * scaleH * pose.squashY);
    const armLen = Math.round(16 * scaleH);
    const forearmLen = Math.round(15 * scaleH);

    // 1. Back Leg (Left)
    const lKneePos = drawLimbSegment(
      ctx,
      hipX - 4,
      hipY,
      pose.lHip,
      thighLen,
      7 * pose.squashX,
      pal.primary,
      pal.outline
    );
    const lFootPos = drawLimbSegment(
      ctx,
      lKneePos.endX,
      lKneePos.endY,
      pose.lHip + pose.lKnee,
      calfLen,
      5 * pose.squashX,
      charId === 'cassandra' || charId === 'barbara' ? skinTones : pal.secondary,
      pal.outline
    );
    // Back Foot / Stiletto blade
    drawPixelRect(ctx, lFootPos.endX - 3, lFootPos.endY - 3, 9, 5, pal.secondary[1], pal.outline);
    if (charId === 'cassandra') {
      drawPixelRect(ctx, lFootPos.endX + 5, lFootPos.endY - 2, 4, 2, '#e2e8f0', pal.outline); // Toe blade!
    }

    // 2. Back Arm (Left)
    const shoulderX = hipX + Math.sin(pose.torsoAngle) * torsoLen;
    const shoulderY = hipY - Math.cos(pose.torsoAngle) * torsoLen;
    const lElbowPos = drawLimbSegment(
      ctx,
      shoulderX - 5,
      shoulderY + 4,
      pose.lShoulder,
      armLen,
      6,
      pal.secondary,
      pal.outline
    );
    drawLimbSegment(
      ctx,
      lElbowPos.endX,
      lElbowPos.endY,
      pose.lShoulder + pose.lElbow,
      forearmLen,
      5,
      charId === 'cassandra' ? pal.secondary : skinTones,
      pal.outline
    );

    // 3. Gnhoif Cloak Backdrop & Scythe (behind torso)
    if (charId === 'gnhoif') {
      // Absolute black cloak body with ragged inward-curling bottom
      drawPixelRect(ctx, shoulderX - 16, shoulderY - 4, 30, 66, pal.primary[2], pal.outline);
      drawPixelRect(ctx, shoulderX - 13, shoulderY, 24, 58, pal.primary[0]);
      // Dying constellations & embers inside obsidian torso
      ctx.fillStyle = pal.accent[1];
      ctx.fillRect(Math.round(shoulderX - 4), Math.round(shoulderY + 12), 2, 2);
      ctx.fillRect(Math.round(shoulderX + 3), Math.round(shoulderY + 22), 2, 2);
      ctx.fillRect(Math.round(shoulderX - 2), Math.round(shoulderY + 32), 3, 2);
    }

    // 4. Pelvis & Torso
    drawPixelRect(ctx, hipX - 8, hipY - 6, 16, 12, pal.primary[1], pal.outline);
    drawLimbSegment(
      ctx,
      hipX,
      hipY,
      pose.torsoAngle,
      torsoLen,
      (charId === 'boris' ? 14 : 12) * pose.squashX,
      pal.primary,
      pal.outline
    );

    // Character-specific Torso Details
    if (charId === 'cassandra') {
      // Long emerald satin gown skirt with side slit exposing front leg
      drawPixelRect(ctx, hipX - 9, hipY - 2, 14, 34, pal.primary[1], pal.outline);
      drawPixelRect(ctx, hipX - 7, hipY, 6, 30, pal.primary[0]);
      // 3-strand pearl necklace
      drawPixelRect(ctx, shoulderX - 5, shoulderY + 2, 10, 4, '#f7f4eb', pal.outline);
    } else if (charId === 'boris') {
      // White linen shirt chest + copper embroidered wine vest + copper coin necklace
      drawPixelRect(ctx, shoulderX - 4, shoulderY + 3, 8, 16, pal.secondary[0]);
      drawPixelRect(ctx, shoulderX - 5, shoulderY + 4, 10, 3, pal.accent[0], pal.outline); // Copper coins
      // Waist sash with copper daggers
      drawPixelRect(ctx, hipX - 9, hipY - 4, 18, 6, pal.accent[1], pal.outline);
      drawPixelRect(ctx, hipX - 4, hipY - 3, 3, 7, '#4ade80'); // Dripping green venom dagger
    } else if (charId === 'barbara') {
      // Hospital gown with floral patches + open straitjacket
      drawPixelRect(ctx, hipX - 9, hipY - 4, 18, 26, pal.primary[1], pal.outline);
      drawPixelRect(ctx, shoulderX - 8, shoulderY + 2, 16, 18, pal.secondary[0], pal.outline);
      // Embroidered pink flowers on gown
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(Math.round(hipX - 4), Math.round(hipY + 10), 3, 3);
      ctx.fillRect(Math.round(hipX + 3), Math.round(hipY + 15), 3, 3);
    }

    // 5. Front Leg (Right)
    const rKneePos = drawLimbSegment(
      ctx,
      hipX + 3,
      hipY,
      pose.rHip,
      thighLen,
      7 * pose.squashX,
      charId === 'cassandra' ? skinTones : pal.primary,
      pal.outline
    );
    const rFootPos = drawLimbSegment(
      ctx,
      rKneePos.endX,
      rKneePos.endY,
      pose.rHip + pose.rKnee,
      calfLen,
      5 * pose.squashX,
      charId === 'cassandra' || charId === 'barbara' ? skinTones : pal.secondary,
      pal.outline
    );
    drawPixelRect(
      ctx,
      rFootPos.endX - 2,
      rFootPos.endY - 3,
      10,
      5,
      charId === 'barbara' ? '#f2eee9' : pal.secondary[1],
      pal.outline
    );
    if (charId === 'cassandra') {
      drawPixelRect(ctx, rFootPos.endX + 7, rFootPos.endY - 2, 5, 2, '#ffffff', pal.outline);
    }

    // 6. Head & Distinct Silhouette Hair/Mask
    const headX = shoulderX + Math.sin(pose.headAngle) * 4;
    const headY = shoulderY - 12;

    if (charId === 'gnhoif') {
      // Smooth bone mask with golden stitched eyes
      drawPixelRect(ctx, headX - 7, headY - 8, 15, 18, pal.secondary[0], pal.outline);
      drawPixelRect(ctx, headX - 4, headY - 2, 9, 3, pal.accent[0]); // Gold stitches / solar eyes
    } else {
      drawPixelRect(ctx, headX - 6, headY - 6, 13, 14, skinTones[0], pal.outline);
      ctx.fillStyle = skinTones[1];
      ctx.fillRect(Math.round(headX - 5), Math.round(headY + 2), 11, 5);
    }

    if (charId === 'cassandra') {
      // 60s platinum wave coiffure + emerald hairpin + red lipstick
      drawPixelRect(ctx, headX - 9, headY - 11, 17, 8, '#f7f4eb', pal.outline);
      drawPixelRect(ctx, headX - 10, headY - 6, 6, 12, '#e8e2d5', pal.outline);
      drawPixelRect(ctx, headX - 2, headY - 9, 4, 3, '#10b981'); // Emerald hairpin
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(Math.round(headX + 3), Math.round(headY + 3), 4, 2); // Red lipstick
    } else if (charId === 'boris') {
      // Long black hair with grey streaks & copper rings + short beard + scar
      drawPixelRect(ctx, headX - 8, headY - 10, 16, 7, '#18181b', pal.outline);
      drawPixelRect(ctx, headX - 10, headY - 5, 6, 16, '#18181b', pal.outline);
      drawPixelRect(ctx, headX - 8, headY - 2, 2, 8, '#9ca3af'); // Grey streak
      drawPixelRect(ctx, headX - 9, headY + 4, 4, 2, pal.accent[0]); // Copper hair ring
      drawPixelRect(ctx, headX - 3, headY + 3, 10, 5, '#27272a'); // Short beard
    } else if (charId === 'barbara') {
      // Auburn braids with hospital ribbons + big grey eyes
      drawPixelRect(ctx, headX - 8, headY - 9, 16, 7, pal.accent[0], pal.outline);
      drawPixelRect(ctx, headX - 9, headY - 2, 5, 18, pal.accent[1], pal.outline);
      drawPixelRect(ctx, headX - 10, headY + 12, 6, 4, '#f4efe6', pal.outline); // Hospital ribbon
      ctx.fillStyle = '#475569';
      ctx.fillRect(Math.round(headX + 2), Math.round(headY - 2), 3, 3); // Large grey eye
    }

    // 7. Front Arm (Right) & Signature Weapons
    const rElbowPos = drawLimbSegment(
      ctx,
      shoulderX + 3,
      shoulderY + 4,
      pose.rShoulder,
      armLen,
      6,
      pal.secondary,
      pal.outline
    );
    const rHandPos = drawLimbSegment(
      ctx,
      rElbowPos.endX,
      rElbowPos.endY,
      pose.rShoulder + pose.rElbow,
      forearmLen,
      5,
      charId === 'cassandra'
        ? pal.secondary
        : charId === 'boris' && pose.weaponOut === 'dagger'
        ? ['#4ade80', '#22c55e', '#166534'] // Glowing green forearm veins!
        : skinTones,
      pal.outline
    );

    // Draw character weapons in hand
    if (charId === 'cassandra') {
      if (pose.weaponOut === 'smg') {
        // Mother-of-pearl and gold compact SMG + muzzle flash
        drawPixelRect(ctx, rHandPos.endX, rHandPos.endY - 5, 18, 7, pal.weapon[0], pal.outline);
        drawPixelRect(ctx, rHandPos.endX + 4, rHandPos.endY - 4, 12, 3, pal.accent[0]);
        drawPixelRect(ctx, rHandPos.endX + 6, rHandPos.endY + 1, 4, 7, pal.secondary[1], pal.outline);
        drawPixelRect(ctx, rHandPos.endX + 18, rHandPos.endY - 7, 10, 10, '#fef08a');
      } else if (pose.weaponOut === 'mirror') {
        drawPixelRect(ctx, rHandPos.endX + 2, rHandPos.endY - 8, 8, 12, '#bae6fd', pal.outline);
      } else if (pose.weaponOut === 'lipstick') {
        drawPixelRect(ctx, rHandPos.endX, rHandPos.endY - 4, 6, 4, '#e11d48', pal.outline);
      }
      // Striped hatbox on ground during intro
      if (anim === 'intro') {
        drawPixelRect(ctx, ox - 28, oy - 14, 16, 14, '#f7f4eb', pal.outline);
        drawPixelRect(ctx, ox - 24, oy - 14, 4, 14, '#18181b');
      }
    } else if (charId === 'boris') {
      // Curved copper dagger dripping green venom
      const dLen = pose.weaponOut === 'dagger' ? 20 : 12;
      drawPixelRect(ctx, rHandPos.endX, rHandPos.endY - 3, dLen, 4, pal.accent[0], pal.outline);
      drawPixelRect(ctx, rHandPos.endX + dLen - 6, rHandPos.endY - 3, 6, 3, '#4ade80');
    } else if (charId === 'gnhoif') {
      // Solidified eclipse crescent scythe with thin solar corona edge
      drawPixelRect(ctx, rHandPos.endX - 8, rHandPos.endY - 38, 4, 66, '#27233a', pal.outline);
      const bladeW = pose.weaponOut === 'scythe_sweep' ? 46 : 30;
      drawPixelRect(ctx, rHandPos.endX - 4, rHandPos.endY - 42, bladeW, 10, '#000000', pal.accent[0]);
      drawPixelRect(ctx, rHandPos.endX - 2, rHandPos.endY - 34, bladeW - 4, 3, '#fef08a');
    } else if (charId === 'barbara') {
      // Long buckled straitjacket whip-sleeves
      const sleeveLen = pose.weaponOut === 'sleeves_whip' ? 36 : 16;
      drawPixelRect(ctx, rHandPos.endX - 2, rHandPos.endY - 2, sleeveLen, 7, pal.secondary[0], pal.outline);
      drawPixelRect(ctx, rHandPos.endX + sleeveLen - 6, rHandPos.endY - 2, 4, 7, '#f59e0b', pal.outline);
    }
  }
}

export function drawVerletSecondary(
  ctx: CanvasRenderingContext2D,
  f: Fighter,
  cameraX: number,
  floorY: number
): void {
  const chain = f.verletChain;
  if (!chain || chain.length < 2) return;

  const meta = CHARACTERS[f.id];
  const pal = f.isShadowBoss
    ? meta.shadowPalette
    : meta.palettes[f.paletteIdx % meta.palettes.length];

  const color =
    f.id === 'cassandra'
      ? pal.primary[0] // Emerald/Ruby dress hem ribbon
      : f.id === 'boris'
      ? pal.accent[0] // Copper waist sash
      : f.id === 'gnhoif'
      ? '#000000' // Light-drinking black cloak tendril
      : pal.secondary[0]; // Barbara long buckled straitjacket sleeve

  const outline = f.id === 'gnhoif' ? pal.accent[1] : pal.outline;

  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i];
    const b = chain[i + 1];
    const sx = Math.round(a.x - cameraX);
    const sy = Math.round(floorY + a.y);
    const ex = Math.round(b.x - cameraX);
    const ey = Math.round(floorY + b.y);

    ctx.fillStyle = outline;
    ctx.fillRect(Math.min(sx, ex) - 1, Math.min(sy, ey) - 1, Math.abs(ex - sx) + 5, Math.abs(ey - sy) + 5);
    ctx.fillStyle = color;
    ctx.fillRect(Math.min(sx, ex), Math.min(sy, ey), Math.abs(ex - sx) + 3, Math.abs(ey - sy) + 3);
  }
}

// Draw Projectiles & Barbara's Crayon Visitors!
export function drawProjectileOrSummon(
  ctx: CanvasRenderingContext2D,
  p: ActiveProjectile,
  cameraX: number,
  floorY: number,
  frame: number
): void {
  const sx = Math.round(p.x - cameraX);
  const sy = Math.round(floorY + p.y);

  // Barbara's Visitors: drawn with shaky childlike crayon aesthetic & saturated colors!
  if (p.spec.isSummon) {
    const jitterX = ((frame * 7) % 3) - 1;
    const jitterY = ((frame * 11) % 3) - 1;

    if (p.spec.summonType === 'botao_punch' || p.spec.summonType === 'botao_smash') {
      // Senhor Botão: 3m giant one-eyed plush rabbit with torn seams in crayon pink/magenta
      const bx = sx - 28 + jitterX;
      const by = sy - 38 + jitterY;
      drawPixelRect(ctx, bx, by, 52, 58, '#f472b6', '#be185d');
      // Long rabbit ears
      drawPixelRect(ctx, bx + 6, by - 26, 12, 26, '#f472b6', '#be185d');
      drawPixelRect(ctx, bx + 28, by - 22, 12, 22, '#f472b6', '#be185d');
      // Single button eye with X stitch
      drawPixelRect(ctx, bx + 32, by + 10, 10, 10, '#fde047', '#000000');
      drawPixelRect(ctx, bx + 35, by + 13, 4, 4, '#000000');
      // Torn stuffing seams & giant punch fist
      drawPixelRect(ctx, bx + 12, by + 28, 28, 6, '#ffffff', '#000000');
      drawPixelRect(ctx, bx + (p.facing === 1 ? 44 : -22), by + 18, 26, 22, '#ec4899', '#fdf2f8');
      return;
    }

    if (p.spec.summonType === 'traca_low' || p.spec.summonType === 'traca_arc') {
      // Dona Traça: giant moth made of vintage floral wallpaper
      const wingFlap = Math.round(Math.sin(frame * 0.45) * 8);
      drawPixelRect(ctx, sx - 16 + jitterX, sy - 12 - wingFlap, 32, 22, '#fde047', '#ca8a04');
      // Floral pattern on wings
      drawPixelRect(ctx, sx - 10, sy - 8 - wingFlap, 6, 6, '#f43f5e');
      drawPixelRect(ctx, sx + 4, sy - 6 - wingFlap, 6, 6, '#ec4899');
      drawPixelRect(ctx, sx - 6, sy - 3, 14, 6, '#78350f', '#000000');
      return;
    }

    if (p.spec.summonType === 'giz_mid' || p.spec.summonType === 'giz_far') {
      // Gêmeos de Giz: shadow-chalk hands rising from floor drawings
      drawPixelRect(ctx, sx - 20, floorY - 3, 40, 5, '#60a5fa', '#ffffff');
      drawPixelRect(ctx, sx - 12 + jitterX, floorY - 30 + jitterY, 8, 30, '#1e1b4b', '#60a5fa');
      drawPixelRect(ctx, sx + 4 - jitterX, floorY - 34 - jitterY, 8, 34, '#1e1b4b', '#f472b6');
      return;
    }
  }

  // Gnhoif Solar Beam
  if (p.spec.isBeam) {
    const bw = p.spec.w;
    const bh = p.spec.h;
    const bx = p.facing === 1 ? sx : sx - bw;
    drawPixelRect(ctx, bx, sy - bh * 0.5, bw, bh, '#fef08a', '#f59e0b');
    drawPixelRect(ctx, bx, sy - bh * 0.25, bw, bh * 0.5, '#ffffff');
    return;
  }

  // Cassandra SMG bullets or Boris venomous copper daggers
  const w = p.spec.w;
  const h = p.spec.h;
  drawPixelRect(ctx, sx - w * 0.5, sy - h * 0.5, w, h, p.spec.color, '#09080d');
}

export function drawCharacterPortrait(
  ctx: CanvasRenderingContext2D,
  charId: CharacterId,
  x: number,
  y: number,
  size: number,
  paletteIdx = 0,
  isShadowBoss = false
): void {
  const meta = CHARACTERS[charId];
  const pal = isShadowBoss ? meta.shadowPalette : meta.palettes[paletteIdx % meta.palettes.length];

  // Portrait background box
  drawPixelRect(ctx, x, y, size, size, '#13111c', pal.accent[0]);
  drawPixelRect(ctx, x + 2, y + 2, size - 4, size - 4, pal.primary[2]);

  const cx = x + Math.floor(size * 0.5);
  const cy = y + Math.floor(size * 0.58);

  if (charId === 'cassandra') {
    // Platinum 60s waves + emerald hairpin + red lips
    drawPixelRect(ctx, cx - 11, cy - 14, 22, 18, '#f7f4eb', pal.outline);
    drawPixelRect(ctx, cx - 8, cy - 8, 16, 16, pal.skin[0], pal.outline);
    drawPixelRect(ctx, cx - 6, cy - 12, 5, 3, '#10b981');
    drawPixelRect(ctx, cx - 2, cy + 3, 5, 2, '#e11d48');
  } else if (charId === 'boris') {
    // Dark hair with grey streak, scar over eyebrow, beard
    drawPixelRect(ctx, cx - 10, cy - 14, 20, 18, '#18181b', pal.outline);
    drawPixelRect(ctx, cx - 8, cy - 8, 16, 16, pal.skin[0], pal.outline);
    drawPixelRect(ctx, cx - 5, cy - 6, 2, 6, '#ef4444'); // Eyebrow scar
    drawPixelRect(ctx, cx - 7, cy + 2, 14, 6, '#27272a');
  } else if (charId === 'gnhoif') {
    // Bone mask with gold-stitched eyes
    drawPixelRect(ctx, cx - 12, cy - 15, 24, 24, '#000000', pal.outline);
    drawPixelRect(ctx, cx - 8, cy - 10, 16, 18, pal.secondary[0], pal.outline);
    drawPixelRect(ctx, cx - 6, cy - 3, 12, 3, pal.accent[0]);
  } else if (charId === 'barbara') {
    // Auburn braids + porcelain doll face + wide grey eyes
    drawPixelRect(ctx, cx - 11, cy - 13, 22, 18, pal.accent[0], pal.outline);
    drawPixelRect(ctx, cx - 8, cy - 8, 16, 15, pal.skin[0], pal.outline);
    drawPixelRect(ctx, cx - 5, cy - 3, 3, 3, '#475569');
    drawPixelRect(ctx, cx + 2, cy - 3, 3, 3, '#475569');
  }
}
