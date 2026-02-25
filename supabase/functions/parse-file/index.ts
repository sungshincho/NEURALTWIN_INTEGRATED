// ============================================================================
// parse-file Edge Function
// 업로드된 파일 파싱 및 프리뷰 생성
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as XLSX from "https://esm.sh/xlsx@0.18.5"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ParseRequest {
  session_id: string;
}

interface ParseResponse {
  success: boolean;
  columns?: string[];
  preview?: Record<string, unknown>[];
  suggested_mapping?: Record<string, string | null>;
  total_rows?: number;
  error?: string;
}

// 임포트 타입별 필드 매핑 규칙
const MAPPING_RULES: Record<string, Record<string, string[]>> = {
  products: {
    product_name: [
      "product_name",
      "상품명",
      "name",
      "제품명",
      "item_name",
      "title",
      "품명",
      "제품",
      "상품",
    ],
    sku: [
      "sku",
      "SKU",
      "상품코드",
      "product_code",
      "item_code",
      "code",
      "코드",
      "품번",
    ],
    category: [
      "category",
      "카테고리",
      "분류",
      "type",
      "품목",
      "종류",
      "대분류",
    ],
    price: [
      "price",
      "가격",
      "판매가",
      "selling_price",
      "정가",
      "단가",
      "금액",
      "unit_price",
    ],
    stock: [
      "stock",
      "재고",
      "quantity",
      "수량",
      "inventory",
      "재고수량",
      "qty",
    ],
    cost_price: ["cost_price", "원가", "cost", "매입가", "입고가", "도매가", "공급가", "cost_amount"],
    display_type: [
      "display_type",
      "진열타입",
      "진열방식",
      "display",
      "진열",
      "전시방식",
      "배치방식",
      "슬롯타입",
      "slot_type",
    ],
    description: ["description", "설명", "상세설명", "메모", "비고", "note", "상세", "특이사항", "상품설명", "상품상세"],
    brand: ["brand", "브랜드", "제조사", "manufacturer", "브랜드명"],
  },
  customers: {
    customer_name: [
      "customer_name",
      "고객명",
      "name",
      "이름",
      "성명",
      "고객",
      "회원명",
    ],
    email: ["email", "이메일", "e-mail", "mail"],
    phone: [
      "phone",
      "전화번호",
      "tel",
      "휴대폰",
      "mobile",
      "연락처",
      "핸드폰",
      "phone_number",
    ],
    segment: [
      "segment",
      "등급",
      "tier",
      "회원등급",
      "grade",
      "고객등급",
      "membership",
    ],
    total_purchases: [
      "total_purchases",
      "총구매액",
      "구매액",
      "누적구매",
      "total_amount",
    ],
    last_visit_date: [
      "last_visit_date",
      "마지막방문일",
      "최근방문",
      "last_visit",
    ],
  },
  transactions: {
    transaction_date: [
      "transaction_date",
      "거래일",
      "date",
      "날짜",
      "결제일",
      "주문일",
      "order_date",
    ],
    total_amount: [
      "total_amount",
      "총금액",
      "amount",
      "금액",
      "결제금액",
      "합계",
      "total",
    ],
    payment_method: [
      "payment_method",
      "결제수단",
      "payment",
      "결제방법",
      "지불방법",
    ],
    customer_email: [
      "customer_email",
      "고객이메일",
      "email",
      "customer_id",
      "고객번호",
    ],
    item_sku: ["item_sku", "상품코드", "sku", "product_code", "품번"],
    quantity: ["quantity", "수량", "qty", "개수"],
    unit_price: ["unit_price", "단가", "price", "가격"],
  },
  staff: {
    staff_name: ["staff_name", "직원명", "name", "이름", "성명"],
    staff_code: [
      "staff_code",
      "직원코드",
      "code",
      "사번",
      "employee_id",
      "emp_code",
    ],
    role: ["role", "역할", "직책", "position", "직위"],
    department: ["department", "부서", "dept", "팀"],
    email: ["email", "이메일"],
    phone: ["phone", "전화번호", "연락처"],
    assigned_zone: ["assigned_zone", "담당구역", "zone", "구역"],
  },
  inventory: {
    product_sku: ["product_sku", "sku", "상품코드", "product_code", "품번"],
    quantity: ["quantity", "수량", "재고", "stock", "qty"],
    min_stock: ["min_stock", "최소재고", "min", "안전재고"],
    max_stock: ["max_stock", "최대재고", "max"],
    reorder_point: ["reorder_point", "재주문점", "발주점"],
    location: ["location", "위치", "보관위치", "창고"],
  },
};

// 컬럼 자동 매핑 함수
function suggestColumnMapping(
  columns: string[],
  importType: string
): Record<string, string | null> {
  const rules = MAPPING_RULES[importType] || {};
  const mapping: Record<string, string | null> = {};

  for (const [targetField, sourceOptions] of Object.entries(rules)) {
    const matchedColumn = columns.find((col) =>
      sourceOptions.some(
        (opt) =>
          col.toLowerCase().replace(/[_\s-]/g, "") ===
            opt.toLowerCase().replace(/[_\s-]/g, "") ||
          col.toLowerCase().includes(opt.toLowerCase())
      )
    );
    mapping[targetField] = matchedColumn || null;
  }

  return mapping;
}

// CSV 파싱 함수
function parseCSV(text: string): { columns: string[]; data: unknown[][] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) {
    return { columns: [], data: [] };
  }

  // 첫 줄을 헤더로 파싱
  const headerLine = lines[0];
  const columns = parseCSVLine(headerLine);

  // 데이터 파싱
  const data: unknown[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length > 0) {
      data.push(values);
    }
  }

  return { columns, data };
}

// CSV 라인 파싱 (따옴표 처리)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// 배열 데이터를 객체로 변환
function arrayToObject(
  columns: string[],
  row: unknown[]
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i] ?? null;
  });
  return obj;
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
    const { session_id }: ParseRequest = await req.json();

    if (!session_id) {
      throw new Error("session_id is required");
    }

    console.log(`📊 Parsing file for session: ${session_id}`);

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

    // 세션 상태 업데이트
    await supabase
      .from("upload_sessions")
      .update({ status: "parsing", updated_at: new Date().toISOString() })
      .eq("id", session_id);

    // 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("user-imports")
      .download(session.file_path);

    if (downloadError || !fileData) {
      throw new Error(`File download failed: ${downloadError?.message}`);
    }

    console.log(`📥 File downloaded: ${session.file_name}`);

    // 파일 타입별 파싱
    let columns: string[] = [];
    let parsedData: unknown[][] = [];

    const fileType = session.file_type?.toLowerCase();

    switch (fileType) {
      case "csv":
      case "tsv": {
        const text = await fileData.text();
        const result = parseCSV(text);
        columns = result.columns;
        parsedData = result.data;
        break;
      }

      case "xlsx":
      case "xls": {
        const buffer = await fileData.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
        }) as unknown[][];

        if (jsonData.length > 0) {
          columns = (jsonData[0] as string[]).map((col) =>
            col?.toString() || ""
          );
          parsedData = jsonData.slice(1);
        }
        break;
      }

      case "json": {
        const text = await fileData.text();
        const jsonContent = JSON.parse(text);

        if (Array.isArray(jsonContent) && jsonContent.length > 0) {
          columns = Object.keys(jsonContent[0]);
          parsedData = jsonContent.map((item) =>
            columns.map((col) => item[col])
          );
        } else if (typeof jsonContent === "object") {
          // 단일 객체인 경우
          columns = Object.keys(jsonContent);
          parsedData = [columns.map((col) => jsonContent[col])];
        }
        break;
      }

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log(`📋 Parsed ${parsedData.length} rows, ${columns.length} columns`);

    // 프리뷰 생성 (처음 10행)
    const preview = parsedData.slice(0, 10).map((row) => {
      if (Array.isArray(row)) {
        return arrayToObject(columns, row);
      }
      return row as Record<string, unknown>;
    });

    // 자동 매핑 제안
    const suggestedMapping = suggestColumnMapping(columns, session.import_type);

    // 세션 업데이트
    await supabase
      .from("upload_sessions")
      .update({
        status: "parsed",
        row_count: parsedData.length,
        parsed_preview: preview,
        column_mapping: suggestedMapping,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    // raw_imports에 원본 데이터 저장
    const { error: rawError } = await supabase.from("raw_imports").insert({
      session_id: session_id,
      user_id: user.id,
      store_id: session.store_id,
      org_id: session.org_id,
      source_type: "file",
      source_name: session.file_name,
      file_path: session.file_path,
      data_type: session.import_type,
      raw_data: parsedData.map((row) => arrayToObject(columns, row as unknown[])),
      row_count: parsedData.length,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (rawError) {
      console.error("Raw import save error:", rawError);
      // 에러가 있어도 계속 진행 (raw_imports는 선택적)
    } else {
      console.log("✅ Raw data saved to raw_imports");
    }

    const response: ParseResponse = {
      success: true,
      columns,
      preview,
      suggested_mapping: suggestedMapping,
      total_rows: parsedData.length,
    };

    console.log(`✅ Parse complete: ${parsedData.length} rows`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Parse error:", errorMessage);

    const response: ParseResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
