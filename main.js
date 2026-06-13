// main.js - 진입점 (세로 고정 폭, 높이 동적)
import { startGame, update, draw, GAME_W, setGameH, getGameH, isGameOver, getPhase, handleMenuInput, goToMenu } from './game.js';
import { handleClick, handleRightClick, handleTouchStart, handleTouchMove, handleTouchEnd, drawJoystick } from './input.js';
import { handleHudButtonClick, handleLevelUpClick } from './hud.js';
import { player } from './player.js';
import { scrollCollection } from './menu.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

let scale = 1;

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  // 세로 화면의 폭을 기준으로 스케일하고 높이는 기기 비율에 맞춘다.
  scale = canvas.width / GAME_W;
  let gameH = Math.round(canvas.height / scale);
  setGameH(gameH);
}
resize();
addEventListener('resize', resize);

function toGame(ex, ey) { return { x: ex / scale, y: ey / scale }; }

let cam = { camX: 0, camY: 0 };
const menuTouchY = new Map();

function handleHudButton(p) {
  if (getPhase() !== 'playing') return false;
  return handleHudButtonClick(p.x, p.y, GAME_W);
}

canvas.addEventListener('click', e => {
  let p = toGame(e.clientX, e.clientY);
  if (getPhase() === 'menu') { handleMenuInput(p.x, p.y); return; }
  if ((player.paused || isGameOver()) && handleLevelUpClick(p.x, p.y, GAME_W, getGameH())) return;
  if (handleHudButton(p)) return;
  handleClick(p.x + cam.camX, p.y + cam.camY, p.x, p.y);
});
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  let p = toGame(e.clientX, e.clientY);
  handleRightClick(p.x + cam.camX, p.y + cam.camY);
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  for (let t of e.changedTouches) {
    let p = toGame(t.clientX, t.clientY);
    if (getPhase() === 'menu') {
      menuTouchY.set(t.identifier, t.clientY);
      handleMenuInput(p.x, p.y);
      continue;
    }
    if ((player.paused || isGameOver()) && handleLevelUpClick(p.x, p.y, GAME_W, getGameH())) continue;
    if (handleHudButton(p)) continue;
    handleTouchStart(t.identifier, p.x, p.y);
  }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  for (let t of e.changedTouches) {
    let p = toGame(t.clientX, t.clientY);
    if (getPhase() === 'menu') {
      let previousY = menuTouchY.get(t.identifier) ?? t.clientY;
      scrollCollection((previousY - t.clientY) / scale);
      menuTouchY.set(t.identifier, t.clientY);
      continue;
    }
    handleTouchMove(t.identifier, p.x, p.y);
  }
}, { passive: false });
canvas.addEventListener('touchend', e => {
  for (let t of e.changedTouches) {
    menuTouchY.delete(t.identifier);
    handleTouchEnd(t.identifier);
  }
});
canvas.addEventListener('wheel', e => { if (getPhase()==='menu') { scrollCollection(e.deltaY > 0 ? 20 : -20); e.preventDefault(); } }, { passive:false });

let lastTime = performance.now();
function loop(now) {
  let dt = Math.min(50, now - lastTime) / 1000;
  lastTime = now;
  update(dt);
  ctx.save();
  ctx.scale(scale, scale);
  cam = draw(ctx);
  if (getPhase() === 'playing' && !player.paused && !isGameOver()) drawJoystick(ctx);
  ctx.restore();
  requestAnimationFrame(loop);
}
document.fonts.ready.then(() => requestAnimationFrame(loop));
