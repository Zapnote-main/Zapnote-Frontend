import { apiClient } from '@/src/lib/api/client';
import type { ApiResponse, ContentType } from '@/src/types/workspace';

export interface SearchFilters {
    contentType?: string;
    tags?: string[];
}

export interface SearchResult {
    id: string;
    title?: string;
    summary?: string;
    sourceUrl: string;
    contentType: ContentType;
    similarity: number;
    tags?: string[];
    createdAt: string;
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    totalResults: number;
}

export interface SearchInput {
    query: string;
    limit?: number;
    filters?: SearchFilters;
}

export const searchApi = {
    async semanticSearch(
        workspaceId: string,
        input: SearchInput
    ): Promise<SearchResponse> {
        const response = await apiClient.post<ApiResponse<SearchResponse>>(
            `/api/v1/workspaces/${workspaceId}/search/semantic`,
            input
        );
        return response.data;
    },

    async hybridSearch(
        workspaceId: string,
        input: SearchInput
    ): Promise<SearchResponse> {
        const response = await apiClient.post<ApiResponse<SearchResponse>>(
            `/api/v1/workspaces/${workspaceId}/search/hybrid`,
            input
        );
        return response.data;
    },
};