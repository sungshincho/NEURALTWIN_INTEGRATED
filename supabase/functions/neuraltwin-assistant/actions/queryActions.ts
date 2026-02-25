/**
 * queryActions facade
 * 기존 import 경로 호환을 위한 re-export
 * 실제 구현은 queryActions/ 디렉토리의 모듈별 파일에 존재
 */

export { handleQueryKpi } from './queryActions/index.ts';
export type { QueryActionResult, PageContext } from './queryActions/types.ts';
