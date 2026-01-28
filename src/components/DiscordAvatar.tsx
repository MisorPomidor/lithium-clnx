import { cn } from '@/lib/utils';

interface DiscordAvatarProps {
  discordId: string;
  avatarHash: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export function DiscordAvatar({ 
  discordId, 
  avatarHash, 
  username, 
  size = 'md',
  className 
}: DiscordAvatarProps) {
  const avatarUrl = avatarHash
    ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId) % 5}.png`;

  return (
    <div 
      className={cn(
        'rounded-full overflow-hidden border-2 border-primary/50 glow-border',
        sizeStyles[size],
        className
      )}
    >
      <img
        src={avatarUrl}
        alt={username}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/0.png`;
        }}
      />
    </div>
  );
}