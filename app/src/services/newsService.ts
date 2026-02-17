import type { NewsItem, NewsResponse, RegionType } from '@/types/news';

// CORS proxy for APIs that don't support direct browser access
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Free-tier API endpoints
const API_ENDPOINTS = {
  hackernews: {
    topStories: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    item: (id: number) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`
  },
  rss2json: 'https://api.rss2json.com/v1/api.json',
  gdelt: 'https://api.gdeltproject.org/api/v2/doc/doc'
};

// RSS Feed URLs by region - INCLUDING ALTERNATIVE/INDEPENDENT SOURCES
const RSS_FEEDS: Record<string, Array<{ url: string; name: string; region: string; bias?: string }>> = {
  africa: [
    { url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', name: 'BBC Africa', region: 'africa' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', region: 'africa' },
    { url: 'https://www.news24.com/rss', name: 'News24 SA', region: 'africa' }
  ],
  asia: [
    { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', name: 'BBC Asia', region: 'asia' },
    { url: 'https://www.scmp.com/rss/91/feed', name: 'SCMP', region: 'asia' },
    { url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', name: 'Times of India', region: 'asia' },
    { url: 'https://www.japantimes.co.jp/feed/', name: 'Japan Times', region: 'asia' },
    { url: 'https://www.rt.com/rss/news/', name: 'RT News', region: 'asia', bias: 'russia-state' }
  ],
  'persian-gulf': [
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', region: 'persian-gulf' },
    { url: 'https://www.arabnews.com/rss.xml', name: 'Arab News', region: 'persian-gulf' },
    { url: 'https://www.timesofisrael.com/feed/', name: 'Times of Israel', region: 'persian-gulf', bias: 'israel' },
    { url: 'https://www.jpost.com/Rss/RssFeedsHeadlines.aspx', name: 'Jerusalem Post', region: 'persian-gulf', bias: 'israel' },
    { url: 'https://www.haaretz.com/rss/feeds/1.142007', name: 'Haaretz', region: 'persian-gulf', bias: 'israel-left' },
    { url: 'https://www.middleeasteye.net/rss', name: 'Middle East Eye', region: 'persian-gulf' },
    { url: 'https://www.tehrantimes.com/rss', name: 'Tehran Times', region: 'persian-gulf', bias: 'iran-state' },
    { url: 'https://www.rt.com/rss/news/', name: 'RT News', region: 'persian-gulf', bias: 'russia-state' }
  ],
  global: [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', region: 'global' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', region: 'global' },
    { url: 'https://www.rt.com/rss/news/', name: 'RT News', region: 'global', bias: 'russia-state' },
    { url: 'https://www.rebelnews.com/rss', name: 'Rebel News', region: 'global', bias: 'independent-right' },
    { url: 'https://rss.infowars.com/', name: 'InfoWars', region: 'global', bias: 'independent-conspiracy' },
    { url: 'https://www.breitbart.com/feed/', name: 'Breitbart', region: 'global', bias: 'independent-right' },
    { url: 'https://www.thegatewaypundit.com/feed/', name: 'Gateway Pundit', region: 'global', bias: 'independent-right' },
    { url: 'https://www.zerohedge.com/rss', name: 'ZeroHedge', region: 'global', bias: 'independent-financial' },
    { url: 'https://www.activistpost.com/feed/', name: 'Activist Post', region: 'global', bias: 'independent-alt' },
    { url: 'https://www.naturalnews.com/rss.xml', name: 'Natural News', region: 'global', bias: 'independent-health' }
  ],
  // Special category for independent/alternative news
  independent: [
    { url: 'https://www.rebelnews.com/rss', name: 'Rebel News', region: 'global', bias: 'independent-right' },
    { url: 'https://www.rt.com/rss/news/', name: 'RT News', region: 'global', bias: 'russia-state' },
    { url: 'https://www.breitbart.com/feed/', name: 'Breitbart', region: 'global', bias: 'independent-right' },
    { url: 'https://www.zerohedge.com/rss', name: 'ZeroHedge', region: 'global', bias: 'independent-financial' },
    { url: 'https://www.thegatewaypundit.com/feed/', name: 'Gateway Pundit', region: 'global', bias: 'independent-right' },
    { url: 'https://www.activistpost.com/feed/', name: 'Activist Post', region: 'global', bias: 'independent-alt' }
  ]
};

class NewsService {
  private async fetchWithCORS(url: string): Promise<Response> {
    // Try direct fetch first (some APIs support CORS)
    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) return response;
    } catch {
      // Fall through to CORS proxy
    }
    
    // Use CORS proxy
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
    return fetch(proxyUrl);
  }

  private async fetchHackerNews(): Promise<NewsItem[]> {
    try {
      const response = await fetch(API_ENDPOINTS.hackernews.topStories);
      if (!response.ok) throw new Error('Failed to fetch HN top stories');
      
      const storyIds = await response.json() as number[];
      const topIds = storyIds.slice(0, 15);
      
      const stories = await Promise.all(
        topIds.map(async (id) => {
          try {
            const res = await fetch(API_ENDPOINTS.hackernews.item(id));
            if (!res.ok) return null;
            const data = await res.json();
            if (!data || data.deleted || data.dead) return null;
            return {
              id: `hn-${data.id}`,
              title: data.title,
              description: `Score: ${data.score || 0} | Comments: ${data.descendants || 0} | By: ${data.by || 'unknown'}`,
              url: data.url || `https://news.ycombinator.com/item?id=${data.id}`,
              publishedAt: new Date((data.time || 0) * 1000).toISOString(),
              source: 'Hacker News',
              sourceRegion: 'global',
              category: 'technology',
              language: 'en',
              author: data.by
            } as NewsItem;
          } catch {
            return null;
          }
        })
      );
      
      return stories.filter((s): s is NewsItem => s !== null);
    } catch (error) {
      console.error('HackerNews fetch error:', error);
      return [];
    }
  }

  private async fetchRSSFeed(feedUrl: string, sourceName: string, region: string): Promise<NewsItem[]> {
    try {
      // Use rss2json API (CORS-enabled)
      const apiUrl = `${API_ENDPOINTS.rss2json}?rss_url=${encodeURIComponent(feedUrl)}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) throw new Error(`Failed to fetch RSS: ${response.status}`);
      
      const data = await response.json();
      
      if (data.status !== 'ok' || !data.items) {
        return [];
      }
      
      return data.items.slice(0, 10).map((item: any, idx: number) => ({
        id: `rss-${sourceName.replace(/\s+/g, '-')}-${idx}-${Date.now()}`,
        title: item.title || 'Untitled',
        description: this.cleanHtml(item.description || item.content || ''),
        url: item.link || item.url || '#',
        imageUrl: item.enclosure?.link || item.thumbnail,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        source: sourceName,
        sourceRegion: region,
        language: 'en',
        author: item.author
      }));
    } catch (error) {
      console.error(`RSS fetch error for ${sourceName}:`, error);
      return [];
    }
  }

  private async fetchGDELT(region: string): Promise<NewsItem[]> {
    try {
      let query = '';
      if (region === 'africa') {
        query = 'sourcecountry:NG OR sourcecountry:ZA OR sourcecountry:KE OR sourcecountry:EG';
      } else if (region === 'asia') {
        query = 'sourcecountry:IN OR sourcecountry:CN OR sourcecountry:JP OR sourcecountry:KR';
      } else if (region === 'persian-gulf') {
        query = 'sourcecountry:AE OR sourcecountry:SA OR sourcecountry:QA OR sourcecountry:KW OR sourcecountry:IL OR sourcecountry:IR';
      } else {
        query = 'world';
      }
      
      const url = `${API_ENDPOINTS.gdelt}?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=15&format=json`;
      const response = await this.fetchWithCORS(url);
      
      if (!response.ok) throw new Error(`GDELT error: ${response.status}`);
      
      const data = await response.json();
      
      if (!data.items || !Array.isArray(data.items)) return [];
      
      return data.items.map((item: any, idx: number) => ({
        id: `gdelt-${idx}-${Date.now()}`,
        title: item.title || 'Untitled',
        description: `Source: ${item.domain || 'Unknown'} | Country: ${item.sourcecountry || 'Unknown'}`,
        url: item.url || '#',
        publishedAt: item.seendate || new Date().toISOString(),
        source: item.domain || 'GDELT',
        sourceRegion: region,
        language: item.language || 'en'
      }));
    } catch (error) {
      console.error('GDELT fetch error:', error);
      return [];
    }
  }

  private cleanHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 300);
  }

  async fetchByRegion(region: RegionType | 'independent'): Promise<NewsResponse> {
    const articles: NewsItem[] = [];
    const sources: string[] = [];
    
    // Fetch HackerNews for tech region
    if (region === 'tech') {
      try {
        const hnNews = await this.fetchHackerNews();
        if (hnNews.length > 0) {
          articles.push(...hnNews);
          sources.push('hackernews');
        }
      } catch (error) {
        console.error('HackerNews error:', error);
      }
      
      return {
        region,
        articles: this.deduplicateAndSort(articles),
        sources,
        timestamp: new Date().toISOString()
      };
    }
    
    // Fetch RSS feeds for the region
    const feeds = RSS_FEEDS[region] || RSS_FEEDS.global;
    for (const feed of feeds) {
      try {
        const feedNews = await this.fetchRSSFeed(feed.url, feed.name, region);
        if (feedNews.length > 0) {
          articles.push(...feedNews);
          sources.push(feed.name.toLowerCase().replace(/\s+/g, '-'));
        }
      } catch (error) {
        console.error(`Failed to fetch ${feed.name}:`, error);
      }
    }
    
    // Fetch GDELT for additional coverage
    try {
      const gdeltNews = await this.fetchGDELT(region);
      if (gdeltNews.length > 0) {
        articles.push(...gdeltNews);
        sources.push('gdelt');
      }
    } catch (error) {
      console.error('GDELT fetch failed:', error);
    }
    
    // For 'all' region, also fetch tech news
    if (region === 'all') {
      try {
        const hnNews = await this.fetchHackerNews();
        if (hnNews.length > 0) {
          articles.push(...hnNews);
          sources.push('hackernews');
        }
      } catch (error) {
        console.error('HN fetch failed:', error);
      }
    }
    
    return {
      region,
      articles: this.deduplicateAndSort(articles),
      sources,
      timestamp: new Date().toISOString()
    };
  }

  async fetchAll(): Promise<NewsResponse> {
    const allArticles: NewsItem[] = [];
    const allSources: string[] = [];
    
    const regions: (RegionType | 'independent')[] = ['africa', 'asia', 'persian-gulf', 'global', 'tech', 'independent'];
    
    const results = await Promise.allSettled(
      regions.map(r => this.fetchByRegion(r))
    );
    
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value.articles);
        allSources.push(...(result.value.sources || []));
      } else {
        console.error(`Failed to fetch ${regions[idx]}:`, result.reason);
      }
    });
    
    return {
      articles: this.deduplicateAndSort(allArticles).slice(0, 100),
      sources: [...new Set(allSources)],
      timestamp: new Date().toISOString()
    };
  }

  private deduplicateAndSort(articles: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    const unique = articles.filter(article => {
      const key = article.url || article.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    return unique.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }
}

export const newsService = new NewsService();
