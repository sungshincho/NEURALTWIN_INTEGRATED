/**
 * NEURALTWIN AI Assistant 시스템 프롬프트
 * AI-First 인텐트 분류를 위한 상세 프롬프트
 *
 * 실제 프롬프트 내용은 prompts/ 디렉토리의 모듈별 파일에 존재
 * 이 파일은 모듈을 조립하여 기존과 동일한 최종 프롬프트를 생성하는 assembler
 */

import { SYSTEM_PROMPT } from './prompts/basePersona.ts';
import { QUERY_TYPE_DEFINITIONS } from './prompts/queryTypeDefinitions.ts';
import { INTENT_DEFINITIONS } from './prompts/intentDefinitions.ts';
import { DISAMBIGUATION_RULES } from './prompts/disambiguationRules.ts';
import { RESPONSE_FORMAT } from './prompts/responseFormat.ts';
import { formatProductCatalog, formatContext } from './prompts/productCatalog.ts';

export { SYSTEM_PROMPT, formatProductCatalog, formatContext };

/**
 * AI-First 인텐트 분류 프롬프트 (강화 버전)
 * 조립 결과는 기존 단일 파일 버전과 바이트 단위 동일
 */
export const INTENT_CLASSIFICATION_PROMPT = `당신은 NEURALTWIN 대시보드의 인텐트 분류기입니다.
사용자의 자연어 요청을 분석하여 의도(intent)와 엔티티(entities)를 추출하세요.

## 사용자 메시지
"{userMessage}"

## 현재 컨텍스트
{context}

## 인텐트 목록 (우선순위 순)

${QUERY_TYPE_DEFINITIONS}

${INTENT_DEFINITIONS}

${DISAMBIGUATION_RULES}

${RESPONSE_FORMAT}

{productCatalog}`;
