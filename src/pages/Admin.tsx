import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscordAvatar } from '@/components/DiscordAvatar';
import { RankBadge } from '@/components/RankBadge';
import { toast } from 'sonner';
import { 
  Loader2, 
  ArrowLeft, 
  Users, 
  Bell, 
  Search,
  Check,
  X,
  MessageSquare,
  FileText,
  Youtube,
  Image,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Profile {
  id: string;
  user_id: string;
  discord_id: string;
  discord_username: string;
  discord_avatar: string | null;
  current_rank: 'newbie' | 'test' | 'main' | 'high_staff';
  is_admin: boolean;
  created_at: string;
}

interface Report {
  id: string;
  user_id: string;
  report_type: string;
  content_url: string;
  description: string | null;
  created_at: string;
}

interface PromotionRequest {
  id: string;
  user_id: string;
  current_rank: string;
  requested_rank: string;
  status: string;
  admin_comment: string | null;
  created_at: string;
  profiles?: Profile;
}

export default function Admin() {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([]);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [memberReports, setMemberReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [comment, setComment] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!profile || !profile.is_admin)) {
      navigate('/profile');
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchMembers();
      fetchPromotionRequests();
    }
  }, [profile]);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('current_rank', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
    } else {
      setMembers(data || []);
    }
  };

  const fetchPromotionRequests = async () => {
    const { data, error } = await supabase
      .from('promotion_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching requests:', error);
    } else {
      // Fetch profiles for each request
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', request.user_id)
            .single();
          
          return { ...request, profiles: profileData };
        })
      );
      setPromotionRequests(requestsWithProfiles);
    }
  };

  const fetchMemberReports = async (userId: string) => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setMemberReports(data || []);
    }
  };

  const handleViewMember = async (member: Profile) => {
    setSelectedMember(member);
    await fetchMemberReports(member.user_id);
  };

  const handleProcessRequest = async (requestId: string, approve: boolean) => {
    setIsProcessing(true);
    setProcessingRequestId(requestId);

    const { error } = await supabase
      .from('promotion_requests')
      .update({
        status: approve ? 'approved' : 'rejected',
        admin_comment: comment.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error processing request:', error);
      toast.error('Ошибка при обработке заявки');
    } else {
      toast.success(approve ? 'Заявка одобрена' : 'Заявка отклонена');
      setComment('');
      fetchPromotionRequests();
    }

    setIsProcessing(false);
    setProcessingRequestId(null);
  };

  const filteredMembers = members.filter((member) =>
    member.discord_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !profile?.is_admin) {
    return (
      <div className="min-h-screen bg-background cyber-grid flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/profile')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <h1 className="text-2xl font-bold text-primary glow-text">Админ панель</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-secondary">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Заявки ({promotionRequests.length})
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Участники
            </TabsTrigger>
          </TabsList>

          {/* Promotion Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {promotionRequests.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Нет заявок на рассмотрение</p>
                </CardContent>
              </Card>
            ) : (
              promotionRequests.map((request) => (
                <Card key={request.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {request.profiles && (
                          <DiscordAvatar
                            discordId={request.profiles.discord_id}
                            avatarHash={request.profiles.discord_avatar}
                            username={request.profiles.discord_username}
                            size="md"
                          />
                        )}
                        <div>
                          <p className="font-bold text-foreground">
                            {request.profiles?.discord_username || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <RankBadge rank={request.current_rank as any} size="sm" />
                            <span className="text-muted-foreground">→</span>
                            <RankBadge rank={request.requested_rank as any} size="sm" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(request.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Комментарий..."
                            value={processingRequestId === request.id ? comment : ''}
                            onChange={(e) => {
                              setProcessingRequestId(request.id);
                              setComment(e.target.value);
                            }}
                            className="bg-input border-border w-48"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleProcessRequest(request.id, true)}
                            disabled={isProcessing}
                            className="bg-success hover:bg-success/90 text-success-foreground flex-1"
                          >
                            {isProcessing && processingRequestId === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Принять
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleProcessRequest(request.id, false)}
                            disabled={isProcessing}
                            variant="destructive"
                            className="flex-1"
                          >
                            {isProcessing && processingRequestId === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Отклонить
                              </>
                            )}
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => request.profiles && handleViewMember(request.profiles)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Смотреть отчёты
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>

            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => handleViewMember(member)}
                    >
                      <div className="flex items-center gap-3">
                        <DiscordAvatar
                          discordId={member.discord_id}
                          avatarHash={member.discord_avatar}
                          username={member.discord_username}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-foreground">{member.discord_username}</p>
                          <p className="text-xs text-muted-foreground">
                            С {format(new Date(member.created_at), 'dd.MM.yyyy', { locale: ru })}
                          </p>
                        </div>
                      </div>
                      <RankBadge rank={member.current_rank} size="sm" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Member Details Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="glass-card border-primary/30 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-3">
              {selectedMember && (
                <>
                  <DiscordAvatar
                    discordId={selectedMember.discord_id}
                    avatarHash={selectedMember.discord_avatar}
                    username={selectedMember.discord_username}
                    size="md"
                  />
                  <div>
                    <p>{selectedMember.discord_username}</p>
                    <RankBadge rank={selectedMember.current_rank} size="sm" />
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Отчёты ({memberReports.length})
            </h3>

            {memberReports.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Нет отчётов</p>
            ) : (
              <div className="space-y-2">
                {memberReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {report.report_type === 'youtube_video' ? (
                        <Youtube className="w-5 h-5 text-red-500" />
                      ) : (
                        <Image className="w-5 h-5 text-blue-500" />
                      )}
                      <div>
                        <p className="text-foreground text-sm truncate max-w-[300px]">
                          {report.description || report.content_url}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(report.content_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}