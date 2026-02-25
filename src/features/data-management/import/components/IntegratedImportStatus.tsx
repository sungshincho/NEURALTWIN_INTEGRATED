/**
 * 통합 데이터 임포트 상태 및 초기화 관리 컴포넌트
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Database, HardDrive, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useClearCache } from "@/hooks/useClearCache";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface IntegratedImportStatusProps {
  storeId?: string;
}

export function IntegratedImportStatus({ storeId }: IntegratedImportStatusProps) {
  const { user } = useAuth();
  const { clearAllCache } = useClearCache();
  const [isCleaningStorage, setIsCleaningStorage] = useState(false);
  const [isCleaningDatabase, setIsCleaningDatabase] = useState(false);

  const cleanupDatabaseRecords = async (userId: string, storeId?: string) => {
    const applyStoreFilter = (query: any) => {
      if (storeId) {
        return query.eq("store_id", storeId);
      }
      return query;
    };

    // 1. 관계 삭제
    const { error: relError } = await applyStoreFilter(
      supabase.from("graph_relations").delete().eq("user_id", userId)
    );
    if (relError) {
      throw new Error(`graph_relations 삭제 실패: ${relError.message}`);
    }

    // 2. 엔티티 삭제
    const { error: entError } = await applyStoreFilter(
      supabase.from("graph_entities").delete().eq("user_id", userId)
    );
    if (entError) {
      throw new Error(`graph_entities 삭제 실패: ${entError.message}`);
    }

    // 3. 3D 씬 삭제
    const { error: sceneError } = await applyStoreFilter(
      supabase.from("store_scenes").delete().eq("user_id", userId)
    );
    if (sceneError) {
      throw new Error(`store_scenes 삭제 실패: ${sceneError.message}`);
    }

    // 4. 임포트 기록 삭제
    const { error: importError } = await applyStoreFilter(
      supabase.from("user_data_imports").delete().eq("user_id", userId)
    );
    if (importError) {
      throw new Error(`user_data_imports 삭제 실패: ${importError.message}`);
    }

    // 5. KPI 및 퍼널 데이터 삭제
    // 레거시 dashboard_kpis 삭제
    const { error: kpiError } = await applyStoreFilter(
      supabase.from("dashboard_kpis").delete().eq("user_id", userId)
    );
    if (kpiError) {
      throw new Error(`dashboard_kpis 삭제 실패: ${kpiError.message}`);
    }

    // L3 daily_kpis_agg 삭제 (3-Layer Architecture 표준 테이블)
    if (storeId) {
      const { error: dailyKpiError } = await supabase
        .from("daily_kpis_agg")
        .delete()
        .eq("store_id", storeId);
      if (dailyKpiError) {
        throw new Error(`daily_kpis_agg 삭제 실패: ${dailyKpiError.message}`);
      }
    }

    const { error: funnelError } = await applyStoreFilter(
      supabase.from("funnel_metrics").delete().eq("user_id", userId)
    );
    if (funnelError) {
      throw new Error(`funnel_metrics 삭제 실패: ${funnelError.message}`);
    }

    // 6. 분석/추천 및 WiFi 데이터 삭제
    const { error: analysisError } = await applyStoreFilter(
      supabase.from("analysis_history").delete().eq("user_id", userId)
    );
    if (analysisError) {
      throw new Error(`analysis_history 삭제 실패: ${analysisError.message}`);
    }

    const { error: aiRecError } = await applyStoreFilter(
      supabase.from("ai_recommendations").delete().eq("user_id", userId)
    );
    if (aiRecError) {
      throw new Error(`ai_recommendations 삭제 실패: ${aiRecError.message}`);
    }

    const { error: wifiTrackingError } = await applyStoreFilter(
      supabase.from("wifi_tracking").delete().eq("user_id", userId)
    );
    if (wifiTrackingError) {
      throw new Error(`wifi_tracking 삭제 실패: ${wifiTrackingError.message}`);
    }
  };

  const handleCleanupStorage = async () => {
    if (!user) return;
    
    setIsCleaningStorage(true);
    try {
      // Storage 전체 삭제 (store-data, 3d-models)
      const { data: storeDataFiles } = await supabase.storage
        .from('store-data')
        .list(user.id);

      const { data: modelFiles } = await supabase.storage
        .from('3d-models')
        .list(user.id);

      if (storeDataFiles && storeDataFiles.length > 0) {
        const storeDataPaths = storeDataFiles.map(file => `${user.id}/${file.name}`);
        await supabase.storage.from('store-data').remove(storeDataPaths);
      }

      if (modelFiles && modelFiles.length > 0) {
        const modelPaths = modelFiles.map(file => `${user.id}/${file.name}`);
        await supabase.storage.from('3d-models').remove(modelPaths);
      }

      // 캐시 초기화
      clearAllCache();

      toast.success('스토리지가 완전히 초기화되었습니다');
    } catch (error: any) {
      console.error('Storage cleanup error:', error);
      toast.error('스토리지 초기화 실패: ' + error.message);
    } finally {
      setIsCleaningStorage(false);
    }
  };

  const handleCleanupDatabase = async () => {
    if (!user) return;
    
    setIsCleaningDatabase(true);
    try {
      await cleanupDatabaseRecords(user.id, storeId);

      // 캐시 초기화
      clearAllCache();

      toast.success('데이터베이스가 완전히 초기화되었습니다');
    } catch (error: any) {
      console.error('Database cleanup error:', error);
      toast.error('데이터베이스 초기화 실패: ' + (error.message ?? '알 수 없는 오류'));
    } finally {
      setIsCleaningDatabase(false);
    }
  };

  const handleCompleteReset = async () => {
    if (!user) return;

    setIsCleaningStorage(true);
    setIsCleaningDatabase(true);

    try {
      // 1. 데이터베이스 초기화
      await cleanupDatabaseRecords(user.id, storeId);

      // 2. 스토리지 초기화
      const { data: storeDataFiles } = await supabase.storage
        .from('store-data')
        .list(user.id);

      const { data: modelFiles } = await supabase.storage
        .from('3d-models')
        .list(user.id);

      if (storeDataFiles && storeDataFiles.length > 0) {
        const storeDataPaths = storeDataFiles.map(file => `${user.id}/${file.name}`);
        await supabase.storage.from('store-data').remove(storeDataPaths);
      }

      if (modelFiles && modelFiles.length > 0) {
        const modelPaths = modelFiles.map(file => `${user.id}/${file.name}`);
        await supabase.storage.from('3d-models').remove(modelPaths);
      }

      // 3. React Query 캐시 완전 초기화
      clearAllCache();

      // 4. 페이지 새로고침으로 완전 초기화 보장
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      toast.success('모든 데이터가 완전히 초기화되었습니다. 페이지를 새로고침합니다...');
    } catch (error: any) {
      console.error('Complete reset error:', error);
      toast.error('완전 초기화 실패: ' + (error.message ?? '알 수 없는 오류'));
    } finally {
      setIsCleaningStorage(false);
      setIsCleaningDatabase(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          데이터 관리 및 초기화
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={isCleaningStorage}
              >
                <HardDrive className="mr-2 h-4 w-4" />
                스토리지 초기화 (파일만 삭제)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>스토리지 초기화</AlertDialogTitle>
                <AlertDialogDescription>
                  업로드된 모든 CSV 파일과 3D 모델 파일이 삭제됩니다.
                  데이터베이스 레코드는 유지됩니다.
                  계속하시겠습니까?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanupStorage}>
                  초기화
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={isCleaningDatabase}
              >
                <Database className="mr-2 h-4 w-4" />
                데이터베이스 초기화 (테이블 데이터만 삭제)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>데이터베이스 초기화</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div>
                    <p>다음 테이블의 모든 데이터가 삭제됩니다:</p>
                    <ul className="mt-2 list-disc list-inside text-sm">
                      <li>user_data_imports (임포트 기록)</li>
                      <li>graph_entities (엔티티)</li>
                      <li>graph_relations (관계)</li>
                      <li>store_scenes (3D 씬)</li>
                      <li>dashboard_kpis (KPI 데이터)</li>
                    </ul>
                    <p>스토리지 파일은 유지됩니다. 계속하시겠습니까?</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanupDatabase}>
                  초기화
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full justify-start"
                disabled={isCleaningStorage || isCleaningDatabase}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                완전 초기화 (모든 데이터 삭제)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ 완전 초기화</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2">
                    <p className="font-semibold text-destructive">
                      스토리지와 데이터베이스의 모든 데이터가 영구적으로 삭제됩니다.
                    </p>
                    <p>삭제되는 항목:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>모든 업로드 파일 (CSV, 3D 모델)</li>
                      <li>모든 데이터베이스 레코드</li>
                      <li>모든 엔티티 및 관계</li>
                      <li>모든 KPI 데이터</li>
                      <li>모든 3D 씬 설정</li>
                    </ul>
                    <p className="text-destructive font-semibold mt-3">
                      이 작업은 되돌릴 수 없습니다!
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleCompleteReset}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  모두 삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={clearAllCache}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            캐시만 초기화 (데이터 유지)
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-2">💡 초기화 옵션 가이드:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>스토리지 초기화</strong>: 파일만 삭제, DB 레코드 유지</li>
            <li><strong>데이터베이스 초기화</strong>: DB 레코드만 삭제, 파일 유지</li>
            <li><strong>완전 초기화</strong>: 모든 데이터 + 캐시 삭제 + 페이지 새로고침</li>
            <li><strong>캐시 초기화</strong>: React Query 캐시만 초기화</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
