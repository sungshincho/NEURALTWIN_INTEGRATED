/**
 * calendar.tsx
 * 3D Glassmorphism Calendar Component
 */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [isDark, setIsDark] = React.useState(getInitialDarkMode);

  React.useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Glassmorphism button style
  const navButtonStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    background: isDark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)'
      : 'linear-gradient(145deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 100%)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  // Day button base style
  const dayBaseStyle = cn(
    "h-9 w-9 p-0 font-normal rounded-lg transition-all duration-200",
    "hover:bg-opacity-10",
    isDark ? "hover:bg-white/10" : "hover:bg-black/5"
  );

  // Selected day style (monochrome)
  const daySelectedClass = isDark
    ? "bg-white text-black hover:bg-white hover:text-black focus:bg-white focus:text-black"
    : "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white";

  // Today style (blue - more prominent)
  // [&:not([aria-selected])] 조건으로 선택된 날짜(시작/종료)가 우선되도록 함
  const dayTodayClass = cn(
    "font-bold",
    isDark
      ? "[&:not([aria-selected])]:bg-blue-500/30 [&:not([aria-selected])]:text-blue-300 [&:not([aria-selected])]:ring-1 [&:not([aria-selected])]:ring-blue-400/50"
      : "[&:not([aria-selected])]:bg-blue-500/20 [&:not([aria-selected])]:text-blue-600 [&:not([aria-selected])]:ring-1 [&:not([aria-selected])]:ring-blue-500/40"
  );

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: cn(
          "text-sm font-semibold",
          isDark ? "text-white" : "text-black"
        ),
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-lg transition-all",
          isDark ? "hover:bg-white/10" : "hover:bg-black/5"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: cn(
          "rounded-md w-9 font-medium text-[0.8rem]",
          isDark ? "text-white/50" : "text-black/50"
        ),
        row: "flex w-full mt-2",
        cell: cn(
          "h-9 w-9 text-center text-sm p-0 relative",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          isDark ? "[&:has([aria-selected])]:bg-white/10" : "[&:has([aria-selected])]:bg-black/5",
          "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          "focus-within:relative focus-within:z-20"
        ),
        day: dayBaseStyle,
        day_range_end: "day-range-end",
        day_selected: daySelectedClass,
        day_today: dayTodayClass,
        day_outside: cn(
          "day-outside opacity-30",
          isDark ? "text-white/30" : "text-black/30"
        ),
        day_disabled: cn(
          "opacity-30",
          isDark ? "text-white/30" : "text-black/30"
        ),
        day_range_middle: isDark
          ? "aria-selected:bg-white/10 aria-selected:text-white"
          : "aria-selected:bg-black/5 aria-selected:text-black",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => (
          <ChevronLeft
            className="h-4 w-4"
            style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#515158' }}
          />
        ),
        IconRight: ({ ..._props }) => (
          <ChevronRight
            className="h-4 w-4"
            style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#515158' }}
          />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
