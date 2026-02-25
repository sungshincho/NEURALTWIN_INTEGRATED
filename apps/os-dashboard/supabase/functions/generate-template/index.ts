// ============================================================================
// generate-template Edge Function
// 임포트 타입별 샘플 템플릿 생성 - Phase 4
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TemplateRequest {
  import_type: string;
  format: "csv" | "json" | "xlsx";
  include_samples?: boolean;
  language?: "ko" | "en";
}

interface TemplateResponse {
  success: boolean;
  content?: string;
  filename?: string;
  mime_type?: string;
  error?: string;
}

// 임포트 타입별 필드 정의
const TEMPLATE_SCHEMAS: Record<
  string,
  Array<{
    field: string;
    label_ko: string;
    label_en: string;
    required: boolean;
    type: string;
    sample_ko: string;
    sample_en: string;
    description_ko: string;
    description_en: string;
  }>
> = {
  products: [
    {
      field: "product_name",
      label_ko: "상품명",
      label_en: "Product Name",
      required: true,
      type: "string",
      sample_ko: "프리미엄 캐시미어 코트",
      sample_en: "Premium Cashmere Coat",
      description_ko: "상품 이름 (필수)",
      description_en: "Product name (required)",
    },
    {
      field: "sku",
      label_ko: "SKU",
      label_en: "SKU",
      required: true,
      type: "string",
      sample_ko: "SKU-OUT-001",
      sample_en: "SKU-OUT-001",
      description_ko: "고유 상품 코드 (필수)",
      description_en: "Unique product code (required)",
    },
    {
      field: "category",
      label_ko: "카테고리",
      label_en: "Category",
      required: true,
      type: "string",
      sample_ko: "아우터",
      sample_en: "Outerwear",
      description_ko: "상품 분류 (필수)",
      description_en: "Product category (required)",
    },
    {
      field: "price",
      label_ko: "가격",
      label_en: "Price",
      required: true,
      type: "number",
      sample_ko: "450000",
      sample_en: "450000",
      description_ko: "판매가격 (필수)",
      description_en: "Selling price (required)",
    },
    {
      field: "cost_price",
      label_ko: "원가",
      label_en: "Cost Price",
      required: false,
      type: "number",
      sample_ko: "280000",
      sample_en: "280000",
      description_ko: "매입가/원가",
      description_en: "Cost price",
    },
    {
      field: "stock",
      label_ko: "재고",
      label_en: "Stock",
      required: false,
      type: "number",
      sample_ko: "15",
      sample_en: "15",
      description_ko: "현재 재고 수량",
      description_en: "Current stock quantity",
    },
    {
      field: "display_type",
      label_ko: "진열방식",
      label_en: "Display Type",
      required: false,
      type: "string",
      sample_ko: "hanging",
      sample_en: "hanging",
      description_ko: "진열 방식 (hanging, standing, folded)",
      description_en: "Display type (hanging, standing, folded)",
    },
    {
      field: "brand",
      label_ko: "브랜드",
      label_en: "Brand",
      required: false,
      type: "string",
      sample_ko: "럭셔리브랜드",
      sample_en: "LuxuryBrand",
      description_ko: "브랜드/제조사",
      description_en: "Brand/Manufacturer",
    },
  ],
  customers: [
    {
      field: "customer_name",
      label_ko: "고객명",
      label_en: "Customer Name",
      required: true,
      type: "string",
      sample_ko: "김철수",
      sample_en: "John Doe",
      description_ko: "고객 이름 (필수)",
      description_en: "Customer name (required)",
    },
    {
      field: "email",
      label_ko: "이메일",
      label_en: "Email",
      required: false,
      type: "string",
      sample_ko: "kim@example.com",
      sample_en: "john@example.com",
      description_ko: "이메일 주소",
      description_en: "Email address",
    },
    {
      field: "phone",
      label_ko: "전화번호",
      label_en: "Phone",
      required: false,
      type: "string",
      sample_ko: "010-1234-5678",
      sample_en: "010-1234-5678",
      description_ko: "연락처",
      description_en: "Phone number",
    },
    {
      field: "segment",
      label_ko: "고객등급",
      label_en: "Segment",
      required: false,
      type: "string",
      sample_ko: "VIP",
      sample_en: "VIP",
      description_ko: "고객 세그먼트 (VIP, Regular, New, Dormant)",
      description_en: "Customer segment (VIP, Regular, New, Dormant)",
    },
    {
      field: "total_purchases",
      label_ko: "총구매액",
      label_en: "Total Purchases",
      required: false,
      type: "number",
      sample_ko: "2500000",
      sample_en: "2500000",
      description_ko: "누적 구매 금액",
      description_en: "Total purchase amount",
    },
    {
      field: "last_visit_date",
      label_ko: "마지막방문일",
      label_en: "Last Visit Date",
      required: false,
      type: "date",
      sample_ko: "2025-01-10",
      sample_en: "2025-01-10",
      description_ko: "마지막 방문일 (YYYY-MM-DD)",
      description_en: "Last visit date (YYYY-MM-DD)",
    },
  ],
  transactions: [
    {
      field: "transaction_date",
      label_ko: "거래일",
      label_en: "Transaction Date",
      required: true,
      type: "date",
      sample_ko: "2025-01-10",
      sample_en: "2025-01-10",
      description_ko: "거래 일시 (필수)",
      description_en: "Transaction date (required)",
    },
    {
      field: "total_amount",
      label_ko: "거래금액",
      label_en: "Total Amount",
      required: true,
      type: "number",
      sample_ko: "450000",
      sample_en: "450000",
      description_ko: "거래 총액 (필수)",
      description_en: "Transaction total (required)",
    },
    {
      field: "payment_method",
      label_ko: "결제수단",
      label_en: "Payment Method",
      required: false,
      type: "string",
      sample_ko: "card",
      sample_en: "card",
      description_ko: "결제 수단 (card, cash, etc.)",
      description_en: "Payment method (card, cash, etc.)",
    },
    {
      field: "customer_email",
      label_ko: "고객이메일",
      label_en: "Customer Email",
      required: false,
      type: "string",
      sample_ko: "kim@example.com",
      sample_en: "john@example.com",
      description_ko: "고객 이메일",
      description_en: "Customer email",
    },
    {
      field: "item_sku",
      label_ko: "상품SKU",
      label_en: "Item SKU",
      required: false,
      type: "string",
      sample_ko: "SKU-OUT-001",
      sample_en: "SKU-OUT-001",
      description_ko: "구매 상품 SKU",
      description_en: "Purchased item SKU",
    },
    {
      field: "quantity",
      label_ko: "수량",
      label_en: "Quantity",
      required: false,
      type: "number",
      sample_ko: "2",
      sample_en: "2",
      description_ko: "구매 수량",
      description_en: "Purchase quantity",
    },
    {
      field: "unit_price",
      label_ko: "단가",
      label_en: "Unit Price",
      required: false,
      type: "number",
      sample_ko: "225000",
      sample_en: "225000",
      description_ko: "상품 단가",
      description_en: "Unit price",
    },
  ],
  staff: [
    {
      field: "staff_name",
      label_ko: "직원명",
      label_en: "Staff Name",
      required: true,
      type: "string",
      sample_ko: "이영희",
      sample_en: "Jane Smith",
      description_ko: "직원 이름 (필수)",
      description_en: "Staff name (required)",
    },
    {
      field: "staff_code",
      label_ko: "직원코드",
      label_en: "Staff Code",
      required: true,
      type: "string",
      sample_ko: "EMP001",
      sample_en: "EMP001",
      description_ko: "직원 코드/사번 (필수)",
      description_en: "Staff code/ID (required)",
    },
    {
      field: "role",
      label_ko: "역할",
      label_en: "Role",
      required: true,
      type: "string",
      sample_ko: "manager",
      sample_en: "manager",
      description_ko: "직무 역할 (필수)",
      description_en: "Job role (required)",
    },
    {
      field: "department",
      label_ko: "부서",
      label_en: "Department",
      required: false,
      type: "string",
      sample_ko: "영업팀",
      sample_en: "Sales",
      description_ko: "소속 부서",
      description_en: "Department",
    },
    {
      field: "email",
      label_ko: "이메일",
      label_en: "Email",
      required: false,
      type: "string",
      sample_ko: "lee@company.com",
      sample_en: "jane@company.com",
      description_ko: "이메일 주소",
      description_en: "Email address",
    },
    {
      field: "phone",
      label_ko: "전화번호",
      label_en: "Phone",
      required: false,
      type: "string",
      sample_ko: "010-9876-5432",
      sample_en: "010-9876-5432",
      description_ko: "연락처",
      description_en: "Phone number",
    },
  ],
  inventory: [
    {
      field: "product_sku",
      label_ko: "상품SKU",
      label_en: "Product SKU",
      required: true,
      type: "string",
      sample_ko: "SKU-OUT-001",
      sample_en: "SKU-OUT-001",
      description_ko: "상품 SKU (필수)",
      description_en: "Product SKU (required)",
    },
    {
      field: "quantity",
      label_ko: "재고수량",
      label_en: "Quantity",
      required: true,
      type: "number",
      sample_ko: "15",
      sample_en: "15",
      description_ko: "현재 재고량 (필수)",
      description_en: "Current stock (required)",
    },
    {
      field: "min_stock",
      label_ko: "최소재고",
      label_en: "Min Stock",
      required: false,
      type: "number",
      sample_ko: "5",
      sample_en: "5",
      description_ko: "최소 재고 수준",
      description_en: "Minimum stock level",
    },
    {
      field: "max_stock",
      label_ko: "최대재고",
      label_en: "Max Stock",
      required: false,
      type: "number",
      sample_ko: "30",
      sample_en: "30",
      description_ko: "최대 재고 수준",
      description_en: "Maximum stock level",
    },
    {
      field: "location",
      label_ko: "위치",
      label_en: "Location",
      required: false,
      type: "string",
      sample_ko: "A-1-1",
      sample_en: "A-1-1",
      description_ko: "보관 위치",
      description_en: "Storage location",
    },
  ],
};

// CSV 생성
function generateCSV(
  schema: typeof TEMPLATE_SCHEMAS.products,
  language: "ko" | "en",
  includeSamples: boolean
): string {
  const headers = schema.map((f) =>
    language === "ko" ? f.label_ko : f.label_en
  );

  const rows = [headers.join(",")];

  if (includeSamples) {
    // 샘플 데이터 2행 추가
    const sample1 = schema.map((f) =>
      language === "ko" ? f.sample_ko : f.sample_en
    );
    rows.push(sample1.join(","));

    // 두 번째 샘플 (약간 변형)
    const sample2 = schema.map((f, i) => {
      const base = language === "ko" ? f.sample_ko : f.sample_en;
      if (f.type === "number") {
        return String(parseInt(base) + i * 100);
      }
      return base + (i === 0 ? " 2" : "");
    });
    rows.push(sample2.join(","));
  }

  return rows.join("\n");
}

// JSON 생성
function generateJSON(
  schema: typeof TEMPLATE_SCHEMAS.products,
  language: "ko" | "en",
  includeSamples: boolean
): string {
  const template = {
    import_type: "template",
    fields: schema.map((f) => ({
      name: f.field,
      label: language === "ko" ? f.label_ko : f.label_en,
      required: f.required,
      type: f.type,
      description: language === "ko" ? f.description_ko : f.description_en,
    })),
    sample_data: includeSamples
      ? [
          Object.fromEntries(
            schema.map((f) => [
              f.field,
              f.type === "number"
                ? parseInt(language === "ko" ? f.sample_ko : f.sample_en)
                : language === "ko"
                ? f.sample_ko
                : f.sample_en,
            ])
          ),
        ]
      : [],
  };

  return JSON.stringify(template, null, 2);
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      import_type,
      format = "csv",
      include_samples = true,
      language = "ko",
    }: TemplateRequest = await req.json();

    if (!import_type) {
      throw new Error("import_type is required");
    }

    const schema = TEMPLATE_SCHEMAS[import_type];
    if (!schema) {
      throw new Error(`Unknown import type: ${import_type}`);
    }

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case "json":
        content = generateJSON(schema, language, include_samples);
        mimeType = "application/json";
        extension = "json";
        break;

      case "csv":
      default:
        content = generateCSV(schema, language, include_samples);
        mimeType = "text/csv";
        extension = "csv";
        break;
    }

    const filename = `${import_type}_template_${language}.${extension}`;

    console.log(`✅ Template generated: ${filename}`);

    const response: TemplateResponse = {
      success: true,
      content,
      filename,
      mime_type: mimeType,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Template generation error:", errorMessage);

    const response: TemplateResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
