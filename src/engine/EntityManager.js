/**
 * Manages a flat list of entities.
 * Entities: plain objects with update(delta) and draw(ctx) methods + alive flag.
 */
export class EntityManager {
  #list = [];

  add(entity) {
    this.#list.push(entity);
    return entity;
  }

  remove(entity) {
    entity.alive = false;
  }

  getAll() {
    return this.#list;
  }

  getAlive() {
    return this.#list.filter(e => e.alive);
  }

  getGroup(type) {
    return this.#list.filter(e => e.alive && e.type === type);
  }

  update(delta) {
    for (const e of this.#list) {
      if (e.alive) e.update?.(delta);
    }
    // Prune dead entities
    if (this.#list.length > 400) {
      this.#list = this.#list.filter(e => e.alive);
    }
  }

  draw(ctx) {
    for (const e of this.#list) {
      if (e.alive) e.draw?.(ctx);
    }
  }

  clear() {
    this.#list = [];
  }

  prune() {
    this.#list = this.#list.filter(e => e.alive);
  }

  count(type) {
    return this.#list.filter(e => e.alive && (!type || e.type === type)).length;
  }
}
