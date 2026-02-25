// ============================================================================
// rollback-import Edge Function
// 임포트 롤백 - Phase 3
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RollbackRequest {
  import_id: string;
  session_id?: string;
}

interface RollbackResponse {
  success: boolean;
  rolled_back_rows?: number;
  error?: string;
}

// 임포트 타입별 테이블 매핑
const TYPE_TABLE_MAP: Record<string, string> = {
  products: "products",
  customers: "customers",
  transactions: "transactions",
  staff: "staff",
  inventory: "inventory_levels",
};

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
    const { import_id, session_id }: RollbackRequest = await req.json();

    if (!import_id) {
      throw new Error("import_id is required");
    }

    console.log(`🔄 Rolling back import: ${import_id}`);

    // 임포트 기록 조회
    const { data: importRecord, error: importError } = await supabase
      .from("user_data_imports")
      .select("*")
      .eq("id", import_id)
      .single();

    if (importError || !importRecord) {
      throw new Error("Import record not found");
    }

    // 권한 확인
    if (importRecord.user_id !== user.id) {
      throw new Error("Access denied");
    }

    // 이미 롤백된 경우
    if (importRecord.status === "rolled_back") {
      throw new Error("이미 롤백된 임포트입니다.");
    }

    // 롤백 가능한 상태인지 확인
    if (!["completed", "partial"].includes(importRecord.status)) {
      throw new Error("롤백할 수 없는 상태입니다.");
    }

    const targetTable = TYPE_TABLE_MAP[importRecord.import_type];
    if (!targetTable) {
      throw new Error(`Unknown import type: ${importRecord.import_type}`);
    }

    let rolledBackRows = 0;

    // 롤백 전략 1: session_id 기반 삭제 (raw_imports에서 원본 ID 추적)
    const sessionIdToUse = session_id || importRecord.session_id;

    if (sessionIdToUse) {
      // raw_imports에서 원본 데이터 조회
      const { data: rawImport } = await supabase
        .from("raw_imports")
        .select("id, raw_data")
        .eq("session_id", sessionIdToUse)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (rawImport?.raw_data) {
        // 원본 데이터에서 ID 추출
        const rawData = rawImport.raw_data as Record<string, unknown>[];

        // 임포트 시간 기반으로 삭제
        // created_at이 임포트 시작 시간 이후인 레코드 삭제
        const importStartTime = importRecord.started_at || importRecord.created_at;

        const { data: deletedData, error: deleteError } = await supabase
          .from(targetTable)
          .delete()
          .eq("user_id", user.id)
          .gte("created_at", importStartTime)
          .select("id");

        if (deleteError) {
          console.error("Delete error:", deleteError);
          throw new Error(`롤백 실패: ${deleteError.message}`);
        }

        rolledBackRows = deletedData?.length || 0;
        console.log(`✅ Rolled back ${rolledBackRows} rows from ${targetTable}`);

        // transactions의 경우 line_items도 삭제
        if (importRecord.import_type === "transactions") {
          const { data: lineItemsDeleted } = await supabase
            .from("line_items")
            .delete()
            .eq("user_id", user.id)
            .gte("created_at", importStartTime)
            .select("id");

          if (lineItemsDeleted) {
            console.log(`✅ Rolled back ${lineItemsDeleted.length} line items`);
          }
        }
      }
    }

    // 임포트 기록 상태 업데이트
    await supabase
      .from("user_data_imports")
      .update({
        status: "rolled_back",
        rolled_back_at: new Date().toISOString(),
        rolled_back_rows: rolledBackRows,
      })
      .eq("id", import_id);

    // 세션 상태 업데이트
    if (sessionIdToUse) {
      await supabase
        .from("upload_sessions")
        .update({
          status: "rolled_back",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionIdToUse);

      // raw_imports 상태 업데이트
      await supabase
        .from("raw_imports")
        .update({
          status: "rolled_back",
        })
        .eq("session_id", sessionIdToUse);
    }

    console.log(`✅ Rollback complete: ${rolledBackRows} rows`);

    const response: RollbackResponse = {
      success: true,
      rolled_back_rows: rolledBackRows,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Rollback error:", errorMessage);

    const response: RollbackResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
