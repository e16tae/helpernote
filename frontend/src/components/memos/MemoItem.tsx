import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Save, X } from "lucide-react";
import { BaseMemo } from "@/types/memo";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface MemoItemProps {
  memo: BaseMemo;
  onEdit: (id: number, content: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isEditing?: boolean;
  isDeleting?: boolean;
}

export function MemoItem({ memo, onEdit, onDelete, isEditing, isDeleting }: MemoItemProps) {
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(memo.memo_content);

  const handleSave = async () => {
    if (editContent.trim()) {
      await onEdit(memo.id, editContent);
      setEditMode(false);
    }
  };

  const handleCancel = () => {
    setEditContent(memo.memo_content);
    setEditMode(false);
  };

  const handleDelete = async () => {
    if (window.confirm("메모를 삭제하시겠습니까?")) {
      await onDelete(memo.id);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {editMode ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="resize-none"
              placeholder="메모 내용을 입력하세요"
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isEditing}
              >
                <X className="h-4 w-4 mr-1" aria-hidden="true" />
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isEditing || !editContent.trim()}
              >
                <Save className="h-4 w-4 mr-1" aria-hidden="true" />
                {isEditing ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm whitespace-pre-wrap">{memo.memo_content}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {format(new Date(memo.created_at), "PPP p", { locale: ko })}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditMode(true)}
                  disabled={isEditing || isDeleting}
                  aria-label="메모 수정"
                >
                  <Edit className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={isEditing || isDeleting}
                  aria-label="메모 삭제"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
