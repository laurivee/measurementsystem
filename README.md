# Measurement System - Tap-Only Web App

A phone-first web application for operators to record manufacturing events through simple tap interactions. Built with Next.js (App Router) on Vercel and Supabase for backend services.

## Overview

This system enables operators to quickly log manufacturing events (start/complete, blockers, rework, defects) with minimal taps. Supervisors can monitor live WIP, throughput, and quality metrics in real-time.

**Key Features:**
- ≤ 3 taps to log a start or complete event
- Phone-first tap UI with large, accessible buttons
- Real-time WIP and metrics dashboard
- CSV export for analysis
- Median write latency < 600 ms

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Realtime, Edge Functions)
- **Deployment**: Vercel (frontend), Supabase (backend)

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Vercel account (for deployment)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/jukka-matti/measurementsystem.git
cd measurementsystem
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
```bash
# Using Supabase CLI
supabase db reset

# Or manually apply migrations from supabase/migrations/
```

5. Seed demo data (optional):
```bash
supabase db seed
```

6. Start development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Project Structure

```
/
├── docs/                    # Documentation
│   ├── PDR.md              # Product Design Requirements
│   ├── agents.md           # AI agent guide
│   ├── ARCHITECTURE.md     # Technical architecture
│   ├── API.md              # API documentation
│   └── DEPLOYMENT.md       # Deployment guide
├── supabase/
│   ├── migrations/         # Database migrations
│   ├── functions/          # Edge Functions
│   └── seed.sql           # Seed data
├── src/
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and clients
│   ├── types/              # TypeScript types
│   └── hooks/              # React hooks
└── public/                 # Static assets
```

## Key Documentation

- **[PDR](docs/PDR.md)** - Complete Product Design Requirements
- **[Architecture](docs/ARCHITECTURE.md)** - Technical architecture and data model
- **[API](docs/API.md)** - API endpoint documentation
- **[Deployment](docs/DEPLOYMENT.md)** - Deployment instructions
- **[Agents](docs/agents.md)** - Guide for AI agents working on this project

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Database Migrations

Create a new migration:
```bash
supabase migration new migration_name
```

Apply migrations:
```bash
supabase db reset
```

### Edge Functions

Deploy edge functions:
```bash
supabase functions deploy ingest_event
supabase functions deploy bulk_ingest
supabase functions deploy export_csv
```

## Testing

Demo credentials:
- Operator: `operator@demo` / `demo123`
- Supervisor: `supervisor@demo` / `demo123`

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

