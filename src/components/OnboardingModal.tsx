import React, { useState } from 'react';
import {
  ShieldCheck,
  Stethoscope,
  Building,
  Printer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { AppSettings } from '../shared/types';

interface OnboardingModalProps {
  initialSettings?: Partial<AppSettings>;
  onComplete: (settings: AppSettings) => Promise<void> | void;
}

const SPECIALTY_SUGGESTIONS = [
  'General Physician',
  'Pediatrician / Child Specialist',
  'Internal Medicine Specialist',
  'Cardiologist',
  'Gynecologist & Obstetrician',
  'Orthopedic Surgeon',
  'Dermatologist',
];

export default function OnboardingModal({
  initialSettings,
  onComplete,
}: OnboardingModalProps) {
  const [doctorName, setDoctorName] = useState(
    initialSettings?.doctorName || '',
  );
  const [degrees, setDegrees] = useState(initialSettings?.degrees || '');
  const [bmdcReg, setBmdcReg] = useState(initialSettings?.bmdcReg || '');
  const [specialty, setSpecialty] = useState(
    initialSettings?.specialty || 'General Physician',
  );
  const [chamberName, setChamberName] = useState(
    initialSettings?.chamberName || '',
  );
  const [chamberAddress, setChamberAddress] = useState(
    initialSettings?.chamberAddress || '',
  );
  const [chamberHours, setChamberHours] = useState(
    initialSettings?.chamberHours || '5:00 PM - 9:00 PM',
  );
  const [chamberPhone, setChamberPhone] = useState(
    initialSettings?.chamberPhone || '',
  );
  const [consultationFee, setConsultationFee] = useState<string>(
    initialSettings?.consultationFee
      ? String(initialSettings.consultationFee)
      : '',
  );
  const [printHeaderMode, setPrintHeaderMode] = useState<'full' | 'pad_space'>(
    initialSettings?.printHeaderMode || 'full',
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!doctorName.trim()) {
      setError('Doctor name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalSettings: AppSettings = {
        isOnboarded: true,
        doctorName: doctorName.trim(),
        degrees: degrees.trim() || 'MBBS',
        bmdcReg: bmdcReg.trim() || 'BMDC Reg. Verified',
        specialty: specialty.trim() || 'General Physician',
        chamberName: chamberName.trim() || 'Chamber',
        chamberAddress: chamberAddress.trim() || 'Dhaka, Bangladesh',
        chamberHours: chamberHours.trim() || '5:00 PM - 9:00 PM',
        chamberPhone: chamberPhone.trim(),
        consultationFee: consultationFee ? Number(consultationFee) : null,
        printHeaderMode,
      };

      await onComplete(finalSettings);
    } catch (err) {
      setError('Failed to save profile. Please check the inputs.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-6 relative overflow-hidden">
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300 shadow-inner">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-teal-500/30 text-teal-200 px-2.5 py-0.5 rounded-full border border-teal-400/30">
                  First-Time Setup
                </span>
                <span className="text-[11px] text-teal-200/80 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                  100% Offline & Private
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1 tracking-tight text-white">
                Set Up Your Doctor Profile
              </h2>
              <p className="text-xs text-teal-100/90 mt-1 max-w-lg leading-relaxed">
                Your profile is stored in the local SQLite database on this PC.
                These credentials will automatically auto-fill your prescription
                headers and printouts.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-5 flex-1"
        >
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
              {error}
            </div>
          )}

          {/* Section 1: Doctor Credentials */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-slate-800">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Professional Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Md. Tariqul Islam"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Degrees & Qualifications *
                </label>
                <input
                  type="text"
                  required
                  value={degrees}
                  onChange={(e) => setDegrees(e.target.value)}
                  placeholder="e.g. MBBS, FCPS, DCH (Pediatrics)"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  BMDC Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={bmdcReg}
                  onChange={(e) => setBmdcReg(e.target.value)}
                  placeholder="e.g. A-45892"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specialty / Designation
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Consultant Pediatrician"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {SPECIALTY_SUGGESTIONS.slice(0, 4).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSpecialty(s)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Chamber Information */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-slate-800">
              <Building className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Chamber / Clinic Location
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chamber / Hospital Name
                </label>
                <input
                  type="text"
                  value={chamberName}
                  onChange={(e) => setChamberName(e.target.value)}
                  placeholder="e.g. Popular Diagnostic Centre"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chamber Address & Room
                </label>
                <input
                  type="text"
                  value={chamberAddress}
                  onChange={(e) => setChamberAddress(e.target.value)}
                  placeholder="e.g. Room 304, Dhanmondi, Dhaka"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Visiting Hours
                </label>
                <input
                  type="text"
                  value={chamberHours}
                  onChange={(e) => setChamberHours(e.target.value)}
                  placeholder="e.g. 5:00 PM - 9:00 PM (Fri closed)"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chamber Hotline / Phone
                </label>
                <input
                  type="text"
                  value={chamberPhone}
                  onChange={(e) => setChamberPhone(e.target.value)}
                  placeholder="e.g. +880 1711-000000"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consultation Fee (BDT - Optional)
                </label>
                <input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prescription Print Mode
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setPrintHeaderMode('full')}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-all text-left flex items-center gap-1.5 ${
                      printHeaderMode === 'full'
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Plain Paper</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintHeaderMode('pad_space')}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-all text-left flex items-center gap-1.5 ${
                      printHeaderMode === 'pad_space'
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Pre-printed Pad</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit Action */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              You can change these anytime in <strong>Settings</strong>
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>
                {isSubmitting ? 'Saving...' : 'Save & Start Prescribing'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
