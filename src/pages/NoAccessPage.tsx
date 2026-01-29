import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ParticleBackground from '@/components/ParticleBackground';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, ExternalLink } from 'lucide-react';

const NoAccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <ParticleBackground />
      
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-2">
            LITHIUM CLNX
          </h1>
        </div>

        <Card className="bg-card/80 backdrop-blur-xl border-destructive/30">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
              <ShieldX className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="font-display text-xl text-destructive">
              Доступ запрещён
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              У вас нет необходимых ролей на Discord сервере для доступа к панели управления
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm text-muted-foreground">
                Чтобы получить доступ, присоединитесь к нашему Discord серверу и получите роль участника клана.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="glow" size="lg" className="w-full gap-2" asChild>
                <a href="https://discord.gg/lithium-clnx" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Присоединиться к Discord
                </a>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="w-full gap-2"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4" />
                Вернуться назад
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NoAccessPage;
