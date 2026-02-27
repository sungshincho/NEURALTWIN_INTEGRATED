# NeuralTwin Design System

> **Owner**: Teammate 6 — Designer (UI/UX)
> **Last Updated**: 2026-02-27

## Overview

이 디렉토리는 NeuralTwin 플랫폼의 디자인 시스템, UI/UX 가이드라인, 컴포넌트 스펙을 관리합니다.

## Structure

```
docs/design/
├── README.md                 ← 이 파일
├── DESIGN_SYSTEM.md          ← 디자인 시스템 (토큰, 색상, 타이포, 간격)
├── COMPONENT_SPEC.md         ← 컴포넌트 스펙 (@neuraltwin/ui 기준)
├── USER_FLOWS.md             ← 유저플로우 다이어그램
├── INTERACTION_PATTERNS.md   ← 인터랙션/애니메이션 패턴
├── ACCESSIBILITY.md          ← 접근성 가이드 (A11y)
└── AUDIT_LOG.md              ← 디자인 리뷰/감사 기록
```

## Cross-Team Protocol

- **T3 (DT/OS), T4 (Website)** 가 UI 구현 시 이 디렉토리의 스펙을 참조
- **디자이너(T6)** 가 `packages/ui/` 변경 방향을 문서로 먼저 정의 → T4가 구현
- 디자인 가이드 변경 시 PM이 T3, T4에게 알림

## Reference (Read-Only)

- `apps/website/` — 현재 Website UI 구현
- `apps/os-dashboard/` — 현재 OS Dashboard UI 구현
- `packages/ui/` — 공유 UI 컴포넌트 패키지
