import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Send,
  Calendar,
  Printer,
  History,
} from 'lucide-react';
import type { LayoutContextType } from '../components/Layout';
import { usePrescriptionStore } from '../store/usePrescriptionStore';
import PatientBanner from '../components/PatientBanner';
import ClinicalNotes from '../components/ClinicalNotes';
import PrescriptionItemRow from '../components/PrescriptionItemRow';
import RxMedicineSearch from '../components/RxMedicineSearch';
import DuplicateGenericWarning from '../components/DuplicateGenericWarning';
import ChamberQueueHUD from '../components/ChamberQueueHUD';
import PrescriptionTemplatesBar from '../components/PrescriptionTemplatesBar';
import PatientHistoryDrawer from '../components/PatientHistoryDrawer';
import PrintStudioModal from '../components/PrintStudioModal';

const defaultSettings = {
  isOnboarded: false,
  doctorName: 'Dr. Sample Name',
  degrees: 'MBBS',
  bmdcReg: 'BMDC Reg. No. 00000',
  specialty: 'General Physician',
  chamberName: 'Sample Chamber',
  chamberAddress: 'Dhaka, Bangladesh',
  chamberHours: '5:00 PM - 9:00 PM',
  chamberPhone: '+880 1700-000000',
  consultationFee: null,
  printHeaderMode: 'full' as const,
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
    setPrintStudioOpen,
    setHistoryDrawerOpen,
  } = usePrescriptionStore();

  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Global hotkeys (Ctrl+P for Print, Ctrl+H for History)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPrintStudioOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setHistoryDrawerOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPrintStudioOpen, setHistoryDrawerOpen]);

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
    <div className="max-w-6xl mx-auto space-y-3">
      {/* Chamber Queue HUD - Live Token Stream */}
      <ChamberQueueHUD />

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
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 min-h-[750px] flex flex-col justify-between">
        <div>
          {/* Doctor & Chamber Header */}
          <div className="border-b border-slate-200 pb-3 mb-3 flex items-start justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {settings.doctorName}
                </h2>
                <span className="text-[10px] bg-teal-50 text-teal-800 font-semibold px-2 py-0.5 rounded border border-teal-200">
                  BMDC Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {settings.degrees} &middot; {settings.bmdcReg}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {settings.chamberName} &middot; {settings.chamberAddress}
              </p>
            </div>

            <div className="text-right flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryDrawerOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="View previous prescriptions (Ctrl+H)"
                >
                  <History className="w-3.5 h-3.5 text-teal-600" />
                  <span>Past Visits</span>
                  <kbd className="text-[9px] font-mono text-slate-400 bg-white px-1 py-0.2 rounded border border-slate-200">
                    ^H
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintStudioOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold text-teal-800 hover:text-white bg-teal-50 hover:bg-teal-600 rounded-lg border border-teal-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Open live paper print studio (Ctrl+P)"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-600 group-hover:text-white" />
                  <span>Print Studio</span>
                  <kbd className="text-[9px] font-mono text-teal-700 bg-white px-1 py-0.2 rounded border border-teal-200">
                    ^P
                  </kbd>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 justify-end">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-semibold text-[11px]">Visit Date:</span>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) =>
                    updateClinical({ visitDate: e.target.value })
                  }
                  className="px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded font-mono text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Sub-feature 3: Patient Banner */}
          <PatientBanner />

          {/* Clinical Templates Bar (1-Click Prescriptions) */}
          <PrescriptionTemplatesBar />

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
                  <span className="font-serif italic text-xl font-bold text-teal-700">
                    ℞
                  </span>
                  <h3 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                    Prescription Medicines ({items.length})
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">
                  Search drug below &middot; Enter to add &middot; Inline
                  alternatives available
                </span>
              </div>

              {/* Sub-feature 7: Duplicate Generic Warning */}
              <DuplicateGenericWarning items={items} />

              {/* Medicine List */}
              <div className="space-y-2.5">
                {items.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs bg-slate-50/50">
                    No medicines prescribed yet. Choose a Quick Template above
                    or type a drug below.
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
        <div className="pt-4 mt-5 border-t border-slate-200 flex items-center justify-between text-xs">
          {/* Draft Status Indicator */}
          <div className="flex items-center gap-2 text-slate-500">
            {isSavingDraft ? (
              <span className="flex items-center gap-1.5 text-teal-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
                Auto-saving draft...
              </span>
            ) : formattedSavedAt ? (
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Draft saved at {formattedSavedAt}
              </span>
            ) : (
              <span>Ready</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear / New Rx
            </button>

            <button
              type="button"
              onClick={() => setPrintStudioOpen(true)}
              className="px-3.5 py-1.5 rounded-lg border border-teal-600 text-teal-700 bg-teal-50 hover:bg-teal-100 flex items-center gap-1.5 font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Studio (Ctrl+P)
            </button>

            <button
              type="button"
              onClick={handleFinalize}
              disabled={!name.trim() || items.length === 0 || isFinalizing}
              className={`px-5 py-2 rounded-lg font-semibold text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
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

      {/* Patient History Timeline Drawer */}
      <PatientHistoryDrawer />

      {/* WYSIWYG Print Studio Modal */}
      <PrintStudioModal settings={settings} />
    </div>
  );
}
