import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Package, CheckCircle2, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface InventoryItem {
  id: string;
  name: string;
  current: number;
  optimal: number;
  dailySales: number;
  daysLeft: number;
  status: "critical" | "warning" | "optimal" | "excess";
}

const inventory: InventoryItem[] = [
  { id: "I1", name: "화이트 티셔츠", current: 85, optimal: 120, dailySales: 14, daysLeft: 6, status: "warning" },
  { id: "I2", name: "블랙 진", current: 42, optimal: 60, dailySales: 8, daysLeft: 5, status: "warning" },
  { id: "I3", name: "스니커즈", current: 8, optimal: 45, dailySales: 12, daysLeft: 0.7, status: "critical" },
  { id: "I4", name: "데님 자켓", current: 23, optimal: 35, dailySales: 4, daysLeft: 5.8, status: "optimal" },
  { id: "I5", name: "백팩", current: 156, optimal: 80, dailySales: 3, daysLeft: 52, status: "excess" },
];

const chartData = inventory.map((item) => ({
  name: item.name.split(" ")[0],
  현재: item.current,
  최적: item.optimal,
  일평균판매: item.dailySales,
}));

export const InventoryOptimizer = () => {
  const criticalCount = inventory.filter((i) => i.status === "critical").length;
  const warningCount = inventory.filter((i) => i.status === "warning").length;
  const totalValue = inventory.reduce((sum, i) => sum + i.current * 50000, 0); // Avg 50k per item
  const optimizationPotential = inventory.reduce(
    (sum, i) => sum + Math.abs(i.optimal - i.current) * 50000,
    0
  );

  const getStatusColor = (status: InventoryItem["status"]) => {
    switch (status) {
      case "critical": return "text-red-500";
      case "warning": return "text-amber-500";
      case "optimal": return "text-green-500";
      case "excess": return "text-blue-500";
    }
  };

  const getStatusBadge = (status: InventoryItem["status"]) => {
    switch (status) {
      case "critical":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            긴급
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-500">
            <AlertTriangle className="w-3 h-3" />
            주의
          </Badge>
        );
      case "optimal":
        return (
          <Badge className="gap-1 bg-green-500/20 text-green-500 border-green-500/50">
            <CheckCircle2 className="w-3 h-3" />
            최적
          </Badge>
        );
      case "excess":
        return (
          <Badge variant="secondary" className="gap-1">
            <Package className="w-3 h-3" />
            과다
          </Badge>
        );
    }
  };

  const getRecommendation = (item: InventoryItem) => {
    const diff = item.optimal - item.current;
    if (diff > 0) {
      return `+${diff}개 보충 권장 (${Math.ceil(diff / item.dailySales)}일 분)`;
    } else if (diff < 0) {
      return `${Math.abs(diff)}개 과다 재고 (프로모션 제안)`;
    }
    return "현재 재고 수준 유지";
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">재고 가치</div>
          <div className="text-2xl font-bold">₩{(totalValue / 1000000).toFixed(0)}M</div>
          <div className="text-xs text-muted-foreground">현재 보유</div>
        </Card>

        <Card className="glass p-4 space-y-2 border-red-500/30">
          <div className="text-sm text-muted-foreground">긴급 재고</div>
          <div className="text-2xl font-bold text-red-500">{criticalCount}개</div>
          <div className="text-xs text-muted-foreground">즉시 보충 필요</div>
        </Card>

        <Card className="glass p-4 space-y-2 border-amber-500/30">
          <div className="text-sm text-muted-foreground">주의 재고</div>
          <div className="text-2xl font-bold text-amber-500">{warningCount}개</div>
          <div className="text-xs text-muted-foreground">7일 이내 보충</div>
        </Card>

        <Card className="glass p-4 space-y-2 border-primary/30">
          <div className="text-sm text-muted-foreground">최적화 여력</div>
          <div className="text-2xl font-bold text-primary">₩{(optimizationPotential / 1000000).toFixed(0)}M</div>
          <div className="text-xs text-muted-foreground">절감 가능</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inventory List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">재고 현황</h4>
            <Button size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI 최적화 실행
            </Button>
          </div>

          <div className="space-y-3">
            {inventory.map((item) => (
              <Card key={item.id} className="glass p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      일 평균 판매: {item.dailySales}개
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">현재</div>
                    <div className={`font-bold ${getStatusColor(item.status)}`}>
                      {item.current}개
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">최적</div>
                    <div className="font-semibold text-primary">{item.optimal}개</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">소진 예상</div>
                    <div className="font-semibold">
                      {item.daysLeft < 1
                        ? "오늘"
                        : item.daysLeft > 30
                        ? "30일+"
                        : `${Math.floor(item.daysLeft)}일`}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex items-start gap-2 text-xs">
                    <TrendingUp className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {getRecommendation(item)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Charts & Insights */}
        <div className="space-y-4">
          <Card className="glass p-6">
            <h5 className="text-sm font-semibold mb-4">재고 vs 최적 수준</h5>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="현재" fill="hsl(var(--muted-foreground))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="최적" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass p-4 space-y-3">
            <h5 className="text-sm font-semibold">AI 제안 요약</h5>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5" />
                <span>
                  <span className="font-semibold">스니커즈:</span> 즉시 37개 보충 (당일 배송 요청)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5" />
                <span>
                  <span className="font-semibold">화이트 티셔츠:</span> 주말 전 35개 보충
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                <span>
                  <span className="font-semibold">백팩:</span> 76개 과다, 20% 할인 프로모션 제안
                </span>
              </li>
            </ul>
          </Card>

          <Card className="glass p-4 space-y-3">
            <h5 className="text-sm font-semibold">주간 예측</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">예상 총 판매</span>
                <span className="font-semibold">287개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">필요 보충량</span>
                <span className="font-semibold text-primary">154개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">최적화 후 재고 비용 절감</span>
                <span className="font-semibold text-green-500">-18.5%</span>
              </div>
            </div>
          </Card>

          <Card className="glass p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold mb-1">자동 발주 설정</div>
                <p className="text-muted-foreground">
                  AI가 판매 패턴을 학습하여 최적 시점에 자동 발주를 제안합니다.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
