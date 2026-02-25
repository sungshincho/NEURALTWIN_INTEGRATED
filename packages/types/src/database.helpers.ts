import type { Database } from './database.types';

// Tables, TablesInsert, TablesUpdate, Enums are already exported from database.types.ts

// View 축약
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];

// RPC 함수 타입 축약
export type Functions = Database['public']['Functions'];
export type FunctionArgs<T extends keyof Functions> = Functions[T]['Args'];
export type FunctionReturns<T extends keyof Functions> = Functions[T]['Returns'];
