export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Generics
CREATE TABLE IF NOT EXISTS generic (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  synonyms TEXT
);

-- Manufacturers
CREATE TABLE IF NOT EXISTS manufacturer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Brands
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

CREATE INDEX IF NOT EXISTS idx_brand_name ON brand(brand_name);
CREATE INDEX IF NOT EXISTS idx_brand_generic ON brand(generic_id);

-- FTS5 Full-Text Search Table
CREATE VIRTUAL TABLE IF NOT EXISTS brand_fts USING fts5(
  brand_name,
  generic_name,
  manufacturer_name,
  strength,
  brand_id UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 2',
  prefix = '2 3 4'
);

-- Doctor usage stats for ranking
CREATE TABLE IF NOT EXISTS brand_usage (
  brand_id INTEGER PRIMARY KEY REFERENCES brand(id) ON DELETE CASCADE,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Patients
CREATE TABLE IF NOT EXISTS patient (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age_years INTEGER,
  age_months INTEGER,
  sex TEXT CHECK (sex IN ('M','F','O')),
  phone TEXT,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescription (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patient(id),
  visit_date TEXT NOT NULL,
  weight_kg REAL,
  chief_complaints TEXT,
  on_examination TEXT,
  diagnosis TEXT,
  investigations TEXT,
  advice TEXT,
  follow_up TEXT,
  ai_summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','final')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  finalized_at TEXT
);

-- Prescription Items (with immutable snapshots)
CREATE TABLE IF NOT EXISTS prescription_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prescription_id INTEGER NOT NULL REFERENCES prescription(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  brand_id INTEGER REFERENCES brand(id),
  free_text_name TEXT,
  strength_snapshot TEXT,
  form_snapshot TEXT,
  generic_snapshot TEXT,
  dose TEXT NOT NULL,
  meal_timing TEXT,
  duration TEXT,
  note TEXT
);

-- Presets
CREATE TABLE IF NOT EXISTS preset (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  chief_complaints TEXT,
  diagnosis TEXT,
  advice TEXT,
  follow_up TEXT
);

CREATE TABLE IF NOT EXISTS preset_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_id INTEGER NOT NULL REFERENCES preset(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  brand_id INTEGER REFERENCES brand(id),
  free_text_name TEXT,
  dose TEXT,
  meal_timing TEXT,
  duration TEXT,
  note TEXT
);

-- App Settings Key-Value
CREATE TABLE IF NOT EXISTS app_setting (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
