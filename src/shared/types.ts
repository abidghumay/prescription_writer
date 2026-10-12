import { z } from 'zod';

export const AppSettingsSchema = z.object({
  isOnboarded: z.boolean().default(false),
  doctorName: z.string().default(''),
  degrees: z.string().default(''),
  bmdcReg: z.string().default(''),
  specialty: z.string().default('General Physician'),
  chamberName: z.string().default(''),
  chamberAddress: z.string().default(''),
  chamberHours: z.string().default(''),
  chamberPhone: z.string().default(''),
  consultationFee: z.number().nullable().default(null),
  printHeaderMode: z.enum(['full', 'pad_space']).default('full'),
  padHeaderMarginMm: z.number().min(10).max(150).default(65),
  padFooterMarginMm: z.number().min(0).max(100).default(30),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  isOnboarded: false,
  doctorName: '',
  degrees: '',
  bmdcReg: '',
  specialty: 'General Physician',
  chamberName: '',
  chamberAddress: '',
  chamberHours: '',
  chamberPhone: '',
  consultationFee: null,
  printHeaderMode: 'full',
  padHeaderMarginMm: 65,
  padFooterMarginMm: 30,
};

export interface BrandSearchResult {
  id: number;
  brand_name: string;
  generic_name: string;
  generic_id: number;
  manufacturer_name: string;
  strength: string;
  dosage_form: string;
  route?: string | null;
  pack_price_bdt?: number | null;
  is_custom: boolean;
  use_count: number;
  score: number;
}

export interface DrugSearchResponse {
  query: string;
  duration_ms: number;
  matches: BrandSearchResult[];
  siblings: {
    generic_name: string;
    strength: string;
    items: BrandSearchResult[];
  } | null;
}

export interface CustomDrugInput {
  brand_name: string;
  generic_name: string;
  manufacturer_name?: string;
  strength?: string;
  dosage_form?: string;
}

export interface DatabaseStats {
  totalBrands: number;
  totalGenerics: number;
  totalManufacturers: number;
  source: string;
  version: string;
}

// Patient types
export interface Patient {
  id: number;
  name: string;
  age_years: number | null;
  age_months: number | null;
  sex: 'M' | 'F' | 'O' | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface PatientInput {
  name: string;
  age_years?: number | null;
  age_months?: number | null;
  sex?: 'M' | 'F' | 'O' | null;
  phone?: string | null;
  address?: string | null;
}

// Prescription types
export interface PrescriptionItem {
  id?: number;
  position: number;
  brand_id: number | null;
  free_text_name: string | null;
  strength_snapshot: string | null;
  form_snapshot: string | null;
  generic_snapshot: string | null;
  dose: string;
  meal_timing: string | null;
  duration: string | null;
  note: string | null;
}

export interface Prescription {
  id: number;
  patient_id: number;
  visit_date: string;
  weight_kg: number | null;
  chief_complaints: string | null;
  on_examination: string | null;
  diagnosis: string | null;
  investigations: string | null;
  advice: string | null;
  follow_up: string | null;
  status: 'draft' | 'final';
  created_at: string;
  finalized_at: string | null;
  items: PrescriptionItem[];
}

export interface PrescriptionInput {
  patient_id: number;
  visit_date: string;
  weight_kg?: number | null;
  chief_complaints?: string | null;
  on_examination?: string | null;
  diagnosis?: string | null;
  investigations?: string | null;
  advice?: string | null;
  follow_up?: string | null;
  items: PrescriptionItem[];
}

export interface DraftData {
  patient: PatientInput;
  prescription: Omit<PrescriptionInput, 'patient_id'>;
  saved_at: string;
}

export interface PastPrescriptionRecord extends Prescription {
  patient_name: string;
  patient_phone: string | null;
  patient_age_years: number | null;
  patient_sex: 'M' | 'F' | 'O' | null;
}

export interface IpcApi {
  ping: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<boolean>;
  searchDrugs: (query: string) => Promise<DrugSearchResponse>;
  addCustomDrug: (drug: CustomDrugInput) => Promise<boolean>;
  getDatabaseStats: () => Promise<DatabaseStats>;

  // Patient IPC
  createPatient: (patient: PatientInput) => Promise<Patient>;
  searchPatients: (query: string) => Promise<Patient[]>;
  getPatient: (id: number) => Promise<Patient | null>;

  // Prescription IPC
  createPrescription: (input: PrescriptionInput) => Promise<Prescription>;
  finalizePrescription: (id: number) => Promise<boolean>;
  getPrescription: (id: number) => Promise<Prescription | null>;
  getPatientPrescriptions: (patientId: number) => Promise<Prescription[]>;
  getAllPrescriptions: (
    searchQuery?: string,
    patientId?: number,
  ) => Promise<PastPrescriptionRecord[]>;
  deletePrescription: (id: number) => Promise<boolean>;

  // Draft IPC
  saveDraft: (draft: DraftData) => Promise<boolean>;
  loadDraft: () => Promise<DraftData | null>;
  clearDraft: () => Promise<boolean>;

  // Settings persistence (upgrade from in-memory)
  saveSettingsToDB: (settings: AppSettings) => Promise<boolean>;
  loadSettingsFromDB: () => Promise<AppSettings>;

  // Print & PDF IPC
  printToPdf: (options: {
    paperSize: 'a4' | 'a5';
    suggestedFileName: string;
  }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  printSilent: (options: {
    paperSize: 'a4' | 'a5';
  }) => Promise<{ success: boolean; error?: string }>;

  // Print Profile IPC
  getPrintProfiles: () => Promise<PrintProfile[]>;
  savePrintProfile: (
    profile: PrintProfileInput & { id?: number },
  ) => Promise<PrintProfile>;
  deletePrintProfile: (id: number) => Promise<boolean>;
  setDefaultPrintProfile: (id: number) => Promise<boolean>;
}

// Clinical Templates, Queue, & Printing
export interface PrescriptionTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  chief_complaints?: string;
  on_examination?: string;
  diagnosis: string;
  investigations?: string;
  advice?: string;
  follow_up?: string;
  items: Array<{
    free_text_name: string;
    form_snapshot?: string;
    strength_snapshot?: string;
    generic_snapshot?: string;
    dose: string;
    meal_timing: string;
    duration: string;
    note?: string;
  }>;
}

export interface ChamberToken {
  id: number;
  token_number: number;
  patient_name: string;
  phone?: string;
  age?: string;
  sex?: 'M' | 'F' | 'O';
  status: 'waiting' | 'in_consultation' | 'completed';
  time_in: string;
}

export interface PrintSectionVisibility {
  chiefComplaints: boolean;
  onExamination: boolean;
  diagnosis: boolean;
  investigations: boolean;
  advice: boolean;
  followUp: boolean;
  patientPhone: boolean;
  patientWeight: boolean;
  consultationFee: boolean;
}

export interface PrintFontSizes {
  patientName: number;
  medicineName: number;
  doseText: number;
  clinicalNotes: number;
  banglaDose: number;
  header: number;
}

export interface PrintConfig {
  mode: 'letterhead' | 'blank_pad';
  paperSize: 'a4' | 'a5';
  headerMarginMm: number;
  footerMarginMm: number;
  showBanglaDose: boolean;
  sections?: PrintSectionVisibility;
  fontSizes?: PrintFontSizes;
  logoPath?: string | null;
}

export interface PrintProfile {
  id: number;
  name: string;
  config: PrintConfig;
  is_default: boolean;
  created_at: string;
}

export interface PrintProfileInput {
  name: string;
  config: PrintConfig;
  is_default?: boolean;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
