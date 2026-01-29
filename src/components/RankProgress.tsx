import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Clock, Star } from 'lucide-react';

type Rank = 'Newbie' | 'Test' | 'Main';

interface RankProgressProps {
  currentRank: Rank;
  daysUntilNextRank?: number;
}

const ranks: { name: Rank; icon: React.ReactNode; description: string }[] = [
  { name: 'Newbie', icon: <Star className="w-5 h-5" />, description: 'Начинающий участник' },
  { name: 'Test', icon: <Clock className="w-5 h-5" />, description: 'Тестовый период' },
  { name: 'Main', icon: <Check className="w-5 h-5" />, description: 'Основной состав' },
];

const RankProgress: React.FC<RankProgressProps> = ({ currentRank, daysUntilNextRank }) => {
  const currentRankIndex = ranks.findIndex(r => r.name === currentRank);

  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute top-8 left-0 right-0 h-1 bg-muted rounded-full mx-12">
        <div 
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
          style={{ width: `${(currentRankIndex / (ranks.length - 1)) * 100}%` }}
        />
      </div>

      {/* Rank nodes */}
      <div className="relative flex justify-between">
        {ranks.map((rank, index) => {
          const isPast = index < currentRankIndex;
          const isCurrent = index === currentRankIndex;
          const isFuture = index > currentRankIndex;

          return (
            <div key={rank.name} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 relative z-10",
                  isPast && "bg-primary/20 border-2 border-primary text-primary",
                  isCurrent && "bg-primary text-primary-foreground shadow-[0_0_30px_hsl(187_100%_50%/0.6)] animate-pulse-glow scale-110",
                  isFuture && "bg-muted border-2 border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {rank.icon}
              </div>
              <span
                className={cn(
                  "mt-3 font-display text-sm font-semibold",
                  isCurrent && "text-primary text-glow",
                  isPast && "text-primary/70",
                  isFuture && "text-muted-foreground"
                )}
              >
                {rank.name}
              </span>
              <span className="text-xs text-muted-foreground mt-1 text-center max-w-24">
                {rank.description}
              </span>
              {isCurrent && daysUntilNextRank !== undefined && index < ranks.length - 1 && (
                <div className="mt-2 px-3 py-1 bg-warning/20 text-warning text-xs rounded-full border border-warning/30">
                  {daysUntilNextRank} дней до повышения
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RankProgress;
