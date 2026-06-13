// player.js - 뱀서류 (조이스틱/WASD 이동 + 자동공격)
import { isWalkableWorld } from './map.js';
import { getJoystick, getKeys } from './input.js';
import {
  ANIMATION_FRAME_COUNTS,
  getCharacterRenderProfile,
  getCharacterSpriteLayout,
  getCharacterSpritePath,
} from './character-sprites.js';

export const player = {
  x: 0, y: 0, radius: 14,
  speed: 180,
  hp: 100, maxHp: 100,
  atk: 8, def: 3, atkRange: 200, atkSpeed: 0.5,
  atkCooldown: 0,
  flash: 0,
  facing: 0,
  level: 1, xp: 0, xpToNext: 20,
  gold: 0, // 영구 골드
  kills: 0,
  state: 'idle',
  target: null,
  path: [],
  acquired: [], // 획득한 스킬 목록 { id, name, type }
  skills: [],
};

let _enemies = [];
export function setEnemiesRef(ref) { _enemies = ref; }

function canMove(x, y) {
  if (!isWalkableWorld(x, y)) return false;
  for (let e of _enemies) {
    if (e.hp <= 0) continue;
    if (Math.hypot(x - e.x, y - e.y) < player.radius + e.radius - 10) return false;
  }
  return true;
}

export function gainXp(amount) {
  player.xp += amount;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = Math.floor(20 * Math.pow(1.3, player.level - 1));
    player.hp = player.maxHp;
    // 레벨업 선택지 표시
    player.levelUpChoices = getRandomChoices(3);
    player.paused = true;
  }
}

// 스킬/업그레이드 풀
const SKILL_POOL = [
  // 생존
  { id:'maxHp', name:'최대 체력 +20', desc:'HP 최대치 증가', type:'stat', maxLv:10, rarity:'normal', apply:()=>{ player.maxHp+=20; player.hp+=20; } },
  { id:'armor', name:'방어 +2', desc:'받는 피해 감소', type:'stat', maxLv:10, rarity:'normal', apply:()=>{ player.def+=2; } },
  { id:'regen', name:'재생 +2/초', desc:'초당 HP 회복', type:'stat', maxLv:10, rarity:'normal', apply:()=>{ player.regen=(player.regen||0)+2; } },
  { id:'revive', name:'부활 +1', desc:'사망 시 부활', type:'stat', maxLv:3, rarity:'legendary', apply:()=>{ player.revive=(player.revive||0)+1; } },
  // 기본 공격 강화
  { id:'might', name:'힘 +15%', desc:'모든 데미지 15% 증가', type:'weapon', maxLv:10, rarity:'normal', apply:()=>{ player.might=(player.might||1)*1.15; } },
  { id:'amount', name:'투사체 수 +1', desc:'발사 투사체 추가', type:'weapon', maxLv:5, rarity:'epic', apply:()=>{ player.projCount=(player.projCount||1)+1; } },
  { id:'projSpeed', name:'속도 +20%', desc:'투사체 속도 증가', type:'weapon', maxLv:10, rarity:'normal', apply:()=>{ player.projSpeed=(player.projSpeed||280)*1.2; } },
  { id:'area', name:'크기 +20%', desc:'투사체/범위 크기 증가', type:'weapon', maxLv:10, rarity:'normal', apply:()=>{ player.projSize=(player.projSize||1)*1.2; } },
  { id:'cooldown', name:'쿨다운 -10%', desc:'공격 주기 감소', type:'weapon', maxLv:10, rarity:'rare', apply:()=>{ player.atkSpeed=Math.max(0.1, player.atkSpeed*0.9); } },
  { id:'duration', name:'지속 +20%', desc:'투사체 수명 증가', type:'weapon', maxLv:10, rarity:'normal', apply:()=>{ player.projLife=(player.projLife||0.8)*1.2; } },
  { id:'pierce', name:'관통', desc:'투사체가 적을 관통', type:'weapon', maxLv:1, rarity:'epic', apply:()=>{ player.pierce=true; } },
  { id:'explosion', name:'폭발 +30', desc:'적중 시 범위 폭발', type:'weapon', maxLv:5, rarity:'rare', apply:()=>{ player.aoe=(player.aoe||0)+30; } },
  // 밀리 공격 스킬
  { id:'spinSlash', name:'회전 베기', desc:'주변 60px 공격 [2초]', type:'melee', maxLv:10, rarity:'rare', apply:()=>{ player.spinSlash=(player.spinSlash||0)+1; } },
  { id:'groundSlam', name:'지면 강타', desc:'주변 80px 충격파 [3초]', type:'melee', maxLv:10, rarity:'rare', apply:()=>{ player.groundSlam=(player.groundSlam||0)+1; } },
  { id:'dashStrike', name:'돌진 참격', desc:'전방 100px 관통 [2.5초]', type:'melee', maxLv:10, rarity:'epic', apply:()=>{ player.dashStrike=(player.dashStrike||0)+1; } },
  { id:'shieldBash', name:'방패 밀침', desc:'전방 50px 넉백 [2초]', type:'melee', maxLv:10, rarity:'rare', apply:()=>{ player.shieldBash=(player.shieldBash||0)+1; } },
  // 특수 무기
  { id:'orbit', name:'회전 구슬', desc:'주변 회전하며 데미지', type:'special', maxLv:10, rarity:'epic', apply:()=>{ player.orbitCount=(player.orbitCount||0)+1; } },
  { id:'lightning', name:'번개', desc:'주변 적 자동 번개', type:'special', maxLv:10, rarity:'epic', apply:()=>{ player.lightning=(player.lightning||0)+1; } },
  { id:'thorns', name:'가시 +5', desc:'접촉 적에게 반사', type:'special', maxLv:10, rarity:'normal', apply:()=>{ player.thorns=(player.thorns||0)+5; } },
  { id:'fireTrail', name:'불길 자국', desc:'이동 경로에 화염', type:'special', maxLv:5, rarity:'epic', apply:()=>{ player.fireTrail=(player.fireTrail||0)+1; } },
  { id:'iceNova', name:'빙결 폭발', desc:'5초마다 주변 둔화', type:'special', maxLv:10, rarity:'rare', apply:()=>{ player.iceNova=(player.iceNova||0)+1; } },
  { id:'poisonCloud', name:'독구름', desc:'주변 적 지속 피해', type:'special', maxLv:10, rarity:'rare', apply:()=>{ player.poisonCloud=(player.poisonCloud||0)+1; } },
  // 유틸
  { id:'critChance', name:'치명타 확률 +10%', desc:'크리티컬 발생 확률', type:'stat', maxLv:5, rarity:'rare', apply:()=>{ player.critChance=(player.critChance||15)+10; } },
  { id:'critDmg', name:'치명타 데미지 +30%', desc:'크리티컬 배율 증가', type:'stat', maxLv:5, rarity:'rare', apply:()=>{ player.critDmg=(player.critDmg||2)+0.3; } },
  { id:'lifesteal', name:'체력 흡수 +5%', desc:'데미지의 일부 HP 회복', type:'stat', maxLv:5, rarity:'epic', apply:()=>{ player.lifesteal=(player.lifesteal||0)+0.05; } },
  { id:'shield', name:'쉴드 +20', desc:'HP 위에 추가 보호막', type:'stat', maxLv:10, rarity:'rare', apply:()=>{ player.maxShield=(player.maxShield||0)+20; player.shield=(player.shield||0)+20; } },
  { id:'shieldRegen', name:'쉴드 회복 +2/초', desc:'쉴드 자동 회복', type:'stat', maxLv:5, rarity:'rare', apply:()=>{ player.shieldRegen=(player.shieldRegen||0)+2; } },
  { id:'moveSpeed', name:'이동속도 +15%', desc:'캐릭터 이동 증가', type:'stat', maxLv:10, rarity:'normal', apply:()=>{ player.speed*=1.15; } },
  { id:'magnet', name:'자석 +40', desc:'경험치 흡수 범위', type:'stat', maxLv:10, rarity:'normal', apply:()=>{ player.magnetRange=(player.magnetRange||50)+40; } },
  { id:'growth', name:'성장 +15%', desc:'경험치 획득량 증가', type:'stat', maxLv:10, rarity:'normal', apply:()=>{ player.xpMult=(player.xpMult||1)*1.15; } },
  { id:'greed', name:'탐욕 +20%', desc:'골드 획득량 증가', type:'stat', maxLv:10, rarity:'normal', apply:()=>{ player.greed=(player.greed||1)*1.2; } },
  { id:'curse', name:'저주', desc:'적 강화+경험치 증가', type:'stat', maxLv:5, rarity:'legendary', apply:()=>{ player.curse=(player.curse||1)*1.2; } },
  { id:'reroll', name:'재도전 +1', desc:'선택지 초기화 기회', type:'stat', maxLv:3, rarity:'rare', apply:()=>{ player.rerolls=(player.rerolls||0)+1; } },
];

export function getRandomChoices(n) {
  let pool = SKILL_POOL.filter(sk => {
    let acq = player.acquired.find(a => a.id === sk.id);
    if (acq) return acq.count < (sk.maxLv || 10);
    let isWeapon = isAttackSkill(sk);
    let usedSlots = player.acquired.filter(a => a.isWeapon === isWeapon).length;
    return usedSlots < 6;
  });
  let choices = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    let index = Math.floor(Math.random() * pool.length);
    let skill = pool.splice(index, 1)[0];
    let effectValue = rollEffectValue();
    choices.push({
      ...skill,
      effectValue,
      rarity: rarityForValue(effectValue),
      rarityLabel: rarityLabelForValue(effectValue),
      effectLabel: skill.id === 'amount'
        ? `투사체 +${effectValue}`
        : `효과 x${effectValue}`,
      rolledDesc: `${skill.desc} · ${effectValue}단계 효과`,
    });
  }
  return choices;
}

export function selectChoice(idx) {
  if (!player.levelUpChoices) return;
  let choice = player.levelUpChoices[idx];
  if (choice) {
    let isWeapon = isAttackSkill(choice);
    let existing = player.acquired.find(a=>a.id===choice.id);
    let hasRoom = player.acquired.filter(a=>a.isWeapon===isWeapon).length < 6;
    if (!existing && !hasRoom) return;

    let effectValue = choice.effectValue || 1;
    for (let i = 0; i < effectValue; i++) choice.apply();

    if (existing) {
      existing.count++;
      existing.power = (existing.power || 0) + effectValue;
      if (rarityRank(choice.rarity) > rarityRank(existing.rarity)) {
        existing.rarity = choice.rarity;
      }
    }
    else {
      player.acquired.push({
        id:choice.id,
        name:choice.name,
        type:choice.type,
        isWeapon,
        count:1,
        power:effectValue,
        rarity:choice.rarity,
      });
    }
  }
  player.levelUpChoices = null;
  player.paused = false;
}

function isAttackSkill(skill) {
  return skill.type === 'weapon' || skill.type === 'melee' || skill.type === 'special';
}

function rollEffectValue() {
  let roll = Math.random();
  if (roll < 0.42) return 1;
  if (roll < 0.7) return 2;
  if (roll < 0.87) return 3;
  if (roll < 0.96) return 4;
  return 5;
}

function rarityForValue(value) {
  if (value >= 5) return 'legendary';
  if (value >= 3) return 'epic';
  if (value >= 2) return 'rare';
  return 'normal';
}

function rarityLabelForValue(value) {
  return {
    normal: '노말',
    rare: '레어',
    epic: '에픽',
    legendary: '전설',
  }[rarityForValue(value)];
}

function rarityRank(rarity) {
  return { normal:0, rare:1, epic:2, legendary:3 }[rarity] || 0;
}

export function updatePlayer(dt) {
  if (player.atkCooldown > 0) player.atkCooldown -= dt;
  if (player.flash > 0) player.flash -= dt;
  if (player.regen) player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
  // 쉴드: 3초간 피격 안 당하면 회복
  if (player.maxShield > 0) {
    if (player.flash > 0) player._shieldCd = 3;
    else if (player._shieldCd > 0) player._shieldCd -= dt;
    else player.shield = Math.min(player.maxShield, (player.shield||0) + (player.shieldRegen||2) * dt);
  }

  const joy = getJoystick();
  const keys = getKeys();

  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup'] || keys['ㅈ']) dy--;
  if (keys['s'] || keys['arrowdown'] || keys['ㄴ']) dy++;
  if (keys['a'] || keys['arrowleft'] || keys['ㅁ']) dx--;
  if (keys['d'] || keys['arrowright'] || keys['ㅇ']) dx++;

  if (joy.active && (Math.abs(joy.dx) > 5 || Math.abs(joy.dy) > 5)) {
    let len = Math.hypot(joy.dx, joy.dy);
    dx = joy.dx / len; dy = joy.dy / len;
  } else if (dx || dy) {
    let len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
  }

  if (dx || dy) {
    let nx = player.x + dx * player.speed * dt;
    let ny = player.y + dy * player.speed * dt;
    if (canMove(nx, player.y)) player.x = nx;
    if (canMove(player.x, ny)) player.y = ny;
    player.facing = Math.atan2(dy, dx);
  }

  // 자동공격
  if (player.atkCooldown <= 0) {
    let nearest = null, minD = Infinity;
    for (let e of _enemies) {
      if (e.hp <= 0) continue;
      let d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < player.atkRange && d < minD) { minD = d; nearest = e; }
    }
    if (nearest) {
      player.atkCooldown = player.atkSpeed;
      player.target = nearest;
      return { attack: true, target: nearest };
    }
  }

  // 몹은 못 지나감 (canMove에서 처리)

  return null;
}

// 캐릭터 스프라이트
const charSprites = {};
function loadCharSprite(name, anim) {
  let key = `${name}-${anim}`;
  if (!charSprites[key]) {
    let img = new Image();
    img.src = getCharacterSpritePath(name, anim);
    charSprites[key] = img;
  }
  return charSprites[key];
}
// 선택된 캐릭터 미리 로드
export function preloadCharSprites(name) {
  ['Idle','Walk','Hurt','Death'].forEach(a => loadCharSprite(name, a));
}
let charAnim = 'Idle', charFrame = 0, charTick = 0;
let prevMoving = false;
let hurtTimer = 0;

export function resetPlayerAnimation() {
  charAnim = 'Idle';
  charFrame = 0;
  charTick = 0;
  prevMoving = false;
  hurtTimer = 0;
}

export function drawPlayer(ctx) {
  // Hurt 타이머
  if (player.flash > 0) { hurtTimer = 0.4; }
  if (hurtTimer > 0) hurtTimer -= 1/60;

  // 애니메이션 상태 결정
  const joy = getJoystick();
  const keys = getKeys();
  let moving = joy.active || keys['w'] || keys['s'] || keys['a'] || keys['d'] || keys['ㅈ'] || keys['ㄴ'] || keys['ㅁ'] || keys['ㅇ'];

  let newAnim;
  if (player.hp <= 0) newAnim = 'Death';
  else if (hurtTimer > 0) newAnim = 'Hurt';
  else if (moving) newAnim = 'Walk';
  else newAnim = 'Idle';

  // 애니메이션 바뀌면 프레임 리셋
  if (newAnim !== charAnim) { charAnim = newAnim; charFrame = 0; charTick = 0; }

  // 프레임 진행
  charTick++;
  if (charTick >= 8) { charTick = 0; charFrame++; }
  let charName = player.selectedChar || 'Archer';
  let img = loadCharSprite(charName, charAnim);
  let layout = getCharacterSpriteLayout(charName);
  let render = getCharacterRenderProfile(charName);
  let maxFrames = img.naturalWidth
    ? Math.floor(img.naturalWidth / layout.frameStep)
    : ANIMATION_FRAME_COUNTS[charAnim];
  if (charFrame >= maxFrames) charFrame = (charAnim === 'Death') ? maxFrames-1 : 0;

  prevMoving = moving;

  let sz = render.drawSize;
  let footY = player.y + 20;
  let drawTop = footY - sz * render.footRatio;
  if (img.complete && img.naturalWidth) {
    ctx.globalAlpha = player.flash > 0 ? 0.5 : 1;
    let flipX = player.facing > Math.PI/2 || player.facing < -Math.PI/2;
    ctx.save();
    ctx.translate(player.x, 0);
    if (flipX) ctx.scale(-1, 1);
    ctx.drawImage(
      img,
      charFrame * layout.frameStep + layout.sourceX,
      layout.sourceY,
      layout.sourceSize,
      layout.sourceSize,
      -sz/2,
      drawTop,
      sz,
      sz,
    );
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // HP바 (캐릭터 아래)
  let bw = 36, bh = 4;
  let bx = player.x - bw/2, by = footY + 6;
  ctx.fillStyle = '#300'; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#4f4'; ctx.fillRect(bx, by, bw * (player.hp / player.maxHp), bh);
  // 쉴드바
  if (player.maxShield > 0) {
    ctx.fillStyle = '#224'; ctx.fillRect(bx, by + bh + 1, bw, 3);
    ctx.fillStyle = '#4af'; ctx.fillRect(bx, by + bh + 1, bw * ((player.shield||0) / player.maxShield), 3);
  }
}

// 호환성
export function moveTo() {}
export function attackTarget() {}
