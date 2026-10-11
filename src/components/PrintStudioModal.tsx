import React, { useState, useRef } from 'react';
import { X, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { usePrescriptionStore } from '../store/usePrescriptionStore';
import type { AppSettings, PrintConfig } from '../shared/types';

interface PrintStudioModalProps {
  settings: AppSettings;
}

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
    mode: 'letterhead',
    paperSize: 'a4',
    headerMarginMm: 65,
    footerMarginMm: 30,
    showBanglaDose: true,
  });

  const [zoomLevel, setZoomLevel] = useState(100);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isPrintStudioOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const ageDisplay = [
    ageYears !== null ? `${ageYears} Yrs` : '',
    ageMonths !== null ? `${ageMonths} Mo` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-ivory-100 border border-beige-300 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-ink-900">
        {/* Modal Top Control Bar */}
        <div className="px-6 py-4 border-b border-beige-300 bg-beige-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 border border-gold-200 flex items-center justify-center shadow-inner">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
                <span>WYSIWYG Live Print Studio</span>
                <span className="text-[10px] uppercase tracking-wider font-mono bg-gold-50 text-gold-700 border border-gold-200 px-2.5 py-0.5 rounded-full">
                  Paper Exact
                </span>
              </h2>
              <p className="text-xs text-ink-500">
                Preview exact paper margins before physical printing or PDF
                export
              </p>
            </div>
          </div>

          {/* Quick Settings & Mode Toggles */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-white p-1 border border-beige-300 text-xs shadow-xs">
              <button
                type="button"
                onClick={() =>
                  setPrintConfig((prev) => ({ ...prev, mode: 'letterhead' }))
                }
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
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
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  printConfig.mode === 'blank_pad'
                    ? 'bg-gold-600 text-white shadow-xs'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                Pre-Printed Pad Space
              </button>
            </div>

            {/* Paper Size */}
            <div className="flex rounded-xl bg-white p-1 border border-beige-300 text-xs shadow-xs">
              <button
                type="button"
                onClick={() =>
                  setPrintConfig((prev) => ({ ...prev, paperSize: 'a4' }))
                }
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  printConfig.paperSize === 'a4'
                    ? 'bg-beige-200 text-ink-900 font-bold'
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
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  printConfig.paperSize === 'a5'
                    ? 'bg-beige-200 text-ink-900 font-bold'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                A5
              </button>
            </div>

            {/* Print CTA */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-gold-600 hover:bg-gold-700 active:bg-gold-800 active:scale-[0.98] text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-xs border border-gold-500 transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Prescription</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintStudioOpen(false)}
              className="p-2 text-ink-400 hover:text-ink-900 hover:bg-beige-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Paper Preview */}
        <div className="flex-1 overflow-y-auto p-8 bg-studio-base flex justify-center">
          <div
            ref={printAreaRef}
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
            className={`bg-white text-slate-900 shadow-2xl transition-transform duration-200 border border-slate-200 flex flex-col justify-between ${
              printConfig.paperSize === 'a4'
                ? 'w-[210mm] min-h-[297mm] p-10'
                : 'w-[148mm] min-h-[210mm] p-7'
            }`}
          >
            {/* Top Header Region */}
            <div>
              {printConfig.mode === 'letterhead' ? (
                <div className="border-b-2 border-stone-800 pb-4 mb-4 flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-stone-950 tracking-tight">
                      {settings.doctorName}
                    </h1>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {settings.degrees} &middot; {settings.bmdcReg}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {settings.chamberName} &middot; {settings.chamberAddress}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p className="font-semibold text-stone-800">
                      Chamber Hours: {settings.chamberHours}
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      Phone: {settings.chamberPhone}
                    </p>
                  </div>
                </div>
              ) : (
                /* Pre-printed Pad Blank Spacing (offset top for physical letterhead) */
                <div
                  style={{ height: `${printConfig.headerMarginMm}mm` }}
                  className="border-b border-dashed border-slate-300 mb-4 flex items-center justify-center text-[10px] text-slate-300 uppercase tracking-widest print:border-none"
                >
                  [ Reserved Space for Pre-printed Doctor Header (
                  {printConfig.headerMarginMm}mm) ]
                </div>
              )}

              {/* Patient Banner on Paper */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 mb-4 text-xs flex items-center justify-between">
                <div className="flex items-center gap-4 flex-wrap">
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
                  {weightKg && (
                    <div>
                      <span className="text-slate-500 font-medium">
                        Weight:{' '}
                      </span>
                      <strong className="text-slate-800">{weightKg} kg</strong>
                    </div>
                  )}
                  {phone && (
                    <div>
                      <span className="text-slate-500 font-medium">
                        Phone:{' '}
                      </span>
                      <strong className="text-slate-800">{phone}</strong>
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
              <div className="grid grid-cols-12 gap-6 min-h-[160mm]">
                {/* Left Column: Examination & Findings (w-5/12) */}
                <div className="col-span-4 border-r border-slate-200 pr-4 space-y-3.5 text-xs">
                  {chiefComplaints && (
                    <div>
                      <h4 className="font-bold text-[11px] text-teal-800 uppercase tracking-wider mb-0.5">
                        C/C (Chief Complaints)
                      </h4>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                        {chiefComplaints}
                      </p>
                    </div>
                  )}

                  {onExamination && (
                    <div>
                      <h4 className="font-bold text-[11px] text-teal-800 uppercase tracking-wider mb-0.5">
                        O/E (On Examination)
                      </h4>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                        {onExamination}
                      </p>
                    </div>
                  )}

                  {diagnosis && (
                    <div>
                      <h4 className="font-bold text-[11px] text-teal-800 uppercase tracking-wider mb-0.5">
                        Dx (Diagnosis)
                      </h4>
                      <p className="text-slate-900 font-semibold">
                        {diagnosis}
                      </p>
                    </div>
                  )}

                  {investigations && (
                    <div>
                      <h4 className="font-bold text-[11px] text-teal-800 uppercase tracking-wider mb-0.5">
                        Investigations Advised
                      </h4>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {investigations}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Rx Medicines & Advice (w-7/12) */}
                <div className="col-span-8 space-y-4">
                  {/* Rx Symbol */}
                  <div className="font-serif italic text-2xl font-bold text-teal-800 border-b border-slate-200 pb-1">
                    ℞
                  </div>

                  {/* Medicines List */}
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">
                        No medicines prescribed.
                      </p>
                    ) : (
                      items.map((item, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              {idx + 1}. {item.free_text_name}
                            </span>
                            {item.form_snapshot && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                                {item.form_snapshot}
                              </span>
                            )}
                            {item.strength_snapshot && (
                              <span className="text-[10px] text-slate-600 font-medium">
                                {item.strength_snapshot}
                              </span>
                            )}
                          </div>

                          <div className="ml-4 mt-0.5 text-slate-700 flex items-center gap-3">
                            <span className="font-mono font-bold text-teal-900 text-sm">
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

                          {item.note && (
                            <div className="ml-4 text-[11px] text-slate-500 italic">
                              * {item.note}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Advice Section */}
                  {advice && (
                    <div className="pt-4 border-t border-slate-200">
                      <h4 className="font-bold text-xs text-slate-800 mb-1">
                        Advice / উপদেশ:
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {advice}
                      </p>
                    </div>
                  )}

                  {/* Follow-up Section */}
                  {followUp && (
                    <div className="pt-2">
                      <p className="text-xs text-slate-800 font-semibold">
                        পরবর্তী সাক্ষাত / Next Visit: {followUp}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Footer Region: Signature */}
            <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs text-slate-500">
              <div className="text-[10px]">
                Prescription Writer Offline Suite &middot; Generated on{' '}
                {visitDate}
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
        <div className="px-6 py-3 border-t border-studio-border bg-beige-100 flex items-center justify-between text-xs text-ink-600">
          <div className="flex items-center gap-2">
            <span>Zoom: {zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 60))}
              className="p-1 hover:text-ink-900 bg-white border border-studio-border rounded cursor-pointer transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 140))}
              className="p-1 hover:text-ink-900 bg-white border border-studio-border rounded cursor-pointer transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <span>
              Press{' '}
              <kbd className="bg-white px-1.5 py-0.5 rounded font-mono text-ink-800 border border-studio-border">
                Ctrl + P
              </kbd>{' '}
              to initiate OS print dialog
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
