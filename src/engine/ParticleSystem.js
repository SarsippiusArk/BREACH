/**
 * Particle system: pooled particles for explosions, trails, sparkles.
 * Particles are plain objects updated and rendered here.
 */
export class ParticleSystem {
  #pool = [];
  #active = [];

  #alloc() {
    return this.#pool.pop() || {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1,
      size: 4, color: '#FF6622',
      alpha: 1, shape: 'circle',
    };
  }

  #free(p) {
    if (this.#pool.length < 200) this.#pool.push(p);
  }

  /** Spawn a single particle */
  spawn({ x, y, vx = 0, vy = 0, life = 0.5, size = 4, color = '#FF6622', shape = 'circle' }) {
    const p = this.#alloc();
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = life; p.maxLife = life;
    p.size = size; p.color = color; p.shape = shape;
    p.alpha = 1;
    this.#active.push(p);
  }

  /** Spawn an explosion burst */
  explode(x, y, scale = 1, colorSet = ['#FF8800', '#FF4400', '#FFEE00', '#FF2200']) {
    const count = Math.floor(10 * scale);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = (30 + Math.random() * 60) * scale;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.4,
        size: (2 + Math.random() * 4) * scale,
        color: colorSet[Math.floor(Math.random() * colorSet.length)],
      });
    }
    // Central flash
    this.spawn({ x, y, vx: 0, vy: 0, life: 0.12, size: 12 * scale, color: '#FFFFFF', shape: 'circle' });
  }

  /** Spawn engine trail */
  trail(x, y, color = '#4466FF') {
    this.spawn({
      x: x + (Math.random() - 0.5) * 2,
      y: y + (Math.random() - 0.5) * 2,
      vx: -30 - Math.random() * 20,
      vy: (Math.random() - 0.5) * 10,
      life: 0.15 + Math.random() * 0.1,
      size: 2 + Math.random() * 2,
      color,
    });
  }

  /** Spawn power-up sparkle */
  sparkle(x, y, color = '#FFDD44') {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * (20 + Math.random() * 30),
        vy: Math.sin(angle) * (20 + Math.random() * 30),
        life: 0.4 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  update(delta) {
    const surviving = [];
    for (const p of this.#active) {
      p.life -= delta;
      if (p.life <= 0) { this.#free(p); continue; }
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vy += 10 * delta; // slight gravity
      p.alpha = p.life / p.maxLife;
      surviving.push(p);
    }
    this.#active = surviving;
  }

  draw(ctx) {
    for (const p of this.#active) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      const s = p.size * p.alpha + 0.5;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, s * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - s * 0.5, p.y - s * 0.5, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() { this.#active.forEach(p => this.#free(p)); this.#active = []; }
}
