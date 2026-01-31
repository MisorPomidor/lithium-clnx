import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Member {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  rank: 'Newbie' | 'Test' | 'Main';
  highestRole: string;
  reportsCount: number;
  hasPendingPromotion?: boolean;
}

interface MemberCardProps {
  member: Member;
  onClick?: () => void;
}

const rankColors = {
  Newbie: 'bg-muted text-muted-foreground border-muted-foreground/30',
  Test: 'bg-warning/20 text-warning border-warning/30',
  Main: 'bg-primary/20 text-primary border-primary/30',
};

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick }) => {
  return (
    <Card 
      className={cn(
        "bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer group",
        member.hasPendingPromotion && "border-warning/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-border group-hover:border-primary/50 transition-colors">
              <AvatarImage src={member.avatar} alt={member.displayName} />
              <AvatarFallback className="bg-muted text-muted-foreground font-display">
                {member.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                {member.displayName}
              </p>
              <p className="text-sm text-muted-foreground">@{member.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <Badge className={cn("border", rankColors[member.rank])}>
                {member.rank}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {member.reportsCount} отчётов
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
        {member.hasPendingPromotion && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <Badge className="bg-warning/20 text-warning border border-warning/30">
              Заявка на повышение
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberCard;
