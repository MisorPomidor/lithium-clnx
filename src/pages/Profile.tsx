import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DiscordAvatar } from '@/components/DiscordAvatar';
import { RankBadge } from '@/components/RankBadge';
import { RankProgress } from '@/components/RankProgress';
import { toast } from 'sonner';
import { 
  Loader2, 
  LogOut, 
  Upload, 
  Clock, 
  FileText, 
  Send, 
  Settings,
  Youtube,
  Image,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Report {
  id: string;
  report_type: string;
  content_url: string;
  description: string | null;
  created_at: string;
}

interface PromotionRequest {
  id: string;
  current_rank: string;
  requested_rank: string;
  status: string;
  admin_comment: string | null;
  created_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPromotionOpen, setIsPromotionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload form state
  const [reportType, setReportType] = useState<'youtube_video' | 'screenshot'>('youtube_video');
  const [contentUrl, setContentUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReports();
      fetchPromotionRequests();
    }
  }, [user]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setReports(data || []);
    }
  };

  const fetchPromotionRequests = async () => {
    const { data, error } = await supabase
      .from('promotion_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promotion requests:', error);
    } else {
      setPromotionRequests(data || []);
    }
  };

  const handleUploadReport = async () => {
    if (!contentUrl.trim()) {
      toast.error('Укажите ссылку');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('reports')
      .insert({
        user_id: user!.id,
        report_type: reportType,
        content_url: contentUrl.trim(),
        description: description.trim() || null,
      });

    if (error) {
      console.error('Error creating report:', error);
      toast.error('Ошибка при загрузке отчёта');
    } else {
      toast.success('Отчёт успешно загружен');
      setIsUploadOpen(false);
      setContentUrl('');
      setDescription('');
      fetchReports();
    }

    setIsSubmitting(false);
  };

  const handleDeleteReport = async (id: string) => {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Ошибка при удалении');
    } else {
      toast.success('Отчёт удалён');
      fetchReports();
    }
  };

  const handlePromotionRequest = async () => {
    if (!profile) return;

    const rankOrder = ['newbie', 'test', 'main'] as const;
    const currentIndex = rankOrder.indexOf(profile.current_rank as typeof rankOrder[number]);
    
    if (currentIndex < 0 || currentIndex >= rankOrder.length - 1) {
      toast.error('Вы уже на максимальном ранге');
      return;
    }

    const nextRank = rankOrder[currentIndex + 1];
    setIsSubmitting(true);

    const { error } = await supabase
      .from('promotion_requests')
      .insert([{
        user_id: user!.id,
        current_rank: profile.current_rank as 'newbie' | 'test' | 'main' | 'high_staff',
        requested_rank: nextRank as 'newbie' | 'test' | 'main' | 'high_staff',
      }]);

    if (error) {
      console.error('Error creating promotion request:', error);
      toast.error('Ошибка при отправке заявки');
    } else {
      toast.success('Заявка на повышение отправлена');
      setIsPromotionOpen(false);
      fetchPromotionRequests();
    }

    setIsSubmitting(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background cyber-grid flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const timeUntilNextRank = profile.next_rank_deadline
    ? formatDistanceToNow(new Date(profile.next_rank_deadline), { locale: ru, addSuffix: true })
    : null;

  const pendingRequest = promotionRequests.find(r => r.status === 'pending');
  const canRequestPromotion = profile.current_rank !== 'main' && profile.current_rank !== 'high_staff' && !pendingRequest;

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary glow-text">LITHIUM</h1>
          
          <div className="flex items-center gap-4">
            {profile.is_admin && (
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Админ панель
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Card */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <DiscordAvatar
                discordId={profile.discord_id}
                avatarHash={profile.discord_avatar}
                username={profile.discord_username}
                size="xl"
              />

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {profile.discord_username}
                </h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                  <RankBadge rank={profile.current_rank} size="lg" />
                  {profile.is_admin && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/50">
                      Администратор
                    </span>
                  )}
                </div>

                {timeUntilNextRank && profile.current_rank !== 'main' && profile.current_rank !== 'high_staff' && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Время до следующего ранга: {timeUntilNextRank}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rank Progress */}
        {profile.current_rank !== 'high_staff' && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <RankProgress currentRank={profile.current_rank} />

              {canRequestPromotion && (
                <div className="mt-8 text-center">
                  <Dialog open={isPromotionOpen} onOpenChange={setIsPromotionOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                        <Send className="w-4 h-4 mr-2" />
                        Подать заявку на повышение
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-primary/30">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Заявка на повышение</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Вы подаёте заявку на повышение с <RankBadge rank={profile.current_rank} size="sm" /> до{' '}
                          <RankBadge 
                            rank={profile.current_rank === 'newbie' ? 'test' : 'main'} 
                            size="sm" 
                          />
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ваши отчёты будут рассмотрены администрацией.
                        </p>
                        <div className="flex gap-3 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => setIsPromotionOpen(false)}
                          >
                            Отмена
                          </Button>
                          <Button
                            onClick={handlePromotionRequest}
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Отправить
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {pendingRequest && (
                <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-lg text-center">
                  <p className="text-warning font-medium">Ваша заявка на повышение ожидает рассмотрения</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reports Section */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Мои отчёты ({reports.length})
            </CardTitle>
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Upload className="w-4 h-4 mr-2" />
                  Загрузить отчёт
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-primary/30">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Загрузить отчёт</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Тип отчёта</Label>
                    <RadioGroup
                      value={reportType}
                      onValueChange={(v) => setReportType(v as 'youtube_video' | 'screenshot')}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="youtube_video" id="youtube" />
                        <Label htmlFor="youtube" className="flex items-center gap-2 cursor-pointer">
                          <Youtube className="w-4 h-4 text-red-500" />
                          YouTube видео
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="screenshot" id="screenshot" />
                        <Label htmlFor="screenshot" className="flex items-center gap-2 cursor-pointer">
                          <Image className="w-4 h-4 text-blue-500" />
                          Скриншот
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="url" className="text-foreground">Ссылка</Label>
                    <Input
                      id="url"
                      value={contentUrl}
                      onChange={(e) => setContentUrl(e.target.value)}
                      placeholder={reportType === 'youtube_video' ? 'https://youtube.com/...' : 'https://...'}
                      className="mt-1 bg-input border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-foreground">Описание (опционально)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Краткое описание..."
                      className="mt-1 bg-input border-border"
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setIsUploadOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={handleUploadReport}
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Загрузить
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                У вас пока нет отчётов
              </p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      {report.report_type === 'youtube_video' ? (
                        <Youtube className="w-5 h-5 text-red-500" />
                      ) : (
                        <Image className="w-5 h-5 text-blue-500" />
                      )}
                      <div>
                        <p className="text-foreground font-medium truncate max-w-[300px]">
                          {report.description || report.content_url}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(report.content_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Promotion Requests History */}
        {promotionRequests.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                История заявок на повышение
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {promotionRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <RankBadge rank={request.current_rank as any} size="sm" />
                        <span className="text-muted-foreground">→</span>
                        <RankBadge rank={request.requested_rank as any} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </p>
                      {request.admin_comment && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Комментарий: {request.admin_comment}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'pending'
                          ? 'bg-warning/20 text-warning border border-warning/50'
                          : request.status === 'approved'
                          ? 'bg-success/20 text-success border border-success/50'
                          : 'bg-destructive/20 text-destructive border border-destructive/50'
                      }`}
                    >
                      {request.status === 'pending' && 'Ожидает'}
                      {request.status === 'approved' && 'Одобрено'}
                      {request.status === 'rejected' && 'Отклонено'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}