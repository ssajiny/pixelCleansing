// particles.js - 데미지 숫자, 이펙트 텍스트
export const particles = [];

export function updateParticles(dt) {
  for (let i=particles.length-1; i>=0; i--) {
    let p = particles[i];
    p.y += (p.vy||0) * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i,1);
  }
}

export function drawParticles(ctx) {
  for (let p of particles) {
    let alpha = Math.min(1, p.life / 0.3);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color || '#fff';
    ctx.font = p.big ? 'bold 16px Maple,sans-serif' : 'bold 13px Maple,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}
