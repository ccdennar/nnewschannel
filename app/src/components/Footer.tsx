import { 
  Github, 
  Twitter, 
  Globe, 
  Heart,
  ExternalLink,
  Database,
  Zap
} from 'lucide-react';

export function Footer() {
  const apis = [
    { name: 'HackerNews', url: 'https://news.ycombinator.com' },
    { name: 'GDELT', url: 'https://gdeltproject.org' },
    { name: 'RSS2JSON', url: 'https://rss2json.com' },
    { name: 'NewsData.io', url: 'https://newsdata.io' },
    { name: 'GNews', url: 'https://gnews.io' },
    { name: 'Currents API', url: 'https://currentsapi.services' }
  ];

  const sources = [
    { name: 'BBC', url: 'https://bbc.com' },
    { name: 'Al Jazeera', url: 'https://aljazeera.com' },
    { name: 'Xinhua', url: 'https://xinhuanet.com' },
    { name: 'Nikkei', url: 'https://asia.nikkei.com' },
    { name: 'SCMP', url: 'https://scmp.com' },
    { name: 'Arab News', url: 'https://arabnews.com' }
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Nexus</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time global news aggregation platform with focus on Asia, Africa, and the Persian Gulf regions.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <span>for the world</span>
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data APIs
            </h4>
            <ul className="space-y-2">
              {apis.map((api) => (
                <li key={api.name}>
                  <a
                    href={api.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    {api.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* News Sources */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              News Sources
            </h4>
            <ul className="space-y-2">
              {sources.map((source) => (
                <li key={source.name}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    {source.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          <div>
            <h4 className="font-semibold mb-4">Coverage</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Regions</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Countries</span>
                <span className="font-medium">100+</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sources</span>
                <span className="font-medium">5000+</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Languages</span>
                <span className="font-medium">20+</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Update freq</span>
                <span className="font-medium">5 min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nexus News. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
