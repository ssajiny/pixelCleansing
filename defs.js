// defs.js - 게임 상수/데이터 정의

const monsterRange = (start, end) =>
  Array.from(
    { length: end - start + 1 },
    (_, index) => `Monster_${String(start + index).padStart(2, '0')}`,
  );

export const STAGE_MONSTERS = {
  forest: {
    early: monsterRange(1, 12),
    mid: monsterRange(13, 24),
    late: monsterRange(25, 36),
  },
  dungeon: {
    early: monsterRange(37, 49),
    mid: monsterRange(50, 61),
    late: monsterRange(62, 73),
  },
  volcano: {
    early: monsterRange(74, 86),
    mid: monsterRange(87, 98),
    late: monsterRange(99, 110),
  },
};

export const STAGE_BOSSES = {
  forest: ['Monster_Dragon_111', 'Monster_Dragon_112', 'Monster_Dragon_113'],
  dungeon: ['Monster_Dragon_114', 'Monster_Dragon_115', 'Monster_Dragon_116'],
  volcano: ['Monster_Dragon_117', 'Monster_Dragon_118', 'Monster_Dragon_119'],
};

// Short test timing. Restore this to the desired stage duration later.
export const BOSS_TIME = 60;

// 캐릭터별 스탯 + 기본무기
export const CHARACTER_DEFS = {
  'Archer':             { hp:80,  atk:10, def:1, speed:200, atkSpeed:0.4, atkRange:250, weapon:'arrow' },
  'Elite Orc':          { hp:150, atk:15, def:3, speed:160, atkSpeed:0.7, atkRange:55,  weapon:'greataxe' },
  'Greatsword Skeleton':{ hp:90,  atk:16, def:2, speed:155, atkSpeed:0.8, atkRange:80,  weapon:'greatsword' },
  'Lancer':             { hp:100, atk:13, def:2, speed:180, atkSpeed:0.6, atkRange:90,  weapon:'lance' },
  'Priest':             { hp:80,  atk:7,  def:1, speed:170, atkSpeed:0.5, atkRange:200, weapon:'magic' },
  'Slime':              { hp:60,  atk:5,  def:0, speed:200, atkSpeed:0.3, atkRange:180, weapon:'spit' },
  'Werebear':           { hp:160, atk:14, def:4, speed:145, atkSpeed:0.8, atkRange:55,  weapon:'claw' },
  'Wizard':             { hp:70,  atk:8,  def:0, speed:165, atkSpeed:0.4, atkRange:230, weapon:'fireball' },
};
