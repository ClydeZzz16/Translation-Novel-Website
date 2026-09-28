import { useState, type FC } from 'react';
import { DollarSign } from 'lucide-react';

export interface AdSlotProps {
  slotLocation: 'homepage-banner' | 'novel-sidebar' | 'chapter-top' | 'chapter-bottom' | 'chapter-in-content';
  className?: string;
}

export const AdSlot: FC<AdSlotProps> = ({ slotLocation, className = '' }) => {
  const [provider] = useState<'montagem' | 'adsense' | 'demo'>('demo');

  return (
    <div className={`my-6 mx-auto w-full max-w-4xl rounded-xl border border-dashed border-slate-400 dark:border-ash-700 bg-slate-100 dark:bg-ash-900/40 p-4 text-center transition-all ${className}`}>
      <div className="flex flex-col items-center justify-center space-y-1">
        <div className="flex items-center space-x-2 text-xs font-bold tracking-wider text-slate-900 dark:text-ash-400 uppercase">
          <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
          <span>Sponsored Advertisement ({provider})</span>
        </div>
        <p className="text-xs text-slate-800 dark:text-ash-300 font-medium">
          Placement: <span className="font-mono text-violet-800 dark:text-violet-400">{slotLocation}</span> • Non-intrusive Reading Partner
        </p>
        <div className="mt-2 w-full h-16 sm:h-20 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-ash-800/40 dark:via-ash-700/30 dark:to-ash-800/40 rounded-lg flex items-center justify-center text-xs text-slate-900 dark:text-ash-200 font-semibold border border-slate-300 dark:border-slate-800">
          [ Ad Banner Slot Reserved for {provider.toUpperCase()} Integration ]
        </div>
      </div>
    </div>
  );
};

export default AdSlot;
