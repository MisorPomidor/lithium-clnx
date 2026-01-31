import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type MemberRank = Database['public']['Enums']['member_rank'];

type UserRole = 'admin' | 'player' | 'no-access';

export interface AuthUser {
  id: string;
  discordId: string | null;
  username: string;
  displayName: string;
  avatar: string | null;
  highestRole: string;
  rank: MemberRank;
  userRole: UserRole;
  isAdmin: boolean;
  hasAccess: boolean;
  daysUntilNextRank?: number;
}

// Determine user role based on rank column
const determineUserRole = (rank: MemberRank | null): UserRole => {
  if (!rank) return 'no-access';
  
  // Player check - Main, Test, Newbie
  if (rank === 'Main' || rank === 'Test' || rank === 'Newbie') {
    return 'player';
  }
  
  // Everything else - no access
  return 'no-access';
};

// Check if user is admin based on highest_role
const checkIsAdmin = (highestRole: string | null): boolean => {
  if (!highestRole) return false;
  const role = highestRole.toLowerCase().trim();
  return role === 'high staff' || role.includes('high staff');
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile by Discord ID from database
  const fetchProfileByDiscordId = useCallback(async (discordId: string): Promise<AuthUser | null> => {
    try {
      console.log('Searching profile by Discord ID:', discordId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('discord_id', discordId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!profile) {
        console.log('No profile found for Discord ID:', discordId);
        return null;
      }

      console.log('Profile found:', profile);
      
      const userRole = determineUserRole(profile.rank);
      const isAdmin = checkIsAdmin(profile.highest_role);
      
      return {
        id: profile.id,
        discordId: profile.discord_id,
        username: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar_url,
        highestRole: profile.highest_role || 'Newbie',
        rank: profile.rank || 'Newbie',
        userRole: isAdmin ? 'admin' : userRole,
        isAdmin,
        hasAccess: isAdmin || userRole !== 'no-access',
        daysUntilNextRank: profile.days_until_next_rank || undefined,
      };
    } catch (error) {
      console.error('Error in fetchProfileByDiscordId:', error);
      return null;
    }
  }, []);

  // Extract Discord ID from session user metadata
  const getDiscordIdFromSession = (currentSession: Session | null): string | null => {
    if (!currentSession?.user) return null;
    
    const metadata = currentSession.user.user_metadata;
    console.log('User metadata:', metadata);
    
    // Try provider_id first (most common for Discord OAuth)
    if (metadata?.provider_id) {
      return metadata.provider_id;
    }
    
    // Try sub (subject claim)
    if (metadata?.sub) {
      return metadata.sub;
    }
    
    // Try custom_claims.global_name or id
    if (metadata?.id) {
      return metadata.id;
    }
    
    console.log('Could not find Discord ID in metadata');
    return null;
  };

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    
    const discordId = getDiscordIdFromSession(session);
    if (discordId) {
      const profile = await fetchProfileByDiscordId(discordId);
      setUser(profile);
    }
  }, [session, fetchProfileByDiscordId]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(async () => {
            const discordId = getDiscordIdFromSession(currentSession);
            console.log('Extracted Discord ID:', discordId);
            
            if (discordId) {
              const profile = await fetchProfileByDiscordId(discordId);
              setUser(profile);
            } else {
              // No Discord ID found - user has no access
              setUser(null);
            }
            setIsLoading(false);
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
        const discordId = getDiscordIdFromSession(existingSession);
        console.log('Existing session Discord ID:', discordId);
        
        if (discordId) {
          fetchProfileByDiscordId(discordId).then((profile) => {
            setUser(profile);
            setIsLoading(false);
          });
        } else {
          setUser(null);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileByDiscordId]);

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
