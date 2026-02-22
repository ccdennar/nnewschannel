import type { PagesFunction } from '@cloudflare/workers-types';

export interface Env {
  GUARDIAN_API_KEY: string;
  WORLD_NEWS_API_KEY?: string;
  NEWSDATA_API_KEY?: string;
  GNEWS_API_KEY?: string;
  NEXUS_KV: KVNamespace;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const region = url.searchParams.get('region') || 'global';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  const cacheKey = `news:${region}:${Date.now().toString().slice(0, -3)}`; // Cache per 10 seconds
  
  try {
    const cached = await env.NEXUS_KV.get(cacheKey);
    if (cached) {
      return new Response(cached, { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    console.log('Cache miss:', e);
  }

  const result = await fetchAggregatedNews(env, region, limit);
  
  const response = {
    stories: result.stories,
    meta: {
      region,
      total: result.stories.length,
      sources: result.sourcesUsed,
      fetchedAt: new Date().toISOString(),
    }
  };

  try {
    await env.NEXUS_KV.put(cacheKey, JSON.stringify(response), { expirationTtl: 60 });
  } catch (e) {
    console.log('Cache write failed:', e);
  }

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
};

async function fetchAggregatedNews(env: Env, region: string, limit: number) {
  const stories: any[] = [];
  const sourcesUsed: string[] = [];
  
  // PRIORITY 1: Unlimited free sources (always fetch these)
  const freeSources = [
    { name: 'guardian', fn: () => fetchGuardianAPI(env.GUARDIAN_API_KEY || 'test', region, limit) },
    { name: 'rss', fn: () => fetchRSSFeeds(region) },
    { name: 'gdelt', fn: () => fetchGDELT(region, limit) },
  ];
  
  if (region === 'tech' || region === 'global') {
    freeSources.push({ name: 'hackernews', fn: fetchHackerNews });
  }

  // Fetch all free sources in parallel
  const freeResults = await Promise.allSettled(
    freeSources.map(source => 
      fetchWithTimeout(source.fn, 10000, source.name)
    )
  );
  
  freeResults.forEach((result, idx) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      stories.push(...result.value);
      sourcesUsed.push(freeSources[idx].name);
    }
  });

  console.log(`[${region}] Free sources: ${sourcesUsed.join(', ')}, Stories: ${stories.length}`);

  // PRIORITY 2: If we have less than 5 stories, try paid APIs
  if (stories.length < 5) {
    console.log(`[${region}] Low story count, trying paid APIs...`);
    
    if (env.WORLD_NEWS_API_KEY) {
      try {
        const wnStories = await fetchWithTimeout(
          () => fetchWorldNewsAPI(env.WORLD_NEWS_API_KEY!, region, limit),
          8000,
          'worldnews'
        );
        if (wnStories.length > 0) {
          stories.push(...wnStories);
          sourcesUsed.push('worldnews');
        }
      } catch (e) {
        console.error('WorldNews failed:', e);
      }
    }
  }

  // PRIORITY 3: Emergency - if still less than 3 stories
  if (stories.length < 3) {
    console.log(`[${region}] EMERGENCY: Trying strict limit APIs...`);
    
    if (env.NEWSDATA_API_KEY) {
      try {
        const ndStories = await fetchWithTimeout(
          () => fetchNewsData(env.NEWSDATA_API_KEY!, region, limit),
          8000,
          'newsdata'
        );
        if (ndStories.length > 0) {
          stories.push(...ndStories);
          sourcesUsed.push('newsdata');
        }
      } catch (e) {
        console.error('NewsData failed:', e);
      }
    }

    if (stories.length < 3 && env.GNEWS_API_KEY) {
      try {
        const gnStories = await fetchWithTimeout(
          () => fetchGNews(env.GNEWS_API_KEY!, region, limit),
          8000,
          'gnews'
        );
        if (gnStories.length > 0) {
          stories.push(...gnStories);
          sourcesUsed.push('gnews');
        }
      } catch (e) {
        console.error('GNews failed:', e);
      }
    }
  }

  // If absolutely nothing worked, return fallback data
  if (stories.length === 0) {
    console.log(`[${region}] CRITICAL: All sources failed, returning fallback`);
    return {
      stories: getFallbackStories(region),
      sourcesUsed: ['fallback']
    };
  }

  return {
    stories: deduplicateAndRank(stories).slice(0, limit),
    sourcesUsed
  };
}

async function fetchWithTimeout<T>(fn: () => Promise<T>, ms: number, name: string): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${name} timeout`)), ms)
    )
  ]);
}

// ==================== GUARDIAN API (FREE - UNLIMITED) ====================
async function fetchGuardianAPI(apiKey: string, region: string, limit: number): Promise<any[]> {
  try {
    const sectionMap: Record<string, string> = {
      'africa': 'world',
      'asia': 'world', 
      'persian-gulf': 'world',
      'gulf': 'world',
      'global': 'world',
      'tech': 'technology',
      'independent': 'world'
    };

    const queryMap: Record<string, string> = {
      'africa': 'africa',
      'asia': 'asia',
      'persian-gulf': 'middleeast',
      'gulf': 'middleeast',
      'independent': 'politics OR protest OR conflict'
    };

    const section = sectionMap[region] || 'world';
    const query = queryMap[region];
    
    let url = `https://content.guardianapis.com/search?api-key=${apiKey}&section=${section}&show-fields=trailText,thumbnail,byline,headline&page-size=${Math.min(limit, 50)}&order-by=newest`;
    
    if (query) {
      url += `&q=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url, { 
      cf: { cacheTtl: 300 },
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.response?.status !== 'ok') throw new Error(data.response?.message || 'API error');
    
    return (data.response?.results || []).map((item: any) => ({
      id: `guardian-${item.id}`,
      title: item.webTitle,
      description: item.fields?.trailText || item.fields?.headline || '',
      url: item.webUrl,
      image: item.fields?.thumbnail || null,
      source: 'The Guardian',
      publishedAt: item.webPublicationDate || new Date().toISOString(),
      region: region,
      category: item.sectionName?.toLowerCase() || 'general',
      apiSource: 'guardian',
      isBreaking: isRecent(item.webPublicationDate, 60),
    }));
  } catch (e) {
    console.error('Guardian error:', e);
    return [];
  }
}

// ==================== RSS FEEDS (FREE - UNLIMITED) ====================
async function fetchRSSFeeds(region: string): Promise<any[]> {
  // Reliable RSS feeds that actually work with Cloudflare
  const feeds: Record<string, string[]> = {
    'africa': [
      'https://feeds.bbci.co.uk/news/world/africa/rss.xml',  // BBC Africa - most reliable
      'https://www.theguardian.com/world/africa/rss',         // Guardian Africa
      'https://www.aljazeera.com/xml/rss/all.xml',            // Al Jazeera (has Africa coverage)
      'https://mg.co.za/feed/',                               // Mail & Guardian (South Africa)
      'https://www.news24.com/rss',                           // News24 (South Africa)
      'https://nation.africa/kenya/feed',                     // Nation (Kenya)
      'https://www.theeastafrican.co.ke/rss.xml',             // East African
    ],
    'asia': [
      'https://feeds.bbci.co.uk/news/world/asia/rss.xml',
      'https://www.theguardian.com/world/asia/rss',
      'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
      'https://www.scmp.com/rss/91/feed',
      'https://asia.nikkei.com/rss',
      'https://www.japantimes.co.jp/feed/',
      'https://www.straitstimes.com/news/asia/rss.xml',
    ],
    'persian-gulf': [
      'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
      'https://www.aljazeera.com/xml/rss/all.xml',
      'https://gulfnews.com/rss',
      'https://www.thenationalnews.com/rss',
      'https://www.arabnews.com/rss.xml',
      'https://www.jpost.com/Rss/RssFeedsHeadlines.aspx',
      'https://www.timesofisrael.com/feed/',
    ],
    'global': [
      'https://feeds.bbci.co.uk/news/rss.xml',
      'https://www.theguardian.com/world/rss',
      'https://rss.cnn.com/rss/edition_world.rss',
      'https://apnews.com/rss',
      'https://feeds.npr.org/1001/rss.xml',
    ],
    'tech': [
      'https://techcrunch.com/feed/',
      'https://www.theverge.com/rss/index.xml',
      'https://www.wired.com/feed/rss',
      'https://arstechnica.com/feed/',
      'https://news.ycombinator.com/rss',
    ],
    'independent': [
      'https://theintercept.com/feed/?rss',
      'https://www.propublica.org/feeds/propublica/main',
      'https://www.motherjones.com/feed/',
      'https://reason.com/feed/',
      'https://www.commondreams.org/rss',
    ],
  };

  const regionKey = region === 'gulf' ? 'persian-gulf' : region;
  const regionFeeds = feeds[regionKey] || feeds['global'];
  
  // Fetch all feeds in parallel with individual timeouts
  const feedPromises = regionFeeds.map(async (feedUrl) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(feedUrl, {
        signal: controller.signal,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        cf: { cacheTtl: 600 }
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        console.log(`[RSS] ${feedUrl}: HTTP ${response.status}`);
        return [];
      }
      
      const text = await response.text();
      if (!text || text.length < 100) {
        console.log(`[RSS] ${feedUrl}: Empty response`);
        return [];
      }
      
      const items = parseRSS(text);
      console.log(`[RSS] ${feedUrl}: ${items.length} items`);
      
      // Take top 3 items per feed
      return items.slice(0, 3).map((item: any) => ({
        id: `rss-${hashString(item.link)}-${Date.now()}`,
        title: cleanText(item.title),
        description: cleanText(item.description).slice(0, 200),
        url: item.link,
        image: null,
        source: extractSourceFromRSS(text, feedUrl),
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        region: regionKey,
        category: detectCategoryFromSource(feedUrl),
        apiSource: 'rss',
        isBreaking: isRecent(item.pubDate, 60),
      }));
    } catch (e) {
      console.log(`[RSS] ${feedUrl}: ${e instanceof Error ? e.message : 'failed'}`);
      return [];
    }
  });
  
  const results = await Promise.all(feedPromises);
  const stories = results.flat();
  
  console.log(`[RSS] Total: ${stories.length} stories from ${regionKey}`);
  return stories;
}

// ==================== GDELT (FREE - UNLIMITED) ====================
async function fetchGDELT(region: string, limit: number): Promise<any[]> {
  try {
    // Better queries for each region
    const queryMap: Record<string, string> = {
      'africa': 'sourcecountry:NG OR sourcecountry:ZA OR sourcecountry:KE OR sourcecountry:EG OR sourcecountry:GH',
      'asia': 'sourcecountry:IN OR sourcecountry:CN OR sourcecountry:JP OR sourcecountry:KR',
      'persian-gulf': 'sourcecountry:AE OR sourcecountry:SA OR sourcecountry:QA OR sourcecountry:KW',
      'gulf': 'sourcecountry:AE OR sourcecountry:SA OR sourcecountry:QA',
      'global': 'theme:CONFLICT OR theme:PROTEST OR theme:ELECTION',
      'tech': 'theme:TECHNOLOGY',
      'independent': 'theme:CONFLICT OR theme:PROTEST OR theme:ELECTION OR theme:OPPOSITION'
    };

    const query = queryMap[region] || queryMap['global'];
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=${limit}&format=json`;
    
    const response = await fetch(url, { cf: { cacheTtl: 300 } });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const articles = data.items || [];
    
    console.log(`[GDELT] ${region}: ${articles.length} articles`);
    
    return articles.map((item: any, idx: number) => ({
      id: `gdelt-${idx}-${Date.now()}`,
      title: item.title || 'Untitled',
      description: `Source: ${item.domain || 'Unknown'} | Country: ${item.sourcecountry || 'Unknown'}`,
      url: item.url,
      image: null,
      source: item.domain || 'GDELT',
      publishedAt: item.seendate || new Date().toISOString(),
      region: region,
      category: 'conflict',
      apiSource: 'gdelt',
      isBreaking: true,
    }));
  } catch (e) {
    console.error('GDELT error:', e);
    return [];
  }
}

// ==================== HACKER NEWS (FREE) ====================
async function fetchHackerNews(): Promise<any[]> {
  try {
    const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      cf: { cacheTtl: 300 }
    });
    
    if (!response.ok) throw new Error('Failed to fetch');
    
    const storyIds = await response.json() as number[];
    const topIds = storyIds.slice(0, 10);
    
    const stories = await Promise.all(
      topIds.map(async (id) => {
        try {
          const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            cf: { cacheTtl: 300 }
          });
          if (!res.ok) return null;
          return await res.json();
        } catch { return null; }
      })
    );
    
    return stories
      .filter((s): s is any => s !== null && s.title)
      .map(story => ({
        id: `hn-${story.id}`,
        title: story.title,
        description: `Score: ${story.score} | Comments: ${story.descendants || 0}`,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        image: null,
        source: 'Hacker News',
        publishedAt: new Date(story.time * 1000).toISOString(),
        region: 'global',
        category: 'technology',
        apiSource: 'hackernews',
        isBreaking: false,
      }));
  } catch (e) {
    console.error('HackerNews error:', e);
    return [];
  }
}

// ==================== PAID APIs (LAST RESORT) ====================
async function fetchWorldNewsAPI(apiKey: string, region: string, limit: number): Promise<any[]> {
  const countryMap: Record<string, string> = {
    'africa': 'ng,za,ke,eg,gh',
    'asia': 'in,cn,jp,kr,id',
    'persian-gulf': 'ae,sa,qa,kw',
    'gulf': 'ae,sa,qa',
    'global': 'us,gb,ca',
    'tech': 'us,gb',
    'independent': 'us,gb'
  };

  const countries = countryMap[region] || 'us,gb';
  const url = `https://api.worldnewsapi.com/search-news?api-key=${apiKey}&number=${limit}&language=en&source-country=${countries}`;
  
  const response = await fetch(url, { 
    cf: { cacheTtl: 600 },
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  
  return (data.news || []).map((item: any, idx: number) => ({
    id: `wn-${idx}-${Date.now()}`,
    title: item.title,
    description: item.text?.substring(0, 300) || '',
    url: item.url,
    image: item.image || null,
    source: item.source_name || 'World News',
    publishedAt: item.publish_date || new Date().toISOString(),
    region: region,
    category: item.category || 'general',
    apiSource: 'worldnews',
    isBreaking: isRecent(item.publish_date, 60),
  }));
}

async function fetchNewsData(apiKey: string, region: string, limit: number): Promise<any[]> {
  const countryMap: Record<string, string> = {
    'africa': 'ng,za,ke,eg,gh',
    'asia': 'in,cn,jp,kr,id',
    'persian-gulf': 'ae,sa,qa,kw',
    'gulf': 'ae,sa,qa',
    'global': 'us,gb,ca',
    'tech': 'us,gb',
    'independent': 'us,gb'
  };

  const countries = countryMap[region] || 'us,gb';
  const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&country=${countries}&language=en&size=${limit}`;
  
  const response = await fetch(url, { 
    cf: { cacheTtl: 300 },
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  if (data.status !== 'success') throw new Error(data.message || 'API error');
  
  return (data.results || []).map((item: any) => ({
    id: `nd-${item.article_id || hashString(item.link)}`,
    title: item.title,
    description: item.description || item.content?.slice(0, 200) || '',
    url: item.link,
    image: item.image_url || null,
    source: item.source_id || 'Unknown',
    publishedAt: item.pubDate || new Date().toISOString(),
    region: detectRegion(item.country, region),
    category: item.category?.[0] || 'general',
    apiSource: 'newsdata',
    isBreaking: isRecent(item.pubDate, 30),
  }));
}

async function fetchGNews(apiKey: string, region: string, limit: number): Promise<any[]> {
  const countryMap: Record<string, string> = {
    'africa': 'ng,za,ke',
    'asia': 'in,jp,kr',
    'persian-gulf': 'ae,sa',
    'gulf': 'ae,sa',
    'global': 'us,gb',
    'tech': 'us',
    'independent': 'us'
  };

  const countries = countryMap[region] || 'us';
  const url = `https://gnews.io/api/v4/top-headlines?apikey=${apiKey}&country=${countries}&lang=en&max=${limit}`;
  
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  
  return (data.articles || []).map((item: any) => ({
    id: `gn-${hashString(item.url)}`,
    title: item.title,
    description: item.description || '',
    url: item.url,
    image: item.image || null,
    source: item.source?.name || 'Unknown',
    publishedAt: item.publishedAt || new Date().toISOString(),
    region: region,
    category: 'general',
    apiSource: 'gnews',
    isBreaking: isRecent(item.publishedAt, 30),
  }));
}

// ==================== FALLBACK ====================
function getFallbackStories(region: string): any[] {
  const fallbacks: Record<string, any[]> = {
    'africa': [
      {
        id: `fallback-africa-${Date.now()}`,
        title: 'Africa News - Temporary Connection Issue',
        description: 'We are experiencing connectivity issues with African news sources. Please try refreshing or check back shortly. BBC Africa and Guardian Africa feeds should be available.',
        url: 'https://www.bbc.com/news/world/africa',
        image: null,
        source: 'Nexus System',
        publishedAt: new Date().toISOString(),
        region: 'africa',
        category: 'system',
        apiSource: 'fallback',
        isBreaking: false,
      }
    ],
    'default': [
      {
        id: `fallback-${Date.now()}`,
        title: 'News Temporarily Unavailable',
        description: 'All news sources are currently unreachable. This is usually temporary. Please try again in a few minutes or switch to the Tech section for HackerNews (always available).',
        url: 'https://news.ycombinator.com',
        image: null,
        source: 'Nexus System',
        publishedAt: new Date().toISOString(),
        region: region,
        category: 'system',
        apiSource: 'fallback',
        isBreaking: false,
      }
    ]
  };
  
  return fallbacks[region] || fallbacks['default'];
}

// ==================== UTILITIES ====================
function deduplicateAndRank(stories: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];
  
  for (const story of stories) {
    const fingerprint = `${story.source}-${story.title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter((w: string) => w.length > 3)
      .slice(0, 6)
      .join('-')}`;
    
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      unique.push(story);
    }
  }
  
  return unique.sort((a, b) => {
    if (a.isBreaking && !b.isBreaking) return -1;
    if (!a.isBreaking && b.isBreaking) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

function isRecent(dateStr: string | undefined, minutes: number): boolean {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const diff = (Date.now() - date.getTime()) / 1000 / 60;
    return diff < minutes;
  } catch { return false; }
}

function detectRegion(countryCode: string | undefined, fallback: string): string {
  if (!countryCode) return fallback;
  const code = countryCode.toLowerCase();
  const africa = ['ng', 'za', 'ke', 'eg', 'gh', 'et', 'ug', 'tz'];
  const asia = ['in', 'cn', 'jp', 'kr', 'id', 'th', 'vn', 'my', 'ph', 'sg'];
  const gulf = ['ae', 'sa', 'qa', 'kw', 'bh', 'om', 'ir', 'iq'];
  
  if (africa.includes(code)) return 'africa';
  if (asia.includes(code)) return 'asia';
  if (gulf.includes(code)) return 'persian-gulf';
  return fallback;
}

function detectCategoryFromSource(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('tech') || lower.includes('wired') || lower.includes('verge')) return 'technology';
  if (lower.includes('business') || lower.includes('economist')) return 'business';
  return 'general';
}

function hashString(str: string | undefined): string {
  if (!str) return Math.random().toString(36).substring(7);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function parseRSS(xml: string): any[] {
  const items: any[] = [];
  const isAtom = xml.includes('<feed') || xml.includes('xmlns="http://www.w3.org/2005/Atom"');
  
  if (isAtom) {
    const entryRegex = /<entry[\s\S]*?<\/entry>/gi;
    const entries = xml.match(entryRegex) || [];
    for (const entry of entries) {
      const title = extractTag(entry, 'title');
      const link = extractAtomLink(entry);
      const content = extractTag(entry, 'content') || extractTag(entry, 'summary');
      const published = extractTag(entry, 'published') || extractTag(entry, 'updated');
      if (title && link) items.push({ title, link: link.trim(), description: content, pubDate: published });
    }
  } else {
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    const rssItems = xml.match(itemRegex) || [];
    for (const item of rssItems) {
      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link') || extractAttribute(item, 'link', 'href');
      const description = extractTag(item, 'description') || extractTag(item, 'summary');
      const pubDate = extractTag(item, 'pubDate');
      if (title && link) items.push({ title, link: link.trim(), description, pubDate });
    }
  }
  return items;
}

function extractAtomLink(entry: string): string | null {
  const hrefMatch = entry.match(/<link[^>]*href="([^"]*)"[^>]*>/i);
  return hrefMatch ? hrefMatch[1] : extractTag(entry, 'link');
}

function cleanText(text: string | null): string {
  if (!text) return '';
  return text.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[\\s\\S]*?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match?.[1] || null;
}

function extractAttribute(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*?${attr}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match?.[1] || null;
}

function extractSourceFromRSS(xml: string, url: string): string {
  const channelTitle = extractTag(xml, 'title');
  if (channelTitle) return channelTitle.replace(' - RSS Feed', '').replace(' RSS', '').trim();
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  } catch { return 'RSS Source'; }
}