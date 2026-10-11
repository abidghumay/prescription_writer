import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FileEdit, Search, Users, Settings } from 'lucide-react';
import type { AppSettings, DatabaseStats } from '../shared/types';
import OnboardingModal from './OnboardingModal';

export interface LayoutContextType {
  settings: AppSettings;
  stats: DatabaseStats | null;
  refreshStats: () => Promise<void>;
  updateSettings: (newSettings: AppSettings) => Promise<boolean>;
}

export default function Layout() {
  const [settings, setSettings] = useState<AppSettings>({
    isOnboarded: false,
    doctorName: '',
    degrees: '',
    bmdcReg: '',
    specialty: 'General Physician',
    chamberName: '',
    chamberAddress: '',
    chamberHours: '5:00 PM - 9:00 PM',
    chamberPhone: '',
    consultationFee: null,
    printHeaderMode: 'full',
  });
  const [ipcConnected, setIpcConnected] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);

  const refreshStats = async () => {
    if (window.api?.getDatabaseStats) {
      const st = await window.api.getDatabaseStats();
      if (st) setStats(st);
    }
  };

  const updateSettings = async (newSettings: AppSettings): Promise<boolean> => {
    setSettings(newSettings);
    if (window.api?.saveSettingsToDB) {
      await window.api.saveSettingsToDB(newSettings);
    }
    if (window.api?.saveSettings) {
      await window.api.saveSettings(newSettings);
    }
    return true;
  };

  useEffect(() => {
    if (window.api) {
      window.api.ping().then((res) => {
        if (res === 'pong') setIpcConnected(true);
      });
      // Load persistent doctor settings from SQLite
      if (window.api.loadSettingsFromDB) {
        window.api.loadSettingsFromDB().then((loaded) => {
          if (loaded) setSettings(loaded);
        });
      } else if (window.api.getSettings) {
        window.api.getSettings().then((loaded) => {
          if (loaded) setSettings(loaded);
        });
      }
      refreshStats();
    }
  }, []);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center gap-2.5 ${
      isActive
        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-2xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="flex h-screen w-full bg-slate-100/70 text-slate-900 select-none font-sans">
      {/* First-Run Onboarding Modal */}
      {!settings.isOnboarded && (
        <OnboardingModal
          initialSettings={settings}
          onComplete={async (saved) => {
            await updateSettings(saved);
          }}
        />
      )}

      {/* Left Navigation Rail */}
      <aside className="w-60 border-r border-slate-200 bg-white flex flex-col justify-between p-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-6 px-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              ℞
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-slate-900 flex items-center gap-1">
                <span>ProtonRx Next</span>
              </h1>
              <p className="text-[10px] text-teal-700 font-semibold tracking-wide">
                Offline Clinical Suite
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            <NavLink to="/" end className={navItemClass}>
              <FileEdit className="w-4 h-4 text-teal-600" />
              <span>Prescription Canvas</span>
            </NavLink>
            <NavLink to="/search" className={navItemClass}>
              <Search className="w-4 h-4 text-slate-500" />
              <span>Drug Formulary</span>
            </NavLink>
            <NavLink to="/patients" className={navItemClass}>
              <Users className="w-4 h-4 text-slate-500" />
              <span>Patient Records</span>
            </NavLink>
            <NavLink to="/settings" className={navItemClass}>
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Chamber Settings</span>
            </NavLink>
          </nav>
        </div>

        {/* Bottom Section: Doctor Profile + IPC & DB status */}
        <div className="space-y-3">
          {/* Doctor Profile Mini Badge */}
          <div className="pt-3 border-t border-slate-200">
            <NavLink
              to="/settings"
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group border border-slate-200/60"
            >
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200 shadow-2xs">
                {settings.doctorName
                  ? settings.doctorName
                      .replace(/^Dr\.?\s*/i, '')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'DR'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-teal-700">
                  {settings.doctorName || 'Setup Doctor Profile'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {settings.specialty || 'Offline Account'}
                </p>
              </div>
            </NavLink>
          </div>

          {/* Database & IPC Status Card */}
          <div className="text-xs text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span>Engine IPC</span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    ipcConnected
                      ? 'bg-emerald-500 ring-2 ring-emerald-100'
                      : 'bg-amber-400'
                  }`}
                />
                {ipcConnected ? 'Online' : 'Starting'}
              </span>
            </div>
            {stats && (
              <div className="bg-slate-50 rounded p-2 text-[11px] space-y-0.5 border border-slate-200/60">
                <div className="flex justify-between text-slate-600">
                  <span>Brands:</span>
                  <span className="font-semibold text-slate-800">
                    {stats.totalBrands}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Generics:</span>
                  <span className="font-semibold text-slate-800">
                    {stats.totalGenerics}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Source:</span>
                  <span className="font-mono text-teal-700">
                    {stats.source} ({stats.version})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet context={{ settings, stats, refreshStats, updateSettings }} />
      </main>
    </div>
  );
}
