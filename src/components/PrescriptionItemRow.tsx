import React, { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import type { PrescriptionItem } from '../shared/types';
import { parseDoseToken } from '../shared/doseParser';

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

export default function PrescriptionItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  autoFocusDose,
}: PrescriptionItemRowProps) {
  const doseInputRef = useRef<HTMLInputElement>(null);

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
    <div className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors shadow-xs">
      {/* Row Header: Position, Medicine Title, Generic, and Remove Button */}
      <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <span className="font-bold text-sm text-slate-900 tracking-tight">
            {displayName}
          </span>
          {item.form_snapshot && (
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {item.form_snapshot}
            </span>
          )}
          {item.strength_snapshot && (
            <span className="text-[11px] font-medium text-slate-600">
              {item.strength_snapshot}
            </span>
          )}
          {item.generic_snapshot && (
            <span className="text-[11px] text-slate-500 italic">
              ({item.generic_snapshot})
            </span>
          )}
          {!item.brand_id && (
            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
              Free-text
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
          title="Remove medicine"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-12 gap-2 pt-2.5 items-start">
        {/* Dose (col-span-3) */}
        <div className="col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
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
            className="w-full px-2 py-1 text-xs font-mono font-semibold bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-900"
          />
          {/* Quick dose buttons */}
          <div className="flex flex-wrap gap-1 mt-1">
            {QUICK_DOSES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onUpdate(index, { dose: d })}
                className={`text-[10px] font-mono px-1 py-0.2 rounded border transition-colors cursor-pointer ${
                  item.dose === d
                    ? 'bg-teal-50 text-teal-700 border-teal-300 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Meal Timing (col-span-3) */}
        <div className="col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
            Meal Timing
          </label>
          <select
            value={item.meal_timing || ''}
            onChange={(e) =>
              onUpdate(index, { meal_timing: e.target.value || null })
            }
            className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 text-slate-800"
          >
            <option value="">Select timing...</option>
            {MEAL_TIMINGS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {/* Quick buttons */}
          <div className="flex flex-wrap gap-1 mt-1">
            {MEAL_TIMINGS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onUpdate(index, { meal_timing: m.value })}
                className={`text-[9px] px-1 py-0.2 rounded border transition-colors cursor-pointer ${
                  item.meal_timing === m.value
                    ? 'bg-teal-50 text-teal-700 border-teal-300 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m.value.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Duration (col-span-3) */}
        <div className="col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
            Duration
          </label>
          <input
            type="text"
            value={item.duration || ''}
            onChange={(e) =>
              onUpdate(index, { duration: e.target.value || null })
            }
            placeholder="e.g. 7 days"
            className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 text-slate-800"
          />
          {/* Quick duration presets */}
          <div className="flex flex-wrap gap-1 mt-1">
            {DURATION_PRESETS.map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => onUpdate(index, { duration: dur })}
                className={`text-[9px] px-1 py-0.2 rounded border transition-colors cursor-pointer ${
                  item.duration === dur
                    ? 'bg-teal-50 text-teal-700 border-teal-300 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {dur}
              </button>
            ))}
          </div>
        </div>

        {/* Note / Special Instructions (col-span-3) */}
        <div className="col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
            Instructions / Note
          </label>
          <input
            type="text"
            value={item.note || ''}
            onChange={(e) => onUpdate(index, { note: e.target.value || null })}
            placeholder="e.g. If fever > 101°F"
            className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 text-slate-800"
          />
        </div>
      </div>
    </div>
  );
}
