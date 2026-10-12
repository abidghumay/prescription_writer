import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePrescriptionStore } from '../src/store/usePrescriptionStore';

describe('usePrescriptionStore', () => {
  beforeEach(() => {
    usePrescriptionStore.getState().clearPrescription();
  });

  it('updates patient details properly', () => {
    const store = usePrescriptionStore.getState();
    store.updatePatient({
      name: 'John Doe',
      ageYears: 35,
      sex: 'M',
      phone: '01711111111',
    });

    const state = usePrescriptionStore.getState();
    expect(state.name).toBe('John Doe');
    expect(state.ageYears).toBe(35);
    expect(state.sex).toBe('M');
    expect(state.phone).toBe('01711111111');
  });

  it('adds, updates, and removes prescription items with reindexing', () => {
    const store = usePrescriptionStore.getState();

    store.addItem({
      brand_id: 1,
      free_text_name: 'Napa',
      strength_snapshot: '500 mg',
      form_snapshot: 'Tablet',
      generic_snapshot: 'Paracetamol',
      dose: '1+0+1',
      meal_timing: 'After meal',
      duration: '5 days',
      note: null,
    });

    store.addItem({
      brand_id: 2,
      free_text_name: 'Seclo',
      strength_snapshot: '20 mg',
      form_snapshot: 'Capsule',
      generic_snapshot: 'Omeprazole',
      dose: '1+0+1',
      meal_timing: 'Before meal',
      duration: '7 days',
      note: null,
    });

    let state = usePrescriptionStore.getState();
    expect(state.items).toHaveLength(2);
    expect(state.items[0].position).toBe(1);
    expect(state.items[1].position).toBe(2);

    // Update first item dose
    store.updateItem(0, { dose: '1+1+1' });
    state = usePrescriptionStore.getState();
    expect(state.items[0].dose).toBe('1+1+1');

    // Remove first item
    store.removeItem(0);
    state = usePrescriptionStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].free_text_name).toBe('Seclo');
    expect(state.items[0].position).toBe(1);
  });

  it('updates clinical notes', () => {
    const store = usePrescriptionStore.getState();
    store.updateClinical({
      chiefComplaints: 'Fever for 3 days',
      diagnosis: 'Viral Fever',
      followUp: 'After 7 days',
    });

    const state = usePrescriptionStore.getState();
    expect(state.chiefComplaints).toBe('Fever for 3 days');
    expect(state.diagnosis).toBe('Viral Fever');
    expect(state.followUp).toBe('After 7 days');
  });

  it('prevents finalizing when patient name or items are empty', async () => {
    const store = usePrescriptionStore.getState();
    const resultNoName = await store.finalizePrescription();
    expect(resultNoName.success).toBe(false);
    expect(resultNoName.error).toContain('Patient name is required');

    store.updatePatient({ name: 'Jane' });
    const resultNoItems = await store.finalizePrescription();
    expect(resultNoItems.success).toBe(false);
    expect(resultNoItems.error).toContain('medicine is required');

    // Phone validation
    store.updatePatient({ phone: '12345' });
    const resultInvalidPhone = await store.finalizePrescription();
    expect(resultInvalidPhone.success).toBe(false);
    expect(resultInvalidPhone.error).toContain(
      'valid 11-digit Bangladeshi mobile number',
    );
    store.updatePatient({ phone: '01711223344' });

    // Age validation
    store.updatePatient({ ageYears: -5 });
    const resultNegativeAge = await store.finalizePrescription();
    expect(resultNegativeAge.success).toBe(false);
    expect(resultNegativeAge.error).toContain('Age cannot be negative');
    store.updatePatient({ ageYears: 25 });

    // Weight validation
    store.updatePatient({ weightKg: 0 });
    const resultZeroWeight = await store.finalizePrescription();
    expect(resultZeroWeight.success).toBe(false);
    expect(resultZeroWeight.error).toContain(
      'Weight must be greater than 0 kg',
    );
    store.updatePatient({ weightKg: 60 });
  });

  it('successfully creates patient and prescription via window.api', async () => {
    const mockCreatePatient = vi
      .fn()
      .mockResolvedValue({ id: 101, name: 'Jane' });
    const mockCreatePrescription = vi.fn().mockResolvedValue({ id: 202 });
    const mockFinalizePrescription = vi.fn().mockResolvedValue(true);
    const mockClearDraft = vi.fn().mockResolvedValue(true);

    (globalThis as unknown as { window: { api: unknown } }).window = {
      api: {
        createPatient: mockCreatePatient,
        createPrescription: mockCreatePrescription,
        finalizePrescription: mockFinalizePrescription,
        clearDraft: mockClearDraft,
      },
    };

    const store = usePrescriptionStore.getState();
    store.updatePatient({ name: 'Jane Doe', ageYears: 28, sex: 'F' });
    store.addItem({
      brand_id: 1,
      free_text_name: 'Napa',
      strength_snapshot: '500 mg',
      form_snapshot: 'Tablet',
      generic_snapshot: 'Paracetamol',
      dose: '1+0+1',
      meal_timing: 'After meal',
      duration: '3 days',
      note: null,
    });

    const result = await store.finalizePrescription();
    expect(result.success).toBe(true);
    expect(result.prescriptionId).toBe(202);
    expect(mockCreatePatient).toHaveBeenCalled();
    expect(mockCreatePrescription).toHaveBeenCalledWith(
      expect.objectContaining({ patient_id: 101 }),
    );
    expect(mockFinalizePrescription).toHaveBeenCalledWith(202);
    expect(mockClearDraft).toHaveBeenCalled();
  });

  it('applies clinical template properly in 1-click', () => {
    const store = usePrescriptionStore.getState();
    store.applyTemplate({
      id: 'fever_test',
      name: 'Fever URTI',
      category: 'General',
      description: 'Test template',
      chief_complaints: 'High fever for 3 days',
      on_examination: 'Temp 101F',
      diagnosis: 'Acute URTI',
      investigations: 'CBC',
      advice: 'Drink warm water',
      follow_up: 'After 3 days',
      items: [
        {
          free_text_name: 'Napa',
          form_snapshot: 'Tablet',
          strength_snapshot: '500 mg',
          generic_snapshot: 'Paracetamol',
          dose: '1+1+1',
          meal_timing: 'After meal',
          duration: '3 days',
        },
      ],
    });

    const state = usePrescriptionStore.getState();
    expect(state.chiefComplaints).toBe('High fever for 3 days');
    expect(state.diagnosis).toBe('Acute URTI');
    expect(state.advice).toBe('Drink warm water');
    expect(state.items).toHaveLength(1);
    expect(state.items[0].free_text_name).toBe('Napa');
    expect(state.items[0].dose).toBe('1+1+1');
  });

  it('swaps brand alternative while preserving dosage and instructions', () => {
    const store = usePrescriptionStore.getState();
    store.addItem({
      brand_id: 10,
      free_text_name: 'Napa',
      strength_snapshot: '500 mg',
      form_snapshot: 'Tablet',
      generic_snapshot: 'Paracetamol',
      dose: '1+0+1',
      meal_timing: 'After meal',
      duration: '5 days',
      note: 'If fever > 101F',
    });

    // Swap Napa with Ace (same generic)
    store.applySiblingSwap(0, {
      id: 20,
      brand_name: 'Ace',
      generic_name: 'Paracetamol',
      generic_id: 1,
      manufacturer_name: 'Square Pharmaceuticals Ltd.',
      strength: '500 mg',
      dosage_form: 'Tablet',
      is_custom: false,
      use_count: 5,
      score: 10,
    });

    const state = usePrescriptionStore.getState();
    expect(state.items[0].brand_id).toBe(20);
    expect(state.items[0].free_text_name).toBe('Ace');
    expect(state.items[0].dose).toBe('1+0+1'); // preserved
    expect(state.items[0].duration).toBe('5 days'); // preserved
    expect(state.items[0].meal_timing).toBe('After meal'); // preserved
    expect(state.items[0].note).toBe('If fever > 101F'); // preserved
  });

  it('calls next token in chamber queue and updates patient name', () => {
    usePrescriptionStore.setState({
      tokens: [
        {
          id: 1,
          token_number: 1,
          patient_name: 'Patient One',
          phone: '01711111111',
          age: '30y',
          status: 'in_consultation',
          time_in: '10:00 AM',
        },
        {
          id: 2,
          token_number: 2,
          patient_name: 'Patient Two',
          phone: '01722222222',
          age: '25y',
          status: 'waiting',
          time_in: '10:15 AM',
        },
      ],
      activeTokenId: 1,
    });

    const store = usePrescriptionStore.getState();
    expect(store.tokens[0].status).toBe('in_consultation');
    expect(store.tokens[1].status).toBe('waiting');

    store.callNextToken();
    const state = usePrescriptionStore.getState();
    expect(state.tokens[0].status).toBe('completed');
    expect(state.tokens[1].status).toBe('in_consultation');
    expect(state.name).toBe(state.tokens[1].patient_name);
  });

  it('selects existing patient and populates store with patientId', () => {
    const store = usePrescriptionStore.getState();
    store.selectExistingPatient({
      id: 42,
      name: 'Mohammad Rahim',
      age_years: 45,
      age_months: 6,
      sex: 'M',
      phone: '01712345678',
      address: 'Dhaka, Bangladesh',
      created_at: '2026-10-10T10:00:00Z',
    });

    const state = usePrescriptionStore.getState();
    expect(state.patientId).toBe(42);
    expect(state.name).toBe('Mohammad Rahim');
    expect(state.ageYears).toBe(45);
    expect(state.ageMonths).toBe(6);
    expect(state.sex).toBe('M');
    expect(state.phone).toBe('01712345678');
    expect(state.address).toBe('Dhaka, Bangladesh');
  });

  it('toggles history drawer open state', () => {
    const store = usePrescriptionStore.getState();
    expect(store.isHistoryDrawerOpen).toBe(false);

    store.setHistoryDrawerOpen(true);
    expect(usePrescriptionStore.getState().isHistoryDrawerOpen).toBe(true);

    store.setHistoryDrawerOpen(false);
    expect(usePrescriptionStore.getState().isHistoryDrawerOpen).toBe(false);
  });

  it('clearPrescription resets patientId, items, and clinical notes', () => {
    const store = usePrescriptionStore.getState();
    store.selectExistingPatient({
      id: 99,
      name: 'Test Patient',
      age_years: 20,
      age_months: 0,
      sex: 'F',
      phone: '01812345678',
      address: 'Chittagong',
      created_at: '2026-10-10T10:00:00Z',
    });
    store.addItem({
      brand_id: null,
      free_text_name: 'Paracetamol',
      strength_snapshot: null,
      form_snapshot: null,
      generic_snapshot: null,
      dose: '1+0+1',
      meal_timing: null,
      duration: null,
      note: null,
    });
    store.updateClinical({ diagnosis: 'Fever' });

    store.clearPrescription();
    const state = usePrescriptionStore.getState();
    expect(state.patientId).toBeNull();
    expect(state.name).toBe('');
    expect(state.items).toHaveLength(0);
    expect(state.diagnosis).toBe('');
  });
});
