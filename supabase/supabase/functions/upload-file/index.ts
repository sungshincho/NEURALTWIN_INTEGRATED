// ============================================================================
// upload-file Edge Function
// 파일 업로드 및 임포트 세션 생성
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UploadResponse {
  success: boolean;
  session?: {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
    import_type: string;
    target_table: string;
    status: string;
  };
  error?: string;
}

// 임포트 타입 -> 타겟 테이블 매핑
function getTargetTable(importType: string): string {
  const mapping: Record<string, string> = {
    products: "products",
    customers: "customers",
    transactions: "transactions",
    staff: "staff",
    inventory: "inventory_levels",
    layout: "zones_dim,furniture",
    "3d_models": "product_models",
  };
  return mapping[importType] || importType;
}

// 파일 확장자 추출
function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

// 지원 파일 타입 검증
function isValidFileType(extension: string): boolean {
  const validTypes = [
    "csv",
    "xlsx",
    "xls",
    "json",
    "tsv",
    "glb",
    "gltf",
    "obj",
    "fbx",
  ];
  return validTypes.includes(extension);
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Supabase 클라이언트 생성
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

    // FormData 파싱
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const importType = formData.get("import_type") as string;
    const storeId = formData.get("store_id") as string | null;
    const orgId = formData.get("org_id") as string | null;

    if (!file) {
      throw new Error("No file provided");
    }

    if (!importType) {
      throw new Error("Import type is required");
    }

    // 파일 타입 검증
    const fileExtension = getFileExtension(file.name);
    if (!isValidFileType(fileExtension)) {
      throw new Error(
        `Unsupported file type: ${fileExtension}. Supported: csv, xlsx, xls, json, tsv, glb, gltf, obj, fbx`
      );
    }

    console.log(`📁 Uploading file: ${file.name} (${file.size} bytes)`);
    console.log(`📋 Import type: ${importType}`);

    // 파일 경로 생성 (store별 폴더)
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = storeId
      ? `imports/${storeId}/${timestamp}_${sanitizedFileName}`
      : `imports/global/${user.id}/${timestamp}_${sanitizedFileName}`;

    // Storage에 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("user-imports")
      .upload(filePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    console.log(`✅ File uploaded to: ${uploadData.path}`);

    // 임포트 세션 생성
    const targetTable = getTargetTable(importType);

    const { data: session, error: sessionError } = await supabase
      .from("upload_sessions")
      .insert({
        user_id: user.id,
        store_id: storeId || null,
        org_id: orgId || null,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: fileExtension,
        import_type: importType,
        target_table: targetTable,
        status: "uploaded",
        total_files: 1,
        completed_files: 0,
        failed_files: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      // 세션 생성 실패 시 업로드된 파일 삭제
      await supabase.storage.from("user-imports").remove([filePath]);
      throw new Error(`Session creation failed: ${sessionError.message}`);
    }

    console.log(`✅ Session created: ${session.id}`);

    const response: UploadResponse = {
      success: true,
      session: {
        id: session.id,
        file_name: session.file_name,
        file_path: session.file_path,
        file_size: session.file_size,
        file_type: session.file_type,
        import_type: session.import_type,
        target_table: session.target_table,
        status: session.status,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Upload error:", errorMessage);

    const response: UploadResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
