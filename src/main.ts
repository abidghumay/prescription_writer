import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import type { AppSettings, CustomDrugInput } from './shared/types';
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
  const countRow = db.prepare('SELECT COUNT(*) as count FROM brand').get() as { count: number };
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
    let gen = db.prepare('SELECT id FROM generic WHERE LOWER(name) = LOWER(?)').get(gName) as { id: number } | undefined;
    let genericId: number;
    if (gen) {
      genericId = gen.id;
    } else {
      const res = db.prepare('INSERT INTO generic (name) VALUES (?)').run(gName);
      genericId = Number(res.lastInsertRowid);
    }

    // Lookup/insert manufacturer
    let mfrId: number | null = null;
    if (mName) {
      let mfr = db.prepare('SELECT id FROM manufacturer WHERE LOWER(name) = LOWER(?)').get(mName) as { id: number } | undefined;
      if (mfr) {
        mfrId = mfr.id;
      } else {
        const res = db.prepare('INSERT INTO manufacturer (name) VALUES (?)').run(mName);
        mfrId = Number(res.lastInsertRowid);
      }
    }

    // Insert custom brand
    const ins = db.prepare(`
      INSERT INTO brand (brand_name, generic_id, manufacturer_id, strength, dosage_form, source, source_version, is_custom)
      VALUES (?, ?, ?, ?, ?, 'custom_doctor', '1.0', 1)
    `).run(bName, genericId, mfrId, str || null, form || null);

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
    const brands = (db.prepare('SELECT COUNT(*) as count FROM brand').get() as any).count;
    const generics = (db.prepare('SELECT COUNT(*) as count FROM generic').get() as any).count;
    const mfrs = (db.prepare('SELECT COUNT(*) as count FROM manufacturer').get() as any).count;
    const sampleCount = (db.prepare("SELECT COUNT(*) as count FROM brand WHERE source = 'sample'").get() as any).count;

    return {
      totalBrands: brands,
      totalGenerics: generics,
      totalManufacturers: mfrs,
      source: sampleCount > 0 ? 'sample' : 'imported',
      version: '1.0',
    };
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
