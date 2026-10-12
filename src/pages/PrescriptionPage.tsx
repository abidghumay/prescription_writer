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
  FileText,
} from 'lucide-react';
import type { LayoutContextType } from '../components/Layout';
import { usePrescriptionStore } from '../store/usePrescriptionStore';
import PatientBanner from '../components/PatientBanner';
import ClinicalNotes from '../components/ClinicalNotes';
import PrescriptionItemRow from '../components/PrescriptionItemRow';
import RxMedicineSearch from '../components/RxMedicineSearch';
import DuplicateGenericWarning from '../components/DuplicateGenericWarning';
import ChamberQueueHUD from '../components/ChamberQueueHUD';
import PastPrescriptionsView from '../components/PastPrescriptionsView';
import PatientHistoryDrawer from '../components/PatientHistoryDrawer';
import PrintStudioModal from '../components/PrintStudioModal';
import type { PastPrescriptionRecord } from '../shared/types';
import { DEFAULT_APP_SETTINGS } from '../shared/types';
import { isValidBangladeshiPhone } from '../shared/validation';

export default function PrescriptionPage() {
  const context = useOutletContext<LayoutContextType | null>();
  const settings = context?.settings ?? DEFAULT_APP_SETTINGS;

  const [activeMode, setActiveMode] = useState<'new' | 'past'>('new');

  const {
    patientId,
    name,
    phone,
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
    repeatPreviousPrescription,
    updatePatient,
  } = usePrescriptionStore();

  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Global hotkeys (Ctrl+P for Print, Ctrl+H for Past Rx, Ctrl+N for New Rx)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPrintStudioOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setActiveMode('past');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setActiveMode('new');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPrintStudioOpen]);

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

  const isPhoneInvalid =
    phone.trim().length > 0 && !isValidBangladeshiPhone(phone);

  const scrollToTop = () => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const nameInput = document.querySelector(
        'input[placeholder*="patient name"]',
      ) as HTMLInputElement | null;
      nameInput?.focus();
    }, 150);
  };

  const handleFinalize = async () => {
    if (isPhoneInvalid) {
      setErrorMessage(
        'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX)',
      );
      return;
    }
    setErrorMessage(null);
    setIsFinalizing(true);
    const result = await finalizePrescription();
    setIsFinalizing(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to finalize prescription');
    } else {
      setLastAddedIndex(null);
      scrollToTop();
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
    scrollToTop();
  };

  const handlePrintPastPrescription = (rx: PastPrescriptionRecord) => {
    updatePatient({
      patientId: rx.patient_id,
      name: rx.patient_name,
      phone: rx.patient_phone || '',
      ageYears: rx.patient_age_years,
      sex: rx.patient_sex,
      weightKg: rx.weight_kg,
    });
    repeatPreviousPrescription(rx);
    setPrintStudioOpen(true);
  };

  // Format draft saved time
  const formattedSavedAt = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* Top 2-Option Switcher Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-studio-border">
        <div className="flex items-center gap-1.5 p-1 bg-studio-surface border border-studio-borderSubtle rounded-2xl shadow-xs">
          <button
            type="button"
            onClick={() => setActiveMode('new')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold font-heading transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'new'
                ? 'bg-white text-gold-700 shadow-xs border border-studio-border'
                : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            <FileText className="w-4 h-4 text-gold-600" />
            <span>New Prescription</span>
            <kbd className="text-[9px] font-mono text-ink-400 bg-studio-surface px-1.5 py-0.5 rounded border border-studio-borderSubtle">
              ^N
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('past')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold font-heading transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'past'
                ? 'bg-white text-gold-700 shadow-xs border border-studio-border'
                : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            <History className="w-4 h-4 text-gold-600" />
            <span>Past Prescriptions</span>
            <kbd className="text-[9px] font-mono text-ink-400 bg-studio-surface px-1.5 py-0.5 rounded border border-studio-borderSubtle">
              ^H
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-500">
          <span>Active Mode:</span>
          <span className="font-bold text-ink-800 uppercase tracking-wider text-[11px] bg-studio-surface px-2.5 py-1 rounded-lg border border-studio-border">
            {activeMode === 'new'
              ? 'Writing New Rx'
              : 'Past Consultations Ledger'}
          </span>
        </div>
      </div>

      {/* Chamber Queue HUD - Live Token Stream */}
      <ChamberQueueHUD />

      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="flex items-center justify-between p-3.5 bg-gold-50 border border-gold-300 rounded-xl text-gold-900 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-gold-600" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-gold-700 hover:text-gold-900 font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* MODE 1: NEW PRESCRIPTION CANVAS */}
      {activeMode === 'new' ? (
        <div className="bezel-card p-8 min-h-[820px] flex flex-col justify-between">
          <div>
            {/* Doctor & Chamber Header */}
            <div className="border-b border-beige-300 pb-5 mb-5 flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-ink-900 tracking-tight font-heading">
                    {settings.doctorName}
                  </h2>
                  <span className="text-[10px] bg-gold-50 text-gold-700 font-semibold px-2.5 py-0.5 rounded-full border border-gold-300">
                    BMDC Verified
                  </span>
                </div>
                <p className="text-xs text-ink-700 font-medium mt-1">
                  {settings.degrees} &middot; {settings.bmdcReg}
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  {settings.chamberName} &middot; {settings.chamberAddress}
                </p>
              </div>

              <div className="text-right flex flex-col items-end gap-2.5">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3 py-1.5 text-xs font-semibold text-ink-700 hover:text-ink-900 bg-white hover:bg-beige-100 rounded-xl border border-beige-300 hover:border-gold-400 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    title="Clear current prescription and start fresh"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-ink-500" />
                    <span>Clear / New Rx</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMode('past')}
                    className="px-3 py-1.5 text-xs font-semibold text-ink-700 hover:text-gold-700 bg-white hover:bg-beige-100 rounded-xl border border-beige-300 hover:border-gold-400 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    title="View previous prescriptions (Ctrl+H)"
                  >
                    <History className="w-3.5 h-3.5 text-gold-600" />
                    <span>Past Prescriptions</span>
                    <kbd className="text-[9px] font-mono text-ink-500 bg-beige-100 px-1.5 py-0.5 rounded border border-beige-300">
                      ^H
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintStudioOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-gold-800 hover:text-gold-900 bg-gold-50 hover:bg-gold-100/80 rounded-xl border border-gold-300 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    title="Open live paper print studio (Ctrl+P)"
                  >
                    <Printer className="w-3.5 h-3.5 text-gold-600" />
                    <span>Print Studio</span>
                    <kbd className="text-[9px] font-mono text-gold-700 bg-gold-100 px-1.5 py-0.5 rounded border border-gold-300">
                      ^P
                    </kbd>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-ink-700 justify-end">
                  <Calendar className="w-3.5 h-3.5 text-gold-600" />
                  <span className="font-semibold text-[11px] text-ink-500">
                    Visit Date:
                  </span>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) =>
                      updateClinical({ visitDate: e.target.value })
                    }
                    className="px-2.5 py-1 text-xs bg-white border border-beige-300 rounded-lg font-mono text-ink-900 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Patient Demographics Banner */}
            <PatientBanner />

            {/* 2-Column Clinical Layout */}
            <div className="grid grid-cols-12 gap-8 pt-6">
              {/* Left Column: Clinical Notes (w-5/12) */}
              <div className="col-span-5 border-r border-beige-300/80 pr-6">
                <ClinicalNotes />
              </div>

              {/* Right Column: Medications & Rx Search (w-7/12) */}
              <div className="col-span-7 space-y-4">
                {/* Rx Header */}
                <div className="flex items-center justify-between pb-2 border-b border-beige-300">
                  <div className="flex items-center gap-2.5">
                    <span className="font-serif italic text-2xl font-bold text-gold-600">
                      ℞
                    </span>
                    <h3 className="font-bold text-ink-900 uppercase tracking-wider text-xs font-heading">
                      Prescription Medicines ({items.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-ink-500">
                    Search drug below &middot; Enter to add &middot; Instant
                    Brand Alternatives
                  </span>
                </div>

                {/* Duplicate Generic Warning */}
                <DuplicateGenericWarning items={items} />

                {/* Medicine List */}
                <div className="space-y-3.5">
                  {items.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-beige-300 rounded-2xl text-center text-ink-500 text-xs bg-beige-50/50">
                      No medicines prescribed yet. Search brand or generic
                      below, or clone a previous visit in{' '}
                      <button
                        type="button"
                        onClick={() => setActiveMode('past')}
                        className="text-gold-600 font-bold hover:underline cursor-pointer"
                      >
                        Past Prescriptions
                      </button>
                      .
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

                {/* Inline Rx Medicine Search */}
                <RxMedicineSearch onAddDrug={handleAddDrug} />
              </div>
            </div>
          </div>

          {/* Action Bar at Bottom */}
          <div className="pt-6 mt-8 border-t border-beige-300 flex items-center justify-between text-xs flex-wrap gap-4">
            {/* Draft Status Indicator */}
            <div className="flex items-center gap-2.5 text-ink-500">
              {isSavingDraft ? (
                <span className="flex items-center gap-2 text-gold-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-gold-500 animate-ping" />
                  Saving draft to local SQLite...
                </span>
              ) : formattedSavedAt ? (
                <span>Draft auto-saved locally at {formattedSavedAt}</span>
              ) : (
                <span>Ready to prescribe</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPrintStudioOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gold-50 hover:bg-gold-100 border border-gold-300 text-gold-800 font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-gold-600" />
                <span>Print Studio</span>
              </button>

              <button
                type="button"
                onClick={handleFinalize}
                disabled={
                  !name.trim() ||
                  items.length === 0 ||
                  isFinalizing ||
                  isPhoneInvalid
                }
                className={`px-6 py-2.5 rounded-xl font-bold text-white font-heading text-sm flex items-center gap-2.5 shadow-md transition-all cursor-pointer ${
                  !name.trim() ||
                  items.length === 0 ||
                  isFinalizing ||
                  isPhoneInvalid
                    ? 'bg-beige-300 text-ink-400 cursor-not-allowed shadow-none'
                    : 'bg-gold-500 hover:bg-gold-600 active:scale-98 text-white'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {isFinalizing
                    ? 'Finalizing...'
                    : 'Finalize & Save Prescription'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MODE 2: PAST PRESCRIPTIONS LEDGER */
        <PastPrescriptionsView
          onRepeatPrescription={() => setActiveMode('new')}
          onOpenPrintModal={handlePrintPastPrescription}
          patientIdFilter={patientId}
          patientNameFilter={name}
        />
      )}

      {/* Global Slide-in Drawers & Print Modal */}
      <PatientHistoryDrawer />
      <PrintStudioModal settings={settings} />
    </div>
  );
}
