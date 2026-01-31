import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Report = Database['public']['Tables']['reports']['Row'];

export interface ReportData {
  id: string;
  userId: string;
  type: 'video' | 'screenshot';
  url: string;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

const mapReportToData = (report: Report): ReportData => ({
  id: report.id,
  userId: report.user_id,
  type: report.type as 'video' | 'screenshot',
  url: report.url,
  description: report.description,
  date: new Date(report.created_at!).toISOString().split('T')[0],
  status: report.status as 'pending' | 'approved' | 'rejected',
});

export const useReports = (userId?: string) => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [allReports, setAllReports] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserReports = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      setReports(data?.map(mapReportToData) || []);
    } catch (error) {
      console.error('Error in fetchUserReports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchAllReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all reports:', error);
        return;
      }

      setAllReports(data?.map(mapReportToData) || []);
    } catch (error) {
      console.error('Error in fetchAllReports:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserReports();
    fetchAllReports();
  }, [fetchUserReports, fetchAllReports]);

  const addReport = useCallback(async (report: { type: 'video' | 'screenshot'; url: string; description: string }) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        type: report.type,
        url: report.url,
        description: report.description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding report:', error);
      throw error;
    }

    const newReport = mapReportToData(data);
    setReports(prev => [newReport, ...prev]);
    setAllReports(prev => [newReport, ...prev]);
    
    return newReport;
  }, [userId]);

  const updateReportStatus = useCallback(async (reportId: string, status: 'approved' | 'rejected', comment?: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ 
        status,
        reviewer_comment: comment,
      })
      .eq('id', reportId);

    if (error) {
      console.error('Error updating report:', error);
      throw error;
    }

    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    setAllReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  }, []);

  return {
    reports,
    allReports,
    isLoading,
    addReport,
    updateReportStatus,
    refetch: fetchUserReports,
  };
};
