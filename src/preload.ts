import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings, CustomDrugInput, IpcApi } from './shared/types';

const api: IpcApi = {
  ping: () => ipcRenderer.invoke('app:ping'),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: AppSettings) =>
    ipcRenderer.invoke('settings:save', settings),
  searchDrugs: (query: string) => ipcRenderer.invoke('drugs:search', query),
  addCustomDrug: (drug: CustomDrugInput) =>
    ipcRenderer.invoke('drugs:add-custom', drug),
  getDatabaseStats: () => ipcRenderer.invoke('db:stats'),

  // Patient IPC
  createPatient: (patient) => ipcRenderer.invoke('patients:create', patient),
  searchPatients: (query) => ipcRenderer.invoke('patients:search', query),
  getPatient: (id) => ipcRenderer.invoke('patients:get', id),

  // Prescription IPC
  createPrescription: (input) =>
    ipcRenderer.invoke('prescriptions:create', input),
  finalizePrescription: (id) =>
    ipcRenderer.invoke('prescriptions:finalize', id),
  getPrescription: (id) => ipcRenderer.invoke('prescriptions:get', id),
  getPatientPrescriptions: (patientId) =>
    ipcRenderer.invoke('prescriptions:get-by-patient', patientId),
  getAllPrescriptions: (searchQuery) =>
    ipcRenderer.invoke('prescriptions:get-all', searchQuery),
  deletePrescription: (id) => ipcRenderer.invoke('prescriptions:delete', id),

  // Draft IPC
  saveDraft: (draft) => ipcRenderer.invoke('draft:save', draft),
  loadDraft: () => ipcRenderer.invoke('draft:load'),
  clearDraft: () => ipcRenderer.invoke('draft:clear'),

  // Settings persistence
  saveSettingsToDB: (settings) =>
    ipcRenderer.invoke('settings:save-db', settings),
  loadSettingsFromDB: () => ipcRenderer.invoke('settings:load-db'),
};

contextBridge.exposeInMainWorld('api', api);
