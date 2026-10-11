import React, { useEffect, useRef, useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import type { PrescriptionItem, BrandSearchResult } from '../shared/types';
import { parseDoseToken } from '../shared/doseParser';
import { animateCardAddition } from '../shared/animations';
import { usePrescriptionStore } from '../store/usePrescriptionStore';

interface PrescriptionItemRowProps {
  item: PrescriptionItem;
  index: number;
  onUpdate: (index: number, patch: Partial<PrescriptionItem>) => void;
  onRemove: (index: number) => void;
  autoFocusDose?: boolean;
}

const MEAL_TIMINGS = [
  { value: 'After meal', label: 'After meal (খাওয়ার পরে)' },
  { value: 'Before meal', label: 'Before meal (খাওয়ার আগে)' },
  { value: 'Empty stomach', label: 'Empty stomach (খালি পেটে)' },
  { value: 'With meal', label: 'With meal (খাওয়ার সাথে)' },
];

const DURATION_PRESETS = [
  '3 days',
  '5 days',
  '7 days',
  '14 days',
  '1 month',
  'Continue',
];

const QUICK_DOSES = ['1+0+1', '1+1+1', '1+0+0', '0+0+1', '½+0+½'];

const BENGALI_DOSE_HINTS: Record<string, string> = {
  '1+0+1': '১+০+১ (সকাল ও রাত)',
  '1+1+1': '১+১+১ (সকাল, দুপুর ও রাত)',
  '1+0+0': '১+০+০ (সকালে একবার)',
  '0+0+1': '০+০+১ (রাতে একবার)',
  '0+1+0': '০+১+০ (দুপুরে একবার)',
  '½+0+½': '½+০+½ (আধা ট্যাবলেট করে)',
};

export default function PrescriptionItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  autoFocusDose,
}: PrescriptionItemRowProps) {
  const doseInputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const { applySiblingSwap } = usePrescriptionStore();

  const [siblingResults, setSiblingResults] = useState<BrandSearchResult[]>([]);
  const [showSiblings, setShowSiblings] = useState(false);
  const [isSearchingSiblings, setIsSearchingSiblings] = useState(false);

  useEffect(() => {
    if (rowRef.current) {
      animateCardAddition(rowRef.current);
    }
  }, []);

  const handleFetchSiblings = async () => {
    if (!item.generic_snapshot) return;
    if (showSiblings) {
      setShowSiblings(false);
      return;
    }

    setIsSearchingSiblings(true);
    if (window.api?.searchDrugs) {
      try {
        const res = await window.api.searchDrugs(item.generic_snapshot);
        const matches = res.matches.filter(
          (m) =>
            m.brand_name.toLowerCase() !== item.free_text_name?.toLowerCase(),
        );
        setSiblingResults(matches);
        setShowSiblings(true);
      } catch (err) {
        console.error('Failed to search siblings:', err);
      } finally {
        setIsSearchingSiblings(false);
      }
    }
  };

  const handleSwap = (sibling: BrandSearchResult) => {
    applySiblingSwap(index, sibling);
    setShowSiblings(false);
  };

  useEffect(() => {
    if (autoFocusDose) {
      doseInputRef.current?.focus();
    }
  }, [autoFocusDose]);

  const handleDoseBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseDoseToken(raw);
    if (parsed !== item.dose) {
      onUpdate(index, { dose: parsed });
    }
  };

  const handleDoseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseDoseToken(item.dose);
      if (parsed !== item.dose) {
        onUpdate(index, { dose: parsed });
      }
    }
  };

  const displayName = item.free_text_name || 'Medicine';

  return (
    <div
      ref={rowRef}
      className="bezel-card p-5 bg-white space-y-3.5 border border-beige-300 hover:border-gold-400 transition-all shadow-xs group"
    >
      {/* Row Header: Position, Medicine Title, Generic, and Remove Button */}
      <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-beige-300">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-6 h-6 rounded-lg bg-gold-50 text-gold-700 font-semibold text-xs flex items-center justify-center shrink-0 border border-gold-200 shadow-xs">
            {index + 1}
          </span>
          <span className="font-bold text-base text-ink-900 tracking-tight">
            {displayName}
          </span>
          {item.form_snapshot && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-beige-100 text-ink-700 border border-beige-200">
              {item.form_snapshot}
            </span>
          )}
          {item.strength_snapshot && (
            <span className="text-xs font-mono font-medium text-gold-700">
              {item.strength_snapshot}
            </span>
          )}
          {item.generic_snapshot && (
            <span className="text-xs text-ink-500 italic font-mono">
              ({item.generic_snapshot})
            </span>
          )}
          {!item.brand_id && (
            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-medium">
              Free-text
            </span>
          )}

          {/* Sibling Alternative Brand Switcher Button */}
          {item.generic_snapshot && (
            <button
              type="button"
              onClick={handleFetchSiblings}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-700 bg-gold-50 hover:bg-gold-100 border border-gold-300 px-3 py-0.5 rounded-full transition-all cursor-pointer shadow-xs"
              title="Show other brands for this generic"
            >
              <RefreshCw
                className={`w-3 h-3 ${isSearchingSiblings ? 'animate-spin' : ''}`}
              />
              <span>{showSiblings ? 'Close Alternatives' : 'Swap Brand'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-ink-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
          title="Remove medicine"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Sibling Alternative Brands List Drawer */}
      {showSiblings && (
        <div className="mt-2 mb-2 p-3.5 bg-ivory-50 border border-beige-300 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gold-800 pb-1.5 border-b border-beige-200">
            <span>Equivalent Brands ({item.generic_snapshot})</span>
            <span className="text-[10px] font-normal text-ink-500">
              Click to swap instantly
            </span>
          </div>

          {siblingResults.length === 0 ? (
            <p className="text-xs text-ink-500 py-1">
              No other alternative companies found in catalog.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {siblingResults.slice(0, 8).map((sib) => (
                <button
                  key={sib.id}
                  type="button"
                  onClick={() => handleSwap(sib)}
                  className="px-2.5 py-1.5 bg-white hover:bg-gold-600 hover:text-white border border-beige-300 rounded-lg text-xs font-medium text-ink-800 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title={`${sib.dosage_form} ${sib.strength} by ${sib.manufacturer_name}`}
                >
                  <span className="font-bold">{sib.brand_name}</span>
                  <span className="text-[10px] opacity-75">
                    ({sib.manufacturer_name})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inputs Grid */}
      <div className="grid grid-cols-12 gap-3.5 pt-2 items-start">
        {/* Dose (col-span-3) */}
        <div className="col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">
            Dose (e.g. 101, 1+0+1)
          </label>
          <input
            ref={doseInputRef}
            type="text"
            value={item.dose}
            onChange={(e) => onUpdate(index, { dose: e.target.value })}
            onBlur={handleDoseBlur}
            onKeyDown={handleDoseKeyDown}
            placeholder="1+0+1"
            className="w-full h-10 px-3 text-xs font-mono font-bold bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 text-ink-900"
          />
          {/* Quick dose buttons */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {QUICK_DOSES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onUpdate(index, { dose: d })}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                  item.dose === d
                    ? 'bg-gold-50 text-gold-800 border-gold-300 font-bold shadow-xs'
                    : 'bg-beige-100 text-ink-600 border-beige-200 hover:text-ink-900 hover:bg-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          {BENGALI_DOSE_HINTS[item.dose] && (
            <span className="text-[11px] text-gold-700 font-bangla block mt-1">
              {BENGALI_DOSE_HINTS[item.dose]}
            </span>
          )}
        </div>

        {/* Meal Timing (col-span-3) */}
        <div className="col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">
            Meal Timing
          </label>
          <select
            value={item.meal_timing || ''}
            onChange={(e) =>
              onUpdate(index, { meal_timing: e.target.value || null })
            }
            className="w-full h-10 px-2.5 text-xs bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 text-ink-900"
          >
            <option value="" className="bg-white">
              Select timing...
            </option>
            {MEAL_TIMINGS.map((m) => (
              <option key={m.value} value={m.value} className="bg-white">
                {m.label}
              </option>
            ))}
          </select>
          {/* Quick buttons */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {MEAL_TIMINGS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onUpdate(index, { meal_timing: m.value })}
                className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                  item.meal_timing === m.value
                    ? 'bg-gold-50 text-gold-800 border-gold-300 font-semibold shadow-xs'
                    : 'bg-beige-100 text-ink-600 border-beige-200 hover:text-ink-900 hover:bg-white'
                }`}
              >
                {m.value.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Duration (col-span-3) */}
        <div className="col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">
            Duration
          </label>
          <input
            type="text"
            value={item.duration || ''}
            onChange={(e) =>
              onUpdate(index, { duration: e.target.value || null })
            }
            placeholder="e.g. 7 days"
            className="w-full h-10 px-3 text-xs bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 text-ink-900"
          />
          {/* Quick duration presets */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {DURATION_PRESETS.map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => onUpdate(index, { duration: dur })}
                className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                  item.duration === dur
                    ? 'bg-gold-50 text-gold-800 border-gold-300 font-semibold shadow-xs'
                    : 'bg-beige-100 text-ink-600 border-beige-200 hover:text-ink-900 hover:bg-white'
                }`}
              >
                {dur}
              </button>
            ))}
          </div>
        </div>

        {/* Note / Special Instructions (col-span-3) */}
        <div className="col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">
            Instructions / Note
          </label>
          <input
            type="text"
            value={item.note || ''}
            onChange={(e) => onUpdate(index, { note: e.target.value || null })}
            placeholder="e.g. If fever > 101°F"
            className="w-full h-10 px-3 text-xs bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 text-ink-900 placeholder-ink-400"
          />
        </div>
      </div>
    </div>
  );
}
