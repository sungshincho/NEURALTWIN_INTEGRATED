import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle2, Clock, Building2, Store } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Message {
  id: string;
  from: "store" | "hq";
  content: string;
  status: "pending" | "approved" | "rejected";
  timestamp: Date;
}

export const HQStoreSync = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      from: "store",
      content: "신상품 진열 위치 변경 요청",
      status: "approved",
      timestamp: new Date(Date.now() - 3600000),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      from: "store",
      content: newMessage,
      status: "pending",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
    setIsSyncing(true);
    setSyncProgress(0);

    // Simulate sync progress
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          // Auto-approve after sync
          setMessages((msgs) =>
            msgs.map((m) =>
              m.id === message.id ? { ...m, status: "approved" } : m
            )
          );
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const getStatusBadge = (status: Message["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            대기중
          </Badge>
        );
      case "approved":
        return (
          <Badge className="gap-1 bg-green-500/20 text-green-500 border-green-500/50">
            <CheckCircle2 className="w-3 h-3" />
            승인
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            거절
          </Badge>
        );
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}초 전`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    return `${hours}시간 전`;
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Communication Flow */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">실시간 커뮤니케이션</h4>
            <Badge variant="secondary" className="gap-1">
              <Clock className="w-3 h-3" />
              평균 1분 내 승인
            </Badge>
          </div>

          <div className="glass rounded-xl p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={`p-4 space-y-3 ${
                  message.from === "store" ? "ml-4" : "mr-4"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {message.from === "store" ? (
                      <Store className="w-4 h-4 text-primary" />
                    ) : (
                      <Building2 className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-sm font-semibold">
                      {message.from === "store" ? "매장" : "본사"}
                    </span>
                  </div>
                  {getStatusBadge(message.status)}
                </div>

                <p className="text-sm">{message.content}</p>

                <div className="text-xs text-muted-foreground">
                  {getTimeAgo(message.timestamp)}
                </div>

                {message.status === "pending" && isSyncing && (
                  <div className="space-y-2">
                    <Progress value={syncProgress} className="h-1" />
                    <p className="text-xs text-muted-foreground">
                      본사 승인 대기중... {syncProgress}%
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="변경 요청 메시지 입력..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isSyncing}
            />
            <Button onClick={handleSendMessage} disabled={isSyncing || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metrics & Benefits */}
        <div className="space-y-4">
          <h4 className="font-semibold">개선 효과</h4>

          <div className="grid grid-cols-2 gap-4">
            <Card className="glass p-4">
              <div className="text-sm text-muted-foreground mb-1">기존 프로세스</div>
              <div className="text-3xl font-bold text-muted-foreground line-through">
                24h
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                이메일/전화 → 회의 → 승인
              </p>
            </Card>

            <Card className="glass p-4 border-primary/50">
              <div className="text-sm text-muted-foreground mb-1">NEURALTWIN</div>
              <div className="text-3xl font-bold text-primary">1분</div>
              <p className="text-xs text-muted-foreground mt-2">
                실시간 동기화 & 자동 승인
              </p>
            </Card>

            <Card className="glass p-4">
              <div className="text-sm text-muted-foreground mb-1">월간 요청 건수</div>
              <div className="text-2xl font-bold">245건</div>
            </Card>

            <Card className="glass p-4">
              <div className="text-sm text-muted-foreground mb-1">시간 절감</div>
              <div className="text-2xl font-bold text-green-500">98.9%</div>
            </Card>
          </div>

          <Card className="glass p-4 space-y-3">
            <h5 className="text-sm font-semibold">주요 기능</h5>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>레이아웃 변경 요청 & 즉시 승인</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>재고 이동 및 프로모션 조율</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>실시간 KPI 공유 & 피드백</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>AI 기반 자동 의사결정 제안</span>
              </li>
            </ul>
          </Card>

          <Card className="glass p-4 bg-primary/5 border-primary/20">
            <p className="text-sm">
              <span className="font-semibold">ROI:</span> 매장당 연간{" "}
              <span className="text-primary font-bold">3,500만원</span> 운영비 절감
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
