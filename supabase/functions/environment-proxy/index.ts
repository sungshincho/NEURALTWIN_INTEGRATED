import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WeatherRequest = {
  type: "weather";
  lat: number;
  lon: number;
  // DB 저장용 선택적 파라미터
  store_id?: string;
  user_id?: string;
  org_id?: string;
  save_to_db?: boolean;
};

type HolidaysRequest = {
  type: "holidays";
  year: number;
  month: number;
  countryCode?: string;
  // DB 저장용 선택적 파라미터
  store_id?: string;
  user_id?: string;
  org_id?: string;
  save_to_db?: boolean;
};

type RequestBody = WeatherRequest | HolidaysRequest;

// OpenWeatherMap condition → DB weather_condition 매핑
const WEATHER_CONDITION_MAP: Record<string, string> = {
  'Clear': 'sunny',
  'Clouds': 'cloudy',
  'Rain': 'rainy',
  'Drizzle': 'rainy',
  'Snow': 'snowy',
  'Thunderstorm': 'stormy',
  'Mist': 'cloudy',
  'Fog': 'cloudy',
  'Haze': 'cloudy',
  'Smoke': 'cloudy',
  'Dust': 'cloudy',
  'Sand': 'cloudy',
  'Ash': 'cloudy',
  'Squall': 'stormy',
  'Tornado': 'stormy',
};

function getEnv(...keys: string[]) {
  for (const k of keys) {
    const v = Deno.env.get(k);
    if (v) return v;
  }
  return "";
}

/**
 * 날씨 데이터를 weather_data 테이블에 저장 (upsert)
 */
async function saveWeatherToDb(
  supabase: ReturnType<typeof createClient>,
  storeId: string,
  userId: string | null,
  orgId: string | null,
  weatherResponse: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const rawCondition = weatherResponse.weather?.[0]?.main || 'Clouds';
    const weatherCondition = WEATHER_CONDITION_MAP[rawCondition] || 'cloudy';

    const weatherRecord = {
      user_id: userId,
      org_id: orgId,
      store_id: storeId,
      date: today,
      temperature: weatherResponse.main?.temp ?? null,
      humidity: weatherResponse.main?.humidity ?? null,
      precipitation: weatherResponse.rain?.['1h'] || weatherResponse.rain?.['3h'] || 0,
      weather_condition: weatherCondition,
      wind_speed: weatherResponse.wind?.speed ?? null,
      is_global: false,
      metadata: {
        raw_condition: rawCondition,
        description: weatherResponse.weather?.[0]?.description,
        feels_like: weatherResponse.main?.feels_like,
        pressure: weatherResponse.main?.pressure,
        visibility: weatherResponse.visibility,
        clouds: weatherResponse.clouds?.all,
        city: weatherResponse.name,
        country: weatherResponse.sys?.country,
        source: 'openweathermap',
        synced_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from('weather_data')
      .upsert(weatherRecord as any, {
        onConflict: 'store_id,date',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('[environment-proxy] weather_data 저장 실패:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[environment-proxy] weather_data 저장 성공: store=${storeId}, date=${today}, condition=${weatherCondition}`);
    return { success: true };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[environment-proxy] weather_data 저장 예외:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * 공휴일 데이터를 holidays_events 테이블에 저장
 */
async function saveHolidaysToDb(
  supabase: ReturnType<typeof createClient>,
  storeId: string | null,
  userId: string | null,
  orgId: string | null,
  holidays: any[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!holidays || holidays.length === 0) {
      return { success: true, count: 0 };
    }

    const records = holidays.map((item: any) => {
      const dateStr = String(item.locdate);
      const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

      // 쇼핑 시즌 판별
      const shoppingHolidays = ['설날', '추석', '크리스마스', '어린이날', '어버이날', '블랙프라이데이'];
      const isShoppingHoliday = shoppingHolidays.some((h) => item.dateName?.includes(h));

      return {
        user_id: userId,
        org_id: orgId,
        store_id: storeId,
        date: formattedDate,
        event_name: item.dateName,
        event_type: 'holiday',
        impact_level: isShoppingHoliday ? 'high' : 'medium',
        is_global: true,
        description: `공휴일: ${item.dateName}`,
        metadata: {
          is_holiday: item.isHoliday === 'Y',
          is_shopping_holiday: isShoppingHoliday,
          source: 'data-go-kr',
          synced_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from('holidays_events')
      .upsert(records as any, {
        onConflict: 'date,event_name',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('[environment-proxy] holidays_events 저장 실패:', error.message);
      return { success: false, count: 0, error: error.message };
    }

    console.log(`[environment-proxy] holidays_events 저장 성공: ${records.length}건`);
    return { success: true, count: records.length };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[environment-proxy] holidays_events 저장 예외:', errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Supabase 클라이언트 초기화 (Service Role로 RLS 우회)
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  let supabase: ReturnType<typeof createClient> | null = null;
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  try {
    const body = (await req.json()) as Partial<RequestBody>;

    // ========================================
    // 날씨 API 처리
    // ========================================
    if (body.type === "weather") {
      const apiKey = getEnv("OPENWEATHERMAP_API_KEY", "VITE_OPENWEATHERMAP_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing OPENWEATHERMAP_API_KEY" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const weatherReq = body as WeatherRequest;
      const lat = Number(weatherReq.lat);
      const lon = Number(weatherReq.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return new Response(
          JSON.stringify({ error: "lat/lon are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const url = new URL("https://api.openweathermap.org/data/2.5/weather");
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lon));
      url.searchParams.set("appid", apiKey);
      url.searchParams.set("units", "metric");
      url.searchParams.set("lang", "kr");

      const res = await fetch(url.toString());
      const text = await res.text();

      if (!res.ok) {
        return new Response(text, {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": res.headers.get("content-type") ?? "text/plain" },
        });
      }

      // DB 저장 (store_id가 있고 save_to_db가 true인 경우)
      let dbSaveResult = null;
      const shouldSave = weatherReq.save_to_db !== false && weatherReq.store_id && supabase;

      if (shouldSave) {
        try {
          const weatherData = JSON.parse(text);
          dbSaveResult = await saveWeatherToDb(
            supabase!,
            weatherReq.store_id!,
            weatherReq.user_id || null,
            weatherReq.org_id || null,
            weatherData
          );
        } catch (e) {
          console.error('[environment-proxy] DB 저장 중 JSON 파싱 에러:', e);
        }
      }

      // 응답에 DB 저장 결과 포함
      const responseData = JSON.parse(text);
      if (dbSaveResult) {
        responseData._db_save = dbSaveResult;
      }

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========================================
    // 공휴일 API 처리
    // ========================================
    if (body.type === "holidays") {
      const apiKey = getEnv("DATA_GO_KR_API_KEY", "VITE_DATA_GO_KR_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing DATA_GO_KR_API_KEY" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const holidaysReq = body as HolidaysRequest;
      const countryCode = holidaysReq.countryCode ?? "KR";
      if (countryCode !== "KR") {
        return new Response(
          JSON.stringify({ error: "Only KR holidays are supported" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const year = Number(holidaysReq.year);
      const month = Number(holidaysReq.month);
      if (!Number.isFinite(year) || !Number.isFinite(month)) {
        return new Response(
          JSON.stringify({ error: "year/month are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const url = new URL(
        "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo"
      );
      url.searchParams.set("serviceKey", apiKey);
      url.searchParams.set("solYear", String(year));
      url.searchParams.set("solMonth", String(month).padStart(2, "0"));
      url.searchParams.set("_type", "json");

      const res = await fetch(url.toString());
      const text = await res.text();

      if (!res.ok) {
        return new Response(text, {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": res.headers.get("content-type") ?? "text/plain" },
        });
      }

      // DB 저장 (save_to_db가 true인 경우)
      let dbSaveResult = null;
      const shouldSave = holidaysReq.save_to_db !== false && supabase;

      if (shouldSave) {
        try {
          const holidaysData = JSON.parse(text);
          const items = holidaysData.response?.body?.items?.item;
          const holidaysList = Array.isArray(items) ? items : items ? [items] : [];

          if (holidaysList.length > 0) {
            dbSaveResult = await saveHolidaysToDb(
              supabase!,
              holidaysReq.store_id || null,
              holidaysReq.user_id || null,
              holidaysReq.org_id || null,
              holidaysList
            );
          }
        } catch (e) {
          console.error('[environment-proxy] 공휴일 DB 저장 중 에러:', e);
        }
      }

      // 응답에 DB 저장 결과 포함
      const responseData = JSON.parse(text);
      if (dbSaveResult) {
        responseData._db_save = dbSaveResult;
      }

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid request type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("environment-proxy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
