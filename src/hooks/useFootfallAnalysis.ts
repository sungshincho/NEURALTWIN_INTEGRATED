import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays } from 'date-fns';

/**
 * L3 hourly_metrics + daily_kpis_agg 테이블 기반 방문 분석 Hook
 * Phase 3: 3-Layer Architecture - 모든 분석이 동일한 L3 데이터 소스 사용
 */

export interface FootfallData {
  date: string;
  hour: number;
  visit_count: number;
  unique_visitors: number;
  avg_duration_minutes: number;
  weather_condition?: string;
  temperature?: number;
  is_holiday?: boolean;
  event_name?: string;
  event_type?: string;
  regional_traffic?: number;
}

export interface FootfallStats {
  total_visits: number;
  unique_visitors: number;
  avg_visits_per_hour: number;
  peak_hour: number | null;
  peak_hour_visits: number;
  daily_trend: number;
  weather_impact?: string;
  holiday_impact?: string;
  regional_comparison?: string;
}

export function useFootfallAnalysis(storeId?: string, startDate?: Date, endDate?: Date) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['footfall-analysis', storeId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!user || !storeId || !orgId) {
        return {
          data: [],
          stats: {
            total_visits: 0,
            unique_visitors: 0,
            avg_visits_per_hour: 0,
            peak_hour: null,
            peak_hour_visits: 0,
            daily_trend: 0,
          }
        };
      }

      const start = startDate || subDays(new Date(), 7);
      const end = endDate || new Date();
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      // L3 hourly_metrics에서 시간대별 데이터 조회
      const { data: hourlyMetrics, error: hourlyError } = await supabase
        .from('hourly_metrics')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true })
        .order('hour', { ascending: true });

      if (hourlyError) {
        console.error('Hourly metrics fetch error:', hourlyError);
        throw new Error('방문 데이터를 불러오는데 실패했습니다.');
      }

      // L3 daily_kpis_agg에서 일별 컨텍스트 데이터 조회
      const { data: dailyKpis } = await supabase
        .from('daily_kpis_agg')
        .select('date, weather_condition, temperature, is_holiday, special_event')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('date', startStr)
        .lte('date', endStr);

      // 일별 컨텍스트 매핑
      interface DailyContext {
        weather_condition?: string | null;
        temperature?: number | null;
        is_holiday?: boolean | null;
        special_event?: string | null;
      }
      const dailyContextMap = new Map<string, DailyContext>(
        (dailyKpis || []).map(d => [d.date, {
          weather_condition: d.weather_condition,
          temperature: d.temperature,
          is_holiday: d.is_holiday,
          special_event: d.special_event,
        }])
      );

      // FootfallData 형식으로 변환
      const footfallData: FootfallData[] = (hourlyMetrics || []).map(m => {
        const context = dailyContextMap.get(m.date) || {};
        return {
          date: m.date,
          hour: m.hour,
          visit_count: m.visitor_count || 0,
          unique_visitors: m.visitor_count || 0, // hourly_metrics에서는 unique 구분 없음
          avg_duration_minutes: 0, // hourly_metrics에 없는 필드
          weather_condition: context.weather_condition,
          temperature: context.temperature,
          is_holiday: context.is_holiday,
          event_name: context.special_event,
        };
      });

      // 통계 계산
      const totalVisits = footfallData.reduce((sum, d) => sum + d.visit_count, 0);
      const totalUniqueVisitors = footfallData.reduce((sum, d) => sum + d.unique_visitors, 0);
      const hoursWithData = footfallData.filter(d => d.visit_count > 0).length;
      
      let peakHour: number | null = null;
      let peakHourVisits = 0;

      if (footfallData.length > 0) {
        const peakData = footfallData.reduce(
          (max, d) => (d.visit_count > max.visit_count ? d : max),
          footfallData[0]
        );
        peakHour = peakData.hour;
        peakHourVisits = peakData.visit_count;
      }

      // 컨텍스트 기반 인사이트 생성
      const weatherImpact = generateWeatherImpact(footfallData);
      const holidayImpact = generateHolidayImpact(footfallData);

      const stats: FootfallStats = {
        total_visits: totalVisits,
        unique_visitors: totalUniqueVisitors,
        avg_visits_per_hour: hoursWithData > 0 ? totalVisits / hoursWithData : 0,
        peak_hour: peakHour,
        peak_hour_visits: peakHourVisits,
        daily_trend: 0,
        weather_impact: weatherImpact,
        holiday_impact: holidayImpact,
      };

      return {
        data: footfallData,
        stats,
      };
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

function generateWeatherImpact(data: FootfallData[]): string | undefined {
  const rainyDays = data.filter(d => d.weather_condition === 'rainy');
  const sunnyDays = data.filter(d => d.weather_condition === 'sunny');
  
  if (rainyDays.length === 0 || sunnyDays.length === 0) return undefined;
  
  const rainyAvg = rainyDays.reduce((sum, d) => sum + d.visit_count, 0) / rainyDays.length;
  const sunnyAvg = sunnyDays.reduce((sum, d) => sum + d.visit_count, 0) / sunnyDays.length;
  const diff = ((rainyAvg - sunnyAvg) / sunnyAvg) * 100;
  
  if (Math.abs(diff) < 5) return undefined;
  
  return diff < 0
    ? `비 오는 날 방문 ${Math.abs(diff).toFixed(0)}% 감소`
    : `비 오는 날 방문 ${diff.toFixed(0)}% 증가`;
}

function generateHolidayImpact(data: FootfallData[]): string | undefined {
  const holidays = data.filter(d => d.is_holiday);
  const regularDays = data.filter(d => !d.is_holiday);
  
  if (holidays.length === 0 || regularDays.length === 0) return undefined;
  
  const holidayAvg = holidays.reduce((sum, d) => sum + d.visit_count, 0) / holidays.length;
  const regularAvg = regularDays.reduce((sum, d) => sum + d.visit_count, 0) / regularDays.length;
  const diff = ((holidayAvg - regularAvg) / regularAvg) * 100;
  
  if (Math.abs(diff) < 10) return undefined;
  
  const eventName = holidays[0]?.event_name || '공휴일/이벤트';
  return diff < 0
    ? `${eventName} 기간 방문 ${Math.abs(diff).toFixed(0)}% 감소`
    : `${eventName} 기간 방문 ${diff.toFixed(0)}% 증가`;
}

export function useHourlyFootfall(storeId?: string, date?: Date) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['hourly-footfall', storeId, date?.toISOString()],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const targetDate = format(date || new Date(), 'yyyy-MM-dd');
      
      // L3 hourly_metrics에서 조회
      const { data, error } = await supabase
        .from('hourly_metrics')
        .select('hour, visitor_count')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('date', targetDate)
        .order('hour', { ascending: true });

      if (error) throw error;

      // 24시간 데이터로 변환
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        visits: 0,
        time: `${hour.toString().padStart(2, '0')}:00`,
      }));

      (data || []).forEach((row: any) => {
        if (row.hour >= 0 && row.hour < 24) {
          hourlyData[row.hour].visits = row.visitor_count || 0;
        }
      });

      return hourlyData;
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}
