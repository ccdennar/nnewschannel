import { useState } from 'react';
import { 
  Share2, 
  Bookmark, 
  ExternalLink, 
  Clock, 
  User, 
  Globe,
  Newspaper,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { NewsItem } from '@/types/news';
import { SOURCE_BIAS } from '@/types/news';

interface StoryCardProps {
  story?: NewsItem;
  article?: NewsItem;
  variant?: 'featured' | 'standard' | 'compact';
  index?: number;
}

// Unified time formatter
function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Your source color logic
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

// Your region badge logic
function getRegionBadge(region: string): { label: string; color: string } {
  switch (region) {
    case 'africa':
      return { label: 'Africa', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' };
    case 'asia':
      return { label: 'Asia', color: 'bg-rose-500/10 text-rose-600 border-rose-200' };
    case 'persian-gulf':
    case 'gulf':
      return { label: 'Persian Gulf', color: 'bg-amber-500/10 text-amber-600 border-amber-200' };
    case 'global':
      return { label: 'Global', color: 'bg-blue-500/10 text-blue-600 border-blue-200' };
    case 'independent':
      return { label: 'Independent', color: 'bg-purple-500/10 text-purple-600 border-purple-200' };
    case 'tech':
      return { label: 'Tech', color: 'bg-violet-500/10 text-violet-600 border-violet-200' };
    default:
      return { label: 'Global', color: 'bg-slate-500/10 text-slate-600 border-slate-200' };
  }
}

export function StoryCard({ story, article, variant = 'standard', index = 0 }: StoryCardProps) {
  const item = story || article; // Support both prop names
  const [isSaved, setIsSaved] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const regionBadge = getRegionBadge(item.region || item.sourceRegion || 'global');
  const sourceClass = getSourceColor(item.source);
  const biasInfo = item.bias ? SOURCE_BIAS[item.bias] : null;
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          url: item.url,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(item.url);
    }
  };

  // Get image URL (support both naming conventions)
  const imageUrl = item.image || item.imageUrl;

  // Featured variant (hero style)
  if (variant === 'featured') {
    return (
      <Card 
        className="relative overflow-hidden group cursor-pointer border-0 shadow-lg"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="relative h-64 sm:h-80 md:h-96">
          {!imageError && imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="text-6xl">📰</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Badges on image */}
          <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
            {(item as NewsStory).isBreaking && (
              <Badge className="bg-red-500 text-white animate-pulse border-0">
                🔴 BREAKING
              </Badge>
            )}
            <Badge variant="secondary" className="bg-black/50 text-white border-0">
              {regionBadge.label}
            </Badge>
            {biasInfo && (
              <Badge className={`${biasInfo.color} text-white border-0 flex items-center gap-1`}>
                <AlertTriangle className="w-3 h-3" />
                {biasInfo.label}
              </Badge>
            )}
          </div>

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
            <div className="flex items-center gap-2 text-sm text-white/80 mb-2">
              <span className="font-semibold">{item.source}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(item.publishedAt)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-2">
              {item.title}
            </h2>
            <p className="text-white/80 text-sm sm:text-base line-clamp-2 hidden sm:block">
              {item.description}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Standard card (merged both designs)
  return (
    <Card 
      className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image Section */}
      <div className="relative h-48 sm:h-56">
        {!imageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-4xl">📰</span>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {(item as NewsStory).isBreaking && (
            <Badge className="bg-red-500 text-white text-xs animate-pulse border-0">
              BREAKING
            </Badge>
          )}
          <Badge variant="secondary" className={`${regionBadge.color} text-xs backdrop-blur-sm`}>
            <Globe className="w-3 h-3 mr-1" />
            {regionBadge.label}
          </Badge>
        </div>

        {/* Bias badge (if no image, shown in content instead) */}
        {biasInfo && imageUrl && (
          <div className="absolute top-3 right-3">
            <Badge className={`${biasInfo.color} text-white text-xs border-0 flex items-center gap-1`}>
              <AlertTriangle className="w-3 h-3" />
              {biasInfo.label}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Source & Meta */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <Badge variant="outline" className={`${sourceClass} text-xs font-medium`}>
            <Newspaper className="w-3 h-3 mr-1" />
            {item.source}
          </Badge>
          
          {/* Bias label (if no image) */}
          {!imageUrl && biasInfo && (
            <Badge variant="outline" className={`${biasInfo.color.replace('bg-', 'text-').replace('600', '600 border-')} text-xs flex items-center gap-1`}>
              <AlertTriangle className="w-3 h-3" />
              {biasInfo.label}
            </Badge>
          )}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {timeAgo(item.publishedAt)}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {item.title}
          </a>
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {item.description || 'No description available'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-3">
            {item.author && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{item.author}</span>
              </span>
            )}
            {item.language && item.language !== 'en' && (
              <Badge variant="outline" className="text-[10px] uppercase">
                {item.language}
              </Badge>
            )}
          </div>

          {/* Actions with tooltips */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${isSaved ? 'text-primary' : ''}`}
                    onClick={() => setIsSaved(!isSaved)}
                  >
                    <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
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
                    <Share2 className="h-4 w-4" />
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
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
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
      </CardContent>
    </Card>
  );
}

// Export alias for backward compatibility
export { StoryCard as NewsCard };