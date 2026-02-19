// import type { NewsItem, NewsResponse, RegionType } from '@/types/news';
import type { NewsResponse, RegionType } from '@/types/news';

// REST OF YOUR CODE REMAINS THE SAME
const API_URL = 'https://nexus-news-api.cc-dennar.workers.dev';

export const newsService = {
  async fetchByRegion(region: RegionType | 'independent' | 'all'): Promise<NewsResponse> {
    const response = await fetch(`${API_URL}/api/news/${region}`);
    if (!response.ok) throw new Error('Failed to fetch news');
    return response.json();
  },

  async fetchAll(): Promise<NewsResponse> {
    return this.fetchByRegion('all');
  },

  async getStatus(): Promise<any> {
    const response = await fetch(`${API_URL}/api/status`);
    return response.json();
  }
};