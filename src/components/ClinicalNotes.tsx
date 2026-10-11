import React from 'react';
import { usePrescriptionStore } from '../store/usePrescriptionStore';

const COMMON_COMPLAINTS = [
  'Fever',
  'Dry cough',
  'Sore throat',
  'Headache',
  'Epigastric pain',
  'Vomiting',
  'Shortness of breath',
  'Chest pain',
  'Loose motion',
];

const COMMON_INVESTIGATIONS = [
  'CBC',
  'RBS',
  'Serum Creatinine',
  'Lipid Profile',
  'SGPT/ALT',
  'Urine R/M/E',
  'ECG',
  'CXR P/A view',
  'USG of Whole Abdomen',
];

const COMMON_ADVICE = [
  'Drink plenty of warm water',
  'Strict low salt diet (<5g/day)',
  'Diabetic diet plan',
  'Avoid spicy & oily food',
  'Bed rest for 3 days',
  'Steam inhalation twice daily',
];

const FOLLOW_UP_PRESETS = [
  'After 3 days',
  'After 5 days',
  'After 7 days',
  'After 14 days',
  'After 1 month',
  'SOS',
];

export default function ClinicalNotes() {
  const {
    chiefComplaints,
    onExamination,
    diagnosis,
    investigations,
    advice,
    followUp,
    updateClinical,
  } = usePrescriptionStore();

  const appendComplaint = (chip: string) => {
    const existing = chiefComplaints.trim();
    if (!existing) {
      updateClinical({ chiefComplaints: `${chip} for ` });
    } else if (!existing.includes(chip)) {
      updateClinical({ chiefComplaints: `${existing}, ${chip}` });
    }
  };

  const appendInvestigation = (test: string) => {
    const existing = investigations.trim();
    if (!existing) {
      updateClinical({ investigations: test });
    } else if (!existing.includes(test)) {
      updateClinical({ investigations: `${existing}, ${test}` });
    }
  };

  const appendAdvice = (tip: string) => {
    const existing = advice.trim();
    if (!existing) {
      updateClinical({ advice: tip });
    } else if (!existing.includes(tip)) {
      updateClinical({ advice: `${existing}. ${tip}` });
    }
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-beige-300">
        <h3 className="font-bold text-gold-700 tracking-wider uppercase text-xs flex items-center gap-2">
          Clinical Examination & Findings
        </h3>
        <span className="text-[10px] text-ink-400 font-mono">
          Clinical Rail
        </span>
      </div>

      {/* Bento Card 1: Chief Complaints & Diagnosis */}
      <div className="bezel-card p-5 bg-white space-y-3.5 border border-beige-300 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-ink-900">
            Chief Complaints (C/C)
          </label>
          <span className="text-[10px] text-ink-400">Symptoms & Duration</span>
        </div>
        <textarea
          rows={3}
          value={chiefComplaints}
          onChange={(e) => updateClinical({ chiefComplaints: e.target.value })}
          placeholder="e.g. High fever for 3 days, sore throat, productive cough..."
          className="w-full px-3.5 py-2.5 text-xs bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 text-ink-900 placeholder-ink-400 resize-none leading-relaxed transition-all"
        />

        {/* Quick Complaint Chips */}
        <div>
          <span className="text-[10px] font-semibold text-ink-500 block mb-1.5 uppercase tracking-wider">
            Quick Add Complaints:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_COMPLAINTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => appendComplaint(c)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-beige-100 hover:bg-gold-50 hover:text-gold-700 text-ink-700 border border-beige-300 hover:border-gold-300 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>+ {c}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Provisional Diagnosis */}
        <div className="pt-2 border-t border-beige-200">
          <label className="block text-xs font-bold text-ink-900 mb-1.5">
            Provisional Diagnosis (Dx)
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => updateClinical({ diagnosis: e.target.value })}
            placeholder="e.g. Acute URTI, Essential Hypertension..."
            className="w-full h-11 px-3.5 text-xs bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 text-ink-900 placeholder-ink-400 font-medium transition-all"
          />
        </div>
      </div>

      {/* Bento Card 2: Physical Examination & Vitals (O/E) */}
      <div className="bezel-card p-5 bg-white space-y-3 border border-beige-300 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-ink-900">
            On Examination & Vitals (O/E)
          </label>
          <span className="text-[10px] text-ink-400">
            Clinical Measurements
          </span>
        </div>
        <textarea
          rows={3}
          value={onExamination}
          onChange={(e) => updateClinical({ onExamination: e.target.value })}
          placeholder="BP: 120/80 mmHg, Pulse: 78/min, Temp: 99°F, Chest: Clear, Heart: S1+S2+0..."
          className="w-full px-3.5 py-2.5 text-xs bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 text-ink-900 placeholder-ink-400 resize-none leading-relaxed transition-all"
        />
        {/* Vitals Quick Presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            'BP: 120/80 mmHg',
            'Pulse: 76 bpm',
            'Temp: 98.6°F',
            'SpO2: 99%',
            'Chest: Clear',
          ].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                const current = onExamination.trim();
                updateClinical({
                  onExamination: current ? `${current}, ${v}` : v,
                });
              }}
              className="text-[10px] px-2 py-0.5 rounded-md bg-beige-100 hover:bg-white text-ink-600 hover:text-ink-900 border border-beige-200 transition-colors cursor-pointer"
            >
              + {v}
            </button>
          ))}
        </div>
      </div>

      {/* Bento Card 3: Investigations, Advice & Follow-Up */}
      <div className="bezel-card p-5 bg-white space-y-4 border border-beige-300 shadow-xs">
        {/* Investigations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-ink-900">
              Investigations (Lab & Imaging)
            </label>
            <span className="text-[10px] text-ink-400">Diagnostic Tests</span>
          </div>
          <textarea
            rows={2}
            value={investigations}
            onChange={(e) => updateClinical({ investigations: e.target.value })}
            placeholder="CBC, RBS, Serum Creatinine, Urine R/M/E, ECG, CXR..."
            className="w-full px-3.5 py-2 text-xs bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 text-ink-900 placeholder-ink-400 resize-none leading-relaxed transition-all"
          />
          {/* Quick Investigation Chips */}
          <div className="flex flex-wrap gap-1.5">
            {COMMON_INVESTIGATIONS.map((inv) => (
              <button
                key={inv}
                type="button"
                onClick={() => appendInvestigation(inv)}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-beige-100 hover:bg-gold-50 hover:text-gold-700 text-ink-600 border border-beige-200 hover:border-gold-300 transition-all cursor-pointer"
              >
                + {inv}
              </button>
            ))}
          </div>
        </div>

        {/* Advice */}
        <div className="space-y-2 pt-2 border-t border-beige-200">
          <label className="block text-xs font-bold text-ink-900">
            Advice & Directives
          </label>
          <textarea
            rows={2}
            value={advice}
            onChange={(e) => updateClinical({ advice: e.target.value })}
            placeholder="Bed rest, drink plenty of warm water, low salt diet..."
            className="w-full px-3.5 py-2 text-xs bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 text-ink-900 placeholder-ink-400 resize-none leading-relaxed transition-all"
          />
          {/* Quick Advice Chips */}
          <div className="flex flex-wrap gap-1.5">
            {COMMON_ADVICE.map((adv) => (
              <button
                key={adv}
                type="button"
                onClick={() => appendAdvice(adv)}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-beige-100 hover:bg-gold-50 hover:text-gold-700 text-ink-600 border border-beige-200 hover:border-gold-300 transition-all cursor-pointer"
              >
                + {adv}
              </button>
            ))}
          </div>
        </div>

        {/* Follow-up */}
        <div className="pt-2 border-t border-beige-200">
          <label className="block text-xs font-bold text-ink-900 mb-1.5">
            Follow-up & Next Visit
          </label>
          <input
            type="text"
            value={followUp}
            onChange={(e) => updateClinical({ followUp: e.target.value })}
            placeholder="e.g. After 7 days or SOS"
            className="w-full h-10 px-3.5 text-xs bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 text-ink-900 placeholder-ink-400 mb-2 font-medium"
          />
          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {FOLLOW_UP_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => updateClinical({ followUp: preset })}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                  followUp === preset
                    ? 'bg-gold-50 text-gold-700 border-gold-300 shadow-xs'
                    : 'bg-beige-100 text-ink-600 hover:text-ink-900 border-beige-200 hover:border-beige-300'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
