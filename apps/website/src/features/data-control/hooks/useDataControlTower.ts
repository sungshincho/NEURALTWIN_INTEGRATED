// ============================================================================
// Data Control Tower Hooks
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAuth } from '@/hooks/useAuth';
import type {
  DataControlTowerStatus,
  DataQualityScore,
  RawImport,
  ETLRun,
  KPILineage,
  ContextDataSource,
  AllDataSources,
} from '../types';

// ============================================================================
// useDataControlTowerStatus - Control Tower 전체 상태 조회
// ============================================================================
export function useDataControlTowerStatus() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  const storeId = selectedStore?.id;

  return useQuery<DataControlTowerStatus>({
    queryKey: ['data-control-tower', storeId],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('No store selected');
      }

      // Try RPC first, fallback to direct queries if not available
      try {
        const { data, error } = await supabase
          .rpc('get_data_control_tower_status', {
            p_store_id: storeId,
            p_limit: 20,
          });

        if (error) throw error;

        // RPC 결과에 ERP 데이터가 없으면 병합
        const result = data as unknown as DataControlTowerStatus;
        return await ensureERPCoverage(result, storeId, orgId);
      } catch (rpcError) {
        // Fallback: build status from direct queries
        console.warn('RPC not available, using fallback queries:', rpcError);
        return await buildControlTowerStatusFallback(storeId, orgId);
      }
    },
    enabled: !!storeId,
    refetchInterval: 30000, // 30초마다 새로고침
  });
}

// ERP 데이터가 없으면 병합하는 함수
async function ensureERPCoverage(result: DataControlTowerStatus, storeId: string, orgId?: string): Promise<DataControlTowerStatus> {
  // ERP 데이터가 이미 있으면 그대로 반환
  if (result.quality_score?.coverage?.erp) {
    return result;
  }

  // ERP/재고 데이터 카운트
  // inventory_levels: 상품별 현재 재고 수준 (상태 데이터) - org_id로 필터 (store_id 없음)
  // inventory_movements: 입출고 트랜잭션 이력 (이벤트 데이터) - org_id 또는 store_id로 필터
  let inventoryLevelQuery = supabase
    .from('inventory_levels')
    .select('*', { count: 'exact', head: true });
  if (orgId) {
    inventoryLevelQuery = inventoryLevelQuery.eq('org_id', orgId);
  }
  const { count: inventoryLevelCount } = await inventoryLevelQuery;

  let inventoryMovementQuery = supabase
    .from('inventory_movements')
    .select('*', { count: 'exact', head: true });
  if (orgId) {
    inventoryMovementQuery = inventoryMovementQuery.eq('org_id', orgId);
  }
  const { count: inventoryMovementCount } = await inventoryMovementQuery;

  // ERP 데이터 존재 여부: levels가 있거나 movements 활동이 있으면 true
  const hasERPData = (inventoryLevelCount || 0) > 0 || (inventoryMovementCount || 0) > 0;
  // 표시할 레코드 수: 관리 중인 상품 수 (levels 기준)
  const erpRecordCount = inventoryLevelCount || 0;

  // Coverage에 ERP 추가
  if (result.quality_score?.coverage) {
    result.quality_score.coverage.erp = {
      available: hasERPData,
      record_count: erpRecordCount,
      label: 'ERP/재고 데이터',
    };
  }

  // Data sources에 ERP 추가
  if (result.data_sources && !result.data_sources.erp) {
    result.data_sources.erp = {
      name: 'ERP',
      description: '재고/입출고 데이터',
      status: hasERPData ? 'active' : 'inactive',
      last_sync: null,
    };
  }

  // ERP를 포함하여 전체 점수 재계산 (5개 데이터 소스 기준)
  const coverage = result.quality_score?.coverage;
  if (coverage) {
    const sources = [
      coverage.pos?.record_count || 0,
      coverage.sensor?.record_count || 0,
      coverage.crm?.record_count || 0,
      coverage.product?.record_count || 0,
      erpRecordCount,
    ];
    const availableSources = sources.filter(c => c > 0).length;
    result.quality_score.overall_score = Math.round((availableSources / 5) * 100);
    result.quality_score.confidence_level = result.quality_score.overall_score >= 75 ? 'high' : result.quality_score.overall_score >= 50 ? 'medium' : 'low';

    // pipeline_stats.data_flows가 없으면 coverage 기반으로 생성
    if (!result.pipeline_stats?.data_flows) {
      const posCount = coverage.pos?.record_count || 0;
      const sensorCount = coverage.sensor?.record_count || 0;
      const customerCount = coverage.crm?.record_count || 0;
      const productCount = coverage.product?.record_count || 0;
      const l3Count = result.pipeline_stats?.l3_records || 0;

      result.pipeline_stats = {
        ...result.pipeline_stats,
        data_flows: [
          {
            source: 'pos' as const,
            label: 'POS',
            icon: 'shopping-cart',
            inputCount: posCount,
            outputTable: 'transactions',
            outputCount: posCount,
            kpiConnected: l3Count > 0 && posCount > 0,
            status: posCount > 0 ? 'active' as const : 'inactive' as const,
            lastSync: null,
            trend: 'stable' as const,
          },
          {
            source: 'sensor' as const,
            label: '센서',
            icon: 'wifi',
            inputCount: sensorCount,
            outputTable: 'zone_events',
            outputCount: result.pipeline_stats?.l2_records || sensorCount,
            kpiConnected: l3Count > 0 && sensorCount > 0,
            status: sensorCount > 0 ? 'active' as const : 'inactive' as const,
            lastSync: null,
            trend: 'stable' as const,
          },
          {
            source: 'customer' as const,
            label: '고객',
            icon: 'users',
            inputCount: customerCount,
            outputTable: 'customers',
            outputCount: customerCount,
            kpiConnected: false,
            status: customerCount > 0 ? 'active' as const : 'inactive' as const,
            lastSync: null,
          },
          {
            source: 'inventory' as const,
            label: '재고',
            icon: 'package',
            inputCount: erpRecordCount,
            outputTable: 'inventory_levels',
            outputCount: erpRecordCount,
            kpiConnected: false,
            status: erpRecordCount > 0 ? 'active' as const : 'inactive' as const,
            lastSync: null,
          },
          {
            source: 'import' as const,
            label: '파일',
            icon: 'file-up',
            inputCount: result.pipeline_stats?.raw_imports?.total || 0,
            outputTable: 'user_data_imports',
            outputCount: result.pipeline_stats?.raw_imports?.completed || 0,
            kpiConnected: false,
            status: (result.pipeline_stats?.raw_imports?.total || 0) > 0 ? 'active' as const : 'inactive' as const,
            lastSync: null,
          },
        ],
        pipeline_health: {
          status: availableSources >= 3 ? 'healthy' as const :
                  availableSources >= 1 ? 'warning' as const : 'unknown' as const,
          message: availableSources >= 3
            ? '데이터 파이프라인이 정상 작동 중입니다.'
            : availableSources >= 1
              ? '일부 데이터 소스가 미연동 상태입니다.'
              : '데이터 소스를 연결해주세요.',
          warnings: [
            ...(posCount === 0 ? ['POS 데이터가 없습니다.'] : []),
            ...(sensorCount === 0 ? ['센서 데이터가 없습니다.'] : []),
            ...(erpRecordCount === 0 ? ['재고 데이터가 없습니다.'] : []),
          ],
        },
        today_processed: {
          input: result.pipeline_stats?.raw_imports?.total || 0,
          transformed: result.pipeline_stats?.l2_records || 0,
          aggregated: l3Count,
          failed: result.pipeline_stats?.raw_imports?.failed || 0,
        },
      };
    }
  }

  return result;
}

// DataQualityScore용 ERP 데이터 병합 함수
async function ensureERPCoverageForQualityScore(result: DataQualityScore, storeId: string, orgId?: string): Promise<DataQualityScore> {
  // ERP 데이터가 이미 있으면 그대로 반환
  if (result.coverage?.erp) {
    return result;
  }

  // ERP/재고 데이터 카운트
  // inventory_levels: 상품별 현재 재고 수준 (상태 데이터) - org_id로 필터 (store_id 없음)
  // inventory_movements: 입출고 트랜잭션 이력 (이벤트 데이터) - org_id로 필터
  let inventoryLevelQuery = supabase
    .from('inventory_levels')
    .select('*', { count: 'exact', head: true });
  if (orgId) {
    inventoryLevelQuery = inventoryLevelQuery.eq('org_id', orgId);
  }
  const { count: inventoryLevelCount } = await inventoryLevelQuery;

  let inventoryMovementQuery = supabase
    .from('inventory_movements')
    .select('*', { count: 'exact', head: true });
  if (orgId) {
    inventoryMovementQuery = inventoryMovementQuery.eq('org_id', orgId);
  }
  const { count: inventoryMovementCount } = await inventoryMovementQuery;

  // ERP 데이터 존재 여부: levels가 있거나 movements 활동이 있으면 true
  const hasERPData = (inventoryLevelCount || 0) > 0 || (inventoryMovementCount || 0) > 0;
  // 표시할 레코드 수: 관리 중인 상품 수 (levels 기준)
  const erpRecordCount = inventoryLevelCount || 0;

  // Coverage에 ERP 추가
  if (result.coverage) {
    result.coverage.erp = {
      available: hasERPData,
      record_count: erpRecordCount,
      label: 'ERP/재고 데이터',
    };
  }

  // ERP를 포함하여 전체 점수 재계산 (5개 데이터 소스 기준)
  const coverage = result.coverage;
  if (coverage) {
    const sources = [
      coverage.pos?.record_count || 0,
      coverage.sensor?.record_count || 0,
      coverage.crm?.record_count || 0,
      coverage.product?.record_count || 0,
      erpRecordCount,
    ];
    const availableSources = sources.filter(c => c > 0).length;
    result.overall_score = Math.round((availableSources / 5) * 100);
    result.confidence_level = result.overall_score >= 75 ? 'high' : result.overall_score >= 50 ? 'medium' : 'low';

    // ERP가 없으면 경고 추가
    if (!hasERPData && Array.isArray(result.warnings)) {
      const hasERPWarning = result.warnings.some((w: any) => w.source === 'erp');
      if (!hasERPWarning) {
        result.warnings.push({ type: 'missing', source: 'erp', severity: 'medium', message: 'ERP/재고 데이터가 없습니다.', affected_metrics: ['inventory'] });
        result.warning_count = result.warnings.length;
      }
    }
  }

  return result;
}

// Fallback function when RPC is not available
async function buildControlTowerStatusFallback(storeId: string, orgId?: string): Promise<DataControlTowerStatus> {
  // 1. Recent imports
  const { data: recentImports } = await supabase
    .from('raw_imports')
    .select('id, source_type, source_name, data_type, row_count, status, error_message, created_at, completed_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(20);

  // 2. Recent ETL runs
  const { data: etlRuns } = await supabase
    .from('etl_runs')
    .select('id, etl_function, status, input_record_count, output_record_count, duration_ms, started_at, completed_at')
    .eq('store_id', storeId)
    .order('started_at', { ascending: false })
    .limit(20);

  // 3. Pipeline stats
  const { count: totalImports } = await supabase
    .from('raw_imports')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: completedImports } = await supabase
    .from('raw_imports')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'completed');

  const { count: failedImports } = await supabase
    .from('raw_imports')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'failed');

  // 4. Data source checks
  // POS 데이터는 transactions 테이블만 카운트 (RPC 함수와 동일하게)
  // purchases 테이블은 API 매핑 대상이 아니므로 제외
  const { count: posCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const totalPosCount = posCount || 0;

  const { count: sensorCount } = await supabase
    .from('zone_events')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  // 4-1. ERP/재고 데이터 카운트
  // inventory_levels: 상품별 현재 재고 수준 (상태 데이터) - org_id로 필터 (store_id 없음)
  // inventory_movements: 입출고 트랜잭션 이력 (이벤트 데이터) - org_id로 필터
  let inventoryLevelQuery = supabase
    .from('inventory_levels')
    .select('*', { count: 'exact', head: true });
  if (orgId) {
    inventoryLevelQuery = inventoryLevelQuery.eq('org_id', orgId);
  }
  const { count: inventoryLevelCount } = await inventoryLevelQuery;

  let inventoryMovementQuery = supabase
    .from('inventory_movements')
    .select('*', { count: 'exact', head: true });
  if (orgId) {
    inventoryMovementQuery = inventoryMovementQuery.eq('org_id', orgId);
  }
  const { count: inventoryMovementCount } = await inventoryMovementQuery;

  // ERP 데이터 존재 여부: levels가 있거나 movements 활동이 있으면 true
  const hasERPData = (inventoryLevelCount || 0) > 0 || (inventoryMovementCount || 0) > 0;
  // 표시할 레코드 수: 관리 중인 상품 수 (levels 기준)
  const erpRecordCount = inventoryLevelCount || 0;

  // 5. L2/L3 counts
  const { count: l2Count } = await supabase
    .from('zone_events')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: l3Count } = await supabase
    .from('daily_kpis_agg')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  // Calculate quality score (now includes ERP/inventory)
  const sources = [totalPosCount, sensorCount, customerCount, productCount, erpRecordCount];
  const availableSources = sources.filter(c => (c || 0) > 0).length;
  const overallScore = Math.round((availableSources / 5) * 100);

  return {
    success: true,
    store_id: storeId,
    quality_score: {
      success: true,
      store_id: storeId,
      overall_score: overallScore,
      confidence_level: overallScore >= 75 ? 'high' : overallScore >= 50 ? 'medium' : 'low',
      coverage: {
        pos: { available: totalPosCount > 0, record_count: totalPosCount, label: 'POS/매출 데이터' },
        sensor: { available: (sensorCount || 0) > 0, record_count: sensorCount || 0, label: 'NEURALSENSE 센서' },
        crm: { available: (customerCount || 0) > 0, record_count: customerCount || 0, label: 'CRM/고객 데이터' },
        product: { available: (productCount || 0) > 0, record_count: productCount || 0, label: '상품 마스터' },
        erp: { available: hasERPData, record_count: erpRecordCount, label: 'ERP/재고 데이터' },
      },
      warnings: [],
      warning_count: 0,
    },
    data_sources: {
      pos: { name: 'POS', description: '매출/거래 데이터', status: totalPosCount > 0 ? 'active' : 'inactive', last_sync: null },
      sensor: { name: 'NEURALSENSE', description: 'WiFi/BLE 센서', status: (sensorCount || 0) > 0 ? 'active' : 'inactive', last_sync: null },
      crm: { name: 'CRM', description: '고객/CDP 데이터', status: (customerCount || 0) > 0 ? 'active' : 'inactive', last_sync: null },
      product: { name: '상품', description: '상품 마스터', status: (productCount || 0) > 0 ? 'active' : 'inactive', last_sync: null },
      erp: { name: 'ERP', description: '재고/입출고 데이터', status: hasERPData ? 'active' : 'inactive', last_sync: null },
    },
    recent_imports: (recentImports || []) as unknown as RawImport[],
    recent_etl_runs: (etlRuns || []) as unknown as ETLRun[],
    pipeline_stats: {
      raw_imports: {
        total: totalImports || 0,
        completed: completedImports || 0,
        failed: failedImports || 0,
        pending: (totalImports || 0) - (completedImports || 0) - (failedImports || 0),
      },
      l2_records: l2Count || 0,
      l3_records: l3Count || 0,
      // 새로운 데이터 흐름 정보
      data_flows: [
        {
          source: 'pos' as const,
          label: 'POS',
          icon: 'shopping-cart',
          inputCount: totalPosCount,
          outputTable: 'transactions',
          outputCount: totalPosCount,
          kpiConnected: (l3Count || 0) > 0 && totalPosCount > 0,
          status: totalPosCount > 0 ? 'active' as const : 'inactive' as const,
          lastSync: null,
          trend: 'stable' as const,
        },
        {
          source: 'sensor' as const,
          label: '센서',
          icon: 'wifi',
          inputCount: sensorCount || 0,
          outputTable: 'zone_events',
          outputCount: l2Count || 0,
          kpiConnected: (l3Count || 0) > 0 && (sensorCount || 0) > 0,
          status: (sensorCount || 0) > 0 ? 'active' as const : 'inactive' as const,
          lastSync: null,
          trend: 'stable' as const,
        },
        {
          source: 'customer' as const,
          label: '고객',
          icon: 'users',
          inputCount: customerCount || 0,
          outputTable: 'customers',
          outputCount: customerCount || 0,
          kpiConnected: false,
          status: (customerCount || 0) > 0 ? 'active' as const : 'inactive' as const,
          lastSync: null,
        },
        {
          source: 'inventory' as const,
          label: '재고',
          icon: 'package',
          inputCount: erpRecordCount,
          outputTable: 'inventory_levels',
          outputCount: erpRecordCount,
          kpiConnected: false,
          status: erpRecordCount > 0 ? 'active' as const : 'inactive' as const,
          lastSync: null,
        },
        {
          source: 'import' as const,
          label: '파일',
          icon: 'file-up',
          inputCount: totalImports || 0,
          outputTable: 'user_data_imports',
          outputCount: completedImports || 0,
          kpiConnected: false,
          status: (totalImports || 0) > 0 ? 'active' as const : 'inactive' as const,
          lastSync: null,
        },
      ],
      pipeline_health: {
        status: availableSources >= 3 ? 'healthy' as const :
                availableSources >= 1 ? 'warning' as const : 'unknown' as const,
        message: availableSources >= 3
          ? '데이터 파이프라인이 정상 작동 중입니다.'
          : availableSources >= 1
            ? '일부 데이터 소스가 미연동 상태입니다.'
            : '데이터 소스를 연결해주세요.',
        warnings: [
          ...(totalPosCount === 0 ? ['POS 데이터가 없습니다.'] : []),
          ...((sensorCount || 0) === 0 ? ['센서 데이터가 없습니다.'] : []),
          ...(erpRecordCount === 0 ? ['재고 데이터가 없습니다.'] : []),
        ],
      },
      today_processed: {
        input: totalImports || 0,
        transformed: l2Count || 0,
        aggregated: l3Count || 0,
        failed: failedImports || 0,
      },
    },
    queried_at: new Date().toISOString(),
  };
}

// ============================================================================
// useDataQualityScore - 데이터 품질 점수 조회
// ============================================================================
export function useDataQualityScore(date?: string) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  const storeId = selectedStore?.id;

  return useQuery<DataQualityScore>({
    queryKey: ['data-quality-score', storeId, orgId, date],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('No store selected');
      }

      // Try RPC first, fallback if not available
      try {
        const { data, error } = await supabase
          .rpc('calculate_data_quality_score', {
            p_store_id: storeId,
            p_date: date || new Date().toISOString().split('T')[0],
          });

        if (error) throw error;

        // RPC 결과에 ERP 데이터가 없으면 병합
        const result = data as unknown as DataQualityScore;
        return await ensureERPCoverageForQualityScore(result, storeId, orgId);
      } catch (rpcError) {
        console.warn('Quality score RPC not available, using fallback:', rpcError);
        return await buildQualityScoreFallback(storeId, orgId);
      }
    },
    enabled: !!storeId,
  });
}

// Fallback quality score calculation
async function buildQualityScoreFallback(storeId: string, orgId?: string): Promise<DataQualityScore> {
  // POS 데이터는 transactions 테이블만 카운트 (RPC 함수와 동일하게)
  // purchases 테이블은 API 매핑 대상이 아니므로 제외
  const { count: posCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const totalPosCount = posCount || 0;

  const { count: sensorCount } = await supabase
    .from('zone_events')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  // ERP/재고 데이터 카운트
  // inventory_levels: 상품별 현재 재고 수준 (상태 데이터) - org_id로 필터 (store_id 없음)
  // inventory_movements: 입출고 트랜잭션 이력 (이벤트 데이터) - org_id로 필터
  let inventoryLevelQuery = supabase
    .from('inventory_levels')
    .select('*', { count: 'exact', head: true });
  if (orgId) {
    inventoryLevelQuery = inventoryLevelQuery.eq('org_id', orgId);
  }
  const { count: inventoryLevelCount } = await inventoryLevelQuery;

  let inventoryMovementQuery = supabase
    .from('inventory_movements')
    .select('*', { count: 'exact', head: true });
  if (orgId) {
    inventoryMovementQuery = inventoryMovementQuery.eq('org_id', orgId);
  }
  const { count: inventoryMovementCount } = await inventoryMovementQuery;

  // ERP 데이터 존재 여부: levels가 있거나 movements 활동이 있으면 true
  const hasERPData = (inventoryLevelCount || 0) > 0 || (inventoryMovementCount || 0) > 0;
  // 표시할 레코드 수: 관리 중인 상품 수 (levels 기준)
  const erpRecordCount = inventoryLevelCount || 0;

  const sources = [totalPosCount, sensorCount, customerCount, productCount, erpRecordCount];
  const availableSources = sources.filter(c => (c || 0) > 0).length;
  const overallScore = Math.round((availableSources / 5) * 100);

  const warnings: Array<{ type: string; source: string; severity: string; message: string }> = [];

  if (totalPosCount === 0) {
    warnings.push({ type: 'missing', source: 'pos', severity: 'high', message: 'POS 데이터가 없습니다.' });
  }
  if (!sensorCount || sensorCount === 0) {
    warnings.push({ type: 'missing', source: 'sensor', severity: 'high', message: 'NEURALSENSE 데이터가 없습니다.' });
  }
  if (!customerCount || customerCount === 0) {
    warnings.push({ type: 'missing', source: 'crm', severity: 'low', message: '고객 데이터가 없습니다.' });
  }
  if (!productCount || productCount === 0) {
    warnings.push({ type: 'missing', source: 'product', severity: 'medium', message: '상품 데이터가 없습니다.' });
  }
  if (!hasERPData) {
    warnings.push({ type: 'missing', source: 'erp', severity: 'medium', message: 'ERP/재고 데이터가 없습니다.' });
  }

  return {
    success: true,
    store_id: storeId,
    overall_score: overallScore,
    confidence_level: overallScore >= 75 ? 'high' : overallScore >= 50 ? 'medium' : 'low',
    coverage: {
      pos: { available: totalPosCount > 0, record_count: totalPosCount, label: 'POS/매출 데이터' },
      sensor: { available: (sensorCount || 0) > 0, record_count: sensorCount || 0, label: 'NEURALSENSE 센서' },
      crm: { available: (customerCount || 0) > 0, record_count: customerCount || 0, label: 'CRM/고객 데이터' },
      product: { available: (productCount || 0) > 0, record_count: productCount || 0, label: '상품 마스터' },
      erp: { available: hasERPData, record_count: erpRecordCount, label: 'ERP/재고 데이터' },
    },
    warnings,
    warning_count: warnings.length,
  };
}

// ============================================================================
// useRecentImports - 최근 Import 목록 조회
// ============================================================================
export function useRecentImports(limit: number = 20) {
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  return useQuery<RawImport[]>({
    queryKey: ['recent-imports', storeId, limit],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await (supabase as any)
        .from('raw_imports')
        .select('id, source_type, source_name, data_type, row_count, status, error_message, created_at, completed_at')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as RawImport[];
    },
    enabled: !!storeId,
  });
}

// ============================================================================
// useETLHistory - ETL 실행 이력 조회
// ============================================================================
export function useETLHistory(limit: number = 20) {
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  return useQuery<ETLRun[]>({
    queryKey: ['etl-history', storeId, limit],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await (supabase as any)
        .from('etl_runs')
        .select('id, etl_function, status, input_record_count, output_record_count, duration_ms, started_at, completed_at')
        .eq('store_id', storeId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ETLRun[];
    },
    enabled: !!storeId,
  });
}

// ============================================================================
// useReplayImport - Import 재처리
// ============================================================================
export function useReplayImport() {
  const queryClient = useQueryClient();
  const [isReplaying, setIsReplaying] = useState(false);

  const replayMutation = useMutation({
    mutationFn: async ({ rawImportId, force = false }: { rawImportId: string; force?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('replay-import', {
        body: {
          raw_import_id: rawImportId,
          force,
        },
      });

      if (error) throw error;
      return data;
    },
    onMutate: () => setIsReplaying(true),
    onSettled: () => {
      setIsReplaying(false);
      // Refetch related queries
      queryClient.invalidateQueries({ queryKey: ['recent-imports'] });
      queryClient.invalidateQueries({ queryKey: ['etl-history'] });
      queryClient.invalidateQueries({ queryKey: ['data-control-tower'] });
    },
  });

  const replay = useCallback(
    (rawImportId: string, force?: boolean) => {
      return replayMutation.mutateAsync({ rawImportId, force });
    },
    [replayMutation]
  );

  return {
    replay,
    isReplaying,
    error: replayMutation.error,
  };
}

// ============================================================================
// useETLHealth - ETL 파이프라인 헬스체크
// ============================================================================
export function useETLHealth() {
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  return useQuery({
    queryKey: ['etl-health', storeId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('etl-health', {
          body: {
            store_id: storeId,
            check_type: 'quick',
            time_range_hours: 24,
          },
        });

        if (error) throw error;
        return data;
      } catch (err) {
        // Fallback: return basic health status
        console.warn('ETL health check failed, using fallback:', err);
        return {
          success: true,
          overall_health: 'unknown',
          message: 'ETL 헬스체크 함수가 배포되지 않았습니다.',
          checks: [],
        };
      }
    },
    enabled: !!storeId,
    refetchInterval: 60000, // 1분마다 새로고침
  });
}

// ============================================================================
// useKPILineage - KPI Lineage 조회
// ============================================================================
export function useKPILineage(kpiTable: string, kpiId?: string, date?: string) {
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  return useQuery<KPILineage | null>({
    queryKey: ['kpi-lineage', kpiTable, kpiId, storeId, date],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('No store selected');
      }

      try {
        const { data, error } = await supabase
          .rpc('get_kpi_lineage', {
            p_kpi_table: kpiTable,
            p_kpi_id: kpiId || null,
            p_store_id: storeId,
            p_date: date || null,
          });

        if (error) throw error;
        return data as unknown as KPILineage;
      } catch (rpcError) {
        console.warn('KPI lineage RPC not available, using fallback:', rpcError);
        return buildKPILineageFallback(storeId, kpiTable, kpiId, date);
      }
    },
    enabled: !!storeId && !!kpiTable && (!!kpiId || !!date),
  });
}

// Fallback KPI lineage builder
async function buildKPILineageFallback(
  storeId: string,
  kpiTable: string,
  kpiId?: string,
  date?: string
): Promise<KPILineage | null> {
  // Try to get KPI record
  let kpiRecord = null;

  if (kpiTable === 'daily_kpis_agg') {
    const query = supabase
      .from('daily_kpis_agg')
      .select('*')
      .eq('store_id', storeId);

    if (kpiId) {
      query.eq('id', kpiId);
    } else if (date) {
      query.eq('date', date);
    }

    const { data } = await query.limit(1).single();
    kpiRecord = data;
  }

  if (!kpiRecord) {
    return null;
  }

  // Get related raw imports
  const { data: rawImports } = await supabase
    .from('raw_imports')
    .select('id, source_type, source_name, data_type, row_count, status, error_message, created_at, completed_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    success: true,
    kpi_record: {
      id: kpiRecord.id,
      date: kpiRecord.date,
      store_id: kpiRecord.store_id,
      ...kpiRecord,
    },
    lineage: {
      source_trace: kpiRecord.source_trace || {},
      etl_run: null,
      raw_imports: (rawImports || []) as unknown as RawImport[],
      lineage_path: [
        { layer: 'L3', table: kpiTable, description: '집계 KPI 테이블' },
        { layer: 'L2', tables: ['zone_events', 'line_items'], description: 'Fact 테이블' },
        { layer: 'L1', tables: ['raw_imports'], description: 'Raw 원본 데이터' },
      ],
    },
    metadata: {
      queried_at: new Date().toISOString(),
      kpi_table: kpiTable,
    },
  };
}

// ============================================================================
// useContextDataSources - 컨텍스트 데이터 소스 조회 (날씨, 이벤트 등)
// ============================================================================
export function useContextDataSources() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  const storeId = selectedStore?.id;
  const queryClient = useQueryClient();

  // 컨텍스트 데이터 소스 조회
  const query = useQuery<ContextDataSource[]>({
    queryKey: ['context-data-sources', orgId, storeId],
    queryFn: async () => {
      if (!orgId) return [];

      // RPC 함수 호출 시도
      try {
        const { data, error } = await (supabase.rpc as any)('get_context_data_sources', {
          p_org_id: orgId,
          p_store_id: storeId || null,
        });

        if (error) throw error;

        const result = data as unknown as { success: boolean; connections: ContextDataSource[] };
        return result.connections || [];
      } catch (rpcError) {
        // RPC 실패 시 직접 쿼리
        console.warn('Context data sources RPC not available, using fallback:', rpcError);
        return await fetchContextDataSourcesFallback(orgId, storeId);
      }
    },
    enabled: !!orgId,
  });

  // 시스템 컨텍스트 연결 초기화 (날씨, 공휴일)
  const initMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');

      // RPC 함수 호출
      const { data, error } = await (supabase.rpc as any)('ensure_system_context_connections', {
        p_org_id: orgId,
        p_store_id: storeId || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['context-data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['all-data-sources'] });
    },
  });

  // 컴포넌트 마운트 시 시스템 연결 자동 초기화 (조건부)
  useEffect(() => {
    if (orgId && query.data && query.data.length === 0) {
      // 컨텍스트 연결이 없으면 자동 초기화 시도
      initMutation.mutate();
    }
  }, [orgId, query.data?.length]);

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    initializeSystemConnections: () => initMutation.mutateAsync(),
    isInitializing: initMutation.isPending,
  };
}

// 컨텍스트 데이터 소스 fallback 조회
async function fetchContextDataSourcesFallback(
  orgId: string,
  storeId?: string
): Promise<ContextDataSource[]> {
  // connection_category = 'context' 또는 data_category IN ('weather', 'holidays')
  // store_id 조건도 함께 적용
  const storeCondition = storeId
    ? `and(or(store_id.eq.${storeId},store_id.is.null))`
    : '';

  const { data, error } = await supabase
    .from('api_connections')
    .select('*')
    .eq('org_id', orgId)
    .or('connection_category.eq.context,data_category.in.(weather,holidays)')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch context data sources:', error);
    return [];
  }

  return (data || []).map((conn: any) => ({
    id: conn.id,
    name: conn.name,
    type: conn.type,
    provider: conn.provider,
    data_category: conn.data_category,
    connection_category: conn.connection_category || 'context',
    is_system_managed: conn.is_system_managed || true, // 컨텍스트는 기본 시스템 관리
    is_active: conn.is_active || false,
    status: 'active', // 컨텍스트 소스는 항상 활성으로 표시
    icon_name: conn.icon_name,
    description: conn.description,
    last_sync: conn.last_sync,
    total_records_synced: conn.total_records_synced || 0,
    display_order: conn.display_order || 100,
  }));
}

// ============================================================================
// useAllDataSources - 모든 데이터 소스 조회 (비즈니스 + 컨텍스트)
// ============================================================================
export function useAllDataSources() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  const storeId = selectedStore?.id;

  return useQuery<AllDataSources>({
    queryKey: ['all-data-sources', orgId, storeId],
    queryFn: async () => {
      if (!orgId) {
        return { success: true, business: [], context: [], business_count: 0, context_count: 0 };
      }

      // RPC 함수 호출 시도
      try {
        const { data, error } = await (supabase.rpc as any)('get_all_data_sources', {
          p_org_id: orgId,
          p_store_id: storeId || null,
        });

        if (error) throw error;
        return data as unknown as AllDataSources;
      } catch (rpcError) {
        // RPC 실패 시 직접 쿼리
        console.warn('All data sources RPC not available, using fallback:', rpcError);
        return await fetchAllDataSourcesFallback(orgId, storeId);
      }
    },
    enabled: !!orgId,
  });
}

// 모든 데이터 소스 fallback 조회
async function fetchAllDataSourcesFallback(
  orgId: string,
  storeId?: string
): Promise<AllDataSources> {
  let query = supabase
    .from('api_connections')
    .select('*')
    .eq('org_id', orgId)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (storeId) {
    query = query.or(`store_id.eq.${storeId},store_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch all data sources:', error);
    return { success: false, business: [], context: [], business_count: 0, context_count: 0 };
  }

  const mapConnection = (conn: any): ContextDataSource => ({
    id: conn.id,
    name: conn.name,
    type: conn.type,
    provider: conn.provider,
    data_category: conn.data_category,
    connection_category: conn.connection_category || 'business',
    is_system_managed: conn.is_system_managed || false,
    is_active: conn.is_active || false,
    status: conn.status || 'inactive',
    icon_name: conn.icon_name,
    description: conn.description,
    last_sync: conn.last_sync,
    total_records_synced: conn.total_records_synced || 0,
    display_order: conn.display_order || 100,
  });

  const business = (data || [])
    .filter((c: any) => !c.connection_category || c.connection_category === 'business')
    .map(mapConnection);

  const context = (data || [])
    .filter((c: any) => c.connection_category === 'context')
    .map(mapConnection);

  return {
    success: true,
    business,
    context,
    business_count: business.length,
    context_count: context.length,
  };
}

// ============================================================================
// useWeatherDataStatus - 날씨 데이터 상태 조회
// ============================================================================
export function useWeatherDataStatus() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  const storeId = selectedStore?.id;

  return useQuery({
    queryKey: ['weather-data-status', orgId, storeId],
    queryFn: async () => {
      if (!orgId) return null;

      // 최근 7일 날씨 데이터 조회
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let query = supabase
        .from('weather_data')
        .select('*', { count: 'exact' })
        .eq('org_id', orgId)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(10);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error('Failed to fetch weather data status:', error);
        return null;
      }

      const latestDate = data?.[0]?.date || null;
      const avgTemp = data?.length
        ? data.reduce((sum, d) => sum + (Number(d.temperature) || 0), 0) / data.length
        : null;

      return {
        record_count: count || 0,
        latest_date: latestDate,
        avg_temperature: avgTemp ? Math.round(avgTemp * 10) / 10 : null,
        recent_data: data || [],
      };
    },
    enabled: !!orgId,
  });
}

// ============================================================================
// useEventsDataStatus - 이벤트/공휴일 데이터 상태 조회
// ============================================================================
export function useEventsDataStatus() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  const storeId = selectedStore?.id;

  return useQuery({
    queryKey: ['events-data-status', orgId, storeId],
    queryFn: async () => {
      if (!orgId) return null;

      const today = new Date().toISOString().split('T')[0];
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      // 현재 연도 이벤트 수 (2026년 공휴일만 카운트)
      let countQuery = supabase
        .from('holidays_events')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('date', yearStart)
        .lte('date', yearEnd);

      if (storeId) {
        countQuery = countQuery.or(`store_id.eq.${storeId},store_id.is.null`);
      }

      const { count: totalCount } = await countQuery;

      // 다가오는 이벤트 (30일 이내)
      let upcomingQuery = supabase
        .from('holidays_events')
        .select('*')
        .eq('org_id', orgId)
        .gte('date', today)
        .lte('date', thirtyDaysLater.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(10);

      if (storeId) {
        upcomingQuery = upcomingQuery.or(`store_id.eq.${storeId},store_id.is.null`);
      }

      const { data: upcomingEvents, error } = await upcomingQuery;

      if (error) {
        console.error('Failed to fetch events data status:', error);
        return null;
      }

      return {
        record_count: totalCount || 0,
        upcoming_count: upcomingEvents?.length || 0,
        upcoming_events: upcomingEvents || [],
        next_event: upcomingEvents?.[0] || null,
      };
    },
    enabled: !!orgId,
  });
}
