'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { jobPostingApi } from '@/lib/job-posting';
import { customerApi } from '@/lib/customer';
import type { JobPosting, PostingStatus, SettlementStatus } from '@/types/job-posting';
import type { Customer } from '@/types/customer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, Star, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import apiClient from '@/lib/api';

interface Tag {
  id: number;
  name: string;
}

const jobPostingSchema = z.object({
  salary: z.string()
    .min(1, '급여를 입력해주세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, '급여는 0 이상의 숫자여야 합니다')
    .refine((val) => Number(val) <= 100000000, '급여는 1억 이하여야 합니다 (100,000,000원)'),
  description: z.string().min(1, '설명을 입력해주세요'),
  employer_fee_rate: z.string().optional(),
  posting_status: z.enum(['published', 'in_progress', 'closed', 'cancelled']),
  settlement_status: z.enum(['unsettled', 'settled']),
  settlement_amount: z.string().optional(),
  settlement_memo: z.string().optional(),
  is_favorite: z.boolean().default(false),
});

type JobPostingFormData = z.infer<typeof jobPostingSchema>;

const postingStatusLabels: Record<PostingStatus, string> = {
  published: '공개',
  in_progress: '진행중',
  closed: '마감',
  cancelled: '취소',
};

const settlement_statusLabels: Record<SettlementStatus, string> = {
  unsettled: '미정산',
  settled: '정산완료',
};

export default function EditJobPostingPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const postingId = params.id as string;

  const form = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      salary: '',
      description: '',
      employer_fee_rate: '',
      posting_status: 'published',
      settlement_status: 'unsettled',
      settlement_amount: '',
      settlement_memo: '',
      is_favorite: false,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load job posting
        const postingData = await jobPostingApi.getJobPostingById(parseInt(postingId));
        setJobPosting(postingData);

        // Load customer
        const customerData = await customerApi.getById(postingData.customer_id);
        setCustomer(customerData);

        // Load tags
        try {
          const allTagsResponse = await apiClient.get('/tags');
          setTags(allTagsResponse.data.tags || []);

          // Try to load posting tags (API may not be implemented yet)
          try {
            const postingTagsResponse = await apiClient.get(`/job-postings/${postingId}/tags`);
            setSelectedTags((postingTagsResponse.data.tags || []).map((t: Tag) => t.id));
          } catch (tagError) {
            // Job posting tag routes not implemented yet, skip
            console.warn('Job posting tag routes not available:', tagError);
          }
        } catch (error) {
          console.error('Failed to load tags:', error);
        }

        // Update form with posting data
        form.reset({
          salary: postingData.salary,
          description: postingData.description,
          employer_fee_rate: postingData.employer_fee_rate || '',
          posting_status: postingData.posting_status,
          settlement_status: postingData.settlement_status,
          settlement_amount: postingData.settlement_amount || '',
          settlement_memo: postingData.settlement_memo || '',
          is_favorite: postingData.is_favorite,
        });
      } catch (error) {
        console.error('Failed to load job posting:', error);
        toast({
          title: '오류',
          description: '구인 공고를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (postingId) {
      loadData();
    }
  }, [postingId, form, toast]);

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const onSubmit = async (data: JobPostingFormData) => {
    try {
      setIsSubmitting(true);

      const submitData = {
        salary: data.salary,
        description: data.description,
        employer_fee_rate: data.employer_fee_rate || undefined,
        posting_status: data.posting_status,
        settlement_status: data.settlement_status,
        settlement_amount: data.settlement_amount || undefined,
        settlement_memo: data.settlement_memo || undefined,
        is_favorite: data.is_favorite,
      };

      await jobPostingApi.updateJobPosting(parseInt(postingId), submitData);

      // Update tags (if API is available)
      if (selectedTags.length > 0) {
        try {
          await apiClient.post(`/job-postings/${postingId}/tags`, {
            tag_ids: selectedTags,
          });
        } catch (error) {
          // Job posting tag routes may not be implemented yet
          console.warn('Failed to update tags (API may not be available):', error);
        }
      }

      toast({
        title: '성공',
        description: '구인 공고가 수정되었습니다.',
      });

      router.push(`/dashboard/job-postings/${postingId}`);
    } catch (error) {
      console.error('Failed to update job posting:', error);
      toast({
        title: '오류',
        description: '공고 수정에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await jobPostingApi.deleteJobPosting(parseInt(postingId));
      toast({
        title: '성공',
        description: '구인 공고가 삭제되었습니다.',
      });
      router.push('/dashboard/job-postings');
    } catch (error) {
      console.error('Failed to delete job posting:', error);
      toast({
        title: '오류',
        description: '공고 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!jobPosting || !customer) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">공고를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push('/dashboard/job-postings')} className="mt-4">
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/job-postings/${postingId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로
          </Button>
        </div>
        <Button
          variant="destructive"
          onClick={handleDeleteClick}
          disabled={isSubmitting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          삭제
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">구인 공고 수정</h1>
        <p className="text-muted-foreground">
          {customer.name} 고객의 구인 공고를 수정합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>공고 정보</CardTitle>
          <CardDescription>
            수정할 항목을 변경하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium">고객 정보</p>
                <p className="text-sm text-muted-foreground">
                  {customer.name} ({customer.phone})
                </p>
              </div>

              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>급여 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3000000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      제시 급여를 숫자로 입력하세요 (원 단위)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="구인 공고 내용을 입력하세요"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employer_fee_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>고용주 수수료율 (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="5.0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      고용주에게 적용될 수수료율 (선택사항, 미입력 시 기본 수수료율 적용)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="posting_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>공고 상태 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(postingStatusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settlement_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>정산 상태 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(settlement_statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settlement_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>정산 금액</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="150000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      정산된 금액을 입력하세요 (원 단위)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settlement_memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>정산 메모</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="정산 관련 메모를 입력하세요"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_favorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        즐겨찾기에 추가
                      </FormLabel>
                      <FormDescription>
                        이 공고를 즐겨찾기에 추가하면 목록에서 쉽게 찾을 수 있습니다
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Tags Section */}
              <div className="space-y-3">
                <FormLabel>태그</FormLabel>
                <FormDescription>
                  이 공고에 연결할 태그를 선택하세요
                </FormDescription>
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    등록된 태그가 없습니다. 태그 관리 페이지에서 태그를 먼저 생성하세요.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                          selectedTags.includes(tag.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/job-postings/${postingId}`)}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      수정 중...
                    </>
                  ) : (
                    '수정'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={deleteDialog} onOpenChange={(open) => !deleting && setDeleteDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공고 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 공고를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(false)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
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
