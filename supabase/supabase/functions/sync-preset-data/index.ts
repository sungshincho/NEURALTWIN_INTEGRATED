import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApiConnection {
  id: string;
  name: string;
  type: string;
  url: string;
  auth_type: string;
  auth_value: string | null;
  method: string;
  headers: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header for user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Create client with user's JWT for RLS policies
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verify user is NEURALTWIN_MASTER
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: memberData } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!memberData || memberData.role !== 'NEURALTWIN_MASTER') {
      throw new Error('Unauthorized: NEURALTWIN_MASTER role required');
    }

    const { connectionId } = await req.json();

    if (!connectionId) {
      throw new Error('connectionId is required');
    }

    console.log('Syncing data for connection:', connectionId);

    // API 연결 정보 가져오기
    const { data: connection, error: connError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      throw new Error('API connection not found or inactive');
    }

    // 외부 API 호출
    const connectionHeaders = connection.headers || {};
    const headers = new Headers();
    
    // Build URL with query parameters if provided
    let apiUrl = connection.url;
    const queryParams = connectionHeaders.query_params || connectionHeaders.queryParams;
    
    if (queryParams && typeof queryParams === 'object') {
      const urlObj = new URL(connection.url);
      Object.entries(queryParams).forEach(([key, value]) => {
        urlObj.searchParams.append(key, String(value));
      });
      apiUrl = urlObj.toString();
    }
    
    // Add HTTP headers (excluding query_params/queryParams)
    Object.entries(connectionHeaders).forEach(([key, value]) => {
      if (key !== 'query_params' && key !== 'queryParams') {
        headers.set(key, String(value));
      }
    });
    
    if (connection.auth_type === 'bearer' && connection.auth_value) {
      headers.set('Authorization', `Bearer ${connection.auth_value}`);
    } else if (connection.auth_type === 'basic' && connection.auth_value) {
      headers.set('Authorization', `Basic ${connection.auth_value}`);
    } else if (connection.auth_type === 'api_key' && connection.auth_value) {
      // For APIs that require API key as query parameter
      const urlObj = new URL(apiUrl);
      urlObj.searchParams.append('accessToken', connection.auth_value);
      apiUrl = urlObj.toString();
    }

    console.log('Calling external API:', apiUrl);
    
    const apiResponse = await fetch(apiUrl, {
      method: connection.method || 'GET',
      headers,
    });

    if (!apiResponse.ok) {
      throw new Error(`External API error: ${apiResponse.statusText}`);
    }

    const apiData = await apiResponse.json();
    console.log('API response received:', apiData);

    // API 오류 응답 체크 (한국 API들은 200 상태로 오류를 반환하는 경우가 많음)
    if (apiData.errCd || apiData.error || apiData.errorCode) {
      const errorMsg = apiData.errMsg || apiData.error_description || apiData.message || 'API returned an error';
      throw new Error(`External API error: ${errorMsg} (Code: ${apiData.errCd || apiData.errorCode || 'unknown'})`);
    }

    // 데이터 타입 감지 및 저장
    const dataType = detectDataType(connection.name, connection.url, apiData);
    const savedCount = await savePresetData(supabase, dataType, apiData, user.id);

    // last_sync 업데이트
    await supabase
      .from('api_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', connectionId);

    console.log(`Successfully synced ${savedCount} records`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${savedCount}개의 레코드가 동기화되었습니다`,
        dataType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function detectDataType(name: string, url: string, data: any): string {
  const nameLower = name.toLowerCase();
  const urlLower = url.toLowerCase();
  
  if (nameLower.includes('weather') || urlLower.includes('weather') || urlLower.includes('openweathermap')) {
    return 'weather';
  } else if (nameLower.includes('economic') || nameLower.includes('경제') || urlLower.includes('economic')) {
    return 'economic';
  } else if (nameLower.includes('holiday') || nameLower.includes('event') || nameLower.includes('휴일')) {
    return 'holiday';
  } else if (nameLower.includes('regional') || nameLower.includes('region') || nameLower.includes('지역')) {
    return 'regional';
  }
  
  // OpenWeatherMap API 구조 감지
  if (data.main?.temp !== undefined || data.weather !== undefined) {
    return 'weather';
  }
  
  // 데이터 구조로 추론
  if (data.temperature !== undefined || data.condition !== undefined) {
    return 'weather';
  } else if (data.indicator_type !== undefined || data.gdp !== undefined) {
    return 'economic';
  } else if (data.event_name !== undefined || data.holiday !== undefined) {
    return 'holiday';
  } else if (data.region !== undefined && data.population !== undefined) {
    return 'regional';
  }
  
  return 'unknown';
}

async function savePresetData(supabase: any, dataType: string, apiData: any, userId: string): Promise<number> {
  let records: any[] = [];
  const dataArray = Array.isArray(apiData) ? apiData : [apiData];

  switch (dataType) {
    case 'weather':
      records = dataArray.map(item => {
        // OpenWeatherMap API 응답 구조 처리
        let condition = 'unknown';
        let temperature = null;
        let precipitation = null;
        let humidity = null;
        let wind_speed = null;

        if (item.weather && Array.isArray(item.weather) && item.weather.length > 0) {
          condition = item.weather[0].main || item.weather[0].description || 'unknown';
        } else if (item.condition) {
          condition = item.condition;
        }

        if (item.main?.temp !== undefined) {
          // OpenWeatherMap는 켈빈 단위, 섭씨로 변환 후 정수로 반올림
          temperature = Math.round(item.main.temp - 273.15);
        } else if (item.temperature !== undefined) {
          temperature = Math.round(item.temperature);
        } else if (item.temp !== undefined) {
          temperature = Math.round(item.temp);
        }

        if (item.rain?.['1h'] !== undefined) {
          precipitation = Math.round(item.rain['1h']);
        } else if (item.precipitation !== undefined) {
          precipitation = Math.round(item.precipitation);
        } else {
          precipitation = 0; // 비가 오지 않으면 0mm
        }

        if (item.wind?.speed !== undefined) {
          wind_speed = Math.round(item.wind.speed);
        } else if (item.wind_speed !== undefined) {
          wind_speed = Math.round(item.wind_speed);
        }

        return {
          user_id: userId,
          date: item.date || new Date().toISOString().split('T')[0],
          weather_condition: condition,
          temperature,
          precipitation,
          humidity,
          wind_speed,
          metadata: {
            ...item.metadata,
            source: 'api_sync',
            original_data: {
              name: item.name,
              country: item.sys?.country,
              coord: item.coord,
            }
          },
          is_global: true,
        };
      });
      
      console.log('Inserting weather records:', records);
      const { error: insertError } = await supabase.from('weather_data').insert(records);
      if (insertError) {
        console.error('Weather insert error:', insertError);
        throw new Error(`Failed to insert weather data: ${insertError.message}`);
      }
      break;

    case 'economic':
      records = dataArray.map(item => ({
        user_id: userId,
        date: item.date || new Date().toISOString().split('T')[0],
        indicator_type: item.indicator_type || item.type || 'unknown',
        indicator_value: item.indicator_value || item.value || 0,
        region: item.region || null,
        source: item.source || null,
        unit: item.unit || null,
        metadata: item.metadata || {},
        is_global: true,
      }));
      
      const { error: economicError } = await supabase.from('economic_indicators').insert(records);
      if (economicError) throw new Error(`Failed to insert economic data: ${economicError.message}`);
      break;

    case 'holiday':
      records = dataArray.map(item => ({
        user_id: userId,
        date: item.date || new Date().toISOString().split('T')[0],
        event_name: item.event_name || item.name || item.holiday || 'unknown',
        event_type: item.event_type || item.type || 'holiday',
        description: item.description || null,
        impact_level: item.impact_level || null,
        metadata: item.metadata || {},
        is_global: true,
      }));
      
      const { error: holidayError } = await supabase.from('holidays_events').insert(records);
      if (holidayError) throw new Error(`Failed to insert holiday data: ${holidayError.message}`);
      break;

    case 'regional':
      records = dataArray.map(item => ({
        user_id: userId,
        date: item.date || new Date().toISOString().split('T')[0],
        region: item.region || 'unknown',
        population: item.population || null,
        gdp: item.gdp || null,
        unemployment_rate: item.unemployment_rate || null,
        consumer_confidence: item.consumer_confidence || null,
        metadata: item.metadata || {},
        is_global: true,
      }));
      
      const { error: regionalError } = await supabase.from('regional_data').insert(records);
      if (regionalError) throw new Error(`Failed to insert regional data: ${regionalError.message}`);
      break;

    default:
      throw new Error(`Unknown data type: ${dataType}`);
  }

  return records.length;
}
