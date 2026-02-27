// ============================================================================
// Phase 7: Field Mapping Editor Component
// ============================================================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Trash2,
  ArrowRight,
  Wand2,
  Info,
} from 'lucide-react';
import { FieldMapping, TransformType, TRANSFORM_TYPES } from '../types';

// ============================================================================
// 대상 테이블별 권장 필드
// ============================================================================

const TARGET_TABLE_FIELDS: Record<string, { field: string; label: string; type: TransformType }[]> = {
  transactions: [
    { field: 'external_id', label: '외부 ID (필수)', type: 'to_string' },
    { field: 'order_number', label: '주문번호', type: 'to_string' },
    { field: 'transaction_date', label: '거래 날짜', type: 'to_date' },
    { field: 'transaction_time', label: '거래 시간', type: 'to_timestamp' },
    { field: 'total_amount', label: '총액', type: 'to_decimal' },
    { field: 'subtotal_amount', label: '소계', type: 'to_decimal' },
    { field: 'tax_amount', label: '세금', type: 'to_decimal' },
    { field: 'discount_amount', label: '할인', type: 'to_decimal' },
    { field: 'status', label: '상태', type: 'to_string' },
    { field: 'payment_status', label: '결제 상태', type: 'to_string' },
    { field: 'payment_method', label: '결제 방법', type: 'to_string' },
    { field: 'customer_external_id', label: '고객 ID', type: 'to_string' },
    { field: 'currency', label: '통화', type: 'to_string' },
    { field: 'notes', label: '메모', type: 'to_string' },
  ],
  customers: [
    { field: 'external_id', label: '외부 ID (필수)', type: 'to_string' },
    { field: 'email', label: '이메일', type: 'to_lowercase' },
    { field: 'name', label: '이름 (풀네임)', type: 'to_string' },
    { field: 'first_name', label: '이름', type: 'to_string' },
    { field: 'last_name', label: '성', type: 'to_string' },
    { field: 'phone_number', label: '전화번호', type: 'to_string' },
    { field: 'company', label: '회사명', type: 'to_string' },
    { field: 'address', label: '주소', type: 'to_string' },
    { field: 'city', label: '도시', type: 'to_string' },
    { field: 'country', label: '국가', type: 'to_string' },
    { field: 'registered_date', label: '가입일', type: 'to_date' },
    { field: 'lifetime_value', label: 'LTV', type: 'to_decimal' },
    { field: 'total_visits', label: '총 방문수', type: 'to_integer' },
    { field: 'segment', label: '세그먼트', type: 'to_string' },
    { field: 'tags', label: '태그', type: 'to_string' },
    { field: 'notes', label: '메모', type: 'to_string' },
  ],
  products: [
    { field: 'external_id', label: '외부 ID (필수)', type: 'to_string' },
    { field: 'sku', label: 'SKU', type: 'to_string' },
    { field: 'name', label: '상품명', type: 'to_string' },
    { field: 'description', label: '설명', type: 'to_string' },
    { field: 'price', label: '가격', type: 'to_decimal' },
    { field: 'cost', label: '원가', type: 'to_decimal' },
    { field: 'category_name', label: '카테고리', type: 'to_string' },
    { field: 'brand_name', label: '브랜드', type: 'to_string' },
    { field: 'stock_count', label: '재고', type: 'to_integer' },
    { field: 'is_active', label: '활성', type: 'to_boolean' },
  ],
  line_items: [
    { field: 'external_id', label: '외부 ID (필수)', type: 'to_string' },
    { field: 'transaction_external_id', label: '거래 ID', type: 'to_string' },
    { field: 'product_external_id', label: '상품 ID', type: 'to_string' },
    { field: 'quantity', label: '수량', type: 'to_integer' },
    { field: 'unit_price', label: '단가', type: 'to_decimal' },
    { field: 'total_price', label: '합계', type: 'to_decimal' },
    { field: 'discount_amount', label: '할인', type: 'to_decimal' },
  ],
  inventory: [
    { field: 'external_id', label: '외부 ID (필수)', type: 'to_string' },
    { field: 'product_external_id', label: '상품 ID', type: 'to_string' },
    { field: 'sku', label: 'SKU', type: 'to_string' },
    { field: 'quantity', label: '수량', type: 'to_integer' },
    { field: 'location', label: '위치', type: 'to_string' },
    { field: 'last_updated', label: '마지막 업데이트', type: 'to_timestamp' },
  ],
  visits: [
    { field: 'external_id', label: '외부 ID (필수)', type: 'to_string' },
    { field: 'visitor_id', label: '방문자 ID', type: 'to_string' },
    { field: 'visit_date', label: '방문 날짜', type: 'to_date' },
    { field: 'visit_time', label: '방문 시간', type: 'to_timestamp' },
    { field: 'duration_seconds', label: '체류 시간(초)', type: 'to_integer' },
    { field: 'page_views', label: '페이지뷰', type: 'to_integer' },
    { field: 'source', label: '유입 경로', type: 'to_string' },
  ],
};

// ============================================================================
// Props
// ============================================================================

interface FieldMappingEditorProps {
  fieldMappings: FieldMapping[];
  onChange: (mappings: FieldMapping[]) => void;
  targetTable?: string;
  sampleData?: any[];
}

// ============================================================================
// Field Mapping Editor Component
// ============================================================================

export function FieldMappingEditor({
  fieldMappings,
  onChange,
  targetTable,
  sampleData,
}: FieldMappingEditorProps) {
  const [newMapping, setNewMapping] = useState<Partial<FieldMapping>>({
    source: '',
    target: '',
    transform: 'direct',
    required: false,
  });

  // 소스 필드 자동 감지 (샘플 데이터에서)
  const detectedFields = sampleData && sampleData.length > 0
    ? Object.keys(sampleData[0])
    : [];

  // 대상 테이블의 권장 필드
  const suggestedFields = targetTable
    ? TARGET_TABLE_FIELDS[targetTable] || []
    : [];

  // 매핑 추가
  const addMapping = () => {
    if (newMapping.source && newMapping.target) {
      onChange([
        ...fieldMappings,
        {
          source: newMapping.source,
          target: newMapping.target,
          transform: newMapping.transform || 'direct',
          required: newMapping.required || false,
        },
      ]);
      setNewMapping({ source: '', target: '', transform: 'direct', required: false });
    }
  };

  // 매핑 삭제
  const removeMapping = (index: number) => {
    onChange(fieldMappings.filter((_, i) => i !== index));
  };

  // 매핑 수정
  const updateMapping = (index: number, updates: Partial<FieldMapping>) => {
    onChange(
      fieldMappings.map((m, i) => (i === index ? { ...m, ...updates } : m))
    );
  };

  // 자동 매핑 (이름 기반)
  const autoMap = () => {
    if (!detectedFields.length || !suggestedFields.length) return;

    const autoMappings: FieldMapping[] = [];

    for (const suggested of suggestedFields) {
      // 정확히 일치하는 필드 찾기
      let sourceField = detectedFields.find(
        (f) => f.toLowerCase() === suggested.field.toLowerCase()
      );

      // 부분 일치 찾기
      if (!sourceField) {
        sourceField = detectedFields.find(
          (f) =>
            f.toLowerCase().includes(suggested.field.toLowerCase()) ||
            suggested.field.toLowerCase().includes(f.toLowerCase())
        );
      }

      // 일반적인 이름 매핑
      if (!sourceField) {
        const commonMappings: Record<string, string[]> = {
          external_id: ['id', 'guid', 'order_id', 'customer_id', 'product_id'],
          transaction_date: ['date', 'created_at', 'order_date', 'business_date'],
          total_amount: ['total', 'amount', 'total_price', 'grand_total'],
          email: ['email', 'email_address', 'customer_email'],
          name: ['name', 'title', 'product_name', 'item_name'],
        };

        const aliases = commonMappings[suggested.field];
        if (aliases) {
          sourceField = detectedFields.find((f) =>
            aliases.some((alias) => f.toLowerCase().includes(alias))
          );
        }
      }

      if (sourceField) {
        // 이미 매핑된 필드는 건너뛰기
        if (!fieldMappings.some((m) => m.target === suggested.field)) {
          autoMappings.push({
            source: sourceField,
            target: suggested.field,
            transform: suggested.type,
            required: suggested.field === 'external_id',
          });
        }
      }
    }

    if (autoMappings.length > 0) {
      onChange([...fieldMappings, ...autoMappings]);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">필드 매핑</CardTitle>
              <CardDescription className="text-xs">
                API 응답 필드를 데이터베이스 컬럼에 매핑합니다.
              </CardDescription>
            </div>
            {detectedFields.length > 0 && suggestedFields.length > 0 && (
              <Button variant="outline" size="sm" onClick={autoMap}>
                <Wand2 className="h-4 w-4 mr-2" />
                자동 매핑
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* 기존 매핑 목록 */}
          {fieldMappings.length > 0 && (
            <Table className="mb-4">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">소스 필드</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[200px]">대상 필드</TableHead>
                  <TableHead className="w-[150px]">변환</TableHead>
                  <TableHead className="w-[80px]">필수</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fieldMappings.map((mapping, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {mapping.source}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {mapping.target}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mapping.transform || 'direct'}
                        onValueChange={(value) =>
                          updateMapping(index, { transform: value as TransformType })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRANSFORM_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={mapping.required}
                        onCheckedChange={(checked) =>
                          updateMapping(index, { required: Boolean(checked) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeMapping(index)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* 새 매핑 추가 폼 */}
          <div className="flex items-end gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">소스 필드</Label>
              {detectedFields.length > 0 ? (
                <Select
                  value={newMapping.source}
                  onValueChange={(value) =>
                    setNewMapping((prev) => ({ ...prev, source: value }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="API 필드 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {detectedFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={newMapping.source || ''}
                  onChange={(e) =>
                    setNewMapping((prev) => ({ ...prev, source: e.target.value }))
                  }
                  placeholder="예: order_id"
                  className="h-9"
                />
              )}
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground mb-2" />

            <div className="flex-1 space-y-1">
              <Label className="text-xs">대상 필드</Label>
              {suggestedFields.length > 0 ? (
                <Select
                  value={newMapping.target}
                  onValueChange={(value) =>
                    setNewMapping((prev) => ({ ...prev, target: value }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="DB 컬럼 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {suggestedFields.map((field) => (
                      <SelectItem key={field.field} value={field.field}>
                        {field.label} ({field.field})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={newMapping.target || ''}
                  onChange={(e) =>
                    setNewMapping((prev) => ({ ...prev, target: e.target.value }))
                  }
                  placeholder="예: external_id"
                  className="h-9"
                />
              )}
            </div>

            <div className="w-[120px] space-y-1">
              <Label className="text-xs">변환</Label>
              <Select
                value={newMapping.transform || 'direct'}
                onValueChange={(value) =>
                  setNewMapping((prev) => ({ ...prev, transform: value as TransformType }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFORM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={addMapping}
              disabled={!newMapping.source || !newMapping.target}
              size="sm"
              className="h-9"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* 힌트 */}
          {fieldMappings.length === 0 && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">필드 매핑이 필요합니다</p>
                <p className="text-xs mt-1">
                  API 응답의 필드를 데이터베이스 컬럼에 매핑해야 데이터가 올바르게 저장됩니다.
                  {detectedFields.length > 0 && ' "자동 매핑" 버튼을 사용하면 이름 기반으로 자동 매핑됩니다.'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 감지된 필드 표시 */}
      {detectedFields.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">감지된 API 필드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {detectedFields.map((field) => (
                <Badge key={field} variant="outline" className="text-xs">
                  {field}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FieldMappingEditor;
