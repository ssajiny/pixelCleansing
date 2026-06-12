// menu.js - 메인 메뉴 + 스테이지 선택
import { player } from './player.js';

const UI = 'assets/kenney_ui-pack/PNG/Blue/Default/';
const UI_GREY = 'assets/kenney_ui-pack/PNG/Grey/Default/';
const UI_YELLOW = 'assets/kenney_ui-pack/PNG/Yellow/Default/';
const imgCache = {};
function img(path) {
  if (!imgCache[path]) { let i = new Image(); i.src = path; imgCache[path] = i; }
  return imgCache[path];
}
const arrowL = img(UI_GREY + 'arrow_basic_w.png');
const arrowR = img(UI_GREY + 'arrow_basic_e.png');
const arrowLY = img(UI_YELLOW + 'arrow_basic_w.png');
const arrowRY = img(UI_YELLOW + 'arrow_basic_e.png');
const btnBlue = img('assets/kenney_ui-pack/PNG/Blue/Default/button_rectangle_depth_flat.png');
const btnGrey = img('assets/kenney_ui-pack/PNG/Grey/Default/button_rectangle_depth_flat.png');
const btnGreen = img('assets/kenney_ui-pack/PNG/Green/Default/button_rectangle_depth_flat.png');

// 스테이지 데이터
const STAGES = [
  { id:'forest', name:'숲', difficulty:[1,2,3,4,5] },
  { id:'dungeon', name:'던전', difficulty:[1,2,3,4,5] },
  { id:'volcano', name:'화산', difficulty:[1,2,3,4,5] },
];

const mainBg = new Image();
mainBg.src = 'assets/background/main.png';

// 캐릭터 리스트
const CHARACTERS = [
  'Archer','Armored Axeman','Armored Orc','Armored Skeleton','Elite Orc',
  'Greatsword Skeleton','Knight Templar','Knight','Lancer','Orc rider',
  'Orc','Priest','Skeleton Archer','Skeleton','Slime','Soldier',
  'Swordsman','Werebear','Werewolf','Wizard'
];

let screen = 'main';
let selectedStage = 0;
let selectedDiff = 0;
let collectionScroll = 0;
let selectedChar = 0; // 선택된 캐릭터 인덱스

export function getScreen() { return screen; }
export function getSelectedChar() { return CHARACTERS[selectedChar]; }
export function scrollCollection(dy) {
  if (screen !== 'collection') return;
  let cols = 6, boxSize = 135, gap = 12;
  let rows = Math.ceil(CHARACTERS.length / cols);
  let maxScroll = Math.max(0, rows * (boxSize + gap + 16) - 300);
  collectionScroll = Math.max(0, Math.min(maxScroll, collectionScroll + dy));
}

export function drawMenu(ctx, W, H) {
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);

  if (screen === 'main') {
    // 배경 이미지
    if (mainBg.complete && mainBg.naturalWidth) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(mainBg, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    // 게임 시작 버튼
    drawButton(ctx, W/2-140, H*0.4, 280, 70, '게임 시작', '#4a7af5');
    // 컬렉션 버튼
    drawButton(ctx, W/2-140, H*0.6, 280, 70, '컬렉션', '#555');

    ctx.textAlign = 'left';
  } else if (screen === 'stageSelect') {
    // X 버튼 (우상단, 빨간)
    let xBtn = img('assets/kenney_ui-pack/PNG/Red/Default/icon_cross.png');
    if (xBtn.complete) ctx.drawImage(xBtn, W-40, 10, 28, 28);
    else { ctx.fillStyle='#f44'; ctx.font='bold 20px Maple,sans-serif'; ctx.textAlign='right'; ctx.fillText('✕', W-15, 28); ctx.textAlign='left'; }

    // 스테이지 이미지 영역
    let st = STAGES[selectedStage];
    let imgW = W * 0.65, imgH = H * 0.5;
    let imgX = (W - imgW) / 2, imgY = H * 0.15;
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.strokeStyle = '#556'; ctx.lineWidth = 2; ctx.strokeRect(imgX, imgY, imgW, imgH);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Maple,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(st.name, W/2, imgY + imgH/2 + 8);

    // 좌우 화살표
    let arrowGap = 30, arrowSize = 40;
    if (arrowL.complete) ctx.drawImage(arrowL, imgX - arrowGap - arrowSize, imgY + imgH/2 - arrowSize/2, arrowSize, arrowSize);
    if (arrowR.complete) ctx.drawImage(arrowR, imgX + imgW + arrowGap, imgY + imgH/2 - arrowSize/2, arrowSize, arrowSize);

    // 난이도
    ctx.font = 'bold 18px Maple,sans-serif'; ctx.fillStyle = '#fd0'; ctx.textAlign = 'center';
    ctx.fillText('★'.repeat(selectedDiff+1), W/2, imgY + imgH + 45);
    let diffArrowSize = 22;
    if (arrowLY.complete) ctx.drawImage(arrowLY, W/2 - 110, imgY + imgH + 28, diffArrowSize, diffArrowSize);
    if (arrowRY.complete) ctx.drawImage(arrowRY, W/2 + 85, imgY + imgH + 28, diffArrowSize, diffArrowSize);

    // 출발 버튼
    drawButton(ctx, W/2-120, H*0.82, 240, 55, '출발!', '#4a7af5');
    ctx.textAlign = 'left';
  } else if (screen === 'collection') {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Maple,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('컬렉션', W/2, H*0.06);
    // X 버튼 (우상단, 빨간)
    let xBtn = img('assets/kenney_ui-pack/PNG/Red/Default/icon_cross.png');
    if (xBtn.complete) ctx.drawImage(xBtn, W-40, 10, 28, 28);
    else { ctx.fillStyle='#f44'; ctx.font='bold 20px Maple,sans-serif'; ctx.textAlign='right'; ctx.fillText('✕', W-15, 28); ctx.textAlign='left'; }
    ctx.textAlign = 'center';

    // 6열 캐릭터 그리드 (스크롤)
    let cols = 6, boxSize = 135, gap = 12;
    let totalW = cols * boxSize + (cols-1) * gap;
    let startX = (W - totalW) / 2;
    let startY = H * 0.12 - collectionScroll;

    ctx.save();
    ctx.beginPath(); ctx.rect(0, H*0.1, W, H*0.75); ctx.clip();

    for (let i = 0; i < CHARACTERS.length; i++) {
      let col = i % cols, row = Math.floor(i / cols);
      let bx = startX + col * (boxSize + gap);
      let by = startY + row * (boxSize + gap + 16);
      if (by + boxSize < H*0.1 || by > H*0.85) continue;

      ctx.fillStyle = '#2a2a4a';
      ctx.fillRect(bx, by, boxSize, boxSize);
      ctx.strokeStyle = i === selectedChar ? '#4f4' : '#556';
      ctx.lineWidth = i === selectedChar ? 3 : 1.5;
      ctx.strokeRect(bx, by, boxSize, boxSize);

      // 캐릭터 Idle 이미지 (첫 프레임 중앙 50x50 확대)
      let charImg = getCharImg(CHARACTERS[i]);
      if (charImg.complete && charImg.naturalWidth) {
        ctx.drawImage(charImg, 25, 15, 50, 50, bx+10, by+6, boxSize-20, boxSize-30);
      }

      // 이름
      ctx.fillStyle = '#ccc'; ctx.font = '9px Maple,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(CHARACTERS[i], bx + boxSize/2, by + boxSize - 5);
    }
    ctx.restore();

    ctx.textAlign = 'left';
  }
}

function drawButton(ctx, x, y, w, h, text, color) {
  let btnImg = color === '#4a7af5' ? btnBlue : color === '#555' ? btnGrey : btnGreen;
  if (btnImg.complete && btnImg.naturalWidth) {
    ctx.drawImage(btnImg, x, y, w, h);
  } else {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill();
  }
  ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Maple,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(text, x+w/2, y+h/2+6);
}

function drawArrow(ctx, x, y, dir, small) {
  let s = small ? 16 : 22;
  ctx.fillStyle = '#aaa'; ctx.font = `${s}px Maple,sans-serif`; ctx.textAlign = 'center';
  ctx.fillText(dir === 'w' ? '◀' : '▶', x, y+s*0.7);
}

const charImgCache = {};
function getCharImg(name) {
  let key = name;
  if (!charImgCache[key]) {
    let i = new Image();
    i.src = `assets/character/${name}/${name}/${name}-Idle.png`;
    charImgCache[key] = i;
  }
  return charImgCache[key];
}

// 클릭 처리 → 반환값: null (메뉴 유지) or 'start' (게임 시작)
export function handleMenuClick(gx, gy, W, H) {
  if (screen === 'main') {
    if (hitBtn(gx, gy, W/2-140, H*0.4, 280, 70)) { screen = 'stageSelect'; return null; }
    if (hitBtn(gx, gy, W/2-140, H*0.6, 280, 70)) { screen = 'collection'; return null; }
  } else if (screen === 'stageSelect') {
    // X 버튼 (우상단)
    if (hitBtn(gx, gy, W-45, 8, 35, 35)) { screen = 'main'; return null; }
    // 스테이지 좌우 화살표
    let imgW = W*0.65, imgH = H*0.5, imgX = (W-imgW)/2, imgY = H*0.15;
    let arrowGap = 30;
    if (hitBtn(gx, gy, imgX-arrowGap-40, imgY+imgH/2-20, 50, 40)) { selectedStage = (selectedStage-1+STAGES.length)%STAGES.length; return null; }
    if (hitBtn(gx, gy, imgX+imgW+arrowGap-10, imgY+imgH/2-20, 50, 40)) { selectedStage = (selectedStage+1)%STAGES.length; return null; }
    // 난이도 좌우
    if (hitBtn(gx, gy, W/2-120, imgY+imgH+25, 40, 30)) { selectedDiff = (selectedDiff-1+5)%5; return null; }
    if (hitBtn(gx, gy, W/2+80, imgY+imgH+25, 40, 30)) { selectedDiff = (selectedDiff+1)%5; return null; }
    // 출발
    if (hitBtn(gx, gy, W/2-120, H*0.82, 240, 55)) { return { stage: STAGES[selectedStage], diff: selectedDiff+1 }; }
  } else if (screen === 'collection') {
    // X 버튼 (우상단)
    if (hitBtn(gx, gy, W-45, 8, 35, 35)) { screen = 'main'; collectionScroll = 0; return null; }
    // 캐릭터 박스 클릭 → 선택
    let cols = 6, boxSize = 135, gap = 12;
    let totalW = cols * boxSize + (cols-1) * gap;
    let startX = (W - totalW) / 2;
    let startY = H * 0.12 - collectionScroll;
    for (let i = 0; i < CHARACTERS.length; i++) {
      let col = i % cols, row = Math.floor(i / cols);
      let bx = startX + col * (boxSize + gap);
      let by = startY + row * (boxSize + gap + 16);
      if (hitBtn(gx, gy, bx, by, boxSize, boxSize)) { selectedChar = i; return null; }
    }
  }
  return null;
}

export function resetMenu() { screen = 'main'; }

function hitBtn(gx, gy, x, y, w, h) { return gx>=x && gx<=x+w && gy>=y && gy<=y+h; }
