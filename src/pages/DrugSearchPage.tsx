import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { BrandSearchResult, DrugSearchResponse } from '../shared/types';
import type { LayoutContextType } from '../components/Layout';

export default function DrugSearchPage() {
  const outletContext = useOutletContext<LayoutContextType | null>();

  // Search state
  const [query, setQuery] = useState('napa');
  const [searchResults, setSearchResults] = useState<DrugSearchResponse | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedDrug, setSelectedDrug] = useState<BrandSearchResult | null>(
    null,
  );

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
      setSelectedIndex((prev) =>
        prev < allNavigableItems.length - 1 ? prev + 1 : prev,
      );
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

    if (outletContext?.refreshStats) {
      await outletContext.refreshStats();
    }
    setQuery(customBrand);
    setShowAddCustom(false);
    setCustomBrand('');
    setCustomGeneric('');
    setCustomStrength('');
  };

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white border border-studio-border shadow-xs rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-ink-900">
                Inline Medicine Search & Autocomplete
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Type to search &middot; Use{' '}
                <kbd className="px-1.5 py-0.5 bg-beige-100 border border-beige-300 rounded text-[11px] font-mono text-ink-800">
                  ↑
                </kbd>{' '}
                <kbd className="px-1.5 py-0.5 bg-beige-100 border border-beige-300 rounded text-[11px] font-mono text-ink-800">
                  ↓
                </kbd>{' '}
                to move &middot; Press{' '}
                <kbd className="px-1.5 py-0.5 bg-beige-100 border border-beige-300 rounded text-[11px] font-mono text-ink-800">
                  Enter
                </kbd>{' '}
                to select
              </p>
            </div>
            <button
              onClick={() => setShowAddCustom(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gold-600 text-white hover:bg-gold-700 active:bg-gold-800 transition-colors shadow-xs cursor-pointer"
            >
              + Add Custom Brand
            </button>
          </div>

          {/* Quick Sample Queries */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-beige-200">
            <span className="text-xs text-ink-500 font-medium">Try test:</span>
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
                className="px-2.5 py-1 text-xs rounded-full bg-beige-100 hover:bg-gold-50 hover:text-gold-900 text-ink-700 border border-beige-300 transition-colors cursor-pointer"
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
                className="w-full px-4 py-3.5 pl-11 text-base rounded-xl border-2 border-beige-300 focus:outline-none focus:border-gold-600 bg-ivory-50 font-medium text-ink-900 shadow-xs transition-all"
              />
              <div className="absolute left-3.5 text-ink-400 font-bold text-base">
                🔍
              </div>
              {isSearching && (
                <div className="absolute right-3.5 text-xs text-gold-700 animate-pulse font-medium">
                  Searching...
                </div>
              )}
            </div>

            {/* Status line */}
            {searchResults && (
              <div className="flex items-center justify-between mt-2 text-xs text-ink-500 px-1">
                <span>
                  Found{' '}
                  <strong className="text-ink-800">
                    {searchResults.matches.length}
                  </strong>{' '}
                  matches
                  {searchResults.siblings
                    ? ` + ${searchResults.siblings.items.length} alternatives`
                    : ''}
                </span>
                <span>
                  Latency:{' '}
                  <strong className="text-emerald-700 font-mono">
                    {searchResults.duration_ms} ms
                  </strong>{' '}
                  (FTS5)
                </span>
              </div>
            )}

            {/* INLINE AUTOCOMPLETE DROPDOWN DIRECTLY UNDER INPUT */}
            {searchResults && allNavigableItems.length > 0 && (
              <div
                ref={listRef}
                className="mt-2 bg-white border border-studio-border rounded-xl shadow-lg overflow-hidden divide-y divide-beige-200 max-h-[440px] overflow-y-auto z-20"
              >
                {/* SECTION 1: DIRECT MATCHES */}
                <div className="bg-beige-50 px-4 py-2 border-b border-beige-200 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  <span>Direct Matches</span>
                  <span className="font-normal lowercase text-ink-400">
                    ↑↓ to navigate &middot; Enter to select
                  </span>
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
                          ? 'bg-gold-50/70 border-l-4 border-gold-600 pl-3'
                          : 'hover:bg-beige-50/60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-ink-900">
                            {item.brand_name}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-beige-100 text-ink-700">
                            {item.dosage_form}
                          </span>
                          <span className="text-xs text-ink-600 font-medium">
                            {item.strength}
                          </span>
                          {item.is_custom && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-ink-500">
                          Generic:{' '}
                          <strong className="text-ink-800">
                            {item.generic_name}
                          </strong>
                          <span className="mx-2 text-beige-300">|</span>
                          Mfr:{' '}
                          <span className="text-ink-600">
                            {item.manufacturer_name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        {isHighlighted && (
                          <span className="text-[11px] font-semibold text-gold-800 bg-gold-100 px-2 py-0.5 rounded flex items-center gap-1 border border-gold-300">
                            ↵ Enter to select
                          </span>
                        )}
                        {item.pack_price_bdt && (
                          <span className="text-xs font-mono text-ink-500">
                            ৳{item.pack_price_bdt.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* SECTION 2: SIBLING GROUP (ALTERNATIVES WITH SAME GENERIC) */}
                {searchResults.siblings &&
                  searchResults.siblings.items.length > 0 && (
                    <>
                      <div className="bg-sand-100 px-4 py-2 border-t border-b border-beige-300 flex items-center justify-between text-[11px] font-bold text-ink-800">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span>
                          Same Generic ({searchResults.siblings.generic_name}{' '}
                          {searchResults.siblings.strength}) — Other Companies
                        </span>
                        <span className="text-[10px] text-gold-800 font-medium bg-gold-100 px-2 py-0.5 rounded">
                          Alternatives
                        </span>
                      </div>

                      {searchResults.siblings.items.map((item, sIdx) => {
                        const overallIndex =
                          searchResults.matches.length + sIdx;
                        const isHighlighted = selectedIndex === overallIndex;
                        return (
                          <div
                            key={`sibling-${item.id}`}
                            onClick={() => handleSelectDrug(item)}
                            onMouseEnter={() => setSelectedIndex(overallIndex)}
                            className={`px-4 py-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                              isHighlighted
                                ? 'bg-gold-50/70 border-l-4 border-gold-600 pl-3'
                                : 'hover:bg-beige-50/60'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-ink-900">
                                  {item.brand_name}
                                </span>
                                <span className="text-xs text-ink-600">
                                  {item.strength}
                                </span>
                                <span className="text-[11px] px-1.5 py-0.2 rounded bg-beige-100 text-ink-700">
                                  {item.dosage_form}
                                </span>
                              </div>
                              <p className="text-[11px] text-ink-400">
                                {item.manufacturer_name}
                              </p>
                            </div>

                            <div className="text-right flex items-center gap-2">
                              {isHighlighted && (
                                <span className="text-[11px] font-semibold text-gold-800 bg-gold-100 px-2 py-0.5 rounded border border-gold-300">
                                  ↵ Select
                                </span>
                              )}
                              {item.pack_price_bdt && (
                                <span className="text-xs font-mono text-ink-500">
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
            <div className="mt-6 p-4 rounded-xl bg-gold-50/70 border-2 border-gold-300 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gold-900 bg-gold-200/80 px-2 py-0.5 rounded">
                      ✓ Selected for Prescription
                    </span>
                    <h3 className="text-base font-bold text-ink-950">
                      {selectedDrug.brand_name} {selectedDrug.strength}{' '}
                      {selectedDrug.dosage_form}
                    </h3>
                  </div>
                  <p className="text-xs text-ink-700 mt-1">
                    Generic: <strong>{selectedDrug.generic_name}</strong>{' '}
                    &middot; Manufacturer: {selectedDrug.manufacturer_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDrug(null);
                    inputRef.current?.focus();
                  }}
                  className="text-xs text-gold-800 hover:text-gold-950 font-medium px-2 py-1 rounded hover:bg-gold-100 transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>

              {/* Flow preview for Phase 2: Dose tokens */}
              <div className="mt-3 pt-3 border-t border-gold-200/80 flex items-center gap-3 text-xs text-ink-700">
                <span className="font-semibold text-gold-900">
                  Next in Phase 2:
                </span>
                <span>
                  Cursor auto-advances to Dose (e.g. typing{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-gold-800 border border-gold-200">
                    101
                  </code>{' '}
                  expands to{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-gold-800 border border-gold-200">
                    1+0+1
                  </code>
                  )
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Drug Modal */}
      {showAddCustom && (
        <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-beige-300 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-ink-900 mb-1">
              Add Custom Medicine
            </h3>
            <p className="text-xs text-ink-500 mb-4">
              Save a medicine not yet in the official database. It will
              immediately be indexed for autocomplete.
            </p>

            <form onSubmit={handleAddCustomDrug} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="e.g. MyBrand"
                  className="w-full px-3 py-2 text-sm border border-beige-300 rounded-xl focus:border-gold-600 focus:ring-1 focus:ring-gold-500 outline-none bg-ivory-50 text-ink-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Generic Name *
                </label>
                <input
                  type="text"
                  required
                  value={customGeneric}
                  onChange={(e) => setCustomGeneric(e.target.value)}
                  placeholder="e.g. Paracetamol"
                  className="w-full px-3 py-2 text-sm border border-beige-300 rounded-xl focus:border-gold-600 focus:ring-1 focus:ring-gold-500 outline-none bg-ivory-50 text-ink-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Strength
                  </label>
                  <input
                    type="text"
                    value={customStrength}
                    onChange={(e) => setCustomStrength(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full px-3 py-2 text-sm border border-beige-300 rounded-xl focus:border-gold-600 focus:ring-1 focus:ring-gold-500 outline-none bg-ivory-50 text-ink-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Form
                  </label>
                  <select
                    value={customForm}
                    onChange={(e) => setCustomForm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-beige-300 rounded-xl focus:border-gold-600 focus:ring-1 focus:ring-gold-500 outline-none bg-ivory-50 text-ink-900"
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
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={customMfr}
                  onChange={(e) => setCustomMfr(e.target.value)}
                  placeholder="e.g. Square / Beximco"
                  className="w-full px-3 py-2 text-sm border border-beige-300 rounded-xl focus:border-gold-600 focus:ring-1 focus:ring-gold-500 outline-none bg-ivory-50 text-ink-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-beige-200">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="px-3 py-1.5 text-xs text-ink-600 hover:bg-beige-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-gold-600 text-white hover:bg-gold-700 active:bg-gold-800 transition-colors shadow-xs cursor-pointer"
                >
                  Save & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
