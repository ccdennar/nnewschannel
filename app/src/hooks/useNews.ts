import { useState, useEffect, useCallback, useRef } from 'react';
import type { NewsItem, RegionType } from '@/types/news';
import { newsService } from '@/services/newsService';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface UseNewsReturn {
  articles: NewsItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  activeSources: string[];
  refresh: () => void;
}

export function useNews(region: RegionType): UseNewsReturn {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Handle independent region specially
      if (region === 'independent') {
        const response = await newsService.fetchByRegion('independent');
        setArticles(response.articles);
        setActiveSources(response.sources || []);
        setLastUpdated(new Date(response.timestamp));
      } else {
        const response = await newsService.fetchByRegion(region);
        setArticles(response.articles);
        setActiveSources(response.sources || []);
        setLastUpdated(new Date(response.timestamp));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [region]);

  const refresh = useCallback(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    fetchNews();
    
    intervalRef.current = setInterval(fetchNews, REFRESH_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNews]);

  return {
    articles,
    loading,
    error,
    lastUpdated,
    activeSources,
    refresh
  };
}

export function useAllNews(): UseNewsReturn {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeSources, setActiveSources] = useState<string[]>([]);

  const fetchAllNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await newsService.fetchAll();
      setArticles(response.articles);
      setActiveSources(response.sources || []);
      setLastUpdated(new Date(response.timestamp));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllNews();
    const interval = setInterval(fetchAllNews, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAllNews]);

  return {
    articles,
    loading,
    error,
    lastUpdated,
    activeSources,
    refresh: fetchAllNews
  };
}
