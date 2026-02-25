// ============================================================================
// validate-data Edge Function
// 데이터 검증 - 타입별 규칙 검증 및 에러 리포팅
// Phase 2: 검증 로직 강화
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValidateRequest {
  session_id: string;
  column_mapping: Record<string, string>;
}

interface ValidationError {
  row: number;
  field: string;
  value: unknown;
  message: string;
  severity: "error" | "warning";
}

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: "string" | "number" | "date" | "email" | "phone" | "enum";
  unique?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  enum?: string[];
  pattern?: string;
  customValidator?: string;
}

interface ValidateResponse {
  success: boolean;
  total_rows?: number;
  valid_rows?: number;
  error_rows?: number;
  warning_rows?: number;
  errors?: ValidationError[];
  warnings?: ValidationError[];
  can_import?: boolean;
  error?: string;
}

// 임포트 타입별 검증 규칙
const VALIDATION_RULES: Record<string, ValidationRule[]> = {
  products: [
    { field: "product_name", required: true, type: "string", minLength: 1 },
    { field: "sku", required: true, type: "string", unique: true, minLength: 1 },
    { field: "category", required: true, type: "string" },
    { field: "price", required: true, type: "number", min: 0 },
    { field: "cost_price", type: "number", min: 0 },
    { field: "stock", type: "number", min: 0 },
    {
      field: "display_type",
      type: "enum",
      enum: ["hanging", "standing", "folded", "located", "boxed", "stacked"],
    },
  ],
  customers: [
    { field: "customer_name", required: true, type: "string", minLength: 1 },
    { field: "email", type: "email", unique: true },
    { field: "phone", type: "phone" },
    { field: "segment", type: "enum", enum: ["VIP", "Regular", "New", "Dormant"] },
    { field: "total_purchases", type: "number", min: 0 },
    { field: "last_visit_date", type: "date" },
  ],
  transactions: [
    { field: "transaction_date", required: true, type: "date" },
    { field: "total_amount", required: true, type: "number", min: 0 },
    { field: "payment_method", type: "string" },
    { field: "customer_email", type: "email" },
    { field: "item_sku", type: "string" },
    { field: "quantity", type: "number", min: 1 },
    { field: "unit_price", type: "number", min: 0 },
  ],
  staff: [
    { field: "staff_name", required: true, type: "string", minLength: 1 },
    { field: "staff_code", required: true, type: "string", unique: true },
    {
      field: "role",
      required: true,
      type: "enum",
      enum: ["manager", "sales", "cashier", "security", "fitting", "greeter"],
    },
    { field: "email", type: "email" },
    { field: "phone", type: "phone" },
    { field: "department", type: "string" },
  ],
  inventory: [
    { field: "product_sku", required: true, type: "string" },
    { field: "quantity", required: true, type: "number", min: 0 },
    { field: "min_stock", type: "number", min: 0 },
    { field: "max_stock", type: "number", min: 0 },
    { field: "reorder_point", type: "number", min: 0 },
    { field: "location", type: "string" },
  ],
};

// 이메일 검증 정규식
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 전화번호 검증 정규식 (한국 + 국제)
const PHONE_REGEX = /^(\+?82-?|0)?1[0-9]-?[0-9]{3,4}-?[0-9]{4}$|^\+?[1-9]\d{1,14}$/;

// 날짜 검증
function isValidDate(value: unknown): boolean {
  if (!value) return false;
  const date = new Date(value as string);
  return !isNaN(date.getTime());
}

// 날짜가 미래가 아닌지 검증
function isNotFutureDate(value: unknown): boolean {
  if (!value) return true;
  const date = new Date(value as string);
  return date <= new Date();
}

// 단일 값 검증
function validateValue(
  value: unknown,
  rule: ValidationRule,
  rowIndex: number
): ValidationError | null {
  const fieldName = rule.field;

  // 필수 필드 검증
  if (rule.required) {
    if (value === null || value === undefined || value === "") {
      return {
        row: rowIndex + 1,
        field: fieldName,
        value,
        message: `필수 필드 '${fieldName}'이(가) 비어있습니다.`,
        severity: "error",
      };
    }
  }

  // 값이 없으면 선택 필드이므로 통과
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // 타입별 검증
  switch (rule.type) {
    case "string":
      if (typeof value !== "string" && typeof value !== "number") {
        return {
          row: rowIndex + 1,
          field: fieldName,
          value,
          message: `'${fieldName}'은(는) 문자열이어야 합니다.`,
          severity: "error",
        };
      }
      if (rule.minLength && String(value).length < rule.minLength) {
        return {
          row: rowIndex + 1,
          field: fieldName,
          value,
          message: `'${fieldName}'은(는) 최소 ${rule.minLength}자 이상이어야 합니다.`,
          severity: "error",
        };
      }
      if (rule.maxLength && String(value).length > rule.maxLength) {
        return {
          row: rowIndex + 1,
          field: fieldName,
          value,
          message: `'${fieldName}'은(는) 최대 ${rule.maxLength}자까지 가능합니다.`,
          severity: "error",
        };
      }
      break;

    case "number":
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return {
          row: rowIndex + 1,
          field: fieldName,
          value,
          message: `'${fieldName}'은(는) 숫자여야 합니다.`,
          severity: "error",
        };
      }
      if (rule.min !== undefined && numValue < rule.min) {
        return {
          row: rowIndex + 1,
          field: fieldName,
          value,
          message: `'${fieldName}'은(는) ${rule.min} 이상이어야 합니다.`,
          severity: "error",
        };
      }
      if (rule.max !== undefined && numValue > rule.max) {
        return {
          row: rowIndex + 1,
          field: fieldName,
          value,
          message: `'${fieldName}'은(는) ${rule.max} 이하여야 합니다.`,
          severity: "error",
        };
      }
      break;

    case "email":
      if (!EMAIL_REGEX.test(String(value))) {
        return {
          row: rowIndex + 1,
          field: fieldName,
          value,
          message: `'${fieldName}'은(는) 유효한 이메일 형식이 아닙니다.`,
          severity: "error",
        };
      }
      break;

    case "phone":
      const phoneStr = String(value).replace(/[\s-]/g, "");
      if (!PHONE_REGEX.test(phoneStr)) {
        return {
          row: rowIndex + 1,
          field: fieldName,
          value,
          message: `'${fieldName}'은(는) 유효한 전화번호 형식이 아닙니다. (예: 010-1234-5678)`,
          severity: "warning", // 전화번호는 경고로 처리
        };
      }
      break;

    case "date":
      if (!isValidDate(value)) {
        return {
          row: rowIndex + 1,
          field: fieldName,
          value,
          message: `'${fieldName}'은(는) 유효한 날짜 형식이 아닙니다.`,
          severity: "error",
        };
      }
      // 거래일 등은 미래 날짜 불가
      if (fieldName.includes("date") && !isNotFutureDate(value)) {
        return {
          row: rowIndex + 1,
          field: fieldName,
          value,
          message: `'${fieldName}'은(는) 미래 날짜일 수 없습니다.`,
          severity: "warning",
        };
      }
      break;

    case "enum":
      if (rule.enum && !rule.enum.includes(String(value))) {
        return {
          row: rowIndex + 1,
          field: fieldName,
          value,
          message: `'${fieldName}'은(는) 다음 중 하나여야 합니다: ${rule.enum.join(", ")}`,
          severity: "error",
        };
      }
      break;
  }

  return null;
}

// 매핑 적용
function applyMapping(
  row: Record<string, unknown>,
  mapping: Record<string, string>
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [targetField, sourceField] of Object.entries(mapping)) {
    if (sourceField && row[sourceField] !== undefined) {
      mapped[targetField] = row[sourceField];
    }
  }
  return mapped;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 인증 확인
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // 요청 파싱
    const { session_id, column_mapping }: ValidateRequest = await req.json();

    if (!session_id) {
      throw new Error("session_id is required");
    }

    console.log(`🔍 Validating data for session: ${session_id}`);

    // 세션 조회
    const { data: session, error: sessionError } = await supabase
      .from("upload_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found");
    }

    // 권한 확인
    if (session.user_id !== user.id) {
      throw new Error("Access denied");
    }

    // raw_imports에서 원본 데이터 조회
    const { data: rawImport, error: rawError } = await supabase
      .from("raw_imports")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (rawError || !rawImport) {
      throw new Error("Raw import data not found");
    }

    const rawData = rawImport.raw_data as Record<string, unknown>[];
    const importType = session.import_type;
    const rules = VALIDATION_RULES[importType] || [];

    console.log(`📋 Validating ${rawData.length} rows with ${rules.length} rules`);

    // 세션 상태 업데이트
    await supabase
      .from("upload_sessions")
      .update({ status: "validating", updated_at: new Date().toISOString() })
      .eq("id", session_id);

    // 검증 실행
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const uniqueValues: Record<string, Set<string>> = {};
    let validRows = 0;
    const errorRowSet = new Set<number>();

    // 유니크 필드 초기화
    rules.forEach((rule) => {
      if (rule.unique) {
        uniqueValues[rule.field] = new Set();
      }
    });

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const mappedRow = applyMapping(row, column_mapping);
      let rowHasError = false;

      for (const rule of rules) {
        const value = mappedRow[rule.field];
        const error = validateValue(value, rule, i);

        if (error) {
          if (error.severity === "error") {
            errors.push(error);
            rowHasError = true;
          } else {
            warnings.push(error);
          }
        }

        // 유니크 검증
        if (rule.unique && value !== null && value !== undefined && value !== "") {
          const valueStr = String(value).toLowerCase().trim();
          if (uniqueValues[rule.field].has(valueStr)) {
            errors.push({
              row: i + 1,
              field: rule.field,
              value,
              message: `'${rule.field}' 값 '${value}'이(가) 중복됩니다.`,
              severity: "error",
            });
            rowHasError = true;
          } else {
            uniqueValues[rule.field].add(valueStr);
          }
        }
      }

      if (rowHasError) {
        errorRowSet.add(i);
      } else {
        validRows++;
      }
    }

    const totalRows = rawData.length;
    const errorRows = errorRowSet.size;
    const warningRows = new Set(warnings.map((w) => w.row)).size;

    // 임포트 가능 여부 결정 (에러가 10% 미만이면 진행 가능)
    const canImport = errorRows === 0 || errorRows < totalRows * 0.1;

    // 세션 업데이트
    await supabase
      .from("upload_sessions")
      .update({
        status: "validated",
        column_mapping,
        validation_errors: errors.length > 0 ? errors.slice(0, 100) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    console.log(
      `✅ Validation complete: ${validRows}/${totalRows} valid, ${errorRows} errors, ${warningRows} warnings`
    );

    const response: ValidateResponse = {
      success: true,
      total_rows: totalRows,
      valid_rows: validRows,
      error_rows: errorRows,
      warning_rows: warningRows,
      errors: errors.slice(0, 100), // 최대 100개
      warnings: warnings.slice(0, 50), // 최대 50개
      can_import: canImport,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Validation error:", errorMessage);

    const response: ValidateResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
