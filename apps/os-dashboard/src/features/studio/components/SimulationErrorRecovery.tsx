/**
 * SimulationErrorRecovery.tsx
 *
 * AI 시뮬레이션 에러 복구 UI 컴포넌트
 * - 에러 발생 시 사용자 친화적 복구 옵션 제공
 * - 재시도 및 초기화 기능
 * - 폴백 데이터 안내
 *
 * Sprint 0 Task: S0-4
 * 작성일: 2026-01-12
 */

import { AlertTriangle, RefreshCw, RotateCcw, AlertCircle, Clock, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// 타입 정의
// ============================================================================

export interface SimulationErrorState {
  /** 에러 메시지 */
  message: string;
  /** 재시도 가능 여부 */
  canRetry: boolean;
  /** 에러 발생 시간 */
  timestamp: Date;
  /** 에러 유형 */
  type?: 'network' | 'parse' | 'validation' | 'timeout' | 'unknown';
  /** 상세 정보 */
  details?: string;
  /** 폴백 데이터 사용 여부 */
  isFallback?: boolean;
}

export interface SimulationErrorRecoveryProps {
  /** 에러 상태 */
  error: SimulationErrorState;
  /** 재시도 핸들러 */
  onRetry: () => void;
  /** 초기화 핸들러 */
  onReset: () => void;
  /** 에러 무시 (폴백 데이터 사용) */
  onDismiss?: () => void;
  /** 재시도 진행 중 */
  isRetrying?: boolean;
  /** 클래스명 */
  className?: string;
}

// ============================================================================
// 에러 타입별 설정
// ============================================================================

const ERROR_TYPE_CONFIG: Record<NonNullable<SimulationErrorState['type']>, {
  icon: typeof AlertTriangle;
  color: string;
  bgColor: string;
  borderColor: string;
  title: string;
  description: string;
  suggestion: string;
}> = {
  network: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    title: '네트워크 오류',
    description: 'AI 서버와의 연결에 문제가 발생했습니다.',
    suggestion: '인터넷 연결을 확인한 후 다시 시도해주세요.',
  },
  parse: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    title: 'AI 응답 처리 오류',
    description: 'AI 응답을 처리하는 중 문제가 발생했습니다.',
    suggestion: '기본 데이터로 결과를 표시합니다. 다시 시도하면 정확한 결과를 얻을 수 있습니다.',
  },
  validation: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    title: '데이터 검증 실패',
    description: 'AI 응답 데이터가 예상 형식과 다릅니다.',
    suggestion: '기본 데이터로 결과를 표시합니다. 다시 시도하면 정확한 결과를 얻을 수 있습니다.',
  },
  timeout: {
    icon: Clock,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    title: '응답 시간 초과',
    description: 'AI 분석에 예상보다 오래 걸리고 있습니다.',
    suggestion: '잠시 후 다시 시도하거나, 분석 범위를 줄여보세요.',
  },
  unknown: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    title: '알 수 없는 오류',
    description: '예상치 못한 오류가 발생했습니다.',
    suggestion: '다시 시도하거나, 문제가 지속되면 지원팀에 문의하세요.',
  },
};

// ============================================================================
// 컴포넌트
// ============================================================================

export function SimulationErrorRecovery({
  error,
  onRetry,
  onReset,
  onDismiss,
  isRetrying = false,
  className,
}: SimulationErrorRecoveryProps) {
  const [showDetails, setShowDetails] = useState(false);

  // 에러 타입 설정 가져오기
  const errorType = error.type || 'unknown';
  const config = ERROR_TYPE_CONFIG[errorType];
  const Icon = config.icon;

  // 시간 포맷팅
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 space-y-3',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn('font-medium', config.color)}>
              {config.title}
            </h4>
            <span className="text-xs text-white/40 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(error.timestamp)}
            </span>
          </div>
          <p className="text-sm text-white/60 mt-1">
            {config.description}
          </p>
        </div>
      </div>

      {/* 에러 메시지 */}
      <div className="p-2.5 bg-black/20 rounded-lg">
        <p className="text-xs text-white/70 font-mono break-words">
          {error.message}
        </p>
      </div>

      {/* 폴백 데이터 안내 */}
      {error.isFallback && (
        <div className="flex items-start gap-2 p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-300">
            <p className="font-medium">기본 데이터로 표시 중</p>
            <p className="text-blue-300/70 mt-0.5">
              현재 결과는 기본값으로 표시됩니다. 정확한 AI 분석 결과를 원하시면 다시 시도해주세요.
            </p>
          </div>
        </div>
      )}

      {/* 제안 */}
      <div className="text-xs text-white/50 flex items-center gap-1.5">
        <span className="text-yellow-400">💡</span>
        {config.suggestion}
      </div>

      {/* 상세 정보 (접기/펼치기) */}
      {error.details && (
        <div className="border-t border-white/10 pt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition"
          >
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            상세 정보 {showDetails ? '숨기기' : '보기'}
          </button>
          {showDetails && (
            <div className="mt-2 p-2 bg-black/30 rounded text-xs text-white/50 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
              {error.details}
            </div>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2 pt-1">
        {error.canRetry && (
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            size="sm"
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                재시도 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                다시 시도
              </>
            )}
          </Button>
        )}
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className={cn(
            'border-white/20 text-white/70 hover:bg-white/10',
            !error.canRetry && 'flex-1'
          )}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          초기화
        </Button>
        {error.isFallback && onDismiss && (
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="text-white/50 hover:text-white/70 hover:bg-white/10"
          >
            기본값 사용
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 에러 메시지에서 에러 타입 추론
 */
export function inferErrorType(
  error: string | Error | unknown
): SimulationErrorState['type'] {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('연결')
  ) {
    return 'network';
  }

  if (
    lowerMessage.includes('parse') ||
    lowerMessage.includes('json') ||
    lowerMessage.includes('파싱')
  ) {
    return 'parse';
  }

  if (
    lowerMessage.includes('valid') ||
    lowerMessage.includes('schema') ||
    lowerMessage.includes('검증')
  ) {
    return 'validation';
  }

  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('시간')
  ) {
    return 'timeout';
  }

  return 'unknown';
}

/**
 * 에러에서 SimulationErrorState 생성
 */
export function createSimulationError(
  error: string | Error | unknown,
  options?: Partial<SimulationErrorState>
): SimulationErrorState {
  const message = error instanceof Error ? error.message : String(error);
  const type = options?.type || inferErrorType(error);

  return {
    message,
    canRetry: type !== 'unknown', // unknown 에러는 기본적으로 재시도 불가
    timestamp: new Date(),
    type,
    ...options,
  };
}

export default SimulationErrorRecovery;
