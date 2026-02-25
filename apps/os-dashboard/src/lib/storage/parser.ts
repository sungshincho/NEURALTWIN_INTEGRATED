/**
 * 파일 파싱 유틸리티
 */

/**
 * CSV 텍스트 파싱
 */
export function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      // 타입 변환 시도
      row[header] = convertValue(value);
    });
    
    data.push(row);
  }
  
  return data;
}

/**
 * 값 타입 자동 변환
 */
function convertValue(value: string): string | number | boolean | null {
  if (!value || value === '' || value === 'null' || value === 'NULL') {
    return null;
  }
  
  // Boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Number
  if (!isNaN(Number(value)) && value !== '') {
    return Number(value);
  }
  
  // String (따옴표 제거)
  return value.replace(/^["']|["']$/g, '');
}

/**
 * JSON 파일 파싱
 */
export function parseJSON(jsonText: string): any {
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('JSON parse error:', error);
    throw new Error('Invalid JSON format');
  }
}

/**
 * 데이터 유효성 검증
 */
export function validateData(data: any[], requiredFields?: string[]): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  
  if (requiredFields && requiredFields.length > 0) {
    // 첫 행에 필수 필드가 있는지 확인
    const firstRow = data[0];
    return requiredFields.every(field => field in firstRow);
  }
  
  return true;
}

/**
 * 데이터 정제 (null, undefined 제거)
 */
export function cleanData(data: any[]): any[] {
  return data.map(row => {
    const cleaned: any = {};
    Object.entries(row).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  });
}

/**
 * 데이터 타입 추론
 */
export function inferDataType(fileName: string): string {
  const name = fileName.replace(/\.(csv|xlsx|xls|json)$/i, '').toLowerCase();
  
  const typeMap: Record<string, string> = {
    'customer': 'customers',
    'product': 'products',
    'purchase': 'purchases',
    'visit': 'visits',
    'staff': 'staff',
    'brand': 'brands',
    'store': 'stores',
    'wifi_sensor': 'wifi_sensors',
    'wifi_tracking': 'wifi_tracking',
    'social_state': 'social_states',
  };
  
  // 부분 매칭
  for (const [key, value] of Object.entries(typeMap)) {
    if (name.includes(key)) {
      return value;
    }
  }
  
  return name;
}
