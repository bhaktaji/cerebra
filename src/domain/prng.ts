/**
 * Deterministic Seeded PRNG (Mulberry32 + FNV-1a string hashing)
 * Guarantees that (gameId, levelNumber) always produces the exact same sequence
 * of random numbers across all platforms, sessions, and test runs.
 */
export class SeededRandom {
  private state: number;

  constructor(seedInput: string | number) {
    if (typeof seedInput === 'number') {
      this.state = (seedInput ^ 0x9e3779b9) >>> 0;
    } else {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < seedInput.length; i++) {
        h ^= seedInput.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      this.state = h || 0x6d2b79f5;
    }
    // Warm up state
    this.next();
    this.next();
  }

  /** Returns a float in [0, 1) */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Picks a single element from a non-empty array */
  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)];
  }

  /** Returns a deterministically shuffled shallow copy of an array */
  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /** Picks k distinct items from an array */
  sample<T>(items: readonly T[], k: number): T[] {
    return this.shuffle(items).slice(0, Math.min(k, items.length));
  }
}
