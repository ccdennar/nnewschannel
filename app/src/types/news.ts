export interface NewsStory {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string | null;
  imageUrl?: string; // Alias for backward compatibility
  publishedAt: string;
  source: string;
  sourceRegion?: string; // Alias for backward compatibility
  region: Region | string;
  category: string;
  apiSource: string;
  language?: string;
  author?: string;
  bias?: string;
  isBreaking: boolean;
  isTrending?: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface NewsResponse {
  stories: NewsStory[];
  articles?: NewsStory[]; // Alias for backward compatibility
  region?: Region | string;
  category?: string;
  sources?: string[];
  regions?: Array<{ region: string; sources: string[] }>;
  totalArticles?: number;
  meta: {
    region: string;
    page: number;
    total: number;
    fetchedAt: string;
  };
  timestamp?: string; // Alias for backward compatibility
}

export type Region = 'all' | 'global' | 'africa' | 'asia' | 'persian-gulf' | 'tech' | 'independent';

export interface RegionConfig {
  id: Region;
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
    description: 'GCC states, Iran, Iraq',
    color: 'bg-amber-600',
    icon: 'building',
    countries: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'IR', 'IQ', 'JO', 'LB']
  },
  {
    id: 'global',
    name: 'Global',
    description: 'Worldwide coverage',
    color: 'bg-blue-600',
    icon: 'globe',
    countries: ['US', 'GB', 'CA', 'AU', 'DE', 'FR']
  },
  {
    id: 'tech',
    name: 'Technology',
    description: 'Tech news from HN & more',
    color: 'bg-violet-600',
    icon: 'laptop',
    countries: []
  },
  {
    id: 'independent',
    name: 'Independent',
    description: 'Alternative & indie sources',
    color: 'bg-purple-600',
    icon: 'megaphone',
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

// Helper to normalize region IDs
export function normalizeRegion(region: string): Region {
  const map: Record<string, Region> = {
    'africa': 'africa',
    'asia': 'asia',
    'gulf': 'persian-gulf',
    'persian-gulf': 'persian-gulf',
    'middle-east': 'persian-gulf',
    'global': 'global',
    'world': 'global',
    'all': 'all',
    'tech': 'tech',
    'technology': 'tech',
    'independent': 'independent'
  };
  return map[region.toLowerCase()] || 'global';
}

// Helper to get region config
export function getRegionConfig(region: Region): RegionConfig {
  return REGIONS.find(r => r.id === region) || REGIONS[1]; // Default to Africa
}