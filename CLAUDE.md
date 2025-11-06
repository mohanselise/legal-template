# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application for legal templates, built with React 19, TypeScript, and Tailwind CSS v4. The project uses the App Router architecture (not Pages Router) with file-based routing in the `app/` directory.

## Tech Stack

- **Framework**: Next.js 16.0.1 (App Router)
- **React**: 19.2.0
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS v4 with PostCSS
- **Package Manager**: pnpm (note: `pnpm-lock.yaml` is present)
- **Fonts**: Geist Sans and Geist Mono via next/font

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## Project Structure

- `app/` - Next.js App Router directory containing routes and layouts
  - `layout.tsx` - Root layout with font configuration and metadata
  - `page.tsx` - Home page component
  - `globals.css` - Global styles and Tailwind directives
- `public/` - Static assets (SVG icons, images)
- `next.config.ts` - Next.js configuration (TypeScript)
- `tsconfig.json` - TypeScript configuration with `@/*` path alias mapping to root

## Key Architecture Notes

### TypeScript Configuration
- Uses `@/*` import alias mapping to the root directory (e.g., `@/app/component`)
- Strict mode is enabled
- Target: ES2017 with ESNext modules
- JSX mode: `react-jsx` (new JSX transform)

### Next.js App Router
- This project uses the App Router (not Pages Router)
- Routes are defined by folder structure in `app/` directory
- Server Components by default (use `'use client'` directive when needed)
- Layouts cascade through the folder structure

### Styling with Tailwind v4
- Tailwind CSS v4 is configured via PostCSS plugin `@tailwindcss/postcss`
- Dark mode support is included (uses `dark:` prefix)
- Custom CSS variables for Geist fonts: `--font-geist-sans`, `--font-geist-mono`

### ESLint Configuration
- Uses modern ESLint flat config format (`eslint.config.mjs`)
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignores `.next/`, `out/`, `build/`, and `next-env.d.ts`

## Important Conventions

1. **Always use pnpm** for package management (not npm or yarn)
2. **Server Components by default** - only add `'use client'` when using hooks, event handlers, or browser APIs
3. **Import paths** - prefer using the `@/*` alias for imports from the root
4. **Image optimization** - use Next.js `<Image>` component from `next/image` for all images

## Brand Guidelines (Draft)

Status: Pending final brand book. This section encodes working guidance so we can build consistently now and swap in final tokens/assets later without refactors.

### Brand essence
- Product: Legal template generation platform
- Promise: High‑quality, plain‑English legal templates you can trust, tailored quickly
- Principles: Trustworthy, clear, efficient, and accessible

### Voice & tone
- Professional yet approachable; avoid legalese unless required by jurisdictional precision
- Prefer short sentences, active voice, and plain-English explanations and notes
- Be precise about obligations, dates, and defined terms; include helpful tooltips where needed

### Typography
- Current default: Geist Sans (UI, body) and Geist Mono (code/inline variables) via `next/font`
- If the brand book specifies different families, update font imports in `app/layout.tsx` and the CSS custom properties `--font-geist-sans`, `--font-geist-mono` in `app/globals.css`
- Type scale: Use Tailwind’s defaults; do not hardcode font sizes—prefer semantic styles via shadcn/ui primitives

### Color system
Use CSS variables as design tokens and consume them through Tailwind utility classes. Do not hardcode hex values in components.

Suggested token names (replace the HSL values with those from the brand book):

```css
:root {
  /* Brand */
  --brand-primary: 222 89% 52%;   /* hsl */
  --brand-primary-foreground: 210 40% 98%;
  --brand-secondary: 262 83% 58%;
  --brand-muted: 215 16% 47%;

  /* Surface */
  --bg: 0 0% 100%;
  --fg: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  /* UI States */
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: var(--brand-primary);
  --success: 142 72% 29%;
  --warning: 38 92% 50%;
  --destructive: 0 84% 60%;
}

.dark {
  --bg: 224 71% 4%;
  --fg: 213 31% 91%;
  --card: 224 71% 4%;
  --card-foreground: 213 31% 91%;
  --popover: 224 71% 4%;
  --popover-foreground: 213 31% 91%;
  --border: 216 34% 17%;
  --input: 216 34% 17%;
}
```

Usage with Tailwind utilities:
- Backgrounds: `bg-[hsl(var(--bg))]`, `bg-[hsl(var(--brand-primary))]`
- Text: `text-[hsl(var(--fg))]`, `text-[hsl(var(--brand-primary-foreground))]`
- Borders: `border-[hsl(var(--border))]`

### Logo & iconography
- Keep clear space equal to the x-height of the logotype around the logo
- Do not alter aspect ratio or recolor the primary mark outside approved palettes
- Favicon and app icons live in `public/`; keep SVG sources and exports under version control

### Layout & spacing
- Use Tailwind spacing scale; 4px baseline (Tailwind `1` = 0.25rem)
- Constrain main reading width to ~680–780px for long-form template content

### Accessibility
- Maintain WCAG AA color contrast for text over backgrounds
- Always label inputs and controls; use `aria-*` where necessary
- Provide footnotes/explanations for defined terms via tooltips or collapsible details

> TODO when the brand book is available: replace token values, confirm typography families, and attach logo usage artboards/specs.

## UI System: shadcn/ui + Tailwind v4

This project uses Tailwind v4 and is set up for shadcn/ui component generation. The `components.json` file at the repo root configures the generator.

Guidelines
- Prefer shadcn/ui primitives (Button, Input, Dialog, Sheet, DropdownMenu, Toast, Tooltip, Form) before writing bespoke components
- Theme components via CSS variables above; do not edit generated component source to change colors
- Extend components using `class-variance-authority (cva)` variants instead of one-off class strings
- Use `lucide-react` icons; keep icon sizes in `em` where possible for better scaling

Setup & usage (developer commands to run locally)

```bash
# Initialize (if needed – components.json already exists here)
pnpm dlx shadcn@latest init

# Add common components
pnpm dlx shadcn@latest add button input textarea label select checkbox switch
pnpm dlx shadcn@latest add form dialog dropdown-menu sheet tooltip toast skeleton

# Add typography & utility components when needed
pnpm dlx shadcn@latest add badge separator tabs accordion alert card
```

Conventions
- Keep all generated components in `components/` (default per shadcn)
- Prefer Server Components; mark files with `'use client'` only when using hooks or browser APIs
- Co-locate lightweight example stories as MDX under `app/(docs)/components` if/when docs are added

## Next.js MCP server (Model Context Protocol)

Goal: expose safe tools the AI can call to read/write legal templates, list clauses, resolve placeholders, and render outputs—without exposing secrets.

Recommended approach
- Use `@modelcontextprotocol/sdk` to implement a server that exposes tools like `listTemplates`, `getTemplate`, `generateTemplate`, `renderTemplate`, and `saveTemplate`
- Transport options:
  - API Route: `app/api/mcp/route.ts` (HTTP/WebSocket)
  - CLI/stdio for local development (useful when pairing with Claude Code)
- Keep all DB access on the server; authenticate calls where appropriate

Example tool contracts (shapes)
- listTemplates(input: { q?: string, limit?: number }): { items: Array<{ id: string; title: string; tags: string[] }> }
- getTemplate(input: { id: string }): { id: string; title: string; body: string; variables: Array<{ name: string; type: string; required: boolean }> }
- generateTemplate(input: { templateId: string; values: Record<string, string> }): { document: string; warnings?: string[] }
- saveTemplate(input: { title: string; body: string; tags?: string[] }): { id: string }

Local development commands (run as needed)

```bash
pnpm add -D @modelcontextprotocol/sdk
# Optionally install types for any transport or runtime helpers you use
```

Folder suggestion
- `mcp/servers/legal-templates.ts` – tool definitions
- `app/api/mcp/route.ts` – HTTP/WebSocket transport endpoint (if exposing over HTTP)

Security & guardrails
- Never echo secrets; read env vars server-side only
- Enforce input validation for tool calls; reject overly broad queries
- Log audit events for create/update operations

## Database & environments (Neon Postgres)

- Environment variables are defined in `.env.local` (local only; do not commit) and should be set in your deployment environment
- Required keys: `DATABASE_URL` (pooled) and, when needed, `DATABASE_URL_UNPOOLED` for long-running operations
- Recommended client: `@neondatabase/serverless` for simple SQL in App Router Server Components and Route Handlers

Example usage pattern

```ts
// server-only file
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL!)

export async function getTemplateTitles() {
  return await sql/*sql*/`select id, title from templates order by updated_at desc limit 50`;
}
```

Runtime notes
- Prefer Node.js runtime for DB-heavy routes; use Edge only when you don’t need Postgres connections
- Add indexes for frequent lookups (e.g., `templates(title, updated_at)`, `clauses(tags)`)
- Plan to add migrations (Drizzle or Prisma) in a follow-up; until then, keep DDL scripts under `./db/migrations/`

## Product data model (suggested, non-binding)

- templates: id, title, body, variables_json, tags, created_at, updated_at
- clauses: id, title, body, tags, created_at, updated_at
- render_jobs: id, template_id, input_json, output, status, created_at, completed_at
- audit_events: id, actor, action, entity, entity_id, created_at, meta_json

These will be finalized alongside the MCP tool contracts and migrations.
