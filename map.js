// map.js - 사각형 맵 (뱀서류)
export const TILE = 32;
export let COLS = 200;
export let ROWS = 200;
export let MAP_W = COLS * TILE;
export let MAP_H = ROWS * TILE;

// 0=벽, 1=바닥
export let grid = [];
export let rooms = [];

export function generateMap() {
  MAP_W = COLS * TILE;
  MAP_H = ROWS * TILE;
  grid = Array.from({ length: ROWS }, () => new Uint8Array(COLS));

  // 전체 바닥으로 채우고 테두리만 벽
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r < 2 || r >= ROWS-2 || c < 2 || c >= COLS-2) grid[r][c] = 0;
      else grid[r][c] = 1;
    }
  }

  // 랜덤 기둥 (2x2 ~ 3x3) 15~25개
  let count = 40 + Math.floor(Math.random() * 20);
  for (let i = 0; i < count; i++) {
    let ps = 2 + Math.floor(Math.random() * 2);
    let px = 5 + Math.floor(Math.random() * (COLS - 10 - ps));
    let py = 5 + Math.floor(Math.random() * (ROWS - 10 - ps));
    // 중앙 근처는 피하기 (스폰 지역)
    if (Math.abs(px - COLS/2) < 5 && Math.abs(py - ROWS/2) < 5) continue;
    for (let dy = 0; dy < ps; dy++)
      for (let dx = 0; dx < ps; dx++)
        grid[py+dy][px+dx] = 0;
  }

  rooms = [{ x:2, y:2, w:COLS-4, h:ROWS-4 }];
}

export function getSpawn() {
  return { x: (COLS/2) * TILE, y: (ROWS/2) * TILE };
}

export function isWalkable(col, row) {
  if (col<0||col>=COLS||row<0||row>=ROWS) return false;
  return grid[row][col] === 1;
}

export function isWalkableWorld(x, y) {
  return isWalkable(Math.floor(x/TILE), Math.floor(y/TILE));
}

export function drawMap(ctx, camX, camY, W, H) {
  let sc = Math.max(0, Math.floor(camX/TILE));
  let sr = Math.max(0, Math.floor(camY/TILE));
  let ec = Math.min(COLS, Math.ceil((camX+W)/TILE)+1);
  let er = Math.min(ROWS, Math.ceil((camY+H)/TILE)+1);

  for (let row=sr; row<er; row++) {
    for (let col=sc; col<ec; col++) {
      let x=col*TILE, y=row*TILE;
      if (grid[row][col]===1) {
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(x,y,TILE,TILE);
        ctx.strokeStyle = '#2e2e3e';
        ctx.strokeRect(x,y,TILE,TILE);
      } else {
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(x,y,TILE,TILE);
      }
    }
  }
}

// 시야 관련 (뱀서류에서는 전부 보임)
export function initVisibility() {}
export function updateVisibility() {}
export function isVisible(c, r) { return 2; }
export function isVisibleWorld(x, y) { return 2; }

// A* 불필요하지만 호환성 유지
export function findPath() { return []; }
export function getBossRoom() { return rooms[0]; }
