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
    <div ref={containerRef} className="relative mt-4">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-gold-600 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (searchResults && query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="+ Search brand or generic name (e.g. Napa, Seclo, Ciprofloxacin) or type free-text..."
          className="w-full h-12 pl-11 pr-28 text-sm bg-white border border-beige-300 hover:border-gold-400 focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 rounded-xl font-medium text-ink-900 placeholder-ink-400 shadow-xs transition-all"
        />
        <div className="absolute right-3 flex items-center gap-1.5 text-xs text-ink-400">
          {isSearching ? (
            <span className="text-gold-700 animate-pulse font-medium text-xs">
              Searching...
            </span>
          ) : (
            <kbd className="px-2 py-0.5 bg-beige-100 border border-beige-300 rounded-lg text-[10px] font-mono text-gold-700">
              Enter ↵
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-beige-300 rounded-2xl shadow-xl overflow-hidden z-40 divide-y divide-beige-200 max-h-80 overflow-y-auto">
          {/* Header */}
          <div className="bg-beige-50 px-4 py-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gold-700">
            <span>
              {allNavigableItems.length > 0
                ? `Results (${searchResults?.matches.length ?? 0} matches)`
                : 'No database matches'}
            </span>
            <span className="font-normal lowercase text-ink-500">
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
                className={`px-4 py-3 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  isHighlighted
                    ? 'bg-gold-50/70 border-l-4 border-gold-600'
                    : 'hover:bg-beige-50/70'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink-900 text-sm">
                      {item.brand_name}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-beige-100 text-ink-700 border border-beige-200">
                      {item.dosage_form}
                    </span>
                    <span className="text-xs font-mono font-medium text-gold-700">
                      {item.strength}
                    </span>
                    {item.is_custom && (
                      <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-300 px-1.5 rounded-full font-semibold">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-500 mt-1">
                    Generic:{' '}
                    <strong className="text-ink-800">
                      {item.generic_name}
                    </strong>
                    <span className="mx-1.5 text-beige-400">&middot;</span>
                    <span className="text-ink-600">
                      {item.manufacturer_name}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {isHighlighted ? (
                    <span className="text-xs font-semibold text-gold-800 bg-gold-100 px-2.5 py-1 rounded-lg border border-gold-300 shadow-xs">
                      ↵ Add Rx
                    </span>
                  ) : item.pack_price_bdt ? (
                    <span className="text-xs font-mono text-ink-600">
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
                <div className="bg-beige-50 px-4 py-1.5 text-[10px] font-bold text-gold-800 flex items-center justify-between">
                  <span>
                    Alternatives with Same Generic (
                    {searchResults.siblings.generic_name})
                  </span>
                  <span className="text-[10px] font-normal text-ink-500">
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
                      className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                        isHighlighted
                          ? 'bg-gold-50/70 border-l-4 border-gold-600'
                          : 'hover:bg-beige-50/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-800">
                            {item.brand_name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-beige-100 text-ink-600 border border-beige-200">
                            {item.dosage_form}
                          </span>
                          <span className="text-[10px] text-gold-700 font-mono">
                            {item.strength}
                          </span>
                        </div>
                        <p className="text-[10px] text-ink-500 mt-0.5">
                          {item.manufacturer_name}
                        </p>
                      </div>

                      <div className="text-right">
                        {isHighlighted && (
                          <span className="text-xs font-semibold text-gold-800 bg-gold-100 px-2.5 py-1 rounded-lg border border-gold-300 shadow-xs">
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
              className="px-4 py-3 bg-beige-50/80 hover:bg-gold-50 cursor-pointer flex items-center justify-between text-xs text-ink-700 border-t border-beige-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-gold-600" />
                <span>
                  Add <strong className="text-ink-900">"{query.trim()}"</strong>{' '}
                  as free-text medicine
                </span>
              </div>
              <span className="text-[11px] font-mono text-gold-800 bg-white px-2 py-0.5 rounded border border-beige-300">
                Press Enter
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
