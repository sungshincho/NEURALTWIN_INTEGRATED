// ============================================================================
// submit-contact Edge Function
// Contact Form 제출 처리 및 Zapier Webhook 연동
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Zapier Webhook URL
const ZAPIER_WEBHOOK_URL =
  "https://hooks.zapier.com/hooks/catch/26235556/ul2ehrb/";

interface ContactFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  stores?: number;
  features?: string[];
  timeline?: string;
  message?: string;
  privacy_consent?: boolean;
  marketing_consent?: boolean;
}

interface ContactSubmissionResponse {
  success: boolean;
  id?: string;
  error?: string;
  // 디버깅용 필드
  details?: string;
  hint?: string;
  code?: string;
}

// 이메일 유효성 검사
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 입력값 검증
function validateInput(data: ContactFormData): string | null {
  if (!data.name || data.name.trim().length === 0) {
    return "이름은 필수입니다.";
  }
  if (!data.company || data.company.trim().length === 0) {
    return "회사명은 필수입니다.";
  }
  if (!data.email || !isValidEmail(data.email)) {
    return "유효한 이메일 주소가 필요합니다.";
  }
  if (!data.phone || data.phone.trim().length === 0) {
    return "전화번호는 필수입니다.";
  }
  return null;
}

// Zapier Webhook 호출 (fire-and-forget 방식)
async function callZapierWebhook(data: Record<string, unknown>): Promise<void> {
  try {
    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log("✅ Zapier webhook called successfully");
    } else {
      console.error(
        `⚠️ Zapier webhook returned status: ${response.status}`
      );
    }
  } catch (error) {
    // Zapier 호출 실패는 무시 (DB 저장 성공이 우선)
    console.error("⚠️ Zapier webhook call failed:", error);
  }
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

    // POST 요청만 허용
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Method not allowed",
        } as ContactSubmissionResponse),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 요청 본문 파싱
    const formData: ContactFormData = await req.json();

    console.log("📬 Contact form submission received");

    // 입력값 검증
    const validationError = validateInput(formData);
    if (validationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validationError,
        } as ContactSubmissionResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // INSERT할 데이터 준비
    const submissionData = {
      name: formData.name.trim(),
      company: formData.company.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      // TEMPORARILY HIDDEN fields - use null if not provided
      stores: formData.stores || null,
      features: formData.features || null,
      timeline: formData.timeline || null,
      message: formData.message?.trim() || null,
    };

    console.log("📝 Attempting to insert data:", JSON.stringify(submissionData));

    // contact_submissions 테이블에 저장
    const { data: insertedData, error: insertError } = await supabase
      .from("contact_submissions")
      .insert(submissionData)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Supabase INSERT error:", insertError);
      console.error("❌ Error message:", insertError.message);
      console.error("❌ Error details:", insertError.details);
      console.error("❌ Error hint:", insertError.hint);
      console.error("❌ Error code:", insertError.code);
      console.error("❌ Attempted data:", JSON.stringify(submissionData));

      // 상세 에러 정보 반환
      return new Response(
        JSON.stringify({
          success: false,
          error: insertError.message || "데이터 저장 중 오류가 발생했습니다.",
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        } as ContactSubmissionResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Contact submission saved with ID: ${insertedData.id}`);

    // Zapier Webhook 호출 (비동기, 실패해도 응답에 영향 없음)
    callZapierWebhook({
      id: insertedData.id,
      name: insertedData.name,
      company: insertedData.company,
      email: insertedData.email,
      phone: insertedData.phone,
      stores: insertedData.stores,
      features: insertedData.features,
      timeline: insertedData.timeline,
      message: insertedData.message || "",
      created_at: insertedData.created_at,
    });

    // 성공 응답
    const response: ContactSubmissionResponse = {
      success: true,
      id: insertedData.id,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    console.error("❌ Contact submission error:", errorMessage);

    const response: ContactSubmissionResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
