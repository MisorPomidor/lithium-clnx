import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowUp, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PromotionRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  currentRank: 'Newbie' | 'Test';
  targetRank: 'Test' | 'Main';
  date: string;
  reportsCount: number;
}

interface PromotionRequestCardProps {
  request: PromotionRequest;
  onApprove: (id: string, comment: string) => void;
  onReject: (id: string, comment: string) => void;
}

const rankColors = {
  Newbie: 'bg-muted text-muted-foreground border-muted-foreground/30',
  Test: 'bg-warning/20 text-warning border-warning/30',
  Main: 'bg-primary/20 text-primary border-primary/30',
};

const PromotionRequestCard: React.FC<PromotionRequestCardProps> = ({
  request,
  onApprove,
  onReject,
}) => {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-border">
              <AvatarImage src={request.memberAvatar} alt={request.memberName} />
              <AvatarFallback className="bg-muted text-muted-foreground font-display">
                {request.memberName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-medium">{request.memberName}</CardTitle>
              <p className="text-sm text-muted-foreground">{request.reportsCount} отчётов</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border", rankColors[request.currentRank])}>
              {request.currentRank}
            </Badge>
            <ArrowUp className="w-4 h-4 text-primary" />
            <Badge className={cn("border", rankColors[request.targetRank])}>
              {request.targetRank}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">Дата заявки: {request.date}</p>
        
        {showComment ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Комментарий к решению..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-muted/50 border-border/50 focus:border-primary resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                variant="success"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => onApprove(request.id, comment)}
              >
                <Check className="w-4 h-4" />
                Принять
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => onReject(request.id, comment)}
              >
                <X className="w-4 h-4" />
                Отклонить
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="success"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onApprove(request.id, '')}
            >
              <Check className="w-4 h-4" />
              Принять
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onReject(request.id, '')}
            >
              <X className="w-4 h-4" />
              Отклонить
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowComment(true)}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionRequestCard;
