export interface CustomerFile {
  id: number;
  customer_id: number;
  file_path: string;
  file_type: string;
  file_size: number | null;
  original_filename: string | null;
  mime_type: string | null;
  is_profile: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UploadFileResponse {
  file_id: number;
  file_path: string;
  file_url: string;
}

export interface ListFilesResponse {
  files: CustomerFile[];
}
