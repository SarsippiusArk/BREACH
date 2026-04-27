// ── Player Ship Dimensions (collision hitboxes) ──────────────────────────────
export const SHIP_W = 24;
export const SHIP_H = 12;

// ── Player Ships ─────────────────────────────────────────────────────────────

/** Amy: blue/white twin-barrel fighter */
export function drawAmyShip(ctx, x, y, pal, invincible) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);
  const [m, li, ck, en] = pal || ['#5599FF','#99BBFF','#CCEEFF','#FF6622'];
  ctx.fillStyle = en; ctx.fillRect(x, y+4, 3, 4); // engine
  ctx.fillStyle = '#FF9944'; ctx.fillRect(x+1, y+5, 1, 2);
  ctx.fillStyle = m;
  ctx.fillRect(x+2, y+2, 5, 2); ctx.fillRect(x+2, y+8, 5, 2); // wings
  ctx.fillRect(x+2, y+4, 14, 4); // fuselage base
  ctx.fillStyle = li;
  ctx.fillRect(x+4, y+3, 10, 6); // fuselage highlight
  ctx.fillStyle = ck; ctx.fillRect(x+9, y+4, 5, 4); // cockpit
  ctx.fillStyle = '#AADDFF'; ctx.fillRect(x+10, y+4, 3, 4); // cockpit glass
  ctx.fillStyle = '#2244AA'; // barrels
  ctx.fillRect(x+17, y+3, 7, 2); ctx.fillRect(x+17, y+7, 7, 2);
  ctx.fillStyle = '#DDEEFF'; ctx.fillRect(x+19, y+3, 5, 1); ctx.fillRect(x+19, y+7, 5, 1);
}

/** Rohan: green/gray heavy-weapons fighter */
export function drawRohanShip(ctx, x, y, pal, invincible) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);
  const [m, li, ck, en] = pal || ['#44CC77','#88DDAA','#AADDBB','#FFAA22'];
  ctx.fillStyle = en; ctx.fillRect(x, y+4, 3, 4);
  ctx.fillStyle = '#FFCC44'; ctx.fillRect(x+1, y+5, 1, 2);
  ctx.fillStyle = m;
  ctx.fillRect(x+2, y+1, 6, 3); ctx.fillRect(x+2, y+8, 6, 3); // thick wings
  ctx.fillRect(x+2, y+4, 16, 4); // wide fuselage
  ctx.fillRect(x+4, y+3, 12, 6);
  ctx.fillStyle = li; ctx.fillRect(x+5, y+4, 6, 4); // body highlight
  ctx.fillStyle = '#335544'; // armor plates
  ctx.fillRect(x+3, y+3, 3, 1); ctx.fillRect(x+3, y+8, 3, 1);
  ctx.fillStyle = ck; ctx.fillRect(x+8, y+4, 4, 4); // cockpit
  ctx.fillStyle = '#CCFFDD'; ctx.fillRect(x+9, y+4, 2, 4);
  ctx.fillStyle = '#335544'; ctx.fillRect(x+17, y+4, 7, 4); // heavy cannon
  ctx.fillStyle = li; ctx.fillRect(x+20, y+5, 4, 2);
  // Missile pods on wings
  ctx.fillStyle = '#557755';
  ctx.fillRect(x+3, y+2, 4, 1); ctx.fillRect(x+3, y+9, 4, 1);
}

/** Akane: red streamlined speed fighter */
export function drawAkaneShip(ctx, x, y, pal, invincible) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);
  const [m, li, ck, en] = pal || ['#FF5566','#FF8899','#FFAAAA','#FF8822'];
  ctx.fillStyle = en; ctx.fillRect(x, y+5, 2, 2); // slim engine
  ctx.fillStyle = '#FFCC44'; ctx.fillRect(x+1, y+5, 1, 2);
  ctx.fillStyle = m;
  ctx.fillRect(x+2, y+3, 4, 2); ctx.fillRect(x+2, y+7, 4, 2); // slender wings
  ctx.fillRect(x+2, y+5, 20, 2); // very slim fuselage
  ctx.fillRect(x+4, y+4, 14, 4);
  ctx.fillRect(x+8, y+3, 10, 6);
  ctx.fillStyle = li; ctx.fillRect(x+10, y+4, 6, 4); // highlight
  ctx.fillStyle = ck; ctx.fillRect(x+13, y+4, 4, 4); // cockpit
  ctx.fillStyle = '#FFCCCC'; ctx.fillRect(x+14, y+4, 2, 4);
  ctx.fillStyle = '#771122'; ctx.fillRect(x+18, y+5, 6, 2); // single sharp barrel
  ctx.fillStyle = li; ctx.fillRect(x+20, y+5, 4, 1);
  // Speed lines / vents
  ctx.fillStyle = '#CC2233';
  ctx.fillRect(x+5, y+4, 2, 1); ctx.fillRect(x+5, y+7, 2, 1);
}

// ── Enemies ───────────────────────────────────────────────────────────────────

export const DRONE_W = 14, DRONE_H = 8;
export function drawFighterDrone(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#441166'; ctx.fillRect(x, y+2, 10, 4); // body
  ctx.fillStyle = '#772299'; ctx.fillRect(x+2, y+2, 6, 4); // highlight
  ctx.fillStyle = '#441166'; ctx.fillRect(x, y, 4, 2); ctx.fillRect(x, y+6, 4, 2); // wings
  ctx.fillStyle = '#AA44CC'; ctx.fillRect(x+1, y+1, 2, 1); ctx.fillRect(x+1, y+6, 2, 1);
  ctx.fillStyle = '#FF0044'; ctx.fillRect(x+5, y+3, 2, 2); // eye/sensor
  ctx.fillStyle = '#221144'; ctx.fillRect(x+10, y+3, 4, 2); // cannon
  ctx.fillStyle = '#FF4466'; ctx.fillRect(x+12, y+3, 2, 1); // muzzle
}

export const FRIGATE_W = 26, FRIGATE_H = 16;
export function drawMissileFrigate(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#221144'; ctx.fillRect(x, y+4, 22, 8); // hull
  ctx.fillStyle = '#441166'; ctx.fillRect(x+2, y+4, 18, 8);
  ctx.fillStyle = '#220033'; ctx.fillRect(x, y+1, 12, 4); ctx.fillRect(x, y+11, 12, 4); // top/bot fin
  ctx.fillStyle = '#441166'; ctx.fillRect(x+2, y+2, 8, 3); ctx.fillRect(x+2, y+11, 8, 3);
  ctx.fillStyle = '#FF2200'; ctx.fillRect(x+8, y+5, 4, 6); // missile bay
  ctx.fillStyle = '#FF6633'; ctx.fillRect(x+9, y+6, 2, 4);
  ctx.fillStyle = '#221144'; ctx.fillRect(x+16, y+6, 10, 4); // cannon
  ctx.fillStyle = '#880022'; ctx.fillRect(x+22, y+7, 4, 2);
  ctx.fillStyle = '#9900FF'; ctx.fillRect(x+4, y+7, 3, 2); // engine glow
}

export const CRUISER_W = 38, CRUISER_H = 20;
export function drawArmorCruiser(ctx, x, y, hp = 5, maxHp = 5) {
  x = Math.round(x); y = Math.round(y);
  const dmg = 1 - hp / maxHp;
  ctx.fillStyle = '#1A0033'; ctx.fillRect(x, y+4, 34, 12); // main hull
  ctx.fillStyle = '#330055'; ctx.fillRect(x+2, y+4, 30, 12);
  ctx.fillStyle = '#1A0033'; ctx.fillRect(x, y, 18, 6); ctx.fillRect(x, y+14, 18, 6); // armor
  ctx.fillStyle = '#440066'; ctx.fillRect(x+2, y+1, 14, 4); ctx.fillRect(x+2, y+15, 14, 4);
  ctx.fillStyle = '#660088'; ctx.fillRect(x+6, y+5, 16, 10); // center section
  ctx.fillStyle = '#440055'; ctx.fillRect(x+8, y+7, 8, 6); // weak point
  if (hp < maxHp) { // damage indicator
    ctx.fillStyle = dmg > 0.5 ? '#FF4400' : '#FF8800';
    ctx.fillRect(x+9, y+8, 6, 4);
  }
  ctx.fillStyle = '#1A0033'; ctx.fillRect(x+26, y+7, 12, 6); // guns
  ctx.fillStyle = '#AA00FF'; ctx.fillRect(x+34, y+8, 4, 2); ctx.fillRect(x+34, y+10, 4, 2);
}

// ── Power-ups ────────────────────────────────────────────────────────────────

export const PUP_W = 10, PUP_H = 10;
const PUP_COLORS = {
  speed:   ['#4488FF','#88AAFF'], rapid:   ['#FF8800','#FFBB44'],
  charge:  ['#FFEE00','#FFFFAA'], shield:  ['#00DDFF','#88FFFF'],
  special: ['#CC00FF','#EE88FF'], life:    ['#FF3344','#FF9999'],
};
const PUP_LABELS = { speed:'S', rapid:'R', charge:'C', shield:'P', special:'+', life:'1' };

export function drawPowerUp(ctx, x, y, type, t = 0) {
  x = Math.round(x); y = Math.round(y);
  const [c1, c2] = PUP_COLORS[type] || ['#FFFFFF','#AAAAAA'];
  const pulse = Math.sin(t * 4) * 0.5 + 0.5;
  ctx.globalAlpha = 0.7 + pulse * 0.3;
  // Diamond shape
  ctx.fillStyle = c1;
  ctx.beginPath(); ctx.moveTo(x+5,y); ctx.lineTo(x+10,y+5);
  ctx.lineTo(x+5,y+10); ctx.lineTo(x,y+5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = c2; ctx.globalAlpha = 0.6 + pulse * 0.4;
  ctx.beginPath(); ctx.moveTo(x+5,y+2); ctx.lineTo(x+8,y+5);
  ctx.lineTo(x+5,y+8); ctx.lineTo(x+2,y+5); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 5px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(PUP_LABELS[type] || '?', x+5, y+5);
}

// ── Bullets ───────────────────────────────────────────────────────────────────

export function drawPlayerBeam(ctx, x, y, charged = false) {
  x = Math.round(x); y = Math.round(y);
  if (charged) {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y+1, 16, 6);
    ctx.fillStyle = '#88CCFF'; ctx.fillRect(x+1, y+2, 14, 4);
    ctx.fillStyle = '#4488FF'; ctx.fillRect(x+2, y+3, 12, 2);
  } else {
    ctx.fillStyle = '#AACCFF'; ctx.fillRect(x, y+1, 8, 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x+1, y+1, 5, 1);
  }
}

export function drawEnemyBullet(ctx, x, y, type = 'normal') {
  x = Math.round(x); y = Math.round(y);
  if (type === 'missile') {
    ctx.fillStyle = '#FF4400'; ctx.fillRect(x, y+1, 9, 3);
    ctx.fillStyle = '#FFAA00'; ctx.fillRect(x+2, y+1, 5, 2);
  } else {
    ctx.fillStyle = '#FF3300'; ctx.fillRect(x, y+1, 6, 3);
    ctx.fillStyle = '#FF8833'; ctx.fillRect(x+1, y+1, 3, 2);
  }
}
