'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Edit, Trash2, Tag as TagIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { tagApi } from '@/lib/tag';
import { Tag } from '@/types/tag';

// Preset colors for quick selection
const PRESET_COLORS = [
  { name: '회색', value: '#6B7280' },
  { name: '빨강', value: '#EF4444' },
  { name: '주황', value: '#F97316' },
  { name: '노랑', value: '#EAB308' },
  { name: '초록', value: '#22C55E' },
  { name: '파랑', value: '#3B82F6' },
  { name: '남색', value: '#6366F1' },
  { name: '보라', value: '#A855F7' },
  { name: '분홍', value: '#EC4899' },
];

export default function TagsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; tag: Tag | null }>({ open: false, tag: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tag: Tag | null }>({ open: false, tag: null });

  // Form state for create
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6B7280');
  const [newTagDescription, setNewTagDescription] = useState('');

  // Form state for edit
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('#6B7280');
  const [editTagDescription, setEditTagDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await tagApi.list();
      setTags(response.tags || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
      toast({
        title: '오류',
        description: '태그 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewTagName('');
    setNewTagColor('#6B7280');
    setNewTagDescription('');
  };

  const handleCreate = async () => {
    if (!newTagName.trim()) return;

    try {
      setSubmitting(true);
      await tagApi.create({
        tag_name: newTagName,
        tag_color: newTagColor,
        description: newTagDescription.trim() || undefined,
      });
      toast({
        title: '성공',
        description: '태그가 생성되었습니다.',
      });
      resetCreateForm();
      setCreateDialog(false);
      await loadTags();
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast({
        title: '오류',
        description: '태그 생성에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editDialog.tag || !editTagName.trim()) return;

    try {
      setSubmitting(true);
      await tagApi.update(editDialog.tag.id, {
        tag_name: editTagName,
        tag_color: editTagColor,
        description: editTagDescription.trim() || undefined,
      });
      toast({
        title: '성공',
        description: '태그가 수정되었습니다.',
      });
      setEditDialog({ open: false, tag: null });
      await loadTags();
    } catch (error) {
      console.error('Failed to update tag:', error);
      toast({
        title: '오류',
        description: '태그 수정에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.tag) return;

    try {
      setSubmitting(true);
      await tagApi.delete(deleteDialog.tag.id);
      toast({
        title: '성공',
        description: '태그가 삭제되었습니다.',
      });
      setDeleteDialog({ open: false, tag: null });
      await loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast({
        title: '오류',
        description: '태그 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (tag: Tag) => {
    setEditTagName(tag.tag_name);
    setEditTagColor(tag.tag_color || '#6B7280');
    setEditTagDescription(tag.description || '');
    setEditDialog({ open: true, tag });
  };

  const openCreateDialog = () => {
    resetCreateForm();
    setCreateDialog(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">태그 관리</h1>
          <p className="text-muted-foreground">
            고객 및 공고에 사용할 태그를 관리합니다
          </p>
        </div>
        <Button onClick={openCreateDialog} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          새 태그 생성
        </Button>
      </div>

      {loading ? (
        <Card className="border-2">
          <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>등록된 태그</CardTitle>
            <CardDescription>
              총 {tags.length}개의 태그가 등록되어 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">태그명</TableHead>
                  <TableHead className="font-semibold">색상</TableHead>
                  <TableHead className="font-semibold">설명</TableHead>
                  <TableHead className="font-semibold">생성일</TableHead>
                  <TableHead className="text-right font-semibold">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      등록된 태그가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  tags.map((tag) => (
                    <TableRow key={tag.id} className="hover:bg-accent/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: tag.tag_color || '#6B7280' }}
                          />
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: tag.tag_color + '20',
                              borderColor: tag.tag_color,
                              color: tag.tag_color,
                            }}
                          >
                            {tag.tag_name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {tag.tag_color || '#6B7280'}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {tag.description || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(tag.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(tag)}
                            aria-label={`${tag.tag_name} 태그 수정`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, tag })}
                            aria-label={`${tag.tag_name} 태그 삭제`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 태그 생성</DialogTitle>
            <DialogDescription>
              새로운 태그를 생성합니다. 태그명과 색상을 지정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_tag_name">태그명 *</Label>
              <Input
                id="new_tag_name"
                placeholder="예: VIP 고객"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>

            <div className="space-y-2">
              <Label>태그 색상</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_COLORS.map((color) => (
                  <Button
                    key={color.value}
                    type="button"
                    variant="outline"
                    size="icon"
                    className={`w-10 h-10 rounded-md border-2 transition-all ${
                      newTagColor === color.value
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewTagColor(color.value)}
                    title={color.name}
                    aria-label={`색상 선택: ${color.name}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  placeholder="#6B7280"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_tag_description">설명 (선택)</Label>
              <Textarea
                id="new_tag_description"
                placeholder="이 태그에 대한 설명을 입력하세요"
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <Label className="text-xs text-muted-foreground mb-2 block">미리보기</Label>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: newTagColor + '20',
                  borderColor: newTagColor,
                  color: newTagColor,
                }}
              >
                {newTagName || '태그명'}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialog(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newTagName.trim() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '생성'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !submitting && setEditDialog({ open, tag: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>태그 수정</DialogTitle>
            <DialogDescription>
              태그 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_tag_name">태그명 *</Label>
              <Input
                id="edit_tag_name"
                placeholder="예: VIP 고객"
                value={editTagName}
                onChange={(e) => setEditTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              />
            </div>

            <div className="space-y-2">
              <Label>태그 색상</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_COLORS.map((color) => (
                  <Button
                    key={color.value}
                    type="button"
                    variant="outline"
                    size="icon"
                    className={`w-10 h-10 rounded-md border-2 transition-all ${
                      editTagColor === color.value
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setEditTagColor(color.value)}
                    title={color.name}
                    aria-label={`색상 선택: ${color.name}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={editTagColor}
                  onChange={(e) => setEditTagColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={editTagColor}
                  onChange={(e) => setEditTagColor(e.target.value)}
                  placeholder="#6B7280"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_tag_description">설명 (선택)</Label>
              <Textarea
                id="edit_tag_description"
                placeholder="이 태그에 대한 설명을 입력하세요"
                value={editTagDescription}
                onChange={(e) => setEditTagDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <Label className="text-xs text-muted-foreground mb-2 block">미리보기</Label>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: editTagColor + '20',
                  borderColor: editTagColor,
                  color: editTagColor,
                }}
              >
                {editTagName || '태그명'}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, tag: null })}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editTagName.trim() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  수정 중...
                </>
              ) : (
                '수정'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !submitting && setDeleteDialog({ open, tag: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>태그 삭제</DialogTitle>
            <DialogDescription>
              정말로 &ldquo;{deleteDialog.tag?.tag_name}&rdquo; 태그를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, tag: null })}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
