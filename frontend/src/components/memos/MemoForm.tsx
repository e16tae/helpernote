import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface MemoFormProps {
  onAdd: (content: string) => Promise<void>;
  isAdding?: boolean;
}

export function MemoForm({ onAdd, isAdding }: MemoFormProps) {
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      await onAdd(content.trim());
      setContent("");
      setShowForm(false);
    }
  };

  const handleCancel = () => {
    setContent("");
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <Button
        variant="outline"
        onClick={() => setShowForm(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        메모 추가
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">새 메모</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="메모 내용을 입력하세요..."
            rows={4}
            className="resize-none"
            disabled={isAdding}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isAdding}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isAdding || !content.trim()}
            >
              {isAdding ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
