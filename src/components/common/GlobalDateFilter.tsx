/**
 * GlobalDateFilter.tsx
 *
 * 전역 기간 필터 컴포넌트
 * - 모든 페이지에서 동일한 기간 필터 사용
 * - 프리셋 버튼 (오늘, 7일, 30일, 90일)
 * - 커스텀 날짜 범위 선택
 */

import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDateFilterStore, PresetPeriod, PRESET_LABELS } from '@/store/dateFilterStore';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState, useCallback, useEffect } from 'react';
import { DateRange } from 'react-day-picker';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

// 다크 모드 감지 hook
function useDarkMode() {
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

const presets: PresetPeriod[] = ['today', '7d', '30d', '90d'];

interface GlobalDateFilterProps {
  className?: string;
  showCustom?: boolean;
  compact?: boolean;
}

export function GlobalDateFilter({
  className,
  showCustom = true,
  compact = false,
}: GlobalDateFilterProps) {
  const { dateRange, setPreset, setCustomRange } = useDateFilterStore();
  const [isOpen, setIsOpen] = useState(false);
  const isDark = useDarkMode();

  // H-6: 임시 선택 상태 (팝오버 열릴 때 리셋됨)
  const [tempRange, setTempRange] = useState<DateRange | undefined>(undefined);

  // 팝오버 열릴 때 임시 상태 초기화
  useEffect(() => {
    if (isOpen) {
      // "오늘" 프리셋인 경우 시작 날짜만 선택된 상태로 설정
      if (dateRange.preset === 'today') {
        setTempRange({
          from: parseISO(dateRange.startDate),
          to: undefined,
        });
      } else {
        // 다른 프리셋(7일, 30일, 90일, custom)은 범위로 설정
        setTempRange({
          from: parseISO(dateRange.startDate),
          to: parseISO(dateRange.endDate),
        });
      }
    }
  }, [isOpen, dateRange.startDate, dateRange.endDate, dateRange.preset]);

  // 날짜 클릭 핸들러 - 시작/종료가 모두 선택된 상태에서 새 날짜 클릭 시 초기화
  const handleDayClick = useCallback((day: Date) => {
    if (tempRange?.from && tempRange?.to) {
      // 기존 범위가 완성된 상태에서 새로 클릭하면 시작 날짜로 초기화
      setTempRange({
        from: day,
        to: undefined,
      });
    }
  }, [tempRange]);

  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    // 시작/종료 날짜가 모두 선택된 상태에서는 onDayClick에서 처리됨
    if (tempRange?.from && tempRange?.to) {
      return;
    }

    // 임시 상태 업데이트 (자동 닫힘 제거됨 - 적용 버튼으로 닫음)
    setTempRange(range);
  }, [tempRange]);

  // 초기화 버튼 핸들러 - 선택된 날짜 해제
  const handleReset = useCallback(() => {
    setTempRange({ from: undefined, to: undefined });
  }, []);

  // 적용 버튼 핸들러
  const handleApply = useCallback(() => {
    if (tempRange?.from && tempRange?.to) {
      setCustomRange(
        format(tempRange.from, 'yyyy-MM-dd'),
        format(tempRange.to, 'yyyy-MM-dd')
      );
      setTempRange(undefined);
      setIsOpen(false);
    }
  }, [tempRange, setCustomRange]);

  // 팝오버 외부 클릭 시 (onOpenChange)
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      // 닫힐 때 시작/종료 날짜가 모두 선택되어 있으면 적용
      if (tempRange?.from && tempRange?.to) {
        setCustomRange(
          format(tempRange.from, 'yyyy-MM-dd'),
          format(tempRange.to, 'yyyy-MM-dd')
        );
      }
      // 닫힐 때 tempRange 초기화 (다음에 열 때 올바른 defaultMonth 적용)
      setTempRange(undefined);
    }
    setIsOpen(open);
  }, [tempRange, setCustomRange]);

  const displayRange: DateRange = tempRange ?? {
    from: parseISO(dateRange.startDate),
    to: parseISO(dateRange.endDate),
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* 달력 아이콘 + 프리셋 버튼 - SelectTrigger 스타일 */}
      <div
        className="flex items-center gap-1 h-10 px-2 rounded-xl transition-all duration-200"
        style={{
          background: isDark
            ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,255,0.8) 100%)',
          border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: isDark
            ? 'inset 0 1px 1px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.2)'
            : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.8)',
        }}
      >
        {!compact && (
          <CalendarIcon
            className="h-4 w-4 mr-1"
            style={{
              color: isDark ? 'rgba(255,255,255,0.5)' : '#515158',
            }}
          />
        )}
        {presets.map((preset) => {
          const isActive = dateRange.preset === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => setPreset(preset)}
              className="px-2 h-6 rounded-md text-xs font-medium transition-all duration-200"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(145deg, #222228 0%, #2c2c34 45%, #1c1c24 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.08)',
                      color: '#ffffff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }
                  : {
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: isDark ? 'rgba(255,255,255,0.5)' : '#515158',
                    }
              }
            >
              {PRESET_LABELS[preset]}
            </button>
          );
        })}
      </div>

      {/* 직접 설정 버튼 - SelectTrigger 스타일 */}
      {showCustom && (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm transition-all duration-200"
              style={{
                background: isDark
                  ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,255,0.8) 100%)',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: isDark
                  ? 'inset 0 1px 1px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.2)'
                  : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.8)',
                color: isDark ? '#ffffff' : '#1a1a1f',
              }}
            >
              <CalendarIcon className="h-4 w-4" />
              {dateRange.preset === 'custom' ? (
                <span className="text-xs">
                  {format(parseISO(dateRange.startDate), 'M/d', { locale: ko })} -{' '}
                  {format(parseISO(dateRange.endDate), 'M/d', { locale: ko })}
                </span>
              ) : (
                <span className="text-xs">직접 설정</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="text-xs text-black dark:text-white">
                {tempRange?.from && !tempRange?.to
                  ? '종료일을 선택하세요'
                  : '날짜 범위 선택'}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-black dark:text-white"
                  onClick={handleReset}
                >
                  초기화
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-black dark:text-white"
                  onClick={handleApply}
                  disabled={!tempRange?.from || !tempRange?.to}
                >
                  적용
                </Button>
              </div>
            </div>
            <Calendar
              key={`${dateRange.startDate}-${dateRange.preset}`}
              initialFocus
              mode="range"
              defaultMonth={displayRange.from}
              selected={displayRange}
              onSelect={handleDateRangeSelect}
              onDayClick={handleDayClick}
              numberOfMonths={2}
              locale={ko}
              modifiers={{
                todayInRange: (day) =>
                  isToday(day) &&
                  !isSameDay(day, tempRange?.from ?? new Date(0)) &&
                  !isSameDay(day, tempRange?.to ?? new Date(0)),
              }}
              modifiersClassNames={{
                todayInRange: "!bg-blue-500/20 !text-blue-600 !ring-1 !ring-blue-500/40 dark:!bg-blue-500/30 dark:!text-blue-300 dark:!ring-blue-400/50 rounded-full",
              }}
            />
          </PopoverContent>
        </Popover>
      )}

      {!compact && (
        <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
          {format(parseISO(dateRange.startDate), 'M월 d일', { locale: ko })} ~{' '}
          {format(parseISO(dateRange.endDate), 'M월 d일', { locale: ko })}
        </span>
      )}
    </div>
  );
}
