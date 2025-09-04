export interface GhostSecurityConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface PaginatedResponse<T> {
  has_more: boolean;
  items: T[];
  next_cursor?: string;
}

export interface Finding {
  id: string;
  name: string;
  description: string;
  severity: string;
  status: string;
  confidence: string;
  class: string;
  agent_name: string;
  attack_feasibility: string;
  endpoint_method?: string;
  endpoint_path?: string;
  location?: {
    file_path: string;
    line: number;
    hash?: string;
    url?: string;
  };
  repo_url?: string;
  repo_id?: string;
  vulnerable_code_block?: string;
  fixed_code_block?: string;
  attack_walkthrough?: string;
  remediation?: string;
  created_at: string;
  updated_at: string;
}

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  description?: string;
  primary_language?: string;
  primary_framework?: string;
  findings_count: number;
  endpoints_count: number;
  last_committed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Endpoint {
  id: string;
  method: string;
  path: string;
  description?: string;
  repository_id: string;
  created_at: string;
  updated_at: string;
}

export interface FindingsQueryParams {
  cursor?: string;
  sort?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
  size?: number;
  mode?: ResponseMode;
  fields?: string[];
}

export interface RepositoriesQueryParams {
  cast?: 'supported' | 'unsupported' | 'all';
  cursor?: string;
  sort?: 'created_at' | 'updated_at' | 'last_committed_at';
  order?: 'asc' | 'desc';
  size?: number;
}

export interface UpdateFindingStatusRequest {
  user_status: string;
}

export type ResponseMode = 'summary' | 'detailed' | 'count';

export interface CountResponse {
  total_count: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  by_class: Record<string, number>;
  by_repo: Record<string, number>;
}

export interface SummaryFinding {
  id: string;
  name: string;
  severity: string;
  status: string;
  class: string;
  location?: {
    file_path: string;
    line: number;
  };
  created_at: string;
}