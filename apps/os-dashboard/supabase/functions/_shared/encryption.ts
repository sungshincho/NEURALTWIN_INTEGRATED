// ============================================================================
// Phase 9: API Credential Encryption Utility
// ============================================================================
// AES-256-GCM 기반 암호화/복호화 유틸리티
// API 자격 증명 보안 저장에 사용
// ============================================================================

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 128; // bits

/**
 * 환경 변수에서 암호화 키 조회
 */
function getEncryptionKey(): string {
  const key = Deno.env.get('API_ENCRYPTION_KEY');
  if (!key) {
    throw new Error('API_ENCRYPTION_KEY environment variable is not set');
  }
  return key;
}

/**
 * Base64 문자열을 Uint8Array로 변환
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Uint8Array를 Base64 문자열로 변환
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binaryString = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}

/**
 * 암호화 키 생성 (Base64 인코딩된 문자열에서)
 */
async function deriveKey(keyString: string): Promise<CryptoKey> {
  // 키 문자열을 SHA-256으로 해시하여 256비트 키 생성
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);

  return crypto.subtle.importKey('raw', hashBuffer, { name: ALGORITHM }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * 랜덤 IV 생성
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * 데이터 암호화
 * @param plaintext 암호화할 평문
 * @returns Base64 인코딩된 암호문 (iv:ciphertext 형식)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const keyString = getEncryptionKey();
  const key = await deriveKey(keyString);
  const iv = generateIV();

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv as unknown as BufferSource,
      tagLength: TAG_LENGTH,
    },
    key,
    data
  );

  // IV와 암호문을 결합 (iv:ciphertext)
  const ivBase64 = uint8ArrayToBase64(iv);
  const ciphertextBase64 = uint8ArrayToBase64(new Uint8Array(ciphertext));

  return `${ivBase64}:${ciphertextBase64}`;
}

/**
 * 데이터 복호화
 * @param encryptedData Base64 인코딩된 암호문 (iv:ciphertext 형식)
 * @returns 복호화된 평문
 */
export async function decrypt(encryptedData: string): Promise<string> {
  const keyString = getEncryptionKey();
  const key = await deriveKey(keyString);

  const [ivBase64, ciphertextBase64] = encryptedData.split(':');
  if (!ivBase64 || !ciphertextBase64) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = base64ToUint8Array(ivBase64);
  const ciphertext = base64ToUint8Array(ciphertextBase64);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv as unknown as BufferSource,
      tagLength: TAG_LENGTH,
    },
    key,
    ciphertext as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * JSON 객체 암호화
 * @param obj 암호화할 객체
 * @returns Base64 인코딩된 암호문
 */
export async function encryptJson<T>(obj: T): Promise<string> {
  const json = JSON.stringify(obj);
  return encrypt(json);
}

/**
 * JSON 객체 복호화
 * @param encryptedData Base64 인코딩된 암호문
 * @returns 복호화된 객체
 */
export async function decryptJson<T>(encryptedData: string): Promise<T> {
  const json = await decrypt(encryptedData);
  return JSON.parse(json) as T;
}

/**
 * API 자격 증명 암호화
 * 민감한 필드만 선택적으로 암호화
 */
export interface AuthCredentials {
  api_key?: string;
  token?: string;
  username?: string;
  password?: string;
  access_token?: string;
  refresh_token?: string;
  client_id?: string;
  client_secret?: string;
  [key: string]: string | undefined;
}

export interface EncryptedAuthCredentials {
  encrypted: true;
  data: string;
  encrypted_at: string;
  version: number;
}

const SENSITIVE_FIELDS = [
  'api_key',
  'token',
  'password',
  'access_token',
  'refresh_token',
  'client_secret',
];

/**
 * 인증 자격 증명 암호화
 * @param credentials 암호화할 자격 증명
 * @returns 암호화된 자격 증명 래퍼
 */
export async function encryptCredentials(
  credentials: AuthCredentials
): Promise<EncryptedAuthCredentials> {
  // 민감한 필드만 추출
  const sensitiveData: Record<string, string> = {};
  const publicData: Record<string, string> = {};

  for (const [key, value] of Object.entries(credentials)) {
    if (value === undefined) continue;

    if (SENSITIVE_FIELDS.includes(key)) {
      sensitiveData[key] = value;
    } else {
      publicData[key] = value;
    }
  }

  // 민감한 데이터 암호화
  const encryptedSensitive = await encryptJson(sensitiveData);

  return {
    encrypted: true,
    data: JSON.stringify({
      public: publicData,
      sensitive: encryptedSensitive,
    }),
    encrypted_at: new Date().toISOString(),
    version: 1,
  };
}

/**
 * 인증 자격 증명 복호화
 * @param encryptedCredentials 암호화된 자격 증명
 * @returns 복호화된 자격 증명
 */
export async function decryptCredentials(
  encryptedCredentials: EncryptedAuthCredentials
): Promise<AuthCredentials> {
  if (!encryptedCredentials.encrypted) {
    throw new Error('Data is not encrypted');
  }

  const wrapper = JSON.parse(encryptedCredentials.data);
  const publicData = wrapper.public || {};
  const sensitiveData = await decryptJson<Record<string, string>>(wrapper.sensitive);

  return {
    ...publicData,
    ...sensitiveData,
  };
}

/**
 * 암호화 키 유효성 검증
 */
export async function validateEncryptionKey(): Promise<boolean> {
  try {
    const testData = 'encryption_test_' + Date.now();
    const encrypted = await encrypt(testData);
    const decrypted = await decrypt(encrypted);
    return testData === decrypted;
  } catch {
    return false;
  }
}

/**
 * 암호화 키가 설정되어 있는지 확인
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * 암호화된 데이터인지 확인
 */
export function isEncryptedData(data: unknown): data is EncryptedAuthCredentials {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return obj.encrypted === true && typeof obj.data === 'string';
}

/**
 * 자격 증명 마스킹 (로깅용)
 * @param credentials 자격 증명
 * @returns 마스킹된 자격 증명
 */
export function maskCredentials(credentials: AuthCredentials): Record<string, string> {
  const masked: Record<string, string> = {};

  for (const [key, value] of Object.entries(credentials)) {
    if (value === undefined) continue;

    if (SENSITIVE_FIELDS.includes(key)) {
      // 민감한 필드는 마스킹
      if (value.length <= 4) {
        masked[key] = '****';
      } else {
        masked[key] = value.substring(0, 2) + '****' + value.substring(value.length - 2);
      }
    } else {
      masked[key] = value;
    }
  }

  return masked;
}
