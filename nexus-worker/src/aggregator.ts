import { 
  NewsItem, 
  NewsSourceResult, 
  RegionConfig,
  NewsDataIOResponse,
  GNewsResponse,
  CurrentsAPIResponse,
  HackerNewsItem,
  GDELTResponse,
  RSSItem
} from './types';

export class NewsAggregator {
  private env: {
    NEWSDATA_API_KEY?: string;
    GNEWS_API_KEY?: string;
    CURRENTS_API_KEY?: string;
    WORLD_NEWS_API_KEY?: string;
    GUARDIAN_API_KEY?: string; // 'test' works for development
  };

  constructor(env: { 
    NEWSDATA_API_KEY?: string; 
    GNEWS_API_KEY?: string; 
    CURRENTS_API_KEY?: string;
    WORLD_NEWS_API_KEY?: string;
    GUARDIAN_API_KEY?: string;
  }) {
    this.env = env;
  }

  async fetchFromSource(
    source: string, 
    region: string, 
    config: RegionConfig[string]
  ): Promise<NewsSourceResult> {
    switch (source) {
      // Primary APIs (require keys)
      case 'newsdata-io':
        return this.fetchNewsDataIO(region, config);
      case 'gnews':
        return this.fetchGNews(region, config);
      case 'currents-api':
        return this.fetchCurrentsAPI(region, config);
      
      // Free APIs (generous/limited keys)
      case 'world-news-api':
        return this.fetchWorldNewsAPI(region, config);
      case 'guardian-api':
        return this.fetchGuardianAPI(region, config);
      
      // Free APIs (no key required)
      case 'hackernews':
        return { articles: await this.fetchHackerNews(), source, success: true };
      case 'gdelt-africa':
      case 'gdelt-gcc':
      case 'gdelt-global':
        return this.fetchGDELT(region, config);
      case 'reddit-worldnews':
        return this.fetchReddit('worldnews', region);
      case 'reddit-technology':
        return this.fetchReddit('technology', region);
      case 'reddit-news':
        return this.fetchReddit('news', region);
      
      // Mainstream RSS Sources
      case 'rss-bbc-africa':
        return this.fetchRSS('https://feeds.bbci.co.uk/news/world/africa/rss.xml', region, 'BBC Africa');
      case 'rss-bbc-world':
        return this.fetchRSS('https://feeds.bbci.co.uk/news/world/rss.xml', region, 'BBC World');
      case 'rss-bbc-asia':
        return this.fetchRSS('https://feeds.bbci.co.uk/news/world/asia/rss.xml', region, 'BBC Asia');
      case 'rss-bbc-tech':
        return this.fetchRSS('https://feeds.bbci.co.uk/news/technology/rss.xml', region, 'BBC Tech');
      case 'rss-xinhua':
        return this.fetchRSS('http://www.xinhuanet.com/english/rss/worldrss.xml', region, 'Xinhua');
      case 'rss-nikkei':
        return this.fetchRSS('https://asia.nikkei.com/rss', region, 'Nikkei Asia');
      case 'rss-scmp':
        return this.fetchRSS('https://www.scmp.com/rss/91/feed', region, 'SCMP');
      case 'rss-aljazeera':
        return this.fetchRSS('https://www.aljazeera.com/xml/rss/all.xml', region, 'Al Jazeera');
      case 'rss-arabnews':
        return this.fetchRSS('https://www.arabnews.com/rss.xml', region, 'Arab News');
      case 'rss-news24':
        return this.fetchRSS('https://www.news24.com/rss', region, 'News24');
      case 'rss-timesofindia':
        return this.fetchRSS('https://timesofindia.indiatimes.com/rssfeedstopstories.cms', region, 'Times of India');
      case 'rss-japantimes':
        return this.fetchRSS('https://www.japantimes.co.jp/feed/', region, 'Japan Times');
      
      // Additional High-Quality RSS Sources
      case 'rss-cnn-world':
        return this.fetchRSS('http://rss.cnn.com/rss/edition_world.rss', region, 'CNN World');
      case 'rss-reuters':
        return this.fetchRSS('https://www.reutersagency.com/feed/?taxonomy=markets&post_type=reuters-best', region, 'Reuters');
      case 'rss-ft-world':
        return this.fetchRSS('https://www.ft.com/world?format=rss', region, 'Financial Times');
      case 'rss-economist':
        return this.fetchRSS('https://www.economist.com/latest/rss.xml', region, 'The Economist');
      case 'rss-techcrunch':
        return this.fetchRSS('https://techcrunch.com/feed/', region, 'TechCrunch');
      case 'rss-theverge':
        return this.fetchRSS('https://www.theverge.com/rss/index.xml', region, 'The Verge');
      case 'rss-wired':
        return this.fetchRSS('https://www.wired.com/feed/rss', region, 'Wired');
      case 'rss-cna-singapore':
        return this.fetchRSS('https://www.channelnewsasia.com/rss', region, 'CNA');
      case 'rss-straits-times':
        return this.fetchRSS('https://www.straitstimes.com/news/asia/rss.xml', region, 'Straits Times');
      case 'rss-guardian-world':
        return this.fetchRSS('https://www.theguardian.com/world/rss', region, 'Guardian World');
      case 'rss-guardian-tech':
        return this.fetchRSS('https://www.theguardian.com/technology/rss', region, 'Guardian Tech');
      case 'rss-axios':
        return this.fetchRSS('https://api.axios.com/feed/', region, 'Axios');
      case 'rss-politico':
        return this.fetchRSS('https://www.politico.com/rss/politicopicks.xml', region, 'Politico');
      
      // === ISRAELI SOURCES ===
      case 'rss-timesofisrael':
        return this.fetchRSS('https://www.timesofisrael.com/feed/', region, 'Times of Israel');
      case 'rss-jerusalempost':
        return this.fetchRSS('https://www.jpost.com/Rss/RssFeedsHeadlines.aspx', region, 'Jerusalem Post');
      case 'rss-haaretz':
        return this.fetchRSS('https://www.haaretz.com/rss/feeds/1.142007', region, 'Haaretz');
      
      // === RUSSIAN SOURCES ===
      case 'rss-rt':
        return this.fetchRSS('https://www.rt.com/rss/news/', region, 'RT News');
      
      // === IRANIAN SOURCES ===
      case 'rss-tehrantimes':
        return this.fetchRSS('https://www.tehrantimes.com/rss', region, 'Tehran Times');
      
      // === INDEPENDENT/ALTERNATIVE SOURCES ===
      case 'rss-rebelnews':
        return this.fetchRSS('https://www.rebelnews.com/rss', region, 'Rebel News');
      case 'rss-breitbart':
        return this.fetchRSS('https://www.breitbart.com/feed/', region, 'Breitbart');
      case 'rss-zerohedge':
        return this.fetchRSS('https://www.zerohedge.com/rss', region, 'ZeroHedge');
      case 'rss-gatewaypundit':
        return this.fetchRSS('https://www.thegatewaypundit.com/feed/', region, 'Gateway Pundit');
      case 'rss-infowars':
        return this.fetchRSS('https://rss.infowars.com/', region, 'InfoWars');
      case 'rss-activistpost':
        return this.fetchRSS('https://www.activistpost.com/feed/', region, 'Activist Post');
      case 'rss-naturalnews':
        return this.fetchRSS('https://www.naturalnews.com/rss.xml', region, 'Natural News');
      
      default:
        return { articles: [], source, success: false, error: 'Unknown source' };
    }
  }

  // ==================== NewsData.io API ====================
  private async fetchNewsDataIO(region: string, config: RegionConfig[string]): Promise<NewsSourceResult> {
    if (!this.env.NEWSDATA_API_KEY) {
      return { articles: [], source: 'newsdata-io', success: false, error: 'No API key' };
    }

    try {
      const countries = config.countries.slice(0, 5).join(',');
      const url = `https://newsdata.io/api/1/latest?apikey=${this.env.NEWSDATA_API_KEY}&country=${countries}&language=en&size=20`;
      
      const response = await fetch(url, { 
        cf: { cacheTtl: 300 },
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as NewsDataIOResponse;
      
      const articles: NewsItem[] = (data.results || []).map(item => ({
        id: item.article_id || `nd-${Date.now()}-${Math.random()}`,
        title: item.title,
        description: item.description || '',
        url: item.link,
        imageUrl: item.image_url,
        publishedAt: item.pubDate,
        source: item.source_name || item.source_id || 'NewsData.io',
        sourceRegion: region,
        category: item.category?.[0],
        language: item.language,
        author: item.creator?.[0]
      }));

      return { articles, source: 'newsdata-io', success: true };
    } catch (error) {
      return { 
        articles: [], 
        source: 'newsdata-io', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ==================== GNews API ====================
  private async fetchGNews(region: string, config: RegionConfig[string]): Promise<NewsSourceResult> {
    if (!this.env.GNEWS_API_KEY) {
      return { articles: [], source: 'gnews', success: false, error: 'No API key' };
    }

    try {
      const url = `https://gnews.io/api/v4/top-headlines?apikey=${this.env.GNEWS_API_KEY}&lang=en&max=20`;
      
      const response = await fetch(url, { 
        cf: { cacheTtl: 300 },
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as GNewsResponse;
      
      const articles: NewsItem[] = (data.articles || []).map((item, idx) => ({
        id: `gn-${Date.now()}-${idx}`,
        title: item.title,
        description: item.description || '',
        url: item.url,
        imageUrl: item.image,
        publishedAt: item.publishedAt,
        source: item.source?.name || 'GNews',
        sourceRegion: region,
        language: 'en'
      }));

      return { articles, source: 'gnews', success: true };
    } catch (error) {
      return { 
        articles: [], 
        source: 'gnews', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ==================== Currents API ====================
  private async fetchCurrentsAPI(region: string, config: RegionConfig[string]): Promise<NewsSourceResult> {
    if (!this.env.CURRENTS_API_KEY) {
      return { articles: [], source: 'currents-api', success: false, error: 'No API key' };
    }

    try {
      const url = `https://api.currentsapi.services/v1/latest-news?apiKey=${this.env.CURRENTS_API_KEY}&language=en`;
      
      const response = await fetch(url, { 
        cf: { cacheTtl: 300 },
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as CurrentsAPIResponse;
      
      const articles: NewsItem[] = (data.news || []).map((item, idx) => ({
        id: item.id || `ca-${Date.now()}-${idx}`,
        title: item.title,
        description: item.description || '',
        url: item.url,
        imageUrl: item.image,
        publishedAt: item.published,
        source: 'Currents API',
        sourceRegion: region,
        category: item.category?.[0],
        language: item.language,
        author: item.author
      }));

      return { articles, source: 'currents-api', success: true };
    } catch (error) {
      return { 
        articles: [], 
        source: 'currents-api', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ==================== World News API (500/day free) ====================
  private async fetchWorldNewsAPI(region: string, config: RegionConfig[string]): Promise<NewsSourceResult> {
    if (!this.env.WORLD_NEWS_API_KEY) {
      return { articles: [], source: 'world-news-api', success: false, error: 'No API key' };
    }

    try {
      let url = `https://api.worldnewsapi.com/search-news?api-key=${this.env.WORLD_NEWS_API_KEY}&number=20&language=en`;
      
      // Add region filters
      if (region === 'africa') {
        url += '&source-country=ng,za,ke,eg,gh,et';
      } else if (region === 'asia') {
        url += '&source-country=cn,jp,in,kr,id,th,vn';
      } else if (region === 'persian-gulf' || region === 'gcc') {
        url += '&source-country=ae,sa,qa,kw,bh,om';
      }

      const response = await fetch(url, { 
        cf: { cacheTtl: 300 },
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const articles: NewsItem[] = (data.news || []).map((item: any, idx: number) => ({
        id: `wn-${idx}-${Date.now()}`,
        title: item.title,
        description: item.text?.substring(0, 300) || '',
        url: item.url,
        imageUrl: item.image,
        publishedAt: item.publish_date,
        source: item.source_name || 'World News API',
        sourceRegion: region,
        category: item.category,
        language: item.language
      }));

      return { articles, source: 'world-news-api', success: true };
    } catch (error) {
      return { 
        articles: [], 
        source: 'world-news-api', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ==================== The Guardian API (FREE - Unlimited with 'test' key) ====================
  private async fetchGuardianAPI(region: string, config: RegionConfig[string]): Promise<NewsSourceResult> {
    try {
      // Use 'test' for development, or get free key from open-platform.theguardian.com
      const apiKey = this.env.GUARDIAN_API_KEY || 'test';
      
      // Map regions to Guardian sections/tags
      let section = 'world';
      let query = '';
      
      if (region === 'africa') {
        query = 'africa';
      } else if (region === 'asia') {
        query = 'asia';
      } else if (region === 'persian-gulf' || region === 'gcc') {
        query = 'middleeast';
      } else if (region === 'tech') {
        section = 'technology';
      }

      let url = `https://content.guardianapis.com/search?api-key=${apiKey}&section=${section}&show-fields=trailText,thumbnail,byline,headline&page-size=20&order-by=newest`;
      
      if (query) {
        url += `&q=${encodeURIComponent(query)}`;
      }

      const response = await fetch(url, { 
        cf: { cacheTtl: 300 },
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const articles: NewsItem[] = (data.response?.results || []).map((item: any) => ({
        id: `guardian-${item.id}`,
        title: item.webTitle,
        description: item.fields?.trailText || item.fields?.headline || '',
        url: item.webUrl,
        imageUrl: item.fields?.thumbnail,
        publishedAt: item.webPublicationDate,
        source: 'The Guardian',
        sourceRegion: region,
        category: item.sectionName?.toLowerCase(),
        language: 'en',
        author: item.fields?.byline
      }));

      return { articles, source: 'guardian-api', success: true };
    } catch (error) {
      return { 
        articles: [], 
        source: 'guardian-api', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ==================== HackerNews API (FREE - No limits) ====================
  async fetchHackerNews(): Promise<NewsItem[]> {
    try {
      const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
        cf: { cacheTtl: 300 }
      });
      
      if (!topStoriesRes.ok) {
        throw new Error('Failed to fetch top stories');
      }

      const topStoryIds = await topStoriesRes.json() as number[];
      const top20Ids = topStoryIds.slice(0, 20);

      const storyPromises = top20Ids.map(async (id) => {
        try {
          const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            cf: { cacheTtl: 300 }
          });
          if (!storyRes.ok) return null;
          return await storyRes.json() as HackerNewsItem;
        } catch {
          return null;
        }
      });

      const stories = await Promise.all(storyPromises);
      
      return stories
        .filter((s): s is HackerNewsItem => s !== null && s.title !== undefined)
        .map(story => ({
          id: `hn-${story.id}`,
          title: story.title,
          description: `Score: ${story.score} | Comments: ${story.descendants || 0}`,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          publishedAt: new Date(story.time * 1000).toISOString(),
          source: 'Hacker News',
          sourceRegion: 'global',
          category: 'tech',
          language: 'en',
          author: story.by
        }));
    } catch (error) {
      console.error('HackerNews error:', error);
      return [];
    }
  }

  // ==================== GDELT API (FREE - No limits) ====================
  private async fetchGDELT(region: string, config: RegionConfig[string]): Promise<NewsSourceResult> {
    try {
      let query = '';
      if (region === 'africa') {
        query = 'africa sourcecountry:NG OR sourcecountry:ZA OR sourcecountry:KE OR sourcecountry:EG';
      } else if (region === 'persian-gulf' || region === 'gcc') {
        query = 'gulf sourcecountry:AE OR sourcecountry:SA OR sourcecountry:QA OR sourcecountry:KW OR sourcecountry:BH OR sourcecountry:OM';
      } else if (region === 'asia') {
        query = 'asia sourcecountry:IN OR sourcecountry:CN OR sourcecountry:JP OR sourcecountry:KR OR sourcecountry:ID OR sourcecountry:TH';
      } else {
        query = 'world';
      }

      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=20&format=json`;
      
      const response = await fetch(url, { 
        cf: { cacheTtl: 300 },
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as GDELTResponse;
      
      const articles: NewsItem[] = (data.items || []).map((item, idx) => ({
        id: `gd-${Date.now()}-${idx}`,
        title: item.title,
        description: `Source: ${item.domain} | Country: ${item.sourcecountry}`,
        url: item.url,
        publishedAt: item.seendate,
        source: item.domain || 'GDELT',
        sourceRegion: region,
        language: item.language
      }));

      return { articles, source: 'gdelt', success: true };
    } catch (error) {
      return { 
        articles: [], 
        source: 'gdelt', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ==================== Reddit API (FREE - No key required for read-only) ====================
  private async fetchReddit(subreddit: string, region: string): Promise<NewsSourceResult> {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=20`;
      
      const response = await fetch(url, { 
        cf: { cacheTtl: 300 },
        headers: { 
          'User-Agent': 'NexusNews/1.0 (News Aggregator)',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const articles: NewsItem[] = (data.data?.children || []).map((child: any) => ({
        id: `reddit-${child.data.id}`,
        title: child.data.title,
        description: `Score: ${child.data.score} | Comments: ${child.data.num_comments} | Subreddit: r/${subreddit}`,
        url: `https://reddit.com${child.data.permalink}`,
        imageUrl: child.data.thumbnail && child.data.thumbnail.startsWith('http') ? child.data.thumbnail : undefined,
        publishedAt: new Date(child.data.created_utc * 1000).toISOString(),
        source: `r/${subreddit}`,
        sourceRegion: region,
        category: subreddit,
        language: 'en',
        author: child.data.author
      }));

      return { articles, source: `reddit-${subreddit}`, success: true };
    } catch (error) {
      return { 
        articles: [], 
        source: `reddit-${subreddit}`, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ==================== RSS Feed Parser (FREE - Unlimited) ====================
  private async fetchRSS(url: string, region: string, sourceName: string): Promise<NewsSourceResult> {
    try {
      const response = await fetch(url, { 
        cf: { cacheTtl: 300 },
        headers: { 
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'NexusNews/1.0 (News Aggregator Bot)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const xmlText = await response.text();
      const items = this.parseRSS(xmlText);
      
      const articles: NewsItem[] = items.slice(0, 20).map((item, idx) => ({
        id: `rss-${Date.now()}-${idx}`,
        title: item.title,
        description: this.cleanHtml(item.description || ''),
        url: item.link,
        imageUrl: item.enclosure?.url || this.extractImageFromContent(item['content:encoded'] || item.description),
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        source: sourceName,
        sourceRegion: region,
        language: 'en'
      }));

      return { articles, source: sourceName.toLowerCase().replace(/\s+/g, '-'), success: true };
    } catch (error) {
      return { 
        articles: [], 
        source: sourceName.toLowerCase().replace(/\s+/g, '-'), 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private parseRSS(xmlText: string): RSSItem[] {
    const items: RSSItem[] = [];
    
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const titleRegex = /<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i;
    const linkRegex = /<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i;
    const descRegex = /<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i;
    const pubDateRegex = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i;
    const enclosureRegex = /<enclosure[^>]+url="([^"]+)"/i;
    const contentRegex = /<content:encoded[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      
      const titleMatch = titleRegex.exec(itemContent);
      const linkMatch = linkRegex.exec(itemContent);
      const descMatch = descRegex.exec(itemContent);
      const pubDateMatch = pubDateRegex.exec(itemContent);
      const enclosureMatch = enclosureRegex.exec(itemContent);
      const contentMatch = contentRegex.exec(itemContent);

      if (titleMatch && linkMatch) {
        items.push({
          title: this.decodeXmlEntities(titleMatch[1].trim()),
          link: this.decodeXmlEntities(linkMatch[1].trim()),
          description: descMatch ? this.decodeXmlEntities(descMatch[1].trim()) : '',
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : undefined,
          enclosure: enclosureMatch ? { url: enclosureMatch[1] } : undefined,
          'content:encoded': contentMatch ? contentMatch[1] : undefined
        });
      }
    }

    return items;
  }

  private extractImageFromContent(content: string | undefined): string | undefined {
    if (!content) return undefined;
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
    return imgMatch ? imgMatch[1] : undefined;
  }

  private decodeXmlEntities(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/<!\[CDATA\[|\]\]>/g, '');
  }

  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ==================== Tech News from Multiple APIs ====================
  async fetchTechFromNewsAPIs(): Promise<NewsItem[]> {
    const articles: NewsItem[] = [];
    
    // Try NewsData.io if available
    if (this.env.NEWSDATA_API_KEY) {
      try {
        const url = `https://newsdata.io/api/1/latest?apikey=${this.env.NEWSDATA_API_KEY}&category=technology&language=en&size=10`;
        const response = await fetch(url, { cf: { cacheTtl: 300 } });
        if (response.ok) {
          const data = await response.json() as NewsDataIOResponse;
          articles.push(...(data.results || []).map(item => ({
            id: item.article_id || `nd-tech-${Date.now()}`,
            title: item.title,
            description: item.description || '',
            url: item.link,
            imageUrl: item.image_url,
            publishedAt: item.pubDate,
            source: item.source_name || 'NewsData.io',
            sourceRegion: 'global',
            category: 'technology',
            language: item.language
          })));
        }
      } catch (error) {
        console.error('Tech fetch from NewsData error:', error);
      }
    }

    // Try Guardian Tech
    try {
      const guardianResult = await this.fetchGuardianAPI('tech', { countries: ['global'] });
      if (guardianResult.success) {
        articles.push(...guardianResult.articles);
      }
    } catch (error) {
      console.error('Tech fetch from Guardian error:', error);
    }

    return articles;
  }
}