import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import type { BrandSearchResult, DrugSearchResponse } from '../shared/types';

interface RxMedicineSearchProps {
  onAddDrug: (item: {
    brand_id: number | null;
    free_text_name: string;
    strength_snapshot: string | null;
    form_snapshot: string | null;
    generic_snapshot: string | null;
  }) => void;
}

export default function RxMedicineSearch({ onAddDrug }: RxMedicineSearchProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DrugSearchResponse | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allNavigableItems: BrandSearchResult[] = [
    ...(searchResults?.matches || []),
    ...(searchResults?.siblings?.items || []),
  ];

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults(null);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      if (window.api?.searchDrugs) {
        try {
          const res = await window.api.searchDrugs(trimmed);
          setSearchResults(res);
          setIsOpen(true);
          setSelectedIndex(0);
        } catch (err) {
          console.error('Drug search failed:', err);
        } finally {
          setIsSearching(false);
        }
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectDrug = (drug: BrandSearchResult) => {
    onAddDrug({
      brand_id: drug.id,
      free_text_name: drug.brand_name,
      strength_snapshot: drug.strength,
      form_snapshot: drug.dosage_form,
      generic_snapshot: drug.generic_name,
    });
    setQuery('');
    setIsOpen(false);
    setSearchResults(null);
  };

  const handleAddFreeText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddDrug({
      brand_id: null,
      free_text_name: trimmed,
      strength_snapshot: null,
      form_snapshot: null,
      generic_snapshot: null,
    });
    setQuery('');
    setIsOpen(false);
    setSearchResults(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && searchResults) {
        setIsOpen(true);
        return;
      }
      setSelectedIndex((prev) =>
        prev < allNavigableItems.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (
        isOpen &&
        allNavigableItems.length > 0 &&
        selectedIndex < allNavigableItems.length
      ) {
        const item = allNavigableItems[selectedIndex];
        if (item) {
          handleSelectDrug(item);
          return;
        }
      }
      // If no item selected or list empty, add as free text
      if (query.trim()) {
        handleAddFreeText(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative mt-2">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (searchResults && query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="+ Type medicine name (e.g. Napa, Seclo, Paracetamol) & press Enter..."
          className="w-full pl-9 pr-24 py-2.5 text-xs bg-white border-2 border-teal-600/40 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-medium text-slate-900 placeholder:text-slate-400 shadow-xs"
        />
        <div className="absolute right-3 flex items-center gap-1.5 text-[11px] text-slate-400">
          {isSearching ? (
            <span className="text-teal-600 animate-pulse font-medium">
              Searching...
            </span>
          ) : (
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-600">
              Enter ↵
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-40 divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {/* Header */}
          <div className="bg-slate-50 px-3 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>
              {allNavigableItems.length > 0
                ? `Results (${searchResults?.matches.length ?? 0} matches)`
                : 'No database matches'}
            </span>
            <span className="font-normal lowercase text-slate-400">
              ↑↓ navigate &middot; Enter to add
            </span>
          </div>

          {/* Matches */}
          {searchResults?.matches.map((item, idx) => {
            const isHighlighted = selectedIndex === idx;
            return (
              <div
                key={`match-${item.id}`}
                onClick={() => handleSelectDrug(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  isHighlighted
                    ? 'bg-teal-50 border-l-4 border-teal-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">
                      {item.brand_name}
                    </span>
                    <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {item.dosage_form}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      {item.strength}
                    </span>
                    {item.is_custom && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-semibold">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Generic:{' '}
                    <strong className="text-slate-700">
                      {item.generic_name}
                    </strong>
                    <span className="mx-1 text-slate-300">&middot;</span>
                    <span className="text-slate-500">
                      {item.manufacturer_name}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {isHighlighted ? (
                    <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded">
                      ↵ Add Rx
                    </span>
                  ) : item.pack_price_bdt ? (
                    <span className="text-[11px] font-mono text-slate-400">
                      ৳{item.pack_price_bdt.toFixed(2)}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* Sibling Alternatives */}
          {searchResults?.siblings &&
            searchResults.siblings.items.length > 0 && (
              <>
                <div className="bg-teal-50/70 px-3 py-1 text-[10px] font-bold text-teal-900 flex items-center justify-between">
                  <span>
                    Alternatives with Same Generic (
                    {searchResults.siblings.generic_name})
                  </span>
                  <span className="text-[9px] font-normal text-teal-700">
                    Alternatives
                  </span>
                </div>
                {searchResults.siblings.items.map((item, sIdx) => {
                  const overallIdx =
                    (searchResults?.matches.length ?? 0) + sIdx;
                  const isHighlighted = selectedIndex === overallIdx;
                  return (
                    <div
                      key={`sib-${item.id}`}
                      onClick={() => handleSelectDrug(item)}
                      onMouseEnter={() => setSelectedIndex(overallIdx)}
                      className={`px-3 py-1.5 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                        isHighlighted
                          ? 'bg-teal-50 border-l-4 border-teal-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">
                            {item.brand_name}
                          </span>
                          <span className="text-[10px] px-1 rounded bg-slate-100 text-slate-600">
                            {item.dosage_form}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {item.strength}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {item.manufacturer_name}
                        </p>
                      </div>

                      <div className="text-right">
                        {isHighlighted && (
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded">
                            ↵ Add
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

          {/* Free-text Fallback Option */}
          {query.trim() && (
            <div
              onClick={() => handleAddFreeText(query)}
              className="px-3 py-2 bg-slate-50 hover:bg-teal-50 cursor-pointer flex items-center justify-between text-xs text-slate-700 border-t border-slate-200"
            >
              <div className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  Add{' '}
                  <strong className="text-slate-900">"{query.trim()}"</strong>{' '}
                  as free-text medicine
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Press Enter
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
