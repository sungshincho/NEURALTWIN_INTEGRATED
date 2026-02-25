import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle2, XCircle, Info, ShieldCheck } from "lucide-react";

interface PropertyField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface EntityType {
  id: string;
  name: string;
  label: string;
  properties: PropertyField[];
}

interface RelationType {
  id: string;
  name: string;
  label: string;
  source_entity_type: string;
  target_entity_type: string;
  properties: PropertyField[];
}

interface ValidationIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  details?: string;
  entityId?: string;
  relationId?: string;
}

export const SchemaValidator = () => {
  const { data: entities } = useQuery({
    queryKey: ["entity-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_entity_types")
        .select("*");

      if (error) throw error;
      return (data || []).map(item => {
        let properties: PropertyField[] = [];
        
        if (typeof item.properties === 'string') {
          try {
            properties = JSON.parse(item.properties);
          } catch (e) {
            console.error('Failed to parse properties:', e);
          }
        } else if (Array.isArray(item.properties)) {
          properties = item.properties as unknown as PropertyField[];
        }
        
        return {
          ...item,
          properties
        };
      }) as EntityType[];
    },
  });

  const { data: relations } = useQuery({
    queryKey: ["relation-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_relation_types")
        .select("*");

      if (error) throw error;
      return (data || []).map(item => {
        let properties: PropertyField[] = [];
        
        if (typeof item.properties === 'string') {
          try {
            properties = JSON.parse(item.properties);
          } catch (e) {
            console.error('Failed to parse properties:', e);
          }
        } else if (Array.isArray(item.properties)) {
          properties = item.properties as unknown as PropertyField[];
        }
        
        return {
          ...item,
          properties
        };
      }) as RelationType[];
    },
  });

  const validationResults = useMemo(() => {
    if (!entities || !relations) return [];
    
    const issues: ValidationIssue[] = [];

    // 1. 존재하지 않는 엔티티 참조 확인
    const entityNames = new Set(entities.map(e => e.name));
    relations.forEach(relation => {
      if (!entityNames.has(relation.source_entity_type)) {
        issues.push({
          severity: "error",
          category: "엔티티 참조 오류",
          message: `관계 '${relation.label}'의 출발 엔티티 '${relation.source_entity_type}'가 존재하지 않습니다`,
          relationId: relation.id,
        });
      }
      if (!entityNames.has(relation.target_entity_type)) {
        issues.push({
          severity: "error",
          category: "엔티티 참조 오류",
          message: `관계 '${relation.label}'의 도착 엔티티 '${relation.target_entity_type}'가 존재하지 않습니다`,
          relationId: relation.id,
        });
      }
    });

    // 2. 순환 참조 감지 (단순 자기 참조부터 복잡한 순환까지)
    const detectCycles = () => {
      const graph = new Map<string, string[]>();
      
      // 그래프 구성
      relations.forEach(rel => {
        if (!graph.has(rel.source_entity_type)) {
          graph.set(rel.source_entity_type, []);
        }
        graph.get(rel.source_entity_type)!.push(rel.target_entity_type);
      });

      // DFS로 순환 감지
      const visited = new Set<string>();
      const recStack = new Set<string>();
      const cycles: string[][] = [];

      const dfs = (node: string, path: string[]): boolean => {
        visited.add(node);
        recStack.add(node);
        path.push(node);

        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (dfs(neighbor, [...path])) {
              return true;
            }
          } else if (recStack.has(neighbor)) {
            const cycleStart = path.indexOf(neighbor);
            const cycle = path.slice(cycleStart);
            cycles.push([...cycle, neighbor]);
            return true;
          }
        }

        recStack.delete(node);
        return false;
      };

      for (const node of graph.keys()) {
        if (!visited.has(node)) {
          dfs(node, []);
        }
      }

      return cycles;
    };

    const cycles = detectCycles();
    cycles.forEach(cycle => {
      const cycleEntities = cycle.map(name => 
        entities.find(e => e.name === name)?.label || name
      );
      issues.push({
        severity: "warning",
        category: "순환 참조",
        message: `순환 참조가 감지되었습니다: ${cycleEntities.join(" → ")}`,
        details: "순환 참조는 무한 루프를 발생시킬 수 있으므로 주의가 필요합니다.",
      });
    });

    // 3. 엔티티 속성 검증
    entities.forEach(entity => {
      // properties가 배열인지 확인
      if (!Array.isArray(entity.properties)) {
        console.warn('Entity properties is not an array:', entity.name, entity.properties);
        return;
      }

      // 필수 속성이 없는 엔티티
      const hasRequiredProps = entity.properties.some(p => p.required);
      if (entity.properties.length > 0 && !hasRequiredProps) {
        issues.push({
          severity: "info",
          category: "속성 권장사항",
          message: `엔티티 '${entity.label}'에 필수 속성이 없습니다`,
          details: "최소 하나의 필수 속성을 정의하는 것을 권장합니다.",
          entityId: entity.id,
        });
      }

      // 중복 속성 이름 체크
      const propNames = entity.properties.map(p => p.name);
      const duplicates = propNames.filter((name, index) => propNames.indexOf(name) !== index);
      if (duplicates.length > 0) {
        issues.push({
          severity: "error",
          category: "속성 중복",
          message: `엔티티 '${entity.label}'에 중복된 속성 이름이 있습니다: ${duplicates.join(", ")}`,
          entityId: entity.id,
        });
      }
    });

    // 4. 관계 속성 검증
    relations.forEach(relation => {
      // properties가 배열인지 확인
      if (!Array.isArray(relation.properties)) {
        console.warn('Relation properties is not an array:', relation.name, relation.properties);
        return;
      }

      // 중복 속성 이름 체크
      const propNames = relation.properties.map(p => p.name);
      const duplicates = propNames.filter((name, index) => propNames.indexOf(name) !== index);
      if (duplicates.length > 0) {
        issues.push({
          severity: "error",
          category: "속성 중복",
          message: `관계 '${relation.label}'에 중복된 속성 이름이 있습니다: ${duplicates.join(", ")}`,
          relationId: relation.id,
        });
      }
    });

    // 5. 타입 일관성 체크
    // 동일한 엔티티 이름이 대소문자만 다른 경우
    const entityNameMap = new Map<string, string[]>();
    entities.forEach(entity => {
      const lowerName = entity.name.toLowerCase();
      if (!entityNameMap.has(lowerName)) {
        entityNameMap.set(lowerName, []);
      }
      entityNameMap.get(lowerName)!.push(entity.name);
    });

    entityNameMap.forEach((names, lowerName) => {
      if (names.length > 1) {
        issues.push({
          severity: "warning",
          category: "타입 일관성",
          message: `유사한 엔티티 이름이 발견되었습니다: ${names.join(", ")}`,
          details: "대소문자만 다른 엔티티는 혼란을 야기할 수 있습니다.",
        });
      }
    });

    // 6. 고아 엔티티 체크 (어떤 관계에도 참여하지 않는 엔티티)
    const referencedEntities = new Set<string>();
    relations.forEach(rel => {
      referencedEntities.add(rel.source_entity_type);
      referencedEntities.add(rel.target_entity_type);
    });

    entities.forEach(entity => {
      if (!referencedEntities.has(entity.name) && relations.length > 0) {
        issues.push({
          severity: "info",
          category: "고아 엔티티",
          message: `엔티티 '${entity.label}'가 어떤 관계에도 연결되어 있지 않습니다`,
          details: "독립적인 엔티티인지 확인하세요.",
          entityId: entity.id,
        });
      }
    });

    // 7. 관계 방향성 검증
    relations.forEach(relation => {
      // 동일한 엔티티 쌍에 대해 반대 방향 관계가 있는지 확인
      const reverseRelation = relations.find(
        r => r.source_entity_type === relation.target_entity_type &&
             r.target_entity_type === relation.source_entity_type &&
             r.id !== relation.id
      );

      if (reverseRelation) {
        issues.push({
          severity: "info",
          category: "양방향 관계",
          message: `'${relation.label}'와 '${reverseRelation.label}'가 양방향 관계를 형성합니다`,
          details: `${relation.source_entity_type} ↔ ${relation.target_entity_type}`,
          relationId: relation.id,
        });
      }
    });

    return issues;
  }, [entities, relations]);

  const errorCount = validationResults.filter(i => i.severity === "error").length;
  const warningCount = validationResults.filter(i => i.severity === "warning").length;
  const infoCount = validationResults.filter(i => i.severity === "info").length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeverityVariant = (severity: string): "default" | "destructive" | undefined => {
    switch (severity) {
      case "error":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return undefined;
      default:
        return undefined;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>스키마 검증 결과</CardTitle>
              <CardDescription>
                온톨로지 무결성 자동 검사
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {errorCount === 0 && warningCount === 0 && (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                검증 통과
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive">
                오류 {errorCount}개
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="default" className="bg-yellow-500">
                경고 {warningCount}개
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="secondary">
                정보 {infoCount}개
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {validationResults.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>완벽합니다!</AlertTitle>
            <AlertDescription>
              스키마에서 발견된 문제가 없습니다. 모든 검증 항목을 통과했습니다.
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {validationResults.map((issue, index) => (
                <Alert key={index} variant={getSeverityVariant(issue.severity)}>
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTitle className="text-sm font-semibold mb-0">
                          {issue.message}
                        </AlertTitle>
                        <Badge variant="outline" className="text-xs">
                          {issue.category}
                        </Badge>
                      </div>
                      {issue.details && (
                        <AlertDescription className="text-xs mt-1">
                          {issue.details}
                        </AlertDescription>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* 검증 통계 */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{entities?.length || 0}</div>
              <div className="text-xs text-muted-foreground">엔티티 타입</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{relations?.length || 0}</div>
              <div className="text-xs text-muted-foreground">관계 타입</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{validationResults.length}</div>
              <div className="text-xs text-muted-foreground">검증 이슈</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
