/**
 * AIInsightBubble.tsx
 *
 * 플로팅 AI 인사이트 패널 컴포넌트
 * - Collapsed: 하단 우측 고정 버블 (읽지 않은 인사이트 뱃지)
 * - Expanded: 우측 슬라이드-인 패널 (인사이트 목록 + 입력)
 * - Glassmorphism dark theme, CSS transitions
 *
 * 모든 대시보드 페이지에서 지속되며 자체 Zustand 스토어로 상태 관리
 */

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import {
  X,
  Send,
  Brain,
  AlertTriangle,
  Info,
  AlertCircle,
  Sparkles,
  Lightbulb,
  Sun,
  MessageSquare,
  Clock,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAIInsightStore,
  type AIInsight,
  type InsightSeverity,
} from '@/store/useAIInsightStore';

// ============================================================================
// Helpers
// ============================================================================

/** 상대 시간 포맷 (예: "3분 전", "2시간 전") */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return new Date(timestamp).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

/** 인사이트 타입별 아이콘 */
function getInsightIcon(type: AIInsight['type'], severity?: InsightSeverity) {
  if (type === 'anomaly') {
    if (severity === 'critical') return <AlertCircle className="w-4 h-4" />;
    if (severity === 'warning') return <AlertTriangle className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  }
  if (type === 'digest') return <Sun className="w-4 h-4" />;
  if (type === 'suggestion') return <Lightbulb className="w-4 h-4" />;
  return <MessageSquare className="w-4 h-4" />;
}

/** Severity별 색상 클래스 (아이콘 컨테이너 배경 + 텍스트) */
function getSeverityStyles(severity?: InsightSeverity): {
  iconBg: string;
  iconText: string;
  border: string;
} {
  switch (severity) {
    case 'critical':
      return {
        iconBg: 'bg-rose-500/20',
        iconText: 'text-rose-400',
        border: 'border-l-rose-500',
      };
    case 'warning':
      return {
        iconBg: 'bg-amber-500/20',
        iconText: 'text-amber-400',
        border: 'border-l-amber-500',
      };
    case 'info':
    default:
      return {
        iconBg: 'bg-cyan-500/20',
        iconText: 'text-cyan-400',
        border: 'border-l-cyan-500',
      };
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

/** 개별 인사이트 카드 */
function InsightCard({
  insight,
  onAction,
  onDismiss,
}: {
  insight: AIInsight;
  onAction: (action: string) => void;
  onDismiss: (id: string) => void;
}) {
  const severity = getSeverityStyles(insight.severity);

  return (
    <div
      className={cn(
        'group relative rounded-xl border-l-2 p-3 transition-all duration-200',
        'bg-white/[0.04] hover:bg-white/[0.07]',
        'border border-white/[0.06] hover:border-white/[0.1]',
        severity.border,
        !insight.read && 'ring-1 ring-white/[0.08]'
      )}
      role="article"
      aria-label={`${insight.type} 인사이트: ${insight.title}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5',
            severity.iconBg, severity.iconText
          )}
        >
          {getInsightIcon(insight.type, insight.severity)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[13px] font-semibold text-white/90 truncate">
              {insight.title}
            </h4>
            <button
              onClick={() => onDismiss(insight.id)}
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded flex items-center justify-center',
                'text-white/20 hover:text-white/60 hover:bg-white/10',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-150'
              )}
              aria-label="인사이트 삭제"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[12px] leading-relaxed text-white/55 mt-1">
            {insight.message}
          </p>

          {/* Actions + time */}
          <div className="flex items-center justify-between mt-2.5">
            {/* Action chips */}
            {insight.actions && insight.actions.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {insight.actions.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (act.url) {
                        window.location.href = act.url;
                      } else if (act.action) {
                        onAction(act.action);
                      }
                    }}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium',
                      'bg-white/[0.07] text-white/70 hover:bg-white/[0.12] hover:text-white/90',
                      'border border-white/[0.06] hover:border-white/[0.12]',
                      'transition-all duration-150'
                    )}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            ) : (
              <div />
            )}

            {/* Timestamp */}
            <span className="flex items-center gap-1 text-[10px] text-white/30 flex-shrink-0">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(insight.timestamp)}
            </span>
          </div>
        </div>
      </div>

      {/* Unread indicator dot */}
      {!insight.read && (
        <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
      )}
    </div>
  );
}

/** 빈 상태 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6 text-white/25" />
      </div>
      <p className="text-[13px] font-medium text-white/40">
        아직 새로운 인사이트가 없습니다
      </p>
      <p className="text-[11px] text-white/25 mt-1.5 max-w-[220px]">
        AI가 매장 데이터를 분석하면 이곳에 프로액티브 인사이트가 표시됩니다
      </p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AIInsightBubble() {
  const {
    isOpen,
    insights,
    unreadCount,
    togglePanel,
    closePanel,
    removeInsight,
    clearInsights,
  } = useAIInsightStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 패널이 열릴 때 인풋에 포커스
  useEffect(() => {
    if (isOpen) {
      // 트랜지션 이후 포커스
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 새 인사이트가 추가되면 스크롤 맨 위로 (newest first)
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [insights.length, isOpen]);

  // Escape 키로 패널 닫기
  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePanel]);

  // 메시지 전송 (placeholder - 콘솔 로그)
  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    console.log('[AIInsightBubble] User message:', trimmed);
    setInputValue('');
  }, [inputValue]);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 액션 핸들러 (placeholder)
  const handleAction = useCallback((action: string) => {
    console.log('[AIInsightBubble] Action triggered:', action);
  }, []);

  return (
    <>
      {/* ================================================================ */}
      {/* Collapsed Bubble — bottom-right fixed                            */}
      {/* ================================================================ */}
      <button
        onClick={togglePanel}
        className={cn(
          'fixed right-6 bottom-6 z-[60]',
          'flex items-center gap-2 px-4 py-2.5 rounded-full',
          'text-white text-[13px] font-semibold',
          'shadow-lg shadow-purple-900/30',
          'transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          // 패널 열려있으면 숨기기
          isOpen
            ? 'translate-y-3 opacity-0 pointer-events-none scale-90'
            : 'translate-y-0 opacity-100 scale-100 hover:scale-[1.03]',
          // 읽지 않은 게 있으면 펄싱 글로우
          unreadCount > 0 && !isOpen && 'animate-ai-pulse'
        )}
        style={{
          background: 'linear-gradient(135deg, #9333ea 0%, #06b6d4 100%)',
        }}
        aria-label={
          unreadCount > 0
            ? `AI 인사이트 패널 열기 - 새 인사이트 ${unreadCount}개`
            : 'AI 인사이트 패널 열기'
        }
        aria-expanded={isOpen}
      >
        <Brain className="w-4 h-4" />
        <span>AI가 할 말 있어요</span>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              'flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full',
              'text-[11px] font-bold bg-white text-purple-700',
              'shadow-[0_0_8px_rgba(255,255,255,0.4)]'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ================================================================ */}
      {/* Backdrop overlay (mobile-friendly)                               */}
      {/* ================================================================ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[69] bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden"
          onClick={closePanel}
          aria-hidden="true"
        />
      )}

      {/* ================================================================ */}
      {/* Expanded Panel — slide-in from right                             */}
      {/* ================================================================ */}
      <div
        ref={panelRef}
        className={cn(
          'fixed top-0 right-0 z-[70] h-full w-[360px] max-w-[calc(100vw-16px)]',
          'flex flex-col',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{
          background:
            'linear-gradient(165deg, rgba(15,15,20,0.97) 0%, rgba(10,10,14,0.98) 30%, rgba(13,13,18,0.97) 60%, rgba(11,11,16,0.98) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.5), -2px 0 8px rgba(0,0,0,0.3)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="NeuralMind AI 인사이트 패널"
      >
        {/* ────────────────── Header ────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(147,51,234,0.3) 0%, rgba(6,182,212,0.3) 100%)',
                border: '1px solid rgba(147,51,234,0.3)',
              }}
            >
              <Brain className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-white/95 tracking-tight">
                NeuralMind
              </h2>
              <p className="text-[10px] text-white/35 mt-0.5">
                AI 인사이트 어시스턴트
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {insights.length > 0 && (
              <button
                onClick={clearInsights}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  'text-white/30 hover:text-white/70 hover:bg-white/[0.07]',
                  'transition-all duration-150'
                )}
                aria-label="모든 인사이트 삭제"
                title="모든 인사이트 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={closePanel}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                'text-white/40 hover:text-white/80 hover:bg-white/[0.07]',
                'transition-all duration-150'
              )}
              aria-label="패널 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ────────────────── Insight list (scrollable) ────────────────── */}
        <div
          ref={messagesEndRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 scroll-smooth"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          }}
        >
          {insights.length === 0 ? (
            <EmptyState />
          ) : (
            insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onAction={handleAction}
                onDismiss={removeInsight}
              />
            ))
          )}
        </div>

        {/* ────────────────── Quick action chips ────────────────── */}
        {insights.length > 0 && (
          <div
            className="flex items-center gap-2 px-5 py-3 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <button
              onClick={() => handleAction('show_suggestions')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium',
                'bg-purple-500/15 text-purple-300 hover:bg-purple-500/25',
                'border border-purple-500/20 hover:border-purple-500/35',
                'transition-all duration-150'
              )}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              제안 보기
            </button>
            <button
              onClick={closePanel}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium',
                'bg-white/[0.05] text-white/50 hover:bg-white/[0.1] hover:text-white/70',
                'border border-white/[0.06] hover:border-white/[0.12]',
                'transition-all duration-150'
              )}
            >
              나중에
            </button>
          </div>
        )}

        {/* ────────────────── Input bar ────────────────── */}
        <div
          className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(8,8,12,0.5)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="메시지 입력..."
            className={cn(
              'flex-1 h-10 px-4 rounded-xl text-[13px]',
              'bg-white/[0.06] text-white/90 placeholder:text-white/30',
              'border border-white/[0.08] focus:border-white/[0.15] focus:bg-white/[0.08]',
              'outline-none transition-all duration-200'
            )}
            aria-label="AI에게 메시지 입력"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
              'transition-all duration-200',
              inputValue.trim()
                ? 'bg-gradient-to-br from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50'
                : 'bg-white/[0.05] text-white/20 cursor-not-allowed',
              'border',
              inputValue.trim()
                ? 'border-purple-500/40'
                : 'border-white/[0.06]'
            )}
            aria-label="메시지 전송"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Inline CSS for pulse animation                                   */}
      {/* ================================================================ */}
      <style>{`
        @keyframes ai-pulse {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(147, 51, 234, 0.4),
              0 4px 16px rgba(147, 51, 234, 0.2);
          }
          50% {
            box-shadow:
              0 0 0 8px rgba(147, 51, 234, 0),
              0 4px 20px rgba(6, 182, 212, 0.3);
          }
        }
        .animate-ai-pulse {
          animation: ai-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
}

export default AIInsightBubble;
