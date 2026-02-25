import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Wand2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SCHEMA_MAP } from "@/utils/dataSchemas";
import { ENTERPRISE_SCHEMA_MAP } from "@/utils/enterpriseSchemas";

interface ValidationResult {
  importId: string;
  fileName: string;
  dataType: string;
  rowCount: number;
  status: "valid" | "warning" | "error";
  score: number;
  issues: ValidationIssue[];
  createdAt: string;
}

interface ValidationIssue {
  severity: "error" | "warning" | "info";
  field?: string;
  message: string;
  count?: number;
}

interface Props {
  storeId?: string;
}

export function DataValidation({ storeId }: Props) {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixOptions, setFixOptions] = useState({
    removeDuplicates: true,
    fillEmptyValues: true,
    convertTypes: true,
    useAI: true,
  });
  const { toast } = useToast();

  const validateData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("인증 필요");

      let query = supabase
        .from("user_data_imports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (storeId) {
        query = query.eq("store_id", storeId);
      }

      const { data: imports, error } = await query;
      if (error) throw error;

      const validationResults: ValidationResult[] = [];

      for (const imp of imports || []) {
        const issues: ValidationIssue[] = [];
        let score = 100;

        // Skip 3D model validation until file_path column is added
        // TODO: Add file_path column to user_data_imports table
        if (imp.data_type === '3d-model') {
          issues.push({
            severity: "info",
            message: "3D 모델 검증은 곧 지원됩니다",
          });
          score = 80; // Default score for 3D models
          
          validationResults.push({
            importId: imp.id,
            fileName: imp.file_name,
            dataType: imp.data_type,
            rowCount: 1,
            status: "warning",
            score,
            issues,
            createdAt: imp.created_at,
          });

          continue; // 다음 import로
        }

        // CSV/엑셀 데이터 검증
        const schema = SCHEMA_MAP[imp.data_type] || ENTERPRISE_SCHEMA_MAP[imp.data_type];
        if (!schema) {
          issues.push({
            severity: "warning",
            message: `알 수 없는 데이터 타입: ${imp.data_type}`,
          });
          score -= 20;
        }

        const rawData = imp.raw_data as any[];
        if (!Array.isArray(rawData) || rawData.length === 0) {
          issues.push({
            severity: "error",
            message: "데이터가 비어있습니다",
          });
          score = 0;
        } else if (schema) {
          // 필수 컬럼 확인
          const requiredColumns = schema.columns
            ?.filter((col: any) => col.required)
            .map((col: any) => col.name) || [];
          
          const dataColumns = Object.keys(rawData[0] || {});
          const missingColumns = requiredColumns.filter(
            (col: string) => !dataColumns.some(dc => 
              dc.toLowerCase().includes(col.toLowerCase()) ||
              col.toLowerCase().includes(dc.toLowerCase())
            )
          );

          if (missingColumns.length > 0) {
            issues.push({
              severity: "error",
              message: `필수 컬럼 누락: ${missingColumns.join(", ")}`,
              count: missingColumns.length,
            });
            score -= missingColumns.length * 15;
          }

          // 빈 값 확인
          let emptyCount = 0;
          rawData.forEach(row => {
            Object.entries(row).forEach(([key, value]) => {
              if (value === null || value === undefined || value === "") {
                emptyCount++;
              }
            });
          });

          if (emptyCount > 0) {
            const emptyPercent = (emptyCount / (rawData.length * dataColumns.length) * 100).toFixed(1);
            issues.push({
              severity: "warning",
              message: `빈 값 ${emptyCount}개 (${emptyPercent}%)`,
              count: emptyCount,
            });
            score -= Math.min(20, emptyCount / 10);
          }

          // 중복 데이터 확인
          const uniqueRows = new Set(rawData.map(row => JSON.stringify(row)));
          const duplicates = rawData.length - uniqueRows.size;
          if (duplicates > 0) {
            issues.push({
              severity: "warning",
              message: `중복 행 ${duplicates}개 발견`,
              count: duplicates,
            });
            score -= Math.min(15, duplicates / 5);
          }

          // 온톨로지 매핑 확인
          const { data: entities } = await supabase
            .from("graph_entities")
            .select("id")
            .eq("user_id", user.id)
            .eq("properties->>import_id", imp.id);

          if (!entities || entities.length === 0) {
            issues.push({
              severity: "info",
              message: "온톨로지 매핑이 아직 완료되지 않았습니다",
            });
            score -= 5;
          }
        }

        score = Math.max(0, Math.round(score));
        const status = score >= 80 ? "valid" : score >= 50 ? "warning" : "error";

        validationResults.push({
          importId: imp.id,
          fileName: imp.file_name,
          dataType: imp.data_type,
          rowCount: imp.row_count,
          status,
          score,
          issues,
          createdAt: imp.created_at,
        });
      }

      setResults(validationResults);
      toast({
        title: "검증 완료",
        description: `${validationResults.length}개 데이터 검증 완료`,
      });
    } catch (error: any) {
      toast({
        title: "검증 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const autoFixData = async (importId: string) => {
    setFixingId(importId);
    try {
      const { data, error } = await supabase.functions.invoke('auto-fix-data', {
        body: { importId, options: fixOptions }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "자동 수정 완료",
          description: `${data.fixes?.length || 0}개 문제 해결 (${data.originalCount}행 → ${data.fixedCount}행)`,
        });
        
        // 수정 완료 후 재검증
        await validateData();
      } else {
        throw new Error(data?.error || '자동 수정 실패');
      }
    } catch (error: any) {
      console.error('Auto-fix error:', error);
      toast({
        title: "자동 수정 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFixingId(null);
    }
  };

  useEffect(() => {
    validateData();
  }, [storeId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      valid: "default",
      warning: "secondary",
      error: "destructive",
    };
    return (
      <Badge variant={variants[status]}>
        {status === "valid" ? "정상" : status === "warning" ? "주의" : "오류"}
      </Badge>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">데이터 유효성 검사</h3>
          <p className="text-sm text-muted-foreground">
            임포트된 데이터의 품질과 완전성을 검증합니다
          </p>
        </div>
        <Button onClick={validateData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "검증 중..." : "다시 검증"}
        </Button>
      </div>

      {/* 자동 수정 옵션 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">자동 수정 옵션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="removeDuplicates"
                checked={fixOptions.removeDuplicates}
                onCheckedChange={(checked) => 
                  setFixOptions(prev => ({ ...prev, removeDuplicates: !!checked }))
                }
              />
              <Label htmlFor="removeDuplicates" className="cursor-pointer">
                중복 행 제거
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fillEmptyValues"
                checked={fixOptions.fillEmptyValues}
                onCheckedChange={(checked) => 
                  setFixOptions(prev => ({ ...prev, fillEmptyValues: !!checked }))
                }
              />
              <Label htmlFor="fillEmptyValues" className="cursor-pointer">
                빈 값 채우기
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="convertTypes"
                checked={fixOptions.convertTypes}
                onCheckedChange={(checked) => 
                  setFixOptions(prev => ({ ...prev, convertTypes: !!checked }))
                }
              />
              <Label htmlFor="convertTypes" className="cursor-pointer">
                데이터 타입 변환
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useAI"
                checked={fixOptions.useAI}
                onCheckedChange={(checked) => 
                  setFixOptions(prev => ({ ...prev, useAI: !!checked }))
                }
              />
              <Label htmlFor="useAI" className="cursor-pointer">
                AI 품질 향상
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 검증 결과 목록 */}
      {results.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {loading ? "검증 중..." : "검증할 데이터가 없습니다"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.importId} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base truncate">
                          {result.fileName}
                        </CardTitle>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.dataType} • {result.rowCount}행 • 점수: {result.score}/100
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.status !== "valid" && result.issues.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => autoFixData(result.importId)}
                        disabled={fixingId === result.importId}
                      >
                        <Wand2 className={`w-4 h-4 mr-2 ${fixingId === result.importId ? "animate-spin" : ""}`} />
                        {fixingId === result.importId ? "수정 중..." : "자동 수정"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedId(expandedId === result.importId ? null : result.importId)
                      }
                    >
                      {expandedId === result.importId ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* 점수 프로그레스 바 */}
              <div className="px-6 pb-3">
                <Progress value={result.score} className="h-2" />
              </div>

              {/* 상세 이슈 */}
              {expandedId === result.importId && (
                <CardContent className="pt-0 border-t">
                  <div className="space-y-2 mt-4">
                    {result.issues.length === 0 ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        문제가 발견되지 않았습니다
                      </p>
                    ) : (
                      result.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-sm p-2 rounded bg-muted/50"
                        >
                          <div className={`font-medium ${getSeverityColor(issue.severity)} mt-0.5`}>
                            {issue.severity === "error" ? "●" : issue.severity === "warning" ? "▲" : "ⓘ"}
                          </div>
                          <div className="flex-1">
                            {issue.field && (
                              <span className="font-medium">{issue.field}: </span>
                            )}
                            {issue.message}
                            {issue.count && (
                              <span className="text-muted-foreground ml-1">
                                ({issue.count}개)
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    임포트 시간: {new Date(result.createdAt).toLocaleString("ko-KR")}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
