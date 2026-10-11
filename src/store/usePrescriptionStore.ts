import { create } from 'zustand';
import type {
  Patient,
  PrescriptionItem,
  DraftData,
  PrescriptionTemplate,
  ChamberToken,
  Prescription,
  BrandSearchResult,
} from '../shared/types';

export interface PatientState {
  patientId: number | null;
  name: string;
  ageYears: number | null;
  ageMonths: number | null;
  sex: 'M' | 'F' | 'O' | null;
  phone: string;
  weightKg: number | null;
  address: string;
}

export interface ClinicalState {
  visitDate: string;
  chiefComplaints: string;
  onExamination: string;
  diagnosis: string;
  investigations: string;
  advice: string;
  followUp: string;
}

export interface PrescriptionStoreState extends PatientState, ClinicalState {
  items: PrescriptionItem[];
  isSavingDraft: boolean;
  lastSavedAt: string | null;
  saveSuccessMsg: string | null;

  // Queue & Session Tokens
  tokens: ChamberToken[];
  activeTokenId: number | null;

  // Modals & Drawers
  isHistoryDrawerOpen: boolean;
  isTemplatesDrawerOpen: boolean;
  isPrintStudioOpen: boolean;

  // Actions
  updatePatient: (field: Partial<PatientState>) => void;
  selectExistingPatient: (patient: Patient) => void;
  updateClinical: (field: Partial<ClinicalState>) => void;
  addItem: (item: Omit<PrescriptionItem, 'position'>) => void;
  updateItem: (index: number, patch: Partial<PrescriptionItem>) => void;
  removeItem: (index: number) => void;
  applySiblingSwap: (index: number, sibling: BrandSearchResult) => void;
  applyTemplate: (
    template: PrescriptionTemplate,
    appendMedicines?: boolean,
  ) => void;
  repeatPreviousPrescription: (prescription: Prescription) => void;
  clearPrescription: () => void;
  setSaveSuccessMsg: (msg: string | null) => void;

  // Queue actions
  callNextToken: () => void;
  selectToken: (tokenId: number) => void;

  // Drawer toggles
  setHistoryDrawerOpen: (isOpen: boolean) => void;
  setTemplatesDrawerOpen: (isOpen: boolean) => void;
  setPrintStudioOpen: (isOpen: boolean) => void;

  loadDraft: () => Promise<void>;
  saveDraft: () => Promise<void>;
  finalizePrescription: () => Promise<{
    success: boolean;
    prescriptionId?: number;
    error?: string;
  }>;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

const initialPatientState: PatientState = {
  patientId: null,
  name: '',
  ageYears: null,
  ageMonths: null,
  sex: null,
  phone: '',
  weightKg: null,
  address: '',
};

const initialClinicalState: ClinicalState = {
  visitDate: getTodayString(),
  chiefComplaints: '',
  onExamination: '',
  diagnosis: '',
  investigations: '',
  advice: '',
  followUp: '',
};

export const usePrescriptionStore = create<PrescriptionStoreState>(
  (set, get) => ({
    ...initialPatientState,
    ...initialClinicalState,
    items: [],
    isSavingDraft: false,
    lastSavedAt: null,
    saveSuccessMsg: null,

    // Queue & Session Tokens
    tokens: [
      {
        id: 1,
        token_number: 1,
        patient_name: 'Anisur Rahman',
        phone: '01711223344',
        age: '42y',
        sex: 'M',
        status: 'in_consultation',
        time_in: '05:15 PM',
      },
      {
        id: 2,
        token_number: 2,
        patient_name: 'Fatema Begum',
        phone: '01819876543',
        age: '35y',
        sex: 'F',
        status: 'waiting',
        time_in: '05:30 PM',
      },
      {
        id: 3,
        token_number: 3,
        patient_name: 'Tanvir Ahmed',
        phone: '01912345678',
        age: '28y',
        sex: 'M',
        status: 'waiting',
        time_in: '05:45 PM',
      },
    ],
    activeTokenId: 1,

    // Modals & Drawers
    isHistoryDrawerOpen: false,
    isTemplatesDrawerOpen: false,
    isPrintStudioOpen: false,

    updatePatient: (patch) => {
      set((state) => ({ ...state, ...patch }));
    },

    selectExistingPatient: (patient) => {
      set({
        patientId: patient.id,
        name: patient.name,
        ageYears: patient.age_years,
        ageMonths: patient.age_months,
        sex: patient.sex,
        phone: patient.phone || '',
        address: patient.address || '',
      });
    },

    updateClinical: (patch) => {
      set((state) => ({ ...state, ...patch }));
    },

    addItem: (item) => {
      set((state) => ({
        items: [
          ...state.items,
          {
            ...item,
            position: state.items.length + 1,
          },
        ],
      }));
    },

    updateItem: (index, patch) => {
      set((state) => {
        const newItems = [...state.items];
        if (newItems[index]) {
          newItems[index] = { ...newItems[index], ...patch };
        }
        return { items: newItems };
      });
    },

    removeItem: (index) => {
      set((state) => {
        const filtered = state.items.filter((_, i) => i !== index);
        const reindexed = filtered.map((it, idx) => ({
          ...it,
          position: idx + 1,
        }));
        return { items: reindexed };
      });
    },

    applySiblingSwap: (index, sibling) => {
      set((state) => {
        const newItems = [...state.items];
        const existing = newItems[index];
        if (existing) {
          newItems[index] = {
            ...existing,
            brand_id: sibling.id,
            free_text_name: sibling.brand_name,
            strength_snapshot: sibling.strength,
            form_snapshot: sibling.dosage_form,
            generic_snapshot: sibling.generic_name,
          };
        }
        return { items: newItems };
      });
    },

    applyTemplate: (template, appendMedicines = false) => {
      set((state) => {
        const newItems = template.items.map((it, idx) => ({
          position: (appendMedicines ? state.items.length : 0) + idx + 1,
          brand_id: null,
          free_text_name: it.free_text_name,
          form_snapshot: it.form_snapshot || null,
          strength_snapshot: it.strength_snapshot || null,
          generic_snapshot: it.generic_snapshot || null,
          dose: it.dose,
          meal_timing: it.meal_timing,
          duration: it.duration,
          note: it.note || null,
        }));

        return {
          chiefComplaints: template.chief_complaints || state.chiefComplaints,
          onExamination: template.on_examination || state.onExamination,
          diagnosis: template.diagnosis || state.diagnosis,
          investigations: template.investigations || state.investigations,
          advice: template.advice || state.advice,
          followUp: template.follow_up || state.followUp,
          items: appendMedicines ? [...state.items, ...newItems] : newItems,
          isTemplatesDrawerOpen: false,
          saveSuccessMsg: `Applied template: ${template.name}`,
        };
      });
    },

    repeatPreviousPrescription: (prev) => {
      set((state) => ({
        chiefComplaints: prev.chief_complaints || state.chiefComplaints,
        onExamination: prev.on_examination || state.onExamination,
        diagnosis: prev.diagnosis || state.diagnosis,
        investigations: prev.investigations || state.investigations,
        advice: prev.advice || state.advice,
        followUp: prev.follow_up || state.followUp,
        weightKg: prev.weight_kg ?? state.weightKg,
        items: (prev.items || []).map((it, idx) => ({
          ...it,
          position: idx + 1,
        })),
        isHistoryDrawerOpen: false,
        saveSuccessMsg: 'Loaded previous prescription medications and notes!',
      }));
    },

    callNextToken: () => {
      const state = get();
      const tokens = [...state.tokens];
      const activeIdx = tokens.findIndex((t) => t.id === state.activeTokenId);
      if (activeIdx !== -1 && tokens[activeIdx]) {
        tokens[activeIdx] = { ...tokens[activeIdx], status: 'completed' };
      }

      const nextWaiting = tokens.find((t) => t.status === 'waiting');
      if (nextWaiting) {
        nextWaiting.status = 'in_consultation';
        set({
          tokens,
          activeTokenId: nextWaiting.id,
          name: nextWaiting.patient_name,
          phone: nextWaiting.phone || '',
          sex: nextWaiting.sex || null,
        });
      } else {
        set({ tokens });
      }
    },

    selectToken: (tokenId) => {
      const state = get();
      const target = state.tokens.find((t) => t.id === tokenId);
      if (!target) return;

      const updated = state.tokens.map((t) => ({
        ...t,
        status:
          t.id === tokenId
            ? ('in_consultation' as const)
            : t.status === 'in_consultation'
              ? ('waiting' as const)
              : t.status,
      }));

      set({
        tokens: updated,
        activeTokenId: tokenId,
        name: target.patient_name,
        phone: target.phone || '',
        sex: target.sex || null,
      });
    },

    setHistoryDrawerOpen: (isOpen) => set({ isHistoryDrawerOpen: isOpen }),
    setTemplatesDrawerOpen: (isOpen) => set({ isTemplatesDrawerOpen: isOpen }),
    setPrintStudioOpen: (isOpen) => set({ isPrintStudioOpen: isOpen }),

    clearPrescription: () => {
      set({
        ...initialPatientState,
        ...initialClinicalState,
        visitDate: getTodayString(),
        items: [],
        saveSuccessMsg: null,
      });
    },

    setSaveSuccessMsg: (msg) => {
      set({ saveSuccessMsg: msg });
    },

    loadDraft: async () => {
      const api = typeof window !== 'undefined' ? window.api : undefined;
      if (!api?.loadDraft) return;
      try {
        const draft = await api.loadDraft();
        if (!draft) return;

        set({
          patientId: null,
          name: draft.patient.name || '',
          ageYears: draft.patient.age_years ?? null,
          ageMonths: draft.patient.age_months ?? null,
          sex: draft.patient.sex ?? null,
          phone: draft.patient.phone || '',
          address: draft.patient.address || '',
          weightKg: draft.prescription.weight_kg ?? null,
          visitDate: draft.prescription.visit_date || getTodayString(),
          chiefComplaints: draft.prescription.chief_complaints || '',
          onExamination: draft.prescription.on_examination || '',
          diagnosis: draft.prescription.diagnosis || '',
          investigations: draft.prescription.investigations || '',
          advice: draft.prescription.advice || '',
          followUp: draft.prescription.follow_up || '',
          items: draft.prescription.items || [],
          lastSavedAt: draft.saved_at,
        });
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    },

    saveDraft: async () => {
      const api = typeof window !== 'undefined' ? window.api : undefined;
      if (!api?.saveDraft) return;
      const state = get();
      // Don't save empty drafts
      if (
        !state.name.trim() &&
        state.items.length === 0 &&
        !state.chiefComplaints.trim()
      ) {
        return;
      }

      set({ isSavingDraft: true });
      try {
        const draft: DraftData = {
          patient: {
            name: state.name.trim(),
            age_years: state.ageYears,
            age_months: state.ageMonths,
            sex: state.sex,
            phone: state.phone.trim() || null,
            address: state.address.trim() || null,
          },
          prescription: {
            visit_date: state.visitDate,
            weight_kg: state.weightKg,
            chief_complaints: state.chiefComplaints.trim() || null,
            on_examination: state.onExamination.trim() || null,
            diagnosis: state.diagnosis.trim() || null,
            investigations: state.investigations.trim() || null,
            advice: state.advice.trim() || null,
            follow_up: state.followUp.trim() || null,
            items: state.items,
          },
          saved_at: new Date().toISOString(),
        };

        await api.saveDraft(draft);
        set({
          lastSavedAt: draft.saved_at,
          isSavingDraft: false,
        });
      } catch (err) {
        console.error('Failed to save draft:', err);
        set({ isSavingDraft: false });
      }
    },

    finalizePrescription: async () => {
      const state = get();
      if (!state.name.trim()) {
        return { success: false, error: 'Patient name is required' };
      }
      if (state.items.length === 0) {
        return {
          success: false,
          error: 'At least one prescription medicine is required',
        };
      }

      const api = typeof window !== 'undefined' ? window.api : undefined;
      if (!api?.createPrescription || !api?.finalizePrescription) {
        return { success: false, error: 'Database service not available' };
      }

      try {
        let patientId = state.patientId;
        if (!patientId) {
          const createdPatient = await api.createPatient({
            name: state.name.trim(),
            age_years: state.ageYears,
            age_months: state.ageMonths,
            sex: state.sex,
            phone: state.phone.trim() || null,
            address: state.address.trim() || null,
          });
          patientId = createdPatient.id;
        }

        const createdRx = await api.createPrescription({
          patient_id: patientId,
          visit_date: state.visitDate,
          weight_kg: state.weightKg,
          chief_complaints: state.chiefComplaints.trim() || null,
          on_examination: state.onExamination.trim() || null,
          diagnosis: state.diagnosis.trim() || null,
          investigations: state.investigations.trim() || null,
          advice: state.advice.trim() || null,
          follow_up: state.followUp.trim() || null,
          items: state.items,
        });

        await api.finalizePrescription(createdRx.id);

        if (api.clearDraft) {
          await api.clearDraft();
        }

        get().clearPrescription();
        set({
          saveSuccessMsg: `Prescription #${createdRx.id} finalized and saved successfully!`,
        });

        return { success: true, prescriptionId: createdRx.id };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to finalize prescription';
        return { success: false, error: message };
      }
    },
  }),
);
