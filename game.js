// game.js - 게임 상태 + 루프
import { generateMap, getSpawn, drawMap, MAP_W, MAP_H } from './map.js';
import { player, updatePlayer, drawPlayer, setEnemiesRef, preloadCharSprites, resetPlayerAnimation } from './player.js';
import { spawnEnemies, updateEnemies, drawEnemies, enemies, enemyProjectiles, setStage, spawnBoss } from './enemy.js';
import { updateCombat, drawCombat, projectiles, xpGems, chests, pickups } from './combat.js';
import { drawHUD, handleLevelUpClick } from './hud.js';
import { particles, updateParticles, drawParticles } from './particles.js';
import { drawMenu, handleMenuClick, resetMenu, getSelectedChar } from './menu.js';
import { BOSS_TIME, CHARACTER_DEFS } from './defs.js';
import { getCharacterRenderProfile } from './character-sprites.js';

export const GAME_W = 540;
let GAME_H = 960;
export function setGameH(h) { GAME_H = h; }
export function getGameH() { return GAME_H; }

let phase = 'menu'; // menu, playing, gameover
let gameTime = 0;
export function getPhase() { return phase; }
export function getGameTime() { return gameTime; }
export function isGameOver() { return phase === 'gameover'; }
export function goToMenu() { phase = 'menu'; resetMenu(); }

export function handleMenuInput(gx, gy) {
  let result = handleMenuClick(gx, gy, GAME_W, GAME_H);
  if (result && result.stage) {
    setStage(result.stage.id, result.diff);
    startGame();
  }
}

export function startGame() {
  phase = 'playing';
  generateMap();
  enemies.length = 0;
  enemyProjectiles.length = 0;
  projectiles.length = 0;
  xpGems.length = 0;
  chests.length = 0;
  pickups.length = 0;
  particles.length = 0;
  gameTime = 0;
  let sp = getSpawn();
  player.x = sp.x; player.y = sp.y;
  player.level = 1; player.xp = 0; player.xpToNext = 20; player.kills = 0;
  player.projCount = 1; player.pierce = false; player.aoe = 0; player.regen = 0;
  player.orbitCount = 0; player.lightning = 0; player.thorns = 0;
  player.projSpeed = 0; player.projSize = 0; player.critChance = 15;
  player.xpMult = 1; player.magnetRange = 50;
  player.might = 1; player.projLife = 0.8; player.greed = 1; player.curse = 1;
  player.revive = 0; player.rerolls = 0;
  player.critDmg = 2; player.lifesteal = 0; player.shield = 0; player.maxShield = 0; player.shieldRegen = 0; player._shieldCd = 0;
  player.spinSlash = 0; player.groundSlam = 0; player.dashStrike = 0; player.shieldBash = 0;
  player.fireTrail = 0; player.iceNova = 0; player.poisonCloud = 0;
  player._spinTimer = 0; player._slamTimer = 0; player._dashTimer = 0; player._iceTimer = 0;
  player.paused = false; player.levelUpChoices = null;
  player.acquired = [];
  player._lightningTimer = 0;
  player.path = []; player.target = null; player.state = 'idle';
  player.flash = 0; player.atkCooldown = 0; player.facing = 0;
  player.selectedChar = getSelectedChar();
  let charDef = CHARACTER_DEFS[player.selectedChar] || CHARACTER_DEFS['Archer'];
  let renderProfile = getCharacterRenderProfile(player.selectedChar);
  player.radius = renderProfile.radius;
  player.maxHp = charDef.hp; player.hp = charDef.hp;
  player.atk = charDef.atk; player.def = charDef.def;
  player.speed = charDef.speed; player.atkSpeed = charDef.atkSpeed;
  player.atkRange = charDef.atkRange;
  resetPlayerAnimation();
  preloadCharSprites(player.selectedChar);
  spawnEnemies();
  setEnemiesRef(enemies);
}

export function restartGame() { startGame(); }

export function update(dt) {
  if (phase !== 'playing') return;
  if (player.paused) return;
  gameTime += dt;
  if (player.hp <= 0) { phase = 'gameover'; return; }
  if (gameTime >= BOSS_TIME) spawnBoss();
  let atkResult = updatePlayer(dt);
  // 자동공격 투사체
  if (atkResult && atkResult.attack) {
    let t = atkResult.target;
    let dx = t.x-player.x, dy = t.y-player.y, d = Math.hypot(dx,dy)||1;
    let count = player.projCount || 1;
    for (let i = 0; i < count; i++) {
      let spread = count > 1 ? (i - (count-1)/2) * 0.15 : 0;
      let angle = Math.atan2(dy, dx) + spread;
      let dmg = Math.floor(player.atk * (player.might||1));
      let crit = Math.random() * 100 < (player.critChance||15);
      if (crit) dmg = Math.floor(dmg * (player.critDmg||2));
      let spd = player.projSpeed || 280;
      let size = (player.projSize||1) * 4;
      let life = player.projLife || 0.8;
      projectiles.push({ x:player.x, y:player.y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd, dmg, radius:size, life, color:'#5f5', isCrit:crit, pierce:player.pierce||false, aoe:player.aoe||0 });
    }
  }
  updateEnemies(dt, gameTime);
  updateCombat(dt);
  updateParticles(dt);

  // 회전 구슬
  if (player.orbitCount > 0) {
    let orbitDmg = player.atk * 0.5;
    for (let i = 0; i < player.orbitCount; i++) {
      let angle = (Date.now() * 0.003) + (i / player.orbitCount) * Math.PI * 2;
      let ox = player.x + Math.cos(angle) * 50;
      let oy = player.y + Math.sin(angle) * 50;
      for (let e of enemies) {
        if (e.hp <= 0) continue;
        if (Math.hypot(e.x-ox, e.y-oy) < e.radius + 8) {
          e.hp -= orbitDmg * dt * 10; e.flash = 0.1;
        }
      }
    }
  }

  // 번개 (1초마다 주변 랜덤 적 타격)
  if (player.lightning > 0) {
    if (!player._lightningTimer) player._lightningTimer = 0;
    player._lightningTimer += dt;
    if (player._lightningTimer >= 0.8) {
      player._lightningTimer = 0;
      let targets = enemies.filter(e => e.hp > 0 && Math.hypot(e.x-player.x, e.y-player.y) < 200);
      for (let i = 0; i < player.lightning && targets.length > 0; i++) {
        let t = targets[Math.floor(Math.random()*targets.length)];
        t.hp -= player.atk * 1.5; t.flash = 0.2;
        particles.push({ x:t.x, y:t.y-10, text:'⚡', color:'#ff0', life:0.4, vy:-30 });
      }
    }
  }

  // 가시 (접촉 데미지 반사)
  if (player.thorns > 0) {
    for (let e of enemies) {
      if (e.hp <= 0) continue;
      if (Math.hypot(e.x-player.x, e.y-player.y) < player.radius + e.radius + 5) {
        e.hp -= player.thorns * dt * 5; e.flash = 0.05;
      }
    }
  }

  // 밀리 스킬: 회전 베기 (2초 쿨)
  if (player.spinSlash > 0) {
    if (!player._spinTimer) player._spinTimer = 0;
    player._spinTimer += dt;
    if (player._spinTimer >= 2) {
      player._spinTimer = 0;
      let range = 60 * (player.projSize||1);
      let dmg = Math.floor(8 * player.spinSlash * (player.might||1));
      for (let e of enemies) { if (e.hp>0 && Math.hypot(e.x-player.x,e.y-player.y)<range) { e.hp-=dmg; e.flash=0.15; particles.push({x:e.x,y:e.y-10,text:`${dmg}`,color:'#fa0',life:0.5,vy:-40}); } }
      particles.push({x:player.x,y:player.y,text:'🌀',color:'#fff',life:0.3,vy:-10});
    }
  }
  // 지면 강타 (3초 쿨)
  if (player.groundSlam > 0) {
    if (!player._slamTimer) player._slamTimer = 0;
    player._slamTimer += dt;
    if (player._slamTimer >= 3) {
      player._slamTimer = 0;
      let range = 80 * (player.projSize||1);
      let dmg = Math.floor(12 * player.groundSlam * (player.might||1));
      for (let e of enemies) { if (e.hp>0 && Math.hypot(e.x-player.x,e.y-player.y)<range) { e.hp-=dmg; e.flash=0.2; particles.push({x:e.x,y:e.y-10,text:`${dmg}`,color:'#f80',life:0.6,vy:-40}); } }
      particles.push({x:player.x,y:player.y,text:'💥',color:'#f80',life:0.4,vy:-10});
    }
  }
  // 돌진 참격 (2.5초 쿨)
  if (player.dashStrike > 0) {
    if (!player._dashTimer) player._dashTimer = 0;
    player._dashTimer += dt;
    if (player._dashTimer >= 2.5) {
      player._dashTimer = 0;
      let dmg = Math.floor(10 * player.dashStrike * (player.might||1));
      let fx = Math.cos(player.facing), fy = Math.sin(player.facing);
      for (let e of enemies) {
        if (e.hp<=0) continue;
        let dx=e.x-player.x, dy=e.y-player.y, d=Math.hypot(dx,dy);
        if (d<100 && (dx*fx+dy*fy)/(d||1) > 0.5) { e.hp-=dmg; e.flash=0.15; particles.push({x:e.x,y:e.y-10,text:`${dmg}`,color:'#4ff',life:0.5,vy:-40}); }
      }
    }
  }
  // 빙결 폭발 (5초 쿨)
  if (player.iceNova > 0) {
    if (!player._iceTimer) player._iceTimer = 0;
    player._iceTimer += dt;
    if (player._iceTimer >= 5) {
      player._iceTimer = 0;
      let dmg = Math.floor(6 * player.iceNova * (player.might||1));
      for (let e of enemies) { if (e.hp>0 && Math.hypot(e.x-player.x,e.y-player.y)<120) { e.hp-=dmg; e.speed*=0.5; e.flash=0.2; } }
      particles.push({x:player.x,y:player.y,text:'❄',color:'#8ef',life:0.5,vy:-10});
    }
  }
  // 독구름 (지속)
  if (player.poisonCloud > 0) {
    for (let e of enemies) {
      if (e.hp<=0) continue;
      if (Math.hypot(e.x-player.x,e.y-player.y) < 70) { e.hp -= player.poisonCloud * dt * 3; }
    }
  }
}

export function draw(ctx) {
  if (phase === 'menu') { drawMenu(ctx, GAME_W, GAME_H); return { camX:0, camY:0 }; }

  let camX = player.x - GAME_W/2;
  let camY = player.y - GAME_H/2;
  camX = Math.max(0, Math.min(MAP_W-GAME_W, camX));
  camY = Math.max(0, Math.min(MAP_H-GAME_H, camY));

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  ctx.save();
  ctx.translate(-camX, -camY);
  drawMap(ctx, camX, camY, GAME_W, GAME_H);
  drawEnemies(ctx);
  drawPlayer(ctx);
  // 회전 구슬 렌더링
  if (player.orbitCount > 0) {
    for (let i = 0; i < player.orbitCount; i++) {
      let angle = (Date.now() * 0.003) + (i / player.orbitCount) * Math.PI * 2;
      let ox = player.x + Math.cos(angle) * 50;
      let oy = player.y + Math.sin(angle) * 50;
      ctx.fillStyle = '#fa0'; ctx.beginPath(); ctx.arc(ox, oy, 6, 0, Math.PI*2); ctx.fill();
    }
  }
  // 독구름 (초록 원)
  if (player.poisonCloud > 0) {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#0f0';
    ctx.beginPath(); ctx.arc(player.x, player.y, 70, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // 가시 (빨간 원 테두리)
  if (player.thorns > 0) {
    ctx.strokeStyle = 'rgba(255,60,60,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI*2); ctx.stroke();
  }
  // 회전 베기 범위
  if (player.spinSlash > 0 && player._spinTimer > 1.8) {
    ctx.globalAlpha = 0.2; ctx.fillStyle = '#ff0';
    ctx.beginPath(); ctx.arc(player.x, player.y, 60*(player.projSize||1), 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // 지면 강타 범위
  if (player.groundSlam > 0 && player._slamTimer > 2.7) {
    ctx.globalAlpha = 0.2; ctx.fillStyle = '#f80';
    ctx.beginPath(); ctx.arc(player.x, player.y, 80*(player.projSize||1), 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // 번개 (파란 선)
  if (player.lightning > 0 && player._lightningTimer > 0.6) {
    for (let e of enemies) {
      if (e.hp>0 && Math.hypot(e.x-player.x, e.y-player.y)<200) {
        ctx.strokeStyle = '#4af'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(e.x, e.y); ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      }
    }
  }
  drawCombat(ctx);
  drawParticles(ctx);
  ctx.restore();

  drawHUD(ctx, GAME_W, GAME_H);
  return { camX, camY };
}
