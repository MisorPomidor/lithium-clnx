import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ParticleBackground from '@/components/ParticleBackground';
import MemberCard, { Member } from '@/components/MemberCard';
import PromotionRequestCard, { PromotionRequest } from '@/components/PromotionRequestCard';
import ReportCard from '@/components/ReportCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { useReports } from '@/hooks/useReports';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  ArrowLeft,
  Users, 
  FileCheck, 
  Search,
  Crown,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const AdminPage: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuthContext();
  const { members, promotionRequests, approvePromotion, rejectPromotion, isLoading: membersLoading } = useMembers();
  const { allReports } = useReports();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleApprove = async (id: string, comment: string) => {
    if (!user) return;
    try {
      await approvePromotion(id, comment, user.id);
      toast({ title: 'Заявка одобрена', description: comment || 'Участник повышен' });
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось одобрить заявку', variant: 'destructive' });
    }
  };

  const handleReject = async (id: string, comment: string) => {
    if (!user) return;
    try {
      await rejectPromotion(id, comment, user.id);
      toast({ title: 'Заявка отклонена', description: comment || 'Заявка отклонена', variant: 'destructive' });
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отклонить заявку', variant: 'destructive' });
    }
  };

  if (authLoading || membersLoading) {
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

  if (!user || !user.isAdmin) return null;

  const filteredMembers = members.filter(m =>
    (m.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const memberReports = selectedMember
    ? allReports.filter(r => r.userId === selectedMember.id)
    : [];

  const roleColors: Record<string, string> = {
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="font-display text-xl font-bold gradient-text">Админ панель</h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-destructive/20 text-destructive border border-destructive/30">High Staff</Badge>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarImage src={user.avatar || undefined} alt={user.displayName || user.username} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-display">
                    {(user.displayName || user.username || "??").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:block">{user.displayName || user.username}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="members" className="space-y-6">
            <TabsList className="bg-muted/50 border border-border/50">
              <TabsTrigger value="members" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="w-4 h-4" /> Участники
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{members.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="promotions" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileCheck className="w-4 h-4" /> Заявки
                {promotionRequests.length > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 text-xs bg-warning text-warning-foreground">{promotionRequests.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Members tab */}
            <TabsContent value="members" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск участников..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-border/50 focus:border-primary"
                />
              </div>
              <Card className="bg-card/50 backdrop-blur-xl border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Список участников
                  </CardTitle>
                  <CardDescription>Все участники клана</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">Участники не найдены</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-3">
                        {filteredMembers.map(member => (
                          <MemberCard
                            key={member.id}
                            member={member}
                            onClick={() => setSelectedMember(member)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Promotions tab */}
            <TabsContent value="promotions" className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary" /> Заявки на повышение
                  </CardTitle>
                  <CardDescription>Рассмотрите заявки участников</CardDescription>
                </CardHeader>
                <CardContent>
                  {promotionRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <FileCheck className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">Нет заявок на рассмотрении</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {promotionRequests.map(request => {
                        const member = members.find(m => m.id === request.memberId);
                        return (
                          <PromotionRequestCard
                            key={request.id}
                            request={request}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onClick={() => {
                              if (member) setSelectedMember(member);
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </main>
      </div>

      {/* Member detail dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="bg-card border-border/50 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">Профиль участника</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/30">
                  <AvatarImage src={selectedMember.avatar || undefined} alt={selectedMember.displayName || selectedMember.username} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-display">
                    {(selectedMember.displayName || selectedMember.username || "??").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-display text-xl font-semibold">{selectedMember.displayName || selectedMember.username}</h3>
                  <p className="text-muted-foreground">@{selectedMember.displayName || selectedMember.username}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={cn("border", roleColors[selectedMember.rank])}>
                      <Crown className="w-3 h-3 mr-1" />
                      {selectedMember.rank}
                    </Badge>
                    <Badge variant="secondary">
                      <FileText className="w-3 h-3 mr-1" />
                      {selectedMember.reportsCount} отчётов
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Reports */}
              <div>
                <h4 className="font-display text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Отчёты участника
                </h4>
                {memberReports.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Отчётов не найдено</p>
                ) : (
                  <div className="space-y-2">
                    {memberReports.map(report => (
                      <ReportCard key={report.id} report={report} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
