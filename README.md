# Hermes — Monorepo Structure

This is the official Hermes MVP repository structure.

## Directory Structure

```
hermes/
├── .github/
│   └── workflows/           # CI/CD pipelines
├── apps/
│   ├── hil-agent/           # Hermes Intelligence Lab
│   ├── hoie-agent/          # Opportunity Intelligence Engine
│   └── api/                 # REST API layer
├── packages/
│   ├── types/               # Shared TypeScript schemas
│   └── utils/               # Shared utilities
├── scripts/                 # One-off scripts
└── migrations/              # Supabase migrations
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Run migrations
supabase db push
```

## Documentation Status

All strategic documentation is **LOCKED** and located in `/opt/data/docs/architecture/`.

See `/opt/data/docs/architecture/05-project-setup.md` for deployment details.

---