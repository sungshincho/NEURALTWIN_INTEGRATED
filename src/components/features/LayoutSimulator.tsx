import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RotateCcw, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Product {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

const initialProducts: Product[] = [
  { id: "A", name: "신상품", x: 20, y: 20, color: "bg-primary" },
  { id: "B", name: "인기상품", x: 60, y: 20, color: "bg-blue-500" },
  { id: "C", name: "할인상품", x: 20, y: 60, color: "bg-purple-500" },
  { id: "D", name: "프리미엄", x: 60, y: 60, color: "bg-amber-500" },
];

const aiSuggestedLayout: Product[] = [
  { id: "A", name: "신상품", x: 60, y: 20, color: "bg-primary" },
  { id: "B", name: "인기상품", x: 20, y: 20, color: "bg-blue-500" },
  { id: "C", name: "할인상품", x: 60, y: 60, color: "bg-purple-500" },
  { id: "D", name: "프리미엄", x: 20, y: 60, color: "bg-amber-500" },
];

const generateMetrics = (products: Product[]) => {
  const baseConversion = 15;
  const layoutScore = products.reduce((sum, p) => sum + (p.x + p.y), 0);
  const variance = (layoutScore % 50) - 25;
  return {
    conversion: baseConversion + variance * 0.2,
    traffic: 450 + variance * 5,
    dwell: 180 + variance * 2,
  };
};

export const LayoutSimulator = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null);
  const [isAiLayout, setIsAiLayout] = useState(false);

  const metrics = generateMetrics(products);
  const aiMetrics = generateMetrics(aiSuggestedLayout);

  const chartData = [
    { time: "Mon", current: metrics.conversion, optimized: aiMetrics.conversion },
    { time: "Tue", current: metrics.conversion + 1, optimized: aiMetrics.conversion + 1.5 },
    { time: "Wed", current: metrics.conversion - 0.5, optimized: aiMetrics.conversion + 2 },
    { time: "Thu", current: metrics.conversion + 0.8, optimized: aiMetrics.conversion + 2.5 },
    { time: "Fri", current: metrics.conversion + 2, optimized: aiMetrics.conversion + 3.5 },
    { time: "Sat", current: metrics.conversion + 3, optimized: aiMetrics.conversion + 5 },
    { time: "Sun", current: metrics.conversion + 2.5, optimized: aiMetrics.conversion + 4.5 },
  ];

  const handleDragStart = (productId: string) => {
    setDraggedProduct(productId);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggedProduct) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === draggedProduct
          ? { ...p, x: Math.max(5, Math.min(85, x)), y: Math.max(5, Math.min(85, y)) }
          : p
      )
    );
    setDraggedProduct(null);
    setIsAiLayout(false);
  };

  const applyAiSuggestion = () => {
    setProducts(aiSuggestedLayout);
    setIsAiLayout(true);
  };

  const resetLayout = () => {
    setProducts(initialProducts);
    setIsAiLayout(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Layout Canvas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">매장 레이아웃</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={resetLayout}>
                <RotateCcw className="w-4 h-4 mr-2" />
                초기화
              </Button>
              <Button size="sm" onClick={applyAiSuggestion}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI 제안
              </Button>
            </div>
          </div>

          <div
            className="relative w-full aspect-square glass rounded-xl border-2 border-dashed border-border overflow-hidden"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="absolute top-2 left-2 text-xs text-muted-foreground">입구</div>
            {products.map((product) => (
              <div
                key={product.id}
                draggable
                onDragStart={() => handleDragStart(product.id)}
                className={`absolute w-16 h-16 ${product.color} rounded-lg cursor-move flex items-center justify-center text-white font-bold shadow-lg hover:scale-110 transition-transform`}
                style={{
                  left: `${product.x}%`,
                  top: `${product.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {product.id}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 ${product.color} rounded`} />
                <span className="text-sm">{product.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <h4 className="font-semibold">예측 지표</h4>

          <div className="grid grid-cols-2 gap-4">
            <Card className="glass p-4">
              <div className="text-sm text-muted-foreground mb-1">전환율</div>
              <div className="text-2xl font-bold">{metrics.conversion.toFixed(1)}%</div>
              {isAiLayout && (
                <Badge variant="secondary" className="mt-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{(aiMetrics.conversion - metrics.conversion).toFixed(1)}%
                </Badge>
              )}
            </Card>

            <Card className="glass p-4">
              <div className="text-sm text-muted-foreground mb-1">일 방문자</div>
              <div className="text-2xl font-bold">{Math.round(metrics.traffic)}</div>
              {isAiLayout && (
                <Badge variant="secondary" className="mt-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{Math.round(aiMetrics.traffic - metrics.traffic)}
                </Badge>
              )}
            </Card>

            <Card className="glass p-4">
              <div className="text-sm text-muted-foreground mb-1">평균 체류(초)</div>
              <div className="text-2xl font-bold">{Math.round(metrics.dwell)}</div>
              {isAiLayout && (
                <Badge variant="secondary" className="mt-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{Math.round(aiMetrics.dwell - metrics.dwell)}
                </Badge>
              )}
            </Card>

            <Card className="glass p-4">
              <div className="text-sm text-muted-foreground mb-1">예상 증가 매출</div>
              <div className="text-2xl font-bold">
                {isAiLayout ? "+12.5%" : "0%"}
              </div>
            </Card>
          </div>

          <div className="glass p-4 rounded-xl">
            <h5 className="text-sm font-semibold mb-3">주간 전환율 예측</h5>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="hsl(var(--muted-foreground))"
                  name="현재 레이아웃"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="optimized"
                  stroke="hsl(var(--primary))"
                  name="최적화 레이아웃"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
