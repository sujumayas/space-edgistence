/**
 * Generic object pool. Avoids GC churn for short-lived entities (bullets,
 * bills, drips). Objects are pre-allocated and reset on acquire; "freed"
 * objects are kept in place and reused.
 *
 * Usage:
 *   const pool = new Pool(() => ({ x: 0, y: 0, alive: false }));
 *   const b = pool.acquire(); b.x = 10; ...
 *   pool.release(b);              // marks free
 *   pool.forEachActive(b => ...) // iterate live ones
 */
export class Pool<T extends { active: boolean }> {
  private items: T[] = [];
  private factory: () => T;
  private reset?: (item: T) => void;

  constructor(factory: () => T, reset?: (item: T) => void) {
    this.factory = factory;
    this.reset = reset;
  }

  acquire(): T {
    for (const item of this.items) {
      if (!item.active) {
        item.active = true;
        this.reset?.(item);
        return item;
      }
    }
    const created = this.factory();
    created.active = true;
    this.reset?.(created);
    this.items.push(created);
    return created;
  }

  release(item: T): void {
    item.active = false;
  }

  releaseAll(): void {
    for (const item of this.items) item.active = false;
  }

  forEachActive(fn: (item: T) => void): void {
    for (const item of this.items) {
      if (item.active) fn(item);
    }
  }

  countActive(): number {
    let n = 0;
    for (const item of this.items) if (item.active) n++;
    return n;
  }

  /** All backing items (active + free); for debugging. */
  get all(): readonly T[] {
    return this.items;
  }
}
