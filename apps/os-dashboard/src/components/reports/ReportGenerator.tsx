/**
 * ReportGenerator.tsx
 *
 * PDF Report Generation Controller
 * - Date range selector (7d / 30d / custom)
 * - Print via window.print() with @media print CSS
 * - jsPDF fallback for direct PDF download
 * - Loading state during generation
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Download, Loader2, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useReportData, ReportPeriod } from '@/hooks/useReportData';
import { StoreReport } from './StoreReport';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { toast } from 'sonner';

// ============================================================================
// Print CSS (injected dynamically)
// ============================================================================

const PRINT_STYLES = `
@media print {
  /* Hide everything except the report */
  body > *:not(#report-print-container) {
    display: none !important;
  }
  #report-print-container {
    display: block !important;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
  /* A4 page setup */
  @page {
    size: A4 portrait;
    margin: 0;
  }
  body {
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  /* Ensure backgrounds print */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`;

// ============================================================================
// Dark mode detection
// ============================================================================

const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

// ============================================================================
// Component
// ============================================================================

interface ReportGeneratorProps {
  className?: string;
  variant?: 'button' | 'icon';
}

export function ReportGenerator({ className, variant = 'button' }: ReportGeneratorProps) {
  const [period, setPeriod] = useState<ReportPeriod>('7d');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPrintPortal, setShowPrintPortal] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { selectedStore } = useSelectedStore();
  const reportData = useReportData(period);

  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Inject print styles
  useEffect(() => {
    const styleId = 'report-print-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  const handlePrint = useCallback(async () => {
    if (!selectedStore) {
      toast.error('매장을 먼저 선택해주세요');
      return;
    }

    setIsGenerating(true);
    setShowPrintPortal(true);

    // Wait for render
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      window.print();
      toast.success('리포트가 생성되었습니다');
    } catch (error) {
      console.error('Print failed:', error);
      toast.error('리포트 생성에 실패했습니다');
    } finally {
      setIsGenerating(false);
      setShowPrintPortal(false);
    }
  }, [selectedStore]);

  const handleDownloadPDF = useCallback(async () => {
    if (!selectedStore) {
      toast.error('매장을 먼저 선택해주세요');
      return;
    }

    setIsGenerating(true);

    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const reportEl = reportRef.current;
      if (!reportEl) {
        throw new Error('Report element not found');
      }

      // Use jsPDF html method for rendering
      await doc.html(reportEl, {
        callback: (pdf) => {
          const fileName = `NeuralTwin_StoreReport_${selectedStore.store_name}_${reportData.startDate}_${reportData.endDate}.pdf`;
          pdf.save(fileName);
        },
        x: 0,
        y: 0,
        width: 210,
        windowWidth: reportEl.scrollWidth,
        html2canvas: {
          scale: 0.265, // Scale to fit A4 (210mm)
          useCORS: true,
          logging: false,
        },
      });

      toast.success('PDF가 다운로드되었습니다');
    } catch (error) {
      console.error('PDF generation failed:', error);
      // Fallback to print
      toast.error('PDF 생성 실패. 인쇄 기능을 사용해주세요.');
      handlePrint();
    } finally {
      setIsGenerating(false);
    }
  }, [selectedStore, reportData.startDate, reportData.endDate, handlePrint]);

  const periodLabels: Record<ReportPeriod, string> = {
    '7d': '최근 7일',
    '30d': '최근 30일',
    custom: '직접 설정',
  };

  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPreview(true)}
          disabled={!selectedStore || isGenerating}
          className={className}
          title="리포트 생성"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </Button>
        <ReportPreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          period={period}
          setPeriod={setPeriod}
          reportData={reportData}
          reportRef={reportRef}
          isGenerating={isGenerating}
          isDark={isDark}
          onPrint={handlePrint}
          onDownload={handleDownloadPDF}
        />
        {showPrintPortal && createPortal(
          <div id="report-print-container" style={{ display: 'none' }}>
            <StoreReport data={reportData} />
          </div>,
          document.body
        )}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedStore || isGenerating}
            className={className}
            style={{
              background: isDark
                ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,255,0.8) 100%)',
              border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
              color: isDark ? 'rgba(255,255,255,0.9)' : '#1a1a1f',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.2)'
                : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.8)',
            }}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            리포트 생성
            <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          style={{
            background: isDark
              ? 'linear-gradient(165deg, rgba(20,20,24,0.98) 0%, rgba(14,14,18,0.97) 100%)'
              : 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(250,250,252,0.97) 100%)',
            backdropFilter: 'blur(40px)',
            border: isDark
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.08)',
            boxShadow: isDark
              ? '0 4px 6px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.35)'
              : '0 4px 6px rgba(0,0,0,0.05), 0 10px 20px rgba(0,0,0,0.08)',
          }}
        >
          <DropdownMenuLabel
            className={isDark ? 'text-white/60' : 'text-black/60'}
            style={{ fontSize: '11px' }}
          >
            기간 선택
          </DropdownMenuLabel>
          <DropdownMenuSeparator className={isDark ? 'bg-white/10' : 'bg-black/10'} />

          <DropdownMenuItem
            onClick={() => { setPeriod('7d'); setShowPreview(true); }}
            className={isDark
              ? 'text-white/80 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
              : 'text-black/80 hover:text-black hover:bg-black/5 focus:bg-black/5 focus:text-black'
            }
          >
            <Calendar className="mr-2 h-4 w-4" />
            최근 7일 리포트
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => { setPeriod('30d'); setShowPreview(true); }}
            className={isDark
              ? 'text-white/80 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
              : 'text-black/80 hover:text-black hover:bg-black/5 focus:bg-black/5 focus:text-black'
            }
          >
            <Calendar className="mr-2 h-4 w-4" />
            최근 30일 리포트
          </DropdownMenuItem>

          <DropdownMenuSeparator className={isDark ? 'bg-white/10' : 'bg-black/10'} />

          <DropdownMenuItem
            onClick={() => setShowPreview(true)}
            className={isDark
              ? 'text-white/80 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
              : 'text-black/80 hover:text-black hover:bg-black/5 focus:bg-black/5 focus:text-black'
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            미리보기 & 다운로드
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        period={period}
        setPeriod={setPeriod}
        reportData={reportData}
        reportRef={reportRef}
        isGenerating={isGenerating}
        isDark={isDark}
        onPrint={handlePrint}
        onDownload={handleDownloadPDF}
      />

      {showPrintPortal && createPortal(
        <div id="report-print-container" style={{ display: 'none' }}>
          <StoreReport data={reportData} />
        </div>,
        document.body
      )}
    </>
  );
}

// ============================================================================
// Preview Dialog
// ============================================================================

interface ReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: ReportPeriod;
  setPeriod: (period: ReportPeriod) => void;
  reportData: ReturnType<typeof useReportData>;
  reportRef: React.RefObject<HTMLDivElement>;
  isGenerating: boolean;
  isDark: boolean;
  onPrint: () => void;
  onDownload: () => void;
}

function ReportPreviewDialog({
  open,
  onOpenChange,
  period,
  setPeriod,
  reportData,
  reportRef,
  isGenerating,
  isDark,
  onPrint,
  onDownload,
}: ReportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          background: isDark ? '#1a1a22' : '#f5f5f8',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <DialogHeader>
          <DialogTitle className={isDark ? 'text-white' : 'text-black'}>
            매장 진단 리포트
          </DialogTitle>
          <DialogDescription className={isDark ? 'text-white/60' : 'text-black/60'}>
            {reportData.storeName} | {reportData.periodLabel}
          </DialogDescription>
        </DialogHeader>

        {/* Period selector */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            기간:
          </span>
          {(['7d', '30d'] as ReportPeriod[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className="h-7 text-xs"
              style={
                period === p
                  ? {
                      background: '#1a1a2e',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }
                  : {
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      border: isDark
                        ? '1px solid rgba(255,255,255,0.1)'
                        : '1px solid rgba(0,0,0,0.08)',
                    }
              }
            >
              {p === '7d' ? '7일' : '30일'}
            </Button>
          ))}

          <div className="flex-1" />

          {/* Download buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            disabled={isGenerating || reportData.isLoading}
            className="h-7 text-xs"
          >
            <FileText className="h-3 w-3 mr-1" />
            인쇄
          </Button>
          <Button
            size="sm"
            onClick={onDownload}
            disabled={isGenerating || reportData.isLoading}
            className="h-7 text-xs"
            style={{
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            PDF 다운로드
          </Button>
        </div>

        {/* Report Preview */}
        <div
          className="overflow-auto border rounded-lg"
          style={{
            maxHeight: '65vh',
            background: '#ffffff',
            border: '1px solid #e5e5ea',
            transform: 'scale(0.75)',
            transformOrigin: 'top center',
            marginBottom: '-15vh',
          }}
        >
          {reportData.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">데이터를 불러오는 중...</span>
            </div>
          ) : (
            <StoreReport ref={reportRef} data={reportData} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReportGenerator;
