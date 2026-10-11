import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Send,
  Calendar,
} from 'lucide-react';
import type { LayoutContextType } from '../components/Layout';
import { usePrescriptionStore } from '../store/usePrescriptionStore';
import PatientBanner from '../components/PatientBanner';
import ClinicalNotes from '../components/ClinicalNotes';
import PrescriptionItemRow from '../components/PrescriptionItemRow';
import RxMedicineSearch from '../components/RxMedicineSearch';
import DuplicateGenericWarning from '../components/DuplicateGenericWarning';

const defaultSettings = {
  doctorName: 'Dr. Sample Name',
  degrees: 'MBBS (Sample)',
  bmdcReg: 'BMDC Reg. No. 00000',
  chamberName: 'Sample Chamber',
  chamberAddress: 'Dhaka, Bangladesh',
  chamberHours: '5:00 PM - 9:00 PM',
  chamberPhone: '+880 1700-000000',
};

export default function PrescriptionPage() {
  const context = useOutletContext<LayoutContextType | null>();
  const settings = context?.settings ?? defaultSettings;

  const {
    name,
    visitDate,
    items,
    isSavingDraft,
    lastSavedAt,
    saveSuccessMsg,
    addItem,
    updateItem,
    removeItem,
    clearPrescription,
    loadDraft,
    saveDraft,
    finalizePrescription,
    setSaveSuccessMsg,
    updateClinical,
  } = usePrescriptionStore();

  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Debounced autosave whenever prescription content changes
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      saveDraft();
    }, 1500);

    return () => clearTimeout(timer);
  }, [name, items, saveDraft]);

  const handleAddDrug = (drugItem: {
    brand_id: number | null;
    free_text_name: string;
    strength_snapshot: string | null;
    form_snapshot: string | null;
    generic_snapshot: string | null;
  }) => {
    addItem({
      brand_id: drugItem.brand_id,
      free_text_name: drugItem.free_text_name,
      strength_snapshot: drugItem.strength_snapshot,
      form_snapshot: drugItem.form_snapshot,
      generic_snapshot: drugItem.generic_snapshot,
      dose: '1+0+1',
      meal_timing: 'After meal',
      duration: '5 days',
      note: null,
    });
    setLastAddedIndex(items.length);
  };

  const handleFinalize = async () => {
    setErrorMessage(null);
    setIsFinalizing(true);
    const result = await finalizePrescription();
    setIsFinalizing(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to finalize prescription');
    } else {
      setLastAddedIndex(null);
    }
  };

  const handleClear = () => {
    if (
      (name || items.length > 0) &&
      !window.confirm(
        'Are you sure you want to clear this prescription? All unsaved data will be lost.',
      )
    ) {
      return;
    }
    clearPrescription();
    setErrorMessage(null);
  };

  // Format draft saved time
  const formattedSavedAt = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Prescription Card */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 min-h-[750px] flex flex-col justify-between">
        <div>
          {/* Doctor & Chamber Header */}
          <div className="border-b border-slate-200 pb-4 mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {settings.doctorName}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {settings.degrees} &middot; {settings.bmdcReg}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {settings.chamberName} &middot; {settings.chamberAddress}
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 justify-end mb-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-semibold">Date:</span>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) =>
                    updateClinical({ visitDate: e.target.value })
                  }
                  className="px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded font-mono text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Hours: {settings.chamberHours} &middot; Tel:{' '}
                {settings.chamberPhone}
              </p>
            </div>
          </div>

          {/* Sub-feature 3: Patient Banner */}
          <PatientBanner />

          {/* 2-Column Clinical Layout */}
          <div className="grid grid-cols-12 gap-6 pt-2">
            {/* Left Column: Sub-feature 4 (w-5/12) */}
            <div className="col-span-5 border-r border-slate-100 pr-5">
              <ClinicalNotes />
            </div>

            {/* Right Column: Sub-feature 5, 6, 7 (w-7/12) */}
            <div className="col-span-7 space-y-3">
              {/* Rx Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-serif italic text-lg font-bold text-teal-700">
                    ℞
                  </span>
                  <h3 className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">
                    Prescription Medicines ({items.length})
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">
                  Type medicine below &middot; Enter to add
                </span>
              </div>

              {/* Sub-feature 7: Duplicate Generic Warning */}
              <DuplicateGenericWarning items={items} />

              {/* Medicine List */}
              <div className="space-y-2.5">
                {items.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs">
                    No medicines added yet. Use the search input below to add
                    brands or generics.
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <PrescriptionItemRow
                      key={`item-${idx}`}
                      item={item}
                      index={idx}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                      autoFocusDose={idx === lastAddedIndex}
                    />
                  ))
                )}
              </div>

              {/* Sub-feature 5: Rx Medicine Search */}
              <RxMedicineSearch onAddDrug={handleAddDrug} />
            </div>
          </div>
        </div>

        {/* Action Bar at Bottom */}
        <div className="pt-5 mt-6 border-t border-slate-200 flex items-center justify-between text-xs">
          {/* Draft Status Indicator */}
          <div className="flex items-center gap-2 text-slate-500">
            {isSavingDraft ? (
              <span className="flex items-center gap-1.5 text-teal-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
                Saving draft...
              </span>
            ) : formattedSavedAt ? (
              <span>Draft auto-saved at {formattedSavedAt}</span>
            ) : (
              <span>Ready</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear / New Rx
            </button>

            <button
              type="button"
              onClick={handleFinalize}
              disabled={!name.trim() || items.length === 0 || isFinalizing}
              className={`px-5 py-2 rounded-md font-semibold text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                !name.trim() || items.length === 0 || isFinalizing
                  ? 'bg-teal-400 opacity-60 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 active:scale-98'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              {isFinalizing ? 'Finalizing...' : 'Finalize & Save Prescription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
