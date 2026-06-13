// combat.js - 투사체 처리
import { player, gainXp, getRandomChoices } from './player.js';
import { enemies } from './enemy.js';
import { particles } from './particles.js';
import { isWalkableWorld } from './map.js';

export const projectiles = [];
export const xpGems = [];
export const chests = [];
export const pickups = []; // { x, y, type: 'magnet'|'heal' }

export function updateCombat(dt) {
  // 투사체 업데이트
  for (let i=projectiles.length-1; i>=0; i--) {
    let p = projectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0 || !isWalkableWorld(p.x, p.y)) { projectiles.splice(i,1); continue; }
    // 적 충돌
    for (let e of enemies) {
      if (e.hp<=0) continue;
      if (p.hitList && p.hitList.has(e)) continue;
      if (Math.hypot(e.x-p.x, e.y-p.y) < e.radius+p.radius) {
        if (p.aoe) {
          for (let t of enemies) {
            if (t.hp<=0) continue;
            if (Math.hypot(t.x-p.x, t.y-p.y) < p.aoe) {
              t.hp -= p.dmg; t.flash = 0.2;
              particles.push({ x:t.x, y:t.y-16, text:`${p.dmg}`, color:'#f80', life:0.7, vy:-50 });
              if (t.hp <= 0) onEnemyDeath(t);
            }
          }
          projectiles.splice(i,1); break;
        } else {
          e.hp -= p.dmg; e.flash = 0.15;
          if (player.lifesteal) player.hp = Math.min(player.maxHp, player.hp + p.dmg * player.lifesteal);
          particles.push({ x:e.x, y:e.y-16, text:`${p.dmg}`, color: p.isCrit?'#ff0':'#fff', life:0.7, vy:-50, big:p.isCrit });
          if (e.hp <= 0) onEnemyDeath(e);
          if (!p.pierce) { projectiles.splice(i,1); break; }
          else { if (!p.hitList) p.hitList = new Set(); p.hitList.add(e); }
        }
      }
    }
  }

  // 보물상자 수집 (접촉 시 스킬 선택)
  for (let i = chests.length-1; i >= 0; i--) {
    let c = chests[i];
    if (Math.hypot(c.x-player.x, c.y-player.y) < 30) {
      chests.splice(i, 1);
      player.levelUpChoices = getRandomChoices(3);
      player.paused = true;
    }
  }

  // 아이템 픽업 (자석/힐)
  for (let i = pickups.length-1; i >= 0; i--) {
    let p = pickups[i];
    if (Math.hypot(p.x-player.x, p.y-player.y) < 25) {
      pickups.splice(i, 1);
      if (p.type === 'magnet') {
        // 모든 경험치 젬을 빨아들이기 시작
        player._magnetPull = true;
        particles.push({x:player.x, y:player.y-20, text:'🧲', color:'#4ff', life:0.6, vy:-30});
      } else if (p.type === 'heal') {
        let heal = Math.floor(player.maxHp * 0.3);
        player.hp = Math.min(player.maxHp, player.hp + heal);
        particles.push({x:player.x, y:player.y-20, text:`+${heal}`, color:'#4f4', life:0.7, vy:-40});
      }
    }
  }

  // 경험치 젬 수집
  let magnetRange = player.magnetRange || 50;
  for (let i = xpGems.length-1; i >= 0; i--) {
    let g = xpGems[i];
    let dx = player.x - g.x, dy = player.y - g.y, d = Math.hypot(dx, dy);
    if (player._magnetPull || d < magnetRange) g.attracted = true;
    if (g.attracted) {
      let baseSpeed = Math.max(420, player.speed * 2.5);
      let speed = player._magnetPull ? baseSpeed * 1.5 : baseSpeed + Math.min(d * 2, 500);
      let step = Math.min(d, speed * dt);
      if (d > 0) {
        g.x += (dx/d) * step;
        g.y += (dy/d) * step;
      }
    }
    if (d < 20) {
      gainXp(g.value);
      xpGems.splice(i, 1);
    }
  }
  // 자석 효과 해제 (젬 다 먹으면)
  if (player._magnetPull && xpGems.length === 0) player._magnetPull = false;
}

function onEnemyDeath(e) {
  if (e.deathCounted) return;
  e.deathCounted = true;
  player.kills = (player.kills || 0) + 1;
  particles.push({ x:e.x, y:e.y, text:'💀', color:'#fff', life:0.5, vy:-30 });
  let xp = 5 + Math.floor(Math.random() * 5);
  xpGems.push({ x: e.x + (Math.random()-0.5)*10, y: e.y + (Math.random()-0.5)*10, value: Math.floor(xp * (player.xpMult||1)) });
  if (e.isElite) { chests.push({ x: e.x, y: e.y }); }
  // 1% 자석, 1% 힐 드랍
  let r = Math.random();
  if (r < 0.01) pickups.push({ x:e.x, y:e.y, type:'magnet' });
  else if (r < 0.02) pickups.push({ x:e.x, y:e.y, type:'heal' });
}

// 스킬 사용
export function useSkill(idx, wx, wy) {
  let sk = player.skills[idx];
  if (!sk || sk.timer > 0 || player.mp < sk.cost) return;

  player.mp -= sk.cost;
  sk.timer = sk.cd;

  if (sk.type === 'melee') {
    for (let e of enemies) {
      if (e.hp<=0) continue;
      if (Math.hypot(e.x-player.x, e.y-player.y) <= sk.range) {
        e.hp -= sk.dmg; e.flash = 0.2;
        particles.push({ x:e.x, y:e.y-16, text:`${sk.dmg}`, color:'#f80', life:0.8, vy:-50 });
        if (e.hp <= 0) onEnemyDeath(e);
      }
    }
    particles.push({ x:player.x, y:player.y, text:'⚔', color:'#ff0', life:0.4, vy:-20 });
  } else if (sk.type === 'ranged') {
    let dx = wx-player.x, dy = wy-player.y, d = Math.hypot(dx,dy)||1;
    projectiles.push({
      x:player.x, y:player.y,
      vx:(dx/d)*sk.speed, vy:(dy/d)*sk.speed,
      dmg: sk.dmg, radius: 8, life: 1.5, color:'#4ff', pierce: sk.pierce||false
    });
  } else if (sk.type === 'aoe') {
    let dx = wx-player.x, dy = wy-player.y, d = Math.hypot(dx,dy)||1;
    projectiles.push({
      x:player.x, y:player.y,
      vx:(dx/d)*sk.speed, vy:(dy/d)*sk.speed,
      dmg: sk.dmg, radius: 10, life: 1.2, color:'#f80', aoe: sk.aoeRadius||50
    });
  }
}

export function drawCombat(ctx) {
  for (let p of projectiles) {
    ctx.fillStyle = p.color || '#fa0';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
  }
  // 경험치 젬
  ctx.fillStyle = '#4ef';
  for (let g of xpGems) {
    ctx.beginPath(); ctx.moveTo(g.x, g.y-5); ctx.lineTo(g.x+4, g.y); ctx.lineTo(g.x, g.y+5); ctx.lineTo(g.x-4, g.y); ctx.closePath(); ctx.fill();
  }
  // 보물상자
  for (let c of chests) {
    ctx.fillStyle = '#fd0'; ctx.fillRect(c.x-8, c.y-6, 16, 12);
    ctx.strokeStyle = '#a80'; ctx.lineWidth = 1.5; ctx.strokeRect(c.x-8, c.y-6, 16, 12);
    ctx.fillStyle = '#a80'; ctx.fillRect(c.x-2, c.y-2, 4, 4);
  }
  // 픽업 아이템
  for (let p of pickups) {
    if (p.type === 'magnet') {
      ctx.fillStyle = '#4ff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🧲', p.x, p.y+5); ctx.textAlign = 'left';
    } else if (p.type === 'heal') {
      ctx.fillStyle = '#4f4'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('💚', p.x, p.y+5); ctx.textAlign = 'left';
    }
  }
}
