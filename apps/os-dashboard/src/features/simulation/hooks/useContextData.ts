import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeatherForecast {
  date: string;
  temperature: number;
  condition: string;
  precipitation: number;
  humidity: number;
}

export interface EventData {
  date: string;
  eventName: string;
  eventType: string;
  impactLevel: 'high' | 'medium' | 'low';
}

export interface EconomicIndicator {
  date: string;
  indicatorType: string;
  value: number;
  unit?: string;
}

export function useWeatherForecast(storeId?: string, horizonDays = 7) {
  return useQuery({
    queryKey: ['weather-forecast', storeId, horizonDays],
    queryFn: async () => {
      if (!storeId) return [];

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + horizonDays);

      const { data, error } = await supabase
        .from('weather_data')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d) => ({
        date: d.date,
        temperature: Number(d.temperature) || 0,
        condition: d.weather_condition || 'unknown',
        precipitation: Number(d.precipitation) || 0,
        humidity: Number(d.humidity) || 0,
      })) as WeatherForecast[];
    },
    enabled: !!storeId,
  });
}

export function useEventCalendar(storeId?: string, dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['event-calendar', storeId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('holidays_events')
        .select('*')
        .order('date', { ascending: true });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (dateRange) {
        query = query.gte('date', dateRange.from).lte('date', dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((d) => ({
        date: d.date,
        eventName: d.event_name,
        eventType: d.event_type,
        impactLevel: (d.impact_level as 'high' | 'medium' | 'low') || 'medium',
      })) as EventData[];
    },
    enabled: !!storeId,
  });
}

export function useEconomicIndicators(region?: string, horizonDays = 30) {
  return useQuery({
    queryKey: ['economic-indicators', region, horizonDays],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - horizonDays);

      let query = supabase
        .from('economic_indicators')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((d) => ({
        date: d.date,
        indicatorType: d.indicator_type,
        value: d.indicator_value,
        unit: d.unit,
      })) as EconomicIndicator[];
    },
  });
}

export function useContextData(storeId?: string, options?: {
  includeWeather?: boolean;
  includeEvents?: boolean;
  includeEconomic?: boolean;
  horizonDays?: number;
  region?: string;
}) {
  const {
    includeWeather = true,
    includeEvents = true,
    includeEconomic = false,
    horizonDays = 7,
    region,
  } = options || {};

  const weather = useWeatherForecast(
    includeWeather ? storeId : undefined,
    horizonDays
  );

  const events = useEventCalendar(
    includeEvents ? storeId : undefined,
    horizonDays
      ? {
          from: new Date().toISOString().split('T')[0],
          to: new Date(Date.now() + horizonDays * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        }
      : undefined
  );

  const economic = useEconomicIndicators(
    includeEconomic ? region : undefined,
    horizonDays
  );

  return {
    weather: weather.data || [],
    events: events.data || [],
    economic: economic.data || [],
    isLoading: weather.isLoading || events.isLoading || economic.isLoading,
    error: weather.error || events.error || economic.error,
  };
}
