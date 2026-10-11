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
});
