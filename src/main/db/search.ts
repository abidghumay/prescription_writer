import type Database from 'better-sqlite3';

export interface BrandSearchResult {
  id: number;
  brand_name: string;
  generic_name: string;
  generic_id: number;
  manufacturer_name: string;
  strength: string;
  dosage_form: string;
  route?: string | null;
  pack_price_bdt?: number | null;
  is_custom: boolean;
  use_count: number;
  score: number;
}

export interface DrugSearchResponse {
  query: string;
  duration_ms: number;
  matches: BrandSearchResult[];
  siblings: {
    generic_name: string;
    strength: string;
    items: BrandSearchResult[];
  } | null;
}

// Simple Levenshtein distance for typo tolerance
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = [];

  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost, // substitution
      );
    }
  }
  return d[m][n];
}

export function searchDrugs(
  db: Database.Database,
  rawQuery: string,
): DrugSearchResponse {
  const startTime = performance.now();
  const query = rawQuery.trim().toLowerCase();

  if (!query || query.length < 1) {
    return {
      query,
      duration_ms: 0,
      matches: [],
      siblings: null,
    };
  }

  // Sanitize query for FTS5 (remove special characters)
  const sanitized = query.replace(/[^\w\s]/g, ' ').trim();
  const ftsToken = `${sanitized}*`;

  // 1. Primary Query: Try FTS5 prefix search across brand, generic, manufacturer
  const ftsStmt = db.prepare(`
    SELECT 
      b.id,
      b.brand_name,
      g.id as generic_id,
      g.name as generic_name,
      COALESCE(m.name, 'Unknown') as manufacturer_name,
      COALESCE(b.strength, '') as strength,
      COALESCE(b.dosage_form, '') as dosage_form,
      b.route,
      b.pack_price_bdt,
      b.is_custom,
      COALESCE(u.use_count, 0) as use_count
    FROM brand_fts f
    JOIN brand b ON b.id = f.brand_id
    JOIN generic g ON g.id = b.generic_id
    LEFT JOIN manufacturer m ON m.id = b.manufacturer_id
    LEFT JOIN brand_usage u ON u.brand_id = b.id
    WHERE brand_fts MATCH ?
    LIMIT 50
  `);

  let rows: any[] = [];
  try {
    rows = ftsStmt.all(ftsToken);
  } catch {
    // If syntax issue in FTS, fallback to empty
    rows = [];
  }

  // 2. Typo Tolerance Fallback: If 0 or very few results, scan brands for fuzzy matches
  if (rows.length < 3) {
    const allBrandsStmt = db.prepare(`
      SELECT 
        b.id,
        b.brand_name,
        g.id as generic_id,
        g.name as generic_name,
        COALESCE(m.name, 'Unknown') as manufacturer_name,
        COALESCE(b.strength, '') as strength,
        COALESCE(b.dosage_form, '') as dosage_form,
        b.route,
        b.pack_price_bdt,
        b.is_custom,
        COALESCE(u.use_count, 0) as use_count
      FROM brand b
      JOIN generic g ON g.id = b.generic_id
      LEFT JOIN manufacturer m ON m.id = b.manufacturer_id
      LEFT JOIN brand_usage u ON u.brand_id = b.id
      LIMIT 300
    `);

    const allBrands = allBrandsStmt.all() as any[];
    const existingIds = new Set(rows.map((r) => r.id));

    for (const b of allBrands) {
      if (existingIds.has(b.id)) continue;
      const bLower = b.brand_name.toLowerCase();
      const gLower = b.generic_name.toLowerCase();

      // Check substring or Levenshtein distance
      const bDist = levenshteinDistance(query, bLower);
      const gDist = levenshteinDistance(query, gLower);
      const maxDist = query.length <= 4 ? 1 : 2;

      if (
        bLower.includes(query) ||
        gLower.includes(query) ||
        bDist <= maxDist ||
        gDist <= maxDist
      ) {
        rows.push(b);
        existingIds.add(b.id);
      }
    }
  }

  // 3. Compute Ranking Scores (Section 6.2 rules)
  const scoredMatches: BrandSearchResult[] = rows.map((r) => {
    const bLower = r.brand_name.toLowerCase();
    const gLower = r.generic_name.toLowerCase();
    let score = 0;

    // Rule 1: Exact brand match
    if (bLower === query) {
      score += 1000;
    } else if (bLower.startsWith(query)) {
      // Rule 1b: Exact brand prefix match
      score += 500;
    }

    // Rule 2: Frequent usage ranking
    score += (r.use_count || 0) * 50;

    // Rule 3: Generic matches
    if (gLower === query) {
      score += 300;
    } else if (gLower.startsWith(query)) {
      score += 150;
    } else if (gLower.includes(query)) {
      score += 70;
    }

    // Rule 4: Substring / Fuzzy
    if (bLower.includes(query) && !bLower.startsWith(query)) {
      score += 40;
    }

    return {
      id: r.id,
      brand_name: r.brand_name,
      generic_name: r.generic_name,
      generic_id: r.generic_id,
      manufacturer_name: r.manufacturer_name,
      strength: r.strength,
      dosage_form: r.dosage_form,
      route: r.route,
      pack_price_bdt: r.pack_price_bdt,
      is_custom: Boolean(r.is_custom),
      use_count: r.use_count,
      score,
    };
  });

  // Sort descending by score
  scoredMatches.sort((a, b) => b.score - a.score);

  // 4. Sibling Grouping ("Same generic (GenericName)")
  let siblingsGroup: DrugSearchResponse['siblings'] = null;

  if (scoredMatches.length > 0) {
    const topMatch = scoredMatches[0];
    const topGenericId = topMatch.generic_id;
    const topStrength = topMatch.strength;

    // Find other brands with the same generic from other manufacturers
    const siblingStmt = db.prepare(`
      SELECT 
        b.id,
        b.brand_name,
        g.id as generic_id,
        g.name as generic_name,
        COALESCE(m.name, 'Unknown') as manufacturer_name,
        COALESCE(b.strength, '') as strength,
        COALESCE(b.dosage_form, '') as dosage_form,
        b.route,
        b.pack_price_bdt,
        b.is_custom,
        COALESCE(u.use_count, 0) as use_count
      FROM brand b
      JOIN generic g ON g.id = b.generic_id
      LEFT JOIN manufacturer m ON m.id = b.manufacturer_id
      LEFT JOIN brand_usage u ON u.brand_id = b.id
      WHERE b.generic_id = ? AND b.id != ?
      ORDER BY u.use_count DESC, b.brand_name ASC
      LIMIT 10
    `);

    const siblingRows: any[] = siblingStmt.all(topGenericId, topMatch.id);
    if (siblingRows.length > 0) {
      siblingsGroup = {
        generic_name: topMatch.generic_name,
        strength: topStrength,
        items: siblingRows.map((s) => ({
          id: s.id,
          brand_name: s.brand_name,
          generic_name: s.generic_name,
          generic_id: s.generic_id,
          manufacturer_name: s.manufacturer_name,
          strength: s.strength,
          dosage_form: s.dosage_form,
          route: s.route,
          pack_price_bdt: s.pack_price_bdt,
          is_custom: Boolean(s.is_custom),
          use_count: s.use_count,
          score: 0,
        })),
      };
    }
  }

  const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    query,
    duration_ms,
    matches: scoredMatches.slice(0, 15),
    siblings: siblingsGroup,
  };
}
