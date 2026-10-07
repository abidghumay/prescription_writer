import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings, CustomDrugInput, IpcApi } from './shared/types';

const api: IpcApi = {
  ping: () => ipcRenderer.invoke('app:ping'),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:save', settings),
  searchDrugs: (query: string) => ipcRenderer.invoke('drugs:search', query),
  addCustomDrug: (drug: CustomDrugInput) => ipcRenderer.invoke('drugs:add-custom', drug),
  getDatabaseStats: () => ipcRenderer.invoke('db:stats'),
};

contextBridge.exposeInMainWorld('api', api);
