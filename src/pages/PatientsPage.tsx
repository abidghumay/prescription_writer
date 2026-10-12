import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import PastPrescriptionsView from '../components/PastPrescriptionsView';
import PrintStudioModal from '../components/PrintStudioModal';
import { usePrescriptionStore } from '../store/usePrescriptionStore';
import type { PastPrescriptionRecord, AppSettings } from '../shared/types';
import type { LayoutContextType } from '../components/Layout';

const defaultSettings: AppSettings = {
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
};

export default function PatientsPage() {
  const navigate = useNavigate();
  const context = useOutletContext<LayoutContextType | null>();
  const settings = context?.settings ?? defaultSettings;

  const { setPrintStudioOpen, repeatPreviousPrescription, updatePatient } =
    usePrescriptionStore();

  const handlePrint = (rx: PastPrescriptionRecord) => {
    updatePatient({
      patientId: rx.patient_id,
      name: rx.patient_name,
      phone: rx.patient_phone || '',
      ageYears: rx.patient_age_years,
      sex: rx.patient_sex,
      weightKg: rx.weight_kg,
    });
    repeatPreviousPrescription(rx);
    setPrintStudioOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PastPrescriptionsView
        onRepeatPrescription={() => navigate('/')}
        onOpenPrintModal={handlePrint}
      />
      <PrintStudioModal settings={settings} />
    </div>
  );
}
