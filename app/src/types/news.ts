export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  image?: string;
  publishedAt: string;
  source: string;
  sourceRegion?: string;
  region?: string;
  language?: string;
  author?: string;
  category?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  bias?: string;
  isBreaking?: boolean;
}

export type NewsStory = NewsItem;

export type RegionType = 'africa' | 'asia' | 'persian-gulf' | 'global' | 'independent' | 'tech' | 'all';
export type Region = RegionType;

export interface NewsResponse {
  region?: string;
  category?: string;
  articles: NewsItem[];
  sources?: string[];
  timestamp: string;
  totalArticles?: number;
  regions?: Array<{ region: string; sources: string[] }>;
}

export interface SourceBias {
  label: string;
  color: string;
  description: string;
}

export const SOURCE_BIAS: Record<string, SourceBias> = {
  'russia-state': {
    label: 'Russian State Media',
    color: 'bg-red-600',
    description: 'State-funded Russian media outlet'
  },
  'iran-state': {
    label: 'Iranian State Media',
    color: 'bg-green-600',
    description: 'State-funded Iranian media outlet'
  },
  'israel': {
    label: 'Israeli Media',
    color: 'bg-blue-500',
    description: 'Israeli news outlet'
  },
  'israel-left': {
    label: 'Israeli Left-leaning',
    color: 'bg-blue-400',
    description: 'Israeli liberal perspective'
  },
  'independent-right': {
    label: 'Independent Right',
    color: 'bg-orange-500',
    description: 'Independent conservative outlet'
  },
  'independent-left': {
    label: 'Independent Left',
    color: 'bg-purple-500',
    description: 'Independent progressive outlet'
  },
  'independent-financial': {
    label: 'Independent Financial',
    color: 'bg-yellow-500',
    description: 'Independent financial analysis'
  },
  'independent-conspiracy': {
    label: 'Conspiracy/Alt',
    color: 'bg-red-700',
    description: 'Alternative/conspiracy outlet'
  },
  'independent-alt': {
    label: 'Alternative',
    color: 'bg-yellow-600',
    description: 'Alternative media outlet'
  },
  'independent-health': {
    label: 'Alternative Health',
    color: 'bg-teal-500',
    description: 'Alternative health/natural news'
  }
};

export interface RegionConfig {
  id: RegionType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const REGIONS: RegionConfig[] = [
  {
    id: 'all',
    name: 'All News',
    description: 'Global coverage',
    icon: 'globe',
    color: 'bg-blue-500'
  },
  {
    id: 'africa',
    name: 'Africa',
    description: 'African news',
    icon: 'map-pin',
    color: 'bg-emerald-500'
  },
  {
    id: 'asia',
    name: 'Asia',
    description: 'Asian coverage',
    icon: 'building',
    color: 'bg-rose-500'
  },
  {
    id: 'persian-gulf',
    name: 'Persian Gulf',
    description: 'Middle East news',
    icon: 'map-pin',
    color: 'bg-amber-500'
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Technology news',
    icon: 'laptop',
    color: 'bg-violet-500'
  },
  {
    id: 'independent',
    name: 'Independent',
    description: 'Alternative sources',
    icon: 'megaphone',
    color: 'bg-purple-500'
  }
];