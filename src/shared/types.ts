import { z } from 'zod';

export const AppSettingsSchema = z.object({
  doctorName: z.string().default('Dr. Sample Name'),
  degrees: z.string().default('MBBS (Sample)'),
  bmdcReg: z.string().default('BMDC Reg. No. 00000'),
  chamberName: z.string().default('Sample Chamber'),
  chamberAddress: z.string().default('Dhaka, Bangladesh'),
  chamberHours: z.string().default('5:00 PM - 9:00 PM'),
  chamberPhone: z.string().default('+880 1700-000000'),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

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

export interface IpcApi {
  ping: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<boolean>;
  searchDrugs: (query: string) => Promise<DrugSearchResponse>;
  addCustomDrug: (drug: CustomDrugInput) => Promise<boolean>;
  getDatabaseStats: () => Promise<DatabaseStats>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
