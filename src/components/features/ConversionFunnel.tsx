import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const funnelData = [
  { stage: "visit", count: 1000, rate: 100, color: "hsl(var(--primary))" },
  { stage: "interest", count: 680, rate: 68, color: "hsl(217, 91%, 60%)" },
  { stage: "stay", count: 420, rate: 42, color: "hsl(262, 83%, 58%)" },
  { stage: "purchase", count: 150, rate: 15, color: "hsl(142, 76%, 36%)" },
];

const timeRanges = {
  "today": { multiplier: 1 },
  "week": { multiplier: 7 },
  "month": { multiplier: 30 },
};

export const ConversionFunnel = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<keyof typeof timeRanges>("today");

  const scaledData = funnelData.map((item) => ({
    ...item,
    stage: t(`dashboardFeatures.conversionFunnel.stages.${item.stage}`),
    count: Math.round(item.count * timeRanges[timeRange].multiplier),
  }));

  const totalRevenue = scaledData[3].count * 125000; // Avg transaction: 125k KRW
  const conversionRate = ((scaledData[3].count / scaledData[0].count) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{t("dashboardFeatures.conversionFunnel.title")}</h4>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as keyof typeof timeRanges)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(timeRanges).map((key) => (
              <SelectItem key={key} value={key}>
                {t(`dashboardFeatures.conversionFunnel.timeRanges.${key}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Users className="w-5 h-5 text-primary" />
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              +12%
            </Badge>
          </div>
          <div className="text-2xl font-bold">{scaledData[0].count.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{t("dashboardFeatures.conversionFunnel.metrics.totalVisitors")}</div>
        </Card>

        <Card className="glass p-4 space-y-2">
          <div className="flex items-center justify-between">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              +8%
            </Badge>
          </div>
          <div className="text-2xl font-bold">{scaledData[3].count.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{t("dashboardFeatures.conversionFunnel.metrics.purchasers")}</div>
        </Card>

        <Card className="glass p-4 space-y-2">
          <div className="flex items-center justify-between">
            <DollarSign className="w-5 h-5 text-green-500" />
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              +15%
            </Badge>
          </div>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <div className="text-sm text-muted-foreground">{t("dashboardFeatures.conversionFunnel.metrics.conversionRate")}</div>
        </Card>

        <Card className="glass p-4 space-y-2">
          <div className="flex items-center justify-between">
            <DollarSign className="w-5 h-5 text-amber-500" />
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              +18%
            </Badge>
          </div>
          <div className="text-2xl font-bold">₩{(totalRevenue / 1000000).toFixed(0)}M</div>
          <div className="text-sm text-muted-foreground">{t("dashboardFeatures.conversionFunnel.metrics.totalRevenue")}</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <h5 className="text-sm font-semibold mb-4">{t("dashboardFeatures.conversionFunnel.funnelTitle")}</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scaledData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="stage" type="category" stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {scaledData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-6 space-y-4">
          <h5 className="text-sm font-semibold">{t("dashboardFeatures.conversionFunnel.conversionRateTitle")}</h5>
          {scaledData.map((item, index) => (
            <div key={item.stage} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {item.count.toLocaleString()} ({item.rate}%)
                  </span>
                  {index > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <TrendingDown className="w-3 h-3" />
                      -{(100 - (item.count / scaledData[index - 1].count) * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.rate}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-border space-y-2">
            <h6 className="text-xs font-semibold text-muted-foreground">{t("dashboardFeatures.conversionFunnel.optimizationTitle")}</h6>
            <ul className="text-xs space-y-1">
              {(t("dashboardFeatures.conversionFunnel.optimizationItems", { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};
