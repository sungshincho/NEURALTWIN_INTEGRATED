#!/usr/bin/env bash
# ============================================================================
# smoke-test-ef.sh
# 모든 Edge Function에 OPTIONS preflight 요청을 보내 200/204 응답 확인
# Usage: ./scripts/smoke-test-ef.sh [SUPABASE_URL]
# ============================================================================
set -euo pipefail

SUPABASE_URL="${1:-${SUPABASE_URL:-http://localhost:54321}}"
FUNCTIONS_DIR="$(cd "$(dirname "$0")/../supabase/supabase/functions" && pwd)"

passed=0
failed=0
skipped=0

for dir in "$FUNCTIONS_DIR"/*/; do
  fn_name=$(basename "$dir")

  # _shared 디렉토리 제외
  if [[ "$fn_name" == _shared ]]; then
    continue
  fi

  # index.ts 없으면 스킵
  if [[ ! -f "$dir/index.ts" ]]; then
    ((skipped++))
    continue
  fi

  url="$SUPABASE_URL/functions/v1/$fn_name"
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS \
    -H "Origin: https://test.vercel.app" \
    -H "Access-Control-Request-Method: POST" \
    "$url" 2>/dev/null || echo "000")

  if [[ "$status" == "200" || "$status" == "204" ]]; then
    echo "  PASS  $fn_name ($status)"
    ((passed++))
  else
    echo "  FAIL  $fn_name ($status)"
    ((failed++))
  fi
done

echo ""
echo "Results: $passed passed, $failed failed, $skipped skipped"

if [[ $failed -gt 0 ]]; then
  exit 1
fi
