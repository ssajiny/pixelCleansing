// defs.js - 게임 상수/데이터 정의

export const STAGE_MONSTERS = {
  forest: ['Monster_01', 'Monster_03', 'Monster_07'],
  dungeon: ['Monster_12', 'Monster_14', 'Monster_22'],
  volcano: ['Monster_30', 'Monster_34', 'Monster_46'],
};

export const BOSSES = [
  'Monster_Dragon_111','Monster_Dragon_112','Monster_Dragon_113',
  'Monster_Dragon_114','Monster_Dragon_115','Monster_Dragon_116',
  'Monster_Dragon_117','Monster_Dragon_118','Monster_Dragon_119',
];

export const BOSS_TIME = 600;

// 캐릭터별 스탯 + 기본무기
export const CHARACTER_DEFS = {
  'Archer':             { hp:80,  atk:10, def:1, speed:200, atkSpeed:0.4, atkRange:250, weapon:'arrow' },
  'Armored Axeman':     { hp:120, atk:14, def:4, speed:150, atkSpeed:0.7, atkRange:60,  weapon:'axe' },
  'Armored Orc':        { hp:140, atk:12, def:5, speed:140, atkSpeed:0.8, atkRange:50,  weapon:'mace' },
  'Armored Skeleton':   { hp:100, atk:11, def:4, speed:160, atkSpeed:0.6, atkRange:70,  weapon:'sword' },
  'Elite Orc':          { hp:150, atk:15, def:3, speed:160, atkSpeed:0.7, atkRange:55,  weapon:'greataxe' },
  'Greatsword Skeleton':{ hp:90,  atk:16, def:2, speed:155, atkSpeed:0.8, atkRange:80,  weapon:'greatsword' },
  'Knight Templar':     { hp:130, atk:11, def:5, speed:155, atkSpeed:0.6, atkRange:60,  weapon:'holy_sword' },
  'Knight':             { hp:120, atk:10, def:5, speed:160, atkSpeed:0.5, atkRange:60,  weapon:'sword' },
  'Lancer':             { hp:100, atk:13, def:2, speed:180, atkSpeed:0.6, atkRange:90,  weapon:'lance' },
  'Orc rider':          { hp:130, atk:12, def:3, speed:190, atkSpeed:0.6, atkRange:70,  weapon:'spear' },
  'Orc':                { hp:130, atk:13, def:3, speed:165, atkSpeed:0.7, atkRange:50,  weapon:'club' },
  'Priest':             { hp:80,  atk:7,  def:1, speed:170, atkSpeed:0.5, atkRange:200, weapon:'magic' },
  'Skeleton Archer':    { hp:70,  atk:11, def:1, speed:180, atkSpeed:0.4, atkRange:260, weapon:'arrow' },
  'Skeleton':           { hp:85,  atk:9,  def:2, speed:170, atkSpeed:0.5, atkRange:60,  weapon:'bone' },
  'Slime':              { hp:60,  atk:5,  def:0, speed:200, atkSpeed:0.3, atkRange:180, weapon:'spit' },
  'Soldier':            { hp:110, atk:10, def:3, speed:180, atkSpeed:0.5, atkRange:200, weapon:'arrow' },
  'Swordsman':          { hp:100, atk:12, def:3, speed:175, atkSpeed:0.5, atkRange:70,  weapon:'sword' },
  'Werebear':           { hp:160, atk:14, def:4, speed:145, atkSpeed:0.8, atkRange:55,  weapon:'claw' },
  'Werewolf':           { hp:110, atk:13, def:2, speed:210, atkSpeed:0.4, atkRange:50,  weapon:'claw' },
  'Wizard':             { hp:70,  atk:8,  def:0, speed:165, atkSpeed:0.4, atkRange:230, weapon:'fireball' },
};
