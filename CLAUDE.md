# CLAUDE.md

## Project Overview

Next.js 16 legal templates app with React 19, TypeScript, Tailwind v4, Prisma + Neon Postgres, Clerk auth, and next-intl i18n.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Prisma Studio
```

## Project Structure

```
app/[locale]/           # Internationalized routes (en, de)
  (public)/             # Public pages
  (auth)/               # Sign-in/up
  admin/                # Protected dashboard (templates, analytics, settings, users)
  templates/            # Template generation flows
app/api/                # API routes (ai/, intelligence/, places/, signature/, admin/)
components/ui/          # shadcn/ui components
lib/auth/               # Clerk helpers + role definitions
lib/prisma.ts           # Prisma client singleton
prisma/schema.prisma    # Database schema
messages/{en,de}.json   # Translations
```

## Key Conventions

1. **pnpm only** - not npm or yarn
2. **Server Components by default** - `'use client'` only when needed
3. **Import alias** - use `@/*` for imports
4. **Colors via CSS vars** - never hardcode hex values (see Brand Colors below)
5. **Icons** - `lucide-react` only, sized in `em`

## Authentication (Clerk)

Two roles in `lib/auth/roles.ts`:
- **admin** - full access
- **editor** - templates + analytics only

```typescript
import { checkRole } from '@/lib/auth/roles'
if (!await checkRole('admin')) redirect('/unauthorized')
```

## Internationalization

- Locales: `en` (default), `de`
- Routes always prefixed: `/en/...`, `/de/...`
- German fetched from SELISE Blocks UILM API, falls back to local JSON

```typescript
// Server Component
const t = await getTranslations('home')

// Client Component
const t = useTranslations('common')
```

## Database

Schema in `prisma/schema.prisma`. Key models:
- `Template` → `TemplateScreen` → `TemplateField`
- `SystemSettings`, `ApiUsageLog`, `ModelPricing`, `TemplatePage`

Field types: `text`, `textarea`, `email`, `phone`, `date`, `number`, `select`, `radio`, `checkbox`, `address`, `party`, `currency`, `percentage`, `url`

## Brand Guidelines

### Colors (CSS Variables)

```css
--selise-blue: 206 100% 35%;    /* #0066B2 - Primary */
--globe-grey: 0 0% 48%;         /* #7B7C7F - Secondary */
--oxford-blue: 204 100% 11%;    /* #001F35 - Dark accent */
--eerie-black: 180 9% 12%;      /* #1B2021 - Text */
--poly-green: 93 46% 19%;       /* #2A4D14 - Success text */
--lime-green: 99 44% 54%;       /* #7BC950 - Success */
--crimson: 346 97% 52%;         /* #D80032 - Error */
```

Usage: `bg-[hsl(var(--selise-blue))]`, `text-[hsl(var(--fg))]`

**Palette rule**: Stick to blues, greys, blacks, whites. Greens sparingly. No bright colors outside brand palette.

### Typography

- **Aptos** - Headlines, primary headings
- **Bahnschrift** - Subheadings, compact text
- **Open Sans** - Body text

Fonts loaded from `/public/fonts/`. CSS vars: `--font-aptos`, `--font-bahnschrift`

### Voice & Tone

- Professional yet approachable
- Short sentences, active voice, plain English
- Precise about obligations and dates
- Avoid legalese unless jurisdictionally required

## SELISE Signature Integration

External API for e-signing. Flow:
1. `POST /api/signature/prepare` - Generate PDF, upload to storage, create workflow
2. User positions fields in PDF editor (`components/pdf-signature-editor.tsx`)
3. `POST /api/signature/rollout` - Send for signature

Tokens expire in 7 minutes. Events: `preparation_success`, `rollout_success`, `signatory_signed_success`, `document_completed`

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# i18n (SELISE Blocks)
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=...

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
NEXT_PUBLIC_CLARITY_PROJECT_ID=...

# Bot Prevention (Turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...

# Signature
SELISE_CLIENT_ID=...
SELISE_CLIENT_SECRET=...

# AI
OPENROUTER_API_KEY=...

# Places
GOOGLE_PLACES_API_KEY=...
```
