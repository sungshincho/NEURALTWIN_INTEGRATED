/**
 * 데이터 컨트롤타워 쿼리 핸들러
 * queryType: dataQuality, dataSources, contextDataSources,
 *            pipelineStatus, apiConnections, importHistory
 */

import { QueryActionResult, PageContext, SupabaseClient } from './types.ts';

function buildUnifiedSources(status: any): Array<{
  key: string;
  name: string;
  status: string;
  available: boolean;
  recordCount: number;
}> {
  const coverage = status?.quality_score?.coverage || {};
  const dataSources = status?.data_sources || {};
  const KNOWN_SOURCES: Array<{ key: string; name: string }> = [
    { key: 'pos', name: 'POS/매출 데이터' },
    { key: 'sensor', name: 'NEURALSENSE 센서' },
    { key: 'crm', name: 'CRM/고객 데이터' },
    { key: 'product', name: '상품 마스터' },
    { key: 'erp', name: 'ERP/재고 데이터' },
  ];
  return KNOWN_SOURCES.map(({ key, name }) => {
    const cov = coverage[key];
    const ds = dataSources[key];
    return {
      key,
      name: ds?.name ? `${ds.name}` : cov?.label || name,
      status: ds?.status || (cov?.available ? 'active' : 'inactive'),
      available: cov?.available ?? ((ds?.status === 'active') || false),
      recordCount: cov?.record_count || 0,
    };
  });
}

export async function queryDataQuality(
  supabase: SupabaseClient, storeId: string, pageContext?: PageContext
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';
  try {
    const { data, error } = await supabase.rpc('get_data_control_tower_status', { p_store_id: storeId, p_limit: 5 });
    if (error) throw error;
    const status = data as any;
    const score = status?.quality_score;
    if (!score) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '데이터 품질 점수를 조회할 수 없습니다. 데이터 컨트롤타워에서 확인해 주세요.',
        suggestions: ['데이터 컨트롤타워로 가줘', '매출 알려줘'],
      };
    }
    const sources = buildUnifiedSources(status);
    const availableCount = sources.filter(s => s.available).length;
    const totalCount = sources.length || 5;
    const overallScore = score.overall_score || Math.round((availableCount / totalCount) * 100);
    const confidenceLevel = score.confidence_level || (overallScore >= 75 ? 'high' : overallScore >= 50 ? 'medium' : 'low');
    const gradeEmoji = overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C' : 'D';
    const confidenceLabel = confidenceLevel === 'high' ? '높음' : confidenceLevel === 'medium' ? '보통' : '낮음';
    const coverageLines = sources.map(src => {
      const statusText = src.available ? '연동' : '미연동';
      const count = src.recordCount > 0 ? ` (${src.recordCount.toLocaleString()}건)` : '';
      return `• ${src.name}: ${statusText}${count}`;
    }).join('\n');
    const warningCount = score.warning_count || 0;
    const warningNote = warningCount > 0 ? `\n\n${warningCount}건의 경고가 있습니다.` : '';
    const message = `현재 데이터 품질 점수는 ${overallScore}점 (${gradeEmoji})입니다.\n신뢰도: ${confidenceLabel}\n\n${coverageLines}${warningNote}` +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['연결된 소스 뭐 있어?', '새 연결 추가해줘', '데이터 흐름 현황 확인'],
      data: { overallScore, confidenceLevel, sources },
    };
  } catch (error) {
    console.error('[queryDataQuality] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '데이터 품질 점수를 조회하는 중 오류가 발생했습니다.' +
        (!isOnControlTower ? ' 데이터 컨트롤타워에서 직접 확인해 주세요.' : ''),
      suggestions: ['데이터 컨트롤타워로 가줘', '매출 알려줘'],
    };
  }
}

export async function queryDataSources(
  supabase: SupabaseClient, storeId: string, pageContext?: PageContext
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';
  try {
    const { data, error } = await supabase.rpc('get_data_control_tower_status', { p_store_id: storeId, p_limit: 20 });
    if (error) throw error;
    const status = data as any;
    const sources = buildUnifiedSources(status);
    if (sources.length === 0) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '현재 연결된 비즈니스 데이터 소스가 없습니다. 새 연결을 추가해 보세요.',
        suggestions: ['새 연결 추가해줘', '데이터 컨트롤타워로 가줘'],
      };
    }
    const sourceList = sources.map(src => {
      const statusLabel = src.status === 'active' ? '활성' : src.status === 'error' ? '오류' : '비활성';
      const count = src.recordCount > 0 ? ` (${src.recordCount.toLocaleString()}건)` : '';
      return `• ${src.name}: ${statusLabel}${count}`;
    }).join('\n');
    const activeCount = sources.filter(s => s.status === 'active').length;
    const message = `현재 ${sources.length}개 비즈니스 데이터 소스가 연결되어 있습니다 (활성: ${activeCount}개).\n\n${sourceList}` +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['컨텍스트 데이터 소스 확인', '데이터 품질 점수 알려줘', '새 연결 추가해줘'],
      data: { totalSources: sources.length, activeCount },
    };
  } catch (error) {
    console.error('[queryDataSources] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '비즈니스 데이터 소스 현황을 조회하는 중 오류가 발생했습니다.' +
        (!isOnControlTower ? ' 데이터 컨트롤타워에서 직접 확인해 주세요.' : ''),
      suggestions: ['데이터 컨트롤타워로 가줘', '매출 알려줘'],
    };
  }
}

export async function queryContextDataSources(
  supabase: SupabaseClient, storeId: string, pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';
  try {
    if (!orgId) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '매장 정보를 찾을 수 없습니다.',
        suggestions: ['데이터 컨트롤타워로 가줘'],
      };
    }
    const { data: connections, error } = await supabase
      .from('api_connections')
      .select('id, name, provider, data_category, is_active, status, total_records_synced, last_sync, description')
      .eq('org_id', orgId)
      .or('connection_category.eq.context,data_category.in.(weather,holidays)')
      .order('display_order', { ascending: true });
    if (error) throw error;
    if (!connections || connections.length === 0) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '현재 연결된 컨텍스트 데이터 소스가 없습니다. 날씨/공휴일 데이터 연동을 설정해 보세요.',
        suggestions: ['비즈니스 데이터 소스 확인', '새 연결 추가해줘'],
      };
    }
    const sourceList = connections.map((conn: any) => {
      const isActive = conn.is_active || conn.status === 'active';
      const statusLabel = isActive ? '활성' : '비활성';
      const records = conn.total_records_synced ? ` (${conn.total_records_synced.toLocaleString()}건)` : '';
      const desc = conn.description ? ` — ${conn.description}` : '';
      return `• ${conn.name}: ${statusLabel}${records}${desc}`;
    }).join('\n');
    const activeCount = connections.filter((c: any) => c.is_active || c.status === 'active').length;
    const message = `현재 ${connections.length}개 컨텍스트 데이터 소스가 연결되어 있습니다 (활성: ${activeCount}개).\n\n${sourceList}` +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['비즈니스 데이터 소스 확인', '데이터 품질 점수 알려줘', '데이터 흐름 현황 확인'],
      data: { totalSources: connections.length, activeCount },
    };
  } catch (error) {
    console.error('[queryContextDataSources] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '컨텍스트 데이터 소스 현황을 조회하는 중 오류가 발생했습니다.',
      suggestions: ['데이터 컨트롤타워로 가줘', '비즈니스 데이터 소스 확인'],
    };
  }
}

export async function queryPipelineStatus(
  supabase: SupabaseClient, storeId: string, pageContext?: PageContext
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';
  try {
    const { data, error } = await supabase.rpc('get_data_control_tower_status', { p_store_id: storeId, p_limit: 5 });
    if (error) throw error;
    const status = data as any;
    const pipeline = status?.pipeline_stats || {};
    const coverage = status?.quality_score?.coverage || {};
    let dataFlows = pipeline.data_flows || [];
    if (dataFlows.length === 0) {
      const l3Records = pipeline.l3_records || 0;
      const rawTotal = pipeline.raw_imports?.total || 0;
      const rawCompleted = pipeline.raw_imports?.completed || 0;
      dataFlows = [
        { label: 'POS', source: 'pos', inputCount: coverage.pos?.record_count || 0, outputTable: 'transactions', outputCount: coverage.pos?.record_count || 0, kpiConnected: l3Records > 0 && (coverage.pos?.record_count || 0) > 0, status: (coverage.pos?.record_count || 0) > 0 ? 'active' : 'inactive' },
        { label: '센서', source: 'sensor', inputCount: coverage.sensor?.record_count || 0, outputTable: 'zone_events', outputCount: pipeline.l2_records || coverage.sensor?.record_count || 0, kpiConnected: l3Records > 0 && (coverage.sensor?.record_count || 0) > 0, status: (coverage.sensor?.record_count || 0) > 0 ? 'active' : 'inactive' },
        { label: '고객', source: 'customer', inputCount: coverage.crm?.record_count || 0, outputTable: 'customers', outputCount: coverage.crm?.record_count || 0, kpiConnected: false, status: (coverage.crm?.record_count || 0) > 0 ? 'active' : 'inactive' },
        { label: '재고', source: 'inventory', inputCount: coverage.erp?.record_count || 0, outputTable: 'inventory_levels', outputCount: coverage.erp?.record_count || 0, kpiConnected: false, status: (coverage.erp?.record_count || 0) > 0 ? 'active' : 'inactive' },
        { label: '파일', source: 'import', inputCount: rawTotal, outputTable: 'user_data_imports', outputCount: rawCompleted, kpiConnected: false, status: rawTotal > 0 ? 'active' : 'inactive' },
      ];
    }
    const activeFlows = dataFlows.filter((f: any) => f.status === 'active').length;
    const kpiConnected = dataFlows.filter((f: any) => f.kpiConnected).length;
    const l3Records = pipeline.l3_records || 0;
    const health = pipeline.pipeline_health || {};
    const healthStatus = health.status === 'healthy' ? '정상' : health.status === 'warning' ? '주의' : (activeFlows >= 3 ? '정상' : activeFlows >= 1 ? '주의' : '확인 필요');
    const healthMessage = health.message || '';
    const flowLines = dataFlows.map((flow: any) => {
      const statusText = flow.status === 'active' ? '활성' : '비활성';
      const input = flow.inputCount ? flow.inputCount.toLocaleString() : '0';
      const output = flow.outputCount ? flow.outputCount.toLocaleString() : '0';
      const kpi = flow.kpiConnected ? ' → KPI 연결' : '';
      return `• ${flow.label}: ${statusText} (${input}건 → ${flow.outputTable} ${output}건${kpi})`;
    }).join('\n');
    const message = `데이터 흐름 현황:\n\n` +
      `활성 소스: ${activeFlows}/${dataFlows.length}개 | KPI 연결: ${kpiConnected}개 | L3 집계: ${l3Records.toLocaleString()}건\n\n` +
      flowLines +
      (healthMessage ? `\n\n${healthMessage}` : '') +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['데이터 품질 점수 알려줘', '연결된 소스 확인', '임포트 히스토리 보여줘'],
      data: { healthStatus, activeFlows, totalFlows: dataFlows.length, kpiConnected, l3Records },
    };
  } catch (error) {
    console.error('[queryPipelineStatus] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '데이터 흐름 현황을 조회하는 중 오류가 발생했습니다.',
      suggestions: ['데이터 컨트롤타워로 가줘', '매출 알려줘'],
    };
  }
}

export async function queryApiConnections(
  supabase: SupabaseClient, storeId: string, pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';
  try {
    if (!orgId) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '매장 정보를 찾을 수 없습니다.',
        suggestions: ['데이터 컨트롤타워로 가줘'],
      };
    }
    const { data: connections, error } = await supabase
      .from('api_connections')
      .select('id, name, type, provider, data_category, connection_category, is_active, status, total_records_synced, last_sync')
      .eq('org_id', orgId)
      .order('display_order', { ascending: true });
    if (error) throw error;
    if (!connections || connections.length === 0) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '현재 연결된 API가 없습니다. 새 연결을 추가해 보세요.',
        suggestions: ['새 연결 추가해줘', '데이터 컨트롤타워로 가줘'],
      };
    }
    const connList = connections.map((conn: any) => {
      const isActive = conn.is_active || conn.status === 'active';
      const statusLabel = isActive ? '활성' : conn.status === 'error' ? '오류' : '비활성';
      const category = conn.data_category || conn.connection_category || '';
      const records = conn.total_records_synced ? ` (${conn.total_records_synced.toLocaleString()}건)` : '';
      return `• ${conn.name}${category ? ` [${category}]` : ''}: ${statusLabel}${records}`;
    }).join('\n');
    const activeCount = connections.filter((c: any) => c.is_active || c.status === 'active').length;
    const message = `현재 ${connections.length}개 API가 연결되어 있습니다 (활성: ${activeCount}개).\n\n${connList}` +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['새 연결 추가해줘', '데이터 품질 점수 알려줘', '임포트 히스토리 보여줘'],
      data: { totalConnections: connections.length, activeCount },
    };
  } catch (error) {
    console.error('[queryApiConnections] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: 'API 연결 현황을 조회하는 중 오류가 발생했습니다.',
      suggestions: ['데이터 컨트롤타워로 가줘'],
    };
  }
}

export async function queryImportHistory(
  supabase: SupabaseClient, storeId: string, pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  const isOnControlTower = pageContext?.current === '/data/control-tower';
  try {
    if (!orgId) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '매장 정보를 찾을 수 없습니다.',
        suggestions: ['데이터 컨트롤타워로 가줘'],
      };
    }
    const { data: imports, error } = await supabase
      .from('user_data_imports')
      .select('id, file_name, data_type, total_rows, status, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    if (!imports || imports.length === 0) {
      return {
        actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
        message: '임포트 히스토리가 없습니다. 데이터를 임포트해 보세요.',
        suggestions: ['데이터 컨트롤타워로 가줘', '연결된 소스 확인'],
      };
    }
    const typeLabels: Record<string, string> = {
      products: '상품', customers: '고객', transactions: '거래', staff: '직원', inventory: '재고',
    };
    const statusLabels: Record<string, string> = {
      pending: '대기', processing: '처리중', completed: '완료', partial: '부분완료', failed: '실패', rolled_back: '롤백됨',
    };
    const importList = imports.map((imp: any) => {
      const type = typeLabels[imp.data_type] || imp.data_type || '-';
      const statusText = statusLabels[imp.status] || imp.status || '-';
      const rows = imp.total_rows ? `${imp.total_rows.toLocaleString()}행` : '-';
      const date = imp.created_at ? new Date(imp.created_at).toLocaleDateString('ko-KR') : '-';
      return `• ${imp.file_name || '파일'} (${type}) — ${rows} — ${statusText} — ${date}`;
    }).join('\n');
    const completedCount = imports.filter((i: any) => i.status === 'completed').length;
    const failedCount = imports.filter((i: any) => i.status === 'failed').length;
    const message = `최근 임포트 히스토리 (${imports.length}건):\n\n${importList}` +
      (failedCount > 0 ? `\n\n${failedCount}건 실패가 있습니다.` : '') +
      (!isOnControlTower ? '\n\n데이터 컨트롤타워로 이동합니다.' : '');
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message,
      suggestions: ['데이터 품질 점수 알려줘', '연결된 소스 확인', '데이터 흐름 현황 확인'],
      data: { totalImports: imports.length, completedCount, failedCount },
    };
  } catch (error) {
    console.error('[queryImportHistory] Error:', error);
    return {
      actions: isOnControlTower ? [] : [{ type: 'navigate', target: '/data/control-tower' }],
      message: '임포트 히스토리를 조회하는 중 오류가 발생했습니다.',
      suggestions: ['데이터 컨트롤타워로 가줘'],
    };
  }
}
