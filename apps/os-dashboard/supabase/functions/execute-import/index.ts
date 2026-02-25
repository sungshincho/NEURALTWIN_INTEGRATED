// ============================================================================
// execute-import Edge Function
// ETL 실행 - 데이터 변환 및 타겟 테이블 저장
// Phase 2: customers, transactions + line_items 지원
// Phase 3: staff, inventory 임포트 강화
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExecuteRequest {
  session_id: string;
  column_mapping?: Record<string, string>;
  options?: {
    upsert?: boolean;
    batch_size?: number;
    skip_errors?: boolean;
  };
}

interface ExecuteResponse {
  success: boolean;
  status?: string;
  imported_rows?: number;
  failed_rows?: number;
  line_items_imported?: number;
  error_details?: Array<{
    batch_start: number;
    batch_end: number;
    error: string;
  }>;
  error?: string;
}

// 임포트 타입별 충돌 컬럼
const CONFLICT_COLUMNS: Record<string, string> = {
  products: "sku",
  customers: "email",
  staff: "staff_code",
  inventory: "product_id",
  transactions: "id",
  line_items: "id",
};

// Transactions + Line Items 동시 임포트 함수
async function importTransactionsWithLineItems(
  supabase: SupabaseClient,
  rawData: Record<string, unknown>[],
  mapping: Record<string, string>,
  storeId: string | null,
  userId: string,
  batchSize: number,
  skipErrors: boolean,
  importRecordId?: string
): Promise<{
  importedRows: number;
  failedRows: number;
  lineItemsImported: number;
  errorDetails: Array<{ batch_start: number; batch_end: number; error: string }>;
}> {
  let importedRows = 0;
  let failedRows = 0;
  let lineItemsImported = 0;
  const errorDetails: Array<{ batch_start: number; batch_end: number; error: string }> = [];

  // 거래를 그룹화 (같은 날짜 + 고객이면 같은 거래)
  const transactionGroups = new Map<string, {
    transaction: Record<string, unknown>;
    lineItems: Array<{ sku: string; quantity: number; unit_price: number }>;
  }>();

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const transformed = transformRow(row, mapping, "transactions", storeId, userId);

    // 그룹 키 생성 (날짜 + 고객 이메일 또는 ID)
    const dateStr = transformed.transaction_date?.toString().split("T")[0] || "";
    const customerKey = (transformed._customer_email || transformed.id)?.toString() || "";
    const groupKey = `${dateStr}_${customerKey}_${i}`; // 각 행을 개별 거래로 처리

    if (!transactionGroups.has(groupKey)) {
      const lineItem = transformed._line_item as { sku: string; quantity: number; unit_price: number } | undefined;
      delete transformed._line_item;
      delete transformed._customer_email;

      transactionGroups.set(groupKey, {
        transaction: transformed,
        lineItems: lineItem ? [lineItem] : [],
      });
    } else {
      const group = transactionGroups.get(groupKey)!;
      const lineItem = transformed._line_item as { sku: string; quantity: number; unit_price: number } | undefined;
      if (lineItem) {
        group.lineItems.push(lineItem);
        // 총액 업데이트
        const currentAmount = Number(group.transaction.total_amount) || 0;
        group.transaction.total_amount = currentAmount + (lineItem.quantity * lineItem.unit_price);
      }
    }
  }

  console.log(`📦 Grouped into ${transactionGroups.size} transactions`);

  // 배치로 처리
  const groups = Array.from(transactionGroups.values());

  for (let i = 0; i < groups.length; i += batchSize) {
    const batch = groups.slice(i, i + batchSize);

    try {
      // 1. Transactions 삽입
      const transactions = batch.map((g) => g.transaction);
      const { error: txError } = await supabase
        .from("transactions")
        .upsert(transactions, { onConflict: "id", ignoreDuplicates: false });

      if (txError) {
        throw txError;
      }

      importedRows += transactions.length;

      // 2. Line Items 삽입 (있는 경우)
      const lineItems: Record<string, unknown>[] = [];

      for (const group of batch) {
        const transactionId = group.transaction.id;

        for (const item of group.lineItems) {
          if (item.sku) {
            // SKU로 product_id 조회
            const { data: product } = await supabase
              .from("products")
              .select("id")
              .eq("sku", item.sku)
              .single();

            lineItems.push({
              id: crypto.randomUUID(),
              transaction_id: transactionId,
              product_id: product?.id || null,
              sku: item.sku,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.quantity * item.unit_price,
              user_id: userId,
              store_id: storeId,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      if (lineItems.length > 0) {
        const { error: liError } = await supabase
          .from("line_items")
          .upsert(lineItems, { onConflict: "id", ignoreDuplicates: false });

        if (liError) {
          console.error("Line items error:", liError);
          // line_items 에러는 경고로 처리, 트랜잭션은 성공으로 유지
        } else {
          lineItemsImported += lineItems.length;
        }
      }

      console.log(
        `✅ Batch ${Math.floor(i / batchSize) + 1}: ${transactions.length} transactions, ${lineItems.length} line items`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`❌ Batch error at ${i}:`, errorMessage);

      if (skipErrors) {
        failedRows += batch.length;
        errorDetails.push({
          batch_start: i,
          batch_end: i + batch.length,
          error: errorMessage,
        });
      } else {
        throw err;
      }
    }

    // 진행 상황 업데이트
    if (importRecordId) {
      await supabase
        .from("user_data_imports")
        .update({
          imported_rows: importedRows,
          failed_rows: failedRows,
          progress: {
            current: i + batch.length,
            total: groups.length,
            percentage: Math.round(((i + batch.length) / groups.length) * 100),
          },
        })
        .eq("id", importRecordId);
    }
  }

  return { importedRows, failedRows, lineItemsImported, errorDetails };
}

// Inventory 임포트 함수 (SKU → product_id 조회)
async function importInventoryLevels(
  supabase: SupabaseClient,
  rawData: Record<string, unknown>[],
  mapping: Record<string, string>,
  storeId: string | null,
  userId: string,
  orgId: string | null,
  batchSize: number,
  skipErrors: boolean,
  importRecordId?: string
): Promise<{
  importedRows: number;
  failedRows: number;
  errorDetails: Array<{ batch_start: number; batch_end: number; error: string }>;
}> {
  let importedRows = 0;
  let failedRows = 0;
  const errorDetails: Array<{ batch_start: number; batch_end: number; error: string }> = [];

  // SKU 캐시 구축
  const skuCache = new Map<string, string>();
  const allSkus: string[] = [];

  // 모든 SKU 수집
  for (const row of rawData) {
    const transformed = transformRow(row, mapping, "inventory", storeId, userId);
    const sku = transformed._product_sku as string;
    if (sku && !allSkus.includes(sku)) {
      allSkus.push(sku);
    }
  }

  // 대량 SKU 조회
  if (allSkus.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, sku")
      .in("sku", allSkus);

    if (products) {
      for (const p of products) {
        skuCache.set(p.sku, p.id);
      }
    }
    console.log(`📦 SKU cache built: ${skuCache.size} products found`);
  }

  // 배치로 처리
  for (let i = 0; i < rawData.length; i += batchSize) {
    const batch = rawData.slice(i, i + batchSize);
    const inventoryRecords: Record<string, unknown>[] = [];

    for (const row of batch) {
      const transformed = transformRow(row, mapping, "inventory", storeId, userId);
      const sku = transformed._product_sku as string;

      // SKU로 product_id 찾기
      const productId = sku ? skuCache.get(sku) : null;

      if (!productId && sku) {
        console.warn(`⚠️ Product not found for SKU: ${sku}`);
        if (!skipErrors) {
          failedRows++;
          continue;
        }
      }

      delete transformed._product_sku;

      if (productId) {
        transformed.product_id = productId;
        inventoryRecords.push({
          ...transformed,
          org_id: orgId,
          last_updated: new Date().toISOString(),
        });
      }
    }

    if (inventoryRecords.length > 0) {
      try {
        const { error: upsertError } = await supabase
          .from("inventory_levels")
          .upsert(inventoryRecords, {
            onConflict: "product_id",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          throw upsertError;
        }

        importedRows += inventoryRecords.length;
        console.log(
          `✅ Inventory batch ${Math.floor(i / batchSize) + 1}: ${inventoryRecords.length} records`
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`❌ Inventory batch error at ${i}:`, errorMessage);

        if (skipErrors) {
          failedRows += inventoryRecords.length;
          errorDetails.push({
            batch_start: i,
            batch_end: i + batch.length,
            error: errorMessage,
          });
        } else {
          throw err;
        }
      }
    } else {
      failedRows += batch.length;
    }

    // 진행 상황 업데이트
    if (importRecordId) {
      await supabase
        .from("user_data_imports")
        .update({
          imported_rows: importedRows,
          failed_rows: failedRows,
          progress: {
            current: i + batch.length,
            total: rawData.length,
            percentage: Math.round(((i + batch.length) / rawData.length) * 100),
          },
        })
        .eq("id", importRecordId);
    }
  }

  return { importedRows, failedRows, errorDetails };
}

// 데이터 변환 함수
function transformRow(
  row: Record<string, unknown>,
  mapping: Record<string, string>,
  importType: string,
  storeId: string | null,
  userId: string
): Record<string, unknown> {
  const transformed: Record<string, unknown> = {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // store_id가 있으면 추가
  if (storeId) {
    transformed.store_id = storeId;
  }

  // 매핑에 따라 필드 변환
  for (const [targetField, sourceField] of Object.entries(mapping)) {
    if (sourceField && row[sourceField] !== undefined) {
      transformed[targetField] = row[sourceField];
    }
  }

  // 타입별 추가 변환
  switch (importType) {
    case "products":
      transformed.id = transformed.id || crypto.randomUUID();
      transformed.user_id = userId;
      if (transformed.price) {
        transformed.selling_price = Number(transformed.price) || 0;
        delete transformed.price;
      }
      if (transformed.stock !== undefined) {
        transformed.stock = Number(transformed.stock) || 0;
      }
      // sku 필드 매핑
      if (transformed.sku === undefined && transformed.product_code) {
        transformed.sku = transformed.product_code;
        delete transformed.product_code;
      }
      // product_name -> name
      if (transformed.product_name && !transformed.name) {
        transformed.name = transformed.product_name;
      }
      break;

    case "customers":
      transformed.id = transformed.id || crypto.randomUUID();
      transformed.user_id = userId;
      if (transformed.total_purchases) {
        transformed.total_purchases = Number(transformed.total_purchases) || 0;
      }
      // customer_name -> name
      if (transformed.customer_name && !transformed.name) {
        transformed.name = transformed.customer_name;
      }
      break;

    case "staff":
      transformed.id = transformed.id || crypto.randomUUID();
      transformed.user_id = userId;
      // staff_name 필드 유지 (테이블에 staff_name 컬럼 있음)
      if (!transformed.staff_name && transformed.name) {
        transformed.staff_name = transformed.name;
      }
      // 숫자 필드 변환
      if (transformed.hourly_rate !== undefined) {
        transformed.hourly_rate = Number(transformed.hourly_rate) || 0;
      }
      // 날짜 필드 변환
      if (transformed.hire_date) {
        transformed.hire_date = new Date(transformed.hire_date as string).toISOString().split('T')[0];
      }
      // 기본값 설정
      transformed.is_active = transformed.is_active !== false;
      break;

    case "transactions":
      transformed.id = transformed.id || crypto.randomUUID();
      transformed.user_id = userId;
      if (transformed.total_amount) {
        transformed.total_amount = Number(transformed.total_amount) || 0;
      }
      if (transformed.transaction_date) {
        transformed.transaction_date = new Date(
          transformed.transaction_date as string
        ).toISOString();
      }
      // customer_email로 customer_id 조회용 저장
      if (transformed.customer_email) {
        transformed._customer_email = transformed.customer_email;
      }
      // line_items 데이터 임시 저장
      if (transformed.item_sku || transformed.quantity || transformed.unit_price) {
        transformed._line_item = {
          sku: transformed.item_sku,
          quantity: Number(transformed.quantity) || 1,
          unit_price: Number(transformed.unit_price) || 0,
        };
        delete transformed.item_sku;
        delete transformed.quantity;
        delete transformed.unit_price;
      }
      break;

    case "inventory":
      transformed.id = transformed.id || crypto.randomUUID();
      transformed.user_id = userId;
      // 숫자 필드 변환
      if (transformed.quantity !== undefined) {
        transformed.current_stock = Number(transformed.quantity) || 0;
        delete transformed.quantity;
      }
      if (transformed.current_stock !== undefined) {
        transformed.current_stock = Number(transformed.current_stock) || 0;
      }
      if (transformed.min_stock !== undefined) {
        transformed.minimum_stock = Number(transformed.min_stock) || 0;
        delete transformed.min_stock;
      }
      if (transformed.minimum_stock !== undefined) {
        transformed.minimum_stock = Number(transformed.minimum_stock) || 0;
      }
      if (transformed.max_stock !== undefined) {
        transformed.optimal_stock = Number(transformed.max_stock) || 0;
        delete transformed.max_stock;
      }
      if (transformed.optimal_stock !== undefined) {
        transformed.optimal_stock = Number(transformed.optimal_stock) || 0;
      }
      if (transformed.weekly_demand !== undefined) {
        transformed.weekly_demand = Number(transformed.weekly_demand) || 0;
      }
      // product_sku -> _product_sku (SKU 조회용)
      if (transformed.product_sku) {
        transformed._product_sku = transformed.product_sku;
        delete transformed.product_sku;
      }
      break;
  }

  return transformed;
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
    const { session_id, column_mapping, options }: ExecuteRequest =
      await req.json();

    if (!session_id) {
      throw new Error("session_id is required");
    }

    const batchSize = options?.batch_size || 100;
    const skipErrors = options?.skip_errors ?? true;

    console.log(`🚀 Executing import for session: ${session_id}`);

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

    // 매핑 결정 (요청에서 받은 것 또는 세션에 저장된 것)
    const finalMapping = column_mapping || session.column_mapping || {};

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

    // 세션 상태 업데이트
    await supabase
      .from("upload_sessions")
      .update({
        status: "importing",
        column_mapping: finalMapping,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    // user_data_imports 기록 생성
    const { data: importRecord, error: importRecordError } = await supabase
      .from("user_data_imports")
      .insert({
        session_id,
        user_id: user.id,
        org_id: session.org_id,
        store_id: session.store_id,
        import_type: session.import_type,
        target_table: session.target_table,
        file_name: session.file_name,
        total_rows: rawData.length,
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (importRecordError) {
      console.error("Import record creation error:", importRecordError);
    }

    // 배치 임포트 실행
    const targetTable = session.target_table;
    const importType = session.import_type;
    const conflictColumn = CONFLICT_COLUMNS[importType] || "id";

    let importedRows = 0;
    let failedRows = 0;
    const errorDetails: Array<{
      batch_start: number;
      batch_end: number;
      error: string;
    }> = [];

    console.log(
      `📊 Processing ${rawData.length} rows in batches of ${batchSize}`
    );

    let lineItemsImported = 0;

    // transactions 임포트의 경우 특별 처리
    if (importType === "transactions") {
      const result = await importTransactionsWithLineItems(
        supabase,
        rawData,
        finalMapping,
        session.store_id,
        user.id,
        batchSize,
        skipErrors,
        importRecord?.id
      );
      importedRows = result.importedRows;
      failedRows = result.failedRows;
      lineItemsImported = result.lineItemsImported;
      errorDetails.push(...result.errorDetails);
    } else if (importType === "inventory") {
      // inventory 임포트의 경우 SKU → product_id 조회
      const result = await importInventoryLevels(
        supabase,
        rawData,
        finalMapping,
        session.store_id,
        user.id,
        session.org_id,
        batchSize,
        skipErrors,
        importRecord?.id
      );
      importedRows = result.importedRows;
      failedRows = result.failedRows;
      errorDetails.push(...result.errorDetails);
    } else {
      // 일반 임포트 처리
      for (let i = 0; i < rawData.length; i += batchSize) {
        const batch = rawData.slice(i, i + batchSize);
        const transformedBatch = batch.map((row) =>
          transformRow(row, finalMapping, importType, session.store_id, user.id)
        );

        try {
          // 타겟 테이블에 upsert
          const { error: upsertError } = await supabase
            .from(targetTable)
            .upsert(transformedBatch, {
              onConflict: conflictColumn,
              ignoreDuplicates: false,
            });

          if (upsertError) {
            throw upsertError;
          }

          importedRows += transformedBatch.length;
          console.log(
            `✅ Batch ${Math.floor(i / batchSize) + 1}: ${transformedBatch.length} rows imported`
          );
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`❌ Batch error at ${i}:`, errorMessage);

          if (skipErrors) {
            failedRows += batch.length;
            errorDetails.push({
              batch_start: i,
              batch_end: i + batch.length,
              error: errorMessage,
            });
          } else {
            throw err;
          }
        }

        // 진행 상황 업데이트
        if (importRecord) {
          await supabase
            .from("user_data_imports")
            .update({
              imported_rows: importedRows,
              failed_rows: failedRows,
              progress: {
                current: i + batch.length,
                total: rawData.length,
                percentage: Math.round(((i + batch.length) / rawData.length) * 100),
              },
            })
            .eq("id", importRecord.id);
        }
      }
    }

    // 최종 상태 결정
    const finalStatus =
      failedRows === 0
        ? "completed"
        : failedRows < rawData.length
        ? "partial"
        : "failed";

    // 임포트 기록 완료 업데이트
    if (importRecord) {
      await supabase
        .from("user_data_imports")
        .update({
          status: finalStatus,
          imported_rows: importedRows,
          failed_rows: failedRows,
          error_details: errorDetails.length > 0 ? errorDetails : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", importRecord.id);
    }

    // 세션 완료 업데이트
    await supabase
      .from("upload_sessions")
      .update({
        status: finalStatus,
        completed_files: finalStatus === "completed" ? 1 : 0,
        failed_files: finalStatus === "failed" ? 1 : 0,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    // raw_imports 상태 업데이트
    await supabase
      .from("raw_imports")
      .update({
        status: finalStatus,
        processed_at: new Date().toISOString(),
      })
      .eq("id", rawImport.id);

    console.log(
      `✅ Import complete: ${importedRows} imported, ${failedRows} failed, ${lineItemsImported} line items`
    );

    const response: ExecuteResponse = {
      success: true,
      status: finalStatus,
      imported_rows: importedRows,
      failed_rows: failedRows,
      line_items_imported: lineItemsImported > 0 ? lineItemsImported : undefined,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Execute import error:", errorMessage);

    const response: ExecuteResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
