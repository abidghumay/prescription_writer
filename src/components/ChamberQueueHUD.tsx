import React from 'react';
import { ArrowRight, Activity } from 'lucide-react';
import { usePrescriptionStore } from '../store/usePrescriptionStore';

export default function ChamberQueueHUD() {
  const { tokens, activeTokenId, callNextToken, selectToken } =
    usePrescriptionStore();

  const activeToken = tokens.find((t) => t.id === activeTokenId);
  const waitingTokens = tokens.filter((t) => t.status === 'waiting');
  const completedTokens = tokens.filter((t) => t.status === 'completed');

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-3 shadow-md border border-slate-700/60 mb-3 select-none">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Active Chamber & Doctor HUD */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold">
            <Activity className="w-5 h-5 text-teal-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                Live Chamber Queue
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Token Stream
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>
                Waiting:{' '}
                <strong className="text-white">{waitingTokens.length}</strong>
              </span>
              <span>&middot;</span>
              <span>
                In Chamber:{' '}
                <strong className="text-teal-300">{activeToken ? 1 : 0}</strong>
              </span>
              <span>&middot;</span>
              <span>
                Completed:{' '}
                <strong className="text-emerald-400">
                  {completedTokens.length}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Token Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-md">
          {tokens.map((token) => {
            const isActive = token.id === activeTokenId;
            const isCompleted = token.status === 'completed';

            return (
              <button
                key={token.id}
                type="button"
                onClick={() => selectToken(token.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-sm ring-2 ring-teal-400/30'
                    : isCompleted
                      ? 'bg-slate-800/60 text-slate-400 border-slate-700/60 line-through opacity-70'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
                title={`Token #${token.token_number}: ${token.patient_name} (${token.age || ''} ${token.sex || ''})`}
              >
                <span className="font-mono text-[11px]">
                  #{token.token_number}
                </span>
                <span className="truncate max-w-[85px]">
                  {token.patient_name}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Quick Action - Call Next Patient */}
        <div className="flex items-center gap-2">
          {waitingTokens.length > 0 ? (
            <button
              type="button"
              onClick={callNextToken}
              className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 active:scale-98 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <span>Call Next Token</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              Queue Finished
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
