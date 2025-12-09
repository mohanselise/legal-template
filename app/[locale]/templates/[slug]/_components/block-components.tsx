import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemplatePageBlock } from "@/lib/template-page-blocks";
import { LucideIcon, Sparkles, CheckCircle2, ArrowRight, Quote } from "lucide-react";
import Image from "next/image";

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Quote,
};

function resolveIcon(icon?: string): LucideIcon | null {
  if (!icon) return null;
  return iconMap[icon] ?? null;
}

type MediaRef = { src: string; alt?: string; overlay?: string };

function MediaBackground({
  media,
  className,
  priority,
}: {
  media?: MediaRef;
  className?: string;
  priority?: boolean;
}) {
  if (!media) return null;
  return (
    <div className={`absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <Image
        src={media.src}
        alt={media.alt || ""}
        fill
        className="object-cover"
        priority={priority}
      />
      {media.overlay ? <div className={media.overlay} /> : null}
    </div>
  );
}

// Default media assets per section (mirrors homepage look)
const defaults = {
  hero: {
    background: { src: "/graphics/whole-page-bg.webp", alt: "Gradient backdrop" },
    texture: { src: "/graphics/bg-black-texture.webp", alt: "Texture overlay", overlay: "opacity-60 mix-blend-overlay" },
    side: { src: "/graphics/image-2.webp", alt: "Hero illustration" },
  },
  featureGrid: {
    background: { src: "/graphics/whole-page-bg.webp", alt: "Gradient backdrop", overlay: "opacity-30" },
  },
  stats: {
    texture: { src: "/graphics/black-spin-bg.webp", alt: "Spin texture", overlay: "opacity-30 mix-blend-overlay" },
  },
  steps: {
    background: { src: "/graphics/2nd-bg.webp", alt: "Secondary gradient", overlay: "opacity-40" },
  },
  testimonials: {
    texture: { src: "/graphics/bg-black-texture.webp", alt: "Texture overlay", overlay: "opacity-20 mix-blend-overlay" },
  },
  faq: {
    background: { src: "/graphics/whole-page-bg.webp", alt: "Gradient backdrop", overlay: "opacity-25" },
  },
  richText: {
    texture: { src: "/graphics/black-spin-bg.webp", alt: "Subtle spin texture", overlay: "opacity-25 mix-blend-overlay" },
  },
  cta: {
    background: { src: "/graphics/mountain-bg-overlayed.jpg", alt: "Mountain overlay backdrop" },
    texture: { src: "/graphics/bg-black-texture.webp", alt: "Texture overlay", overlay: "opacity-30 mix-blend-overlay" },
  },
  media: {
    texture: { src: "/graphics/bg-black-texture.webp", alt: "Texture overlay", overlay: "opacity-30 mix-blend-overlay" },
  },
};

const withFallback = (media?: MediaRef, fallback?: MediaRef) => media || fallback;

type HeroBlockProps = Extract<TemplatePageBlock, { type: "hero" }>;
export function HeroBlock(block: HeroBlockProps) {
  const backgroundImage = withFallback(block.backgroundImage, defaults.hero.background);
  const textureImage = withFallback(block.textureImage, defaults.hero.texture);
  const sideImage = withFallback(block.sideImage, defaults.hero.side);
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--gradient-dark-from))] via-[hsl(var(--selise-blue))] to-[hsl(var(--gradient-dark-to))] text-[hsl(var(--white))]">
      <MediaBackground media={backgroundImage} priority />
      <MediaBackground media={textureImage} className="mix-blend-overlay opacity-60" priority />
      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[hsl(var(--sky-blue))]/20 blur-3xl" />
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[hsl(var(--light-blue))]/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 lg:px-8 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          {block.eyebrow ? (
            <Badge className="bg-[hsl(var(--white))]/15 text-[hsl(var(--white))] border-[hsl(var(--white))]/30 backdrop-blur-sm font-subheading uppercase tracking-[0.12em]" variant="outline">
              {block.eyebrow}
            </Badge>
          ) : null}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-heading">
            {block.title}
          </h1>
          {block.subtitle ? (
            <p className="text-lg sm:text-xl text-[hsl(var(--white))]/85 leading-relaxed">
              {block.subtitle}
            </p>
          ) : null}

          {block.bullets?.length ? (
            <ul className="mt-4 grid gap-3 text-left sm:grid-cols-2">
              {block.bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2 text-[hsl(var(--white))]/85">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/15">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                  </div>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {(block.primaryCta || block.secondaryCta) && (
            <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-start">
              {block.primaryCta ? (
                <Button asChild size="lg" className="group bg-[hsl(var(--white))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--white))]/90 shadow-2xl h-auto px-8 py-4 text-lg">
                  <Link href={block.primaryCta.href}>
                    {block.primaryCta.label}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : null}
              {block.secondaryCta ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-[hsl(var(--white))]/70 text-[hsl(var(--white))] hover:bg-[hsl(var(--white))]/10 h-auto px-8 py-4 text-lg"
                >
                  <Link href={block.secondaryCta.href}>{block.secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>

        {(block.sideImage || block.imageUrl) ? (
          <div className="relative flex-1">
            <div className="relative mx-auto h-full max-w-2xl overflow-hidden rounded-3xl bg-[hsl(var(--white))]/5 p-3 shadow-2xl ring-1 ring-[hsl(var(--white))]/15 backdrop-blur">
              <Image
                src={(block.sideImage?.src || block.imageUrl || sideImage?.src)!}
                alt={block.sideImage?.alt || block.imageAlt || sideImage?.alt || ""}
                width={1200}
                height={900}
                className="h-full w-full rounded-2xl object-cover"
              />
              {block.sideImage?.overlay ? <div className={block.sideImage.overlay} /> : sideImage?.overlay ? <div className={sideImage.overlay} /> : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

type FeatureGridProps = Extract<TemplatePageBlock, { type: "featureGrid" }>;
export function FeatureGridBlock(block: FeatureGridProps) {
  const backgroundImage = withFallback(block.backgroundImage, defaults.featureGrid.background);
  const textureImage = block.textureImage; // optional
  const columns = block.columns ?? 3;
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--bg))] py-16 sm:py-24">
      <MediaBackground media={backgroundImage} />
      <MediaBackground media={textureImage} className="mix-blend-overlay opacity-50" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          {block.title ? (
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-heading">{block.title}</h2>
          ) : null}
          {block.description ? (
            <p className="text-lg text-muted-foreground">{block.description}</p>
          ) : null}
        </div>
        <div
          className={`mt-10 grid gap-6 sm:gap-8 ${columns === 4 ? "lg:grid-cols-4" : columns === 2 ? "md:grid-cols-2" : "lg:grid-cols-3"}`}
        >
          {block.features.map((feature) => {
            const Icon = resolveIcon(feature.icon);
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                    {Icon ? <Icon className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    {feature.description ? (
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type StatsBlockProps = Extract<TemplatePageBlock, { type: "stats" }>;
export function StatsBlock(block: StatsBlockProps) {
  const backgroundImage = block.backgroundImage;
  const textureImage = withFallback(block.textureImage, defaults.stats.texture);
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--bg))] py-16 sm:py-20">
      <MediaBackground media={backgroundImage} />
      <MediaBackground media={textureImage} className="mix-blend-overlay opacity-50" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          {block.title ? <h2 className="text-3xl font-bold font-heading">{block.title}</h2> : null}
          {block.description ? (
            <p className="text-lg text-muted-foreground">{block.description}</p>
          ) : null}
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {block.items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center shadow-sm"
            >
              <div className="text-3xl font-bold text-[hsl(var(--selise-blue))]">{item.value}</div>
              <div className="mt-2 text-base font-semibold text-foreground">{item.label}</div>
              {item.subtext ? <div className="mt-1 text-sm text-muted-foreground">{item.subtext}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type StepsBlockProps = Extract<TemplatePageBlock, { type: "steps" }>;
export function StepsBlock(block: StepsBlockProps) {
  const backgroundImage = withFallback(block.backgroundImage, defaults.steps.background);
  const textureImage = block.textureImage;
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--gradient-light-from))] py-16 sm:py-24">
      <MediaBackground media={backgroundImage} />
      <MediaBackground media={textureImage} className="mix-blend-overlay opacity-40" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          {block.title ? <h2 className="text-3xl font-bold font-heading">{block.title}</h2> : null}
          {block.description ? <p className="text-lg text-muted-foreground">{block.description}</p> : null}
        </div>
        <div className="mt-10 space-y-6">
          {block.items.map((step, idx) => {
            const Icon = resolveIcon(step.icon);
            return (
              <div
                key={step.title}
                className="flex items-start gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] font-semibold">
                  {Icon ? <Icon className="h-5 w-5" /> : idx + 1}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  {step.description ? <p className="text-sm text-muted-foreground">{step.description}</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type TestimonialsBlockProps = Extract<TemplatePageBlock, { type: "testimonials" }>;
export function TestimonialsBlock(block: TestimonialsBlockProps) {
  const backgroundImage = block.backgroundImage;
  const textureImage = withFallback(block.textureImage, defaults.testimonials.texture);
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--bg))] py-16 sm:py-24">
      <MediaBackground media={backgroundImage} />
      <MediaBackground media={textureImage} className="mix-blend-overlay opacity-40" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          {block.title ? <h2 className="text-3xl font-bold font-heading">{block.title}</h2> : null}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {block.items.map((item, idx) => (
            <figure
              key={`${item.name}-${idx}`}
              className="relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm"
            >
              <Quote className="absolute right-6 top-6 h-6 w-6 text-[hsl(var(--selise-blue))]/30" />
              <blockquote className="text-base text-foreground leading-relaxed">{item.quote}</blockquote>
              <figcaption className="mt-4 flex items-center gap-3 text-sm font-semibold text-foreground">
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item.name}
                    className="h-10 w-10 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <div>
                  <div>{item.name}</div>
                  {item.role ? <div className="text-muted-foreground font-normal">{item.role}</div> : null}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

type FAQBlockProps = Extract<TemplatePageBlock, { type: "faq" }>;
export function FAQBlock(block: FAQBlockProps) {
  const backgroundImage = withFallback(block.backgroundImage, defaults.faq.background);
  const textureImage = block.textureImage;
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--bg))] py-16 sm:py-24">
      <MediaBackground media={backgroundImage} />
      <MediaBackground media={textureImage} className="mix-blend-overlay opacity-40" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        {block.title ? <h2 className="text-3xl font-bold font-heading text-center">{block.title}</h2> : null}
        <div className="space-y-4">
          {block.items.map((item, idx) => (
            <details
              key={`${item.question}-${idx}`}
              className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-foreground">
                {item.question}
                <span className="text-[hsl(var(--selise-blue))] group-open:rotate-90 transition-transform">›</span>
              </summary>
              <p className="pt-3 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

type RichTextBlockProps = Extract<TemplatePageBlock, { type: "richText" }>;
export function RichTextBlock(block: RichTextBlockProps) {
  const backgroundImage = block.backgroundImage;
  const textureImage = withFallback(block.textureImage, defaults.richText.texture);
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--bg))] py-12 sm:py-16">
      <MediaBackground media={backgroundImage} />
      <MediaBackground media={textureImage} className="mix-blend-overlay opacity-40" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-4">
        {block.title ? <h2 className="text-2xl font-bold font-heading">{block.title}</h2> : null}
        <div className="space-y-4 text-base leading-relaxed text-foreground">
          {block.body.map((paragraph, idx) => (
            <p key={idx} className="text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

type CTABlockProps = Extract<TemplatePageBlock, { type: "cta" }>;
export function CTABlock(block: CTABlockProps) {
  const backgroundImage = withFallback(block.backgroundImage, defaults.cta.background);
  const textureImage = withFallback(block.textureImage, defaults.cta.texture);
  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      <MediaBackground media={backgroundImage} />
      <MediaBackground media={textureImage} className="mix-blend-overlay opacity-50" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[hsl(var(--gradient-mid-from))] to-[hsl(var(--gradient-mid-to))] text-[hsl(var(--white))] shadow-xl relative">
          <div className="absolute inset-0 opacity-20 bg-[url('/graphics/bg-black-texture.webp')] bg-cover mix-blend-overlay" />
          <div className="relative px-8 py-10 sm:px-10 sm:py-14 space-y-4 text-center">
            <h2 className="text-3xl font-bold font-heading">{block.title}</h2>
            {block.description ? (
              <p className="text-lg text-[hsl(var(--white))]/85">{block.description}</p>
            ) : null}
            <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button asChild size="lg" className="bg-[hsl(var(--white))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--white))]/90 h-auto px-8 py-4 text-lg">
                <Link href={block.primaryCta.href}>{block.primaryCta.label}</Link>
              </Button>
              {block.secondaryCta ? (
                <Button asChild size="lg" variant="outline" className="border-[hsl(var(--white))]/70 text-[hsl(var(--white))] hover:bg-[hsl(var(--white))]/10 h-auto px-8 py-4 text-lg">
                  <Link href={block.secondaryCta.href}>{block.secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type MediaBlockProps = Extract<TemplatePageBlock, { type: "media" }>;
export function MediaBlock(block: MediaBlockProps) {
  const backgroundImage = block.backgroundImage;
  const textureImage = withFallback(block.textureImage, defaults.media.texture);
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--bg))] py-14 sm:py-18">
      <MediaBackground media={backgroundImage} />
      <MediaBackground media={textureImage} className="mix-blend-overlay opacity-40" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        {block.title ? <h3 className="text-2xl font-bold font-heading text-foreground">{block.title}</h3> : null}
        {block.description ? <p className="text-muted-foreground">{block.description}</p> : null}
        <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] shadow-sm">
          <img
            src={block.imageUrl}
            alt={block.imageAlt}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

