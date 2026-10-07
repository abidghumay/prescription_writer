import React, { useEffect, useState, useRef } from 'react';
import type { AppSettings, BrandSearchResult, DatabaseStats, DrugSearchResponse } from './shared/types';

export default function App() {
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
  const [activeTab, setActiveTab] = useState<'editor' | 'search_test' | 'patients' | 'presets' | 'settings'>('search_test');

  // Search state
  const [query, setQuery] = useState('napa');
  const [searchResults, setSearchResults] = useState<DrugSearchResponse | null>(null);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedDrug, setSelectedDrug] = useState<BrandSearchResult | null>(null);

  // Custom drug modal/form state
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [customGeneric, setCustomGeneric] = useState('');
  const [customMfr, setCustomMfr] = useState('');
  const [customStrength, setCustomStrength] = useState('');
  const [customForm, setCustomForm] = useState('Tablet');

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Flattened list of all navigable items: matches first, then siblings below
  const allNavigableItems: BrandSearchResult[] = [
    ...(searchResults?.matches || []),
    ...(searchResults?.siblings?.items || []),
  ];

  useEffect(() => {
    if (window.api) {
      window.api.ping().then((res) => {
        if (res === 'pong') setIpcConnected(true);
      });
      window.api.getSettings().then((loaded) => {
        if (loaded) setSettings(loaded);
      });
      window.api.getDatabaseStats().then((st) => {
        if (st) setStats(st);
      });
    }
  }, []);

  // Trigger search whenever query changes
  useEffect(() => {
    if (!window.api || !window.api.searchDrugs) return;
    if (!query.trim()) {
      setSearchResults(null);
      setSelectedIndex(0);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      window.api.searchDrugs(query).then((res) => {
        setSearchResults(res);
        setIsSearching(false);
        setSelectedIndex(0); // Reset selection to top match whenever query changes
      });
    }, 40); // 40ms light debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Handle keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allNavigableItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allNavigableItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allNavigableItems[selectedIndex];
      if (current) {
        setSelectedDrug(current);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSearchResults(null);
    }
  };

  const handleSelectDrug = (drug: BrandSearchResult) => {
    setSelectedDrug(drug);
    inputRef.current?.focus();
  };

  const handleAddCustomDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBrand || !customGeneric || !window.api) return;

    await window.api.addCustomDrug({
      brand_name: customBrand,
      generic_name: customGeneric,
      manufacturer_name: customMfr,
      strength: customStrength,
      dosage_form: customForm,
    });

    const updatedStats = await window.api.getDatabaseStats();
    setStats(updatedStats);
    setQuery(customBrand);
    setShowAddCustom(false);
    setCustomBrand('');
    setCustomGeneric('');
    setCustomStrength('');
  };

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
              <h1 className="font-semibold text-sm leading-tight text-slate-800">Prescription Writer</h1>
              <p className="text-xs text-slate-400">Offline Edition</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('search_test')}
              className={`w-full text-left px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                activeTab === 'search_test'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Drug Search (Phase 1)
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`w-full text-left px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                activeTab === 'editor'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Prescription Editor
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`w-full text-left px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                activeTab === 'patients'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Patients
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`w-full text-left px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                activeTab === 'presets'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Database & IPC Status Card */}
        <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-between">
            <span>Engine IPC</span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  ipcConnected ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-amber-400'
                }`}
              />
              {ipcConnected ? 'Online' : 'Starting'}
            </span>
          </div>
          {stats && (
            <div className="bg-slate-50 rounded p-2 text-[11px] space-y-0.5 border border-slate-200/60">
              <div className="flex justify-between text-slate-600">
                <span>Brands:</span>
                <span className="font-semibold text-slate-800">{stats.totalBrands}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Generics:</span>
                <span className="font-semibold text-slate-800">{stats.totalGenerics}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Source:</span>
                <span className="font-mono text-teal-700">{stats.source} ({stats.version})</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'search_test' ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Inline Medicine Search & Autocomplete</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Type to search &middot; Use <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[11px] font-mono text-slate-700">↑</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[11px] font-mono text-slate-700">↓</kbd> to move &middot; Press <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[11px] font-mono text-slate-700">Enter</kbd> to select
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCustom(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
                >
                  + Add Custom Brand
                </button>
              </div>

              {/* Quick Sample Queries */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-medium">Try test:</span>
                {[
                  { label: '"napa"', val: 'napa' },
                  { label: '"paracitamol" (typo)', val: 'paracitamol' },
                  { label: '"napaa" (typo)', val: 'napaa' },
                  { label: '"seclo"', val: 'seclo' },
                  { label: '"omeprazole"', val: 'omeprazole' },
                  { label: '"bizoran"', val: 'bizoran' },
                ].map((t) => (
                  <button
                    key={t.val}
                    onClick={() => {
                      setQuery(t.val);
                      setSelectedDrug(null);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 text-xs rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* SEARCH INPUT BOX WITH INLINE AUTOCOMPLETE DROPDOWN */}
              <div className="mt-5 relative">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedDrug(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type brand or generic (e.g. napa, paracetamol, seclo)..."
                    autoFocus
                    className="w-full px-4 py-3.5 pl-11 text-base rounded-lg border-2 border-slate-300 focus:outline-none focus:border-teal-600 font-medium text-slate-800 shadow-sm transition-all"
                  />
                  <div className="absolute left-3.5 text-slate-400 font-bold text-base">
                    🔍
                  </div>
                  {isSearching && (
                    <div className="absolute right-3.5 text-xs text-teal-600 animate-pulse font-medium">
                      Searching...
                    </div>
                  )}
                </div>

                {/* Status line */}
                {searchResults && (
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-400 px-1">
                    <span>
                      Found <strong className="text-slate-700">{searchResults.matches.length}</strong> matches
                      {searchResults.siblings ? ` + ${searchResults.siblings.items.length} alternatives` : ''}
                    </span>
                    <span>
                      Latency: <strong className="text-emerald-600 font-mono">{searchResults.duration_ms} ms</strong> (FTS5)
                    </span>
                  </div>
                )}

                {/* INLINE AUTOCOMPLETE DROPDOWN DIRECTLY UNDER INPUT */}
                {searchResults && allNavigableItems.length > 0 && (
                  <div
                    ref={listRef}
                    className="mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-[440px] overflow-y-auto z-20"
                  >
                    {/* SECTION 1: DIRECT MATCHES (Napa comes first here!) */}
                    <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-200/80 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <span>Direct Matches</span>
                      <span className="font-normal lowercase text-slate-400">↑↓ to navigate &middot; Enter to select</span>
                    </div>

                    {searchResults.matches.map((item, idx) => {
                      const isHighlighted = selectedIndex === idx;
                      return (
                        <div
                          key={`match-${item.id}`}
                          onClick={() => handleSelectDrug(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${
                            isHighlighted
                              ? 'bg-teal-50 border-l-4 border-teal-600 pl-3'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-slate-900">{item.brand_name}</span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {item.dosage_form}
                              </span>
                              <span className="text-xs text-slate-600 font-medium">{item.strength}</span>
                              {item.is_custom && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              Generic: <strong className="text-slate-700">{item.generic_name}</strong>
                              <span className="mx-2 text-slate-300">|</span>
                              Mfr: <span className="text-slate-600">{item.manufacturer_name}</span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1">
                            {isHighlighted && (
                              <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded flex items-center gap-1">
                                ↵ Enter to select
                              </span>
                            )}
                            {item.pack_price_bdt && (
                              <span className="text-xs font-mono text-slate-500">
                                ৳{item.pack_price_bdt.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* SECTION 2: SIBLING GROUP (ALTERNATIVES WITH SAME GENERIC) */}
                    {searchResults.siblings && searchResults.siblings.items.length > 0 && (
                      <>
                        <div className="bg-teal-50/70 px-4 py-2 border-t border-b border-teal-200/70 flex items-center justify-between text-[11px] font-bold text-teal-900">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                            Same Generic ({searchResults.siblings.generic_name} {searchResults.siblings.strength}) — Other Companies
                          </span>
                          <span className="text-[10px] text-teal-700 font-normal">Alternatives</span>
                        </div>

                        {searchResults.siblings.items.map((item, sIdx) => {
                          const overallIndex = searchResults.matches.length + sIdx;
                          const isHighlighted = selectedIndex === overallIndex;
                          return (
                            <div
                              key={`sibling-${item.id}`}
                              onClick={() => handleSelectDrug(item)}
                              onMouseEnter={() => setSelectedIndex(overallIndex)}
                              className={`px-4 py-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                                isHighlighted
                                  ? 'bg-teal-50 border-l-4 border-teal-600 pl-3'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-slate-800">{item.brand_name}</span>
                                  <span className="text-xs text-slate-500">{item.strength}</span>
                                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                    {item.dosage_form}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400">{item.manufacturer_name}</p>
                              </div>

                              <div className="text-right flex items-center gap-2">
                                {isHighlighted && (
                                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded">
                                    ↵ Select
                                  </span>
                                )}
                                {item.pack_price_bdt && (
                                  <span className="text-xs font-mono text-slate-400">
                                    ৳{item.pack_price_bdt.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* SELECTED MEDICINE CONFIRMATION CARD */}
              {selectedDrug && (
                <div className="mt-6 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          ✓ Selected for Prescription
                        </span>
                        <h3 className="text-base font-bold text-emerald-950">
                          {selectedDrug.brand_name} {selectedDrug.strength} {selectedDrug.dosage_form}
                        </h3>
                      </div>
                      <p className="text-xs text-emerald-800 mt-1">
                        Generic: <strong>{selectedDrug.generic_name}</strong> &middot; Manufacturer: {selectedDrug.manufacturer_name}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDrug(null);
                        inputRef.current?.focus();
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-medium px-2 py-1 rounded hover:bg-emerald-100"
                    >
                      Clear Selection
                    </button>
                  </div>

                  {/* Flow preview for Phase 2: Dose tokens */}
                  <div className="mt-3 pt-3 border-t border-emerald-200/80 flex items-center gap-3 text-xs text-emerald-900">
                    <span className="font-semibold text-emerald-800">Next in Phase 2:</span>
                    <span>Cursor auto-advances to Dose (e.g. typing <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-teal-800">101</code> expands to <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-teal-800">1+0+1</code>)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Prescription Editor Placeholder */
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-sm rounded-xl p-8 min-h-[750px] flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-200 pb-5 mb-6 text-center">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{settings.doctorName}</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {settings.degrees} · {settings.bmdcReg}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {settings.chamberName} · {settings.chamberAddress} · {settings.chamberHours}
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center my-8">
                <div className="max-w-md mx-auto">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 mb-3">
                    Phase 1 Complete
                  </span>
                  <h3 className="text-base font-semibold text-slate-700">Autocomplete Ready</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "Drug Search (Phase 1)" in the left menu to test the real-time autocomplete and Enter-to-select.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Offline-First Prescription Engine</span>
              <span>Keyboard Shortcuts: ? for help</span>
            </div>
          </div>
        )}
      </main>

      {/* Add Custom Drug Modal */}
      {showAddCustom && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Add Custom Medicine</h3>
            <p className="text-xs text-slate-500 mb-4">
              Save a medicine not yet in the official database. It will immediately be indexed for autocomplete.
            </p>

            <form onSubmit={handleAddCustomDrug} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="e.g. MyBrand"
                  className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name *</label>
                <input
                  type="text"
                  required
                  value={customGeneric}
                  onChange={(e) => setCustomGeneric(e.target.value)}
                  placeholder="e.g. Paracetamol"
                  className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Strength</label>
                  <input
                    type="text"
                    value={customStrength}
                    onChange={(e) => setCustomStrength(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Form</label>
                  <select
                    value={customForm}
                    onChange={(e) => setCustomForm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Suspension">Suspension</option>
                    <option value="Injection">Injection</option>
                    <option value="Eye Drops">Eye Drops</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={customMfr}
                  onChange={(e) => setCustomMfr(e.target.value)}
                  placeholder="e.g. Square / Beximco"
                  className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-teal-600 text-white hover:bg-teal-700"
                >
                  Save & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
