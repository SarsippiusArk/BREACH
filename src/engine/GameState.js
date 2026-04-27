export class GameState {
  #scenes = {};
  #current = null;
  #name = null;

  register(name, scene) {
    this.#scenes[name] = scene;
  }

  go(name, data = {}) {
    if (this.#current?.exit) this.#current.exit();
    this.#current = this.#scenes[name];
    this.#name = name;
    if (this.#current?.enter) this.#current.enter(data);
  }

  get currentName() { return this.#name; }

  update(delta, input) {
    this.#current?.update?.(delta, input);
  }

  draw(ctx) {
    this.#current?.draw?.(ctx);
  }
}
