import { useState } from 'react';
import { 
  Globe, 
  RefreshCw, 
  Radio, 
  Menu, 
  Search, 
  Bell, 
  MapPin, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { RegionType } from '@/types/news';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  articleCount: number;
  currentRegion?: string;
  onRegionChange?: (region: RegionType) => void;
  onSearch?: (query: string) => void;
}

const REGIONS = [
  { id: 'all', name: 'All', flag: '🌍' },
  { id: 'africa', name: 'Africa', flag: '🇳🇬' },
  { id: 'asia', name: 'Asia', flag: '🇮🇳' },
  { id: 'persian-gulf', name: 'Gulf', flag: '🇸🇦' },
  { id: 'global', name: 'Global', flag: '🌐' },
  { id: 'tech', name: 'Tech', flag: '💻' },
];

export function Header({ 
  onRefresh, 
  isRefreshing, 
  lastUpdated, 
  articleCount,
  currentRegion = 'all',
  onRegionChange,
  onSearch
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentRegionData = REGIONS.find(r => r.id === currentRegion) || REGIONS[0];

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md shadow-sm safe-top">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu */}
          {onRegionChange && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="flex flex-col gap-6 mt-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Nexus</h2>
                  </div>
                  <nav className="flex flex-col gap-2">
                    {REGIONS.map(region => (
                      <button
                        key={region.id}
                        onClick={() => onRegionChange(region.id as RegionType)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          currentRegion === region.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <span className="text-2xl">{region.flag}</span>
                        <span className="font-medium">{region.name}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Nexus
              </h1>
              <p className="text-xs text-muted-foreground">Global News Aggregation</p>
            </div>
          </div>
        </div>

        {/* Center: Desktop Region Tabs */}
        {onRegionChange && (
          <nav className="hidden lg:flex items-center gap-1">
            {REGIONS.map(region => (
              <button
                key={region.id}
                onClick={() => onRegionChange(region.id as RegionType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  currentRegion === region.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{region.flag}</span>
                <span>{region.name}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Right: Stats + Search + Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Stats - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
            <Badge variant="secondary" className="font-mono">
              {articleCount.toLocaleString()}
            </Badge>
            <div className="text-sm text-muted-foreground hidden lg:block">
              Updated: <span className="font-mono">{formatTime(lastUpdated)}</span>
            </div>
          </div>

          {/* Search */}
          {onSearch && (
            <>
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <Input
                    autoFocus
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-32 sm:w-48 lg:w-64"
                  />
                  <Button type="submit" size="icon" variant="ghost">
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </form>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search news..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-48"
                      />
                    </div>
                  </form>
                </>
              )}
            </>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hidden sm:flex">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {/* Location Indicator */}
          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{currentRegionData.flag}</span>
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    </header>
  );
}