# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application for legal templates, built with React 19, TypeScript, and Tailwind CSS v4. The project uses the App Router architecture (not Pages Router) with file-based routing in the `app/` directory.

## Tech Stack

- **Framework**: Next.js 16.0.10 (App Router)
- **React**: 19.2.3
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS v4 with PostCSS
- **Package Manager**: pnpm (note: `pnpm-lock.yaml` is present)
- **Database**: Neon Postgres with Prisma ORM
- **Authentication**: Clerk with role-based access control
- **Internationalization**: next-intl with SELISE Blocks UILM integration
- **Fonts**: Aptos (primary), Bahnschrift (secondary), Open Sans (body) - loaded from `/public/fonts/`

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

# Database commands
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema changes to database
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed database with initial data
pnpm db:studio      # Open Prisma Studio GUI

# Testing commands (signature workflow)
pnpm test:upload    # Test file upload
pnpm test:prepare   # Test contract preparation
pnpm test:rollout   # Test rollout flow
```

## Project Structure

```
app/
├── [locale]/                    # Internationalized routes (en, de)
│   ├── (public)/               # Public pages (home, about, faq, templates)
│   ├── (auth)/                 # Auth pages (sign-in, sign-up)
│   ├── admin/                  # Admin dashboard (protected)
│   │   ├── templates/          # Template management
│   │   ├── analytics/          # Usage analytics
│   │   ├── settings/           # System settings
│   │   └── users/              # User management
│   └── templates/              # Template generation flows
│       └── employment-agreement/
│           └── generate/       # Smart Flow wizard
├── api/                        # API routes
│   ├── ai/                     # AI endpoints (suggest, enrich, generate)
│   ├── intelligence/           # Data enrichment (company, job-title)
│   ├── places/                 # Geolocation (autocomplete, reverse-geocode)
│   ├── signature/              # SELISE Signature integration
│   ├── admin/                  # Admin CRUD APIs
│   └── turnstile/              # Cloudflare Turnstile validation
├── layout.tsx                  # Root layout with fonts and providers
└── globals.css                 # Global styles and Tailwind directives

components/
├── ui/                         # shadcn/ui components (26+)
├── smart-flow/                 # Form wizard components
├── admin/                      # Admin dashboard components
└── pdf-signature-editor.tsx    # PDF signature field editor

lib/
├── auth/                       # Clerk auth helpers and role definitions
├── card-engine/                # Drag-and-drop card system
├── prisma.ts                   # Prisma client singleton
├── openrouter.ts               # AI provider integration
└── uilm-loader.ts              # SELISE Blocks translation loader

prisma/
├── schema.prisma               # Database schema
└── seed.ts                     # Seed data

messages/                       # i18n translation files
├── en.json                     # English translations
└── de.json                     # German translations

public/
├── fonts/                      # Brand fonts (Aptos, Bahnschrift)
└── images/                     # Static assets
```

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
- Dark mode support via `next-themes` (uses `dark:` prefix)
- Custom CSS variables for brand fonts: `--font-aptos`, `--font-bahnschrift`, `--font-open-sans`

### ESLint Configuration
- Uses modern ESLint flat config format (`eslint.config.mjs`)
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignores `.next/`, `out/`, `build/`, and `next-env.d.ts`

## Important Conventions

1. **Always use pnpm** for package management (not npm or yarn)
2. **Server Components by default** - only add `'use client'` when using hooks, event handlers, or browser APIs
3. **Import paths** - prefer using the `@/*` alias for imports from the root
4. **Image optimization** - use Next.js `<Image>` component from `next/image` for all images

## Authentication (Clerk)

This project uses Clerk for authentication with role-based access control.

### Roles

Two roles are defined in `lib/auth/roles.ts`:
- **admin**: Full access to all admin features
- **editor**: Limited access to template and analytics management

### Route Permissions

```typescript
// Admin-only routes
'/admin'
'/admin/settings'
'/admin/users'

// Admin & Editor routes
'/admin/templates'
'/admin/analytics'
```

### Usage

```typescript
// Server Component - check role
import { checkRole } from '@/lib/auth/roles'

export default async function AdminPage() {
  if (!await checkRole('admin')) {
    redirect('/unauthorized')
  }
  // ...
}

// API Route - check access
import { checkApiRouteAccess } from '@/lib/auth/roles'

export async function GET() {
  const access = await checkApiRouteAccess('/admin/users')
  if (!access.allowed) {
    return new Response('Unauthorized', { status: 403 })
  }
  // ...
}
```

### Environment Variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## Internationalization (next-intl + UILM)

The app supports English (`en`) and German (`de`) with locale-prefixed routes (e.g., `/en/templates`, `/de/templates`).

### Configuration

- **Routing**: Locale is always shown in URL (`localePrefix: 'always'`)
- **Default locale**: English (`en`)
- **Translation files**: `messages/en.json`, `messages/de.json`

### SELISE Blocks UILM Integration

German translations are fetched from SELISE Blocks API with fallback to local files:

```typescript
// lib/uilm-loader.ts
// Fetches from https://api.seliseblocks.com with X-BLOCKS-KEY header
// Falls back to local JSON if API fails
// Deep merges with English as base language
```

### Usage

```typescript
// Server Component
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  const t = await getTranslations('home')
  return <h1>{t('title')}</h1>
}

// Client Component
'use client'
import { useTranslations } from 'next-intl'

export function Component() {
  const t = useTranslations('common')
  return <button>{t('submit')}</button>
}
```

### Translation Modules

- `common` - Shared UI strings
- `home` - Home page
- `templates` - Template listing
- `employmentAgreement` - EA-specific terms
- `footer`, `faq`, `about`, `tips`, `miniMap`

### Environment Variables

```bash
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=your-project-key
```

## Analytics & Bot Prevention

### Microsoft Clarity

Session recording and heatmaps via `@microsoft/clarity`:

```bash
NEXT_PUBLIC_CLARITY_PROJECT_ID=your-clarity-id
```

### Google Analytics

Via `@next/third-parties`:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Cloudflare Turnstile

Bot prevention captcha via `next-turnstile`:

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key
```

Validation endpoint: `/api/turnstile/validate`

## Brand Guidelines (SELISE Brand Book)

Source: SELISE Brand Book.pdf (Official brand guidelines)

### Brand Philosophy & Mission

**Mission**: Simplify IT Delivery
- Streamline and enhance the way IT solutions are delivered
- Remove complexity, optimize efficiency, ensure seamless digital transformation

**Vision**: Become the first choice in our unit categories
- Establish SELISE as the go-to partner in every category of business we operate in
- Lead the industry by delivering innovative digital solutions that set new benchmarks

**Who We Are**: A global IT delivery organization specializing in design, implementation, and operation of advanced technology solutions. We follow the DIO (Design, Implement, Operate) approach.

### Brand Values

Our values shape everything we do:
- **Respectful**: Fostering a culture of trust and collaboration
- **Integrous**: Uphold honesty and transparency in all actions
- **Humble**: Always learning and growing
- **Pragmatic**: Focusing on practical, effective solutions
- **Persevering**: Pushing through challenges with resilience and determination
- **Empowering**: Enabling people and clients to succeed and innovate

### Voice & Tone

- Professional yet approachable; avoid legalese unless required by jurisdictional precision
- Prefer short sentences, active voice, and plain-English explanations
- Be precise about obligations, dates, and defined terms; include helpful tooltips where needed
- Maintain trustworthy, clear, efficient, and accessible communication

### Typography System

SELISE uses a structured typographic hierarchy. Update font imports in `app/layout.tsx` and CSS custom properties in `app/globals.css` accordingly.

**Primary Typeface**: Aptos
- Usage: Headlines, primary headings, and high-impact text
- Available in regular and bold weights
- Web, Print, and Base usage

**Secondary Typeface**: Bahnschrift
- Usage: Subheadings, supporting text, sections requiring compact, strong presence
- Slide deck headlines should use Bahnschrift

**Default/Body Typeface**: Open Sans
- Usage: Body text, standard content, general readability
- Provides clean, neutral appearance that pairs well with primary and secondary typefaces
- Slide deck body text uses Open Sans

**Logo Typeface**: Eras and Eras Demi
- Usage: SELISE logo only to maintain brand identity
- Do not use for general text

**Current Implementation**: Brand fonts are loaded from `/public/fonts/`
- Aptos (regular & bold) - Primary typeface
- Bahnschrift - Secondary typeface
- CSS variables: `--font-aptos`, `--font-bahnschrift`, `--font-open-sans`

### Color System

Use CSS variables as design tokens. **Do not hardcode hex values in components.** Stick to blues, greys, blacks, whites, and occasionally greens.

**Primary Brand Colors**:

```css
:root {
  /* SELISE Primary Colors */
  --selise-blue: 206 100% 35%;        /* #0066B2 - Primary brand color */
  --globe-grey: 0 0% 48%;             /* #7B7C7F - Secondary/muted */
  --oxford-blue: 204 100% 11%;        /* #001F35 - Dark accent */
  --white: 0 0% 100%;                 /* #FFFFFF - Light text/backgrounds */
  --eerie-black: 180 9% 12%;          /* #1B2021 - Primary text (dark) */

  /* Extended Brand Palette */
  --sky-blue: 206 95% 57%;            /* #247EC1 - Light blue variant */
  --light-blue: 207 87% 70%;          /* #6BAEEE - Lighter blue for highlights */

  /* Highlight Colors (use sparingly) */
  --mauveine: 281 79% 35%;            /* #791E94 - Purple for infographics */
  --poly-green: 93 46% 19%;           /* #2A4D14 - Dark green for text/info */
  --lavender: 289 52% 62%;            /* #BC63D7 - Light purple for infographics */
  --lime-green: 99 44% 54%;           /* #7BC950 - Green for positive outcomes */
  --crimson: 346 97% 52%;             /* #D80032 - Red for warnings */
  --pantone-red: 354 85% 57%;         /* #EF233C - Bright red for negative headers */

  /* UI Surface Tokens */
  --bg: 0 0% 100%;                    /* White background */
  --fg: 180 9% 12%;                   /* Eerie black text */
  --card: 0 0% 100%;
  --card-foreground: 180 9% 12%;
  --popover: 0 0% 100%;
  --popover-foreground: 180 9% 12%;

  /* UI States */
  --border: 0 0% 90%;                 /* Light grey */
  --input: 0 0% 90%;
  --ring: var(--selise-blue);
  --success: 99 44% 54%;              /* Lime green */
  --warning: 38 92% 50%;
  --destructive: 354 85% 57%;         /* Pantone red */

  /* Gradients - Light */
  --gradient-light-from: 0 0% 98%;    /* #F9F9F9 */
  --gradient-light-to: 0 0% 93%;      /* #EDEDED */

  /* Gradients - Mid (Sky Blue) */
  --gradient-mid-from: 206 100% 68%;  /* #5BAEFF */
  --gradient-mid-to: 206 100% 39%;    /* #0073C6 */

  /* Gradients - Dark (Deep Blue) */
  --gradient-dark-from: 204 100% 32%; /* #0067A3 */
  --gradient-dark-to: 211 100% 22%;   /* #002D72 */
}

.dark {
  --bg: 180 9% 12%;                   /* Eerie black */
  --fg: 0 0% 100%;                    /* White text */
  --card: 180 9% 12%;
  --card-foreground: 0 0% 100%;
  --popover: 180 9% 12%;
  --popover-foreground: 0 0% 100%;
  --border: 0 0% 20%;
  --input: 0 0% 20%;
}
```

**Color Usage Guidelines**:
- **Primary**: SELISE Blue (#0066B2) - Dominates backgrounds, large sections, key branding
- **Secondary**: Globe Grey (#7B7C7F) - Supports in subheadings, graphics, secondary buttons
- **Accent**: Use highlight colors sparingly for CTAs, key details, important elements
- **Text**: Eerie Black (#1B2021) for dark text, White (#FFFFFF) for light text
- **Consistency**: Maintain proper contrast ratios for WCAG AA accessibility
- **Prohibited**: Do not use bright colors beyond brand palette (avoid non-brand reds, purples, yellows, oranges)

**Color Ratios**:
- 3-color palette: 6:3:1 (Primary:Secondary:Accent)
- 4-color palette: 5:2.5:1.5:1 (Primary:Secondary:Tertiary:Accent)

**Usage with Tailwind**:
```tsx
// Backgrounds
<div className="bg-[hsl(var(--selise-blue))]">
<div className="bg-[hsl(var(--bg))]">

// Text
<p className="text-[hsl(var(--fg))]">
<h1 className="text-[hsl(var(--selise-blue))]">

// Borders
<div className="border-[hsl(var(--border))]">

// Gradients
<div className="bg-gradient-to-r from-[hsl(var(--gradient-mid-from))] to-[hsl(var(--gradient-mid-to))]">
```

### Logo Guidelines

**Primary Logo**: The SELISE primary logo features a distinctive icon paired with clean, modern typography using Eras and Eras Demi fonts.

**Minimum Sizes**:
- Primary logo: 90px width (≈1.25 inches) minimum
- Secondary/icon logo: 50px width (≈0.28 inches) minimum

**Clear Space**: Maintain adequate clear space around the logo (equal to the x-height of the logotype)

**Positioning**:
- Preferred: Top left or top right of branded materials
- Alternative: Bottom of materials
- Prohibited: Odd positions outside these guidelines

**Logo Variations**:
- Light backgrounds: Use dark logo (blue or black version)
- Dark backgrounds: Use white logo version
- Color backgrounds: Ensure sufficient contrast; use semi-transparent overlay if needed

**Do's**:
- Use on clean, uncluttered backgrounds
- Display in original proportions without distortion
- Use approved color variations (black, white, or primary blue)
- Place prominently where easily recognized

**Don'ts**:
- Do not place on low-contrast or busy backgrounds
- Do not alter colors beyond approved palette
- Do not stretch, skew, or resize disproportionately
- Do not apply effects (shadows, gradients, outlines)
- Do not use alongside unapproved colors or clashing graphics
- Do not place on colorful or patterned backgrounds

### Iconography

**Sources**: Use icons only from:
- **Flaticons**: For UI icons (copy/paste into designs)
- **unDraw.co**: For illustrations (download and insert)
- **lucide-react**: For React components in web applications

**Style Guidelines**:
- Use outlined or flat-style icons for uniformity
- Do not mix icon styles (outline with filled or 3D)
- Outlined icons: Simple black or white for clean, modern look
- White icons on blue: For dark/gradient blue backgrounds
- Black icons on light: Thin outlined for white/light backgrounds

**Color Matching**:
- Recolor icons to match SELISE brand palette (blue tones or grayscale)
- Do not distort, stretch, or add shadow/glow effects
- Keep icon sizes in `em` where possible for better scaling

**Placement**:
- Maintain consistent sizing and spacing
- Align properly with accompanying text (vertically and horizontally)
- Use icons to enhance content, not distract from it

### Layout & Spacing

- Use Tailwind spacing scale; 4px baseline (Tailwind `1` = 0.25rem)
- Constrain main reading width to ~680–780px for long-form template content
- Maintain visual hierarchy with consistent spacing between elements

### Accessibility

- Maintain WCAG AA color contrast for text over backgrounds (minimum 4.5:1 for normal text, 3:1 for large text)
- Always label inputs and controls; use `aria-*` attributes where necessary
- Provide footnotes/explanations for defined terms via tooltips or collapsible details
- Ensure proper contrast between text and background for readability
- Test designs in various formats to ensure adaptability and quality

### Background Images & Photography

**Where to Use**:
- Corporate presentations, web & digital platforms, marketing materials, event branding
- Should be high-quality, relevant, aligned with brand color tone
- Integrate with appropriate opacity to maintain content readability

**Do's**:
- Use sharp, well-lit, properly exposed images
- Align imagery with brand message and target audience
- Use consistent styling across materials

**Don'ts**:
- Avoid generic stock images lacking authenticity
- Do not use low-resolution or poorly lit images
- Avoid excessive editing or filters that distort natural look
- Do not use overly complex or distracting designs
- Avoid images with no connection to SELISE brand narrative

### Brand Elements & Applications

**Co-branding**:
- When collaborating with partners, place client/partner logo before SELISE logo
- Maintain equal visual weight and spacing between logos
- Use neutral backgrounds and consistent typography
- Ensure all co-branded materials are pre-approved

**Stationery**: Business cards, notebooks, pens should follow brand guidelines

**Social Media**:
- Use SELISE primary colors for backgrounds, text overlays, icons
- Ensure visual alignment with brand tone and message
- Balance promotional content with value-driven posts

**Social Media Aspect Ratios**:
- Instagram Posts: 1:1 (1080x1080)
- Instagram Stories/Reels: 9:16 (vertical)
- Facebook & LinkedIn Posts: 1.91:1 or 1:1
- Company logo: 400x400
- Company cover: 646x220

**Slide Decks**:
- Use Circle Office Theme for Spring/Summer presentations
- Use Mountain Theme for Fall/Winter presentations
- Headline: Bahnschrift
- Subtitle/key message: Bahnschrift
- Body text: Open Sans (in slides) or Aptos (general)
- Stick to blues, greys, blacks, whites, and occasionally greens only

### Implementation Notes

- Logo assets and brand elements should be placed in `public/` directory
- Keep SVG sources and exports under version control
- Update font imports in `app/layout.tsx` to use Aptos (primary), Bahnschrift (secondary), and Open Sans (body)
- Define all color tokens in `app/globals.css` using the CSS variables above
- Always consume colors through Tailwind utilities, never hardcode hex values

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

## Database (Neon Postgres + Prisma)

### Setup

- **ORM**: Prisma with `@prisma/adapter-neon` for serverless
- **Schema**: `prisma/schema.prisma`
- **Config**: `prisma.config.ts` for build-time generation

### Environment Variables

```bash
DATABASE_URL=postgresql://...?sslmode=require        # Pooled connection
DATABASE_URL_UNPOOLED=postgresql://...?sslmode=require  # Direct connection (migrations)
```

### Usage

```typescript
// lib/prisma.ts - singleton client
import { PrismaClient } from '@/prisma/generated/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Usage in Server Components/Route Handlers
import { prisma } from '@/lib/prisma'

const templates = await prisma.template.findMany({
  include: { screens: { include: { fields: true } } }
})
```

### Data Model

**Core Models:**

```prisma
model Template {
  id              String           @id @default(cuid())
  name            String
  slug            String           @unique
  description     String?
  uilmTitleKey    String?          // SELISE Blocks translation key
  uilmDescKey     String?
  screens         TemplateScreen[]
  pages           TemplatePage[]
  isActive        Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model TemplateScreen {
  id                  String          @id @default(cuid())
  templateId          String
  template            Template        @relation(...)
  title               String
  description         String?
  screenType          ScreenType      @default(standard)
  order               Int
  fields              TemplateField[]
  conditions          Json?           // Conditional visibility rules
  aiPrompt            String?         // AI generation prompt
  signatoriesConfig   Json?           // For signatory screens
}

model TemplateField {
  id                String         @id @default(cuid())
  screenId          String
  screen            TemplateScreen @relation(...)
  name              String
  label             String
  fieldType         FieldType
  placeholder       String?
  helpText          String?
  required          Boolean        @default(false)
  order             Int
  options           Json?          // For select/radio fields
  validation        Json?          // Validation rules
  conditions        Json?          // Show/hide conditions
  aiSuggestionKey   String?        // Key for AI suggestions
}

enum FieldType {
  text, textarea, email, phone, date, number, select,
  radio, checkbox, address, party, currency, percentage, url
}

enum ScreenType {
  standard, signatory, dynamic
}
```

**Supporting Models:**

```prisma
model SystemSettings {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  updatedAt DateTime @updatedAt
}

model ApiUsageLog {
  id            String   @id @default(cuid())
  endpoint      String
  model         String
  inputTokens   Int
  outputTokens  Int
  cost          Float
  createdAt     DateTime @default(now())
}

model ModelPricing {
  id            String   @id @default(cuid())
  modelId       String   @unique
  inputCostPer1M  Float
  outputCostPer1M Float
  updatedAt     DateTime @updatedAt
}

model TemplatePage {
  id          String    @id @default(cuid())
  templateId  String
  template    Template  @relation(...)
  slug        String
  title       String
  blocks      Json      // Content blocks (hero, features, etc.)
  isActive    Boolean   @default(true)
}
```

### Commands

```bash
pnpm db:generate    # Generate Prisma client after schema changes
pnpm db:push        # Push schema to database (dev)
pnpm db:migrate     # Run migrations (production)
pnpm db:studio      # Open Prisma Studio GUI
pnpm db:seed        # Seed initial data
```

## SELISE Signature Integration

This application integrates with SELISE Signature API for electronic document signing. The integration includes a full-page PDF signature field editor similar to DocuSign.

### Environment Variables

Required environment variables in `.env.local`:
- `SELISE_CLIENT_ID` - Client ID from SELISE Developer Portal
- `SELISE_CLIENT_SECRET` - Client secret from SELISE Developer Portal

### API Endpoints

**Base URLs:**
- Production: `https://selise.app/api`
- Staging: `https://app.selisestage.com/api`

**Service Versions (Production):**
- Identity Service: `/identity/v100`
- Signature Service: `/selisign/s1`
- Storage Service: `/storageservice/v100`

### Signature Workflow

1. **Prepare Contract** (`/api/signature/prepare`)
   - Generates PDF from document data
   - Uploads to SELISE Storage
   - Creates signature workflow with signatories
   - Returns `documentId`, `fileId`, `trackingId`

2. **Position Signature Fields** (Full-page editor)
   - User navigates to `/templates/employment-agreement/generate/review/signature-editor`
   - PDF loaded from storage via `/api/signature/get-pdf`
   - Interactive editor allows drag-and-drop field placement
   - Supports 3 field types: signature, text (name), date
   - Multi-signatory support with color-coded fields

3. **Rollout Contract** (`/api/signature/rollout`)
   - Accepts custom signature field positions from editor
   - Falls back to default positions if none provided
   - Sends invitation emails to all signatories
   - Returns rollout status and events

### Signature Field Editor

**Component:** `PDFSignatureEditor` ([components/pdf-signature-editor.tsx](components/pdf-signature-editor.tsx))

Features:
- PDF rendering using `react-pdf` library
- Click to add fields, drag to reposition
- Page navigation and zoom controls (50%-200%)
- Field types: Signature (180x60px), Text (180x30px), Date (120x25px)
- Color-coded fields per signatory (SELISE Blue, Poly Green, Mauveine)
- Reset to default positions
- Real-time field count display

**Field Positioning:**
- Coordinates are in PDF points (72 DPI)
- Page numbers are 1-indexed in UI, converted to 0-indexed for API
- Default positions place fields on last page

### API Integration Notes

**Storage Service:**
- Upload requires 2-step process: Get pre-signed URL, then PUT file
- Download requires: Get pre-signed URL with `Verb: 'GET'`, then fetch file
- All storage operations require Bearer token authentication

**Signature Service:**
- Token obtained via client credentials flow (`grant_type: client_credentials`)
- Tokens expire in 420 seconds (7 minutes)
- All requests require `Authorization: Bearer {token}` header
- Document events can be polled via `/SeliSign/ExternalApp/GetEvents`

**Events:**
- `preparation_success` - Contract prepared successfully
- `rollout_success` / `rollout_failed` - Rollout status
- `signatory_signed_success` - Signatory completed signing
- `document_completed` - All signatures collected
- `document_cancelled` / `document_declined` - Workflow terminated

### File Structure

```
app/
├── api/
│   └── signature/
│       ├── prepare/route.ts          # Prepare contract workflow
│       ├── rollout/route.ts          # Rollout with field positions
│       ├── get-pdf/route.ts          # Fetch PDF from storage
│       └── upload-pdf/route.ts       # Background PDF upload
├── templates/
│   └── employment-agreement/
│       └── generate/
│           └── review/
│               ├── page.tsx                    # Review page with loading states
│               └── signature-editor/
│                   └── page.tsx                # Full-page signature editor
components/
├── pdf-signature-editor.tsx                    # Main PDF editor component
├── signature-field-editor-dialog.tsx           # Dialog wrapper (deprecated)
└── signature-dialog.tsx                        # Signatory input form
```

### Dependencies

- `react-pdf` v10.2.0 - PDF rendering
- `pdfjs-dist` v5.4.394 - PDF.js worker
- PDF.js worker loaded from CDN: `unpkg.com/pdfjs-dist@{version}/build/pdf.worker.min.mjs`

### Usage Example

```typescript
// Prepare contract
const response = await fetch('/api/signature/prepare', {
  method: 'POST',
  body: JSON.stringify({
    document, formData, signatories, fileId, accessToken
  })
});
const { documentId, fileId, trackingId } = await response.json();

// Navigate to editor
router.push(`/signature-editor?data=${encodeURIComponent(JSON.stringify(preparedData))}`);

// Rollout with custom fields
await fetch('/api/signature/rollout', {
  method: 'POST',
  body: JSON.stringify({
    documentId, fileId, signatories,
    signatureFields: [
      { type: 'signature', signatoryIndex: 0, pageNumber: 1, x: 100, y: 500, width: 180, height: 60 }
    ]
  })
});
```

## API Routes Overview

The application exposes 40+ API routes organized by domain:

### AI & Intelligence

| Route | Purpose |
|-------|---------|
| `/api/ai/suggest` | Field value suggestions |
| `/api/ai/enrich-context` | Context enrichment for forms |
| `/api/ai/template-configurator` | AI-powered template config |
| `/api/ai/next-question` | Dynamic question generation |
| `/api/ai/generate-dynamic-fields` | Generate fields based on context |
| `/api/ai/job-responsibilities` | Job title intelligence |
| `/api/intelligence/company` | Company data lookup |
| `/api/intelligence/job-title` | Job title standardization |
| `/api/intelligence/market-standards` | Market data for compensation |

### Places & Geolocation

| Route | Purpose |
|-------|---------|
| `/api/places/autocomplete` | Address autocomplete |
| `/api/places/business-search` | Business name lookup |
| `/api/places/details` | Place details by ID |
| `/api/places/reverse-geocode` | Coordinates to address |

### Admin CRUD

| Route | Purpose |
|-------|---------|
| `/api/admin/templates` | Template management |
| `/api/admin/screens` | Screen management |
| `/api/admin/fields` | Field management |
| `/api/admin/settings` | System settings |
| `/api/admin/users` | User management |
| `/api/admin/analytics` | Usage analytics |
| `/api/admin/models` | AI model configuration |
| `/api/admin/template-pages` | Landing page content |

### Documents & Signature

| Route | Purpose |
|-------|---------|
| `/api/documents/generate-pdf` | PDF generation |
| `/api/signature/prepare` | Prepare contract |
| `/api/signature/rollout` | Send for signature |
| `/api/signature/get-pdf` | Fetch PDF from storage |
| `/api/signature/send` | Send invitations |
| `/api/letterhead/detect-content-area` | Letterhead detection |

### Other

| Route | Purpose |
|-------|---------|
| `/api/turnstile/validate` | Cloudflare captcha validation |
| `/api/suggestions` | Generic suggestions endpoint |

## Key Dependencies

### Core Framework
- `next` 16.0.10 - React framework
- `react` / `react-dom` 19.2.3 - UI library
- `typescript` 5.x - Type safety

### Database & Auth
- `@prisma/client` + `@prisma/adapter-neon` - ORM with Neon adapter
- `@neondatabase/serverless` - Serverless Postgres client
- `@clerk/nextjs` - Authentication

### UI & Styling
- `tailwindcss` v4 - Utility CSS
- `@radix-ui/*` - Headless UI primitives (via shadcn/ui)
- `class-variance-authority` - Component variants
- `tailwind-merge` - Utility merging
- `lucide-react` - Icons
- `framer-motion` - Animations
- `sonner` - Toast notifications
- `next-themes` - Dark mode

### Forms & Validation
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Validation resolvers
- `zod` - Schema validation

### Document Generation
- `react-pdf` + `pdfjs-dist` - PDF viewing
- `@react-pdf/renderer` - Server-side PDF generation
- `jspdf` + `jspdf-autotable` - Client-side PDF
- `docx` - Word document generation
- `html2canvas` - HTML to image

### Drag & Drop
- `@dnd-kit/core` + `@dnd-kit/sortable` - Drag and drop

### Analytics & Security
- `@microsoft/clarity` - Session recording
- `@next/third-parties` - Google Analytics
- `next-turnstile` - Cloudflare captcha

### Internationalization
- `next-intl` - i18n framework

### Utilities
- `date-fns` - Date formatting
- `uuid` - ID generation
- `use-debounce` - Debouncing
- `jsonrepair` - JSON repair
- `canvas-confetti` - Celebration animations
- `recharts` - Data visualization

## Environment Variables

Complete list of required environment variables:

```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Internationalization (SELISE Blocks UILM)
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=your-project-key

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_CLARITY_PROJECT_ID=your-clarity-id

# Bot Prevention (Cloudflare Turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key

# SELISE Signature
SELISE_CLIENT_ID=your-client-id
SELISE_CLIENT_SECRET=your-client-secret

# AI Provider (OpenRouter)
OPENROUTER_API_KEY=your-api-key

# Google Places (for address autocomplete)
GOOGLE_PLACES_API_KEY=your-api-key
```
