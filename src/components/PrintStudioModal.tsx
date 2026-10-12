import React, { useState, useRef, useEffect, useId } from 'react';
import {
  X,
  Printer,
  ZoomIn,
  ZoomOut,
  FileDown,
  Zap,
  SlidersHorizontal,
  Save,
  Trash2,
  Settings2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { usePrescriptionStore } from '../store/usePrescriptionStore';
import type {
  AppSettings,
  PrintConfig,
  PrintProfile,
  PrintSectionVisibility,
  PrintFontSizes,
} from '../shared/types';
import { formatBanglaDoseLine } from '../shared/banglaFormatter';

interface PrintStudioModalProps {
  settings: AppSettings;
}

const DEFAULT_SECTIONS: PrintSectionVisibility = {
  chiefComplaints: true,
  onExamination: true,
  diagnosis: true,
  investigations: true,
  advice: true,
  followUp: true,
  patientPhone: true,
  patientWeight: true,
  consultationFee: false,
};

const DEFAULT_FONT_SIZES: PrintFontSizes = {
  patientName: 12,
  medicineName: 11,
  doseText: 11,
  clinicalNotes: 10,
  banglaDose: 10,
  header: 15,
};

export default function PrintStudioModal({ settings }: PrintStudioModalProps) {
  const {
    name,
    ageYears,
    ageMonths,
    sex,
    phone,
    weightKg,
    visitDate,
    chiefComplaints,
    onExamination,
    diagnosis,
    investigations,
    advice,
    followUp,
    items,
    isPrintStudioOpen,
    setPrintStudioOpen,
  } = usePrescriptionStore();

  const [printConfig, setPrintConfig] = useState<PrintConfig>({
    mode: settings.printHeaderMode === 'pad_space' ? 'blank_pad' : 'letterhead',
    paperSize: 'a4',
    headerMarginMm: settings.padHeaderMarginMm ?? 65,
    footerMarginMm: settings.padFooterMarginMm ?? 30,
    showBanglaDose: true,
    sections: { ...DEFAULT_SECTIONS },
    fontSizes: { ...DEFAULT_FONT_SIZES },
    logoPath: null,
  });

  const [zoomLevel, setZoomLevel] = useState(100);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [profiles, setProfiles] = useState<PrintProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(
    null,
  );
  const [newProfileName, setNewProfileName] = useState('');
  const [isSavingNewProfile, setIsSavingNewProfile] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrintingSilent, setIsPrintingSilent] = useState(false);
  const [toastMsg, setToastMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const modalStyleId = useId();

  // Load profiles on open
  useEffect(() => {
    if (!isPrintStudioOpen) return;

    let isMounted = true;
    if (window.api?.getPrintProfiles) {
      window.api
        .getPrintProfiles()
        .then((profs) => {
          if (!isMounted) return;
          setProfiles(profs);
          const defaultProf = profs.find((p) => p.is_default);
          if (defaultProf) {
            setSelectedProfileId(defaultProf.id);
            setPrintConfig((prev) => ({
              ...prev,
              ...defaultProf.config,
              sections: { ...DEFAULT_SECTIONS, ...defaultProf.config.sections },
              fontSizes: {
                ...DEFAULT_FONT_SIZES,
                ...defaultProf.config.fontSizes,
              },
            }));
          }
        })
        .catch((err) => {
          console.error('Failed to load print profiles:', err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isPrintStudioOpen]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  if (!isPrintStudioOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSilentPrint = async () => {
    if (!window.api?.printSilent) {
      window.print();
      return;
    }
    setIsPrintingSilent(true);
    try {
      const res = await window.api.printSilent({
        paperSize: printConfig.paperSize,
      });
      if (res.success) {
        showToast('Prescription sent directly to chamber printer!');
      } else {
        showToast(
          res.error || 'Silent print failed. Check printer connection.',
          'error',
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Print failed';
      showToast(msg, 'error');
    } finally {
      setIsPrintingSilent(false);
    }
  };

  const handleSavePdf = async () => {
    if (!window.api?.printToPdf) {
      showToast('PDF generator service not available', 'error');
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const safeName = (name || 'Patient')
        .trim()
        .replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_');
      const fileName = `${safeName}_${visitDate || 'Prescription'}.pdf`;
      const res = await window.api.printToPdf({
        paperSize: printConfig.paperSize,
        suggestedFileName: fileName,
      });
      if (res.success) {
        showToast(`PDF exported successfully!`);
      } else if (res.error && res.error !== 'Cancelled') {
        showToast(res.error, 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating PDF';
      showToast(msg, 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSelectProfile = (profileId: number) => {
    const prof = profiles.find((p) => p.id === profileId);
    if (!prof) return;
    setSelectedProfileId(profileId);
    setPrintConfig({
      ...prof.config,
      sections: { ...DEFAULT_SECTIONS, ...prof.config.sections },
      fontSizes: { ...DEFAULT_FONT_SIZES, ...prof.config.fontSizes },
    });
    showToast(`Switched to profile: ${prof.name}`);
  };

  const handleSaveCurrentAsProfile = async () => {
    if (!newProfileName.trim() || !window.api?.savePrintProfile) return;
    try {
      const saved = await window.api.savePrintProfile({
        name: newProfileName.trim(),
        config: printConfig,
        is_default: false,
      });
      setProfiles((prev) => [...prev.filter((p) => p.id !== saved.id), saved]);
      setSelectedProfileId(saved.id);
      setNewProfileName('');
      setIsSavingNewProfile(false);
      showToast(`Profile "${saved.name}" saved successfully!`);
    } catch (err) {
      console.error('Failed to save print profile:', err);
      showToast('Failed to save print profile', 'error');
    }
  };

  const handleDeleteProfile = async (id: number) => {
    if (!window.api?.deletePrintProfile) return;
    try {
      const ok = await window.api.deletePrintProfile(id);
      if (ok) {
        setProfiles((prev) => prev.filter((p) => p.id !== id));
        if (selectedProfileId === id) setSelectedProfileId(null);
        showToast('Print profile deleted');
      }
    } catch (err) {
      console.error('Failed to delete print profile:', err);
    }
  };

  const handleSetDefaultProfile = async (id: number) => {
    if (!window.api?.setDefaultPrintProfile) return;
    try {
      const ok = await window.api.setDefaultPrintProfile(id);
      if (ok) {
        setProfiles((prev) =>
          prev.map((p) => ({ ...p, is_default: p.id === id })),
        );
        showToast('Default profile updated!');
      }
    } catch (err) {
      console.error('Failed to set default profile:', err);
    }
  };

  const sections = printConfig.sections || DEFAULT_SECTIONS;
  const fontSizes = printConfig.fontSizes || DEFAULT_FONT_SIZES;

  const ageDisplay = [
    ageYears !== null ? `${ageYears} Yrs` : '',
    ageMonths !== null ? `${ageMonths} Mo` : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Paper styling calculations
  const isA4 = printConfig.paperSize === 'a4';
  const paperWidthMm = isA4 ? 210 : 148;
  const paperHeightMm = isA4 ? 297 : 210;

  const effectiveHeaderMargin =
    printConfig.mode === 'blank_pad' ? printConfig.headerMarginMm : 0;
  const effectiveFooterMargin =
    printConfig.mode === 'blank_pad' ? printConfig.footerMarginMm : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-3">
      {/* Dynamic Print Engine Style Sheet */}
      <style
        id={modalStyleId}
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: ${isA4 ? 'A4' : 'A5'} portrait;
              margin: 0;
            }
            @media print {
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .print-area {
                transform: none !important;
                box-shadow: none !important;
                border: none !important;
                width: 100% !important;
                min-height: 100vh !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `,
        }}
      />

      <div className="w-full max-w-6xl bg-ivory-100 border border-beige-300 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden text-ink-900">
        {/* Modal Top Control Bar */}
        <div className="no-print px-5 py-3.5 border-b border-beige-300 bg-beige-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-700 border border-gold-200 flex items-center justify-center shadow-inner shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-ink-900 tracking-tight">
                  Chamber Print Studio
                </h2>
                <span className="text-[10px] uppercase font-mono font-bold bg-gold-100 text-gold-800 border border-gold-200 px-2 py-0.5 rounded-full">
                  {printConfig.paperSize.toUpperCase()} &middot;{' '}
                  {printConfig.mode === 'letterhead'
                    ? 'Full Pad'
                    : 'Offset Space'}
                </span>
              </div>
              <p className="text-[11px] text-ink-500">
                Calibrated WYSIWYG paper output &middot; Sub-30s chamber ready
              </p>
            </div>
          </div>

          {/* Quick Settings & Mode Toggles */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Profile Dropdown */}
            {profiles.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-beige-300 rounded-xl px-2.5 py-1 text-xs shadow-xs">
                <span className="text-[10px] text-ink-500 font-medium">
                  Profile:
                </span>
                <select
                  value={selectedProfileId ?? ''}
                  onChange={(e) => handleSelectProfile(Number(e.target.value))}
                  className="bg-transparent font-semibold text-ink-800 focus:outline-none cursor-pointer text-xs"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.is_default ? '★ (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-white p-0.5 border border-beige-300 text-xs shadow-xs">
              <button
                type="button"
                onClick={() =>
                  setPrintConfig((prev) => ({ ...prev, mode: 'letterhead' }))
                }
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  printConfig.mode === 'letterhead'
                    ? 'bg-gold-600 text-white shadow-xs'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                Chamber Letterhead
              </button>
              <button
                type="button"
                onClick={() =>
                  setPrintConfig((prev) => ({ ...prev, mode: 'blank_pad' }))
                }
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  printConfig.mode === 'blank_pad'
                    ? 'bg-gold-600 text-white shadow-xs'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                Pre-Printed Pad Space
              </button>
            </div>

            {/* Paper Size */}
            <div className="flex rounded-xl bg-white p-0.5 border border-beige-300 text-xs shadow-xs">
              <button
                type="button"
                onClick={() =>
                  setPrintConfig((prev) => ({ ...prev, paperSize: 'a4' }))
                }
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  printConfig.paperSize === 'a4'
                    ? 'bg-beige-200 text-ink-900'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                A4
              </button>
              <button
                type="button"
                onClick={() =>
                  setPrintConfig((prev) => ({ ...prev, paperSize: 'a5' }))
                }
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  printConfig.paperSize === 'a5'
                    ? 'bg-beige-200 text-ink-900'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                A5
              </button>
            </div>

            {/* Customize Layout Toggle */}
            <button
              type="button"
              onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isCustomizeOpen
                  ? 'bg-gold-50 border-gold-300 text-gold-800'
                  : 'bg-white border-beige-300 text-ink-700 hover:bg-beige-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-gold-600" />
              <span>Customize</span>
            </button>

            {/* Save PDF CTA */}
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 bg-white hover:bg-beige-50 text-ink-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-xs border border-beige-300 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5 text-gold-700" />
              <span>{isGeneratingPdf ? 'Saving PDF...' : 'Save PDF'}</span>
            </button>

            {/* Silent Print CTA */}
            <button
              type="button"
              onClick={handleSilentPrint}
              disabled={isPrintingSilent}
              title="Print directly to chamber default printer without OS dialog"
              className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 active:scale-[0.98] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-teal-300" />
              <span>{isPrintingSilent ? 'Printing...' : 'Quick Print'}</span>
            </button>

            {/* Standard OS Print CTA */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-gold-600 hover:bg-gold-700 active:scale-[0.98] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-xs border border-gold-500 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dialog</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintStudioOpen(false)}
              className="p-1.5 text-ink-400 hover:text-ink-900 hover:bg-beige-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div
            className={`no-print mx-5 my-2 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
              toastMsg.type === 'success'
                ? 'bg-gold-50 border border-gold-300 text-gold-900'
                : 'bg-rose-50 border border-rose-300 text-rose-900'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-gold-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* Collapsible Customization Tray */}
        {isCustomizeOpen && (
          <div className="no-print border-b border-beige-300 bg-beige-50 p-4 space-y-4 animate-in slide-in-from-top-2 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Column 1: Section Visibility */}
              <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-beige-200">
                <span className="font-bold text-ink-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-gold-600" />
                  Section Visibility
                </span>
                <div className="grid grid-cols-2 gap-2 text-ink-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sections.chiefComplaints}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          sections: {
                            ...sections,
                            chiefComplaints: e.target.checked,
                          },
                        }))
                      }
                      className="accent-gold-600 rounded"
                    />
                    <span>Chief Complaints</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sections.onExamination}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          sections: {
                            ...sections,
                            onExamination: e.target.checked,
                          },
                        }))
                      }
                      className="accent-gold-600 rounded"
                    />
                    <span>On Examination</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sections.diagnosis}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          sections: {
                            ...sections,
                            diagnosis: e.target.checked,
                          },
                        }))
                      }
                      className="accent-gold-600 rounded"
                    />
                    <span>Diagnosis</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sections.investigations}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          sections: {
                            ...sections,
                            investigations: e.target.checked,
                          },
                        }))
                      }
                      className="accent-gold-600 rounded"
                    />
                    <span>Investigations</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sections.advice}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          sections: { ...sections, advice: e.target.checked },
                        }))
                      }
                      className="accent-gold-600 rounded"
                    />
                    <span>Advice</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sections.followUp}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          sections: { ...sections, followUp: e.target.checked },
                        }))
                      }
                      className="accent-gold-600 rounded"
                    />
                    <span>Follow-up</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sections.patientPhone}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          sections: {
                            ...sections,
                            patientPhone: e.target.checked,
                          },
                        }))
                      }
                      className="accent-gold-600 rounded"
                    />
                    <span>Patient Phone</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sections.patientWeight}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          sections: {
                            ...sections,
                            patientWeight: e.target.checked,
                          },
                        }))
                      }
                      className="accent-gold-600 rounded"
                    />
                    <span>Patient Weight</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printConfig.showBanglaDose}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          showBanglaDose: e.target.checked,
                        }))
                      }
                      className="accent-gold-600 rounded"
                    />
                    <span className="font-semibold text-gold-800">
                      Bangla Instructions
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sections.consultationFee}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          sections: {
                            ...sections,
                            consultationFee: e.target.checked,
                          },
                        }))
                      }
                      className="accent-gold-600 rounded"
                    />
                    <span>Consultation Fee</span>
                  </label>
                </div>
              </div>

              {/* Column 2: Font Sizes (in pt) */}
              <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-beige-200">
                <span className="font-bold text-ink-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gold-600" />
                  Font Sizes (pt)
                </span>
                <div className="grid grid-cols-2 gap-3 text-ink-700">
                  <div className="flex items-center justify-between">
                    <span>Patient Info:</span>
                    <input
                      type="number"
                      min={9}
                      max={16}
                      value={fontSizes.patientName}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          fontSizes: {
                            ...fontSizes,
                            patientName: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-12 px-1.5 py-0.5 border border-beige-300 rounded font-mono text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Medicine:</span>
                    <input
                      type="number"
                      min={9}
                      max={16}
                      value={fontSizes.medicineName}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          fontSizes: {
                            ...fontSizes,
                            medicineName: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-12 px-1.5 py-0.5 border border-beige-300 rounded font-mono text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dose Text:</span>
                    <input
                      type="number"
                      min={9}
                      max={16}
                      value={fontSizes.doseText}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          fontSizes: {
                            ...fontSizes,
                            doseText: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-12 px-1.5 py-0.5 border border-beige-300 rounded font-mono text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Clinical Notes:</span>
                    <input
                      type="number"
                      min={8}
                      max={14}
                      value={fontSizes.clinicalNotes}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          fontSizes: {
                            ...fontSizes,
                            clinicalNotes: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-12 px-1.5 py-0.5 border border-beige-300 rounded font-mono text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bangla Dose:</span>
                    <input
                      type="number"
                      min={8}
                      max={14}
                      value={fontSizes.banglaDose}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          fontSizes: {
                            ...fontSizes,
                            banglaDose: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-12 px-1.5 py-0.5 border border-beige-300 rounded font-mono text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Header:</span>
                    <input
                      type="number"
                      min={12}
                      max={20}
                      value={fontSizes.header}
                      onChange={(e) =>
                        setPrintConfig((prev) => ({
                          ...prev,
                          fontSizes: {
                            ...fontSizes,
                            header: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-12 px-1.5 py-0.5 border border-beige-300 rounded font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Column 3: Profile Actions */}
              <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-beige-200">
                <span className="font-bold text-ink-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5 text-gold-600" />
                  Save as Named Profile
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="e.g. Popular Pad High-Contrast"
                    className="w-full px-2.5 py-1.5 border border-beige-300 rounded-lg text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveCurrentAsProfile}
                      disabled={!newProfileName.trim() || isSavingNewProfile}
                      className="flex-1 py-1.5 bg-gold-600 hover:bg-gold-700 text-white rounded-lg font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Save Profile
                    </button>
                    {selectedProfileId && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSetDefaultProfile(selectedProfileId)
                        }
                        className="px-2.5 py-1.5 bg-beige-100 hover:bg-beige-200 text-ink-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="Make this profile the default"
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                </div>

                {selectedProfileId && (
                  <div className="pt-2 border-t border-beige-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(selectedProfileId)}
                      className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Selected Profile</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Body: Scrollable Paper Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-studio-base flex justify-center">
          <div
            ref={printAreaRef}
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              width: `${paperWidthMm}mm`,
              minHeight: `${paperHeightMm}mm`,
              paddingLeft: isA4 ? '14mm' : '10mm',
              paddingRight: isA4 ? '14mm' : '10mm',
              paddingTop:
                printConfig.mode === 'blank_pad'
                  ? `${effectiveHeaderMargin}mm`
                  : isA4
                    ? '12mm'
                    : '10mm',
              paddingBottom:
                printConfig.mode === 'blank_pad'
                  ? `${effectiveFooterMargin}mm`
                  : isA4
                    ? '14mm'
                    : '10mm',
            }}
            className="print-area print-clean bg-white text-slate-900 shadow-2xl transition-transform duration-200 border border-slate-200 flex flex-col justify-between"
          >
            {/* Top Region: Header, Patient Banner, Clinical Notes */}
            <div>
              {/* Top Header Region (Only rendered in letterhead mode) */}
              {printConfig.mode === 'letterhead' ? (
                <div className="border-b-2 border-stone-800 pb-3 mb-3 flex items-start justify-between">
                  <div>
                    <h1
                      style={{ fontSize: `${fontSizes.header}pt` }}
                      className="font-bold text-stone-950 tracking-tight leading-tight"
                    >
                      {settings.doctorName || 'Doctor Full Name'}
                    </h1>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {settings.degrees || 'MBBS'} &middot;{' '}
                      {settings.bmdcReg || 'BMDC Reg.'}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {settings.chamberName} &middot; {settings.chamberAddress}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-600">
                    <p className="font-semibold text-stone-800">
                      Visiting: {settings.chamberHours || 'Chamber Hours'}
                    </p>
                    {settings.chamberPhone && (
                      <p className="text-slate-500 mt-0.5">
                        Phone: {settings.chamberPhone}
                      </p>
                    )}
                    {sections.consultationFee && settings.consultationFee && (
                      <p className="text-teal-900 font-semibold font-mono mt-0.5">
                        Fee: ৳{settings.consultationFee}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Pre-printed Pad Blank Spacing marker (visual guide in studio, hidden on print) */
                <div
                  style={{ height: `${printConfig.headerMarginMm}mm` }}
                  className="no-print border-b border-dashed border-slate-300 mb-3 flex items-center justify-center text-[10px] text-slate-400 uppercase tracking-widest font-mono"
                >
                  [ Reserved Space for Pre-printed Letterhead Pad (
                  {printConfig.headerMarginMm}mm) ]
                </div>
              )}

              {/* Patient Banner on Paper */}
              <div
                style={{ fontSize: `${fontSizes.patientName}pt` }}
                className="bg-slate-50 border border-slate-200 rounded p-2 mb-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <span className="text-slate-500 font-medium">Name: </span>
                    <strong className="text-slate-900 font-bold">
                      {name || '—'}
                    </strong>
                  </div>
                  {ageDisplay && (
                    <div>
                      <span className="text-slate-500 font-medium">Age: </span>
                      <strong className="text-slate-800">{ageDisplay}</strong>
                    </div>
                  )}
                  {sex && (
                    <div>
                      <span className="text-slate-500 font-medium">Sex: </span>
                      <strong className="text-slate-800">{sex}</strong>
                    </div>
                  )}
                  {sections.patientWeight && weightKg && (
                    <div>
                      <span className="text-slate-500 font-medium">
                        Weight:{' '}
                      </span>
                      <strong className="text-slate-800">{weightKg} kg</strong>
                    </div>
                  )}
                  {sections.patientPhone && phone && (
                    <div>
                      <span className="text-slate-500 font-medium">
                        Phone:{' '}
                      </span>
                      <strong className="text-slate-800 font-mono">
                        {phone}
                      </strong>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Date: </span>
                  <strong className="text-slate-800 font-mono">
                    {visitDate}
                  </strong>
                </div>
              </div>

              {/* 2-Column Clinical Layout */}
              <div className="grid grid-cols-12 gap-5 min-h-[140mm]">
                {/* Left Column: Examination & Findings (w-4/12) */}
                <div
                  style={{ fontSize: `${fontSizes.clinicalNotes}pt` }}
                  className="col-span-4 border-r border-slate-200 pr-3.5 space-y-3"
                >
                  {sections.chiefComplaints && chiefComplaints && (
                    <div>
                      <h4 className="font-bold text-[10px] text-teal-800 uppercase tracking-wider mb-0.5">
                        C/C (Chief Complaints)
                      </h4>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                        {chiefComplaints}
                      </p>
                    </div>
                  )}

                  {sections.onExamination && onExamination && (
                    <div>
                      <h4 className="font-bold text-[10px] text-teal-800 uppercase tracking-wider mb-0.5">
                        O/E (On Examination)
                      </h4>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                        {onExamination}
                      </p>
                    </div>
                  )}

                  {sections.diagnosis && diagnosis && (
                    <div>
                      <h4 className="font-bold text-[10px] text-teal-800 uppercase tracking-wider mb-0.5">
                        Dx (Diagnosis)
                      </h4>
                      <p className="text-slate-900 font-bold">{diagnosis}</p>
                    </div>
                  )}

                  {sections.investigations && investigations && (
                    <div>
                      <h4 className="font-bold text-[10px] text-teal-800 uppercase tracking-wider mb-0.5">
                        Investigations Advised
                      </h4>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {investigations}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Rx Medicines & Directives (w-8/12) */}
                <div className="col-span-8 space-y-3.5">
                  {/* Rx Symbol */}
                  <div className="font-serif italic text-2xl font-bold text-teal-800 border-b border-slate-200 pb-0.5 flex items-center justify-between">
                    <span>℞</span>
                    <span className="text-[10px] text-slate-400 font-sans not-italic font-normal">
                      Prescription
                    </span>
                  </div>

                  {/* Medicines List */}
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">
                        No medicines prescribed.
                      </p>
                    ) : (
                      items.map((item, idx) => (
                        <div
                          key={idx}
                          className="text-xs break-inside-avoid"
                          style={{ pageBreakInside: 'avoid' }}
                        >
                          <div
                            style={{ fontSize: `${fontSizes.medicineName}pt` }}
                            className="flex items-center gap-1.5 flex-wrap"
                          >
                            <span className="font-bold text-slate-900">
                              {idx + 1}. {item.free_text_name}
                            </span>
                            {item.form_snapshot && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1 py-0.2 rounded font-medium">
                                {item.form_snapshot}
                              </span>
                            )}
                            {item.strength_snapshot && (
                              <span className="text-[10px] text-slate-600 font-semibold">
                                {item.strength_snapshot}
                              </span>
                            )}
                          </div>

                          {/* English Dose line */}
                          <div
                            style={{ fontSize: `${fontSizes.doseText}pt` }}
                            className="ml-3.5 mt-0.5 text-slate-700 flex items-center gap-2 flex-wrap"
                          >
                            <span className="font-mono font-bold text-teal-900">
                              {item.dose}
                            </span>
                            {item.meal_timing && (
                              <span className="text-slate-600">
                                &middot; {item.meal_timing}
                              </span>
                            )}
                            {item.duration && (
                              <span className="text-slate-500 font-medium">
                                ({item.duration})
                              </span>
                            )}
                          </div>

                          {/* Bangla Translated Dose Line */}
                          {printConfig.showBanglaDose && (
                            <div
                              style={{ fontSize: `${fontSizes.banglaDose}pt` }}
                              className="ml-3.5 mt-0.5 font-bangla text-slate-600 font-medium leading-normal"
                            >
                              {formatBanglaDoseLine(
                                item.dose,
                                item.meal_timing,
                                item.duration,
                              )}
                            </div>
                          )}

                          {item.note && (
                            <div className="ml-3.5 text-[11px] text-slate-500 italic mt-0.5">
                              * {item.note}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Advice Section */}
                  {sections.advice && advice && (
                    <div
                      style={{ fontSize: `${fontSizes.clinicalNotes}pt` }}
                      className="pt-3 border-t border-slate-200"
                    >
                      <h4 className="font-bold text-[11px] text-slate-800 mb-0.5">
                        Advice / উপদেশ:
                      </h4>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {advice}
                      </p>
                    </div>
                  )}

                  {/* Follow-up Section */}
                  {sections.followUp && followUp && (
                    <div
                      style={{ fontSize: `${fontSizes.clinicalNotes}pt` }}
                      className="pt-2"
                    >
                      <p className="text-slate-900 font-semibold">
                        পরবর্তী সাক্ষাত / Next Visit: {followUp}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Footer Region: Signature */}
            <div className="pt-4 border-t border-slate-200 flex items-end justify-between text-xs text-slate-500">
              <div className="text-[10px]">
                Prescription Writer Offline Suite &middot; {visitDate}
              </div>

              <div className="text-center w-48">
                <div className="border-t border-slate-400 pt-1 text-xs font-semibold text-slate-800">
                  Doctor's Signature
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="no-print px-5 py-2.5 border-t border-beige-300 bg-beige-100 flex items-center justify-between text-xs text-ink-600">
          <div className="flex items-center gap-2">
            <span>Preview Zoom: {zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 60))}
              className="p-1 hover:text-ink-900 bg-white border border-beige-300 rounded cursor-pointer transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 140))}
              className="p-1 hover:text-ink-900 bg-white border border-beige-300 rounded cursor-pointer transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Tip: Press{' '}
              <kbd className="bg-white px-1.5 py-0.5 rounded font-mono text-ink-800 border border-beige-300 text-[11px]">
                Ctrl + P
              </kbd>{' '}
              for OS print dialog
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
