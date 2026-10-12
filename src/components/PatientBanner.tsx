import React, { useEffect, useState, useRef } from 'react';
import { UserCheck, UserPlus, X, Search, History } from 'lucide-react';
import { usePrescriptionStore } from '../store/usePrescriptionStore';
import type { Patient } from '../shared/types';
import {
  isValidBangladeshiPhone,
  sanitizeAgeYears,
  sanitizeAgeMonths,
  sanitizeWeightKg,
} from '../shared/validation';

export default function PatientBanner() {
  const {
    patientId,
    name,
    ageYears,
    ageMonths,
    sex,
    phone,
    weightKg,
    updatePatient,
    selectExistingPatient,
    setHistoryDrawerOpen,
  } = usePrescriptionStore();

  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchTarget, setSearchTarget] = useState<'name' | 'phone'>('name');

  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search on name or phone changes
  useEffect(() => {
    // Only search if user is typing and patient is not already selected
    const query = (searchTarget === 'name' ? name : phone).trim();
    if (!query || query.length < 2 || patientId !== null) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (window.api?.searchPatients) {
        try {
          const results = await window.api.searchPatients(query);
          setSearchResults(results);
          setIsOpen(results.length > 0);
          setSelectedIndex(0);
        } catch (err) {
          console.error('Error searching patients:', err);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [name, phone, searchTarget, patientId]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectPatient = (p: Patient) => {
    selectExistingPatient(p);
    setIsOpen(false);
    setSearchResults([]);
    setHistoryDrawerOpen(true);
  };

  const handleResetPatient = () => {
    updatePatient({
      patientId: null,
      name: '',
      ageYears: null,
      ageMonths: null,
      sex: null,
      phone: '',
      weightKg: null,
      address: '',
    });
    setIsOpen(false);
    setSearchResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = searchResults[selectedIndex];
      if (current) {
        handleSelectPatient(current);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative bezel-card p-6 mb-6 bg-white space-y-4"
    >
      {/* Returning patient badge & clear button */}
      <div className="flex items-center justify-between pb-1 border-b border-beige-300">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gold-700 uppercase tracking-wider text-xs flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-gold-600" />
            Patient Demographics & Identity
          </span>
          {patientId ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-gold-50 text-gold-700 border border-gold-300 shadow-xs">
                <UserCheck className="w-3.5 h-3.5 text-gold-600" />
                Returning Patient #{patientId}
              </span>
              <button
                type="button"
                onClick={() => setHistoryDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-xs font-bold bg-gold-100 hover:bg-gold-200 text-gold-800 border border-gold-300 shadow-xs transition-all cursor-pointer"
                title="View previous prescription history for this patient"
              >
                <History className="w-3.5 h-3.5 text-gold-600" />
                <span>View Patient History</span>
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-beige-100 text-ink-600 border border-beige-300">
              <UserPlus className="w-3.5 h-3.5 text-ink-500" />
              New Patient
            </span>
          )}
        </div>

        {(patientId || name || phone) && (
          <button
            type="button"
            onClick={handleResetPatient}
            className="text-xs text-ink-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear / New Patient</span>
          </button>
        )}
      </div>

      {/* Hero Bento Structure */}
      <div className="space-y-4">
        {/* Tier 1: Patient Name Hero Input */}
        <div className="relative">
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">
            Full Patient Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setSearchTarget('name');
                updatePatient({ name: e.target.value, patientId: null });
              }}
              onFocus={() => {
                setSearchTarget('name');
                if (searchResults.length > 0 && !patientId) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type patient name to search or register... (e.g. Mohammad Rahim)"
              className="w-full h-12 px-4 text-sm bg-ivory-50 border border-beige-300 rounded-xl focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-500/30 font-semibold text-ink-900 placeholder-ink-400 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Tier 2: Biometrics & Demographics Bento Grid */}
        <div className="grid grid-cols-12 gap-4 items-end">
          {/* Age (col-span-3) */}
          <div className="col-span-3">
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Age (Years & Months)
            </label>
            <div className="h-11 flex items-center gap-2 bg-ivory-50 border border-beige-300 rounded-xl px-3 focus-within:border-gold-600 transition-all">
              <input
                type="number"
                min="0"
                max="130"
                value={ageYears ?? ''}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === '.')
                    e.preventDefault();
                }}
                onChange={(e) => {
                  updatePatient({ ageYears: sanitizeAgeYears(e.target.value) });
                }}
                placeholder="Yrs"
                className="w-full text-sm bg-transparent focus:outline-none font-mono text-center text-ink-900 placeholder-ink-400"
              />
              <span className="text-ink-400 text-xs font-semibold">y</span>
              <div className="w-px h-5 bg-beige-300" />
              <input
                type="number"
                min="0"
                max="11"
                value={ageMonths ?? ''}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === '.')
                    e.preventDefault();
                }}
                onChange={(e) => {
                  updatePatient({
                    ageMonths: sanitizeAgeMonths(e.target.value),
                  });
                }}
                placeholder="Mo"
                className="w-full text-sm bg-transparent focus:outline-none font-mono text-center text-ink-900 placeholder-ink-400"
              />
              <span className="text-ink-400 text-xs font-semibold">m</span>
            </div>
          </div>

          {/* Sex Segmented Pill Toggle (col-span-3) */}
          <div className="col-span-3">
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Sex
            </label>
            <div className="h-11 flex p-1 rounded-xl border border-beige-300 bg-beige-100 gap-1">
              {(['M', 'F', 'O'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updatePatient({ sex: s })}
                  className={`flex-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    sex === s
                      ? 'bg-gold-600 text-white shadow-xs'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-white/80'
                  }`}
                >
                  {s === 'M' ? 'Male' : s === 'F' ? 'Female' : 'Other'}
                </button>
              ))}
            </div>
          </div>

          {/* Phone (col-span-3) */}
          <div className="col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-ink-700">
                BD Mobile Number
              </label>
              {phone.trim() &&
                (isValidBangladeshiPhone(phone) ? (
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    ✓ Valid BD
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-600 font-semibold">
                    ⚠ 11 digits
                  </span>
                ))}
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^\d+\s-]/g, '');
                setSearchTarget('phone');
                updatePatient({ phone: cleaned, patientId: null });
              }}
              onFocus={() => {
                setSearchTarget('phone');
                if (searchResults.length > 0 && !patientId) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 01712345678"
              className={`w-full h-11 px-3.5 text-sm bg-ivory-50 border rounded-xl focus:outline-none focus:ring-1 font-mono text-ink-900 placeholder-ink-400 transition-all ${
                phone.trim() && !isValidBangladeshiPhone(phone)
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/30'
                  : 'border-beige-300 focus:border-gold-600 focus:ring-gold-500/30'
              }`}
            />
          </div>

          {/* Weight (col-span-3) */}
          <div className="col-span-3">
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Body Weight (kg)
            </label>
            <div className="h-11 flex items-center justify-between bg-ivory-50 border border-beige-300 rounded-xl px-3.5 focus-within:border-gold-600 transition-all">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="300"
                value={weightKg ?? ''}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') e.preventDefault();
                }}
                onChange={(e) => {
                  updatePatient({ weightKg: sanitizeWeightKg(e.target.value) });
                }}
                placeholder="e.g. 65"
                className="w-full text-sm bg-transparent focus:outline-none font-mono text-ink-900 placeholder-ink-400"
              />
              <span className="text-ink-400 text-xs font-semibold uppercase">
                kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Autocomplete Dropdown for Returning Patients */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute left-6 right-6 top-full mt-2 bg-white border border-beige-300 rounded-2xl shadow-xl overflow-hidden z-30 divide-y divide-beige-200 max-h-64 overflow-y-auto">
          <div className="px-4 py-2 bg-beige-50 text-[10px] font-bold uppercase tracking-wider text-gold-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-gold-600" />
              Existing Patient Records ({searchResults.length})
            </span>
            <span className="font-normal text-ink-500">
              ↑↓ to navigate &middot; Enter to select
            </span>
          </div>

          {searchResults.map((p, idx) => {
            const isHighlighted = selectedIndex === idx;
            const ageDisplay = [
              p.age_years !== null ? `${p.age_years}y` : '',
              p.age_months !== null ? `${p.age_months}m` : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={p.id}
                onClick={() => handleSelectPatient(p)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-4 py-3 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  isHighlighted
                    ? 'bg-gold-50/70 border-l-4 border-gold-600'
                    : 'hover:bg-beige-50/70'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-ink-900 text-sm">
                      {p.name}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-beige-100 text-ink-700 border border-beige-200">
                      ID: #{p.id}
                    </span>
                    {p.sex && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold-50 text-gold-700 font-medium border border-gold-200">
                        {p.sex}
                      </span>
                    )}
                    {ageDisplay && (
                      <span className="text-ink-500 text-xs font-mono">
                        {ageDisplay}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-500 mt-1 flex items-center gap-3">
                    {p.phone && <span>Phone: {p.phone}</span>}
                    {p.address && <span>Address: {p.address}</span>}
                    {p.created_at && (
                      <span>Reg: {p.created_at.slice(0, 10)}</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {isHighlighted ? (
                    <span className="text-xs font-semibold text-gold-800 bg-gold-100 px-2.5 py-1 rounded-lg border border-gold-300 shadow-xs">
                      ↵ Select Patient
                    </span>
                  ) : (
                    <span className="text-xs text-ink-400">Select</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
