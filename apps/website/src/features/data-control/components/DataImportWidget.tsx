// ============================================================================
// DataImportWidget.tsx
// 데이터 임포트 위젯 - 5단계 워크플로우
// Phase 1: MVP Implementation
// Phase 2: AI 매핑 통합, 검증 강화
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
  X,
  Package,
  Users,
  CreditCard,
  UserCog,
  Boxes,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { toast } from 'sonner';
import { useDarkMode } from '@/hooks/useDarkMode';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';

// ============================================================================
// 3D 스타일 시스템
// ============================================================================

const getText3D = (isDark: boolean) => ({
  title: isDark ? {
    fontWeight: 600, fontSize: '14px', color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 600, fontSize: '14px',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #2a2a2f 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  label: isDark ? {
    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    fontSize: '10px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    fontSize: '10px',
    background: 'linear-gradient(180deg, #6b7280 0%, #9ca3af 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
});

// ============================================================================
// Types
// ============================================================================

type ImportType = 'products' | 'customers' | 'transactions' | 'staff' | 'inventory';
type ImportStep = 'upload' | 'mapping' | 'validate' | 'import' | 'complete';

interface ImportTypeOption {
  type: ImportType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface Session {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  import_type: string;
  target_table: string;
  status: string;
}

interface ParseResult {
  columns: string[];
  preview: Record<string, unknown>[];
  suggested_mapping: Record<string, string | null>;
  total_rows: number;
}

interface ValidationResult {
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  errors: Array<{ row: number; field: string; message: string }>;
  can_import: boolean;
}

interface ImportResult {
  status: string;
  imported_rows: number;
  failed_rows: number;
  progress?: { current: number; total: number; percentage: number };
}

// ============================================================================
// Constants
// ============================================================================

const IMPORT_TYPES: ImportTypeOption[] = [
  {
    type: 'products',
    label: '상품',
    icon: <Package className="w-5 h-5" />,
    description: '상품 마스터 데이터',
  },
  {
    type: 'customers',
    label: '고객',
    icon: <Users className="w-5 h-5" />,
    description: '고객 정보',
  },
  {
    type: 'transactions',
    label: '거래',
    icon: <CreditCard className="w-5 h-5" />,
    description: '거래 내역',
  },
  {
    type: 'staff',
    label: '직원',
    icon: <UserCog className="w-5 h-5" />,
    description: '직원 정보',
  },
  {
    type: 'inventory',
    label: '재고',
    icon: <Boxes className="w-5 h-5" />,
    description: '재고 수준',
  },
];

const STEPS: ImportStep[] = ['upload', 'mapping', 'validate', 'import', 'complete'];

const STEP_LABELS: Record<ImportStep, string> = {
  upload: '파일 선택',
  mapping: '필드 매핑',
  validate: '검증',
  import: '임포트',
  complete: '완료',
};

// 필수 필드 정의
const REQUIRED_FIELDS: Record<ImportType, string[]> = {
  products: ['product_name', 'sku', 'category', 'price'],
  customers: ['customer_name'],
  transactions: ['transaction_date', 'total_amount'],
  staff: ['staff_name', 'staff_code', 'role'],
  inventory: ['product_sku', 'quantity'],
};

// 필드 설명 (툴팁용)
const FIELD_DESCRIPTIONS: Record<string, string> = {
  // Products
  product_name: '상품명 (필수)',
  sku: 'SKU 코드 - 고유 상품 식별자 (필수)',
  category: '상품 카테고리 (필수)',
  price: '판매가격 (필수)',
  cost_price: '원가/입고가',
  stock: '현재 재고 수량',
  display_type: '진열 방식 (hanging:걸이, standing:마네킹, folded:접힘, located:올려짐, boxed:박스, stacked:적층)',
  // Customers
  customer_name: '고객명 (필수)',
  email: '이메일 주소',
  phone: '연락처',
  segment: '고객 세그먼트 (VIP, Regular, New, Dormant)',
  total_purchases: '총 구매 금액',
  last_visit_date: '마지막 방문일',
  // Transactions
  transaction_date: '거래일시 (필수)',
  total_amount: '거래 총액 (필수)',
  payment_method: '결제 수단',
  customer_email: '고객 이메일',
  item_sku: '상품 SKU',
  quantity: '수량',
  unit_price: '단가',
  // Staff
  staff_name: '직원명 (필수)',
  staff_code: '직원 코드 (필수)',
  role: '직무 역할 (필수)',
  department: '부서',
  // Inventory
  product_sku: '상품 SKU (필수)',
  min_stock: '최소 재고 수준',
  max_stock: '최대 재고 수준',
  reorder_point: '재주문점',
  location: '위치/구역',
};

// 규칙 기반 매핑용 컬럼 별칭 (parse-file Edge Function과 동기화)
const MAPPING_RULES: Record<ImportType, Record<string, string[]>> = {
  products: {
    product_name: ['product_name', '상품명', 'name', '제품명', 'item_name', 'title', '품명', '제품', '상품'],
    sku: ['sku', 'SKU', '상품코드', 'product_code', 'item_code', 'code', '코드', '품번'],
    category: ['category', '카테고리', '분류', 'type', '품목', '종류', '대분류'],
    price: ['price', '가격', '판매가', 'selling_price', '정가', '단가', '금액', 'unit_price'],
    stock: ['stock', '재고', 'quantity', '수량', 'inventory', '재고수량', 'qty'],
    cost_price: ['cost_price', '원가', 'cost', '매입가', '입고가', '도매가', '공급가'],
    display_type: ['display_type', '진열타입', '진열방식', 'display', '진열', '전시방식', '배치방식', '슬롯타입', 'slot_type'],
    description: ['description', '설명', '상세설명', '메모', '비고', 'note', '상세', '특이사항'],
    brand: ['brand', '브랜드', '제조사', 'manufacturer'],
  },
  customers: {
    customer_name: ['customer_name', '고객명', 'name', '이름', '성명', '고객', '회원명'],
    email: ['email', '이메일', 'e-mail', 'mail'],
    phone: ['phone', '전화번호', 'tel', '휴대폰', 'mobile', '연락처', '핸드폰', 'phone_number'],
    segment: ['segment', '등급', 'tier', '회원등급', 'grade', '고객등급', 'membership'],
    total_purchases: ['total_purchases', '총구매액', '구매액', '누적구매', 'total_amount'],
    last_visit_date: ['last_visit_date', '마지막방문일', '최근방문', 'last_visit'],
  },
  transactions: {
    transaction_date: ['transaction_date', '거래일', 'date', '날짜', '결제일', '주문일', 'order_date'],
    total_amount: ['total_amount', '총금액', 'amount', '금액', '결제금액', '합계', 'total'],
    payment_method: ['payment_method', '결제수단', 'payment', '결제방법', '지불방법'],
    customer_email: ['customer_email', '고객이메일', 'email', 'customer_id', '고객번호'],
    item_sku: ['item_sku', '상품코드', 'sku', 'product_code', '품번'],
    quantity: ['quantity', '수량', 'qty', '개수'],
    unit_price: ['unit_price', '단가', 'price', '가격'],
  },
  staff: {
    staff_name: ['staff_name', '직원명', 'name', '이름', '성명'],
    staff_code: ['staff_code', '직원코드', 'code', '사번', 'employee_id', 'emp_code'],
    role: ['role', '역할', '직책', 'position', '직위'],
    department: ['department', '부서', 'dept', '팀'],
    email: ['email', '이메일'],
    phone: ['phone', '전화번호', '연락처'],
  },
  inventory: {
    product_sku: ['product_sku', 'sku', '상품코드', 'product_code', '품번'],
    quantity: ['quantity', '수량', '재고', 'stock', 'qty'],
    min_stock: ['min_stock', '최소재고', 'min', '안전재고'],
    max_stock: ['max_stock', '최대재고', 'max'],
    reorder_point: ['reorder_point', '재주문점', '발주점'],
    location: ['location', '위치', '보관위치', '창고'],
  },
};

// 규칙 기반 매핑 함수
function applyRuleBasedMapping(
  columns: string[],
  importType: ImportType,
  currentMapping: Record<string, string>
): Record<string, string> {
  const rules = MAPPING_RULES[importType] || {};
  const newMapping: Record<string, string> = { ...currentMapping };

  for (const [targetField, sourceOptions] of Object.entries(rules)) {
    // 이미 매핑된 필드는 건너뜀
    if (newMapping[targetField]) continue;

    // 컬럼명과 규칙 매칭
    const matchedColumn = columns.find((col) =>
      sourceOptions.some(
        (opt) =>
          col.toLowerCase().replace(/[_\s-]/g, '') ===
            opt.toLowerCase().replace(/[_\s-]/g, '') ||
          col.toLowerCase().includes(opt.toLowerCase())
      )
    );

    if (matchedColumn) {
      newMapping[targetField] = matchedColumn;
    }
  }

  return newMapping;
}

// ============================================================================
// Component
// ============================================================================

interface DataImportWidgetProps {
  onImportComplete?: (result: ImportResult) => void;
  className?: string;
}

export function DataImportWidget({ onImportComplete, className }: DataImportWidgetProps) {
  // State
  const [importType, setImportType] = useState<ImportType>('products');
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [session, setSession] = useState<Session | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiMapping, setIsAiMapping] = useState(false);
  const [importRecordId, setImportRecordId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const isDark = useDarkMode();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  // 다크 모드 감지

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  // ============================================================================
  // Real-time Progress Polling
  // ============================================================================

  useEffect(() => {
    if (!isPolling || !importRecordId) return;

    const pollProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('user_data_imports')
          .select('status, imported_rows, failed_rows, progress, error_details')
          .eq('id', importRecordId)
          .single();

        if (error) {
          console.error('Polling error:', error);
          return;
        }

        if (data) {
          const progress = data.progress as { current: number; total: number; percentage: number } | null;

          setImportResult({
            status: data.status,
            imported_rows: data.imported_rows || 0,
            failed_rows: data.failed_rows || 0,
            progress: progress || {
              current: (data.imported_rows || 0) + (data.failed_rows || 0),
              total: validation?.total_rows || 0,
              percentage: 0,
            },
          });

          // 완료/실패 상태면 polling 중지
          if (['completed', 'partial', 'failed'].includes(data.status)) {
            setIsPolling(false);
            setIsLoading(false);
            setCurrentStep('complete');

            toast({
              title: data.status === 'failed' ? '임포트 실패' : '임포트 완료',
              description: data.status === 'failed'
                ? '임포트 중 오류가 발생했습니다.'
                : `${data.imported_rows}행이 성공적으로 임포트되었습니다.`,
              variant: data.status === 'failed' ? 'destructive' : 'default',
            });
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // 1초마다 polling
    pollingRef.current = setInterval(pollProgress, 1000);

    // 초기 1회 실행
    pollProgress();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isPolling, importRecordId, validation?.total_rows, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // ============================================================================
  // File Upload Handlers
  // ============================================================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  }, [importType]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  }, [importType]);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // 파일 검증
      const validExtensions = ['csv', 'xlsx', 'xls', 'json'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !validExtensions.includes(extension)) {
        throw new Error('지원하지 않는 파일 형식입니다. CSV, Excel, JSON 파일만 가능합니다.');
      }

      // 토큰 가져오기
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      formData.append('import_type', importType);
      if (selectedStore?.id) {
        formData.append('store_id', selectedStore.id);
      }
      if (orgId) {
        formData.append('org_id', orgId);
      }

      // 파일 업로드
      const uploadResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-file`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || '파일 업로드에 실패했습니다.');
      }

      setSession(uploadData.session);
      console.log('File uploaded:', uploadData.session);

      // 파일 파싱 요청
      const parseResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-file`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({ session_id: uploadData.session.id }),
        }
      );

      const parseData = await parseResponse.json();
      if (!parseData.success) {
        throw new Error(parseData.error || '파일 파싱에 실패했습니다.');
      }

      setParseResult(parseData);
      setMapping(parseData.suggested_mapping || {});
      setCurrentStep('mapping');

      toast.success('파일 업로드 완료', { description: `${file.name} (${parseData.total_rows}행)` });
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(message);
      toast.error('업로드 실패', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Validation Handler
  // ============================================================================

  const handleValidate = async () => {
    if (!session || !parseResult) return;

    setIsLoading(true);
    setError(null);

    try {
      // 필수 필드 확인
      const requiredFields = REQUIRED_FIELDS[importType];
      const missingFields = requiredFields.filter((field) => !mapping[field]);

      if (missingFields.length > 0) {
        throw new Error(`필수 필드가 매핑되지 않았습니다: ${missingFields.join(', ')}`);
      }

      // 토큰 가져오기
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // validate-data Edge Function 호출
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({
            session_id: session.id,
            column_mapping: mapping,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '검증에 실패했습니다.');
      }

      const validationResult: ValidationResult = {
        total_rows: data.total_rows,
        valid_rows: data.valid_rows,
        error_rows: data.error_rows,
        errors: data.errors || [],
        can_import: data.can_import,
      };

      setValidation(validationResult);
      setCurrentStep('validate');

      toast.success('검증 완료', { description: `${validationResult.valid_rows}/${validationResult.total_rows} 행 유효` });
    } catch (err) {
      const message = err instanceof Error ? err.message : '검증 실패';
      setError(message);
      toast.error('검증 실패', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Import Handler (with real-time progress polling)
  // ============================================================================

  const handleImport = async () => {
    if (!session || !validation?.can_import) return;

    setIsLoading(true);
    setError(null);
    setCurrentStep('import');
    setImportResult({
      status: 'processing',
      imported_rows: 0,
      failed_rows: 0,
      progress: { current: 0, total: validation.total_rows, percentage: 0 },
    });

    try {
      // 토큰 가져오기
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // execute-import Edge Function 호출 (비동기 - 응답을 기다리지 않음)
      const importPromise = fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({
            session_id: session.id,
            column_mapping: mapping,
            options: {
              upsert: true,
              batch_size: 100,
              skip_errors: true,
            },
          }),
        }
      );

      // 약간 대기 후 import record 조회 (Edge Function이 record를 생성할 시간)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // session_id로 import record 조회
      // @ts-expect-error - Deep type instantiation workaround for Supabase query builder
      const importRecordQuery = supabase
        .from('user_data_imports')
        .select('id')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      const { data: importRecord } = await importRecordQuery;

      if (importRecord?.id) {
        setImportRecordId(importRecord.id);
        setIsPolling(true);
      }

      // Edge Function 응답 처리 (polling이 완료 처리를 담당하지만, 에러 처리용)
      const response = await importPromise;
      const data = await response.json();

      if (!data.success && !isPolling) {
        throw new Error(data.error || '임포트에 실패했습니다.');
      }

      // polling이 아닌 경우 직접 결과 처리
      if (!isPolling) {
        const result: ImportResult = {
          status: data.status,
          imported_rows: data.imported_rows,
          failed_rows: data.failed_rows,
          progress: {
            current: data.imported_rows + data.failed_rows,
            total: validation.total_rows,
            percentage: 100,
          },
        };

        setImportResult(result);
        setCurrentStep('complete');

        toast.success('임포트 완료', { description: `${result.imported_rows}행이 성공적으로 임포트되었습니다.` });

        onImportComplete?.(result);
        setIsLoading(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '임포트 실패';
      setError(message);
      setCurrentStep('validate');
      setIsPolling(false);
      toast.error('임포트 실패', { description: message });
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Reset Handler
  // ============================================================================

  const handleReset = () => {
    setCurrentStep('upload');
    setSession(null);
    setParseResult(null);
    setMapping({});
    setValidation(null);
    setImportResult(null);
    setError(null);
    setImportRecordId(null);
    setIsPolling(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ============================================================================
  // Sample Download Handler (로컬 CSV 템플릿)
  // ============================================================================

  const handleDownloadSample = async (_format: 'csv' | 'json') => {
    const templateCSV: Record<string, string> = {
      products: '상품명,SKU,카테고리,가격,재고,진열방식\n프리미엄 캐시미어 코트,SKU-OUT-001,아우터,450000,15,hanging',
      customers: '고객명,이메일,전화번호,고객등급,총구매액\n김철수,kim@example.com,010-1234-5678,VIP,2500000',
      transactions: '거래일,거래금액,결제수단,고객이메일\n2025-01-10,450000,card,kim@example.com',
      staff: '직원코드,직원명,역할,부서\nEMP001,매니저,manager,영업팀',
      inventory: '상품SKU,재고수량,최소재고,최대재고\nSKU-OUT-001,15,5,30',
    };

    const blob = new Blob([templateCSV[importType]], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType}_template_ko.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('템플릿 다운로드', { description: `${importType}_template_ko.csv 파일이 다운로드되었습니다.` });
  };

  // ============================================================================
  // AI Mapping Handler
  // ============================================================================

  const handleAiMapping = async () => {
    if (!session || !parseResult) return;

    setIsAiMapping(true);
    setError(null);

    try {
      // 토큰 가져오기
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // 샘플 데이터로 AI 매핑 요청
      const sampleData = parseResult.preview.slice(0, 3);

      // auto-map-etl Edge Function 호출
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-map-etl`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({
            source_columns: parseResult.columns,
            sample_data: sampleData,
            target_schema: importType,
            required_fields: REQUIRED_FIELDS[importType],
          }),
        }
      );

      if (!response.ok) {
        // AI 매핑 서비스가 없는 경우 fallback
        throw new Error('AI 매핑 서비스 연결 실패');
      }

      const data = await response.json();

      if (!data.success || !data.mapping) {
        throw new Error(data.error || 'AI 매핑 결과를 가져올 수 없습니다.');
      }

      // AI 매핑 결과 적용
      const aiMapping: Record<string, string> = {};
      for (const [targetField, sourceField] of Object.entries(data.mapping)) {
        if (sourceField && parseResult.columns.includes(sourceField as string)) {
          aiMapping[targetField] = sourceField as string;
        } else if (mapping[targetField]) {
          // 기존 매핑 유지
          aiMapping[targetField] = mapping[targetField];
        }
      }

      // 기존 매핑에 없는 필드도 포함
      for (const [targetField, sourceField] of Object.entries(mapping)) {
        if (!aiMapping[targetField]) {
          aiMapping[targetField] = sourceField;
        }
      }

      setMapping(aiMapping);

      toast.success('AI 매핑 완료', { description: 'AI가 컬럼 매핑을 제안했습니다. 확인 후 필요시 수정하세요.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 매핑 실패';
      console.warn('AI mapping failed, using rule-based mapping:', message);

      // AI 매핑 실패 시 규칙 기반 매핑 적용
      if (parseResult?.columns) {
        const ruleBasedMapping = applyRuleBasedMapping(
          parseResult.columns,
          importType,
          mapping
        );
        setMapping(ruleBasedMapping);

        // 새로 매핑된 필드 수 계산
        const newMappedCount = Object.values(ruleBasedMapping).filter(v => v).length;
        const previousMappedCount = Object.values(mapping).filter(v => v).length;
        const improved = newMappedCount > previousMappedCount;

        toast.success('AI 매핑 사용 불가', { description: improved });
      } else {
        toast.error('AI 매핑 사용 불가', { description: '파일을 다시 업로드해주세요.' });
      }
    } finally {
      setIsAiMapping(false);
    }
  };

  // 매핑 초기화 핸들러
  const handleResetMapping = () => {
    if (parseResult?.suggested_mapping) {
      setMapping(parseResult.suggested_mapping as Record<string, string>);
      toast.success('매핑 초기화', { description: '자동 감지된 매핑으로 초기화되었습니다.' });
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isRequiredField = (field: string) => REQUIRED_FIELDS[importType]?.includes(field);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon3D size={44} dark={isDark}>
              <Upload className="w-5 h-5" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <span style={text3D.label}>Data Import</span>
              <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>데이터 임포트</h3>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-1">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    index < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : index === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  title={STEP_LABELS[step]}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-4 h-0.5 ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 w-6 p-0"
              onClick={() => setError(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 1: File Upload */}
        {currentStep === 'upload' && (
          <div className="space-y-4">
            {/* Import Type Selection */}
            <div className="grid grid-cols-5 gap-2">
              {IMPORT_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setImportType(item.type)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    importType === item.type
                      ? 'bg-primary/10 border-2 border-primary text-primary'
                      : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-center mb-1">{item.icon}</div>
                  <div className="text-sm font-medium">{item.label}</div>
                </button>
              ))}
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              {isLoading ? (
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              ) : (
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              )}
              <p className="text-foreground mb-2">
                {isLoading
                  ? '파일 업로드 중...'
                  : isDragging
                  ? '파일을 놓으세요'
                  : '파일을 드래그하거나 클릭하여 선택'}
              </p>
              <p className="text-sm text-muted-foreground">
                지원 포맷: CSV, Excel (.xlsx, .xls), JSON
              </p>
            </div>

            {/* Sample Download */}
            <div className="flex justify-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadSample('csv')}
                className="text-primary"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                샘플 CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadSample('json')}
                className="text-primary"
              >
                <Download className="w-4 h-4 mr-1" />
                샘플 JSON
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Field Mapping */}
        {currentStep === 'mapping' && parseResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                파일: {session?.file_name}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{parseResult.total_rows}행</Badge>
                {/* AI 매핑 버튼 */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAiMapping}
                        disabled={isAiMapping}
                        className="gap-1"
                      >
                        {isAiMapping ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        AI 매핑
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI가 컬럼을 자동으로 매핑합니다</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {/* 매핑 초기화 버튼 */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetMapping}
                        className="gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>초기 매핑으로 되돌리기</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Mapping Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">시스템 필드</TableHead>
                    <TableHead className="w-1/3">파일 컬럼</TableHead>
                    <TableHead className="w-1/3">샘플 데이터</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(mapping).map(([targetField, sourceField]) => (
                    <TableRow key={targetField}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>
                            {targetField}
                            {isRequiredField(targetField) && (
                              <span className="text-destructive ml-0.5">*</span>
                            )}
                          </span>
                          {FIELD_DESCRIPTIONS[targetField] && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{FIELD_DESCRIPTIONS[targetField]}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={sourceField || '__none__'}
                          onValueChange={(value) =>
                            setMapping({ ...mapping, [targetField]: value === '__none__' ? '' : value })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="선택 안함" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">-- 선택 안함 --</SelectItem>
                            {parseResult.columns.map((col) => (
                              <SelectItem key={col} value={col}>
                                {col}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {sourceField && parseResult.preview[0]?.[sourceField]?.toString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">
                데이터 프리뷰 (처음 5행)
              </h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {parseResult.columns.map((col) => (
                        <TableHead key={col} className="text-xs whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseResult.preview.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {parseResult.columns.map((col) => (
                          <TableCell key={col} className="text-xs">
                            {row[col]?.toString() || ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                이전
              </Button>
              <Button onClick={handleValidate} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-1" />
                )}
                검증하기
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Validation */}
        {currentStep === 'validate' && validation && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{validation.total_rows}</div>
                <div className="text-xs text-muted-foreground">전체 행</div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validation.valid_rows}
                </div>
                <div className="text-xs text-muted-foreground">유효한 행</div>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validation.error_rows}
                </div>
                <div className="text-xs text-muted-foreground">에러 행</div>
              </div>
            </div>

            {/* Errors */}
            {validation.errors.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="text-sm font-medium text-destructive flex items-center gap-1 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  검증 에러 ({validation.errors.length}건)
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {validation.errors.slice(0, 20).map((err, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      행 {err.row}: {err.field} - {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Can Import */}
            {validation.can_import && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-600 text-sm">임포트 가능합니다</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('mapping')}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                이전
              </Button>
              <Button
                onClick={handleImport}
                disabled={!validation.can_import || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-1" />
                )}
                임포트 실행
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Import Progress */}
        {currentStep === 'import' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              <p className="text-foreground">데이터를 임포트하는 중...</p>
            </div>

            {importResult?.progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {importResult.progress.current} / {importResult.progress.total}
                  </span>
                  <span>{importResult.progress.percentage}%</span>
                </div>
                <Progress value={importResult.progress.percentage} />
              </div>
            )}
          </div>
        )}

        {/* Step 5: Complete */}
        {currentStep === 'complete' && importResult && (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <h4 className="text-xl font-semibold">임포트 완료</h4>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.imported_rows}
                </div>
                <div className="text-xs text-muted-foreground">성공</div>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.failed_rows}
                </div>
                <div className="text-xs text-muted-foreground">실패</div>
              </div>
            </div>

            <Button onClick={handleReset} className="mt-4">
              새 임포트
            </Button>
          </div>
        )}
        </div>
      </div>
    </GlassCard>
  );
}

export default DataImportWidget;
