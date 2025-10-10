export interface Tag {
  id: number;
  user_id: number;
  tag_name: string;
  tag_color: string;
  description?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Compatibility aliases
  name?: string; // Alias for tag_name
  color?: string; // Alias for tag_color
}

export interface CreateTagRequest {
  tag_name: string;
  tag_color?: string;
  description?: string;
}

export interface UpdateTagRequest {
  tag_name?: string;
  tag_color?: string;
  description?: string;
}

export interface TagResponse {
  tag: Tag;
}

export interface TagsListResponse {
  tags: Tag[];
  total: number;
}
