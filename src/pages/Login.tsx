import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleCallback(code);
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/profile');
    }
  }, [user, loading, navigate]);

  const handleCallback = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const redirectUri = `${window.location.origin}/login`;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/discord-auth?action=callback`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'not_member') {
          setError('Вы не являетесь участником Discord сервера');
        } else if (result.error === 'no_role') {
          setError('У вас нет доступа. Необходима роль на сервере.');
        } else {
          setError(result.message || 'Ошибка авторизации');
        }
        setIsLoading(false);
        return;
      }

      // Navigate to verification URL
      if (result.verification_url) {
        window.location.href = result.verification_url;
      } else {
        toast.success('Успешный вход!');
        navigate('/profile');
      }
    } catch (err) {
      console.error('Callback error:', err);
      setError('Произошла ошибка при авторизации');
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const redirectUri = `${window.location.origin}/login`;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/discord-auth?action=get_oauth_url&redirect_uri=${encodeURIComponent(redirectUri)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Не удалось получить ссылку для авторизации');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Произошла ошибка');
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background cyber-grid flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary glow-text mb-2">LITHIUM</h1>
          <p className="text-muted-foreground">Панель управления</p>
        </div>

        {/* Shield icon */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 animate-pulse-glow">
          <Shield className="w-10 h-10 text-primary" />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Login button */}
        <Button
          onClick={handleDiscordLogin}
          disabled={isLoading}
          className="w-full h-14 text-lg font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white transition-all duration-300"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Войти через Discord
            </>
          )}
        </Button>

        <p className="mt-6 text-sm text-muted-foreground">
          Для входа необходима роль на Discord сервере
        </p>
      </div>
    </div>
  );
}