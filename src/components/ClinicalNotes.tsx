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
    <div className="space-y-4 text-xs">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
        <h3 className="font-bold text-slate-800 tracking-wide uppercase text-[11px]">
          Clinical Examination & Findings
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">
          Left Canvas
        </span>
      </div>

      {/* C/C (Chief Complaints) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-bold text-slate-700">
            C/C{' '}
            <span className="font-normal text-slate-400">
              (Chief Complaints)
            </span>
          </label>
        </div>
        <textarea
          rows={3}
          value={chiefComplaints}
          onChange={(e) => updateClinical({ chiefComplaints: e.target.value })}
          placeholder="e.g. High fever for 3 days, sore throat..."
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 resize-none leading-relaxed shadow-2xs"
        />
        {/* Quick Complaint Chips */}
        <div className="flex flex-wrap gap-1 mt-1">
          {COMMON_COMPLAINTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => appendComplaint(c)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer flex items-center gap-0.5"
            >
              <span>+ {c}</span>
            </button>
          ))}
        </div>
      </div>

      {/* O/E (On Examination) */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          O/E{' '}
          <span className="font-normal text-slate-400">
            (On Examination / Vitals)
          </span>
        </label>
        <textarea
          rows={2}
          value={onExamination}
          onChange={(e) => updateClinical({ onExamination: e.target.value })}
          placeholder="BP: 120/80 mmHg, Pulse: 78/min, Temp: 99°F, Chest: Clear..."
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 resize-none leading-relaxed shadow-2xs"
        />
      </div>

      {/* Dx (Diagnosis) */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Dx <span className="font-normal text-slate-400">(Diagnosis)</span>
        </label>
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => updateClinical({ diagnosis: e.target.value })}
          placeholder="e.g. Acute URTI, Essential Hypertension..."
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 font-medium shadow-2xs"
        />
      </div>

      {/* Investigations (Rx / Lab Tests) */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Investigations{' '}
          <span className="font-normal text-slate-400">(Lab & Imaging)</span>
        </label>
        <textarea
          rows={2}
          value={investigations}
          onChange={(e) => updateClinical({ investigations: e.target.value })}
          placeholder="CBC, RBS, Serum Creatinine, Urine R/M/E, CXR..."
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 resize-none leading-relaxed shadow-2xs"
        />
        {/* Quick Investigation Chips */}
        <div className="flex flex-wrap gap-1 mt-1">
          {COMMON_INVESTIGATIONS.map((inv) => (
            <button
              key={inv}
              type="button"
              onClick={() => appendInvestigation(inv)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
            >
              + {inv}
            </button>
          ))}
        </div>
      </div>

      {/* Advice */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Advice{' '}
          <span className="font-normal text-slate-400">
            (Lifestyle & Directives)
          </span>
        </label>
        <textarea
          rows={2}
          value={advice}
          onChange={(e) => updateClinical({ advice: e.target.value })}
          placeholder="Bed rest, drink plenty of warm water..."
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 resize-none leading-relaxed shadow-2xs"
        />
        {/* Quick Advice Chips */}
        <div className="flex flex-wrap gap-1 mt-1">
          {COMMON_ADVICE.map((adv) => (
            <button
              key={adv}
              type="button"
              onClick={() => appendAdvice(adv)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
            >
              + {adv}
            </button>
          ))}
        </div>
      </div>

      {/* Follow-up */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Follow-up{' '}
          <span className="font-normal text-slate-400">(Next visit)</span>
        </label>
        <input
          type="text"
          value={followUp}
          onChange={(e) => updateClinical({ followUp: e.target.value })}
          placeholder="e.g. After 7 days or SOS"
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 mb-1.5 shadow-2xs"
        />
        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1">
          {FOLLOW_UP_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => updateClinical({ followUp: preset })}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer border ${
                followUp === preset
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 border-slate-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
