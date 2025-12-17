import { Link } from "@/i18n/routing";

export function RichTextWithLinks({ text }: { text: string }) {
  // Parse [label](href) markdown link pattern
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const [, label, href] = match;
          return (
            <Link 
              key={i} 
              href={href} 
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
