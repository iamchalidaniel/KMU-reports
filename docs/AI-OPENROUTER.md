# AI with Open Router

The app uses [Open Router](https://openrouter.ai) for all AI features (help assistant, case summarization). You can use any model supported by Open Router (e.g. GPT-4o-mini, Gemini, Claude).

## Setup

1. Get an API key at [Open Router Keys](https://openrouter.ai/keys).
2. In the **frontend** project, create or edit `.env.local`:

   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

3. Optional: set a specific model (default is `openai/gpt-4o-mini`):

   ```env
   OPENROUTER_MODEL=openai/gpt-4o-mini
   ```

   Other examples: `google/gemini-2.0-flash-001`, `anthropic/claude-3-haiku`.

## Where it’s used

- **Help page** (`/help`) and **AI Assistant** component: chat-style help and form guidance.
- **AI summarization**: security dashboard, secretary dashboard, dean dashboards – “AI Insight” / “Analyze cases” buttons that summarize incident descriptions.

## Environment reference

See `frontend/env.example` for all optional frontend env vars, including `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`.
