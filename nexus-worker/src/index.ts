import { NewsAggregator } from './aggregator';
import { RegionConfig, NewsItem, CacheEntry } from './types';

// KV Cache TTL: 5 minutes (300 seconds)
const CACHE_TTL = 300;

// Comprehensive RSS Feed Database
const RSS_FEEDS: Record<string, Array<{ url: string; name: string; region: string; bias?: string; language?: string }>> = {
  africa: [
    // Pan-African & Major Outlets
    { url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', name: 'BBC Africa', region: 'africa', language: 'en' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', region: 'africa', language: 'en' },
    { url: 'https://www.news24.com/rss', name: 'News24 South Africa', region: 'africa', language: 'en' },
    { url: 'https://www.iol.co.za/rss', name: 'Independent Online SA', region: 'africa', language: 'en' },
    { url: 'https://mg.co.za/rss', name: 'Mail & Guardian', region: 'africa', language: 'en' },
    { url: 'https://www.dailymaverick.co.za/rss', name: 'Daily Maverick', region: 'africa', language: 'en' },
    { url: 'https://www.enca.com/rss', name: 'eNCA', region: 'africa', language: 'en' },
    
    // West Africa
    { url: 'https://www.premiumtimesng.com/feed', name: 'Premium Times Nigeria', region: 'africa', language: 'en' },
    { url: 'https://saharareporters.com/rss.xml', name: 'Sahara Reporters', region: 'africa', language: 'en' },
    { url: 'https://www.legit.ng/rss', name: 'Legit.ng', region: 'africa', language: 'en' },
    { url: 'https://www.ghanaWeb.com/rss', name: 'GhanaWeb', region: 'africa', language: 'en' },
    { url: 'https://www.citinewsroom.com/feed/', name: 'Citi Newsroom Ghana', region: 'africa', language: 'en' },
    { url: 'https://www.thecable.ng/feed', name: 'The Cable Nigeria', region: 'africa', language: 'en' },
    
    // East Africa
    { url: 'https://www.theeastafrican.co.ke/rss', name: 'The East African', region: 'africa', language: 'en' },
    { url: 'https://www.nation.co.ke/rss', name: 'Daily Nation Kenya', region: 'africa', language: 'en' },
    { url: 'https://www.standardmedia.co.ke/rss', name: 'The Standard Kenya', region: 'africa', language: 'en' },
    { url: 'https://www.monitor.co.ug/rss', name: 'Daily Monitor Uganda', region: 'africa', language: 'en' },
    { url: 'https://www.thecitizen.co.tz/rss', name: 'The Citizen Tanzania', region: 'africa', language: 'en' },
    { url: 'https://www.ethiopianewsagency.gov.et/rss', name: 'Ethiopian News Agency', region: 'africa', language: 'en' },
    
    // North Africa
    { url: 'https://www.dailynewssegypt.com/feed/', name: 'Daily News Egypt', region: 'africa', language: 'en' },
    { url: 'https://www.moroccoworldnews.com/feed', name: 'Morocco World News', region: 'africa', language: 'en' },
    { url: 'https://www.tunisienumerique.com/en/feed/', name: 'Tunisie Numerique', region: 'africa', language: 'en' },
    
    // French Language
    { url: 'https://www.jeuneafrique.com/rss', name: 'Jeune Afrique', region: 'africa', language: 'fr' },
    { url: 'https://www.rfi.fr/rss', name: 'RFI Afrique', region: 'africa', language: 'fr' },
    
    // Business & Development
    { url: 'https://www.africanbusinessmagazine.com/feed/', name: 'African Business', region: 'africa', language: 'en' },
    { url: 'https://www.afdb.org/en/news-and-events/rss', name: 'African Development Bank', region: 'africa', language: 'en' },
  ],
  
  asia: [
    // South Asia
    { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', name: 'BBC Asia', region: 'asia', language: 'en' },
    { url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', name: 'Times of India', region: 'asia', language: 'en' },
    { url: 'https://www.thehindu.com/news/?service=rss', name: 'The Hindu', region: 'asia', language: 'en' },
    { url: 'https://www.hindustantimes.com/rss', name: 'Hindustan Times', region: 'asia', language: 'en' },
    { url: 'https://www.ndtv.com/rss', name: 'NDTV', region: 'asia', language: 'en' },
    { url: 'https://www.dawn.com/feeds', name: 'Dawn Pakistan', region: 'asia', language: 'en' },
    { url: 'https://www.thedailystar.net/rss.xml', name: 'Daily Star Bangladesh', region: 'asia', language: 'en' },
    { url: 'https://www.dhakatribune.com/feed/', name: 'Dhaka Tribune', region: 'asia', language: 'en' },
    { url: 'https://www.thekathmandupost.com/rss', name: 'Kathmandu Post', region: 'asia', language: 'en' },
    { url: 'https://www.colombotelegraph.com/feed/', name: 'Colombo Telegraph', region: 'asia', language: 'en' },
    
    // East Asia
    { url: 'https://www.scmp.com/rss/91/feed', name: 'South China Morning Post', region: 'asia', language: 'en' },
    { url: 'https://www.japantimes.co.jp/feed/', name: 'Japan Times', region: 'asia', language: 'en' },
    { url: 'https://mainichi.jp/english/rss', name: 'Mainichi Japan', region: 'asia', language: 'en' },
    { url: 'https://www.asahi.com/ajw/rss/', name: 'Asahi Shimbun', region: 'asia', language: 'en' },
    { url: 'https://www.koreaherald.com/rss', name: 'Korea Herald', region: 'asia', language: 'en' },
    { url: 'https://www.koreatimes.co.kr/www/rss', name: 'Korea Times', region: 'asia', language: 'en' },
    { url: 'https://www.taipeitimes.com/xml', name: 'Taipei Times', region: 'asia', language: 'en' },
    { url: 'https://www.hongkongfp.com/feed/', name: 'Hong Kong Free Press', region: 'asia', language: 'en' },
    
    // Southeast Asia
    { url: 'https://www.channelnewsasia.com/rss', name: 'CNA Singapore', region: 'asia', language: 'en' },
    { url: 'https://www.straitstimes.com/global/rss', name: 'Straits Times', region: 'asia', language: 'en' },
    { url: 'https://www.bangkokpost.com/rss', name: 'Bangkok Post', region: 'asia', language: 'en' },
    { url: 'https://www.thejakartapost.com/rss', name: 'Jakarta Post', region: 'asia', language: 'en' },
    { url: 'https://www.philstar.com/rss', name: 'Philippine Star', region: 'asia', language: 'en' },
    { url: 'https://www.rappler.com/rss', name: 'Rappler Philippines', region: 'asia', language: 'en' },
    { url: 'https://www.malaysiakini.com/en/rss', name: 'Malaysiakini', region: 'asia', language: 'en' },
    { url: 'https://www.freemalaysiatoday.com/feed/', name: 'Free Malaysia Today', region: 'asia', language: 'en' },
    { url: 'https://www.vietnamnews.vn/rss', name: 'Vietnam News', region: 'asia', language: 'en' },
    { url: 'https://e.vnexpress.net/rss', name: 'VNExpress', region: 'asia', language: 'en' },
    
    // Central Asia
    { url: 'https://eurasianet.org/rss.xml', name: 'EurasiaNet', region: 'asia', language: 'en' },
    { url: 'https://www.rferl.org/rss', name: 'Radio Free Europe', region: 'asia', language: 'en' },
    
    // Regional
    { url: 'https://www.asiatimes.com/feed/', name: 'Asia Times', region: 'asia', language: 'en' },
  ],
  
  'persian-gulf': [
    // Gulf States
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', region: 'persian-gulf', language: 'en' },
    { url: 'https://www.arabnews.com/rss.xml', name: 'Arab News', region: 'persian-gulf', language: 'en' },
    { url: 'https://gulfnews.com/rss', name: 'Gulf News UAE', region: 'persian-gulf', language: 'en' },
    { url: 'https://www.khaleejtimes.com/rss', name: 'Khaleej Times', region: 'persian-gulf', language: 'en' },
    { url: 'https://www.thenationalnews.com/rss', name: 'The National UAE', region: 'persian-gulf', language: 'en' },
    { url: 'https://saudigazette.com.sa/rss', name: 'Saudi Gazette', region: 'persian-gulf', language: 'en' },
    { url: 'https://www.arabianbusiness.com/rss', name: 'Arabian Business', region: 'persian-gulf', language: 'en' },
    
    // Iran
    { url: 'https://www.tehrantimes.com/rss', name: 'Tehran Times', region: 'persian-gulf', language: 'en', bias: 'iran-state' },
    { url: 'https://en.irna.ir/rss', name: 'IRNA Iran', region: 'persian-gulf', language: 'en', bias: 'iran-state' },
    { url: 'https://financialtribune.com/rss', name: 'Financial Tribune Iran', region: 'persian-gulf', language: 'en' },
    { url: 'https://www.al-monitor.com/rss', name: 'Al-Monitor', region: 'persian-gulf', language: 'en' },
    
    // Israel/Palestine
    { url: 'https://www.timesofisrael.com/feed/', name: 'Times of Israel', region: 'persian-gulf', language: 'en', bias: 'israel' },
    { url: 'https://www.jpost.com/Rss/RssFeedsHeadlines.aspx', name: 'Jerusalem Post', region: 'persian-gulf', language: 'en', bias: 'israel' },
    { url: 'https://www.haaretz.com/rss/feeds/1.142007', name: 'Haaretz', region: 'persian-gulf', language: 'en', bias: 'israel-left' },
    { url: 'https://www.palestinechronicle.com/feed/', name: 'Palestine Chronicle', region: 'persian-gulf', language: 'en' },
    
    // Regional Analysis
    { url: 'https://www.middleeasteye.net/rss', name: 'Middle East Eye', region: 'persian-gulf', language: 'en' },
    { url: 'https://www.mei.edu/rss', name: 'Middle East Institute', region: 'persian-gulf', language: 'en' },
    { url: 'https://carnegieendowment.org/rss', name: 'Carnegie Endowment', region: 'persian-gulf', language: 'en' },
    { url: 'https://www.crisisgroup.org/rss', name: 'Crisis Group', region: 'persian-gulf', language: 'en' },
  ],
  
  global: [
    // Western Mainstream
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', region: 'global', language: 'en' },
    { url: 'https://rss.cnn.com/rss/edition_world.rss', name: 'CNN World', region: 'global', language: 'en' },
    { url: 'https://feeds.reuters.com/reuters/worldnews', name: 'Reuters World', region: 'global', language: 'en' },
    { url: 'https://feeds.afr.com/rss/world', name: 'Australian Financial Review', region: 'global', language: 'en' },
    { url: 'https://www.theguardian.com/world/rss', name: 'Guardian World', region: 'global', language: 'en' },
    { url: 'https://www.independent.co.uk/news/world/rss', name: 'Independent', region: 'global', language: 'en' },
    { url: 'https://www.france24.com/en/rss', name: 'France 24', region: 'global', language: 'en' },
    { url: 'https://www.dw.com/en/rss', name: 'Deutsche Welle', region: 'global', language: 'en' },
    { url: 'https://www.france24.com/en/rss', name: 'France 24', region: 'global', language: 'en' },
    
    // Eastern Europe & Russia
    { url: 'https://www.rt.com/rss/news/', name: 'RT World', region: 'global', language: 'en', bias: 'russia-state' },
    { url: 'https://sputniknews.com/export/rss2/archive/index.xml', name: 'Sputnik', region: 'global', language: 'en', bias: 'russia-state' },
    { url: 'https://tass.com/rss/v2.xml', name: 'TASS', region: 'global', language: 'en', bias: 'russia-state' },
    { url: 'https://www.pravda.ru/export.xml', name: 'Pravda', region: 'global', language: 'en', bias: 'russia-state' },
    { url: 'https://www.themoscowtimes.com/rss', name: 'Moscow Times', region: 'global', language: 'en' },
    { url: 'https://meduza.io/en/rss/all', name: 'Meduza', region: 'global', language: 'en' },
    { url: 'https://balkaninsight.com/feed/', name: 'Balkan Insight', region: 'global', language: 'en' },
    { url: 'https://www.politico.eu/rss', name: 'Politico Europe', region: 'global', language: 'en' },
    { url: 'https://www.euronews.com/rss', name: 'Euronews', region: 'global', language: 'en' },
    { url: 'https://www.eastasiaforum.org/feed/', name: 'East Asia Forum', region: 'global', language: 'en' },
    
    // Middle East & North Africa
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', region: 'global', language: 'en' },
    { url: 'https://www.al-monitor.com/rss', name: 'Al-Monitor', region: 'global', language: 'en' },
    { url: 'https://www.middleeasteye.net/rss', name: 'Middle East Eye', region: 'global', language: 'en' },
    { url: 'https://www.dailysabah.com/rss', name: 'Daily Sabah', region: 'global', language: 'en', bias: 'turkey-state' },
    { url: 'https://www.hurriyetdailynews.com/rss', name: 'Hurriyet', region: 'global', language: 'en' },
    
    // Latin America
    { url: 'https://www.telesurenglish.net/rss', name: 'Telesur', region: 'global', language: 'en', bias: 'venezuela-state' },
    { url: 'https://www.brasil247.com/en/feed/', name: 'Brasil 247', region: 'global', language: 'en' },
    
    // Asia-Pacific
    { url: 'https://www.channelnewsasia.com/rss', name: 'CNA', region: 'global', language: 'en' },
    { url: 'https://www.scmp.com/rss/91/feed', name: 'SCMP', region: 'global', language: 'en' },
    
    // Independent/Alternative
    { url: 'https://www.globalresearch.ca/rss', name: 'Global Research', region: 'global', language: 'en', bias: 'independent-left' },
    { url: 'https://thegrayzone.com/feed/', name: 'The Grayzone', region: 'global', language: 'en', bias: 'independent-left' },
    { url: 'https://www.jacobinmag.com/feed', name: 'Jacobin', region: 'global', language: 'en', bias: 'independent-left' },
    { url: 'https://theintercept.com/feed/', name: 'The Intercept', region: 'global', language: 'en', bias: 'independent-left' },
    { url: 'https://www.democracynow.org/democracynow.rss', name: 'Democracy Now', region: 'global', language: 'en', bias: 'independent-left' },
    
    // Tech & Business
    { url: 'https://feeds.feedburner.com/TechCrunch', name: 'TechCrunch', region: 'global', language: 'en' },
    { url: 'https://www.wired.com/feed/rss', name: 'Wired', region: 'global', language: 'en' },
    { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', region: 'global', language: 'en' },
    { url: 'https://arstechnica.com/feed/', name: 'Ars Technica', region: 'global', language: 'en' },
  ],
  
  independent: [
    { url: 'https://www.rebelnews.com/rss', name: 'Rebel News', region: 'global', language: 'en', bias: 'independent-right' },
    { url: 'https://www.breitbart.com/feed/', name: 'Breitbart', region: 'global', language: 'en', bias: 'independent-right' },
    { url: 'https://www.thegatewaypundit.com/feed/', name: 'Gateway Pundit', region: 'global', language: 'en', bias: 'independent-right' },
    { url: 'https://www.zerohedge.com/rss', name: 'ZeroHedge', region: 'global', language: 'en', bias: 'independent-financial' },
    { url: 'https://www.infowars.com/rss', name: 'InfoWars', region: 'global', language: 'en', bias: 'independent-conspiracy' },
    { url: 'https://rss.infowars.com/', name: 'InfoWars RSS', region: 'global', language: 'en', bias: 'independent-conspiracy' },
    { url: 'https://www.activistpost.com/feed/', name: 'Activist Post', region: 'global', language: 'en', bias: 'independent-alt' },
    { url: 'https://www.naturalnews.com/rss.xml', name: 'Natural News', region: 'global', language: 'en', bias: 'independent-health' },
    { url: 'https://www.rt.com/rss/news/', name: 'RT News', region: 'global', language: 'en', bias: 'russia-state' },
    { url: 'https://sputniknews.com/export/rss2/archive/index.xml', name: 'Sputnik', region: 'global', language: 'en', bias: 'russia-state' },
  ]
};

// Region configurations for geo-aware routing
const REGION_CONFIG: RegionConfig = {
  africa: {
    primary: ['newsdata-io', 'gnews'],
    fallback: ['currents-api', 'gdelt-africa', 'rss'],
    languages: ['en', 'fr', 'ar', 'sw', 'pt'],
    countries: ['ng', 'za', 'ke', 'eg', 'gh', 'ug', 'tz', 'zw', 'sn', 'et', 'cd', 'ml', 'bf', 'mr', 'ne']
  },
  asia: {
    primary: ['newsdata-io', 'gnews', 'currents-api'],
    fallback: ['gdelt-asia', 'rss'],
    languages: ['en', 'zh', 'hi', 'ja', 'ko', 'id', 'th', 'vi', 'ms', 'tl'],
    countries: ['in', 'cn', 'jp', 'kr', 'id', 'th', 'vn', 'my', 'ph', 'sg', 'pk', 'bd', 'lk', 'np', 'mm']
  },
  'persian-gulf': {
    primary: ['newsdata-io', 'gnews', 'currents-api'],
    fallback: ['gdelt-gcc', 'rss'],
    languages: ['en', 'ar', 'fa', 'he'],
    countries: ['ae', 'sa', 'qa', 'kw', 'bh', 'om', 'ir', 'iq', 'jo', 'lb', 'il', 'ye', 'sy']
  },
  global: {
    primary: ['newsdata-io', 'gnews', 'currents-api'],
    fallback: ['hackernews', 'gdelt-global', 'rss'],
    languages: ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it'],
    countries: ['us', 'gb', 'ca', 'au', 'de', 'fr', 'es', 'it', 'ru', 'br', 'mx']
  },
  independent: {
    primary: [],
    fallback: ['rss'],
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
      const regionEndpoints: Record<string, keyof typeof REGION_CONFIG> = {
        '/api/news/africa': 'africa',
        '/api/news/asia': 'asia',
        '/api/news/persian-gulf': 'persian-gulf',
        '/api/news/global': 'global',
        '/api/news/independent': 'independent'
      };

      if (regionEndpoints[path]) {
        const news = await fetchRegionalNews(regionEndpoints[path], env, ctx);
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

// Helper: Fetch RSS via rss2json
async function fetchRSS(url: string, name: string): Promise<NewsItem[]> {
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl);
    
    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
    
    const data = await res.json();
    
    if (data.status !== 'ok' || !data.items) {
      return [];
    }
    
    return data.items.slice(0, 10).map((item: any, idx: number) => ({
      id: `rss-${name.replace(/\s+/g, '-')}-${idx}-${Date.now()}`,
      title: item.title || 'Untitled',
      description: cleanHtml(item.description || item.content || '').substring(0, 300),
      url: item.link || item.url || '#',
      imageUrl: item.enclosure?.link || item.thumbnail,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      source: name,
      sourceRegion: 'global',
      language: 'en',
      author: item.author
    }));
  } catch (error) {
    console.error(`RSS error for ${name}:`, error);
    return [];
  }
}

// Helper: Fetch HackerNews
async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids = await res.json() as number[];
    const topIds = ids.slice(0, 15);
    
    const stories = await Promise.all(
      topIds.map(async (id) => {
        try {
          const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
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
    console.error('HackerNews error:', error);
    return [];
  }
}

// Helper: Clean HTML
function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

  const articles: NewsItem[] = [];
  const activeSources: string[] = [];
  
  // Fetch RSS feeds for this region
  const feeds = RSS_FEEDS[region] || RSS_FEEDS.global;
  const feedPromises = feeds.map(async (feed) => {
    try {
      const news = await fetchRSS(feed.url, feed.name);
      if (news.length > 0) {
        return { news, source: feed.name };
      }
    } catch (error) {
      console.error(`Failed to fetch ${feed.name}:`, error);
    }
    return null;
  });
  
  const feedResults = await Promise.allSettled(feedPromises);
  feedResults.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      articles.push(...result.value.news);
      activeSources.push(result.value.source);
    }
  });

  // Try NewsData.io if available
  if (env.NEWSDATA_API_KEY) {
    try {
      const aggregator = new NewsAggregator(env);
      const result = await aggregator.fetchFromSource('newsdata-io', region, REGION_CONFIG[region]);
      if (result.articles.length > 0) {
        articles.push(...result.articles);
        activeSources.push('newsdata-io');
      }
    } catch (error) {
      console.error('NewsData.io failed:', error);
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

  const articles: NewsItem[] = [];
  
  // Fetch HackerNews
  const hnNews = await fetchHackerNews();
  articles.push(...hnNews);
  
  // Try aggregator for tech news
  if (env.NEWSDATA_API_KEY) {
    try {
      const aggregator = new NewsAggregator(env);
      const techNews = await aggregator.fetchTechFromNewsAPIs();
      articles.push(...techNews);
    } catch (error) {
      console.error('Tech news fetch failed:', error);
    }
  }

  const sortedArticles = articles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ).slice(0, 30);

  const cacheEntry: CacheEntry = {
    articles: sortedArticles,
    sources: ['hackernews', 'newsdata-io'],
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