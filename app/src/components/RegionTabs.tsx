import { cn } from '@/lib/utils';
import { REGIONS, type RegionType, type RegionConfig } from '@/types/news';
import { 
  Globe, 
  MapPin, 
  Laptop, 
  Building,
  Megaphone
} from 'lucide-react';

interface RegionTabsProps {
  activeRegion: RegionType;
  onRegionChange: (region: RegionType) => void;
}

const iconMap: Record<string, React.ElementType> = {
  'globe': Globe,
  'map-pin': MapPin,
  'building': Building,
  'laptop': Laptop,
  'megaphone': Megaphone
};

function RegionIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = iconMap[icon] || MapPin;
  return <Icon className={className} />;
}

export function RegionTabs({ activeRegion, onRegionChange }: RegionTabsProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-2 p-1 min-w-max">
        {REGIONS.map((region: RegionConfig) => (
          <button
            key={region.id}
            onClick={() => onRegionChange(region.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200',
              'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'min-w-fit',
              activeRegion === region.id 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'bg-card text-card-foreground border hover:border-primary/50'
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-md flex items-center justify-center text-lg',
              activeRegion === region.id 
                ? 'bg-white/20' 
                : region.color
            )}>
              <RegionIcon icon={region.icon} className="w-4 h-4 text-white" />
            </div>
            
            <div className="text-left">
              <div className="font-medium text-sm">{region.name}</div>
              <div className={cn(
                'text-xs',
                activeRegion === region.id 
                  ? 'text-primary-foreground/70' 
                  : 'text-muted-foreground'
              )}>
                {region.description}
              </div>
            </div>

            {activeRegion === region.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-50" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RegionBadge({ region }: { region: RegionConfig }) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      region.color.replace('bg-', 'bg-opacity-10 text-')
    )}>
      <span>{region.icon}</span>
      <span>{region.name}</span>
    </div>
  );
}