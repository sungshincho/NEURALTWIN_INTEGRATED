/**
 * Storage 파일 로더
 */

import { supabase } from '@/integrations/supabase/client';
import { parseCSV, parseJSON } from './parser';
import { buildStoragePath, detectFileType } from './paths';
import type { 
  StorageBucket, 
  DataFileType, 
  LoadOptions, 
  LoadResult,
  StorageFileMetadata,
  DataFileMap
} from './types';

/**
 * Storage에서 파일 다운로드 및 파싱
 */
export async function loadFileFromStorage<T = any[]>(
  userId: string,
  storeId: string,
  fileName: string,
  bucket: StorageBucket = 'store-data',
  options: LoadOptions = {}
): Promise<LoadResult<T>> {
  const startTime = Date.now();
  
  try {
    const { path } = buildStoragePath(userId, storeId, fileName, bucket);
    
    // Storage에서 다운로드
    const { data: fileBlob, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) {
      throw error;
    }
    
    // 파일 타입별 파싱
    const fileType = detectFileType(fileName);
    const text = await fileBlob.text();
    let parsedData: any;
    
    switch (fileType) {
      case 'csv':
        parsedData = parseCSV(text);
        break;
      case 'json':
        parsedData = parseJSON(text);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    return {
      data: parsedData as T,
      source: 'storage',
      loadedAt: Date.now(),
    };
    
  } catch (error: any) {
    // 파일이 없는 경우는 정상적인 상황이므로 조용히 처리
    if (error.message !== '{}' && error.name !== 'StorageUnknownError') {
      console.error(`Failed to load ${fileName}:`, error);
    }
    
    return {
      data: [] as T,
      source: 'storage',
      loadedAt: Date.now(),
      error: error.message || 'File not found'
    };
  }
}


/**
 * 특정 데이터 타입 로드
 */
export async function loadDataFile<K extends DataFileType>(
  userId: string,
  storeId: string,
  fileType: K,
  options: LoadOptions = {}
): Promise<LoadResult<DataFileMap[K]>> {
  const fileName = `${fileType}.csv`;
  return loadFileFromStorage<DataFileMap[K]>(
    userId,
    storeId,
    fileName,
    'store-data',
    options
  );
}

/**
 * 여러 파일 동시 로드
 */
export async function loadMultipleFiles<K extends DataFileType>(
  userId: string,
  storeId: string,
  fileTypes: K[],
  options: LoadOptions = {}
): Promise<Partial<Record<K, LoadResult<DataFileMap[K]>>>> {
  const results = await Promise.all(
    fileTypes.map(type => loadDataFile(userId, storeId, type, options))
  );
  
  const dataMap: Partial<Record<K, LoadResult<DataFileMap[K]>>> = {};
  fileTypes.forEach((type, index) => {
    dataMap[type] = results[index];
  });
  
  return dataMap;
}

/**
 * Storage 버킷의 모든 파일 목록 조회
 */
export async function listStorageFiles(
  userId: string,
  storeId: string,
  bucket: StorageBucket = 'store-data'
): Promise<StorageFileMetadata[]> {
  const basePath = `${userId}/${storeId}`;
  
  const { data: files, error } = await supabase.storage
    .from(bucket)
    .list(basePath, {
      sortBy: { column: 'created_at', order: 'desc' }
    });
  
  if (error) {
    console.error('Failed to list files:', error);
    return [];
  }
  
  if (!files) return [];
  
  return files
    .filter(f => f.id) // 파일만 (폴더 제외)
    .map(file => {
      const filePath = `${basePath}/${file.name}`;
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return {
        name: file.name,
        path: filePath,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        bucket,
        publicUrl
      };
    });
}

/**
 * Storage 파일 삭제
 */
export async function deleteStorageFile(
  path: string,
  bucket: StorageBucket = 'store-data'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * 파일 존재 여부 확인
 */
export async function checkFileExists(
  userId: string,
  storeId: string,
  fileName: string,
  bucket: StorageBucket = 'store-data'
): Promise<boolean> {
  const { path } = buildStoragePath(userId, storeId, fileName, bucket);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(`${userId}/${storeId}`, {
      search: fileName
    });
  
  if (error || !data) return false;
  
  return data.some(f => f.name === fileName);
}
