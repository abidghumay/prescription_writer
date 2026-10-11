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
    `w-full text-left px-3.5 py-2.5 text-xs rounded-xl font-medium transition-all flex items-center gap-3 ${
      isActive
        ? 'bg-white text-gold-700 font-semibold border border-beige-300 shadow-xs'
        : 'text-ink-600 hover:bg-beige-200/60 hover:text-ink-900 border border-transparent'
    }`;

  return (
    <div className="flex h-screen w-full bg-studio-base text-ink-900 select-none font-sans">
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
      <aside className="w-64 border-r border-beige-300 bg-beige-100/90 backdrop-blur-xl flex flex-col justify-between p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-6 px-1.5 pt-1">
            <div className="w-10 h-10 rounded-xl bg-gold-600 border border-gold-700/30 flex items-center justify-center text-ivory-50 font-bold text-xl shadow-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              ℞
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-ink-900 flex items-center gap-1.5">
                <span>ProtonRx Next</span>
              </h1>
              <p className="text-[10px] text-gold-600 font-semibold tracking-wider uppercase">
                Clinical Atelier
              </p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <NavLink to="/" end className={navItemClass}>
              <FileEdit className="w-4 h-4 text-gold-600 shrink-0" />
              <span>Prescription Canvas</span>
            </NavLink>
            <NavLink to="/search" className={navItemClass}>
              <Search className="w-4 h-4 text-ink-500 shrink-0" />
              <span>Drug Formulary</span>
            </NavLink>
            <NavLink to="/patients" className={navItemClass}>
              <Users className="w-4 h-4 text-ink-500 shrink-0" />
              <span>Patient Records</span>
            </NavLink>
            <NavLink to="/settings" className={navItemClass}>
              <Settings className="w-4 h-4 text-ink-500 shrink-0" />
              <span>Chamber Settings</span>
            </NavLink>
          </nav>
        </div>

        {/* Bottom Section: Doctor Profile + IPC & DB status */}
        <div className="space-y-3">
          {/* Doctor Profile Mini Badge */}
          <div className="pt-3 border-t border-beige-300">
            <NavLink
              to="/settings"
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white transition-all group border border-beige-300 hover:border-gold-500/50 bg-white/70 shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-gold-50 text-gold-700 font-bold text-xs flex items-center justify-center shrink-0 border border-gold-200 shadow-inner">
                {settings.doctorName
                  ? settings.doctorName
                      .replace(/^Dr\.?\s*/i, '')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'DR'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink-900 truncate group-hover:text-gold-700 transition-colors">
                  {settings.doctorName || 'Setup Doctor Profile'}
                </p>
                <p className="text-[10px] text-ink-500 truncate">
                  {settings.specialty || 'Offline Account'}
                </p>
              </div>
            </NavLink>
          </div>

          {/* Database & IPC Status Card */}
          <div className="text-xs text-ink-600 space-y-2">
            <div className="flex items-center justify-between px-1 text-[11px]">
              <span className="font-medium text-ink-600">Engine IPC</span>
              <span className="flex items-center gap-1.5 font-semibold text-ink-800">
                <span
                  className={`w-2 h-2 rounded-full ${
                    ipcConnected
                      ? 'bg-gold-600 ring-2 ring-gold-200 shadow-xs'
                      : 'bg-amber-500 ring-2 ring-amber-200'
                  }`}
                />
                {ipcConnected ? 'Online' : 'Starting'}
              </span>
            </div>
            {stats && (
              <div className="bg-white/80 rounded-xl p-2.5 text-[11px] space-y-1 border border-beige-300 shadow-xs">
                <div className="flex justify-between text-ink-600">
                  <span>Brands:</span>
                  <span className="font-semibold text-ink-900 font-mono">
                    {stats.totalBrands}
                  </span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Generics:</span>
                  <span className="font-semibold text-ink-900 font-mono">
                    {stats.totalGenerics}
                  </span>
                </div>
                <div className="flex justify-between text-ink-500 pt-0.5 border-t border-beige-200">
                  <span>Source:</span>
                  <span className="font-mono text-gold-700 text-[10px]">
                    {stats.source} ({stats.version})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 bg-studio-base">
        <Outlet context={{ settings, stats, refreshStats, updateSettings }} />
      </main>
    </div>
  );
}
