import { Link } from "@/i18n/routing";
import { stripLocalePrefix } from "@/lib/utils/strip-locale-prefix";

export function RichTextWithLinks({ text }: { text: string }) {
  // Parse [label](href) markdown link pattern
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const [, label, href] = match;
          // Strip locale prefix if present (next-intl Link will add it automatically)
          const cleanHref = stripLocalePrefix(href);
          return (
            <Link 
              key={i} 
              href={cleanHref} 
              className="text-[hsl(var(--selise-blue))] hover:underline font-medium"
            >
              {label}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
