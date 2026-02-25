/**
 * Storage 경로 관리 유틸리티
 */

import type { StorageBucket, StoragePath, DataFileType } from './types';

/**
 * Storage 경로 생성
 */
export function buildStoragePath(
  userId: string,
  storeId: string,
  fileName: string,
  bucket: StorageBucket = 'store-data'
): StoragePath {
  return {
    bucket,
    path: `${userId}/${storeId}/${fileName}`,
    fileName
  };
}

/**
 * 3D 모델 경로 생성
 */
export function build3DModelPath(
  userId: string,
  storeId: string,
  modelFileName: string
): StoragePath {
  return buildStoragePath(userId, storeId, modelFileName, '3d-models');
}

/**
 * 데이터 파일 경로 생성
 */
export function buildDataFilePath(
  userId: string,
  storeId: string,
  fileType: DataFileType
): StoragePath {
  const fileName = `${fileType}.csv`;
  return buildStoragePath(userId, storeId, fileName, 'store-data');
}

/**
 * 경로에서 파일명 추출
 */
export function extractFileName(path: string): string {
  return path.split('/').pop() || '';
}

/**
 * 경로 유효성 검증
 */
export function isValidStoragePath(path: string): boolean {
  // 형식: userId/storeId/fileName
  const parts = path.split('/');
  return parts.length === 3 && parts.every(p => p.length > 0);
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : '';
}

/**
 * 파일 타입 판별
 */
export function detectFileType(fileName: string): 'csv' | 'excel' | '3d-model' | 'json' | 'unknown' {
  const ext = getFileExtension(fileName);
  
  if (ext === 'csv') return 'csv';
  if (ext === 'xlsx' || ext === 'xls') return 'excel';
  if (ext === 'glb' || ext === 'gltf') return '3d-model';
  if (ext === 'json') return 'json';
  
  return 'unknown';
}

/**
 * 안전한 파일명 생성
 */
export function sanitizeFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  const name = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  const ext = lastDot > 0 ? fileName.substring(lastDot) : '';
  
  // 안전한 문자만 허용
  const safeName = name
    .replace(/[^\w\-\.]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
  
  return safeName + ext;
}
