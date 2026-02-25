import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, Sparkles } from 'lucide-react';

interface ModelAnalysis {
  matched_entity_type: any;
  confidence: number;
  inferred_type: string;
  suggested_dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  reasoning: string;
  fileName: string;
  fileUrl: string;
}

interface AutoModelMapperProps {
  analysis: ModelAnalysis;
  onAccept: () => void;
  onReject: () => void;
}

export function AutoModelMapper({ analysis, onAccept, onReject }: AutoModelMapperProps) {
  const { toast } = useToast();
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    try {
      if (!analysis.matched_entity_type) {
        throw new Error('매칭된 엔티티 타입이 없습니다');
      }

      // Update the entity type with the 3D model URL and dimensions
      const { error } = await supabase
        .from('ontology_entity_types')
        .update({
          model_3d_url: analysis.fileUrl,
          model_3d_dimensions: analysis.suggested_dimensions,
          updated_at: new Date().toISOString()
        })
        .eq('id', analysis.matched_entity_type.id);

      if (error) throw error;

      toast({
        title: "자동 매핑 완료",
        description: `${analysis.matched_entity_type.label}에 3D 모델이 할당되었습니다`,
      });

      onAccept();
    } catch (error) {
      console.error('Auto mapping error:', error);
      toast({
        title: "매핑 실패",
        description: error instanceof Error ? error.message : "매핑에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  const confidenceColor = 
    analysis.confidence >= 0.8 ? 'bg-green-500' :
    analysis.confidence >= 0.5 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <Card className="border-2 border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>AI 자동 매핑 제안</CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={`${confidenceColor} text-white`}
          >
            신뢰도: {(analysis.confidence * 100).toFixed(0)}%
          </Badge>
        </div>
        <CardDescription>
          AI가 3D 모델을 분석하여 온톨로지 스키마와 자동 매칭했습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">파일명</p>
            <p className="font-medium">{analysis.fileName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">추론된 타입</p>
            <p className="font-medium">{analysis.inferred_type}</p>
          </div>
        </div>

        {analysis.matched_entity_type && (
          <div className="p-4 bg-accent/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{analysis.matched_entity_type.label}</p>
                <p className="text-sm text-muted-foreground">{analysis.matched_entity_type.name}</p>
              </div>
              <Badge>{analysis.matched_entity_type.model_3d_type || 'N/A'}</Badge>
            </div>
            <p className="text-sm">{analysis.matched_entity_type.description}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">제안된 크기 (미터)</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-muted rounded">
              <p className="text-muted-foreground">폭</p>
              <p className="font-medium">{analysis.suggested_dimensions.width}m</p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="text-muted-foreground">높이</p>
              <p className="font-medium">{analysis.suggested_dimensions.height}m</p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="text-muted-foreground">깊이</p>
              <p className="font-medium">{analysis.suggested_dimensions.depth}m</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded text-sm">
          <p className="font-medium mb-1">분석 근거:</p>
          <p className="text-muted-foreground">{analysis.reasoning}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApply}
            disabled={applying}
            className="flex-1"
          >
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                적용 중...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                매핑 적용
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onReject}
            disabled={applying}
          >
            <X className="w-4 h-4 mr-2" />
            거부
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
