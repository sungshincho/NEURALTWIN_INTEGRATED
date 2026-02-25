import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const generateForecast = (weather: string, event: string, dayType: string) => {
  const baseData = [
    { dayKey: "mon", sales: 100, conversion: 3.5 },
    { dayKey: "tue", sales: 95, conversion: 3.2 },
    { dayKey: "wed", sales: 110, conversion: 3.8 },
    { dayKey: "thu", sales: 105, conversion: 3.6 },
    { dayKey: "fri", sales: 130, conversion: 4.2 },
    { dayKey: "sat", sales: 180, conversion: 5.5 },
    { dayKey: "sun", sales: 165, conversion: 5.1 },
  ];

  const multiplier =
    (weather === "sunny" ? 1.1 : weather === "rainy" ? 0.85 : 1) *
    (event === "sale" ? 1.3 : event === "holiday" ? 1.15 : 1) *
    (dayType === "weekend" ? 1.2 : 1);

  return baseData.map((d) => ({
    ...d,
    sales: Math.round(d.sales * multiplier),
    conversion: parseFloat((d.conversion * multiplier).toFixed(1)),
  }));
};

export const DemandForecast = () => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState("clear");
  const [event, setEvent] = useState("none");
  const [dayType, setDayType] = useState("weekday");

  const rawData = generateForecast(weather, event, dayType);

  // 요일 라벨 i18n 매핑
  const dayLabels: Record<string, string> = {
    mon: t("dashboardFeatures.demandForecast.dayLabels.mon"),
    tue: t("dashboardFeatures.demandForecast.dayLabels.tue"),
    wed: t("dashboardFeatures.demandForecast.dayLabels.wed"),
    thu: t("dashboardFeatures.demandForecast.dayLabels.thu"),
    fri: t("dashboardFeatures.demandForecast.dayLabels.fri"),
    sat: t("dashboardFeatures.demandForecast.dayLabels.sat"),
    sun: t("dashboardFeatures.demandForecast.dayLabels.sun"),
  };

  // 차트에서 실제로 쓰는 데이터 (day = 번역된 라벨)
  const data = rawData.map((d) => ({
    ...d,
    day: dayLabels[d.dayKey] ?? d.dayKey,
  }));

  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
  const avgConversion = (data.reduce((sum, d) => sum + d.conversion, 0) / data.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass p-6">
          <Label className="text-sm font-medium mb-3 block">{t("dashboardFeatures.demandForecast.weather")}</Label>
          <Select value={weather} onValueChange={setWeather}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sunny">{t("dashboardFeatures.demandForecast.weatherOptions.sunny")}</SelectItem>
              <SelectItem value="clear">{t("dashboardFeatures.demandForecast.weatherOptions.clear")}</SelectItem>
              <SelectItem value="rainy">{t("dashboardFeatures.demandForecast.weatherOptions.rainy")}</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="glass p-6">
          <Label className="text-sm font-medium mb-3 block">{t("dashboardFeatures.demandForecast.event")}</Label>
          <Select value={event} onValueChange={setEvent}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("dashboardFeatures.demandForecast.eventOptions.none")}</SelectItem>
              <SelectItem value="sale">{t("dashboardFeatures.demandForecast.eventOptions.sale")}</SelectItem>
              <SelectItem value="holiday">{t("dashboardFeatures.demandForecast.eventOptions.holiday")}</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="glass p-6">
          <Label className="text-sm font-medium mb-3 block">{t("dashboardFeatures.demandForecast.day")}</Label>
          <Select value={dayType} onValueChange={setDayType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekday">{t("dashboardFeatures.demandForecast.dayOptions.weekday")}</SelectItem>
              <SelectItem value="weekend">{t("dashboardFeatures.demandForecast.dayOptions.weekend")}</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <div className="text-sm text-muted-foreground mb-1">
            {t("dashboardFeatures.demandForecast.weeklyRevenue")}
          </div>
          <div className="text-4xl font-bold gradient-text">₩{totalSales.toLocaleString()}k</div>
        </Card>
        <Card className="glass p-6">
          <div className="text-sm text-muted-foreground mb-1">
            {t("dashboardFeatures.demandForecast.avgConversion")}
          </div>
          <div className="text-4xl font-bold gradient-text">{avgConversion}%</div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="glass p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--foreground))" />
            <YAxis yAxisId="left" stroke="hsl(var(--primary))" />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--secondary))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name={t("dashboardFeatures.demandForecast.chartLabels.sales")}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="conversion"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              name={t("dashboardFeatures.demandForecast.chartLabels.conversion")}
              dot={{ fill: "hsl(var(--secondary))", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
