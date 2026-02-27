import { supabase } from "@/integrations/supabase/client";

/**
 * 3D 모델 파일을 Supabase Storage에 업로드
 */
export async function upload3DModel(
  userId: string,
  storeId: string,
  file: File
): Promise<{ success: boolean; error?: string; publicUrl?: string }> {
  try {
    // 파일 확장자 검증
    const validExtensions = ['.glb', '.gltf'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      return {
        success: false,
        error: '지원되지 않는 파일 형식입니다. .glb 또는 .gltf 파일만 업로드 가능합니다.'
      };
    }

    // 파일 크기 검증 (최대 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: '파일 크기가 너무 큽니다. 최대 20MB까지 업로드 가능합니다.'
      };
    }

    // Storage 경로: userId/storeId/filename
    const filePath = `${userId}/${storeId}/${file.name}`;

    // 파일 업로드
    const { error: uploadError } = await supabase.storage
      .from('3d-models')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // 같은 이름 파일이 있으면 에러
      });

    if (uploadError) {
      if (uploadError.message.includes('already exists')) {
        return {
          success: false,
          error: '같은 이름의 파일이 이미 존재합니다.'
        };
      }
      return {
        success: false,
        error: uploadError.message
      };
    }

    // Public URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('3d-models')
      .getPublicUrl(filePath);

    return {
      success: true,
      publicUrl
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

/**
 * Storage에서 3D 모델 파일 삭제
 */
export async function delete3DModel(
  userId: string,
  storeId: string,
  fileName: string
): Promise<{ success: boolean; error?: string; publicUrl?: string }> {
  try {
    const filePath = `${userId}/${storeId}/${fileName}`;
    
    // 삭제 전에 public URL 저장 (cleanup용)
    const { data: urlData } = supabase.storage
      .from('3d-models')
      .getPublicUrl(filePath);

    const { error } = await supabase.storage
      .from('3d-models')
      .remove([filePath]);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true, publicUrl: urlData?.publicUrl };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

/**
 * 파일명에서 3D 모델 정보 추출 (파일명 파싱)
 */
export function parseModelFileName(fileName: string): {
  displayName: string;
  extension: string;
} {
  const lastDotIndex = fileName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.slice(lastDotIndex) : '';
  
  return {
    displayName: nameWithoutExt,
    extension
  };
}
