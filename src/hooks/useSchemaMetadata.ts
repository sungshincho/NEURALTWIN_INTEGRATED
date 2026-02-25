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
    queryFn: async () => {
      console.log('Fetching schema metadata...');
      
      const { data, error } = await supabase.functions.invoke('fetch-db-schema');

      if (error) {
        console.error('Error fetching schema:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch schema');
      }

      console.log(`Schema loaded: ${data.table_count} tables`);
      return data.schema as SchemaMetadata;
    },
    staleTime: 5 * 60 * 1000, // 5분 동안 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분 후 가비지 컬렉션
  });
}
