import React, { useEffect, useState, useRef } from 'react';
import { UserCheck, UserPlus, X, Search } from 'lucide-react';
import { usePrescriptionStore } from '../store/usePrescriptionStore';
import type { Patient } from '../shared/types';

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
      className="relative bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs mb-4"
    >
      {/* Returning patient badge & clear button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
            Patient Information
          </span>
          {patientId ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-800 border border-teal-200">
              <UserCheck className="w-3 h-3 text-teal-600" />
              Returning Patient #{patientId}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-200/80 text-slate-600">
              <UserPlus className="w-3 h-3 text-slate-500" />
              New Patient
            </span>
          )}
        </div>

        {(patientId || name || phone) && (
          <button
            type="button"
            onClick={handleResetPatient}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <X className="w-3 h-3" />
            Clear / New Patient
          </button>
        )}
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-12 gap-2.5 items-end">
        {/* Name (col-span-4) */}
        <div className="col-span-4 relative">
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Patient Name <span className="text-rose-500">*</span>
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
              placeholder="e.g. Mohammad Rahim"
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Age (col-span-2) */}
        <div className="col-span-2">
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Age
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="130"
              value={ageYears ?? ''}
              onChange={(e) =>
                updatePatient({
                  ageYears:
                    e.target.value === '' ? null : parseInt(e.target.value, 10),
                })
              }
              placeholder="Yrs"
              className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 font-mono text-center"
            />
            <span className="text-slate-400 text-[10px]">y</span>
            <input
              type="number"
              min="0"
              max="11"
              value={ageMonths ?? ''}
              onChange={(e) =>
                updatePatient({
                  ageMonths:
                    e.target.value === '' ? null : parseInt(e.target.value, 10),
                })
              }
              placeholder="Mo"
              className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 font-mono text-center"
            />
            <span className="text-slate-400 text-[10px]">m</span>
          </div>
        </div>

        {/* Sex Toggle (col-span-2) */}
        <div className="col-span-2">
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Sex
          </label>
          <div className="flex rounded border border-slate-300 overflow-hidden bg-white">
            {(['M', 'F', 'O'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updatePatient({ sex: s })}
                className={`flex-1 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  sex === s
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Phone (col-span-2) */}
        <div className="col-span-2">
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Phone
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => {
              setSearchTarget('phone');
              updatePatient({ phone: e.target.value, patientId: null });
            }}
            onFocus={() => {
              setSearchTarget('phone');
              if (searchResults.length > 0 && !patientId) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="017XXXXXXXX"
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 font-mono text-slate-800"
          />
        </div>

        {/* Weight (col-span-2) */}
        <div className="col-span-2">
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Weight
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.5"
              min="0"
              max="300"
              value={weightKg ?? ''}
              onChange={(e) =>
                updatePatient({
                  weightKg:
                    e.target.value === '' ? null : parseFloat(e.target.value),
                })
              }
              placeholder="e.g. 65"
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-600 font-mono"
            />
            <span className="text-slate-400 text-[10px]">kg</span>
          </div>
        </div>
      </div>

      {/* Autocomplete Dropdown for Returning Patients */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-30 divide-y divide-slate-100 max-h-60 overflow-y-auto">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Search className="w-3 h-3 text-teal-600" />
              Existing Patient Matches ({searchResults.length})
            </span>
            <span className="font-normal text-slate-400">
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
                className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  isHighlighted
                    ? 'bg-teal-50 border-l-4 border-teal-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      ID: #{p.id}
                    </span>
                    {p.sex && (
                      <span className="text-[11px] px-1 rounded bg-teal-100 text-teal-800 font-semibold">
                        {p.sex}
                      </span>
                    )}
                    {ageDisplay && (
                      <span className="text-slate-500 text-[11px]">
                        {ageDisplay}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                    {p.phone && <span>Phone: {p.phone}</span>}
                    {p.address && <span>Address: {p.address}</span>}
                    {p.created_at && (
                      <span>Reg: {p.created_at.slice(0, 10)}</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {isHighlighted ? (
                    <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded">
                      ↵ Select Patient
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Select</span>
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
