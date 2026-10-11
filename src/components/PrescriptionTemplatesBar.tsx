import React, { useRef, useEffect } from 'react';
import { Sparkles, Zap, ChevronRight } from 'lucide-react';
import { usePrescriptionStore } from '../store/usePrescriptionStore';
import type { PrescriptionTemplate } from '../shared/types';
import { animateListEntrance } from '../shared/animations';

export const CLINICAL_TEMPLATES: PrescriptionTemplate[] = [
  {
    id: 'fever_urti',
    name: 'Fever / Acute URTI',
    category: 'General',
    description:
      'Acute Upper Respiratory Tract Infection with fever and sore throat',
    chief_complaints:
      'Fever for 3 days (high grade), sore throat, dry cough, malaise',
    on_examination:
      'Temp: 101°F, BP: 120/80 mmHg, Pulse: 88/min, Throat: Congested, Chest: Clear',
    diagnosis: 'Acute Upper Respiratory Tract Infection (URTI)',
    investigations: 'CBC, Urine R/M/E',
    advice:
      'Drink warm water with honey, steam inhalation twice daily, adequate rest, avoid cold drinks',
    follow_up: 'After 3 days if fever persists',
    items: [
      {
        free_text_name: 'Napa (Paracetamol 500mg)',
        form_snapshot: 'Tablet',
        strength_snapshot: '500 mg',
        generic_snapshot: 'Paracetamol',
        dose: '1+1+1',
        meal_timing: 'After meal',
        duration: '3 days',
        note: 'Take if fever > 100°F',
      },
      {
        free_text_name: 'Fexo (Fexofenadine 120mg)',
        form_snapshot: 'Tablet',
        strength_snapshot: '120 mg',
        generic_snapshot: 'Fexofenadine',
        dose: '0+0+1',
        meal_timing: 'After meal',
        duration: '5 days',
        note: 'At night',
      },
      {
        free_text_name: 'Monas 10 (Montelukast 10mg)',
        form_snapshot: 'Tablet',
        strength_snapshot: '10 mg',
        generic_snapshot: 'Montelukast',
        dose: '0+0+1',
        meal_timing: 'At bedtime',
        duration: '7 days',
        note: 'Night time',
      },
    ],
  },
  {
    id: 'peptic_gerd',
    name: 'Gastritis / GERD',
    category: 'Gastroenterology',
    description:
      'Acid peptic disease with retrosternal burning and epigastric discomfort',
    chief_complaints:
      'Epigastric pain, heartburn, acid regurgitation, nausea for 1 week',
    on_examination:
      'Epigastric tenderness present, BP: 125/80 mmHg, Tongue: Moist, Abdomen: Soft',
    diagnosis: 'Acid Peptic Disease (GERD / Gastritis)',
    investigations:
      'USG of Whole Abdomen, Endoscopy of UGI tract (if symptoms persist)',
    advice:
      'Avoid spicy, oily, and fast foods. Do not lie down immediately after dinner (wait 2 hours). Avoid tea/coffee on empty stomach.',
    follow_up: 'After 14 days',
    items: [
      {
        free_text_name: 'Seclo (Omeprazole 20mg)',
        form_snapshot: 'Capsule',
        strength_snapshot: '20 mg',
        generic_snapshot: 'Omeprazole',
        dose: '1+0+1',
        meal_timing: 'Before meal',
        duration: '14 days',
        note: '30 mins before breakfast & dinner',
      },
      {
        free_text_name: 'Entacyd (Antacid Plus)',
        form_snapshot: 'Suspension',
        strength_snapshot: '200ml',
        generic_snapshot: 'Magaldrate + Simethicone',
        dose: '2 spoonful',
        meal_timing: 'After meal',
        duration: '7 days',
        note: 'Take 1 hour after meal & bedtime for acute discomfort',
      },
    ],
  },
  {
    id: 'htn_stage1',
    name: 'Essential Hypertension',
    category: 'Cardiology',
    description: 'Stage 1 Essential Hypertension regimen',
    chief_complaints:
      'Occipital headache, heaviness of head, mild dizziness on exertion',
    on_examination:
      'BP: 150/95 mmHg (sitting), Pulse: 76/min, S1+S2: Audible, no murmur, BMI: 27.2 kg/m²',
    diagnosis: 'Essential Hypertension (Stage 1)',
    investigations:
      'ECG, Serum Creatinine, Serum Electrolytes, Lipid Profile, Urine for microalbumin',
    advice:
      'Strict low salt diet (< 5g/day), brisk walking 30 mins daily, avoid smoking, monitor BP weekly',
    follow_up: 'After 1 month with investigation reports',
    items: [
      {
        free_text_name: 'Camlosart (Amlodipine 5mg + Olmesartan 20mg)',
        form_snapshot: 'Tablet',
        strength_snapshot: '5mg/20mg',
        generic_snapshot: 'Amlodipine + Olmesartan',
        dose: '0+1+0',
        meal_timing: 'After meal',
        duration: '1 month',
        note: 'Take regularly at lunch time',
      },
    ],
  },
  {
    id: 't2dm_new',
    name: 'Type 2 Diabetes',
    category: 'Endocrinology',
    description: 'Newly diagnosed / baseline Type 2 Diabetes management',
    chief_complaints:
      'Increased thirst (polydipsia), frequent urination (polyuria), generalized fatigue for 2 months',
    on_examination:
      'BP: 130/85 mmHg, Weight: 74 kg, BMI: 26.5 kg/m², Foot sensations: Intact',
    diagnosis: 'Type 2 Diabetes Mellitus',
    investigations:
      'HbA1c, FBG, 2HABF, Lipid Profile, Serum Creatinine, Urine R/M/E',
    advice:
      'Diabetic diet plan, 30 minutes daily aerobic exercise, foot care education, home glucose monitoring',
    follow_up: 'After 14 days with blood glucose chart',
    items: [
      {
        free_text_name: 'Combit (Metformin 500mg)',
        form_snapshot: 'Tablet',
        strength_snapshot: '500 mg',
        generic_snapshot: 'Metformin Hydrochloride',
        dose: '1+0+1',
        meal_timing: 'With meal',
        duration: '1 month',
        note: 'With breakfast and dinner',
      },
    ],
  },
  {
    id: 'asthma_copd',
    name: 'Bronchial Asthma / Bronchospasm',
    category: 'Pulmonology',
    description: 'Acute wheezing, shortness of breath, nocturnal cough',
    chief_complaints:
      'Shortness of breath, nocturnal wheezing, dry irritating cough for 4 days',
    on_examination:
      'Resp Rate: 24/min, SpO2: 96% on room air, Chest: Bilateral polyphonic rhonchi present',
    diagnosis: 'Bronchial Asthma (Acute Exacerbation)',
    investigations: 'CXR P/A view, Total IgE, Blood Eosinophil count',
    advice:
      'Avoid dust, cold air, smoking, and allergens. Rinse mouth thoroughly after inhaler use.',
    follow_up: 'After 7 days',
    items: [
      {
        free_text_name: 'Seretide Diskus (Fluticasone + Salmeterol)',
        form_snapshot: 'Inhaler',
        strength_snapshot: '50/250 mcg',
        generic_snapshot: 'Fluticasone + Salmeterol',
        dose: '1+0+1 puff',
        meal_timing: 'Inhalation',
        duration: '1 month',
        note: 'Rinse mouth with water after puff',
      },
      {
        free_text_name: 'Doxovent (Doxofylline 400mg)',
        form_snapshot: 'Tablet',
        strength_snapshot: '400 mg',
        generic_snapshot: 'Doxofylline',
        dose: '0+0+1',
        meal_timing: 'After meal',
        duration: '10 days',
        note: 'At night',
      },
    ],
  },
];

export default function PrescriptionTemplatesBar() {
  const { applyTemplate } = usePrescriptionStore();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      animateListEntrance(listRef.current.children, {
        stagger: 0.04,
        yOffset: 6,
      });
    }
  }, []);

  return (
    <div className="bezel-card p-3.5 mb-5 bg-white border border-beige-300 shadow-xs">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2 text-xs font-bold text-ink-900">
          <Sparkles className="w-3.5 h-3.5 text-gold-600" />
          <span>Quick Clinical Templates (1-Click Prescriptions)</span>
          <span className="text-[10px] font-semibold text-gold-700 bg-gold-50 border border-gold-200 px-2 py-0.5 rounded-full shadow-xs">
            Sub-30s Flow
          </span>
        </div>
        <span className="text-[10px] text-ink-400">
          Click any acute condition to populate clinical findings & medicines
        </span>
      </div>

      <div
        ref={listRef}
        className="flex items-center gap-2.5 overflow-x-auto pb-1"
      >
        {CLINICAL_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => applyTemplate(tmpl)}
            className="group shrink-0 text-left px-3 py-2 bg-beige-50 border border-beige-300 hover:border-gold-400 hover:bg-gold-50/50 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2.5"
            title={`${tmpl.description} (${tmpl.items.length} medicines)`}
          >
            <div className="w-6 h-6 rounded-lg bg-gold-50 group-hover:bg-gold-100 text-gold-700 flex items-center justify-center transition-colors border border-gold-200 shrink-0">
              <Zap className="w-3 h-3" />
            </div>
            <div>
              <div className="text-xs font-semibold text-ink-900 group-hover:text-gold-800 leading-tight">
                {tmpl.name}
              </div>
              <div className="text-[10px] text-ink-500 group-hover:text-ink-700">
                {tmpl.category} &middot; {tmpl.items.length} Rx
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-ink-400 group-hover:text-gold-600 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
