/**
 * 범용 메모 인터페이스
 */
export interface BaseMemo {
  id: number;
  memo_content: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * 메모 생성 요청
 */
export interface CreateMemoRequest {
  memo_content: string;
}

/**
 * 메모 수정 요청
 */
export interface UpdateMemoRequest {
  memo_content: string;
}
