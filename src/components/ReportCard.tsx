import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Image, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Report {
  id: string;
  type: 'video' | 'screenshot';
  url: string;
  description: string;
  date: string;
}

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const handleClick = () => {
    window.open(report.url, '_blank'); // відкриває силку на весь Card
  };

  return (
    <Card
      className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer"
      onClick={handleClick} // весь блок клікабельний
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              report.type === 'video' ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
            )}
          >
            {report.type === 'video' ? <Video className="w-5 h-5" /> : <Image className="w-5 h-5" />}
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {report.description}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{report.date}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;
