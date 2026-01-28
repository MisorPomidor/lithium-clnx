import { cn } from '@/lib/utils';

interface RankBadgeProps {
  rank: 'newbie' | 'test' | 'main' | 'high_staff';
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
  newbie: 'rank-newbie',
  test: 'rank-test',
  main: 'rank-main',
  high_staff: 'rank-high-staff',
};

const sizeStyles: Record<string, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2',
};

export function RankBadge({ rank, size = 'md', className }: RankBadgeProps) {
  return (
    <span
      className={cn(
        'rank-badge inline-flex items-center font-bold uppercase tracking-wider',
        rankStyles[rank],
        sizeStyles[size],
        className
      )}
    >
      {rankLabels[rank]}
    </span>
  );
}