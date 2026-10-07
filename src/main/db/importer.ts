import type Database from 'better-sqlite3';

export interface RawDrugEntry {
  brand_name: string;
  generic_name: string;
  manufacturer_name?: string;
  strength?: string;
  dosage_form?: string;
  route?: string;
  pack_price_bdt?: number | null;
  dgda_reg_no?: string | null;
  synonyms?: string;
}

export interface ImportReport {
  source: string;
  source_version: string;
  total_read: number;
  inserted: number;
  updated: number;
  skipped: number;
  suspicious: Array<{ row: number; item: string; reason: string }>;
  duration_ms: number;
}

export function normalizeText(text?: string | null): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

export function importDrugDataset(
  db: Database.Database,
  entries: RawDrugEntry[],
  source: string,
  sourceVersion: string = '1.0'
): ImportReport {
  const startTime = Date.now();
  const report: ImportReport = {
    source,
    source_version: sourceVersion,
    total_read: entries.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    suspicious: [],
    duration_ms: 0,
  };

  // Prepared statements for high performance and idempotency
  const findGeneric = db.prepare<[string], { id: number; name: string }>(
    'SELECT id, name FROM generic WHERE LOWER(name) = LOWER(?)'
  );
  const insertGeneric = db.prepare<[string, string | null]>(
    'INSERT INTO generic (name, synonyms) VALUES (?, ?)'
  );
  const updateGenericSynonyms = db.prepare<[string, number]>(
    'UPDATE generic SET synonyms = ? WHERE id = ?'
  );

  const findManufacturer = db.prepare<[string], { id: number }>(
    'SELECT id FROM manufacturer WHERE LOWER(name) = LOWER(?)'
  );
  const insertManufacturer = db.prepare<[string]>(
    'INSERT INTO manufacturer (name) VALUES (?)'
  );

  const findBrand = db.prepare<[string, number, number | null, number | null, string | null], { id: number }>(
    `SELECT id FROM brand 
     WHERE LOWER(brand_name) = LOWER(?) 
       AND generic_id = ? 
       AND (manufacturer_id = ? OR (manufacturer_id IS NULL AND ? IS NULL))
       AND (LOWER(COALESCE(strength, '')) = LOWER(COALESCE(?, '')))`
  );

  const insertBrand = db.prepare(
    `INSERT INTO brand (
      brand_name, generic_id, manufacturer_id, strength, dosage_form, route,
      pack_price_bdt, dgda_reg_no, source, source_version, is_custom
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
  );

  const insertFts = db.prepare(
    `INSERT INTO brand_fts (brand_name, generic_name, manufacturer_name, strength, brand_id)
     VALUES (?, ?, ?, ?, ?)`
  );

  const updateFts = db.prepare(
    `DELETE FROM brand_fts WHERE brand_id = ?`
  );

  const runImport = db.transaction(() => {
    for (let i = 0; i < entries.length; i++) {
      const row = entries[i];
      const brandName = normalizeText(row.brand_name);
      const genericName = normalizeText(row.generic_name);
      const manufacturerName = normalizeText(row.manufacturer_name);
      const strength = normalizeText(row.strength);
      const dosageForm = normalizeText(row.dosage_form);
      const route = normalizeText(row.route);
      const price = typeof row.pack_price_bdt === 'number' ? row.pack_price_bdt : null;
      const dgdaReg = normalizeText(row.dgda_reg_no);

      // Validation & Suspicious Checks
      if (!brandName) {
        report.skipped++;
        report.suspicious.push({
          row: i + 1,
          item: genericName || 'Empty row',
          reason: 'Missing brand name',
        });
        continue;
      }

      if (!genericName) {
        report.skipped++;
        report.suspicious.push({
          row: i + 1,
          item: brandName,
          reason: 'Brand has no generic name',
        });
        continue;
      }

      // 1. Generic lookup or insert
      let genericId: number;
      const existingGeneric = findGeneric.get(genericName);
      if (existingGeneric) {
        genericId = existingGeneric.id;
        if (row.synonyms) {
          const newSyn = normalizeText(row.synonyms);
          updateGenericSynonyms.run(newSyn, genericId);
        }
      } else {
        const info = insertGeneric.run(genericName, row.synonyms ? normalizeText(row.synonyms) : null);
        genericId = Number(info.lastInsertRowid);
      }

      // 2. Manufacturer lookup or insert
      let manufacturerId: number | null = null;
      if (manufacturerName) {
        const existingMfr = findManufacturer.get(manufacturerName);
        if (existingMfr) {
          manufacturerId = existingMfr.id;
        } else {
          const info = insertManufacturer.run(manufacturerName);
          manufacturerId = Number(info.lastInsertRowid);
        }
      }

      // 3. Brand lookup (Idempotency check)
      const existingBrand = findBrand.get(
        brandName,
        genericId,
        manufacturerId,
        manufacturerId,
        strength || null
      );

      if (existingBrand) {
        report.updated++;
        // Keep existing row, ensure FTS is synced
        updateFts.run(existingBrand.id);
        insertFts.run(
          brandName,
          genericName,
          manufacturerName || '',
          strength || '',
          existingBrand.id
        );
      } else {
        const info = insertBrand.run(
          brandName,
          genericId,
          manufacturerId,
          strength || null,
          dosageForm || null,
          route || null,
          price,
          dgdaReg || null,
          source,
          sourceVersion
        );
        const brandId = Number(info.lastInsertRowid);

        insertFts.run(
          brandName,
          genericName,
          manufacturerName || '',
          strength || '',
          brandId
        );
        report.inserted++;
      }
    }
  });

  runImport();
  report.duration_ms = Date.now() - startTime;
  return report;
}
