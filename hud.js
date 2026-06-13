import { player, selectChoice } from './player.js';
import { getGameTime, isGameOver, goToMenu } from './game.js';

let showStats = localStorage.getItem('showStats') === 'true';
let paused = false;

const HUD = {
  pause: { size: 54, right: 14, y: 18 },
  status: { x: 14, y: 16, w: 258, h: 82 },
  counter: { x: 286, y: 26, w: 172, h: 38 },
};

export function toggleStats() {
  showStats = !showStats;
  localStorage.setItem('showStats', showStats);
}
export function isStatsOpen() { return showStats; }
export function togglePause() {
  paused = !paused;
  player.paused = paused;
}
export function isPaused() { return paused; }

export function handleHudButtonClick(x, y, W = 540) {
  let pauseX = W - HUD.pause.right - HUD.pause.size;
  if (hit(x, y, pauseX, HUD.pause.y, HUD.pause.size, HUD.pause.size)) {
    togglePause();
    return true;
  }
  if (hit(x, y, HUD.status.x, HUD.status.y, HUD.status.w, HUD.status.h)) {
    toggleStats();
    return true;
  }
  return false;
}

function roundedRect(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(radius, w / 2, h / 2));
}

function panel(ctx, x, y, w, h, radius, fill, stroke = '#111', lineWidth = 3) {
  roundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function outlinedText(ctx, text, x, y, fill = '#fff', stroke = '#101018', width = 5) {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function drawPauseIcon(ctx, W) {
  let size = HUD.pause.size;
  let x = W - HUD.pause.right - size;
  let y = HUD.pause.y;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#16242e';
  ctx.fill();
  ctx.strokeStyle = '#64efd0';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#eafffa';
  ctx.fillRect(x + 17, y + 15, 7, 24);
  ctx.fillRect(x + 30, y + 15, 7, 24);
}

function drawCounter(ctx, W) {
  let x = HUD.counter.x;
  let y = HUD.counter.y;
  let chipW = 80;
  let values = [
    { label:'G', value:Math.floor(player.gold || 0), color:'#ffd34d' },
    { label:'K', value:player.kills || 0, color:'#ff7185' },
  ];
  values.forEach((item, index) => {
    let chipX = x + index * (chipW + 8);
    panel(ctx, chipX, y, chipW, HUD.counter.h, 18, 'rgba(13,22,31,0.9)', item.color, 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = item.color;
    ctx.font = 'bold 12px Maple,sans-serif';
    ctx.fillText(item.label, chipX + 17, y + 24);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Maple,sans-serif';
    ctx.fillText(String(item.value), chipX + 52, y + 24);
  });
}

function drawTopHud(ctx, W) {
  let t = Math.floor(getGameTime());
  let min = String(Math.floor(t / 60)).padStart(2, '0');
  let sec = String(t % 60).padStart(2, '0');
  let pct = Math.max(0, Math.min(1, player.xp / player.xpToNext));

  let { x, y, w, h } = HUD.status;
  panel(ctx, x, y, w, h, 12, 'rgba(10,24,32,0.92)', '#51d9bf', 3);
  ctx.fillStyle = '#51d9bf';
  ctx.beginPath();
  ctx.moveTo(x, y + 18);
  ctx.lineTo(x - 7, y + 30);
  ctx.lineTo(x, y + 42);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.font = 'bold 13px Maple,sans-serif';
  ctx.fillStyle = '#72f0d4';
  ctx.fillText(`LEVEL ${player.level}`, x + 18, y + 23);
  ctx.font = 'bold 30px Maple,sans-serif';
  outlinedText(ctx, `${min}:${sec}`, x + 17, y + 57, '#fff', '#081014', 5);

  let barX = x + 112;
  let barY = y + 49;
  let barW = w - 130;
  ctx.fillStyle = '#24333d';
  ctx.fillRect(barX, barY, barW, 11);
  ctx.fillStyle = '#19e583';
  ctx.fillRect(barX, barY, barW * pct, 11);
  ctx.font = 'bold 9px Maple,sans-serif';
  ctx.fillStyle = '#b9c8d0';
  ctx.fillText(`${Math.floor(player.xp)} / ${player.xpToNext}`, barX, barY - 7);

  drawCounter(ctx, W);
  drawPauseIcon(ctx, W);
}

function drawStatsPanel(ctx) {
  panel(ctx, 12, 145, 210, 226, 4, 'rgba(37,41,54,0.94)', '#11131a', 3);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Maple,sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('현재 능력치', 28, 170);
  ctx.font = '12px Maple,sans-serif';
  let rows = [
    `HP  ${Math.ceil(player.hp)} / ${player.maxHp}`,
    `공격력  ${player.atk}`,
    `방어력  ${player.def}`,
    `이동속도  ${Math.floor(player.speed)}`,
    `공격 주기  ${player.atkSpeed.toFixed(2)}초`,
    `공격 범위  ${player.atkRange}`,
    `투사체  ${player.projCount || 1}`,
    `자석 범위  ${player.magnetRange || 50}`,
    `경험치  x${(player.xpMult || 1).toFixed(2)}`,
    `치명타  ${player.critChance || 15}%`,
  ];
  rows.forEach((row, index) => ctx.fillText(row, 28, 195 + index * 17));
}

function choiceLayout(W, H, count) {
  let x = 20;
  let gap = 12;
  let cardW = W - 40;
  let startY = Math.max(405, Math.floor(H * 0.42));
  let cardH = Math.min(126, Math.floor((H - startY - 64 - gap * (count - 1)) / count));
  return { x, gap, cardW, cardH, startY };
}

const RARITY_COLORS = {
  normal: '#9aa3b5',
  rare: '#47a9ff',
  epic: '#b56cff',
  legendary: '#ff9f1c',
};

function drawLoadoutSlots(ctx, W, y) {
  let slotSize = 36;
  let gap = 8;
  let rowWidth = slotSize * 6 + gap * 5;
  let startX = (W - rowWidth) / 2;
  let groups = [
    { label:'공격 스킬', items:player.acquired.filter(item => item.isWeapon), color:'#ffb829' },
    { label:'버프', items:player.acquired.filter(item => !item.isWeapon), color:'#34d99a' },
  ];

  for (let row = 0; row < groups.length; row++) {
    let group = groups[row];
    let rowY = y + row * 47;
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px Maple,sans-serif';
    ctx.fillStyle = group.color;
    ctx.fillText(`${group.label} ${group.items.length}/6`, W / 2, rowY);
    for (let index = 0; index < 6; index++) {
      let item = group.items[index];
      let x = startX + index * (slotSize + gap);
      let slotY = rowY + 6;
      ctx.fillStyle = item ? '#313747' : 'rgba(21,25,35,0.82)';
      ctx.fillRect(x, slotY, slotSize, slotSize);
      ctx.strokeStyle = item ? RARITY_COLORS[item.rarity || 'normal'] : '#596172';
      ctx.lineWidth = item ? 3 : 2;
      ctx.strokeRect(x, slotY, slotSize, slotSize);
      if (!item) continue;

      ctx.textAlign = 'center';
      ctx.fillStyle = RARITY_COLORS[item.rarity || 'normal'];
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(skillGlyph(item), x + slotSize / 2, slotY + 21);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px Maple,sans-serif';
      ctx.fillText(`Lv.${item.count}`, x + slotSize / 2, slotY + 33);
    }
  }
}

function skillGlyph(choice) {
  return { stat: '+', weapon: 'A', melee: 'M', special: 'S' }[choice.type] || '+';
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  let words = String(text || '').split(' ');
  let line = '';
  let lines = [];
  for (let word of words) {
    let next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
}

function drawLevelUp(ctx, W, H) {
  ctx.fillStyle = 'rgba(4,12,18,0.84)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#50e1c2';
  ctx.fillRect(0, 164, 8, 154);
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px Maple,sans-serif';
  ctx.fillStyle = '#50e1c2';
  ctx.fillText('CLEANSING SIGNAL', 24, 184);
  ctx.font = 'bold 28px Maple,sans-serif';
  outlinedText(ctx, '정화 능력 선택', 22, 219, '#fff', '#081118', 6);
  ctx.font = '12px Maple,sans-serif';
  ctx.fillStyle = '#a9bbc5';
  ctx.fillText('이번 성장에 적용할 신호를 하나 선택하세요', 24, 244);
  drawLoadoutSlots(ctx, W, 270);

  let choices = player.levelUpChoices;
  let layout = choiceLayout(W, H, choices.length);

  for (let i = 0; i < choices.length; i++) {
    let choice = choices[i];
    let x = layout.x;
    let y = layout.startY + i * (layout.cardH + layout.gap);
    let acq = player.acquired.find(item => item.id === choice.id);
    let level = (acq ? acq.count : 0) + 1;
    let accent = RARITY_COLORS[choice.rarity || 'normal'];

    panel(ctx, x, y, layout.cardW, layout.cardH, 10, 'rgba(32,43,55,0.97)', '#0a1118', 4);
    ctx.fillStyle = accent;
    ctx.fillRect(x, y, 9, layout.cardH);

    let iconX = x + 54;
    let iconY = y + layout.cardH / 2;
    ctx.beginPath();
    ctx.arc(iconX, iconY, 31, 0, Math.PI * 2);
    ctx.fillStyle = '#e7eef0';
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = accent;
    ctx.fillText(skillGlyph(choice), iconX, iconY + 10);

    let textX = x + 98;
    ctx.textAlign = 'left';
    ctx.font = 'bold 10px Maple,sans-serif';
    ctx.fillStyle = accent;
    ctx.fillText(`${choice.rarityLabel || '노말'} · ${choice.effectLabel || '효과 x1'}`, textX, y + 24);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${choice.name.length > 13 ? 14 : 17}px Maple,sans-serif`;
    ctx.fillText(choice.name, textX, y + 51);
    ctx.fillStyle = '#b7c3cc';
    ctx.font = '11px Maple,sans-serif';
    wrapText(ctx, choice.rolledDesc || choice.desc, textX, y + 75, layout.cardW - 190, 16, 2);

    let badgeX = x + layout.cardW - 62;
    ctx.beginPath();
    ctx.arc(badgeX, iconY, 25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8,15,22,0.75)';
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Maple,sans-serif';
    ctx.fillText('LV', badgeX, iconY - 3);
    ctx.font = 'bold 14px Maple,sans-serif';
    ctx.fillText(String(level), badgeX, iconY + 14);
  }
}

function actionButton(ctx, x, y, w, h, text, color) {
  panel(ctx, x, y, w, h, 6, color, '#11131a', 4);
  ctx.textAlign = 'center';
  ctx.font = 'bold 17px Maple,sans-serif';
  outlinedText(ctx, text, x + w / 2, y + 37, '#fff', '#20222b', 4);
}

function drawPauseMenu(ctx, W, H) {
  ctx.fillStyle = 'rgba(5,7,13,0.76)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px Maple,sans-serif';
  outlinedText(ctx, '일시정지', W / 2, 180, '#fff', '#11131a', 6);

  panel(ctx, 18, 205, W - 36, 390, 8, 'rgba(32,37,51,0.96)', '#11131a', 4);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#6ce8c6';
  ctx.font = 'bold 15px Maple,sans-serif';
  ctx.fillText('현재 능력치', 38, 235);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Maple,sans-serif';
  let leftStats = [
    `HP  ${Math.ceil(player.hp)} / ${player.maxHp}`,
    `공격력  ${player.atk}`,
    `방어력  ${player.def}`,
    `이동속도  ${Math.floor(player.speed)}`,
    `공격 주기  ${player.atkSpeed.toFixed(2)}초`,
  ];
  let rightStats = [
    `공격 범위  ${player.atkRange}`,
    `투사체  ${player.projCount || 1}`,
    `치명타  ${player.critChance || 15}%`,
    `자석 범위  ${player.magnetRange || 50}`,
    `경험치  x${(player.xpMult || 1).toFixed(2)}`,
  ];
  leftStats.forEach((value, index) => ctx.fillText(value, 38, 262 + index * 22));
  rightStats.forEach((value, index) => ctx.fillText(value, W / 2 + 10, 262 + index * 22));
  drawLoadoutSlots(ctx, W, 392);

  actionButton(ctx, W / 2 - 105, H * 0.68, 210, 58, '계속하기', '#18ca78');
  actionButton(ctx, W / 2 - 105, H * 0.79, 210, 58, '메뉴로', '#e45151');
}

export function drawHUD(ctx, W, H) {
  drawTopHud(ctx, W);
  if (showStats && !player.levelUpChoices && !paused) drawStatsPanel(ctx);
  if (paused && !player.levelUpChoices && !isGameOver()) drawPauseMenu(ctx, W, H);

  if (isGameOver()) {
    ctx.fillStyle = 'rgba(5,7,13,0.82)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Maple,sans-serif';
    outlinedText(ctx, 'GAME OVER', W / 2, H * 0.36, '#ff6464', '#11131a', 6);
    ctx.font = 'bold 15px Maple,sans-serif';
    outlinedText(ctx, `처치 ${player.kills || 0} · 골드 ${player.gold || 0}`, W / 2, H * 0.44);
    actionButton(ctx, W / 2 - 90, H * 0.54, 180, 58, '메뉴로', '#e45151');
  }

  if (player.levelUpChoices) drawLevelUp(ctx, W, H);
  ctx.textAlign = 'left';
}

export function handleLevelUpClick(gx, gy, W, H) {
  if (paused && !player.levelUpChoices && !isGameOver()) {
    if (hit(gx, gy, W / 2 - 105, H * 0.68, 210, 58)) {
      togglePause();
      return true;
    }
    if (hit(gx, gy, W / 2 - 105, H * 0.79, 210, 58)) {
      togglePause();
      goToMenu();
      return true;
    }
    return true;
  }

  if (isGameOver()) {
    if (hit(gx, gy, W / 2 - 90, H * 0.54, 180, 58)) goToMenu();
    return true;
  }

  if (!player.levelUpChoices) return false;
  let choices = player.levelUpChoices;
  let layout = choiceLayout(W, H, choices.length);
  for (let i = 0; i < choices.length; i++) {
    let y = layout.startY + i * (layout.cardH + layout.gap);
    if (hit(gx, gy, layout.x, y, layout.cardW, layout.cardH)) {
      selectChoice(i);
      paused = false;
      return true;
    }
  }
  return true;
}

let showFullMap = false;
export function toggleFullMap() { showFullMap = !showFullMap; }
export function isFullMapOpen() { return showFullMap; }

function hit(px, py, x, y, w, h) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}
