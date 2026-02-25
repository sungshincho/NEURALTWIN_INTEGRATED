/**
 * useSpaceTextures.ts
 *
 * Storage의 space-textures 폴더에서 낮/밤 텍스처 로드
 * - Space 모델에 적용할 텍스처 URL 반환
 * - 파일명 규칙: *_day.png, *_night.png
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SpaceTextures {
  dayTextureUrl: string | null;
  nightTextureUrl: string | null;
}

interface UseSpaceTexturesOptions {
  userId?: string;
  storeId?: string;
  enabled?: boolean;
}

export function useSpaceTextures({
  userId,
  storeId,
  enabled = true,
}: UseSpaceTexturesOptions) {
  const [textures, setTextures] = useState<SpaceTextures>({
    dayTextureUrl: null,
    nightTextureUrl: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId || !storeId) {
      setTextures({ dayTextureUrl: null, nightTextureUrl: null });
      return;
    }

    const loadSpaceTextures = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // space-textures 폴더의 파일 목록 조회
        const basePath = `${userId}/${storeId}/space-textures`;

        const { data: files, error: listError } = await supabase.storage
          .from('3d-models')
          .list(basePath, {
            sortBy: { column: 'name', order: 'asc' },
          });

        if (listError) {
          // 폴더가 없으면 빈 결과 반환 (정상 케이스)
          if (listError.message.includes('not found')) {
            console.log('[useSpaceTextures] Textures folder not found, using defaults');
            setTextures({ dayTextureUrl: null, nightTextureUrl: null });
            return;
          }
          throw listError;
        }

        if (!files || files.length === 0) {
          console.log('[useSpaceTextures] No texture files found');
          setTextures({ dayTextureUrl: null, nightTextureUrl: null });
          return;
        }

        // 이미지 파일만 필터링 (jpg, png, webp)
        const imageFiles = files.filter((f) =>
          /\.(jpg|jpeg|png|webp)$/i.test(f.name)
        );

        // 낮/밤 텍스처 찾기
        let dayTextureUrl: string | null = null;
        let nightTextureUrl: string | null = null;

        for (const file of imageFiles) {
          const fileName = file.name.toLowerCase();
          const filePath = `${basePath}/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('3d-models')
            .getPublicUrl(filePath);

          // space_day 또는 _day 패턴 체크
          if (fileName.includes('_day') || fileName.includes('day_') || fileName.startsWith('day')) {
            dayTextureUrl = publicUrl;
            console.log('[useSpaceTextures] Found day texture:', fileName);
          }
          // space_night 또는 _night 패턴 체크
          else if (fileName.includes('_night') || fileName.includes('night_') || fileName.startsWith('night')) {
            nightTextureUrl = publicUrl;
            console.log('[useSpaceTextures] Found night texture:', fileName);
          }
        }

        setTextures({
          dayTextureUrl,
          nightTextureUrl,
        });

        console.log('[useSpaceTextures] Loaded textures:', {
          dayTextureUrl: dayTextureUrl ? 'found' : 'not found',
          nightTextureUrl: nightTextureUrl ? 'found' : 'not found',
        });

      } catch (err: any) {
        console.error('[useSpaceTextures] Failed to load textures:', err);
        setError(err.message);
        setTextures({ dayTextureUrl: null, nightTextureUrl: null });
      } finally {
        setIsLoading(false);
      }
    };

    loadSpaceTextures();
  }, [userId, storeId, enabled]);

  // isDayMode에 따른 현재 텍스처 URL 반환
  const getActiveTextureUrl = useMemo(() => {
    return (isDayMode: boolean): string | null => {
      return isDayMode ? textures.dayTextureUrl : textures.nightTextureUrl;
    };
  }, [textures]);

  return {
    textures,
    isLoading,
    error,
    getActiveTextureUrl,
    // 편의 메서드
    dayTextureUrl: textures.dayTextureUrl,
    nightTextureUrl: textures.nightTextureUrl,
  };
}
