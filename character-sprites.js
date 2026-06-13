const ENHANCED_CHARACTERS = new Set(['Archer']);
const SCALEFX_CHARACTERS = new Set([
  'Elite Orc',
  'Greatsword Skeleton',
  'Lancer',
  'Priest',
  'Slime',
  'Werebear',
  'Wizard',
]);

export const ANIMATION_FRAME_COUNTS = {
  Idle: 6,
  Walk: 8,
  Hurt: 4,
  Death: 4,
};

const CHARACTER_RENDER_PROFILES = {
  'Archer':              { drawSize:112, footRatio:0.84, radius:12 },
  'Elite Orc':           { drawSize:118, footRatio:0.84, radius:16 },
  'Greatsword Skeleton': { drawSize:116, footRatio:0.84, radius:14 },
  'Lancer':              { drawSize:116, footRatio:0.77, radius:13 },
  'Priest':              { drawSize:110, footRatio:0.86, radius:12 },
  'Slime':               { drawSize:104, footRatio:0.84, radius:11 },
  'Werebear':            { drawSize:120, footRatio:0.84, radius:17 },
  'Wizard':              { drawSize:110, footRatio:0.86, radius:12 },
};

export function getCharacterSpritePath(name, animation) {
  if (SCALEFX_CHARACTERS.has(name)) {
    return `assets/character-scalefx/${name}/${name}-${animation}.png`;
  }
  if (ENHANCED_CHARACTERS.has(name)) {
    return `assets/character-xbrz/${name}/${name}-${animation}.png`;
  }
  return `assets/character/${name}/${name}/${name}-${animation}.png`;
}

export function getCharacterSpriteLayout(name) {
  if (SCALEFX_CHARACTERS.has(name)) {
    if (name !== 'Lancer') {
      return { frameStep: 300, sourceX: 75, sourceY: 45, sourceSize: 150 };
    }
    return { frameStep: 300, sourceX: 60, sourceY: 9, sourceSize: 210 };
  }
  if (ENHANCED_CHARACTERS.has(name)) {
    return { frameStep: 150, sourceX: 0, sourceY: 0, sourceSize: 150 };
  }
  return { frameStep: 100, sourceX: 25, sourceY: 15, sourceSize: 50 };
}

export function getCharacterRenderProfile(name) {
  return CHARACTER_RENDER_PROFILES[name] || {
    drawSize: 112,
    footRatio: 0.85,
    radius: 13,
  };
}
