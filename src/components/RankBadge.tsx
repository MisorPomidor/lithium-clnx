import { cn } from '@/lib/utils';

interface RankBadgeProps {
  rank: 'newbie' | 'test' | 'main' | 'high_staff' | string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const rankLabels: Record<string, string> = {
  newbie: 'Newbie',
  test: 'Test',
  main: 'Main',
  high_staff: 'High Staff',
};

const rankStyles: Record<string, string> = {
  newbie: 'bg-muted text-muted-foreground border-muted-foreground/30',
  test: 'bg-warning/20 text-warning border-warning/30',
  main: 'bg-primary/20 text-primary border-primary/30',
  high_staff: 'bg-secondary/20 text-secondary border-secondary/30',
};

const sizeStyles: Record<string, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2',
};

export function RankBadge({ rank, size = 'md', className }: RankBadgeProps) {
  const safeRank = rank || 'newbie';
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-bold uppercase tracking-wider rounded-full border',
        rankStyles[safeRank] || rankStyles['newbie'],
        sizeStyles[size],
        className
      )}
    >
      {rankLabels[safeRank] || 'Newbie'}
    </span>
  );
}

export default RankBadge;
