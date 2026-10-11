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
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">
            Doctor Profile & Chamber Settings
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Manage your credentials, clinic information, and prescription header
            preferences.
          </p>
        </div>

        {/* Offline Badge */}
        <div className="flex items-center gap-2 bg-gold-50 text-gold-700 border border-gold-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-gold-600" />
          <span>Local SQLite Active</span>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-3.5 bg-gold-50 border border-gold-300 rounded-xl text-gold-900 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-gold-600" />
          <span>
            Doctor profile saved successfully! All prescriptions will now use
            these credentials.
          </span>
        </div>
      )}

      {/* Live Letterhead Preview Studio Card */}
      <div className="bezel-card p-5 space-y-3 bg-white border border-beige-300">
        <div className="flex items-center justify-between pb-2 border-b border-beige-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5 text-gold-600" />
            Live Letterhead Preview (Auto-Sync)
          </span>
          <span className="text-[10px] text-ink-500 font-mono">
            Mode:{' '}
            {printHeaderMode === 'full'
              ? 'Full Letterhead'
              : 'Pre-printed Pad Margin'}
          </span>
        </div>

        <div className="bg-ivory-50 text-ink-900 rounded-xl p-4 shadow-inner border border-beige-200">
          {printHeaderMode === 'full' ? (
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-ink-950 tracking-tight">
                  {doctorName || 'Doctor Full Name'}
                </h3>
                <p className="text-xs text-gold-700 font-semibold mt-0.5">
                  {degrees || 'MBBS, FCPS'} &middot;{' '}
                  {bmdcReg || 'BMDC Reg. No.'}
                </p>
                <p className="text-[11px] text-ink-600 mt-0.5 font-medium">
                  {specialty || 'General Physician'}
                </p>
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-ink-900">
                  {chamberName || 'Chamber / Clinic Name'}
                </h4>
                <p className="text-[11px] text-ink-600 mt-0.5">
                  {chamberAddress || 'Chamber Address'}
                </p>
                <p className="text-[10px] text-ink-500 mt-0.5">
                  Visiting: {chamberHours || 'Visiting Hours'}
                </p>
                {chamberPhone && (
                  <p className="text-[10px] text-gold-700 font-mono font-bold mt-0.5">
                    Hotline: {chamberPhone}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center border-2 border-dashed border-beige-300 rounded-lg text-xs text-ink-400 font-medium">
              [Top 55mm reserved for pre-printed letterhead pad]
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Doctor Credentials */}
        <div className="bezel-card p-6 space-y-4 bg-white border border-beige-300">
          <div className="flex items-center gap-2 pb-2 border-b border-beige-200 text-ink-800">
            <User className="w-4 h-4 text-gold-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-700">
              Doctor Credentials
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                Doctor Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Md. Rafiqul Islam"
                className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 font-medium text-ink-900 placeholder-ink-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                Degrees & Qualifications{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={degrees}
                onChange={(e) => setDegrees(e.target.value)}
                placeholder="e.g. MBBS, FCPS (Pediatrics), DCH"
                className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 font-medium text-ink-900 placeholder-ink-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                BMDC Registration Number{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={bmdcReg}
                onChange={(e) => setBmdcReg(e.target.value)}
                placeholder="e.g. A-12345"
                className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 font-medium text-ink-900 placeholder-ink-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                Specialty / Department
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Consultant Pediatrician"
                className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 font-medium text-ink-900 placeholder-ink-400 transition-all"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SPECIALTY_OPTIONS.slice(0, 4).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSpecialty(s)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-beige-100 hover:bg-gold-50 hover:text-gold-700 text-ink-600 border border-beige-200 hover:border-gold-300 transition-all cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Chamber Information */}
        <div className="bezel-card p-6 space-y-4 bg-white border border-beige-300">
          <div className="flex items-center gap-2 pb-2 border-b border-beige-200 text-ink-800">
            <Building className="w-4 h-4 text-gold-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-700">
              Chamber / Practice Location
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                Chamber / Clinic Name
              </label>
              <input
                type="text"
                value={chamberName}
                onChange={(e) => setChamberName(e.target.value)}
                placeholder="e.g. Popular Diagnostic Centre"
                className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 font-medium text-ink-900 placeholder-ink-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                Address & Room Number
              </label>
              <input
                type="text"
                value={chamberAddress}
                onChange={(e) => setChamberAddress(e.target.value)}
                placeholder="e.g. Room 402, Dhanmondi, Dhaka"
                className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 font-medium text-ink-900 placeholder-ink-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                Visiting Hours
              </label>
              <input
                type="text"
                value={chamberHours}
                onChange={(e) => setChamberHours(e.target.value)}
                placeholder="e.g. 5:00 PM - 9:00 PM (Everyday except Friday)"
                className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 font-medium text-ink-900 placeholder-ink-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                Chamber Phone / Hotline
              </label>
              <input
                type="text"
                value={chamberPhone}
                onChange={(e) => setChamberPhone(e.target.value)}
                placeholder="e.g. +880 1711-000000"
                className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 font-medium text-ink-900 placeholder-ink-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                Standard Consultation Fee (BDT)
              </label>
              <input
                type="number"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 font-medium text-ink-900 placeholder-ink-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Prescription Printing Preference */}
        <div className="bezel-card p-6 space-y-4 bg-white border border-beige-300">
          <div className="flex items-center gap-2 pb-2 border-b border-beige-200 text-ink-800">
            <Printer className="w-4 h-4 text-gold-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-700">
              Prescription Print Style
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setPrintHeaderMode('full')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                printHeaderMode === 'full'
                  ? 'border-gold-400 bg-gold-50/70 shadow-xs text-ink-900'
                  : 'border-beige-300 hover:border-beige-400 bg-white text-ink-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-ink-900">
                  Full Header on Blank Paper
                </span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    printHeaderMode === 'full'
                      ? 'border-gold-600 bg-gold-600'
                      : 'border-beige-400'
                  }`}
                >
                  {printHeaderMode === 'full' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <p className="text-xs text-ink-500 leading-relaxed">
                Prints the complete doctor credentials and chamber details at
                the top of blank A4/A5 sheets.
              </p>
            </div>

            <div
              onClick={() => setPrintHeaderMode('pad_space')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                printHeaderMode === 'pad_space'
                  ? 'border-gold-400 bg-gold-50/70 shadow-xs text-ink-900'
                  : 'border-beige-300 hover:border-beige-400 bg-white text-ink-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-ink-900">
                  Leave Space for Pre-printed Pad
                </span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    printHeaderMode === 'pad_space'
                      ? 'border-gold-600 bg-gold-600'
                      : 'border-beige-400'
                  }`}
                >
                  {printHeaderMode === 'pad_space' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <p className="text-xs text-ink-500 leading-relaxed">
                Leaves top margin blank for doctors with custom embossed
                letterhead pads.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Local Database Architecture Info */}
        <div className="bg-beige-50 border border-beige-200 rounded-xl p-4 flex items-start gap-3.5 text-xs text-ink-700">
          <ShieldCheck className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-ink-900">
              Offline-First Account Security
            </p>
            <p className="mt-0.5 text-ink-500 leading-relaxed">
              All credentials and patient consultations are stored directly in
              your local SQLite file (
              <code className="font-mono text-gold-800 bg-white px-1.5 py-0.5 rounded border border-beige-300">
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
            className="px-4 py-2 text-xs font-semibold text-ink-500 hover:text-ink-800 hover:bg-beige-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Changes</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 active:bg-gold-800 active:scale-[0.98] text-white font-semibold text-sm shadow-xs border border-gold-500 flex items-center gap-2 transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
