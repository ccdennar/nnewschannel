import type { NewsItem } from '@/types/news';
import { NewsCard } from './NewsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Newspaper, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface NewsGridProps {
  articles: NewsItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function NewsCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

export function NewsGrid({ articles, loading, error, onRetry }: NewsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading news</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="mt-4 w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Newspaper className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No articles found</h3>
        <p className="text-muted-foreground max-w-md">
          We couldn&apos;t find any articles for this region. This might be due to API rate limits or temporary unavailability. 
          Try refreshing or selecting a different region.
        </p>
        <Button 
          variant="outline" 
          onClick={onRetry}
          className="mt-6"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {articles.map((article, index) => (
        <NewsCard 
          key={article.id} 
          article={article} 
          index={index}
        />
      ))}
    </div>
  );
}
