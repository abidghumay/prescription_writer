# Prescription Writer Desktop App (MVP)

An offline-first, keyboard-driven prescription writing desktop application built for a practicing doctor in Bangladesh.

---

## 1. Product Overview & Goal

- **Target User**: Single doctor's chamber (private practice) in Bangladesh.
- **Core Metric**: Write and print a full prescription in **under 30 seconds** of typing, primarily using the keyboard.
- **Architecture Philosophy**:
  - **Offline-First & Zero Cloud Latency**: 100% functional without an internet connection. No external databases (Supabase, Firebase) or cloud backends to fail during chamber power/network cuts.
  - **Zero Medical Hallucination**: No AI-invented medicines, doses, or prices. Drug data comes strictly from the verified local catalog or doctor entry.
  - **Immutable Snapshots**: Saved prescriptions store complete snapshots of generic, brand, strength, and form so future database updates never alter medical records.

---

## 2. Tech Stack

| Layer               | Technology                                      | Rationale                                                                  |
| :------------------ | :---------------------------------------------- | :------------------------------------------------------------------------- |
| **Desktop Shell**   | Electron 44 + Electron Forge                    | Mature Windows printing and PDF control; rock-solid offline lifecycle      |
| **Frontend UI**     | React 19, TypeScript (strict), Tailwind CSS     | Fast rendering, modular component structure, high contrast clinical tokens |
| **Bundler & Dev**   | Vite 8 + Hot Module Replacement (HMR)           | Instant startup and live module reloading                                  |
| **Database**        | SQLite (`better-sqlite3`) + **FTS5** (WAL mode) | Sub-5ms search over 30,000+ formulations; zero server cost                 |
| **IPC Bridge**      | Electron `contextBridge` + Typed IPC            | Sandboxed renderer (`nodeIntegration: false`, `contextIsolation: true`)    |
| **Automated Tests** | Vitest                                          | Fast sub-second test execution for core medical logic                      |

---

## 3. Implementation Roadmap & Current Status

### ✅ Phase 0 — Foundations (COMPLETED)

- [x] Electron + Vite + React 19 + TypeScript scaffold with strict typing.
- [x] Secure window configuration (`sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`).
- [x] Typed IPC skeleton (`window.api`) connecting renderer to main process.
- [x] Design tokens definition (`docs/design-tokens.md`) with calm clinical teal/slate palette.
- [x] Dose notation parser (`src/shared/doseParser.ts`) supporting `101` $\to$ `1+0+1` and halves `h0h` $\to$ `½+0+½`.
- [x] Vitest test framework setup with automated tests passing.

### ✅ Phase 1 — Drug Database & Fast FTS5 Search (COMPLETED)

- [x] Complete SQLite schema (`generic`, `manufacturer`, `brand`, `brand_fts`, `brand_usage`).
- [x] Pluggable, idempotent data importer CLI (`npm run db:import`) with deduplication and import reporting.
- [x] Curated seed dataset of representative Bangladesh pharmaceuticals (`db/seed/sample_drugs.json`).
- [x] FTS5 full-text search with multi-factor ranking:
  1. Exact brand match
  2. Doctor's frequent usage frequency (`brand_usage`)
  3. Generic molecule match
  4. Typo & fuzzy tolerance (`napaa` $\to$ Napa, `paracitamol` $\to$ Paracetamol)
- [x] Sibling generic grouping: typing a brand shows direct matches first, with other manufacturers' alternatives grouped cleanly below.
- [x] Inline autocomplete combobox directly under the search box with <kbd>↑</kbd> / <kbd>↓</kbd> keyboard navigation and <kbd>Enter</kbd>-to-select.
- [x] Custom drug entry modal for doctor to add unlisted brands on the fly (`is_custom = 1`).
- [x] Data source evaluation report comparing Mendeley Data CC BY 4.0, DGHS FHIR, and MedEx (`docs/data-sources-report.md`).

---

### ✅ Phase 2 — Prescription Editor (COMPLETED)

- [x] **Patient Banner**: Inline entry for Patient Name, Age, Sex, Phone, Weight, and Date with quick-match suggestions for returning patients.
- [x] **2-Column Clinical Layout**:
  - **Left Column**: Clinical findings (Chief Complaints `C/C`, On Examination `O/E`, Diagnosis `Dx`, Investigations, Advice, Follow-up).
  - **Right Column**: Rx medicine list with keyboard-navigable rows.
- [x] **Prescription Item Rows**:
  - Selecting a medicine immediately shifts focus to the Dose field.
  - Quick token expansion (`101` $\to$ `1+0+1`, `h01` $\to$ `½+0+1`).
  - Meal timings (Bangla & English), duration presets, instructions.
- [x] **Draft Persistence & Crash Recovery**:
  - Continuous autosave to SQLite draft table via debounced state store.
  - Restores active draft on app relaunch.
- [x] **Rule-Based Duplicate Generic Warning**:
  - Non-blocking amber clinical alert when multiple brands share the same active generic molecule.
- [x] **Atomic Prescription Finalization**:
  - Transactional SQLite commits writing patient, prescription, and immutable items snapshots with brand usage frequency boosts.

---

### ⏳ Phase 3 — Printing & PDF (NEXT SCOPE)

- Professional A4/A5 layout for standard chamber printers.
- Printed header toggle: Plain paper (print doctor header) vs Pre-printed doctor pad (leave top margin blank).
- Embedded Bangla fonts (`Noto Sans Bengali`) for dosage instructions.
- Save as PDF and native Electron silent/preview print.

---

### 📅 Remaining Roadmap

- **Phase 4 — Patients & Presets**: Patient history list, "Repeat last prescription" 1-click feature, regimen presets (e.g., "Fever Adult", "Gastritis").
- **Phase 5 — Backup & Export**: One-click timestamped `.sqlite` backup to external drive/folder, restore flow, Windows installer packaging (`.exe`).
- **Phase 6 — Pediatric Module**: Weight-based dosing (mg/kg), age-appropriate pediatric form filters, WHO growth tracking, vaccination schedule.
- **Phase 7 — Free Drug DB Sync**: Automatic delta updates via GitHub Releases.
- **Phase 8 — Auto-Update**: Silent updater via GitHub Releases.

---

## 4. Getting Started & Development

### Installation

```bash
npm install
```

### Run Desktop App (Development)

```bash
npm start
# or
npm run dev
```

### Run Tests

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

### Run Drug Database Importer

```bash
npm run db:import -- --source sample --file db/seed/sample_drugs.json
```

---

## 5. Security & Privacy Rules

- **Local Storage**: All data resides in `data/prescription_writer.sqlite` on the local machine.
- **No Telemetry**: Zero analytics, trackers, or background cloud calls.
- **Excluded from Version Control**: Personal patient database files and `.vibe-wise/` learning state are strictly ignored in `.gitignore`.
