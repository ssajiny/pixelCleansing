// menu.js - 메인 메뉴 + 스테이지 선택
import { player } from './player.js';
import {
  getCharacterRenderProfile,
  getCharacterSpriteLayout,
  getCharacterSpritePath,
} from './character-sprites.js';
import { drawKenneyBox, drawKenneyButton } from './kenney-ui.js';

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

// 스테이지 데이터
const STAGES = [
  { id:'forest', name:'숲', difficulty:[1,2,3,4,5] },
  { id:'dungeon', name:'던전', difficulty:[1,2,3,4,5] },
  { id:'volcano', name:'화산', difficulty:[1,2,3,4,5] },
];

// 캐릭터 리스트
const CHARACTERS = [
  'Archer',
  'Elite Orc',
  'Greatsword Skeleton',
  'Lancer',
  'Priest',
  'Slime',
  'Werebear',
  'Wizard',
];
const COLLECTION_TABS = [
  { id:'characters', label:'캐릭터' },
  { id:'skills', label:'스킬' },
  { id:'buffs', label:'버프' },
];
const COLLECTION_ITEMS = {
  characters: CHARACTERS,
  skills: [],
  buffs: [],
};

let screen = 'main';
let selectedStage = 0;
let selectedDiff = 0;
let collectionScroll = 0;
let collectionTab = 'characters';
let selectedChar = 0; // 선택된 캐릭터 인덱스
let menuW = 540;
let menuH = 960;

export function getScreen() { return screen; }
export function getSelectedChar() { return CHARACTERS[selectedChar]; }
function getCollectionLayout(W, H) {
  let cols = 3;
  let gap = 10;
  let boxSize = Math.floor((W - 40 - gap * (cols - 1)) / cols);
  let rowGap = 14;
  let top = 168;
  let bottom = H - 18;
  return { cols, gap, boxSize, rowGap, top, bottom };
}
function getCollectionTabsLayout(W) {
  let gap = 6;
  let margin = 14;
  let width = Math.floor((W - margin*2 - gap*2) / 3);
  return { x:margin, y:103, width, height:44, gap };
}
export function scrollCollection(dy) {
  if (screen !== 'collection') return;
  let { cols, boxSize, rowGap, top, bottom } = getCollectionLayout(menuW, menuH);
  let rows = Math.ceil(COLLECTION_ITEMS[collectionTab].length / cols);
  let contentHeight = rows * (boxSize + rowGap);
  let maxScroll = Math.max(0, contentHeight - (bottom - top));
  collectionScroll = Math.max(0, Math.min(maxScroll, collectionScroll + dy));
}

export function drawMenu(ctx, W, H) {
  menuW = W;
  menuH = H;
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);

  if (screen === 'stageSelect') {
    drawStageSignal(ctx, W, H);
    return;
  }
  if (screen === 'collection') {
    drawArchive(ctx, W, H);
    return;
  }

  if (screen === 'main') {
    drawMainMenu(ctx, W, H);
  } else if (screen === 'stageSelect') {
    // X 버튼 (우상단, 빨간)
    let xBtn = img('assets/kenney_ui-pack/PNG/Red/Default/icon_cross.png');
    if (xBtn.complete) ctx.drawImage(xBtn, W-40, 10, 28, 28);
    else { ctx.fillStyle='#f44'; ctx.font='bold 20px Maple,sans-serif'; ctx.textAlign='right'; ctx.fillText('✕', W-15, 28); ctx.textAlign='left'; }

    // 스테이지 이미지 영역
    let st = STAGES[selectedStage];
    let imgW = W - 70, imgH = Math.min(H * 0.46, 430);
    let imgX = (W - imgW) / 2, imgY = H * 0.12;
    drawKenneyBox(ctx, imgX, imgY, imgW, imgH, { color:'Grey' });
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Maple,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(st.name, W/2, imgY + imgH/2 + 8);

    // 좌우 화살표
    let arrowSize = 38;
    if (arrowL.complete) ctx.drawImage(arrowL, 8, imgY + imgH/2 - arrowSize/2, arrowSize, arrowSize);
    if (arrowR.complete) ctx.drawImage(arrowR, W-arrowSize-8, imgY + imgH/2 - arrowSize/2, arrowSize, arrowSize);

    // 난이도
    ctx.font = 'bold 18px Maple,sans-serif'; ctx.fillStyle = '#fd0'; ctx.textAlign = 'center';
    ctx.fillText('★'.repeat(selectedDiff+1), W/2, imgY + imgH + 45);
    let diffArrowSize = 22;
    if (arrowLY.complete) ctx.drawImage(arrowLY, W/2 - 110, imgY + imgH + 28, diffArrowSize, diffArrowSize);
    if (arrowRY.complete) ctx.drawImage(arrowRY, W/2 + 85, imgY + imgH + 28, diffArrowSize, diffArrowSize);

    // 출발 버튼
    drawButton(ctx, W/2-140, H*0.82, 280, 60, '출발!', '#4a7af5');
    ctx.textAlign = 'left';
  } else if (screen === 'collection') {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Maple,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('컬렉션', W/2, 42);
    // X 버튼 (우상단, 빨간)
    let xBtn = img('assets/kenney_ui-pack/PNG/Red/Default/icon_cross.png');
    if (xBtn.complete) ctx.drawImage(xBtn, W-40, 10, 28, 28);
    else { ctx.fillStyle='#f44'; ctx.font='bold 20px Maple,sans-serif'; ctx.textAlign='right'; ctx.fillText('✕', W-15, 28); ctx.textAlign='left'; }
    ctx.textAlign = 'center';

    let tabs = getCollectionTabsLayout(W);
    for (let i = 0; i < COLLECTION_TABS.length; i++) {
      let tab = COLLECTION_TABS[i];
      let tx = tabs.x + i * (tabs.width + tabs.gap);
      drawKenneyButton(ctx, tx, tabs.y, tabs.width, tabs.height, tab.label, {
        color: tab.id === collectionTab ? 'Blue' : 'Grey',
        font: 'bold 13px Maple,sans-serif',
        textOffsetY: 4,
      });
    }

    // 세로 화면용 3열 컬렉션 그리드
    let { cols, boxSize, gap, rowGap, top, bottom } = getCollectionLayout(W, H);
    let items = COLLECTION_ITEMS[collectionTab];
    let totalW = cols * boxSize + (cols-1) * gap;
    let startX = (W - totalW) / 2;
    let startY = top - collectionScroll;

    ctx.save();
    ctx.beginPath(); ctx.rect(0, top, W, bottom-top); ctx.clip();

    for (let i = 0; i < items.length; i++) {
      let col = i % cols, row = Math.floor(i / cols);
      let bx = startX + col * (boxSize + gap);
      let by = startY + row * (boxSize + rowGap);
      if (by + boxSize < top || by > bottom) continue;

      drawKenneyBox(ctx, bx, by, boxSize, boxSize, {
        color: i === selectedChar ? 'Green' : 'Grey',
        shape: 'square',
      });

      // 캐릭터 Idle 첫 프레임
      let charName = items[i];
      let charImg = getCharImg(charName);
      if (charImg.complete && charImg.naturalWidth) {
        let layout = getCharacterSpriteLayout(charName);
        ctx.drawImage(
          charImg,
          layout.sourceX,
          layout.sourceY,
          layout.sourceSize,
          layout.sourceSize,
          bx+10,
          by+6,
          boxSize-20,
          boxSize-44,
        );
      }

      let labelX = bx + 8;
      let labelY = by + boxSize - 38;
      let labelW = boxSize - 16;
      drawKenneyBox(ctx, labelX, labelY, labelW, 32, {
        color: i === selectedChar ? 'Green' : 'Blue',
      });
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = '#fff';
      ctx.font = `${charName.length > 16 ? 8 : charName.length > 10 ? 9 : 11}px Maple,sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(charName, bx + boxSize/2, labelY + 21);
      ctx.restore();
    }
    if (items.length === 0) {
      drawKenneyBox(ctx, 35, top + 40, W - 70, 150, { color:'Grey' });
      ctx.fillStyle = '#555';
      ctx.font = 'bold 16px Maple,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('추후 추가 예정입니다', W/2, top + 125);
    }
    ctx.restore();

    ctx.textAlign = 'left';
  }
}

function drawSignalBackground(ctx, W, H) {
  let gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, '#0e3037');
  gradient.addColorStop(0.5, '#151f34');
  gradient.addColorStop(1, '#090e19');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(101,232,208,0.09)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 54) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 54) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function drawBackButton(ctx, W) {
  let x = W - 62;
  let y = 22;
  ctx.beginPath();
  ctx.arc(x + 22, y + 22, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#16252e';
  ctx.fill();
  ctx.strokeStyle = '#60e2c7';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 21px sans-serif';
  ctx.fillText('×', x + 22, y + 29);
}

function drawStageSignal(ctx, W, H) {
  drawSignalBackground(ctx, W, H);
  drawBackButton(ctx, W);
  let stage = STAGES[selectedStage];
  let palettes = [
    { accent:'#53e6a1', dark:'#153d35', glow:'rgba(58,236,151,0.28)', code:'GREEN SIGNAL', desc:'균형 잡힌 생태 구역' },
    { accent:'#67a9ff', dark:'#172d4c', glow:'rgba(74,139,255,0.28)', code:'DEEP SIGNAL', desc:'좁고 위험한 지하 구역' },
    { accent:'#ff765c', dark:'#4a201e', glow:'rgba(255,87,59,0.28)', code:'HEAT SIGNAL', desc:'강한 적이 출현하는 화염 구역' },
  ];
  let theme = palettes[selectedStage];

  ctx.textAlign = 'left';
  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 12px Maple,sans-serif';
  ctx.fillText('CLEANSING COORDINATES', 24, 52);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px Maple,sans-serif';
  ctx.fillText('정화 지역 선택', 24, 88);

  let cardX = 28;
  let cardY = 142;
  let cardW = W - 56;
  let cardH = Math.min(430, H * 0.47);
  let glow = ctx.createRadialGradient(W / 2, cardY + 190, 20, W / 2, cardY + 190, 230);
  glow.addColorStop(0, theme.glow);
  glow.addColorStop(1, 'rgba(10,18,29,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.fillStyle = 'rgba(16,27,39,0.94)';
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.dark;
  ctx.beginPath();
  ctx.roundRect(cardX + 18, cardY + 18, cardW - 36, cardH - 112, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 12px Maple,sans-serif';
  ctx.fillText(theme.code, W / 2, cardY + 58);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 34px Maple,sans-serif';
  ctx.fillText(stage.name, W / 2, cardY + 112);
  ctx.fillStyle = '#aebbc7';
  ctx.font = '13px Maple,sans-serif';
  ctx.fillText(theme.desc, W / 2, cardY + 143);

  let ringY = cardY + 220;
  for (let radius of [76, 54, 31]) {
    ctx.beginPath();
    ctx.arc(W / 2, ringY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = radius === 76 ? theme.accent : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = radius === 76 ? 4 : 2;
    ctx.stroke();
  }
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(W / 2, ringY, 12, 0, Math.PI * 2);
  ctx.fill();

  drawChevron(ctx, 12, cardY + cardH / 2 - 28, 48, 56, 'left', theme.accent);
  drawChevron(ctx, W - 60, cardY + cardH / 2 - 28, 48, 56, 'right', theme.accent);

  let difficultyY = cardY + cardH + 34;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8fa1af';
  ctx.font = 'bold 11px Maple,sans-serif';
  ctx.fillText('위험 신호', 28, difficultyY);
  let chipGap = 8;
  let chipW = (W - 56 - chipGap * 4) / 5;
  for (let i = 0; i < 5; i++) {
    let chipX = 28 + i * (chipW + chipGap);
    ctx.fillStyle = i <= selectedDiff ? theme.accent : '#202b38';
    ctx.strokeStyle = i === selectedDiff ? '#fff' : '#40505d';
    ctx.lineWidth = i === selectedDiff ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(chipX, difficultyY + 13, chipW, 44, 8);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = i <= selectedDiff ? '#102027' : '#84929d';
    ctx.font = 'bold 14px Maple,sans-serif';
    ctx.fillText(String(i + 1), chipX + chipW / 2, difficultyY + 41);
  }

  drawMainButton(ctx, W / 2 - 175, H - 112, 350, 72, '이 좌표로 출전', theme.accent, theme.dark);
  ctx.textAlign = 'left';
}

function drawChevron(ctx, x, y, w, h, direction, color) {
  ctx.fillStyle = 'rgba(10,18,27,0.88)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (direction === 'left') {
    ctx.moveTo(x + 30, y + 15); ctx.lineTo(x + 18, y + h / 2); ctx.lineTo(x + 30, y + h - 15);
  } else {
    ctx.moveTo(x + 18, y + 15); ctx.lineTo(x + 30, y + h / 2); ctx.lineTo(x + 18, y + h - 15);
  }
  ctx.stroke();
}

function drawArchive(ctx, W, H) {
  drawSignalBackground(ctx, W, H);
  drawBackButton(ctx, W);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#61e3c8';
  ctx.font = 'bold 12px Maple,sans-serif';
  ctx.fillText('CLEANSING ARCHIVE', 24, 52);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px Maple,sans-serif';
  ctx.fillText('정화 기록 보관소', 24, 88);

  let tabs = getCollectionTabsLayout(W);
  for (let i = 0; i < COLLECTION_TABS.length; i++) {
    let tab = COLLECTION_TABS[i];
    let x = tabs.x + i * (tabs.width + tabs.gap);
    let active = tab.id === collectionTab;
    ctx.fillStyle = active ? '#52dcbf' : 'rgba(25,37,49,0.92)';
    ctx.strokeStyle = active ? '#a5ffed' : '#455562';
    ctx.lineWidth = active ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(x, tabs.y, tabs.width, tabs.height, 9);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = active ? '#10262a' : '#aebac3';
    ctx.font = 'bold 12px Maple,sans-serif';
    ctx.fillText(tab.label, x + tabs.width / 2, tabs.y + 28);
  }

  let { cols, boxSize, gap, rowGap, top, bottom } = getCollectionLayout(W, H);
  let items = COLLECTION_ITEMS[collectionTab];
  let totalW = cols * boxSize + (cols - 1) * gap;
  let startX = (W - totalW) / 2;
  let startY = top - collectionScroll;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, top, W, bottom - top); ctx.clip();

  for (let i = 0; i < items.length; i++) {
    let col = i % cols;
    let row = Math.floor(i / cols);
    let x = startX + col * (boxSize + gap);
    let y = startY + row * (boxSize + rowGap);
    if (y + boxSize < top || y > bottom) continue;
    let selected = i === selectedChar;

    ctx.fillStyle = selected ? 'rgba(43,91,82,0.96)' : 'rgba(27,37,50,0.96)';
    ctx.strokeStyle = selected ? '#66efcf' : '#465563';
    ctx.lineWidth = selected ? 4 : 2;
    ctx.beginPath();
    ctx.roundRect(x, y, boxSize, boxSize, 12);
    ctx.fill();
    ctx.stroke();
    if (selected) {
      ctx.fillStyle = '#66efcf';
      ctx.fillRect(x + 12, y, boxSize - 24, 5);
    }

    let charName = items[i];
    let charImg = getCharImg(charName);
    if (charImg.complete && charImg.naturalWidth) {
      let layout = getCharacterSpriteLayout(charName);
      let render = getCharacterRenderProfile(charName);
      let previewSize = (boxSize - 20) * render.drawSize / 112;
      let previewFootY = y + boxSize - 36;
      ctx.drawImage(
        charImg,
        layout.sourceX,
        layout.sourceY,
        layout.sourceSize,
        layout.sourceSize,
        x + boxSize / 2 - previewSize / 2,
        previewFootY - previewSize * render.footRatio,
        previewSize,
        previewSize,
      );
    }

    ctx.fillStyle = selected ? '#52dcbf' : '#111a26';
    ctx.beginPath();
    ctx.roundRect(x + 7, y + boxSize - 34, boxSize - 14, 27, 7);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = `${charName.length > 16 ? 8 : charName.length > 10 ? 9 : 10}px Maple,sans-serif`;
    ctx.fillText(charName, x + boxSize / 2, y + boxSize - 16);
  }

  if (items.length === 0) {
    ctx.fillStyle = 'rgba(24,35,47,0.94)';
    ctx.strokeStyle = '#4b5c68';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(30, top + 50, W - 60, 150, 14);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#61e3c8';
    ctx.font = 'bold 14px Maple,sans-serif';
    ctx.fillText('새 기록 슬롯 준비 중', W / 2, top + 116);
    ctx.fillStyle = '#8fa0ac';
    ctx.font = '12px Maple,sans-serif';
    ctx.fillText('추후 스킬과 버프 기록이 추가됩니다', W / 2, top + 145);
  }
  ctx.restore();
  ctx.textAlign = 'left';
}

function drawButton(ctx, x, y, w, h, text, color) {
  let uiColor = color === '#4a7af5' ? 'Blue' : color === '#555' ? 'Grey' : 'Green';
  drawKenneyButton(ctx, x, y, w, h, text, {
    color: uiColor,
    font: 'bold 18px Maple,sans-serif',
    textOffsetY: 6,
  });
}

function drawMainMenu(ctx, W, H) {
  let gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, '#102f38');
  gradient.addColorStop(0.52, '#17243a');
  gradient.addColorStop(1, '#0c101d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.13;
  ctx.strokeStyle = '#83e7d4';
  ctx.lineWidth = 2;
  for (let y = 80; y < H; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.font = 'bold 15px Maple,sans-serif';
  ctx.fillStyle = '#74f2d0';
  ctx.fillText('SURVIVE · GROW · CLEANSE', W / 2, 73);
  ctx.font = 'bold 42px Maple,sans-serif';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#071117';
  ctx.lineWidth = 8;
  ctx.strokeText('PIXEL CLEANSING', W / 2, 126);
  ctx.fillStyle = '#f8fbff';
  ctx.fillText('PIXEL CLEANSING', W / 2, 126);

  let centerX = W / 2;
  let centerY = Math.min(390, H * 0.39);
  let pulse = 1 + Math.sin(Date.now() / 480) * 0.035;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(pulse, pulse);
  let aura = ctx.createRadialGradient(0, 0, 20, 0, 0, 145);
  aura.addColorStop(0, 'rgba(50,255,205,0.34)');
  aura.addColorStop(0.65, 'rgba(36,137,174,0.18)');
  aura.addColorStop(1, 'rgba(19,29,48,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 145, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(102,245,216,0.55)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 112, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  let charName = CHARACTERS[selectedChar];
  let charImg = getCharImg(charName);
  if (charImg.complete && charImg.naturalWidth) {
    let layout = getCharacterSpriteLayout(charName);
    let render = getCharacterRenderProfile(charName);
    let previewSize = 190 * render.drawSize / 112;
    let previewFootY = centerY + 62;
    ctx.drawImage(
      charImg,
      layout.sourceX,
      layout.sourceY,
      layout.sourceSize,
      layout.sourceSize,
      centerX - previewSize / 2,
      previewFootY - previewSize * render.footRatio,
      previewSize,
      previewSize,
    );
  }

  ctx.fillStyle = 'rgba(7,12,22,0.86)';
  ctx.strokeStyle = '#56d8c1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(centerX - 110, centerY + 82, 220, 42, 20);
  ctx.fill();
  ctx.stroke();
  ctx.font = `bold ${charName.length > 16 ? 13 : 16}px Maple,sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.fillText(charName, centerX, centerY + 109);

  let startY = H * 0.65;
  drawMainButton(ctx, W / 2 - 175, startY, 350, 78, '출전 준비', '#20d69b', '#08765d');
  drawMainButton(ctx, W / 2 - 175, startY + 94, 350, 64, '컬렉션', '#485873', '#283347');

  ctx.font = '12px Maple,sans-serif';
  ctx.fillStyle = '#9eacc2';
  ctx.fillText('스테이지와 난이도를 선택해 정화를 시작하세요', W / 2, startY - 20);
  ctx.textAlign = 'left';
}

function drawMainButton(ctx, x, y, w, h, text, topColor, bottomColor) {
  let gradient = ctx.createLinearGradient(0, y, 0, y + h);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  ctx.fillStyle = gradient;
  ctx.strokeStyle = '#081118';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x + 12, y + 9, w - 24, 4);
  ctx.textAlign = 'center';
  ctx.font = `bold ${h > 70 ? 23 : 19}px Maple,sans-serif`;
  ctx.strokeStyle = '#142027';
  ctx.lineWidth = 5;
  ctx.strokeText(text, x + w / 2, y + h / 2 + 8);
  ctx.fillStyle = '#fff';
  ctx.fillText(text, x + w / 2, y + h / 2 + 8);
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
    i.src = getCharacterSpritePath(name, 'Idle');
    charImgCache[key] = i;
  }
  return charImgCache[key];
}

// 클릭 처리 → 반환값: null (메뉴 유지) or 'start' (게임 시작)
export function handleMenuClick(gx, gy, W, H) {
  if (screen === 'main') {
    let startY = H * 0.65;
    if (hitBtn(gx, gy, W/2-175, startY, 350, 78)) { screen = 'stageSelect'; return null; }
    if (hitBtn(gx, gy, W/2-175, startY+94, 350, 64)) { screen = 'collection'; return null; }
  } else if (screen === 'stageSelect') {
    if (hitBtn(gx, gy, W-62, 22, 44, 44)) { screen = 'main'; return null; }
    let cardY = 142;
    let cardH = Math.min(430, H * 0.47);
    if (hitBtn(gx, gy, 12, cardY+cardH/2-28, 48, 56)) {
      selectedStage = (selectedStage-1+STAGES.length)%STAGES.length;
      return null;
    }
    if (hitBtn(gx, gy, W-60, cardY+cardH/2-28, 48, 56)) {
      selectedStage = (selectedStage+1)%STAGES.length;
      return null;
    }
    let difficultyY = cardY + cardH + 47;
    let chipGap = 8;
    let chipW = (W - 56 - chipGap * 4) / 5;
    for (let i = 0; i < 5; i++) {
      let chipX = 28 + i * (chipW + chipGap);
      if (hitBtn(gx, gy, chipX, difficultyY, chipW, 44)) {
        selectedDiff = i;
        return null;
      }
    }
    if (hitBtn(gx, gy, W/2-175, H-112, 350, 72)) {
      return { stage: STAGES[selectedStage], diff: selectedDiff+1 };
    }
  } else if (screen === 'collection') {
    if (hitBtn(gx, gy, W-62, 22, 44, 44)) { screen = 'main'; collectionScroll = 0; return null; }
    let tabs = getCollectionTabsLayout(W);
    for (let i = 0; i < COLLECTION_TABS.length; i++) {
      let tx = tabs.x + i * (tabs.width + tabs.gap);
      if (hitBtn(gx, gy, tx, tabs.y, tabs.width, tabs.height)) {
        collectionTab = COLLECTION_TABS[i].id;
        collectionScroll = 0;
        return null;
      }
    }
    if (collectionTab !== 'characters') return null;
    // 캐릭터 박스 클릭 → 선택
    let { cols, boxSize, gap, rowGap, top } = getCollectionLayout(W, H);
    let totalW = cols * boxSize + (cols-1) * gap;
    let startX = (W - totalW) / 2;
    let startY = top - collectionScroll;
    for (let i = 0; i < CHARACTERS.length; i++) {
      let col = i % cols, row = Math.floor(i / cols);
      let bx = startX + col * (boxSize + gap);
      let by = startY + row * (boxSize + rowGap);
      if (hitBtn(gx, gy, bx, by, boxSize, boxSize)) { selectedChar = i; return null; }
    }
  }
  return null;
}

export function resetMenu() { screen = 'main'; }

function hitBtn(gx, gy, x, y, w, h) { return gx>=x && gx<=x+w && gy>=y && gy<=y+h; }
