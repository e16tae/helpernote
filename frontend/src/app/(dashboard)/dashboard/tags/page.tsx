"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, getErrorMessage } from "@/lib/api-client";

interface Tag {
  id: number;
  user_id: number;
  tag_name: string;
  tag_color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export default function TagsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTagId, setDeleteTagId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    tag_name: "",
    tag_color: "#3b82f6",
    description: "",
  });

  // Load tags on mount
  React.useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/tags");
      setTags(response.data.tags || []);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTag) {
        // Update existing tag
        await apiClient.put(`/api/tags/${editingTag.id}`, formData);
        toast({
          title: "성공",
          description: "태그가 수정되었습니다.",
        });
      } else {
        // Create new tag
        await apiClient.post("/api/tags", formData);
        toast({
          title: "성공",
          description: "태그가 생성되었습니다.",
        });
      }

      setShowForm(false);
      setEditingTag(null);
      setFormData({ tag_name: "", tag_color: "#3b82f6", description: "" });
      fetchTags();
    } catch (error) {
      console.error("Failed to save tag:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      tag_name: tag.tag_name,
      tag_color: tag.tag_color,
      description: tag.description || "",
    });
    setShowForm(true);
  };

  const handleDelete = (tagId: number) => {
    setDeleteTagId(tagId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTagId === null) return;

    try {
      await apiClient.delete(`/api/tags/${deleteTagId}`);
      toast({
        title: "성공",
        description: "태그가 삭제되었습니다.",
      });
      fetchTags();
    } catch (error) {
      console.error("Failed to delete tag:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTagId(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTag(null);
    setFormData({ tag_name: "", tag_color: "#3b82f6", description: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">태그 관리</h1>
          <p className="text-muted-foreground">
            고객, 구인/구직 공고에 사용할 태그를 관리합니다
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            새 태그 추가
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTag ? "태그 수정" : "새 태그 추가"}</CardTitle>
            <CardDescription>
              태그 이름과 색상을 설정하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tag_name">태그 이름 *</Label>
                <Input
                  id="tag_name"
                  value={formData.tag_name}
                  onChange={(e) => setFormData({ ...formData, tag_name: e.target.value })}
                  placeholder="예: 긴급, 우선순위, VIP"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tag_color">색상</Label>
                <div className="flex gap-2">
                  <Input
                    id="tag_color"
                    type="color"
                    value={formData.tag_color}
                    onChange={(e) => setFormData({ ...formData, tag_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Badge
                    style={{ backgroundColor: formData.tag_color, color: "#fff" }}
                    className="flex items-center"
                  >
                    {formData.tag_name || "미리보기"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명 (선택)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="태그에 대한 간단한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  취소
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {editingTag ? "수정" : "저장"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>태그 목록</CardTitle>
          <CardDescription>
            등록된 태그 {tags.length}개
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>태그가 없습니다.</p>
              <p className="text-sm mt-1">위 버튼을 클릭하여 첫 태그를 추가하세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Badge
                      style={{ backgroundColor: tag.tag_color, color: "#fff" }}
                      className="text-sm px-3 py-1"
                    >
                      {tag.tag_name}
                    </Badge>
                    <div className="flex-1">
                      {tag.description && (
                        <p className="text-sm text-muted-foreground">
                          {tag.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tag)}
                      aria-label="태그 수정"
                    >
                      <Edit className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag.id)}
                      aria-label="태그 삭제"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="태그 삭제"
        description="정말 이 태그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />
    </div>
  );
}
