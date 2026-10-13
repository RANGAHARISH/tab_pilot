# TabPilot Optional Supabase Backend & AI Proxy

This directory contains optional cloud sync and server-side AI proxy artifacts for TabPilot.

## Architecture

1. **PostgreSQL Schema & RLS**:
   - `migrations/20261013000000_tabpilot_schema.sql` defines tables (`workspaces`, `sessions`, `saved_tabs`) with Row Level Security (RLS) guaranteeing that users can only view, modify, or delete their own data.
2. **Edge Functions**:
   - `functions/ai-organize/`: Proxies tab grouping queries to LLMs without exposing provider secret keys in client-side extension code.
   - `functions/page-summary/`: Extracts executive summaries and key bullet points from safe page snippets.

## Deployment Instructions

### 1. Database Setup
1. Create a Supabase project at [https://supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run `migrations/20261013000000_tabpilot_schema.sql`.

### 2. Edge Functions Deployment
Using the Supabase CLI:
```bash
# Set OpenAI or AI provider key in Supabase secrets
supabase secrets set OPENAI_API_KEY=your_key_here

# Deploy edge functions
supabase functions deploy ai-organize
supabase functions deploy page-summary
```

### 3. Extension Configuration
In the TabPilot extension Settings:
- Enter your Supabase Project URL and Anon Public Key.
- Enable Cloud Sync.
- If using the Edge Function AI endpoint, set `VITE_AI_ENDPOINT` or configure the proxy endpoint in settings.
