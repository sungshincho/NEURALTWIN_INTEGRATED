/**
 * NEURALTWIN Store Visualizer - Main React Component
 *
 * Three.js 씬을 React 라이프사이클에 통합
 * wireframe-3d-viz.jsx 레퍼런스 기반
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildScene, disposeScene, lerpVector3, applyParamsToConfig, type SceneObjects } from './sceneBuilder';
import { CAMERA_PRESETS, STORE, getZoneColorHex, ZONE_LABELS_KO } from './storeData';
import type { VizState, VizAnnotation, VizKPI, CustomerStage, StoreParams, ZoneScale, DynamicZone, CameraAngle } from './vizDirectiveTypes';
import KPIBar from './KPIBar';
import StageProgress from './StageProgress';
import { computeZoneDiff, describeDiff } from './sceneDiff';

// ═══════════════════════════════════════════
//  Props 인터페이스
// ═══════════════════════════════════════════

interface StoreVisualizerProps {
  vizState: VizState;
  highlights: string[];
  annotations: VizAnnotation[];
  showFlow: boolean | string[];
  className?: string;

  /** AI가 대화 맥락에 맞게 생성한 동적 존 배열 */
  zones?: DynamicZone[];

  /** KPI 데이터 — 3D 캔버스 위 좌상단 오버레이 */
  kpis?: VizKPI[];

  /** 고객 여정 단계 — 3D 캔버스 위 하단 오버레이 */
  stage?: CustomerStage;

  /** 파라메트릭 매장 설정 (PHASE H) */
  storeParams?: StoreParams;

  /** 존별 크기 조정 (PHASE H) */
  zoneScale?: ZoneScale;

  /** 카메라가 포커싱할 존 ID (동적 카메라) */
  focusZone?: string;

  /** 카메라 앵글 힌트 (focusZone과 함께 사용) */
  cameraAngle?: CameraAngle;

  /** A-7: 존 클릭 시 콜백 (Chat에서 자동 질문 삽입용) */
  onZoneClick?: (zoneId: string, zoneLabel: string) => void;
}

// ═══════════════════════════════════════════
//  어노테이션 위치 타입
// ═══════════════════════════════════════════

interface AnnotationPosition {
  zone: string;
  text: string;
  color: string;
  x: number;
  y: number;
  visible: boolean;
}

// ═══════════════════════════════════════════
//  텍스트 라벨 겹침 방지 유틸리티
// ═══════════════════════════════════════════

interface LabelRect {
  idx: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 2D AABB 겹침 감지 + 밀어내기
 * 모든 라벨의 추정 바운딩 박스를 계산하고
 * 겹치는 쌍을 수직으로 분리시킴
 */
/**
 * 한글/영문 혼합 텍스트의 실제 렌더링 너비를 추정
 * 한글(AC00~D7AF, 3130~318F)은 영문 대비 ~1.7배 넓음
 */
function estimateTextWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    if ((code >= 0xAC00 && code <= 0xD7AF) || (code >= 0x3130 && code <= 0x318F)) {
      width += 12; // 한글 ~12px
    } else {
      width += 7;  // 영문/숫자/기호 ~7px
    }
  }
  return width;
}

function resolveTextOverlaps(
  items: Array<{ x: number; y: number; text: string; visible: boolean }>,
  lineHeight = 18,
  padX = 16,
  padY = 8,
  gap = 6,
): void {
  // 보이는 항목만 필터링
  const rects: LabelRect[] = [];
  for (let i = 0; i < items.length; i++) {
    if (!items[i].visible) continue;
    const text = items[i].text;
    const lines = text.split('\n');
    const maxLineWidth = Math.max(...lines.map(l => estimateTextWidth(l)));
    const w = maxLineWidth + padX;
    const h = lines.length * lineHeight + padY;
    rects.push({ idx: i, x: items[i].x, y: items[i].y, w, h });
  }

  // Y 기준 정렬 (위에서 아래로)
  rects.sort((a, b) => a.y - b.y);

  // 겹침 해소: 2 패스 (대부분 1패스로 충분)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const overlapX = (a.w / 2 + b.w / 2) - Math.abs(a.x - b.x);
        const overlapY = (a.h / 2 + b.h / 2) - Math.abs(a.y - b.y);
        if (overlapX > 0 && overlapY > 0) {
          // 수직으로 밀어냄 — b를 아래로
          const pushY = (a.h / 2 + b.h / 2 + gap) - (b.y - a.y);
          b.y += pushY;
        }
      }
    }
  }

  // 결과 적용
  for (const r of rects) {
    items[r.idx].y = r.y;
  }
}

// ═══════════════════════════════════════════
//  메인 컴포넌트
// ═══════════════════════════════════════════

export default function StoreVisualizer({
  vizState,
  highlights = [],
  annotations = [],
  showFlow,
  className = '',
  zones,
  kpis,
  stage,
  storeParams,
  zoneScale,
  focusZone,
  cameraAngle,
  onZoneClick,
}: StoreVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneObjects | null>(null);
  const animationFrameRef = useRef<number>(0);

  // OrbitControls 관련
  const controlsRef = useRef<OrbitControls | null>(null);
  const isUserInteracting = useRef<boolean>(false);

  // 카메라 목표 위치 (lerp용)
  const cameraTargetPos = useRef<THREE.Vector3>(
    new THREE.Vector3(...CAMERA_PRESETS.overview.pos)
  );
  const cameraTargetLookAt = useRef<THREE.Vector3>(
    new THREE.Vector3(...CAMERA_PRESETS.overview.target)
  );
  const cameraTargetFov = useRef<number>(CAMERA_PRESETS.overview.fov);

  // 존 클릭 팝업 상태
  const [clickedZone, setClickedZone] = useState<{
    id: string; label: string; color: string;
    x: number; y: number;
    w: number; d: number;
    annotation?: string;
  } | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  // 어노테이션 스크린 좌표
  const [annotationPositions, setAnnotationPositions] = useState<AnnotationPosition[]>([]);

  // 존 라벨 스크린 좌표 (3D 씬 내부 존 이름 표시용)
  const [zoneLabelPositions, setZoneLabelPositions] = useState<Array<{
    id: string; label: string; color: string; x: number; y: number; visible: boolean;
  }>>([]);

  // 동적 존 맵 (어노테이션/범례에서 사용)
  const zoneMap = useMemo(() => {
    if (!zones || zones.length === 0) return null;
    const map: Record<string, DynamicZone> = {};
    for (const z of zones) {
      map[z.id] = z;
    }
    return map;
  }, [zones]);

  // Scene diff: 이전 존 상태 추적
  const prevZonesRef = useRef<DynamicZone[] | undefined>(undefined);

  // 파라메트릭 설정 메모이제이션 (씬 재빌드 트리거)
  // zone ID뿐 아니라 위치/크기/라벨까지 포함하여 대화 주제 전환 시 씬 재빌드 보장
  const sceneConfigKey = useMemo(() => {
    const zoneKey = zones?.map(z => `${z.id}:${z.x},${z.z},${z.w},${z.d}`).join('|') || '';
    if (!storeParams && !zoneScale && !zoneKey) return 'default';
    return JSON.stringify({ storeParams, zoneScale, zoneKey });
  }, [storeParams, zoneScale, zones]);

  // ─────────────────────────────────────────
  // 애니메이션 루프
  // ─────────────────────────────────────────
  const animate = useCallback(() => {
    if (!sceneRef.current) return;

    const {
      scene,
      camera,
      renderer,
      zonePlanes,
      flowLine,
      flowDots,
      flowCurve,
      particles
    } = sceneRef.current;

    const time = performance.now() * 0.001;

    // OrbitControls 업데이트
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // 1. 카메라 lerp 보간 (사용자 인터랙션 중이 아닐 때만)
    // TODO: 프리셋 전환 애니메이션 속도 조절 필요 시 lerpFactor 변경
    if (!isUserInteracting.current) {
      // ease-out cubic: 시작은 빠르게, 끝은 부드럽게
      const rawLerp = 0.035;
      const posDist = camera.position.distanceTo(cameraTargetPos.current);
      const maxDist = 30;
      const t = Math.min(1, posDist / maxDist);
      const lerpFactor = rawLerp * (1 + 2 * t * t); // 멀수록 더 빠르게 이동

      // 현재 위치가 타겟과 충분히 가까우면 lerp 스킵 (불필요한 미세 보정 방지)
      if (posDist > 0.01) {
        const newPos = lerpVector3(camera.position, cameraTargetPos.current, lerpFactor);
        camera.position.copy(newPos);
      }

      // OrbitControls target을 직접 lerp (lookAt 대신 — OrbitControls가 카메라 방향을 관리)
      if (controlsRef.current) {
        const targetDist = controlsRef.current.target.distanceTo(cameraTargetLookAt.current);
        if (targetDist > 0.01) {
          controlsRef.current.target.lerp(cameraTargetLookAt.current, lerpFactor);
        }
      }

      // FOV lerp
      const fovDiff = Math.abs(cameraTargetFov.current - camera.fov);
      if (fovDiff > 0.01) {
        camera.fov += (cameraTargetFov.current - camera.fov) * lerpFactor;
        camera.updateProjectionMatrix();
      }
    }

    // 2. 존 플레인 opacity pulse (하이라이트된 존만)
    Object.values(zonePlanes).forEach(({ plane, border }) => {
      const mat = plane.material as THREE.MeshBasicMaterial;
      const borderMat = border.material as THREE.LineBasicMaterial;

      if (plane.userData.highlighted) {
        // 하이라이트: ease-in-out sine pulse (부드러운 호흡 효과)
        const pulse = (Math.sin(time * 1.8) + 1) * 0.5; // 0~1 정규화
        const eased = pulse * pulse * (3 - 2 * pulse);    // smoothstep
        mat.opacity = 0.15 + eased * 0.22;
        borderMat.opacity = 0.7 + eased * 0.3;
      } else {
        // 비활성: 존 경계는 약하게 유지 (완전히 안 보이면 공간감 상실)
        mat.opacity = Math.max(0.04, mat.opacity - 0.02);
        borderMat.opacity = Math.max(0.18, borderMat.opacity - 0.02);
      }
    });

    // 3. 동선 표시
    const flowMat = flowLine.material as THREE.LineBasicMaterial;
    if (flowLine.userData.showFlow) {
      flowMat.opacity = Math.min(0.85, flowMat.opacity + 0.02);

      // 점들 이동
      flowDots.forEach((dot) => {
        const dotMat = dot.material as THREE.MeshBasicMaterial;
        dotMat.opacity = Math.min(1.0, dotMat.opacity + 0.02);

        const progress = ((time * 0.15 + dot.userData.offset) % 1);
        const point = flowCurve.getPointAt(progress);
        dot.position.copy(point);
      });
    } else {
      flowMat.opacity = Math.max(0, flowMat.opacity - 0.02);
      flowDots.forEach((dot) => {
        const dotMat = dot.material as THREE.MeshBasicMaterial;
        dotMat.opacity = Math.max(0, dotMat.opacity - 0.02);
      });
    }

    // 4. 파티클 회전
    particles.rotation.y = time * 0.02;

    // 5. 렌더링
    renderer.render(scene, camera);

    // 6. 어노테이션 위치 업데이트 (30fps throttle)
    if (Math.floor(time * 30) % 1 === 0) {
      updateAnnotationPositions();
    }

    // 다음 프레임
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // ─────────────────────────────────────────
  // 어노테이션 3D→2D 좌표 변환
  // ─────────────────────────────────────────
  const updateAnnotationPositions = useCallback(() => {
    if (!sceneRef.current || !canvasRef.current) {
      setAnnotationPositions([]);
      setZoneLabelPositions([]);
      return;
    }

    const { camera, renderer } = sceneRef.current;
    const canvas = renderer.domElement;

    // 어노테이션 위치 업데이트
    let newAnnotations: AnnotationPosition[] = [];
    if (annotations?.length) {
      newAnnotations = annotations.map((ann) => {
        const dynZone = zoneMap?.[ann.zone];
        const staticZone = STORE.zones[ann.zone];
        const zoneData = dynZone || staticZone;
        if (!zoneData) {
          return { ...ann, x: 0, y: 0, visible: false };
        }

        const worldPos = new THREE.Vector3(zoneData.x, 2.5, zoneData.z);
        const projected = worldPos.clone().project(camera);
        const visible = projected.z < 1 && Math.abs(projected.x) < 1.2 && Math.abs(projected.y) < 1.2;
        const x = (projected.x * 0.5 + 0.5) * canvas.clientWidth;
        const y = (-projected.y * 0.5 + 0.5) * canvas.clientHeight;

        return { zone: ann.zone, text: ann.text, color: ann.color, x, y, visible };
      });
    }

    // 존 라벨 위치 업데이트 (동적 존이 있을 때만)
    let newZoneLabels: Array<{ id: string; label: string; color: string; x: number; y: number; visible: boolean }> = [];
    if (zones && zones.length > 0) {
      newZoneLabels = zones.map((z) => {
        // 존 바닥 중심 바로 위 (y=0.5)
        const worldPos = new THREE.Vector3(z.x, 0.5, z.z);
        const projected = worldPos.clone().project(camera);
        const visible = projected.z < 1 && Math.abs(projected.x) < 1.2 && Math.abs(projected.y) < 1.2;
        const x = (projected.x * 0.5 + 0.5) * canvas.clientWidth;
        const y = (-projected.y * 0.5 + 0.5) * canvas.clientHeight;

        return { id: z.id, label: z.label, color: z.color, x, y, visible };
      });
    }

    // ── 텍스트 겹침 방지: 모든 텍스트 요소를 통합해서 충돌 해소 ──
    // 통합 배열: zone labels + annotations → 겹침 해소 → 분리해서 setState
    const combined: Array<{ x: number; y: number; text: string; visible: boolean; type: 'zone' | 'ann'; idx: number }> = [];
    for (let i = 0; i < newZoneLabels.length; i++) {
      combined.push({ x: newZoneLabels[i].x, y: newZoneLabels[i].y, text: newZoneLabels[i].label, visible: newZoneLabels[i].visible, type: 'zone', idx: i });
    }
    for (let i = 0; i < newAnnotations.length; i++) {
      combined.push({ x: newAnnotations[i].x, y: newAnnotations[i].y, text: newAnnotations[i].text, visible: newAnnotations[i].visible, type: 'ann', idx: i });
    }

    if (combined.length > 1) {
      resolveTextOverlaps(combined);
      // 해소 결과 역반영
      for (const item of combined) {
        if (item.type === 'zone') {
          newZoneLabels[item.idx].x = item.x;
          newZoneLabels[item.idx].y = item.y;
        } else {
          newAnnotations[item.idx].x = item.x;
          newAnnotations[item.idx].y = item.y;
        }
      }
    }

    setAnnotationPositions(newAnnotations);
    setZoneLabelPositions(newZoneLabels);
  }, [annotations, zoneMap, zones]);

  // ─────────────────────────────────────────
  // 초기화
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // WebGL 컨텍스트 가용성 체크
    const testContext = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!testContext) {
      console.error('WebGL not available on this canvas');
      return;
    }

    // 파라메트릭 설정 적용 (PHASE H + 동적 존)
    const flowOrder = Array.isArray(showFlow) ? showFlow : undefined;
    const sceneConfig = (storeParams || zoneScale || (zones && zones.length > 0))
      ? applyParamsToConfig(storeParams, zoneScale, zones, flowOrder)
      : undefined;

    // 씬 빌드 (파라메트릭 config 전달)
    // 컨테이너가 숨겨져 있어 크기가 0이면 최소값 사용 (전체화면 뒤 인라인 뷰 보호)
    const w = container.clientWidth || 400;
    const h = container.clientHeight || 300;
    const sceneObjects = buildScene(
      canvas,
      w,
      h,
      sceneConfig
    );
    sceneRef.current = sceneObjects;

    // OrbitControls 설정
    const controls = new OrbitControls(sceneObjects.camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.0;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI * 0.45; // 수평선 아래로 카메라 회전 제한
    controls.target.set(...CAMERA_PRESETS.overview.target);

    // 사용자 인터랙션 감지 — 종료 시 현재 카메라 위치를 타겟에 저장하여 스냅백 방지
    controls.addEventListener('start', () => {
      isUserInteracting.current = true;
    });
    controls.addEventListener('end', () => {
      isUserInteracting.current = false;
      // 사용자가 조작한 최종 위치를 lerp 타겟으로 저장 → 원래 위치로 돌아가지 않음
      if (sceneRef.current) {
        cameraTargetPos.current.copy(sceneRef.current.camera.position);
        cameraTargetLookAt.current.copy(controls.target);
        cameraTargetFov.current = sceneRef.current.camera.fov;
      }
    });

    controlsRef.current = controls;

    // 존 클릭 핸들러 (raycasting)
    const onMouseDown = (e: MouseEvent) => {
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = (e: MouseEvent) => {
      // 드래그 vs 클릭 구분 — 5px 이상 이동이면 드래그로 판정
      if (mouseDownPosRef.current) {
        const dx = e.clientX - mouseDownPosRef.current.x;
        const dy = e.clientY - mouseDownPosRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          mouseDownPosRef.current = null;
          return;
        }
      }
      mouseDownPosRef.current = null;

      if (!sceneRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, sceneRef.current.camera);
      const planes = Object.values(sceneRef.current.zonePlanes).map(zp => zp.plane);
      const intersects = raycasterRef.current.intersectObjects(planes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const zoneId = hit.userData.zoneId as string;
        if (!zoneId) return;

        // 동적 존 또는 하드코딩 존에서 라벨/색상 조회
        const dynZone = zones?.find(z => z.id === zoneId);
        const label = dynZone?.label || ZONE_LABELS_KO[zoneId] || zoneId;
        const color = dynZone?.color || getZoneColorHex(zoneId);
        const w = dynZone?.w || 6;
        const d = dynZone?.d || 6;

        // 해당 존의 어노테이션 조회
        const ann = annotations.find(a => a.zone === zoneId);

        setClickedZone({
          id: zoneId, label, color,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          w, d,
          annotation: ann?.text,
        });
        // A-7: 외부 콜백 호출 (Chat에서 자동 질문 삽입)
        onZoneClick?.(zoneId, label);
      } else {
        setClickedZone(null);
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);

    // 애니메이션 시작
    animationFrameRef.current = requestAnimationFrame(animate);

    // 리사이즈 핸들러
    const resizeObserver = new ResizeObserver((entries) => {
      if (!sceneRef.current) return;

      const entry = entries[0];
      const { width, height } = entry.contentRect;

      if (width > 0 && height > 0) {
        sceneRef.current.camera.aspect = width / height;
        sceneRef.current.camera.updateProjectionMatrix();
        sceneRef.current.renderer.setSize(width, height);
      }
    });

    resizeObserver.observe(container);

    // 정리
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();

      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }

      if (sceneRef.current) {
        disposeScene(sceneRef.current);
        sceneRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, sceneConfigKey]);

  // ─────────────────────────────────────────
  // vizState / focusZone 변경 시 카메라 업데이트
  // ─────────────────────────────────────────
  useEffect(() => {
    // focusZone이 있으면 해당 존 중심으로 동적 카메라 계산
    if (focusZone && zones && zones.length > 0) {
      const targetZone = zones.find(z => z.id === focusZone);
      if (targetZone) {
        const zx = targetZone.x;
        const zz = targetZone.z;
        const zoneSize = Math.max(targetZone.w, targetZone.d);
        const dist = zoneSize * 1.2 + 5; // 존 크기에 비례한 카메라 거리

        // cameraAngle에 따라 카메라 위치 결정
        let camPos: [number, number, number];
        switch (cameraAngle) {
          case 'front':
            camPos = [zx, dist * 0.6, zz + dist];
            break;
          case 'side':
            camPos = [zx + dist, dist * 0.6, zz];
            break;
          case 'top':
            camPos = [zx, dist * 1.5, zz + 0.1]; // 약간 오프셋 (정상향 방지)
            break;
          case 'perspective':
          default:
            camPos = [zx + dist * 0.7, dist * 0.8, zz + dist * 0.7];
            break;
        }

        cameraTargetPos.current = new THREE.Vector3(...camPos);
        cameraTargetLookAt.current = new THREE.Vector3(zx, 0, zz);
        cameraTargetFov.current = 45;
        return;
      }
    }

    // focusZone이 없으면 기존 프리셋 사용
    const preset = CAMERA_PRESETS[vizState];
    if (preset) {
      cameraTargetPos.current = new THREE.Vector3(...preset.pos);
      cameraTargetLookAt.current = new THREE.Vector3(...preset.target);
      cameraTargetFov.current = preset.fov;
    }
  }, [vizState, focusZone, cameraAngle, zones]);

  // ─────────────────────────────────────────

  // ─────────────────────────────────────────
  // highlights 변경 시 존 하이라이트 업데이트
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;

    const { zonePlanes } = sceneRef.current;

    // 모든 존 하이라이트 해제
    Object.values(zonePlanes).forEach(({ plane }) => {
      plane.userData.highlighted = false;
    });

    // 지정된 존만 하이라이트
    highlights.forEach((zoneId) => {
      const zoneObj = zonePlanes[zoneId];
      if (zoneObj) {
        zoneObj.plane.userData.highlighted = true;
      }
    });
  }, [highlights]);

  // ─────────────────────────────────────────
  // A-4: Scene Diff 로깅 (존 변경사항 추적)
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!zones) return;

    const diff = computeZoneDiff(prevZonesRef.current, zones);
    if (diff.added.length > 0 || diff.removed.length > 0 || diff.updated.length > 0) {
      console.log(`[SceneDiff] ${describeDiff(diff)}`);
    }
    prevZonesRef.current = zones;
  }, [zones]);

  // ─────────────────────────────────────────
  // showFlow 변경 시 동선 표시 업데이트
  // boolean이면 그대로, string[]이면 true (동선 표시 + 순서는 씬 빌드 시 반영)
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;

    const shouldShow = Array.isArray(showFlow) ? showFlow.length >= 2 : showFlow;
    sceneRef.current.flowLine.userData.showFlow = shouldShow;
  }, [showFlow]);

  // ─────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Three.js Canvas */}
      <div ref={containerRef} className="w-full h-full overflow-hidden">
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>

      {/* 존 라벨 오버레이 (3D 씬 내부 각 존 위에 이름 표시) */}
      {zoneLabelPositions.map((zl) =>
        zl.visible ? (
          <div
            key={`zone-label-${zl.id}`}
            className="absolute pointer-events-none"
            style={{
              left: zl.x,
              top: zl.y,
              transform: 'translate(-50%, -50%)',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: `${zl.color}22`,
              border: `1px solid ${zl.color}44`,
              color: `${zl.color}`,
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontFamily: "'Noto Sans KR', 'Fira Code', sans-serif",
              fontWeight: 600,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              zIndex: 5,
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              opacity: 0.9,
            }}
          >
            {zl.label}
          </div>
        ) : null
      )}

      {/* 존 클릭 팝업 */}
      {clickedZone && (
        <div
          className="absolute z-20 animate-fade-in-up"
          style={{
            left: Math.min(clickedZone.x, (containerRef.current?.clientWidth || 300) - 180),
            top: Math.max(clickedZone.y - 10, 10),
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            className="rounded-lg backdrop-blur-md border shadow-lg"
            style={{
              backgroundColor: '#0a0f1aee',
              borderColor: `${clickedZone.color}55`,
              padding: 'clamp(8px, 1.2vw, 14px)',
              minWidth: '140px',
              maxWidth: '200px',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="rounded-full"
                  style={{ width: 8, height: 8, backgroundColor: clickedZone.color }}
                />
                <span
                  className="font-semibold"
                  style={{
                    color: clickedZone.color,
                    fontSize: 'clamp(10px, 1.6vw, 13px)',
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  {clickedZone.label}
                </span>
              </div>
              <button
                onClick={() => setClickedZone(null)}
                className="text-[#64748b] hover:text-white transition-colors"
                style={{ fontSize: '14px', lineHeight: 1, padding: '0 2px' }}
              >
                ×
              </button>
            </div>
            <div
              className="text-[#94a3b8]"
              style={{
                fontSize: 'clamp(9px, 1.3vw, 11px)',
                fontFamily: "'Fira Code', monospace",
              }}
            >
              {clickedZone.w}m × {clickedZone.d}m ({(clickedZone.w * clickedZone.d).toFixed(0)}㎡)
            </div>
            {clickedZone.annotation && (
              <div
                className="mt-1 pt-1 border-t border-[#1e293b] text-[#cbd5e1]"
                style={{
                  fontSize: 'clamp(9px, 1.3vw, 11px)',
                  fontFamily: "'Noto Sans KR', sans-serif",
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                }}
              >
                {clickedZone.annotation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 어노테이션 오버레이 */}
      {annotationPositions.map((ann, index) =>
        ann.visible ? (
          <div
            key={`${ann.zone}-${index}`}
            className="absolute pointer-events-none animate-fade-in-up viz-annotation"
            style={{
              left: ann.x,
              top: ann.y,
              transform: 'translate(-50%, -50%)',
              padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 14px)',
              borderRadius: '6px',
              backgroundColor: `${ann.color}33`,
              border: `1px solid ${ann.color}88`,
              color: ann.color,
              fontSize: 'clamp(9px, 1.2vw, 12px)',
              fontFamily: "'Fira Code', 'Noto Sans KR', monospace",
              fontWeight: 600,
              backdropFilter: 'blur(6px)',
              whiteSpace: 'pre-line',
              textAlign: 'center',
              zIndex: 10,
              lineHeight: 1.5,
              maxWidth: 'clamp(120px, 25vw, 220px)'
            }}
          >
            {ann.text}
          </div>
        ) : null
      )}

      {/* ── 상단 영역: KPI Bar ── */}
      {kpis && kpis.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-auto">
          <KPIBar kpis={kpis} />
        </div>
      )}

      {/* ── 우측 중앙: ZONES 범례 (전체 존 표시) ── */}
      {(() => {
        // 동적 존이 있으면 전체 동적 존 표시, 없으면 하이라이트된 정적 존만 표시
        const legendZones: Array<{ id: string; color: string; label: string; isHighlighted: boolean }> = [];
        const highlightSet = new Set(highlights);

        if (zones && zones.length > 0) {
          // 동적 존: 전체 표시
          for (const z of zones) {
            legendZones.push({
              id: z.id,
              color: z.color,
              label: z.label.replace(/\s*\(.*?\)\s*$/, '').trim() || z.label,
              isHighlighted: highlightSet.has(z.id),
            });
          }
        } else if (highlights.length > 0) {
          // 정적 존: 하이라이트된 것만 표시 (기존 동작 유지)
          for (const zoneId of highlights) {
            legendZones.push({
              id: zoneId,
              color: getZoneColorHex(zoneId),
              label: ZONE_LABELS_KO[zoneId] || zoneId,
              isHighlighted: true,
            });
          }
        }

        if (legendZones.length === 0) return null;

        return (
          <div
            className="absolute rounded bg-[#030712dd] border border-[#1e293b] backdrop-blur-sm z-10"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              right: 'clamp(6px, 1vw, 12px)',
              padding: 'clamp(6px, 1vw, 10px) clamp(8px, 1.2vw, 14px)',
            }}
          >
            <div
              className="text-[#94a3b8] font-semibold tracking-wider"
              style={{
                fontFamily: "'Fira Code', monospace",
                fontSize: 'clamp(8px, 1.4vw, 10px)',
                marginBottom: 'clamp(4px, 0.6vw, 8px)',
              }}
            >
              ZONES
            </div>
            <div className="flex flex-col" style={{ gap: 'clamp(3px, 0.5vw, 6px)' }}>
              {legendZones.map((zone) => (
                <div key={zone.id} className="flex items-center" style={{ gap: 'clamp(4px, 0.6vw, 8px)' }}>
                  <div
                    className="rounded-full"
                    style={{
                      backgroundColor: zone.color,
                      width: 'clamp(6px, 1vw, 10px)',
                      height: 'clamp(6px, 1vw, 10px)',
                      opacity: 1,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Noto Sans KR', 'Fira Code', sans-serif",
                      fontSize: 'clamp(9px, 1.6vw, 12px)',
                      color: '#cbd5e1',
                    }}
                  >
                    {zone.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── 하단 영역: VIEW 라벨 + 조작힌트 → StageProgress 순서 ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        {/* VIEW 라벨 + 조작 힌트 (Stage 위쪽 행) */}
        <div
          className="flex items-center justify-between mb-1"
          style={{ padding: '0 clamp(6px, 1vw, 12px)' }}
        >
          {/* 좌: 현재 뷰 상태 */}
          <div
            className="pointer-events-auto rounded bg-[#0a0a0acc]
                        border border-[#1e293b] text-[#94a3b8]
                        backdrop-blur-sm truncate sm:max-w-[280px]"
            style={{
              fontFamily: "'Fira Code', 'Noto Sans KR', monospace",
              fontSize: 'clamp(8px, 1.5vw, 11px)',
              padding: 'clamp(3px, 0.5vw, 6px) clamp(6px, 1vw, 12px)',
            }}
          >
            VIEW: {vizState.toUpperCase()}
            {highlights.length > 0 && (
              <span className="hidden sm:inline"> · {highlights.map(h => {
                const dz = zoneMap?.[h];
                return dz ? dz.label : (ZONE_LABELS_KO[h] || h);
              }).join(', ')}</span>
            )}
          </div>

          {/* 우: 조작 힌트 (모바일 숨김) */}
          <div
            className="pointer-events-auto rounded bg-[#0a0a0acc]
                        border border-[#1e293b] text-[#64748b]
                        backdrop-blur-sm hidden sm:flex items-center"
            style={{
              fontFamily: "'Fira Code', 'Noto Sans KR', monospace",
              fontSize: 'clamp(9px, 1.4vw, 10px)',
              padding: 'clamp(3px, 0.5vw, 6px) clamp(8px, 1vw, 12px)',
              gap: 'clamp(6px, 1vw, 10px)',
            }}
          >
            <span>SCROLL 줌</span>
            <span className="text-[#334155]">·</span>
            <span>L-DRAG 회전</span>
            <span className="text-[#334155]">·</span>
            <span>R-DRAG 이동</span>
          </div>
        </div>

        {/* Stage Progress 바 (최하단) */}
        {stage && (
          <StageProgress stage={stage} />
        )}
      </div>
    </div>
  );
}
