import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Image, Calendar, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Report {
  id: string;
  type: 'video' | 'screenshot';
  url: string;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const statusColors = {
    pending: 'bg-warning/20 text-warning border-warning/30',
    approved: 'bg-success/20 text-success border-success/30',
    rejected: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  const statusLabels = {
    pending: 'На проверке',
    approved: 'Одобрено',
    rejected: 'Отклонено',
  };

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              report.type === 'video' ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
            )}>
              {report.type === 'video' ? <Video className="w-5 h-5" /> : <Image className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {report.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{report.date}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border", statusColors[report.status])}>
              {statusLabels[report.status]}
            </Badge>
            <a
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;
