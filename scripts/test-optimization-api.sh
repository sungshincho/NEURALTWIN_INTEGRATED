#!/bin/bash
# 통합 테스트 스크립트: test-optimization-api.sh
#
# 사용법:
#   chmod +x test-optimization-api.sh
#   ./test-optimization-api.sh

# 설정
API_URL="${SUPABASE_URL:-http://localhost:54321}/functions/v1/generate-optimization"
ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key}"

echo "=========================================="
echo "🧪 AI Optimization API 통합 테스트"
echo "=========================================="
echo ""

# 테스트 1: 기본 최적화 요청
echo "📋 테스트 1: 기본 layout 최적화"
echo "------------------------------------------"

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "test-store-001",
    "layoutData": {
      "zones": [
        {"id": "zone-1", "zone_name": "입구", "zone_type": "entrance", "area_sqm": 15},
        {"id": "zone-2", "zone_name": "메인", "zone_type": "main", "area_sqm": 50},
        {"id": "zone-3", "zone_name": "디스플레이", "zone_type": "display", "area_sqm": 30}
      ],
      "fixtures": [
        {"id": "fix-1", "name": "선반1", "zone_id": "zone-2"},
        {"id": "fix-2", "name": "선반2", "zone_id": "zone-3"}
      ]
    },
    "optimizationType": "layout",
    "parameters": {
      "intensity": "medium",
      "enable_function_calling": true
    }
  }')

# 결과 파싱
echo "$RESPONSE" | jq -r '
  "✅ Tool Use 활성화: \(.summary.tool_use_enabled // "N/A")",
  "✅ Tool 호출 횟수: \(.summary.total_tool_calls // 0)",
  "✅ 계산 기반 ROI: \(.summary.calculated_avg_roi_percent // "N/A")%",
  "✅ 일일 예상 이익: ₩\(.summary.calculated_total_daily_profit // 0 | tostring)",
  "✅ 계산 신뢰도: \(.summary.calculation_confidence // "N/A")",
  "",
  "📦 Furniture 변경: \(.furniture_changes | length)건",
  "📦 Product 변경: \(.product_changes | length)건"
'

echo ""

# 테스트 2: calculated_roi 필드 검증
echo "📋 테스트 2: calculated_roi 필드 검증"
echo "------------------------------------------"

echo "$RESPONSE" | jq -r '
  if .product_changes[0].calculated_roi then
    "✅ calculated_roi 필드 존재",
    "   - ROI: \(.product_changes[0].calculated_roi.roi_percent)%",
    "   - 예상 이익: ₩\(.product_changes[0].calculated_roi.expected_profit)",
    "   - 신뢰도: \(.product_changes[0].calculated_roi.confidence)",
    "   - 추천: \(.product_changes[0].calculated_roi.recommendation.action)"
  else
    "❌ calculated_roi 필드 없음 (Tool이 호출되지 않았거나 매핑 실패)"
  end
'

echo ""

# 테스트 3: 일관성 테스트 (동일 요청 3회)
echo "📋 테스트 3: 일관성 테스트 (3회 반복)"
echo "------------------------------------------"

RESULTS=()
for i in 1 2 3; do
  RESULT=$(curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "storeId": "test-store-001",
      "layoutData": {
        "zones": [{"id": "zone-1", "zone_type": "display", "area_sqm": 25}]
      },
      "optimizationType": "layout",
      "parameters": {"intensity": "low"}
    }' | jq -r '.summary.calculated_avg_roi_percent // 0')

  RESULTS+=("$RESULT")
  echo "   실행 $i: ROI = $RESULT%"
done

# 일관성 체크
if [ "${RESULTS[0]}" == "${RESULTS[1]}" ] && [ "${RESULTS[1]}" == "${RESULTS[2]}" ]; then
  echo "✅ 일관성 통과: 모든 결과 동일"
else
  echo "⚠️ 일관성 경고: 결과가 다름 (AI 판단 부분이 다를 수 있음)"
fi

echo ""
echo "=========================================="
echo "✅ 테스트 완료"
echo "=========================================="
