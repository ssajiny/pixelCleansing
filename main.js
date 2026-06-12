// main.js - 진입점 (가로 고정, 높이 동적 = 항상 꽉 참)
import { startGame, update, draw, GAME_W, setGameH, getGameH, isGameOver, getPhase, handleMenuInput, goToMenu } from './game.js';
import { handleClick, handleRightClick, handleTouchStart, handleTouchMove, handleTouchEnd } from './input.js';
import { handleLevelUpClick, toggleStats, isStatsOpen, togglePause, isPaused } from './hud.js';
import { player } from './player.js';
import { scrollCollection } from './menu.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

let scale = 1;

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  // 가로 기준으로 스케일, 높이는 화면 비율에 맞춤
  scale = canvas.width / GAME_W;
  let gameH = Math.round(canvas.height / scale);
  setGameH(gameH);
}
resize();
addEventListener('resize', resize);

function toGame(ex, ey) { return { x: ex / scale, y: ey / scale }; }

let cam = { camX: 0, camY: 0 };

canvas.addEventListener('click', e => {
  let p = toGame(e.clientX, e.clientY);
  if (getPhase() === 'menu') { handleMenuInput(p.x, p.y); return; }
  if ((player.paused || isGameOver()) && handleLevelUpClick(p.x, p.y, GAME_W, getGameH())) return;
  // 일시정지 버튼 (STAT 옆 48,14,28,20)
  if (getPhase()==='playing' && p.x>=48 && p.x<=78 && p.y>=14 && p.y<=34) { togglePause(); return; }
  // 스탯 버튼 (좌상단 8,14,36,20)
  if (getPhase()==='playing' && p.x>=8 && p.x<=44 && p.y>=14 && p.y<=34) { toggleStats(); return; }
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
    if (getPhase() === 'menu') { handleMenuInput(p.x, p.y); continue; }
    if ((player.paused || isGameOver()) && handleLevelUpClick(p.x, p.y, GAME_W, getGameH())) continue;
    handleTouchStart(t.identifier, p.x, p.y);
  }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  for (let t of e.changedTouches) {
    let p = toGame(t.clientX, t.clientY);
    if (getPhase() === 'menu') { scrollCollection(e.changedTouches[0].clientY > 0 ? 3 : -3); }
    handleTouchMove(t.identifier, p.x, p.y);
  }
}, { passive: false });
canvas.addEventListener('touchend', e => {
  for (let t of e.changedTouches) handleTouchEnd(t.identifier);
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
  ctx.restore();
  requestAnimationFrame(loop);
}
document.fonts.ready.then(() => requestAnimationFrame(loop));
