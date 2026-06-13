const cache = new Map();

function getImage(path) {
  if (!cache.has(path)) {
    const image = new Image();
    image.src = path;
    cache.set(path, image);
  }
  return cache.get(path);
}

function path(color, shape, depth) {
  const suffix = depth ? '_depth_flat.png' : '_flat.png';
  return `assets/kenney_ui-pack/PNG/${color}/Default/button_${shape}${suffix}`;
}

export function drawKenneyBox(ctx, x, y, w, h, options = {}) {
  const color = options.color || 'Grey';
  const shape = options.shape || 'rectangle';
  const depth = options.depth || false;
  const image = getImage(path(color, shape, depth));

  if (!image.complete || !image.naturalWidth) {
    ctx.fillStyle = options.fallback || '#2a2a4a';
    ctx.fillRect(x, y, w, h);
    return;
  }

  const corner = shape === 'square' ? 18 : 22;
  if (w < corner * 2 || h < corner * 2) {
    ctx.drawImage(image, x, y, w, h);
    return;
  }
  const right = image.naturalWidth - corner;
  const bottom = image.naturalHeight - corner;
  const centerW = image.naturalWidth - corner * 2;
  const centerH = image.naturalHeight - corner * 2;
  const targetCenterW = Math.max(0, w - corner * 2);
  const targetCenterH = Math.max(0, h - corner * 2);

  ctx.drawImage(image, 0, 0, corner, corner, x, y, corner, corner);
  ctx.drawImage(image, right, 0, corner, corner, x+w-corner, y, corner, corner);
  ctx.drawImage(image, 0, bottom, corner, corner, x, y+h-corner, corner, corner);
  ctx.drawImage(image, right, bottom, corner, corner, x+w-corner, y+h-corner, corner, corner);

  if (targetCenterW > 0) {
    ctx.drawImage(image, corner, 0, centerW, corner, x+corner, y, targetCenterW, corner);
    ctx.drawImage(image, corner, bottom, centerW, corner, x+corner, y+h-corner, targetCenterW, corner);
  }
  if (targetCenterH > 0) {
    ctx.drawImage(image, 0, corner, corner, centerH, x, y+corner, corner, targetCenterH);
    ctx.drawImage(image, right, corner, corner, centerH, x+w-corner, y+corner, corner, targetCenterH);
  }
  if (targetCenterW > 0 && targetCenterH > 0) {
    ctx.drawImage(
      image,
      corner,
      corner,
      centerW,
      centerH,
      x+corner,
      y+corner,
      targetCenterW,
      targetCenterH,
    );
  }
}

export function drawKenneyButton(ctx, x, y, w, h, text, options = {}) {
  drawKenneyBox(ctx, x, y, w, h, {
    color: options.color || 'Blue',
    depth: options.depth !== false,
    fallback: options.fallback,
  });
  ctx.fillStyle = options.textColor || '#fff';
  ctx.font = options.font || 'bold 14px Maple,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x+w/2, y+h/2 + (options.textOffsetY ?? 5));
}
