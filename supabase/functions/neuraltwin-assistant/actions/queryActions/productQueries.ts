/**
 * 상품(Product) 탭 쿼리 핸들러
 * queryType: product, bestSeller, topProducts, categoryAnalysis, unitsSold
 */

import { QueryActionResult, PageContext, SupabaseClient } from './types.ts';
import { rpcProductPerformance } from './rpcHelpers.ts';
import { createNavigationActions, getTabDisplayName, formatNumber } from './commonHelpers.ts';
import { normalizeForMatch } from '../../utils/normalize.ts';

export async function queryProduct(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string, itemFilter?: string[]
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('product', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';
  const products = await rpcProductPerformance(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (itemFilter && itemFilter.length > 0) {
    const filtered = products.filter((p: any) =>
      itemFilter.some(f => normalizeForMatch(p.product_name || '').includes(normalizeForMatch(f)))
    );
    if (filtered.length > 0) {
      const filterNote = `(${itemFilter.join(', ')} 필터 적용)`;
      const list = filtered.map((p: any) =>
        `• ${p.product_name} [${p.category || '기타'}]: 판매 ${(p.units_sold || 0).toLocaleString()}개, 매출 ${formatNumber(p.revenue || 0)}원`
      ).join('\n');
      return {
        actions,
        message: `상품 실적 ${filterNote}:\n${list}${tabMessage}`,
        suggestions: ['TOP 상품 보여줘', '카테고리 분석 보여줘'],
        data: { products: filtered },
      };
    }
  }
  const totalUnitsSold = products.reduce((sum: number, p: any) => sum + (p.units_sold || 0), 0);
  const totalRevenue = products.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);
  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 총 판매량은 ${totalUnitsSold.toLocaleString()}개, 매출은 ${formatNumber(totalRevenue)}원입니다.${tabMessage}`,
    suggestions: ['매출 알려줘', '재고 현황 알려줘'],
    data: { totalUnitsSold, totalRevenue },
  };
}

export async function queryBestSeller(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('bestSeller', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 확인합니다.` : '';
  const products = await rpcProductPerformance(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (products.length === 0) {
    return { actions, message: `상품 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['상품탭 보여줘', '매출 알려줘'], data: null };
  }
  const best = products[0];
  return {
    actions,
    message: `베스트셀러는 "${best.product_name}"입니다.\n• 매출: ${formatNumber(best.revenue || 0)}원\n• 판매량: ${(best.units_sold || 0).toLocaleString()}개\n• 카테고리: ${best.category || '미분류'}${tabMessage}`,
    suggestions: ['TOP 상품 보여줘', '카테고리 분석 보여줘', '재고 현황 알려줘'],
    data: { bestSeller: best },
  };
}

export async function queryTopProducts(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string, itemFilter?: string[]
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('topProducts', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';
  const products = await rpcProductPerformance(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (products.length === 0) {
    return { actions, message: `상품 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['상품탭 보여줘', '매출 알려줘'], data: null };
  }
  let results = products;
  let filterNote = '';
  if (itemFilter && itemFilter.length > 0) {
    const filtered = products.filter((p: any) =>
      itemFilter.some(f => normalizeForMatch(p.product_name || '').includes(normalizeForMatch(f)))
    );
    if (filtered.length > 0) { results = filtered; filterNote = ` (${itemFilter.join(', ')} 필터 적용)`; }
  }
  const top10 = results.slice(0, 10);
  const productList = top10.map((p: any, i: number) =>
    `${i + 1}. ${p.product_name || '상품#' + p.product_id}: ${formatNumber(p.revenue || 0)}원 (${(p.units_sold || 0).toLocaleString()}개)`
  ).join('\n');
  return {
    actions,
    message: `매출 TOP ${top10.length} 상품${filterNote}:\n${productList}${tabMessage}`,
    suggestions: ['카테고리 분석 보여줘', '판매량 알려줘', '재고 현황 알려줘'],
    data: { topProducts: top10 },
  };
}

export async function queryCategoryAnalysis(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string,
  responseHint?: string, itemFilter?: string[]
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const isQuantity = responseHint === 'quantity';
  const isDistribution = responseHint === 'distribution';
  const { actions, tabChanged, targetTab } = createNavigationActions('categoryAnalysis', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 카테고리 분석을 확인합니다.` : '';
  const products = await rpcProductPerformance(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (products.length === 0) {
    return { actions, message: `카테고리 분석 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['상품탭 보여줘', '매출 알려줘'], data: null };
  }
  const catMap: Record<string, { units: number; revenue: number }> = {};
  products.forEach((p: any) => {
    const cat = p.category || '기타';
    if (!catMap[cat]) catMap[cat] = { units: 0, revenue: 0 };
    catMap[cat].units += p.units_sold || 0;
    catMap[cat].revenue += p.revenue || 0;
  });
  const allEntries = Object.entries(catMap);
  const allTotalRevenue = allEntries.reduce((sum, [, v]) => sum + v.revenue, 0);
  let entries = allEntries;
  let filterNote = '';
  if (itemFilter && itemFilter.length > 0) {
    const filtered = entries.filter(([cat]) =>
      itemFilter.some(f => normalizeForMatch(cat).includes(normalizeForMatch(f)))
    );
    if (filtered.length > 0) { entries = filtered; filterNote = ` (${itemFilter.join(', ')} 필터 적용)`; }
  }
  if (isDistribution) {
    const totalRevenue = allTotalRevenue;
    const sorted = entries.sort((a, b) => b[1].revenue - a[1].revenue);
    const catList = sorted.map(([cat, v]) => {
      const pct = totalRevenue > 0 ? ((v.revenue / totalRevenue) * 100).toFixed(1) : '0';
      return `• ${cat}: ${pct}% (${formatNumber(v.revenue)}원)`;
    }).join('\n');
    return {
      actions,
      message: `카테고리별 매출 분포${filterNote}:\n${catList}${tabMessage}`,
      suggestions: ['카테고리별 판매량 보여줘', 'TOP 상품 보여줘'],
      data: { categories: catMap },
    };
  }
  if (isQuantity) {
    const sorted = entries.sort((a, b) => b[1].units - a[1].units);
    const catList = sorted.map(([cat, v]) =>
      `• ${cat}: ${v.units.toLocaleString()}개 (매출 ${formatNumber(v.revenue)}원)`
    ).join('\n');
    return {
      actions,
      message: `카테고리별 판매량${filterNote}:\n${catList}${tabMessage}`,
      suggestions: ['카테고리별 매출 보여줘', 'TOP 상품 보여줘', '재고 현황 알려줘'],
      data: { categories: catMap },
    };
  }
  const sorted = entries.sort((a, b) => b[1].revenue - a[1].revenue);
  const catList = sorted.map(([cat, v]) =>
    `• ${cat}: ${formatNumber(v.revenue)}원 (${v.units.toLocaleString()}개)`
  ).join('\n');
  return {
    actions,
    message: `카테고리별 매출${filterNote}:\n${catList}${tabMessage}`,
    suggestions: ['카테고리별 판매량 보여줘', 'TOP 상품 보여줘', '재고 현황 알려줘'],
    data: { categories: catMap },
  };
}

export async function queryUnitsSold(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('unitsSold', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 내역을 확인합니다.` : '';
  const products = await rpcProductPerformance(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  const totalUnits = products.reduce((sum: number, p: any) => sum + (p.units_sold || 0), 0);
  const totalRevenue = products.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);
  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 총 판매량은 ${totalUnits.toLocaleString()}개, 총 매출은 ${formatNumber(totalRevenue)}원입니다.${tabMessage}`,
    suggestions: ['TOP 상품 보여줘', '카테고리 분석 보여줘', '재고 현황 알려줘'],
    data: { totalUnits, totalRevenue },
  };
}
