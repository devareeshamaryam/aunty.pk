/**
 * Lightweight client-side recommendation engine.
 *
 * We never train a model — instead we keep two small score maps in
 * localStorage (per browser, tied to the guestId implicitly because the
 * data is local to the device) and rank products at render time.
 *
 * Signals (with weights tuned so a single purchase beats many idle views):
 *
 *   - view:        +1
 *   - dwell 10s+:  +3
 *   - dwell 30s+:  +5
 *   - add-to-cart: +6
 *   - delivered:   +12
 *
 * Each event bumps both the product and its category. The homepage
 * "Picks for you" row asks the lib for `topCategoryIds()` and `productScore()`
 * to rank items.
 *
 * To keep behaviour fresh, scores are time-decayed (~30 days half-life)
 * whenever the lib is read.
 */

const PRODUCT_KEY = 'aunty.prefs.products';
const CATEGORY_KEY = 'aunty.prefs.categories';
const META_KEY = 'aunty.prefs.meta';

const DECAY_HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type ScoreMap = Record<string, number>;

interface Meta {
  lastDecayAt: number;
}

// ─── Read/write helpers ────────────────────────────────────────────

function readMap(key: string): ScoreMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ScoreMap) : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, map: ScoreMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* quota — ignore */
  }
}

function readMeta(): Meta {
  if (typeof window === 'undefined') return { lastDecayAt: Date.now() };
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw) as Meta;
  } catch {}
  return { lastDecayAt: Date.now() };
}

function writeMeta(m: Meta) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {}
}

/** Apply exponential decay; called lazily on read. */
function maybeDecay() {
  const meta = readMeta();
  const elapsed = Date.now() - meta.lastDecayAt;
  if (elapsed < 24 * 60 * 60 * 1000) return; // run at most once per day
  const factor = Math.pow(0.5, elapsed / DECAY_HALF_LIFE_MS);
  for (const key of [PRODUCT_KEY, CATEGORY_KEY]) {
    const m = readMap(key);
    let touched = false;
    for (const k of Object.keys(m)) {
      const v = m[k] * factor;
      if (v < 0.05) {
        delete m[k];
      } else {
        m[k] = v;
      }
      touched = true;
    }
    if (touched) writeMap(key, m);
  }
  writeMeta({ lastDecayAt: Date.now() });
}

// ─── Public API ────────────────────────────────────────────────────

function bump(productId: string, categoryId: string | undefined | null, points: number) {
  if (!productId || points <= 0 || typeof window === 'undefined') return;
  const p = readMap(PRODUCT_KEY);
  p[productId] = (p[productId] || 0) + points;
  writeMap(PRODUCT_KEY, p);
  if (categoryId) {
    const c = readMap(CATEGORY_KEY);
    c[categoryId] = (c[categoryId] || 0) + points;
    writeMap(CATEGORY_KEY, c);
  }
}

export const Prefs = {
  /** Called when a product detail page loads. */
  view(productId: string, categoryId?: string | null) {
    bump(productId, categoryId, 1);
  },
  /** Called when the dwell timer crosses 10s. */
  dwellSoft(productId: string, categoryId?: string | null) {
    bump(productId, categoryId, 3);
  },
  /** Called when the dwell timer crosses 30s. */
  dwellDeep(productId: string, categoryId?: string | null) {
    bump(productId, categoryId, 5);
  },
  /** Called when an item is added to the cart. */
  addedToCart(productId: string, categoryId?: string | null) {
    bump(productId, categoryId, 6);
  },
  /** Called when an order containing this product is delivered. */
  delivered(productId: string, categoryId?: string | null) {
    bump(productId, categoryId, 12);
  },

  /**
   * Score for a single product. Combines its own score with a fraction of
   * its category score so users see "more of what they like" even when the
   * specific product is new to them.
   */
  productScore(productId: string, categoryId?: string | null): number {
    maybeDecay();
    const p = readMap(PRODUCT_KEY)[productId] || 0;
    const c = categoryId ? readMap(CATEGORY_KEY)[categoryId] || 0 : 0;
    return p + c * 0.4;
  },

  /** Top N category IDs ordered by score. Useful for "pull from these first". */
  topCategoryIds(limit = 3): string[] {
    maybeDecay();
    const c = readMap(CATEGORY_KEY);
    return Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  },

  /** Whether the lib has enough data to personalize. */
  hasSignal(): boolean {
    maybeDecay();
    const p = readMap(PRODUCT_KEY);
    return Object.keys(p).length > 0;
  },

  /** Reset everything (debug / "clear my data" affordance). */
  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PRODUCT_KEY);
    localStorage.removeItem(CATEGORY_KEY);
    localStorage.removeItem(META_KEY);
  },
};
