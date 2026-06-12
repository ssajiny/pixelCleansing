// hud.js - 뱀서류 HUD
import { player, selectChoice } from './player.js';
import { getGameTime, isGameOver, restartGame, goToMenu } from './game.js';

let showStats = localStorage.getItem('showStats') === 'true';
export function toggleStats() { showStats = !showStats; localStorage.setItem('showStats', showStats); }
export function isStatsOpen() { return showStats; }

let paused = false;
export function togglePause() { paused = !paused; player.paused = paused; }
export function isPaused() { return paused; }

export function drawHUD(ctx, W, H) {
  // === 경험치 바 (최상단) ===
  let xpPct = player.xp / player.xpToNext;
  ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, 8);
  ctx.fillStyle = '#4af'; ctx.fillRect(0, 0, W * xpPct, 8);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Maple,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`Lv.${player.level}`, W/2, 7);

  // === 시간 ===
  let t = Math.floor(getGameTime());
  let min = Math.floor(t/60), sec = t%60;
  ctx.font = 'bold 12px Maple,sans-serif';
  ctx.fillText(`${min}:${sec.toString().padStart(2,'0')}`, W/2, 22);
  ctx.textAlign = 'left';

  // === 일시정지 팝업 ===
  if (paused && !player.levelUpChoices && !isGameOver()) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Maple,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('일시정지', W/2, H*0.3);
    // 재개 버튼
    let bw = 160, bh = 50;
    ctx.fillStyle = '#336'; ctx.fillRect(W/2-bw/2, H*0.42, bw, bh);
    ctx.strokeStyle = '#6af'; ctx.lineWidth = 2; ctx.strokeRect(W/2-bw/2, H*0.42, bw, bh);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Maple,sans-serif';
    ctx.fillText('재개', W/2, H*0.42+bh/2+5);
    // 종료 버튼
    ctx.fillStyle = '#444'; ctx.fillRect(W/2-bw/2, H*0.58, bw, bh);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.strokeRect(W/2-bw/2, H*0.58, bw, bh);
    ctx.fillStyle = '#fff'; ctx.fillText('종료', W/2, H*0.58+bh/2+5);
    ctx.textAlign = 'left';
  }

  // === 좌상단 스탯 버튼 ===
  ctx.fillStyle = 'rgba(40,40,60,0.7)';
  ctx.fillRect(8, 14, 36, 20);
  ctx.fillStyle = '#ccc'; ctx.font = '9px Maple,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('STAT', 26, 27);
  // === 일시정지 버튼 (STAT 옆) ===
  ctx.fillStyle = 'rgba(40,40,60,0.7)';
  ctx.fillRect(48, 14, 30, 20);
  ctx.fillStyle = '#ccc'; ctx.font = '9px Maple,sans-serif';
  ctx.fillText('정지', 63, 27);
  ctx.textAlign = 'left';

  // === 스탯 패널 ===
  if (showStats) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(8, 38, 160, 200);
    ctx.fillStyle = '#ddd'; ctx.font = '9px Maple,sans-serif';
    let sy = 52, gap = 14;
    const stats = [
      `HP: ${Math.ceil(player.hp)}/${player.maxHp}`,
      `ATK: ${player.atk} (x${(player.might||1).toFixed(2)})`,
      `DEF: ${player.def}`,
      `속도: ${Math.floor(player.speed)}`,
      `공속: ${player.atkSpeed.toFixed(2)}s`,
      `사거리: ${player.atkRange}`,
      `투사체: ${player.projCount||1}`,
      `관통: ${player.pierce?'O':'X'}`,
      `폭발: ${player.aoe||0}`,
      `재생: ${player.regen||0}/s`,
      `자석: ${player.magnetRange||50}`,
      `성장: x${(player.xpMult||1).toFixed(2)}`,
      `부활: ${player.revive||0}`,
    ];
    for (let s of stats) { ctx.fillText(s, 14, sy); sy += gap; }
  }
  let weapons = player.acquired.filter(a=>a.isWeapon);
  let buffs = player.acquired.filter(a=>!a.isWeapon);
  let slotSize = 20, slotGap = 3, sx = W - 10;
  // 무기 (상단 줄)
  ctx.font = '8px Maple,sans-serif';
  for (let i = 0; i < 5; i++) {
    let x = sx - (5-i)*(slotSize+slotGap);
    ctx.fillStyle = weapons[i] ? '#3355aa' : '#222';
    ctx.fillRect(x, 12, slotSize, slotSize);
    ctx.strokeStyle = '#556'; ctx.lineWidth = 0.5; ctx.strokeRect(x, 12, slotSize, slotSize);
    if (weapons[i]) { ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.fillText(weapons[i].count, x+slotSize/2, 28); ctx.textAlign='left'; }
  }
  // 버프 (두번째 줄)
  for (let i = 0; i < 5; i++) {
    let x = sx - (5-i)*(slotSize+slotGap);
    ctx.fillStyle = buffs[i] ? '#336633' : '#222';
    ctx.fillRect(x, 12+slotSize+slotGap, slotSize, slotSize);
    ctx.strokeStyle = '#556'; ctx.lineWidth = 0.5; ctx.strokeRect(x, 12+slotSize+slotGap, slotSize, slotSize);
    if (buffs[i]) { ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.fillText(buffs[i].count, x+slotSize/2, 12+slotSize+slotGap+15); ctx.textAlign='left'; }
  }
  ctx.textAlign = 'left';
  if (isGameOver()) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f44'; ctx.font = 'bold 22px Maple,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W/2, H*0.35);
    ctx.fillStyle = '#fd0'; ctx.font = '14px Maple,sans-serif';
    ctx.fillText(`획득 골드: ${player.gold || 0}`, W/2, H*0.45);
    // 종료 버튼
    let bw = 140, bh = 50, bx = W/2-bw/2, by = H*0.55;
    ctx.fillStyle = '#444'; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Maple,sans-serif';
    ctx.fillText('종료', W/2, by+bh/2+5);
    ctx.textAlign = 'left';
  }

  // === 레벨업 선택지 ===
  if (player.levelUpChoices) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Maple,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('레벨 업!', W/2, H*0.06);
    ctx.font = '11px Maple,sans-serif'; ctx.fillStyle = '#aaa';
    ctx.fillText('스킬을 선택하세요', W/2, H*0.06+20);

    let choices = player.levelUpChoices;
    // 스킬 설명 영역 (상단 3/4)
    let descH = H * 0.65;
    let descY = H * 0.12;
    let cw = Math.floor(W * 0.28), gap = 15;
    let totalW = choices.length * cw + (choices.length-1) * gap;
    let startX = (W - totalW) / 2;

    for (let i = 0; i < choices.length; i++) {
      let cx = startX + i * (cw + gap);
      // 설명 박스
      ctx.fillStyle = '#1e1e3a';
      ctx.fillRect(cx, descY, cw, descH);
      ctx.strokeStyle = '#6af'; ctx.lineWidth = 2;
      ctx.strokeRect(cx, descY, cw, descH);
      // 스킬 이름
      let acq = player.acquired.find(a=>a.id===choices[i].id);
      let curLv = acq ? acq.count : 0;
      // 등급 배경색
      let rarity = choices[i].rarity || 'normal';
      let rarityColors = { normal:'#1e1e3a', rare:'#1a2a4a', epic:'#2a1a4a', legendary:'#3a2a0a' };
      let rarityBorder = { normal:'#6af', rare:'#4af', epic:'#a4f', legendary:'#fa0' };
      ctx.fillStyle = rarityColors[rarity] || '#1e1e3a';
      ctx.fillRect(cx, descY, cw, descH);
      ctx.strokeStyle = rarityBorder[rarity] || '#6af'; ctx.lineWidth = 2;
      ctx.strokeRect(cx, descY, cw, descH);
      // 아이콘 자리 (큰 네모)
      let iconSize = cw * 0.4;
      let iconX = cx + (cw - iconSize)/2, iconY = descY + 30;
      // 등급 텍스트 (아이콘 위)
      let rarityLabel = { normal:'NORMAL', rare:'RARE', epic:'EPIC', legendary:'LEGEND' };
      ctx.fillStyle = rarityBorder[rarity]; ctx.font = 'bold 11px Maple,sans-serif';
      ctx.fillText(rarityLabel[rarity]||'NORMAL', cx + cw/2, iconY - 6);
      ctx.fillStyle = '#111'; ctx.fillRect(iconX, iconY, iconSize, iconSize);
      ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.strokeRect(iconX, iconY, iconSize, iconSize);
      // 이름 (수치 없이)
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Maple,sans-serif';
      ctx.fillText(choices[i].name.replace(/[\s]?[+\-].*/, ''), cx + cw/2, iconY + iconSize + 20);
      // 레벨
      ctx.fillStyle = '#fd0'; ctx.font = '10px Maple,sans-serif';
      ctx.fillText(`Lv.${curLv+1}`, cx + cw/2, iconY + iconSize + 36);
      // 설명 (수치 포함)
      ctx.fillStyle = '#aaa'; ctx.font = '9px Maple,sans-serif';
      ctx.fillText(choices[i].desc || '', cx + cw/2, iconY + iconSize + 52);
    }

    // 선택 버튼 (하단, 각 설명 아래 붙어서)
    let btnH = 44, btnY = descY + descH + 10;
    for (let i = 0; i < choices.length; i++) {
      let cx = startX + i * (cw + gap);
      ctx.fillStyle = '#3355aa';
      ctx.fillRect(cx, btnY, cw, btnH);
      ctx.strokeStyle = '#8af'; ctx.lineWidth = 1.5;
      ctx.strokeRect(cx, btnY, cw, btnH);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Maple,sans-serif';
      ctx.fillText('선택', cx + cw/2, btnY + btnH/2 + 5);
    }
    ctx.textAlign = 'left';
  }
}

// 클릭 처리 (레벨업 선택 + 게임오버 재시작)
export function handleLevelUpClick(gx, gy, W, H) {
  // 일시정지 팝업
  if (paused && !player.levelUpChoices && !isGameOver()) {
    let bw = 160, bh = 50;
    if (hitBtn2(gx, gy, W/2-bw/2, H*0.42, bw, bh)) { togglePause(); return true; }
    if (hitBtn2(gx, gy, W/2-bw/2, H*0.58, bw, bh)) { togglePause(); goToMenu(); return true; }
    return true;
  }
  // 게임오버 재시작
  if (isGameOver()) {
    let bw = 140, bh = 50, bx = W/2-bw/2, by = H*0.55;
    if (gx >= bx && gx <= bx+bw && gy >= by && gy <= by+bh) { goToMenu(); return true; }
    return true;
  }
  // 레벨업 선택
  if (!player.levelUpChoices) return false;
  let choices = player.levelUpChoices;
  let cw = Math.floor(W * 0.28), gap = 15;
  let totalW = choices.length * cw + (choices.length-1) * gap;
  let startX = (W - totalW) / 2;
  let descH = H * 0.65, descY = H * 0.12;
  let btnH = 44, btnY = descY + descH + 10;

  for (let i = 0; i < choices.length; i++) {
    let cx = startX + i * (cw + gap);
    if (gx >= cx && gx <= cx+cw && gy >= btnY && gy <= btnY+btnH) {
      selectChoice(i);
      return true;
    }
  }
  return false;
}

// 호환성
let showFullMap = false;
export function toggleFullMap() { showFullMap = !showFullMap; }
export function isFullMapOpen() { return showFullMap; }

function hitBtn2(gx, gy, x, y, w, h) { return gx>=x && gx<=x+w && gy>=y && gy<=y+h; }
