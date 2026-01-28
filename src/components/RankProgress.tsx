import { cn } from '@/lib/utils';
import { RankBadge } from './RankBadge';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

interface RankProgressProps {
  currentRank: 'newbie' | 'test' | 'main' | 'high_staff';
  className?: string;
}

const ranks = ['newbie', 'test', 'main'] as const;

export function RankProgress({ currentRank, className }: RankProgressProps) {
  const currentIndex = ranks.indexOf(currentRank as typeof ranks[number]);

  return (
    <div className={cn('w-full', className)}>
      <h3 className="text-lg font-bold text-foreground mb-6 glow-text">Путь повышения</h3>
      
      <div className="relative flex items-center justify-between">
        {/* Progress line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-muted rounded-full">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-700"
            style={{ width: `${(currentIndex / (ranks.length - 1)) * 100}%` }}
          />
        </div>

        {ranks.map((rank, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={rank} className="relative flex flex-col items-center z-10">
              {/* Icon */}
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                  isPast && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary text-primary-foreground animate-pulse-glow',
                  isFuture && 'bg-muted text-muted-foreground'
                )}
              >
                {isPast && <CheckCircle2 className="w-6 h-6" />}
                {isCurrent && <Circle className="w-6 h-6 fill-current" />}
                {isFuture && <Lock className="w-5 h-5" />}
              </div>

              {/* Label */}
              <div className="mt-4">
                <RankBadge 
                  rank={rank} 
                  size="sm"
                  className={cn(
                    isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  )}
                />
              </div>

              {/* Current indicator */}
              {isCurrent && (
                <span className="mt-2 text-xs text-primary font-medium">Текущий</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}