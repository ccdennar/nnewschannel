import type { PagesFunction } from '@cloudflare/workers-types';

export interface Env {
  GUARDIAN_API_KEY: string;
  WORLD_NEWS_API_KEY?: string;
  NEWSDATA_API_KEY?: string;
  GNEWS_API_KEY?: string;
  CURRENTS_API_KEY?: string;
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
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  const cacheKey = `news:${region}:${page}`;
  
  try {
    const cached = await env.NEXUS_KV.get(cacheKey);
    if (cached) {
      return new Response(cached, { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    console.log('Cache miss or error:', e);
  }

  const stories = await fetchAggregatedNews(env, region, limit);
  
  const response = {
    stories,
    meta: {
      region,
      page,
      total: stories.length,
      fetchedAt: new Date().toISOString(),
    }
  };

  try {
    await env.NEXUS_KV.put(cacheKey, JSON.stringify(response), {
      expirationTtl: 300
    });
  } catch (e) {
    console.log('Cache write failed:', e);
  }

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
};

async function fetchAggregatedNews(env: Env, region: string, limit: number) {
  const sources: Promise<any[]>[] = [];

  // PRIORITY 1: FREE/UNLIMITED SOURCES
  sources.push(fetchGuardianAPI(env.GUARDIAN_API_KEY || 'test', region, limit));
  sources.push(fetchRSSFeeds(region)); // FULL RSS LIST RESTORED
  sources.push(fetchGDELT(region, limit));
  
  if (region === 'tech' || region === 'global') {
    sources.push(fetchHackerNews());
  }

  // PRIORITY 2: FREEMIUM APIs
  if (env.WORLD_NEWS_API_KEY) {
    sources.push(fetchWorldNewsAPI(env.WORLD_NEWS_API_KEY, region, limit));
  }

  // PRIORITY 3: STRICT LIMIT APIs (only if no World News API)
  if (env.NEWSDATA_API_KEY && !env.WORLD_NEWS_API_KEY) {
    sources.push(fetchNewsData(env.NEWSDATA_API_KEY, region, limit));
  }
  if (env.GNEWS_API_KEY) {
    sources.push(fetchGNews(env.GNEWS_API_KEY, region, limit));
  }

  const results = await Promise.allSettled(
    sources.map(source => 
      Promise.race([
        source,
        new Promise<[]>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 15000)
        )
      ])
    )
  );
  
  const allStories = results
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  if (allStories.length === 0) {
    return getFallbackStories(region);
  }

  return deduplicateAndRank(allStories).slice(0, limit);
}

// ==================== GUARDIAN API ====================
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
      'gulf': 'middleeast'
    };

    const section = sectionMap[region] || 'world';
    const query = queryMap[region];
    
    let url = `https://content.guardianapis.com/search?api-key=${apiKey}&section=${section}&show-fields=trailText,thumbnail,byline,headline&page-size=${limit}&order-by=newest`;
    
    if (query) {
      url += `&q=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url, { 
      cf: { cacheTtl: 600 },
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.error('Guardian API error:', response.status);
      throw new Error(`Guardian API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.response?.status !== 'ok') {
      console.error('Guardian API returned error:', data);
      return [];
    }
    
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
    console.error('Guardian API error:', e);
    return [];
  }
}

// ==================== WORLD NEWS API ====================
async function fetchWorldNewsAPI(apiKey: string, region: string, limit: number): Promise<any[]> {
  try {
    const countryMap: Record<string, string> = {
      'africa': 'ng,za,ke,eg,gh,et,ug,tz',
      'asia': 'in,cn,jp,kr,id,th,vn,my,sg,ph',
      'persian-gulf': 'ae,sa,qa,kw,bh,om',
      'gulf': 'ae,sa,qa,kw',
      'global': 'us,gb,ca,au',
      'tech': 'us,gb',
      'independent': 'us,gb'
    };

    const countries = countryMap[region] || 'us,gb';
    const url = `https://api.worldnewsapi.com/search-news?api-key=${apiKey}&number=${limit}&language=en&source-country=${countries}`;
    
    const response = await fetch(url, { 
      cf: { cacheTtl: 600 },
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.error('World News API error:', response.status);
      throw new Error(`World News API failed: ${response.status}`);
    }
    
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
  } catch (e) {
    console.error('World News API error:', e);
    return [];
  }
}

// ==================== HACKER NEWS ====================
async function fetchHackerNews(): Promise<any[]> {
  try {
    const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      cf: { cacheTtl: 300 }
    });
    
    if (!response.ok) throw new Error('Failed to fetch HN stories');
    
    const storyIds = await response.json() as number[];
    const topIds = storyIds.slice(0, 15);
    
    const stories = await Promise.all(
      topIds.map(async (id) => {
        try {
          const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            cf: { cacheTtl: 300 }
          });
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
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

// ==================== NEWSDATA.IO ====================
async function fetchNewsData(apiKey: string, region: string, limit: number): Promise<any[]> {
  try {
    const countryMap: Record<string, string> = {
      'africa': 'ng,za,ke,eg,gh',
      'asia': 'in,cn,jp,kr,id',
      'persian-gulf': 'ae,sa,qa,kw,bh,om',
      'gulf': 'ae,sa,qa,kw',
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
    
    if (!response.ok) {
      console.error('NewsData API error:', response.status);
      throw new Error(`NewsData API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'success') {
      console.error('NewsData API returned error:', data);
      return [];
    }
    
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
  } catch (e) {
    console.error('NewsData error:', e);
    return [];
  }
}

// ==================== GNEWS ====================
async function fetchGNews(apiKey: string, region: string, limit: number): Promise<any[]> {
  try {
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
    
    if (!response.ok) {
      console.error('GNews API error:', response.status);
      throw new Error(`GNews API failed: ${response.status}`);
    }
    
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
  } catch (e) {
    console.error('GNews error:', e);
    return [];
  }
}

// ==================== FULL RSS FEEDS (ALL RESTORED) ====================
async function fetchRSSFeeds(region: string): Promise<any[]> {
  const feeds: Record<string, string[]> = {
    // AFRICA - 17 feeds (ALL RESTORED)
    'africa': [
      'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
      'https://www.africanews.com/rss',
      'https://www.aljazeera.com/xml/rss/all.xml',
      'https://qz.com/africa/feed',
      'https://mg.co.za/feed/',
      'https://www.dailymaverick.co.za/rss/',
      'https://www.citizen.co.za/feed/',
      'https://punchng.com/feed/',
      'https://www.vanguardngr.com/feed/',
      'https://guardian.ng/feed/',
      'https://nation.africa/kenya/feed',
      'https://www.standardmedia.co.ke/rss/kenya.php',
      'https://dailynewsegypt.com/feed/',
      'https://www.menafn.com/menafn_rss.ashx',
      'https://www.theeastafrican.co.ke/rss.xml',
      'https://www.jeuneafrique.com/feed/',
      'http://www.panapress.com/rss/',
    ],
    
    // ASIA - 22 feeds (ALL RESTORED)
    'asia': [
      'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
      'https://www.thehindu.com/news/?service=rss',
      'https://www.hindustantimes.com/rss/topnews/rssfeed.xml',
      'https://feeds.feedburner.com/ndtvnews-top-stories',
      'https://indianexpress.com/feed/',
      'http://www.xinhuanet.com/english/rss/worldrss.xml',
      'http://www.chinadaily.com.cn/rss/world_rss.xml',
      'https://www.scmp.com/rss/91/feed',
      'https://asia.nikkei.com/rss',
      'https://www.japantimes.co.jp/feed/',
      'http://www.koreaherald.com/rss/0204.xml',
      'https://www.koreatimes.co.kr/www/rss/rss.xml',
      'https://thediplomat.com/feed/',
      'https://www.thejakartapost.com/feed/',
      'https://www.bangkokpost.com/rss/data/topstories.xml',
      'https://www.straitstimes.com/news/asia/rss.xml',
      'https://www.channelnewsasia.com/rss/outbound/',
      'https://www.nationthailand.com/feed',
      'https://vietnamnews.vn/rss.html',
      'https://www.thestar.com.my/rss/news',
      'https://www.dawn.com/feeds/home',
      'https://tribune.com.pk/feed/',
      'https://www.dhakatribune.com/feed/',
    ],
    
    // PERSIAN GULF / MIDDLE EAST - 18 feeds (ALL RESTORED)
    'persian-gulf': [
      'https://gulfnews.com/rss',
      'https://www.thenationalnews.com/rss',
      'https://www.khaleejtimes.com/feed',
      'https://www.arabnews.com/rss.xml',
      'https://saudigazette.com.sa/feed/',
      'https://www.aljazeera.com/xml/rss/all.xml',
      'https://www.aljazeera.com/xml/rss/middleeast.xml',
      'https://www.middleeasteye.net/rss',
      'https://www.middleeastmonitor.com/feed/',
      'https://www.tehrantimes.com/rss',
      'https://en.mehrnews.com/rss',
      'https://www.jpost.com/Rss/RssFeedsHeadlines.aspx',
      'https://www.timesofisrael.com/feed/',
      'https://www.haaretz.com/misc/rss',
      'https://www.dailysabah.com/rss',
      'http://www.hurriyetdailynews.com/rss.php',
      'http://www.jordantimes.com/rss',
      'https://www.dailystar.com.lb/RSS.ashx',
      'https://www.naharnet.com/rss',
    ],
    
    // GLOBAL / WESTERN - 23 feeds (ALL RESTORED)
    'global': [
      'https://feeds.bbci.co.uk/news/rss.xml',
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://rss.cnn.com/rss/edition.rss',
      'https://rss.cnn.com/rss/edition_world.rss',
      'https://apnews.com/rss',
      'https://feeds.npr.org/1001/rss.xml',
      'https://feeds.npr.org/1004/rss.xml',
      'https://www.theguardian.com/world/rss',
      'https://www.theguardian.com/uk/rss',
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      'http://feeds.washingtonpost.com/rss/world',
      'https://www.france24.com/en/rss',
      'https://rss.dw.com/rdf/rss-en-all',
      'https://news.sky.com/feeds/rss/home.xml',
      'https://abcnews.go.com/abcnews/topstories',
      'https://www.cbsnews.com/latest/rss/main',
      'http://feeds.nbcnews.com/nbcnews/public/news',
      'https://www.politico.com/rss/politics08.xml',
      'https://thehill.com/feed/',
      'https://www.axios.com/feeds/feed.rss',
      'https://www.vox.com/rss/index.xml',
      'https://www.buzzfeed.com/world.xml',
      'https://www.vice.com/en/rss',
    ],
    
    // TECH / BUSINESS - 16 feeds (ALL RESTORED)
    'tech': [
      'https://news.ycombinator.com/rss',
      'https://techcrunch.com/feed/',
      'https://www.theverge.com/rss/index.xml',
      'http://feeds.arstechnica.com/arstechnica/index',
      'https://www.wired.com/feed/rss',
      'https://www.engadget.com/rss.xml',
      'https://www.cnet.com/rss/news/',
      'https://www.zdnet.com/news/rss.xml',
      'https://venturebeat.com/feed/',
      'https://www.ft.com/?format=rss',
      'https://feeds.bloomberg.com/bloomberg/index.rss',
      'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
      'https://www.economist.com/rss',
      'https://www.forbes.com/real-time/feed2/',
      'https://www.businessinsider.com/rss',
      'http://feeds.marketwatch.com/marketwatch/topstories/',
    ],
    
    // INDEPENDENT / ALTERNATIVE - 16 feeds (ALL RESTORED)
    'independent': [
      'https://www.democracynow.org/democracynow.rss',
      'https://theintercept.com/feed/?rss',
      'https://www.propublica.org/feeds/propublica/main',
      'https://www.motherjones.com/feed/',
      'https://www.thenation.com/feed/?post_type=article',
      'https://jacobin.com/feed',
      'https://newrepublic.com/rss.xml',
      'https://reason.com/feed/',
      'https://feeds.feedburner.com/zerohedge/feed',
      'http://feeds.feedburner.com/DrudgeReportFeed',
      'https://feeds.feedburner.com/breitbart',
      'https://dailycaller.com/feed/',
      'https://www.infowars.com/rss',
      'https://www.naturalnews.com/rss.xml',
      'https://www.commondreams.org/rss',
      'https://truthout.org/feed/',
    ],
  };

  const regionKey = region === 'gulf' ? 'persian-gulf' : region;
  const regionFeeds = feeds[regionKey] || feeds['global'];
  
  const stories: any[] = [];
  const errors: string[] = [];
  
  // Fetch ALL feeds in parallel with timeout
  const feedPromises = regionFeeds.map(async (feedUrl) => {
    try {
      const response = await fetch(feedUrl, {
        headers: { 
          'User-Agent': 'NexusNews/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml'
        },
        cf: { cacheTtl: 600 }
      });
      
      if (!response.ok) {
        errors.push(`${feedUrl}: HTTP ${response.status}`);
        return [];
      }
      
      const text = await response.text();
      
      if (!text || text.length < 100) {
        errors.push(`${feedUrl}: Empty response`);
        return [];
      }
      
      const items = parseRSS(text);
      
      return items.slice(0, 5).map((item: any) => ({
        id: `rss-${hashString(item.link)}-${Date.now()}`,
        title: item.title?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || 'Untitled',
        description: item.description?.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').slice(0, 200) || '',
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
      errors.push(`${feedUrl}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return [];
    }
  });
  
  const results = await Promise.all(feedPromises);
  stories.push(...results.flat());
  
  if (errors.length > 0) {
    console.log('RSS fetch errors:', errors.length, 'feeds failed');
  }
  
  return stories;
}

// ==================== GDELT ====================
async function fetchGDELT(region: string, limit: number): Promise<any[]> {
  try {
    const themeMap: Record<string, string> = {
      'africa': 'africa',
      'asia': 'asia',
      'persian-gulf': 'gcc',
      'gulf': 'gcc',
      'global': 'world',
      'tech': 'world',
      'independent': 'world'
    };

    const geo = themeMap[region] || 'world';
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=theme:CONFLICT%20OR%20theme:PROTEST%20OR%20theme:ELECTION%20AND%20geo:${geo}&mode=artlist&maxrecords=${limit}&format=json`;
    
    const response = await fetch(url, {
      cf: { cacheTtl: 300 }
    });
    
    if (!response.ok) {
      throw new Error(`GDELT failed: ${response.status}`);
    }
    
    const data = await response.json();
    const articles = data.articles || [];
    
    return articles.map((item: any) => ({
      id: `gdelt-${hashString(item.url || item.documentIdentifier)}`,
      title: item.title || 'Untitled',
      description: item.seen || item.domain || '',
      url: item.url || `https://${item.domain}`,
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

// ==================== FALLBACK ====================
function getFallbackStories(region: string): any[] {
  return [
    {
      id: `fallback-1-${Date.now()}`,
      title: 'News temporarily unavailable',
      description: 'We are experiencing high demand. Please try again in a few minutes, or check the Tech section for HackerNews (always available).',
      url: 'https://news.ycombinator.com',
      image: null,
      source: 'Nexus System',
      publishedAt: new Date().toISOString(),
      region: region,
      category: 'system',
      apiSource: 'fallback',
      isBreaking: false,
    }
  ];
}

// ==================== UTILITY FUNCTIONS ====================
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
  } catch {
    return false;
  }
}

function detectRegion(countryCode: string | undefined, fallback: string): string {
  if (!countryCode) return fallback;
  
  const code = countryCode.toLowerCase();
  const africa = ['ng', 'za', 'ke', 'eg', 'gh', 'et', 'ug', 'tz', 'sn', 'zw'];
  const asia = ['in', 'cn', 'jp', 'kr', 'id', 'th', 'vn', 'my', 'ph', 'sg', 'bd', 'pk'];
  const gulf = ['ae', 'sa', 'qa', 'kw', 'bh', 'om', 'ir', 'iq'];
  
  if (africa.includes(code)) return 'africa';
  if (asia.includes(code)) return 'asia';
  if (gulf.includes(code)) return 'persian-gulf';
  return fallback;
}

function detectCategoryFromSource(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('tech') || lower.includes('hacker') || lower.includes('verge') || lower.includes('wired')) {
    return 'technology';
  }
  if (lower.includes('business') || lower.includes('market') || lower.includes('economist') || lower.includes('forbes')) {
    return 'business';
  }
  if (lower.includes('sport')) {
    return 'sports';
  }
  if (lower.includes('entertainment')) {
    return 'entertainment';
  }
  if (lower.includes('health')) {
    return 'health';
  }
  if (lower.includes('science')) {
    return 'science';
  }
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
      
      if (title && link) {
        items.push({
          title: cleanText(title),
          link: link.trim(),
          description: cleanText(content),
          pubDate: published,
        });
      }
    }
  } else {
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    const rssItems = xml.match(itemRegex) || [];
    
    for (const item of rssItems) {
      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link') || extractAttribute(item, 'link', 'href');
      const description = extractTag(item, 'description') || extractTag(item, 'summary') || extractTag(item, 'content:encoded');
      const pubDate = extractTag(item, 'pubDate') || extractTag(item, 'dc:date');
      
      if (title && link) {
        items.push({
          title: cleanText(title),
          link: link.trim(),
          description: cleanText(description),
          pubDate: pubDate,
        });
      }
    }
  }
  
  return items;
}

function extractAtomLink(entry: string): string | null {
  const hrefMatch = entry.match(/<link[^>]*href="([^"]*)"[^>]*>/i);
  if (hrefMatch) return hrefMatch[1];
  return extractTag(entry, 'link');
}

function cleanText(text: string | null): string {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  if (channelTitle) {
    return channelTitle.replace(' - RSS Feed', '').replace(' RSS', '').trim();
  }
  
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  } catch {
    return 'RSS Source';
  }
}