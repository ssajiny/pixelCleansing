// input.js - 뱀서류 입력 (터치 이동 + PC 키보드)
import { player, moveTo, attackTarget } from './player.js';
import { enemies } from './enemy.js';
import { getGameH } from './game.js';
import { toggleFullMap, isFullMapOpen } from './hud.js';

const GAME_W = 540;

// === 조이스틱 (화면 어디서든 터치=이동) ===
const joystick = { active: false, id: -1, cx: 0, cy: 0, dx: 0, dy: 0 };
export function getJoystick() { return joystick; }

export function drawJoystick(ctx) {
  if (!joystick.active) return;
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = 'rgba(30,34,47,0.34)';
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(joystick.cx, joystick.cy, JOY_MAX, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#303646';
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(joystick.cx + joystick.dx, joystick.cy + joystick.dy, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const JOY_MAX = 60;
const touches = {};

export function handleTouchStart(id, gx, gy) {
  if (isFullMapOpen()) { toggleFullMap(); touches[id] = { type: 'none' }; return; }
  joystick.active = true; joystick.id = id;
  joystick.cx = gx; joystick.cy = gy;
  joystick.dx = 0; joystick.dy = 0;
  touches[id] = { type: 'move' };
}

export function handleTouchMove(id, gx, gy) {
  if (touches[id] && touches[id].type === 'move') {
    joystick.dx = gx - joystick.cx;
    joystick.dy = gy - joystick.cy;
    let len = Math.hypot(joystick.dx, joystick.dy);
    if (len > JOY_MAX) { joystick.dx = joystick.dx/len*JOY_MAX; joystick.dy = joystick.dy/len*JOY_MAX; }
  }
}

export function handleTouchEnd(id) {
  if (touches[id]) {
    if (touches[id].type === 'move') { joystick.active = false; joystick.dx = 0; joystick.dy = 0; }
    delete touches[id];
  }
}

// PC 클릭 (전체맵 토글용)
export function handleClick(wx, wy, screenX, screenY) {
  if (isFullMapOpen()) { toggleFullMap(); return; }
}
export function handleRightClick() {}

// 키보드
const keys = {};
export function getKeys() { return keys; }
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// 호환성
export function consumeSkill() { return -1; }
export function getSelectedSkill() { return 0; }
export function getBtnLayout() { return {}; }
