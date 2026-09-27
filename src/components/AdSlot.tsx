import { useState, type FC } from 'react';
import { DollarSign } from 'lucide-react';

export interface AdSlotProps {
  slotLocation: 'homepage-banner' | 'novel-sidebar' | 'chapter-top' | 'chapter-bottom' | 'chapter-in-content';
  className?: string;
}

export const AdSlot: FC<AdSlotProps> = ({ slotLocation, className = '' }) => {
  const [provider] = useState<'montagem' | 'adsense' | 'demo'>('demo');

  return (
    <div className={`my-6 mx-auto w-full max-w-4xl rounded-xl border border-dashed border-ash-300 dark:border-ash-700 bg-ash-100/50 dark:bg-ash-900/40 p-4 text-center transition-all ${className}`}>
      <div className="flex flex-col items-center justify-center space-y-1">
        <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-ash-500 uppercase">
          <DollarSign className="w-3.5 h-3.5 text-amber-500" />
          <span>Sponsored Advertisement ({provider})</span>
        </div>
        <p className="text-xs text-ash-400">
          Placement: <span className="font-mono">{slotLocation}</span> • Non-intrusive Reading Partner
        </p>
        <div className="mt-2 w-full h-16 sm:h-20 bg-gradient-to-r from-ash-200/40 via-ash-300/30 to-ash-200/40 dark:from-ash-800/40 dark:via-ash-700/30 dark:to-ash-800/40 rounded-lg flex items-center justify-center text-xs text-ash-500 font-medium">
          [ Ad Banner Slot Reserved for {provider.toUpperCase()} Integration ]
        </div>
      </div>
    </div>
  );
};

export default AdSlot;
