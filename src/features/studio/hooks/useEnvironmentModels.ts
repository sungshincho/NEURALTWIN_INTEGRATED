/**
 * useEnvironmentModels.ts
 *
 * Storage의 environment 폴더에서 GLB 모델을 로드
 * - 레이어 UI에 표시되지 않음
 * - 렌더씬(조명/포스트프로세싱) 영향 없이 baked 텍스처로 표시
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EnvironmentModel {
  url: string;
  name: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  isBaked?: boolean;
}

interface UseEnvironmentModelsOptions {
  userId?: string;
  storeId?: string;
  enabled?: boolean;
  /** 낮/밤 모드 (true = 낮, false = 밤) */
  isDayMode?: boolean;
}

export function useEnvironmentModels({
  userId,
  storeId,
  enabled = true,
  isDayMode = true,  // 기본값: 낮
}: UseEnvironmentModelsOptions) {
  const [models, setModels] = useState<EnvironmentModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId || !storeId) {
      setModels([]);
      return;
    }

    const loadEnvironmentModels = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // environment 폴더의 파일 목록 조회
        const basePath = `${userId}/${storeId}/environment`;

        const { data: files, error: listError } = await supabase.storage
          .from('3d-models')
          .list(basePath, {
            sortBy: { column: 'name', order: 'asc' },
          });

        if (listError) {
          // 폴더가 없으면 빈 배열 반환 (정상 케이스)
          if (listError.message.includes('not found')) {
            setModels([]);
            return;
          }
          throw listError;
        }

        if (!files || files.length === 0) {
          setModels([]);
          return;
        }

        // GLB/GLTF 파일만 필터링
        const glbFiles = files.filter(
          (f) => f.name.endsWith('.glb') || f.name.endsWith('.gltf')
        );

        // 시간대에 따른 파일 필터링
        // 파일명 규칙: environment_day_baked.glb, environment_night_baked.glb
        const timeFilteredFiles = glbFiles.filter((file) => {
          const fileName = file.name.toLowerCase();

          // _day_ 또는 _night_ 패턴이 있는 파일만 시간대 필터링 적용
          const hasDayPattern = fileName.includes('_day_') || fileName.includes('_day.');
          const hasNightPattern = fileName.includes('_night_') || fileName.includes('_night.');

          // 시간대 패턴이 없는 파일은 항상 포함 (기존 호환성)
          if (!hasDayPattern && !hasNightPattern) {
            return true;
          }

          // 시간대에 맞는 파일만 포함
          if (isDayMode) {
            return hasDayPattern;
          } else {
            return hasNightPattern;
          }
        });

        // Public URL 생성
        const environmentModels: EnvironmentModel[] = timeFilteredFiles.map((file) => {
          const filePath = `${basePath}/${file.name}`;
          const {
            data: { publicUrl },
          } = supabase.storage.from('3d-models').getPublicUrl(filePath);

          // 파일명에 _baked가 있으면 isBaked = true
          const isBaked = file.name.toLowerCase().includes('_baked') ||
                         file.name.toLowerCase().includes('baked');

          return {
            url: publicUrl,
            name: file.name.replace(/\.(glb|gltf)$/i, ''),
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            isBaked: isBaked,
          };
        });

        setModels(environmentModels);
      } catch (err: any) {
        console.error('Failed to load environment models:', err);
        setError(err.message);
        setModels([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEnvironmentModels();
  }, [userId, storeId, enabled, isDayMode]);  // isDayMode 의존성 추가

  return { models, isLoading, error };
}
