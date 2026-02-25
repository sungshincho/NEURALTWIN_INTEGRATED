import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UploadSession {
  id: string;
  total_files: number;
  completed_files: number;
  failed_files: number;
  status: 'active' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
}

export function useUploadSession(storeId?: string) {
  const { user, orgId } = useAuth();
  const [session, setSession] = useState<UploadSession | null>(null);
  const [loading, setLoading] = useState(false);

  // 활성 세션 생성 또는 가져오기
  const getOrCreateSession = async () => {
    if (!user || !storeId || !orgId) return null;

    // 활성 세션 조회
    const { data: existingSession } = await supabase
      .from('upload_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('store_id', storeId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      const mappedSession: UploadSession = {
        id: existingSession.id,
        total_files: existingSession.total_files,
        completed_files: existingSession.processed_files || 0,
        failed_files: 0,
        status: existingSession.status as 'active' | 'completed' | 'failed',
        started_at: existingSession.created_at,
        completed_at: existingSession.updated_at
      };
      setSession(mappedSession);
      return mappedSession;
    }

    // 새 세션 생성
    const { data: newSession } = await supabase
      .from('upload_sessions')
      .insert({
        user_id: user.id,
        org_id: orgId,
        store_id: storeId,
        total_files: 0,
        completed_files: 0,
        failed_files: 0,
        status: 'active'
      })
      .select()
      .single();

    if (newSession) {
      const mappedSession: UploadSession = {
        id: newSession.id,
        total_files: 0,
        completed_files: 0,
        failed_files: 0,
        status: 'active',
        started_at: newSession.created_at,
      };
      setSession(mappedSession);
      return mappedSession;
    }

    return null;
  };

  // 세션 업데이트
  const updateSession = async (updates: Partial<UploadSession>) => {
    if (!session) return;

    const { data } = await supabase
      .from('upload_sessions')
      .update(updates)
      .eq('id', session.id)
      .select()
      .single();

    if (data) {
      const mappedSession: UploadSession = {
        id: data.id,
        total_files: data.total_files,
        completed_files: data.processed_files || 0,
        failed_files: 0,
        status: data.status as 'active' | 'completed' | 'failed',
        started_at: data.created_at,
        completed_at: data.updated_at
      };
      setSession(mappedSession);
    }
  };

  // 파일 업로드 시작
  const startFileUpload = async () => {
    if (!session) {
      await getOrCreateSession();
    }
    if (session) {
      await updateSession({
        total_files: session.total_files + 1
      });
    }
  };

  // 파일 업로드 완료
  const completeFileUpload = async (success: boolean) => {
    if (!session) return;

    await updateSession({
      completed_files: session.completed_files + (success ? 1 : 0),
      failed_files: session.failed_files + (success ? 0 : 1)
    });

    // 모든 파일이 완료되었는지 확인
    const totalProcessed = session.completed_files + session.failed_files + 1;
    if (totalProcessed >= session.total_files) {
      await updateSession({
        status: session.failed_files > 0 ? 'failed' : 'completed',
        completed_at: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    if (user && storeId) {
      getOrCreateSession();
    }
  }, [user, storeId]);

  return {
    session,
    loading,
    getOrCreateSession,
    updateSession,
    startFileUpload,
    completeFileUpload
  };
}
