/**
 * DemoCTABar.tsx
 *
 * 데모 모드 하단 CTA 바
 * - 투어 완료 후 자유 탐색 모드에서 표시
 * - "실제 데이터가 아닙니다" 안내 + "실제 데이터로 시작하기" CTA
 * - 고정 하단 위치, glassmorphism 스타일
 */

import { Info, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoStore } from '@/store/useDemoStore';

// ============================================================================
// DemoCTABar Component
// ============================================================================

export function DemoCTABar() {
  const { isDemoMode, isTourActive } = useDemoStore();

  // 데모 모드 + 투어 비활성일 때만 표시
  if (!isDemoMode || isTourActive) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[45]',
        'flex items-center justify-between',
        'px-6 h-14',
        // 모바일: 세로 스택
        'max-md:flex-col max-md:h-auto max-md:py-3 max-md:gap-2'
      )}
      style={{
        marginLeft: '64px', // 사이드바 너비
        background:
          'linear-gradient(165deg, rgba(17,24,39,0.95) 0%, rgba(17,24,39,0.98) 100%)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(45,55,72,0.8)',
      }}
      role="banner"
      aria-label="데모 모드 알림 바"
    >
      {/* Left: 안내 텍스트 */}
      <div className="flex items-center gap-2 max-md:text-center">
        <Info className="w-4 h-4 text-white/25 flex-shrink-0 max-md:hidden" />
        <span className="text-[14px] text-white/40">
          데모 모드 -- 실제 데이터가 아닙니다
        </span>
      </div>

      {/* Right: CTA 버튼 */}
      <button
        onClick={() => {
          window.open('/auth', '_blank');
        }}
        className={cn(
          'flex items-center gap-2 px-6 py-2 rounded-lg',
          'text-[14px] font-semibold',
          'transition-all duration-200',
          'hover:brightness-110 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
          // 모바일: 풀 너비
          'max-md:w-full max-md:justify-center'
        )}
        style={{
          background: '#00D4FF',
          color: '#111827',
          boxShadow: '0 0 16px rgba(0, 212, 255, 0.25)',
        }}
      >
        실제 데이터로 시작하기
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default DemoCTABar;
