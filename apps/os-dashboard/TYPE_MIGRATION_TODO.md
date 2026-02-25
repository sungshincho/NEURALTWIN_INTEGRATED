# Type Migration TODO

When `@neuraltwin/types` package is ready, migrate the following:

## Current State
- DB types: `src/integrations/supabase/types.ts` (11,603 lines, auto-generated)
- Client: `src/integrations/supabase/client.ts` (imports `Database` type from `./types`)
- 103 files import from `@/integrations/supabase/client`

## Migration Steps

1. Replace `src/integrations/supabase/types.ts` with re-export from `@neuraltwin/types`:
   ```ts
   export type { Database } from '@neuraltwin/types';
   ```

2. No other files need changes since they import `supabase` client, not types directly.

## Files importing supabase client (103 files)
These files use the client but don't need type import changes:

- src/features/data-control/components/connectors/SyncHistoryTable.tsx
- src/features/data-control/components/DataImportWidget.tsx
- src/features/data-control/components/ImportHistoryWidget.tsx
- src/features/data-control/components/Model3DUploadWidget.tsx
- src/features/data-control/hooks/useApiConnector.ts
- src/features/data-control/hooks/useDataControlTower.ts
- src/features/data-management/import/components/DataImportHistory.tsx
- src/features/data-management/import/components/DataStatistics.tsx
- src/features/data-management/import/components/DataValidation.tsx
- src/features/data-management/import/components/IntegratedImportStatus.tsx
- src/features/data-management/import/components/OntologyDataManagement.tsx
- src/features/data-management/import/components/SchemaMapper.tsx
- src/features/data-management/import/components/StorageManager.tsx
- src/features/data-management/import/components/UnifiedDataUpload.tsx
- src/features/data-management/ontology/components/EntityTypeManager.tsx
- src/features/data-management/ontology/components/GraphQueryBuilder.tsx
- src/features/data-management/ontology/components/MasterSchemaSync.tsx
- src/features/data-management/ontology/components/RelationTypeManager.tsx
- src/features/data-management/ontology/components/RetailSchemaPreset.tsx
- src/features/data-management/ontology/components/SchemaValidator.tsx
- src/features/data-management/ontology/components/SchemaVersionManager.tsx
- src/features/data-management/ontology/utils/comprehensiveRetailSchema.ts
- src/features/insights/context/InsightDataContext.tsx
- src/features/insights/hooks/useAIPrediction.ts
- src/features/insights/hooks/useInventoryMetrics.ts
- src/features/insights/tabs/CustomerTab.tsx
- src/features/insights/tabs/ProductTab.tsx
- src/features/settings/SettingsPage.tsx
- src/features/simulation/ (16 files)
- src/features/studio/ (18 files)
- src/hooks/ (30 files)
- src/lib/storage/loader.ts
- src/services/alertService.ts
