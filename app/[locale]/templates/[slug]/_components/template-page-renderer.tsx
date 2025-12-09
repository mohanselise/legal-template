import React from "react";
import { TemplatePageBlocks, TemplatePageBlock } from "@/lib/template-page-blocks";
import {
  HeroBlock,
  FeatureGridBlock,
  StatsBlock,
  StepsBlock,
  TestimonialsBlock,
  FAQBlock,
  RichTextBlock,
  CTABlock,
  MediaBlock,
} from "./block-components";

type TemplatePageRendererProps = {
  blocks: TemplatePageBlocks;
};

const blockRendererMap: Record<TemplatePageBlock["type"], (block: any) => React.ReactElement | null> = {
  hero: (block) => <HeroBlock {...block} />,
  featureGrid: (block) => <FeatureGridBlock {...block} />,
  stats: (block) => <StatsBlock {...block} />,
  steps: (block) => <StepsBlock {...block} />,
  testimonials: (block) => <TestimonialsBlock {...block} />,
  faq: (block) => <FAQBlock {...block} />,
  richText: (block) => <RichTextBlock {...block} />,
  cta: (block) => <CTABlock {...block} />,
  media: (block) => <MediaBlock {...block} />,
};

export function TemplatePageRenderer({ blocks }: TemplatePageRendererProps) {
  if (!blocks.length) {
    return null;
  }

  return (
    <div className="bg-[hsl(var(--bg))] text-foreground">
      {blocks.map((block, index) => {
        const render = blockRendererMap[block.type];
        if (!render) return null;
        return <div key={`${block.type}-${index}`}>{render(block)}</div>;
      })}
    </div>
  );
}

