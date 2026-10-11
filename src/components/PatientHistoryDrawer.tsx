import React, { useEffect, useRef, useState } from 'react';
import { X, History, Copy, Calendar, Stethoscope } from 'lucide-react';
import { usePrescriptionStore } from '../store/usePrescriptionStore';
import type { Prescription } from '../shared/types';
import { animateDrawer } from '../shared/animations';

export default function PatientHistoryDrawer() {
  const {
    patientId,
    name,
    isHistoryDrawerOpen,
    setHistoryDrawerOpen,
    repeatPreviousPrescription,
    addItem,
  } = usePrescriptionStore();

  const [historyList, setHistoryList] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fetch past prescriptions for this patient
  useEffect(() => {
    if (!isHistoryDrawerOpen) return;

    if (patientId && window.api?.getPatientPrescriptions) {
      setIsLoading(true);
      window.api
        .getPatientPrescriptions(patientId)
        .then((res) => {
          setHistoryList(res || []);
        })
        .catch((err) => {
          console.error('Failed to load patient history:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Mock history for demo/testing if not in DB yet
      setHistoryList([
        {
          id: 101,
          patient_id: patientId || 1,
          visit_date: '2026-09-15',
          weight_kg: 68,
          chief_complaints: 'Fever for 2 days, headache, body ache',
          on_examination: 'Temp: 100.4°F, BP: 120/80 mmHg, Chest: Clear',
          diagnosis: 'Viral Fever',
          investigations: 'CBC, Dengue NS1 Ag',
          advice: 'Rest, plenty of oral fluids, paracetamol for fever',
          follow_up: 'After 3 days if fever persists',
          status: 'final',
          created_at: '2026-09-15T10:30:00Z',
          finalized_at: '2026-09-15T10:45:00Z',
          items: [
            {
              id: 201,
              position: 1,
              brand_id: null,
              free_text_name: 'Napa (Paracetamol 500mg)',
              form_snapshot: 'Tablet',
              strength_snapshot: '500 mg',
              generic_snapshot: 'Paracetamol',
              dose: '1+1+1',
              meal_timing: 'After meal',
              duration: '3 days',
              note: null,
            },
            {
              id: 202,
              position: 2,
              brand_id: null,
              free_text_name: 'Alatrol (Cetirizine 10mg)',
              form_snapshot: 'Tablet',
              strength_snapshot: '10 mg',
              generic_snapshot: 'Cetirizine Hydrochloride',
              dose: '0+0+1',
              meal_timing: 'After meal',
              duration: '5 days',
              note: 'At night',
            },
          ],
        },
      ]);
    }
  }, [isHistoryDrawerOpen, patientId]);

  // Handle GSAP slide in/out
  useEffect(() => {
    if (drawerRef.current) {
      animateDrawer(drawerRef.current, isHistoryDrawerOpen);
    }
  }, [isHistoryDrawerOpen]);

  if (!isHistoryDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-stone-900/30 backdrop-blur-xs transition-opacity">
      <div
        ref={drawerRef}
        className="w-full max-w-lg bg-ivory-100 h-full shadow-2xl border-l border-beige-300 flex flex-col justify-between"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-beige-300 bg-beige-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center shadow-inner">
              <History className="w-4 h-4 text-gold-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-900">
                Past Visits & Encounters
              </h3>
              <p className="text-xs text-ink-500">
                {name ? `Patient: ${name}` : 'Encounter Timeline'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setHistoryDrawerOpen(false)}
            className="p-1.5 rounded-xl text-ink-400 hover:text-ink-900 hover:bg-beige-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-ink-400 text-xs">
              Loading past encounters...
            </div>
          ) : historyList.length === 0 ? (
            <div className="text-center py-16 text-ink-400 text-xs">
              No previous prescriptions found for this patient.
            </div>
          ) : (
            historyList.map((rx) => (
              <div
                key={rx.id}
                className="bezel-card p-4 bg-white border border-beige-300 rounded-2xl shadow-xs hover:border-gold-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between border-b border-beige-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gold-600" />
                    <span className="font-bold text-xs text-ink-900">
                      Visit Date: {rx.visit_date}
                    </span>
                    <span className="text-[10px] bg-gold-50 text-gold-700 font-semibold px-2.5 py-0.5 rounded-full border border-gold-200">
                      Rx #{rx.id}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => repeatPreviousPrescription(rx)}
                    className="px-3 py-1.5 bg-gold-600 hover:bg-gold-700 active:bg-gold-800 active:scale-[0.98] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs border border-gold-500 transition-all cursor-pointer"
                    title="Copy all medicines and notes to current draft"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Repeat Entire Rx</span>
                  </button>
                </div>

                {rx.diagnosis && (
                  <div className="text-xs">
                    <span className="font-bold text-ink-500">Diagnosis: </span>
                    <span className="text-gold-700 font-semibold">
                      {rx.diagnosis}
                    </span>
                  </div>
                )}

                {rx.chief_complaints && (
                  <div className="text-xs text-ink-700">
                    <span className="font-semibold text-ink-500">
                      Complaints:{' '}
                    </span>
                    {rx.chief_complaints}
                  </div>
                )}

                {/* Prescribed Medicines */}
                <div>
                  <div className="text-[11px] font-bold text-ink-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-gold-600" />
                    <span>Medications Prescribed ({rx.items.length})</span>
                  </div>

                  <div className="space-y-1.5 bg-ivory-50 rounded-xl p-3 border border-beige-200">
                    {rx.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-beige-200/80 last:border-0"
                      >
                        <div>
                          <span className="font-bold text-ink-900">
                            {item.free_text_name}
                          </span>
                          <span className="text-ink-600 ml-2 font-mono">
                            {item.dose}
                          </span>
                          {item.duration && (
                            <span className="text-ink-500 ml-1.5 text-[11px]">
                              ({item.duration})
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => addItem(item)}
                          className="text-[10px] text-gold-700 hover:text-white bg-gold-50 hover:bg-gold-600 border border-gold-300 px-2 py-0.5 rounded-lg font-semibold cursor-pointer transition-colors"
                        >
                          + Add this
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {rx.advice && (
                  <div className="text-xs text-ink-600 italic bg-beige-50 p-2.5 rounded-xl border border-beige-200">
                    <strong className="text-ink-800">Advice:</strong>{' '}
                    {rx.advice}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 border-t border-beige-300 bg-beige-100 text-right">
          <button
            type="button"
            onClick={() => setHistoryDrawerOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-ink-700 hover:text-ink-900 bg-white border border-beige-300 rounded-xl hover:bg-beige-50 transition-colors cursor-pointer"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );
}
