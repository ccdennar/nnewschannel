import { NewsAggregator } from './aggregator';
import { RegionConfig, NewsItem, CacheEntry } from './types';

// KV Cache TTL: 5 minutes (300 seconds)
const CACHE_TTL = 300;

// Region configurations for geo-aware routing
const REGION_CONFIG: RegionConfig = {
  africa: {
    primary: ['newsdata-io', 'gnews'],
    fallback: ['currents-api', 'gdelt-africa', 'rss-bbc-africa', 'rss-news24'],
    languages: ['en', 'fr', 'ar', 'sw', 'pt'],
    countries: ['ng', 'za', 'ke', 'eg', 'gh', 'ug', 'tz', 'zw', 'sn', 'et', 'cd', 'ml', 'bf', 'mr', 'ne']
  },
  asia: {
    primary: ['newsdata-io', 'gnews', 'currents-api'],
    fallback: ['rss-bbc-asia', 'rss-scmp', 'rss-timesofindia', 'rss-japantimes', 'rss-rt'],
    languages: ['en', 'zh', 'hi', 'ja', 'ko', 'id', 'th', 'vi', 'ms', 'tl'],
    countries: ['in', 'cn', 'jp', 'kr', 'id', 'th', 'vn', 'my', 'ph', 'sg', 'pk', 'bd', 'lk', 'np', 'mm']
  },
  'persian-gulf': {
    primary: ['newsdata-io', 'gnews', 'currents-api'],
    fallback: [
      'rss-aljazeera', 
      'rss-arabnews', 
      'rss-timesofisrael',
      'rss-jerusalempost',
      'rss-haaretz',
      'rss-tehrantimes',
      'rss-rt',
      'gdelt-gcc'
    ],
    languages: ['en', 'ar', 'fa', 'he'],
    countries: ['ae', 'sa', 'qa', 'kw', 'bh', 'om', 'ir', 'iq', 'jo', 'lb', 'il', 'ye', 'sy']
  },
  global: {
    primary: ['newsdata-io', 'gnews', 'currents-api'],
    fallback: ['hackernews', 'gdelt-global', 'rss-bbc-world', 'rss-aljazeera'],
    languages: ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it'],
    countries: ['us', 'gb', 'ca', 'au', 'de', 'fr', 'es', 'it', 'ru', 'br', 'mx']
  },
  independent: {
    primary: [],
    fallback: [
      'rss-rebelnews',
      'rss-rt',
      'rss-breitbart',
      'rss-zerohedge',
      'rss-gatewaypundit',
      'rss-infowars',
      'rss-activistpost',
      'rss-naturalnews'
    ],
    languages: ['en'],
    countries: []
  }
};

export interface Env {
  NEXUS_KV: KVNamespace;
  NEWSDATA_API_KEY: string;
  GNEWS_API_KEY: string;
  CURRENTS_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check endpoint
      if (path === '/health') {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }), { headers: corsHeaders });
      }

      // API status endpoint
      if (path === '/api/status') {
        const status = await getAPIStatus(env);
        return new Response(JSON.stringify(status), { headers: corsHeaders });
      }

      // News endpoints by region
      if (path === '/api/news/africa') {
        const news = await fetchRegionalNews('africa', env, ctx);
        return new Response(JSON.stringify(news), { headers: corsHeaders });
      }

      if (path === '/api/news/asia') {
        const news = await fetchRegionalNews('asia', env, ctx);
        return new Response(JSON.stringify(news), { headers: corsHeaders });
      }

      if (path === '/api/news/persian-gulf') {
        const news = await fetchRegionalNews('persian-gulf', env, ctx);
        return new Response(JSON.stringify(news), { headers: corsHeaders });
      }

      if (path === '/api/news/global') {
        const news = await fetchRegionalNews('global', env, ctx);
        return new Response(JSON.stringify(news), { headers: corsHeaders });
      }

      if (path === '/api/news/independent') {
        const news = await fetchRegionalNews('independent', env, ctx);
        return new Response(JSON.stringify(news), { headers: corsHeaders });
      }

      if (path === '/api/news/all') {
        const news = await fetchAllNews(env, ctx);
        return new Response(JSON.stringify(news), { headers: corsHeaders });
      }

      if (path === '/api/news/tech') {
        const news = await fetchTechNews(env, ctx);
        return new Response(JSON.stringify(news), { headers: corsHeaders });
      }

      // Default: return API info
      return new Response(JSON.stringify({
        name: 'Nexus News API',
        version: '1.0.0',
        endpoints: [
          '/api/news/africa',
          '/api/news/asia', 
          '/api/news/persian-gulf',
          '/api/news/global',
          '/api/news/independent',
          '/api/news/all',
          '/api/news/tech',
          '/api/status',
          '/health'
        ]
      }), { headers: corsHeaders });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};

async function fetchRegionalNews(
  region: keyof typeof REGION_CONFIG, 
  env: Env, 
  ctx: ExecutionContext
): Promise<{ region: string; articles: NewsItem[]; sources: string[]; timestamp: string }> {
  const cacheKey = `news:${region}`;
  
  // Try cache first
  const cached = await env.NEXUS_KV.get<CacheEntry>(cacheKey, 'json');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL * 1000) {
    return {
      region,
      articles: cached.articles,
      sources: cached.sources,
      timestamp: new Date(cached.timestamp).toISOString()
    };
  }

  const aggregator = new NewsAggregator(env);
  const config = REGION_CONFIG[region];
  
  const articles: NewsItem[] = [];
  const activeSources: string[] = [];
  
  // Try primary sources
  for (const source of config.primary) {
    try {
      const result = await aggregator.fetchFromSource(source, region, config);
      if (result.articles.length > 0) {
        articles.push(...result.articles);
        activeSources.push(source);
      }
    } catch (error) {
      console.error(`Primary source ${source} failed:`, error);
    }
  }
  
  // If no articles from primary, try fallback
  if (articles.length === 0) {
    for (const source of config.fallback) {
      try {
        const result = await aggregator.fetchFromSource(source, region, config);
        if (result.articles.length > 0) {
          articles.push(...result.articles);
          activeSources.push(source);
        }
      } catch (error) {
        console.error(`Fallback source ${source} failed:`, error);
      }
    }
  }

  // Deduplicate and sort by date
  const uniqueArticles = deduplicateArticles(articles);
  const sortedArticles = uniqueArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ).slice(0, 50);

  // Cache the result
  const cacheEntry: CacheEntry = {
    articles: sortedArticles,
    sources: activeSources,
    timestamp: Date.now()
  };
  
  ctx.waitUntil(
    env.NEXUS_KV.put(cacheKey, JSON.stringify(cacheEntry), { expirationTtl: CACHE_TTL })
  );

  return {
    region,
    articles: sortedArticles,
    sources: activeSources,
    timestamp: new Date().toISOString()
  };
}

async function fetchAllNews(env: Env, ctx: ExecutionContext) {
  const regions: (keyof typeof REGION_CONFIG)[] = ['africa', 'asia', 'persian-gulf', 'global', 'independent'];
  const results = await Promise.all(
    regions.map(region => fetchRegionalNews(region, env, ctx))
  );
  
  const allArticles = results.flatMap(r => r.articles);
  const uniqueArticles = deduplicateArticles(allArticles);
  const sortedArticles = uniqueArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ).slice(0, 100);

  return {
    articles: sortedArticles,
    regions: results.map(r => ({ region: r.region, sources: r.sources })),
    totalArticles: sortedArticles.length,
    timestamp: new Date().toISOString()
  };
}

async function fetchTechNews(env: Env, ctx: ExecutionContext) {
  const cacheKey = 'news:tech';
  
  const cached = await env.NEXUS_KV.get<CacheEntry>(cacheKey, 'json');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL * 1000) {
    return {
      category: 'tech',
      articles: cached.articles,
      timestamp: new Date(cached.timestamp).toISOString()
    };
  }

  const aggregator = new NewsAggregator(env);
  const articles: NewsItem[] = [];
  
  try {
    const hnNews = await aggregator.fetchHackerNews();
    articles.push(...hnNews);
  } catch (error) {
    console.error('HackerNews failed:', error);
  }

  // Also try tech from other APIs
  try {
    const techNews = await aggregator.fetchTechFromNewsAPIs();
    articles.push(...techNews);
  } catch (error) {
    console.error('Tech news fetch failed:', error);
  }

  const sortedArticles = articles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ).slice(0, 30);

  const cacheEntry: CacheEntry = {
    articles: sortedArticles,
    sources: ['hackernews', 'newsdata-io', 'gnews'],
    timestamp: Date.now()
  };
  
  ctx.waitUntil(
    env.NEXUS_KV.put(cacheKey, JSON.stringify(cacheEntry), { expirationTtl: CACHE_TTL })
  );

  return {
    category: 'tech',
    articles: sortedArticles,
    timestamp: new Date().toISOString()
  };
}

function deduplicateArticles(articles: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return articles.filter(article => {
    const key = article.url || article.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getAPIStatus(env: Env): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {};
  
  // Check which APIs have keys configured
  status['newsdata-io'] = !!env.NEWSDATA_API_KEY;
  status['gnews'] = !!env.GNEWS_API_KEY;
  status['currents-api'] = !!env.CURRENTS_API_KEY;
  status['hackernews'] = true;
  status['rss-feeds'] = true;
  status['gdelt'] = true;
  
  return status;
}
