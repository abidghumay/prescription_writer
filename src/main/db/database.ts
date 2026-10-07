import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { SCHEMA_SQL } from './schema';

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  // If running in packaged or dev Electron app
  try {
    if (app && app.getPath) {
      const userData = app.getPath('userData');
      if (!fs.existsSync(userData)) {
        fs.mkdirSync(userData, { recursive: true });
      }
      return path.join(userData, 'prescription_writer.sqlite');
    }
  } catch {
    // Fallback for standalone scripts/tests
  }
  const localDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  return path.join(localDir, 'prescription_writer.sqlite');
}

export function initDatabase(dbPath?: string): Database.Database {
  if (dbInstance) return dbInstance;

  const targetPath = dbPath || getDatabasePath();
  const db = new Database(targetPath);

  // Execute base schema
  db.exec(SCHEMA_SQL);

  dbInstance = db;
  return db;
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
