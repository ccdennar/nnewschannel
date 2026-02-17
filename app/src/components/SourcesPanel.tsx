import { Badge } from '@/components/ui/badge';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  CheckCircle2, 
  Radio,
  Newspaper,
  Globe,
  Cpu,
  Rss
} from 'lucide-react';

interface SourcesPanelProps {
  sources: string[];
}

const SOURCE_INFO: Record<string, { name: string; icon: React.ElementType; description: string }> = {
  'hackernews': { 
    name: 'Hacker News', 
    icon: Cpu, 
    description: 'Tech news and discussions' 
  },
  'gdelt': { 
    name: 'GDELT', 
    icon: Globe, 
    description: 'Global event database' 
  },
  'bbc-africa': { 
    name: 'BBC Africa', 
    icon: Newspaper, 
    description: 'African news coverage' 
  },
  'bbc-world': { 
    name: 'BBC World', 
    icon: Newspaper, 
    description: 'International news' 
  },
  'al-jazeera': { 
    name: 'Al Jazeera', 
    icon: Newspaper, 
    description: 'Middle East & global news' 
  },
  'xinhua': { 
    name: 'Xinhua', 
    icon: Newspaper, 
    description: 'Chinese state media' 
  },
  'nikkei-asia': { 
    name: 'Nikkei Asia', 
    icon: Newspaper, 
    description: 'Asian business news' 
  },
  'scmp': { 
    name: 'SCMP', 
    icon: Newspaper, 
    description: 'South China Morning Post' 
  },
  'arab-news': { 
    name: 'Arab News', 
    icon: Newspaper, 
    description: 'Saudi-based news' 
  },
  'middle-east-eye': { 
    name: 'Middle East Eye', 
    icon: Newspaper, 
    description: 'Middle East analysis' 
  },
  'times-of-india': { 
    name: 'Times of India', 
    icon: Newspaper, 
    description: 'Indian news coverage' 
  },
  'news24': { 
    name: 'News24', 
    icon: Newspaper, 
    description: 'South African news' 
  },
  'cnn-world': { 
    name: 'CNN World', 
    icon: Newspaper, 
    description: 'Global news' 
  }
};

function getSourceDisplay(source: string): { name: string; icon: React.ElementType; description: string } {
  const normalized = source.toLowerCase().replace(/\s+/g, '-');
  
  // Check for exact match first
  if (SOURCE_INFO[normalized]) {
    return SOURCE_INFO[normalized];
  }
  
  // Check for partial matches
  for (const [key, info] of Object.entries(SOURCE_INFO)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return info;
    }
  }
  
  // Default
  return { 
    name: source.charAt(0).toUpperCase() + source.slice(1), 
    icon: Rss, 
    description: 'News feed' 
  };
}

export function SourcesPanel({ sources }: SourcesPanelProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <Accordion type="single" collapsible defaultValue="sources" className="w-full">
      <AccordionItem value="sources" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline py-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Active Sources</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {sources.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-wrap gap-2 pb-2">
            {sources.map((source) => {
              const info = getSourceDisplay(source);
              const Icon = info.icon;
              
              return (
                <div
                  key={source}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  title={info.description}
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{info.name}</span>
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
