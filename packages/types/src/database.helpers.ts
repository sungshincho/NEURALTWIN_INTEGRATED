import type { Database } from './database.types';

// Row 타입 축약
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Enum 축약
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

// View 축약
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];

// RPC 함수 타입 축약
export type Functions = Database['public']['Functions'];
export type FunctionArgs<T extends keyof Functions> = Functions[T]['Args'];
export type FunctionReturns<T extends keyof Functions> = Functions[T]['Returns'];
