/**
 * 재고(Inventory) 탭 쿼리 핸들러
 * queryType: inventory, overstock, stockAlert, stockMovement,
 *            stockDistribution, healthyStock, inventoryCategory, inventoryDetail
 */

import { QueryActionResult, PageContext, SupabaseClient } from './types.ts';
import { rpcInventoryStatus, rpcInventoryMovements } from './rpcHelpers.ts';
import { createNavigationActions, getTabDisplayName, formatNumber } from './commonHelpers.ts';
import { INVENTORY_SNAPSHOT_NOTE } from './constants.ts';
import { normalizeForMatch } from '../../utils/normalize.ts';

function formatInventoryItem(i: any, statusLabel: Record<string, string>): string {
  const status = statusLabel[i.stock_status] || i.stock_status;
  const stockout = i.days_until_stockout != null ? `${i.days_until_stockout}일` : '-';
  return `• ${i.product_name} [${i.category || '기타'}] — 현재고: ${(i.current_stock || 0).toLocaleString()}개, 적정: ${(i.optimal_stock || 0).toLocaleString()}개, 상태: ${status}, 품절 예상: ${stockout}`;
}

export async function queryInventory(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string,
  itemFilter?: string[], responseHint?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('inventory', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';
  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['상품 판매량 알려줘', '매출 알려줘'], data: null };
  }
  const items = await rpcInventoryStatus(supabase, orgId);
  if (itemFilter && itemFilter.length > 0) {
    const filtered = items.filter((i: any) =>
      itemFilter.some(f => {
        const nf = normalizeForMatch(f);
        return normalizeForMatch(i.product_name || '').includes(nf) || normalizeForMatch(i.category || '').includes(nf);
      })
    );
    if (filtered.length === 0) {
      return { actions, message: `"${itemFilter.join(', ')}"에 해당하는 재고 정보를 찾을 수 없습니다.${tabMessage}`, suggestions: ['재고 현황 보여줘', '상세 재고 보여줘'], data: null };
    }
    const statusLabel: Record<string, string> = { critical: '위험', low: '부족', normal: '정상', overstock: '과잉' };
    const filterNote = `(${itemFilter.join(', ')} 필터 적용)`;
    if (responseHint && filtered.length > 0) {
      const list = filtered.map((i: any) => {
        switch (responseHint) {
          case 'sku': return `• ${i.product_name}: SKU ${i.sku || '없음'}`;
          case 'currentStock': return `• ${i.product_name}: 현재고 ${(i.current_stock || 0).toLocaleString()}개`;
          case 'optimalStock': return `• ${i.product_name}: 적정재고 ${(i.optimal_stock || 0).toLocaleString()}개`;
          case 'minimumStock': return `• ${i.product_name}: 최소재고 ${(i.minimum_stock || 0).toLocaleString()}개`;
          case 'stockout': return `• ${i.product_name}: 품절 예상 ${i.days_until_stockout != null ? `${i.days_until_stockout}일` : '산정 불가'}`;
          case 'status': return `• ${i.product_name}: ${statusLabel[i.stock_status] || i.stock_status}`;
          default: return formatInventoryItem(i, statusLabel);
        }
      }).join('\n');
      return {
        actions,
        message: `재고 정보 ${filterNote}:\n${list}${tabMessage}`,
        suggestions: ['재고 현황 보여줘', '재고 부족 경고 알려줘', '입출고 내역 보여줘'],
        data: { items: filtered },
      };
    }
    const list = filtered.map((i: any) => formatInventoryItem(i, statusLabel)).join('\n');
    return {
      actions,
      message: `재고 정보 ${filterNote}:\n${list}${tabMessage}`,
      suggestions: ['재고 부족 경고 알려줘', '과잉 재고 알려줘', '입출고 내역 보여줘'],
      data: { items: filtered },
    };
  }
  const totalItems = items.length;
  const lowStockItems = items.filter((i: any) => i.stock_status === 'critical' || i.stock_status === 'low').length;
  const overstockItems = items.filter((i: any) => i.stock_status === 'overstock').length;
  return {
    actions,
    message: `현재 ${totalItems}개 상품 중 ${lowStockItems}개 상품이 재주문 필요(재고 부족), ${overstockItems}개 상품이 과잉 재고 상태입니다.${INVENTORY_SNAPSHOT_NOTE}${tabMessage}`,
    suggestions: ['상품 판매량 알려줘', '매출 알려줘'],
    data: { totalItems, lowStockItems, overstockItems },
  };
}

export async function queryOverstock(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string, itemFilter?: string[]
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('overstock', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';
  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['재고탭 보여줘'], data: null };
  }
  let items = await rpcInventoryStatus(supabase, orgId);
  if (itemFilter && itemFilter.length > 0) {
    items = items.filter((i: any) =>
      itemFilter.some(f => {
        const nf = normalizeForMatch(f);
        return normalizeForMatch(i.product_name || '').includes(nf) || normalizeForMatch(i.category || '').includes(nf);
      })
    );
  }
  const overstockItems = items.filter((i: any) => i.stock_status === 'overstock');
  const filterNote = itemFilter?.length ? ` (${itemFilter.join(', ')} 기준)` : '';
  if (overstockItems.length > 0) {
    const list = overstockItems.map((i: any) =>
      `• ${i.product_name}: 현재고 ${(i.current_stock || 0).toLocaleString()}개 (적정 ${(i.optimal_stock || 0).toLocaleString()}개)`
    ).join('\n');
    return {
      actions,
      message: `과잉 재고 상품은 ${overstockItems.length}개입니다${filterNote}:\n${list}${INVENTORY_SNAPSHOT_NOTE}${tabMessage}`,
      suggestions: ['재고 부족 경고 알려줘', '재고 현황 보여줘', '재고 최적화 추천'],
      data: { overstockCount: overstockItems.length, totalItems: items.length, items: overstockItems },
    };
  }
  return {
    actions,
    message: `과잉 재고 상품은 0개입니다${filterNote} (전체 ${items.length}개 중).${tabMessage}`,
    suggestions: ['재고 부족 경고 알려줘', '재고 현황 보여줘', '재고 최적화 추천'],
    data: { overstockCount: 0, totalItems: items.length },
  };
}

export async function queryStockAlert(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string, itemFilter?: string[]
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('stockAlert', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';
  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['재고탭 보여줘'], data: null };
  }
  let items = await rpcInventoryStatus(supabase, orgId);
  if (itemFilter && itemFilter.length > 0) {
    items = items.filter((i: any) =>
      itemFilter.some(f => {
        const nf = normalizeForMatch(f);
        return normalizeForMatch(i.product_name || '').includes(nf) || normalizeForMatch(i.category || '').includes(nf);
      })
    );
  }
  const lowStockItems = items.filter((i: any) => i.stock_status === 'critical' || i.stock_status === 'low');
  const filterNote = itemFilter?.length ? ` (${itemFilter.join(', ')} 기준)` : '';
  if (lowStockItems.length > 0) {
    const list = lowStockItems.map((i: any) =>
      `• ${i.product_name}: 현재고 ${(i.current_stock || 0).toLocaleString()}개 (최소 ${(i.minimum_stock || 0).toLocaleString()}개), 품절 예상 ${i.days_until_stockout != null ? `${i.days_until_stockout}일` : '-'}`
    ).join('\n');
    return {
      actions,
      message: `재고 부족 경고 상품은 ${lowStockItems.length}개입니다${filterNote}:\n${list}${INVENTORY_SNAPSHOT_NOTE}${tabMessage}`,
      suggestions: ['과잉 재고 알려줘', '재고 현황 보여줘', '입출고 내역 보여줘'],
      data: { lowStockCount: lowStockItems.length, totalItems: items.length, items: lowStockItems },
    };
  }
  return {
    actions,
    message: `재고 부족 경고 상품은 0개입니다${filterNote} (전체 ${items.length}개 중).${tabMessage}`,
    suggestions: ['과잉 재고 알려줘', '재고 현황 보여줘', '입출고 내역 보여줘'],
    data: { lowStockCount: 0, totalItems: items.length },
  };
}

export async function queryStockMovement(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('stockMovement', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';
  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['재고탭 보여줘'], data: null };
  }
  let data: any[] = [];
  try {
    data = await rpcInventoryMovements(supabase, orgId, dateRange.startDate, dateRange.endDate, 10);
  } catch (e) {
    console.error('[queryStockMovement] RPC error:', e);
  }
  if (data.length === 0) {
    return { actions, message: `해당 기간의 입출고 내역이 없습니다.${tabMessage}`, suggestions: ['재고 현황 보여줘', '재고 부족 경고 알려줘'], data: null };
  }
  const inCount = data.filter((m: any) => m.movement_type === 'in' || m.movement_type === 'inbound' || m.movement_type === '입고').length;
  const outCount = data.filter((m: any) => m.movement_type === 'out' || m.movement_type === 'outbound' || m.movement_type === '출고').length;
  return {
    actions,
    message: `최근 입출고 내역: 입고 ${inCount}건, 출고 ${outCount}건 (총 ${data.length}건).${tabMessage}`,
    suggestions: ['재고 현황 보여줘', '재고 부족 경고 알려줘', '과잉 재고 알려줘'],
    data: { movements: data, inCount, outCount },
  };
}

export async function queryStockDistribution(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('stockDistribution', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 분포 차트를 확인합니다.` : '';
  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['재고탭 보여줘'], data: null };
  }
  const items = await rpcInventoryStatus(supabase, orgId);
  const total = items.length;
  const lowStock = items.filter((i: any) => i.stock_status === 'critical' || i.stock_status === 'low').length;
  const overstock = items.filter((i: any) => i.stock_status === 'overstock').length;
  const healthy = items.filter((i: any) => i.stock_status === 'normal').length;
  return {
    actions,
    message: `재고 상태 분포:\n• 정상: ${healthy}개 (${total > 0 ? Math.round((healthy / total) * 100) : 0}%)\n• 부족: ${lowStock}개 (${total > 0 ? Math.round((lowStock / total) * 100) : 0}%)\n• 과잉: ${overstock}개 (${total > 0 ? Math.round((overstock / total) * 100) : 0}%)${INVENTORY_SNAPSHOT_NOTE}${tabMessage}`,
    suggestions: ['재고 부족 경고 알려줘', '과잉 재고 알려줘', '입출고 내역 보여줘'],
    data: { total, lowStock, overstock, healthy },
  };
}

export async function queryHealthyStock(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('healthyStock', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';
  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['재고탭 보여줘'], data: null };
  }
  const items = await rpcInventoryStatus(supabase, orgId);
  const healthyItems = items.filter((i: any) => i.stock_status === 'normal');
  const total = items.length;
  const ratio = total > 0 ? Math.round((healthyItems.length / total) * 100) : 0;
  if (healthyItems.length > 0) {
    const top5 = healthyItems.slice(0, 5);
    const list = top5.map((i: any) =>
      `• ${i.product_name}: 현재고 ${(i.current_stock || 0).toLocaleString()}개 (적정 ${(i.optimal_stock || 0).toLocaleString()}개)`
    ).join('\n');
    const moreNote = healthyItems.length > 5 ? `\n...외 ${healthyItems.length - 5}개` : '';
    return {
      actions,
      message: `정상 재고 상품은 ${healthyItems.length}개입니다 (전체 ${total}개 중, ${ratio}%):\n${list}${moreNote}${INVENTORY_SNAPSHOT_NOTE}${tabMessage}`,
      suggestions: ['재고 부족 경고 알려줘', '과잉 재고 알려줘', '재고 현황 보여줘'],
      data: { healthyCount: healthyItems.length, totalItems: total, ratio },
    };
  }
  return {
    actions,
    message: `정상 재고 상품은 0개입니다 (전체 ${total}개 중).${tabMessage}`,
    suggestions: ['재고 부족 경고 알려줘', '과잉 재고 알려줘'],
    data: { healthyCount: 0, totalItems: total, ratio: 0 },
  };
}

export async function queryInventoryCategory(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string, itemFilter?: string[]
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('inventoryCategory', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';
  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['재고탭 보여줘'], data: null };
  }
  const items = await rpcInventoryStatus(supabase, orgId);
  const categoryMap = new Map<string, { totalStock: number; count: number; low: number; overstock: number }>();
  items.forEach((i: any) => {
    const cat = i.category || '기타';
    const current = categoryMap.get(cat) || { totalStock: 0, count: 0, low: 0, overstock: 0 };
    categoryMap.set(cat, {
      totalStock: current.totalStock + (i.current_stock || 0),
      count: current.count + 1,
      low: current.low + (i.stock_status === 'critical' || i.stock_status === 'low' ? 1 : 0),
      overstock: current.overstock + (i.stock_status === 'overstock' ? 1 : 0),
    });
  });
  let categories = Array.from(categoryMap.entries()).map(([cat, data]) => ({ category: cat, ...data }));
  if (itemFilter && itemFilter.length > 0) {
    categories = categories.filter(c =>
      itemFilter.some(f => normalizeForMatch(c.category).includes(normalizeForMatch(f)))
    );
  }
  if (categories.length === 0) {
    return {
      actions,
      message: `${itemFilter?.length ? `"${itemFilter.join(', ')}" 카테고리의 ` : ''}재고 정보를 찾을 수 없습니다.${tabMessage}`,
      suggestions: ['재고 현황 보여줘', '상세 재고 보여줘'],
      data: null,
    };
  }
  const list = categories
    .sort((a, b) => b.totalStock - a.totalStock)
    .map(c => `• ${c.category}: ${c.count}개 상품, 총 재고 ${c.totalStock.toLocaleString()}개${c.low > 0 ? `, 부족 ${c.low}개` : ''}${c.overstock > 0 ? `, 과잉 ${c.overstock}개` : ''}`)
    .join('\n');
  const filterNote = itemFilter?.length ? ` (${itemFilter.join(', ')} 필터 적용)` : '';
  return {
    actions,
    message: `카테고리별 재고 현황${filterNote}:\n${list}${INVENTORY_SNAPSHOT_NOTE}${tabMessage}`,
    suggestions: ['재고 현황 보여줘', '재고 부족 경고 알려줘', '과잉 재고 알려줘'],
    data: { categories },
  };
}

export async function queryInventoryDetail(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('inventoryDetail', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 전체 목록을 확인합니다.` : '';
  if (!orgId) {
    return { actions, message: `조직 정보를 확인할 수 없습니다.${tabMessage}`, suggestions: ['재고탭 보여줘'], data: null };
  }
  const items = await rpcInventoryStatus(supabase, orgId);
  const statusLabel: Record<string, string> = { critical: '위험', low: '부족', normal: '정상', overstock: '과잉' };
  const top10 = items.slice(0, 10);
  const list = top10.map((i: any) => formatInventoryItem(i, statusLabel)).join('\n');
  const moreNote = items.length > 10 ? `\n...외 ${items.length - 10}개 상품은 재고 탭에서 확인하세요.` : '';
  return {
    actions,
    message: `상세 재고 현황 (총 ${items.length}개 상품):\n${list}${moreNote}${INVENTORY_SNAPSHOT_NOTE}${tabMessage}`,
    suggestions: ['재고 부족 경고 알려줘', '카테고리별 재고 보여줘', '과잉 재고 알려줘'],
    data: { items, totalItems: items.length },
  };
}
