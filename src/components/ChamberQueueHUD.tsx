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
    <div className="bezel-card p-4 bg-white border border-beige-300 rounded-2xl mb-6 shadow-xs select-none">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Active Chamber & Doctor HUD */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700 font-bold shadow-inner">
            <Activity className="w-5 h-5 text-gold-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gold-700 bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold-200">
                Live Chamber Queue
              </span>
              <span className="text-xs text-ink-700 font-medium">
                Token Stream
              </span>
            </div>
            <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-2">
              <span>
                Waiting:{' '}
                <strong className="text-ink-900">{waitingTokens.length}</strong>
              </span>
              <span>&middot;</span>
              <span>
                In Chamber:{' '}
                <strong className="text-gold-700">{activeToken ? 1 : 0}</strong>
              </span>
              <span>&middot;</span>
              <span>
                Completed:{' '}
                <strong className="text-ink-600">
                  {completedTokens.length}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Token Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-md">
          {tokens.map((token) => {
            const isActive = token.id === activeTokenId;
            const isCompleted = token.status === 'completed';

            return (
              <button
                key={token.id}
                type="button"
                onClick={() => selectToken(token.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-gold-600 text-white border-gold-500 shadow-xs ring-1 ring-gold-400/40'
                    : isCompleted
                      ? 'bg-beige-100/60 text-ink-400 border-beige-200 line-through opacity-60'
                      : 'bg-beige-100 text-ink-700 border-beige-200 hover:bg-white hover:text-ink-900 hover:border-gold-300'
                }`}
                title={`Token #${token.token_number}: ${token.patient_name} (${token.age || ''} ${token.sex || ''})`}
              >
                <span className="font-mono text-xs">#{token.token_number}</span>
                <span className="truncate max-w-[90px]">
                  {token.patient_name}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
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
              className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 active:bg-gold-800 active:scale-[0.98] text-white font-semibold text-xs flex items-center gap-2 shadow-xs border border-gold-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all cursor-pointer"
            >
              <span>Call Next Token</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="text-xs text-ink-500 bg-beige-100 px-3 py-1.5 rounded-xl border border-beige-200">
              Queue Finished
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
