import type { NewsItem } from '@/types/news';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Clock, 
  User, 
  Globe,
  Newspaper,
  Share2,
  Bookmark,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SOURCE_BIAS } from '@/types/news';

interface NewsCardProps {
  article: NewsItem;
  index?: number;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getSourceColor(source: string): string {
  const sourceLower = source.toLowerCase();
  if (sourceLower.includes('hackernews') || sourceLower.includes('hn')) {
    return 'bg-orange-500/10 text-orange-600 border-orange-200';
  }
  if (sourceLower.includes('bbc')) {
    return 'bg-red-500/10 text-red-600 border-red-200';
  }
  if (sourceLower.includes('al jazeera') || sourceLower.includes('aljazeera')) {
  return 'bg-orange-500/10 text-orange-600 border-orange-200';
  }
  if (sourceLower.includes('xinhua')) {
    return 'bg-red-600/10 text-red-700 border-red-300';
  }
  if (sourceLower.includes('nikkei')) {
    return 'bg-blue-500/10 text-blue-600 border-blue-200';
  }
  if (sourceLower.includes('scmp')) {
    return 'bg-slate-500/10 text-slate-600 border-slate-200';
  }
  if (sourceLower.includes('arab news') || sourceLower.includes('arabnews')) {
    return 'bg-green-500/10 text-green-600 border-green-200';
  }
  if (sourceLower.includes('middle east') || sourceLower.includes('middleeast')) {
    return 'bg-amber-500/10 text-amber-600 border-amber-200';
  }
  if (sourceLower.includes('gdelt')) {
    return 'bg-purple-500/10 text-purple-600 border-purple-200';
  }
  if (sourceLower.includes('times of india') || sourceLower.includes('timesofindia')) {
    return 'bg-indigo-500/10 text-indigo-600 border-indigo-200';
  }
  // Israeli sources
  if (sourceLower.includes('times of israel') || sourceLower.includes('timesofisrael')) {
    return 'bg-blue-500/10 text-blue-600 border-blue-200';
  }
  if (sourceLower.includes('jerusalem post') || sourceLower.includes('jpost')) {
    return 'bg-blue-600/10 text-blue-700 border-blue-300';
  }
  if (sourceLower.includes('haaretz')) {
    return 'bg-blue-400/10 text-blue-500 border-blue-200';
  }
  // RT News
  if (sourceLower.includes('rt') || sourceLower.includes('russia today')) {
    return 'bg-red-600/10 text-red-700 border-red-300';
  }
  // Independent/Alternative sources
  if (sourceLower.includes('rebel')) {
    return 'bg-orange-500/10 text-orange-600 border-orange-200';
  }
  if (sourceLower.includes('breitbart')) {
    return 'bg-orange-600/10 text-orange-700 border-orange-300';
  }
  if (sourceLower.includes('zerohedge')) {
    return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
  }
  if (sourceLower.includes('gateway pundit')) {
    return 'bg-red-500/10 text-red-600 border-red-200';
  }
  if (sourceLower.includes('infowars')) {
    return 'bg-red-700/10 text-red-800 border-red-400';
  }
  if (sourceLower.includes('activist')) {
    return 'bg-yellow-600/10 text-yellow-700 border-yellow-300';
  }
  if (sourceLower.includes('natural news')) {
    return 'bg-teal-500/10 text-teal-600 border-teal-200';
  }
  // Iran state media
  if (sourceLower.includes('tehran times') || sourceLower.includes('tehrantimes')) {
    return 'bg-green-600/10 text-green-700 border-green-300';
  }
  return 'bg-muted text-muted-foreground border-border';
}

function getRegionBadge(region: string): { label: string; color: string } {
  switch (region) {
    case 'africa':
      return { label: 'Africa', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' };
    case 'asia':
      return { label: 'Asia', color: 'bg-rose-500/10 text-rose-600 border-rose-200' };
    case 'persian-gulf':
      return { label: 'Persian Gulf', color: 'bg-amber-500/10 text-amber-600 border-amber-200' };
    case 'global':
      return { label: 'Global', color: 'bg-blue-500/10 text-blue-600 border-blue-200' };
    case 'independent':
      return { label: 'Independent', color: 'bg-purple-500/10 text-purple-600 border-purple-200' };
    default:
      return { label: 'Global', color: 'bg-slate-500/10 text-slate-600 border-slate-200' };
  }
}

export function NewsCard({ article, index = 0 }: NewsCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const regionBadge = getRegionBadge(article.sourceRegion);
  const sourceClass = getSourceColor(article.source);
  const biasInfo = article.bias ? SOURCE_BIAS[article.bias] : null;
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          url: article.url
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(article.url);
    }
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image */}
      {article.imageUrl && !imageError && (
        <div className="relative h-48 overflow-hidden bg-muted">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Floating badges on image */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <Badge variant="secondary" className={`${regionBadge.color} text-xs font-medium backdrop-blur-sm`}>
              <Globe className="w-3 h-3 mr-1" />
              {regionBadge.label}
            </Badge>
            {article.category && (
              <Badge variant="secondary" className="bg-black/50 text-white text-xs backdrop-blur-sm">
                {article.category}
              </Badge>
            )}
            {/* Bias label */}
            {biasInfo && (
              <Badge variant="secondary" className={`${biasInfo.color} text-white text-xs backdrop-blur-sm flex items-center gap-1`}>
                <AlertTriangle className="w-3 h-3" />
                {biasInfo.label}
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Source & Time */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <Badge variant="outline" className={`${sourceClass} text-xs font-medium`}>
            <Newspaper className="w-3 h-3 mr-1" />
            {article.source}
          </Badge>
          
          {/* Bias label (if no image) */}
          {!article.imageUrl && biasInfo && (
            <Badge variant="outline" className={`${biasInfo.color.replace('bg-', 'text-').replace('600', '600 border-')} text-xs flex items-center gap-1`}>
              <AlertTriangle className="w-3 h-3" />
              {biasInfo.label}
            </Badge>
          )}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {timeAgo(article.publishedAt)}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {article.title}
          </a>
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {article.description || 'No description available'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-3">
            {article.author && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{article.author}</span>
              </span>
            )}
            {article.language && article.language !== 'en' && (
              <Badge variant="outline" className="text-[10px] uppercase">
                {article.language}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bookmark</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open article</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </Card>
  );
}
