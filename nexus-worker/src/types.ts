export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
  sourceRegion: string;
  category?: string;
  language?: string;
  author?: string;
}

export interface RegionConfig {
  [key: string]: {
    primary: string[];
    fallback: string[];
    languages: string[];
    countries: string[];
  };
}

export interface CacheEntry {
  articles: NewsItem[];
  sources: string[];
  timestamp: number;
}

export interface NewsSourceResult {
  articles: NewsItem[];
  source: string;
  success: boolean;
  error?: string;
}

// API Response types
export interface NewsDataIOResponse {
  status: string;
  totalResults: number;
  results: Array<{
    article_id: string;
    title: string;
    link: string;
    description?: string;
    pubDate: string;
    image_url?: string;
    source_id: string;
    source_name?: string;
    category?: string[];
    language?: string;
    creator?: string[];
  }>;
}

export interface GNewsResponse {
  totalArticles: number;
  articles: Array<{
    title: string;
    description: string;
    url: string;
    image?: string;
    publishedAt: string;
    source: {
      name: string;
      url: string;
    };
  }>;
}

export interface CurrentsAPIResponse {
  status: string;
  news: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    image?: string;
    published: string;
    author?: string;
    category?: string[];
    language?: string;
  }>;
}

export interface HackerNewsItem {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
}

export interface GDELTResponse {
  items: Array<{
    url: string;
    title: string;
    seendate: string;
    domain: string;
    language: string;
    sourcecountry: string;
  }>;
}

export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  enclosure?: {
    url: string;
  };
}
