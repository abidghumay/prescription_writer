import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { PrescriptionItem } from '../shared/types';

interface DuplicateGenericWarningProps {
  items: PrescriptionItem[];
}

interface DuplicateGroup {
  generic: string;
  brands: string[];
}

export default function DuplicateGenericWarning({
  items,
}: DuplicateGenericWarningProps) {
  const [dismissedGenerics, setDismissedGenerics] = useState<Set<string>>(
    new Set(),
  );

  // Group items by normalized generic snapshot
  const genericMap = new Map<
    string,
    { genericDisplay: string; brands: string[] }
  >();

  for (const item of items) {
    const rawGeneric = item.generic_snapshot?.trim();
    if (!rawGeneric) continue;

    const key = rawGeneric.toLowerCase();
    const brandName = item.free_text_name || 'Item';

    if (!genericMap.has(key)) {
      genericMap.set(key, { genericDisplay: rawGeneric, brands: [brandName] });
    } else {
      const existing = genericMap.get(key)!;
      existing.brands.push(brandName);
    }
  }

  const duplicates: DuplicateGroup[] = [];
  for (const [key, val] of genericMap.entries()) {
    if (val.brands.length > 1 && !dismissedGenerics.has(key)) {
      duplicates.push({
        generic: val.genericDisplay,
        brands: val.brands,
      });
    }
  }

  if (duplicates.length === 0) {
    return null;
  }

  const handleDismiss = (generic: string) => {
    setDismissedGenerics((prev) => {
      const updated = new Set(prev);
      updated.add(generic.toLowerCase());
      return updated;
    });
  };

  return (
    <div className="space-y-2 mb-4">
      {duplicates.map((dup) => (
        <div
          key={dup.generic}
          className="flex items-start justify-between gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs shadow-sm"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">
                Duplicate Generic Warning:{' '}
                <span className="underline decoration-amber-500/50">
                  {dup.generic}
                </span>
              </p>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                Prescribed multiple times as{' '}
                <strong className="text-amber-950 font-semibold">
                  {dup.brands.join(', ')}
                </strong>
                . Verify clinical dosage safety to avoid accidental overdose.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleDismiss(dup.generic)}
            className="text-amber-700 hover:text-amber-950 p-1 rounded-lg hover:bg-amber-100/70 transition-colors cursor-pointer shrink-0"
            title="Dismiss warning"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
