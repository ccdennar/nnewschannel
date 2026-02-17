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
  bias?: string; // For labeling source bias/perspective
}

export interface NewsResponse {
  region?: string;
  articles: NewsItem[];
  sources?: string[];
  timestamp: string;
  totalArticles?: number;
  regions?: Array<{ region: string; sources: string[] }>;
  category?: string;
}

export type RegionType = 'all' | 'africa' | 'asia' | 'persian-gulf' | 'global' | 'tech' | 'independent';

export interface RegionConfig {
  id: RegionType;
  name: string;
  description: string;
  color: string;
  icon: string;
  countries: string[];
}

export const REGIONS: RegionConfig[] = [
  {
    id: 'all',
    name: 'All Regions',
    description: 'Global news coverage',
    color: 'bg-slate-500',
    icon: 'globe',
    countries: []
  },
  {
    id: 'africa',
    name: 'Africa',
    description: '54 countries, 2000+ sources',
    color: 'bg-emerald-600',
    icon: 'map-pin',
    countries: ['NG', 'ZA', 'KE', 'EG', 'GH', 'UG', 'TZ', 'ZW', 'SN', 'ET']
  },
  {
    id: 'asia',
    name: 'Asia',
    description: '49 countries, 3000+ sources',
    color: 'bg-rose-600',
    icon: 'map-pin',
    countries: ['IN', 'CN', 'JP', 'KR', 'ID', 'TH', 'VN', 'MY', 'PH', 'SG']
  },
  {
    id: 'persian-gulf',
    name: 'Persian Gulf',
    description: 'Israel, Iran, GCC states',
    color: 'bg-amber-600',
    icon: 'building',
    countries: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'IR', 'IQ', 'IL', 'JO', 'LB']
  },
  {
    id: 'global',
    name: 'Global',
    description: 'Worldwide coverage',
    color: 'bg-blue-600',
    icon: 'globe',
    countries: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT']
  },
  {
    id: 'independent',
    name: 'Independent',
    description: 'Alternative & indie sources',
    color: 'bg-purple-600',
    icon: 'megaphone',
    countries: []
  },
  {
    id: 'tech',
    name: 'Technology',
    description: 'Tech news from HN & more',
    color: 'bg-violet-600',
    icon: 'laptop',
    countries: []
  }
];

// Source bias labels for transparency
export const SOURCE_BIAS: Record<string, { label: string; color: string }> = {
  'russia-state': { label: 'Russia State Media', color: 'bg-red-600' },
  'israel': { label: 'Israeli Media', color: 'bg-blue-500' },
  'israel-left': { label: 'Israeli Left-wing', color: 'bg-blue-400' },
  'iran-state': { label: 'Iran State Media', color: 'bg-green-600' },
  'independent-right': { label: 'Independent Right', color: 'bg-orange-500' },
  'independent-left': { label: 'Independent Left', color: 'bg-purple-500' },
  'independent-alt': { label: 'Alternative', color: 'bg-yellow-500' },
  'independent-financial': { label: 'Financial Alt', color: 'bg-green-500' },
  'independent-conspiracy': { label: 'Conspiracy', color: 'bg-red-500' },
  'independent-health': { label: 'Health Alt', color: 'bg-teal-500' }
};
