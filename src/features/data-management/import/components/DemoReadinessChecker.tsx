import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDataReadiness } from "@/hooks/useDataReadiness";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Store, 
  Database, 
  Network, 
  Wifi,
  FileBox,
  Sparkles,
  LayoutGrid
} from "lucide-react";

interface ScenarioRequirement {
  id: string;
  name: string;
  description: string;
  requirements: {
    hasStore: boolean;
    hasData: boolean;
    hasSchema: boolean;
    hasWifi?: boolean;
    has3DModel?: boolean;
  };
  tier: 1 | 2 | 3;
}

const DEMO_SCENARIOS: ScenarioRequirement[] = [
  {
    id: "1.1",
    name: "신규 사용자 온보딩",
    description: "매장 등록 및 기본 데이터 업로드",
    requirements: {
      hasStore: true,
      hasData: false,
      hasSchema: false
    },
    tier: 1
  },
  {
    id: "1.2",
    name: "3D 매장 모델 업로드 및 시각화",
    description: "3D 모델 업로드 및 Digital Twin 렌더링",
    requirements: {
      hasStore: true,
      hasData: false,
      hasSchema: false,
      has3DModel: true
    },
    tier: 1
  },
  {
    id: "1.3",
    name: "고객 동선 히트맵 검증",
    description: "방문 데이터 기반 히트맵 생성",
    requirements: {
      hasStore: true,
      hasData: true,
      hasSchema: true
    },
    tier: 1
  },
  {
    id: "2.1",
    name: "온톨로지 기반 매장 구성",
    description: "엔티티/관계 정의 및 3D 모델 매핑",
    requirements: {
      hasStore: true,
      hasData: true,
      hasSchema: true,
      has3DModel: true
    },
    tier: 2
  },
  {
    id: "2.2",
    name: "WiFi 트래킹 데모",
    description: "센서 등록 및 실시간 위치 추정",
    requirements: {
      hasStore: true,
      hasData: true,
      hasSchema: true,
      hasWifi: true
    },
    tier: 2
  },
  {
    id: "2.3",
    name: "AI 기반 레이아웃 시뮬레이션",
    description: "최적 매장 배치 추천",
    requirements: {
      hasStore: true,
      hasData: true,
      hasSchema: true,
      has3DModel: true
    },
    tier: 3
  },
  {
    id: "3.1",
    name: "End-to-End 매장 분석 워크플로우",
    description: "데이터 임포트부터 AI 인사이트까지",
    requirements: {
      hasStore: true,
      hasData: true,
      hasSchema: true
    },
    tier: 3
  },
  {
    id: "3.2",
    name: "다중 매장 비교 분석",
    description: "여러 매장 성과 비교",
    requirements: {
      hasStore: true,
      hasData: true,
      hasSchema: true
    },
    tier: 2
  }
];

export function DemoReadinessChecker() {
  const { 
    isReady, 
    isLoading, 
    hasStore, 
    hasImportedData, 
    hasOntologySchema,
    hasWifiData,
    selectedStore,
    importCount,
    dataTypesSummary,
    getStatusMessage
  } = useDataReadiness();
  
  const navigate = useNavigate();

  const checkScenarioReady = (scenario: ScenarioRequirement): boolean => {
    if (!scenario.requirements.hasStore && !hasStore) return false;
    if (scenario.requirements.hasStore && !hasStore) return false;
    if (scenario.requirements.hasData && !hasImportedData) return false;
    if (scenario.requirements.hasSchema && !hasOntologySchema) return false;
    if (scenario.requirements.hasWifi && !hasWifiData) return false;
    // 3D 모델 체크는 별도로 처리 필요 (현재는 단순화)
    return true;
  };

  const statusMessage = getStatusMessage();
  const readyCount = DEMO_SCENARIOS.filter(checkScenarioReady).length;
  const totalCount = DEMO_SCENARIOS.length;
  const readyPercent = Math.round((readyCount / totalCount) * 100);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">데이터 준비 상태 확인 중...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">데모 준비 상태</h3>
            <Badge variant={readyPercent === 100 ? "default" : readyPercent > 50 ? "secondary" : "destructive"}>
              {readyPercent}% 준비됨
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className={hasStore ? "text-green-500" : "text-muted-foreground"}>
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">매장</p>
                <p className="text-xs text-muted-foreground">
                  {hasStore ? selectedStore?.store_name : "미등록"}
                </p>
              </div>
              {hasStore ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground ml-auto" />
              )}
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className={hasImportedData ? "text-green-500" : "text-muted-foreground"}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">데이터</p>
                <p className="text-xs text-muted-foreground">
                  {importCount}개 파일
                </p>
              </div>
              {hasImportedData ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground ml-auto" />
              )}
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className={hasOntologySchema ? "text-green-500" : "text-muted-foreground"}>
                <Network className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">온톨로지</p>
                <p className="text-xs text-muted-foreground">
                  {hasOntologySchema ? "구성됨" : "미구성"}
                </p>
              </div>
              {hasOntologySchema ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground ml-auto" />
              )}
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className={hasWifiData ? "text-green-500" : "text-muted-foreground"}>
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">WiFi 트래킹</p>
                <p className="text-xs text-muted-foreground">
                  {hasWifiData ? "활성" : "비활성"}
                </p>
              </div>
              {hasWifiData ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500 ml-auto" />
              )}
            </div>
          </div>

          {statusMessage.type !== 'ready' && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{statusMessage.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{statusMessage.message}</p>
                  {statusMessage.actionPath && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate(statusMessage.actionPath!)}
                    >
                      {statusMessage.action}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Scenario Checklist */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">데모 시나리오 체크리스트</h3>
        <div className="space-y-3">
          {DEMO_SCENARIOS.map((scenario) => {
            const ready = checkScenarioReady(scenario);
            return (
              <div
                key={scenario.id}
                className={`p-4 rounded-lg border ${
                  ready ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/30 border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  {ready ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">시나리오 {scenario.id}</span>
                      <Badge variant={scenario.tier === 1 ? "default" : scenario.tier === 2 ? "secondary" : "outline"}>
                        Tier {scenario.tier}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{scenario.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{scenario.description}</p>
                    
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {scenario.requirements.hasStore && (
                        <Badge variant={hasStore ? "default" : "outline"} className="text-xs">
                          <Store className="w-3 h-3 mr-1" />
                          매장
                        </Badge>
                      )}
                      {scenario.requirements.hasData && (
                        <Badge variant={hasImportedData ? "default" : "outline"} className="text-xs">
                          <Database className="w-3 h-3 mr-1" />
                          데이터
                        </Badge>
                      )}
                      {scenario.requirements.hasSchema && (
                        <Badge variant={hasOntologySchema ? "default" : "outline"} className="text-xs">
                          <Network className="w-3 h-3 mr-1" />
                          온톨로지
                        </Badge>
                      )}
                      {scenario.requirements.hasWifi && (
                        <Badge variant={hasWifiData ? "default" : "outline"} className="text-xs">
                          <Wifi className="w-3 h-3 mr-1" />
                          WiFi
                        </Badge>
                      )}
                      {scenario.requirements.has3DModel && (
                        <Badge variant="outline" className="text-xs">
                          <FileBox className="w-3 h-3 mr-1" />
                          3D 모델
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">빠른 실행</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/stores')}
          >
            <Store className="w-4 h-4 mr-2" />
            매장 관리
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/schema-builder')}
          >
            <Network className="w-4 h-4 mr-2" />
            스키마 빌더
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/digital-twin-3d')}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Digital Twin 3D
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/neuralsense-settings')}
          >
            <Wifi className="w-4 h-4 mr-2" />
            WiFi 설정
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/layout-sim')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI 시뮬레이션
          </Button>
        </div>
      </Card>

      {/* Data Details */}
      {hasImportedData && Object.keys(dataTypesSummary).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">업로드된 데이터 상세</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(dataTypesSummary).map(([type, count]) => (
              <div key={type} className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">{type}</p>
                <p className="text-lg font-semibold">{count}개</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
