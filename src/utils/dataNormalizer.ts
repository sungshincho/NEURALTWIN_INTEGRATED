import { SCHEMA_MAP, DataSchema, ColumnSchema } from './dataSchemas';
import { ENTERPRISE_SCHEMA_MAP, EnterpriseDataSchema, EnterpriseColumnSchema, COMMON_KEY_COLUMNS, SCD2_COLUMNS } from './enterpriseSchemas';

export interface NormalizedData {
  schema_type: string;
  schema_category: 'fact' | 'dimension' | 'bridge' | 'other';
  original_columns: string[];
  mapped_data: any[];
  metadata: {
    total_records: number;
    normalized_at: string;
    column_mappings: Record<string, string>;
    quality_score: number;
    validation_errors?: string[];
    detected_keys?: string[]; // 감지된 키 컬럼들
  };
}

/**
 * 컬럼명에서 의미 있는 키워드 추출
 */
function extractKeywords(columnName: string): string[] {
  return columnName
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, ' ')
    .split(' ')
    .filter(word => word.length > 1);
}

/**
 * 한글-영문 동의어 매핑 (확장형)
 */
const KOREAN_ENGLISH_SYNONYMS: Record<string, string[]> = {
  '고객': ['customer', 'user', 'member', 'client'],
  '회원': ['member', 'customer', 'user'],
  '상품': ['product', 'item', 'goods', 'merchandise'],
  '제품': ['product', 'item'],
  '가격': ['price', 'cost', 'amount'],
  '금액': ['amount', 'price', 'total'],
  '수량': ['quantity', 'qty', 'count', 'amount'],
  '날짜': ['date', 'day', 'time'],
  '시간': ['time', 'datetime', 'timestamp'],
  '매장': ['store', 'shop', 'branch', 'location'],
  '지점': ['branch', 'store', 'location'],
  '판매': ['sales', 'sell', 'transaction'],
  '매출': ['sales', 'revenue'],
  '할인': ['discount', 'sale'],
  '브랜드': ['brand', 'maker'],
  '카테고리': ['category', 'type', 'class'],
  '분류': ['category', 'classification'],
  '코드': ['code', 'id', 'number'],
  '번호': ['number', 'id', 'code'],
  '이름': ['name', 'title'],
  '명칭': ['name', 'title'],
  '거래': ['transaction', 'trade', 'deal'],
  '주문': ['order', 'purchase'],
  '결제': ['payment', 'pay'],
  '총액': ['total', 'sum', 'amount'],
  '단가': ['unit_price', 'price'],
  '구매': ['purchase', 'buy'],
  '세금': ['tax', 'vat'],
  '부가세': ['tax', 'vat'],
};

/**
 * 두 문자열의 유사도 계산 (한글-영문 동의어 지원 + 퍼지 매칭)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) => s.toLowerCase()
    .replace(/[_\-\s]/g, '')
    .trim();
  
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  // 완전 일치
  if (s1 === s2) return 1.0;
  
  // 포함 관계 체크
  if (s1.includes(s2) || s2.includes(s1)) return 0.95;
  
  // 한글-영문 동의어 체크
  for (const [korean, englishWords] of Object.entries(KOREAN_ENGLISH_SYNONYMS)) {
    const hasKorean = s1.includes(korean) || s2.includes(korean);
    const hasEnglish = englishWords.some(eng => s1.includes(eng) || s2.includes(eng));
    
    if (hasKorean && hasEnglish) {
      return 0.90; // 높은 신뢰도
    }
  }
  
  // 키워드 기반 매칭 (개선)
  const keywords1 = extractKeywords(str1);
  const keywords2 = extractKeywords(str2);
  
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  
  let matches = 0;
  let maxMatches = 0;
  
  keywords1.forEach(k1 => {
    keywords2.forEach(k2 => {
      maxMatches++;
      
      // 정확한 매칭
      if (k1 === k2) {
        matches += 3;
      }
      // 한쪽이 다른 쪽을 포함
      else if (k1.includes(k2) || k2.includes(k1)) {
        matches += 2;
      }
      // 레벤슈타인 거리 기반 유사도 (철자 오류 대응)
      else {
        const distance = levenshteinDistance(k1, k2);
        const maxLen = Math.max(k1.length, k2.length);
        if (maxLen > 0 && distance / maxLen < 0.3) { // 70% 이상 유사
          matches += 1;
        }
      }
    });
  });
  
  return Math.min(matches / Math.max(maxMatches, 1) * 1.5, 1.0);
}

/**
 * 레벤슈타인 거리 계산 (문자열 유사도 측정)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // 삭제
          dp[i][j - 1] + 1,    // 삽입
          dp[i - 1][j - 1] + 1 // 치환
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * 데이터 타입 자동 감지
 */
export function detectDataType(dataType: string): 'sales' | 'traffic_sensor' | 'traffic' | 'product' | 'customer' | 'inventory' | 'brand' | 'store' | 'staff' | 'other' {
  const typeKeywords: Record<string, string[]> = {
    sales: ['매출', '판매', '거래', 'sales', 'transaction', '주문', 'order', '결제', 'payment'],
    traffic_sensor: ['센서', 'sensor', '동선', 'tracking', 'path', 'zone', 'movement', 'beacon'],
    traffic: ['동선', 'traffic', '방문', 'visit', 'path', '이동', 'movement', 'person'],
    product: ['상품', 'product', '제품', '품목', 'item', 'sku'],
    customer: ['고객', 'customer', '회원', 'member', '유저', 'user'],
    inventory: ['재고', 'inventory', 'stock', '입고', '출고'],
    brand: ['브랜드', 'brand', '제조사', 'manufacturer', 'maker'],
    store: ['매장', 'store', '지점', 'branch', 'shop', 'location'],
    staff: ['직원', 'staff', '사원', 'employee', '근무자', 'worker', 'personnel'],
  };
  
  const typeLower = dataType.toLowerCase();
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(keyword => typeLower.includes(keyword))) {
      return type as any;
    }
  }
  
  return 'other';
}

/**
 * 컬럼을 스키마에 자동 매핑 (개선된 알고리즘)
 */
function autoMapColumns(
  rawColumns: string[],
  schema: DataSchema
): Record<string, string> {
  const mappings: Record<string, string> = {};
  const usedRawColumns = new Set<string>(); // 중복 매핑 방지
  
  // 각 스키마 컬럼에 대해 가장 유사한 원본 컬럼 찾기
  schema.columns.forEach(schemaCol => {
    let bestMatch = '';
    let bestScore = 0;
    
    rawColumns.forEach(rawCol => {
      if (usedRawColumns.has(rawCol)) return; // 이미 사용된 컬럼 스킵
      
      // 여러 검색어를 개별적으로 비교하여 최고 점수 선택
      const searchTerms = [
        schemaCol.name,
        schemaCol.description,
        ...(schemaCol.examples || [])
      ];
      
      let maxScore = 0;
      searchTerms.forEach(term => {
        const score = calculateSimilarity(rawCol, term);
        maxScore = Math.max(maxScore, score);
      });
      
      // 완전 일치하는 예시가 있으면 가중치 추가
      const hasExactExample = (schemaCol.examples || []).some(ex => 
        rawCol.toLowerCase().includes(ex.toLowerCase()) || 
        ex.toLowerCase().includes(rawCol.toLowerCase())
      );
      if (hasExactExample) {
        maxScore = Math.min(maxScore + 0.3, 1.0);
      }
      
      if (maxScore > bestScore && maxScore > 0.15) { // 최소 15% 유사도로 더욱 완화
        bestScore = maxScore;
        bestMatch = rawCol;
      }
    });
    
    if (bestMatch) {
      mappings[schemaCol.name] = bestMatch;
      usedRawColumns.add(bestMatch);
    }
  });
  
  return mappings;
}

/**
 * 값을 지정된 타입으로 변환
 */
function convertValue(value: any, targetType: ColumnSchema['type']): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  try {
    switch (targetType) {
      case 'string':
        return String(value);
      
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
      
      case 'date':
        // Excel serial date 처리 (45819 같은 숫자)
        if (typeof value === 'number' && value > 1000) {
          const excelEpoch = new Date(1900, 0, 1);
          const date = new Date(excelEpoch.getTime() + (value - 2) * 86400000);
          return date.toISOString();
        }
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString();
      
      case 'boolean':
        if (typeof value === 'boolean') return value;
        return ['true', 'yes', '1', 'y'].includes(String(value).toLowerCase());
      
      case 'array':
        if (Array.isArray(value)) return value;
        // "zones[0]", "zones[1]" 형식 처리
        return [value];
      
      case 'object':
        if (typeof value === 'object') return value;
        try {
          return JSON.parse(value);
        } catch {
          return { raw: value };
        }
      
      default:
        return value;
    }
  } catch (e) {
    console.warn(`Failed to convert value ${value} to ${targetType}:`, e);
    return null;
  }
}

/**
 * 배열 형식의 데이터 병합 (zones[0], zones[1] -> zones: [])
 */
function mergeArrayColumns(rawData: any[]): any[] {
  return rawData.map(row => {
    const merged: any = {};
    const arrayFields: Record<string, any[]> = {};
    
    Object.entries(row).forEach(([key, value]) => {
      // "field[index]" 패턴 감지
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, fieldName, index] = arrayMatch;
        if (!arrayFields[fieldName]) {
          arrayFields[fieldName] = [];
        }
        arrayFields[fieldName][parseInt(index)] = value;
      } else {
        merged[key] = value;
      }
    });
    
    // 배열 필드 추가
    Object.entries(arrayFields).forEach(([fieldName, values]) => {
      merged[fieldName] = values.filter(v => v !== undefined);
    });
    
    return merged;
  });
}

/**
 * 원본 데이터를 표준 스키마로 정규화 (엔터프라이즈 버전)
 */
export function normalizeData(
  rawData: any[],
  dataType: string
): NormalizedData {
  if (!rawData || rawData.length === 0) {
    return {
      schema_type: dataType,
      schema_category: 'other',
      original_columns: [],
      mapped_data: [],
      metadata: {
        total_records: 0,
        normalized_at: new Date().toISOString(),
        column_mappings: {},
        quality_score: 0,
      }
    };
  }
  
  // 배열 컬럼 병합
  const mergedData = mergeArrayColumns(rawData);
  
  // 자동 타입 감지
  const detectedType = detectDataType(dataType);
  
  // 엔터프라이즈 스키마 우선 사용
  const enterpriseSchema = ENTERPRISE_SCHEMA_MAP[detectedType];
  
  if (enterpriseSchema) {
    return normalizeWithEnterpriseSchema(mergedData, detectedType, enterpriseSchema);
  }
  
  // 폴백: 기본 스키마 사용
  const schema = SCHEMA_MAP[detectedType];
  
  if (!schema) {
    // 스키마가 없으면 원본 그대로 반환
    return {
      schema_type: dataType,
      schema_category: 'other',
      original_columns: Object.keys(mergedData[0] || {}),
      mapped_data: mergedData,
      metadata: {
        total_records: mergedData.length,
        normalized_at: new Date().toISOString(),
        column_mappings: {},
        quality_score: 0.5,
      }
    };
  }
  
  // 기존 로직 (하위 호환성 유지)
  const rawColumns = Object.keys(mergedData[0] || {});
  const columnMappings = autoMapColumns(rawColumns, schema);
  
  const mappedData = mergedData.map((row, index) => {
    const normalized: any = {};
    
    schema.columns.forEach(schemaCol => {
      const rawColName = columnMappings[schemaCol.name];
      if (rawColName && row[rawColName] !== undefined) {
        normalized[schemaCol.name] = convertValue(row[rawColName], schemaCol.type);
      } else if (schemaCol.required) {
        normalized[schemaCol.name] = null;
      }
    });
    
    // 자동 계산 필드
    if (detectedType === 'sales') {
      if (!normalized.transaction_id) {
        normalized.transaction_id = `TXN_${Date.now()}_${index}`;
      }
      if (!normalized.total_amount && normalized.price && normalized.quantity) {
        normalized.total_amount = normalized.price * normalized.quantity;
      }
      if (normalized.discount && normalized.discount < 0) {
        normalized.discount = Math.abs(normalized.discount);
      }
    }
    
    normalized._original = row;
    return normalized;
  });
  
  const requiredFields = schema.columns.filter(c => c.required);
  const optionalImportantFields = schema.columns.filter(c => !c.required && 
    ['timestamp', 'product_category', 'total_amount', 'discount'].includes(c.name)
  );
  
  const totalImportantFields = [...requiredFields, ...optionalImportantFields];
  const mappedImportantFields = totalImportantFields.filter(field => 
    columnMappings[field.name]
  ).length;
  
  const qualityScore = totalImportantFields.length > 0 
    ? mappedImportantFields / totalImportantFields.length 
    : 0.5;
  
  return {
    schema_type: detectedType,
    schema_category: 'other',
    original_columns: rawColumns,
    mapped_data: mappedData,
    metadata: {
      total_records: mappedData.length,
      normalized_at: new Date().toISOString(),
      column_mappings: columnMappings,
      quality_score: qualityScore,
    }
  };
}

/**
 * 엔터프라이즈 스키마 기반 정규화
 */
function normalizeWithEnterpriseSchema(
  rawData: any[],
  dataType: string,
  schema: EnterpriseDataSchema
): NormalizedData {
  const rawColumns = Object.keys(rawData[0] || {});
  const columnMappings = autoMapEnterpriseColumns(rawColumns, schema);
  const validationErrors: string[] = [];
  const detectedKeys: string[] = [];
  
  const mappedData = rawData.map((row, index) => {
    const normalized: any = {};
    
    schema.columns.forEach(schemaCol => {
      const rawColName = columnMappings[schemaCol.name];
      
      if (rawColName && row[rawColName] !== undefined) {
        const value = convertEnterpriseValue(row[rawColName], schemaCol);
        normalized[schemaCol.name] = value;
        
        // 키 컬럼 감지
        if (schemaCol.isKey && value && !detectedKeys.includes(schemaCol.name)) {
          detectedKeys.push(schemaCol.name);
        }
        
        // 제약조건 검증
        if (schemaCol.constraints) {
          schemaCol.constraints.forEach(constraint => {
            if (!validateConstraint(value, constraint, schemaCol.name)) {
              validationErrors.push(`Row ${index}: ${schemaCol.name} violates ${constraint}`);
            }
          });
        }
      } else if (schemaCol.required) {
        normalized[schemaCol.name] = null;
        validationErrors.push(`Row ${index}: Missing required field ${schemaCol.name}`);
      }
    });
    
    // 자동 계산 필드 (매출 데이터)
    if (dataType === 'sales') {
      if (!normalized.transaction_id) {
        normalized.transaction_id = `TXN_${Date.now()}_${index}`;
      }
      if (!normalized.event_date && normalized.event_ts) {
        normalized.event_date = new Date(normalized.event_ts).toISOString().split('T')[0];
      }
      // net_revenue 검증
      if (normalized.qty && normalized.unit_price) {
        const calculated = normalized.qty * normalized.unit_price - 
                          (normalized.line_discount || 0) + 
                          (normalized.line_tax || 0);
        if (normalized.net_revenue && Math.abs(normalized.net_revenue - calculated) > 0.01) {
          validationErrors.push(`Row ${index}: net_revenue mismatch (expected: ${calculated}, got: ${normalized.net_revenue})`);
        }
        if (!normalized.net_revenue) {
          normalized.net_revenue = calculated;
        }
      }
    }
    
    // SCD2 필드 자동 추가 (dimension 타입)
    if (schema.category === 'dimension') {
      if (normalized.is_current === undefined) normalized.is_current = true;
      if (!normalized.valid_from) normalized.valid_from = new Date().toISOString();
      if (!normalized.valid_to) normalized.valid_to = null;
    }
    
    // 파티션 필드 자동 추가
    if (schema.partitionBy && !normalized[schema.partitionBy]) {
      if (normalized.event_ts) {
        normalized[schema.partitionBy] = new Date(normalized.event_ts).toISOString().split('T')[0];
      }
    }
    
    normalized._original = row;
    return normalized;
  });
  
  // 품질 점수 계산
  const requiredFields = schema.columns.filter(c => c.required);
  const keyFields = schema.columns.filter(c => c.isKey);
  const allImportantFields = [...requiredFields, ...keyFields];
  const uniqueImportantFields = [...new Set(allImportantFields.map(f => f.name))];
  
  const mappedImportantCount = uniqueImportantFields.filter(fieldName => 
    columnMappings[fieldName]
  ).length;
  
  let qualityScore = uniqueImportantFields.length > 0 
    ? mappedImportantCount / uniqueImportantFields.length 
    : 0.5;
  
  // 검증 에러가 많으면 점수 감점
  if (validationErrors.length > 0) {
    const errorRate = validationErrors.length / (rawData.length * schema.columns.length);
    qualityScore = qualityScore * (1 - errorRate);
  }
  
  return {
    schema_type: dataType,
    schema_category: schema.category,
    original_columns: rawColumns,
    mapped_data: mappedData,
    metadata: {
      total_records: mappedData.length,
      normalized_at: new Date().toISOString(),
      column_mappings: columnMappings,
      quality_score: Math.max(0, qualityScore),
      validation_errors: validationErrors.length > 10 
        ? [...validationErrors.slice(0, 10), `... and ${validationErrors.length - 10} more errors`]
        : validationErrors,
      detected_keys: detectedKeys,
    }
  };
}

/**
 * 엔터프라이즈 컬럼 자동 매핑
 */
function autoMapEnterpriseColumns(
  rawColumns: string[],
  schema: EnterpriseDataSchema
): Record<string, string> {
  const mappings: Record<string, string> = {};
  const usedRawColumns = new Set<string>();
  
  schema.columns.forEach(schemaCol => {
    let bestMatch = '';
    let bestScore = 0;
    
    rawColumns.forEach(rawCol => {
      if (usedRawColumns.has(rawCol)) return;
      
      const searchTerms = [
        schemaCol.name,
        schemaCol.description,
        ...(schemaCol.examples || [])
      ];
      
      let maxScore = 0;
      searchTerms.forEach(term => {
        const score = calculateSimilarity(rawCol, term);
        maxScore = Math.max(maxScore, score);
      });
      
      // 키 컬럼이면 가중치 추가
      if (schemaCol.isKey && COMMON_KEY_COLUMNS.includes(schemaCol.name)) {
        const hasKeyword = COMMON_KEY_COLUMNS.some(key => 
          rawCol.toLowerCase().includes(key.toLowerCase().replace('_', ''))
        );
        if (hasKeyword) maxScore = Math.min(maxScore + 0.2, 1.0);
      }
      
      const hasExactExample = (schemaCol.examples || []).some(ex => 
        rawCol.toLowerCase().includes(ex.toLowerCase()) || 
        ex.toLowerCase().includes(rawCol.toLowerCase())
      );
      if (hasExactExample) {
        maxScore = Math.min(maxScore + 0.3, 1.0);
      }
      
      if (maxScore > bestScore && maxScore > 0.2) {
        bestScore = maxScore;
        bestMatch = rawCol;
      }
    });
    
    if (bestMatch) {
      mappings[schemaCol.name] = bestMatch;
      usedRawColumns.add(bestMatch);
    }
  });
  
  return mappings;
}

/**
 * 엔터프라이즈 값 변환 (ENUM, 제약조건 포함)
 */
function convertEnterpriseValue(value: any, schemaCol: EnterpriseColumnSchema): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // ENUM 검증
  if (schemaCol.enum && schemaCol.type === 'enum') {
    const strValue = String(value).toLowerCase();
    const matched = schemaCol.enum.find(e => 
      e.toLowerCase() === strValue || 
      strValue.includes(e.toLowerCase())
    );
    return matched || null;
  }
  
  // 기본 타입 변환
  return convertValue(value, schemaCol.type as any);
}

/**
 * 제약조건 검증
 */
function validateConstraint(value: any, constraint: string, fieldName: string): boolean {
  if (value === null || value === undefined) return true;
  
  if (constraint === 'NOT NULL') {
    return value !== null && value !== undefined;
  }
  
  if (constraint.startsWith('>=')) {
    const threshold = parseFloat(constraint.substring(2));
    return Number(value) >= threshold;
  }
  
  if (constraint.startsWith('>')) {
    const threshold = parseFloat(constraint.substring(1));
    return Number(value) > threshold;
  }
  
  return true;
}

/**
 * 여러 데이터셋을 정규화하고 관계 추출
 */
export function normalizeMultipleDatasets(
  datasets: Array<{ raw_data: any[]; data_type: string }>
): Record<string, NormalizedData> {
  const normalized: Record<string, NormalizedData> = {};
  
  datasets.forEach((dataset, index) => {
    const key = `dataset_${index}_${dataset.data_type}`;
    normalized[key] = normalizeData(dataset.raw_data, dataset.data_type);
  });
  
  return normalized;
}
