import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import type { AppSettings, DatabaseStats } from '../shared/types';

export interface LayoutContextType {
  settings: AppSettings;
  stats: DatabaseStats | null;
  refreshStats: () => Promise<void>;
}

export default function Layout() {
  const [settings, setSettings] = useState<AppSettings>({
    doctorName: 'Dr. Sample Name',
    degrees: 'MBBS (Sample)',
    bmdcReg: 'BMDC Reg. No. 00000',
    chamberName: 'Sample Chamber',
    chamberAddress: 'Dhaka, Bangladesh',
    chamberHours: '5:00 PM - 9:00 PM',
    chamberPhone: '+880 1700-000000',
  });
  const [ipcConnected, setIpcConnected] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);

  const refreshStats = async () => {
    if (window.api?.getDatabaseStats) {
      const st = await window.api.getDatabaseStats();
      if (st) setStats(st);
    }
  };

  useEffect(() => {
    if (window.api) {
      window.api.ping().then((res) => {
        if (res === 'pong') setIpcConnected(true);
      });
      window.api.getSettings().then((loaded) => {
        if (loaded) setSettings(loaded);
      });
      refreshStats();
    }
  }, []);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `w-full text-left px-3 py-2 text-sm rounded-md font-medium transition-colors block ${
      isActive
        ? 'bg-teal-50 text-teal-700 font-semibold'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 select-none font-sans">
      {/* Left Navigation Rail */}
      <aside className="w-56 border-r border-slate-200 bg-white flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              Rx
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight text-slate-800">
                Prescription Writer
              </h1>
              <p className="text-xs text-slate-400">Offline Edition</p>
            </div>
          </div>

          <nav className="space-y-1">
            <NavLink to="/" end className={navItemClass}>
              Prescription Editor
            </NavLink>
            <NavLink to="/search" className={navItemClass}>
              Drug Search (Phase 1)
            </NavLink>
            <NavLink to="/patients" className={navItemClass}>
              Patients
            </NavLink>
            <NavLink to="/settings" className={navItemClass}>
              Settings
            </NavLink>
          </nav>
        </div>

        {/* Database & IPC Status Card */}
        <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-between">
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet context={{ settings, stats, refreshStats }} />
      </main>
    </div>
  );
}
