import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WiFiTrackingRow {
  store_id?: string;
  session_id: string;
  timestamp: string;
  x: number;
  z: number;
  accuracy?: number;
  status?: string;
  zone_id?: string;
}

interface WiFiZoneRow {
  store_id?: string;
  zone_id: number;
  grid_x?: number;
  grid_z?: number;
  x_min?: number;
  x_max?: number;
  z_min?: number;
  z_max?: number;
  center_x?: number;
  center_z?: number;
  width_m?: number;
  depth_m?: number;
  x?: number;
  y?: number;
  z?: number;
}

interface WiFiSensorRow {
  store_id?: string;
  sensor_id: string;
  x: number;
  y: number;
  z: number;
  range_meters?: number;
  status?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { filePath, storeId } = await req.json();
    
    console.log('Processing WiFi data:', { filePath, storeId, userId: user.id });

    // Storage에서 파일 다운로드
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('store-data')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // CSV 파싱
    const csvText = await fileData.text();
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    console.log(`Parsed ${rows.length} rows with headers:`, headers);

    // 파일 타입 감지 및 처리
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';
    let processedCount = 0;
    let metadata: any = null;

    if (fileName.includes('tracking') || headers.includes('session_id')) {
      // WiFi Tracking 데이터
      console.log('Processing as WiFi tracking data');
      
      const trackingData = rows.map((row: WiFiTrackingRow) => ({
        user_id: user.id,
        store_id: storeId || row.store_id,
        session_id: row.session_id,
        timestamp: row.timestamp,
        x: parseFloat(row.x as any),
        z: parseFloat(row.z as any),
        accuracy: row.accuracy ? parseFloat(row.accuracy as any) : null,
        status: row.status || 'moving'
      }));

      // 배치로 나눠서 저장 (1000개씩)
      const batchSize = 1000;
      for (let i = 0; i < trackingData.length; i += batchSize) {
        const batch = trackingData.slice(i, i + batchSize);
        const { error: insertError } = await supabaseClient
          .from('wifi_tracking')
          .insert(batch);

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(`Failed to insert tracking data: ${insertError.message}`);
        }
        processedCount += batch.length;
        console.log(`Inserted batch: ${i + batch.length}/${trackingData.length}`);
      }

    } else if (fileName.includes('zone') || headers.includes('zone_id')) {
      // WiFi Zone 데이터
      console.log('Processing as WiFi zone data');
      
      const zoneData = rows.map((row: WiFiZoneRow) => ({
        user_id: user.id,
        store_id: storeId || row.store_id,
        zone_id: parseInt(row.zone_id as any),
        x: row.center_x ? parseFloat(row.center_x as any) : parseFloat(row.x as any),
        y: row.y ? parseFloat(row.y as any) : 2.5,
        z: row.center_z ? parseFloat(row.center_z as any) : parseFloat(row.z as any),
        metadata: {
          grid_x: row.grid_x ? parseInt(row.grid_x as any) : null,
          grid_z: row.grid_z ? parseInt(row.grid_z as any) : null,
          bounds: row.x_min ? {
            x_min: parseFloat(row.x_min as any),
            x_max: parseFloat(row.x_max as any),
            z_min: parseFloat(row.z_min as any),
            z_max: parseFloat(row.z_max as any)
          } : null,
          width_m: row.width_m ? parseFloat(row.width_m as any) : null,
          depth_m: row.depth_m ? parseFloat(row.depth_m as any) : null
        }
      }));

      const { error: insertError } = await supabaseClient
        .from('wifi_zones')
        .insert(zoneData);

      if (insertError) {
        throw new Error(`Failed to insert zone data: ${insertError.message}`);
      }
      processedCount = zoneData.length;

      // Store Space Metadata 자동 생성
      if (rows.length > 0 && rows[0].x_min !== undefined) {
        const allXMins = rows.map((r: WiFiZoneRow) => parseFloat(r.x_min as any));
        const allXMaxs = rows.map((r: WiFiZoneRow) => parseFloat(r.x_max as any));
        const allZMins = rows.map((r: WiFiZoneRow) => parseFloat(r.z_min as any));
        const allZMaxs = rows.map((r: WiFiZoneRow) => parseFloat(r.z_max as any));

        const realWorldBounds = {
          min_x: Math.min(...allXMins),
          max_x: Math.max(...allXMaxs),
          min_z: Math.min(...allZMins),
          max_z: Math.max(...allZMaxs)
        };

        const realWidth = realWorldBounds.max_x - realWorldBounds.min_x;
        const realDepth = realWorldBounds.max_z - realWorldBounds.min_z;

        metadata = {
          storeSpaceMetadata: {
            realWorldBounds,
            realWorldSize: {
              width: realWidth,
              depth: realDepth,
              height: 5.0
            },
            modelScale: {
              x: 1.0,
              y: 1.0,
              z: 1.0
            },
            coordinateSystem: 'real-world',
            zones: zoneData.map(z => ({
              zone_id: `Z${String(z.zone_id).padStart(4, '0')}`,
              name: `Zone ${z.zone_id}`,
              bounds: z.metadata.bounds || {
                min_x: z.x - 0.5,
                max_x: z.x + 0.5,
                min_z: z.z - 0.5,
                max_z: z.z + 0.5
              }
            }))
          }
        };

        // Store 메타데이터 업데이트
        const { error: updateError } = await supabaseClient
          .from('stores')
          .update({ metadata })
          .eq('id', storeId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Failed to update store metadata:', updateError);
        } else {
          console.log('Store metadata updated successfully');
        }
      }

    } else if (fileName.includes('sensor') || headers.includes('sensor_id')) {
      // WiFi Sensor 데이터 (wifi_zones 테이블에 센서로 저장)
      console.log('Processing as WiFi sensor data');
      
      const sensorData = rows.map((row: WiFiSensorRow, index: number) => ({
        user_id: user.id,
        store_id: storeId || row.store_id,
        zone_id: index + 1000, // 센서는 1000번대 zone_id 사용
        x: parseFloat(row.x as any),
        y: parseFloat(row.y as any),
        z: parseFloat(row.z as any),
        metadata: {
          sensor_id: row.sensor_id,
          range_meters: row.range_meters ? parseFloat(row.range_meters as any) : 10,
          status: row.status || 'active',
          type: 'sensor'
        }
      }));

      const { error: insertError } = await supabaseClient
        .from('wifi_zones')
        .insert(sensorData);

      if (insertError) {
        throw new Error(`Failed to insert sensor data: ${insertError.message}`);
      }
      processedCount = sensorData.length;
    } else {
      throw new Error('Unknown WiFi data type. File must contain tracking, zone, or sensor data.');
    }

    console.log(`Successfully processed ${processedCount} records`);

    return new Response(
      JSON.stringify({
        success: true,
        processedCount,
        metadata,
        message: `Successfully processed ${processedCount} WiFi data records`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing WiFi data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
