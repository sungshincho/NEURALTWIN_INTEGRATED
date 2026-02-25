import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, History, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SchemaVersion {
  id: string;
  version_number: number;
  description: string | null;
  schema_data: any;
  created_at: string;
}

export const SchemaVersionManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);
  const [description, setDescription] = React.useState("");

  const { data: versions, isLoading } = useQuery({
    queryKey: ["schema-versions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_schema_versions")
        .select("*")
        .order("version_number", { ascending: false });

      if (error) throw error;
      return data as SchemaVersion[];
    },
  });

  const { data: entityTypes } = useQuery({
    queryKey: ["entity-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_entity_types")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  const { data: relationTypes } = useQuery({
    queryKey: ["relation-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_relation_types")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  const saveVersionMutation = useMutation({
    mutationFn: async () => {
      const latestVersion = versions?.[0]?.version_number || 0;
      const newVersionNumber = latestVersion + 1;

      const schemaData = {
        entities: entityTypes,
        relations: relationTypes,
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("ontology_schema_versions")
        .insert({
          version_number: newVersionNumber,
          description: description,
          schema_data: schemaData,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schema-versions"] });
      toast({ title: "스키마 버전이 저장되었습니다" });
      setIsOpen(false);
      setDescription("");
    },
    onError: (error) => {
      toast({ title: "오류 발생", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">스키마 버전 관리</h3>
          <p className="text-sm text-muted-foreground">
            현재 스키마를 버전으로 저장하고 이력을 관리합니다
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              현재 스키마 저장
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>스키마 버전 저장</DialogTitle>
              <DialogDescription>
                현재 정의된 엔티티와 관계 타입을 버전으로 저장합니다
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>버전 번호</Label>
                <Input
                  value={`v${(versions?.[0]?.version_number || 0) + 1}`}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label>스키마 구성</Label>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    엔티티 타입: {entityTypes?.length || 0}개
                  </Badge>
                  <Badge variant="outline">
                    관계 타입: {relationTypes?.length || 0}개
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">버전 설명</Label>
                <Textarea
                  id="description"
                  placeholder="이 버전의 변경 사항을 설명하세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                취소
              </Button>
              <Button onClick={() => saveVersionMutation.mutate()}>
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {versions?.map((version) => (
          <Card key={version.id} className="glass-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary">
                      v{version.version_number}
                    </Badge>
                    <CardTitle className="text-base">
                      {version.description || "버전 설명 없음"}
                    </CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {format(new Date(version.created_at), "yyyy-MM-dd HH:mm:ss")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    엔티티: {version.schema_data?.entities?.length || 0}
                  </Badge>
                  <Badge variant="outline">
                    관계: {version.schema_data?.relations?.length || 0}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {versions?.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">아직 저장된 버전이 없습니다</p>
            <Button onClick={() => setIsOpen(true)}>
              <Save className="h-4 w-4 mr-2" />
              첫 버전 저장
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
