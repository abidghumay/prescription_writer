import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User,
  Building,
  Printer,
  ShieldCheck,
  CheckCircle,
  Save,
  RotateCcw,
} from 'lucide-react';
import type { LayoutContextType } from '../components/Layout';
import type { AppSettings } from '../shared/types';

const SPECIALTY_OPTIONS = [
  'General Physician',
  'Pediatrician / Child Specialist',
  'Internal Medicine Specialist',
  'Cardiologist',
  'Gynecologist & Obstetrician',
  'Orthopedic Surgeon',
  'Dermatologist',
  'ENT Specialist',
  'Ophthalmologist',
];

export default function SettingsPage() {
  const context = useOutletContext<LayoutContextType | null>();
  const settings = context?.settings;

  const [doctorName, setDoctorName] = useState('');
  const [degrees, setDegrees] = useState('');
  const [bmdcReg, setBmdcReg] = useState('');
  const [specialty, setSpecialty] = useState('General Physician');

  const [chamberName, setChamberName] = useState('');
  const [chamberAddress, setChamberAddress] = useState('');
  const [chamberHours, setChamberHours] = useState('');
  const [chamberPhone, setChamberPhone] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [printHeaderMode, setPrintHeaderMode] = useState<'full' | 'pad_space'>(
    'full',
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setDoctorName(settings.doctorName || '');
      setDegrees(settings.degrees || '');
      setBmdcReg(settings.bmdcReg || '');
      setSpecialty(settings.specialty || 'General Physician');
      setChamberName(settings.chamberName || '');
      setChamberAddress(settings.chamberAddress || '');
      setChamberHours(settings.chamberHours || '');
      setChamberPhone(settings.chamberPhone || '');
      setConsultationFee(
        settings.consultationFee ? String(settings.consultationFee) : '',
      );
      setPrintHeaderMode(settings.printHeaderMode || 'full');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const updated: AppSettings = {
      isOnboarded: true,
      doctorName: doctorName.trim(),
      degrees: degrees.trim(),
      bmdcReg: bmdcReg.trim(),
      specialty: specialty.trim() || 'General Physician',
      chamberName: chamberName.trim(),
      chamberAddress: chamberAddress.trim(),
      chamberHours: chamberHours.trim(),
      chamberPhone: chamberPhone.trim(),
      consultationFee: consultationFee ? Number(consultationFee) : null,
      printHeaderMode,
    };

    try {
      if (context?.updateSettings) {
        await context.updateSettings(updated);
      } else if (window.api?.saveSettingsToDB) {
        await window.api.saveSettingsToDB(updated);
        await window.api.saveSettings(updated);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToCurrent = () => {
    if (settings) {
      setDoctorName(settings.doctorName || '');
      setDegrees(settings.degrees || '');
      setBmdcReg(settings.bmdcReg || '');
      setSpecialty(settings.specialty || 'General Physician');
      setChamberName(settings.chamberName || '');
      setChamberAddress(settings.chamberAddress || '');
      setChamberHours(settings.chamberHours || '');
      setChamberPhone(settings.chamberPhone || '');
      setConsultationFee(
        settings.consultationFee ? String(settings.consultationFee) : '',
      );
      setPrintHeaderMode(settings.printHeaderMode || 'full');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title & Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Doctor Profile & Chamber Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your credentials, clinic information, and prescription header
            preferences.
          </p>
        </div>

        {/* Offline Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Local Account Active</span>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>
            Doctor profile saved successfully! All prescriptions will now use
            these credentials.
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Doctor Credentials */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800">
            <User className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Doctor Credentials
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Doctor Full Name *
              </label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Md. Rafiqul Islam"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
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
                placeholder="e.g. MBBS, FCPS (Pediatrics), DCH"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
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
                placeholder="e.g. A-12345"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specialty / Department
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Consultant Pediatrician"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {SPECIALTY_OPTIONS.slice(0, 4).map((s) => (
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

        {/* Card 2: Chamber Information */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800">
            <Building className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Chamber / Practice Location
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chamber / Clinic Name
              </label>
              <input
                type="text"
                value={chamberName}
                onChange={(e) => setChamberName(e.target.value)}
                placeholder="e.g. Popular Diagnostic Centre"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address & Room Number
              </label>
              <input
                type="text"
                value={chamberAddress}
                onChange={(e) => setChamberAddress(e.target.value)}
                placeholder="e.g. Room 402, Dhanmondi, Dhaka"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
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
                placeholder="e.g. 5:00 PM - 9:00 PM (Everyday except Friday)"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chamber Phone / Hotline
              </label>
              <input
                type="text"
                value={chamberPhone}
                onChange={(e) => setChamberPhone(e.target.value)}
                placeholder="e.g. +880 1711-000000"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Standard Consultation Fee (BDT)
              </label>
              <input
                type="number"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Prescription Printing Preference */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800">
            <Printer className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Prescription Print Style
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setPrintHeaderMode('full')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                printHeaderMode === 'full'
                  ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-800">
                  Full Header on Blank Paper
                </span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    printHeaderMode === 'full'
                      ? 'border-teal-600 bg-teal-600'
                      : 'border-slate-300'
                  }`}
                >
                  {printHeaderMode === 'full' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Prints the complete doctor credentials and chamber details at
                the top of blank A4/A5 sheets.
              </p>
            </div>

            <div
              onClick={() => setPrintHeaderMode('pad_space')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                printHeaderMode === 'pad_space'
                  ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-800">
                  Leave Space for Pre-printed Pad
                </span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    printHeaderMode === 'pad_space'
                      ? 'border-teal-600 bg-teal-600'
                      : 'border-slate-300'
                  }`}
                >
                  {printHeaderMode === 'pad_space' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Leaves top margin blank for doctors with custom embossed
                letterhead pads.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Local Database Architecture Info */}
        <div className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">
              Offline-First Account Security
            </p>
            <p className="mt-0.5 text-slate-500">
              All credentials and patient consultations are stored directly in
              your local SQLite file (
              <code className="font-mono text-slate-700 bg-white px-1 py-0.5 rounded border border-slate-200">
                data/prescription_writer.sqlite
              </code>
              ). Your patient data is never transmitted to any third-party
              cloud.
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetToCurrent}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Changes</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
