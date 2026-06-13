// enemy.js - 적 AI: 순찰, 어그로, 추적, 공격
import { rooms, TILE, isWalkableWorld, COLS, ROWS } from './map.js';
import { player } from './player.js';
import { particles } from './particles.js';
import { STAGE_MONSTERS, STAGE_BOSSES } from './defs.js';

export const enemies = [];
export const enemyProjectiles = [];

const AGGRO_RANGE = 240;
const DEAGGRO_RANGE = 360;
const ATK_RANGE = 30;
const ATK_CD = 1.0;

let currentStage = 'forest';
let currentDifficulty = 1;
let bossSpawned = false;
export function setStage(stage, difficulty = 1) {
  currentStage = stage;
  currentDifficulty = Math.max(1, Math.min(5, difficulty));
  bossSpawned = false;
}

let spawnTimer = 0;
function getDifficultyStats(gameTime = 0) {
  let difficultyStep = currentDifficulty - 1;
  let stageStep = currentStage === 'volcano' ? 2 : currentStage === 'dungeon' ? 1 : 0;
  let timeScale = 1 + Math.min(gameTime, 60) / 60 * 0.45;
  return {
    hp: (1 + difficultyStep * 0.28 + stageStep * 0.12) * timeScale,
    atk: 1.45 * (1 + difficultyStep * 0.16 + stageStep * 0.1) * timeScale,
    speed: 1 + difficultyStep * 0.035 + stageStep * 0.025,
    spawnInterval: Math.max(0.8, 2 - difficultyStep * 0.2 - stageStep * 0.08),
    waveCount: 3 + difficultyStep + stageStep,
    maxEnemies: 45 + currentDifficulty * 10,
  };
}

function getMonsterPool(gameTime) {
  let stage = STAGE_MONSTERS[currentStage] || STAGE_MONSTERS.forest;
  if (gameTime >= 40) return [...stage.mid, ...stage.late];
  if (gameTime >= 20) return [...stage.early, ...stage.mid];
  return stage.early;
}

export function spawnEnemies() {
  enemies.length = 0;
  spawnTimer = 0;
  bossSpawned = false;
}

export function spawnBoss() {
  if (bossSpawned) return;
  bossSpawned = true;
  enemies.length = 0;
  enemyProjectiles.length = 0;
  let bossPool = STAGE_BOSSES[currentStage] || STAGE_BOSSES.forest;
  let bossTier = Math.min(2, Math.floor((currentDifficulty - 1) * 3 / 5));
  let bossName = bossPool[bossTier];
  let stats = getDifficultyStats(60);
  let stageScale = currentStage === 'volcano' ? 1.5 : currentStage === 'dungeon' ? 1.25 : 1;
  let sourceFrameSize = Number(bossName.slice(-3)) >= 117 ? 64 : 32;
  let maxHp = Math.round(1000 * stats.hp * stageScale);
  let angle = Math.random() * Math.PI * 2;
  enemies.push({
    x: player.x + Math.cos(angle)*300,
    y: player.y + Math.sin(angle)*300,
    radius: 40, hp: maxHp, maxHp,
    atk: Math.round(20 * stats.atk * stageScale),
    speed: 30 * stats.speed,
    state: 'chase', homeX: 0, homeY: 0,
    patrolTarget: null, atkCooldown: 0, flash: 0,
    color: '#f0f',
    spriteType: `assets/boss-scalefx/${bossName}/sheet.png`,
    animOffset: 0, isBoss: true, bossFrameSize: sourceFrameSize * 2,
  });
}

function spawnWave(gameTime) {
  let stats = getDifficultyStats(gameTime);
  let availableSlots = stats.maxEnemies - enemies.filter(e => e.hp > 0).length;
  let count = Math.min(availableSlots, stats.waveCount + Math.floor(Math.random() * 3));
  let pool = getMonsterPool(gameTime);
  for (let i = 0; i < count; i++) {
    let angle = Math.random() * Math.PI * 2;
    let dist = 550 + Math.random() * 150;
    let ex = player.x + Math.cos(angle) * dist;
    let ey = player.y + Math.sin(angle) * dist;
    if (!isWalkableWorld(ex, ey)) continue;
    let monName = pool[Math.floor(Math.random()*pool.length)];
    // 10% 확률로 엘리트
    let isElite = Math.random() < 0.03;
    enemies.push({
      x: ex, y: ey, radius: isElite ? 28 : 14,
      hp: Math.round((isElite ? 100 : 15 + Math.floor(Math.random()*10)) * stats.hp),
      maxHp: 1,
      atk: Math.round((isElite ? 8 : 3 + Math.floor(Math.random()*2)) * stats.atk),
      speed: (isElite ? 35 : 50 + Math.random()*30) * stats.speed,
      state: 'chase', homeX: ex, homeY: ey,
      patrolTarget: null, atkCooldown: 0, flash: 0,
      color: `hsl(${Math.floor(Math.random()*360)},60%,50%)`,
      spriteType: `assets/monster-scalefx/${monName}/sheet.png`,
      animOffset: Math.floor(Math.random()*4),
      isElite,
    });
    let last = enemies[enemies.length-1];
    last.maxHp = last.hp;
  }
}

export function updateEnemies(dt, gameTime = 0) {
  // 무한 스폰 (보스 나오면 중단)
  if (!bossSpawned) {
    spawnTimer += dt;
    let spawnInterval = getDifficultyStats(gameTime).spawnInterval;
    if (spawnTimer >= spawnInterval) {
      spawnTimer -= spawnInterval;
      spawnWave(gameTime);
    }
  }

  for (let e of enemies) {
    if (e.hp <= 0) continue;
    if (e.flash > 0) e.flash -= dt;
    if (e.atkCooldown > 0) e.atkCooldown -= dt;

    let dx = player.x - e.x, dy = player.y - e.y;
    let dist = Math.hypot(dx, dy);

    if (e.state === 'idle' || e.state === 'patrol') {
      e.state = 'chase';
    } else if (e.state === 'chase') {
      let atkRange = e.atkRange || ATK_RANGE;
      if (dist <= atkRange) { e.state = 'attack'; continue; }
      // 추적 (플레이어 반경 안으로는 못 들어감)
      let step = e.speed * dt;
      let nx = e.x + (dx/dist) * step;
      let ny = e.y + (dy/dist) * step;
      let nextDist = Math.hypot(nx - player.x, ny - player.y);
      if (isWalkableWorld(nx, ny) && nextDist > player.radius + e.radius) { e.x = nx; e.y = ny; }
    } else if (e.state === 'attack') {
      let atkRange = e.atkRange || ATK_RANGE;
      if (dist > atkRange * 1.5) { e.state = 'chase'; continue; }
      if (e.atkCooldown <= 0) {
        if (e.ranged) {
          // 원거리 투사체
          let dx2 = player.x-e.x, dy2 = player.y-e.y, d2 = Math.hypot(dx2,dy2)||1;
          enemyProjectiles.push({ x:e.x, y:e.y, vx:(dx2/d2)*180, vy:(dy2/d2)*180, dmg: e.atk, radius:4, life:1.2, color:'#f88' });
          e.atkCooldown = ATK_CD * 1.5;
        } else {
          let dmg = Math.max(1, e.atk - player.def);
          if (player.shield > 0) { let absorbed = Math.min(player.shield, dmg); player.shield -= absorbed; dmg -= absorbed; }
          player.hp -= dmg;
          player.flash = 0.15;
          e.atkCooldown = ATK_CD;
          particles.push({ x:player.x, y:player.y-20, text:`-${dmg}`, color:'#f44', life:0.8, vy:-40 });
        }
      }
    }
  }

  // 겹침 방지
  for (let i=0; i<enemies.length; i++) {
    if (enemies[i].hp<=0) continue;
    for (let j=i+1; j<enemies.length; j++) {
      if (enemies[j].hp<=0) continue;
      let a=enemies[i], b=enemies[j];
      let dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy);
      let minD=a.radius+b.radius;
      if (d<minD&&d>0) {
        let p=(minD-d)*0.5/d;
        let nax=a.x-dx*p, nay=a.y-dy*p, nbx=b.x+dx*p, nby=b.y+dy*p;
        if (isWalkableWorld(nax,nay)) { a.x=nax; a.y=nay; }
        if (isWalkableWorld(nbx,nby)) { b.x=nbx; b.y=nby; }
      }
    }
  }

  // 적 투사체 업데이트
  for (let i = enemyProjectiles.length-1; i >= 0; i--) {
    let p = enemyProjectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0 || !isWalkableWorld(p.x, p.y)) { enemyProjectiles.splice(i,1); continue; }
    if (Math.hypot(p.x-player.x, p.y-player.y) < player.radius + p.radius) {
      let dmg = Math.max(1, p.dmg - player.def);
      if (player.shield > 0) { let absorbed = Math.min(player.shield, dmg); player.shield -= absorbed; dmg -= absorbed; }
      player.hp -= dmg;
      player.flash = 0.15;
      particles.push({ x:player.x, y:player.y-20, text:`-${dmg}`, color:'#f44', life:0.8, vy:-40 });
      enemyProjectiles.splice(i,1);
    }
  }
}

// 몬스터 스프라이트 (4방향 16x16, 3열x4행 시트)
const spriteCache = {};
function getSprite(path) {
  if (!spriteCache[path]) { let img = new Image(); img.src = path; spriteCache[path] = img; }
  return spriteCache[path];
}
const FRAME_W = 32, FRAME_H = 32;

function dirToRow4(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 2 : 1;
  return dy > 0 ? 0 : 3;
}

export function drawEnemies(ctx) {
  let tick = Math.floor(Date.now() / 180);
  for (let e of enemies) {
    if (e.hp <= 0) continue;
    if (Math.hypot(e.x-player.x, e.y-player.y) > 800) continue;
    ctx.globalAlpha = e.flash > 0 ? 0.5 : 1;

    if (e.spriteType) {
      let img = getSprite(e.spriteType);
      if (img.complete && img.naturalWidth) {
        let dx = player.x - e.x, dy = player.y - e.y;
        let row = (e.state==='chase'||e.state==='attack') ? dirToRow4(dx,dy) : 0;
        let frame = (e.state==='idle') ? 1 : (tick+(e.animOffset||0))%3;
        let fw = e.bossFrameSize || FRAME_W;
        let fh = e.bossFrameSize || FRAME_H;
        let sz = e.isBoss ? 120 : (e.isElite ? 80 : 40);
        ctx.drawImage(img, frame*fw, row*fh, fw, fh, e.x-sz/2, e.y-sz/2, sz, sz);
      } else {
        ctx.fillStyle = e.color;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2); ctx.fill();
      }
    } else {
      ctx.fillStyle = e.color;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2); ctx.fill();
    }

    let bw = e.isBoss ? 48 : 24;
    ctx.fillStyle = '#300'; ctx.fillRect(e.x-bw/2, e.y-e.radius-8, bw, 4);
    ctx.fillStyle = e.isBoss?'#f0f':'#f44'; ctx.fillRect(e.x-bw/2, e.y-e.radius-8, bw*(e.hp/e.maxHp), 4);
    if (e.isBoss) { ctx.fillStyle='#f0f'; ctx.font='bold 10px Maple,sans-serif'; ctx.textAlign='center'; ctx.fillText('BOSS',e.x,e.y-e.radius-12); ctx.textAlign='left'; }
    ctx.globalAlpha = 1;
  }
  for (let p of enemyProjectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
  }
}
