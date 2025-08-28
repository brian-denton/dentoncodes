## DentonCodes — AI‑Powered Single‑Page Site

An animated, single‑page Next.js site that generates all on‑page copy locally via your LLM runtime. It’s styled with Tailwind CSS v4 and shadcn/ui, with light/dark theming and tasteful motion.

Content is created fresh on every page load and centers on short, cinematic “AI doomsday” micro‑stories (PG‑13, no gore). The site works with LM Studio or Ollama running on your machine.

### Features
- Unique content: Fresh hero title/subtitle and a short story each load
- Local LLMs: Works with LM Studio or Ollama (auto‑retry on bad JSON)
- Modern UI: shadcn/ui components, subtle gradients, blur, and fades
- Theming: Light/dark mode with no flash of incorrect theme
- Type‑safe: Strict TypeScript and linting

### Requirements
- Node.js 18+ and pnpm (recommended)
- One of:
  - LM Studio (default) with a chat model loaded
  - Ollama with a compatible chat model pulled (e.g., `llama3.1:8b-instruct`)

### Quick Start
1) Copy envs and configure a provider:
   - `cp .env.example .env.local`
   - Edit `.env.local` to set `AI_PROVIDER` and model variables
2) Start your LLM runtime:
   - LM Studio: start the server (default `http://localhost:1234`) and load a model
   - Ollama: `ollama pull llama3.1:8b-instruct && ollama run llama3.1:8b-instruct`
3) Run the app:
   - `pnpm dev` → http://localhost:3000

### Environment Variables
See `.env.example` for all options.
- `AI_PROVIDER`: `lmstudio` | `ollama` | `auto` (default: `lmstudio`)
- `AI_MODEL`: Optional generic model id; takes precedence if set
- `LMSTUDIO_BASE_URL`: Default `http://localhost:1234`
- `LMSTUDIO_MODEL`: Default `qwen2.5:3b-instruct`
- `OLLAMA_BASE_URL`: Default `http://localhost:11434`
- `OLLAMA_MODEL`: Default `llama3.1:8b-instruct`

### How It Works
- Frontend (`app/page.tsx`) fetches content on mount from `POST /api/content`.
- API (`app/api/content/route.ts`) sends a system+user prompt to your local LLM and expects strict JSON:
  - `{ heroTitle, heroSubtitle, story }`
- The API validates and extracts JSON (even if wrapped in extra text) and retries up to 3 times when invalid.
- UI renders skeletons while loading and fades in the result.

### Key Files
- app/page.tsx:1 — Client UI that fetches and renders generated content
- app/api/content/route.ts:1 — Provider‑aware content generator with retries
- app/globals.css:1 — Tailwind v4 + custom aurora background and grid overlay
- components/ui/* — shadcn/ui atoms (Button, Card, Input, etc.)
- components/mode-toggle.tsx:1 — Light/dark theme toggle

### Customization
- Prompts: Edit the system/user strings in `app/api/content/route.ts` to change tone, length, or structure.
- Provider/model: Adjust `.env.local` to switch between LM Studio and Ollama or to set a different model id.
- Styling: Tweak `app/globals.css` gradients/animations and classes in `app/page.tsx`.

### Scripts
- `pnpm dev` — Run in development (Turbopack)
- `pnpm build` — Production build
- `pnpm start` — Run the production server
- `pnpm lint` — Lint the project

### Notes
- Content prompts enforce PG‑13 tone and return JSON only; the API includes a JSON extraction fallback and retry loop.
- By default, the app assumes a local LLM. For remote deployments, point the base URL envs at your hosted endpoints.
