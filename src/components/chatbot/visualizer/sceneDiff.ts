/**
 * NEURALTWIN Store Visualizer - Scene Diff Engine (A-4)
 *
 * 이전 VizDirective와 새 VizDirective를 비교하여
 * 추가/제거/변경된 존만 업데이트 (전체 씬 재빌드 방지)
 */

import type { DynamicZone } from './vizDirectiveTypes';

export interface ZoneDiff {
  added: DynamicZone[];
  removed: string[];    // removed zone IDs
  updated: Array<{
    id: string;
    prev: DynamicZone;
    next: DynamicZone;
  }>;
  unchanged: string[];  // unchanged zone IDs
}

/**
 * 두 존 배열을 비교하여 diff 계산
 */
export function computeZoneDiff(
  prevZones: DynamicZone[] | undefined,
  nextZones: DynamicZone[] | undefined
): ZoneDiff {
  const prev = prevZones || [];
  const next = nextZones || [];

  const prevMap = new Map<string, DynamicZone>();
  for (const z of prev) prevMap.set(z.id, z);

  const nextMap = new Map<string, DynamicZone>();
  for (const z of next) nextMap.set(z.id, z);

  const added: DynamicZone[] = [];
  const removed: string[] = [];
  const updated: ZoneDiff['updated'] = [];
  const unchanged: string[] = [];

  // Check next zones against prev
  for (const z of next) {
    const old = prevMap.get(z.id);
    if (!old) {
      added.push(z);
    } else if (hasZoneChanged(old, z)) {
      updated.push({ id: z.id, prev: old, next: z });
    } else {
      unchanged.push(z.id);
    }
  }

  // Check for removed zones
  for (const z of prev) {
    if (!nextMap.has(z.id)) {
      removed.push(z.id);
    }
  }

  return { added, removed, updated, unchanged };
}

/**
 * 두 존의 속성이 변경되었는지 비교
 */
function hasZoneChanged(a: DynamicZone, b: DynamicZone): boolean {
  return (
    a.x !== b.x ||
    a.z !== b.z ||
    a.w !== b.w ||
    a.d !== b.d ||
    a.color !== b.color ||
    a.label !== b.label
  );
}

/**
 * diff 요약 로그 문자열 생성
 */
export function describeDiff(diff: ZoneDiff): string {
  const parts: string[] = [];
  if (diff.added.length > 0) parts.push(`+${diff.added.length} added`);
  if (diff.removed.length > 0) parts.push(`-${diff.removed.length} removed`);
  if (diff.updated.length > 0) parts.push(`~${diff.updated.length} updated`);
  if (diff.unchanged.length > 0) parts.push(`=${diff.unchanged.length} unchanged`);
  return parts.join(', ') || 'no changes';
}
