import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  User,
  Copy,
  Printer,
  Trash2,
  Phone,
  FileText,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { PastPrescriptionRecord } from '../shared/types';
import { usePrescriptionStore } from '../store/usePrescriptionStore';

interface PastPrescriptionsViewProps {
  onRepeatPrescription: () => void;
  onOpenPrintModal?: (rx: PastPrescriptionRecord) => void;
}

export default function PastPrescriptionsView({
  onRepeatPrescription,
  onOpenPrintModal,
}: PastPrescriptionsViewProps) {
  const { repeatPreviousPrescription, updatePatient } = usePrescriptionStore();

  const [records, setRecords] = useState<PastPrescriptionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<
    'all' | 'today' | 'week' | 'month'
  >('all');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchRecords = async (query = '') => {
    if (!window.api?.getAllPrescriptions) return;
    setIsLoading(true);
    try {
      const data = await window.api.getAllPrescriptions(query);
      setRecords(data || []);
    } catch (err) {
      console.error('Failed to load past prescriptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(searchQuery);
  }, [searchQuery]);

  // Filter records based on selected date filter
  const filteredRecords = useMemo(() => {
    if (dateFilter === 'all') return records;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return records.filter((r) => {
      const visitDate = r.visit_date;
      if (!visitDate) return false;

      if (dateFilter === 'today') {
        return visitDate === todayStr;
      }

      const diffDays =
        (now.getTime() - new Date(visitDate).getTime()) / (1000 * 3600 * 24);

      if (dateFilter === 'week') {
        return diffDays <= 7;
      }
      if (dateFilter === 'month') {
        return diffDays <= 30;
      }
      return true;
    });
  }, [records, dateFilter]);

  const handleRepeat = (rx: PastPrescriptionRecord) => {
    // 1. Load patient demographics into store
    updatePatient({
      patientId: rx.patient_id,
      name: rx.patient_name,
      phone: rx.patient_phone || '',
      ageYears: rx.patient_age_years,
      sex: rx.patient_sex,
      weightKg: rx.weight_kg,
    });

    // 2. Clone clinical notes and medicines
    repeatPreviousPrescription(rx);

    // 3. Switch view to New Prescription
    onRepeatPrescription();
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this prescription record?',
      )
    ) {
      return;
    }

    if (window.api?.deletePrescription) {
      setDeletingId(id);
      try {
        const success = await window.api.deletePrescription(id);
        if (success) {
          setRecords((prev) => prev.filter((r) => r.id !== id));
        }
      } catch (err) {
        console.error('Failed to delete prescription:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Filter & Search Controls */}
      <div className="bezel-card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold font-heading text-ink-900 tracking-tight flex items-center gap-2">
              <span>Past Prescriptions Ledger</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gold-50 border border-gold-300 text-gold-700">
                {filteredRecords.length} Saved
              </span>
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Browse, search, reprint, or repeat any past consultation from your
              local database.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchRecords(searchQuery)}
            className="p-2 rounded-xl bg-studio-surface border border-studio-border text-ink-600 hover:text-gold-600 hover:border-gold-300 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
            title="Refresh list"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search input and date filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient Name, Phone, Diagnosis, or Chief Complaints..."
              className="w-full pl-10 pr-4 py-2.5 bg-studio-surface border border-studio-border rounded-xl text-sm font-medium text-ink-900 placeholder-ink-400 focus:outline-none focus:border-gold-500 focus:bg-white focus:ring-1 focus:ring-gold-500/20 transition-all shadow-xs"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-1.5 p-1 bg-studio-surface border border-studio-borderSubtle rounded-xl text-xs font-semibold">
            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: '30 Days' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id as typeof dateFilter)}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                  dateFilter === f.id
                    ? 'bg-white text-gold-700 shadow-xs border border-studio-border font-bold'
                    : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prescriptions Feed */}
      {isLoading ? (
        <div className="bezel-card p-12 text-center text-ink-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-500" />
          <p className="font-semibold">
            Loading past prescriptions from SQLite...
          </p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bezel-card p-16 text-center text-ink-500 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-studio-surface border border-studio-border flex items-center justify-center mx-auto text-gold-600">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-ink-800 font-heading">
            {searchQuery
              ? `No past prescriptions found matching "${searchQuery}"`
              : 'No past prescriptions recorded yet'}
          </h3>
          <p className="text-xs text-ink-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Try searching with a different patient name, phone number, or clear the search query.'
              : 'Write and finalize a prescription in the "New Prescription" tab to start building your patient history ledger.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((rx) => (
            <div
              key={rx.id}
              className="bezel-card p-6 transition-all hover:border-gold-300 hover:shadow-sm space-y-4"
            >
              {/* Card Header: Patient & Metadata */}
              <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-studio-borderSubtle">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base text-ink-900 font-heading">
                      {rx.patient_name}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-studio-surface border border-studio-border text-ink-600">
                      #{rx.id}
                    </span>
                    {rx.diagnosis && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gold-50 border border-gold-300 text-gold-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-gold-600" />
                        <span>Dx: {rx.diagnosis}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-ink-500 flex-wrap">
                    {rx.patient_age_years !== null && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-ink-400" />
                        <span>{rx.patient_age_years} yrs</span>
                        {rx.patient_sex && <span>({rx.patient_sex})</span>}
                      </span>
                    )}

                    {rx.patient_phone && (
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-ink-400" />
                        <span>{rx.patient_phone}</span>
                      </span>
                    )}

                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gold-600" />
                      <span className="font-medium text-ink-700">
                        {rx.visit_date}
                      </span>
                    </span>

                    {rx.weight_kg && (
                      <span className="text-ink-400">
                        Weight: {rx.weight_kg} kg
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRepeat(rx)}
                    className="px-3.5 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-600 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    title="Load these medications and patient into New Prescription canvas"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Repeat into New Rx</span>
                  </button>

                  {onOpenPrintModal && (
                    <button
                      type="button"
                      onClick={() => onOpenPrintModal(rx)}
                      className="px-3 py-1.5 rounded-xl bg-studio-surface hover:bg-studio-elevated border border-studio-border text-ink-700 hover:text-gold-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      title="Reprint this prescription"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Reprint</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(rx.id)}
                    disabled={deletingId === rx.id}
                    className="p-1.5 rounded-xl text-ink-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Clinical Notes Snippet */}
              {(rx.chief_complaints || rx.on_examination || rx.advice) && (
                <div className="bezel-inner p-3 text-xs space-y-1">
                  {rx.chief_complaints && (
                    <p className="text-ink-700">
                      <span className="font-bold text-ink-900">C/C:</span>{' '}
                      {rx.chief_complaints}
                    </p>
                  )}
                  {rx.on_examination && (
                    <p className="text-ink-600">
                      <span className="font-bold text-ink-800">O/E:</span>{' '}
                      {rx.on_examination}
                    </p>
                  )}
                  {rx.advice && (
                    <p className="text-ink-500 italic">
                      <span className="font-semibold text-ink-700 not-italic">
                        Advice:
                      </span>{' '}
                      {rx.advice}
                    </p>
                  )}
                </div>
              )}

              {/* Prescribed Medications List */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider">
                  Prescribed Medications ({rx.items.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {rx.items.map((item, idx) => (
                    <div
                      key={`item-${rx.id}-${idx}`}
                      className="px-2.5 py-1 rounded-lg bg-white border border-studio-border text-xs flex items-center gap-2 shadow-xs"
                    >
                      <span className="font-bold text-ink-900">
                        {item.form_snapshot && (
                          <span className="text-[10px] text-ink-400 mr-1 font-semibold">
                            {item.form_snapshot}
                          </span>
                        )}
                        {item.free_text_name}
                      </span>
                      {item.strength_snapshot && (
                        <span className="text-[10px] text-ink-500">
                          {item.strength_snapshot}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-gold-50 border border-gold-200 text-gold-800 font-mono text-[10px] font-bold">
                        {item.dose}
                      </span>
                      {item.meal_timing && (
                        <span className="text-[10px] text-ink-500">
                          {item.meal_timing}
                        </span>
                      )}
                      {item.duration && (
                        <span className="text-[10px] text-ink-400">
                          ({item.duration})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
