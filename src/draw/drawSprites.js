// ── Player Ship Dimensions (collision hitboxes) ──────────────────────────────
export const SHIP_W = 24;
export const SHIP_H = 12;

// ── TurboGrafx-16 jewel-tone palette — 3-bit per channel (0x00/24/49/6D/92/B6/DB/FF)
// Player Ships ─────────────────────────────────────────────────────────────────

/** Amy: blue twin-barrel interceptor */
export function drawAmyShip(ctx, x, y, pal, invincible) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);
  const [m, li, ck, en] = pal || ['#0049DB','#00B6FF','#00DBFF','#FF9200'];
  const eg = Math.floor(Date.now() / 120) % 2 ? '#FFFF00' : '#FFB600';
  // Engine exhaust — animated hot core
  ctx.fillStyle = eg; ctx.fillRect(x, y+5, 1, 2);
  ctx.fillStyle = en; ctx.fillRect(x+1, y+4, 2, 4);
  ctx.fillStyle = '#FF6D00'; ctx.fillRect(x+1, y+5, 1, 2);
  // Wing shadow panels
  ctx.fillStyle = '#000049';
  ctx.fillRect(x+2, y+2, 3, 1); ctx.fillRect(x+2, y+9, 3, 1);
  // Wings + fuselage
  ctx.fillStyle = m;
  ctx.fillRect(x+3, y+2, 5, 2); ctx.fillRect(x+3, y+8, 5, 2);
  ctx.fillRect(x+3, y+4, 14, 4);
  // Hull highlight band (raised dorsal panel)
  ctx.fillStyle = li; ctx.fillRect(x+5, y+4, 8, 4);
  // Cockpit housing
  ctx.fillStyle = '#006D92'; ctx.fillRect(x+10, y+3, 5, 6);
  // Cockpit glass
  ctx.fillStyle = ck; ctx.fillRect(x+11, y+4, 3, 4);
  ctx.fillStyle = '#B6FFFF'; ctx.fillRect(x+11, y+4, 1, 1); // specular
  // Barrel housing
  ctx.fillStyle = '#000024'; ctx.fillRect(x+17, y+4, 1, 4);
  // Twin gun barrels
  ctx.fillStyle = '#6DB6DB';
  ctx.fillRect(x+18, y+3, 6, 2); ctx.fillRect(x+18, y+7, 6, 2);
  ctx.fillStyle = '#DBFFFF';
  ctx.fillRect(x+22, y+3, 2, 1); ctx.fillRect(x+22, y+8, 2, 1);
}

/** Rohan: green heavy gunship — thick armor, dual exhaust, lock-on pods */
export function drawRohanShip(ctx, x, y, pal, invincible) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);
  const [m, li, ck, en] = pal || ['#009200','#49DB00','#00DBDB','#FF9200'];
  const eg = Math.floor(Date.now() / 140) % 2 ? '#FFDB00' : '#FF9200';
  // Dual exhausts (heavier ship)
  ctx.fillStyle = eg;
  ctx.fillRect(x, y+3, 1, 2); ctx.fillRect(x, y+7, 1, 2);
  ctx.fillStyle = en;
  ctx.fillRect(x+1, y+3, 2, 3); ctx.fillRect(x+1, y+7, 2, 2);
  // Dark hull base + armor plate
  ctx.fillStyle = '#002400';
  ctx.fillRect(x+2, y+1, 4, 2); ctx.fillRect(x+2, y+9, 4, 2);
  ctx.fillStyle = '#494949'; ctx.fillRect(x+3, y+3, 2, 6); // gray armor
  // Main hull — thick wings
  ctx.fillStyle = m;
  ctx.fillRect(x+4, y+1, 6, 3); ctx.fillRect(x+4, y+8, 6, 3);
  ctx.fillRect(x+4, y+3, 14, 6);
  // Hull highlight
  ctx.fillStyle = li; ctx.fillRect(x+6, y+4, 7, 4);
  // Missile pod indicators on wings
  ctx.fillStyle = '#002400';
  ctx.fillRect(x+4, y+2, 5, 1); ctx.fillRect(x+4, y+9, 5, 1);
  // Cockpit
  ctx.fillStyle = '#004900'; ctx.fillRect(x+10, y+3, 4, 6);
  ctx.fillStyle = ck; ctx.fillRect(x+11, y+4, 2, 4);
  ctx.fillStyle = '#DBFFFF'; ctx.fillRect(x+11, y+4, 1, 1);
  // Heavy single cannon
  ctx.fillStyle = '#494949'; ctx.fillRect(x+18, y+4, 6, 4);
  ctx.fillStyle = '#929292'; ctx.fillRect(x+17, y+5, 7, 2);
  ctx.fillStyle = '#DBDBDB'; ctx.fillRect(x+22, y+5, 2, 2);
}

/** Akane: red speed fighter — razor profile, blinding exhaust */
export function drawAkaneShip(ctx, x, y, pal, invincible) {
  if (invincible && Math.floor(Date.now() / 80) % 2) return;
  x = Math.round(x); y = Math.round(y);
  const [m, li, ck, en] = pal || ['#B60000','#DB4900','#FFB600','#FF9200'];
  const eg = Math.floor(Date.now() / 100) % 2 ? '#FFFFFF' : '#FFFF00';
  // Super-hot exhaust (fastest ship — whitest core)
  ctx.fillStyle = eg; ctx.fillRect(x, y+5, 1, 2);
  ctx.fillStyle = en; ctx.fillRect(x+1, y+4, 2, 4);
  ctx.fillStyle = '#FFFF00'; ctx.fillRect(x+1, y+5, 1, 2);
  // Dark fuselage base
  ctx.fillStyle = '#490000';
  ctx.fillRect(x+2, y+3, 3, 1); ctx.fillRect(x+2, y+8, 3, 1);
  // Slim delta wings
  ctx.fillStyle = m;
  ctx.fillRect(x+2, y+3, 5, 2); ctx.fillRect(x+2, y+7, 5, 2);
  ctx.fillRect(x+3, y+5, 20, 2); // razor-thin fuselage centerline
  ctx.fillRect(x+5, y+4, 13, 4);
  ctx.fillRect(x+9, y+3, 9, 6);
  // Speed vent accents
  ctx.fillStyle = li;
  ctx.fillRect(x+5, y+4, 1, 1); ctx.fillRect(x+5, y+7, 1, 1);
  ctx.fillRect(x+7, y+4, 1, 1); ctx.fillRect(x+7, y+7, 1, 1);
  // Amber cockpit
  ctx.fillStyle = '#490000'; ctx.fillRect(x+13, y+4, 4, 4);
  ctx.fillStyle = ck; ctx.fillRect(x+14, y+4, 2, 4);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x+14, y+4, 1, 1);
  // Forward integrated cannon
  ctx.fillStyle = '#920000'; ctx.fillRect(x+19, y+5, 5, 2);
  ctx.fillStyle = li; ctx.fillRect(x+22, y+5, 2, 1);
}

// ── Enemies ───────────────────────────────────────────────────────────────────

export const DRONE_W = 14, DRONE_H = 8;
export function drawFighterDrone(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  // Hull
  ctx.fillStyle = '#240024'; ctx.fillRect(x, y+1, 7, 6);
  ctx.fillStyle = '#920092'; ctx.fillRect(x+1, y+1, 6, 6);
  ctx.fillStyle = '#DB00DB'; ctx.fillRect(x+2, y+2, 4, 4);
  // Wings
  ctx.fillStyle = '#000024';
  ctx.fillRect(x, y, 4, 2); ctx.fillRect(x, y+6, 4, 2);
  ctx.fillStyle = '#490049';
  ctx.fillRect(x+1, y+1, 2, 1); ctx.fillRect(x+1, y+6, 2, 1);
  // Sensor eye + glint
  ctx.fillStyle = '#FF0000'; ctx.fillRect(x+4, y+3, 2, 2);
  ctx.fillStyle = '#FF9200'; ctx.fillRect(x+4, y+3, 1, 1);
  // Cannon
  ctx.fillStyle = '#6D006D'; ctx.fillRect(x+9, y+3, 5, 2);
  ctx.fillStyle = '#FF00FF'; ctx.fillRect(x+12, y+3, 2, 1);
  // Engine glow
  ctx.fillStyle = '#6D00DB'; ctx.fillRect(x+1, y+3, 1, 2);
}

export const FRIGATE_W = 26, FRIGATE_H = 16;
export function drawMissileFrigate(ctx, x, y) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#000049'; ctx.fillRect(x, y+4, 22, 8); // hull
  ctx.fillStyle = '#0000B6'; ctx.fillRect(x+2, y+4, 18, 8);
  // Armor fins top/bot
  ctx.fillStyle = '#242492';
  ctx.fillRect(x, y+1, 12, 4); ctx.fillRect(x, y+11, 12, 4);
  ctx.fillStyle = '#0000DB';
  ctx.fillRect(x+3, y+2, 7, 3); ctx.fillRect(x+3, y+11, 7, 3);
  // Missile bay (red warheads visible)
  ctx.fillStyle = '#B60000'; ctx.fillRect(x+8, y+5, 4, 6);
  ctx.fillStyle = '#DB0000'; ctx.fillRect(x+9, y+6, 2, 4);
  // Main cannon
  ctx.fillStyle = '#000024'; ctx.fillRect(x+16, y+6, 10, 4);
  ctx.fillStyle = '#920000'; ctx.fillRect(x+22, y+7, 4, 2);
  // Teal engine glow
  ctx.fillStyle = '#00B6B6'; ctx.fillRect(x+2, y+7, 2, 2);
  ctx.fillStyle = '#00DBDB'; ctx.fillRect(x+2, y+8, 1, 1);
}

export const CRUISER_W = 38, CRUISER_H = 20;
export function drawArmorCruiser(ctx, x, y, hp = 5, maxHp = 5) {
  x = Math.round(x); y = Math.round(y);
  const dmg = 1 - hp / maxHp;
  ctx.fillStyle = '#000024'; ctx.fillRect(x, y+4, 34, 12); // base hull
  ctx.fillStyle = '#240049'; ctx.fillRect(x+2, y+4, 30, 12); // main plating
  // Armor prows
  ctx.fillStyle = '#000024';
  ctx.fillRect(x, y, 18, 6); ctx.fillRect(x, y+14, 18, 6);
  ctx.fillStyle = '#494949';
  ctx.fillRect(x+2, y+1, 14, 4); ctx.fillRect(x+2, y+15, 14, 4);
  ctx.fillStyle = '#6D6D6D';
  ctx.fillRect(x+4, y+2, 8, 2); ctx.fillRect(x+4, y+16, 8, 2);
  // Mid section + reactor bay
  ctx.fillStyle = '#490092'; ctx.fillRect(x+6, y+5, 16, 10);
  ctx.fillStyle = '#240049'; ctx.fillRect(x+8, y+7, 8, 6);
  // Damage indicator
  if (dmg > 0.33) {
    ctx.fillStyle = dmg > 0.66 ? '#FF0000' : '#FF6D00';
    ctx.fillRect(x+9, y+8, 6, 4);
  }
  // Gun battery
  ctx.fillStyle = '#000024'; ctx.fillRect(x+26, y+7, 12, 6);
  ctx.fillStyle = '#B600B6';
  ctx.fillRect(x+34, y+8, 4, 2); ctx.fillRect(x+34, y+10, 4, 2);
  // Engine drives
  ctx.fillStyle = '#0049DB'; ctx.fillRect(x+3, y+7, 2, 6);
  ctx.fillStyle = '#00B6FF'; ctx.fillRect(x+3, y+9, 1, 2);
}

// ── Power-ups ────────────────────────────────────────────────────────────────

export const PUP_W = 10, PUP_H = 10;
const PUP_COLORS = {
  speed:   ['#0092DB','#00DBFF'], rapid:   ['#DB6D00','#FFDB00'],
  charge:  ['#B6B600','#FFFF00'], shield:  ['#0049DB','#00FFFF'],
  special: ['#920092','#FF00FF'], life:    ['#B60000','#FF9200'],
};
const PUP_LABELS = { speed:'S', rapid:'R', charge:'C', shield:'P', special:'+', life:'1' };

export function drawPowerUp(ctx, x, y, type, t = 0) {
  x = Math.round(x); y = Math.round(y);
  const [c1, c2] = PUP_COLORS[type] || ['#DBDBDB','#FFFFFF'];
  const pulse = Math.sin(t * 4) * 0.5 + 0.5;
  // Outer gem
  ctx.globalAlpha = 0.8 + pulse * 0.2;
  ctx.fillStyle = c1;
  ctx.beginPath(); ctx.moveTo(x+5,y); ctx.lineTo(x+10,y+5);
  ctx.lineTo(x+5,y+10); ctx.lineTo(x,y+5); ctx.closePath(); ctx.fill();
  // Inner gem
  ctx.fillStyle = c2; ctx.globalAlpha = 0.6 + pulse * 0.4;
  ctx.beginPath(); ctx.moveTo(x+5,y+2); ctx.lineTo(x+8,y+5);
  ctx.lineTo(x+5,y+8); ctx.lineTo(x+2,y+5); ctx.closePath(); ctx.fill();
  // Specular highlight
  ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.9;
  ctx.fillRect(x+4, y+2, 1, 1);
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
    ctx.fillStyle = '#00DBFF'; ctx.fillRect(x+1, y+2, 14, 4);
    ctx.fillStyle = '#0049DB'; ctx.fillRect(x+2, y+3, 12, 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x+3, y+3, 4, 1);
  } else {
    ctx.fillStyle = '#6DB6FF'; ctx.fillRect(x, y+1, 8, 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x+1, y+1, 4, 1);
    ctx.fillStyle = '#00DBFF'; ctx.fillRect(x+6, y+1, 2, 1);
  }
}

export function drawEnemyBullet(ctx, x, y, type = 'normal') {
  x = Math.round(x); y = Math.round(y);
  if (type === 'missile') {
    ctx.fillStyle = '#B60000'; ctx.fillRect(x, y+1, 9, 3);
    ctx.fillStyle = '#FF9200'; ctx.fillRect(x+2, y+1, 5, 2);
    ctx.fillStyle = '#FFDB00'; ctx.fillRect(x+3, y+2, 2, 1);
  } else {
    ctx.fillStyle = '#B60000'; ctx.fillRect(x, y+1, 6, 3);
    ctx.fillStyle = '#FF6D00'; ctx.fillRect(x+1, y+1, 3, 2);
    ctx.fillStyle = '#FF9200'; ctx.fillRect(x+1, y+2, 2, 1);
  }
}
