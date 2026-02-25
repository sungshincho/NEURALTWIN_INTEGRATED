# Edge Function Usage Map

> Auto-generated during Phase 4 Step 4. Updated: 2026-02-25

## Summary

| Category | Count |
|----------|-------|
| Total EFs (excl. _shared) | 47 |
| Active (called from apps or EFs) | 32 |
| Unused (no callers found) | 15 |
| Website-only | 2 |
| OS-Dashboard-only | 25 |
| Internal-only (EF→EF) | 5 |

---

## Full Usage Table

| EF Name | Website | OS Dashboard | Other EFs | Status |
|---------|---------|--------------|-----------|--------|
| advanced-ai-inference | — | useEnhancedAIInference, useCongestionSimulation, useFlowSimulation, useSceneSimulation | — | active |
| aggregate-all-kpis | — | UnifiedDataUpload.tsx | — | active |
| aggregate-dashboard-kpis | — | — | — | **unused** |
| analyze-3d-model | — | StorageManager.tsx, ModelUploader.tsx | — | active |
| api-connector | — | useApiConnector.ts | sync-api-data | active |
| apply-sample-data | — | useOnboarding.ts | — | active |
| auto-fix-data | — | DataValidation.tsx | — | active |
| auto-map-etl | — | SchemaMapper.tsx, UnifiedDataUpload.tsx | — | active |
| auto-process-3d-models | — | StorageManager.tsx, UnifiedDataUpload.tsx, ModelLayerManager.tsx | — | active |
| bright-processor | — | — | — | **unused** |
| datasource-mapper | — | useRetailOntology.ts | — | active |
| dynamic-handler | — | — | — | **unused** |
| dynamic-responder | — | — | — | **unused** |
| environment-proxy | — | environmentDataService.ts | — | active |
| etl-health | — | useDataControlTower.ts | — | active |
| etl-scheduler | — | — | unified-etl (fetch) | internal-only |
| execute-import | — | DataImportWidget.tsx | — | active |
| fetch-db-schema | — | useSchemaMetadata.ts | — | active |
| generate-ai-recommendations | — | UnifiedDataUpload.tsx | — | active |
| generate-optimization | — | useLayoutSimulation, useOptimization, useSceneSimulation, useStaffingSimulation | — | active |
| generate-template | — | DataImportWidget.tsx | — | active |
| graph-query | — | GraphQueryBuilder.tsx | — | active |
| hyper-task | — | — | — | **unused** |
| import-with-ontology | — | — | — | **unused** |
| integrated-data-pipeline | — | UnifiedDataUpload.tsx | validate-and-fix-csv, smart-ontology-mapping, unified-etl, sync-api-data | active |
| inventory-monitor | — | useRealtimeInventory.ts | — | active |
| knowledge-admin | — | — | — | **unused** |
| neuraltwin-assistant | — | useAssistantChat.ts | — | active |
| parse-file | — | DataImportWidget.tsx | — | active |
| process-neuralsense-data | — | — | — | **unused** |
| process-wifi-data | — | UnifiedDataUpload.tsx | — | active |
| quick-handler | — | — | — | **unused** |
| replay-import | — | useDataControlTower.ts | unified-etl (fetch) | active |
| retail-ai-inference | — | useSimulationAI.ts, useRetailOntology.ts | — | active |
| retail-chatbot | Chat.tsx | — | — | active |
| rollback-import | — | ImportHistoryWidget.tsx | — | active |
| run-simulation | — | simulationStore.ts | — | active |
| simulation-data-mapping | — | useDataSourceMapping.ts | — | active |
| smart-ontology-mapping | — | — | integrated-data-pipeline | internal-only |
| submit-contact | Contact.tsx | — | — | active |
| sync-api-data | — | — | api-connector, integrated-data-pipeline | internal-only |
| sync-holidays | — | — | — | **unused** |
| sync-poi-context | — | — | — | **unused** |
| sync-preset-data | — | — | — | **unused** |
| sync-trend-signals | — | — | — | **unused** |
| trigger-learning | — | — | — | **unused** |
| unified-ai | — | useEnhancedAIInference, useAIRecommendations, useUnifiedAI | — | active |
| unified-etl | — | SchemaMapper.tsx | etl-scheduler, replay-import, integrated-data-pipeline | active |
| upload-file | — | DataImportWidget.tsx | — | active |
| upscale-image | — | — | — | **unused** |
| validate-and-fix-csv | — | — | integrated-data-pipeline | internal-only |
| validate-batch-files | — | UnifiedDataUpload.tsx | — | active |
| validate-data | — | DataImportWidget.tsx | — | active |

---

## EF→EF Dependency Graph

```
etl-scheduler
  └── unified-etl (fetch)

integrated-data-pipeline
  ├── validate-and-fix-csv (invoke)
  ├── smart-ontology-mapping (invoke)
  └── unified-etl (invoke)

sync-api-data
  ├── api-connector (invoke)
  └── integrated-data-pipeline (invoke)

replay-import
  └── unified-etl (fetch)
```

## Hub EFs (multiple callers)

- **unified-etl**: 4 callers (SchemaMapper, etl-scheduler, replay-import, integrated-data-pipeline)
- **advanced-ai-inference**: 4 callers (simulation hooks)
- **generate-optimization**: 4 callers (simulation hooks)
- **integrated-data-pipeline**: 2 callers (UnifiedDataUpload, sync-api-data)

## Unused EFs — Candidates for Review

| EF | Likely Purpose | Notes |
|----|---------------|-------|
| aggregate-dashboard-kpis | KPI aggregation | May be superseded by aggregate-all-kpis |
| bright-processor | Bright data processing | — |
| dynamic-handler | Dynamic routing | — |
| dynamic-responder | Dynamic responses | — |
| hyper-task | Task execution | — |
| import-with-ontology | Ontology import | — |
| knowledge-admin | Knowledge base admin | — |
| process-neuralsense-data | IoT sensor data | May be triggered externally |
| quick-handler | Fast-track handler | — |
| sync-holidays | Holiday calendar | May be scheduled via cron |
| sync-poi-context | POI data sync | May be scheduled via cron |
| sync-preset-data | Preset config sync | May be scheduled via cron |
| sync-trend-signals | Trend signals | May be scheduled via cron |
| trigger-learning | ML training | — |
| upscale-image | Image enhancement | — |
