import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type PromotionRequest = Database['public']['Tables']['promotion_requests']['Row'];

export interface Member {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  rank: 'Newbie' | 'Test' | 'Main';
  highestRole: string;
  reportsCount: number;
  hasPendingPromotion?: boolean;
}

export interface PromotionRequestData {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string | null;
  currentRank: 'Newbie' | 'Test';
  targetRank: 'Test' | 'Main';
  date: string;
  reportsCount: number;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
}

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('has_access', true)
        .order('display_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Fetch pending promotion requests to mark members
      const { data: pendingRequests, error: requestsError } = await supabase
        .from('promotion_requests')
        .select('user_id')
        .eq('status', 'pending');

      if (requestsError) {
        console.error('Error fetching pending requests:', requestsError);
      }

      const pendingUserIds = new Set(pendingRequests?.map(r => r.user_id) || []);

      // Fetch reports count for each member
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('user_id');

      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
      }

      const reportsCountMap = new Map<string, number>();
      reportsData?.forEach(r => {
        const count = reportsCountMap.get(r.user_id) || 0;
        reportsCountMap.set(r.user_id, count + 1);
      });

      const mappedMembers: Member[] = (profiles || []).map(profile => ({
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar_url,
        rank: (profile.rank as 'Newbie' | 'Test' | 'Main') || 'Newbie',
        highestRole: profile.highest_role || 'Newbie',
        reportsCount: reportsCountMap.get(profile.id) || 0,
        hasPendingPromotion: pendingUserIds.has(profile.id),
      }));

      setMembers(mappedMembers);
    } catch (error) {
      console.error('Error in fetchMembers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPromotionRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_requests')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promotion requests:', error);
        return;
      }

      // Get reports count for each requester
      const { data: reportsData } = await supabase
        .from('reports')
        .select('user_id');

      const reportsCountMap = new Map<string, number>();
      reportsData?.forEach(r => {
        const count = reportsCountMap.get(r.user_id) || 0;
        reportsCountMap.set(r.user_id, count + 1);
      });

      const mappedRequests: PromotionRequestData[] = (data || []).map(req => ({
        id: req.id,
        memberId: req.user_id,
        memberName: (req.profiles as any)?.display_name || 'Unknown',
        memberAvatar: (req.profiles as any)?.avatar_url || null,
        currentRank: req.current_rank as 'Newbie' | 'Test',
        targetRank: req.target_rank as 'Test' | 'Main',
        date: new Date(req.created_at!).toISOString().split('T')[0],
        reportsCount: reportsCountMap.get(req.user_id) || 0,
        status: req.status as 'pending' | 'approved' | 'rejected',
        comment: req.reviewer_comment || undefined,
      }));

      setPromotionRequests(mappedRequests);
    } catch (error) {
      console.error('Error in fetchPromotionRequests:', error);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchPromotionRequests();
  }, [fetchMembers, fetchPromotionRequests]);

  const approvePromotion = useCallback(async (id: string, comment: string, reviewerId: string) => {
    const request = promotionRequests.find(r => r.id === id);
    if (!request) return;

    const { error: updateRequestError } = await supabase
      .from('promotion_requests')
      .update({
        status: 'approved',
        reviewer_id: reviewerId,
        reviewer_comment: comment || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateRequestError) {
      console.error('Error approving request:', updateRequestError);
      throw updateRequestError;
    }

    // Update member's rank
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        rank: request.targetRank,
        highest_role: request.targetRank,
      })
      .eq('id', request.memberId);

    if (updateProfileError) {
      console.error('Error updating profile rank:', updateProfileError);
    }

    setPromotionRequests(prev => prev.filter(r => r.id !== id));
    await fetchMembers();
  }, [promotionRequests, fetchMembers]);

  const rejectPromotion = useCallback(async (id: string, comment: string, reviewerId: string) => {
    const { error } = await supabase
      .from('promotion_requests')
      .update({
        status: 'rejected',
        reviewer_id: reviewerId,
        reviewer_comment: comment || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }

    setPromotionRequests(prev => prev.filter(r => r.id !== id));
  }, []);

  const requestPromotion = useCallback(async (userId: string, currentRank: 'Newbie' | 'Test') => {
    const targetRank = currentRank === 'Newbie' ? 'Test' : 'Main';

    const { error } = await supabase
      .from('promotion_requests')
      .insert({
        user_id: userId,
        current_rank: currentRank,
        target_rank: targetRank,
      });

    if (error) {
      console.error('Error requesting promotion:', error);
      throw error;
    }

    await fetchPromotionRequests();
  }, [fetchPromotionRequests]);

  return {
    members,
    promotionRequests,
    isLoading,
    approvePromotion,
    rejectPromotion,
    requestPromotion,
    refetch: fetchMembers,
  };
};
