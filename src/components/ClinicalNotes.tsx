import React from 'react';
import { usePrescriptionStore } from '../store/usePrescriptionStore';

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

  return (
    <div className="space-y-4 text-xs">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
        <h3 className="font-bold text-slate-700 tracking-wide uppercase text-[11px]">
          Clinical Examination & Notes
        </h3>
        <span className="text-[10px] text-slate-400">
          Left Column (C/C · O/E · Dx)
        </span>
      </div>

      {/* C/C (Chief Complaints) */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          C/C{' '}
          <span className="font-normal text-slate-400">(Chief Complaints)</span>
        </label>
        <textarea
          rows={3}
          value={chiefComplaints}
          onChange={(e) => updateClinical({ chiefComplaints: e.target.value })}
          placeholder="e.g. Fever for 3 days, dry cough, sore throat..."
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 resize-none leading-relaxed"
        />
      </div>

      {/* O/E (On Examination) */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          O/E{' '}
          <span className="font-normal text-slate-400">(On Examination)</span>
        </label>
        <textarea
          rows={2}
          value={onExamination}
          onChange={(e) => updateClinical({ onExamination: e.target.value })}
          placeholder="BP: 120/80 mmHg, Pulse: 78/min, Temp: 99°F, Chest: Clear..."
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 resize-none leading-relaxed"
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
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 font-medium"
        />
      </div>

      {/* Investigations (Rx / Lab Tests) */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Investigations{' '}
          <span className="font-normal text-slate-400">(Tests / Lab)</span>
        </label>
        <textarea
          rows={2}
          value={investigations}
          onChange={(e) => updateClinical({ investigations: e.target.value })}
          placeholder="CBC, RBS, Serum Creatinine, Urine R/M/E, CXR P/A view..."
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 resize-none leading-relaxed"
        />
      </div>

      {/* Advice */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Advice{' '}
          <span className="font-normal text-slate-400">
            (General instructions)
          </span>
        </label>
        <textarea
          rows={2}
          value={advice}
          onChange={(e) => updateClinical({ advice: e.target.value })}
          placeholder="Bed rest, drink plenty of warm water, avoid cold food..."
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 resize-none leading-relaxed"
        />
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
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 mb-1.5"
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
