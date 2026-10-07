import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { SCHEMA_SQL } from '../src/main/db/schema';
import { importDrugDataset } from '../src/main/db/importer';
import { searchDrugs } from '../src/main/db/search';
import sampleDrugs from '../db/seed/sample_drugs.json';

describe('Medicine FTS5 Search & Autocomplete Engine', () => {
  let db: Database.Database;

  beforeAll(() => {
    // In-memory test database
    db = new Database(':memory:');
    db.exec(SCHEMA_SQL);

    // Import sample dataset
    const report = importDrugDataset(db, sampleDrugs as any, 'sample', '1.0');
    expect(report.inserted).toBeGreaterThan(0);
  });

  it('ranks exact brand match first when typing napa', () => {
    const res = searchDrugs(db, 'napa');
    expect(res.matches.length).toBeGreaterThan(0);
    expect(res.matches[0].brand_name).toBe('Napa');
    expect(res.duration_ms).toBeLessThan(50);
  });

  it('provides sibling group of same generic (Paracetamol) from other companies', () => {
    const res = searchDrugs(db, 'napa');
    expect(res.siblings).not.toBeNull();
    expect(res.siblings?.generic_name).toBe('Paracetamol');

    const siblingBrandNames = res.siblings?.items.map((i) => i.brand_name);
    expect(siblingBrandNames).toContain('Ace');
    expect(siblingBrandNames).toContain('Fast');
  });

  it('returns all brands when searching by generic name (paracetamol)', () => {
    const res = searchDrugs(db, 'paracetamol');
    const brandNames = res.matches.map((m) => m.brand_name);
    expect(brandNames).toContain('Napa');
    expect(brandNames).toContain('Ace');
    expect(res.duration_ms).toBeLessThan(50);
  });

  it('tolerates brand typos (e.g., napaa -> Napa)', () => {
    const res = searchDrugs(db, 'napaa');
    expect(res.matches.length).toBeGreaterThan(0);
    const topBrand = res.matches[0].brand_name;
    expect(topBrand.startsWith('Napa')).toBe(true);
  });

  it('tolerates generic typos (e.g., paracitamol -> Paracetamol)', () => {
    const res = searchDrugs(db, 'paracitamol');
    expect(res.matches.length).toBeGreaterThan(0);
    const topGeneric = res.matches[0].generic_name;
    expect(topGeneric).toBe('Paracetamol');
  });

  it('completes search under 50ms', () => {
    const res = searchDrugs(db, 'seclo');
    expect(res.duration_ms).toBeLessThan(50);
    expect(res.matches[0].brand_name).toBe('Seclo');
  });
});
