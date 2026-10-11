import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { AppSettingsSchema } from './shared/types';
import type {
  AppSettings,
  CustomDrugInput,
  Patient,
  PatientInput,
  Prescription,
  PrescriptionInput,
  PrescriptionItem,
  DraftData,
} from './shared/types';
import { initDatabase } from './main/db/database';
import { searchDrugs } from './main/db/search';
import { importDrugDataset } from './main/db/importer';
import sampleDrugs from '../db/seed/sample_drugs.json';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let inMemorySettings: AppSettings = {
  doctorName: 'Dr. Sample Name',
  degrees: 'MBBS (Sample)',
  bmdcReg: 'BMDC Reg. No. 00000',
  chamberName: 'Sample Chamber',
  chamberAddress: 'Chamber Address, Dhaka',
  chamberHours: '5:00 PM - 9:00 PM',
  chamberPhone: '+880 1700-000000',
};

const setupIpcHandlers = () => {
  // Initialize Database
  const db = initDatabase();

  // If brand table is empty, auto-seed with sample drugs
  const countRow = db.prepare('SELECT COUNT(*) as count FROM brand').get() as {
    count: number;
  };
  if (countRow.count === 0) {
    importDrugDataset(db, sampleDrugs as any, 'sample', '1.0');
  }

  // App & Settings IPC
  ipcMain.handle('app:ping', () => 'pong');
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('settings:get', () => inMemorySettings);
  ipcMain.handle('settings:save', (_event, newSettings: AppSettings) => {
    inMemorySettings = { ...inMemorySettings, ...newSettings };
    return true;
  });

  // Drug Search IPC
  ipcMain.handle('drugs:search', (_event, query: string) => {
    return searchDrugs(db, query);
  });

  // Add Custom Drug IPC (doctor entered custom brand)
  ipcMain.handle('drugs:add-custom', (_event, drug: CustomDrugInput) => {
    const bName = drug.brand_name.trim();
    const gName = drug.generic_name.trim();
    const mName = (drug.manufacturer_name || '').trim();
    const str = (drug.strength || '').trim();
    const form = (drug.dosage_form || '').trim();

    if (!bName || !gName) return false;

    // Lookup/insert generic
    let gen = db
      .prepare('SELECT id FROM generic WHERE LOWER(name) = LOWER(?)')
      .get(gName) as { id: number } | undefined;
    let genericId: number;
    if (gen) {
      genericId = gen.id;
    } else {
      const res = db
        .prepare('INSERT INTO generic (name) VALUES (?)')
        .run(gName);
      genericId = Number(res.lastInsertRowid);
    }

    // Lookup/insert manufacturer
    let mfrId: number | null = null;
    if (mName) {
      let mfr = db
        .prepare('SELECT id FROM manufacturer WHERE LOWER(name) = LOWER(?)')
        .get(mName) as { id: number } | undefined;
      if (mfr) {
        mfrId = mfr.id;
      } else {
        const res = db
          .prepare('INSERT INTO manufacturer (name) VALUES (?)')
          .run(mName);
        mfrId = Number(res.lastInsertRowid);
      }
    }

    // Insert custom brand
    const ins = db
      .prepare(`
      INSERT INTO brand (brand_name, generic_id, manufacturer_id, strength, dosage_form, source, source_version, is_custom)
      VALUES (?, ?, ?, ?, ?, 'custom_doctor', '1.0', 1)
    `)
      .run(bName, genericId, mfrId, str || null, form || null);

    const brandId = Number(ins.lastInsertRowid);

    // Sync into FTS
    db.prepare(`
      INSERT INTO brand_fts (brand_name, generic_name, manufacturer_name, strength, brand_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(bName, gName, mName, str, brandId);

    return true;
  });

  // Database stats IPC
  ipcMain.handle('db:stats', () => {
    const brands = (
      db.prepare('SELECT COUNT(*) as count FROM brand').get() as any
    ).count;
    const generics = (
      db.prepare('SELECT COUNT(*) as count FROM generic').get() as any
    ).count;
    const mfrs = (
      db.prepare('SELECT COUNT(*) as count FROM manufacturer').get() as any
    ).count;
    const sampleCount = (
      db
        .prepare("SELECT COUNT(*) as count FROM brand WHERE source = 'sample'")
        .get() as any
    ).count;

    return {
      totalBrands: brands,
      totalGenerics: generics,
      totalManufacturers: mfrs,
      source: sampleCount > 0 ? 'sample' : 'imported',
      version: '1.0',
    };
  });

  // Patient IPC
  ipcMain.handle('patients:create', (_event, input: PatientInput): Patient => {
    const name = input.name.trim();
    const ageYears = input.age_years ?? null;
    const ageMonths = input.age_months ?? null;
    const sex = input.sex ?? null;
    const phone = input.phone?.trim() || null;
    const address = input.address?.trim() || null;
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO patient (name, age_years, age_months, sex, phone, address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      name,
      ageYears,
      ageMonths,
      sex,
      phone,
      address,
      createdAt,
    );
    const id = Number(info.lastInsertRowid);

    return {
      id,
      name,
      age_years: ageYears,
      age_months: ageMonths,
      sex,
      phone,
      address,
      created_at: createdAt,
    };
  });

  ipcMain.handle('patients:search', (_event, query: string): Patient[] => {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return db
        .prepare(
          'SELECT id, name, age_years, age_months, sex, phone, address, created_at FROM patient ORDER BY id DESC LIMIT 20',
        )
        .all() as Patient[];
    }
    const likePattern = `%${trimmed}%`;
    return db
      .prepare(`
        SELECT id, name, age_years, age_months, sex, phone, address, created_at
        FROM patient
        WHERE LOWER(name) LIKE LOWER(?) OR (phone IS NOT NULL AND phone LIKE ?)
        ORDER BY id DESC
        LIMIT 20
      `)
      .all(likePattern, likePattern) as Patient[];
  });

  ipcMain.handle('patients:get', (_event, id: number): Patient | null => {
    const patient = db
      .prepare(
        'SELECT id, name, age_years, age_months, sex, phone, address, created_at FROM patient WHERE id = ?',
      )
      .get(id) as Patient | undefined;
    return patient ?? null;
  });

  // Prescription IPC
  ipcMain.handle(
    'prescriptions:create',
    (_event, input: PrescriptionInput): Prescription => {
      const createTx = db.transaction(() => {
        const now = new Date().toISOString();
        const insertPrescription = db.prepare(`
        INSERT INTO prescription (
          patient_id, visit_date, weight_kg, chief_complaints, on_examination,
          diagnosis, investigations, advice, follow_up, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
      `);

        const info = insertPrescription.run(
          input.patient_id,
          input.visit_date,
          input.weight_kg ?? null,
          input.chief_complaints ?? null,
          input.on_examination ?? null,
          input.diagnosis ?? null,
          input.investigations ?? null,
          input.advice ?? null,
          input.follow_up ?? null,
          now,
        );

        const prescriptionId = Number(info.lastInsertRowid);

        const insertItem = db.prepare(`
        INSERT INTO prescription_item (
          prescription_id, position, brand_id, free_text_name,
          strength_snapshot, form_snapshot, generic_snapshot,
          dose, meal_timing, duration, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

        const itemsWithIds: PrescriptionItem[] = [];
        const items = input.items || [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const pos = item.position !== undefined ? item.position : i + 1;
          const itemRes = insertItem.run(
            prescriptionId,
            pos,
            item.brand_id ?? null,
            item.free_text_name ?? null,
            item.strength_snapshot ?? null,
            item.form_snapshot ?? null,
            item.generic_snapshot ?? null,
            item.dose,
            item.meal_timing ?? null,
            item.duration ?? null,
            item.note ?? null,
          );
          itemsWithIds.push({
            ...item,
            id: Number(itemRes.lastInsertRowid),
            position: pos,
          });
        }

        return {
          id: prescriptionId,
          patient_id: input.patient_id,
          visit_date: input.visit_date,
          weight_kg: input.weight_kg ?? null,
          chief_complaints: input.chief_complaints ?? null,
          on_examination: input.on_examination ?? null,
          diagnosis: input.diagnosis ?? null,
          investigations: input.investigations ?? null,
          advice: input.advice ?? null,
          follow_up: input.follow_up ?? null,
          status: 'draft' as const,
          created_at: now,
          finalized_at: null,
          items: itemsWithIds,
        };
      });

      return createTx();
    },
  );

  ipcMain.handle('prescriptions:finalize', (_event, id: number): boolean => {
    const finalizeTx = db.transaction(() => {
      const now = new Date().toISOString();
      const res = db
        .prepare(`
        UPDATE prescription
        SET status = 'final', finalized_at = ?
        WHERE id = ?
      `)
        .run(now, id);

      if (res.changes === 0) {
        return false;
      }

      // Increment brand_usage.use_count for each item with a brand_id
      const items = db
        .prepare(
          'SELECT brand_id FROM prescription_item WHERE prescription_id = ? AND brand_id IS NOT NULL',
        )
        .all(id) as Array<{ brand_id: number }>;

      const upsertUsage = db.prepare(`
        INSERT INTO brand_usage (brand_id, use_count, last_used_at)
        VALUES (?, 1, ?)
        ON CONFLICT(brand_id) DO UPDATE SET
          use_count = brand_usage.use_count + 1,
          last_used_at = excluded.last_used_at
      `);

      for (const item of items) {
        upsertUsage.run(item.brand_id, now);
      }

      return true;
    });

    return finalizeTx();
  });

  ipcMain.handle(
    'prescriptions:get',
    (_event, id: number): Prescription | null => {
      const prescription = db
        .prepare(`
        SELECT id, patient_id, visit_date, weight_kg, chief_complaints, on_examination,
               diagnosis, investigations, advice, follow_up, status, created_at, finalized_at
        FROM prescription
        WHERE id = ?
      `)
        .get(id) as Omit<Prescription, 'items'> | undefined;

      if (!prescription) return null;

      const items = db
        .prepare(`
        SELECT id, position, brand_id, free_text_name, strength_snapshot,
               form_snapshot, generic_snapshot, dose, meal_timing, duration, note
        FROM prescription_item
        WHERE prescription_id = ?
        ORDER BY position ASC
      `)
        .all(id) as PrescriptionItem[];

      return {
        ...prescription,
        items,
      };
    },
  );

  ipcMain.handle(
    'prescriptions:get-by-patient',
    (_event, patientId: number): Prescription[] => {
      const prescriptions = db
        .prepare(`
        SELECT id, patient_id, visit_date, weight_kg, chief_complaints, on_examination,
               diagnosis, investigations, advice, follow_up, status, created_at, finalized_at
        FROM prescription
        WHERE patient_id = ?
        ORDER BY visit_date DESC, id DESC
      `)
        .all(patientId) as Array<Omit<Prescription, 'items'>>;

      const getItemStmt = db.prepare(`
      SELECT id, position, brand_id, free_text_name, strength_snapshot,
             form_snapshot, generic_snapshot, dose, meal_timing, duration, note
      FROM prescription_item
      WHERE prescription_id = ?
      ORDER BY position ASC
    `);

      return prescriptions.map((p) => ({
        ...p,
        items: getItemStmt.all(p.id) as PrescriptionItem[],
      }));
    },
  );

  // Draft IPC
  ipcMain.handle('draft:save', (_event, draft: DraftData): boolean => {
    const stmt = db.prepare(`
      INSERT INTO app_setting (key, value)
      VALUES ('active_draft', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(JSON.stringify(draft));
    return true;
  });

  ipcMain.handle('draft:load', (): DraftData | null => {
    const row = db
      .prepare("SELECT value FROM app_setting WHERE key = 'active_draft'")
      .get() as { value: string } | undefined;
    if (!row?.value) return null;
    try {
      return JSON.parse(row.value) as DraftData;
    } catch {
      return null;
    }
  });

  ipcMain.handle('draft:clear', (): boolean => {
    db.prepare("DELETE FROM app_setting WHERE key = 'active_draft'").run();
    return true;
  });

  // Settings persistence (upgrade from in-memory)
  ipcMain.handle(
    'settings:save-db',
    (_event, settings: AppSettings): boolean => {
      const parsed = AppSettingsSchema.parse(settings);
      const stmt = db.prepare(`
      INSERT INTO app_setting (key, value)
      VALUES ('doctor_settings', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
      stmt.run(JSON.stringify(parsed));
      inMemorySettings = parsed;
      return true;
    },
  );

  ipcMain.handle('settings:load-db', (): AppSettings => {
    const row = db
      .prepare("SELECT value FROM app_setting WHERE key = 'doctor_settings'")
      .get() as { value: string } | undefined;
    if (!row?.value) {
      return AppSettingsSchema.parse({});
    }
    try {
      const stored = JSON.parse(row.value);
      return AppSettingsSchema.parse(stored);
    } catch {
      return AppSettingsSchema.parse({});
    }
  });
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
