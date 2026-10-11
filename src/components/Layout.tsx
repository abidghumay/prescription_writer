import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FileEdit, Search, Users, Settings } from 'lucide-react';
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
    `w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center gap-2.5 ${
      isActive
        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-2xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="flex h-screen w-full bg-slate-100/70 text-slate-900 select-none font-sans">
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
