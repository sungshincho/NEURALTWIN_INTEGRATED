import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  column?: string;
  row?: number;
}

interface FileValidationResult {
  fileName: string;
  tableName: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  totalErrors: number;
  totalWarnings: number;
}

interface DataValidationPreviewProps {
  results: FileValidationResult[];
  uploadOrder: string[][];
  summary: ValidationSummary;
}

export function DataValidationPreview({ results, uploadOrder, summary }: DataValidationPreviewProps) {
  return (
    <div className="space-y-4">
      {/* 요약 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>검증 결과 요약</CardTitle>
          <CardDescription>
            전체 {summary.total}개 파일 검증 완료
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.valid}</div>
              <div className="text-sm text-muted-foreground">정상</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.invalid}</div>
              <div className="text-sm text-muted-foreground">오류</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{summary.totalErrors}</div>
              <div className="text-sm text-muted-foreground">에러</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{summary.totalWarnings}</div>
              <div className="text-sm text-muted-foreground">경고</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 권장 업로드 순서 */}
      <Card>
        <CardHeader>
          <CardTitle>권장 업로드 순서</CardTitle>
          <CardDescription>
            FK 의존성에 따라 자동 계산된 순서입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {uploadOrder.map((level, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="outline">단계 {index + 1}</Badge>
                <div className="flex items-center gap-2 flex-wrap">
                  {level.map((fileName, fileIndex) => (
                    <div key={fileIndex} className="flex items-center gap-1">
                      <Badge variant="secondary">{fileName}</Badge>
                      {fileIndex < level.length - 1 && (
                        <span className="text-muted-foreground">,</span>
                      )}
                    </div>
                  ))}
                </div>
                {index < uploadOrder.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 파일별 검증 결과 */}
      <Card>
        <CardHeader>
          <CardTitle>파일별 상세 검증 결과</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className={result.isValid ? 'border-green-200' : 'border-red-200'}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <CardTitle className="text-base">{result.fileName}</CardTitle>
                      </div>
                      <Badge variant="outline">{result.tableName}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* 에러 목록 */}
                    {result.errors.length > 0 && (
                      <div className="space-y-1">
                        {result.errors.map((error, errorIndex) => (
                          <Alert key={errorIndex} variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                              <span className="font-medium">에러:</span> {error.message}
                              {error.column && (
                                <span className="text-xs ml-2">
                                  (컬럼: {error.column})
                                </span>
                              )}
                              {error.row && (
                                <span className="text-xs ml-2">
                                  (행: {error.row})
                                </span>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}

                    {/* 경고 목록 */}
                    {result.warnings.length > 0 && (
                      <div className="space-y-1">
                        {result.warnings.map((warning, warningIndex) => (
                          <Alert key={warningIndex}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <span className="font-medium">경고:</span> {warning.message}
                              {warning.column && (
                                <span className="text-xs ml-2">
                                  (컬럼: {warning.column})
                                </span>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}

                    {/* 정상인 경우 */}
                    {result.isValid && result.errors.length === 0 && result.warnings.length === 0 && (
                      <p className="text-sm text-green-600">
                        ✓ 모든 검증을 통과했습니다
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
