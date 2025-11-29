// Force dynamic rendering for all pages in this directory
export const dynamic = 'force-dynamic';

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

