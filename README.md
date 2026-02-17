# Nexus - Global News Aggregation Platform

A production-ready real-time global news aggregation platform with specific focus on Asia, Africa, and the Persian Gulf regions.

## Features

- **Real-time News Aggregation**: Fetches live breaking news from multiple free-tier APIs
- **Regional Coverage**: Specialized coverage for Africa, Asia, Persian Gulf, and Global news
- **Geo-Aware Routing**: Intelligent failover system prioritizes regional APIs
- **Auto-Refresh**: News updates every 5 minutes automatically
- **Source Attribution**: Clear source labeling for all articles
- **Responsive Design**: Modern UI that works on all devices

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────────────────────┐
│   React UI  │────▶│  Worker     │────▶│  NewsData.io (Global + Regional)            │
│  (TypeScript)◄────│  Backend    │◄────│  GNews (Multi-language, 22 countries)       │
└─────────────┘     └─────────────┘     │  Currents API (15+ languages)               │
       │              │                 │  HackerNews API (Tech, Global)              │
       │              │                 │  GDELT (Global events, multilingual)        │
       │              │                 │  TheNewsAPI (Asia-Pacific focus)            │
       │              │                 │  African News API (Pan-African coverage)    │
       │              │                 │  Gulf News RSS (UAE, Saudi, Qatar, Kuwait)  │
       │              │                 │  Middle East Eye (Persian Gulf politics)    │
       │              │                 │  Times of India API (South Asia)            │
       │              │                 │  Xinhua News RSS (China/Asia)               │
       │              │                 │  Nikkei Asia RSS (East Asia business)       │
       │              ▼                 └─────────────────────────────────────────────┘
       │         ┌─────────────┐
       │         │  KV Cache   │
       │         │  (5 min TTL)│
       └────────►└─────────────┘
```

## Regional Coverage

### Africa (54 countries, 2000+ sources)
- NewsData.io: Nigeria, South Africa, Kenya, Egypt, Ghana, Uganda, Tanzania, Zimbabwe, Senegal, Ethiopia
- African News API: Pan-African aggregator
- RSS: BBC News Africa, Al Jazeera Africa, News24
- GDELT: Conflict, election, protest coverage

### Asia (49 countries, 3000+ sources)
- TheNewsAPI: India, China, Japan, Korea, Indonesia, Thailand, Vietnam, Malaysia, Philippines, Singapore
- Times of India RSS
- Xinhua News RSS
- Nikkei Asia RSS
- South China Morning Post RSS

### Persian Gulf / Middle East (6 GCC states + Iran, Iraq, Jordan, Lebanon)
- Gulf News RSS
- Middle East Eye RSS
- Al Jazeera English
- Arab News RSS
- Tehran Times RSS
- NewsData.io: UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman, Iran, Iraq, Jordan, Lebanon

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Cloudflare Workers
- **Caching**: Cloudflare KV (5-minute TTL)
- **APIs**: HackerNews, GDELT, RSS feeds (NewsData.io, GNews, Currents API with keys)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for worker deployment)

### Frontend Setup

```bash
cd app
npm install
npm run dev
```

### Worker Setup

```bash
cd nexus-worker
# Install wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Set up secrets
wrangler secret put NEWSDATA_API_KEY
wrangler secret put GNEWS_API_KEY
wrangler secret put CURRENTS_API_KEY

# Deploy
wrangler deploy
```

## API Endpoints

- `GET /api/news/africa` - African news
- `GET /api/news/asia` - Asian news
- `GET /api/news/persian-gulf` - Persian Gulf news
- `GET /api/news/global` - Global news
- `GET /api/news/all` - All regions combined
- `GET /api/news/tech` - Technology news from HackerNews
- `GET /api/status` - API status check
- `GET /health` - Health check

## Environment Variables

### Frontend
- `VITE_API_URL` - Backend API URL

### Worker
- `NEWSDATA_API_KEY` - NewsData.io API key
- `GNEWS_API_KEY` - GNews API key
- `CURRENTS_API_KEY` - Currents API key
- `NEXUS_KV` - Cloudflare KV namespace binding

## License

MIT License - See LICENSE file for details
