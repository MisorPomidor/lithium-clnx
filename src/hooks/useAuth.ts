import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthUser {
  id: string;
  discordId: string | null;
  username: string;
  displayName: string;
  avatar: string | null;
  highestRole: string;
  rank: 'Newbie' | 'Test' | 'Main';
  isHighStaff: boolean;
  hasAccess: boolean;
  daysUntilNextRank?: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!profile) {
        return null;
      }

      return {
        id: profile.id,
        discordId: profile.discord_id,
        username: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar_url,
        highestRole: profile.highest_role || 'Newbie',
        rank: (profile.rank as 'Newbie' | 'Test' | 'Main') || 'Newbie',
        isHighStaff: profile.is_high_staff || false,
        hasAccess: profile.has_access || false,
        daysUntilNextRank: profile.days_until_next_rank || undefined,
      };
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchProfile(currentSession.user.id).then(profile => {
              setUser(profile);
              setIsLoading(false);
            });
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).then(profile => {
          setUser(profile);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const loginWithDiscord = useCallback(async () => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: redirectUrl,
        scopes: 'identify guilds guilds.members.read',
      },
    });

    if (error) {
      console.error('Discord login error:', error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      setUser(profile);
    }
  }, [session, fetchProfile]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    loginWithDiscord,
    logout,
    refreshProfile,
  };
};
