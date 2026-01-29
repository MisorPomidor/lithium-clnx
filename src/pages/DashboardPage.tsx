import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ParticleBackground from '@/components/ParticleBackground';
import RankProgress from '@/components/RankProgress';
import ReportCard from '@/components/ReportCard';
import UploadReportDialog from '@/components/UploadReportDialog';
import { useAuthContext } from '@/contexts/AuthContext';
import { useReports } from '@/hooks/useReports';
import { useMembers } from '@/hooks/useMembers';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Shield, 
  FileText, 
  TrendingUp, 
  Send,
  Crown,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DashboardPage: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuthContext();
  const { reports, addReport, isLoading: reportsLoading } = useReports(user?.id);
  const { requestPromotion } = useMembers();
  const navigate = useNavigate();
  const [hasRequestedPromotion, setHasRequestedPromotion] = useState(false);
  const [isSubmittingPromotion, setIsSubmittingPromotion] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    } else if (!authLoading && user && !user.hasAccess) {
      navigate('/no-access');
    }
  }, [authLoading, user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleRequestPromotion = async () => {
    if (!user || user.rank === 'Main') return;
    
    setIsSubmittingPromotion(true);
    try {
      await requestPromotion(user.id, user.rank as 'Newbie' | 'Test');
      setHasRequestedPromotion(true);
      toast({
        title: 'Заявка отправлена',
        description: 'Ваша заявка на повышение отправлена на рассмотрение',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить заявку. Попробуйте позже.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingPromotion(false);
    }
  };

  const handleAddReport = async (report: { type: 'video' | 'screenshot'; url: string; description: string }) => {
    try {
      await addReport(report);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить отчёт. Попробуйте позже.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <ParticleBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const roleColors: Record<string, string> = {
    'High Staff': 'bg-destructive/20 text-destructive border-destructive/30',
    'Main': 'bg-primary/20 text-primary border-primary/30',
    'Test': 'bg-warning/20 text-warning border-warning/30',
    'Newbie': 'bg-muted text-muted-foreground border-muted-foreground/30',
  };

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="font-display text-xl font-bold gradient-text">
              LITHIUM CLNX
            </h1>
            
            <div className="flex items-center gap-4">
              {user.isHighStaff && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="w-4 h-4" />
                  Админ панель
                </Button>
              )}
              
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarImage src={user.avatar || undefined} alt={user.displayName} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-display">
                    {user.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:block">{user.displayName}</span>
              </div>
              
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8">
          {/* Profile card */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-primary/30 shadow-[0_0_30px_hsl(187_100%_50%/0.3)]">
                  <AvatarImage src={user.avatar || undefined} alt={user.displayName} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-display">
                    {user.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                    <h2 className="font-display text-2xl font-bold">{user.displayName}</h2>
                    <Badge className={cn("border", roleColors[user.highestRole] || roleColors['Newbie'])}>
                      <Crown className="w-3 h-3 mr-1" />
                      {user.highestRole}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">@{user.username}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>{reports.length} отчётов</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span>Ранг: {user.rank}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <UploadReportDialog onSubmit={handleAddReport} />
                  {user.rank !== 'Main' && (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="gap-2"
                      onClick={handleRequestPromotion}
                      disabled={hasRequestedPromotion || isSubmittingPromotion}
                    >
                      {isSubmittingPromotion ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {hasRequestedPromotion ? 'Заявка отправлена' : 'Заявка на повышение'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rank Progress */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 mb-8">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Путь развития
              </CardTitle>
              <CardDescription>
                Ваш прогресс в клане
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RankProgress 
                currentRank={user.rank} 
                daysUntilNextRank={user.daysUntilNextRank} 
              />
            </CardContent>
          </Card>

          {/* Reports */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Мои отчёты
              </CardTitle>
              <CardDescription>
                История загруженных отчётов
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">У вас пока нет отчётов</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Загрузите первый отчёт, чтобы начать
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map(report => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
