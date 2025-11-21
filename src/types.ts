export interface GhostSecurityConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface PaginatedResponse<T> {
  has_more: boolean;
  items: T[];
  next_cursor?: string;
  total?: number;
}

export interface Finding {
  id: string;
  status: string;
  user_status: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  repo?: {
    id: string;
    name: string;
    url: string;
  };
  project?: {
    id: string;
    name: string;
  };
  agent?: {
    name: string;
    description: string;
    vector: string;
  };
  details: {
    title: string;
    description: string;
    severity: string;
    code?: string;
    fixed_code?: string;
    remediation?: string;
    remediation_effort?: string;
    exploit_feasibility?: string;
    exploit_walkthrough?: string;
    location?: {
      file_path?: string;
      line_number?: number;
      class_name?: string;
      method_name?: string;
      url?: string;
    };
    endpoint?: {
      id?: string;
      method?: string;
      path_template?: string;
      authn?: { implemented: boolean };
      authz?: { implemented: boolean };
    };
    supporting_files?: Array<{
      file_path: string;
      line_number: number;
      class_name?: string;
      method_name?: string;
      url?: string;
    }>;
    validation_evidence?: Array<{
      criteria: string;
      rationale: string;
    }>;
  };
  scan_details?: {
    scan_id: string;
    analyzed_at: string;
    verified_at?: string;
    rejected_at?: string;
  };
}

export interface Framework {
  name: string;
  language: string;
}

export interface Project {
  id: string;
  relative_path: string;
  primary_language?: string;
  primary_framework?: string;
  size: number;
  cast_scan_enabled: boolean;
  findings_count: number;
  last_scanned_at?: string;
  last_scan_id?: string;
  last_scan_status?: string;
  enabled: boolean;
  purpose?: string;
  has_custom_metadata: boolean;
  repo?: {
    id: string;
    name: string;
    url: string;
  };
}

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  description?: string;
  url?: string;
  clone_url?: string;
  organization_id?: string;
  installation_id?: string;
  provider?: string;
  provider_id?: string;
  archived?: boolean;
  private?: boolean;
  size?: number;
  last_commit_hash?: string;
  last_commit_hash_link?: string;
  last_committed_at?: string;
  default_branch_name?: string;
  summary?: string;
  languages?: Record<string, any>;
  cast_scan_enabled?: boolean;
  scan_branch?: string;
  projects?: Project[];
  created_at: string;
  updated_at: string;
}

// Endpoint interface is kept for compatibility, though might not be directly used in V2 top-level endpoints
export interface Endpoint {
  method: string;
  path: string;
  path_template?: string;
  auth_n?: boolean;
  auth_z?: boolean;
  authn?: {
    implemented: boolean;
    [key: string]: any;
  };
  authz?: {
    implemented: boolean;
    [key: string]: any;
  };
}

export interface FindingsQueryParams {
  cursor?: string;
  sort?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
  size?: number;
  mode?: ResponseMode;
  fields?: string[];
  status?: string;
  repo_id?: string;
  project_id?: string;
}

export interface RepositoriesQueryParams {
  cursor?: string;
  sort?: 'created_at' | 'updated_at' | 'last_committed_at';
  order?: 'asc' | 'desc';
  size?: number;
}

export interface UpdateFindingStatusRequest {
  user_status: string;
  repo_id: string;
  project_id: string;
}

export type ResponseMode = 'summary' | 'detailed' | 'count';

export interface CountResponse {
  total_count: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  by_title: Record<string, number>; // Replaced by_class with by_title as class is not top-level in V2
  by_repo: Record<string, number>;
}

export interface SummaryFinding {
  id: string;
  title: string;
  severity: string;
  status: string;
  location?: {
    file_path?: string;
    line_number?: number;
  };
  created_at: string;
}
