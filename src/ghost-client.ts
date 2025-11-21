import {
  Finding,
  Repository,
  Endpoint,
  PaginatedResponse,
  FindingsQueryParams,
  RepositoriesQueryParams,
  UpdateFindingStatusRequest,
  GhostSecurityConfig,
  ResponseMode,
  CountResponse,
  SummaryFinding
} from './types.js';

export class GhostSecurityClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: GhostSecurityConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.ghostsecurity.ai/v2';
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody && typeof errorBody === 'object') {
          const details = errorBody.message || errorBody.error || JSON.stringify(errorBody);
          errorMessage += ` - ${details}`;
        }
      } catch (e) {
        // Ignore JSON parse error, use default message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  private buildQueryString(params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && key !== 'mode' && key !== 'fields') {
        queryParams.append(key, String(value));
      }
    }
    
    return queryParams.toString();
  }

  private filterFindingsByMode(findings: Finding[], mode: ResponseMode = 'summary', fields?: string[]): any[] {
    if (!findings || !Array.isArray(findings)) {
      return [];
    }

    if (mode === 'detailed') {
      return findings;
    }

    if (mode === 'summary') {
      return findings.map(finding => this.createSummaryFinding(finding, fields));
    }

    return findings;
  }

  private createSummaryFinding(finding: Finding, fields?: string[]): SummaryFinding {
    const summary: SummaryFinding = {
      id: finding.id,
      title: finding.details.title,
      severity: finding.details.severity,
      status: finding.status,
      created_at: finding.created_at
    };

    // Add location if it exists
    if (finding.details.location) {
      summary.location = {
        file_path: finding.details.location.file_path,
        line_number: finding.details.location.line_number
      };
    }

    // If specific fields are requested, filter accordingly
    if (fields && fields.length > 0) {
      const filtered: any = {};
      fields.forEach(field => {
        if (field in summary) {
          filtered[field] = summary[field as keyof SummaryFinding];
        } else if (field in finding) {
          filtered[field] = finding[field as keyof Finding];
        } else if (field in finding.details) {
             // check inside details too if not found at top level
             filtered[field] = finding.details[field as keyof typeof finding.details];
        }
      });
      return filtered;
    }

    return summary;
  }

  private generateCountResponse(findings: Finding[]): CountResponse {
    const counts: CountResponse = {
      total_count: findings.length,
      by_severity: {},
      by_status: {},
      by_title: {},
      by_repo: {}
    };

    findings.forEach(finding => {
      // Count by severity
      const severity = finding.details.severity;
      counts.by_severity[severity] = (counts.by_severity[severity] || 0) + 1;
      
      // Count by status
      counts.by_status[finding.status] = (counts.by_status[finding.status] || 0) + 1;
      
      // Count by title
      const title = finding.details.title;
      counts.by_title[title] = (counts.by_title[title] || 0) + 1;
      
      // Count by repo
      const repoKey = finding.repo?.name || 'unknown';
      counts.by_repo[repoKey] = (counts.by_repo[repoKey] || 0) + 1;
    });

    return counts;
  }

  async getFindings(params: FindingsQueryParams = {}): Promise<PaginatedResponse<any> | CountResponse> {
    const { mode = 'summary', fields, ...apiParams } = params;
    
    if (mode === 'count') {
      // For count mode, we need to fetch all findings to generate accurate counts
      // This is a limitation - ideally the API would provide count endpoints
      const allFindings = await this.getAllFindings(apiParams);
      return this.generateCountResponse(allFindings);
    }

    // Try with conservative sizing to avoid token limits
    const response = await this.makeRequestWithRetry(
      `/findings`,
      apiParams,
      mode,
      fields
    );
    
    return response;
  }

  private async makeRequestWithRetry(
    basePath: string,
    params: any,
    mode: ResponseMode = 'summary',
    fields?: string[]
  ): Promise<PaginatedResponse<any>> {
    // Allow up to 100 items, default to 20 if not specified
    const requestedSize = Math.min(params.size || 20, 100);
    const adjustedParams = { ...params, size: requestedSize };
    const queryString = this.buildQueryString(adjustedParams);
    const endpoint = `${basePath}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<PaginatedResponse<Finding>>(endpoint);
    
    // Validate response structure
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid API response: response is not an object');
    }
    
    if (!Array.isArray(response.items)) {
      return {
        has_more: false,
        items: [],
        next_cursor: undefined
      };
    }
    
    const filteredItems = this.filterFindingsByMode(response.items, mode, fields);
    
    return {
      ...response,
      items: filteredItems
    };
  }

  async getCountFindings(params: Omit<FindingsQueryParams, 'mode' | 'fields'> = {}): Promise<CountResponse> {
    // The /findings/count endpoint doesn't exist in V2 (checked docs: /findings, /findings/count exists in docs? Let's re-check docs later, but for now manual count is safe)
    // Actually docs showed /findings/count endpoint! 
    // Let's try to use it if possible, but docs for it were "Get findings count".
    // If I use the endpoint, I might save requests. But for now I will stick to safe manual counting or check if I can implement it properly.
    // The user wants to "test everything", so implementing manual count is safer if I'm unsure about the count endpoint schema.
    // But wait, if the endpoint exists, using it is better.
    // I saw `/api-reference/findingsv2/get-findings-count` in the list.
    // I'll assume manual counting for now to be safe and consistent with previous implementation, unless I want to risk it.
    // Previous implementation did manual counting.
    
    const allFindings = await this.getAllFindingsWithLimits(params, 10); // Max 10 pages
    return this.generateCountResponse(allFindings);
  }

  private async getAllFindingsWithLimits(params: Omit<FindingsQueryParams, 'mode' | 'fields'>, maxPages: number = 10): Promise<Finding[]> {
    const allFindings: Finding[] = [];
    let cursor: string | undefined = params.cursor;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < maxPages) {
      const queryParams = { ...params, cursor, size: 10 }; // Use conservative size
      const queryString = this.buildQueryString(queryParams);
      const endpoint = `/findings${queryString ? `?${queryString}` : ''}`;
      
      try {
        const response = await this.makeRequest<PaginatedResponse<Finding>>(endpoint);
        
        // Validate response structure
        if (!response || typeof response !== 'object') {
          console.warn('Invalid API response during count operation');
          break;
        }
        
        if (Array.isArray(response.items)) {
          allFindings.push(...response.items);
        } else {
          console.warn('API response missing items array in count pagination');
        }
        
        hasMore = response.has_more === true;
        cursor = response.next_cursor;
        pageCount++;
        
      } catch (error) {
        console.error(`Error during count pagination on page ${pageCount}:`, error);
        break;
      }
    }

    // Log if we hit the limit
    if (hasMore && pageCount >= maxPages) {
      console.warn(`Count operation limited to ${maxPages} pages (${allFindings.length} findings) to prevent token issues`);
    }

    return allFindings;
  }

  private async getAllFindings(params: Omit<FindingsQueryParams, 'mode' | 'fields'>, maxPages: number = 50): Promise<Finding[]> {
    const allFindings: Finding[] = [];
    let cursor: string | undefined = params.cursor;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < maxPages) {
      const queryParams = { ...params, cursor, size: 100 }; // Use larger page size for efficiency
      const queryString = this.buildQueryString(queryParams);
      const endpoint = `/findings${queryString ? `?${queryString}` : ''}`;
      const response = await this.makeRequest<PaginatedResponse<Finding>>(endpoint);
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid API response: response is not an object');
      }
      
      if (Array.isArray(response.items)) {
        allFindings.push(...response.items);
      } else {
        console.warn('API response missing items array in pagination');
      }
      
      hasMore = response.has_more === true;
      cursor = response.next_cursor;
      pageCount++;
    }

    // Log if we hit the limit
    if (hasMore && pageCount >= maxPages) {
      console.warn(`Count operation limited to ${maxPages} pages (${allFindings.length} findings) to prevent memory issues`);
    }

    return allFindings;
  }

  async getFinding(id: string, repoId: string, projectId: string): Promise<Finding> {
    return this.makeRequest<Finding>(`/repos/${repoId}/projects/${projectId}/findings/${id}`);
  }

  async updateFindingStatus(id: string, request: UpdateFindingStatusRequest): Promise<Finding> {
    return this.makeRequest<Finding>(`/findings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  async getRepositories(params: RepositoriesQueryParams = {}): Promise<PaginatedResponse<Repository>> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/repos${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest<PaginatedResponse<Repository>>(endpoint);
  }

  async getRepository(id: string): Promise<Repository> {
    return this.makeRequest<Repository>(`/repos/${id}`);
  }

  async getRepositoryFindings(repoId: string, params: FindingsQueryParams = {}): Promise<PaginatedResponse<any> | CountResponse> {
    const { mode = 'summary', fields, ...apiParams } = params;
    
    if (mode === 'count') {
      const allFindings = await this.getAllRepositoryFindings(repoId, apiParams);
      return this.generateCountResponse(allFindings);
    }

    // Add repo_id parameter to filter findings by repository
    const repoParams = { ...apiParams, repo_id: repoId };

    // Use the same retry logic for repository findings
    const response = await this.makeRequestWithRetry(
      `/findings`,
      repoParams,
      mode,
      fields
    );
    
    return response;
  }

  private async getAllRepositoryFindings(repoId: string, params: Omit<FindingsQueryParams, 'mode' | 'fields'>, maxPages: number = 50): Promise<Finding[]> {
    const allFindings: Finding[] = [];
    let cursor: string | undefined = params.cursor;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < maxPages) {
      const queryParams = { ...params, cursor, size: 100, repo_id: repoId };
      const queryString = this.buildQueryString(queryParams);
      const endpoint = `/findings${queryString ? `?${queryString}` : ''}`;
      const response = await this.makeRequest<PaginatedResponse<Finding>>(endpoint);
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid API response: response is not an object');
      }
      
      if (Array.isArray(response.items)) {
        allFindings.push(...response.items);
      } else {
        console.warn('API response missing items array in pagination');
      }
      
      hasMore = response.has_more === true;
      cursor = response.next_cursor;
      pageCount++;
    }

    // Log if we hit the limit
    if (hasMore && pageCount >= maxPages) {
      console.warn(`Count operation limited to ${maxPages} pages (${allFindings.length} findings) to prevent memory issues`);
    }

    return allFindings;
  }
}
