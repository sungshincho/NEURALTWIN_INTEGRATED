import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ColumnMetadata {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
  is_primary_key: boolean;
}

export interface ForeignKey {
  column_name: string;
  foreign_table: string;
  foreign_column: string;
}

export interface TableMetadata {
  table_name: string;
  columns: ColumnMetadata[];
  foreign_keys: ForeignKey[];
  primary_keys: string[];
}

export type SchemaMetadata = Record<string, TableMetadata>;

export function useSchemaMetadata() {
  return useQuery({
    queryKey: ['schema-metadata'],
    queryFn: async (): Promise<SchemaMetadata> => {
      console.log('Fetching schema metadata...');

      try {
        const { data, error } = await supabase.functions.invoke('fetch-db-schema');

        if (error) {
          console.warn('Schema fetch unavailable (fetch-db-schema EF not deployed), using empty schema');
          return {} as SchemaMetadata;
        }

        if (!data?.success) {
          console.warn('Schema fetch returned unsuccessful, using empty schema');
          return {} as SchemaMetadata;
        }

        console.log(`Schema loaded: ${data.table_count} tables`);
        return data.schema as SchemaMetadata;
      } catch (err) {
        console.warn('Schema metadata unavailable, proceeding without schema validation:', err);
        return {} as SchemaMetadata;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
}
