import { useState, useEffect, useCallback } from 'react';
import type { NewsStory } from '@/types/news';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface UseNewsReturn {
  stories: NewsStory[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
}

export function useNews(region: string = 'global'): UseNewsReturn {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNews = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/news?region=${region}&page=${pageNum}&limit=20`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      
      if (append) {
        setStories(prev => [...prev, ...data.stories]);
      } else {
        setStories(data.stories);
      }

      setHasMore(data.stories.length === 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback to empty array on error
      if (!append) setStories([]);
    } finally {
      setLoading(false);
    }
  }, [region]);

  // Initial load
  useEffect(() => {
    setPage(1);
    fetchNews(1, false);
  }, [region, fetchNews]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNews(nextPage, true);
    }
  }, [loading, hasMore, page, fetchNews]);

  const refresh = useCallback(async () => {
    setPage(1);
    await fetchNews(1, false);
  }, [fetchNews]);

  return {
    stories,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}