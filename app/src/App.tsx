import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { RegionTabs } from '@/components/RegionTabs';
import { NewsGrid } from '@/components/NewsGrid';
import { NewsFeed } from '@/components/NewsFeed';
import { SourcesPanel } from '@/components/SourcesPanel';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { useNews } from '@/hooks/useNews';
import type { Region, RegionType } from '@/types/news';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Info, X, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import './App.css';

function App() {
  // Support both region type systems
  const [activeRegion, setActiveRegion] = useState<RegionType>('all');
  const [region, setRegion] = useState<Region>('global');
  const [activeTab, setActiveTab] = useState('home');
  const [showBanner, setShowBanner] = useState(true);
  
  const { 
    articles, 
    stories, // Alias for compatibility
    loading, 
    error, 
    lastUpdated,
    hasMore,
    loadMore,
    activeSources, 
    refresh 
  } = useNews(activeRegion);

  // Sync region types
  useEffect(() => {
    const map: Record<RegionType, Region> = {
      'all': 'global',
      'global': 'global',
      'africa': 'africa',
      'asia': 'asia',
      'persian-gulf': 'persian-gulf',
      'tech': 'tech',
      'independent': 'independent'
    };
    setRegion(map[activeRegion] || 'global');
  }, [activeRegion]);

  // Show toast when region changes
  useEffect(() => {
    if (!loading && (articles?.length > 0 || stories?.length > 0)) {
      const count = articles?.length || stories?.length || 0;
      toast.success(`Loaded ${count} articles from ${activeRegion.replace('-', ' ')}`);
    }
  }, [activeRegion, articles, stories, loading]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleRegionChange = (newRegion: RegionType) => {
    setActiveRegion(newRegion);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query: string) => {
    console.log('Search:', query);
    // Implement search functionality
  };

  // Use articles or stories (backward compatibility)
  const displayStories = stories || articles || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-right" richColors />
      
      {/* Desktop Header */}
      <Header 
        onRefresh={refresh}
        isRefreshing={loading}
        lastUpdated={lastUpdated}
        articleCount={displayStories.length}
        currentRegion={region}
        onRegionChange={(r) => handleRegionChange(r as RegionType)}
        onSearch={handleSearch}
      />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 lg:pb-6">
        {/* Info Banner */}
        {showBanner && (
          <Alert className="mb-6 relative">
            <Info className="h-4 w-4" />
            <AlertTitle>Welcome to Nexus</AlertTitle>
            <AlertDescription className="pr-8">
              Nexus aggregates real-time news from Africa, Asia, Persian Gulf & Global sources.
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => setShowBanner(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* API Limit Warning */}
        {displayStories.length === 0 && !loading && !error && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">API Rate Limits</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Some news sources may be temporarily unavailable. 
              Try again in a few minutes or check the Tech section for HackerNews (always available).
            </AlertDescription>
          </Alert>
        )}

        {/* Region Tabs (Desktop) */}
        <div className="hidden lg:block mb-6">
          <RegionTabs 
            activeRegion={activeRegion}
            onRegionChange={handleRegionChange}
          />
        </div>

        {/* Sources Panel */}
        <div className="hidden lg:block mb-6">
          <SourcesPanel sources={activeSources} />
        </div>

        {/* News Feed (Mobile-First, works on Desktop too) */}
        <NewsFeed
          stories={displayStories}
          loading={loading}
          error={error}
          hasMore={hasMore || false}
          onLoadMore={loadMore || (() => {})}
          onRefresh={refresh}
          region={region}
        />

        {/* Fallback to NewsGrid if NewsFeed not available */}
        {!stories && (
          <NewsGrid 
            articles={articles}
            loading={loading}
            error={error}
            onRetry={refresh}
          />
        )}
      </main>

      {/* Desktop Footer */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;