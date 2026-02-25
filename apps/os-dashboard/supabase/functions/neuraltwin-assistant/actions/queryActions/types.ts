/**
 * queryActions 공용 타입 정의
 */

import { UIAction } from '../navigationActions.ts';
import { ClassificationResult } from '../../intent/classifier.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

export type { UIAction, ClassificationResult, SupabaseClient };

export interface QueryActionResult {
  actions: UIAction[];
  message: string;
  suggestions: string[];
  data?: any;
}

export interface PageContext {
  current: string;
  tab?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  compareStartDate?: string;
  compareEndDate?: string;
}
