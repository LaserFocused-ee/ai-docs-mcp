import { NotionPage } from './notion.js';

export interface SearchResultMetadata {
  searchMode: 'tags' | 'full-text' | 'combined';
  matchLocation: 'tags' | 'title' | 'description' | 'content';
  matchedTerms: string[];
  relevanceScore?: number;
}

export interface EnhancedSearchResult {
  page: NotionPage;
  metadata: SearchResultMetadata;
}

export interface SearchStatistics {
  totalResults: number;
  resultsByLocation: {
    tags: number;
    title: number;
    description: number;
    content: number;
  };
  searchMode: string;
  searchTerm: string;
  executionTime?: number;
}
