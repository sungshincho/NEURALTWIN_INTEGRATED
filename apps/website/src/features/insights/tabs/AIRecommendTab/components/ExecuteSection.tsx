/**
 * ExecuteSection.tsx
 *
 * 4단계: 실행 섹션
 * 3D Glassmorphism + Monochrome
 */

import { useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Edit,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import type { Campaign, CampaignStatus } from '../types/aiDecision.types';
import { formatCurrency } from '../../../components';
import { useDarkMode } from '@/hooks/useDarkMode';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';

// ============================================================================
// 3D 스타일 시스템
// ============================================================================
const getText3D = (isDark: boolean) => ({
  number: isDark ? {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0c',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, color: '#515158',
  } as React.CSSProperties,
});

const Badge3D = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', padding: '4px 10px',
    background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: '8px', border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
    fontSize: '11px', fontWeight: 600,
  }}>
    {children}
  </div>
);

// Canvas 프로그레스 바
const GlowProgressBar = ({ progress, isDark }: { progress: number; isDark: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = 8;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 4);
    ctx.fill();

    const fillW = (progress / 100) * width;
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(0, 0, fillW, 0);
      if (isDark) {
        grad.addColorStop(0, 'rgba(255,255,255,0.2)');
        grad.addColorStop(1, 'rgba(255,255,255,0.6)');
      } else {
        grad.addColorStop(0, 'rgba(0,0,0,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0.45)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, 0, fillW, height, 4);
      ctx.fill();

      const glow = ctx.createRadialGradient(fillW, height / 2, 0, fillW, height / 2, 5);
      const gc = isDark ? '255,255,255' : '0,0,0';
      glow.addColorStop(0, `rgba(${gc},0.35)`);
      glow.addColorStop(1, `rgba(${gc},0)`);
      ctx.beginPath();
      ctx.arc(fillW, height / 2, 5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }
  }, [progress, isDark]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 8, display: 'block' }} />;
};

const statusLabels: Record<CampaignStatus, string> = {
  scheduled: '예정',
  active: '실행 중',
  paused: '일시정지',
  completed: '완료',
  cancelled: '취소됨',
};

interface ExecuteSectionProps {
  campaigns: Campaign[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onStop: (id: string) => void;
  onEdit: (id: string) => void;
  isLoading?: boolean;
}

export function ExecuteSection({
  campaigns,
  onPause,
  onResume,
  onStop,
  onEdit,
  isLoading,
}: ExecuteSectionProps) {
  const isDark = useDarkMode();

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';
  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'paused');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 섹션 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: isDark ? '#fff' : '#374151',
        }}>4</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>실행 이력 (Execute)</h3>
      </div>

      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          {/* 카드 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Icon3D size={36} dark={isDark}>
              <Play className="h-4 w-4" style={{ color: iconColor }} />
            </Icon3D>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>현재 실행 중</h4>
            {activeCampaigns.length > 0 && (
              <Badge3D dark={isDark}>
                <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>{activeCampaigns.length}</span>
              </Badge3D>
            )}
          </div>

          {/* 캠페인 목록 */}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse" style={{
                  padding: '16px', borderRadius: '16px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                }}>
                  <div style={{ height: '24px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', width: '33%', marginBottom: '8px' }} />
                  <div style={{ height: '8px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', width: '100%', marginBottom: '12px' }} />
                  <div style={{ height: '16px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', width: '66%' }} />
                </div>
              ))}
            </div>
          ) : activeCampaigns.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  isDark={isDark}
                  text3D={text3D}
                  iconColor={iconColor}
                  onPause={() => onPause(campaign.id)}
                  onResume={() => onResume(campaign.id)}
                  onStop={() => onStop(campaign.id)}
                  onEdit={() => onEdit(campaign.id)}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Play className="h-12 w-12" style={{ margin: '0 auto 12px', color: isDark ? 'rgba(255,255,255,0.3)' : '#d1d5db' }} />
              <p style={{ fontSize: '14px', ...text3D.body }}>실행 중인 캠페인이 없습니다</p>
              <p style={{ fontSize: '12px', marginTop: '4px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
                AI 추천 전략을 실행해보세요
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// 캠페인 카드 컴포넌트
interface CampaignCardProps {
  campaign: Campaign;
  isDark: boolean;
  text3D: ReturnType<typeof getText3D>;
  iconColor: string;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onEdit: () => void;
}

function CampaignCard({
  campaign,
  isDark,
  text3D,
  iconColor,
  onPause,
  onResume,
  onStop,
  onEdit,
}: CampaignCardProps) {
  const roiDiff = campaign.currentROI - campaign.expectedROI;
  const startDate = new Date(campaign.startDate);
  const endDate = new Date(campaign.endDate);

  const IconButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      style={{
        width: '28px', height: '28px', borderRadius: '6px',
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      padding: '16px', borderRadius: '16px',
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge3D dark={isDark}>
            <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>{statusLabels[campaign.status]}</span>
          </Badge3D>
          <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{campaign.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {campaign.status === 'active' ? (
            <IconButton onClick={onPause}><Pause className="h-3 w-3" style={{ color: iconColor }} /></IconButton>
          ) : campaign.status === 'paused' ? (
            <IconButton onClick={onResume}><Play className="h-3 w-3" style={{ color: iconColor }} /></IconButton>
          ) : null}
          <IconButton onClick={onStop}><Square className="h-3 w-3" style={{ color: iconColor }} /></IconButton>
          <IconButton onClick={onEdit}><Edit className="h-3 w-3" style={{ color: iconColor }} /></IconButton>
        </div>
      </div>

      {/* 기간 및 진행률 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', ...text3D.body }}>
          <span>시작: {startDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
          <span>진행률: {campaign.progress}%</span>
          <span>종료: {endDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
        </div>
        <GlowProgressBar progress={campaign.progress} isDark={isDark} />
      </div>

      {/* 성과 지표 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
        padding: '12px', borderRadius: '12px',
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '10px', marginBottom: '4px', ...text3D.body }}>현재 매출</p>
          <p style={{ fontSize: '13px', margin: 0, fontWeight: 700, color: isDark ? '#fff' : '#1a1a1f' }}>
            {formatCurrency(campaign.metrics.revenue)}
          </p>
        </div>
        <div style={{ textAlign: 'center', borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)', borderRight: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '10px', marginBottom: '4px', ...text3D.body }}>전환</p>
          <p style={{ fontSize: '13px', margin: 0, fontWeight: 700, color: isDark ? '#fff' : '#1a1a1f' }}>
            {campaign.metrics.conversions.toLocaleString()}건
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '10px', marginBottom: '4px', ...text3D.body }}>현재 ROI</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#fff' : '#1a1a1f' }}>{campaign.currentROI}%</span>
            {roiDiff > 0 ? <TrendingUp className="w-3 h-3" style={{ color: '#22c55e' }} /> :
             roiDiff < 0 ? <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} /> :
             <Minus className="w-3 h-3" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />}
          </div>
        </div>
      </div>

      {/* ROI 비교 */}
      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
        <span style={{ ...text3D.body }}>예상 ROI: {campaign.expectedROI}%</span>
        <span style={{ fontWeight: 600, color: roiDiff > 0 ? '#22c55e' : roiDiff < 0 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.6)' : '#6b7280') }}>
          {roiDiff > 0 ? '+' : ''}{roiDiff.toFixed(0)}%p 차이
        </span>
      </div>
    </div>
  );
}
