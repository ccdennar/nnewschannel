import { useEffect, useRef, useCallback } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StoryCard } from './StoryCard';
import type { NewsStory } from '@/types/news';

interface NewsFeedProps {
  stories: NewsStory[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  region: string;
}

export function NewsFeed({ 
  stories, 
  loading, 
  error, 
  hasMore, 
  onLoadMore, 
  onRefresh,
  region 
}: NewsFeedProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (loading || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loading, hasMore, onLoadMore]);

  // Separate featured story (first breaking or first story)
  const featuredStory = stories.find(s => s.isBreaking) || stories[0];
  const regularStories = stories.filter(s => s.id !== featuredStory?.id);

  if (error && stories.length === 0) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
      {/* Refresh button (mobile: floating, desktop: static) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold capitalize">{region} News</h1>
          <p className="text-sm text-muted-foreground">
            {stories.length} stories • Updated just now
          </p>
        </div>
        <Button 
          onClick={onRefresh} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="hidden sm:flex gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Featured Story */}
      {featuredStory && (
        <div className="mb-6">
          <StoryCard story={featuredStory} variant="featured" />
        </div>
      )}

      {/* Category Pills (Mobile scrollable, Desktop flex) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2 sm:flex-wrap sm:overflow-visible">
        {['All', 'Breaking', 'Politics', 'Business', 'Tech', 'Sports'].map((cat) => (
          <Button
            key={cat}
            variant={cat === 'All' ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Stories Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {regularStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {/* Loading / Load More */}
      <div ref={loadMoreRef} className="mt-8 flex justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading more stories...</span>
          </div>
        )}
        {!hasMore && stories.length > 0 && (
          <p className="text-muted-foreground text-sm">No more stories</p>
        )}
      </div>

      {/* Mobile Refresh FAB */}
      <Button
        onClick={onRefresh}
        disabled={loading}
        size="icon"
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg lg:hidden z-40"
      >
        <RefreshCw className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}