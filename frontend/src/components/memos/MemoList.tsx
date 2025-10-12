"use client";

import { useState, useEffect } from "react";
import { MemoForm } from "./MemoForm";
import { MemoItem } from "./MemoItem";
import { BaseMemo, CreateMemoRequest, UpdateMemoRequest } from "@/types/memo";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface MemoListProps {
  entityType: "customer" | "job_posting" | "job_seeking" | "matching" | "user";
  entityId?: number;
  endpoint: string;
}

export function MemoList({ entityType, entityId, endpoint }: MemoListProps) {
  const [memos, setMemos] = useState<BaseMemo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMemos();
  }, [endpoint]);

  const fetchMemos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<BaseMemo[]>(endpoint);
      setMemos(response.data);

      logger.info(`Fetched ${response.data.length} memos`, { entityType, entityId });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logger.error(`Failed to fetch memos for ${entityType}`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (content: string) => {
    try {
      setIsAdding(true);
      setError(null);

      const request: CreateMemoRequest = {
        memo_content: content,
      };

      const response = await apiClient.post<BaseMemo>(endpoint, request);
      setMemos([response.data, ...memos]);

      logger.userAction(`Added memo to ${entityType}`, { entityId });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logger.error(`Failed to add memo to ${entityType}`, err);
      throw err;
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = async (id: number, content: string) => {
    try {
      setEditingId(id);
      setError(null);

      const request: UpdateMemoRequest = {
        memo_content: content,
      };

      const response = await apiClient.put<BaseMemo>(`${endpoint}/${id}`, request);
      setMemos(memos.map((memo) => (memo.id === id ? response.data : memo)));

      logger.userAction(`Edited memo in ${entityType}`, { entityId, memoId: id });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logger.error(`Failed to edit memo in ${entityType}`, err);
      throw err;
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      setError(null);

      await apiClient.delete(`${endpoint}/${id}`);
      setMemos(memos.filter((memo) => memo.id !== id));

      logger.userAction(`Deleted memo from ${entityType}`, { entityId, memoId: id });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logger.error(`Failed to delete memo from ${entityType}`, err);
      throw err;
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4"></div>
          <div className="h-24 bg-muted rounded-lg mb-4"></div>
          <div className="h-24 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <MemoForm onAdd={handleAdd} isAdding={isAdding} />

      <div className="space-y-3">
        {memos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">메모가 없습니다.</p>
            <p className="text-xs mt-1">위 버튼을 클릭하여 첫 메모를 추가하세요.</p>
          </div>
        ) : (
          memos.map((memo) => (
            <MemoItem
              key={memo.id}
              memo={memo}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isEditing={editingId === memo.id}
              isDeleting={deletingId === memo.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
