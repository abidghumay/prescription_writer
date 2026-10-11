const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Parse CLI args: --source <name> --file <path>
const args = process.argv.slice(2);
let source = 'sample';
let filePath = path.join(__dirname, '../db/seed/sample_drugs.json');
let version = '1.0';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--source' && args[i + 1]) {
    source = args[++i];
  } else if (args[i] === '--file' && args[i + 1]) {
    filePath = path.resolve(process.cwd(), args[++i]);
  } else if (args[i] === '--version' && args[i + 1]) {
    version = args[++i];
  }
}

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'prescription_writer.sqlite');
const db = new Database(dbPath);

// Ensure schema is applied
const schemaSql = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS generic (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  synonyms TEXT
);

CREATE TABLE IF NOT EXISTS manufacturer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS brand (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_name TEXT NOT NULL,
  generic_id INTEGER NOT NULL REFERENCES generic(id),
  manufacturer_id INTEGER REFERENCES manufacturer(id),
  strength TEXT,
  dosage_form TEXT,
  route TEXT,
  pack_price_bdt REAL,
  dgda_reg_no TEXT,
  source TEXT NOT NULL,
  source_version TEXT,
  is_custom INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE VIRTUAL TABLE IF NOT EXISTS brand_fts USING fts5(
  brand_name,
  generic_name,
  manufacturer_name,
  strength,
  brand_id UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 2',
  prefix = '2 3 4'
);

CREATE TABLE IF NOT EXISTS brand_usage (
  brand_id INTEGER PRIMARY KEY REFERENCES brand(id) ON DELETE CASCADE,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

db.exec(schemaSql);

// Read entries
const rawContent = fs.readFileSync(filePath, 'utf-8');
const entries = JSON.parse(rawContent);

console.log(`\n======================================================`);
console.log(` Starting Import: [Source: ${source}] [Version: ${version}]`);
console.log(` Total entries to process: ${entries.length}`);
console.log(` Target DB: ${dbPath}`);
console.log(`======================================================\n`);

const startTime = Date.now();
let inserted = 0;
let updated = 0;
let skipped = 0;
const suspicious = [];

const findGeneric = db.prepare(
  'SELECT id, name FROM generic WHERE LOWER(name) = LOWER(?)',
);
const insertGeneric = db.prepare(
  'INSERT INTO generic (name, synonyms) VALUES (?, ?)',
);
const updateGenericSyn = db.prepare(
  'UPDATE generic SET synonyms = ? WHERE id = ?',
);

const findMfr = db.prepare(
  'SELECT id FROM manufacturer WHERE LOWER(name) = LOWER(?)',
);
const insertMfr = db.prepare('INSERT INTO manufacturer (name) VALUES (?)');

const findBrand = db.prepare(`
  SELECT id FROM brand 
  WHERE LOWER(brand_name) = LOWER(?) 
    AND generic_id = ? 
    AND (manufacturer_id = ? OR (manufacturer_id IS NULL AND ? IS NULL))
    AND (LOWER(COALESCE(strength, '')) = LOWER(COALESCE(?, '')))
`);

const insertBrand = db.prepare(`
  INSERT INTO brand (
    brand_name, generic_id, manufacturer_id, strength, dosage_form, route,
    pack_price_bdt, dgda_reg_no, source, source_version, is_custom
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
`);

const deleteFts = db.prepare('DELETE FROM brand_fts WHERE brand_id = ?');
const insertFts = db.prepare(`
  INSERT INTO brand_fts (brand_name, generic_name, manufacturer_name, strength, brand_id)
  VALUES (?, ?, ?, ?, ?)
`);

const importTx = db.transaction(() => {
  for (let i = 0; i < entries.length; i++) {
    const row = entries[i];
    const bName = (row.brand_name || '').trim();
    const gName = (row.generic_name || '').trim();
    const mName = (row.manufacturer_name || '').trim();
    const str = (row.strength || '').trim();
    const form = (row.dosage_form || '').trim();
    const route = (row.route || '').trim();
    const price =
      typeof row.pack_price_bdt === 'number' ? row.pack_price_bdt : null;
    const dgda = (row.dgda_reg_no || '').trim();

    if (!bName) {
      skipped++;
      suspicious.push({
        row: i + 1,
        item: gName || 'Empty row',
        reason: 'Missing brand name',
      });
      continue;
    }
    if (!gName) {
      skipped++;
      suspicious.push({
        row: i + 1,
        item: bName,
        reason: 'Brand has no generic name',
      });
      continue;
    }

    let genericId;
    const exGen = findGeneric.get(gName);
    if (exGen) {
      genericId = exGen.id;
      if (row.synonyms) updateGenericSyn.run(row.synonyms.trim(), genericId);
    } else {
      const res = insertGeneric.run(
        gName,
        row.synonyms ? row.synonyms.trim() : null,
      );
      genericId = res.lastInsertRowid;
    }

    let mfrId = null;
    if (mName) {
      const exMfr = findMfr.get(mName);
      if (exMfr) {
        mfrId = exMfr.id;
      } else {
        const res = insertMfr.run(mName);
        mfrId = res.lastInsertRowid;
      }
    }

    const exBrand = findBrand.get(bName, genericId, mfrId, mfrId, str || null);
    if (exBrand) {
      updated++;
      deleteFts.run(exBrand.id);
      insertFts.run(bName, gName, mName, str, exBrand.id);
    } else {
      const res = insertBrand.run(
        bName,
        genericId,
        mfrId,
        str || null,
        form || null,
        route || null,
        price,
        dgda || null,
        source,
        version,
      );
      insertFts.run(bName, gName, mName, str, res.lastInsertRowid);
      inserted++;
    }
  }
});

importTx();
const duration = Date.now() - startTime;

console.log(`\n----------------- IMPORT REPORT -----------------`);
console.log(` Source:           ${source} (${version})`);
console.log(` Rows Read:        ${entries.length}`);
console.log(` Rows Inserted:    ${inserted}`);
console.log(` Rows Updated:     ${updated}`);
console.log(` Rows Skipped:     ${skipped}`);
console.log(` Suspicious Rows:  ${suspicious.length}`);
if (suspicious.length > 0) {
  suspicious.forEach((s) =>
    console.log(`   - Row ${s.row}: "${s.item}" -> ${s.reason}`),
  );
}
console.log(` Duration:         ${duration} ms`);
console.log(` Status:           COMPLETED SUCCESSFUL`);
console.log(`-------------------------------------------------\n`);

db.close();
